import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  cancelOrderWithInventory,
  getOrderForMutation,
  webhookEventDocumentId,
} from "@/lib/orderService";
import { backendClient } from "@/sanity/lib/backendClient";

type PaymentOrder = Awaited<ReturnType<typeof getOrderForMutation>> & {
  totalCents?: number;
  currency?: string;
};

export async function POST(req: NextRequest) {
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    logger.warn("webhook_signature_invalid");
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  logger.info("webhook_received", { eventId: event.id, eventType: event.type });
  const eventDocumentId = webhookEventDocumentId(event.id);
  const alreadyProcessed = await backendClient.fetch<string | null>(`*[_id == $id][0]._id`, { id: eventDocumentId });
  if (alreadyProcessed) {
    logger.info("webhook_duplicate", { eventId: event.id });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await handlePaymentSucceeded(event, event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await handleSessionCancelled(event, event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "charge.refunded") {
      await handleChargeRefunded(event, event.data.object as Stripe.Charge);
    } else {
      await recordEvent(event, undefined);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    if (isConflict(error)) {
      logger.info("webhook_duplicate", { eventId: event.id });
      return NextResponse.json({ received: true, duplicate: true });
    }
    logger.error("webhook_processing_failed", { eventId: event.id, eventType: event.type });
    return NextResponse.json({ error: "No se pudo procesar el evento" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) throw new Error("ORDER_REFERENCE_MISSING");

  const order = await backendClient.fetch<PaymentOrder>(
    `*[_type == "order" && _id == $orderId][0]{_id,_rev,clerkUserId,status,inventoryReserved,totalCents,currency,products[]{productId,quantity}}`,
    { orderId }
  );
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const paidCents = session.amount_total ?? -1;
  const currency = session.currency?.toLowerCase();
  const amountMatches = paidCents === order.totalCents && currency === order.currency?.toLowerCase();
  const now = new Date().toISOString();
  const invoice = session.invoice ? await stripe.invoices.retrieve(String(session.invoice)) : null;
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  let transaction = backendClient.transaction().create({
    _id: webhookEventDocumentId(event.id),
    _type: "webhookEvent",
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    orderId,
    processedAt: now,
  });

  if (!amountMatches) {
    transaction = transaction
      .patch(orderId, (patch) => patch.ifRevisionId(order._rev).set({ status: "payment_failed" }))
      .create({
        _id: `audit.${crypto.randomUUID()}`,
        _type: "orderAudit",
        orderId,
        actorId: "stripe",
        action: "payment_amount_mismatch",
        previousStatus: order.status,
        newStatus: "payment_failed",
        createdAt: now,
      });
    await transaction.commit();
    logger.error("payment_amount_mismatch", { orderId, expectedCents: order.totalCents, paidCents });
    return;
  }

  if (order.status !== "pending" && order.status !== "payment_pending") {
    await recordEvent(event, orderId);
    return;
  }

  transaction = transaction
    .patch(orderId, (patch) => patch.ifRevisionId(order._rev).set({
      status: "paid",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId ?? "unknown",
      stripeCustomerId: customerId ?? "guest",
      invoice: invoice ? {
        id: invoice.id,
        number: invoice.number,
        hosted_invoice_url: invoice.hosted_invoice_url,
      } : null,
    }))
    .create({
      _id: `audit.${crypto.randomUUID()}`,
      _type: "orderAudit",
      orderId,
      actorId: "stripe",
      action: "payment_confirmed",
      previousStatus: order.status,
      newStatus: "paid",
      createdAt: now,
    });
  await transaction.commit();
  logger.info("payment_confirmed", { orderId, eventId: event.id, totalCents: paidCents });
}

async function handleSessionCancelled(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) {
    await recordEvent(event, undefined);
    return;
  }
  const order = await getOrderForMutation(orderId);
  if (!order || (order.status !== "pending" && order.status !== "payment_pending")) {
    await recordEvent(event, orderId);
    return;
  }
  await cancelOrderWithInventory({
    order,
    actorId: "stripe",
    reason: event.type === "checkout.session.expired" ? "checkout_expired" : "payment_failed",
    webhookEvent: { id: event.id, type: event.type },
    targetStatus: event.type === "checkout.session.async_payment_failed" ? "payment_failed" : "cancelled",
  });
  logger.info("inventory_released", { orderId, eventId: event.id });
}

async function handleChargeRefunded(event: Stripe.Event, charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) {
    await recordEvent(event, undefined);
    return;
  }
  const order = await backendClient.fetch<PaymentOrder>(
    `*[_type == "order" && stripePaymentIntentId == $paymentIntentId][0]{_id,_rev,clerkUserId,status,inventoryReserved,totalCents,currency,products[]{productId,quantity}}`,
    { paymentIntentId }
  );
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const now = new Date().toISOString();
  const fullRefund = charge.amount_refunded >= charge.amount;
  let transaction = backendClient.transaction()
    .create({
      _id: webhookEventDocumentId(event.id),
      _type: "webhookEvent",
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      orderId: order._id,
      processedAt: now,
    })
    .patch(order._id, (patch) => patch.ifRevisionId(order._rev).set({
      refundedCents: charge.amount_refunded,
      ...(fullRefund ? { status: "refunded", inventoryReserved: false } : {}),
    }));

  if (fullRefund && order.inventoryReserved) {
    for (const item of order.products ?? []) {
      if (!item.productId || !Number.isSafeInteger(item.quantity) || (item.quantity ?? 0) <= 0) continue;
      transaction = transaction
        .patch(item.productId, (patch) => patch.inc({ stock: item.quantity! }))
        .createIfNotExists({
          _id: `inventory.${order._id.replace(/[^a-zA-Z0-9_-]/g, "_")}.${item.productId.replace(/[^a-zA-Z0-9_-]/g, "_")}.refund`,
          _type: "inventoryMovement",
          productId: item.productId,
          orderId: order._id,
          quantity: item.quantity,
          reason: "payment_refunded",
          createdAt: now,
        });
    }
  }
  transaction = transaction.create({
    _id: `audit.${crypto.randomUUID()}`,
    _type: "orderAudit",
    orderId: order._id,
    actorId: "stripe",
    action: fullRefund ? "payment_refunded" : "payment_partially_refunded",
    previousStatus: order.status,
    newStatus: fullRefund ? "refunded" : order.status,
    createdAt: now,
  });
  await transaction.commit();
  logger.info("payment_refunded", { orderId: order._id, refundedCents: charge.amount_refunded, fullRefund });
}

async function recordEvent(event: Stripe.Event, orderId: string | undefined) {
  await backendClient.create({
    _id: webhookEventDocumentId(event.id),
    _type: "webhookEvent",
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    orderId,
    processedAt: new Date().toISOString(),
  });
}

function isConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "statusCode" in error && (error as { statusCode?: number }).statusCode === 409);
}
