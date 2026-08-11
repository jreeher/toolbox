import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { ToolboxNav } from "@/components/ToolboxNav";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "The Toolbox — Build Something Worth Nailing",
  description: "A community for woodworkers to share projects, tips, and plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bebasNeue.variable} ${inter.variable} font-body relative min-h-screen`}>
        <div
          className="fixed inset-0 -z-10 bg-charcoal bg-cover bg-center bg-fixed opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1504148455328-c376907d081c)",
          }}
        />
        <ToolboxNav />
        <main className="relative pt-16">{children}</main>
      </body>
    </html>
  );
}
