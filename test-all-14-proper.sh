#!/bin/bash

echo "Testing all 14 APILayer actions through MCP server..."
echo ""

actions=(
  'exchange_rates:{"base":"USD","symbols":"EUR"}'
  'aviation:{"flight_iata":"AA100"}'
  'pdf_generate:{"document_url":"https://example.com"}'
  'screenshot:{"url":"https://example.com"}'
  'verify_email:{"email":"test@example.com"}'
  'verify_number:{"number":"14158586273"}'
  'vat_check:{"vat_number":"SE556703748501"}'
  'world_news:{"url":"https://example.com"}'
  'finance_news:{"tickers":"AAPL","limit":3}'
  'scrape:{"url":"https://example.com"}'
  'image_crop:{"url":"https://via.placeholder.com/500"}'
  'skills:{"q":"javascript"}'
  'form_submit:{"endpoint":"test","data":"test"}'
  'market_data:{"symbols":"AAPL"}'
)

for item in "${actions[@]}"; do
  IFS=':' read -r action params <<< "$item"
  echo "Testing $action..."
  result=$(echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"call_api\",\"arguments\":{\"provider\":\"apilayer\",\"action\":\"$action\",\"params\":$params}}}" | node dist/index.js 2>&1 | grep -o '"status":"[^"]*"' | head -1)
  if [[ "$result" == *"success"* ]]; then
    echo "✅ $action WORKING"
  else
    echo "❌ $action: $result"
  fi
  sleep 1
done
