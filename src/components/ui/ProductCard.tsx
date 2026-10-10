"use client";

import Image from "next/image";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import Link from "next/link";
import { getProductImageUrl } from "@/utils/imageUtils";

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        addItem(product);
        toast.success(`${product.name} added to cart!`, {
            style: {
                background: 'hsl(var(--secondary))',
                color: 'hsl(var(--foreground))',
                borderRadius: '1.5rem',
                border: '1px solid hsl(var(--border))'
            },
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group glass-card overflow-hidden p-0 border-[1.5px] border-[hsl(var(--card-border))] dark:border-border hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
        >
            <div className="relative h-80 overflow-hidden">
                <Image
                    src={getProductImageUrl(product.main_image)}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="w-10 h-10 rounded-full glass-morphism flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg">
                        <Heart size={18} />
                    </button>
                    <Link
                        href={`/shop/${product.id}`}
                        className="w-10 h-10 rounded-full glass-morphism flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
                    >
                        <Eye size={18} />
                    </Link>
                </div>

                {product.is_featured && (
                    <span className="absolute top-4 left-4 bg-primary text-black text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full">
                        Featured
                    </span>
                )}
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                    <span className="font-black text-primary">${product.price}</span>
                </div>
                <p className="text-foreground/60 text-xs mb-6 line-clamp-2">
                    {product.description}
                </p>

                <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-foreground/5 border border-border rounded-xl font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-all group-active:scale-95 uppercase italic tracking-tighter"
                >
                    <ShoppingCart size={16} /> ADD TO CART
                </button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
