import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { logger } from "@/lib/logger";
import {
  cancelOrderWithInventory,
  confirmOrderPayment,
  failOrderAmountMismatch,
  getOrderByPaymentIntent,
  getOrderForMutation,
  isWebhookProcessed,
  recordRefund,
  recordWebhookEvent,
} from "@/lib/orderService";

export async function POST(req: NextRequest) {
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    logger.warn("webhook_signature_invalid");
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  logger.info("webhook_received", { eventId: event.id, eventType: event.type });
  if (await isWebhookProcessed(event.id)) {
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
      await recordWebhookEvent(event);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    if (isConflict(error)) {
      logger.info("webhook_duplicate", { eventId: event.id });
      return NextResponse.json({ received: true, duplicate: true });
    }
    logger.error("webhook_processing_failed", {
      eventId: event.id,
      eventType: event.type,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorCode: getErrorCode(error),
    });
    return NextResponse.json({ error: "No se pudo procesar el evento" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) throw new Error("ORDER_REFERENCE_MISSING");
  const order = await getOrderForMutation(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const paidCents = session.amount_total ?? -1;
  const currency = session.currency?.toLowerCase();
  if (paidCents !== order.totalCents || currency !== order.currency?.toLowerCase()) {
    await failOrderAmountMismatch(event, order);
    logger.error("payment_amount_mismatch", { orderId, expectedCents: order.totalCents, paidCents });
    return;
  }
  if (order.status !== "pending" && order.status !== "payment_pending") {
    await recordWebhookEvent(event, orderId);
    return;
  }

  const invoice = session.invoice ? await stripe.invoices.retrieve(String(session.invoice)) : null;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  await confirmOrderPayment({
    event,
    order,
    sessionId: session.id,
    paymentIntentId: paymentIntentId ?? "unknown",
    customerId: customerId ?? "guest",
    invoice: invoice ? { id: invoice.id, number: invoice.number, hosted_invoice_url: invoice.hosted_invoice_url } : null,
  });
  logger.info("payment_confirmed", { orderId, eventId: event.id, totalCents: paidCents });
}

async function handleSessionCancelled(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) return recordWebhookEvent(event);
  const order = await getOrderForMutation(orderId);
  if (!order || (order.status !== "pending" && order.status !== "payment_pending")) {
    await recordWebhookEvent(event, orderId);
    return;
  }
  await cancelOrderWithInventory({
    order,
    actorId: "stripe",
    reason: event.type === "checkout.session.expired" ? "checkout_expired" : "payment_failed",
    webhookEvent: { id: event.id, type: event.type },
    targetStatus: event.type === "checkout.session.async_payment_failed" ? "payment_failed" : "cancelled",
  });
  logger.info("inventory_reservation_released", { orderId, eventId: event.id });
}

async function handleChargeRefunded(event: Stripe.Event, charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return recordWebhookEvent(event);
  const order = await getOrderByPaymentIntent(paymentIntentId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  const fullRefund = charge.amount_refunded >= charge.amount;
  await recordRefund({ event, order, refundedCents: charge.amount_refunded, fullRefund });
  logger.info("payment_refunded", { orderId: order._id, refundedCents: charge.amount_refunded, fullRefund });
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

function isConflict(error: unknown): boolean {
  return getErrorCode(error) === "23505";
}
