import { createClient } from '@supabase/supabase-js';
import { User, AnalysisResult, MarketData, NewsResult } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// User operations
export async function createUser(email: string, telegram_username: string): Promise<User | null> {
  try {
    // Generate verification code for Telegram linking
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{ 
        email, 
        telegram_username,
        verification_code: verificationCode
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUser:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    return null;
  }
}

export async function linkUserTelegramByCode(verificationCode: string, chatId: string, username: string): Promise<{success: boolean, email?: string}> {
  try {
    // Find user by verification code and update their Telegram info
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        telegram_chat_id: chatId,
        telegram_username: username,
        verification_code: null // Clear the code after use
      })
      .eq('verification_code', verificationCode)
      .select('email')
      .single();

    if (error) {
      console.error('Error linking user by verification code:', error);
      return { success: false };
    }

    return { success: true, email: data.email };
  } catch (error) {
    console.error('Error in linkUserTelegramByCode:', error);
    return { success: false };
  }
}

export async function updateUserTelegramChatId(email: string, telegram_chat_id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ telegram_chat_id })
      .eq('email', email);

    if (error) {
      console.error('Error updating user telegram chat id:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserTelegramChatId:', error);
    return false;
  }
}

export async function getActiveUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('Error getting active users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActiveUsers:', error);
    return [];
  }
}

// Analysis operations
export async function storeAnalysis(analysis: Omit<AnalysisResult, 'id' | 'created_at'>): Promise<AnalysisResult | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('analysis_results')
      .insert([{
        news_summary: analysis.summary,
        market_predictions: analysis.predictions,
        reasoning: analysis.reasoning,
        accuracy_score: analysis.accuracy_score
      }])
      .select()
      .single();

    if (error) {
      console.error('Error storing analysis:', error);
      return null;
    }

    return {
      id: data.id,
      summary: data.news_summary,
      predictions: data.market_predictions,
      reasoning: data.reasoning,
      accuracy_score: data.accuracy_score,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in storeAnalysis:', error);
    return null;
  }
}

export async function getLatestAnalysis(): Promise<AnalysisResult | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting latest analysis:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      summary: data.news_summary,
      predictions: data.market_predictions,
      reasoning: data.reasoning,
      accuracy_score: data.accuracy_score,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in getLatestAnalysis:', error);
    return null;
  }
}

// Market data operations
export async function storeMarketData(marketData: Omit<MarketData, 'timestamp'>[]): Promise<boolean> {
  try {
    const dataToInsert = marketData.map(data => ({
      symbol: data.symbol,
      price: data.price,
      change_amount: data.change,
      change_percent: data.change_percent
    }));

    const { error } = await supabaseAdmin
      .from('market_data')
      .insert(dataToInsert);

    if (error) {
      console.error('Error storing market data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in storeMarketData:', error);
    return false;
  }
}

export async function getLatestMarketData(): Promise<MarketData[]> {
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error getting latest market data:', error);
      return [];
    }

    return (data || []).map(item => ({
      symbol: item.symbol,
      price: parseFloat(item.price),
      change: parseFloat(item.change_amount || '0'),
      change_percent: parseFloat(item.change_percent || '0'),
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error in getLatestMarketData:', error);
    return [];
  }
}

// News operations
export async function storeNewsArticles(articles: NewsResult[]): Promise<boolean> {
  try {
    const dataToInsert = articles.map(article => ({
      title: article.title,
      url: article.url,
      content: article.content,
      published_date: article.published_date,
      score: article.score
    }));

    const { error } = await supabaseAdmin
      .from('news_articles')
      .upsert(dataToInsert, { onConflict: 'url' });

    if (error) {
      console.error('Error storing news articles:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in storeNewsArticles:', error);
    return false;
  }
}

// Notification tracking
export async function trackNotification(
  userId: string,
  analysisId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_notifications')
      .insert([{
        user_id: userId,
        analysis_id: analysisId,
        sent_at: new Date().toISOString(),
        delivery_status: status,
        error_message: errorMessage
      }]);

    if (error) {
      console.error('Error tracking notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackNotification:', error);
    return false;
  }
}

// Telegram subscriber management
export async function getTelegramSubscribers(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('telegram_subscribers')
      .select('chat_id')
      .eq('is_active', true);

    if (error) {
      console.error('Error getting telegram subscribers:', error);
      return [];
    }

    return data.map(sub => sub.chat_id);
  } catch (error) {
    console.error('Error in getTelegramSubscribers:', error);
    return [];
  }
}

export async function addSubscriber(chatId: string, username: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('telegram_subscribers')
      .upsert({ 
        chat_id: chatId, 
        username: username,
        is_active: true 
      }, { 
        onConflict: 'chat_id' 
      });

    if (error) {
      console.error('Error adding subscriber:', error);
    }
  } catch (error) {
    console.error('Error in addSubscriber:', error);
  }
}

export async function removeSubscriber(chatId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('telegram_subscribers')
      .update({ is_active: false })
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error removing subscriber:', error);
    }
  } catch (error) {
    console.error('Error in removeSubscriber:', error);
  }
}





