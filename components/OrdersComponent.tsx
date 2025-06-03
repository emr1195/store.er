"use client";
import React, { useCallback, useState } from "react";
import { TableBody, TableCell, TableRow } from "./ui/table";
import PriceFormatter from "./PriceFormatter";
import { MY_ORDERS_QUERYResult } from "@/sanity.types";
import OrderDetailsDialog from "./OrderDetailsDialog";
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger,} from "./ui/tooltip";
import { format } from "date-fns";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const OrdersComponent = ({ orders }: { orders: MY_ORDERS_QUERYResult }) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<
    MY_ORDERS_QUERYResult[number] | null
  >(null);

  const handleOrderClick = (order: MY_ORDERS_QUERYResult[number]) => {
    setSelectedOrder(order);
  };
  const router = useRouter();

  const refreshOrders = useCallback(() => {
    router.refresh();
  }, [router]);
  const handleDeleteOrder = async (
    orderId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (
      !confirm(
        "Seguro que deseas eliminar este pedido? ."
      )
    ) {
      return;
    }

    setIsDeleting(orderId);

    try {
      const response = await fetch("/api/delete-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar");
      }

      

      toast.success("Pedido Eliminado");

     
      refreshOrders();
    } catch (error) {
      console.error("Error eliminando la orden:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "La orden no fue eliminada intenta nuevamente."
      );
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      <TableBody>
        <TooltipProvider>
          {orders.map((order) => (
            <Tooltip key={order?.orderNumber}>
              <TooltipTrigger asChild>
                <TableRow
                  className="cursor-pointer hover:bg-gray-100 h-12"
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell className="font-medium">
                    {order.orderNumber?.slice(-10) ?? "N/A"}...
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order?.orderDate &&
                      format(new Date(order.orderDate), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {order.email}
                  </TableCell>
                  <TableCell>
                    <PriceFormatter
                      amount={order?.totalPrice}
                      className="text-black font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    {order?.status && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order?.status.charAt(0).toUpperCase() +
                          order?.status.slice(1)}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    {order?.invoice && (
                      <p className="font-medium line-clamp-1">
                        {order?.invoice ? order?.invoice?.number : "----"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteOrder(order._id, e)}
                      className="ml-2 text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                      disabled={isDeleting === order._id}
                      aria-label="Borrar Orden"
                    >
                      {isDeleting === order._id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash size={18} />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              </TooltipTrigger>
              <TooltipContent className="text-white font-medium">
                <p>Detalles</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </TableBody>
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
};

export default OrdersComponent;
