'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, FolderOpen, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCategories } from '@/utils/supabaseFetch';
import type { Category } from '@/types';

const CATEGORY_IMAGES: Record<string, string> = {
  footwear:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  shoes:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  shirts:
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',
  apparel:
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=85',
  pants:
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85',
  outerwear:
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1000&q=85',
  bags:
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85',
  accessories:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85',
  electronics:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=85',
  sports:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=85',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  footwear: 'From performance runners to street icons. Step into the future.',
  shoes: 'From performance runners to street icons. Step into the future.',
  apparel: 'Engineered style for the modern explorer. Technical and timeless.',
  clothing: 'Engineered style for the modern explorer. Technical and timeless.',
  accessories: 'Fine-tune your identity with a curated selection of everyday essentials.',
  limited: 'Rare finds and standout collaborations, selected for a limited time.',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadCategories() {
      setIsLoading(true);
      setHasError(false);
      try {
        const result = await getCategories();
        if (isCurrent) setCategories(result);
      } catch (error) {
        console.error('Failed to load categories:', error);
        if (isCurrent) setHasError(true);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadCategories();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  return (
    <section className="min-h-screen py-24 sm:py-28">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-12 sm:mb-16">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-primary">
            Discover AK Drop
          </p>
          <h1 className="mb-5 text-5xl font-black uppercase italic tracking-tighter sm:text-6xl lg:text-8xl">
            Curated <span className="text-primary">Collections</span>
          </h1>
          <p className="max-w-2xl text-base font-medium leading-7 text-foreground/60 sm:text-lg">
            Explore the collections available in our catalog, selected for style,
            comfort, and everyday wear.
          </p>
        </header>

        {isLoading ? (
          <div aria-label="Loading categories" className="grid gap-6 md:grid-cols-2 lg:gap-10">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="aspect-[16/9] animate-pulse rounded-[2rem] bg-secondary"
              />
            ))}
          </div>
        ) : hasError ? (
          <div
            role="alert"
            className="rounded-3xl border border-border bg-card px-6 py-12 text-center"
          >
            <p className="font-semibold">Categories couldn&apos;t be loaded.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <FolderOpen className="mx-auto text-muted-foreground" size={32} />
            <h2 className="mt-4 text-lg font-bold">No collections yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New categories will appear here when they are added to the catalog.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Browse all products <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:gap-10">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.08, 0.32) }}
                viewport={{ once: true }}
              >
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  aria-label={`Shop ${category.name}`}
                  className="group relative block aspect-[16/10] overflow-hidden rounded-[2rem] border border-border bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:aspect-[16/9]"
                >
                  <Image
                    src={
                      category.image_url ||
                      CATEGORY_IMAGES[category.slug.toLowerCase()] ||
                      CATEGORY_IMAGES.footwear
                    }
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent transition-colors duration-500 group-hover:from-black/90" />
                  <div className="absolute inset-0 flex items-end justify-between gap-4 p-6 text-white sm:p-9 lg:p-10">
                    <div className="max-w-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary sm:mb-3">
                        Explore collection
                      </p>
                      <h2 className="mb-2 text-3xl font-black uppercase italic tracking-tight sm:text-4xl lg:text-5xl">
                        {category.name}
                      </h2>
                      <p className="max-h-0 overflow-hidden text-sm font-medium leading-relaxed text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100 sm:text-base">
                        {category.description ||
                          CATEGORY_DESCRIPTIONS[category.slug.toLowerCase()] ||
                          `Explore the ${category.name} collection at AK Drop.`}
                      </p>
                    </div>
                    <span className="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition duration-300 group-hover:rotate-[-45deg] group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:h-16 sm:w-16">
                      <ArrowRight size={23} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
