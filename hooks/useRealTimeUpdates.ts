import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '@/lib/web3';
import { notificationManager } from '@/lib/notificationManager';

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

  // Track listeners to prevent duplicates
  const [listenersSetup, setListenersSetup] = useState<Set<string>>(new Set());
  const [factoryListenerSetup, setFactoryListenerSetup] = useState(false);

  // ---------------------------
  // Load campaigns
  // ---------------------------
  const loadCampaigns = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading campaigns:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaigns';

      if (errorMessage.includes('decode')) {
        setError('Network or contract issue detected. Check Holesky Testnet and deployment.');
      } else if (errorMessage.includes('switch to the correct network')) {
        setError('Please switch to Holesky Testnet to view campaigns.');
      } else if (errorMessage.includes('No contract found')) {
        setError('Contract not found at the specified address.');
      } else {
        setError(errorMessage);
      }

      // Retry max 2 times
      if (retryCount < 2) {
        console.log(`Retrying campaign load in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => loadCampaigns(retryCount + 1), (retryCount + 1) * 2000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------
  // Event Handlers
  // ---------------------------
  const handleNewCampaign = useCallback((campaignData: Campaign) => {
    console.log('New campaign created:', campaignData);
    notificationManager.showNotification('campaign_created', campaignData);

    setCampaigns(prev => {
      const exists = prev.some(c => c.campaignAddress === campaignData.campaignAddress);
      if (!exists) {
        setLastUpdate(new Date());
        return [...prev, campaignData];
      }
      return prev;
    });
  }, []);

  const handleGenericEvent = useCallback((type: string, data: any, campaignAddress: string) => {
    console.log(`${type} event:`, data);
    notificationManager.showNotification(type, data, campaignAddress);
    setLastUpdate(new Date());
  }, []);

  // ---------------------------
  // Listeners Setup
  // ---------------------------
  useEffect(() => {
    if (!enableEventListeners) return;

    // Attach factory listener ONCE
    if (!factoryListenerSetup) {
      console.log('Setting up factory event listener');
      web3Service.listenForCampaignCreated(handleNewCampaign);
      setFactoryListenerSetup(true);
    }

    // Attach listeners only for new campaigns
    campaigns.forEach(campaign => {
      if (!listenersSetup.has(campaign.campaignAddress)) {
        console.log(`Setting up listeners for campaign: ${campaign.campaignAddress}`);

        web3Service.listenForCampaignEvents(campaign.campaignAddress, {
          onFundReceived: (data) => handleGenericEvent('campaign_funded', data, campaign.campaignAddress),
          onStateChanged: (data) => handleGenericEvent('campaign_state_changed', data, campaign.campaignAddress),
          onTierAdded: (data) => handleGenericEvent('tier_added', data, campaign.campaignAddress),
          onTierRemoved: (data) => handleGenericEvent('tier_removed', data, campaign.campaignAddress),
          onWithdraw: (data) => handleGenericEvent('funds_withdrawn', data, campaign.campaignAddress),
          onRefund: (data) => handleGenericEvent('refund_issued', data, campaign.campaignAddress),
          onPaused: (data) => handleGenericEvent('campaign_paused', data, campaign.campaignAddress),
          onDeadlineExtended: (data) => handleGenericEvent('deadline_extended', data, campaign.campaignAddress),
          onDetailsUpdated: (data) => handleGenericEvent('details_updated', data, campaign.campaignAddress),
          onDeleted: (data) => handleGenericEvent('campaign_deleted', data, campaign.campaignAddress),
          onEmergencyWithdraw: (data) => handleGenericEvent('emergency_withdraw', data, campaign.campaignAddress),
        });

        setListenersSetup(prev => {
          const updated = new Set(prev);
          updated.add(campaign.campaignAddress);
          return updated;
        });
      }
    });
  }, [enableEventListeners, campaigns, handleNewCampaign, handleGenericEvent, factoryListenerSetup, listenersSetup]);

  // ---------------------------
  // Initial load + cleanup
  // ---------------------------
  useEffect(() => {
    loadCampaigns();

    return () => {
      console.log('Cleaning up all event listeners');
      web3Service.removeAllEventListeners();
      setListenersSetup(new Set());
      setFactoryListenerSetup(false);
    };
  }, [loadCampaigns]);

  // ---------------------------
  // Utility methods
  // ---------------------------
  const refreshCampaign = useCallback(async (campaignAddress: string) => {
    try {
      const updated = await web3Service.refreshCampaignData(campaignAddress);
      if (updated) setLastUpdate(new Date());
    } catch (err) {
      console.error('Error refreshing campaign:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const getListenerStatus = useCallback(() => {
    return {
      activeListeners: web3Service.getActiveListenersCount(),
      setupCampaigns: Array.from(listenersSetup),
      factoryListenerSetup,
      notificationStats: notificationManager.getStats()
    };
  }, [listenersSetup, factoryListenerSetup]);

  const clearNotificationHistory = useCallback(() => {
    notificationManager.clearAll();
    console.log('Cleared notification history');
  }, []);

  // ---------------------------
  // Return Hook API
  // ---------------------------
  return {
    campaigns,
    loading,
    error,
    lastUpdate,
    refresh,
    refreshCampaign,
    getListenerStatus,
    clearNotificationHistory,
  };
};
