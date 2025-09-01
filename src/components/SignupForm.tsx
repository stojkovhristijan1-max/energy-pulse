'use client';

import React, { useState } from 'react';
import { SignupFormData, ApiResponse } from '@/types';
import { Mail, User, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    telegram_username: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [step, setStep] = useState<'form' | 'instructions' | 'complete'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate form
      if (!formData.email || !formData.telegram_username) {
        throw new Error('Please fill in all fields');
      }

      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (!formData.telegram_username.match(/^[a-zA-Z0-9_]{5,32}$/)) {
        throw new Error('Telegram username must be 5-32 characters (letters, numbers, underscores only)');
      }

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Signup failed');
      }

      setMessage({ type: 'success', text: 'Account created successfully!' });
      setStep('instructions');
      
      // Call onSuccess callback after a delay
      setTimeout(() => {
        onSuccess?.();
      }, 3000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  if (step === 'instructions') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Almost Done!</h3>
          <p className="text-gray-300">Follow these steps to complete your setup:</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-white font-semibold">Start a chat with our Telegram bot</p>
              <a 
                href={`https://t.me/EnergyInsightsAIBot`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                @EnergyInsightsAIBot
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-white font-semibold">Send the command</p>
              <code className="bg-slate-800 text-green-400 px-2 py-1 rounded text-sm">/start</code>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-white font-semibold">Verify your account with this email</p>
              <code className="bg-slate-800 text-green-400 px-2 py-1 rounded text-sm">{formData.email}</code>
            </div>
          </div>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Send className="w-4 h-4" />
            <span className="font-semibold">What happens next?</span>
          </div>
          <p className="text-gray-300 text-sm">
            You'll receive daily energy market summaries via Telegram with news updates and simple market analysis.
          </p>
        </div>

        <button
          onClick={() => setStep('complete')}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-black py-3 rounded-lg font-semibold transition-all duration-300"
        >
          I've completed the setup
        </button>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
        <h3 className="text-2xl font-bold text-white">Welcome to energy<span className="text-emerald-400">.pulse</span>!</h3>
        <p className="text-gray-300">
          You're connected! Professional energy market intelligence will begin flowing to your Telegram within 24 hours.
        </p>
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
          <p className="text-emerald-400 text-sm">
            ✅ You'll receive your first market update within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="telegram_username" className="block text-sm font-semibold text-gray-300 mb-2">
          Telegram Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="telegram_username"
            value={formData.telegram_username}
            onChange={(e) => handleInputChange('telegram_username', e.target.value.replace('@', ''))}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            placeholder="your_username"
            required
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Enter without the @ symbol. Must be 5-32 characters.
        </p>
      </div>

      {message && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-600 text-black py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <span>Connect with Email</span>
          )}
        </button>

        <div className="text-center">
          <span className="text-gray-400 text-sm">or</span>
        </div>

        <a
          href="https://t.me/energypulsebot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
        >
          <Send className="w-5 h-5" />
          <span>Start Telegram Bot</span>
        </a>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-gray-400">
          Free daily energy market updates. Unsubscribe anytime.
        </p>
      </div>
    </form>
  );
}


