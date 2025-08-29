"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { web3Service } from '@/lib/web3';

interface Web3ContextType {
    account: string | null;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    isConnected: boolean;
    refreshAccount: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
    children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Manual refresh function
    const refreshAccount = async () => {
        const currentAccount = await web3Service.getAccount();
        if (currentAccount !== account) {
            setAccount(currentAccount);
        }
    };

    useEffect(() => {
        // Check if already connected
        const checkConnection = async () => {
            const account = await web3Service.getAccount();
            setAccount(account);
        };

        checkConnection();

        // Set up polling as backup (every 2 seconds)
        const pollInterval = setInterval(refreshAccount, 2000);

        // Listen for account changes
        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                const newAccount = accounts[0] || null;
                setAccount(newAccount);
            };

            const handleChainChanged = () => {
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                clearInterval(pollInterval);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        } else {
            return () => {
                clearInterval(pollInterval);
            };
        }
    }, [account]);

    const connectWallet = async () => {
        setIsConnecting(true);
        try {
            const account = await web3Service.connectWallet();
            setAccount(account);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const value: Web3ContextType = {
        account,
        isConnecting,
        connectWallet,
        isConnected: !!account,
        refreshAccount
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