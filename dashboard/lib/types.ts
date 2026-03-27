export interface IAlert {
  _id: string;
  rssId: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  updatedAt: Date | null;
  severity: "critical" | "high" | "medium" | "low" | "unknown";
  cveIds: string[];
  receivedAt: Date;
  sentViaEmail: boolean;
  sentViaTelegram: boolean;
  emailSentAt: Date | null;
}

export type PendingAlertStatus = "pending" | "approved" | "outofftopic" | "sent";

export interface IPendingAlert {
  _id: string;
  rssId: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  updatedAt: Date | null;
  severity: "critical" | "high" | "medium" | "low" | "unknown";
  cveIds: string[];
  status: PendingAlertStatus;
  receivedAt: Date;
  evaluatedAt: Date | null;
  evaluatedBy: string | null;
  sentViaEmail: boolean;
  emailSentAt: Date | null;
}

export interface IEmailLog {
  _id: string;
  alertId: string;
  alertTitle: string;
  sentAt: Date;
  recipient: string;
  status: "success" | "failed";
  error: string | null;
}

export interface IUser {
  _id: string;
  chatId: string;
  username: string;
  subscribed: boolean;
  createdAt: Date;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export interface RSSAlert {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  severity?: Severity;
  cveIds: string[];
  updatedAt?: string;
}

export interface DashboardStats {
  totalAlerts: number;
  totalEmailsSent: number;
  emailsSentLast7Days: number;
  emailsSentLast30Days: number;
  alertsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  };
  recentAlerts: IAlert[];
}
