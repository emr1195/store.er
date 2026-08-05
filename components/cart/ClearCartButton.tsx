"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ClearCartButton({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const clear = () => {
    if (clearing) return;
    setClearing(true);
    onClear();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-brand-red hover:bg-red-50">
          <Trash2 aria-hidden="true" className="h-4 w-4" />Vaciar carrito
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogTitle className="text-xl font-black text-brand-navy">Vaciar carrito</DialogTitle>
        <DialogDescription className="leading-6 text-slate-600">¿Deseas eliminar todos los productos del carrito? Esta acción no se puede deshacer.</DialogDescription>
        <DialogFooter className="mt-2 gap-2 sm:space-x-0">
          <DialogClose asChild><button type="button" className="min-h-11 rounded-xl border border-slate-300 px-5 font-bold text-brand-navy hover:bg-slate-50">Cancelar</button></DialogClose>
          <button type="button" onClick={clear} disabled={clearing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-5 font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {clearing && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}Vaciar carrito
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
