"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, ShieldCheck, Heart, TrendingUp, Truck } from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
    const features = [
        {
            icon: <ShoppingCart className="text-primary" size={32} />,
            title: "Online Order",
            desc: "Discover the perfect pair from the comfort of your home with our user-friendly interface and extensive product catalog. Simply navigate through our curated selection of shoes, add your favorites to the virtual shopping cart, and proceed to our secure checkout process."
        },
        {
            icon: <Zap className="text-primary" size={32} />,
            title: "Promotions",
            desc: "Dive into a world of savings with our Promotions Feature Service! Discover unbeatable deals on a variety of products, from fashion essentials to must-have gadgets. Take advantage of exclusive discounts, flash sales, and special offers."
        },
        {
            icon: <ShieldCheck className="text-primary" size={32} />,
            title: "24/7 Support",
            desc: "Step confidently with our 24/7 Support Shoe Feature Service! Our dedicated support team is ready around the clock to assist you with any inquiries, ensuring a seamless shopping experience. From finding the perfect fit to tracking your order."
        },
        {
            icon: <Heart className="text-primary" size={32} />,
            title: "Happy Sale",
            desc: "Indulge in the joy of shopping with our Happy Sale Shoe Feature Service! Uncover delightful discounts and cheerful promotions that transform your shoe-shopping experience into a celebration. Embrace happiness with each step."
        },
        {
            icon: <TrendingUp className="text-primary" size={32} />,
            title: "Save Money",
            desc: "Save big on style with our Money-Saving Shoe Feature Service! Explore our curated collection where affordability meets fashion. Enjoy budget-friendly options without compromising on quality. Step into savings!"
        },
        {
            icon: <Truck className="text-primary" size={32} />,
            title: "Free Shipping",
            desc: "Experience the freedom of Free Shipping with our Shoe Feature Service! Elevate your footwear collection without the extra cost—enjoy complimentary shipping on every order. Walk with ease, knowing your fashion-forward choices come free."
        },
    ];

    return (
        <div className="bg-background text-foreground min-h-screen">
            {/* Page Header */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2000"
                    alt="About Header"
                    fill
                    className="object-cover opacity-40 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 text-center px-4"
                >
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">
                        #KNOWN <span className="text-primary">US</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto font-medium">
                        Step into Our World. Crafting Style, Comfort, and Stories in Every Step!
                    </p>
                </motion.div>
            </section>

            {/* Who We Are Section */}
            <section className="py-24 px-4 container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-[3rem] overflow-hidden border border-border shadow-2xl"
                    >
                        <Image
                            src="/img/istockphoto-1695287043-612x612.jpg"
                            alt="Who We Are"
                            fill
                            className="object-cover"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                                Who <span className="text-primary">We Are?</span>
                            </h2>
                            <div className="w-20 h-1.5 bg-primary rounded-full" />
                        </div>

                        <div className="space-y-6 text-lg text-foreground/70 leading-relaxed font-medium">
                            <p>
                                Welcome to <span className="text-foreground font-bold">AK Drop</span>, where every step is a statement of style and comfort.
                                Our passion for footwear goes beyond trends; it&apos;s about curating a collection that
                                reflects your individuality. Established in 2024, we&apos;ve been on a mission to redefine
                                your shoe-shopping experience.
                            </p>
                            <p>
                                At <span className="text-foreground font-bold">AK Drop</span>, we believe that each pair of shoes carries a unique story. Our
                                carefully curated selection encompasses everything from casual kicks to sophisticated
                                heels, ensuring that you can find the perfect pair for every occasion. Quality is our
                                cornerstone.
                            </p>
                            <div className="glass-card p-8 border-l-4 border-primary">
                                <p className="text-foreground italic">
                                    &quot;What sets us apart is not just our footwear but the personalized service you receive.
                                    Our team is dedicated to assisting you in finding the ideal fit, offering insights into the
                                    latest trends, and ensuring your satisfaction with every purchase.&quot;
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Scrolling Marquee - Modern Implementation */}
            <div className="bg-primary/5 border-y border-border py-6 overflow-hidden">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-12 px-6">
                            <span className="text-sm font-black uppercase tracking-widest text-primary/60">
                                Beyond our storefront, we are deeply rooted in the community.
                            </span>
                            <span className="text-sm font-black uppercase tracking-widest text-primary/60">
                                Engaging in local events and supporting charitable initiatives.
                            </span>
                            <span className="text-sm font-black uppercase tracking-widest text-primary/60">
                                We invite you to become a part of the AK Drop family.
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* By The Numbers Section */}
            <section className="py-24 px-4 bg-foreground/[0.02] border-y border-border">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="space-y-2"
                        >
                            <span className="text-6xl md:text-7xl font-black text-primary italic">500+</span>
                            <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Curated Items</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="space-y-2"
                        >
                            <span className="text-6xl md:text-7xl font-black text-primary italic">24/7</span>
                            <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Expert Support</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2"
                        >
                            <span className="text-6xl md:text-7xl font-black text-primary italic">Global</span>
                            <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Fast Shipping</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 container mx-auto bg-background">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
                        Our <span className="text-primary">Features</span>
                    </h2>
                    <p className="text-foreground/60 max-w-xl mx-auto">Discover the services that make shopping at Ak Brothers a premium experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card group hover:bg-foreground/5 transition-all duration-500"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary transition-colors group-hover:text-black">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tighter group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-foreground/60 leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-primary text-primary-foreground">
                <div className="container mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8 leading-none">
                        READY TO START<br />YOUR STORY?
                    </h2>
                    <Link href="/shop" className="px-12 py-5 bg-background text-foreground font-black uppercase italic tracking-widest rounded-full hover:scale-110 active:scale-95 transition-all inline-block shadow-lg">
                        SHOP THE COLLECTION
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
