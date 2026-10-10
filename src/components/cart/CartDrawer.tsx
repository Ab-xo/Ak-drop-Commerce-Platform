"use client";

import { useCartStore } from "@/store/cartStore";
import { getProductImageUrl } from "@/utils/imageUtils";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CartDrawer = () => {
    const { isCartOpen, setCartOpen, items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCartOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-full max-w-md bg-background/95 backdrop-blur-2xl border-l border-border z-[101] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="text-primary" size={24} />
                                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                                    Your <span className="text-primary italic">Cart</span>
                                </h2>
                                <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {getTotalItems()}
                                </span>
                            </div>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-foreground/10 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 text-foreground">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <ShoppingBag size={48} className="mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
                                    <Link
                                        href="/shop"
                                        onClick={() => setCartOpen(false)}
                                        className="mt-4 text-primary text-xs font-black hover:underline"
                                    >
                                        BROWSE CATALOG
                                    </Link>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                                            <Image
                                                src={getProductImageUrl(item.main_image)}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-sm truncate uppercase italic">{item.name}</h3>
                                            <p className="text-primary font-black text-xs mb-3 font-mono tracking-tighter">${item.price}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 bg-foreground/5 rounded-full px-2 py-1 border border-border">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="hover:text-primary transition-colors p-0.5"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="hover:text-primary transition-colors p-0.5"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-foreground/20 hover:text-destructive transition-colors p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 bg-foreground/[0.02] border-t border-border space-y-4">
                                <div className="flex justify-between items-center text-foreground">
                                    <span className="text-foreground/40 text-xs font-black uppercase tracking-widest">Subtotal</span>
                                    <span className="text-xl font-black text-primary">${getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/cart"
                                        onClick={() => setCartOpen(false)}
                                        className="py-4 rounded-xl border border-border text-center text-xs text-foreground font-black uppercase tracking-widest hover:bg-foreground/5 transition-colors"
                                    >
                                        View Full Cart
                                    </Link>
                                    <button className="py-4 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                        Checkout <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
