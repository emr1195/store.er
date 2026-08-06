import { Product } from "./sanity.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PurchasedCartItem = {
  productId: string;
  quantity: number;
};

export function removePurchasedCartItems(items: CartItem[], purchasedItems: PurchasedCartItem[]): CartItem[] {
  const purchasedByProduct = new Map<string, number>();
  for (const item of purchasedItems) {
    if (!item.productId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;
    purchasedByProduct.set(item.productId, (purchasedByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  return items.flatMap((item) => {
    const purchasedQuantity = purchasedByProduct.get(item.product._id) ?? 0;
    const remainingQuantity = item.quantity - purchasedQuantity;
    return remainingQuantity > 0 ? [{ ...item, quantity: remainingQuantity }] : [];
  });
}

export function completeCheckoutInCart(
  state: { items: CartItem[]; completedCheckoutIds?: string[] },
  checkoutId: string,
  purchasedItems: PurchasedCartItem[]
): { items: CartItem[]; completedCheckoutIds: string[] } {
  const completedCheckoutIds = state.completedCheckoutIds ?? [];
  if (completedCheckoutIds.includes(checkoutId)) {
    return { items: state.items, completedCheckoutIds };
  }

  return {
    items: removePurchasedCartItems(state.items, purchasedItems),
    completedCheckoutIds: [...completedCheckoutIds, checkoutId].slice(-50),
  };
}

export function reconcileCartItemStock(items: CartItem[], productId: string, availableQuantity: number): CartItem[] {
  return items.map((item) =>
    item.product._id === productId
      ? {
          ...item,
          quantity: availableQuantity > 0 ? Math.min(item.quantity, availableQuantity) : item.quantity,
          product: { ...item.product, stock: Math.max(0, availableQuantity) },
        }
      : item
  );
}

interface CartState {
  items: CartItem[];
  completedCheckoutIds: string[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  deleteCartProduct: (productId: string) => void;
  reconcileItemStock: (productId: string, availableQuantity: number) => void;
  removePurchasedItems: (checkoutId: string, items: PurchasedCartItem[]) => void;
  resetCart: () => void;
  getTotalPrice: () => number;
  getSubTotalPrice: () => number;
  getItemCount: (productId: string) => number;
  getGroupedItems: () => CartItem[];
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      completedCheckoutIds: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const requestedQuantity = Math.max(1, Math.floor(quantity));
          const existingItem = state.items.find(
            (item) => item.product._id === product._id
          );
          if (existingItem) {
            if (product.stock !== undefined && existingItem.quantity >= product.stock) {
              return state;
            }
            const nextQuantity = product.stock === undefined
              ? existingItem.quantity + requestedQuantity
              : Math.min(existingItem.quantity + requestedQuantity, product.stock);
            return {
              items: state.items.map((item) =>
                item.product._id === product._id
                  ? { ...item, quantity: nextQuantity }
                  : item
              ),
            };
          } else {
            const initialQuantity = product.stock === undefined
              ? requestedQuantity
              : Math.min(requestedQuantity, product.stock);
            if (initialQuantity <= 0) return state;
            return { items: [...state.items, { product, quantity: initialQuantity }] };
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.reduce((acc, item) => {
            if (item.product._id === productId) {
              if (item.quantity > 1) {
                acc.push({ ...item, quantity: item.quantity - 1 });
              }
            } else {
              acc.push(item);
            }
            return acc;
          }, [] as CartItem[]),
        })),
      deleteCartProduct: (productId) =>
        set((state) => ({
          items: state.items.filter(
            ({ product }) => product?._id !== productId
          ),
        })),
      reconcileItemStock: (productId, availableQuantity) =>
        set((state) => ({
          items: reconcileCartItemStock(state.items, productId, availableQuantity),
        })),
      removePurchasedItems: (checkoutId, purchasedItems) =>
        set((state) => completeCheckoutInCart(state, checkoutId, purchasedItems)),
      resetCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.product.price ?? 0) * item.quantity,
          0
        );
      },
      getSubTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.price ?? 0;
          const discount = ((item.product.discount ?? 0) * price) / 100;
          const discountedPrice = price - discount;
          return total + discountedPrice * item.quantity;
        }, 0);
      },
      getItemCount: (productId) => {
        const item = get().items.find((item) => item.product._id === productId);
        return item ? item.quantity : 0;
      },
      getGroupedItems: () => get().items,
    }),
    { name: "cart-store" }
  )
);

export default useCartStore;
