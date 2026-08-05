"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PRODUCTS_QUERYResult } from "@/sanity.types";
import ProductCard from "./ProductCard";
import HomeTabbar from "./new/HomeTabbar";
import NoProductAvailable from "./new/NoProductAvailable";

export default function ProductGrid() {
  const [products, setProducts] = useState<PRODUCTS_QUERYResult>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

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
    <section id="productos" aria-labelledby="products-title" className="scroll-mt-24">
      <div className="mb-8 text-center"><p className="text-sm font-black uppercase tracking-[.18em] text-brand-blue">Catálogo oficial</p><h2 id="products-title" className="mt-2 text-3xl font-black text-brand-navy sm:text-4xl">Encuentra lo que necesitas</h2><p className="mx-auto mt-3 max-w-2xl text-slate-600">Explora artículos para tu uniforme, actividades y destacamento.</p></div>
      <HomeTabbar selectedTab={selectedTab} onTabSelect={setSelectedTab} />
      {loading ? <div role="status" className="mt-8 flex min-h-64 items-center justify-center gap-2 rounded-2xl bg-white text-brand-blue"><Loader2 className="h-5 w-5 animate-spin" /><span className="font-bold">Cargando productos…</span></div>
      : error ? <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-bold text-brand-red">No pudimos cargar los productos.</p><button onClick={() => setRequestVersion((version) => version + 1)} className="mt-3 min-h-11 font-bold text-brand-blue underline">Intentar nuevamente</button></div>
      : products.length ? <div className="mt-8 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
      : <NoProductAvailable selectedTab={selectedTab || "Todos"} />}
    </section>
  );
}
