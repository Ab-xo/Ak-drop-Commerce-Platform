"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch — only render after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-[72px] h-9" />;

    const isDark = resolvedTheme === "dark";

    return (
        <div
            role="group"
            aria-label="Theme switcher"
            className="flex items-center gap-1 bg-foreground/8 border border-border rounded-full p-1"
        >
            {/* Light */}
            <button
                onClick={() => setTheme("light")}
                aria-label="Switch to light mode"
                aria-pressed={!isDark}
                className={`flex items-center justify-center w-8 h-7 rounded-full transition-all duration-200 ${
                    !isDark
                        ? "bg-background shadow text-orange-500"
                        : "text-foreground/40 hover:text-foreground/70"
                }`}
            >
                <Sun size={15} />
            </button>

            {/* Dark */}
            <button
                onClick={() => setTheme("dark")}
                aria-label="Switch to dark mode"
                aria-pressed={isDark}
                className={`flex items-center justify-center w-8 h-7 rounded-full transition-all duration-200 ${
                    isDark
                        ? "bg-background shadow text-blue-400"
                        : "text-foreground/40 hover:text-foreground/70"
                }`}
            >
                <Moon size={15} />
            </button>
        </div>
    );
};

export default ThemeToggle;
