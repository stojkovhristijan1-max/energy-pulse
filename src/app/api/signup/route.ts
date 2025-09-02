import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

// This API is deprecated - users now subscribe directly through the Telegram bot
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'This signup method is deprecated. Please start the Telegram bot directly at @energypulsebot'
  } as ApiResponse, { status: 410 });
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This signup method is deprecated. Please start the Telegram bot directly at @energypulsebot'
  } as ApiResponse, { status: 410 });
}







