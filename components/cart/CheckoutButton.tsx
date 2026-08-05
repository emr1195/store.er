"use client";

import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutButtonProps {
  onCheckout: () => void;
  loading: boolean;
  disabled: boolean;
  compact?: boolean;
}

export default function CheckoutButton({ onCheckout, loading, disabled, compact = false }: CheckoutButtonProps) {
  return (
    <button type="button" onClick={onCheckout} disabled={disabled || loading} aria-busy={loading} className={cn("inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-black text-white shadow-sm transition hover:bg-blue-700 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 motion-reduce:transition-none", compact ? "min-h-12 text-sm" : "min-h-14 text-base")}>
      {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <LockKeyhole aria-hidden="true" className="h-5 w-5" />}
      {loading ? "Preparando pago…" : "Continuar al pago"}
      {!loading && !compact && <ArrowRight aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}
