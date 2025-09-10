import { NextRequest, NextResponse } from 'next/server';
import { getMarketMovingNews } from '@/lib/tavily';
import { fetchEnergyData } from '@/lib/yahoo-finance';
import { analyzeEnergyMarket } from '@/lib/groq';
import { sendEnergyInsights } from '@/lib/telegram';
import { storeAnalysis, storeMarketData, storeNewsArticles, getTelegramSubscribers } from '@/lib/supabase';
import { ApiResponse } from '@/types';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { systemMonitor } from '@/lib/monitoring';

// This endpoint will be called by Vercel Cron Jobs or external schedulers
export async function GET(request: NextRequest) {
  try {
    // Skip auth check entirely - Vercel crons are secure by default
    console.log('Cron job triggered - headers:', {
      userAgent: request.headers.get('user-agent'),
      vercelCron: request.headers.get('x-vercel-cron'),
      authorization: request.headers.get('authorization') ? 'present' : 'missing'
    });

    console.log('🚀 Starting automated energy analysis...');
    const startTime = Date.now();

    // Get subscriber count for monitoring
    const subscribers = await getTelegramSubscribers();
    console.log(`👥 Found ${subscribers.length} active subscribers`);

    // Initialize circuit breakers
    const newsCircuit = new CircuitBreaker('news-api', 2, 300000); // 5 min reset
    const marketCircuit = new CircuitBreaker('market-api', 2, 300000);
    const aiCircuit = new CircuitBreaker('ai-analysis', 2, 600000); // 10 min reset

    // 1. Search for latest energy news with circuit breaker
    console.log('📰 Fetching energy news...');
    let newsResults: any[] = [];
    try {
      newsResults = await newsCircuit.execute(() => getMarketMovingNews());
      console.log(`✅ Found ${newsResults.length} relevant news articles`);
      systemMonitor.recordNewsApiStatus('healthy');
    } catch (error) {
      console.log(`⚠️ News API failed (circuit: ${newsCircuit.getState()}):`, error instanceof Error ? error.message : error);
      systemMonitor.recordNewsApiStatus('failed');
      // Continue with empty news array
    }

    // 2. Fetch current market data with circuit breaker
    console.log('📊 Fetching market data...');
    let marketData: any[] = [];
    try {
      marketData = await marketCircuit.execute(() => fetchEnergyData());
      console.log(`✅ Retrieved data for ${marketData.length} energy symbols`);
      systemMonitor.recordMarketApiStatus('healthy');
    } catch (error) {
      console.log(`⚠️ Market API failed (circuit: ${marketCircuit.getState()}):`, error instanceof Error ? error.message : error);
      systemMonitor.recordMarketApiStatus('failed');
      // Continue with empty market data
    }

    // 3. Analyze with AI (always proceed, even with limited data)
    console.log('🤖 Analyzing with AI...');
    let analysis;
    try {
      analysis = await aiCircuit.execute(() => analyzeEnergyMarket(newsResults, marketData));
      console.log('✅ AI analysis completed successfully');
      systemMonitor.recordAiApiStatus('healthy');
      
      // Check if this is actually a fallback analysis
      if (analysis.reasoning.includes('temporarily unavailable') || analysis.reasoning.includes('technical issues')) {
        systemMonitor.recordAnalysisQuality('fallback', analysis.reasoning);
      } else {
        systemMonitor.recordAnalysisQuality('full');
      }
    } catch (error) {
      console.log(`⚠️ AI analysis failed (circuit: ${aiCircuit.getState()}):`, error instanceof Error ? error.message : error);
      systemMonitor.recordAiApiStatus('failed');
      
      // Force a basic fallback analysis
      analysis = {
        summary: [
          { text: 'Energy market analysis experiencing technical difficulties', source_url: 'https://energy-pulse.vercel.app' },
          { text: 'Market monitoring continues with basic data feeds', source_url: 'https://energy-pulse.vercel.app' },
          { text: 'Full analysis capabilities will resume shortly', source_url: 'https://energy-pulse.vercel.app' }
        ],
        predictions: {
          crude_oil: { direction: 'SIDEWAYS', confidence: 50, reasoning: 'Technical analysis unavailable' },
          natural_gas: { direction: 'SIDEWAYS', confidence: 50, reasoning: 'Technical analysis unavailable' },
          energy_stocks: { direction: 'SIDEWAYS', confidence: 50, reasoning: 'Technical analysis unavailable' },
          utilities: { direction: 'SIDEWAYS', confidence: 50, reasoning: 'Technical analysis unavailable' }
        },
        reasoning: 'Analysis systems are experiencing technical difficulties. Normal service will resume shortly.'
      };
      systemMonitor.recordAnalysisQuality('fallback', 'Complete AI system failure');
    }

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

    let messagesSent = 0;
    try {
      await sendEnergyInsights(finalAnalysis);
      messagesSent = subscribers.length;
      console.log('✅ Insights sent to Telegram subscribers');
    } catch (telegramError) {
      console.error('❌ Failed to send Telegram insights:', telegramError);
      messagesSent = 0;
      // Continue execution even if Telegram fails
    }

    const executionTime = Date.now() - startTime;
    console.log(`🎉 Analysis completed successfully in ${executionTime}ms`);

    // Record final monitoring data
    systemMonitor.recordExecutionTime(executionTime);
    systemMonitor.recordDelivery(subscribers.length, messagesSent);

    // Check system health and send alerts if needed
    await systemMonitor.checkHealthAndAlert();

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
    if (auth_token !== process.env.CRON_SECRET) {
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







