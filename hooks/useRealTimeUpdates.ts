import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '@/lib/web3';

interface Campaign {
  campaignAddress: string;
  owner: string;
  name: string;
  creationTime: number;
}

interface UseRealTimeUpdatesProps {
  enablePolling?: boolean;
  pollingInterval?: number;
  enableEventListeners?: boolean;
}

export const useRealTimeUpdates = ({
  enablePolling = true,
  pollingInterval = 30000,
  enableEventListeners = true
}: UseRealTimeUpdatesProps = {}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load initial campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle new campaign created
  const handleNewCampaign = useCallback((campaignData: Campaign) => {
    console.log('New campaign created:', campaignData);
    setCampaigns(prev => {
      // Check if campaign already exists to avoid duplicates
      const exists = prev.some(c => c.campaignAddress === campaignData.campaignAddress);
      if (!exists) {
        setLastUpdate(new Date());
        return [...prev, campaignData];
      }
      return prev;
    });
  }, []);

  // Handle campaign updates from polling
  const handlePollingUpdate = useCallback((updatedCampaigns: Campaign[]) => {
    setCampaigns(prev => {
      // Only update if there are actual changes
      if (updatedCampaigns.length !== prev.length) {
        setLastUpdate(new Date());
        return updatedCampaigns;
      }
      return prev;
    });
  }, []);

  // Handle campaign funding events
  const handleCampaignFunded = useCallback((fundingData: {
    backer: string;
    amount: string;
    tierIndex: number;
    campaignAddress: string;
  }) => {
    console.log('Campaign funded:', fundingData);
    setLastUpdate(new Date());
    // You can add specific logic here to update campaign details
    // For now, we'll just update the timestamp to trigger re-renders
  }, []);

  // Handle campaign state changes
  const handleCampaignStateChange = useCallback((stateData: {
    newState: number;
    campaignAddress: string;
  }) => {
    console.log('Campaign state changed:', stateData);
    setLastUpdate(new Date());
    // You can add specific logic here to update campaign state
  }, []);

  // Refresh specific campaign data
  const refreshCampaign = useCallback(async (campaignAddress: string) => {
    try {
      const updatedCampaign = await web3Service.refreshCampaignData(campaignAddress);
      if (updatedCampaign) {
        setLastUpdate(new Date());
        // Update the specific campaign in the list if needed
      }
    } catch (err) {
      console.error('Error refreshing campaign:', err);
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    // Load initial data
    loadCampaigns();

    // Set up event listeners
    if (enableEventListeners) {
      web3Service.listenForCampaignCreated(handleNewCampaign);
    }

    // Set up polling
    if (enablePolling) {
      web3Service.startPollingForUpdates(handlePollingUpdate, pollingInterval);
    }

    // Cleanup function
    return () => {
      web3Service.stopAllEventListeners();
    };
  }, [
    loadCampaigns,
    handleNewCampaign,
    handlePollingUpdate,
    enableEventListeners,
    enablePolling,
    pollingInterval
  ]);

  return {
    campaigns,
    loading,
    error,
    lastUpdate,
    refresh,
    refreshCampaign,
    handleCampaignFunded,
    handleCampaignStateChange
  };
};