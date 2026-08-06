"use client";
import useCartStore from "@/store";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";

const CartIcon = () => {
  const { items } = useCartStore();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const itemLabel = itemCount === 1 ? "artículo" : "artículos";

  return (
    <Link href="/cart" aria-label={`Abrir carrito, ${itemCount} ${itemLabel}`} className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue">
      <ShoppingBag aria-hidden="true" className="h-5 w-5" />
      <span aria-hidden="true" className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold leading-none text-white sm:h-5 sm:min-w-5 sm:text-[11px]">
        {itemCount}
      </span>
    </Link>
  );
};

export default CartIcon;
