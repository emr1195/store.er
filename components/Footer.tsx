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
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div><Logo className="rounded-xl bg-white px-2" /><p className="mt-4 max-w-xs text-sm leading-6 text-white/70">Tienda oficial de Exploradores del Rey en Panamá. Uniformes, accesorios y artículos para destacamentos.</p><div id="redes-sociales" className="mt-5"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/50">Redes sociales</p><SocialMedia /><p className="mt-2 text-xs text-white/50">Enlaces oficiales pendientes de confirmar.</p></div></div>
          {columns.map((column) => <nav key={column.title} aria-label={column.title}><h2 className="font-black text-brand-yellow">{column.title}</h2><ul className="mt-4 space-y-3">{column.links.map((link) => <li key={link.label}><Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/70 transition hover:text-white hover:underline">{link.label}</Link></li>)}</ul></nav>)}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Exploradores del Rey Panamá.</p><p>Tienda oficial · Información comercial pendiente de confirmación donde se indica.</p></div>
      </div>
    </footer>
  );
}
