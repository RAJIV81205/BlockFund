import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '@/lib/web3';
import toast from 'react-hot-toast';

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
    toast.success(`🚀 New campaign created: ${campaignData.name}`, {
      duration: 5000,
      position: 'top-right',
    });
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
  }, campaignAddress: string) => {
    console.log('Campaign funded:', fundingData);
    toast.success(`💰 Campaign funded with ${fundingData.amount} ETH!`, {
      duration: 5000,
      position: 'top-right',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle campaign state changes
  const handleCampaignStateChange = useCallback((stateData: {
    newState: number;
  }, campaignAddress: string) => {
    console.log('Campaign state changed:', stateData);
    const stateNames = ['Active', 'Successful', 'Failed'];
    const stateName = stateNames[stateData.newState] || 'Unknown';
    
    if (stateData.newState === 1) {
      toast.success(`🎉 Campaign reached its goal and is now Successful!`, {
        duration: 6000,
        position: 'top-right',
      });
    } else if (stateData.newState === 2) {
      toast.error(`😞 Campaign has Failed`, {
        duration: 5000,
        position: 'top-right',
      });
    }
    setLastUpdate(new Date());
  }, []);

  // Handle tier added
  const handleTierAdded = useCallback((tierData: {
    name: string;
    amount: string;
  }, campaignAddress: string) => {
    console.log('Tier added:', tierData);
    toast.success(`➕ New tier added: ${tierData.name} (${tierData.amount} ETH)`, {
      duration: 4000,
      position: 'top-right',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle tier removed
  const handleTierRemoved = useCallback((tierData: {
    index: number;
  }, campaignAddress: string) => {
    console.log('Tier removed:', tierData);
    toast(`➖ Tier removed from campaign`, {
      duration: 4000,
      position: 'top-right',
      icon: '➖',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle funds withdrawn
  const handleFundsWithdrawn = useCallback((withdrawData: {
    owner: string;
    amount: string;
  }, campaignAddress: string) => {
    console.log('Funds withdrawn:', withdrawData);
    toast.success(`💸 Campaign owner withdrew ${withdrawData.amount} ETH`, {
      duration: 5000,
      position: 'top-right',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle refund issued
  const handleRefundIssued = useCallback((refundData: {
    backer: string;
    amount: string;
  }, campaignAddress: string) => {
    console.log('Refund issued:', refundData);
    toast(`💰 Refund issued: ${refundData.amount} ETH`, {
      duration: 5000,
      position: 'top-right',
      icon: '💰',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle campaign paused/unpaused
  const handleCampaignPaused = useCallback((pauseData: {
    paused: boolean;
  }, campaignAddress: string) => {
    console.log('Campaign pause status changed:', pauseData);
    if (pauseData.paused) {
      toast(`⏸️ Campaign has been paused`, {
        duration: 4000,
        position: 'top-right',
        icon: '⏸️',
        style: {
          background: '#fef3c7',
          color: '#92400e',
          border: '1px solid #f59e0b',
        },
      });
    } else {
      toast.success(`▶️ Campaign has been resumed`, {
        duration: 4000,
        position: 'top-right',
      });
    }
    setLastUpdate(new Date());
  }, []);

  // Handle deadline extended
  const handleDeadlineExtended = useCallback((deadlineData: {
    newDeadline: number;
  }, campaignAddress: string) => {
    console.log('Deadline extended:', deadlineData);
    const newDate = new Date(deadlineData.newDeadline * 1000);
    toast(`⏰ Campaign deadline extended to ${newDate.toLocaleDateString()}`, {
      duration: 5000,
      position: 'top-right',
      icon: '⏰',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle campaign details updated
  const handleDetailsUpdated = useCallback((detailsData: {
    name: string;
    description: string;
    goal: string;
  }, campaignAddress: string) => {
    console.log('Campaign details updated:', detailsData);
    toast(`✏️ Campaign details updated: ${detailsData.name}`, {
      duration: 4000,
      position: 'top-right',
      icon: '✏️',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle campaign deleted
  const handleCampaignDeleted = useCallback((deleteData: {
    by: string;
  }, campaignAddress: string) => {
    console.log('Campaign deleted:', deleteData);
    toast.error(`🗑️ Campaign has been deleted`, {
      duration: 5000,
      position: 'top-right',
    });
    setLastUpdate(new Date());
  }, []);

  // Handle emergency withdraw
  const handleEmergencyWithdraw = useCallback((emergencyData: {
    owner: string;
    amount: string;
  }, campaignAddress: string) => {
    console.log('Emergency withdraw:', emergencyData);
    toast.error(`🚨 Emergency withdrawal: ${emergencyData.amount} ETH`, {
      duration: 6000,
      position: 'top-right',
    });
    setLastUpdate(new Date());
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

  // Set up event listeners for all campaigns
  const setupCampaignEventListeners = useCallback(async () => {
    if (!enableEventListeners) return;

    try {
      // Listen for new campaigns
      web3Service.listenForCampaignCreated(handleNewCampaign);

      // Set up listeners for existing campaigns
      for (const campaign of campaigns) {
        await web3Service.listenForCampaignEvents(campaign.campaignAddress, {
          onFundReceived: (data) => handleCampaignFunded(data, campaign.campaignAddress),
          onStateChanged: (data) => handleCampaignStateChange(data, campaign.campaignAddress),
          onTierAdded: (data) => handleTierAdded(data, campaign.campaignAddress),
          onTierRemoved: (data) => handleTierRemoved(data, campaign.campaignAddress),
          onWithdraw: (data) => handleFundsWithdrawn(data, campaign.campaignAddress),
          onRefund: (data) => handleRefundIssued(data, campaign.campaignAddress),
          onPaused: (data) => handleCampaignPaused(data, campaign.campaignAddress),
          onDeadlineExtended: (data) => handleDeadlineExtended(data, campaign.campaignAddress),
          onDetailsUpdated: (data) => handleDetailsUpdated(data, campaign.campaignAddress),
          onDeleted: (data) => handleCampaignDeleted(data, campaign.campaignAddress),
          onEmergencyWithdraw: (data) => handleEmergencyWithdraw(data, campaign.campaignAddress),
        });
      }
    } catch (error) {
      console.error('Error setting up campaign event listeners:', error);
    }
  }, [
    enableEventListeners,
    campaigns,
    handleNewCampaign,
    handleCampaignFunded,
    handleCampaignStateChange,
    handleTierAdded,
    handleTierRemoved,
    handleFundsWithdrawn,
    handleRefundIssued,
    handleCampaignPaused,
    handleDeadlineExtended,
    handleDetailsUpdated,
    handleCampaignDeleted,
    handleEmergencyWithdraw
  ]);

  useEffect(() => {
    // Load initial data
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    // Set up event listeners after campaigns are loaded
    if (campaigns.length > 0) {
      setupCampaignEventListeners();
    }

    // Cleanup function
    return () => {
      web3Service.stopAllEventListeners();
    };
  }, [campaigns, setupCampaignEventListeners]);

  return {
    campaigns,
    loading,
    error,
    lastUpdate,
    refresh,
    refreshCampaign,
    handleCampaignFunded,
    handleCampaignStateChange,
    handleTierAdded,
    handleTierRemoved,
    handleFundsWithdrawn,
    handleRefundIssued,
    handleCampaignPaused,
    handleDeadlineExtended,
    handleDetailsUpdated,
    handleCampaignDeleted,
    handleEmergencyWithdraw
  };
};