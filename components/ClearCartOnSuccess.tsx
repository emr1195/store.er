"use client";

import { useEffect } from "react";
import useCartStore, { type PurchasedCartItem } from "@/store";

export default function ClearCartOnSuccess({
  checkoutId,
  items,
}: {
  checkoutId: string;
  items: PurchasedCartItem[];
}) {
  const removePurchasedItems = useCartStore((state) => state.removePurchasedItems);

  useEffect(() => {
    removePurchasedItems(checkoutId, items);
  }, [checkoutId, items, removePurchasedItems]);

  return null;
}
