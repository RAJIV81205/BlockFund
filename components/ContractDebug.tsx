"use client";

import { useState } from 'react';
import { web3Service } from '@/lib/web3';
import { FACTORY_ADDRESS } from '@/lib/contracts';

export default function ContractDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Check current network
      info.currentNetwork = await web3Service.getCurrentNetwork();
      info.isCorrectNetwork = await web3Service.isOnCorrectNetwork();
      
      // Check contract existence
      info.contractExists = await web3Service.checkContractExists(FACTORY_ADDRESS);
      info.factoryAddress = FACTORY_ADDRESS;
      
      // Try to get factory owner
      try {
        info.factoryOwner = await web3Service.getFactoryOwner();
      } catch (error) {
        info.factoryOwnerError = error instanceof Error ? error.message : String(error);
      }
      
      // Try to check if factory is paused
      try {
        info.factoryPaused = await web3Service.isFactoryPaused();
      } catch (error) {
        info.factoryPausedError = error instanceof Error ? error.message : String(error);
      }
      
      // Try to get campaigns
      try {
        const campaigns = await web3Service.getAllCampaigns();
        info.campaignsCount = campaigns.length;
        info.campaigns = campaigns;
      } catch (error) {
        info.campaignsError = error instanceof Error ? error.message : String(error);
      }
      
      // Check wallet connection
      try {
        info.connectedAccount = await web3Service.getAccount();
      } catch (error) {
        info.accountError = error instanceof Error ? error.message : String(error);
      }

    } catch (error) {
      info.generalError = error instanceof Error ? error.message : String(error);
    }

    setDebugInfo(info);
    setLoading(false);
  };

  return (
    <div className="bg-slate-100 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-900">Contract Debug Info</h3>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>
      
      {debugInfo && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Network:</strong> {debugInfo.currentNetwork} 
              {debugInfo.isCorrectNetwork ? ' ✅' : ' ❌'}
            </div>
            <div>
              <strong>Contract Exists:</strong> {debugInfo.contractExists ? '✅' : '❌'}
            </div>
            <div>
              <strong>Factory Address:</strong> 
              <code className="text-xs bg-white px-1 rounded">{debugInfo.factoryAddress}</code>
            </div>
            <div>
              <strong>Connected Account:</strong> 
              {debugInfo.connectedAccount ? (
                <code className="text-xs bg-white px-1 rounded">
                  {debugInfo.connectedAccount.slice(0, 10)}...{debugInfo.connectedAccount.slice(-4)}
                </code>
              ) : (
                'Not connected'
              )}
            </div>
          </div>
          
          {debugInfo.factoryOwner && (
            <div>
              <strong>Factory Owner:</strong> 
              <code className="text-xs bg-white px-1 rounded">{debugInfo.factoryOwner}</code>
            </div>
          )}
          
          {debugInfo.factoryPaused !== undefined && (
            <div>
              <strong>Factory Paused:</strong> {debugInfo.factoryPaused ? 'Yes' : 'No'}
            </div>
          )}
          
          {debugInfo.campaignsCount !== undefined && (
            <div>
              <strong>Campaigns Count:</strong> {debugInfo.campaignsCount}
            </div>
          )}
          
          {/* Errors */}
          {debugInfo.factoryOwnerError && (
            <div className="text-red-600">
              <strong>Factory Owner Error:</strong> {debugInfo.factoryOwnerError}
            </div>
          )}
          
          {debugInfo.campaignsError && (
            <div className="text-red-600">
              <strong>Campaigns Error:</strong> {debugInfo.campaignsError}
            </div>
          )}
          
          {debugInfo.generalError && (
            <div className="text-red-600">
              <strong>General Error:</strong> {debugInfo.generalError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}