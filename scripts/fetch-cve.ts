import 'dotenv/config';
import Parser from 'rss-parser';
import TelegramBot from 'node-telegram-bot-api';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_URL = 'https://www.acn.gov.it/portale/feedrss/-/journal/rss/20119/723192';
const STATE_FILE = path.join(__dirname, '../data/state.json');
const BOT_TOKEN = process.env.BOT_TOKEN;

const parser = new Parser();

function getAdminChatId(): string | null {
  try {
    const data = readFileSync(STATE_FILE, 'utf-8');
    const state = JSON.parse(data);
    return state.adminChatId || null;
  } catch {
    return null;
  }
}

async function sendAlertsToBot(alerts: Array<{ title: string; link: string; pubDate: string; contentSnippet?: string }>) {
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN not configured');
    return;
  }

  const chatId = getAdminChatId();
  if (!chatId) {
    console.error('No subscriber found. Use /subscribe in the bot to subscribe.');
    return;
  }

  const bot = new TelegramBot(BOT_TOKEN);

  for (const alert of alerts) {
    const severity = getSeverity(alert.title, alert.contentSnippet || '');
    const emoji = getSeverityEmoji(severity);
    const cveIds = extractCveIds(`${alert.title} ${alert.contentSnippet}`);

    let message = `${emoji} **${severity.toUpperCase()}**\n\n`;
    message += `📌 ${alert.title}\n`;
    message += `⏰ ${new Date(alert.pubDate).toLocaleString('it-IT')}\n`;
    if (cveIds.length > 0) {
      message += `🔢 CVEs: ${cveIds.join(', ')}\n`;
    }
    message += `\n🔗 ${alert.link}`;

    try {
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      console.log(`Sent: ${alert.title}`);
    } catch (error) {
      console.error(`Error sending alert:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  bot.stopPolling();
}

function getSeverity(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('critica') || text.includes('critical')) return 'critical';
  if (text.includes('alta') || text.includes('high')) return 'high';
  if (text.includes('media') || text.includes('medium')) return 'medium';
  if (text.includes('bassa') || text.includes('low')) return 'low';
  return 'unknown';
}

function getSeverityEmoji(severity: string): string {
  const emojis: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    unknown: '⚪',
  };
  return emojis[severity] || '⚪';
}

function extractCveIds(text: string): string[] {
  const matches = text.match(/CVE-\d{4}-\d{4,}/gi);
  if (!matches) return [];
  return [...new Set(matches.map(cve => cve.toUpperCase()))];
}

function showHelp() {
  console.log('Uso: npm run fetch-cve\n');
  console.log('Fetch degli ultimi CVE dal feed RSS ACN e invio al bot Telegram.');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log('📡 Fetching latest CVEs from ACN...\n');
  
  const feed = await parser.parseURL(RSS_URL);
  const items = feed.items.slice(0, 5);
  
  console.log(`Found ${items.length} alerts`);
  console.log('Sending to bot...\n');
  
  await sendAlertsToBot(items as { title: string; link: string; pubDate: string; contentSnippet?: string }[]);
  
  console.log('\nDone!');
}

main().catch(console.error);
