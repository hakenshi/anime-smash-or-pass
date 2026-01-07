"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";

export function Header() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Play" },
        { href: "/results", label: "Rankings" },
    ];

    return (
        <m.header 
            className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <m.div 
                        className="w-8 h-8 gradient-tinder rounded-lg flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <m.svg 
                            className="w-5 h-5 text-white" 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </m.svg>
                    </m.div>
                    <m.span 
                        className="text-lg font-bold text-gradient-tinder hidden sm:inline"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Heartcast
                    </m.span>
                </Link>

                {/* Nav */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href || 
                            (item.href === "/" && pathname === "/play");
                        
                        return (
                            <m.div
                                key={item.href}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                            >
                                <Link 
                                    href={item.href} 
                                    className={`relative px-3 py-1.5 text-sm transition-colors rounded-lg ${
                                        isActive 
                                            ? "text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <m.div
                                            className="absolute inset-0 bg-secondary rounded-lg -z-10"
                                            layoutId="nav-active"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            </m.div>
                        );
                    })}
                </nav>
            </div>
        </m.header>
    );
}
