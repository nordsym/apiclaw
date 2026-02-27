import json
import os
from collections import Counter

# Category mapping
CATEGORY_MAP = {
    "AI": "AI", "AI/ML": "AI", "Machine Learning": "AI", "Text & NLP": "AI",
    "Finance": "Finance", "Payments & Finance": "Finance", "Payments": "Finance",
    "Development": "Development", "Developer Tools": "Development",
    "Business": "Business", "E-Commerce": "E-commerce", "eCommerce": "E-commerce",
    "Media": "Media", "Media & Entertainment": "Media", "Entertainment": "Media",
    "Communication": "Communication", "Messaging": "Communication",
    "Security": "Security", "Verification": "Security",
    "Cloud & Infrastructure": "Development", "Analytics & Data": "Marketing",
    "Analytics": "Marketing", "CRM": "Business",
    "Open Data": "Content", "Other": "Utilities",
    "Sports": "Sports", "Nordic": "Nordic", "Industry": "Industry",
    "Food": "Food", "Food & Drink": "Food", "AR/VR": "AR/VR",
    "IoT": "IoT", "Events": "Events", "Weather": "Location",
    "Transportation": "Location", "Health": "Health", "Books": "Content",
    "Geo": "Location", "Music": "Media", "Cryptocurrency": "Finance",
    "Banking": "Finance", "Financial": "Finance", "Social": "Communication",
    "Email": "Communication", "Telephony": "Communication", "Chat": "Communication",
    "Notifications": "Communication", "Shipping": "E-commerce", 
    "Invoicing": "Finance", "Accounting": "Finance"
}

def normalize(cat):
    return CATEGORY_MAP.get(cat, "Utilities")

# Load current registry
with open("src/registry/apis.json") as f:
    registry = json.load(f)

existing = {(a.get("name","").lower(), a.get("baseUrl","").lower()) for a in registry["apis"]}
print(f"Current registry: {len(registry['apis'])}")

# Load expansion files
expansion_files = [
    "data/expansion-openapi-20260227.json",
    "data/expansion-pweb-20260227.json", 
    "data/expansion-agent3-20260227.json",
    "data/expansion-agent2-20260227.json",
    "data/expansion-agent1-20260227.json"
]

new_apis = []
for f in expansion_files:
    if os.path.exists(f):
        try:
            with open(f) as file:
                data = json.load(file)
                if isinstance(data, list):
                    for api in data:
                        key = (api.get("name","").lower(), api.get("baseUrl","").lower())
                        if key not in existing and api.get("name"):
                            api["category"] = normalize(api.get("category", "Utilities"))
                            new_apis.append(api)
                            existing.add(key)
                    print(f"  {f}: +{len(data)} checked")
        except Exception as e:
            print(f"  {f}: error - {e}")

print(f"\nNew unique APIs: {len(new_apis)}")

# Add to registry
registry["apis"].extend(new_apis)
registry["count"] = len(registry["apis"])
registry["lastUpdated"] = "2026-02-27"

# Count categories
cats = Counter(api.get("category", "Utilities") for api in registry["apis"])
registry["categoryCount"] = len(cats)

# Save
with open("src/registry/apis.json", "w") as f:
    json.dump(registry, f)

print(f"\n✅ Final registry: {registry['count']} APIs, {registry['categoryCount']} categories")
for cat, count in sorted(cats.items(), key=lambda x: -x[1])[:10]:
    print(f"   {cat}: {count}")
