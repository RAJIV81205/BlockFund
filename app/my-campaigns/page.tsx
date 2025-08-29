"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { web3Service } from "@/lib/web3";
import { useWeb3 } from "@/hooks/useWeb3";
import { CampaignState } from "@/lib/contracts";

interface Campaign {
  campaignAddress: string;
  owner: string;
  name: string;
  creationTime: number;
}

interface CampaignDetails {
  name: string;
  description: string;
  goal: string;
  deadline: number;
  owner: string;
  paused: boolean;
  state: number;
  balance: string;
  tiers: Array<{
    name: string;
    amount: string;
    backers: number;
  }>;
}

export default function MyCampaignsPage() {
  const { account, isConnected } = useWeb3();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<Record<string, CampaignDetails>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadMyCampaigns();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  const loadMyCampaigns = async () => {
    if (!account) return;
    
    try {
      const userCampaigns = await web3Service.getUserCampaigns(account);
      setCampaigns(userCampaigns);
      
      // Load details for each campaign
      const details: Record<string, CampaignDetails> = {};
      for (const campaign of userCampaigns) {
        try {
          const detail = await web3Service.getCampaignDetails(campaign.campaignAddress);
          details[campaign.campaignAddress] = detail;
        } catch (error) {
          console.error(`Failed to load details for ${campaign.campaignAddress}:`, error);
        }
      }
      setCampaignDetails(details);
    } catch (error) {
      console.error('Failed to load user campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateText = (state: number) => {
    switch (state) {
      case CampaignState.Active: return "Active";
      case CampaignState.Successful: return "Successful";
      case CampaignState.Failed: return "Failed";
      default: return "Unknown";
    }
  };

  const getStateColor = (state: number) => {
    switch (state) {
      case CampaignState.Active: return "text-green-600 bg-green-100";
      case CampaignState.Successful: return "text-blue-600 bg-blue-100";
      case CampaignState.Failed: return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const formatDeadline = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} days left`;
    } else {
      return "Expired";
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your campaigns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
        <Link
          href="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Create New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">No Campaigns Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't created any campaigns yet. Start your first crowdfunding campaign today!
            </p>
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Your First Campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const details = campaignDetails[campaign.campaignAddress];
            if (!details) return null;

            const progress = (parseFloat(details.balance) / parseFloat(details.goal)) * 100;

            return (
              <div key={campaign.campaignAddress} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {details.name}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStateColor(details.state)}`}>
                    {getStateText(details.state)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {details.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Raised:</span>
                    <span className="font-medium">{details.balance} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Goal:</span>
                    <span className="font-medium">{details.goal} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="font-medium">{formatDeadline(details.deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backers:</span>
                    <span className="font-medium">{details.tiers.reduce((sum, tier) => sum + tier.backers, 0)}</span>
                  </div>
                </div>

                {details.paused && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-2 py-1 rounded mb-4">
                    Campaign is paused
                  </div>
                )}
                
                <div className="space-y-2">
                  <Link
                    href={`/campaign/${campaign.campaignAddress}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                  >
                    Manage Campaign
                  </Link>
                  
                  {details.state === CampaignState.Successful && (
                    <div className="text-center text-sm text-green-600 font-medium">
                      ✓ Ready for withdrawal
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}