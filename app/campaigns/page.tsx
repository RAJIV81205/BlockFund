"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { web3Service } from "@/lib/web3";
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<Record<string, CampaignDetails>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'successful' | 'failed'>('all');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // Ensure we're on the correct network
      await web3Service.switchToCorrectNetwork();
      
      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns);
      
      // Load details for each campaign
      const details: Record<string, CampaignDetails> = {};
      for (const campaign of allCampaigns) {
        try {
          const detail = await web3Service.getCampaignDetails(campaign.campaignAddress);
          details[campaign.campaignAddress] = detail;
        } catch (error) {
          console.error(`Failed to load details for ${campaign.campaignAddress}:`, error);
        }
      }
      setCampaignDetails(details);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
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

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    const details = campaignDetails[campaign.campaignAddress];
    if (!details) return false;
    
    switch (filter) {
      case 'active': return details.state === CampaignState.Active;
      case 'successful': return details.state === CampaignState.Successful;
      case 'failed': return details.state === CampaignState.Failed;
      default: return true;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Campaigns</h1>
        <Link
          href="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Create Campaign
        </Link>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-8">
        {(['all', 'active', 'successful', 'failed'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'No campaigns found' : `No ${filter} campaigns found`}
          </p>
          <Link
            href="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => {
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
                
                <Link
                  href={`/campaign/${campaign.campaignAddress}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}