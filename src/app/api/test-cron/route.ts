import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

// Simple test endpoint to manually trigger cron job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Simple secret check
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid secret' } as ApiResponse,
        { status: 401 }
      );
    }

    console.log('🧪 Manual cron test triggered');
    
    // Call the cron endpoint
    const cronUrl = new URL('/api/cron', request.url);
    const cronResponse = await fetch(cronUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'manual-test-trigger'
      }
    });

    const cronData = await cronResponse.json();
    
    return NextResponse.json({
      success: true,
      data: {
        cron_response: cronData,
        test_time: new Date().toISOString()
      }
    } as ApiResponse);

  } catch (error) {
    console.error('❌ Error in test-cron:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Test failed' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}
