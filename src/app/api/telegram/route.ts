import { NextRequest, NextResponse } from 'next/server';
import { 
  handleTelegramUpdate, 
  sendTestMessage, 
  validateTelegramBot,
  setupTelegramBot 
} from '@/lib/telegram';
import { updateUserTelegramChatId, getUserByEmail } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Telegram webhook updates
    if (body.update_id) {
      console.log('Received Telegram update:', JSON.stringify(body, null, 2));
      await handleTelegramUpdate(body);
      return new NextResponse('OK', { status: 200 });
    }

    // Handle manual operations
    const { action, email, chat_id, telegram_username } = body;

    switch (action) {
      case 'link_account':
        if (!email || !chat_id) {
          return NextResponse.json(
            { success: false, error: 'Email and chat_id are required' } as ApiResponse,
            { status: 400 }
          );
        }

        // Link Telegram chat ID to user account
        const linkSuccess = await updateUserTelegramChatId(email, chat_id);
        if (!linkSuccess) {
          return NextResponse.json(
            { success: false, error: 'Failed to link Telegram account' } as ApiResponse,
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { message: 'Telegram account linked successfully' }
        } as ApiResponse);

      case 'send_test':
        if (!chat_id) {
          return NextResponse.json(
            { success: false, error: 'chat_id is required' } as ApiResponse,
            { status: 400 }
          );
        }

        const testSent = await sendTestMessage(chat_id);
        if (!testSent) {
          return NextResponse.json(
            { success: false, error: 'Failed to send test message' } as ApiResponse,
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { message: 'Test message sent successfully' }
        } as ApiResponse);

      case 'validate_bot':
        const isValid = await validateTelegramBot();
        return NextResponse.json({
          success: true,
          data: { bot_valid: isValid }
        } as ApiResponse);

      case 'setup_bot':
        await setupTelegramBot();
        return NextResponse.json({
          success: true,
          data: { message: 'Bot setup completed' }
        } as ApiResponse);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' } as ApiResponse,
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in telegram API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Telegram API error' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'webhook_info':
        // Return webhook information (in production, you'd get actual webhook info)
        return NextResponse.json({
          success: true,
          data: {
            webhook_url: `${process.env.NEXTAUTH_URL}/api/telegram`,
            status: 'configured'
          }
        } as ApiResponse);

      case 'bot_info':
        const isValid = await validateTelegramBot();
        return NextResponse.json({
          success: true,
          data: {
            bot_valid: isValid,
            webhook_configured: true
          }
        } as ApiResponse);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' } as ApiResponse,
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in telegram GET API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get telegram info' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}







