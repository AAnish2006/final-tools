# DevToolBox — Free Online Developer Tools Suite (Pure Vanilla Web Edition)

A high-performance, 100% browser-based suite of developer utilities built strictly using **Semantic HTML5**, **Modern CSS3**, and **Vanilla JavaScript (ES6+)**.

> **Zero React. Zero Vite. Zero npm runtime dependencies. Zero build step.**  
> Pre-rendered static architecture delivering instant load times (sub-50ms FCP), 100% Core Web Vitals scores, and crawlability across search engines.

---

## 🛠️ Included Developer Tools (10 Total)

1. **Online Stopwatch & Countdown Timer** (`/tools/stopwatch`)
   - High-precision millisecond timing via `performance.now()`.
   - Split lap recording with automatic fastest (green) and slowest (red) lap detection.
   - Built-in countdown timer with Pomodoro (25m) and quick presets.
   - Dual-tone chime alert via native Web Audio API synthesizer.
   - Distraction-free full-screen mode and hotkeys (`Space`, `L`, `R`, `Esc`).

2. **Online Notepad** (`/tools/notepad`)
   - Real-time `localStorage` persistent auto-save.
   - Word, character, and line count monitors.
   - Dynamic font-size scaling (12px to 32px) and dark/light theme switch.
   - One-click copy, `.txt` file export, and full-screen distraction-free mode.

3. **Word Counter & Platform Limits** (`/tools/word-counter`)
   - Live metrics: Words, characters, characters without spaces, sentences, paragraphs, reading and speaking time.
   - Social media limit tracking (Twitter/X, Facebook, LinkedIn, Instagram).
   - Character overflow card highlighting excess characters in red `<mark>` tags with one-click trimming.
   - Real-time keyword density and term frequency analytics table.

4. **JSON Formatter & Validator** (`/tools/json-formatter`)
   - 2-space pretty-print formatting and instant minification.
   - Live syntax validator with error line and column indicators.
   - Sample JSON loader, file upload, copy, and `.json` download.

5. **Client-Side Image Resizer** (`/tools/image-resizer`)
   - 100% in-browser HTML5 `<canvas>` image pipeline with **zero server transmission**.
   - Custom dimensions, aspect-ratio lock, social media presets, format conversion (PNG, JPEG, WebP), and quality compression slider.

6. **Secure Password & Passphrase Generator** (`/tools/password-generator`)
   - Cryptographically secure pseudo-random generation using native Web Crypto API (`crypto.getRandomValues`).
   - Customizable character sets (Uppercase, Lowercase, Numbers, Symbols, Exclude Ambiguous `1, l, I, 0, O`).
   - Memorable passphrase mode (Diceware style).
   - Shannon entropy calculation (bits) and crack time estimation (~Instant to trillions of years).
   - Hero single password box + bulk generation (up to 50 passwords) with individual copy buttons.

7. **Base64 & URL Encoder/Decoder** (`/tools/base64-encoder`)
   - Full UTF-8 multibyte character encoding (supports international characters and emojis).
   - Base64 and URL component encoding/decoding.
   - Drag-and-drop file to Base64 Data URL converter.
   - Character counts, swap input/output, copy, and download.

8. **Markdown Live Previewer & Editor** (`/tools/markdown-previewer`)
   - Live side-by-side parsing with live word and character counts.
   - Formatted preview vs. raw compiled HTML tabs.
   - Quick-access formatting toolbar (Bold, Italic, Strikethrough, H1-H3, Code, Quote, Links, Lists, Tables).
   - Distraction-free full-page writing mode (`Esc` key supported) and `.md` / `.html` export.

9. **UUID / GUID Generator & Unix Timestamp Converter** (`/tools/uuid-generator`)
   - Cryptographically random RFC 4122 Version 4 UUIDs via `crypto.randomUUID()`.
   - Batch generation (up to 100 IDs), uppercase toggle, hyphens toggle, bracket enclosures (`{}`, `""`), and JSON array export.
   - Live ticking Unix Epoch timestamp with quick copy.
   - Epoch-to-Date (detects seconds vs. milliseconds) and Date-to-Epoch converters.

10. **Color Converter & WCAG Contrast Checker** (`/tools/color-converter`)
    - Two-way HEX, RGB, HSL, and CSS variable conversion with native color picker and live preview.
    - Automatic tint and shade palette generation with one-click copy.
    - WCAG 2.1 Contrast Ratio Calculator with relative luminance calculation, AA/AAA compliance badges, and live preview.

---

## 📚 Technical Blog Articles (11 Total)

Includes 11 SEO-optimized technical guides:
- `/blog/best-free-online-notepad-2024`
- `/blog/complete-guide-base64-and-url-encoding`
- `/blog/how-to-improve-writing-productivity`
- `/blog/json-formatter-complete-guide-developers`
- `/blog/markdown-to-html-complete-guide-technical-writing`
- `/blog/secure-password-and-passphrase-guide-2026`
- `/blog/seo-content-optimization-guide-beginners`
- `/blog/top-free-developer-tools-online-2024`
- `/blog/ultimate-guide-word-counter-seo`
- `/blog/understanding-uuid-v4-and-unix-timestamps`
- `/blog/web-colors-hex-rgb-hsl-and-wcag-accessibility`

---

## 🔍 SEO & Technical Architecture

- **100% Static Pre-rendered HTML:** Every page includes complete semantic markup, pre-rendered `<h1>`–`<h3>` headings, breadcrumbs, and FAQs.
- **Structured Data:** Validated Schema.org JSON-LD scripts (`WebSite`, `WebApplication`, `BreadcrumbList`, `FAQPage`, `Article`).
- **Social Tags:** Complete OpenGraph (`og:*`) and Twitter Cards (`twitter:*`) on every page.
- **Search Directives:** Root `robots.txt` and comprehensive `sitemap.xml` covering all 27 canonical URLs.
- **Google AdSense:** Integrated publisher ID `ca-pub-3950161950238885`, verification meta tags, responsive ad banner containers, and root `ads.txt`.
- **Google Analytics:** Embedded `gtag.js` (`G-7EB2KW09E2`) across all pages.

---

## 🚀 How to Run Locally

Because this project uses zero build steps, you can serve it with any static web server:

### Option A: Using the built-in Node server
```bash
node serve.cjs
# Open http://localhost:8080/
```

### Option B: Using Python
```bash
python -m http.server 8080
```

### Option C: Using any static server (Nginx, Apache, Caddy, Live Server)
Point the document root to this folder.

---

## 🌐 Production Deployment

Ready to deploy directly to any static host with zero build configurations required:
- **GitHub Pages** (Enable GitHub Pages from repo Settings > Pages)
- **Cloudflare Pages** (Direct upload or git connect, Build command: none, Output dir: `/`)
- **Netlify** (Build command: none, Publish directory: `.`)
- **Vercel** (Build command: none, Output directory: `.`)
- **AWS S3 + CloudFront**
- **Nginx / Apache / cPanel**
