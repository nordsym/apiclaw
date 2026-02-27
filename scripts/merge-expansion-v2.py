import json
import os
from collections import Counter

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

def extract_apis(data):
    """Handle both flat arrays and nested {apis: [...]} structures"""
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and "apis" in data:
        return data["apis"]
    return []

# Load current registry
with open("src/registry/apis.json") as f:
    registry = json.load(f)

existing = {(a.get("name","").lower().strip(), a.get("baseUrl","").lower().strip()) for a in registry["apis"]}
print(f"Current registry: {len(registry['apis'])}")

# Load ALL expansion files
new_apis = []
for f in os.listdir("data"):
    if f.startswith("expansion") and f.endswith(".json"):
        path = f"data/{f}"
        try:
            with open(path) as file:
                data = json.load(file)
                apis = extract_apis(data)
                added = 0
                for api in apis:
                    if not api.get("name"):
                        continue
                    key = (api.get("name","").lower().strip(), api.get("baseUrl","").lower().strip())
                    if key not in existing:
                        api["category"] = normalize(api.get("category", "Utilities"))
                        new_apis.append(api)
                        existing.add(key)
                        added += 1
                print(f"  {f}: +{added} new (of {len(apis)} total)")
        except Exception as e:
            print(f"  {f}: error - {e}")

print(f"\nTotal new unique APIs: {len(new_apis)}")

# Add to registry
registry["apis"].extend(new_apis)
registry["count"] = len(registry["apis"])
registry["lastUpdated"] = "2026-02-27"

cats = Counter(api.get("category", "Utilities") for api in registry["apis"])
registry["categoryCount"] = len(cats)

# Save
with open("src/registry/apis.json", "w") as f:
    json.dump(registry, f)

# Also copy to dist and landing
os.system("cp src/registry/apis.json dist/registry/apis.json 2>/dev/null")
os.system("cp src/registry/apis.json landing/src/lib/apis.json 2>/dev/null")

print(f"\n✅ Final: {registry['count']} APIs, {registry['categoryCount']} categories")
