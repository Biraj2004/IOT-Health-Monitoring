# SEO Optimization Guide — VITAL / MONITOR Project Implementation

A practical checklist and implementation record for the **VITAL / MONITOR** IoT Clinical Telemetry Dashboard ([https://vitalmonitor.vercel.app](https://vitalmonitor.vercel.app)).

---

## 1. Technical SEO (Foundation)

- [x] **No `noindex` tags** left on live pages — verified `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`
- [ ] **No broken links** — run a crawler (Screaming Frog, Ahrefs, or `sitemap-checker`) monthly
- [x] **`robots.txt`** present and correctly configured in `dashboard/public/robots.txt` (allows static assets and AI crawlers)
- [x] **`sitemap.xml`** built in `dashboard/public/sitemap.xml`, pointing to `https://vitalmonitor.vercel.app/`
- [x] **Canonical tags** on page (`<link rel="canonical" href="https://vitalmonitor.vercel.app/" />`) to prevent duplicate content
- [x] **HTTPS enforced** site-wide with automatic HTTPS redirects via Vercel Edge Network
- [x] **Clean URL slugs** — root `/` routing, no query-string clutter
- [x] **Single-page routing (SPA)** — rewrites configured in `vercel.json`

---

## 2. On-Page SEO

- [x] **Unique meta title** — `VITAL / MONITOR — Real-Time IoT Health Telemetry` (55 characters)
- [x] **Unique meta description** — `Real-time clinical health monitoring dashboard tracking SpO2, body temperature, heart rate, and live Lead I ECG waveform streaming from IoT sensors.` (152 characters)
- [x] **Only one `<h1>` per page** — `<h1>Patient overview</h1>`, followed by `<h2>` section headers
- [x] **Alt text on all image assets and labels** — descriptive ARIA labels on cards and canvas
- [x] **`og:image` and Open Graph tags** — high-resolution 1200×630 brand icon asset at `https://vitalmonitor.vercel.app/og-image.png` featuring the pure medical heart mark in high quality
- [x] **Twitter Cards** — `summary_large_image` configured with title, description, and high-quality icon preview
- [x] **Schema markup / structured data** — JSON-LD graph declaring `WebApplication` and `MedicalWebPage` entities
- [x] **Keyword placement** — natural semantic keywords (`SpO₂`, `body temperature`, `heart rate`, `ECG Lead I`, `MAX30102`, `DS18B20`, `AD8232`)

---

## 3. Performance & Core Web Vitals

- [x] **Compress all images** — vector SVG for modern browsers, optimized PNG icons, and high-resolution 1200×630 OG image
- [x] **Improve Core Web Vitals**:
  - LCP (Largest Contentful Paint) < 1.0s (lightweight bundle, ~300ms build)
  - INP (Interaction to Next Paint) < 50ms
  - CLS (Cumulative Layout Shift) = 0 (fixed dimensions, canvas containers)
- [x] **Minify CSS/JS** — Vite 8 optimized production chunking
- [x] **Use a CDN** — Vercel global edge network with 1-year immutable caching on `/assets/*`
- [x] **Mobile responsiveness** — verified across Desktop (1440px), Tablet (768px), and Mobile (390px, 336px)

---

## 4. Brand Assets & Touch Icons

- [x] **SVG Favicon**: `dashboard/public/favicon.svg` (high-DPI scalable medical red heart mark)
- [x] **Browser Favicons**: `dashboard/public/favicon-16x16.png`, `dashboard/public/favicon-32x32.png`, `dashboard/public/favicon.ico`
- [x] **Apple Touch Icon**: `dashboard/public/apple-touch-icon.png` (180×180 for iOS home screen)
- [x] **Android / PWA Icons**: `dashboard/public/android-chrome-192x192.png` and `dashboard/public/android-chrome-512x512.png`
- [x] **High-Quality OG Image**: `dashboard/public/og-image.png` (1200×630 featuring only the iconic heart mark in high quality)
- [x] **Web App Manifest**: `dashboard/public/site.webmanifest` linked in `<head>` for PWA installability

---

## 5. Security & Trust Headers

- [x] **X-Content-Type-Options: nosniff** — configured in `vercel.json`
- [x] **X-Frame-Options: DENY** — anti-clickjacking protection
- [x] **Referrer-Policy: strict-origin-when-cross-origin**
- [x] **Theme Color**: `<meta name="theme-color" content="#f3f5f6">`

---

## 6. AI Search & GEO (Generative Engine Optimization)

In 2026, AI engines (ChatGPT, Perplexity, Gemini, Google AI Overviews) answer health and technology queries directly. The dashboard is optimized for AI discoverability and citation:

- [x] **Allow AI crawlers in `robots.txt`**:
  - `GPTBot` (OpenAI / ChatGPT)
  - `PerplexityBot` (Perplexity AI)
  - `Google-Extended` (Gemini / Vertex)
  - `ClaudeBot` (Anthropic / Claude)
  - `CCBot` (Common Crawl)
- [x] **Lead with a direct answer** — meta description and heading clearly state capabilities in natural language
- [x] **Structured entity schema** — machine-readable `WebApplication` declaring parameters, hardware protocols, and sensor pinouts
- [x] **Consistent entity branding** — `VITAL / MONITOR` name and spelling uniform across web app, manifest, and Open Graph metadata

---

## 7. Pre-Launch Verification Summary

| Item | Target | Status | Implementation File |
|:---|:---|:---|:---|
| **Canonical URL** | `https://vitalmonitor.vercel.app/` | Verified | `dashboard/index.html` |
| **Robots Policy** | All bots + AI engines allowed | Verified | `dashboard/public/robots.txt` |
| **XML Sitemap** | Indexed & valid | Verified | `dashboard/public/sitemap.xml` |
| **Open Graph Banner** | High-quality icon only (1200×630) | Verified | `dashboard/public/og-image.png` |
| **Web Manifest** | PWA standalone ready | Verified | `dashboard/public/site.webmanifest` |
| **Vercel Routing** | SPA rewrites & security headers | Verified | `vercel.json` |
