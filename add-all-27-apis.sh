#!/bin/bash
echo "REFUSED: this script re-seeds all 27 APILayer APIs as live, but 5 are subscription-blocked (skills, verify_number, world_news, image_crop, form_submit) as of 2026-05-08. Use convex/updateAPIStatus.ts after seeding, or update the script. To override: export FORCE_SEED=1"
[ "${FORCE_SEED:-0}" = "1" ] || exit 1
# Add all 27 APILayer APIs via debugAddAPI

export CONVEX_DEPLOYMENT="prod:adventurous-avocet-799"
cd /Users/gustavhemmingsson/clawd/apiclaw

# First, create provider if doesn't exist
echo "🔍 Finding provider..."
PROVIDER=$(npx convex run providers:getProviderByEmail '{"email":"gustav_hemmingsson@hotmail.com"}' 2>&1)

if [ -z "$PROVIDER" ] || [ "$PROVIDER" = "null" ]; then
  echo "Creating provider..."
  # Can't easily create via CLI, will create inline with first API
fi

# Get provider ID (we'll create it with first API call if needed)
PROVIDER_EMAIL="gustav_hemmingsson@hotmail.com"

# Define all 27 APIs
declare -a apis=(
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

echo "🚀 Adding 27 APIs..."
echo ""

created=0
failed=0

for api in "${apis[@]}"; do
  IFS='|' read -r name desc category <<< "$api"
  
  # Escape quotes in JSON
  name_json=$(echo "$name" | sed 's/"/\\"/g')
  desc_json=$(echo "$desc" | sed 's/"/\\"/g')
  
  echo -n "Adding: $name... "
  
  # Use register Provider which creates both provider and API
  result=$(npx convex run providers:registerProvider "{\"provider\":{\"email\":\"$PROVIDER_EMAIL\",\"name\":\"APILayer\",\"website\":\"https://apilayer.com\"},\"api\":{\"name\":\"$name_json\",\"description\":\"$desc_json\",\"category\":\"$category\",\"pricingModel\":\"freemium\",\"pricingNotes\":\"Free tier available\"}}" 2>&1)
  
  if echo "$result" | grep -qE '(success|providerId)'; then
    echo "✓"
    ((created++))
  else
    echo "✗ ($result)"
    ((failed++))
  fi
  
  sleep 0.5  # Rate limit protection
done

echo ""
echo "✅ Complete!"
echo "   Created: $created"
echo "   Failed: $failed"
echo ""
echo "🔗 Check dashboard: https://apiclaw.cloud/workspace"
