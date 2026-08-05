import { auth } from "@clerk/nextjs/server";
import { Check, Clock, Home, Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";
import { backendClient } from "@/sanity/lib/backendClient";

type SuccessOrder = { orderNumber?: string; status?: string } | null;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/signin");
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/cart?payment=invalid");

  const order = await backendClient.fetch<SuccessOrder>(
    `*[_type == "order" && stripeCheckoutSessionId == $sessionId && clerkUserId == $userId][0]{orderNumber,status}`,
    { sessionId, userId }
  );
  if (!order) redirect("/orders?payment=not-found");

  const paid = ["paid", "processing", "shipped", "delivered"].includes(order.status ?? "");
  return (
    <div className="py-10 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      {paid && <ClearCartOnSuccess />}
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
