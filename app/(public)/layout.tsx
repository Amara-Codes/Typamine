import type { Metadata } from "next";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "TYPAMINE // Typographic Lab & Font Aggregator",
  description: "A high-performance technical typographic playground and curated font laboratory. Test, pair, and formulate typography at the edge.",
};

export default function PublicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", inter.variable)}>
      <head>
        {/* Dynamic theme-based favicons */}
        <link rel="icon" href="/icon-dark.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/icon.png" media="(prefers-color-scheme: light)" />
        
        {/* Inline script to prevent theme hydration flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('typamine-theme');
                if (saved === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#ff3131] selection:text-white relative scanline">
        
        <Header />

        {/* MAIN LAB BENCH CONTENT */}
        <main className="flex-grow flex flex-col transition-colors duration-300">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}
