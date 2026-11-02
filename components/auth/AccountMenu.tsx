"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button type="button" onClick={handleSignOut} aria-label="Cerrar sesión" className={`${compact ? "h-11 w-11 px-0" : "min-h-11 px-3"} inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-brand-navy transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue`}>
      <LogOut aria-hidden="true" className="h-5 w-5" />
      {compact ? <span className="sr-only">Cerrar sesión</span> : "Salir"}
    </button>
  );
}
