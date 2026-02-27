#!/usr/bin/env python3
"""
ADD APIs to registry - NEVER replaces, only adds new unique entries.
Usage: python3 add-to-registry.py <input.json>

This is the ONLY script that should modify the registry.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Category consolidation - keep it tight (14 categories)
CATEGORY_MAP = {
    'ai': 'AI & ML', 'ai/ml': 'AI & ML', 'machine learning': 'AI & ML', 'ml': 'AI & ML',
    'nlp': 'AI & ML', 'artificial intelligence': 'AI & ML', 'deep learning': 'AI & ML',
    
    'analytics': 'Analytics', 'data': 'Analytics', 'big data': 'Analytics',
    'statistics': 'Analytics', 'open data': 'Analytics',
    
    'auth': 'Security', 'authentication': 'Security', 'security': 'Security', 'identity': 'Security',
    
    'business': 'Business', 'productivity': 'Business', 'enterprise': 'Business',
    'crm': 'Business', 'erp': 'Business', 'documents': 'Business',
    
    'cloud': 'Cloud', 'infrastructure': 'Cloud', 'devops': 'Cloud', 'hosting': 'Cloud',
    
    'communication': 'Communication', 'messaging': 'Communication', 'chat': 'Communication',
    'email': 'Communication', 'sms': 'Communication', 'notifications': 'Communication',
    
    'development': 'Development', 'developer tools': 'Development', 'devtools': 'Development',
    'testing': 'Development', 'api': 'Development', 'sdk': 'Development',
    
    'commerce': 'Commerce', 'e-commerce': 'Commerce', 'payments': 'Commerce', 'shopping': 'Commerce',
    
    'entertainment': 'Entertainment', 'games': 'Entertainment', 'gaming': 'Entertainment',
    'music': 'Entertainment', 'video': 'Entertainment', 'media': 'Entertainment', 'news': 'Entertainment',
    
    'finance': 'Finance', 'banking': 'Finance', 'fintech': 'Finance',
    'cryptocurrency': 'Finance', 'crypto': 'Finance', 'blockchain': 'Finance',
    
    'health': 'Health', 'healthcare': 'Health', 'medical': 'Health', 'fitness': 'Health',
    
    'location': 'Location', 'maps': 'Location', 'geo': 'Location', 'travel': 'Location',
    'transportation': 'Location', 'logistics': 'Location', 'shipping': 'Location',
    
    'social': 'Social', 'social media': 'Social',
}

def normalize_category(raw):
    if not raw:
        return 'Utilities'
    raw_lower = raw.lower().strip()
    if raw_lower in CATEGORY_MAP:
        return CATEGORY_MAP[raw_lower]
    for key, cat in CATEGORY_MAP.items():
        if key in raw_lower:
            return cat
    return 'Utilities'

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 add-to-registry.py <input.json>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    registry_path = Path(__file__).parent.parent / 'landing/src/lib/apis.json'
    backup_path = Path(__file__).parent.parent / 'src/registry/apis.json'
    
    # Load existing registry
    with open(registry_path) as f:
        existing = json.load(f)
    
    existing_apis = existing.get('apis', [])
    print(f"Existing registry: {len(existing_apis)} APIs")
    
    # Build lookup
    registry = {}
    for api in existing_apis:
        name = api.get('name', '').lower().strip()
        if name:
            registry[name] = api
    
    # Load new APIs
    with open(input_file) as f:
        new_data = json.load(f)
    
    new_apis = new_data if isinstance(new_data, list) else new_data.get('apis', [])
    print(f"Input file: {len(new_apis)} APIs")
    
    # Add new (don't replace)
    added = 0
    for api in new_apis:
        if not isinstance(api, dict):
            continue
        name = api.get('name', '').lower().strip()
        if not name or name in registry:
            continue
        
        entry = {
            'name': api.get('name', ''),
            'description': api.get('description', ''),
            'category': normalize_category(api.get('category', '')),
            'baseUrl': api.get('baseUrl') or api.get('url') or '',
            'docsUrl': api.get('docsUrl') or api.get('docs') or '',
            'auth': api.get('auth') or 'unknown',
            'pricing': api.get('pricing') or 'unknown'
        }
        registry[name] = entry
        added += 1
    
    print(f"Added: {added} new APIs")
    print(f"Total: {len(registry)} APIs")
    
    # Save
    output = {
        "version": existing.get('version', '3.0.0'),
        "source": "APIClaw consolidated registry",
        "lastUpdated": datetime.now().isoformat(),
        "count": len(registry),
        "apis": list(registry.values())
    }
    
    with open(registry_path, 'w') as f:
        json.dump(output, f)
    with open(backup_path, 'w') as f:
        json.dump(output, f)
    
    print(f"✅ Registry updated: {len(registry)} APIs")

if __name__ == '__main__':
    main()
