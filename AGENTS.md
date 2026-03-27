# AGENTS.md

## Project Overview

**CVE OpenFetch Telegram Bot** - TypeScript-based Telegram bot that monitors RSS feeds for CVE alerts and sends notifications via Telegram and email. Includes a Next.js dashboard.

---

## Commands

### Bot (root directory)
```bash
npm run dev              # Run bot in development mode (tsx watch)
npm run build            # Compile TypeScript to JavaScript (dist/)
npm run typecheck        # Type-check without emitting
npm run start            # Run compiled JavaScript from dist/
npm test                 # Run all tests
TEST=extractCveIds npm test   # Run single test by name (case-insensitive)
npm run fetch-cve        # Run CVE fetch script manually
```

### Dashboard
```bash
cd dashboard && npm run dev    # Run dashboard (port 3000)
cd dashboard && npm run build  # Build for production
cd dashboard && npm run start  # Run production server
cd dashboard && npm run lint   # Run ESLint
```

### PM2 (Production)
```bash
npm run pm2Start           # Start bot with PM2
cd dashboard && npm run pm2Start  # Start dashboard
pm2 status                # Show PM2 processes
pm2 stop all              # Stop all processes
pm2 restart all           # Restart all processes
pm2 logs                  # View logs
```

---

## Code Style Guidelines

### TypeScript Configuration
- **Bot:** ES2022, NodeNext (ESM), strict mode, noUnusedLocals/Parameters, noImplicitReturns
- **Dashboard:** ES2017, esnext, path alias `@/*` maps to project root

### Imports (ESM Required)
```typescript
// Bot - include .js extension for ESM
import { fetchAlerts } from './services/rssService.js';
import axios from 'axios';

// Dashboard - NO .js extension (Next.js)
import { NextResponse } from "next/server";
import type { DashboardStats } from "@/lib/types";
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
- Use `strict: true` in tsconfig

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
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
```

### Cookie Security (Dashboard)
```typescript
// Use COOKIE_SECURE env var to control secure flag
secure: process.env.COOKIE_SECURE === "true",
```
Set `COOKIE_SECURE=false` in dashboard/.env for HTTP, `true` for HTTPS

### Security Best Practices
- Never expose or log secrets and keys
- Never commit credentials to the repository
- Use `.env` files for sensitive data

---

## Testing Framework

Custom lightweight runner (no external framework):

```typescript
const RUN_TEST = process.env.TEST;
function test(name: string, fn: () => void) {
  if (RUN_TEST && !name.toLowerCase().includes(RUN_TEST.toLowerCase())) return;
  try { fn(); console.log(`✅ ${name}`); }
  catch (e) { console.log(`❌ ${name}: ${e}`); }
}
```

Run specific test: `TEST=extractCveIds npm test`

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

### MongoDB Collections
- **alerts:** rssId, title, link, pubDate, severity, cveIds, sentViaEmail, sentViaTelegram
- **pendingAlerts:** same + status, evaluatedAt, evaluatedBy
- **users:** chatId, username, subscribed
- **emailLogs:** alertId, alertTitle, recipient, status, error

---

## Cron Jobs
- **alertChecker:** Every 30 minutes - automatic CVE notifications
- **pendingAlertChecker:** Every 15 minutes - moderation (disabled by default)
- **Protection:** `isRunning` flag prevents concurrent executions

---

## Telegram Bot Commands
`/start`, `/help`, `/menu`, `/alerts`, `/lastcheck`, `/subscribe`, `/unsubscribe`, `/sendemail`, `/sendmaillastmsg`, `/stats`, `/cve <CVE-ID>`, `/echo [text]`

---

## Environment Variables

### Bot (.env)
```
BOT_TOKEN, MONGODB_URI, MAIL_GMAIL_USER, MAIL_GMAIL_TOKEN
```

### Dashboard (dashboard/.env)
```
MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
COOKIE_SECURE=false  # Set true for HTTPS
PORT=3006
```

---

## External References
- Telegram Bot API: https://core.telegram.org/bots/api
- Mongoose Docs: https://mongoosejs.com/docs/
- Next.js Docs: https://nextjs.org/docs
