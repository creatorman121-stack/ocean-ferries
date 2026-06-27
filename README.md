# 🚢 Ocean Fast Ferries · Baggage Pro V200

Professional baggage fee calculator and operations tool for Ocean Fast Ferries (OceanJet).

**Single-file HTML app** — just open `index.html` or host on GitHub Pages. No build steps required.

## Features

- **Baggage Calculator** — Slab-based pricing (Normal/Fragile, 3-tier weight brackets), free allowance bar, smart weight category auto-suggest
- **Live Map Pro** — Leaflet.js map with schedule-based vessel position estimates, route timeline, delay overrides
- **Dashboard** — Revenue pulse, shift notes, route activity, AI load predictor, quick destination buttons
- **Fares & Schedules** — Passenger fare lookup (Tourist/Business/Student/Minor), all routes with connecting fare engine
- **Transaction History** — Search, undo, share receipt, change calculator
- **Admin Panel** — Supervisor role, route/slab management, Gemini AI diagnostic, data export/import
- **AI Chat** — Gemini-powered assistant with offline fallback
- **Dark/Light Theme** — Toggle in header

### Futuristic Features
- 🎤 Voice commands (route, weight, passengers, navigation)
- 📳 Haptic feedback on mobile
- 🔴 Animated transaction count badge
- 🏋️ Smart weight category auto-suggest
- 📡 Offline indicator + service worker stub
- ⏱ Shift timer with live header clock
- ⚠️ Departure alert badge

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Cashier | `cashier` | `cashier` |
| Supervisor | `demo` | `demo` |

## GitHub Pages

This repo is deployed via GitHub Pages. The app is live at:
`https://creatorman121-stack.github.io/ocean-ferries/`

## Tech

- Vanilla HTML/CSS/JS (single file, zero dependencies except Leaflet CDN)
- localStorage persistence
- PDF receipt generation (hand-built, no library)
- Web Speech API for voice commands
- Service Worker stub for offline caching
