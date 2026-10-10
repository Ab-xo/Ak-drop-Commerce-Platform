"use client";
import Image from "next/image";
import { ShoppingCart, Heart, Eye, Star } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { getProductImageUrl } from "@/utils/imageUtils";

const formatEtb = (value: number) => `ETB ${new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value)}`;

export default function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore((state) => state.addItem);
    const outOfStock = product.stock <= 0;
    const handleAddToCart = () => { if (!outOfStock) { addItem(product); toast.success(`${product.name} added to your bag`); } };
    return <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group glass-card overflow-hidden p-0 border border-border hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
        <div className="relative h-80 overflow-hidden bg-secondary/40"><Image src={getProductImageUrl(product.main_image)} alt={product.name} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-x-4 top-4 flex justify-between"><div className="flex gap-2">{product.is_new_arrival && <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-3 py-1.5 rounded-full">New drop</span>}{outOfStock && <span className="bg-background/90 text-foreground text-[10px] font-black uppercase px-3 py-1.5 rounded-full">Sold out</span>}</div><button aria-label={`Save ${product.name}`} className="w-10 h-10 rounded-full glass-morphism flex items-center justify-center hover:bg-primary hover:text-primary-foreground"><Heart size={17} /></button></div><Link href={`/shop/${product.id}`} aria-label={`View ${product.name}`} className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100"><Eye size={18} /></Link></div>
        <div className="p-5"><div className="flex items-center justify-between gap-3 mb-2"><h3 className="font-bold text-base line-clamp-1 group-hover:text-primary">{product.name}</h3><span className="font-black text-primary whitespace-nowrap">{formatEtb(product.price)}</span></div><div className="flex items-center gap-1 text-amber-500 mb-3" aria-label="5 star rating">{[1,2,3,4,5].map((star) => <Star key={star} size={13} fill="currentColor" />)}</div><p className="text-foreground/60 text-xs mb-5 line-clamp-2 min-h-8">{product.description}</p><button disabled={outOfStock} onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2 py-3 bg-foreground/5 border border-border rounded-xl font-bold text-xs hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all uppercase tracking-wider"><ShoppingCart size={15} /> {outOfStock ? "Unavailable" : "Add to bag"}</button></div>
    </motion.article>;
}
