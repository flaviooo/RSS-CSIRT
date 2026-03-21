# AGENTS.md

## Project Overview

**CVE OpenFetch Telegram Bot** - TypeScript-based Telegram bot that monitors RSS feeds for CVE alerts and sends notifications via Telegram and email. Includes a Next.js dashboard.

---

## Commands

### Bot (root directory)
```bash
npm run dev          # Run bot in development mode
npm run build        # Compile TypeScript to JavaScript (dist/)
npm run typecheck    # Type-check without emitting
npm start            # Run compiled JavaScript from dist/
npm test             # Run all tests
TEST=extractCveIds npm test   # Filter tests by name (case-insensitive)
```

### Dashboard
```bash
cd dashboard && npm run dev   # Run dashboard (port 3000)
cd dashboard && npm run build  # Build for production
cd dashboard && npm run lint   # Run ESLint
```

---

## Code Style Guidelines

### TypeScript Configuration
- **Bot:** ES2022, NodeNext (ESM), strict mode, noUnusedLocals/Parameters, noImplicitReturns
- **Dashboard:** ES2017, esnext, path alias `@/*` maps to project root

### Imports (ESM Required)
```typescript
// ✓ Correct - include .js extension for ESM
import { fetchAlerts } from './services/rssService.js';
// ✗ Wrong - missing .js extension
import { fetchAlerts } from './services/rssService';
```
**Order:** external packages → internal modules

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Functions/Variables | camelCase | `fetchAlerts()`, `isRunning` |
| Constants | UPPER_SNAKE_CASE | `STATE_FILE` |
| Interfaces/Types/Enums | PascalCase | `Alert`, `IAlert`, `UserStatus` |
| Files | kebab-case | `email-service.ts` |

### TypeScript Best Practices
- Use **explicit return types** for exported functions
- Prefer **interfaces** for object shapes, **type aliases** for unions
- Avoid `any` - use `unknown` with type guards instead

### Error Handling
```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
}
if (!requiredVar) {
  console.error('Required environment variable is missing');
  process.exit(1);
}
```

### Mongoose Schema Pattern
```typescript
// Safe model export (prevents HMR issues)
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
```

### Security Best Practices
- Never expose or log secrets and keys
- Never commit credentials to the repository
- Use `.env` files for sensitive data

---

## Testing Framework

Tests use a custom lightweight runner (no external test framework).

```typescript
const RUN_TEST = process.env.TEST;
function test(name: string, fn: () => void) {
  if (RUN_TEST && !name.toLowerCase().includes(RUN_TEST.toLowerCase())) return;
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { console.log(`❌ ${name}: ${e}`); }
}
```

---

## Telegram Bot Commands

`/start`, `/help`, `/menu`, `/alerts`, `/lastcheck`, `/subscribe`, `/unsubscribe`, `/sendemail`, `/sendmaillastmsg`, `/stats`, `/cve <CVE-ID>`, `/echo [text]`

---

## Reference

### Architecture
```
src/                    # Telegram Bot
├── config/             # MongoDB connection
├── models/             # Mongoose schemas (Alert, PendingAlert, User, EmailLog)
├── commands/           # Telegram command handlers
├── listeners/          # Telegram event listeners
├── services/           # Email, RSS services (rssService, rssPendingService)
├── jobs/               # Alert checker cron jobs
└── types/              # TypeScript interfaces

dashboard/              # Next.js Dashboard
├── app/api/            # REST API endpoints (alerts, pending-alerts, email-logs, stats)
├── app/dashboard/      # Stats, alerts, pending, email logs pages
└── app/login/          # Admin login
```

### Cron Jobs
- **alertChecker:** Every 30 minutes - automatic notifications
- **pendingAlertChecker:** Every 15 minutes - moderation workflow (commented by default)
- **Protection:** `isRunning` flag prevents concurrent executions

### MongoDB Collections
- **alerts:** rssId, title, link, pubDate, updatedAt, severity, cveIds, description, sentViaEmail, sentViaTelegram
- **pendingAlerts:** rssId, title, link, pubDate, severity, cveIds, status (pending/approved/outofftopic/sent), sentViaEmail
- **users:** chatId, username, subscribed
- **emailLogs:** alertId, alertTitle, recipient, status, error

### Pending Alerts Workflow (Moderation)
Alternative system for manual approval of RSS feeds:
1. RSS feed fetched and saved with `status: pending`
2. Dashboard at `/dashboard/pending` shows alerts to evaluate
3. Actions available:
   - 📧 **Invia Mail**: Sends email and logs to EmailLog, sets `status: sent`
   - 🚫 **Cancella**: Sets `status: outofftopic`
4. Approved alerts auto-sent to Telegram subscribers (if pendingAlertChecker enabled)

### Environment Variables
**Bot (.env):** `BOT_TOKEN`, `MONGODB_URI`, `MAIL_GMAIL_USER`, `MAIL_GMAIL_TOKEN`
**Dashboard (.env):** `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### Starting the Application
```bash
npm run dev                    # Terminal 1: Bot
cd dashboard && npm run dev    # Terminal 2: Dashboard
```
Dashboard: `http://localhost:3000/login`

### External References
- Telegram Bot API: https://core.telegram.org/bots/api
- Mongoose Docs: https://mongoosejs.com/docs/
- Node-cron: https://www.npmjs.com/package/node-cron
