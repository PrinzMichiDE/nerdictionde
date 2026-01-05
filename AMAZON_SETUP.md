# Amazon PA API 5.0 Setup Guide

Dieses Dokument beschreibt die Einrichtung der offiziellen Amazon Product Advertising API (PA API) für Nerdiction.

## 1. Voraussetzungen
- Ein aktives [Amazon PartnerNet](https://partnernet.amazon.de/) Konto.
- Erfüllung der Mindestanforderungen für API-Zugriff (normalerweise 3 qualifizierte Verkäufe innerhalb der ersten 180 Tage).

## 2. API-Zugangsdaten erhalten
1. Logge dich im PartnerNet ein.
2. Gehe zu **Tools** -> **Product Advertising API**.
3. Klicke auf **Zugangsdaten anfordern** (Request Credentials).
4. Du erhältst:
   - **Access Key**
   - **Secret Key** (WICHTIG: Sofort speichern, wird nur einmal angezeigt!)

## 3. Partner Tag (Tracking ID)
- Verwende dein vorhandenes Partner-Tag (z.B. `deinname-21`).

## 4. Umgebungsvariablen konfigurieren
Füge die folgenden Variablen in deine `.env` (lokal) oder in die Vercel Environment Variables ein:

```env
# Amazon PA API Credentials
AMAZON_PAAPI_ACCESS_KEY=dein_access_key
AMAZON_PAAPI_SECRET_KEY=dein_secret_key
AMAZON_PAAPI_PARTNER_TAG=dein_tag-21
AMAZON_PAAPI_MARKETPLACE=de
```

## 5. Funktionsweise
Nerdiction nutzt eine Multi-Source Strategie für Produktdaten:
1. **PA API**: Wenn Credentials vorhanden sind und eine ASIN vorliegt, wird diese primär genutzt.
2. **Tavily Search**: Fallback für Specs und Beschreibung via KI-Suche.
3. **Smart Scraping**: Letzter Fallback für Bilder und Basisdaten.

## 6. Ratelimits
Die PA API 5.0 hat ein Standard-Limit von **1 Request pro Sekunde**. Das System implementiert automatisch Delays im Cron-Job, um dieses Limit zu respektieren.
Darüber hinaus werden API-Antworten für 24 Stunden zwischengespeichert (Caching).

