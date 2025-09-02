'use client';

import React, { useState, useEffect } from 'react';
import { SignupForm } from './SignupForm';
import { 
  TrendingUp, 
  Zap, 
  Bell, 
  BarChart3, 
  Globe, 
  Brain,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wind,
  Sun,
  Battery,
  Activity,
  Fuel,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

export function LandingPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [currentTicker, setCurrentTicker] = useState(0);
  const [marketTickers, setMarketTickers] = useState([
    { symbol: "WTI", price: "Loading...", change: 0, changePercent: 0 },
    { symbol: "BRENT", price: "Loading...", change: 0, changePercent: 0 },
    { symbol: "NATGAS", price: "Loading...", change: 0, changePercent: 0 },
    { symbol: "XLE", price: "Loading...", change: 0, changePercent: 0 },
    { symbol: "NEE", price: "Loading...", change: 0, changePercent: 0 },
    { symbol: "ENPH", price: "Loading...", change: 0, changePercent: 0 }
  ]);

  // Fetch real market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Map the real data to our ticker format
            const tickerData = [
              { symbol: "WTI", price: data.data.find((d: any) => d.symbol === 'CL=F')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'CL=F')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'CL=F')?.changePercent || 0 },
              { symbol: "BRENT", price: data.data.find((d: any) => d.symbol === 'BZ=F')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'BZ=F')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'BZ=F')?.changePercent || 0 },
              { symbol: "NATGAS", price: data.data.find((d: any) => d.symbol === 'NG=F')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'NG=F')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'NG=F')?.changePercent || 0 },
              { symbol: "XLE", price: data.data.find((d: any) => d.symbol === 'XLE')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'XLE')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'XLE')?.changePercent || 0 },
              { symbol: "NEE", price: data.data.find((d: any) => d.symbol === 'NEE')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'NEE')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'NEE')?.changePercent || 0 },
              { symbol: "ENPH", price: data.data.find((d: any) => d.symbol === 'ENPH')?.price || "N/A", change: data.data.find((d: any) => d.symbol === 'ENPH')?.change || 0, changePercent: data.data.find((d: any) => d.symbol === 'ENPH')?.changePercent || 0 }
            ];
            setMarketTickers(tickerData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        // Keep loading state or show error
      }
    };

    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate tickers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTicker((prev) => (prev + 1) % marketTickers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [marketTickers.length]);

  const features = [
    {
      icon: <Wind className="w-10 h-10" />,
      title: "Renewable Intelligence",
      description: "Advanced AI analyzes renewable energy markets, wind patterns, solar efficiency, and green technology trends with real-time precision.",
      gradient: "from-emerald-400 to-teal-600"
    },
    {
      icon: <Activity className="w-10 h-10" />,
      title: "Market Pulse", 
      description: "Real-time monitoring of energy commodity flows, grid stability, carbon markets, and regulatory shifts across global markets.",
      gradient: "from-green-400 to-emerald-600"
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: "Instant Delivery",
      description: "Lightning-fast alerts and comprehensive briefings delivered to your Telegram, keeping you ahead of energy transitions.",
      gradient: "from-lime-400 to-green-600"
    }
  ];

  const stats = [
    { label: "Prediction Accuracy", value: "94.2%", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Energy Sources", value: "150+", icon: <Globe className="w-5 h-5" /> },
    { label: "Market Updates", value: "24/7", icon: <Activity className="w-5 h-5" /> },
    { label: "Response Time", value: "<30s", icon: <Zap className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Professional Energy Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Energy Orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-green-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-green-400/15 to-teal-500/15 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-lime-500/10 to-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
        
        {/* Energy Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-lime-400 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Market Ticker Bar */}
      <div className="relative z-10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">LIVE MARKETS</span>
              </div>
              <div className="flex items-center space-x-8">
                {marketTickers.map((ticker, index) => (
                  <div 
                    key={ticker.symbol}
                    className={`flex items-center space-x-2 transition-all duration-500 ${
                      index === currentTicker ? 'opacity-100 scale-105' : 'opacity-60'
                    }`}
                  >
                    <span className="text-white font-mono text-sm">{ticker.symbol}</span>
                    <span className="text-white font-bold">${ticker.price}</span>
                    <div className={`flex items-center space-x-1 ${
                      ticker.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {ticker.changePercent >= 0 ? 
                        <ArrowUp className="w-3 h-3" /> : 
                        <ArrowDown className="w-3 h-3" />
                      }
                      <span className="text-xs font-semibold">{Math.abs(ticker.changePercent).toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-semibold">REAL-TIME</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Centered Logo */}
      <header className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto text-center">
          {/* Centered Energy.Pulse Logo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-xl blur-sm opacity-40 scale-110"></div>
            <div className="relative bg-black border border-emerald-400/40 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3">
                <div className="relative">
                  <Battery className="w-8 h-8 text-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="h-8 w-px bg-emerald-400/60"></div>
                <Activity className="w-6 h-6 text-green-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <div className="mb-2">
            <h1 className="text-4xl font-light text-white tracking-wider mb-2">
              energy<span className="text-emerald-400 font-semibold animate-pulse">.pulse</span>
            </h1>
            <div className="text-sm text-emerald-400/80 font-mono tracking-widest uppercase">Market Intelligence</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Energy Animations */}
          <div className="absolute top-20 right-20 opacity-20">
            <Wind className="w-24 h-24 text-emerald-400 animate-spin" style={{animationDuration: '8s'}} />
          </div>
          <div className="absolute top-40 left-20 opacity-15">
            <Sun className="w-20 h-20 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute bottom-40 right-40 opacity-20">
            <Battery className="w-16 h-16 text-green-400 animate-bounce" />
          </div>
          
          {/* Floating Animation Elements */}
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-emerald-400 rounded-full opacity-60 animate-ping" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-green-400 rounded-full opacity-40 animate-ping" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '2s', animationDuration: '5s'}}></div>

          {/* Beautiful Description Quadrants with Center Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto relative z-10">
            {/* Top Left Quadrant */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-6 h-full transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse mr-3"></div>
                  <h3 className="text-lg font-semibold text-white">AI-Powered Analysis</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Advanced AI analyzes real-time market data and breaking news to provide intelligent insights into energy market trends.
                </p>
              </div>
            </div>

            {/* Top Right Quadrant */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-bl from-green-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 h-full transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                  <h3 className="text-lg font-semibold text-white">Real-Time Data</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Live market data from Yahoo Finance for WTI Crude, Brent, Natural Gas, and major energy stocks updated every 2 minutes.
                </p>
              </div>
            </div>

            {/* Center Button - Positioned absolutely in the middle with high z-index */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="relative inline-block group pointer-events-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 scale-110"></div>
                <a
                  href="https://t.me/energypulsebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-black text-xl px-8 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 border border-emerald-400/20 shadow-2xl inline-block"
                >
                  Start Bot & Subscribe
                </a>
              </div>
            </div>

            {/* Bottom Left Quadrant */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-6 h-full transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse mr-3"></div>
                  <h3 className="text-lg font-semibold text-white">Daily Telegram Updates</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Receive professional market intelligence directly in your Telegram with source-attributed news and analysis.
                </p>
              </div>
            </div>

            {/* Bottom Right Quadrant */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tl from-teal-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-black/40 backdrop-blur-sm border border-teal-400/30 rounded-2xl p-6 h-full transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse mr-3"></div>
                  <h3 className="text-lg font-semibold text-white">Premium Sources</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  News from Bloomberg, Reuters, WSJ, and other premium sources with direct links for deeper research.
                </p>
              </div>
            </div>
          </div>





          {/* Simple Signup Modal */}
          {showSignup && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-emerald-500/30">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Connect to Bot</h3>
                  <button
                    onClick={() => setShowSignup(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                <SignupForm onSuccess={() => setShowSignup(false)} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-lg opacity-60"></div>
              <div className="w-px h-6 bg-emerald-400/40"></div>
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-teal-500 rounded-full opacity-60"></div>
            </div>
            <p className="text-gray-400 mb-2">
              Powered by{' '}
              <a
                href="https://tcheevy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-all duration-300 hover:scale-105 inline-block"
              >
                tcheevy.com
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Professional Energy Market Intelligence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


