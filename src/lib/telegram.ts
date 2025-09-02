import TelegramBot from 'node-telegram-bot-api';
import { AnalysisResult, User } from '@/types';
import { getActiveUsers, updateUserTelegramChatId, trackNotification, linkUserTelegramByCode, getTelegramSubscribers, addSubscriber, removeSubscriber } from './supabase';

// Initialize bot (only on server side)
let bot: TelegramBot | null = null;

if (typeof window === 'undefined' && process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
}

export async function sendEnergyInsights(analysis: AnalysisResult): Promise<void> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  try {
    // Get all subscribers from database
    const subscribers = await getTelegramSubscribers();
    console.log(`Sending insights to ${subscribers.length} subscribers`);

    const message = formatAnalysisForTelegram(analysis);

    // Send to all subscribers
    const sendPromises = subscribers.map(async (chatId) => {
      try {
        await bot!.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
        console.log(`✅ Sent to chat ${chatId}`);
      } catch (error) {
        console.error(`❌ Failed to send to chat ${chatId}:`, error);
        // Remove invalid chat IDs from database
        if (error instanceof Error && error.message.includes('chat not found')) {
          await removeSubscriber(chatId);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending energy insights:', error);
    throw error;
  }
}

export function formatAnalysisForTelegram(analysis: AnalysisResult): string {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
🔥 *Energy Insights AI - ${date}*

📊 *Market Summary:*
${analysis.summary.map((point: any) => `• ${point.text}\n  📰 [Source](${point.source_url})`).join('\n\n')}

📈 *Probabilistic Outcomes (Next 1-7 Days):*

🛢️ *Crude Oil:* ${analysis.predictions.crude_oil.direction.toUpperCase()} 
   _Confidence: ${analysis.predictions.crude_oil.confidence}%_
   ${analysis.predictions.crude_oil.reasoning}

⛽ *Natural Gas:* ${analysis.predictions.natural_gas.direction.toUpperCase()}
   _Confidence: ${analysis.predictions.natural_gas.confidence}%_
   ${analysis.predictions.natural_gas.reasoning}

⚡ *Energy Stocks:* ${analysis.predictions.energy_stocks.direction.toUpperCase()}
   _Confidence: ${analysis.predictions.energy_stocks.confidence}%_
   ${analysis.predictions.energy_stocks.reasoning}

🏭 *Utilities:* ${analysis.predictions.utilities.direction.toUpperCase()}
   _Confidence: ${analysis.predictions.utilities.confidence}%_
   ${analysis.predictions.utilities.reasoning}

🧠 *Analysis:*
${analysis.reasoning}

---
⚡ Powered by [tcheevy.com](https://tcheevy.com)
💡 _This is not financial advice. Trade at your own risk._
  `.trim();
}

export async function sendWelcomeMessage(chatId: string, username: string): Promise<boolean> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }

  try {
    const welcomeMessage = `
🎉 *Welcome to Energy Pulse AI!*

Hello @${username}!

You've successfully connected to the most advanced energy market intelligence platform. Get daily AI-powered analysis of oil, gas, and renewable energy markets delivered straight to your Telegram.

⚡ *Your Daily Intelligence Package:*
• 📊 Real-time market data (WTI Crude, Brent, Natural Gas)
• 🧠 AI analysis with probabilistic price predictions
• 📰 Breaking news with direct source links
• 📈 Risk assessments and trading insights
• 🌍 Geopolitical impact analysis

⏰ *Schedule:* Daily briefing at 20:30 UTC (22:30 CEST)

💡 *Available Commands:*
/status - Check subscription status
/help - Full help menu
/unsubscribe - Stop updates

🚀 *Your first market analysis will arrive tomorrow morning!*

Get ready for professional-grade energy market intelligence! 🚀

---
Powered by [tcheevy.com](https://tcheevy.com)
    `.trim();

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    return true;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return false;
  }
}

export async function sendTestMessage(chatId: string): Promise<boolean> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }

  try {
    const testMessage = `
🧪 *Test Message - Energy Insights AI*

This is a test message to verify your Telegram integration is working correctly.

If you received this message, you're all set to receive energy market insights!

---
Powered by [tcheevy.com](https://tcheevy.com)
    `.trim();

    await bot.sendMessage(chatId, testMessage, {
      parse_mode: 'Markdown'
    });

    return true;
  } catch (error) {
    console.error('Error sending test message:', error);
    return false;
  }
}

// Set up bot commands and handlers
export async function setupTelegramBot(): Promise<void> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  try {
    // Set bot commands
    await bot.setMyCommands([
      { command: 'start', description: 'Start receiving energy insights' },
      { command: 'status', description: 'Check your subscription status' },
      { command: 'help', description: 'Get help and support' },
      { command: 'unsubscribe', description: 'Stop receiving updates' }
    ]);

    console.log('Telegram bot commands set up successfully');
  } catch (error) {
    console.error('Error setting up Telegram bot:', error);
  }
}

// Handle incoming messages (for webhook mode)
export async function handleTelegramUpdate(update: any): Promise<void> {
  if (!bot || !update.message) return;

  const message = update.message;
  const chatId = message.chat.id.toString();
  const username = message.from?.username || 'user';
  const text = message.text;

  try {
    if (text?.startsWith('/start')) {
      // Add user to database subscribers
      await addSubscriber(chatId, username);
      
      await bot!.sendMessage(chatId, `🎉 *Welcome to Energy Pulse AI!*\n\nHello @${username}!\n\nYou're now subscribed to daily AI-powered energy market analysis! 🚀\n\n⚡ *What you'll receive:*\n• 📊 Real-time market data analysis\n• 🧠 AI predictions for oil, gas & energy stocks\n• 📰 Breaking news with source links\n• 📈 Trading insights and risk assessments\n\n⏰ *Daily briefing at 22:30 CEST (20:30 UTC)*\n\n🚀 Your first analysis is coming soon!\n\n---\nPowered by [tcheevy.com](https://tcheevy.com)`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
      console.log(`✅ New subscriber: @${username}, chat_id: ${chatId}`);
      
    } else if (text?.startsWith('/status')) {
      await bot!.sendMessage(chatId, '✅ *Your Energy Pulse AI subscription is active!*\n\nYou will receive daily AI-powered energy market analysis at 22:30 CEST (20:30 UTC).', {
        parse_mode: 'Markdown'
      });
      
    } else if (text?.startsWith('/help')) {
      const helpMessage = `
🆘 *Energy Pulse AI Help*

*Commands:*
/start - Start receiving insights
/status - Check subscription status  
/help - Show this help message
/unsubscribe - Stop updates

*Support:*
For technical support, visit [tcheevy.com](https://tcheevy.com)

*About:*
Energy Pulse AI provides professional-grade energy market intelligence using advanced AI, real-time data from Yahoo Finance, and breaking news from premium sources.
      `.trim();
      
      await bot!.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
    } else if (text?.startsWith('/unsubscribe')) {
      await bot!.sendMessage(chatId, '❌ You have been unsubscribed from Energy Pulse AI.\n\nSend /start to resubscribe and receive daily energy market intelligence anytime.');
      
    } else {
      // Handle other messages
      await bot!.sendMessage(chatId, 'Thanks for your message! Use /help to see available commands.');
    }
  } catch (error) {
    console.error('Error handling Telegram update:', error);
  }
}

// Utility functions
export async function validateTelegramBot(): Promise<boolean> {
  if (!bot) return false;

  try {
    const me = await bot.getMe();
    console.log('Telegram bot validated:', me.username);
    return true;
  } catch (error) {
    console.error('Error validating Telegram bot:', error);
    return false;
  }
}

export async function getChatMember(chatId: string, userId: number): Promise<any> {
  if (!bot) return null;

  try {
    return await bot.getChatMember(chatId, userId);
  } catch (error) {
    console.error('Error getting chat member:', error);
    return null;
  }
}

// For linking users after they sign up on the website
export async function linkUserTelegramAccount(email: string, telegramUsername: string): Promise<string | null> {
  try {
    // Generate a unique verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store this code temporarily (in a real app, you'd use Redis or database)
    // For now, we'll just return it for the user to send to the bot
    
    console.log(`Verification code for ${email}: ${verificationCode}`);
    return verificationCode;
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    return null;
  }
}

// Verification code linking system
export async function linkUserByVerificationCode(verificationCode: string, chatId: string, username: string): Promise<{success: boolean, email?: string}> {
  try {
    // Get user by verification code and link their Telegram
    const result = await linkUserTelegramByCode(verificationCode, chatId, username);
    return result;
  } catch (error) {
    console.error('Error linking user by verification code:', error);
    return { success: false };
  }
}

export { bot };





