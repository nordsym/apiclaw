#!/bin/bash
# Sync API registry stats and deploy to Vercel

cd "$(dirname "$0")/.."

echo "📊 Updating registry count..."
python3 << 'EOF'
import json
from datetime import datetime

with open('src/registry/apis.json', 'r') as f:
    registry = json.load(f)

registry['count'] = len(registry['apis'])
registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')

with open('src/registry/apis.json', 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✓ Registry: {registry['count']} APIs")
EOF

echo "📦 Copying apis.json to landing..."
cp src/registry/apis.json landing/src/lib/apis.json

echo "📈 Generating stats for frontend..."
cd landing
node scripts/generate-stats.js

echo "🗑️ Clearing build cache..."
rm -rf .next

echo "🚀 Deploying to Vercel..."
npx vercel --prod --force --yes

echo "✅ Done! Check https://apiclaw.nordsym.com"
