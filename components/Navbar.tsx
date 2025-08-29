"use client";

import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";

export default function Navbar() {
  const { account, isConnecting, connectWallet, isConnected } = useWeb3();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          BlockFund
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link href="/campaigns" className="hover:text-blue-200">
            Campaigns
          </Link>
          <Link href="/create" className="hover:text-blue-200">
            Create Campaign
          </Link>
          <Link href="/my-campaigns" className="hover:text-blue-200">
            My Campaigns
          </Link>

          {isConnected ? (
            <div className="bg-blue-700 px-3 py-1 rounded text-sm">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}