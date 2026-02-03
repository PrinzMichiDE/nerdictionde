# Twitch Streaming Tools Setup

## Environment Variables

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```env
# Twitch OAuth Configuration
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=https://yourdomain.com/api/auth/twitch/callback
# Für lokale Entwicklung: http://localhost:3000/api/auth/twitch/callback

# JWT Secret (mindestens 32 Zeichen)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-in-production

# Encryption Key für Token-Verschlüsselung (32 Zeichen)
ENCRYPTION_KEY=your-32-char-encryption-key-here!!

# Session Cookie Name (optional, Standard: twitch_session)
SESSION_COOKIE_NAME=twitch_session

# Base URL für OAuth Redirects (optional)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Twitch App Setup

1. Gehe zu https://dev.twitch.tv/console/apps
2. Erstelle eine neue App
3. Setze die Redirect URI auf: `https://yourdomain.com/api/auth/twitch/callback`
4. Kopiere Client ID und Client Secret in die `.env` Datei

## Database Migration

Führe die Migration aus:

```bash
npm run db:migrate
```

Oder mit Prisma Studio prüfen:

```bash
npm run db:studio
```

## Features

- ✅ Twitch OAuth Login
- ✅ Geschützte Routes für `/tools/*`
- ✅ User-spezifische Daten
- ✅ Title Generator Tool
- ✅ Schedule Planner Tool
- ✅ Weitere 197 Tools können implementiert werden

## Nächste Schritte

1. Setze die Environment Variables
2. Führe die Migration aus
3. Teste den Login Flow
4. Implementiere weitere Tools nach Bedarf
