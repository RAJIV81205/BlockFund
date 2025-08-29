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

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<Record<string, CampaignDetails>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const debugConnection = async () => {
    console.log('=== DEBUG CONNECTION ===');
    try {
      // Switch to correct network first
      console.log('Switching to correct network...');
      const switched = await web3Service.switchToCorrectNetwork();
      console.log('Network switched:', switched);

      // Try to connect wallet
      const address = await web3Service.connectWallet();
      console.log('Wallet connected:', address);

      // Check if contract exists
      const contractExists = await web3Service.checkContractExists('0x0E88327fb445393A674194740535175c1cBf1c26');
      console.log('Contract exists:', contractExists);

      // Try to get campaigns
      const campaigns = await web3Service.getAllCampaigns();
      console.log('Campaigns:', campaigns);
    } catch (error) {
      console.error('Debug failed:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      // Ensure we're on the correct network
      await web3Service.switchToCorrectNetwork();

      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns);

      // Load details for each campaign
      const details: Record<string, CampaignDetails> = {};
      for (const campaign of allCampaigns.slice(0, 6)) { // Load first 6 for homepage
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
      case CampaignState.Active: return "text-green-600";
      case CampaignState.Successful: return "text-blue-600";
      case CampaignState.Failed: return "text-red-600";
      default: return "text-gray-600";
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Decentralized Crowdfunding Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create and fund campaigns on the blockchain with transparency and security
        </p>
        <div className="space-x-4">
          <Link
            href="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Create Campaign
          </Link>
          <Link
            href="/campaigns"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold"
          >
            Browse Campaigns
          </Link>
          <button
            onClick={debugConnection}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Debug Connection
          </button>
        </div>
      </div>

      {/* Featured Campaigns */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Campaigns</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
            <p className="text-gray-600 mb-4">No campaigns found</p>
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Create the first campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.slice(0, 6).map((campaign) => {
              const details = campaignDetails[campaign.campaignAddress];
              if (!details) return null;

              const progress = (parseFloat(details.balance) / parseFloat(details.goal)) * 100;

              return (
                <div key={campaign.campaignAddress} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {details.name}
                    </h3>
                    <span className={`text-sm font-medium ${getStateColor(details.state)}`}>
                      {getStateText(details.state)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
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

                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{details.balance} ETH raised</span>
                    <span>Goal: {details.goal} ETH</span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{formatDeadline(details.deadline)}</span>
                    <span>{details.tiers.reduce((sum, tier) => sum + tier.backers, 0)} backers</span>
                  </div>

                  <Link
                    href={`/campaign/${campaign.campaignAddress}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                  >
                    View Campaign
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {campaigns.length}
            </div>
            <div className="text-gray-600">Total Campaigns</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Object.values(campaignDetails).reduce((sum, details) => sum + parseFloat(details.balance || '0'), 0).toFixed(2)}
            </div>
            <div className="text-gray-600">ETH Raised</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {Object.values(campaignDetails).reduce((sum, details) =>
                sum + details.tiers.reduce((tierSum, tier) => tierSum + tier.backers, 0), 0
              )}
            </div>
            <div className="text-gray-600">Total Backers</div>
          </div>
        </div>
      </div>
    </div>
  );
}