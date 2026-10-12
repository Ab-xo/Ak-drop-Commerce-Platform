"use client";

import Hero from "@/components/layout/Hero";
import ProductCard from "@/components/ui/ProductCard";
import { ArrowRight, ShoppingBag, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getProducts, getNewArrivals } from "@/utils/supabaseFetch";
import { Product } from "@/types";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featured, arrivals] = await Promise.all([
          getProducts('all', true, 4),
          getNewArrivals(4)
        ]);
        setFeaturedProducts(featured);
        setNewArrivals(arrivals);
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    { name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800", count: "120+ Items", href: "/shop?category=shoes" },
    { name: "Apparel", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800", count: "80+ Items", href: "/shop?category=clothing" },
    { name: "Accessories", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", count: "45+ Items", href: "/shop?category=accessories" },
  ];



  return (
    <div className="flex flex-col">
      <Hero />



      {/* Categories Grid */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase italic">SHOP BY <span className="text-primary">CATEGORY</span></h2>
              <p className="text-foreground/80 font-bold uppercase tracking-tight">Find exactly what you&apos;re looking for in our specialized collections.</p>
            </div>
            <Link href="/categories" className="hidden md:flex items-center gap-2 font-bold text-sm text-primary hover:gap-3 transition-all uppercase tracking-widest">
              VIEW ALL CATEGORIES <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.href}
                className="group relative h-[500px] overflow-hidden rounded-[2.5rem] border border-border"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <span className="text-primary text-[10px] font-black tracking-widest uppercase mb-2 block">{cat.count}</span>
                  <h3 className="text-4xl font-black mb-4 uppercase italic">{cat.name}</h3>
                  <div className="w-12 h-12 rounded-full glass-morphism flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-24 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase italic">NEW <span className="text-primary">ARRIVALS</span></h2>
              <p className="text-foreground/80 font-bold uppercase tracking-tight">The latest drops from our premium collections.</p>
            </div>
            <Link href="/shop" className="flex items-center gap-2 font-bold text-sm text-primary hover:gap-3 transition-all uppercase tracking-widest">
              SHOP ALL <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 rounded-3xl bg-foreground/5 animate-pulse" />
              ))
            ) : (
              newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="py-24 bg-background overflow-hidden px-4">
        <div className="container mx-auto">
          <div className="group relative w-full h-[600px] rounded-[3.5rem] overflow-hidden border border-border shadow-2xl cursor-pointer">

            {/* Animated scanning bar — visible on hover */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Top sweep bar */}
              <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-bar" />
              {/* Corner accent lines */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary rounded-tl-[3.5rem]" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary rounded-tr-[3.5rem]" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary rounded-bl-[3.5rem]" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary rounded-br-[3.5rem]" />
              {/* Primary glow pulse ring */}
              <div className="absolute inset-0 rounded-[3.5rem] ring-2 ring-primary/40 animate-pulse-ring" />
            </div>
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=85&w=2000"
              alt="Summer Collection"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-100 dark:opacity-60 saturate-110 dark:saturate-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent dark:from-background dark:via-background/60 dark:to-transparent" />
            <div className="absolute inset-0 flex items-center px-10 md:px-20">
              <div className="max-w-xl">
                <span className="bg-primary/20 text-primary border border-primary/20 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-6 inline-block">
                  Limited Release
                </span>
                <h2 className="text-4xl md:text-7xl font-black mb-8 leading-tight italic drop-shadow-sm">
                  THE SUMMER<br />ESSENTIALS &lsquo;26
                </h2>
                <p className="text-foreground/90 text-lg mb-10 font-bold uppercase tracking-tight drop-shadow-sm">
                  Lightweight fabrics, breathable footwear, and versatile accessories.
                  Curated for the ultimate summer performance and style.
                </p>
                <Link href="/shop" className="btn-primary inline-flex items-center gap-3 italic">
                  EXPLORE THE DROP <ShoppingBag size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
