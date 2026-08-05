"use client";

import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useOutsideClick } from "@/hooks";
import { CATEGORIES_QUERYResult } from "@/sanity.types";
import Logo from "./Logo";

interface SidebarProps { isOpen: boolean; onClose: () => void; categories: CATEGORIES_QUERYResult; }
const mainLinks = [{ label: "Inicio", href: "/" }, { label: "Tienda", href: "/#productos" }, { label: "Novedades", href: "/shop" }, { label: "Nosotros", href: "/about" }, { label: "Mi cuenta", href: "/orders" }];

export default function Sidebar({ isOpen, onClose, categories }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useOutsideClick<HTMLDivElement>(onClose);
  return (
    <div className={`fixed inset-0 z-[60] transition ${isOpen ? "visible bg-brand-navy/60 opacity-100" : "invisible opacity-0"}`} aria-hidden={!isOpen}>
      <div id="mobile-navigation" ref={sidebarRef} role="dialog" aria-modal="true" aria-label="Menú principal" className={`h-full w-[min(88vw,360px)] overflow-y-auto bg-white p-5 shadow-2xl transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-4"><Logo /><button onClick={onClose} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-navy hover:bg-red-50 hover:text-brand-red"><X /></button></div>
        <nav aria-label="Navegación móvil" className="mt-5 flex flex-col gap-1">
          {mainLinks.map((item) => <Link key={item.label} onClick={onClose} href={item.href} className={`flex min-h-12 items-center rounded-xl px-4 font-bold ${pathname === item.href ? "bg-blue-50 text-brand-blue" : "text-brand-navy hover:bg-slate-50"}`}>{item.label}</Link>)}
        </nav>
        {categories.length > 0 && <div className="mt-6 border-t border-slate-200 pt-5"><p className="px-4 text-xs font-black uppercase tracking-widest text-slate-400">Categorías</p><div className="mt-2 flex flex-col">{categories.map((item) => <Link onClick={onClose} key={item._id} href={`/category/${item.slug?.current}`} className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-blue">{item.title}</Link>)}</div></div>}
      </div>
    </div>
  );
}
