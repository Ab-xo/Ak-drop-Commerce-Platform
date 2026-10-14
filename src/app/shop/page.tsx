"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { Product, Category } from "@/types";
import { Search, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";
import { getProducts, getCategories } from "@/utils/supabaseFetch";
import { useSearchParams } from "next/navigation";

const ShopPage = () => {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "all";

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [searchQuery, setSearchQuery] = useState("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const itemsPerPage = 6;

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
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
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

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-80 space-y-10">
                        {/* Search & Sort */}
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search gear..."
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2">Sort By</label>
                                <select
                                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-primary appearance-none hover:bg-foreground/10 transition-colors"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest Drops</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2">Categories</label>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setActiveCategory("all")}
                                    className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                        }`}
                                >
                                    All Collections
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.slug)}
                                        className={`w-full text-left px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeCategory === cat.slug ? "bg-primary text-primary-foreground" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2">Price Range</label>
                            <div className="px-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    step="50"
                                    className="w-full accent-primary h-1.5 bg-foreground/10 rounded-lg appearance-none cursor-pointer mb-4"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                />
                                <div className="flex justify-between text-xs font-black text-primary uppercase">
                                    <span>$0</span>
                                    <span>Up to ${priceRange[1]}</span>
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

                                        <div className="flex items-center gap-3">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => {
                                                    setCurrentPage(1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="w-14 h-14 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group"
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
                                                className="w-14 h-14 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group"
                                                title="Previous Page"
                                            >
                                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                            </button>

                                            <div className="flex gap-3 px-6 py-2 bg-foreground/5 rounded-full border border-border backdrop-blur-md">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => {
                                                            setCurrentPage(page);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`w-10 h-10 rounded-full font-black text-xs transition-all duration-300 relative group ${currentPage === page
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
                                                className="w-14 h-14 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group"
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
                                                className="w-14 h-14 rounded-full glass-morphism flex items-center justify-center disabled:opacity-10 disabled:cursor-not-allowed hover:bg-primary hover:text-black hover:scale-110 active:scale-90 transition-all duration-300 group"
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
                                <h3 className="text-3xl font-black mb-4 uppercase italic">No tactical gear found</h3>
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
