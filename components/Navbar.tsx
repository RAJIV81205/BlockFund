"use client";
import Link from "next/link";
import { useWeb3 } from "@/contexts/Web3Context";
import NetworkStatus from "./NetworkStatus";


export default function Navbar() {
  const { account, isConnecting, connectWallet, isConnected, balance } = useWeb3();

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
            <NetworkStatus />
          </div>

          {/* Account/Connect Section */}
          <div className="h-3/4">
            {isConnected ? (
              <div className="flex items-center space-x-3 border border-gray-300 rounded-lg px-4 py-1.5">
                {/* Avatar */}
                <svg width="20" height="30" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path fill="#343434" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" /><path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" /><path fill="#3C3C3B" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" /><path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" /><path fill="#141414" d="M127.961 287.958l127.96-75.637-127.96-58.162z" /><path fill="#393939" d="M0 212.32l127.96 75.638v-133.8z" /></svg>
                {/* Account Info */}
                <div className="flex flex-col">
                  <span className="text-sm font-mono text-gray-900">
                    {account?.slice(0, 10)}...{account?.slice(-4)}
                  </span>
                  <span className="text-sm font-mono text-gray-900">
                    {balance?.slice(0, 6)} ETH
                  </span>
                </div>
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