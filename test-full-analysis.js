// Test the complete analysis pipeline
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

async function testFullAnalysis() {
  try {
    console.log('🧪 Testing full analysis pipeline...');
    
    // Test production endpoint
    console.log('Testing production cron endpoint...');
    const response = await fetch('https://energy-pulse.vercel.app/api/cron', {
      method: 'GET',
      headers: {
        'User-Agent': 'manual-test'
      }
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Analysis completed successfully!');
    console.log('Summary:', data.data?.summary);
    
    if (data.data?.analysis?.summary) {
      console.log('\n📊 Analysis Summary:');
      data.data.analysis.summary.forEach((item, index) => {
        console.log(`${index + 1}. ${item.text}`);
        if (item.source_url) {
          console.log(`   Source: ${item.source_url}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFullAnalysis();
