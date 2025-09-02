import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Telegram webhook test',
    botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2));
    
    // Simple echo response
    if (body.message && body.message.chat) {
      const chatId = body.message.chat.id;
      const text = body.message.text || 'No text';
      
      console.log(`Message from chat ${chatId}: ${text}`);
      
      // Send a simple response back
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Echo: ${text}\n\nBot is working! ✅`
        })
      });
      
      const result = await response.json();
      console.log('Telegram API response:', result);
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
