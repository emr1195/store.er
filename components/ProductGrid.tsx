"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PRODUCTS_QUERYResult } from "@/sanity.types";
import ProductCard from "./ProductCard";
import HomeTabbar from "./new/HomeTabbar";
import NoProductAvailable from "./new/NoProductAvailable";
import { productType } from "@/constants";

export default function ProductGrid() {
  const [products, setProducts] = useState<PRODUCTS_QUERYResult>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const selectedCategory = productType.find((item) => item.value === selectedTab)?.title;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams();
        if (selectedTab) params.set("variant", selectedTab);
        const response = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("CATALOG_UNAVAILABLE");
        setProducts(await response.json());
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") { setProducts([]); setError(true); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    fetchData();
    return () => controller.abort();
  }, [selectedTab, requestVersion]);

  return (
    <section id="productos" aria-labelledby="products-title" className="scroll-mt-20 lg:scroll-mt-24">
      <HomeTabbar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      <div className="mb-4 mt-4 flex min-h-12 items-end justify-between gap-4">
        <div><h2 id="products-title" className="text-2xl font-black leading-tight text-brand-navy sm:text-3xl">{selectedCategory ?? "Productos destacados"}</h2>{selectedCategory && !loading && !error ? <p className="mt-1 text-sm text-slate-500" aria-live="polite">{products.length} {products.length === 1 ? "producto" : "productos"}</p> : null}</div>
      </div>
      {loading ? <div role="status" className="flex min-h-48 items-center justify-center gap-2 rounded-2xl bg-white text-brand-blue"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /><span className="font-bold">Cargando productos…</span></div>
      : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-bold text-brand-red">No pudimos cargar los productos.</p><button onClick={() => setRequestVersion((version) => version + 1)} className="mt-3 min-h-11 font-bold text-brand-blue underline">Intentar nuevamente</button></div>
      : products.length ? <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
      : <NoProductAvailable selectedTab={selectedTab || "Todos"} />}
    </section>
  );
}
