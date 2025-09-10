// Trigger a test message with today's news
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

async function triggerTestMessage() {
  try {
    console.log('🚀 Triggering live analysis with today\'s news...');
    console.log('This will:');
    console.log('- Fetch real energy news from Tavily');
    console.log('- Get live market data from Yahoo Finance');
    console.log('- Generate AI analysis with Groq');
    console.log('- Send message to all Telegram subscribers');
    console.log('');

    const response = await fetch('https://energy-pulse.vercel.app/api/cron', {
      method: 'GET',
      headers: {
        'User-Agent': 'manual-test-trigger',
        'X-Manual-Test': 'true'
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Analysis completed and sent!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- News articles processed: ${data.data?.summary?.news_articles || 0}`);
    console.log(`- Market symbols analyzed: ${data.data?.summary?.market_symbols || 0}`);
    console.log(`- Predictions generated: ${data.data?.summary?.predictions_generated || 0}`);
    console.log(`- Telegram delivery: ${data.data?.summary?.telegram_delivery || 'unknown'}`);
    
    if (data.data?.analysis?.summary) {
      console.log('');
      console.log('🎯 Key Insights Sent to Telegram:');
      data.data.analysis.summary.forEach((item, index) => {
        console.log(`${index + 1}. ${item.text}`);
        if (item.source_url) {
          console.log(`   📰 Source: ${item.source_url}`);
        }
        console.log('');
      });
    }

    console.log('🎉 Check your Telegram bot now - subscribers should have received the message!');
    console.log('Bot: @energypulsebot');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('⚡ LIVE ENERGY ANALYSIS TEST');
console.log('============================');
triggerTestMessage();

