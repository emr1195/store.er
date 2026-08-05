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
}

export default function ProductImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
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
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== "/product-placeholder.svg") {
            setLoaded(false);
            setCurrentSrc("/product-placeholder.svg");
          } else {
            setLoaded(true);
          }
        }}
        className={cn(
          "transition-opacity duration-300 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName
        )}
      />
    </span>
  );
}
