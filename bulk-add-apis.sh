#!/bin/bash
echo "REFUSED: this script re-seeds all 27 APILayer APIs as live, but 5 are subscription-blocked (skills, verify_number, world_news, image_crop, form_submit) as of 2026-05-08. Use convex/updateAPIStatus.ts after seeding, or update the script. To override: export FORCE_SEED=1"
[ "${FORCE_SEED:-0}" = "1" ] || exit 1
# Bulk add all 27 APILayer APIs via debugAddAPI

CONVEX_DEPLOYMENT="prod:adventurous-avocet-799"
PROVIDER_ID="k57b9hpe7eqehnvbk5znxje60n83rc6p"  # Will find this first

cd /Users/gustavhemmingsson/clawd/apiclaw

echo "🚀 Adding all 27 APILayer APIs..."
echo ""

# Array of APIs (name|description|category)
apis=(
  "ExchangeRate API|Real-time exchange rates and currency conversion|finance"
  "Marketstack|Real-time, intraday & historical market data|finance"
  "AviationStack|Real-time flight status & global aviation data|geolocation"
  "PDF Layer|High quality HTML to PDF conversion|business"
  "Screenshot Layer|Capture website screenshots|marketing"
  "Email Verification API|Verify email addresses in real-time|devtools"
  "Number Verification API|Validate phone numbers globally|devtools"
  "VAT Layer|EU VAT number validation|finance"
  "World News API|Extract news from any URL|news"
  "Finance News API|Real-time financial news feed|news"
  "Advanced Scraper API|Web scraping without the hassle|scraping"
  "Image Crop API|Smart image cropping|marketing"
  "Skills API|Search skill database|devtools"
  "Form API|Form submission handling|devtools"
  "Fixer API|Foreign exchange rates & currency conversion|finance"
  "Currencylayer|Reliable exchange rates for your business|finance"
  "Coinlayer|Real-time crypto currency exchange rates|finance"
  "Exchangerate.host|Free exchange rates API|finance"
  "Weatherstack|Real-time & historical weather data|geolocation"
  "IPstack|Locate and identify website visitors by IP|geolocation"
  "IPapi|IP address geolocation lookup|geolocation"
  "Positionstack|Forward & reverse geocoding|geolocation"
  "Languagelayer|Powerful language detection|devtools"
  "Scrapestack|Real-time web scraping|scraping"
  "Serpstack|Google search results API|scraping"
  "Mediastack|Live news & blog articles|news"
  "Userstack|Detect any browser, device & OS|devtools"
)

created=0
failed=0

for api in "${apis[@]}"; do
  IFS='|' read -r name desc category <<< "$api"
  
  echo "Adding: $name..."
  
  result=$(CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT npx convex run providers:debugAddAPI \
    "{\"providerId\":\"$PROVIDER_ID\",\"api\":{\"name\":\"$name\",\"description\":\"$desc\",\"category\":\"$category\",\"pricingModel\":\"freemium\",\"pricingNotes\":\"Free tier available\"}}" \
    2>&1)
  
  if echo "$result" | grep -q "success"; then
    echo "  ✓ $name"
    ((created++))
  else
    echo "  ✗ $name - $result"
    ((failed++))
  fi
done

echo ""
echo "✅ Complete!"
echo "   Created: $created"
echo "   Failed: $failed"
echo "   Total: ${#apis[@]}"
