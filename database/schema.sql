-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  telegram_username TEXT NOT NULL,
  telegram_chat_id TEXT,
  verification_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results table
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_summary JSONB NOT NULL,
  market_predictions JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  accuracy_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data table
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  change_amount DECIMAL(10,4),
  change_percent DECIMAL(8,4),
  volume BIGINT,
  market_cap BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News articles table
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  content TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  source TEXT,
  score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications table
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_username ON users(telegram_username);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_news_articles_published_date ON news_articles(published_date DESC);
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_status ON user_notifications(delivery_status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policies for analysis_results table (public read)
CREATE POLICY "Analysis results are viewable by everyone" ON analysis_results
  FOR SELECT USING (true);

-- Policies for market_data table (public read)
CREATE POLICY "Market data is viewable by everyone" ON market_data
  FOR SELECT USING (true);

-- Policies for news_articles table (public read)
CREATE POLICY "News articles are viewable by everyone" ON news_articles
  FOR SELECT USING (true);

-- Policies for user_notifications table
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active users for notifications
CREATE OR REPLACE FUNCTION get_active_users_for_notifications()
RETURNS TABLE (
  id UUID,
  email TEXT,
  telegram_username TEXT,
  telegram_chat_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.telegram_username, u.telegram_chat_id
  FROM users u
  WHERE u.is_active = true AND u.telegram_chat_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;






