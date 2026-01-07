import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { MotionProvider } from "@/components/providers/motion-provider";

const spaceGrotesk = Space_Grotesk({ 
    subsets: ["latin"], 
    variable: "--font-sans",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Heartcast - Anime Edition",
    description: "Rate your favorite anime characters. Smash or pass?",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={cn("min-h-screen font-sans antialiased", spaceGrotesk.variable)}>
                <MotionProvider>
                    <Header />
                    <div className="pt-14">
                        {children}
                    </div>
                </MotionProvider>
            </body>
        </html>
    );
}