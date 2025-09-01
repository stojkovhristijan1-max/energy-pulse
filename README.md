# Energy Insights AI

A full-stack web application that automatically researches energy news, analyzes market implications using AI, and sends insights via Telegram.

## 🚀 Features

- **Real-time News Analysis**: Automated monitoring of energy market news from trusted sources
- **AI-Powered Predictions**: Advanced market analysis using Groq AI with probabilistic forecasting
- **Telegram Integration**: Instant delivery of insights to subscribers
- **Market Data Integration**: Real-time energy commodity and stock prices from Yahoo Finance
- **Professional UI**: Modern, responsive design with violet/green gradient theme
- **Automated Scheduling**: Cron jobs for regular market analysis

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Groq SDK (Mixtral-8x7b)
- **News API**: Tavily Search API
- **Market Data**: Yahoo Finance API
- **Messaging**: Telegram Bot API
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **API Keys**:
   - Supabase project credentials
   - Groq API key
   - Tavily API key
   - Telegram Bot token

## 🔧 Installation

1. **Install Node.js**:
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Clone and setup project**:
   ```bash
   cd "energy insights"
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env.local` file in the root directory:
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

4. **Database Setup**:
   - Create a Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Configure Row Level Security (RLS) policies

5. **Telegram Bot Setup**:
   - Create a bot via [@BotFather](https://t.me/BotFather)
   - Get the bot token
   - Configure webhook (optional for production)

## 🚀 Getting Started

1. **Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

2. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 📡 API Endpoints

- `POST /api/signup` - User registration
- `POST /api/analyze` - Manual market analysis trigger
- `POST /api/telegram` - Telegram webhook handler
- `GET /api/cron` - Automated analysis (scheduled)

## 🤖 Telegram Bot Commands

- `/start` - Subscribe to energy insights
- `/status` - Check subscription status
- `/help` - Get help and support
- `/unsubscribe` - Stop receiving updates

## 📊 Market Coverage

- **Commodities**: WTI/Brent Crude Oil, Natural Gas, Heating Oil, Gasoline
- **ETFs**: XLE, OIH, ENFR
- **Stocks**: XOM, CVX, COP, SHEL, BP, TTE, NEE, FSLR, ENPH
- **Infrastructure**: KMI, EPD, ENB

## 🔄 Automated Analysis Schedule

- **Morning Briefing**: 8:00 AM EST
- **Evening Update**: 6:00 PM EST  
- **Breaking News**: Real-time alerts for significant events

## 🏗 Project Structure

```
energy-insights-ai/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/       # React components
│   ├── lib/             # External integrations
│   ├── types/           # TypeScript definitions
│   └── utils/           # Utility functions
├── database/
│   └── schema.sql       # Database schema
└── package.json
```

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting on API endpoints
- Row Level Security (RLS) in Supabase
- Environment variable protection
- HTTPS enforcement in production

## 📈 Performance Optimizations

- Server-side rendering (SSR)
- Image optimization
- Code splitting
- Caching strategies
- Database indexing

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up Vercel Cron Jobs for automated analysis:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron",
         "schedule": "0 8,18 * * *"
       }
     ]
   }
   ```

### Database Migration

Run the database schema in your Supabase project:
```sql
-- Copy contents from database/schema.sql
```

## 🔧 Configuration

### Telegram Webhook (Production)
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/api/telegram"}'
```

### Cron Job Authentication
The cron endpoint requires authentication:
```
Authorization: Bearer <NEXTAUTH_SECRET>
```

## 📝 API Documentation

### Signup Endpoint
```typescript
POST /api/signup
{
  "email": "user@example.com",
  "telegram_username": "username"
}
```

### Analysis Trigger
```typescript
GET /api/cron
Headers: {
  "Authorization": "Bearer <NEXTAUTH_SECRET>"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Node.js not found**: Install Node.js from official website
2. **API Key errors**: Verify all environment variables are set
3. **Database connection**: Check Supabase credentials
4. **Telegram not working**: Verify bot token and webhook setup

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live Demo**: [https://energy-insights-ai.vercel.app](https://energy-insights-ai.vercel.app)
- **Creator**: [tcheevy.com](https://tcheevy.com)
- **Support**: Create an issue on GitHub

## ⚠️ Disclaimer

This application provides market analysis for informational purposes only. This is not financial advice. Trading and investing in energy markets carries significant risk. Always conduct your own research and consult with qualified financial advisors before making investment decisions.

---

Built with ❤️ by [tcheevy.com](https://tcheevy.com)







