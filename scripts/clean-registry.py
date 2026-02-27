import json
from collections import Counter

# Category mapping - 22 categories
CATEGORY_MAP = {
    "AI": "AI", "AI/ML": "AI", "AI & ML": "AI", "Machine Learning": "AI",
    "NLP": "AI", "AI Writing": "AI", "AI Voice": "AI", "AI Video": "AI",
    "AI Image": "AI", "AI Music": "AI", "AI Code": "AI", "AI Productivity": "AI",
    "Vector DB": "AI", "Face Recognition": "AI", "Image Moderation": "AI",
    "Speech Recognition": "AI",
    
    "Finance": "Finance", "Fintech": "Finance", "Finance Data": "Finance",
    "Cryptocurrency": "Finance", "Crypto": "Finance", "Payments": "Finance",
    "Billing": "Finance", "Accounting": "Finance", "Currency": "Finance",
    "Blockchain": "Finance", "Web3": "Finance", "Insurance": "Finance",
    
    "Development": "Development", "DevTools": "Development", "Dev Tools": "Development",
    "DevOps": "Development", "Testing": "Development", "Documentation": "Development",
    "Source Control": "Development", "Monitoring": "Development", "Performance": "Development",
    "Database": "Development", "Cloud": "Development", "Infrastructure": "Development",
    "Storage": "Development", "Hosting": "Development", "CDN": "Development",
    "DNS": "Development", "File Storage": "Development",
    
    "Business": "Business", "CRM": "Business", "Sales": "Business", "HR": "Business",
    "Jobs": "Business", "Legal": "Business", "Legal Tech": "Business",
    "Productivity": "Business", "Calendar": "Business", "Scheduling": "Business",
    "Forms": "Business", "Surveys": "Business", "Support": "Business",
    "Customer Service": "Business",
    
    "Marketing": "Marketing", "Advertising": "Marketing", "SEO": "Marketing",
    "Analytics": "Marketing",
    
    "E-commerce": "E-commerce", "Commerce": "E-commerce", "Shipping": "E-commerce",
    "Logistics": "E-commerce",
    
    "Communication": "Communication", "Email": "Communication",
    "Notifications": "Communication", "SMS": "Communication", "Social": "Communication",
    "Social Media": "Communication",
    
    "Media": "Media", "Music": "Media", "Video": "Media", "Photography": "Media",
    "Images": "Media", "Movies": "Media", "Entertainment": "Media",
    "Gaming": "Media", "Games": "Media", "Videogames": "Media",
    "Design": "Media", "Art": "Media",
    
    "Content": "Content", "CMS": "Content", "Documents": "Content",
    "Translation": "Content", "Localization": "Content", "Language": "Content",
    "Books": "Content", "News": "Content", "Data": "Content", "Open Data": "Content",
    "Big Data": "Content", "CDP": "Content", "Reference": "Content",
    "Dictionary": "Content", "Quotes": "Content",
    
    "Security": "Security", "Authentication": "Security", "Identity": "Security",
    "Compliance": "Security", "Captcha": "Security",
    
    "Location": "Location", "Maps": "Location", "Geocoding": "Location", 
    "Geolocation": "Location", "Places": "Location", "Geography": "Location", 
    "Travel": "Location", "Transportation": "Location", "Weather": "Location",
    
    "Health": "Health", "Healthcare": "Health", "Medical": "Health",
    "Fitness": "Health", "Science": "Health", "Environment": "Health",
    
    "Education": "Education",
    
    "Industry": "Industry", "Real Estate": "Industry", "Automotive": "Industry", 
    "Construction": "Industry", "Manufacturing": "Industry", "Agriculture": "Industry", 
    "Energy": "Industry", "Government": "Industry", "Non-Profit": "Industry",
    
    "IoT": "IoT", "Automation": "Automation", "Events": "Events",
    "Food": "Food", "Sports": "Sports", "Sport": "Sports", "Animals": "Utilities",
    "Nordic": "Nordic", "AR/VR": "AR/VR",
    
    "Utilities": "Utilities", "Miscellaneous": "Utilities", "Validation": "Utilities",
    "Search": "Utilities", "Barcode": "Utilities", "URL Shorteners": "Utilities",
    "Screenshots": "Utilities", "Placeholder Images": "Utilities",
    "Tools": "Utilities", "Math": "Utilities", "Technology": "Utilities",
    "Product": "Utilities", "Google": "Utilities", "Augmented Reality": "AR/VR",
}

def normalize(cat):
    return CATEGORY_MAP.get(cat, "Utilities")

# Load registry
with open("src/registry/apis.json") as f:
    registry = json.load(f)

apis = registry["apis"]
print(f"Original: {len(apis)}")

# Deduplicate
seen = set()
unique = []
for api in apis:
    key = (api.get("name", "").lower().strip(), api.get("baseUrl", "").lower().strip())
    if key not in seen and api.get("name"):
        seen.add(key)
        api["category"] = normalize(api.get("category", "Utilities"))
        unique.append(api)

print(f"After dedup: {len(unique)}")

# Count categories
cats = Counter(api["category"] for api in unique)
print(f"\nCategories ({len(cats)}):")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}")

# Update registry
registry["apis"] = unique
registry["count"] = len(unique)
registry["categoryCount"] = len(cats)
registry["lastUpdated"] = "2026-02-27"

# Backup original
import shutil
shutil.copy("src/registry/apis.json", "src/registry/apis.json.bak")

# Save
with open("src/registry/apis.json", "w") as f:
    json.dump(registry, f)

print(f"\n✅ Registry updated: {len(unique)} APIs, {len(cats)} categories")
