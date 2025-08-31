"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { web3Service } from "@/lib/web3";
import { CampaignState } from "@/lib/contracts";
import ContractDebug from "@/components/ContractDebug";

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
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setError(null);
      setNetworkError(null);

      // Check if we're on the correct network first
      const isCorrectNetwork = await web3Service.isOnCorrectNetwork();
      if (!isCorrectNetwork) {
        setNetworkError('Please switch to Holesky Testnet to view campaigns');
        setLoading(false);
        return;
      }

      const allCampaigns = await web3Service.getAllCampaigns();
      setCampaigns(allCampaigns || []);

      // Load details for each campaign (limit to first 6 for performance)
      const details: Record<string, CampaignDetails> = {};
      for (const campaign of allCampaigns.slice(0, 6)) {
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load campaigns';

      if (errorMessage.includes('switch to the correct network') || errorMessage.includes('Holesky')) {
        setNetworkError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      const switched = await web3Service.switchToCorrectNetwork();
      if (switched) {
        setNetworkError(null);
        setLoading(true);
        loadCampaigns();
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
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



  const getStateBadgeColor = (state: number) => {
    switch (state) {
      case CampaignState.Active: return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case CampaignState.Successful: return "bg-blue-50 text-blue-700 border-blue-200";
      case CampaignState.Failed: return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
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
    <div className="min-h-screen bg-slate-50 mt-3">
      {/* Network Error Banner */}
      {networkError && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  {networkError}
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchNetwork}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {error && !networkError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadCampaigns();
              }}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="max-w-4xl mx-auto px-6 py-30 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
            Fund the Future
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            A transparent, blockchain-powered platform for bringing innovative ideas to life
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="group bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-medium transition-all duration-200 hover:scale-105"
            >
              Create Campaign
            </Link>
            <Link
              href="/campaigns"
              className="group border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 px-8 py-4 rounded-full font-medium transition-all duration-200 hover:bg-white"
            >
              Explore Projects
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Debug Section - Remove in production */}
        <section className="mb-8">
          <ContractDebug />
         
        </section>

        {/* Featured Campaigns */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-light text-slate-900">Featured</h2>
            <Link
              href="/campaigns"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 group"
            >
              View all
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded-full mb-6 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded-full mb-3 w-full"></div>
                  <div className="h-4 bg-slate-200 rounded-full mb-6 w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded-full mb-8 w-1/2"></div>
                  <div className="h-12 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-slate-400 text-2xl">+</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {networkError
                  ? "Switch to Holesky Testnet to view and create campaigns"
                  : "Be the first to create a campaign and start raising funds for your project"
                }
              </p>
              {!networkError && (
                <Link
                  href="/create"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium transition-colors"
                >
                  Create Campaign
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.slice(0, 6).map((campaign) => {
                const details = campaignDetails[campaign.campaignAddress];
                if (!details) return null;

                const progress = (parseFloat(details.balance) / parseFloat(details.goal)) * 100;

                return (
                  <div key={campaign.campaignAddress} className="group bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-medium text-slate-900 leading-tight">
                        {details.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStateBadgeColor(details.state)}`}>
                        {getStateText(details.state)}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm mb-8 line-clamp-3 leading-relaxed">
                      {details.description}
                    </p>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-slate-900">
                          {details.balance} ETH
                        </span>
                        <span className="text-xs text-slate-500">
                          of {details.goal} ETH
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-slate-900 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mb-8">
                      <span>{formatDeadline(details.deadline)}</span>
                      <span>{details.tiers.reduce((sum, tier) => sum + tier.backers, 0)} backers</span>
                    </div>

                    <Link
                      href={`/campaign/${campaign.campaignAddress}`}
                      className="block w-full text-center bg-slate-50 hover:bg-slate-100 text-slate-900 py-3 rounded-xl font-medium transition-colors group-hover:bg-slate-900 group-hover:text-white"
                    >
                      View Project
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className="bg-white rounded-3xl p-12">
          <h2 className="text-2xl font-light text-slate-900 mb-12 text-center">Platform Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-4xl font-light text-slate-900 mb-3">
                {campaigns.length.toLocaleString()}
              </div>
              <div className="text-slate-600 font-medium">Projects Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-slate-900 mb-3">
                {Object.values(campaignDetails).reduce((sum, details) => sum + parseFloat(details.balance || '0'), 0).toFixed(1)}
              </div>
              <div className="text-slate-600 font-medium">ETH Raised</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-slate-900 mb-3">
                {Object.values(campaignDetails).reduce((sum, details) =>
                  sum + details.tiers.reduce((tierSum, tier) => tierSum + tier.backers, 0), 0
                ).toLocaleString()}
              </div>
              <div className="text-slate-600 font-medium">People Backed</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}