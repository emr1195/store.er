"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import stripe from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  getSafeErrorDetails,
  StockChangedError,
  type CheckoutResult,
  type CheckoutStage,
  type InventoryAvailability,
} from "@/lib/checkout";
import { calculatePricing, centsToDollars, dollarsToCents, STORE_CURRENCY } from "@/lib/pricing";
import { backendClient } from "@/sanity/lib/backendClient";

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(200),
    quantity: z.number().int().positive().max(100),
  })).min(1).max(50),
  discountCode: z.string().trim().max(50).optional(),
  deliveryMethod: z.enum(["standard"]).default("standard"),
  attemptId: z.string().uuid().optional(),
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

type ExistingCheckoutOrder = {
  _id: string;
  clerkUserId?: string;
  status?: string;
  stripeCheckoutSessionId?: string;
};

type ReleasableOrder = {
  _rev: string;
  inventoryReserved?: boolean;
};

export async function createCheckoutSession(input: CheckoutRequest): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const emptyCart = Array.isArray(input?.items) && input.items.length === 0;
    return failure(emptyCart ? "EMPTY_CART" : "INVALID_CART", emptyCart ? "Tu carrito está vacío." : "El carrito contiene datos inválidos.");
  }
  if (parsed.data.discountCode) return failure("INVALID_CART", "El código de descuento no es válido o no está disponible.");

  const { userId } = await auth();
  if (!userId) return failure("UNAUTHORIZED", "Debes iniciar sesión para pagar.");

  const attemptId = parsed.data.attemptId ?? crypto.randomUUID();
  const orderId = `order.${attemptId}`;
  let stage: CheckoutStage = "initializing";

  logger.info("checkout_started", { orderId, userId, stage });

  try {
    stage = "loading_existing_checkout";
    const existing = await getExistingCheckout(orderId);
    if (existing) return reuseExistingCheckout(existing, userId);

    stage = "loading_user";
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!user || !email) return failure("UNAUTHORIZED", "Tu cuenta no tiene un correo válido.");

    stage = "loading_cart";
    const quantities = new Map<string, number>();
    for (const item of parsed.data.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    stage = "validating_cart";
    const productIds = [...quantities.keys()];
    const products = await fetchProducts(productIds);
    if (products.length !== productIds.length) {
      return failure("INVALID_CART", "Uno o más productos ya no existen. Elimínalos del carrito para continuar.");
    }

    const productById = new Map(products.map((product) => [product._id, product]));
    const inventoryConflicts: InventoryAvailability[] = [];
    for (const [productId, quantity] of quantities) {
      const product = productById.get(productId);
      if (!product || product.isActive === false) {
        return failure("INVALID_CART", "Uno de los productos ya no está disponible.");
      }
      if (product.price === undefined || !Number.isFinite(product.price) || product.price < 0) {
        return failure("INVALID_CART", "Uno de los productos no tiene un precio válido.");
      }
      if (product.discount !== undefined && (!Number.isFinite(product.discount) || product.discount < 0 || product.discount > 100)) {
        return failure("INVALID_CART", "Uno de los productos tiene un descuento inválido.");
      }
      stage = "validating_stock";
      const availableQuantity = Number.isSafeInteger(product.stock) ? Math.max(0, product.stock ?? 0) : 0;
      if (availableQuantity < quantity) inventoryConflicts.push({ productId, availableQuantity });
    }
    if (inventoryConflicts.length > 0) throw new StockChangedError(inventoryConflicts);

    logger.info("checkout_stock_validated", { orderId, userId, stage, productCount: products.length });
    stage = "calculating_totals";
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

    stage = "creating_order";
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

    assertSanityWriteTokenConfigured();
    let reservation = backendClient.transaction().create({
      _id: orderId,
      _type: "order",
      orderNumber: attemptId,
      checkoutAttemptId: attemptId,
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
          _id: `inventory.${attemptId}.${safeId(product._id)}.reserve`,
          _type: "inventoryMovement",
          productId: product._id,
          orderId,
          quantity: -quantity,
          reason: "checkout_reserved",
          createdAt: now,
        });
    }

    stage = "reserving_inventory";
    logger.info("checkout_reservation_started", { orderId, userId, stage, productCount: products.length });
    try {
      await reservation.commit();
    } catch (error: unknown) {
      const errorDetails = getSafeErrorDetails(error);
      logger.error("checkout_reservation_failed", { orderId, userId, stage, ...errorDetails });
      if (!isSanityConflict(error)) throw error;
      const concurrentOrder = await getExistingCheckout(orderId);
      if (concurrentOrder) return reuseExistingCheckout(concurrentOrder, userId);
      const inventory = await loadInventoryAvailability(productIds);
      throw new StockChangedError(inventory);
    }

    logger.info("checkout_reservation_succeeded", { orderId, userId, stage, productCount: products.length });
    logger.info("checkout_order_created", { orderId, userId, stage, totalCents: pricing.totalCents });

    let session;
    try {
      stage = "creating_payment_session";
      logger.info("checkout_payment_session_started", { orderId, userId, stage, provider: "stripe" });
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
      session = await stripe.checkout.sessions.create({
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
      }, { idempotencyKey: `checkout:${orderId}` });

      if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");
      logger.info("checkout_payment_session_created", {
        orderId,
        userId,
        stage,
        provider: "stripe",
        paymentSessionId: session.id,
      });
      stage = "updating_order";
      try {
        await backendClient.patch(orderId).set({
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : customerId ?? "guest",
          status: "payment_pending",
        }).commit();
        logger.info("checkout_order_updated", { orderId, userId, stage, provider: "stripe" });
      } catch (error: unknown) {
        logger.error("checkout_order_session_link_failed", {
          orderId,
          userId,
          stage,
          provider: "stripe",
          paymentSessionId: session.id,
          ...getSafeErrorDetails(error),
        });
      }
      stage = "completed";
      logger.info("checkout_completed", { orderId, userId, stage, provider: "stripe" });
      return { success: true, checkoutUrl: session.url, orderId };
    } catch (error: unknown) {
      const failedStage = stage;
      logger.error("checkout_payment_session_failed", {
        orderId,
        userId,
        stage: failedStage,
        provider: "stripe",
        ...getSafeErrorDetails(error),
      });
      try {
        stage = "releasing_inventory";
        await releaseReservation(orderId, attemptId, products, quantities);
      } catch (releaseError: unknown) {
        logger.error("inventory_reservation_release_failed", {
          orderId,
          userId,
          stage,
          ...getSafeErrorDetails(releaseError),
        });
      }
      return failure("PAYMENT_PROVIDER_ERROR", "No pudimos comunicarnos con el proveedor de pago. Inténtalo nuevamente en unos momentos.");
    }
  } catch (error) {
    if (error instanceof StockChangedError) {
      logReservationFailure(orderId, userId, toQuantityMap(parsed.data.items), error.inventory);
      return {
        success: false,
        code: "STOCK_CHANGED",
        message: "La disponibilidad de uno de los productos cambió. Actualizamos el carrito para mostrar el inventario disponible.",
        inventory: error.inventory,
      };
    }
    logger.error("checkout_unexpected_error", {
      orderId,
      userId,
      stage,
      ...getSafeErrorDetails(error),
    });
    return failure("CHECKOUT_FAILED", "No pudimos iniciar el pago. Inténtalo nuevamente en unos momentos.");
  }
}

async function getExistingCheckout(orderId: string): Promise<ExistingCheckoutOrder | null> {
  return backendClient.fetch(
    `*[_type == "order" && _id == $orderId][0]{_id,clerkUserId,status,stripeCheckoutSessionId}`,
    { orderId }
  );
}

async function reuseExistingCheckout(order: ExistingCheckoutOrder, userId: string): Promise<CheckoutResult> {
  if (order.clerkUserId !== userId) return failure("CHECKOUT_FAILED", "No pudimos iniciar el pago.");
  if (order.status === "payment_pending" && order.stripeCheckoutSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      if (session.url && session.status === "open") {
        return { success: true, checkoutUrl: session.url, orderId: order._id };
      }
    } catch {
      logger.warn("checkout_session_reuse_failed", { orderId: order._id });
    }
  }
  if (order.status === "pending" || order.status === "payment_pending") {
    return failure("CHECKOUT_IN_PROGRESS", "Este pago ya se está preparando. Espera unos segundos e inténtalo nuevamente.");
  }
  return failure("CHECKOUT_FAILED", "Este intento de pago ya finalizó. Inicia un nuevo intento.");
}

async function fetchProducts(productIds: string[]): Promise<CatalogProduct[]> {
  return backendClient.fetch(
    `*[_type == "product" && _id in $ids]{_id,_rev,name,description,sku,variant,price,discount,stock,taxable,isActive}`,
    { ids: productIds }
  );
}

async function loadInventoryAvailability(productIds: string[]): Promise<InventoryAvailability[]> {
  const products = await backendClient.fetch<Array<{ _id: string; stock?: number }>>(
    `*[_type == "product" && _id in $ids]{_id,stock}`,
    { ids: productIds }
  );
  const byId = new Map(products.map((product) => [product._id, product.stock]));
  return productIds.map((productId) => ({
    productId,
    availableQuantity: Number.isSafeInteger(byId.get(productId)) ? Math.max(0, byId.get(productId) ?? 0) : 0,
  }));
}

async function releaseReservation(orderId: string, attemptId: string, products: CatalogProduct[], quantities: Map<string, number>) {
  const order = await backendClient.fetch<ReleasableOrder | null>(
    `*[_type == "order" && _id == $orderId][0]{_rev,inventoryReserved}`,
    { orderId }
  );
  if (!order?.inventoryReserved) return;

  const now = new Date().toISOString();
  let transaction = backendClient.transaction().patch(orderId, (patch) => patch.ifRevisionId(order._rev).set({
    status: "payment_failed",
    inventoryReserved: false,
  }));
  for (const product of products) {
    const quantity = quantities.get(product._id)!;
    transaction = transaction
      .patch(product._id, (patch) => patch.inc({ stock: quantity }))
      .create({
        _id: `inventory.${attemptId}.${safeId(product._id)}.release`,
        _type: "inventoryMovement",
        productId: product._id,
        orderId,
        quantity,
        reason: "checkout_failed_release",
        createdAt: now,
      });
  }
  try {
    await transaction.commit();
    logger.info("inventory_reservation_released", { orderId, productCount: products.length });
  } catch (error) {
    const latest = await backendClient.fetch<ReleasableOrder | null>(
      `*[_type == "order" && _id == $orderId][0]{_rev,inventoryReserved}`,
      { orderId }
    );
    if (latest?.inventoryReserved) throw error;
  }
}

function logReservationFailure(orderId: string, userId: string, quantities: Map<string, number>, inventory: InventoryAvailability[]) {
  for (const item of inventory) {
    const requestedQuantity = quantities.get(item.productId) ?? 0;
    if (item.availableQuantity >= requestedQuantity) continue;
    logger.warn("checkout_reservation_failed", {
      orderId,
      userId,
      productId: item.productId,
      requestedQuantity,
      availableQuantity: item.availableQuantity,
    });
  }
}

function toQuantityMap(items: Array<{ productId: string; quantity: number }>): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  return quantities;
}

function failure(code: "EMPTY_CART" | "INVALID_CART" | "UNAUTHORIZED" | "CHECKOUT_IN_PROGRESS" | "PAYMENT_PROVIDER_ERROR" | "CHECKOUT_FAILED", message: string): CheckoutResult {
  return { success: false, code, message };
}

function isSanityConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "statusCode" in error && (error as { statusCode?: number }).statusCode === 409);
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function parseShippingCents(): number {
  const value = Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_CENTS ?? "0");
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("STANDARD_SHIPPING_CENTS no es válido");
  return value;
}

function assertSanityWriteTokenConfigured(): void {
  if (process.env.SANITY_API_TOKEN) return;
  const error = new Error("SANITY_API_TOKEN no está configurado para operaciones de escritura") as Error & { code: string };
  error.name = "CheckoutConfigurationError";
  error.code = "SANITY_WRITE_TOKEN_MISSING";
  throw error;
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!url) throw new Error("NEXT_PUBLIC_BASE_URL no está configurada");
  return url.replace(/\/$/, "");
}
