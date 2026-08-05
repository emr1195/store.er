"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/sanity.types";
import useCartStore from "@/store";
import QuantityButtons from "./QuantityButtons";
import PriceFormatter from "./PriceFormatter";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Props { product: Product; className?: string; }

export default function AddToCartButton({ product, className }: Props) {
  const { addItem, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const itemCount = getItemCount(product._id);
  const outOfStock = (product.stock ?? 0) <= 0;
  useEffect(() => setMounted(true), []);

  const handleAdd = () => {
    if (adding || outOfStock) return;
    setAdding(true);
    addItem(product);
    toast.success("Producto agregado");
    window.setTimeout(() => setAdding(false), 450);
  };

  if (!mounted) return <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />;
  if (itemCount > 0) {
    const discountedPrice = (product.price ?? 0) * (1 - (product.discount ?? 0) / 100);
    return <div className="min-h-12 w-full rounded-xl border border-slate-200 p-2"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">Cantidad</span><QuantityButtons product={product} /></div><div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1"><span className="text-xs font-bold text-brand-navy">Total</span><PriceFormatter amount={discountedPrice * itemCount} /></div></div>;
  }
  return <Button type="button" onClick={handleAdd} disabled={outOfStock || adding} aria-busy={adding} className={cn("min-h-12 w-full rounded-xl bg-brand-blue px-4 font-black text-white shadow-sm hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-brand-blue active:scale-[.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600", className)}>{adding ? <><Loader2 aria-hidden="true" className="animate-spin" /> Agregando…</> : outOfStock ? "Agotado" : <><ShoppingCart aria-hidden="true" /> Agregar al carrito</>}</Button>;
}
