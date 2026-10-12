"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";

const heroSlides = [
    {
        id: 1,
        // High-res single sneaker hero shot
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=90&w=2400",
        tag: "New Drop",
        title: "PREMIUM",
        titleAccent: "FOOTWEAR",
        description: "Iconic silhouettes. Exclusive colourways. Step into the latest drops from the world's most coveted sneaker labels.",
    },
    {
        id: 2,
        // High-res streetwear / apparel lifestyle shot
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=90&w=2400",
        tag: "Apparel",
        title: "STREET",
        titleAccent: "STYLE",
        description: "Shirts, hoodies, and everyday fits built for Addis Ababa energy. Wear the culture.",
    },
    {
        id: 3,
        // High-res accessories / watch / bag lifestyle
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=90&w=2400",
        tag: "Accessories",
        title: "FINISH",
        titleAccent: "THE LOOK",
        description: "Bags, caps, watches, and the details that complete every outfit. Curated accessories for every occasion.",
    },
];

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-rotate slides
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // Animate on slide change
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Staggered Text Animations
            const elements = textRef.current?.children;
            if (elements) {
                gsap.fromTo(Array.from(elements),
                    { opacity: 0, x: -50, filter: "blur(10px)" },
                    {
                        opacity: 1,
                        x: 0,
                        filter: "blur(0px)",
                        duration: 1.2,
                        stagger: 0.2,
                        ease: "power4.out",
                    }
                );
            }
        }, heroRef);

        return () => ctx.revert();
    }, [currentSlide]);

    const currentSlideData = heroSlides[currentSlide];

    // Navigation functions
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    };

    return (
        <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden bg-background">
            {/* Background Images with Transitions */}
            {heroSlides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <Image
                        src={slide.image}
                        alt={`AK Drop — ${slide.tag}`}
                        fill
                        priority={index === 0}
                        sizes="100vw"
                        className="object-cover opacity-100 dark:opacity-40 saturate-[1.15] dark:saturate-100 brightness-[0.85] dark:brightness-100"
                    />
                    {/* Dark mode: white-to-transparent gradient covers left side */}
                    <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
                    {/* Light mode: dark scrim so image stays vivid and text is readable */}
                    <div className="absolute inset-0 dark:hidden z-10"
                        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)" }}
                    />
                </div>
            ))}

            <div className="container mx-auto px-4 md:px-12 z-20">
                <div ref={textRef} className="max-w-3xl space-y-10">
                    <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-primary text-xs font-black uppercase tracking-widest">
                            {currentSlideData.tag}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-foreground dark:text-foreground light:text-white drop-shadow-md">
                        {currentSlideData.title}<br />
                        <span className="text-primary drop-shadow-md">{currentSlideData.titleAccent}</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-foreground/90 dark:text-foreground/80 font-bold uppercase tracking-tight max-w-xl border-l-4 border-primary pl-6 drop-shadow-sm">
                        {currentSlideData.description}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <Link
                            href="/shop"
                            className="group relative px-10 py-5 bg-primary text-primary-foreground font-black rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 uppercase italic tracking-widest flex items-center gap-3"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Explore Shop <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 opacity-20" />
                        </Link>

                        <Link
                            href="/about"
                            className="px-10 py-5 glass-morphism rounded-full font-black text-foreground hover:bg-foreground/10 transition-all active:scale-95 uppercase italic tracking-widest border border-border flex items-center gap-3"
                        >
                            Our Vision <ShoppingBag size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 dark:bg-background/80 backdrop-blur-lg rounded-full hover:bg-primary hover:text-primary-foreground transition-all border border-white/20 dark:border-border hover:scale-110 active:scale-95 text-white dark:text-foreground"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-4 bg-black/30 dark:bg-background/80 backdrop-blur-lg rounded-full hover:bg-primary hover:text-primary-foreground transition-all border border-white/20 dark:border-border hover:scale-110 active:scale-95 text-white dark:text-foreground"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>

            {/* Slide Navigation Dots */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                            ? 'w-12 bg-primary'
                            : 'w-2 bg-foreground/30 hover:bg-foreground/50'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Subtle Scroll Indicator */}
            <div className="absolute bottom-10 right-12 hidden md:flex flex-col items-center gap-4 text-foreground/30">
                <span className="text-[10px] uppercase font-black tracking-[0.3em] vertical-text">Scroll</span>
                <div className="w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
            </div>
        </section>
    );
}
