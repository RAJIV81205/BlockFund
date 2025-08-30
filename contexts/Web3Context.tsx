"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { web3Service } from '@/lib/web3';

interface Web3ContextType {
    account: string | null;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
    children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);


    useEffect(() => {
        // Check if already connected
        const checkConnection = async () => {
            const account = await web3Service.getAccount();
            setAccount(account);
        };

        checkConnection();

    

        // Listen for account changes
        if (window.ethereum) {
            const handleAccountsChanged = async (...args: unknown[]) => {
                const accounts = args[0] as string[];
                
                if (accounts.length > 0) {
                    // Reinitialize the web3Service with the new account
                    try {
                        await web3Service.reinitializeSigner();
                        const actualAccount = await web3Service.getAccount();
                        console.log('[Web3Context] Reinitialized with account:', actualAccount);
                        setAccount(actualAccount);
                    } catch (error) {
                        console.error('[Web3Context] Error reinitializing after account change:', error);
                        setAccount(accounts[0]);
                    }
                } else {
                    // No accounts connected
                    setAccount(null);
                }
            };

            const handleChainChanged = () => {
                console.log('[Web3Context] Chain changed, reloading...');
                window.location.reload();
            };

            window.ethereum?.on?.('accountsChanged', handleAccountsChanged);
            window.ethereum?.on?.('chainChanged', handleChainChanged);

            return () => {
                // clearInterval(pollInterval);
                window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
                window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
            };
        }
    }, []); // Remove account from dependency array to prevent infinite re-renders

    const connectWallet = async () => {
        setIsConnecting(true);
        try {
            const account = await web3Service.connectWallet();
            console.log('[Web3Context] Wallet connected:', account);
            setAccount(account);
        } catch (error) {
            console.error('[Web3Context] Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const value: Web3ContextType = {
        account,
        isConnecting,
        connectWallet,
        isConnected: !!account
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
}