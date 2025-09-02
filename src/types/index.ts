export interface User {
  id: string;
  email: string;
  telegram_username: string;
  telegram_chat_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface NewsResult {
  title: string;
  url: string;
  content: string;
  published_date: string;
  score: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  timestamp: string;
}

export interface MarketPrediction {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;
  reasoning: string;
}

export interface AnalysisResult {
  id: string;
  summary: Array<{
    text: string;
    source_url: string;
  }>;
  predictions: {
    crude_oil: MarketPrediction;
    natural_gas: MarketPrediction;
    energy_stocks: MarketPrediction;
    utilities: MarketPrediction;
  };
  reasoning: string;
  accuracy_score?: number;
  created_at: string;
}

export interface TavilySearchResponse {
  query: string;
  follow_up_questions: string[];
  answer: string;
  results: NewsResult[];
}

export interface SignupFormData {
  email: string;
  telegram_username: string;
  verificationCode?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}







