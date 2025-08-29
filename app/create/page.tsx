"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { web3Service } from "@/lib/web3";
import { useWeb3 } from "@/contexts/Web3Context";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    duration: 30
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!formData.name || !formData.description || !formData.goal) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.goal) <= 0) {
      alert("Goal must be greater than 0");
      return;
    }

    if (formData.duration < 1) {
      alert("Duration must be at least 1 day");
      return;
    }

    setLoading(true);
    try {
      const tx = await web3Service.createCampaign(
        formData.name,
        formData.description,
        formData.goal,
        formData.duration
      );
      
      console.log("Campaign created:", tx);
      alert("Campaign created successfully!");
      router.push("/campaigns");
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      alert(`Failed to create campaign: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a campaign
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Campaign</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 text-black">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your campaign..."
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
              Funding Goal (ETH) *
            </label>
            <input
              type="number"
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              required
            />
          </div>

          <div className="mb-8">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Duration (days)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="30"
            />
            <p className="text-sm text-gray-500 mt-1">
              Campaign will run for {formData.duration} days from creation
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You can add funding tiers after creating the campaign</li>
              <li>• Campaign funds can only be withdrawn if the goal is reached</li>
              <li>• Backers can request refunds if the campaign fails</li>
              <li>• You can pause/unpause the campaign as the owner</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
          >
            {loading ? "Creating Campaign..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}