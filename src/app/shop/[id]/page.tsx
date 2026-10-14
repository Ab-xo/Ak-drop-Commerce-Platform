"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { getProductById } from "@/utils/supabaseFetch";
import { getProductImageUrl } from "@/utils/imageUtils";
import { Product } from "@/types";

const formatEtb = (value: number) =>
  `ETB ${new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 }).format(value)}`;

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const addItem = useCartStore((state) => state.addItem);
  const [productState, setProductState] = useState<{
    id: string;
    product: Product | null;
    error: boolean;
    loading: boolean;
  }>({ id, product: null, error: false, loading: true });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

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
      toast.success(`${product.name} added to your bag`);
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

  const images = product.images?.length ? product.images : [product.main_image];
  const selectedImage = images[selectedImageIndex] || product.main_image;

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
              className="relative h-[600px] cursor-crosshair overflow-hidden rounded-[2.5rem] border border-border shadow-2xl"
            >
              <Image
                src={getProductImageUrl(selectedImage)}
                alt={product.name}
                fill
                priority
                className={`object-cover transition-transform duration-200 ${isHovered ? "scale-150" : "scale-100"}`}
                style={{ transformOrigin: `${mousePos.x}% ${mousePos.y}%` }}
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Show image ${index + 1} of ${product.name}`}
                  className={`relative h-24 overflow-hidden rounded-xl border ${selectedImageIndex === index ? "border-primary" : "border-border opacity-60"}`}
                >
                  <Image
                    src={getProductImageUrl(image)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
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
            <p className="mb-8 text-3xl font-black italic text-primary">{formatEtb(product.price)}</p>
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
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Addis delivery</span>
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
