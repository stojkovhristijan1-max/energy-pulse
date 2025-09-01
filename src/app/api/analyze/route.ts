import { NextRequest, NextResponse } from 'next/server';
import { getMarketMovingNews } from '@/lib/tavily';
import { fetchEnergyData } from '@/lib/yahoo-finance';
import { analyzeEnergyMarket } from '@/lib/groq';
import { storeAnalysis, storeMarketData, storeNewsArticles } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting energy market analysis...');

    // 1. Fetch latest news
    console.log('Fetching energy news...');
    const newsResults = await getMarketMovingNews();
    console.log(`Found ${newsResults.length} news articles`);

    // 2. Fetch current market data
    console.log('Fetching market data...');
    const marketData = await fetchEnergyData();
    console.log(`Retrieved data for ${marketData.length} symbols`);

    if (newsResults.length === 0 && marketData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available for analysis' } as ApiResponse,
        { status: 500 }
      );
    }

    // 3. Analyze with AI
    console.log('Analyzing with AI...');
    const analysis = await analyzeEnergyMarket(newsResults, marketData);

    // 4. Store results in database
    console.log('Storing analysis results...');
    const [storedAnalysis, newsStored, marketStored] = await Promise.allSettled([
      storeAnalysis(analysis),
      storeNewsArticles(newsResults),
      storeMarketData(marketData)
    ]);

    if (storedAnalysis.status === 'rejected') {
      console.error('Failed to store analysis:', storedAnalysis.reason);
    }
    if (newsStored.status === 'rejected') {
      console.error('Failed to store news:', newsStored.reason);
    }
    if (marketStored.status === 'rejected') {
      console.error('Failed to store market data:', marketStored.reason);
    }

    const finalAnalysis = storedAnalysis.status === 'fulfilled' ? storedAnalysis.value : {
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString(),
      ...analysis
    };

    console.log('Analysis completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        analysis: finalAnalysis,
        metadata: {
          news_count: newsResults.length,
          market_symbols: marketData.length,
          analysis_time: new Date().toISOString()
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Error in analyze API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // Return system status
      return NextResponse.json({
        success: true,
        data: {
          status: 'operational',
          last_analysis: new Date().toISOString(),
          services: {
            tavily: 'operational',
            groq: 'operational', 
            yahoo_finance: 'operational',
            supabase: 'operational'
          }
        }
      } as ApiResponse);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' } as ApiResponse,
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in analyze GET API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get status' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}







