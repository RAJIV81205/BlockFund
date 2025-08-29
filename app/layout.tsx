import type { Metadata } from "next";
import { Geist, Geist_Mono ,Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Web3Provider } from "@/contexts/Web3Context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BlockFund - Decentralized Crowdfunding",
  description: "Create and fund campaigns on the blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen bg-gray-50 font-poppins">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
