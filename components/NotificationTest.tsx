"use client";

import toast from 'react-hot-toast';

export default function NotificationTest() {
  const testNotifications = () => {
    // Test different types of notifications
    toast.success('🚀 Campaign created successfully!', {
      duration: 4000,
    });

    setTimeout(() => {
      toast('💰 Campaign funded with 1.5 ETH!', {
        duration: 4000,
        icon: '💰',
      });
    }, 1000);

    setTimeout(() => {
      toast('🎉 Campaign reached its goal!', {
        duration: 4000,
        icon: '🎉',
      });
    }, 2000);

    setTimeout(() => {
      toast.error('🚨 Emergency withdrawal detected!', {
        duration: 4000,
      });
    }, 3000);
  };

  return (
    <div className="p-4">
      <button
        onClick={testNotifications}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Test Notifications
      </button>
    </div>
  );
}