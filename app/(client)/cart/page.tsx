"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/sanity.types";
import Container from "@/components/Container";
import EmptyCart from "@/components/EmptyCart";
import Loading from "@/components/Loading";
import NoAccessToCart from "@/components/NoAccessToCart";
import CartItemCard from "@/components/cart/CartItemCard";
import CheckoutButton from "@/components/cart/CheckoutButton";
import ClearCartButton from "@/components/cart/ClearCartButton";
import OrderSummary from "@/components/cart/OrderSummary";
import PriceFormatter from "@/components/PriceFormatter";
import { createCheckoutSession } from "@/actions/createCheckoutSession";
import type { CheckoutFailureCode } from "@/lib/checkout";
import { calculatePricing, centsToDollars, dollarsToCents, STORE_CURRENCY, type PricingResult } from "@/lib/pricing";
import useCartStore from "@/store";

type CommerceProduct = Product & { taxable?: boolean };

const EMPTY_PRICING: PricingResult = {
  currency: STORE_CURRENCY,
  lines: [],
  subtotalCents: 0,
  discountCents: 0,
  taxBaseCents: 0,
  itbmsCents: 0,
  shippingCents: 0,
  totalCents: 0,
};

export default function CartPage() {
  const groupedItems = useCartStore((state) => state.items);
  const deleteCartProduct = useCartStore((state) => state.deleteCartProduct);
  const reconcileItemStock = useCartStore((state) => state.reconcileItemStock);
  const resetCart = useCartStore((state) => state.resetCart);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const checkoutAttempt = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutErrorCode, setCheckoutErrorCode] = useState<CheckoutFailureCode | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isLoaded) return <Loading />;
  if (!isSignedIn) return <NoAccessToCart />;
  if (groupedItems.length === 0) return <main className="min-h-screen bg-page-bg"><EmptyCart /></main>;

  let pricing = EMPTY_PRICING;
  let pricingError = "";
  try {
    pricing = calculatePricing(
      groupedItems.map(({ product, quantity }) => ({
        productId: product._id,
        unitPriceCents: dollarsToCents(product.price ?? 0),
        quantity,
        discountPercent: product.discount ?? 0,
        taxable: (product as CommerceProduct).taxable !== false,
      })),
      { shippingCents: Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_CENTS ?? "0") }
    );
  } catch {
    pricingError = "No pudimos calcular el total del carrito. Revisa los productos e inténtalo nuevamente.";
  }

  const totalUnits = groupedItems.reduce((total, item) => total + item.quantity, 0);
  const inventoryError = groupedItems.some(({ product, quantity }) => !Number.isSafeInteger(product.stock) || (product.stock ?? 0) < quantity);
  const catalogError = groupedItems.some(({ product }) => typeof product.price !== "number" || !Number.isFinite(product.price) || product.price < 0);
  const checkoutDisabled = Boolean(pricingError) || inventoryError || catalogError || groupedItems.length === 0;

  const handleCheckout = async () => {
    if (checkoutLoading || checkoutDisabled) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    setCheckoutErrorCode(null);
    checkoutAttempt.current ??= crypto.randomUUID();
    try {
      const result = await createCheckoutSession({
        items: groupedItems.map(({ product, quantity }) => ({ productId: product._id, quantity })),
        deliveryMethod: "standard",
        attemptId: checkoutAttempt.current,
      });
      if (!result.success) {
        setCheckoutError(result.message);
        setCheckoutErrorCode(result.code);
        if (result.code === "STOCK_CHANGED") {
          for (const item of result.inventory ?? []) {
            reconcileItemStock(item.productId, item.availableQuantity);
            toast.error(item.availableQuantity > 0
              ? `Solo quedan ${item.availableQuantity} ${item.availableQuantity === 1 ? "unidad disponible" : "unidades disponibles"}. Actualizamos tu carrito.`
              : "Un producto ya no está disponible y debe eliminarse del carrito.");
          }
          checkoutAttempt.current = null;
          router.refresh();
        } else if (result.code !== "CHECKOUT_IN_PROGRESS") {
          checkoutAttempt.current = null;
        }
        setCheckoutLoading(false);
        return;
      }
      window.location.assign(result.checkoutUrl);
    } catch {
      console.error("Checkout action failed unexpectedly");
      const message = "No pudimos iniciar el pago. Inténtalo nuevamente en unos momentos.";
      setCheckoutError(message);
      setCheckoutErrorCode("CHECKOUT_FAILED");
      checkoutAttempt.current = null;
      toast.error(message);
      setCheckoutLoading(false);
    }
  };

  const handleDelete = (productId: string) => {
    deleteCartProduct(productId);
    toast.success("Producto eliminado del carrito");
  };

  const handleClear = () => {
    resetCart();
    toast.success("Carrito vaciado");
  };

  return (
    <main className="min-h-screen bg-page-bg pb-28 md:pb-12">
      <Container className="max-w-[1280px] py-6 sm:py-9">
        <header className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand-blue" aria-hidden="true"><ShoppingBag className="h-6 w-6" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-brand-blue">Tu compra</p>
            <h1 className="text-2xl font-black text-brand-navy sm:text-3xl">Carrito <span className="font-semibold text-slate-400">· {totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}</span></h1>
          </div>
        </header>

        {(pricingError || inventoryError || catalogError || checkoutError) && (
          <div role="alert" className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${checkoutErrorCode === "STOCK_CHANGED" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>
            {checkoutError || pricingError || (catalogError ? "Uno o más productos necesitan actualizar su información antes de continuar." : "Uno o más productos no tienen inventario suficiente. Ajusta la cantidad antes de continuar.")}
          </div>
        )}

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.85fr)_minmax(20rem,1fr)] lg:gap-8">
          <section aria-label="Productos del carrito" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-200">
              {groupedItems.map(({ product, quantity }) => {
                const line = pricing.lines.find((candidate) => candidate.productId === product._id);
                return (
                  <CartItemCard
                    key={product._id}
                    product={product}
                    quantity={quantity}
                    lineSubtotalCents={line?.subtotalCents ?? dollarsToCents(product.price ?? 0) * quantity}
                    lineDiscountCents={line?.discountCents ?? 0}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 p-3 sm:p-4"><ClearCartButton onClear={handleClear} /></div>
          </section>

          <OrderSummary pricing={pricing} checkoutLoading={checkoutLoading} checkoutDisabled={checkoutDisabled} onCheckout={handleCheckout} />
        </div>
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(17,29,58,.1)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="shrink-0"><p className="text-xs text-slate-500">Total</p><PriceFormatter amount={centsToDollars(pricing.totalCents)} className="text-lg font-black text-brand-navy" /></div>
          <CheckoutButton onCheckout={handleCheckout} loading={checkoutLoading} disabled={checkoutDisabled} compact />
        </div>
      </div>
    </main>
  );
}
