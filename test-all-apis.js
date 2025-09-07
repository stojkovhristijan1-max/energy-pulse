// Comprehensive test of all APIs
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
  console.log('\n🔍 TESTING TAVILY API...');
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: 'oil price news today',
        search_depth: 'basic',
        max_results: 3
      }),
    });

    if (!response.ok) {
      console.log('❌ Tavily API failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Tavily API working! Found ${data.results?.length || 0} articles`);
    return true;
  } catch (error) {
    console.log('❌ Tavily API error:', error.message);
    return false;
  }
}

async function testGroqAPI() {
  console.log('\n🤖 TESTING GROQ API...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'user', content: 'Say "Groq API working" if you can read this.' }
        ],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Groq API failed:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Groq API working!', data.choices[0]?.message?.content || 'Response received');
    return true;
  } catch (error) {
    console.log('❌ Groq API error:', error.message);
    return false;
  }
}

async function testTelegramAPI() {
  console.log('\n📱 TESTING TELEGRAM API...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`);
    
    if (!response.ok) {
      console.log('❌ Telegram API failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Telegram API working! Bot: ${data.result?.username}`);
    return true;
  } catch (error) {
    console.log('❌ Telegram API error:', error.message);
    return false;
  }
}

async function testYahooFinanceAPI() {
  console.log('\n📊 TESTING YAHOO FINANCE...');
  try {
    const response = await fetch('https://energy-pulse.vercel.app/api/market-data');
    
    if (!response.ok) {
      console.log('❌ Yahoo Finance API failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Yahoo Finance working! Got ${data.length} market symbols`);
    return true;
  } catch (error) {
    console.log('❌ Yahoo Finance error:', error.message);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n💾 TESTING SUPABASE CONNECTION...');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/telegram_subscribers?select=count`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log('❌ Supabase failed:', response.status);
      return false;
    }

    console.log('✅ Supabase connection working!');
    return true;
  } catch (error) {
    console.log('❌ Supabase error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE API TEST SUITE');
  console.log('================================');

  const results = {
    tavily: await testTavilyAPI(),
    groq: await testGroqAPI(),
    telegram: await testTelegramAPI(),
    yahoo: await testYahooFinanceAPI(),
    supabase: await testSupabaseConnection()
  };

  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('========================');
  Object.entries(results).forEach(([api, success]) => {
    console.log(`${success ? '✅' : '❌'} ${api.toUpperCase()}: ${success ? 'WORKING' : 'FAILED'}`);
  });

  const allWorking = Object.values(results).every(r => r);
  console.log(`\n🎯 OVERALL STATUS: ${allWorking ? '✅ ALL SYSTEMS GO!' : '❌ SOME ISSUES FOUND'}`);

  if (allWorking) {
    console.log('\n🚀 Your system is ready to send analyzed news to Telegram!');
    console.log('Next scheduled run: 22:30 CEST daily');
  }
}

runAllTests();
