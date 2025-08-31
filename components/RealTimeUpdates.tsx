"use client";

import { useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Toaster } from 'react-hot-toast';

export default function RealTimeUpdates() {
  const { lastUpdate } = useWeb3();

  // No need for manual notification management with react-hot-toast

  return (
    <>
      {/* Real-time status indicator */}
      <div className="fixed top-4 right-4 z-40">
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
      </div>

      {/* React Hot Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}