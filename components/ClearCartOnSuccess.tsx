"use client";

import { useEffect } from "react";
import useCartStore from "@/store";

export default function ClearCartOnSuccess() {
  const resetCart = useCartStore((state) => state.resetCart);
  useEffect(() => resetCart(), [resetCart]);
  return null;
}
