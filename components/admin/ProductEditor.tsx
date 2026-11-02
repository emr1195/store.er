/* eslint-disable @next/next/no-img-element */
"use client";

import { Check, Eye, Loader2, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createProductAction, type ProductActionState, updateProductAction } from "@/app/admin/products/actions";
import type { AdminProduct } from "@/lib/neon/adminProducts";
import { editableImageToUrl } from "@/lib/productImages";

const EMPTY_PRODUCT: AdminProduct = {
  id: "", name: "", slug: "", imageUrls: [], intro: "", description: "", price: 0,
  discount: 0, stock: 0, sku: "", isActive: true, taxable: true, status: "new", variant: "tshirt", updatedAt: "",
};

const INITIAL_STATE: ProductActionState = { success: false, message: "" };
const VARIANTS = [
  ["tshirt", "Camiseta"], ["jacket", "Chaqueta"], ["pants", "Pantalón"], ["pin", "Pin"],
  ["short", "Pantalón corto"], ["patch", "Parche"], ["cap", "Gorra"], ["mug", "Taza"], ["others", "Otro"],
] as const;

export default function ProductEditor({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [draft, setDraft] = useState(product ?? EMPTY_PRODUCT);
  const [slugEdited, setSlugEdited] = useState(Boolean(product?.slug));
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.success && state.productId && !product) router.replace(`/admin/products/${encodeURIComponent(state.productId)}?created=1`);
  }, [product, router, state.productId, state.success]);

  const update = <Key extends keyof AdminProduct>(key: Key, value: AdminProduct[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const imageText = draft.imageUrls.join("\n");
  const imageUrl = editableImageToUrl(draft.imageUrls[0]);
  const discountedPrice = Math.max(0, draft.price * (1 - draft.discount / 100));

  return (
    <form action={formAction} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7"><p className="text-sm font-black uppercase tracking-[0.2em] text-brand-blue">Información del artículo</p><h1 className="mt-1 text-3xl font-black">{product ? "Editar producto" : "Crear producto"}</h1><p className="mt-2 text-sm text-slate-500">Completa los campos y comprueba el resultado en la vista previa.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre" name="name" error={state.fieldErrors?.name} className="sm:col-span-2"><input id="name" name="name" required value={draft.name} onChange={(event) => { const name = event.target.value; update("name", name); if (!slugEdited) update("slug", slugify(name)); }} className="admin-input" placeholder="Camiseta oficial ER" /></Field>
          <Field label="Slug" name="slug" hint="Dirección del producto, sin espacios." error={state.fieldErrors?.slug}><input id="slug" name="slug" required value={draft.slug} onChange={(event) => { setSlugEdited(true); update("slug", slugify(event.target.value)); }} className="admin-input" placeholder="camiseta-oficial-er" /></Field>
          <Field label="SKU" name="sku" error={state.fieldErrors?.sku}><input id="sku" name="sku" value={draft.sku} onChange={(event) => update("sku", event.target.value)} className="admin-input" placeholder="ER-CAM-001" /></Field>
          <Field label="Introducción" name="intro" error={state.fieldErrors?.intro} className="sm:col-span-2"><input id="intro" name="intro" value={draft.intro} onChange={(event) => update("intro", event.target.value)} className="admin-input" maxLength={180} placeholder="Descripción breve para destacar el artículo" /></Field>
          <Field label="Descripción" name="description" error={state.fieldErrors?.description} className="sm:col-span-2"><textarea id="description" name="description" value={draft.description} onChange={(event) => update("description", event.target.value)} className="admin-input min-h-32 resize-y py-3" maxLength={2000} placeholder="Características, materiales, tamaños y recomendaciones…" /></Field>
          <Field label="Precio (USD)" name="price" error={state.fieldErrors?.price}><input id="price" name="price" type="number" required min="0" step="0.01" value={draft.price} onChange={(event) => update("price", numberValue(event.target.value))} className="admin-input" /></Field>
          <Field label="Descuento (%)" name="discount" error={state.fieldErrors?.discount}><input id="discount" name="discount" type="number" min="0" max="100" step="0.01" value={draft.discount} onChange={(event) => update("discount", numberValue(event.target.value))} className="admin-input" /></Field>
          <Field label="Inventario" name="stock" error={state.fieldErrors?.stock}><input id="stock" name="stock" type="number" required min="0" step="1" value={draft.stock} onChange={(event) => update("stock", Math.max(0, Math.trunc(numberValue(event.target.value))))} className="admin-input" /></Field>
          <Field label="Tipo" name="variant" error={state.fieldErrors?.variant}><select id="variant" name="variant" value={draft.variant} onChange={(event) => update("variant", event.target.value)} className="admin-input"><option value="">Sin tipo</option>{VARIANTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Estado visual" name="status" error={state.fieldErrors?.status}><select id="status" name="status" value={draft.status} onChange={(event) => update("status", event.target.value)} className="admin-input"><option value="">Sin etiqueta</option><option value="new">Nuevo</option><option value="hot">Destacado</option><option value="sale">Oferta</option></select></Field>
          <div className="grid gap-3 sm:pt-7"><Toggle name="isActive" checked={draft.isActive} onChange={(checked) => update("isActive", checked)} label="Publicado en la tienda" /><Toggle name="taxable" checked={draft.taxable} onChange={(checked) => update("taxable", checked)} label="Aplicar ITBMS" /></div>
          <Field label="Imágenes" name="imageUrls" hint="Una URL HTTPS por línea. Hasta 6 imágenes." error={state.fieldErrors?.imageUrls} className="sm:col-span-2"><textarea id="imageUrls" name="imageUrls" value={imageText} onChange={(event) => update("imageUrls", event.target.value.split("\n"))} className="admin-input min-h-28 resize-y py-3" placeholder="https://ejemplo.com/producto.jpg" /></Field>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6"><SaveButton />{state.message ? <p role={state.success ? "status" : "alert"} className={`inline-flex items-center gap-2 text-sm font-bold ${state.success ? "text-emerald-700" : "text-brand-red"}`}>{state.success ? <Check aria-hidden="true" className="h-4 w-4" /> : null}{state.message}</p> : null}</div>
      </section>

      <aside className="xl:sticky xl:top-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-brand-blue"><Eye aria-hidden="true" className="h-4 w-4" />Vista previa en tiempo real</div>
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="relative aspect-square bg-slate-100">
            <img src={imageUrl} alt={draft.name ? `Vista previa de ${draft.name}` : "Vista previa del producto"} className="h-full w-full object-contain p-6" />
            {draft.status ? <span className="absolute left-4 top-4 rounded-full bg-brand-navy px-3 py-1.5 text-xs font-black text-white">{statusLabel(draft.status)}</span> : null}
            {!draft.isActive ? <span className="absolute right-4 top-4 rounded-full bg-slate-700 px-3 py-1.5 text-xs font-black text-white">Oculto</span> : null}
          </div>
          <div className="p-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-brand-blue">{variantLabel(draft.variant)}</p><h2 className="mt-2 text-xl font-black">{draft.name || "Nombre del producto"}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{draft.intro || draft.description || "La descripción breve aparecerá aquí."}</p><div className="mt-5 flex items-end gap-3"><span className="text-2xl font-black">${discountedPrice.toFixed(2)}</span>{draft.discount > 0 ? <span className="pb-1 text-sm font-bold text-slate-400 line-through">${draft.price.toFixed(2)}</span> : null}</div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className={`text-sm font-bold ${draft.stock > 0 ? "text-emerald-700" : "text-brand-red"}`}>{draft.stock > 0 ? `${draft.stock} disponibles` : "Agotado"}</span><span className="text-xs font-bold text-slate-400">{draft.sku || "Sin SKU"}</span></div><button type="button" disabled className="mt-5 min-h-12 w-full rounded-xl bg-brand-blue font-black text-white disabled:opacity-100">Agregar al carrito</button></div>
        </article>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><Sparkles aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-blue" /><p>Esta vista cambia inmediatamente. Guarda para publicar los cambios en Neon.</p></div>
      </aside>
    </form>
  );
}

function Field({ label, name, hint, error, className = "", children }: { label: string; name: string; hint?: string; error?: string[]; className?: string; children: React.ReactNode }) {
  return <div className={className}><label htmlFor={name} className="mb-2 block text-sm font-black">{label}</label>{children}{hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}{error?.[0] ? <p role="alert" className="mt-1.5 text-xs font-bold text-brand-red">{error[0]}</p> : null}</div>;
}

function Toggle({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 text-sm font-bold"><span>{label}</span><input name={name} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-brand-blue" /></label>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-black text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{pending ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Save aria-hidden="true" className="h-5 w-5" />}{pending ? "Guardando…" : "Guardar producto"}</button>;
}

function slugify(value: string): string { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function numberValue(value: string): number { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function statusLabel(value: string): string { return ({ new: "Nuevo", hot: "Destacado", sale: "Oferta" } as Record<string, string>)[value] ?? value; }
function variantLabel(value: string): string { return Object.fromEntries(VARIANTS)[value] ?? "Artículo oficial"; }
