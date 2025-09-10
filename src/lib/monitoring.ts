import { sendTelegramMessage } from './telegram';

// Admin chat ID for system alerts (you'll need to get this from @userinfobot)
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID;

export interface SystemHealth {
  newsApiStatus: 'healthy' | 'degraded' | 'failed';
  marketApiStatus: 'healthy' | 'degraded' | 'failed';
  aiApiStatus: 'healthy' | 'degraded' | 'failed';
  analysisQuality: 'full' | 'partial' | 'fallback';
  executionTime: number;
  subscriberCount: number;
  messagesSent: number;
  timestamp: string;
}

export class SystemMonitor {
  private health: SystemHealth;

  constructor() {
    this.health = {
      newsApiStatus: 'healthy',
      marketApiStatus: 'healthy',
      aiApiStatus: 'healthy',
      analysisQuality: 'full',
      executionTime: 0,
      subscriberCount: 0,
      messagesSent: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Track API health
  recordNewsApiStatus(status: 'healthy' | 'degraded' | 'failed') {
    this.health.newsApiStatus = status;
    if (status === 'failed') {
      console.log('🚨 News API failure detected');
    }
  }

  recordMarketApiStatus(status: 'healthy' | 'degraded' | 'failed') {
    this.health.marketApiStatus = status;
    if (status === 'failed') {
      console.log('🚨 Market API failure detected');
    }
  }

  recordAiApiStatus(status: 'healthy' | 'degraded' | 'failed') {
    this.health.aiApiStatus = status;
    if (status === 'failed') {
      console.log('🚨 AI API failure detected');
    }
  }

  // Track analysis quality
  recordAnalysisQuality(quality: 'full' | 'partial' | 'fallback', reasoning?: string) {
    this.health.analysisQuality = quality;
    
    if (quality === 'fallback') {
      console.log('⚠️ Fallback analysis used:', reasoning?.substring(0, 100));
    }
  }

  // Track performance
  recordExecutionTime(ms: number) {
    this.health.executionTime = ms;
    
    if (ms > 45000) { // Warn if approaching 60s timeout
      console.log('⚠️ Slow execution detected:', ms, 'ms');
    }
  }

  // Track delivery
  recordDelivery(subscriberCount: number, messagesSent: number) {
    this.health.subscriberCount = subscriberCount;
    this.health.messagesSent = messagesSent;
  }

  // Send admin alerts for critical issues
  async sendAdminAlert(message: string, severity: 'warning' | 'error' = 'warning') {
    if (!ADMIN_CHAT_ID) {
      console.log('📧 Admin alert (no chat ID configured):', message);
      return;
    }

    const emoji = severity === 'error' ? '🚨' : '⚠️';
    const alertMessage = `
${emoji} *Energy Insights System Alert*

${message}

Time: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' })} CEST
Status: ${JSON.stringify(this.health, null, 2)}
    `.trim();

    try {
      await sendTelegramMessage(ADMIN_CHAT_ID, alertMessage);
      console.log('📧 Admin alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send admin alert:', error);
    }
  }

  // Check overall system health and send alerts if needed
  async checkHealthAndAlert() {
    const issues = [];
    
    // Check for API failures
    if (this.health.newsApiStatus === 'failed') {
      issues.push('News API is down');
    }
    if (this.health.marketApiStatus === 'failed') {
      issues.push('Market API is down');
    }
    if (this.health.aiApiStatus === 'failed') {
      issues.push('AI API is down');
    }
    
    // Check analysis quality
    if (this.health.analysisQuality === 'fallback') {
      issues.push('Using fallback analysis (AI unavailable)');
    }
    
    // Check performance
    if (this.health.executionTime > 50000) {
      issues.push(`Slow execution: ${this.health.executionTime}ms`);
    }
    
    // Check delivery
    if (this.health.messagesSent === 0 && this.health.subscriberCount > 0) {
      issues.push('No messages sent despite having subscribers');
    }
    
    // Send alert if issues found
    if (issues.length > 0) {
      const severity = issues.some(i => i.includes('down') || i.includes('No messages sent')) ? 'error' : 'warning';
      await this.sendAdminAlert(`System issues detected:\n• ${issues.join('\n• ')}`, severity);
    }
  }

  // Get current health status
  getHealth(): SystemHealth {
    return { ...this.health };
  }

  // Daily health summary
  async sendDailyHealthSummary() {
    if (!ADMIN_CHAT_ID) return;

    const summary = `
📊 *Daily Energy Insights Health Report*

🔍 APIs: News ${this.getStatusEmoji(this.health.newsApiStatus)} | Market ${this.getStatusEmoji(this.health.marketApiStatus)} | AI ${this.getStatusEmoji(this.health.aiApiStatus)}
📈 Analysis Quality: ${this.health.analysisQuality.toUpperCase()}
⏱️ Execution Time: ${this.health.executionTime}ms
👥 Subscribers: ${this.health.subscriberCount}
📱 Messages Sent: ${this.health.messagesSent}

System Status: ${this.getOverallStatus()}
    `.trim();

    try {
      await sendTelegramMessage(ADMIN_CHAT_ID, summary);
    } catch (error) {
      console.error('❌ Failed to send health summary:', error);
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  private getOverallStatus(): string {
    if (this.health.newsApiStatus === 'failed' && this.health.marketApiStatus === 'failed' && this.health.aiApiStatus === 'failed') {
      return '🚨 CRITICAL';
    }
    if (this.health.analysisQuality === 'fallback' || this.health.messagesSent === 0) {
      return '⚠️ DEGRADED';
    }
    return '✅ HEALTHY';
  }
}

// Global monitor instance
export const systemMonitor = new SystemMonitor();
