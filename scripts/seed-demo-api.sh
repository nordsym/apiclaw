#!/bin/bash
# Seed a complete demo API with Direct Call for NordSym

CONVEX_URL="https://brilliant-puffin-712.eu-west-1.convex.cloud"

# First, get Gustav's provider ID by listing APIs
echo "Looking up NordSym provider..."

# Get session token from Gustav's browser (he needs to provide this)
# Or we can create the API directly using the registerProvider mutation

echo "Creating demo API: Stripe Payment Link Generator..."

# Create a well-structured demo API
curl -s "$CONVEX_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "providers:registerProvider",
    "args": {
      "provider": {
        "name": "NordSym AB",
        "email": "gustav@nordsym.com",
        "website": "https://nordsym.com"
      },
      "api": {
        "name": "Stripe Payment Links",
        "description": "Generate Stripe payment links dynamically. Create one-time or subscription payment links for any amount and currency. Perfect for invoicing, donations, product sales, and custom checkout flows.",
        "category": "Payments",
        "docsUrl": "https://stripe.com/docs/payment-links",
        "pricingModel": "freemium"
      }
    }
  }' | jq .

echo ""
echo "API created! Now set up Direct Call via the dashboard:"
echo "https://apiclaw.cloud/providers/dashboard"
echo ""
echo "Direct Call config for Stripe:"
echo "  Base URL: https://api.stripe.com/v1"
echo "  Auth Type: Bearer Token"
echo "  Auth Header: Authorization"
echo "  Master Key: sk_test_... (your Stripe secret key)"
echo "  Rate Limit: 60/min, 1000/day"
