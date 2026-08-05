"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const links = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/#productos" },
  { label: "Novedades", href: "/shop" },
  { label: "Nosotros", href: "/about" },
];

export default function HeaderMenu() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
      <Logo className="mr-5" />
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : link.href.includes("#") ? false : pathname.startsWith(link.href);
        return <Link key={link.label} href={link.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition ${active ? "bg-blue-50 text-brand-blue" : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy"}`}>{link.label}</Link>;
      })}
    </nav>
  );
}
