#!/usr/bin/env python3
"""
RapidAPI Category Scraper for APIClaw expansion
Extracts APIs from target categories: Sports, Food, Travel, Entertainment, Finance, eCommerce, Data, Tools
"""

import json
import requests
import time
from datetime import datetime
import re
import os

# Target categories
CATEGORIES = [
    "Sports",
    "Food", 
    "Travel",
    "Entertainment",
    "Finance",
    "eCommerce",
    "Data",
    "Tools",
    "Business",
    "Gaming",
    "Weather",
    "Music",
    "Health and Fitness",
    "Location",
    "Transportation"
]

# Load existing APIs to skip duplicates
def load_existing_apis():
    existing_path = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
    try:
        with open(existing_path) as f:
            data = json.load(f)
            apis = data.get("apis", [])
            return {api["name"].lower().strip() for api in apis}
    except Exception as e:
        print(f"Warning: Could not load existing APIs: {e}")
        return set()

def fetch_category_apis(category, limit=100):
    """Fetch APIs from RapidAPI search endpoint"""
    apis = []
    
    # RapidAPI public search endpoint (no auth needed for basic search)
    base_url = "https://rapidapi.com/search-api/v1/search"
    
    # Try alternative approach - scrape the GraphQL API that powers the frontend
    graphql_url = "https://rapidapi.com/gateway/graphql"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://rapidapi.com",
        "Referer": f"https://rapidapi.com/search/{category}?sortBy=ByRelevance"
    }
    
    # GraphQL query for search
    query = {
        "operationName": "searchApis",
        "variables": {
            "searchQuery": category,
            "page": 1,
            "pageSize": limit,
            "sortBy": "ByRelevance",
            "category": category
        },
        "query": """
        query searchApis($searchQuery: String!, $page: Int, $pageSize: Int, $sortBy: String, $category: String) {
            searchApis(searchQuery: $searchQuery, page: $page, pageSize: $pageSize, sortBy: $sortBy, category: $category) {
                apis {
                    id
                    name
                    description
                    category
                    slugifiedName
                    pricing
                    score
                    latency
                    serviceLevel
                }
                totalCount
            }
        }
        """
    }
    
    try:
        response = requests.post(graphql_url, json=query, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if "data" in data and "searchApis" in data["data"]:
                return data["data"]["searchApis"]["apis"]
    except Exception as e:
        print(f"GraphQL failed for {category}: {e}")
    
    return []

def parse_api_card_from_html(html_content):
    """Parse API data from HTML if GraphQL fails"""
    apis = []
    # Simple regex extraction as fallback
    # Look for API names and descriptions in the rendered HTML
    return apis

def main():
    print(f"🦞 APIClaw RapidAPI Expansion")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Target categories: {', '.join(CATEGORIES)}")
    print("-" * 50)
    
    existing_apis = load_existing_apis()
    print(f"Loaded {len(existing_apis)} existing API names to skip")
    
    all_apis = []
    seen_names = set()
    
    for category in CATEGORIES:
        print(f"\n📂 Scraping {category}...")
        
        # Try multiple approaches
        category_apis = fetch_category_apis(category)
        
        new_count = 0
        for api in category_apis:
            name = api.get("name", "").strip()
            name_lower = name.lower()
            
            # Skip if already exists or seen
            if name_lower in existing_apis or name_lower in seen_names:
                continue
            
            seen_names.add(name_lower)
            
            api_entry = {
                "name": name,
                "description": api.get("description", "")[:500],
                "category": category,
                "baseUrl": f"https://rapidapi.com/api/{api.get('slugifiedName', name.lower().replace(' ', '-'))}",
                "pricing": api.get("pricing", "unknown"),
                "source": "rapidapi",
                "score": api.get("score"),
                "latency": api.get("latency"),
                "serviceLevel": api.get("serviceLevel")
            }
            all_apis.append(api_entry)
            new_count += 1
        
        print(f"  Found {new_count} new APIs in {category}")
        time.sleep(1)  # Rate limiting
    
    print(f"\n" + "=" * 50)
    print(f"✅ Total new APIs found: {len(all_apis)}")
    
    # Save results
    output_path = os.path.expanduser(f"~/Projects/apiclaw/data/expansion-rapidapi-{datetime.now().strftime('%Y%m%d')}.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    output = {
        "source": "RapidAPI",
        "scraped_at": datetime.now().isoformat(),
        "categories_scraped": CATEGORIES,
        "total_apis": len(all_apis),
        "apis": all_apis
    }
    
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"💾 Saved to: {output_path}")
    return all_apis

if __name__ == "__main__":
    main()
