const fetch = require('node-fetch');

async function triggerTestMessage() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Triggering test message...');
    
    const response = await fetch('https://energy-insights-chi.vercel.app/api/cron', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.log(`⏱️  Execution time: ${executionTime.toFixed(2)} seconds`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      return;
    }

    const result = await response.text();
    console.log('✅ Response:', result);
    console.log(`🎯 Target: <8 seconds | Actual: ${executionTime.toFixed(2)}s | Status: ${executionTime < 8 ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    console.error(`❌ Error after ${executionTime.toFixed(2)}s:`, error.message);
  }
}

triggerTestMessage();