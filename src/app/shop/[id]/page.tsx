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
    if (product && product.stock > 0) {
      addItem(product);
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
    .filter((image, index, allImages) =>
      typeof image === "string" && image.trim().length > 0 && allImages.indexOf(image) === index
    )
    .slice(0, 4);
  const selectedImage = images[selectedImageIndex] || product.main_image;
  const gallerySlots = Array.from({ length: 4 }, (_, index) => images[index] ?? null);

  return (
    <div className="min-h-screen py-32">
      <div className="container mx-auto px-4">
        <Link
          href="/shop"
          className="mb-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="space-y-6">
            <motion.div
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
              className="group relative aspect-square max-h-[600px] overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-secondary/80 via-secondary/40 to-background shadow-2xl shadow-black/10 sm:rounded-[2.5rem]"
            >
              <Image
                src={getProductImageUrl(selectedImage)}
                alt={`${product.name}, product view ${selectedImageIndex + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-contain p-5 transition-transform duration-300 sm:p-8 ${isHovered || isZoomed ? "scale-150" : "scale-100"}`}
                style={{ transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-background/75 to-transparent px-5 pb-4 pt-12">
                <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                  View {String(selectedImageIndex + 1).padStart(2, "0")} / 04
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomState({ productId: id, zoomed: !isZoomed })}
                aria-label={isZoomed ? "Zoom out of product image" : "Zoom in on product image"}
                aria-pressed={isZoomed}
                className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/85 text-foreground shadow-lg backdrop-blur transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </button>
            </motion.div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4" aria-label="Product image gallery">
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
                  className={`group/thumb relative aspect-square overflow-hidden rounded-2xl border bg-secondary/40 transition ${selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-border opacity-75 hover:border-primary/50 hover:opacity-100"}`}
                >
                  <Image
                    src={getProductImageUrl(image)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 22vw, 120px"
                    className="object-contain p-1.5 transition-transform duration-300 group-hover/thumb:scale-105 sm:p-2"
                  />
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground backdrop-blur">
                    0{index + 1}
                  </span>
                </button>
              ) : (
                <div
                  key={`missing-view-${index}`}
                  role="img"
                  aria-label={`Additional product view ${index + 1} is not available yet`}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-secondary/20 px-1 text-center text-muted-foreground/70"
                >
                  <ImageIcon size={18} strokeWidth={1.5} />
                  <span className="text-[8px] font-semibold leading-tight sm:text-[10px]">More views<br />coming soon</span>
                </div>
              ))}
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
            <p className="mb-2 text-3xl font-black italic text-primary">{formatDisplayCurrency(product.price, currency)}</p>
            <p className="mb-8 text-xs text-muted-foreground">Portfolio display conversion only. Checkout orders are recorded in ETB.</p>
            <p className="mb-12 text-lg font-medium leading-relaxed text-foreground/60">
              {product.description}
            </p>

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
                disabled={product.stock <= 0}
                onClick={handleAddToCart}
                className="btn-primary flex-grow py-5 text-base font-black italic tracking-widest disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-3">
                  <ShoppingCart size={20} />
                  {product.stock <= 0 ? "SOLD OUT" : "ADD TO BAG"}
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
