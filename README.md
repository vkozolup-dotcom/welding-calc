# Kalkulator Spawalniczy / Welding Calculator (TIG)

Offline-capable PWA for quick TIG estimates: pipes (water / hydraulic / air), profiles, consumables and client quotes.

**Live:** https://welding-calc.vercel.app

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- PWA (manifest + service worker)
- Lucide React

## Run locally

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm run start
```

Smoke checks:

```bash
npx tsx scripts/smoke-check.ts
npx tsx scripts/security-check.ts
```

## Features

- Languages: **PL / EN**
- Currencies: **PLN / USD** (+ EUR rate display)
- TIG: rod Ø 1.6–3.2, gas Ar / Ar+He, weld types (butt / fillet / purge)
- Pipe runs with multiple diameters, templates, prep hours (+%), VAT invoice toggle
- Saved jobs (pin, search, duplicate, photo/note, WhatsApp, JSON backup)
- Print / PDF-friendly offer
- Price presets (shop / onsite)
- Public **client link** (`/client`): hours × your rate + phone / email / WhatsApp / socials

## Notes

- Estimates for shop quoting — not a WPS / certification document.
- Data stays in the browser (`localStorage`); export a JSON backup before changing devices.
- No account / payment layer yet (planned for digital-copy sales).
