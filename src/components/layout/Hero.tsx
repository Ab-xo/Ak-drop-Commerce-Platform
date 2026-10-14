"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";

const heroSlides = [
  { id: 1, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=90&w=2400", tag: "New Drop", title: "PREMIUM", titleAccent: "FOOTWEAR", description: "Iconic silhouettes. Exclusive colourways. Step into the latest drops from the world's most coveted sneaker labels." },
  { id: 2, image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=90&w=2400", tag: "Apparel", title: "STREET", titleAccent: "STYLE", description: "Shirts, hoodies, and everyday fits built for Addis Ababa energy. Wear the culture." },
  { id: 3, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=90&w=2400", tag: "Accessories", title: "FINISH", titleAccent: "THE LOOK", description: "Bags, caps, watches, and the details that complete every outfit." },
];

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((slide) => (slide + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const context = gsap.context(() => {
      if (textRef.current?.children) {
        gsap.fromTo(Array.from(textRef.current.children), { opacity: 0, x: -24, filter: "blur(8px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.12, ease: "power3.out" });
      }
    }, heroRef);
    return () => context.revert();
  }, [currentSlide]);

  const slide = heroSlides[currentSlide];
  const nextSlide = () => setCurrentSlide((value) => (value + 1) % heroSlides.length);
  const previousSlide = () => setCurrentSlide((value) => (value - 1 + heroSlides.length) % heroSlides.length);

  return (
    <section ref={heroRef} className="relative flex min-h-[78svh] items-center overflow-hidden bg-background sm:min-h-[86svh] lg:h-screen">
      {heroSlides.map((item, index) => (
        <div key={item.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
          <Image src={item.image} alt={`AK Drop — ${item.tag}`} fill priority={index === 0} sizes="100vw" className="object-cover object-center brightness-[0.82] contrast-[1.08] saturate-[1.08] dark:brightness-[0.5] dark:saturate-100" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.32)_48%,rgba(0,0,0,0.08)_100%)] dark:bg-[linear-gradient(90deg,hsl(var(--background)/0.96)_0%,hsl(var(--background)/0.68)_48%,transparent_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5 dark:from-background/40 dark:to-background/10" />
        </div>
      ))}

      <div className="relative z-20 mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 md:px-12">
        <div ref={textRef} className="max-w-3xl space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-1.5 backdrop-blur-md dark:border-primary/30 dark:bg-background/60">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-black uppercase tracking-[0.18em] text-white dark:text-primary">{slide.tag}</span>
          </div>
          <h1 className="text-5xl font-black uppercase italic leading-[0.88] tracking-tighter text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.45)] sm:text-7xl md:text-8xl dark:text-foreground dark:drop-shadow-none">
            {slide.title}<br /><span className="text-primary">{slide.titleAccent}</span>
          </h1>
          <p className="max-w-xl border-l-4 border-primary pl-4 text-base font-bold uppercase leading-relaxed tracking-tight text-white/90 drop-shadow-md sm:pl-6 sm:text-xl md:text-2xl dark:text-foreground/80 dark:drop-shadow-none">{slide.description}</p>
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/shop" className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-black uppercase italic tracking-widest text-primary-foreground shadow-xl shadow-black/20 transition hover:scale-[1.02] hover:shadow-primary/30 active:scale-95 sm:px-9">Explore shop <ArrowRight size={18} className="transition group-hover:translate-x-1.5" /></Link>
            <Link href="/about" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/35 bg-black/20 px-7 py-4 text-sm font-black uppercase italic tracking-widest text-white backdrop-blur-md transition hover:bg-white/15 active:scale-95 sm:px-9 dark:border-border dark:bg-background/70 dark:text-foreground dark:hover:bg-foreground/10">Our vision <ShoppingBag size={18} /></Link>
          </div>
        </div>
      </div>

      <button onClick={previousSlide} className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/30 bg-black/25 p-3 text-white backdrop-blur-md transition hover:bg-primary sm:block sm:left-5 md:p-4 dark:border-border dark:bg-background/70 dark:text-foreground" aria-label="Previous slide"><ChevronLeft size={20} /></button>
      <button onClick={nextSlide} className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/30 bg-black/25 p-3 text-white backdrop-blur-md transition hover:bg-primary sm:block sm:right-5 md:p-4 dark:border-border dark:bg-background/70 dark:text-foreground" aria-label="Next slide"><ChevronRight size={20} /></button>
      <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5">{heroSlides.map((item, index) => <button key={item.id} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "w-9 bg-primary" : "w-1.5 bg-white/55 dark:bg-foreground/35"}`} aria-label={`Go to slide ${index + 1}`} />)}</div>
    </section>
  );
}
