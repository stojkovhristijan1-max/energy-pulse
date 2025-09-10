import { TavilySearchResponse, NewsResult } from '@/types';
import { retryWithBackoff } from './retry';

const TAVILY_API_URL = 'https://api.tavily.com/search';

export async function searchEnergyNews(query: string): Promise<NewsResult[]> {
  try {
    const response = await retryWithBackoff(
      async () => await fetch(TAVILY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${query} energy market news today`,
          search_depth: 'advanced',
          include_answer: true,
          max_results: 10,
          include_domains: [
            'bloomberg.com',
            'reuters.com',
            'wsj.com',
            'ft.com',
            'cnbc.com',
            'marketwatch.com',
            'oilprice.com',
            'energyvoice.com'
          ],
          exclude_domains: [
            'reddit.com',
            'twitter.com',
            'facebook.com'
          ]
        }),
      }),
      3,
      2000,
      'Tavily News Search'
    );

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data: TavilySearchResponse = await response.json();

    // Transform Tavily results to our NewsResult format
    const newsResults: NewsResult[] = data.results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.content,
      published_date: result.published_date || new Date().toISOString(),
      score: result.score || 0.5
    }));

    return newsResults;
  } catch (error) {
    console.error('Error searching energy news:', error);
    throw new Error(`Failed to search energy news: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchSpecificEnergyTopics(): Promise<{
  oilNews: NewsResult[];
  gasNews: NewsResult[];
  renewableNews: NewsResult[];
  geopoliticalNews: NewsResult[];
}> {
  try {
    const [oilNews, gasNews, renewableNews, geopoliticalNews] = await Promise.allSettled([
      searchEnergyNews('crude oil WTI Brent price'),
      searchEnergyNews('natural gas price Henry Hub'),
      searchEnergyNews('renewable energy solar wind'),
      searchEnergyNews('energy geopolitics OPEC Russia Ukraine')
    ]);

    return {
      oilNews: oilNews.status === 'fulfilled' ? oilNews.value : [],
      gasNews: gasNews.status === 'fulfilled' ? gasNews.value : [],
      renewableNews: renewableNews.status === 'fulfilled' ? renewableNews.value : [],
      geopoliticalNews: geopoliticalNews.status === 'fulfilled' ? geopoliticalNews.value : []
    };
  } catch (error) {
    console.error('Error searching specific energy topics:', error);
    throw new Error(`Failed to search energy topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getMarketMovingNews(): Promise<NewsResult[]> {
  try {
    const queries = [
      'OPEC production cuts oil prices',
      'Federal Reserve interest rates energy sector',
      'energy infrastructure pipeline refinery',
      'oil gas inventory report EIA',
      'energy company earnings results',
      'renewable energy policy government'
    ];

    const searchPromises = queries.map(query => 
      searchEnergyNews(query).catch(error => {
        console.error(`Failed to search for "${query}":`, error);
        return [];
      })
    );

    const results = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    const allNews = results.flat();
    const uniqueNews = allNews.filter((news, index, array) => 
      array.findIndex(n => n.url === news.url) === index
    );

    // Sort by score and recency
    return uniqueNews
      .sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        const dateA = new Date(a.published_date).getTime();
        const dateB = new Date(b.published_date).getTime();
        
        // Combine score and recency (more weight to score)
        const weightA = scoreA * 0.7 + (dateA / 1000000000) * 0.3;
        const weightB = scoreB * 0.7 + (dateB / 1000000000) * 0.3;
        
        return weightB - weightA;
      })
      .slice(0, 15); // Top 15 most relevant and recent
  } catch (error) {
    console.error('Error getting market moving news:', error);
    throw new Error(`Failed to get market moving news: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function summarizeNewsForAnalysis(newsResults: NewsResult[]): Promise<string> {
  try {
    // Create a comprehensive summary of all news articles
    const newsSummary = newsResults
      .slice(0, 10) // Limit to top 10 articles
      .map((article, index) => {
        const date = new Date(article.published_date).toLocaleDateString();
        return `${index + 1}. [${date}] ${article.title}\n   ${article.content.substring(0, 200)}...`;
      })
      .join('\n\n');

    return newsSummary;
  } catch (error) {
    console.error('Error summarizing news:', error);
    return 'Unable to summarize news articles';
  }
}

// Helper function to validate Tavily API key
export async function validateTavilyApiKey(): Promise<boolean> {
  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: 'test',
        max_results: 1
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating Tavily API key:', error);
    return false;
  }
}





