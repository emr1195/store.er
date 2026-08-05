"use client";
import useCartStore from "@/store";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";

const CartIcon = () => {
  const { items } = useCartStore();

  return (
    <Link href="/cart" aria-label="Abrir carrito" className="group relative flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue">
      <ShoppingBag className="h-5 w-5" />
      <span aria-label={`${items.reduce((total, item) => total + item.quantity, 0)} artículos en el carrito`} className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white">
        {items?.length ? items.reduce((total, item) => total + item.quantity, 0) : 0}
      </span>
    </Link>
  );
};

export default CartIcon;
