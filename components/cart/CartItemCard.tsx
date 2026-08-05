"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import type { Product } from "@/sanity.types";
import { centsToDollars } from "@/lib/pricing";
import { getProductImageUrl } from "@/lib/productImages";
import ProductImage from "@/components/new/ProductImage";
import PriceFormatter from "@/components/PriceFormatter";
import QuantityButtons from "@/components/QuantityButtons";
import FavoriteButton from "@/components/product/FavoriteButton";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const variantLabels: Record<string, string> = {
  tshirt: "Camisetas", jacket: "Chaquetas", pants: "Pantalones", pin: "Pines",
  short: "Pantalones cortos", others: "Otros", patch: "Parches", cap: "Gorras", mug: "Tazas",
};
const statusLabels: Record<string, string> = { new: "Nuevo", hot: "Destacado", sale: "Oferta" };

interface CartItemCardProps {
  product: Product;
  quantity: number;
  lineSubtotalCents: number;
  lineDiscountCents: number;
  onDelete: (productId: string) => void;
}

export default function CartItemCard({ product, quantity, lineSubtotalCents, lineDiscountCents, onDelete }: CartItemCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const productHref = product.slug?.current ? `/product/${product.slug.current}` : null;
  const productName = product.name ?? "Producto";
  const stockIssue = (product.stock ?? 0) < quantity;
  const statusLabel = product.status ? statusLabels[product.status] : null;

  const removeProduct = () => {
    if (deleting) return;
    setDeleting(true);
    onDelete(product._id);
    setOpen(false);
  };

  const image = (
    <ProductImage
      src={getProductImageUrl(product, 400)}
      alt={`${productName} en el carrito`}
      sizes="(max-width: 639px) 96px, 152px"
      className="h-24 w-24 rounded-xl border border-slate-200 bg-slate-50 sm:h-36 sm:w-36"
      imageClassName="object-contain p-2"
    />
  );

  return (
    <article className="p-4 sm:p-5">
      <div className="flex min-w-0 gap-4 sm:gap-5">
        {productHref ? <Link href={productHref} aria-label={`Ver ${productName}`} className="shrink-0 rounded-xl">{image}</Link> : image}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              {productHref ? <Link href={productHref} className="line-clamp-2 font-black leading-6 text-brand-navy hover:text-brand-blue">{productName}</Link> : <h2 className="line-clamp-2 font-black leading-6 text-brand-navy">{productName}</h2>}
              <p className="mt-1 text-sm font-semibold text-slate-500">{variantLabels[String(product.variant)] ?? "Artículo oficial"}</p>
            </div>
            {statusLabel && <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-brand-blue">{statusLabel}</span>}
          </div>

          <div className="mt-3">
            <p className="text-xs text-slate-500">Precio por unidad</p>
            <PriceFormatter amount={product.price} className="text-base font-black text-brand-ink" />
          </div>
          {stockIssue && <p role="alert" className="mt-2 text-sm font-bold text-brand-red">La cantidad supera el inventario disponible.</p>}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
            <QuantityButtons product={product} />
            <div className="text-right">
              <p className="text-xs text-slate-500">Subtotal</p>
              <PriceFormatter amount={centsToDollars(lineSubtotalCents - lineDiscountCents)} className="text-lg font-black text-brand-navy" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <FavoriteButton productId={product._id} className="h-11 w-11" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" aria-label={`Eliminar ${productName}`} className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-brand-red focus-visible:text-brand-red">
              <Trash2 aria-hidden="true" className="h-5 w-5" /><span className="hidden sm:inline">Eliminar</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogTitle className="text-xl font-black text-brand-navy">Eliminar producto</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">¿Deseas eliminar este producto del carrito?</DialogDescription>
            <DialogFooter className="mt-2 gap-2 sm:space-x-0">
              <DialogClose asChild><button type="button" className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold text-brand-navy hover:bg-slate-50">Cancelar</button></DialogClose>
              <button type="button" onClick={removeProduct} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-5 font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}Eliminar producto
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}
