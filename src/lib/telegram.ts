import TelegramBot from 'node-telegram-bot-api';
import { AnalysisResult, User, NewsResult } from '@/types';
import { getActiveUsers, updateUserTelegramChatId, trackNotification, linkUserTelegramByCode, getTelegramSubscribers, addSubscriber, removeSubscriber } from './supabase';

// Initialize bot (only on server side)
let bot: TelegramBot | null = null;

if (typeof window === 'undefined' && process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
}

export async function sendEnergyInsights(analysis: AnalysisResult, newsData?: NewsResult[]): Promise<void> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  try {
    // Get all subscribers from database
    const subscribers = await getTelegramSubscribers();
    console.log(`Sending insights to ${subscribers.length} subscribers`);

    const message = formatAnalysisForTelegram(analysis, newsData);

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

// Helper function to ensure news source diversity
function diversifyNewsSources(newsData: NewsResult[], maxArticles: number): NewsResult[] {
  const sourceGroups: { [domain: string]: NewsResult[] } = {};
  
  // Group articles by domain
  newsData.forEach(article => {
    try {
      const domain = new URL(article.url).hostname.replace('www.', '');
      if (!sourceGroups[domain]) {
        sourceGroups[domain] = [];
      }
      sourceGroups[domain].push(article);
    } catch (error) {
      // If URL parsing fails, skip this article
      console.warn('Failed to parse URL:', article.url);
    }
  });
  
  const diversifiedArticles: NewsResult[] = [];
  const maxPerSource = 2; // Maximum articles per source
  
  // First pass: Take 1 article from each source
  Object.values(sourceGroups).forEach(articles => {
    if (articles.length > 0 && diversifiedArticles.length < maxArticles) {
      diversifiedArticles.push(articles[0]);
    }
  });
  
  // Second pass: Fill remaining slots with up to 2 per source
  Object.values(sourceGroups).forEach(articles => {
    for (let i = 1; i < Math.min(articles.length, maxPerSource) && diversifiedArticles.length < maxArticles; i++) {
      diversifiedArticles.push(articles[i]);
    }
  });
  
  // Sort by score and date to maintain quality
  return diversifiedArticles
    .sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      const dateA = new Date(a.published_date).getTime();
      const dateB = new Date(b.published_date).getTime();
      
      // Combine score and recency
      const weightA = scoreA * 0.7 + (dateA / 1000000000) * 0.3;
      const weightB = scoreB * 0.7 + (dateB / 1000000000) * 0.3;
      
      return weightB - weightA;
    })
    .slice(0, maxArticles);
}

export function formatAnalysisForTelegram(analysis: AnalysisResult, newsData?: NewsResult[]): string {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let message = `
🔥 *Energy Insights AI - ${date}*

📊 *Market Summary:*
${analysis.summary.map((point: any) => `• ${point.text}\n  📰 [Source](${point.source_url})`).join('\n\n')}`;

  // Add more news headlines if available with source diversity
  if (newsData && newsData.length > 0) {
    // Ensure source diversity by grouping by domain and selecting max 2 per source
    const diversifiedNews = diversifyNewsSources(newsData, 10);
    
    const additionalNews = diversifiedNews.map((article, index) => {
      const publishDate = new Date(article.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const domain = new URL(article.url).hostname.replace('www.', '');
      return `${index + 1}. *${article.title}*\n   📅 ${publishDate} | 📰 [${domain}](${article.url})`;
    }).join('\n\n');

    message += `

📰 *Latest Energy News Headlines:*
${additionalNews}`;
  }

  message += `

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
💡 _This is not financial advice. Trade at your own risk._`;

  return message.trim();
}

export async function sendWelcomeMessage(chatId: string, username: string): Promise<boolean> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }

  try {
    const welcomeMessage = `
🎉 *Welcome to Energy Pulse AI, @${username}!*

✅ *You're now subscribed!* No further action needed.

📊 *What you'll receive daily at 20:30 UTC:*
• AI analysis of energy markets (oil, gas, renewables)
• Latest energy news summaries with source links
• Basic price movement predictions
• Market insights and key developments

💡 *Commands:*
/status - Check subscription status
/help - Show help menu
/unsubscribe - Stop receiving updates

⚠️ *Important:* This is automated AI analysis, not professional financial advice. Always do your own research before making investment decisions.

🚀 *Your first analysis will arrive at the next scheduled time (20:30 UTC)!*

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

// Send message to specific chat (for admin alerts)
export async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
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
    // Auto-subscribe ANY user who sends ANY message (including /start)
    await addSubscriber(chatId, username);
    
    if (text?.startsWith('/start')) {
      // Send welcome message and auto-subscribe
      await sendWelcomeMessage(chatId, username);
      console.log(`✅ New subscriber: @${username}, chat_id: ${chatId}`);
      
    } else if (text?.startsWith('/status')) {
      await bot!.sendMessage(chatId, '✅ *Your Energy Pulse AI subscription is active!*\n\nYou will receive daily energy market analysis at 20:30 UTC.', {
        parse_mode: 'Markdown'
      });
      
    } else if (text?.startsWith('/help')) {
      const helpMessage = `
🆘 *Energy Pulse AI Help*

*How it works:*
• Send any message = automatically subscribed
• Receive daily analysis at 20:30 UTC
• No further action needed

*Commands:*
/status - Check subscription status  
/help - Show this help message
/unsubscribe - Stop updates

*What you get daily:*
• AI analysis of energy markets (oil, gas, renewables)
• News summaries with source links
• Basic price predictions (not financial advice)

*Support:*
For technical support, visit [tcheevy.com](https://tcheevy.com)

⚠️ *Disclaimer:* This is automated analysis, not professional investment advice.
      `.trim();
      
      await bot!.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
    } else if (text?.startsWith('/unsubscribe')) {
      await removeSubscriber(chatId);
      await bot!.sendMessage(chatId, '❌ *You have been unsubscribed from Energy Pulse AI.*\n\nSend any message to resubscribe anytime!', {
        parse_mode: 'Markdown'
      });
      
    } else {
      // Any other message - they're already subscribed, just acknowledge
      await bot!.sendMessage(chatId, `👋 *Hi @${username}!*\n\n✅ You're subscribed to Energy Pulse AI.\n\nYou'll receive daily energy market analysis at 20:30 UTC.\n\nUse /help for more info or /unsubscribe to stop.\n\n---\nPowered by [tcheevy.com](https://tcheevy.com)`, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      
      console.log(`💬 Acknowledged message from subscriber @${username}, chat_id: ${chatId}`);
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





