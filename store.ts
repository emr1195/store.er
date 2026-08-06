import { Product } from "./sanity.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product: Product;
  quantity: number;
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
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  deleteCartProduct: (productId: string) => void;
  reconcileItemStock: (productId: string, availableQuantity: number) => void;
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
