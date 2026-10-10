"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-10 h-10" />;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors relative overflow-hidden"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon size={20} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun size={20} className="text-orange-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
};

export default ThemeToggle;
