#!/usr/bin/env python3
"""
APIClaw Registry Expansion Script
Aggregates APIs from multiple sources and deduplicates them.
Target: 5,000+ APIs
"""

import json
import re
import hashlib
from datetime import datetime
from pathlib import Path
import urllib.request
import ssl

# Category mapping for standardization
CATEGORY_MAP = {
    'cloud': 'Cloud',
    'payment': 'Finance',
    'financial': 'Finance',
    'finance': 'Finance',
    'social': 'Social',
    'weather': 'Weather',
    'geocoding': 'Geocoding',
    'location': 'Geocoding',
    'machine_learning': 'Machine Learning',
    'ai': 'Machine Learning',
    'iot': 'IoT',
    'security': 'Security',
    'analytics': 'Analytics',
    'ecommerce': 'Shopping',
    'email': 'Email',
    'entertainment': 'Entertainment',
    'music': 'Music',
    'video': 'Video',
    'games': 'Games',
    'news': 'News',
    'sports': 'Sports',
    'health': 'Health',
    'food': 'Food & Drink',
    'travel': 'Transportation',
    'transport': 'Transportation',
    'government': 'Government',
    'developer_tools': 'Development',
    'development': 'Development',
    'open_data': 'Open Data',
    'text': 'Text Analysis',
    'messaging': 'Communication',
    'media': 'Media',
    'documents': 'Documents',
    'storage': 'Storage',
    'database': 'Database',
    'search': 'Search',
    'marketing': 'Marketing',
    'crm': 'Business',
    'business': 'Business',
    'education': 'Education',
    'jobs': 'Jobs',
    'real_estate': 'Real Estate',
    'cryptocurrency': 'Cryptocurrency',
    'blockchain': 'Blockchain',
}

def generate_id(name: str) -> str:
    """Generate a unique ID from API name."""
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def normalize_category(cat: str) -> str:
    """Normalize category name."""
    if not cat:
        return 'Uncategorized'
    cat_lower = cat.lower().replace(' ', '_').replace('-', '_')
    return CATEGORY_MAP.get(cat_lower, cat.title())

def fetch_json(url: str) -> dict:
    """Fetch JSON from URL."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'APIClaw/1.0'})
        with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return {}

def load_existing_apis(path: str) -> dict:
    """Load existing APIs from file."""
    with open(path, 'r') as f:
        data = json.load(f)
    # Create lookup by normalized name/link
    existing = {}
    for api in data.get('apis', []):
        key = api.get('link', '').lower().rstrip('/')
        if key:
            existing[key] = api
        name_key = api.get('name', '').lower()
        if name_key:
            existing[f"name:{name_key}"] = api
    return existing, data

def parse_apis_guru(data: dict) -> list:
    """Parse APIs from apis.guru format."""
    apis = []
    for provider, info in data.items():
        if not isinstance(info, dict):
            continue
        preferred = info.get('preferred', '')
        versions = info.get('versions', {})
        if not versions:
            continue
        
        # Get preferred version or latest
        version_info = versions.get(preferred) or list(versions.values())[0]
        api_info = version_info.get('info', {})
        
        name = api_info.get('title', provider)
        description = api_info.get('description', '')[:500]
        
        # Clean description
        description = re.sub(r'<[^>]+>', '', description)
        description = re.sub(r'\s+', ' ', description).strip()
        
        categories = api_info.get('x-apisguru-categories', [])
        category = normalize_category(categories[0] if categories else 'Uncategorized')
        
        # Get link
        link = ''
        origins = api_info.get('x-origin', [])
        if origins and isinstance(origins, list):
            link = origins[0].get('url', '')
        
        ext_docs = version_info.get('externalDocs', {})
        if not link and ext_docs:
            link = ext_docs.get('url', '')
        
        if not link:
            link = f"https://api.apis.guru/v2/specs/{provider}"
        
        apis.append({
            'name': name,
            'description': description[:300] if description else f"API for {name}",
            'category': category,
            'auth': 'apiKey',  # Most APIs require auth
            'https': True,
            'cors': 'unknown',
            'link': link,
            'pricing': 'unknown',
            'keywords': [provider.split('.')[0], category.lower()]
        })
    
    return apis

def get_public_apis_github() -> list:
    """Fetch from public-apis GitHub (different format)."""
    print("Fetching from public-apis entries.json...")
    url = "https://raw.githubusercontent.com/public-apis/public-apis/master/scripts/tests/entries.json"
    data = fetch_json(url)
    
    apis = []
    if isinstance(data, list):
        for entry in data:
            apis.append({
                'name': entry.get('API', entry.get('name', '')),
                'description': entry.get('Description', entry.get('description', '')),
                'category': normalize_category(entry.get('Category', 'Uncategorized')),
                'auth': entry.get('Auth', 'None') or 'None',
                'https': entry.get('HTTPS', True),
                'cors': entry.get('Cors', 'unknown'),
                'link': entry.get('Link', ''),
                'pricing': 'free' if not entry.get('Auth') else 'unknown',
                'keywords': []
            })
    return apis

# Additional curated APIs to add (high-value, popular APIs)
CURATED_APIS = [
    # AI/ML
    {"name": "OpenAI API", "description": "GPT-4, DALL-E, Whisper and more AI models", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.openai.com/docs/api-reference", "pricing": "paid", "keywords": ["ai", "gpt", "chatgpt", "dalle"]},
    {"name": "Anthropic Claude API", "description": "Claude AI models for text generation and analysis", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.anthropic.com/claude/reference", "pricing": "paid", "keywords": ["ai", "claude", "llm"]},
    {"name": "Hugging Face Inference API", "description": "Run ML models for NLP, vision, and more", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://huggingface.co/docs/api-inference", "pricing": "freemium", "keywords": ["ai", "ml", "nlp", "transformers"]},
    {"name": "Replicate API", "description": "Run open-source ML models in the cloud", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://replicate.com/docs/reference/http", "pricing": "paid", "keywords": ["ai", "ml", "stable-diffusion"]},
    {"name": "Stability AI", "description": "Stable Diffusion and image generation APIs", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://platform.stability.ai/docs/api-reference", "pricing": "paid", "keywords": ["ai", "image", "stable-diffusion"]},
    {"name": "Cohere API", "description": "NLP models for text generation and embeddings", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.cohere.com/reference/about", "pricing": "freemium", "keywords": ["ai", "nlp", "embeddings"]},
    {"name": "Google Gemini API", "description": "Google's multimodal AI model", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://ai.google.dev/docs", "pricing": "freemium", "keywords": ["ai", "google", "gemini"]},
    {"name": "Mistral AI", "description": "Open-weight LLMs for enterprise", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.mistral.ai/api/", "pricing": "paid", "keywords": ["ai", "llm", "mistral"]},
    {"name": "Perplexity API", "description": "AI-powered search and answers", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.perplexity.ai/", "pricing": "paid", "keywords": ["ai", "search", "perplexity"]},
    {"name": "ElevenLabs API", "description": "AI voice synthesis and cloning", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://elevenlabs.io/docs/api-reference", "pricing": "freemium", "keywords": ["ai", "voice", "tts", "speech"]},
    {"name": "AssemblyAI", "description": "Speech-to-text and audio intelligence", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.assemblyai.com/docs", "pricing": "freemium", "keywords": ["ai", "speech", "transcription"]},
    {"name": "Deepgram API", "description": "Real-time speech recognition", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.deepgram.com/docs", "pricing": "freemium", "keywords": ["ai", "speech", "transcription"]},
    
    # Payments
    {"name": "Stripe API", "description": "Payment processing and financial infrastructure", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://stripe.com/docs/api", "pricing": "paid", "keywords": ["payments", "stripe", "finance"]},
    {"name": "PayPal REST API", "description": "Payment processing and checkout", "category": "Finance", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.paypal.com/docs/api/overview/", "pricing": "paid", "keywords": ["payments", "paypal"]},
    {"name": "Square API", "description": "Payment processing and commerce platform", "category": "Finance", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.squareup.com/reference/square", "pricing": "paid", "keywords": ["payments", "square", "pos"]},
    {"name": "Plaid API", "description": "Connect bank accounts and financial data", "category": "Finance", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://plaid.com/docs/", "pricing": "paid", "keywords": ["banking", "plaid", "fintech"]},
    {"name": "Wise API", "description": "International money transfers", "category": "Finance", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://api-docs.wise.com/", "pricing": "paid", "keywords": ["payments", "transfers", "wise"]},
    
    # Communication
    {"name": "Twilio API", "description": "SMS, voice, video, and messaging", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.twilio.com/docs/usage/api", "pricing": "paid", "keywords": ["sms", "voice", "twilio"]},
    {"name": "SendGrid API", "description": "Email delivery and marketing", "category": "Email", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.sendgrid.com/api-reference", "pricing": "freemium", "keywords": ["email", "sendgrid"]},
    {"name": "Mailgun API", "description": "Transactional email service", "category": "Email", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://documentation.mailgun.com/en/latest/api_reference.html", "pricing": "freemium", "keywords": ["email", "mailgun"]},
    {"name": "Postmark API", "description": "Transactional email delivery", "category": "Email", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://postmarkapp.com/developer", "pricing": "paid", "keywords": ["email", "postmark"]},
    {"name": "Slack API", "description": "Workspace messaging and apps", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://api.slack.com/", "pricing": "freemium", "keywords": ["slack", "messaging", "workspace"]},
    {"name": "Discord API", "description": "Chat, voice, and community platform", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://discord.com/developers/docs/intro", "pricing": "free", "keywords": ["discord", "chat", "gaming"]},
    {"name": "Telegram Bot API", "description": "Create bots for Telegram", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://core.telegram.org/bots/api", "pricing": "free", "keywords": ["telegram", "bot", "messaging"]},
    {"name": "WhatsApp Business API", "description": "Business messaging on WhatsApp", "category": "Communication", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.facebook.com/docs/whatsapp/", "pricing": "paid", "keywords": ["whatsapp", "messaging"]},
    
    # Social Media
    {"name": "Twitter/X API v2", "description": "Access tweets, users, and trends", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.twitter.com/en/docs/twitter-api", "pricing": "freemium", "keywords": ["twitter", "x", "social"]},
    {"name": "Instagram Graph API", "description": "Instagram business and creator accounts", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.facebook.com/docs/instagram-api/", "pricing": "free", "keywords": ["instagram", "social", "photos"]},
    {"name": "Facebook Graph API", "description": "Access Facebook data and features", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.facebook.com/docs/graph-api/", "pricing": "free", "keywords": ["facebook", "social"]},
    {"name": "LinkedIn API", "description": "Professional networking data", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://learn.microsoft.com/en-us/linkedin/", "pricing": "free", "keywords": ["linkedin", "professional", "jobs"]},
    {"name": "TikTok API", "description": "TikTok creator and business tools", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.tiktok.com/", "pricing": "free", "keywords": ["tiktok", "video", "social"]},
    {"name": "Reddit API", "description": "Access Reddit posts and communities", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://www.reddit.com/dev/api/", "pricing": "free", "keywords": ["reddit", "social", "community"]},
    {"name": "YouTube Data API", "description": "YouTube videos, channels, and playlists", "category": "Video", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.google.com/youtube/v3", "pricing": "free", "keywords": ["youtube", "video", "google"]},
    {"name": "Vimeo API", "description": "Video hosting and streaming", "category": "Video", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.vimeo.com/api", "pricing": "freemium", "keywords": ["vimeo", "video"]},
    
    # Maps & Location
    {"name": "Google Maps Platform", "description": "Maps, routes, and places", "category": "Geocoding", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.google.com/maps/documentation", "pricing": "freemium", "keywords": ["maps", "google", "geocoding"]},
    {"name": "Mapbox API", "description": "Custom maps and location services", "category": "Geocoding", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mapbox.com/api/", "pricing": "freemium", "keywords": ["maps", "mapbox", "location"]},
    {"name": "OpenStreetMap Nominatim", "description": "Free geocoding and reverse geocoding", "category": "Geocoding", "auth": "None", "https": True, "cors": "yes", "link": "https://nominatim.org/release-docs/develop/api/", "pricing": "free", "keywords": ["maps", "osm", "geocoding"]},
    {"name": "HERE API", "description": "Location services and mapping", "category": "Geocoding", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.here.com/documentation", "pricing": "freemium", "keywords": ["maps", "here", "location"]},
    {"name": "What3Words API", "description": "3-word address system", "category": "Geocoding", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.what3words.com/public-api", "pricing": "freemium", "keywords": ["geocoding", "addresses"]},
    
    # Weather
    {"name": "OpenWeatherMap API", "description": "Weather data and forecasts", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://openweathermap.org/api", "pricing": "freemium", "keywords": ["weather", "forecast"]},
    {"name": "Tomorrow.io Weather API", "description": "Weather intelligence platform", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.tomorrow.io/", "pricing": "freemium", "keywords": ["weather", "forecast"]},
    {"name": "Visual Crossing Weather", "description": "Historical and forecast weather data", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.visualcrossing.com/weather-api", "pricing": "freemium", "keywords": ["weather", "historical"]},
    {"name": "Weatherbit API", "description": "Weather forecasts and historical data", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.weatherbit.io/api", "pricing": "freemium", "keywords": ["weather", "forecast"]},
    
    # Data & Analytics
    {"name": "Algolia Search API", "description": "Search and discovery platform", "category": "Search", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.algolia.com/doc/api-reference/", "pricing": "freemium", "keywords": ["search", "algolia"]},
    {"name": "Elasticsearch API", "description": "Distributed search and analytics", "category": "Search", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html", "pricing": "freemium", "keywords": ["search", "elasticsearch", "analytics"]},
    {"name": "Mixpanel API", "description": "Product analytics platform", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developer.mixpanel.com/reference", "pricing": "freemium", "keywords": ["analytics", "mixpanel"]},
    {"name": "Amplitude API", "description": "Product analytics for growth", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://www.docs.developers.amplitude.com/", "pricing": "freemium", "keywords": ["analytics", "amplitude"]},
    {"name": "Segment API", "description": "Customer data platform", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/", "pricing": "freemium", "keywords": ["analytics", "segment", "cdp"]},
    
    # Storage & Database
    {"name": "Supabase API", "description": "Open source Firebase alternative", "category": "Database", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://supabase.com/docs/reference", "pricing": "freemium", "keywords": ["database", "supabase", "postgres"]},
    {"name": "Firebase API", "description": "Google's app development platform", "category": "Database", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://firebase.google.com/docs/reference", "pricing": "freemium", "keywords": ["database", "firebase", "google"]},
    {"name": "MongoDB Atlas API", "description": "Cloud database service", "category": "Database", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://www.mongodb.com/docs/atlas/api/", "pricing": "freemium", "keywords": ["database", "mongodb"]},
    {"name": "Airtable API", "description": "Spreadsheet-database hybrid", "category": "Database", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://airtable.com/developers/web/api/introduction", "pricing": "freemium", "keywords": ["database", "airtable", "spreadsheet"]},
    {"name": "Notion API", "description": "Connected workspace platform", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.notion.com/", "pricing": "freemium", "keywords": ["notion", "productivity", "workspace"]},
    {"name": "Cloudinary API", "description": "Image and video management", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://cloudinary.com/documentation/image_upload_api_reference", "pricing": "freemium", "keywords": ["images", "video", "cloudinary"]},
    {"name": "imgix API", "description": "Real-time image processing", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.imgix.com/apis/rendering", "pricing": "paid", "keywords": ["images", "imgix"]},
    
    # E-commerce
    {"name": "Shopify Admin API", "description": "E-commerce platform", "category": "Shopping", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://shopify.dev/docs/api/admin", "pricing": "paid", "keywords": ["shopify", "ecommerce"]},
    {"name": "WooCommerce REST API", "description": "WordPress e-commerce", "category": "Shopping", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "pricing": "free", "keywords": ["woocommerce", "wordpress", "ecommerce"]},
    {"name": "BigCommerce API", "description": "E-commerce platform", "category": "Shopping", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.bigcommerce.com/docs/rest", "pricing": "paid", "keywords": ["bigcommerce", "ecommerce"]},
    {"name": "Amazon Product Advertising API", "description": "Amazon product data", "category": "Shopping", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://webservices.amazon.com/paapi5/documentation/", "pricing": "free", "keywords": ["amazon", "products", "affiliate"]},
    
    # Development Tools
    {"name": "GitHub API", "description": "Git repository and collaboration", "category": "Development", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://docs.github.com/en/rest", "pricing": "freemium", "keywords": ["github", "git", "code"]},
    {"name": "GitLab API", "description": "DevOps platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.gitlab.com/ee/api/", "pricing": "freemium", "keywords": ["gitlab", "git", "devops"]},
    {"name": "Bitbucket API", "description": "Git code management", "category": "Development", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.atlassian.com/cloud/bitbucket/rest/", "pricing": "freemium", "keywords": ["bitbucket", "git", "atlassian"]},
    {"name": "npm Registry API", "description": "JavaScript package registry", "category": "Development", "auth": "None", "https": True, "cors": "yes", "link": "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md", "pricing": "free", "keywords": ["npm", "javascript", "packages"]},
    {"name": "PyPI API", "description": "Python package index", "category": "Development", "auth": "None", "https": True, "cors": "yes", "link": "https://warehouse.pypa.io/api-reference/", "pricing": "free", "keywords": ["pypi", "python", "packages"]},
    {"name": "Vercel API", "description": "Frontend cloud platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://vercel.com/docs/rest-api", "pricing": "freemium", "keywords": ["vercel", "deployment", "frontend"]},
    {"name": "Netlify API", "description": "Web deployment platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.netlify.com/api/get-started/", "pricing": "freemium", "keywords": ["netlify", "deployment"]},
    {"name": "Railway API", "description": "Infrastructure platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.railway.app/reference/public-api", "pricing": "freemium", "keywords": ["railway", "deployment", "infrastructure"]},
    {"name": "Render API", "description": "Cloud application hosting", "category": "Development", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://api-docs.render.com/reference/introduction", "pricing": "freemium", "keywords": ["render", "deployment", "cloud"]},
    {"name": "Fly.io API", "description": "Global application platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://fly.io/docs/machines/api/", "pricing": "freemium", "keywords": ["fly", "deployment", "edge"]},
    
    # CRM & Business
    {"name": "Salesforce REST API", "description": "CRM and business platform", "category": "Business", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/", "pricing": "paid", "keywords": ["salesforce", "crm"]},
    {"name": "HubSpot API", "description": "Marketing and sales platform", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.hubspot.com/docs/api/overview", "pricing": "freemium", "keywords": ["hubspot", "crm", "marketing"]},
    {"name": "Pipedrive API", "description": "Sales CRM", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.pipedrive.com/docs/api/v1", "pricing": "paid", "keywords": ["pipedrive", "crm", "sales"]},
    {"name": "Zendesk API", "description": "Customer service platform", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developer.zendesk.com/api-reference/", "pricing": "paid", "keywords": ["zendesk", "support", "customer-service"]},
    {"name": "Intercom API", "description": "Customer messaging platform", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.intercom.com/docs/references/rest-api/api.intercom.io/", "pricing": "paid", "keywords": ["intercom", "messaging", "support"]},
    {"name": "Freshdesk API", "description": "Customer support software", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.freshdesk.com/api/", "pricing": "freemium", "keywords": ["freshdesk", "support"]},
    
    # Authentication
    {"name": "Auth0 API", "description": "Identity platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://auth0.com/docs/api", "pricing": "freemium", "keywords": ["auth0", "authentication", "identity"]},
    {"name": "Okta API", "description": "Identity and access management", "category": "Security", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developer.okta.com/docs/reference/", "pricing": "paid", "keywords": ["okta", "authentication", "iam"]},
    {"name": "Clerk API", "description": "User authentication and management", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://clerk.com/docs/reference/backend-api", "pricing": "freemium", "keywords": ["clerk", "authentication"]},
    
    # News & Content
    {"name": "NewsAPI", "description": "News articles from around the world", "category": "News", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://newsapi.org/docs", "pricing": "freemium", "keywords": ["news", "articles"]},
    {"name": "The Guardian API", "description": "Guardian news content", "category": "News", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://open-platform.theguardian.com/documentation/", "pricing": "free", "keywords": ["news", "guardian"]},
    {"name": "New York Times API", "description": "NYT articles and data", "category": "News", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.nytimes.com/apis", "pricing": "free", "keywords": ["news", "nyt"]},
    {"name": "Hacker News API", "description": "Tech news and discussions", "category": "News", "auth": "None", "https": True, "cors": "yes", "link": "https://github.com/HackerNews/API", "pricing": "free", "keywords": ["news", "tech", "hackernews"]},
    {"name": "DEV.to API", "description": "Developer community content", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.forem.com/api/", "pricing": "free", "keywords": ["dev", "community", "articles"]},
    {"name": "Medium API", "description": "Publishing platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://github.com/Medium/medium-api-docs", "pricing": "free", "keywords": ["medium", "blog", "publishing"]},
    
    # Entertainment
    {"name": "Spotify Web API", "description": "Music streaming platform", "category": "Music", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.spotify.com/documentation/web-api", "pricing": "free", "keywords": ["spotify", "music", "streaming"]},
    {"name": "Last.fm API", "description": "Music discovery and scrobbling", "category": "Music", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.last.fm/api", "pricing": "free", "keywords": ["lastfm", "music"]},
    {"name": "Deezer API", "description": "Music streaming service", "category": "Music", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.deezer.com/api", "pricing": "free", "keywords": ["deezer", "music"]},
    {"name": "TMDB API", "description": "Movie and TV database", "category": "Entertainment", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.themoviedb.org/docs", "pricing": "free", "keywords": ["movies", "tv", "tmdb"]},
    {"name": "OMDB API", "description": "Open movie database", "category": "Entertainment", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.omdbapi.com/", "pricing": "freemium", "keywords": ["movies", "omdb"]},
    {"name": "IGDB API", "description": "Video game database", "category": "Games", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api-docs.igdb.com/", "pricing": "free", "keywords": ["games", "igdb"]},
    {"name": "RAWG API", "description": "Video games database", "category": "Games", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://rawg.io/apidocs", "pricing": "free", "keywords": ["games", "rawg"]},
    {"name": "Twitch API", "description": "Live streaming platform", "category": "Entertainment", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://dev.twitch.tv/docs/api/", "pricing": "free", "keywords": ["twitch", "streaming", "gaming"]},
    
    # Crypto & Finance
    {"name": "CoinGecko API", "description": "Cryptocurrency data", "category": "Cryptocurrency", "auth": "None", "https": True, "cors": "yes", "link": "https://www.coingecko.com/en/api/documentation", "pricing": "freemium", "keywords": ["crypto", "coingecko"]},
    {"name": "CoinMarketCap API", "description": "Cryptocurrency market data", "category": "Cryptocurrency", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://coinmarketcap.com/api/documentation/v1/", "pricing": "freemium", "keywords": ["crypto", "coinmarketcap"]},
    {"name": "Binance API", "description": "Cryptocurrency exchange", "category": "Cryptocurrency", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://binance-docs.github.io/apidocs/", "pricing": "free", "keywords": ["crypto", "binance", "trading"]},
    {"name": "Coinbase API", "description": "Cryptocurrency platform", "category": "Cryptocurrency", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.cloud.coinbase.com/", "pricing": "free", "keywords": ["crypto", "coinbase"]},
    {"name": "Alpha Vantage API", "description": "Stock market data", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.alphavantage.co/documentation/", "pricing": "freemium", "keywords": ["stocks", "finance", "market"]},
    {"name": "Polygon.io API", "description": "Stock and crypto market data", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://polygon.io/docs/", "pricing": "freemium", "keywords": ["stocks", "crypto", "market"]},
    {"name": "Finnhub API", "description": "Financial market data", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://finnhub.io/docs/api", "pricing": "freemium", "keywords": ["stocks", "finance"]},
    
    # Utility
    {"name": "IPinfo API", "description": "IP address geolocation", "category": "Geocoding", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://ipinfo.io/developers", "pricing": "freemium", "keywords": ["ip", "geolocation"]},
    {"name": "ip-api", "description": "IP geolocation API", "category": "Geocoding", "auth": "None", "https": True, "cors": "yes", "link": "https://ip-api.com/docs/", "pricing": "free", "keywords": ["ip", "geolocation"]},
    {"name": "Abstract API", "description": "Various utility APIs", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.abstractapi.com/", "pricing": "freemium", "keywords": ["utility", "validation"]},
    {"name": "Hunter.io API", "description": "Email finder and verifier", "category": "Email", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://hunter.io/api-documentation/v2", "pricing": "freemium", "keywords": ["email", "hunter", "leads"]},
    {"name": "Clearbit API", "description": "Business intelligence data", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://clearbit.com/docs", "pricing": "paid", "keywords": ["clearbit", "enrichment", "data"]},
    {"name": "FullContact API", "description": "Identity resolution", "category": "Business", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://platform.fullcontact.com/docs/apis/", "pricing": "paid", "keywords": ["identity", "enrichment"]},
    {"name": "ZeroBounce API", "description": "Email validation", "category": "Email", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.zerobounce.net/docs/", "pricing": "freemium", "keywords": ["email", "validation"]},
    {"name": "PDF.co API", "description": "PDF generation and parsing", "category": "Documents", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.pdf.co/", "pricing": "freemium", "keywords": ["pdf", "documents"]},
    {"name": "DocuSign API", "description": "Electronic signatures", "category": "Documents", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.docusign.com/docs/", "pricing": "paid", "keywords": ["docusign", "esignature"]},
    {"name": "Calendly API", "description": "Scheduling automation", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developer.calendly.com/api-docs", "pricing": "freemium", "keywords": ["calendly", "scheduling"]},
    {"name": "Cal.com API", "description": "Open source scheduling", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://cal.com/docs/enterprise-features/api", "pricing": "freemium", "keywords": ["scheduling", "calendar"]},
    {"name": "Loom API", "description": "Video messaging platform", "category": "Video", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://dev.loom.com/docs/", "pricing": "freemium", "keywords": ["loom", "video", "recording"]},
    {"name": "Mux API", "description": "Video infrastructure", "category": "Video", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mux.com/api-reference", "pricing": "paid", "keywords": ["mux", "video", "streaming"]},
    {"name": "Bannerbear API", "description": "Automated image generation", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.bannerbear.com/api/", "pricing": "paid", "keywords": ["images", "automation"]},
    {"name": "Remove.bg API", "description": "Background removal", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.remove.bg/api", "pricing": "freemium", "keywords": ["images", "background"]},
    {"name": "Unsplash API", "description": "Free high-resolution photos", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://unsplash.com/documentation", "pricing": "free", "keywords": ["images", "photos", "unsplash"]},
    {"name": "Pexels API", "description": "Free stock photos and videos", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.pexels.com/api/documentation/", "pricing": "free", "keywords": ["images", "photos", "pexels"]},
    {"name": "Giphy API", "description": "GIF search and discovery", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.giphy.com/docs/api/", "pricing": "free", "keywords": ["gifs", "giphy"]},
    {"name": "Tenor API", "description": "GIF search engine", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.google.com/tenor/guides/quickstart", "pricing": "free", "keywords": ["gifs", "tenor"]},
    
    # More AI tools
    {"name": "Pinecone API", "description": "Vector database for ML", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.pinecone.io/reference", "pricing": "freemium", "keywords": ["vectors", "embeddings", "ai"]},
    {"name": "Weaviate API", "description": "Open source vector database", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://weaviate.io/developers/weaviate/api", "pricing": "freemium", "keywords": ["vectors", "search", "ai"]},
    {"name": "Qdrant API", "description": "Vector similarity search", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://qdrant.tech/documentation/", "pricing": "freemium", "keywords": ["vectors", "search"]},
    {"name": "LangChain API", "description": "LLM application framework", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://api.smith.langchain.com/redoc", "pricing": "freemium", "keywords": ["ai", "llm", "langchain"]},
    {"name": "Groq API", "description": "Fast LLM inference", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://console.groq.com/docs/quickstart", "pricing": "freemium", "keywords": ["ai", "llm", "groq"]},
    {"name": "Together AI", "description": "Open source model inference", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.together.ai/reference", "pricing": "paid", "keywords": ["ai", "llm", "inference"]},
    {"name": "Fireworks AI", "description": "Fast generative AI", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://readme.fireworks.ai/reference", "pricing": "paid", "keywords": ["ai", "llm", "inference"]},
    {"name": "Anyscale Endpoints", "description": "LLM serving platform", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.endpoints.anyscale.com/", "pricing": "paid", "keywords": ["ai", "llm", "ray"]},
    {"name": "Writer API", "description": "Enterprise AI writing", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://dev.writer.com/api-guides/api-reference", "pricing": "paid", "keywords": ["ai", "writing"]},
    {"name": "Jasper AI API", "description": "AI content creation", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developers.jasper.ai/docs", "pricing": "paid", "keywords": ["ai", "content", "writing"]},
]

def main():
    registry_path = Path.home() / "Projects" / "apiclaw" / "src" / "registry" / "apis.json"
    
    print("Loading existing APIs...")
    existing, original_data = load_existing_apis(registry_path)
    print(f"Existing APIs: {len(original_data.get('apis', []))}")
    
    all_apis = list(original_data.get('apis', []))
    seen_links = {api.get('link', '').lower().rstrip('/') for api in all_apis if api.get('link')}
    seen_names = {api.get('name', '').lower() for api in all_apis if api.get('name')}
    
    def add_api(api):
        link = api.get('link', '').lower().rstrip('/')
        name = api.get('name', '').lower()
        
        # Skip if duplicate
        if link and link in seen_links:
            return False
        if name and name in seen_names:
            return False
        
        # Generate ID
        api['id'] = generate_id(api.get('name', 'unknown'))
        
        # Ensure all required fields
        api.setdefault('description', '')
        api.setdefault('category', 'Uncategorized')
        api.setdefault('auth', 'None')
        api.setdefault('https', True)
        api.setdefault('cors', 'unknown')
        api.setdefault('link', '')
        api.setdefault('pricing', 'unknown')
        api.setdefault('keywords', [])
        
        # Clean description
        api['description'] = api['description'][:300] if api['description'] else ''
        
        all_apis.append(api)
        if link:
            seen_links.add(link)
        if name:
            seen_names.add(name)
        return True
    
    # Add curated APIs
    print("\nAdding curated high-value APIs...")
    added = 0
    for api in CURATED_APIS:
        if add_api(api.copy()):
            added += 1
    print(f"Added {added} curated APIs")
    
    # Fetch from apis.guru
    print("\nFetching from apis.guru...")
    apis_guru_data = fetch_json("https://api.apis.guru/v2/list.json")
    if apis_guru_data:
        guru_apis = parse_apis_guru(apis_guru_data)
        added = 0
        for api in guru_apis:
            if add_api(api):
                added += 1
        print(f"Added {added} APIs from apis.guru")
    
    # Fetch public-apis entries
    print("\nFetching from public-apis entries.json...")
    public_apis = get_public_apis_github()
    added = 0
    for api in public_apis:
        if add_api(api):
            added += 1
    print(f"Added {added} APIs from public-apis")
    
    # Create final output
    print(f"\nTotal APIs: {len(all_apis)}")
    
    output = {
        "version": "2.0.0",
        "source": "APIClaw aggregated registry",
        "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
        "count": len(all_apis),
        "apis": all_apis
    }
    
    # Write output
    print(f"Writing to {registry_path}...")
    with open(registry_path, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Done! Final count: {len(all_apis)} APIs")
    return len(all_apis)

if __name__ == "__main__":
    main()
