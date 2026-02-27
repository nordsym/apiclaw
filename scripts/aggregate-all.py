#!/usr/bin/env python3
"""
Aggregera ALLA API-filer till registry-final.json
Dedup på name+baseUrl
"""

import json
import os
import re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

# Canonical categories
CANONICAL_CATEGORIES = [
    "AI & Machine Learning", "Analytics & Data", "Authentication & Security",
    "Business & Productivity", "Cloud & Infrastructure", "Communication",
    "Content & Media", "Crypto & Blockchain", "Design & Creative",
    "Developer Tools", "E-commerce & Payments", "Education",
    "Entertainment & Gaming", "Finance & Banking", "Food & Hospitality",
    "Government & Public Data", "Healthcare", "HR & Recruiting",
    "IoT & Hardware", "Legal & Compliance", "Location & Maps",
    "Logistics & Shipping", "Marketing & Advertising", "Nordic & Regional",
    "Real Estate & Construction", "Science & Environment", "Social & Community",
    "Sports & Fitness", "Travel & Transportation", "Utilities & Tools"
]

# Load category mapping
try:
    with open(DATA_DIR.parent / "scripts" / "category-mapping.json") as f:
        cat_data = json.load(f)
        CATEGORY_MAP = cat_data.get("mapping", {})
except:
    CATEGORY_MAP = {}

def normalize_category(cat):
    """Map category to canonical"""
    if not cat:
        return "Utilities & Tools"
    cat_clean = cat.strip()
    if cat_clean in CANONICAL_CATEGORIES:
        return cat_clean
    # Try mapping
    if cat_clean in CATEGORY_MAP:
        return CATEGORY_MAP[cat_clean]
    # Fuzzy match
    cat_lower = cat_clean.lower()
    for canon in CANONICAL_CATEGORIES:
        if cat_lower in canon.lower() or canon.lower() in cat_lower:
            return canon
    return "Utilities & Tools"

def normalize_url(url):
    """Normalize URL for dedup"""
    if not url:
        return ""
    url = url.strip().lower()
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'/$', '', url)
    url = re.sub(r'^www\.', '', url)
    return url

def extract_apis(data):
    """Extract API list from various formats"""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ['apis', 'items', 'data', 'results']:
            if key in data and isinstance(data[key], list):
                return data[key]
        # Single API object
        if 'name' in data:
            return [data]
    return []

def clean_api(api):
    """Clean and normalize an API entry"""
    if not isinstance(api, dict):
        return None
    
    name = api.get('name', '').strip()
    if not name or len(name) < 2:
        return None
    
    # Get base URL
    base_url = api.get('baseUrl') or api.get('base_url') or api.get('url') or api.get('homepage') or ''
    base_url = base_url.strip() if base_url else ''
    
    # Skip if no useful URL
    if not base_url or len(base_url) < 5:
        # Try to construct from name
        name_slug = re.sub(r'[^a-zA-Z0-9]', '', name.lower())
        if len(name_slug) > 2:
            base_url = f"https://api.{name_slug}.com"
    
    description = api.get('description', '').strip()
    if not description:
        description = f"{name} API"
    # Truncate long descriptions
    if len(description) > 500:
        description = description[:497] + "..."
    
    category = normalize_category(api.get('category', ''))
    
    return {
        "name": name,
        "description": description,
        "category": category,
        "baseUrl": base_url
    }

def main():
    all_apis = {}  # key = normalized(name+baseUrl)
    source_counts = {}
    
    # Process all JSON files
    json_files = sorted(DATA_DIR.glob("*.json"))
    
    for filepath in json_files:
        # Skip the output files
        if filepath.name in ['registry-final.json', 'normalized-registry.json']:
            continue
        
        try:
            with open(filepath) as f:
                data = json.load(f)
            
            apis = extract_apis(data)
            file_count = 0
            
            for api in apis:
                cleaned = clean_api(api)
                if cleaned:
                    # Create dedup key
                    key = f"{cleaned['name'].lower()}|{normalize_url(cleaned['baseUrl'])}"
                    
                    # Keep the one with better description
                    if key not in all_apis or len(cleaned['description']) > len(all_apis[key]['description']):
                        all_apis[key] = cleaned
                        file_count += 1
            
            source_counts[filepath.name] = file_count
            print(f"✓ {filepath.name}: {len(apis)} raw → {file_count} added/updated")
            
        except Exception as e:
            print(f"✗ {filepath.name}: {e}")
    
    # Convert to list
    final_apis = list(all_apis.values())
    
    # Sort by name
    final_apis.sort(key=lambda x: x['name'].lower())
    
    print(f"\n{'='*50}")
    print(f"Total unique APIs: {len(final_apis)}")
    
    # Category breakdown
    cats = {}
    for api in final_apis:
        cat = api['category']
        cats[cat] = cats.get(cat, 0) + 1
    
    print(f"\nCategory breakdown:")
    for cat in sorted(cats.keys()):
        print(f"  {cat}: {cats[cat]}")
    
    # Save registry-final.json
    output_path = DATA_DIR / "registry-final.json"
    with open(output_path, 'w') as f:
        json.dump(final_apis, f, indent=2)
    print(f"\n✓ Saved to {output_path}")
    
    return len(final_apis)

if __name__ == "__main__":
    count = main()
    print(f"\nFinal count: {count}")
