# CVE OpenFetch Telegram Bot

TypeScript-based Telegram bot that monitors RSS feeds for CVE alerts and sends notifications via Telegram and email. Includes a Next.js dashboard for viewing alerts and managing Redmine tickets.

---

## Features

- **RSS Monitoring**: Automatically fetches CVE alerts from configured RSS feeds
- **Telegram Notifications**: Sends alerts directly to subscribed users via Telegram
- **Email Notifications**: Sends alerts via email using Gmail SMTP
- **Severity Detection**: Automatically detects and categorizes severity (Critical, High, Medium, Low)
- **CVE ID Extraction**: Parses CVE IDs from alert titles and descriptions
- **Dashboard**: Next.js web interface to view all alerts
- **Redmine Integration**: Creates tickets in Redmine from CVE alerts
- **IMAP Integration**: Reads emails from IMAP server to create tickets

---

## Architecture

```
src/                    # Telegram Bot (ESM)
├── config/             # MongoDB connection
├── models/             # Mongoose schemas
├── commands/           # Telegram command handlers
├── listeners/          # Telegram event listeners
├── services/           # Email, RSS services
├── jobs/               # Cron jobs
└── types/              # TypeScript interfaces

dashboard/              # Next.js 15 Dashboard
├── app/api/            # REST API endpoints
├── app/dashboard/      # Protected pages
└── app/login/          # Admin authentication
```

---

## Commands

### Bot (root directory)
```bash
npm run dev              # Run bot in development mode (tsx watch)
npm run build            # Compile TypeScript to JavaScript (dist/)
npm run typecheck        # Type-check without emitting
npm run start            # Run compiled JavaScript from dist/
npm test                 # Run all tests

# Filter tests by name (case-insensitive)
TEST=severity npm test
TEST=extractCveIds npm test
TEST=formatAlertMessage npm test
```

### Dashboard
```bash
cd dashboard
npm run dev              # Run dashboard (port 3000)
npm run build            # Build for production
npm run start            # Run production server
npm run lint             # Run ESLint
```

### PM2 (Production)
```bash
npm run pm2Start              # Start bot with PM2
cd dashboard && npm run pm2Start  # Start dashboard
pm2 status                    # Show PM2 processes
pm2 logs                      # View logs
pm2 restart all               # Restart all processes
```

---

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and get welcome message |
| `/help` | Show help information |
| `/menu` | Display main menu |
| `/alerts` | View recent alerts |
| `/lastcheck` | Show last check timestamp |
| `/subscribe` | Subscribe to CVE notifications |
| `/unsubscribe` | Unsubscribe from notifications |
| `/sendemail` | Send alert via email |
| `/sendmaillastmsg` | Email the last alert |
| `/stats` | Show bot statistics |
| `/cve <CVE-ID>` | Lookup specific CVE |
| `/echo [text]` | Echo text back |

---

## MongoDB Collections

| Collection | Fields |
|------------|--------|
| **alerts** | rssId, title, link, pubDate, severity, cveIds, sentViaEmail, sentViaTelegram |
| **pendingAlerts** | Same as alerts + status (pending/approved/outofftopic/sent), evaluatedAt, evaluatedBy |
| **users** | chatId, username, subscribed |
| **emailLogs** | alertId, alertTitle, recipient, status (success/failed), error |

---

## Cron Jobs

- **alertChecker**: Runs every 30 minutes - automatic CVE notifications to subscribers
- **pendingAlertChecker**: Runs every 15 minutes - moderation workflow (disabled by default)
- **Protection**: Uses `isRunning` flag to prevent concurrent executions

---

## Environment Variables

### Bot (.env)
```
BOT_TOKEN=<telegram-bot-token>
MONGODB_URI=mongodb://localhost:27017/cve-bot
MAIL_GMAIL_USER=<gmail-email>
MAIL_GMAIL_TOKEN=<gmail-app-password>
```

### Dashboard (dashboard/.env)
```
MONGODB_URI=mongodb://localhost:27017/cve-bot
ADMIN_EMAIL=admin@cvebot.local
ADMIN_PASSWORD=<secure-password>

# Cookie Security (set to "true" for HTTPS)
COOKIE_SECURE=false

# Port
PORT=3006

# Optional: Redmine Integration
REDMINE_URL=http://192.168.90.96
REDMINE_API_KEY=<api-key>

# Optional: IMAP Configuration
IMAP_HOST=imaps.example.com
IMAP_PORT=993
IMAP_USER=user@example.com
IMAP_PASSWORD=<password>
IMAP_TLS=true
IMAP_MAILBOX=INBOX
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB
- Telegram Bot Token (get from @BotFather)
- (Optional) Gmail account with App Password for email notifications

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd dashboard && npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in values
   - Create `dashboard/.env` with required variables

4. Start development servers:
   ```bash
   # Terminal 1: Bot
   npm run dev
   
   # Terminal 2: Dashboard
   cd dashboard && npm run dev
   ```

5. Access the dashboard at `http://localhost:3000/login`

---

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   cd dashboard && npm run build
   ```

2. Start with PM2:
   ```bash
   npm run pm2Start
   cd dashboard && npm run pm2Start
   ```

---

## Testing

The project uses a custom lightweight test runner. Run tests with:
```bash
npm test                  # Run all tests
TEST=extractCveIds npm test  # Run specific test
```

---

## External Links

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## License

MIT
