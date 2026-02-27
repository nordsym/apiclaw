import json
import os
from pathlib import Path

# Category mapping - consolidate duplicates
CATEGORY_MAP = {
    # AI
    "AI": "AI",
    "AI/ML": "AI",
    "AI & ML": "AI",
    "Machine Learning": "AI",
    "NLP": "AI",
    "AI Writing": "AI",
    "AI Voice": "AI", 
    "AI Video": "AI",
    "AI Image": "AI",
    "AI Music": "AI",
    "AI Code": "AI",
    "AI Productivity": "AI",
    "Vector DB": "AI",
    
    # Finance
    "Finance": "Finance",
    "Fintech": "Finance",
    "Finance Data": "Finance",
    "Cryptocurrency": "Finance",
    "Crypto": "Finance",
    "Payments": "Finance",
    "Billing": "Finance",
    "Accounting": "Finance",
    "Currency": "Finance",
    "Blockchain": "Finance",
    "Web3": "Finance",
    
    # Development
    "Development": "Development",
    "DevTools": "Development",
    "Dev Tools": "Development",
    "DevOps": "Development",
    "Testing": "Development",
    "Documentation": "Development",
    "Source Control": "Development",
    "Monitoring": "Development",
    "Performance": "Development",
    
    # Gaming
    "Games": "Gaming",
    "Gaming": "Gaming",
    "Videogames": "Gaming",
    
    # Health
    "Health": "Health",
    "Healthcare": "Health",
    "Medical": "Health",
    "Fitness": "Health",
    
    # Location
    "Maps": "Location",
    "Geocoding": "Location",
    "Geolocation": "Location",
    "Places": "Location",
    "Geography": "Location",
    
    # Infrastructure
    "Cloud": "Infrastructure",
    "Storage": "Infrastructure",
    "Hosting": "Infrastructure",
    "CDN": "Infrastructure",
    "Infrastructure": "Infrastructure",
    "Database": "Infrastructure",
    "DNS": "Infrastructure",
    
    # Communication
    "Communication": "Communication",
    "Email": "Communication",
    "Notifications": "Communication",
    "SMS": "Communication",
    
    # Media
    "Media": "Media",
    "Music": "Media",
    "Video": "Media",
    "Photography": "Media",
    "Images": "Media",
    "Movies": "Media",
    "Entertainment": "Entertainment",
    
    # Social
    "Social": "Social",
    "Social Media": "Social",
    
    # Business
    "Business": "Business",
    "CRM": "Business",
    "Sales": "Business",
    "Marketing": "Marketing",
    "Advertising": "Marketing",
    "SEO": "Marketing",
    "HR": "Business",
    "Jobs": "Business",
    
    # E-commerce
    "E-commerce": "E-commerce",
    "Commerce": "E-commerce",
    "Shipping": "E-commerce",
    "Logistics": "E-commerce",
    
    # Content
    "Content": "Content",
    "CMS": "Content",
    "Documents": "Content",
    "Translation": "Content",
    "Localization": "Content",
    "Language": "Content",
    "Books": "Content",
    
    # Data
    "Data": "Data",
    "Analytics": "Analytics",
    "Open Data": "Data",
    "Big Data": "Data",
    
    # Security
    "Security": "Security",
    "Authentication": "Security",
    "Identity": "Security",
    "Compliance": "Security",
    "Captcha": "Security",
    
    # Productivity
    "Productivity": "Productivity",
    "Calendar": "Productivity",
    "Scheduling": "Productivity",
    "Forms": "Productivity",
    "Surveys": "Productivity",
    
    # Support
    "Support": "Support",
    "Customer Service": "Support",
    
    # Automation
    "Automation": "Automation",
    "Tools": "Automation",
    
    # Legal
    "Legal": "Legal",
    "Legal Tech": "Legal",
    
    # Other verticals - keep as is
    "Education": "Education",
    "Government": "Government",
    "News": "News",
    "Weather": "Weather",
    "Sports": "Sports",
    "Sport": "Sports",
    "Food": "Food",
    "Travel": "Travel",
    "Transportation": "Transportation",
    "Automotive": "Automotive",
    "Real Estate": "Real Estate",
    "Insurance": "Insurance",
    "Energy": "Energy",
    "Environment": "Environment",
    "Agriculture": "Agriculture",
    "Construction": "Construction",
    "Manufacturing": "Manufacturing",
    "Events": "Events",
    "Non-Profit": "Non-Profit",
    "Science": "Science",
    "Animals": "Animals",
    "Design": "Design",
    "AR/VR": "AR/VR",
    "IoT": "IoT",
    "Nordic": "Nordic",
    
    # Misc
    "Utilities": "Utilities",
    "Miscellaneous": "Utilities",
    "Validation": "Utilities",
    "Search": "Utilities",
    "Barcode": "Utilities",
    "URL Shorteners": "Utilities",
    "Screenshots": "Utilities",
    "Placeholder Images": "Utilities",
    "Reference": "Utilities",
    "Dictionary": "Utilities",
    "Quotes": "Utilities",
    "Art": "Utilities",
    "Math": "Utilities",
    "Technology": "Utilities",
    "Product": "Utilities",
    "Face Recognition": "AI",
    "Image Moderation": "AI",
    "Augmented Reality": "AR/VR",
    "Speech Recognition": "AI",
    "File Storage": "Infrastructure",
    "Google": "Utilities",
    "CDP": "Data",
}

def normalize_category(cat):
    return CATEGORY_MAP.get(cat, cat)

# Load all APIs
all_apis = []
data_dir = Path("data")
for f in data_dir.glob("*.json"):
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
    key = (api.get("name", "").lower(), api.get("baseUrl", "").lower())
    if key not in seen and api.get("name"):
        seen.add(key)
        api["category"] = normalize_category(api.get("category", "Utilities"))
        unique_apis.append(api)

# Count categories
from collections import Counter
cats = Counter(api["category"] for api in unique_apis)

print(f"TOTAL UNIQUE APIs: {len(unique_apis)}")
print(f"\nCATEGORIES ({len(cats)}):")
for cat, count in cats.most_common():
    print(f"  {cat}: {count}")

# Save normalized
with open("data/normalized-registry.json", "w") as f:
    json.dump(unique_apis, f, indent=2)

print(f"\nSaved to data/normalized-registry.json")
