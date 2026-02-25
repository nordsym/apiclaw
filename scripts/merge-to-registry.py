#!/usr/bin/env python3
"""
Merge new APIs into the main registry
"""

import json
import re
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"
NEW_APIS_PATH = Path(__file__).parent.parent / "data" / "night-expansion-02-25.json"

def generate_id(name: str) -> str:
    """Generate clean ID from name"""
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def main():
    # Load existing registry
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    existing_ids = {api['id'] for api in registry['apis']}
    existing_names = {api['name'].lower() for api in registry['apis']}
    
    print(f"Existing APIs: {len(registry['apis'])}")
    
    # Load new APIs
    with open(NEW_APIS_PATH, 'r') as f:
        new_apis = json.load(f)
    
    print(f"New APIs to process: {len(new_apis)}")
    
    # Convert and add
    added = 0
    for api in new_apis:
        name_lower = api['name'].lower()
        api_id = generate_id(api['name'])
        
        # Skip if already exists
        if name_lower in existing_names or api_id in existing_ids:
            continue
        
        # Convert to registry format
        registry_api = {
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api['category'],
            "auth": api.get('authType', 'none').replace('apiKey', 'API Key').replace('oauth', 'OAuth').replace('none', 'None'),
            "https": True,
            "cors": "unknown",
            "link": api.get('baseUrl', ''),
            "pricing": "unknown",
            "keywords": []
        }
        
        registry['apis'].append(registry_api)
        existing_ids.add(api_id)
        existing_names.add(name_lower)
        added += 1
    
    # Update count and date
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = "2026-02-25"
    
    # Save
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)
    
    print(f"Added {added} new APIs")
    print(f"New total: {registry['count']}")
    
    return added

if __name__ == "__main__":
    main()
