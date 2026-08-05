"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/sanity.types";
import useCartStore from "@/store";
import PriceFormatter from "@/components/PriceFormatter";
import FavoriteButton from "./FavoriteButton";

export default function ProductPurchaseActions({ product }: { product: Product }) {
  const { addItem, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const stock = Math.max(0, product.stock ?? 0);
  const cartCount = mounted ? getItemCount(product._id) : 0;
  const remaining = Math.max(0, stock - cartCount);
  const finalPrice = (product.price ?? 0) * (1 - (product.discount ?? 0) / 100);

  useEffect(() => {
    setMounted(true);
  }, [product._id]);

  useEffect(() => {
    if (remaining > 0) setQuantity((current) => Math.min(current, remaining));
  }, [remaining]);

  const handleAdd = () => {
    if (adding || remaining <= 0) return;
    const safeQuantity = Math.min(Math.max(1, Math.floor(quantity)), remaining);
    setAdding(true);
    setMessage("");
    addItem(product, safeQuantity);
    setMessage(safeQuantity === 1 ? "Producto agregado" : `${safeQuantity} productos agregados`);
    toast.success("Producto agregado");
    window.setTimeout(() => setAdding(false), 450);
  };

  const disabled = !mounted || adding || remaining <= 0;
  const buttonText = stock <= 0 ? "Agotado" : remaining <= 0 ? "Máximo disponible en el carrito" : adding ? "Agregando…" : "Agregar al carrito";

  return (
    <div>
      <div className="mb-5">
        <p id="quantity-label" className="mb-2 text-sm font-bold text-brand-navy">Cantidad</p>
        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white" role="group" aria-labelledby="quantity-label">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1 || disabled} aria-label="Disminuir cantidad" className="inline-flex h-11 w-11 items-center justify-center text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"><Minus aria-hidden="true" className="h-4 w-4" /></button>
          <output aria-live="polite" className="min-w-12 text-center font-black text-brand-navy">{quantity}</output>
          <button type="button" onClick={() => setQuantity((value) => Math.min(remaining, value + 1))} disabled={quantity >= remaining || disabled} aria-label="Aumentar cantidad" className="inline-flex h-11 w-11 items-center justify-center text-brand-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"><Plus aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        {cartCount > 0 && <p className="mt-2 text-xs text-slate-500">Ya tienes {cartCount} {cartCount === 1 ? "unidad" : "unidades"} en el carrito.</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleAdd} disabled={disabled} aria-busy={adding} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-base font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 motion-reduce:transition-none">
          {adding ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <ShoppingCart aria-hidden="true" className="h-5 w-5" />}
          {buttonText}
        </button>
        <FavoriteButton productId={product._id} className="h-14 w-14" />
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold text-emerald-700">{message}</p>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(17,29,58,.1)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <PriceFormatter amount={finalPrice} className="shrink-0 text-lg font-black text-brand-navy" />
          <button type="button" onClick={handleAdd} disabled={disabled} aria-busy={adding} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-black text-white disabled:bg-slate-300 disabled:text-slate-600">
            {adding && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
