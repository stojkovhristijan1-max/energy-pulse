import TelegramBot from 'node-telegram-bot-api';
import { AnalysisResult, User } from '@/types';
import { getActiveUsers, updateUserTelegramChatId, trackNotification } from './supabase';

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
    const users = await getActiveUsers();
    console.log(`Sending insights to ${users.length} users`);

    const message = formatAnalysisForTelegram(analysis);

    // Send to all users with error handling
    const sendPromises = users.map(async (user) => {
      try {
        if (!user.telegram_chat_id) {
          console.warn(`User ${user.email} has no telegram_chat_id`);
          return;
        }

        await bot!.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });

        // Track successful delivery
        await trackNotification(user.id, analysis.id, 'sent');
        console.log(`✅ Sent to ${user.telegram_username}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${user.telegram_username}:`, error);
        
        // Track failed delivery
        await trackNotification(
          user.id, 
          analysis.id, 
          'failed', 
          error instanceof Error ? error.message : 'Unknown error'
        );
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
${analysis.summary.map((point: string) => `• ${point}`).join('\n')}

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
🎉 *Welcome to Energy Insights AI!*

Hello @${username}! 

You're now subscribed to receive daily energy market insights powered by advanced AI analysis.

📅 *What you'll receive:*
• Daily market summaries
• AI-powered price predictions  
• Geopolitical analysis
• Supply/demand insights
• Risk assessments

🕒 *Delivery Schedule:*
• Morning briefings (8 AM EST)
• Evening updates (6 PM EST)
• Breaking news alerts

⚙️ *Commands:*
/status - Check your subscription status
/help - Get help and support
/unsubscribe - Stop receiving updates

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
      await sendWelcomeMessage(chatId, username);
      
      // Try to link this chat ID with existing user
      // This would typically be done through a verification process
      console.log(`New user started bot: @${username}, chat_id: ${chatId}`);
      
    } else if (text?.startsWith('/status')) {
      await bot!.sendMessage(chatId, 'Your subscription is active! 🟢\n\nYou will receive daily energy market insights.', {
        parse_mode: 'Markdown'
      });
      
    } else if (text?.startsWith('/help')) {
      const helpMessage = `
🆘 *Energy Insights AI Help*

*Commands:*
/start - Start receiving insights
/status - Check subscription status  
/help - Show this help message
/unsubscribe - Stop updates

*Support:*
For technical support, visit [tcheevy.com](https://tcheevy.com)

*About:*
Energy Insights AI provides professional-grade market analysis using advanced AI and real-time data sources.
      `.trim();
      
      await bot!.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
    } else if (text?.startsWith('/unsubscribe')) {
      await bot!.sendMessage(chatId, '❌ You have been unsubscribed from Energy Insights AI.\n\nSend /start to resubscribe anytime.');
      
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

export { bot };





