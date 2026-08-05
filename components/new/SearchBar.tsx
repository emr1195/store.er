"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { Product } from "@/sanity.types";
import { getProductImageUrl, needsFinalProductImage } from "@/lib/productImages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import PriceView from "../PriceView";
import ProductImage from "./ProductImage";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!search.trim()) { setProducts([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/catalog?search=${encodeURIComponent(search.trim())}`);
      if (!response.ok) throw new Error("SEARCH_UNAVAILABLE");
      setProducts(await response.json());
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const timer = window.setTimeout(fetchProducts, 300); return () => window.clearTimeout(timer); }, [fetchProducts]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger aria-label="Buscar productos" className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy transition hover:bg-blue-50 hover:text-brand-blue"><Search className="h-5 w-5" /></DialogTrigger>
      <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col overflow-hidden bg-white p-5 sm:p-6">
        <DialogHeader><DialogTitle className="text-xl font-black text-brand-navy">Buscar productos</DialogTitle></DialogHeader>
        <form className="relative" onSubmit={(event) => event.preventDefault()} role="search">
          <label htmlFor="product-search" className="sr-only">Nombre del producto</label>
          <Input id="product-search" autoFocus placeholder="Escribe el nombre de un producto…" className="h-12 rounded-xl border-slate-300 pr-12 text-base" value={search} onChange={(event) => setSearch(event.target.value)} />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" className="absolute right-1 top-0 flex h-12 w-11 items-center justify-center text-slate-500 hover:text-brand-red"><X className="h-5 w-5" /></button>}
        </form>
        <div className="min-h-40 flex-1 overflow-y-auto rounded-xl border border-slate-200" aria-live="polite">
          {loading ? <div role="status" className="flex items-center justify-center gap-2 py-12 font-bold text-brand-blue"><Loader2 className="h-5 w-5 animate-spin" /> Buscando…</div>
          : products.length ? <ul className="divide-y divide-slate-100">{products.map((product) => {
            const image = getProductImageUrl(product, 240);
            const imagePending = needsFinalProductImage(product);
            return <li key={product._id}><Link href={`/product/${product.slug?.current}`} onClick={() => setOpen(false)} className="flex min-h-24 items-center gap-4 p-3 transition hover:bg-blue-50"><ProductImage src={image} sizes="80px" className="h-20 w-20 shrink-0 rounded-xl" imageClassName="object-contain p-1" alt={imagePending ? `Imagen final pendiente para ${product.name ?? "producto"}` : product.name ?? "Producto"} /><span className="min-w-0 flex-1"><span className="line-clamp-2 font-bold text-brand-navy">{product.name}</span><PriceView price={product.price} discount={product.discount} className="mt-1 text-base" /></span></Link></li>;
          })}</ul>
          : <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-slate-500">{search ? "No encontramos productos con ese nombre." : "Escribe para buscar en el catálogo."}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
