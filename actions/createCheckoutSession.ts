"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import stripe from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  calculatePricing,
  centsToDollars,
  dollarsToCents,
  STORE_CURRENCY,
} from "@/lib/pricing";
import { backendClient } from "@/sanity/lib/backendClient";

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(200),
    quantity: z.number().int().positive().max(100),
  })).min(1).max(50),
  discountCode: z.string().trim().max(50).optional(),
  deliveryMethod: z.enum(["standard"]).default("standard"),
});

export type CheckoutRequest = z.input<typeof checkoutSchema>;

type CatalogProduct = {
  _id: string;
  _rev: string;
  name?: string;
  description?: string;
  sku?: string;
  variant?: string;
  price?: number;
  discount?: number;
  stock?: number;
  taxable?: boolean;
  isActive?: boolean;
};

export async function createCheckoutSession(input: CheckoutRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Debes iniciar sesión para pagar");

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error("El carrito contiene datos inválidos");
  if (parsed.data.discountCode) {
    throw new Error("El código de descuento no es válido o no está disponible");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email) throw new Error("Tu cuenta no tiene un correo válido");

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = [...quantities.keys()];
  const products = await backendClient.fetch<CatalogProduct[]>(
    `*[_type == "product" && _id in $ids]{_id,_rev,name,description,sku,variant,price,discount,stock,taxable,isActive}`,
    { ids: productIds }
  );
  if (products.length !== productIds.length) throw new Error("Uno o más productos ya no existen");

  const productById = new Map(products.map((product) => [product._id, product]));
  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    if (!product || product.isActive === false) throw new Error("Un producto ya no está disponible");
    if (product.price === undefined) throw new Error("Un producto no tiene precio válido");
    if (!Number.isSafeInteger(product.stock) || (product.stock ?? 0) < quantity) {
      throw new Error(`Stock insuficiente para ${product.name ?? "un producto"}`);
    }
  }

  const shippingCents = parseShippingCents();
  const pricing = calculatePricing(
    products.map((product) => ({
      productId: product._id,
      unitPriceCents: dollarsToCents(product.price!),
      quantity: quantities.get(product._id)!,
      discountPercent: product.discount ?? 0,
      taxable: product.taxable !== false,
    })),
    { shippingCents, currency: STORE_CURRENCY }
  );

  const orderUuid = crypto.randomUUID();
  const orderId = `order.${orderUuid}`;
  const now = new Date().toISOString();
  const orderProducts = pricing.lines.map((line) => {
    const product = productById.get(line.productId)!;
    return {
      _key: crypto.randomUUID(),
      product: { _type: "reference", _ref: product._id },
      productId: product._id,
      quantity: line.quantity,
      nameSnapshot: product.name ?? "Producto",
      skuSnapshot: product.sku,
      variantSnapshot: product.variant,
      unitPriceCents: line.unitPriceCents,
      subtotalCents: line.subtotalCents,
      discountCents: line.discountCents,
      itbmsCents: line.itbmsCents,
      totalCents: line.totalCents,
    };
  });

  let reservation = backendClient.transaction().create({
    _id: orderId,
    _type: "order",
    orderNumber: orderUuid,
    clerkUserId: userId,
    customerName: user.fullName || user.firstName || "Cliente",
    email,
    stripeCustomerId: "pending",
    stripePaymentIntentId: "pending",
    products: orderProducts,
    subtotalCents: pricing.subtotalCents,
    discountCents: pricing.discountCents,
    taxBaseCents: pricing.taxBaseCents,
    itbmsCents: pricing.itbmsCents,
    shippingCents: pricing.shippingCents,
    totalCents: pricing.totalCents,
    totalPrice: centsToDollars(pricing.totalCents),
    amountDiscount: centsToDollars(pricing.discountCents),
    currency: pricing.currency,
    status: "pending",
    inventoryReserved: true,
    orderDate: now,
  });

  for (const product of products) {
    const quantity = quantities.get(product._id)!;
    reservation = reservation
      .patch(product._id, (patch) => patch.ifRevisionId(product._rev).dec({ stock: quantity }))
      .create({
        _id: `inventory.${orderUuid}.${product._id.replace(/[^a-zA-Z0-9_-]/g, "_")}.reserve`,
        _type: "inventoryMovement",
        productId: product._id,
        orderId,
        quantity: -quantity,
        reason: "checkout_reserved",
        createdAt: now,
      });
  }

  try {
    await reservation.commit();
  } catch {
    logger.warn("checkout_reservation_failed", { orderId, userId });
    throw new Error("El inventario cambió. Actualiza el carrito e inténtalo nuevamente");
  }

  logger.info("checkout_started", { orderId, userId, totalCents: pricing.totalCents });

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const lineItems = pricing.lines.map((line) => {
      const product = productById.get(line.productId)!;
      return {
        price_data: {
          currency: pricing.currency,
          unit_amount: line.taxBaseCents,
          product_data: {
            name: `${product.name ?? "Producto"} × ${line.quantity}`,
            description: product.description,
            metadata: { productId: product._id },
          },
        },
        quantity: 1,
      };
    });
    if (pricing.itbmsCents > 0) {
      lineItems.push({
        price_data: {
          currency: pricing.currency,
          unit_amount: pricing.itbmsCents,
          product_data: { name: `ITBMS (${process.env.NEXT_PUBLIC_ITBMS_RATE ?? "0.07"})`, description: undefined, metadata: { productId: "tax" } },
        },
        quantity: 1,
      });
    }
    if (pricing.shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: pricing.currency,
          unit_amount: pricing.shippingCents,
          product_data: { name: "Envío", description: undefined, metadata: { productId: "shipping" } },
        },
        quantity: 1,
      });
    }

    const baseUrl = getBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      invoice_creation: { enabled: true },
      customer: customerId,
      customer_email: customerId ? undefined : email,
      client_reference_id: orderId,
      metadata: { orderId, clerkUserId: userId },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart?payment=cancelled`,
      line_items: lineItems,
    });

    await backendClient.patch(orderId).set({
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : customerId ?? "guest",
      status: "payment_pending",
    }).commit();
    logger.info("checkout_session_created", { orderId, sessionId: session.id });
    if (!session.url) throw new Error("Stripe no devolvió una URL de pago");
    return session.url;
  } catch (error) {
    await releaseReservation(orderId, orderUuid, products, quantities);
    logger.error("checkout_session_failed", { orderId });
    throw error instanceof Error ? error : new Error("No se pudo iniciar el pago");
  }
}

async function releaseReservation(
  orderId: string,
  orderUuid: string,
  products: CatalogProduct[],
  quantities: Map<string, number>
) {
  let transaction = backendClient.transaction().patch(orderId, (patch) => patch.set({
    status: "payment_failed",
    inventoryReserved: false,
  }));
  for (const product of products) {
    const quantity = quantities.get(product._id)!;
    transaction = transaction
      .patch(product._id, (patch) => patch.inc({ stock: quantity }))
      .createIfNotExists({
        _id: `inventory.${orderUuid}.${product._id.replace(/[^a-zA-Z0-9_-]/g, "_")}.release`,
        _type: "inventoryMovement",
        productId: product._id,
        orderId,
        quantity,
        reason: "checkout_failed_release",
        createdAt: new Date().toISOString(),
      });
  }
  await transaction.commit();
}

function parseShippingCents(): number {
  const value = Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_CENTS ?? "0");
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("STANDARD_SHIPPING_CENTS no es válido");
  return value;
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!url) throw new Error("NEXT_PUBLIC_BASE_URL no está configurada");
  return url.replace(/\/$/, "");
}
