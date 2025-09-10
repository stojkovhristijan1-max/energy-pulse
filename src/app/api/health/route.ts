import { NextRequest, NextResponse } from 'next/server';
import { systemMonitor } from '@/lib/monitoring';
import { getTelegramSubscribers } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const subscribers = await getTelegramSubscribers();
    const health = systemMonitor.getHealth();
    
    // Basic system health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      system: {
        ...health,
        subscriberCount: subscribers.length
      },
      services: {
        database: 'healthy', // If we got here, DB is working
        telegram: 'healthy', // Bot is initialized if app started
        apis: {
          news: health.newsApiStatus,
          market: health.marketApiStatus,
          ai: health.aiApiStatus
        }
      }
    };

    // Determine overall status
    const hasFailures = health.newsApiStatus === 'failed' || 
                       health.marketApiStatus === 'failed' || 
                       health.aiApiStatus === 'failed';
    
    if (hasFailures) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
}

// Manual health summary trigger
export async function POST(request: NextRequest) {
  try {
    const { action, auth_token } = await request.json();
    
    if (auth_token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (action === 'send_health_summary') {
      await systemMonitor.sendDailyHealthSummary();
      return NextResponse.json({ success: true, message: 'Health summary sent' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 500 });
  }
}
