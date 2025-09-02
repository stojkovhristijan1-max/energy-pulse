-- URGENT: Run this in your Supabase SQL Editor IMMEDIATELY
-- This creates the missing table that's breaking your bot

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id TEXT UNIQUE NOT NULL,
  username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_chat_id ON telegram_subscribers(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_active ON telegram_subscribers(is_active);

-- Test the table works
SELECT COUNT(*) as subscriber_count FROM telegram_subscribers;
