"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "store-er-favorites";

export default function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]") as unknown;
      setFavorite(Array.isArray(stored) && stored.includes(productId));
    } catch {
      window.localStorage.removeItem(FAVORITES_KEY);
    }
  }, [productId]);

  const toggleFavorite = () => {
    if (updating) return;
    setUpdating(true);
    try {
      const storedValue = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]") as unknown;
      const stored = Array.isArray(storedValue) ? storedValue.filter((id): id is string => typeof id === "string") : [];
      const nextFavorite = !stored.includes(productId);
      const next = nextFavorite ? [...stored, productId] : stored.filter((id) => id !== productId);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...new Set(next)]));
      setFavorite(nextFavorite);
      toast.success(nextFavorite ? "Guardado en favoritos de este dispositivo" : "Eliminado de favoritos");
    } catch {
      toast.error("No pudimos actualizar tus favoritos");
    } finally {
      window.setTimeout(() => setUpdating(false), 250);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={!mounted || updating}
      aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorite}
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition motion-reduce:transition-none disabled:cursor-wait disabled:opacity-60",
        favorite ? "border-brand-red bg-red-50 text-brand-red" : "border-slate-300 bg-white text-slate-600 hover:border-brand-blue hover:text-brand-blue",
        className
      )}
    >
      {updating ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <Heart aria-hidden="true" className={cn("h-5 w-5", favorite && "fill-current")} />}
    </button>
  );
}
