#!/usr/bin/env python3
"""
Extract RapidAPI data from browser snapshot file
"""
import json
import re
import os
from datetime import datetime

def parse_snapshot_to_apis(snapshot_file, category):
    """Parse browser snapshot and extract API data"""
    apis = []
    
    with open(snapshot_file, 'r') as f:
        content = f.read()
    
    # Pattern to match API cards from snapshot
    # Look for link patterns like: link "API Name" [ref=eXXX]
    # followed by generic with description
    
    # Find all API names and descriptions
    name_pattern = r'link "([^"]+)" \[ref=e\d+\] \[cursor=pointer\]:\s*- /url: /[^/]+/api/[^/]+/playground'
    desc_pattern = r'generic "([^"]+)" \[ref=e\d+\]'
    
    lines = content.split('\n')
    
    current_api = None
    for i, line in enumerate(lines):
        # Look for API link pattern
        if '/playground' in line and 'link "' in line:
            match = re.search(r'link "([^"]+)"', line)
            if match:
                api_name = match.group(1)
                # Skip navigation/utility items
                if api_name not in ['Browse Category', 'View All Categories', 'Discovery', 'Collections']:
                    current_api = {'name': api_name, 'category': category}
        
        # Look for description following API name
        if current_api and 'generic "' in line and 'ref=e' in line:
            match = re.search(r'generic "([^"]+)"', line)
            if match and len(match.group(1)) > 30:  # Likely a description
                current_api['description'] = match.group(1)[:500]
                apis.append(current_api)
                current_api = None
    
    return apis

def main():
    # Read collected snapshot data
    output_dir = os.path.expanduser("~/Projects/apiclaw/data/rapidapi-snapshots")
    
    all_apis = []
    
    # Process each category snapshot file
    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            if filename.endswith('.txt'):
                category = filename.replace('.txt', '').replace('_', ' ')
                filepath = os.path.join(output_dir, filename)
                apis = parse_snapshot_to_apis(filepath, category)
                all_apis.extend(apis)
                print(f"Extracted {len(apis)} APIs from {category}")
    
    # Deduplicate
    seen = set()
    unique_apis = []
    for api in all_apis:
        if api['name'].lower() not in seen:
            seen.add(api['name'].lower())
            unique_apis.append(api)
    
    print(f"\nTotal unique APIs: {len(unique_apis)}")
    
    # Save output
    output_path = os.path.expanduser(f"~/Projects/apiclaw/data/expansion-rapidapi-{datetime.now().strftime('%Y%m%d')}.json")
    output = {
        "source": "RapidAPI",
        "scraped_at": datetime.now().isoformat(),
        "total_apis": len(unique_apis),
        "apis": unique_apis
    }
    
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    main()
