"use client";

import { useState } from 'react';
import { web3Service } from '@/lib/web3';
import { useWeb3 } from '@/contexts/Web3Context';

interface CampaignManagementProps {
  campaignAddress: string;
  campaignName: string;
  isOwner: boolean;
}

export default function CampaignManagement({ 
  campaignAddress, 
  campaignName, 
  isOwner 
}: CampaignManagementProps) {
  const { refreshCampaigns } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTierForm, setShowTierForm] = useState(false);
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    name: '',
    description: '',
    goal: ''
  });

  // Tier form state
  const [tierForm, setTierForm] = useState({
    name: '',
    amount: ''
  });

  const handleDeleteCampaign = async () => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await web3Service.deleteCampaign(campaignAddress);
      alert('Campaign deleted successfully!');
      refreshCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert(`Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm.name || !updateForm.description || !updateForm.goal) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await web3Service.updateCampaignDetails(
        campaignAddress,
        updateForm.name,
        updateForm.description,
        updateForm.goal
      );
      alert('Campaign updated successfully!');
      setShowUpdateForm(false);
      setUpdateForm({ name: '', description: '', goal: '' });
      refreshCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert(`Error updating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierForm.name || !tierForm.amount) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await web3Service.addTierWithValidation(
        campaignAddress,
        tierForm.name,
        tierForm.amount
      );
      alert('Tier added successfully!');
      setShowTierForm(false);
      setTierForm({ name: '', amount: '' });
      refreshCampaigns();
    } catch (error) {
      console.error('Error adding tier:', error);
      alert(`Error adding tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendDeadline = async () => {
    const days = prompt('How many days would you like to extend the deadline?');
    if (!days || isNaN(Number(days)) || Number(days) <= 0) {
      alert('Please enter a valid number of days');
      return;
    }

    setLoading(true);
    try {
      await web3Service.extendDeadline(campaignAddress, Number(days));
      alert(`Deadline extended by ${days} days!`);
      refreshCampaigns();
    } catch (error) {
      console.error('Error extending deadline:', error);
      alert(`Error extending deadline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!confirm('Are you sure you want to perform an emergency withdrawal? This should only be used in critical situations.')) {
      return;
    }

    setLoading(true);
    try {
      await web3Service.emergencyWithdraw(campaignAddress);
      alert('Emergency withdrawal completed!');
      refreshCampaigns();
    } catch (error) {
      console.error('Error performing emergency withdrawal:', error);
      alert(`Error performing emergency withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Campaign Management</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setShowUpdateForm(!showUpdateForm)}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Update Details
        </button>
        
        <button
          onClick={() => setShowTierForm(!showTierForm)}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Add Tier
        </button>
        
        <button
          onClick={handleExtendDeadline}
          disabled={loading}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Extend Deadline
        </button>
        
        <button
          onClick={handleEmergencyWithdraw}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          Emergency Withdraw
        </button>
        
        <button
          onClick={handleDeleteCampaign}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 col-span-2 md:col-span-4"
        >
          Delete Campaign
        </button>
      </div>

      {/* Update Form */}
      {showUpdateForm && (
        <form onSubmit={handleUpdateCampaign} className="mt-6 p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">Update Campaign Details</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Campaign Name"
              value={updateForm.name}
              onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Campaign Description"
              value={updateForm.description}
              onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
              className="w-full p-2 border rounded h-24"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Goal (ETH)"
              value={updateForm.goal}
              onChange={(e) => setUpdateForm({ ...updateForm, goal: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Update Campaign
              </button>
              <button
                type="button"
                onClick={() => setShowUpdateForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tier Form */}
      {showTierForm && (
        <form onSubmit={handleAddTier} className="mt-6 p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">Add New Tier</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tier Name"
              value={tierForm.name}
              onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Tier Amount (ETH)"
              value={tierForm.amount}
              onChange={(e) => setTierForm({ ...tierForm, amount: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add Tier
              </button>
              <button
                type="button"
                onClick={() => setShowTierForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}