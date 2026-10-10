"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function CategoriesPage() {
    const categories = [
        {
            name: "Footwear",
            slug: "shoes",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200",
            count: "120+ Items",
            description: "From performance runners to street icons. Step into the future."
        },
        {
            name: "Apparel",
            slug: "clothing",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200",
            count: "80+ Items",
            description: "Engineered style for the modern explorer. Technical and timeless."
        },
        {
            name: "Accessories",
            slug: "accessories",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200",
            count: "45+ Items",
            description: "Fine-tune your identity with our curated selection of essentials."
        },
        {
            name: "Limited Drops",
            slug: "limited",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
            count: "Exclusive",
            description: "Rare finds and high-impact collaborations. Available briefly."
        },
    ];

    return (
        <div className="min-h-screen pt-32 pb-24">
            <div className="container mx-auto px-4">
                <header className="mb-20">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 uppercase italic">
                        CURATED <span className="text-primary italic">COLLECTIONS</span>
                    </h1>
                    <p className="text-foreground/60 max-w-2xl text-lg font-medium">
                        Explore our specialized categories engineered to provide high-performance solutions
                        for every lifestyle and environment.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.slug}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Link
                                href={`/shop?category=${cat.slug}`}
                                className="group relative block aspect-[16/9] overflow-hidden rounded-[2.5rem] border border-white/10 glass-morphism hover:border-primary transition-all duration-500"
                            >
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                <div className="absolute inset-0 p-12 flex flex-col justify-end">
                                    <div className="flex justify-between items-end">
                                        <div className="max-w-md">
                                            <span className="text-primary text-[10px] font-black tracking-[0.3em] uppercase mb-4 block">
                                                {cat.count}
                                            </span>
                                            <h3 className="text-4xl md:text-5xl font-black mb-4 uppercase italic">
                                                {cat.name}
                                            </h3>
                                            <p className="text-foreground/80 text-sm font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                {cat.description}
                                            </p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full glass-morphism flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all group-hover:rotate-[-45deg]">
                                            <ArrowRight size={32} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
