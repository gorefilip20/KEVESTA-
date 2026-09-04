import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Web3Provider } from "@/lib/web3/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kevesta — AI Travel & Relocation Assistant",
  description:
    "Your AI-powered companion for travel guidance, local services, and support. Get personalized recommendations for any destination worldwide.",
  keywords: [
    "travel assistant",
    "relocation",
    "AI travel",
    "local services",
    "destination guide",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
