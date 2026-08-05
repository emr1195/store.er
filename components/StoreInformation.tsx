import Link from "next/link";
import { Clock3, CreditCard, MapPinned, MessageCircle, RefreshCcw } from "lucide-react";

const details = [
  { icon: CreditCard, label: "Métodos de pago", value: "Pago en línea procesado con Stripe; métodos habilitados pendientes de confirmar." },
  { icon: MapPinned, label: "Envíos y entregas", value: "Cobertura, retiro y tarifas pendientes de confirmación." },
  { icon: Clock3, label: "Preparación", value: "Tiempo estimado pendiente de confirmación." },
  { icon: RefreshCcw, label: "Cambios y devoluciones", value: "Política pendiente de publicación por la administración." },
];

export default function StoreInformation() {
  return (
    <section aria-labelledby="store-info-title" className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
          <div><p className="text-sm font-bold uppercase tracking-[.18em] text-brand-blue">Compra con confianza</p><h2 id="store-info-title" className="mt-2 text-3xl font-black text-brand-navy">Información antes de pedir</h2><p className="mt-3 leading-7 text-slate-600">Publicamos únicamente información confirmada. Los datos comerciales aún no definidos aparecen claramente marcados como pendientes.</p><Link href="/contact" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-brand-blue hover:underline"><MessageCircle className="h-5 w-5" /> Contactar a la tienda</Link><p className="mt-2 text-xs text-slate-500">WhatsApp: número pendiente de confirmar.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{details.map(({ icon: Icon, label, value }) => <article key={label} className="rounded-2xl bg-page-bg p-5"><Icon className="h-5 w-5 text-brand-blue" /><h3 className="mt-3 font-bold text-brand-navy">{label}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{value}</p></article>)}</div>
        </div>
      </div>
    </section>
  );
}
