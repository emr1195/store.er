import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { cancelOrderWithInventory, getOrderForMutation } from "@/lib/orderService";
import { canCustomerCancel, isOrderStatus } from "@/lib/orders";
import { hasAdminRole } from "@/lib/roles";

const requestSchema = z.object({ orderId: z.string().min(1).max(250) });

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });

  const order = await getOrderForMutation(parsed.data.orderId);
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const isAdmin = hasAdminRole(sessionClaims);
  if (order.clerkUserId !== userId && !isAdmin) {
    logger.warn("unauthorized_order_cancel", { orderId: order._id, actorId: userId });
    return NextResponse.json({ error: "No tienes permiso para cancelar este pedido" }, { status: 403 });
  }
  if (!isOrderStatus(order.status) || !canCustomerCancel(order.status)) {
    return NextResponse.json({ error: "El estado del pedido no permite cancelarlo" }, { status: 409 });
  }

  try {
    await cancelOrderWithInventory({
      order,
      actorId: userId,
      reason: isAdmin ? "admin_cancelled" : "customer_cancelled",
    });
    logger.info("order_cancelled", { orderId: order._id, actorId: userId, isAdmin });
    return NextResponse.json({ message: "Pedido cancelado" });
  } catch {
    return NextResponse.json({ error: "El pedido cambió; actualiza e inténtalo otra vez" }, { status: 409 });
  }
}
