import json
from pathlib import Path
from collections import Counter

# Tighter category mapping - target ~25 categories
CATEGORY_MAP = {
    # AI (all AI-related)
    "AI": "AI", "AI/ML": "AI", "AI & ML": "AI", "Machine Learning": "AI",
    "NLP": "AI", "AI Writing": "AI", "AI Voice": "AI", "AI Video": "AI",
    "AI Image": "AI", "AI Music": "AI", "AI Code": "AI", "AI Productivity": "AI",
    "Vector DB": "AI", "Face Recognition": "AI", "Image Moderation": "AI",
    "Speech Recognition": "AI",
    
    # Finance (money stuff)
    "Finance": "Finance", "Fintech": "Finance", "Finance Data": "Finance",
    "Cryptocurrency": "Finance", "Crypto": "Finance", "Payments": "Finance",
    "Billing": "Finance", "Accounting": "Finance", "Currency": "Finance",
    "Blockchain": "Finance", "Web3": "Finance", "Insurance": "Finance",
    
    # Development (dev tools)
    "Development": "Development", "DevTools": "Development", "Dev Tools": "Development",
    "DevOps": "Development", "Testing": "Development", "Documentation": "Development",
    "Source Control": "Development", "Monitoring": "Development", "Performance": "Development",
    "Database": "Development", "Cloud": "Development", "Infrastructure": "Development",
    "Storage": "Development", "Hosting": "Development", "CDN": "Development",
    "DNS": "Development", "File Storage": "Development",
    
    # Business & Work
    "Business": "Business", "CRM": "Business", "Sales": "Business", "HR": "Business",
    "Jobs": "Business", "Legal": "Business", "Legal Tech": "Business",
    "Productivity": "Business", "Calendar": "Business", "Scheduling": "Business",
    "Forms": "Business", "Surveys": "Business", "Support": "Business",
    "Customer Service": "Business",
    
    # Marketing
    "Marketing": "Marketing", "Advertising": "Marketing", "SEO": "Marketing",
    "Analytics": "Marketing",
    
    # E-commerce
    "E-commerce": "E-commerce", "Commerce": "E-commerce", "Shipping": "E-commerce",
    "Logistics": "E-commerce",
    
    # Communication
    "Communication": "Communication", "Email": "Communication",
    "Notifications": "Communication", "SMS": "Communication", "Social": "Communication",
    "Social Media": "Communication",
    
    # Media & Entertainment
    "Media": "Media", "Music": "Media", "Video": "Media", "Photography": "Media",
    "Images": "Media", "Movies": "Media", "Entertainment": "Media",
    "Gaming": "Media", "Games": "Media", "Videogames": "Media",
    "Design": "Media", "Art": "Media",
    
    # Content & Data
    "Content": "Content", "CMS": "Content", "Documents": "Content",
    "Translation": "Content", "Localization": "Content", "Language": "Content",
    "Books": "Content", "News": "Content", "Data": "Content", "Open Data": "Content",
    "Big Data": "Content", "CDP": "Content", "Reference": "Content",
    "Dictionary": "Content", "Quotes": "Content",
    
    # Security
    "Security": "Security", "Authentication": "Security", "Identity": "Security",
    "Compliance": "Security", "Captcha": "Security",
    
    # Location & Maps
    "Maps": "Location", "Geocoding": "Location", "Geolocation": "Location",
    "Places": "Location", "Geography": "Location", "Travel": "Location",
    "Transportation": "Location", "Weather": "Location",
    
    # Health & Science
    "Health": "Health", "Healthcare": "Health", "Medical": "Health",
    "Fitness": "Health", "Science": "Health", "Environment": "Health",
    
    # Education
    "Education": "Education",
    
    # Industry verticals → "Industry"
    "Real Estate": "Industry", "Automotive": "Industry", "Construction": "Industry",
    "Manufacturing": "Industry", "Agriculture": "Industry", "Energy": "Industry",
    "Government": "Industry", "Non-Profit": "Industry",
    
    # Other
    "IoT": "IoT", "Automation": "Automation", "Events": "Events",
    "Food": "Food", "Sports": "Sports", "Sport": "Sports", "Animals": "Utilities",
    "Nordic": "Nordic", "AR/VR": "AR/VR",
    
    # Utilities (catch-all)
    "Utilities": "Utilities", "Miscellaneous": "Utilities", "Validation": "Utilities",
    "Search": "Utilities", "Barcode": "Utilities", "URL Shorteners": "Utilities",
    "Screenshots": "Utilities", "Placeholder Images": "Utilities",
    "Tools": "Utilities", "Math": "Utilities", "Technology": "Utilities",
    "Product": "Utilities", "Google": "Utilities", "Augmented Reality": "AR/VR",
}

def normalize_category(cat):
    return CATEGORY_MAP.get(cat, "Utilities")

# Load all APIs
all_apis = []
data_dir = Path("data")
for f in data_dir.glob("*.json"):
    if "normalized" in f.name:
        continue
    try:
        with open(f) as file:
            data = json.load(file)
            if isinstance(data, list):
                all_apis.extend(data)
    except:
        pass

# Deduplicate by name+baseUrl
seen = set()
unique_apis = []
for api in all_apis:
    key = (api.get("name", "").lower().strip(), api.get("baseUrl", "").lower().strip())
    if key not in seen and api.get("name"):
        seen.add(key)
        api["category"] = normalize_category(api.get("category", "Utilities"))
        unique_apis.append(api)

# Count categories
cats = Counter(api["category"] for api in unique_apis)

print(f"✅ TOTAL UNIQUE APIs: {len(unique_apis)}")
print(f"\n📁 CATEGORIES ({len(cats)}):")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}")

# Save
with open("data/registry-final.json", "w") as f:
    json.dump(unique_apis, f, indent=2)

print(f"\n💾 Saved: data/registry-final.json")
