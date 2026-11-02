import { ArrowRight, CircleDollarSign, PackageCheck, PackageOpen, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { listAdminProducts } from "@/lib/neon/adminProducts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const products = await listAdminProducts();
  const active = products.filter((product) => product.isActive).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 3).length;
  const inventoryValue = products.reduce((total, product) => total + product.price * product.stock, 0);

  const metrics = [
    { label: "Productos", value: products.length, icon: PackageOpen, tone: "bg-blue-50 text-brand-blue" },
    { label: "Publicados", value: active, icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Stock bajo", value: lowStock, icon: TriangleAlert, tone: "bg-amber-50 text-amber-700" },
    { label: "Valor inventario", value: new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(inventoryValue), icon: CircleDollarSign, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-brand-navy p-7 text-white shadow-xl sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-yellow">Panel de control</p>
        <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><h1 className="text-3xl font-black sm:text-4xl">Gestiona el catálogo</h1><p className="mt-3 max-w-2xl text-slate-300">Crea, edita y publica artículos en Neon. Los cambios se reflejan en la tienda inmediatamente.</p></div>
          <Link href="/admin/products/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-6 font-black text-brand-navy hover:bg-yellow-300">Crear producto <ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
        </div>
      </section>
      <section aria-label="Métricas del catálogo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon aria-hidden="true" className="h-5 w-5" /></span><p className="mt-5 text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></article>)}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-black">Acceso rápido</h2><p className="mt-1 text-sm text-slate-500">Administra todos los campos y revisa la vista previa antes de publicar.</p></div><Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-5 font-bold text-white hover:bg-blue-700">Abrir productos <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
      </section>
    </div>
  );
}
