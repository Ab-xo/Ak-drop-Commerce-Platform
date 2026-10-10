import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AK Drop | Ethiopian Fashion, Footwear & Everyday Style",
  description: "Shop curated shoes, shirts, apparel, accessories, and new drops from AK Drop in Addis Ababa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning><ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange><Toaster position="bottom-right" /><SonnerToaster position="bottom-right" /><Navbar /><CartDrawer /><main className="flex-grow pt-20 md:pt-0">{children}</main><Footer /></ThemeProvider></body></html>;
}
