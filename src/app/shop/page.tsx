"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { Product, Category } from "@/types";
import { Search, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, ChevronDown, X } from "lucide-react";
import { motion } from "framer-motion";
import { getProducts, getCategories } from "@/utils/supabaseFetch";
import { useSearchParams } from "next/navigation";
import { formatDisplayCurrency } from "@/lib/currency";
import { useDisplayCurrency } from "@/store/currencyStore";
import CurrencySwitcher from "@/components/ui/CurrencySwitcher";

const ShopPage = () => {
    const currency = useDisplayCurrency();
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "all";

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [priceCeiling, setPriceCeiling] = useState(1000);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const itemsPerPage = 6;

    useEffect(() => {
        const requestedCategory = searchParams.get("category") || "all";
        setActiveCategory(requestedCategory);
    }, [searchParams]);

    useEffect(() => {
        async function initShop() {
            try {
                const cats = await getCategories();
                setCategories(cats);
            } catch (error) {
                console.error("Failed to load categories:", error);
                setLoadError(true);
            }
        }
        initShop();
    }, []);

    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            setLoadError(false);
            try {
                const data = await getProducts(activeCategory);
                setProducts(data);
                const maximumPrice = Math.max(
                    1000,
                    ...data.map((product) => Math.ceil(product.price / 50) * 50)
                );
                setPriceCeiling(maximumPrice);
                setPriceRange([0, maximumPrice]);
                setCurrentPage(1); // Reset to page 1 on filter change
            } catch (error) {
                console.error("Failed to load products:", error);
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, [activeCategory]);

    // Filtering & Sorting Logic
    const processedProducts = products
        .filter((p) => {
            const normalizedSearch = searchQuery.trim().toLowerCase();
            const matchesSearch = [
                p.name,
                p.description,
                p.category?.name || "",
            ].some((value) => value.toLowerCase().includes(normalizedSearch));
            const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
            return matchesSearch && matchesPrice;
        })
        .sort((a, b) => {
            if (sortBy === "price-low") return a.price - b.price;
            if (sortBy === "price-high") return b.price - a.price;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    // Pagination Logic
    const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
    const visiblePageCount = Math.min(totalPages, 5);
    const firstVisiblePage = Math.min(
        Math.max(currentPage - 2, 1),
        totalPages - visiblePageCount + 1
    );
    const visiblePages = Array.from(
        { length: visiblePageCount },
        (_, index) => firstVisiblePage + index
    );
    const paginatedProducts = processedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="min-h-screen py-32">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col mb-12">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 uppercase italic">
                        PREMIUM <span className="text-primary italic">CATALOG</span>
                    </h1>
                    <p className="text-foreground/60 max-w-lg font-medium">
                        Engineered for performance, designed for the streets.
                    </p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
                    {/* Sidebar Filters */}
                    <aside className="w-full space-y-7 lg:sticky lg:top-28 lg:w-72 lg:shrink-0 lg:self-start">
                        {/* Search & Sort */}
                        <div className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <div className="relative">
                                <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    aria-label="Search products"
                                    type="text"
                                    placeholder="Search products..."
                                    className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="shop-sort" className="block px-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Sort by</label>
                                <div className="relative">
                                    <select
                                        id="shop-sort"
                                        className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-11 text-sm font-semibold text-foreground outline-none transition hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 [color-scheme:light] dark:[color-scheme:dark]"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option className="bg-background text-foreground" value="newest">Newest drops</option>
                                        <option className="bg-background text-foreground" value="price-low">Price: low to high</option>
                                        <option className="bg-background text-foreground" value="price-high">Price: high to low</option>
                                    </select>
                                    <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                            <CurrencySwitcher />
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <label className="block px-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Categories</label>
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={() => setActiveCategory("all")}
                                    className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${activeCategory === "all" ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                                        }`}
                                >
                                    All Collections
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.slug)}
                                        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${activeCategory === cat.slug ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="shop-price-range" className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Price range</label>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{formatDisplayCurrency(priceRange[1], currency)}</span>
                            </div>
                            <div className="px-1">
                                <input
                                    id="shop-price-range"
                                    type="range"
                                    min="0"
                                    max={priceCeiling}
                                    step="50"
                                    className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        setPriceRange([0, parseInt(e.target.value)]);
                                        setCurrentPage(1);
                                    }}
                                />
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>{formatDisplayCurrency(0, currency)}</span>
                                    <span>{formatDisplayCurrency(priceCeiling, currency)} max</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid & Pagination */}
                    <div className="flex-grow">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-96 rounded-3xl bg-foreground/5 animate-pulse border border-border" />
                                ))}
                            </div>
                        ) : loadError ? (
                            <div role="alert" className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-400">
                                Products could not be loaded. Check the Supabase configuration and database connection, then refresh.
                            </div>
                        ) : paginatedProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
                                    {paginatedProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Lovely Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col items-center gap-10 py-20 border-t border-white/5 mt-20 relative">
                                        {/* Subtle Glow */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                                        <div className="flex max-w-full items-center gap-1.5 sm:gap-3">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => {
                                                    setCurrentPage(1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full glass-morphism transition-all duration-300 group hover:bg-primary hover:text-black hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-10 sm:flex sm:h-14 sm:w-14"
                                                title="First Page"
                                            >
                                                <ChevronsLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                            </button>

                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => {
                                                    setCurrentPage(prev => prev - 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="h-10 w-10 shrink-0 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group sm:h-14 sm:w-14"
                                                title="Previous Page"
                                            >
                                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                            </button>

                                            <div className="flex min-w-0 gap-1 rounded-full border border-border bg-foreground/5 px-2 py-2 backdrop-blur-md sm:gap-3 sm:px-6">
                                                {visiblePages.map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => {
                                                            setCurrentPage(page);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`relative h-8 w-8 shrink-0 rounded-full text-xs font-black transition-all duration-300 group sm:h-10 sm:w-10 ${currentPage === page
                                                            ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                                                            : "hover:bg-foreground/10 text-foreground/40 hover:text-foreground"
                                                            }`}
                                                    >
                                                        {page}
                                                        {currentPage === page && (
                                                            <motion.div
                                                                layoutId="page-indicator"
                                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => {
                                                    setCurrentPage(prev => prev + 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="h-10 w-10 shrink-0 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group sm:h-14 sm:w-14"
                                                title="Next Page"
                                            >
                                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                            </button>

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => {
                                                    setCurrentPage(totalPages);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full glass-morphism transition-all duration-300 group hover:bg-primary hover:text-black hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-10 sm:flex sm:h-14 sm:w-14"
                                                title="Last Page"
                                            >
                                                <ChevronsRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <div className="w-8 h-[1px] bg-foreground/10" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, processedProducts.length)}-{Math.min(currentPage * itemsPerPage, processedProducts.length)} of {processedProducts.length} Results
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-32 glass-card rounded-[3rem]">
                                <h3 className="text-3xl font-black mb-4 uppercase italic">No products found</h3>
                                <p className="text-foreground/40 font-medium">Try adjusting your filters to find your perfect match.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopPage;
