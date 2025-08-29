'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { web3Service } from '@/lib/web3';
import { useWeb3 } from '@/contexts/Web3Context';

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

export default function CampaignPage() {
  const params = useParams();
  const address = params.address as string;
  const { account, isConnected, connectWallet } = useWeb3();

  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [funding, setFunding] = useState(false);

  // Owner management states
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTierName, setNewTierName] = useState('');
  const [newTierAmount, setNewTierAmount] = useState('');
  const [addingTier, setAddingTier] = useState(false);
  const [removingTier, setRemovingTier] = useState<number | null>(null);
  const [showOwnerActions, setShowOwnerActions] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [extendDays, setExtendDays] = useState('');
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [address, account]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const details = await web3Service.getCampaignDetails(address);
      setCampaign(details);
    } catch (err) {
      setError('Failed to load campaign details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const handleFund = async () => {
    if (!campaign || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (campaign.tiers.length === 0) {
      setError('No funding tiers available. The campaign owner needs to add tiers first.');
      return;
    }

    if (!campaign.tiers[selectedTier]) {
      setError('Please select a valid tier');
      return;
    }

    try {
      setFunding(true);
      setError(null);
      
      console.log('=== FUNDING ATTEMPT ===');
      console.log('Campaign:', campaign);
      console.log('Selected Tier Index:', selectedTier);
      console.log('Selected Tier:', campaign.tiers[selectedTier]);
      console.log('User Address:', userAddress);
      
      const tierAmount = campaign.tiers[selectedTier].amount;
      await web3Service.fundCampaignWithValidation(address, selectedTier, tierAmount);
      await loadCampaign(); // Refresh campaign data
      
      // Success message
      setError(null);
      alert(`Successfully funded ${tierAmount} ETH to ${campaign.tiers[selectedTier].name}!`);
    } catch (err: any) {
      console.error('Funding error:', err);
      setError(err.message || 'Failed to fund campaign');
    } finally {
      setFunding(false);
    }
  };

  const debugCampaign = async () => {
    console.log('=== CAMPAIGN DEBUG ===');
    console.log('Campaign Address:', address);
    console.log('User Address:', account);
    console.log('Campaign Details:', campaign);
    
    if (campaign) {
      console.log('Campaign State:', campaign.state);
      console.log('Campaign Paused:', campaign.paused);
      console.log('Tiers Count:', campaign.tiers.length);
      console.log('Selected Tier Index:', selectedTier);
      console.log('Is Owner:', isOwner());
      
      if (campaign.tiers.length > 0) {
        console.log('Available Tiers:', campaign.tiers);
        console.log('Selected Tier:', campaign.tiers[selectedTier]);
      }
    }
    
    try {
      const contractExists = await web3Service.checkContractExists(address);
      console.log('Contract Exists:', contractExists);
      
      const currentNetwork = await web3Service.getCurrentNetwork();
      console.log('Current Network Chain ID:', currentNetwork);
      
      const factoryPaused = await web3Service.isFactoryPaused();
      console.log('Factory Paused:', factoryPaused);
      
      // Switch to correct network if needed
      await web3Service.switchToCorrectNetwork();
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const formatDeadline = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStateText = (state: number) => {
    switch (state) {
      case 0: return 'Active';
      case 1: return 'Successful';
      case 2: return 'Failed';
      default: return 'Unknown';
    }
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return (parseFloat(campaign.balance) / parseFloat(campaign.goal)) * 100;
  };

  const isOwner = () => {
    return account && campaign && account.toLowerCase() === campaign.owner.toLowerCase();
  };

  const handleAddTier = async () => {
    if (!newTierName.trim() || !newTierAmount || !campaign) return;

    try {
      setAddingTier(true);
      await web3Service.addTierWithValidation(address, newTierName.trim(), newTierAmount);
      await loadCampaign();
      setNewTierName('');
      setNewTierAmount('');
      setShowAddTier(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add tier');
      console.error(err);
    } finally {
      setAddingTier(false);
    }
  };

  const handleRemoveTier = async (tierIndex: number) => {
    if (!campaign) return;

    try {
      setRemovingTier(tierIndex);
      await web3Service.removeTierWithValidation(address, tierIndex);
      await loadCampaign();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove tier');
      console.error(err);
    } finally {
      setRemovingTier(null);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      await web3Service.withdrawFunds(address);
      await loadCampaign();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw funds');
      console.error(err);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      setPausing(true);
      await web3Service.toggleCampaignPause(address);
      await loadCampaign();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle pause');
      console.error(err);
    } finally {
      setPausing(false);
    }
  };

  const handleExtendDeadline = async () => {
    if (!extendDays || parseInt(extendDays) <= 0) return;

    try {
      setExtending(true);
      await web3Service.extendDeadline(address, parseInt(extendDays));
      await loadCampaign();
      setExtendDays('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to extend deadline');
      console.error(err);
    } finally {
      setExtending(false);
    }
  };

  const handleRefund = async () => {
    try {
      await web3Service.refund(address);
      await loadCampaign();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to get refund');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading campaign...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Campaign not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.name}</h1>
          <p className="text-gray-600 mb-6">{campaign.description}</p>

          {/* Campaign Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Goal</h3>
              <p className="text-2xl font-bold text-blue-900">{campaign.goal} ETH</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Raised</h3>
              <p className="text-2xl font-bold text-green-900">{campaign.balance} ETH</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Status</h3>
              <p className="text-2xl font-bold text-purple-900">{getStateText(campaign.state)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Campaign Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Owner:</span> {campaign.owner}
            </div>
            <div>
              <span className="font-medium">Deadline:</span> {formatDeadline(campaign.deadline)}
            </div>
            <div>
              <span className="font-medium">Status:</span> {campaign.paused ? 'Paused' : 'Active'}
            </div>
            <div>
              <span className="font-medium">Contract:</span> {address}
            </div>
          </div>
          
          {/* Debug Button (remove in production) */}
          <div className="mt-4">
            <button
              onClick={debugCampaign}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Debug Campaign
            </button>
          </div>
        </div>

        {/* Funding Tiers */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Funding Tiers</h2>
            {isOwner() && campaign.state === 0 && (
              <button
                onClick={() => setShowAddTier(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Add Tier
              </button>
            )}
          </div>

          {campaign.tiers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No funding tiers available yet.</p>
              {isOwner() && campaign.state === 0 && (
                <p className="mt-2">Add your first tier to start accepting contributions!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.tiers.map((tier, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all ${!isOwner() ? 'cursor-pointer' : ''
                    } ${selectedTier === index && !isOwner()
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => !isOwner() && setSelectedTier(index)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{tier.name}</h3>
                    {isOwner() && campaign.state === 0 && (
                      <button
                        onClick={() => handleRemoveTier(index)}
                        disabled={removingTier === index || tier.backers > 0}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={tier.backers > 0 ? "Cannot remove tier with backers" : "Remove tier"}
                      >
                        {removingTier === index ? '...' : '×'}
                      </button>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{tier.amount} ETH</p>
                  <p className="text-sm text-gray-600">{tier.backers} backers</p>
                  {tier.backers > 0 && isOwner() && (
                    <p className="text-xs text-orange-600 mt-1">Cannot remove (has backers)</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Tier Modal */}
        {showAddTier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Tier</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Early Bird, Premium Supporter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newTierAmount}
                    onChange={(e) => setNewTierAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.1"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTier(false);
                    setNewTierName('');
                    setNewTierAmount('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTier}
                  disabled={addingTier || !newTierName.trim() || !newTierAmount}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingTier ? 'Adding...' : 'Add Tier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner() && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
              <button
                onClick={() => setShowOwnerActions(!showOwnerActions)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showOwnerActions ? 'Hide Actions' : 'Show Actions'}
              </button>
            </div>

            {showOwnerActions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Withdraw Funds */}
                {campaign.state === 1 && parseFloat(campaign.balance) > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-green-600 mb-2">Withdraw Funds</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Campaign successful! Withdraw {campaign.balance} ETH
                    </p>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {withdrawing ? 'Withdrawing...' : 'Withdraw Funds'}
                    </button>
                  </div>
                )}

                {/* Pause/Unpause Campaign */}
                {campaign.state === 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-orange-600 mb-2">
                      {campaign.paused ? 'Resume Campaign' : 'Pause Campaign'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {campaign.paused
                        ? 'Resume accepting contributions'
                        : 'Temporarily stop accepting contributions'
                      }
                    </p>
                    <button
                      onClick={handleTogglePause}
                      disabled={pausing}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 ${campaign.paused
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                    >
                      {pausing ? 'Processing...' : (campaign.paused ? 'Resume' : 'Pause')}
                    </button>
                  </div>
                )}

                {/* Extend Deadline */}
                {campaign.state === 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-bold text-blue-600 mb-2">Extend Deadline</h3>
                    <p className="text-sm text-gray-600 mb-3">Add more days to the campaign</p>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={extendDays}
                        onChange={(e) => setExtendDays(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Days"
                      />
                      <button
                        onClick={handleExtendDeadline}
                        disabled={extending || !extendDays || parseInt(extendDays) <= 0}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                      >
                        {extending ? 'Extending...' : 'Extend'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Refund Section for Failed Campaigns */}
        {campaign.state === 2 && userAddress && !isOwner() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Campaign Failed</h2>
            <p className="text-red-700 mb-4">
              This campaign did not reach its funding goal. If you contributed, you can claim a refund.
            </p>
            <button
              onClick={handleRefund}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Claim Refund
            </button>
          </div>
        )}

        {/* Funding Section */}
        {!isOwner() && campaign.state === 0 && !campaign.paused && campaign.tiers.length > 0 && (
          !userAddress ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet to Fund</h2>
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Fund This Campaign</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Tier: {campaign.tiers[selectedTier]?.name}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={campaign.tiers[selectedTier]?.amount || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Select a tier above"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFund}
                    disabled={funding || !campaign.tiers[selectedTier]}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {funding ? 'Funding...' : `Fund ${campaign.tiers[selectedTier]?.amount || '0'} ETH`}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Click on a tier above to select it, then fund with the exact amount.
              </p>
            </div>
          )
        )}

        {/* Campaign Status Messages */}
        {!isOwner() && (
          <>
            {campaign.state !== 0 && (
              <div className={`rounded-lg p-6 text-center ${campaign.state === 1 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                <h2 className={`text-xl font-bold mb-2 ${campaign.state === 1 ? 'text-green-800' : 'text-red-800'
                  }`}>
                  Campaign {getStateText(campaign.state)}
                </h2>
                <p className={campaign.state === 1 ? 'text-green-700' : 'text-red-700'}>
                  {campaign.state === 1
                    ? 'This campaign has successfully reached its funding goal!'
                    : 'This campaign did not reach its funding goal by the deadline.'
                  }
                </p>
              </div>
            )}

            {campaign.paused && campaign.state === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-orange-800 mb-2">Campaign Paused</h2>
                <p className="text-orange-700">
                  This campaign is temporarily paused and not accepting contributions.
                </p>
              </div>
            )}

            {campaign.tiers.length === 0 && campaign.state === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-yellow-800 mb-2">No Tiers Available</h2>
                <p className="text-yellow-700">
                  The campaign owner hasn't set up any funding tiers yet.
                </p>
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}