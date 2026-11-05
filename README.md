# Second Home (2nd Home) | Midnight Cloud Kitchen

> "Good Food Feels Like Home"  
> Dedicated Night-Delivery Cloud Kitchen in **Biratnagar-03, Nepal**  
> Operating Hours: **6:00 PM to 3:00 AM daily**  
> Direct Hotline: **+977-9761341498** and **+977-9814110239**  
> WhatsApp Orders: **9761341498**  
> Social Handle: **@secondhomebrt**

---

## 🍽️ Overview

**Second Home (2nd Home)** is a production-grade full-stack Progressive Web App (PWA) tailored for midnight delivery operations. Every order is prepared fresh and packaged in **double-sealed insulated thermal foil** to retain piping-hot oven warmth (avg delivery 24 minutes).

### Key Features
- **Midnight Operations**: Dynamic status badge ("OPEN NOW • 6:00 PM – 3:00 AM" or "OPENS 6:00 PM") computed from local time and configurable hours.
- **Dual Currency Engine**: Real-time toggle between **NPR (रू)** and **INR (₹)** with an adjustable exchange rate.
- **Complete Menu**: 9 categorized midnight offerings with stable string uids, dietary left-border indicators (green veg, red non-veg, yellow egg), and instant "86" out-of-stock toggles.
- **Customization Sheet**: Spice levels (*Mild / Homestyle / Hot 🔥 / Extra Hot 💀*), optional add-ons (*Extra Cheese, Fried Egg, Extra Gravy, Dipping Sauce*), separate per-item kitchen notes, and AI Nepali menu translation.
- **Cart & Price Engine**:
  - Coupons: `HOMEFOOD15` (15% off, min order रू300) and `MIDNIGHT50` (flat रू50 off, min order रू500) with clear validation errors.
  - Packaging & delivery fee (free above रू500, otherwise रू40).
  - Late-night surge (11:00 PM to 3:00 AM).
  - Rider tipping (रू20 / 30 / 50).
- **Checkout & Multi-Payment**:
  - Required phone regex validation for Nepal (`/^(\+?977)?\d{10}$/`).
  - Saved address types (*Home, Hostel/PG, Night Office, Friend's Place*).
  - Delivery notes for rider.
  - Fonepay/eSewa/UPI dynamic QR code generated with `qrcode.react`.
  - WhatsApp 1-Tap formatted order ticket.
  - Cash on Delivery (COD) & Card "Coming Soon" badge.
- **Live 5-Stage Order Tracking**:
  - Stage 0: Order received & payment verified
  - Stage 1: Chef cooking
  - Stage 2: Double sealed in thermal foil
  - Stage 3: Night rider on the way (shows assigned rider name, bike plate, and direct call button)
  - Stage 4: Delivered
  - Dynamic real-clock ETA countdown. Persists active order ID in `localStorage` to resume tracking after reloads.
- **My Orders & 1-Tap Re-Order**: Order history stored per customer with instant cart refill replicating all customizations.
- **PIN-Gated Staff Portal & KDS**:
  - Demo PIN gate (`2024`) with rate-limiting (max 5 attempts per minute).
  - 4-column Live Kanban with Web Audio synthesized order chime.
  - Rider assignment dispatch modal.
  - 80mm KOT thermal slip formatted with `@media print` CSS.
  - Menu CMS with 1-click "86" sold-out toggles and dish editor.
  - Site settings and JSON database export/import.
  - Founder Guide with 28% aggregator commission savings calculator.
- **AI Chef Features (Gemini 2.5 Flash via Express backend)**:
  - ✨ *Describe*: One-sentence mouth-watering dish description with local caching.
  - 🎯 *Suggest a Combo*: Suggests complementary items when cart has 2+ items.
  - 🇳🇵 *Nepali Translation*: Translates dish names and descriptions into natural Devanagari Nepali.
  - 💬 *Floating Chef Chat*: Answers menu inquiries, hours, and recommendations.
- **PWA & Structured Data**: `manifest.webmanifest`, SVG favicon, theme color `#090d16`, OpenGraph social cards, and Schema.org `FastFoodRestaurant` JSON-LD.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons, Zustand, motion, `qrcode.react`
- **Backend**: Node.js + Express (`server.ts`) proxying Gemini AI with graceful fallbacks
- **AI**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`)
- **Persistence**: Firebase Firestore + Anonymous Auth (runs on Firebase Spark Free Plan) with resilient local synchronization

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Running in Development
To start the unified Express server and Vite frontend:
```bash
npm run dev
# or
npm run dev:all
```
The application will be running on `http://localhost:3000`.

### 3. Running Unit Tests
Fast deterministic unit tests powered by `node:test`:
```bash
npx --yes tsx --test src/utils/kitchenLogic.test.ts
```

### 4. Production Build
```bash
npm run build
npm start
```

---

## 🔐 Staff / KDS Credentials
- **Default PIN**: `2024` (Configurable from the Settings tab inside the Staff Portal)
- Notice: Demo PIN gate, not intended for banking-level security. Rate limited to 5 tries/min.
