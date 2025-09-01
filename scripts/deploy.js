#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Energy Insights AI Deployment Script');
console.log('=====================================');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Make sure you\'re in the project root directory.');
  process.exit(1);
}

// Read package.json to verify project
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.name !== 'energy-insights-ai') {
  console.error('❌ Error: This doesn\'t appear to be the Energy Insights AI project.');
  process.exit(1);
}

try {
  console.log('🔍 Checking environment...');
  
  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    console.warn('⚠️  Warning: .env.local file not found. Make sure to set up environment variables.');
  }
  
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔧 Running build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log('');
  console.log('📋 Next steps for deployment:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect your repository to Vercel');
  console.log('3. Set up environment variables in Vercel dashboard');
  console.log('4. Configure Supabase database');
  console.log('5. Set up Telegram webhook (optional)');
  console.log('');
  console.log('🔗 Useful links:');
  console.log('• Vercel: https://vercel.com');
  console.log('• Supabase: https://supabase.com');
  console.log('• Documentation: See README.md');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}







