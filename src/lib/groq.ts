import Groq from 'groq-sdk';
import { AnalysisResult, NewsResult, MarketData, MarketPrediction } from '@/types';
import { retryWithBackoff } from './retry';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeEnergyMarket(
  newsData: NewsResult[],
  marketData: MarketData[]
): Promise<Omit<AnalysisResult, 'id' | 'created_at'>> {
  try {
    const prompt = `
You are an expert energy market analyst with 20+ years of experience. Analyze the following data and provide a comprehensive market analysis.

CURRENT NEWS DATA:
${newsData.map((article, i) => `
${i + 1}. ${article.title}
   Published: ${new Date(article.published_date).toLocaleDateString()}
   URL: ${article.url}
   Content: ${article.content.substring(0, 300)}...
   Relevance Score: ${article.score}
`).join('\n')}

CURRENT MARKET DATA:
${marketData.map(data => `
${data.symbol}: $${data.price} (${data.change_percent > 0 ? '+' : ''}${data.change_percent.toFixed(2)}%)
`).join('')}

Please provide your analysis in the following JSON format. For each summary bullet point, include the most relevant source URL from the news data provided:

{
  "summary": [
    {
      "text": "Key bullet point 1 about today's energy developments",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 2 about market-moving events",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 3 about geopolitical factors", 
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 4 about supply/demand dynamics",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 5 about regulatory/policy impacts",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 6 about energy sector outlook",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 7 about technology/innovation trends",
      "source_url": "URL from the news data that supports this point"
    },
    {
      "text": "Key bullet point 8 about market sentiment/investor activity",
      "source_url": "URL from the news data that supports this point"
    }
  ],
  "predictions": {
    "crude_oil": {
      "direction": "UP|DOWN|SIDEWAYS",
      "confidence": 85,
      "reasoning": "Specific reasoning for crude oil outlook"
    },
    "natural_gas": {
      "direction": "UP|DOWN|SIDEWAYS", 
      "confidence": 75,
      "reasoning": "Specific reasoning for natural gas outlook"
    },
    "energy_stocks": {
      "direction": "UP|DOWN|SIDEWAYS",
      "confidence": 80,
      "reasoning": "Specific reasoning for energy stocks outlook"
    },
    "utilities": {
      "direction": "UP|DOWN|SIDEWAYS",
      "confidence": 70,
      "reasoning": "Specific reasoning for utilities outlook"
    }
  },
  "reasoning": "Brief complete market analysis in 2-3 sentences max. Focus on key trend and main catalyst. Must be under 150 words total for 10-second execution limit."
}

ANALYSIS GUIDELINES:
- Base predictions on fundamental analysis, technical indicators, and market sentiment
- Consider seasonal patterns, inventory levels, geopolitical events
- Confidence levels should reflect uncertainty and risk factors
- Provide specific reasoning for each prediction
- Include both bullish and bearish scenarios
- Consider time horizons of 1-7 days for predictions
- Factor in correlation between different energy sectors
`;

    const response = await retryWithBackoff(
      async () => await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      }),
      3,
      1000,
      'Groq AI Analysis'
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq API');
    }

    const analysis = JSON.parse(content);

    // Validate the response structure
    if (!analysis.summary || !analysis.predictions || !analysis.reasoning) {
      throw new Error('Invalid analysis response structure');
    }

    // Ensure all required prediction fields are present
    const requiredPredictions = ['crude_oil', 'natural_gas', 'energy_stocks', 'utilities'];
    for (const pred of requiredPredictions) {
      if (!analysis.predictions[pred]) {
        throw new Error(`Missing prediction for ${pred}`);
      }
    }

    return {
      summary: analysis.summary,
      predictions: analysis.predictions,
      reasoning: analysis.reasoning,
      accuracy_score: undefined // Will be calculated later based on actual outcomes
    };
  } catch (error) {
    console.error('Error analyzing energy market:', error);
    
    // Enhanced fallback analysis with basic market insights
    console.log('🔄 Using enhanced fallback analysis with available data...');
    
    // Try to provide basic insights from available data
    const hasNews = newsData && newsData.length > 0;
    const hasMarketData = marketData && marketData.length > 0;
    
    const fallbackSummary = [];
    
    if (hasNews) {
      // Use actual news headlines for better fallback
      fallbackSummary.push(
        ...newsData.slice(0, 3).map(article => ({
          text: `${article.title.substring(0, 150)}...`,
          source_url: article.url
        }))
      );
    }
    
    // Add market context if available
    if (hasMarketData) {
      const oilData = marketData.find(d => d.symbol?.includes('CL=F') || d.symbol?.includes('BZ=F'));
      const gasData = marketData.find(d => d.symbol?.includes('NG=F'));
      
      if (oilData) {
        fallbackSummary.push({
          text: `Oil prices currently at $${oilData.price?.toFixed(2)} with ${oilData.change_percent > 0 ? 'gains' : 'losses'} of ${Math.abs(oilData.change_percent).toFixed(2)}%`,
          source_url: 'https://finance.yahoo.com'
        });
      }
      
      if (gasData) {
        fallbackSummary.push({
          text: `Natural gas trading at $${gasData.price?.toFixed(2)} showing ${gasData.change_percent > 0 ? 'upward' : 'downward'} momentum`,
          source_url: 'https://finance.yahoo.com'
        });
      }
    }
    
    // Ensure we have at least some content
    if (fallbackSummary.length === 0) {
      fallbackSummary.push(
        { text: 'Energy markets showing mixed signals amid ongoing volatility', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Oil and gas prices continue to respond to global supply-demand dynamics', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Geopolitical factors remain key drivers of energy market sentiment', source_url: 'https://energy-pulse.vercel.app' }
      );
    }

    return {
      summary: fallbackSummary.slice(0, 5), // Limit to 5 items
      predictions: {
        crude_oil: {
          direction: 'SIDEWAYS' as const,
          confidence: 60,
          reasoning: 'AI analysis temporarily unavailable. Market showing mixed signals with ongoing volatility.'
        },
        natural_gas: {
          direction: 'SIDEWAYS' as const, 
          confidence: 60,
          reasoning: 'AI analysis temporarily unavailable. Supply-demand dynamics remain in focus.'
        },
        energy_stocks: {
          direction: 'SIDEWAYS' as const,
          confidence: 55,
          reasoning: 'AI analysis temporarily unavailable. Sector performance tied to commodity price movements.'
        },
        utilities: {
          direction: 'SIDEWAYS' as const,
          confidence: 65,
          reasoning: 'AI analysis temporarily unavailable. Utility sector typically shows stability during uncertainty.'
        }
      },
      reasoning: `Market analysis is temporarily unavailable due to technical issues. However, based on available data: ${hasNews ? `${newsData.length} news articles` : 'limited news'} and ${hasMarketData ? `${marketData.length} market data points` : 'basic market data'} suggest continued monitoring of energy sector developments. Full AI analysis will resume shortly.`
    };
  }
}

export async function generateMarketSummary(newsData: NewsResult[]): Promise<string> {
  try {
    const prompt = `
Summarize the following energy market news into 3-5 key bullet points for a daily briefing:

${newsData.map((article, i) => `
${i + 1}. ${article.title}
   ${article.content.substring(0, 200)}...
`).join('\n')}

Format as bullet points focusing on:
- Market-moving events
- Price drivers
- Geopolitical developments
- Supply/demand changes
- Regulatory updates

Keep each point concise but informative.
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 800
    });

    return response.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating market summary:', error);
    return 'Market summary temporarily unavailable';
  }
}

export async function analyzeSentiment(newsData: NewsResult[]): Promise<{
  overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  reasoning: string;
}> {
  try {
    const prompt = `
Analyze the sentiment of the following energy market news and determine if it's overall bullish, bearish, or neutral for energy prices:

${newsData.map((article, i) => `
${i + 1}. ${article.title}
   ${article.content.substring(0, 150)}...
`).join('\n')}

Respond in JSON format:
{
  "overall": "BULLISH|BEARISH|NEUTRAL",
  "confidence": 85,
  "reasoning": "Brief explanation of the sentiment analysis"
}
`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from sentiment analysis');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      overall: 'NEUTRAL',
      confidence: 50,
      reasoning: 'Sentiment analysis temporarily unavailable'
    };
  }
}

export async function validateGroqApiKey(): Promise<boolean> {
  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Test message' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 10
    });

    return !!response.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error validating Groq API key:', error);
    return false;
  }
}

// Helper function to calculate prediction accuracy (for future use)
export function calculateAccuracy(
  predictions: Record<string, MarketPrediction>,
  actualOutcomes: Record<string, { direction: string; actual_change: number }>
): number {
  const symbols = Object.keys(predictions);
  let correctPredictions = 0;

  for (const symbol of symbols) {
    const predicted = predictions[symbol];
    const actual = actualOutcomes[symbol];

    if (!actual) continue;

    const predictedDirection = predicted.direction;
    const actualDirection = actual.actual_change > 2 ? 'UP' : 
                           actual.actual_change < -2 ? 'DOWN' : 'SIDEWAYS';

    if (predictedDirection === actualDirection) {
      correctPredictions++;
    }
  }

  return symbols.length > 0 ? (correctPredictions / symbols.length) * 100 : 0;
}





