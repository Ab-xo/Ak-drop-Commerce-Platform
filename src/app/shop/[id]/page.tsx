"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getProductById } from "@/utils/supabaseFetch";
import { getProductImageUrl } from "@/utils/imageUtils";
import { Product } from "@/types";
import { formatDisplayCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";
import { getAvailableProductStock, getVariantLabel, getVariantPrice } from "@/lib/product-variants";
import type { ProductVariant } from "@/types";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const addItem = useCartStore((state) => state.addItem);
  const currency = useDisplayCurrency();
  const [productState, setProductState] = useState<{
    id: string;
    product: Product | null;
    error: boolean;
    loading: boolean;
  }>({ id, product: null, error: false, loading: true });
  const [gallerySelection, setGallerySelection] = useState({ productId: id, index: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [zoomState, setZoomState] = useState({ productId: id, zoomed: false });
  const [variantSelection, setVariantSelection] = useState<{ productId: string; variantId: string | null }>({
    productId: id,
    variantId: null,
  });

  useEffect(() => {
    let cancelled = false;

    getProductById(id)
      .then((result) => {
        if (!cancelled) {
          setProductState({ id, product: result, error: false, loading: false });
        }
      })
      .catch((error) => {
        console.error("Failed to load product:", error);
        if (!cancelled) {
          setProductState({ id, product: null, error: true, loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentProductState = productState.id === id ? productState : null;
  const product = currentProductState?.product ?? null;
  const selectedVariant = product && variantSelection.productId === id
    ? product.variants?.find((variant) => variant.id === variantSelection.variantId) ?? null
    : null;
  const loading = !currentProductState || currentProductState.loading;
  const loadError = currentProductState?.error ?? false;

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((event.clientX - left) / width) * 100,
      y: ((event.clientY - top) / height) * 100,
    });
  };

  const handleAddToCart = () => {
    if (product && (!product.variants?.length || selectedVariant) && getAvailableProductStock(product) > 0) {
      addItem(product, selectedVariant);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-3xl font-black italic">PRODUCT COULD NOT BE LOADED</h1>
        <p role="alert" className="mb-6 text-foreground/60">
          Check the Supabase configuration and database connection, then try again.
        </p>
        <Link href="/shop" className="btn-primary italic">BACK TO SHOP</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-6 text-4xl font-black italic">PRODUCT NOT FOUND</h1>
        <Link href="/shop" className="btn-primary italic">BACK TO SHOP</Link>
      </div>
    );
  }

  const selectedImageIndex = gallerySelection.productId === id ? gallerySelection.index : 0;
  const isZoomed = zoomState.productId === id && zoomState.zoomed;
  const images = [product.main_image, ...(product.images ?? [])]
    .filter((image, index, all) =>
      typeof image === 'string' && image.trim().length > 0 && all.indexOf(image) === index
    )
    .slice(0, 4);
  const selectedImage = images[selectedImageIndex] || product.main_image;
  const gallerySlots = Array.from({ length: 4 }, (_, index) => images[index] ?? null);
  const selectedPrice = selectedVariant ? getVariantPrice(product.price, selectedVariant) : product.price;

  return (
    <div className="min-h-screen py-28 sm:py-32">
      <div className="container mx-auto px-4">
        <Link
          href="/shop"
          className="mb-10 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:gap-16">

          {/* ── Gallery column ── */}
          <div className="flex gap-3 sm:gap-4">

            {/* Vertical thumbnail strip */}
            <div className="flex shrink-0 flex-col gap-2.5 sm:gap-3" aria-label="Product image gallery">
              {gallerySlots.map((image, index) => image ? (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => {
                    setGallerySelection({ productId: id, index });
                    setZoomState({ productId: id, zoomed: false });
                  }}
                  aria-label={`Show image ${index + 1} of ${product.name}`}
                  aria-pressed={selectedImageIndex === index}
                  className={`group/thumb relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:size-20
                    ${selectedImageIndex === index
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-border/40 hover:border-primary/40"}`}
                >
                  <Image
                    src={getProductImageUrl(image)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105"
                  />
                  {/* Active indicator line */}
                  {selectedImageIndex === index && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                  )}
                </button>
              ) : (
                <div
                  key={`missing-${index}`}
                  className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-secondary/20 text-muted-foreground/40 sm:size-20"
                >
                  <ImageIcon size={14} strokeWidth={1.5} />
                </div>
              ))}
            </div>

            {/* Main image — full bleed, covers the entire area */}
            <div className="min-w-0 flex-1">
              <motion.div
                key={`${id}-${selectedImageIndex}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseMove={handleMouseMove}
                className="group relative w-full overflow-hidden rounded-2xl bg-secondary shadow-2xl shadow-black/15 sm:rounded-3xl"
                style={{ aspectRatio: '1/1' }}
              >
                <Image
                  src={getProductImageUrl(selectedImage)}
                  alt={`${product.name}, view ${selectedImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 85vw, 45vw"
                  className={`object-cover object-top transition-transform duration-500
                    ${isHovered || isZoomed ? "scale-[1.1]" : "scale-100"}`}
                  style={{ transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
                />

                {/* gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

                {/* View counter badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    {String(selectedImageIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </span>
                </div>

                {/* Zoom button */}
                <button
                  type="button"
                  onClick={() => setZoomState({ productId: id, zoomed: !isZoomed })}
                  aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                  aria-pressed={isZoomed}
                  className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                </button>

                {/* Navigation arrows for mobile */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setGallerySelection({ productId: id, index: (selectedImageIndex - 1 + images.length) % images.length })}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 sm:hidden"
                      aria-label="Previous image"
                    >
                      <ArrowLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGallerySelection({ productId: id, index: (selectedImageIndex + 1) % images.length })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70 sm:hidden"
                      aria-label="Next image"
                    >
                      <ArrowLeft size={15} className="rotate-180" />
                    </button>
                  </>
                )}
              </motion.div>

              {/* Dot indicators for mobile */}
              <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGallerySelection({ productId: id, index: i })}
                    className={`h-1.5 rounded-full transition-all ${i === selectedImageIndex ? 'w-5 bg-primary' : 'w-1.5 bg-border'}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6 flex items-center gap-4">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                {product.is_new_arrival ? "New Arrival" : "AK Drop Select"}
              </span>
              <div className="flex items-center text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} fill="currentColor" />
                ))}
              </div>
            </div>
            <h1 className="mb-4 text-5xl font-black uppercase italic tracking-tighter md:text-7xl">
              {product.name}
            </h1>
            <p className="mb-2 text-3xl font-black italic text-primary">{formatDisplayCurrency(selectedPrice, currency)}</p>
            <p className="mb-8 text-xs text-muted-foreground">Portfolio display conversion only. Checkout orders are recorded in ETB.</p>
            <p className="mb-12 text-lg font-medium leading-relaxed text-foreground/60">
              {product.description}
            </p>

            {product.variants?.length ? (
              <fieldset className="mb-10 space-y-3">
                <legend className="text-sm font-bold">Choose an option</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {product.variants.map((variant: ProductVariant) => {
                    const unavailable = variant.stock_quantity <= 0;
                    const selected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={unavailable}
                        aria-pressed={selected}
                        onClick={() => {
                          setVariantSelection({ productId: id, variantId: variant.id });
                        const variantImages = [product.main_image, variant.image_url, ...(product.images ?? [])]
                          .filter((image, imageIndex, allImages) =>
                            typeof image === "string" && image.trim().length > 0 && allImages.indexOf(image) === imageIndex
                          );
                        setGallerySelection({
                          productId: id,
                          index: variant.image_url ? Math.max(variantImages.indexOf(variant.image_url), 0) : 0,
                        });
                        }}
                        className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}
                      >
                        <span className="font-semibold">{getVariantLabel(variant)}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {unavailable ? "Sold out" : formatDisplayCurrency(getVariantPrice(product.price, variant), currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="mb-12 space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-primary">
                Product details
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {product.features?.length ? (
                  product.features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className="text-sm italic text-foreground/40">
                    Quality materials selected for everyday wear.
                  </li>
                )}
              </ul>
            </div>

            <div className="mb-12 flex flex-col gap-6 sm:flex-row">
              <button
                disabled={getAvailableProductStock(product) <= 0 || (Boolean(product.variants?.length) && !selectedVariant)}
                onClick={handleAddToCart}
                className="btn-primary flex-grow py-5 text-base font-black italic tracking-widest disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-3">
                  <ShoppingCart size={20} />
                  {getAvailableProductStock(product) <= 0
                    ? "SOLD OUT"
                    : product.variants?.length && !selectedVariant
                      ? "SELECT AN OPTION"
                      : "ADD TO BAG"}
                </span>
              </button>
              <button aria-label="Save product" className="glass-morphism rounded-full px-8 py-5 hover:bg-foreground/10">
                <Heart size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Truck className="text-primary/60" size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Delivery options at checkout</span>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <RefreshCw className="text-primary/60" size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Easy returns</span>
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <ShieldCheck className="text-primary/60" size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Secure checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
