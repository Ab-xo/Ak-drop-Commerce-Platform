"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getProductImageUrl } from "@/utils/imageUtils";
import { CartItem } from "@/types";

const CartPage = () => {
    const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                        <ShoppingBag size={40} className="text-white/20" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
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
                                className="glass-card flex flex-col sm:flex-row items-center gap-8 p-8 group border border-white/5 hover:border-primary/20 transition-colors duration-500"
                            >
                                <div className="relative w-full sm:w-48 h-48 rounded-3xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
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
                                            Category Item ID: {item.id.slice(0, 8)}
                                        </p>
                                    </div>
                                    <p className="text-sm text-foreground/50 line-clamp-2 max-w-md font-medium leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
                                        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-sm">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all active:scale-90"
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span className="w-12 text-center font-black text-lg italic">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all active:scale-90"
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
                                        ${(item.price * item.quantity).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest leading-none">
                                        ${item.price.toLocaleString()} PER PAIR
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="glass-card sticky top-32 p-10 space-y-10 border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-[0.2em] italic mb-2">Summary</h2>
                                <div className="w-12 h-1 bg-primary" />
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/40">
                                    <span>Subtotal ({getTotalItems()} units)</span>
                                    <span className="text-foreground/80">${getTotalPrice().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/40">
                                    <span>Shipping</span>
                                    <span className="text-emerald-400">Gratis</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-foreground/40">
                                    <span>Handling</span>
                                    <span className="text-foreground/80">$0.00</span>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="font-black text-lg uppercase italic tracking-tighter">Grand Total</span>
                                        <div className="text-right">
                                            <motion.p
                                                key={getTotalPrice()}
                                                initial={{ scale: 1.1, color: "#fff" }}
                                                animate={{ scale: 1, color: "var(--primary)" }}
                                                className="font-black text-4xl text-primary italic leading-none"
                                            >
                                                ${getTotalPrice().toLocaleString()}
                                            </motion.p>
                                        </div>
                                    </div>

                                    <button className="w-full group relative overflow-hidden bg-primary py-6 rounded-2xl active:scale-[0.98] transition-all duration-300">
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                                        <span className="relative z-10 text-black font-black italic uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                                            Proceed to Checkout <ArrowRight size={20} />
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/30">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    System Secure & Encrypted
                                </div>
                                <p className="text-[10px] text-foreground/30 font-medium uppercase leading-relaxed tracking-wider">
                                    * Final price includes VAT where applicable. Free express shipping applied globally.
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
