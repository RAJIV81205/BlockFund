import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '@/lib/web3';

interface Campaign {
  campaignAddress: string;
  owner: string;
  name: string;
  creationTime: number;
}

interface UseRealTimeUpdatesProps {
  enableEventListeners?: boolean;
}

export const useRealTimeUpdates = ({
  enableEventListeners = true
}: UseRealTimeUpdatesProps = {}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load initial campaigns with retry logic
  const loadCampaigns = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns || []); // Ensure we always have an array
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading campaigns:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaigns';
      
      // Provide more specific error handling
      if (errorMessage.includes('could not decode result data') || errorMessage.includes('Unable to decode campaign data')) {
        setError('Network or contract issue detected. Please ensure you are connected to Holesky Testnet and the contract is properly deployed.');
      } else if (errorMessage.includes('Please switch to the correct network')) {
        setError('Please switch to Holesky Testnet to view campaigns.');
      } else if (errorMessage.includes('No contract found')) {
        setError('Contract not found at the specified address. Please check if the contract is deployed.');
      } else if (errorMessage.includes('circuit breaker') || errorMessage.includes('missing revert data')) {
        setError('Network connection issues detected. Try switching to a different RPC endpoint or wait a few minutes before retrying.');
      } else {
        setError(errorMessage);
      }
      
      // Retry logic for initial load (max 2 retries) - but not for network errors
      if (retryCount < 2 && !errorMessage.includes('switch to the correct network') && !errorMessage.includes('No contract found')) {
        console.log(`Retrying campaign load in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => loadCampaigns(retryCount + 1), (retryCount + 1) * 2000);
        return;
      }
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

    // Cleanup function
    return () => {
      web3Service.stopAllEventListeners();
    };
  }, [
    loadCampaigns,
    handleNewCampaign,
    enableEventListeners
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