# APILayer 14 Services Status Report
**Date:** 2026-03-24, 11:55 CET
**Meeting:** Pratham (APILayer DevReal) @ 3:30pm
**Status:** 11/14 WORKING

## ✅ CONFIRMED WORKING (11/14)
1. **ExchangeRate API** — HTTP 200 ✓
2. **AviationStack API** — HTTP 200 ✓
3. **ScreenshotLayer API** — HTTP 200 ✓
4. **Number Verification API** — HTTP 200 ✓
5. **Email Verification API** — HTTP 200 ✓
6. **Marketstack API** — HTTP 200 ✓
7. **VAT Layer API** — HTTP 200 ✓
8. **Finance News API** — HTTP 200 (endpoint: `/financelayer/news`) ✓
9. **Image Crop API** — HTTP 200 (endpoint: `/smart_crop/url`) ✓
10. **Advanced Scraper API** — HTTP 200 ✓
11. **PDFLayer** — HTTP 200 (POST to `https://api.pdflayer.com/api`, separate domain) ✓

## ❌ NOT WORKING (3/14)
- **WorldNews API** — 404 (endpoint path unknown — needs documentation)
- **SkillAPI** — 401 "Invalid authentication credentials" (on api.promptapi.com, separate service)
- **FormAPI** — 403 "You cannot consume this service" (permission issue, parked)

## KEY DISCOVERIES
- PDFLayer is **NOT** on api.apilayer.com — it's on **api.pdflayer.com** (separate domain)
- PDFLayer requires **POST** method (not GET)
- Some services use namespace prefixes: `/financelayer/`, `/smart_crop/`
- SkillAPI is on **promptapi.com** (different domain from apilayer)

## CREDENTIALS UPDATED
- PDFLayer key updated in `~/.secrets/apilayer.env`
- All 19 Direct Call providers have credentials in src/credentials.ts
- Product messaging reordered (AI-first) in src/discovery.ts

## NEXT STEPS
1. Get WorldNews endpoint documentation
2. Verify/resolve SkillAPI authentication issue
3. Update discovery.ts with PDFLayer details (POST method, separate domain)
