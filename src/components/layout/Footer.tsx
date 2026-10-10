import Link from "next/link";
import { Youtube, Instagram, Twitter, Facebook } from "lucide-react";
import Image from "next/image";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-secondary/30 border-t border-border pt-16 pb-8 mt-auto">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        {/* Logo - Modern AK ECOMM Design */}
                        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity group mb-6 block">
                            {/* AK Monogram with accent */}
                            <div className="flex items-center">
                                <div className="relative">
                                    <span className="text-2xl font-black tracking-tight text-foreground">
                                        A
                                    </span>
                                    <span className="text-2xl font-black tracking-tight text-foreground relative">
                                        K
                                        {/* Subtle accent triangle */}
                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary transform rotate-45"></div>
                                    </span>
                                </div>
                                
                                {/* Separator line */}
                                <div className="w-px h-5 bg-border mx-2"></div>
                                
                                {/* ECOMM text */}
                                <span className="text-lg font-semibold tracking-wide text-foreground/90 uppercase">
                                    ECOMM
                                </span>
                            </div>
                        </Link>
                        <p className="text-foreground/80 text-sm leading-relaxed mb-6 font-bold">
                            Your destination for premium products across footwear, fashion, electronics, accessories, and everyday essentials. We curate the best for your lifestyle.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="#" className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                                <Youtube size={18} />
                            </Link>
                            <Link href="#" className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                                <Instagram size={18} />
                            </Link>
                            <Link href="#" className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                                <Twitter size={18} />
                            </Link>
                            <Link href="#" className="p-2 bg-foreground/5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all">
                                <Facebook size={18} />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Shop</h4>
                        <ul className="space-y-4">
                            <li><Link href="/shop" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">All Products</Link></li>
                            <li><Link href="/categories/footwear" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Footwear</Link></li>
                            <li><Link href="/categories/fashion" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Fashion</Link></li>
                            <li><Link href="/categories/electronics" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Electronics</Link></li>
                            <li><Link href="/categories/accessories" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Accessories</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Support</h4>
                        <ul className="space-y-4">
                            <li><Link href="/contact" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Contact Us</Link></li>
                            <li><Link href="/faq" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">FAQs</Link></li>
                            <li><Link href="/shipping" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Shipping Policy</Link></li>
                            <li><Link href="/returns" className="text-foreground/80 hover:text-primary transition-colors text-sm font-bold">Returns & Refunds</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest">Newsletter</h4>
                        <p className="text-foreground/60 text-sm mb-6">Subscribe to get updates on new drops and exclusive offers.</p>
                        <form className="flex">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="bg-foreground/5 border border-border rounded-l-full px-4 py-2 text-sm focus:outline-none focus:border-primary w-full"
                            />
                            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-r-full text-sm font-bold hover:opacity-90 transition-opacity">
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-foreground/40">
                    <p>© {currentYear} AK ECOMM. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-foreground/60 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-foreground/60 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
