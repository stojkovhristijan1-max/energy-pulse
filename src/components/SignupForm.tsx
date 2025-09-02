'use client';

import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [isConnected, setIsConnected] = useState(false);

  const handleTelegramConnect = () => {
    // Open Telegram bot directly
    window.open('https://t.me/energypulsebot', '_blank');
    setIsConnected(true);
    
    // Call success callback
    setTimeout(() => {
      onSuccess?.();
    }, 1000);
  };

  if (isConnected) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Connected!</h3>
        <p className="text-gray-300">
          You should now see the Energy Pulse AI bot in Telegram. 
          Send <code className="bg-slate-800 text-green-400 px-2 py-1 rounded">/start</code> to begin receiving daily energy insights!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Get Daily Energy Insights</h3>
        <p className="text-gray-300">
          Connect to our Telegram bot to receive AI-powered energy market analysis every day at 12:00 PM CEST.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/20">
          <h4 className="text-lg font-semibold text-white mb-3">What you'll receive:</h4>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              📊 Real-time energy market data analysis
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              🧠 AI predictions for oil, gas & energy stocks
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              📰 Breaking news with direct source links
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              📈 Trading insights and risk assessments
            </li>
          </ul>
        </div>

        <button
          onClick={handleTelegramConnect}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
        >
          <Send className="w-5 h-5" />
          <span>Connect to Telegram Bot</span>
        </button>

        <p className="text-xs text-gray-400 text-center">
          No email required • Instant setup • Free daily insights
        </p>
      </div>
    </div>
  );
}