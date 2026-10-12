"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, ShieldCheck, Heart, TrendingUp, Truck } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <ShoppingCart size={32} />,
    title: "Easy online ordering",
    desc: "Browse shoes, shirts, apparel, and accessories from your phone or laptop, then add your favourites to a simple shopping bag.",
  },
  {
    icon: <Zap size={32} />,
    title: "Fresh drops & offers",
    desc: "Discover new arrivals, limited releases, and practical offers curated for everyday style in Ethiopia.",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Trusted support",
    desc: "Our team helps with fit, product details, availability, and order questions before and after your purchase.",
  },
  {
    icon: <Heart size={32} />,
    title: "Style with personality",
    desc: "We select pieces that let customers express their own taste instead of following one narrow trend.",
  },
  {
    icon: <TrendingUp size={32} />,
    title: "Fair ETB pricing",
    desc: "Clear Ethiopian Birr pricing helps shoppers compare products confidently without hidden currency surprises.",
  },
  {
    icon: <Truck size={32} />,
    title: "Addis-focused delivery",
    desc: "We are building a convenient local shopping experience for Addis Ababa customers, with delivery information made clear.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2000"
          alt="AK Drop footwear collection"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4"
        >
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">
            ABOUT <span className="text-primary">AK DROP</span>
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto font-medium">
            A modern Ethiopian storefront for shoes, apparel, accessories, and everyday personal style.
          </p>
        </motion.div>
      </section>

      {/* BUILT FOR YOUR EVERYDAY — image left, text right */}
      <section className="py-24 px-4 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[600px] rounded-[3rem] overflow-hidden border border-border shadow-2xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=85&w=1400"
              alt="AK Drop everyday style"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>

          {/* Right text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                BUILT FOR <span className="text-primary">YOUR EVERYDAY</span>
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full" />
            </div>

            <div className="space-y-6 text-lg text-foreground/70 leading-relaxed font-medium">
              <p>
                AK Drop brings together footwear, shirts, apparel, bags, and accessories in one
                product-first shopping experience. We are inspired by Addis Ababa&apos;s energy and
                by customers who want modern style without a complicated buying journey.
              </p>
              <p>
                Our goal is to make discovery easier: useful product details, ETB prices, clear
                availability, local support, and a catalogue that keeps growing beyond shoes.
              </p>
              <div className="glass-card p-8 border-l-4 border-primary">
                <p className="text-foreground italic">
                  &quot;Good style should feel personal, practical, and easy to access.&quot;
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Marquee */}
      <div className="bg-primary/5 border-y border-border py-6 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <span className="text-sm font-black uppercase tracking-widest text-primary/60">Curated in Ethiopia</span>
              <span className="text-sm font-black uppercase tracking-widest text-primary/60">Prices in Ethiopian Birr</span>
              <span className="text-sm font-black uppercase tracking-widest text-primary/60">Made for Addis style</span>
              <span className="text-sm font-black uppercase tracking-widest text-primary/60">New drops coming soon</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="py-24 px-4 bg-foreground/[0.02] border-y border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <span className="text-6xl md:text-7xl font-black text-primary italic">ETB</span>
              <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Local pricing</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <span className="text-6xl md:text-7xl font-black text-primary italic">24/7</span>
              <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Online browsing</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <span className="text-6xl md:text-7xl font-black text-primary italic">ADDIS</span>
              <p className="text-lg font-black uppercase tracking-widest text-foreground/40">Delivery focus</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
            OUR <span className="text-primary">PROMISE</span>
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto">
            The details that make AK Drop feel useful, welcoming, and ready for real everyday shopping.
          </p>
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
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:bg-primary transition-colors">
                <span className="text-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tighter group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-foreground/60 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8 leading-none">
            FIND YOUR<br />NEXT FAVOURITE
          </h2>
          <Link
            href="/shop"
            className="px-12 py-5 bg-background text-foreground font-black uppercase italic tracking-widest rounded-full hover:scale-110 active:scale-95 transition-all inline-block shadow-lg"
          >
            SHOP AK DROP
          </Link>
        </div>
      </section>

    </div>
  );
}
