import { useState, useEffect, useCallback, useRef } from 'react';
import { web3Service } from '@/lib/web3';

interface Campaign {
    campaignAddress: string;
    owner: string;
    name: string;
    creationTime: number;
    description?: string;
    goal?: string;
    currentAmount?: string;
    deadline?: number;
    state?: number;
    tiers?: Array<{
        name: string;
        amount: string;
    }>;
}

interface UseEnhancedRealTimeUpdatesProps {
    enablePolling?: boolean;
    pollingInterval?: number;
    enableEventListeners?: boolean;
    enableOptimisticUpdates?: boolean;
    enableCaching?: boolean;
    maxRetries?: number;
}

interface CacheEntry {
    data: Campaign[];
    timestamp: number;
    ttl: number;
}

export const useEnhancedRealTimeUpdates = ({
    enablePolling = true,
    pollingInterval = 15000, // More frequent updates
    enableEventListeners = true,
    enableOptimisticUpdates = true,
    enableCaching = true,
    maxRetries = 3
}: UseEnhancedRealTimeUpdatesProps = {}) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [retryCount, setRetryCount] = useState(0);

    // Refs for cleanup and state management
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cacheRef = useRef<CacheEntry | null>(null);
    const optimisticUpdatesRef = useRef<Map<string, Partial<Campaign>>>(new Map());

    // Enhanced cache management
    const getCachedData = useCallback((): Campaign[] | null => {
        if (!enableCaching || !cacheRef.current) return null;

        const now = Date.now();
        if (now - cacheRef.current.timestamp > cacheRef.current.ttl) {
            cacheRef.current = null;
            return null;
        }

        return cacheRef.current.data;
    }, [enableCaching]);

    const setCachedData = useCallback((data: Campaign[]) => {
        if (!enableCaching) return;

        cacheRef.current = {
            data,
            timestamp: Date.now(),
            ttl: pollingInterval * 2 // Cache for twice the polling interval
        };
    }, [enableCaching, pollingInterval]);

    // Enhanced error handling with retry logic
    const handleError = useCallback((err: unknown, operation: string) => {
        console.error(`Error in ${operation}:`, err);
        const errorMessage = err instanceof Error ? err.message : `Failed to ${operation}`;

        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            setConnectionStatus('reconnecting');
            // Exponential backoff
            setTimeout(() => {
                loadCampaigns();
            }, Math.pow(2, retryCount) * 1000);
        } else {
            setError(errorMessage);
            setConnectionStatus('disconnected');
        }
    }, [retryCount, maxRetries]);

    // Load campaigns with enhanced error handling and caching
    const loadCampaigns = useCallback(async (useCache = true) => {
        try {
            setError(null);

            // Try cache first
            if (useCache) {
                const cachedData = getCachedData();
                if (cachedData) {
                    setCampaigns(cachedData);
                    setConnectionStatus('connected');
                    return;
                }
            }

            setLoading(true);
            const allCampaigns = await web3Service.getAllCampaigns();

            // Apply optimistic updates
            const enhancedCampaigns = allCampaigns.map((campaign: Campaign) => {
                const optimisticUpdate = optimisticUpdatesRef.current.get(campaign.campaignAddress);
                return optimisticUpdate ? { ...campaign, ...optimisticUpdate } : campaign;
            });

            setCampaigns(enhancedCampaigns);
            setCachedData(enhancedCampaigns);
            setLastUpdate(new Date());
            setConnectionStatus('connected');
            setRetryCount(0); // Reset retry count on success
        } catch (err) {
            handleError(err, 'load campaigns');
        } finally {
            setLoading(false);
        }
    }, [getCachedData, setCachedData, handleError]);

    // Optimistic update for immediate UI feedback
    const applyOptimisticUpdate = useCallback((campaignAddress: string, updates: Partial<Campaign>) => {
        if (!enableOptimisticUpdates) return;

        optimisticUpdatesRef.current.set(campaignAddress, updates);

        setCampaigns(prev => prev.map(campaign =>
            campaign.campaignAddress === campaignAddress
                ? { ...campaign, ...updates }
                : campaign
        ));

        // Clear optimistic update after a delay
        setTimeout(() => {
            optimisticUpdatesRef.current.delete(campaignAddress);
        }, 5000);
    }, [enableOptimisticUpdates]);

    // Enhanced new campaign handler
    const handleNewCampaign = useCallback((campaignData: Campaign) => {
        console.log('New campaign created:', campaignData);
        setCampaigns(prev => {
            const exists = prev.some(c => c.campaignAddress === campaignData.campaignAddress);
            if (!exists) {
                setLastUpdate(new Date());
                const updated = [...prev, campaignData];
                setCachedData(updated);
                return updated;
            }
            return prev;
        });
    }, [setCachedData]);

    // Enhanced polling with smart updates
    const handlePollingUpdate = useCallback((updatedCampaigns: Campaign[]) => {
        setCampaigns(prev => {
            // Smart comparison - only update if there are meaningful changes
            const hasChanges = updatedCampaigns.length !== prev.length ||
                updatedCampaigns.some((updated, index) => {
                    const existing = prev[index];
                    return !existing ||
                        existing.currentAmount !== updated.currentAmount ||
                        existing.state !== updated.state ||
                        existing.deadline !== updated.deadline;
                });

            if (hasChanges) {
                setLastUpdate(new Date());
                setCachedData(updatedCampaigns);
                return updatedCampaigns;
            }
            return prev;
        });
    }, [setCachedData]);

    // Enhanced campaign funding handler
    const handleCampaignFunded = useCallback((fundingData: {
        backer: string;
        amount: string;
        tierIndex: number;
        campaignAddress: string;
    }) => {
        console.log('Campaign funded:', fundingData);

        // Apply optimistic update
        applyOptimisticUpdate(fundingData.campaignAddress, {
            currentAmount: fundingData.amount // This would need to be calculated properly
        });

        setLastUpdate(new Date());
    }, [applyOptimisticUpdate]);

    // Enhanced campaign state change handler
    const handleCampaignStateChange = useCallback((stateData: {
        newState: number;
        campaignAddress: string;
    }) => {
        console.log('Campaign state changed:', stateData);

        // Apply optimistic update
        applyOptimisticUpdate(stateData.campaignAddress, {
            state: stateData.newState
        });

        setLastUpdate(new Date());
    }, [applyOptimisticUpdate]);

    // Enhanced refresh with specific campaign support
    const refreshCampaign = useCallback(async (campaignAddress: string) => {
        try {
            const campaignDetails = await web3Service.getCampaignDetails(campaignAddress);
            if (campaignDetails) {
                // Convert campaign details to Campaign format
                const updatedCampaign: Campaign = {
                    campaignAddress,
                    owner: campaignDetails.owner,
                    name: campaignDetails.name,
                    creationTime: 0, // This would need to be fetched separately
                    description: campaignDetails.description,
                    goal: campaignDetails.goal,
                    currentAmount: campaignDetails.balance,
                    deadline: campaignDetails.deadline,
                    state: campaignDetails.state,
                    tiers: campaignDetails.tiers.map(tier => ({
                        name: tier.name,
                        amount: tier.amount
                    }))
                };

                setCampaigns(prev => prev.map(campaign =>
                    campaign.campaignAddress === campaignAddress ? updatedCampaign : campaign
                ));
                setLastUpdate(new Date());

                // Update cache
                const cachedData = getCachedData();
                if (cachedData) {
                    const updatedCache = cachedData.map(campaign =>
                        campaign.campaignAddress === campaignAddress ? updatedCampaign : campaign
                    );
                    setCachedData(updatedCache);
                }
            }
        } catch (err) {
            handleError(err, 'refresh campaign');
        }
    }, [getCachedData, setCachedData, handleError]);

    // Manual refresh with cache bypass
    const refresh = useCallback(() => {
        cacheRef.current = null; // Clear cache
        optimisticUpdatesRef.current.clear(); // Clear optimistic updates
        loadCampaigns(false);
    }, [loadCampaigns]);

    // Enhanced polling setup
    const startPolling = useCallback(() => {
        if (!enablePolling || pollingIntervalRef.current) return;

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const updatedCampaigns = await web3Service.getAllCampaigns();
                handlePollingUpdate(updatedCampaigns);
            } catch (err) {
                console.error('Polling error:', err);
                // Don't trigger full error handling for polling errors
            }
        }, pollingInterval);
    }, [enablePolling, pollingInterval, handlePollingUpdate]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // Main effect
    useEffect(() => {
        // Load initial data
        loadCampaigns();

        // Set up event listeners
        if (enableEventListeners) {
            web3Service.listenForCampaignCreated(handleNewCampaign);
        }

        // Start polling
        startPolling();

        // Cleanup function
        return () => {
            stopPolling();
            web3Service.stopAllEventListeners();
            optimisticUpdatesRef.current.clear();
        };
    }, [
        loadCampaigns,
        handleNewCampaign,
        enableEventListeners,
        startPolling,
        stopPolling
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
            optimisticUpdatesRef.current.clear();
            cacheRef.current = null;
        };
    }, [stopPolling]);

    return {
        campaigns,
        loading,
        error,
        lastUpdate,
        connectionStatus,
        retryCount,
        refresh,
        refreshCampaign,
        handleCampaignFunded,
        handleCampaignStateChange,
        applyOptimisticUpdate,
        // Additional enhanced features
        clearCache: () => { cacheRef.current = null; },
        clearOptimisticUpdates: () => { optimisticUpdatesRef.current.clear(); },
        getCacheStatus: () => ({
            hasCache: !!cacheRef.current,
            cacheAge: cacheRef.current ? Date.now() - cacheRef.current.timestamp : 0,
            optimisticUpdatesCount: optimisticUpdatesRef.current.size
        })
    };
};