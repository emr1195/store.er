"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import ProductImage from "@/components/new/ProductImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProductImageSource = NonNullable<Product["images"]>[number];

interface ProductGalleryProps {
  images?: Product["images"];
  productName: string;
}

export default function ProductGallery({ images = [], productName }: ProductGalleryProps) {
  const uniqueImages = useMemo(
    () => images.filter((image, index, list) => {
      const reference = image.asset?._ref;
      return reference && list.findIndex((candidate) => candidate.asset?._ref === reference) === index;
    }),
    [images]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = uniqueImages[selectedIndex];
  const selectedUrl = selected ? urlFor(selected).width(1400).height(1400).fit("max").url() : "/product-placeholder.svg";
  const hasMultiple = uniqueImages.length > 1;

  const selectRelative = (offset: number) => {
    if (!hasMultiple) return;
    setSelectedIndex((current) => (current + offset + uniqueImages.length) % uniqueImages.length);
  };

  return (
    <section aria-label={`Galería de ${productName}`} className="grid min-w-0 gap-3 lg:grid-cols-[5rem_minmax(0,1fr)]">
      {hasMultiple && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-y-auto lg:pb-0" aria-label="Miniaturas del producto">
          {uniqueImages.map((image: ProductImageSource, index) => (
            <button
              key={image.asset?._ref ?? image._key}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-pressed={selectedIndex === index}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition motion-reduce:transition-none ${selectedIndex === index ? "border-brand-blue ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-400"}`}
            >
              <ProductImage src={urlFor(image).width(180).height(180).fit("max").url()} alt="" sizes="80px" className="h-full w-full" imageClassName="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative order-1 aspect-square min-h-[18rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") selectRelative(-1);
          if (event.key === "ArrowRight") selectRelative(1);
        }}
      >
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="relative h-full w-full cursor-zoom-in" aria-label={`Ampliar imagen de ${productName}`}>
              <ProductImage src={selectedUrl} alt={`${productName}, imagen ${selectedIndex + 1}`} sizes="(max-width: 1023px) 100vw, 55vw" className="h-full w-full" imageClassName="object-contain p-4 sm:p-8" />
              <span className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-brand-navy shadow-sm transition group-hover:text-brand-blue motion-reduce:transition-none">
                <Expand aria-hidden="true" className="h-5 w-5" />
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="h-[min(90dvh,900px)] w-[min(94vw,1000px)] max-w-none rounded-2xl border-0 bg-white p-3 sm:p-6 [&>button]:z-10 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-white [&>button_span]:sr-only">
            <DialogTitle className="sr-only">Vista ampliada de {productName}</DialogTitle>
            <DialogDescription className="sr-only">Imagen {selectedIndex + 1} de {Math.max(uniqueImages.length, 1)}. Presiona Escape para cerrar.</DialogDescription>
            <ProductImage src={selectedUrl} alt={`${productName}, vista ampliada`} sizes="94vw" className="h-full w-full rounded-xl bg-white" imageClassName="object-contain p-4" />
          </DialogContent>
        </Dialog>

        {hasMultiple && (
          <>
            <button type="button" onClick={() => selectRelative(-1)} aria-label="Imagen anterior" className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-brand-navy shadow-sm hover:text-brand-blue">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={() => selectRelative(1)} aria-label="Imagen siguiente" className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-brand-navy shadow-sm hover:text-brand-blue">
              <ChevronRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
