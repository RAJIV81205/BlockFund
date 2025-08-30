"use client";

import { useEffect, useState, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';

interface Notification {
  id: string;
  type: 'campaign_created' | 'campaign_funded' | 'campaign_state_changed';
  message: string;
  timestamp: Date;
}

export default function RealTimeUpdates() {
  const { lastUpdate, campaigns } = useWeb3();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [previousCampaignCount, setPreviousCampaignCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  useEffect(() => {
    // Check for new campaigns
    if (campaigns.length > previousCampaignCount && previousCampaignCount > 0) {
      const newCampaigns = campaigns.slice(previousCampaignCount);
      newCampaigns.forEach(campaign => {
        addNotification({
          type: 'campaign_created',
          message: `New campaign created: ${campaign.name}`,
          timestamp: new Date()
        });
      });
    }
    setPreviousCampaignCount(campaigns.length);
  }, [campaigns, previousCampaignCount, addNotification]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'campaign_created':
        return '🚀';
      case 'campaign_funded':
        return '💰';
      case 'campaign_state_changed':
        return '📊';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'campaign_created':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'campaign_funded':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      case 'campaign_state_changed':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  return (
    <>
      {/* Real-time status indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-2">
          {lastUpdate && (
            <div className="bg-white rounded-lg shadow-lg px-3 py-2 border">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">
                  Live • {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center relative hover:bg-blue-700"
            >
              🔔
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications panel */}
      {showNotifications && notifications.length > 0 && (
        <div className="fixed top-16 right-4 z-50 w-80">
          <div className="bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto">
            <div className="p-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Live Updates</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 border ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {notification.message}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.slice(0, 1).map((notification) => (
          <div
            key={`toast-${notification.id}`}
            className={`p-4 rounded-lg shadow-lg border animate-slide-in-right ${getNotificationColor(notification.type)}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">
                {getNotificationIcon(notification.type)}
              </span>
              <div>
                <p className="font-medium">{notification.message}</p>
                <p className="text-xs opacity-75">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}