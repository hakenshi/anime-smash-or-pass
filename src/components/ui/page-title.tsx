"use client";

import { m } from "framer-motion";

interface PageTitleProps {
    children: React.ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
    return (
        <m.div 
            className="mb-6 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <m.h1 
                className="text-2xl md:text-3xl font-bold tracking-tight"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <span className="text-gradient-tinder">
                    {children}
                </span>
            </m.h1>
        </m.div>
    );
}
