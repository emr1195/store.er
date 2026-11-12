"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export default function ProductImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
}: ProductImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
  }, [src]);

  return (
    <span className={cn("relative block overflow-hidden bg-slate-100", className)}>
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-200 motion-reduce:animate-none"
        />
      )}
      {isExternalNonSanityImage(currentSrc) ? (
        // Direct rendering avoids proxying arbitrary administrator-provided hosts through the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentSrc} alt={alt} loading={priority ? "eager" : "lazy"} onLoad={() => setLoaded(true)} onError={() => setCurrentSrc("/product-placeholder.svg")} className={cn("absolute inset-0 h-full w-full transition-opacity duration-300 motion-reduce:transition-none", loaded ? "opacity-100" : "opacity-0", imageClassName)} />
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (currentSrc !== "/product-placeholder.svg") {
              setLoaded(false);
              setCurrentSrc("/product-placeholder.svg");
            } else {
              setLoaded(true);
            }
          }}
          className={cn("transition-opacity duration-300 motion-reduce:transition-none", loaded ? "opacity-100" : "opacity-0", imageClassName)}
        />
      )}
    </span>
  );
}

function isExternalNonSanityImage(value: string): boolean {
  return value.startsWith("https://") && !value.startsWith("https://cdn.sanity.io/");
}
