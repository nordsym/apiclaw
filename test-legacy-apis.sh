#!/bin/bash

# Test APILayer Legacy APIs
# Quick smoke test to verify keys work

echo "🧪 Testing APILayer Legacy APIs..."
echo ""

# Load keys
source ~/.secrets/apilayer-legacy.env

# Finance
echo "1. Testing Fixer API..."
curl -s "http://data.fixer.io/api/latest?access_key=$FIXER_API_KEY&base=USD&symbols=EUR" | jq -r '.success' 2>/dev/null && echo "   ✓ Fixer working" || echo "   ✗ Fixer failed"

echo "2. Testing Currencylayer..."
curl -s "http://api.currencylayer.com/live?access_key=$CURRENCYLAYER_API_KEY&source=USD&currencies=EUR" | jq -r '.success' 2>/dev/null && echo "   ✓ Currencylayer working" || echo "   ✗ Currencylayer failed"

echo "3. Testing Coinlayer..."
curl -s "http://api.coinlayer.com/live?access_key=$COINLAYER_API_KEY&target=USD&symbols=BTC" | jq -r '.success' 2>/dev/null && echo "   ✓ Coinlayer working" || echo "   ✗ Coinlayer failed"

# Geolocation
echo "4. Testing Weatherstack..."
curl -s "http://api.weatherstack.com/current?access_key=$WEATHERSTACK_API_KEY&query=Stockholm" | jq -r '.current.temperature' 2>/dev/null && echo "   ✓ Weatherstack working" || echo "   ✗ Weatherstack failed"

echo "5. Testing IPstack..."
curl -s "http://api.ipstack.com/8.8.8.8?access_key=$IPSTACK_API_KEY" | jq -r '.country_name' 2>/dev/null && echo "   ✓ IPstack working" || echo "   ✗ IPstack failed"

echo "6. Testing IPapi..."
curl -s "https://ipapi.co/8.8.8.8/json/?key=$IPAPI_API_KEY" | jq -r '.country_name' 2>/dev/null && echo "   ✓ IPapi working" || echo "   ✗ IPapi failed"

echo "7. Testing Positionstack..."
curl -s "http://api.positionstack.com/v1/forward?access_key=$POSITIONSTACK_API_KEY&query=Stockholm&limit=1" | jq -r '.data[0].label' 2>/dev/null && echo "   ✓ Positionstack working" || echo "   ✗ Positionstack failed"

# Scraping
echo "8. Testing Scrapestack..."
curl -s "http://api.scrapestack.com/scrape?access_key=$SCRAPESTACK_API_KEY&url=https://example.com" | head -c 100 2>/dev/null && echo "   ✓ Scrapestack working" || echo "   ✗ Scrapestack failed"

echo "9. Testing Serpstack..."
curl -s "http://api.serpstack.com/search?access_key=$SERPSTACK_API_KEY&query=OpenAI" | jq -r '.organic_results[0].title' 2>/dev/null && echo "   ✓ Serpstack working" || echo "   ✗ Serpstack failed"

# News
echo "10. Testing Mediastack..."
curl -s "http://api.mediastack.com/v1/news?access_key=$MEDIASTACK_API_KEY&keywords=AI&limit=1" | jq -r '.data[0].title' 2>/dev/null && echo "   ✓ Mediastack working" || echo "   ✗ Mediastack failed"

# DevTools
echo "11. Testing Userstack..."
curl -s "http://api.userstack.com/detect?access_key=$USERSTACK_API_KEY&ua=Mozilla/5.0" | jq -r '.device.type' 2>/dev/null && echo "   ✓ Userstack working" || echo "   ✗ Userstack failed"

echo ""
echo "✅ Test complete!"
