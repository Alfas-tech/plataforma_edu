import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aprende Code",
  description:
    "Plataforma para introducción a la programación con python desde cero",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showAnalytics =
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID?.trim());

  return (
    <html lang="en">
      <body className={cn("bg-background", inter.className)}>
        {children}
        {showAnalytics ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
