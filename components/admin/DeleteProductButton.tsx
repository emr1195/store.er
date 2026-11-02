"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/app/admin/products/actions";

export default function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleDelete = () => {
    if (isPending || !window.confirm(`¿Eliminar “${productName}”? Esta acción no se puede deshacer.`)) return;
    setMessage("");
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={isPending} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-bold text-brand-red hover:bg-red-50 disabled:opacity-60">
        {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}{isPending ? "Eliminando…" : "Eliminar"}
      </button>
      {message ? <p role="alert" className="mt-1 max-w-48 text-xs font-bold text-brand-red">{message}</p> : null}
    </div>
  );
}
