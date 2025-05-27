import Container from "@/components/Container";
import OrdersComponent from "@/components/OrdersComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyOrders } from "@/sanity/helpers";
import { auth } from "@clerk/nextjs/server";
import { FileX } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const OrdersPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/");
  }

  const orders = await getMyOrders(userId);

  return (
    <div>
      <Container className="py-10">
        {orders?.length ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Lista de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] md:w-auto">
                        Numero de Orden
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Fecha
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Correo
                      </TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Numero de Orden
                      </TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <OrdersComponent orders={orders} />
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <FileX className="h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">
              No tienes ordenes 
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
             Parece que n&apos;o tienes pedidos, vamos de compras.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Buscar Productos</Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default OrdersPage;
