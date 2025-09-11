import { NextRequest, NextResponse } from 'next/server';
import { 
  handleWhatsAppWebhook, 
  sendWelcomeMessageWhatsApp,
  validateWhatsAppClient 
} from '@/lib/whatsapp';
import { addWhatsAppSubscriber, getWhatsAppSubscribers } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Twilio WhatsApp webhook
    if (body.From && body.Body) {
      console.log('Received WhatsApp webhook:', JSON.stringify(body, null, 2));
      await handleWhatsAppWebhook(body);
      return new NextResponse('OK', { status: 200 });
    }

    // Handle manual operations
    const { action, phone_number, display_name } = body;

    switch (action) {
      case 'add_subscriber':
        if (!phone_number) {
          return NextResponse.json(
            { success: false, error: 'phone_number is required' } as ApiResponse,
            { status: 400 }
          );
        }

        // Add WhatsApp subscriber
        await addWhatsAppSubscriber(phone_number, display_name);
        
        // Send welcome message
        const welcomeSent = await sendWelcomeMessageWhatsApp(phone_number);
        
        return NextResponse.json({
          success: true,
          data: { 
            message: 'WhatsApp subscriber added successfully',
            welcome_sent: welcomeSent
          }
        } as ApiResponse);

      case 'validate_client':
        const isValid = await validateWhatsAppClient();
        return NextResponse.json({
          success: true,
          data: { client_valid: isValid }
        } as ApiResponse);

      case 'get_subscribers':
        const subscribers = await getWhatsAppSubscribers();
        return NextResponse.json({
          success: true,
          data: { 
            subscribers,
            count: subscribers.length
          }
        } as ApiResponse);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' } as ApiResponse,
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in WhatsApp API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'WhatsApp API error' 
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
      case 'health':
        const isValid = await validateWhatsAppClient();
        return NextResponse.json({
          success: true,
          data: {
            service: 'WhatsApp API',
            status: isValid ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
          }
        } as ApiResponse);

      case 'subscribers':
        const subscribers = await getWhatsAppSubscribers();
        return NextResponse.json({
          success: true,
          data: {
            subscribers,
            count: subscribers.length
          }
        } as ApiResponse);

      default:
        return NextResponse.json({
          success: true,
          data: {
            service: 'Energy Insights WhatsApp API',
            version: '1.0.0',
            endpoints: {
              'POST /api/whatsapp': 'Handle webhooks and manual operations',
              'GET /api/whatsapp?action=health': 'Check WhatsApp client health',
              'GET /api/whatsapp?action=subscribers': 'Get subscriber count'
            }
          }
        } as ApiResponse);
    }

  } catch (error) {
    console.error('Error in WhatsApp GET API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'WhatsApp API error' 
      } as ApiResponse,
      { status: 500 }
    );
  }
}

