"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getProductImageUrl } from "@/utils/imageUtils";
import { formatDisplayCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";

const CartPage = () => {
    const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
    const currency = useDisplayCurrency();

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-8 border border-border">
                        <ShoppingBag size={40} className="text-muted-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                    <p className="text-foreground/60 mb-8">Looks like you haven&apos;t added any style to your cart yet.</p>
                    <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
                        START SHOPPING <ArrowLeft size={18} className="rotate-180" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-32">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase italic">
                    Your <span className="text-primary italic">Cart</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-8">
                        {items.map((item, idx) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, type: "spring", damping: 20 }}
                                key={item.id}
                                className="glass-card flex flex-col sm:flex-row items-center gap-8 p-8 group border border-border hover:border-primary/40 transition-colors duration-500"
                            >
                                <div className="relative w-full sm:w-48 h-48 rounded-3xl overflow-hidden flex-shrink-0 bg-secondary border border-border">
                                    <Image
                                        src={getProductImageUrl(item.main_image)}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                <div className="flex-grow text-center sm:text-left space-y-3">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none group-hover:text-primary transition-colors duration-300">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-foreground/30 font-bold uppercase tracking-[0.3em]">
                                            {item.category?.name || "AK Drop product"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-foreground/50 line-clamp-2 max-w-md font-medium leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
                                        <div className="flex items-center bg-secondary border border-border rounded-2xl p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-foreground/10 hover:text-primary transition-all active:scale-90"
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span className="w-12 text-center font-black text-lg italic">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-foreground/10 hover:text-primary transition-all active:scale-90"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="w-12 h-12 rounded-2xl bg-destructive/5 text-destructive/40 hover:bg-destructive hover:text-white flex items-center justify-center transition-all duration-300 hover:rotate-6 active:scale-90"
                                            title="Remove Item"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center sm:text-right flex flex-col justify-center gap-1 min-w-[120px]">
                                    <p className="text-3xl font-black text-primary italic leading-none">
                                        {formatDisplayCurrency(item.price * item.quantity, currency)}
                                    </p>
                                    <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest leading-none">
                                        {formatDisplayCurrency(item.price, currency)} per item
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="glass-card sticky top-32 p-10 space-y-10 border border-border bg-card">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-[0.2em] italic mb-2">Summary</h2>
                                <div className="w-12 h-1 bg-primary" />
                            </div>

                            <div className="space-y-6">
                                <CurrencySwitcher />
                                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/40">
                                    <span>Subtotal ({getTotalItems()} units)</span>
                                    <span className="text-foreground/80">{formatDisplayCurrency(getTotalPrice(), currency)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/40">
                                    <span>Shipping</span>
                                    <span className="text-foreground/80">Not configured in demo</span>
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="font-black text-lg uppercase italic tracking-tighter">Product Subtotal</span>
                                        <div className="text-right">
                                            <motion.p
                                                key={getTotalPrice()}
                                                initial={{ scale: 1.1, color: "#fff" }}
                                                animate={{ scale: 1, color: "var(--primary)" }}
                                                className="font-black text-4xl text-primary italic leading-none"
                                            >
                                                {formatDisplayCurrency(getTotalPrice(), currency)}
                                            </motion.p>
                                        </div>
                                    </div>

                                    <Link href="/checkout" className="block w-full rounded-2xl bg-primary py-6 transition-opacity hover:opacity-90">
                                        <span className="flex items-center justify-center gap-3 font-black italic uppercase tracking-[0.2em] text-primary-foreground">
                                            Continue to checkout <ArrowRight size={20} />
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/30">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Stripe test-mode card payment
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed tracking-wider">
                                    Mastercard and billing address are supported by Stripe Checkout. Test charges are in USD; delivery is not included.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
