import Parser from 'rss-parser';
import crypto from 'crypto';
import { Alert, Severity, RssItem } from '../types/alert.js';
import { RSS_FEED_URL } from '../config/rss.js';

const parser = new Parser({
  customFields: {
    item: [
      ['dc:date', 'dcDate'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

const CVE_REGEX = /CVE-\d{4}-\d{4,}/gi;

export function extractSeverity(title: string, description: string): Severity {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('critica') || text.includes('critical')) return 'critical';
  if (text.includes('alta') || text.includes('high')) return 'high';
  if (text.includes('media') || text.includes('medium')) return 'medium';
  if (text.includes('bassa') || text.includes('low')) return 'low';
  return 'unknown';
}

export function extractCveIds(text: string): string[] {
  const matches = text.match(CVE_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(cve => cve.toUpperCase()))];
}

function generateAlertId(item: RssItem): string {
  const base = item.link || item.guid || item.title || Date.now().toString();
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 32);
}

function parseRssItem(item: Record<string, unknown>): Alert {
  const title = item.title as string || 'No title';
  const description = (item.contentSnippet as string) || (item.content as string) || '';
  const pubDate = (item.pubDate as string) || (item.isoDate as string) || new Date().toISOString();
  const updatedAt = (item.dcDate as string) || (item['dc:date'] as string) || null;
  
  return {
    id: generateAlertId(item as RssItem),
    title,
    link: (item.link as string) || '',
    pubDate,
    updatedAt: updatedAt || undefined,
    description: description.slice(0, 500),
    severity: extractSeverity(title, description),
    cveIds: extractCveIds(`${title} ${description}`),
  };
}

export async function fetchPendingAlerts(): Promise<Alert[]> {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    return feed.items.map((item) => parseRssItem(item as unknown as Record<string, unknown>));
  } catch (error) {
    console.error('Error fetching pending RSS feed:', error);
    throw error;
  }
}

export async function fetchLatestPendingAlert(): Promise<Alert | null> {
  const alerts = await fetchPendingAlerts();
  return alerts.length > 0 ? alerts[0] : null;
}

export function formatPendingAlertMessage(alert: Alert): string {
  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    unknown: '⚪',
  };

  const emoji = severityEmoji[alert.severity || 'unknown'];
  const severityLabel = (alert.severity || 'unknown').toUpperCase();
  const date = new Date(alert.pubDate).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `${emoji} **${severityLabel}**\n\n`;
  message += `📌 ${alert.title}\n`;
  message += `⏰ ${date}\n`;
  
  if (alert.cveIds.length > 0) {
    message += `🔢 CVEs: ${alert.cveIds.join(', ')}\n`;
  }
  
  message += `\n🔗 ${alert.link}`;

  return message;
}

export { RSS_FEED_URL };
