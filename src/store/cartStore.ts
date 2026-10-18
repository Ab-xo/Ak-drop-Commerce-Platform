import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '@/types';
import { getAvailableProductStock, getCartLineId, getVariantPrice } from '@/lib/product-variants';

function cartItemKey(item: Pick<CartItem, 'id' | 'variantId' | 'cartLineId'>) {
    return item.cartLineId || getCartLineId(item.id, item.variantId ?? null);
}

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addItem: (product: Product, variant?: ProductVariant | null) => void;
    removeItem: (cartLineId: string) => void;
    updateQuantity: (cartLineId: string, quantity: number) => void;
    updatePrices: (prices: { productId: string; variantId: string | null; price: number }[]) => void;
    reconcileProducts: (products: Product[]) => void;
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
            addItem: (product, variant = null) => {
                const currentItems = get().items;
                const variantId = variant?.id ?? null;
                const lineId = getCartLineId(product.id, variantId);
                const existingItem = currentItems.find((item) => cartItemKey(item) === lineId);
                const stock = variant ? variant.stock_quantity : getAvailableProductStock(product);
                if (
                    (product.variants?.length && !variant)
                    || (variant && (variant.product_id !== product.id || !product.variants?.some((option) => option.id === variant.id)))
                ) return;
                if (stock <= 0 || (existingItem && existingItem.quantity >= stock)) return;
                const cartItem: CartItem = {
                    ...product,
                    price: variant ? getVariantPrice(product.price, variant) : product.price,
                    main_image: variant?.image_url || product.main_image,
                    variantId,
                    selectedVariant: variant,
                    cartLineId: lineId,
                    availabilityError: null,
                    quantity: 1,
                };

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            cartItemKey(item) === lineId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                        isCartOpen: true, // Open cart on add
                    });
                } else {
                    set({
                        items: [...currentItems, cartItem],
                        isCartOpen: true, // Open cart on add
                    });
                }
            },
            removeItem: (cartLineId) => {
                set({ items: get().items.filter((item) => cartItemKey(item) !== cartLineId) });
            },
            updateQuantity: (cartLineId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(cartLineId);
                    return;
                }
                const item = get().items.find((candidate) => cartItemKey(candidate) === cartLineId);
                if (!item) return;
                const availableStock = item.selectedVariant?.stock_quantity ?? getAvailableProductStock(item);
                if (quantity > Math.min(999, availableStock)) return;
                set({
                    items: get().items.map((item) =>
                        cartItemKey(item) === cartLineId
                            ? {
                                ...item,
                                quantity,
                                availabilityError: item.availabilityError?.startsWith('Only ') && quantity <= availableStock
                                    ? null
                                    : item.availabilityError,
                            }
                            : item
                    ),
                });
            },
            updatePrices: (prices) => {
                const currentPrices = new Map(prices.map(({ productId, variantId, price }) => [
                    getCartLineId(productId, variantId),
                    price,
                ]));
                set({
                    items: get().items.map((item) =>
                        currentPrices.has(cartItemKey(item))
                            ? { ...item, price: currentPrices.get(cartItemKey(item)) ?? item.price }
                            : item
                    ),
                });
            },
            reconcileProducts: (products) => {
                const productsById = new Map(products.map((product) => [product.id, product]));
                set({
                    items: get().items.map((item) => {
                        const product = productsById.get(item.id);
                        if (!product) {
                            return { ...item, availabilityError: 'This product is no longer available. Remove it to continue.' };
                        }

                        const variant = item.variantId
                            ? product.variants?.find((candidate) => candidate.id === item.variantId) ?? null
                            : null;
                        if (item.variantId && !variant) {
                            return { ...item, availabilityError: 'This option is no longer available. Remove it to continue.' };
                        }
                        if (product.variants?.length && !variant) {
                            return { ...item, availabilityError: 'Choose an available option for this product.' };
                        }
                        const stock = variant ? variant.stock_quantity : product.stock;
                        if (stock <= 0 || item.quantity > stock) {
                            return {
                                ...item,
                                availabilityError: stock <= 0
                                    ? 'This option is sold out. Remove it to continue.'
                                    : `Only ${stock} available. Reduce the quantity or remove this item.`,
                            };
                        }

                        return {
                            ...item,
                            ...product,
                            quantity: item.quantity,
                            cartLineId: getCartLineId(product.id, variant?.id ?? null),
                            variantId: variant?.id ?? null,
                            selectedVariant: variant,
                            price: variant ? getVariantPrice(product.price, variant) : product.price,
                            main_image: variant?.image_url || product.main_image,
                            availabilityError: null,
                        };
                    }),
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
