"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatDisplayCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";
import { getProductImageUrl } from "@/utils/imageUtils";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const currency = useDisplayCurrency();
  const outOfStock = product.stock <= 0;
  const hasDiscount = Boolean(product.compare_price && product.compare_price > product.price);
  const discount = hasDiscount
    ? Math.round(100 - (product.price / (product.compare_price ?? product.price)) * 100)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-card shadow-[0_6px_24px_-14px_rgba(0,0,0,0.22)] transition duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_55px_-24px_rgba(0,0,0,0.32)] dark:shadow-black/20"
    >
      <div className="relative aspect-[4/4.35] overflow-hidden bg-secondary/40">
        <Link
          href={`/shop/${product.id}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-0"
        >
          <Image
            src={getProductImageUrl(product.main_image)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.is_new_arrival && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-zinc-900 shadow-[0_5px_18px_-7px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-3.5 sm:text-[10px]">
                <Sparkles size={12} className="text-primary" strokeWidth={2.5} />
                New drop
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full border border-white/15 bg-zinc-950/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-md sm:text-[10px]">
                -{discount}%
              </span>
            )}
          </div>
          {outOfStock && (
            <span className="rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md sm:text-[10px]">
              Sold out
            </span>
          )}
        </div>

        <Link
          href={`/shop/${product.id}`}
          aria-label={`View details for ${product.name}`}
          className="absolute bottom-3 right-3 z-10 inline-flex size-10 translate-y-1 items-center justify-center rounded-full border border-white/35 bg-white/90 text-zinc-900 opacity-0 shadow-lg backdrop-blur transition duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 sm:bottom-4 sm:right-4"
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2.5 flex min-h-4 items-center justify-between gap-3">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {product.category?.name || "AK Drop collection"}
          </p>
          {product.is_featured && (
            <span className="shrink-0 rounded-full bg-primary/[0.08] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-primary">
              Featured
            </span>
          )}
        </div>

        <Link
          href={`/shop/${product.id}`}
          className="line-clamp-1 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:text-primary sm:text-base"
        >
          {product.name}
        </Link>
        <p className="mt-1.5 line-clamp-2 min-h-9 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {product.short_description || product.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex min-h-8 items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Price</p>
              <span className="text-lg font-black leading-none tracking-tight text-primary sm:text-xl">
                {formatDisplayCurrency(product.price, currency)}
              </span>
            </div>
            {hasDiscount && product.compare_price && (
              <span className="pb-0.5 text-[11px] font-medium text-muted-foreground/70 line-through">
                {formatDisplayCurrency(product.compare_price, currency)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              if (!outOfStock) addItem(product);
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground/[0.045] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground transition duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-secondary/70 disabled:text-muted-foreground"
          >
            <ShoppingBag size={15} strokeWidth={2} />
            {outOfStock ? "Currently unavailable" : "Add to bag"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
