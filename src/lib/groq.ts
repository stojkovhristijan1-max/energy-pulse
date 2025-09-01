import Groq from 'groq-sdk';
import { AnalysisResult, NewsResult, MarketData, MarketPrediction } from '@/types';

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
  "reasoning": "Comprehensive analysis explaining the interconnections between news events, market data, and predictions. Include historical context, key risks, and catalysts to watch. Minimum 200 words."
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

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

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
    
    // Fallback analysis if API fails
    return {
      summary: [
        { text: 'Market analysis temporarily unavailable due to technical issues', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Please check back later for updated insights', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Current market conditions require careful monitoring', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Energy sector showing mixed signals', source_url: 'https://energy-pulse.vercel.app' },
        { text: 'Recommend staying informed on key developments', source_url: 'https://energy-pulse.vercel.app' }
      ],
      predictions: {
        crude_oil: {
          direction: 'SIDEWAYS',
          confidence: 50,
          reasoning: 'Analysis temporarily unavailable'
        },
        natural_gas: {
          direction: 'SIDEWAYS',
          confidence: 50,
          reasoning: 'Analysis temporarily unavailable'
        },
        energy_stocks: {
          direction: 'SIDEWAYS',
          confidence: 50,
          reasoning: 'Analysis temporarily unavailable'
        },
        utilities: {
          direction: 'SIDEWAYS',
          confidence: 50,
          reasoning: 'Analysis temporarily unavailable'
        }
      },
      reasoning: 'Market analysis is temporarily unavailable due to technical issues. Please check back later for comprehensive insights into energy market conditions and predictions.'
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
      model: 'mixtral-8x7b-32768',
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
      model: 'mixtral-8x7b-32768',
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
      model: 'mixtral-8x7b-32768',
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





