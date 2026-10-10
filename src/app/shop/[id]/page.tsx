"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCw, Star, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { getProductById } from "@/utils/supabaseFetch";
import { getProductImageUrl } from "@/utils/imageUtils";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const addItem = useCartStore((state) => state.addItem);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        async function loadProduct() {
            const data = await getProductById(id);
            setProduct(data);
            setLoading(false);
        }
        loadProduct();
    }, [id]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left) / width) * 100;
        const y = ((e.pageY - top) / height) * 100;
        setMousePos({ x, y });
    };

    const handleAddToCart = () => {
        if (product) {
            addItem(product);
            toast.success(`${product.name} added to cart!`, {
                style: {
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                    borderRadius: '1.5rem',
                    border: '1px solid hsl(var(--border))'
                },
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-4xl font-black mb-6 italic">PRODUCT NOT FOUND</h1>
                <Link href="/shop" className="btn-primary italic">BACK TO SHOP</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-32">
            <div className="container mx-auto px-4">
                <Link href="/shop" className="inline-flex items-center gap-2 text-foreground/40 hover:text-primary transition-colors mb-12 font-black text-[10px] uppercase tracking-widest">
                    <ArrowLeft size={16} /> Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Product Images */}
                    <div className="space-y-6">
                        <motion.div
                            key={selectedImageIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onMouseMove={handleMouseMove}
                            className="relative h-[600px] rounded-[2.5rem] overflow-hidden border border-border glass-morphism shadow-2xl shadow-primary/5 cursor-crosshair group/zoom"
                        >
                            <Image
                                src={getProductImageUrl(product.images?.[selectedImageIndex])}
                                alt={product.name}
                                fill
                                className={`object-cover transition-transform duration-200 ${isHovered ? 'scale-150' : 'scale-100'}`}
                                style={{
                                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                                }}
                                priority
                            />
                            {!isHovered && (
                                <div className="absolute bottom-8 right-8 bg-background/60 backdrop-blur-md px-4 py-2 rounded-full border border-border flex items-center gap-2 pointer-events-none">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Hover to Zoom</span>
                                </div>
                            )}
                        </motion.div>
                        <div className="grid grid-cols-4 gap-4">
                            {product.images?.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative h-24 rounded-[1.25rem] overflow-hidden border transition-all duration-300 cursor-pointer ${selectedImageIndex === idx
                                        ? "border-primary scale-105 shadow-lg shadow-primary/20"
                                        : "border-border grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                                        }`}
                                >
                                    <Image src={getProductImageUrl(img)} alt={`${product.name} thumbnail ${idx}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                                {product.is_new_arrival ? "New Arrival" : "Exclusive"}
                            </span>
                            <div className="flex items-center text-yellow-500">
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <Star size={14} fill="currentColor" />
                                <span className="text-foreground/40 text-[10px] ml-2 font-black uppercase">Institutional Grade</span>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 uppercase italic">
                            {product.name}
                        </h1>
                        <p className="text-3xl font-black text-primary mb-8 underline decoration-primary/20 underline-offset-8 italic">${product.price}</p>

                        <p className="text-foreground/60 leading-relaxed mb-12 text-lg font-medium">
                            {product.description}
                        </p>

                        <div className="space-y-6 mb-12">
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Technical Specifications</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {product.features?.length ? product.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {feature}
                                    </li>
                                )) : (
                                    <li className="text-sm text-foreground/40 italic">Quality testing completed. Ready for deployment.</li>
                                )}
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 mb-12">
                            <button
                                onClick={handleAddToCart}
                                className="btn-primary flex-grow py-5 text-primary-foreground font-black tracking-widest text-base flex items-center justify-center gap-3 italic"
                            >
                                <ShoppingCart size={20} /> ADD TO CART
                            </button>
                            <button className="glass-morphism px-8 py-5 rounded-full hover:bg-foreground/10 transition-all font-bold">
                                <Heart size={20} />
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 border-t border-border pt-12">
                            <div className="flex flex-col items-center text-center gap-3 group">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Truck className="text-primary/60" size={20} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Express Global</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-3 group">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <RefreshCw className="text-primary/60" size={20} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">30D Returns</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-3 group">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <ShieldCheck className="text-primary/60" size={20} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Secured Layer</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
