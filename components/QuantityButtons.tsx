"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/sanity.types";
import useCartStore from "@/store";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  className?: string;
  borderStyle?: string;
}

export default function QuantityButtons({ product, className, borderStyle }: Props) {
  const { addItem, removeItem, getItemCount } = useCartStore();
  const [updating, setUpdating] = useState(false);
  const itemCount = getItemCount(product._id);
  const reachedStockLimit = product.stock !== undefined && itemCount >= product.stock;

  const update = (direction: "increase" | "decrease") => {
    if (updating) return;
    setUpdating(true);
    if (direction === "increase") addItem(product);
    else removeItem(product._id);
    toast.success(direction === "increase" ? "Cantidad actualizada" : "Cantidad reducida");
    window.setTimeout(() => setUpdating(false), 250);
  };

  return (
    <div className={cn("inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white", borderStyle, className)} role="group" aria-label={`Cantidad de ${product.name ?? "producto"}`}>
      <button type="button" onClick={() => update("decrease")} disabled={updating || itemCount <= 1} aria-label="Disminuir cantidad" className="inline-flex h-11 w-11 items-center justify-center text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
        {updating ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Minus aria-hidden="true" className="h-4 w-4" />}
      </button>
      <output aria-live="polite" className="min-w-11 text-center text-sm font-black text-brand-navy">{itemCount}</output>
      <button type="button" onClick={() => update("increase")} disabled={updating || reachedStockLimit || (product.stock ?? 0) <= 0} aria-label="Aumentar cantidad" className="inline-flex h-11 w-11 items-center justify-center text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300">
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
