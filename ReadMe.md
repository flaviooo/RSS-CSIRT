## Commands
### Bot (root directory)
```bash
npm run dev          # Run bot in development mode
npm run build        # Compile TypeScript to JavaScript (dist/)
npm run typecheck    # Type-check without emitting
npm start            # Run compiled JavaScript from dist/
npm test             # Run all tests
npm test -- --help   # Show test help
# Filter tests by name (case-insensitive)
TEST=severity npm test        # Tests containing "severity"
TEST=extractCveIds npm test   # Tests containing "extractCveIds"
TEST=formatAlertMessage npm test
```
### Dashboard
```bash
cd dashboard
npm run dev          # Run dashboard (port 3000)
npm run build        # Build for production
npm run lint         # Run ESLint
```
---
### MongoDB Collections
- **alerts:** rssId, title, link, severity, cveIds, sentViaEmail, sentViaTelegram
- **users:** chatId, username, subscribed
- **emailLogs:** alertId, recipient, status, error
### Environment Variables
**Bot (.env):**
```
BOT_TOKEN=<telegram-bot-token>
MONGODB_URI=mongodb://192.168.0.0:27017/cve-bot
MAIL_GMAIL_USER=<email>
MAIL_GMAIL_TOKEN=<app-password>
```
**Dashboard (dashboard/.env):**
```
MONGODB_URI=mongodb://192.168.40.30:27017/cve-bot
ADMIN_EMAIL=admin@cvebot.local
ADMIN_PASSWORD=cvebot-secure-2024
```
### Starting the Application
```bash
npm run dev                    # Terminal 1: Bot
cd dashboard && npm run dev    # Terminal 2: Dashboard
```
Dashboard login: `http://localhost:3000/login`
