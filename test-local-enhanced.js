// Test the enhanced renewable energy news locally
const fetch = require('node-fetch');

async function testLocalEnhanced() {
  try {
    console.log('🔋 Testing ENHANCED renewable energy news locally...');
    console.log('This will use your NEW renewable energy sources and queries');
    console.log('');

    // Call LOCAL development server
    const response = await fetch('http://localhost:3000/api/cron', {
      method: 'GET',
      headers: {
        'User-Agent': 'local-enhanced-test',
        'X-Local-Test': 'true'
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      console.log('');
      console.log('💡 Make sure your dev server is running:');
      console.log('   npm run dev');
      return;
    }

    const data = await response.json();
    console.log('✅ Enhanced analysis completed and sent!');
    console.log('');
    console.log('📊 Enhanced Summary:');
    console.log(`- News articles processed: ${data.data?.summary?.news_articles || 0} (should be MORE now)`);
    console.log(`- Market symbols analyzed: ${data.data?.summary?.market_symbols || 0} (now includes renewable stocks)`);
    console.log(`- Predictions generated: ${data.data?.summary?.predictions_generated || 0}`);
    console.log(`- Telegram delivery: ${data.data?.summary?.telegram_subscribers || 'unknown'} subscribers`);
    
    if (data.data?.analysis?.summary) {
      console.log('');
      console.log('🔋 Enhanced Key Insights (now with renewables):');
      data.data.analysis.summary.forEach((item, index) => {
        console.log(`${index + 1}. ${item.text}`);
        if (item.source_url) {
          console.log(`   📰 Source: ${item.source_url}`);
        }
        console.log('');
      });
    }

    console.log('🎉 Check your Telegram - you should see RENEWABLE ENERGY content now!');
    console.log('Look for mentions of:');
    console.log('- Solar energy, wind power');
    console.log('- Electric vehicles, battery storage');
    console.log('- Green hydrogen, clean technology');
    console.log('- Energy transition, climate policy');
    console.log('');
    console.log('Bot: @energypulsebot');
    
  } catch (error) {
    console.error('❌ Local test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Check that port 3000 is available');
    console.log('3. Verify environment variables are loaded');
  }
}

console.log('🔋 ENHANCED RENEWABLE ENERGY TEST');
console.log('==================================');
testLocalEnhanced();
