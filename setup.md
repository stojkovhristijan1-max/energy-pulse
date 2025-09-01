# Energy Insights AI - Setup Guide

## Step 1: Install Node.js

1. Download Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)
2. Run the installer and follow the instructions
3. Verify installation by opening Command Prompt/PowerShell and running:
   ```
   node --version
   npm --version
   ```

## Step 2: Install Dependencies

Open Command Prompt/PowerShell in the project directory and run:
```bash
npm install
```

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env.local` (if .env.example exists)
2. Or create a new `.env.local` file with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
TAVILY_API_KEY=your_tavily_key
GROQ_API_KEY=your_groq_key
TELEGRAM_BOT_TOKEN=your_bot_token

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

## Step 4: Get API Keys

### Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy the Project URL and anon public key
5. Copy the service_role secret key
6. Go to SQL Editor and run the schema from `database/schema.sql`

### Groq (AI Analysis)
1. Go to [console.groq.com](https://console.groq.com)
2. Create an account
3. Generate an API key
4. Copy the key

### Tavily (News Search)
1. Go to [tavily.com](https://tavily.com)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy the key

### Telegram Bot
1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the instructions to create a bot
4. Copy the bot token

## Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the Setup

1. Visit the landing page
2. Try signing up with your email and Telegram username
3. Test the Telegram bot by messaging it
4. Check if the analysis API works by visiting `/api/analyze?action=status`

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add all environment variables in Vercel dashboard
5. Deploy

## Troubleshooting

- **Node.js not found**: Make sure Node.js is installed and added to PATH
- **npm install fails**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- **API errors**: Check that all environment variables are set correctly
- **Database errors**: Make sure Supabase is set up and the schema is applied

## Support

If you need help, please:
1. Check the README.md file
2. Review the error messages carefully
3. Ensure all API keys are valid and have proper permissions
4. Contact support at [tcheevy.com](https://tcheevy.com)







