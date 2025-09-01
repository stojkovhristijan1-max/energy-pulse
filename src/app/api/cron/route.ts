import { NextRequest, NextResponse } from 'next/server';
import { getMarketMovingNews } from '@/lib/tavily';
import { fetchEnergyData } from '@/lib/yahoo-finance';
import { analyzeEnergyMarket } from '@/lib/groq';
import { sendEnergyInsights } from '@/lib/telegram';
import { storeAnalysis, storeMarketData, storeNewsArticles } from '@/lib/supabase';
import { ApiResponse } from '@/types';

// This endpoint will be called by Vercel Cron Jobs or external schedulers
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.NEXTAUTH_SECRET}`;
    
    // Simple auth check for cron jobs (in production, use more robust auth)
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    console.log('🚀 Starting automated energy analysis...');
    const startTime = Date.now();

    // 1. Search for latest energy news
    console.log('📰 Fetching energy news...');
    const newsResults = await getMarketMovingNews();
    console.log(`✅ Found ${newsResults.length} relevant news articles`);

    // 2. Fetch current market data
    console.log('📊 Fetching market data...');
    const marketData = await fetchEnergyData();
    console.log(`✅ Retrieved data for ${marketData.length} energy symbols`);

    // Early exit if no data
    if (newsResults.length === 0 && marketData.length === 0) {
      console.log('⚠️  No data available for analysis');
      return NextResponse.json(
        { success: false, error: 'No data available for analysis' } as ApiResponse,
        { status: 500 }
      );
    }

    // 3. Analyze with AI
    console.log('🤖 Analyzing with AI...');
    const analysis = await analyzeEnergyMarket(newsResults, marketData);
    console.log('✅ AI analysis completed');

    // 4. Store in database
    console.log('💾 Storing analysis results...');
    const [analysisStored, newsStored, marketStored] = await Promise.allSettled([
      storeAnalysis(analysis),
      storeNewsArticles(newsResults),
      storeMarketData(marketData)
    ]);

    // Log storage results
    if (analysisStored.status === 'fulfilled' && analysisStored.value) {
      console.log('✅ Analysis stored successfully');
    } else {
      console.error('❌ Failed to store analysis:', analysisStored.status === 'rejected' ? analysisStored.reason : 'Unknown error');
    }

    if (newsStored.status === 'fulfilled') {
      console.log('✅ News articles stored successfully');
    } else {
      console.error('❌ Failed to store news:', newsStored.status === 'rejected' ? newsStored.reason : 'Unknown error');
    }

    if (marketStored.status === 'fulfilled') {
      console.log('✅ Market data stored successfully');
    } else {
      console.error('❌ Failed to store market data:', marketStored.status === 'rejected' ? marketStored.reason : 'Unknown error');
    }

    // 5. Send to Telegram subscribers
    console.log('📱 Sending insights to Telegram subscribers...');
    
    const finalAnalysis = analysisStored.status === 'fulfilled' && analysisStored.value ? 
      analysisStored.value : 
      {
        id: 'temp-' + Date.now(),
        created_at: new Date().toISOString(),
        ...analysis
      };

    try {
      await sendEnergyInsights(finalAnalysis);
      console.log('✅ Insights sent to Telegram subscribers');
    } catch (telegramError) {
      console.error('❌ Failed to send Telegram insights:', telegramError);
      // Continue execution even if Telegram fails
    }

    const executionTime = Date.now() - startTime;
    console.log(`🎉 Analysis completed successfully in ${executionTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        analysis_id: finalAnalysis.id,
        execution_time_ms: executionTime,
        summary: {
          news_articles: newsResults.length,
          market_symbols: marketData.length,
          predictions_generated: Object.keys(analysis.predictions).length,
          telegram_delivery: 'attempted'
        },
        analysis: {
          summary: analysis.summary,
          predictions: analysis.predictions,
          reasoning: analysis.reasoning.substring(0, 200) + '...' // Truncate for response
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('❌ Error in cron analysis:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cron analysis failed',
        timestamp: new Date().toISOString()
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, auth_token } = body;

    // Simple auth for manual triggers
    if (auth_token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    if (action === 'trigger_analysis') {
      console.log('🔧 Manual analysis trigger received');
      
      // Call the same logic as GET but return more detailed response
      const response = await GET(request);
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' } as ApiResponse,
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in cron POST API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Manual trigger failed' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}







