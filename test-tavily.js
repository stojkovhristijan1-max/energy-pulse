// Quick test script to check Tavily API
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

async function testTavilyAPI() {
  try {
    console.log('Testing Tavily API...');
    console.log('API Key exists:', !!process.env.TAVILY_API_KEY);
    console.log('API Key length:', process.env.TAVILY_API_KEY?.length || 0);
    console.log('API Key starts with:', process.env.TAVILY_API_KEY?.substring(0, 10) + '...');
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: 'oil price news today',
        search_depth: 'basic',
        max_results: 3
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Found', data.results?.length || 0, 'results');
    
    if (data.results && data.results.length > 0) {
      console.log('First result:', {
        title: data.results[0].title,
        url: data.results[0].url,
        content: data.results[0].content?.substring(0, 100) + '...'
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTavilyAPI();
