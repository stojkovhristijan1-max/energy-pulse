import { AnalysisResult } from '@/types';
import { getWhatsAppSubscribers, addWhatsAppSubscriber, removeWhatsAppSubscriber } from './supabase';

// WhatsApp Business API client - supports both Twilio and Meta Business API
interface WhatsAppClient {
  sendMessage(to: string, message: string): Promise<boolean>;
}

// Initialize WhatsApp client (only on server side)
let whatsappClient: WhatsAppClient | null = null;

if (typeof window === 'undefined') {
  // Option 1: Meta WhatsApp Business API (Recommended for production)
  if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID) {
    whatsappClient = {
      async sendMessage(to: string, message: string): Promise<boolean> {
        try {
          const token = process.env.META_WHATSAPP_TOKEN;
          const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
          
          const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: to.replace(/^\+/, ''), // Remove + prefix if present
              type: 'text',
              text: {
                body: message
              }
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Meta WhatsApp API error:', error);
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error sending Meta WhatsApp message:', error);
          return false;
        }
      }
    };
  }
  // Option 2: Twilio WhatsApp API (Fallback - has limitations)
  else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    whatsappClient = {
      async sendMessage(to: string, message: string): Promise<boolean> {
        try {
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
          
          const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: fromNumber || '',
              To: `whatsapp:${to}`,
              Body: message,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Twilio WhatsApp API error:', error);
            return false;
          }

          return true;
        } catch (error) {
          console.error('Error sending Twilio WhatsApp message:', error);
          return false;
        }
      }
    };
  }
}

export async function sendEnergyInsightsWhatsApp(analysis: AnalysisResult): Promise<void> {
  if (!whatsappClient) {
    console.error('WhatsApp client not initialized');
    return;
  }

  try {
    // Get all WhatsApp subscribers from database
    const subscribers = await getWhatsAppSubscribers();
    console.log(`Sending WhatsApp insights to ${subscribers.length} subscribers`);

    const message = formatAnalysisForWhatsApp(analysis);

    // Send to all subscribers in parallel
    const sendPromises = subscribers.map(async (phoneNumber) => {
      try {
        const success = await whatsappClient!.sendMessage(phoneNumber, message);
        if (success) {
          console.log(`✅ WhatsApp sent to ${phoneNumber}`);
        } else {
          console.error(`❌ WhatsApp failed to ${phoneNumber}`);
        }
        return success;
      } catch (error) {
        console.error(`❌ WhatsApp error for ${phoneNumber}:`, error);
        // Remove invalid phone numbers from database
        if (error instanceof Error && error.message.includes('invalid number')) {
          await removeWhatsAppSubscriber(phoneNumber);
        }
        return false;
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending WhatsApp energy insights:', error);
    throw error;
  }
}

export function formatAnalysisForWhatsApp(analysis: AnalysisResult): string {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // WhatsApp doesn't support Markdown, so we use plain text with emojis
  return `
🔥 *Energy Insights AI - ${date}*

📊 *Market Summary:*
${analysis.summary.map((point: any) => `• ${point.text}\n  📰 Source: ${point.source_url}`).join('\n\n')}

📈 *Probabilistic Outcomes (Next 1-7 Days):*

🛢️ *Crude Oil:* ${analysis.predictions.crude_oil.direction.toUpperCase()} 
   Confidence: ${analysis.predictions.crude_oil.confidence}%
   ${analysis.predictions.crude_oil.reasoning}

⛽ *Natural Gas:* ${analysis.predictions.natural_gas.direction.toUpperCase()}
   Confidence: ${analysis.predictions.natural_gas.confidence}%
   ${analysis.predictions.natural_gas.reasoning}

⚡ *Energy Stocks:* ${analysis.predictions.energy_stocks.direction.toUpperCase()}
   Confidence: ${analysis.predictions.energy_stocks.confidence}%
   ${analysis.predictions.energy_stocks.reasoning}

🏭 *Utilities:* ${analysis.predictions.utilities.direction.toUpperCase()}
   Confidence: ${analysis.predictions.utilities.confidence}%
   ${analysis.predictions.utilities.reasoning}

🧠 *Analysis:*
${analysis.reasoning}

---
⚡ Powered by tcheevy.com
💡 This is not financial advice. Trade at your own risk.
  `.trim();
}

export async function sendWelcomeMessageWhatsApp(phoneNumber: string): Promise<boolean> {
  if (!whatsappClient) {
    console.error('WhatsApp client not initialized');
    return false;
  }

  try {
    const welcomeMessage = `
👋 *Hello!*

To get started with Energy Pulse AI, please reply with *"hello"* to activate your subscription.

📊 *What this bot does:*
• Sends daily energy market analysis using AI
• Covers oil, gas, and renewable energy markets
• Provides news summaries with source links
• Gives basic price predictions (not financial advice)

⏰ *Schedule:* Daily updates at 20:30 UTC

*Commands:*
• "status" - Check if you're subscribed
• "stop" - Unsubscribe from updates

⚠️ *Important:* This is an automated analysis tool, not professional financial advice. Always do your own research before making investment decisions.

---
Powered by tcheevy.com
    `.trim();

    return await whatsappClient.sendMessage(phoneNumber, welcomeMessage);
  } catch (error) {
    console.error('Error sending WhatsApp welcome message:', error);
    return false;
  }
}

export async function handleWhatsAppWebhook(webhookData: any): Promise<void> {
  // Handle incoming WhatsApp messages (for subscription management)
  try {
    const message = webhookData.Body?.toLowerCase() || '';
    const fromNumber = webhookData.From?.replace('whatsapp:', '') || '';

    if (!fromNumber) return;

    if (message.includes('subscribe') || message.includes('start') || message.includes('join')) {
      await addWhatsAppSubscriber(fromNumber);
      await sendWelcomeMessageWhatsApp(fromNumber);
    } else if (message.includes('unsubscribe') || message.includes('stop')) {
      await removeWhatsAppSubscriber(fromNumber);
      if (whatsappClient) {
        await whatsappClient.sendMessage(fromNumber, 
          '❌ You have been unsubscribed from Energy Pulse AI.\n\nSend "subscribe" to rejoin anytime!'
        );
      }
    } else if (message.includes('status')) {
      if (whatsappClient) {
        await whatsappClient.sendMessage(fromNumber, 
          '✅ Your Energy Pulse AI WhatsApp subscription is active!\n\nYou will receive daily AI-powered energy market analysis at 22:30 CEST (20:30 UTC).'
        );
      }
    } else {
      // Auto-subscribe any new message
      await addWhatsAppSubscriber(fromNumber);
      if (whatsappClient) {
        await whatsappClient.sendMessage(fromNumber, 
          '👋 Hello! You\'re now subscribed to Energy Pulse AI!\n\n🎉 You\'ll receive daily energy market analysis at 22:30 CEST.\n\n✅ You\'re all set! Just wait for your daily analysis.\n\n---\nPowered by tcheevy.com'
        );
      }
    }
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
  }
}

export async function validateWhatsAppClient(): Promise<boolean> {
  if (!whatsappClient) return false;

  try {
    // Test with a simple API call to validate credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating WhatsApp client:', error);
    return false;
  }
}

export { whatsappClient };
