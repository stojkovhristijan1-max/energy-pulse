import { NextRequest, NextResponse } from 'next/server';
import { fetchEnergyData } from '@/lib/yahoo-finance';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching live market data for tickers...');
    
    // Fetch current market data for key energy symbols
    const marketData = await fetchEnergyData();
    
    if (!marketData || marketData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No market data available'
      }, { status: 503 });
    }

    console.log(`Successfully fetched data for ${marketData.length} symbols`);
    
    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      count: marketData.length
    });

  } catch (error) {
    console.error('Market data API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Enable CORS for frontend requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
