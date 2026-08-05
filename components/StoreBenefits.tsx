import { BadgeCheck, CreditCard, Headphones, MapPin } from "lucide-react";

const benefits = [
  { icon: BadgeCheck, title: "Productos oficiales", description: "Artículos de la tienda oficial de Exploradores del Rey en Panamá." },
  { icon: CreditCard, title: "Pagos seguros", description: "Checkout protegido y pagos procesados mediante Stripe." },
  { icon: MapPin, title: "Entrega en Panamá", description: "Zonas, modalidad y costos pendientes de confirmar." },
  { icon: Headphones, title: "Atención personalizada", description: "Consultas disponibles mediante nuestra página de contacto." },
];

export default function StoreBenefits() {
  return (
    <section aria-label="Beneficios de la tienda" className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ icon: Icon, title, description }) => (
          <article key={title} className="flex gap-3 bg-white px-5 py-6">
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue"><Icon className="h-5 w-5" /></span>
            <div><h2 className="font-bold text-brand-navy">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
