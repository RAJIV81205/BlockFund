"use client";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";

export default function Navbar() {
  const { account, isConnecting, connectWallet, isConnected } = useWeb3();

  return (
    <nav className=" border-b border-gray-200 font-space-grotesk absolute w-full bg-white">
      <div className="container mx-auto px-8 py-3 w-[85vw] ">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-semibold text-black">
            BlockFund
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-12">
            <Link
              href="/campaigns"
              className="text-gray-700 hover:text-black font-medium"
            >
              Campaigns
            </Link>
            <Link
              href="/my-campaigns"
              className="text-gray-700 hover:text-black font-medium"
            >
              My Campaigns
            </Link>
          </div>

          {/* Account/Connect Section */}
          <div>
            {isConnected ? (
              <div className="flex items-center space-x-3 border border-gray-300 rounded-lg px-4 py-2">
                {/* Avatar */}
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {account?.slice(2, 4).toUpperCase()}
                  </span>
                </div>

                {/* Account Info */}
                <span className="text-sm font-mono text-gray-900">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}