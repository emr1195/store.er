import { getServerSession } from "@/lib/auth-session";
import { Check, Clock, Home, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import { getSuccessOrder } from "@/lib/neon/commerce";
import stripe from "@/lib/stripe";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const authSession = await getServerSession();
  if (!authSession) redirect("/signin");
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/cart?payment=invalid");

  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);
  const referencedOrderId = stripeSession?.metadata?.orderId || stripeSession?.client_reference_id;
  const order = await getSuccessOrder({ orderId: referencedOrderId ?? undefined, sessionId, userId: authSession.user.id });
  if (!order) redirect("/orders?payment=not-found");

  const paidInOrder = ["paid", "processing", "shipped", "delivered"].includes(order.status ?? "");
  const paidInStripe = Boolean(
    stripeSession
      && stripeSession.payment_status === "paid"
      && stripeSession.amount_total === order.totalCents
      && stripeSession.currency?.toLowerCase() === order.currency?.toLowerCase()
  );
  const paid = paidInOrder || paidInStripe;
  const purchasedItems = (order.products ?? []).flatMap((item) =>
    item.productId && Number.isSafeInteger(item.quantity) && (item.quantity ?? 0) > 0
      ? [{ productId: item.productId, quantity: item.quantity! }]
      : []
  );

  return (
    <div className="py-10 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {paid && purchasedItems.length > 0 && (
        <ClearCartOnSuccess checkoutId={order._id} items={purchasedItems} />
      )}
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-12 max-w-xl w-full text-center">
        <div className={`w-24 h-24 ${paid ? "bg-green-700" : "bg-amber-500"} rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg`}>
          {paid ? <Check className="text-white w-12 h-12" /> : <Clock className="text-white w-12 h-12" />}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {paid ? "¡Compra confirmada!" : "Pago en verificación"}
        </h1>
        <p className="text-gray-700 mb-3">
          {paid
            ? "Recibimos tu pago y comenzaremos a procesar el pedido."
            : "Stripe está confirmando el pago. Revisa el estado del pedido en unos momentos."}
        </p>
        <p className="font-semibold mb-8">Referencia: {order.orderNumber?.slice(-12)}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/" className="flex items-center justify-center px-4 py-3 font-semibold bg-black text-white rounded-lg">
            <Home className="w-5 h-5 mr-2" /> Inicio
          </Link>
          <Link href="/orders" className="flex items-center justify-center px-4 py-3 font-semibold bg-white text-black border border-black rounded-lg">
            <Package className="w-5 h-5 mr-2" /> Pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
