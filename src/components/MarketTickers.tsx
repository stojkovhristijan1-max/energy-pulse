'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ArrowUp, ArrowDown } from 'lucide-react';

export function MarketTickers() {
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

  return (
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
  );
}
