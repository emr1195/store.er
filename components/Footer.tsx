import Link from "next/link";
import Logo from "./new/Logo";
import SocialMedia from "./new/SocialMedia";

const columns = [
  { title: "Comprar", links: [{ label: "Tienda", href: "/#productos" }, { label: "Novedades", href: "/shop" }, { label: "Preguntas frecuentes", href: "/faqs" }] },
  { title: "Ayuda", links: [{ label: "Envíos y entregas", href: "/faqs" }, { label: "Cambios y devoluciones", href: "/faqs" }, { label: "Contacto", href: "/contact" }] },
  { title: "Legal", links: [{ label: "Términos y condiciones", href: "/terms" }, { label: "Política de privacidad", href: "/privacy" }, { label: "Nosotros", href: "/about" }] },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-brand-navy text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-7 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="flex items-center justify-between gap-4 sm:block"><Logo className="shrink-0 rounded-xl bg-white px-2" /><p className="hidden text-sm leading-6 text-white/70 sm:mt-4 sm:block sm:max-w-xs">Tienda oficial de Exploradores del Rey en Panamá. Uniformes y accesorios para destacamentos.</p><div id="redes-sociales" className="sm:mt-5"><p className="sr-only sm:not-sr-only sm:mb-3 sm:text-xs sm:font-bold sm:uppercase sm:tracking-widest sm:text-white/50">Redes sociales</p><SocialMedia /><p className="sr-only sm:not-sr-only sm:mt-2 sm:text-xs sm:text-white/50">Enlaces oficiales pendientes de confirmar.</p></div></div>
          <div className="col-span-full divide-y divide-white/15 rounded-xl border border-white/15 sm:hidden">
            {columns.map((column) => <details key={column.title} className="group px-4"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-black text-brand-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow [&::-webkit-details-marker]:hidden">{column.title}<span aria-hidden="true" className="text-lg transition group-open:rotate-45">+</span></summary><nav aria-label={column.title}><ul className="grid grid-cols-1 pb-3">{column.links.map((link) => <li key={link.label}><Link href={link.href} className="inline-flex min-h-10 items-center text-sm text-white/70 transition hover:text-white hover:underline">{link.label}</Link></li>)}</ul></nav></details>)}
          </div>
          {columns.map((column) => <nav key={column.title} aria-label={column.title} className="hidden sm:block"><h2 className="font-black text-brand-yellow">{column.title}</h2><ul className="mt-4 space-y-3">{column.links.map((link) => <li key={link.label}><Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/70 transition hover:text-white hover:underline">{link.label}</Link></li>)}</ul></nav>)}
        </div>
        <div className="mt-5 border-t border-white/15 pt-4 text-xs text-white/60 sm:mt-10 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:pt-6 sm:text-sm"><p>© {new Date().getFullYear()} Exploradores del Rey Panamá.</p><p className="hidden sm:block">Tienda oficial.</p></div>
      </div>
    </footer>
  );
}
