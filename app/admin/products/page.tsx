/* eslint-disable @next/next/no-img-element */
import { Eye, PackagePlus, Pencil, Search } from "lucide-react";
import Link from "next/link";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { editableImageToUrl } from "@/lib/productImages";
import { listAdminProducts } from "@/lib/neon/adminProducts";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAdminProducts();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-black uppercase tracking-[0.2em] text-brand-blue">Catálogo</p><h1 className="mt-1 text-3xl font-black">Productos</h1><p className="mt-2 text-slate-500">{products.length} artículos almacenados en Neon.</p></div>
        <Link href="/admin/products/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-black text-white hover:bg-blue-700"><PackagePlus aria-hidden="true" className="h-5 w-5" />Nuevo producto</Link>
      </div>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm"><Search aria-hidden="true" className="h-5 w-5 text-slate-400" /><span className="text-sm text-slate-500">Usa la búsqueda del navegador para localizar un producto rápidamente.</span></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {products.length === 0 ? <div className="p-12 text-center"><PackagePlus aria-hidden="true" className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-xl font-black">Aún no hay productos</h2><Link href="/admin/products/new" className="mt-4 inline-flex font-bold text-brand-blue underline">Crear el primero</Link></div> : (
          <ul className="divide-y divide-slate-200">
            {products.map((product) => {
              const image = editableImageToUrl(product.imageUrls[0]);
              return <li key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100"><img src={image} alt="" className="h-full w-full object-contain" /></div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-black">{product.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-black ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.isActive ? "Publicado" : "Oculto"}</span></div><p className="mt-1 text-sm text-slate-500">/{product.slug} · Stock {product.stock} · ${product.price.toFixed(2)}</p></div>
                <div className="flex flex-wrap items-center gap-2"><Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${product.name} en la tienda`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"><Eye aria-hidden="true" className="h-4 w-4" /></Link><Link href={`/admin/products/${encodeURIComponent(product.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 font-bold hover:bg-slate-50"><Pencil aria-hidden="true" className="h-4 w-4" />Editar</Link><DeleteProductButton productId={product.id} productName={product.name} /></div>
              </li>;
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
