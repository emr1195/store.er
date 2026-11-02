import { Boxes, ExternalLink, LayoutDashboard, PackageOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerSession, hasAdminRole } from "@/lib/auth-session";
import AccountMenu from "@/components/auth/AccountMenu";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/signin?redirect_url=/admin");
  if (!hasAdminRole(session.user.role)) redirect("/access-denied");

  return (
    <div className="min-h-dvh bg-slate-100 text-brand-navy">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3 rounded-xl focus-visible:outline-none">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue text-white"><Boxes aria-hidden="true" /></span>
            <span><span className="block text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Administración</span><span className="text-lg font-black">ER Marketplace</span></span>
          </Link>
          <nav aria-label="Navegación administrativa" className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 hover:bg-slate-100"><LayoutDashboard aria-hidden="true" className="h-4 w-4" />Resumen</Link>
            <Link href="/admin/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 hover:bg-slate-100"><PackageOpen aria-hidden="true" className="h-4 w-4" />Productos</Link>
            <Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 hover:bg-slate-50">Ver tienda<ExternalLink aria-hidden="true" className="h-4 w-4" /></Link>
            <AccountMenu compact />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
