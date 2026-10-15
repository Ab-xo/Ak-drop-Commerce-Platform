import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    updatePrices: (prices: { productId: string; price: number }[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isCartOpen: false,
            setCartOpen: (open) => set({ isCartOpen: open }),
            addItem: (product) => {
                const currentItems = get().items;
                const existingItem = currentItems.find((item) => item.id === product.id);

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                        isCartOpen: true, // Open cart on add
                    });
                } else {
                    set({
                        items: [...currentItems, { ...product, quantity: 1 }],
                        isCartOpen: true, // Open cart on add
                    });
                }
            },
            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.id !== productId) });
            },
            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                });
            },
            updatePrices: (prices) => {
                const currentPrices = new Map(prices.map(({ productId, price }) => [productId, price]));
                set({
                    items: get().items.map((item) =>
                        currentPrices.has(item.id)
                            ? { ...item, price: currentPrices.get(item.id) ?? item.price }
                            : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        }),
        {
            name: 'ak-footwear-cart',
        }
    )
);
