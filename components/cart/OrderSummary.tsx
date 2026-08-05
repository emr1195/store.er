import { PackageCheck, ShieldCheck } from "lucide-react";
import type { PricingResult } from "@/lib/pricing";
import { centsToDollars } from "@/lib/pricing";
import PriceFormatter from "@/components/PriceFormatter";
import CheckoutButton from "./CheckoutButton";

interface OrderSummaryProps {
  pricing: PricingResult;
  checkoutLoading: boolean;
  checkoutDisabled: boolean;
  onCheckout: () => void;
}

export default function OrderSummary({ pricing, checkoutLoading, checkoutDisabled, onCheckout }: OrderSummaryProps) {
  return (
    <aside aria-labelledby="order-summary-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
      <h2 id="order-summary-title" className="text-xl font-black text-brand-navy">Resumen del pedido</h2>
      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Subtotal</dt><dd><PriceFormatter amount={centsToDollars(pricing.subtotalCents)} className="font-bold text-brand-navy" /></dd></div>
        {pricing.discountCents > 0 && <div className="flex items-center justify-between gap-4 text-emerald-700"><dt>Descuento</dt><dd><PriceFormatter amount={-centsToDollars(pricing.discountCents)} className="font-bold text-emerald-700" /></dd></div>}
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">ITBMS</dt><dd><PriceFormatter amount={centsToDollars(pricing.itbmsCents)} className="font-bold text-brand-navy" /></dd></div>
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Envío</dt><dd className="font-bold text-brand-navy">{pricing.shippingCents === 0 ? "Gratis" : <PriceFormatter amount={centsToDollars(pricing.shippingCents)} className="font-bold text-brand-navy" />}</dd></div>
      </dl>
      <div className="my-5 border-t border-slate-200" />
      <div className="flex items-end justify-between gap-4"><span className="font-bold text-brand-navy">Total</span><PriceFormatter amount={centsToDollars(pricing.totalCents)} className="text-2xl font-black text-brand-navy" /></div>

      <div className="mt-6"><CheckoutButton onCheckout={onCheckout} loading={checkoutLoading} disabled={checkoutDisabled} /></div>
      <p className="mt-3 text-center text-xs leading-5 text-slate-500">Pago seguro. El total será validado antes de completar la compra.</p>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <h3 className="text-sm font-black text-brand-navy">Entrega</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">La modalidad y los detalles de entrega se confirmarán durante el pago.</p>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-slate-600">
        <p className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-brand-blue" />Pago procesado de forma segura.</p>
        <p className="flex items-center gap-2"><PackageCheck aria-hidden="true" className="h-4 w-4 text-brand-blue" />Precios e inventario validados por el servidor.</p>
      </div>
    </aside>
  );
}
