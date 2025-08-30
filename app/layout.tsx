import type { Metadata } from "next";
import { Poppins , Space_Grotesk , Urbanist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Web3Provider } from "@/contexts/Web3Context";


const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
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
        className={`${urbanist.variable} ${spaceGrotesk.variable} ${poppins.variable} antialiased`}
      >
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen bg-gray-50 font-poppins pt-15">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
