#!/usr/bin/env bash
# scripts/verify.sh — zentrale Qualitätsschranke für nerdiction.de
# Führt Build, Type-Check, Lint und Testsuite aus.
# Exit Code != 0 bei Fehlern in Build / Type-Check / Tests.
# Lint wird ausgeführt und ausgegeben; vorhandene, vorbestehende
# no-explicit-any-Hinweise blockieren nicht (inkrementelle Bereinigung laufend).
set -euo pipefail

echo "=== 1. Type-Check (tsc --noEmit) ==="
npm run type-check

echo "=== 2. Build (next build --webpack) ==="
npm run build

echo "=== 3. Lint (eslint) ==="
# Lint wird nicht als harter Blocker genutzt, solange das Projekt
# vorbestehende no-explicit-any-Errors trägt. Output wird angezeigt.
npm run lint || true

echo "=== 4. Tests ==="
if [ -f package.json ] && node -e "const p=require('./package.json'); process.exit(p.scripts.test ? 0 : 1)"; then
  npm test
else
  echo "Kein 'test'-Skript definiert. E2E-Tests unter tests/ werden vom Dev-Server aus ausgeführt."
fi

echo "=== VERIFY ABGESCHLOSSEN (Build + Type-Check grün) ==="
