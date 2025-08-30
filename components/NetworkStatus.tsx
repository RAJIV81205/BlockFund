"use client";

import { useState, useEffect } from 'react';
import { web3Service } from '@/lib/web3';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export default function NetworkStatus() {
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      const handleChainChanged = () => {
        checkNetwork();
      };
      
      window.ethereum.on?.('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkNetwork = async () => {
    try {
      const network = await web3Service.getCurrentNetwork();
      const isCorrect = await web3Service.isOnCorrectNetwork();
      
      setCurrentNetwork(network);
      setIsCorrectNetwork(isCorrect);
    } catch (error) {
      console.error('Error checking network:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await web3Service.switchToCorrectNetwork();
      checkNetwork();
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 17000: return 'Holesky Testnet';
      case 31337: return 'Localhost';
      case 11155111: return 'Sepolia Testnet';
      default: return `Unknown Network (${chainId})`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
        Checking network...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-amber-500'}`}></div>
      <span className={isCorrectNetwork ? 'text-green-700' : 'text-amber-700'}>
        {getNetworkName(currentNetwork)}
      </span>
      {!isCorrectNetwork && (
        <button
          onClick={handleSwitchNetwork}
          className="ml-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors"
        >
          Switch to Holesky
        </button>
      )}
    </div>
  );
}