"use client";
import useCartStore from "@/store";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";

const CartIcon = () => {
  const { items } = useCartStore();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" aria-label={`Abrir carrito, ${itemCount} artículos`} className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue">
      <ShoppingBag aria-hidden="true" className="h-5 w-5" />
      <span aria-hidden="true" className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white">
        {itemCount}
      </span>
    </Link>
  );
};

export default CartIcon;
