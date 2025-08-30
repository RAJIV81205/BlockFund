"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { web3Service } from "@/lib/web3";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";


declare global {
  interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  }

  interface Window {
    ethereum?: EthereumProvider;
  }
}


interface Web3ContextType {
  account: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  balance : string | null;
  campaigns: any[];
  campaignsLoading: boolean;
  campaignsError: string | null;
  lastUpdate: Date | null;
  refreshCampaigns: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  
  // Use the real-time updates hook
  const {
    campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    lastUpdate,
    refresh: refreshCampaigns
  } = useRealTimeUpdates({
    enablePolling: true,
    pollingInterval: 30000,
    enableEventListeners: true
  });

  useEffect(() => {
    if (!window.ethereum) return;
  
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        try {
          await web3Service.reinitializeSigner();
          const actualAccount = await web3Service.getAccount();
          console.log("[Web3Context] Reinitialized:", actualAccount);
          setAccount(actualAccount);
        } catch {
          setAccount(accounts[0]);
        }
      } else {
        setAccount(null);
      }
    };
  
    const handleChainChanged = () => {
      console.log("[Web3Context] Chain changed, reloading...");
      window.location.reload();
    };
  
    // Attach listeners
    window.ethereum.on?.("accountsChanged", handleAccountsChanged as unknown as (...args: unknown[]) => void);
    window.ethereum.on?.("chainChanged", handleChainChanged as unknown as (...args: unknown[]) => void);
  
    // Fetch balance whenever account changes
    const fetchBalance = async () => {
      if (!account) {
        setBalance(null);
        return;
      }
      try {
        const bal = await web3Service.getBalance(account);
        setBalance(bal);
        console.log("[Web3Context] Balance:", bal);
      } catch (err) {
        console.error("[Web3Context] Failed to fetch balance:", err);
        setBalance(null);
      }
    };
  
    fetchBalance();
  
    // Cleanup
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged as unknown as (...args: unknown[]) => void);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged as unknown as (...args: unknown[]) => void);
    };
  }, [account]);
  

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const account = await web3Service.connectWallet();
      console.log("[Web3Context] Wallet connected:", account);
      setAccount(account);
    } catch (error) {
      console.error("[Web3Context] Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const value: Web3ContextType = {
    account,
    isConnecting,
    connectWallet,
    isConnected: !!account,
    balance,
    campaigns,
    campaignsLoading,
    campaignsError,
    lastUpdate,
    refreshCampaigns
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
