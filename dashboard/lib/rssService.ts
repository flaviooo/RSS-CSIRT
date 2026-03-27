import Parser from 'rss-parser';
import crypto from 'crypto';
import type { RSSAlert, Severity } from './types';

const RSS_FEED_URL = process.env.RSS_FEED_URL || 'https://www.acn.gov.it/portale/feedrss/-/journal/rss/20119/723192';

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
  
  if (text.includes('critica') || text.includes('critical')) {
    return 'critical';
  }
  if (text.includes('alta') || text.includes('high')) {
    return 'high';
  }
  if (text.includes('media') || text.includes('medium')) {
    return 'medium';
  }
  if (text.includes('bassa') || text.includes('low')) {
    return 'low';
  }
  return 'unknown';
}

export function extractCveIds(text: string): string[] {
  const matches = text.match(CVE_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(cve => cve.toUpperCase()))];
}

function generateAlertId(item: Record<string, unknown>): string {
  const base = item.link as string || item.guid as string || item.title as string || Date.now().toString();
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 32);
}

function parseRssItem(item: Record<string, unknown>): RSSAlert {
  const title = item.title as string || 'No title';
  const description = (item.contentSnippet as string) || (item.content as string) || '';
  
  const pubDate = (item.pubDate as string) || (item.isoDate as string) || new Date().toISOString();
  const updatedAt = (item.dcDate as string) || (item['dc:date'] as string) || null;
  
  return {
    id: generateAlertId(item),
    title,
    link: (item.link as string) || '',
    pubDate,
    updatedAt: updatedAt || undefined,
    description: description.slice(0, 500),
    severity: extractSeverity(title, description),
    cveIds: extractCveIds(`${title} ${description}`),
  };
}

export async function fetchAlerts(): Promise<RSSAlert[]> {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    return feed.items.map((item) => parseRssItem(item as unknown as Record<string, unknown>));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
}

export async function fetchLatestAlert(): Promise<RSSAlert | null> {
  const alerts = await fetchAlerts();
  return alerts.length > 0 ? alerts[0] : null;
}

export function formatAlertMessage(alert: RSSAlert): string {
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
