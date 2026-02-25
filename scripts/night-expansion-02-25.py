#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-25 02:00
Adds new APIs from APIs.guru and other sources
Target: +1000 APIs per run
"""

import json
import urllib.request
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
APISGURU_CACHE = os.path.expanduser("~/Projects/apiclaw/scripts/apisguru-data.json")

def load_registry():
    """Load current API registry"""
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(data):
    """Save updated registry"""
    data['lastUpdated'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    data['count'] = len(data['apis'])
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(data, f, indent=2)

def get_existing_ids(registry):
    """Get set of existing API IDs"""
    return {api.get('id', '').lower() for api in registry.get('apis', [])}

def fetch_apisguru():
    """Fetch APIs.guru list (use cache if available)"""
    if os.path.exists(APISGURU_CACHE):
        with open(APISGURU_CACHE, 'r') as f:
            return json.load(f)
    
    print("Fetching from APIs.guru...")
    url = "https://api.apis.guru/v2/list.json"
    with urllib.request.urlopen(url, timeout=60) as response:
        data = json.loads(response.read().decode())
        # Cache for future use
        with open(APISGURU_CACHE, 'w') as f:
            json.dump(data, f)
        return data

def categorize_api(info):
    """Map APIs.guru category to APIClaw category"""
    categories = info.get('x-apisguru-categories', [])
    
    category_map = {
        'financial': 'Finance',
        'payment': 'Finance',
        'security': 'Security',
        'cloud': 'Cloud',
        'analytics': 'Analytics',
        'social': 'Social',
        'marketing': 'Marketing',
        'media': 'Media',
        'developer_tools': 'Development',
        'machine_learning': 'Machine Learning',
        'iot': 'IoT',
        'open_data': 'Open Data',
        'ecommerce': 'E-commerce',
        'email': 'Communication',
        'messaging': 'Communication',
        'location': 'Geocoding',
        'search': 'Search',
        'backend': 'Development',
        'text': 'Text Analysis',
        'entertainment': 'Entertainment',
        'health': 'Health',
        'education': 'Education',
        'news': 'News',
        'sports': 'Sports',
        'transportation': 'Transportation',
        'travel': 'Travel',
        'food': 'Food & Drink',
        'government': 'Government',
        'jobs': 'Jobs',
        'music': 'Music',
        'video': 'Video',
        'weather': 'Weather',
    }
    
    for cat in categories:
        if cat.lower() in category_map:
            return category_map[cat.lower()]
    
    return 'Other'

def parse_apisguru_entry(provider, data):
    """Convert APIs.guru entry to APIClaw format"""
    preferred_version = data.get('preferred', list(data.get('versions', {}).keys())[0] if data.get('versions') else None)
    
    if not preferred_version:
        return None
        
    version_info = data.get('versions', {}).get(preferred_version, {})
    info = version_info.get('info', {})
    
    # Generate clean ID
    api_id = provider.replace('.', '-').replace(':', '-').lower()
    
    # Extract title
    title = info.get('title', provider)
    
    # Extract description
    desc = info.get('description', '')
    if len(desc) > 500:
        desc = desc[:497] + '...'
    
    # Get contact/link
    contact = info.get('contact', {})
    link = contact.get('url', '')
    if not link:
        origin = info.get('x-origin', [])
        if origin and isinstance(origin, list) and len(origin) > 0:
            link = origin[0].get('url', '')
    if not link:
        link = version_info.get('swaggerUrl', '')
    
    # Determine auth type
    auth = 'Unknown'
    if 'apiKey' in str(info).lower() or 'api key' in str(info).lower():
        auth = 'apiKey'
    elif 'oauth' in str(info).lower():
        auth = 'OAuth'
    elif 'basic' in str(info).lower():
        auth = 'HTTP Basic'
    
    return {
        'id': api_id,
        'name': title,
        'description': desc.replace('\n', ' ').strip() if desc else f"API provided by {provider}",
        'category': categorize_api(info),
        'auth': auth,
        'https': True,
        'cors': 'unknown',
        'link': link,
        'pricing': 'unknown',
        'keywords': list(set([
            kw.lower() for kw in 
            info.get('x-apisguru-categories', []) + 
            (info.get('x-tags', []) if isinstance(info.get('x-tags'), list) else [])
        ]))[:10],
        'source': 'apis.guru',
        'version': preferred_version,
        'openapiSpec': version_info.get('swaggerUrl', '')
    }

def generate_additional_apis():
    """Generate additional curated APIs not in APIs.guru"""
    return [
        # Swedish/Nordic APIs
        {"id": "postnord", "name": "PostNord", "description": "Track packages and access postal services in Scandinavia", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://developer.postnord.com/", "pricing": "freemium", "keywords": ["shipping", "tracking", "nordic", "logistics"]},
        {"id": "klarna-checkout", "name": "Klarna Checkout", "description": "Buy now, pay later payment solution", "category": "Finance", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.klarna.com/", "pricing": "paid", "keywords": ["payments", "bnpl", "checkout"]},
        {"id": "bankid-se", "name": "BankID Sweden", "description": "Swedish electronic identification solution", "category": "Security", "auth": "certificate", "https": True, "cors": "no", "link": "https://www.bankid.com/utvecklare", "pricing": "paid", "keywords": ["identity", "authentication", "sweden"]},
        {"id": "swish", "name": "Swish", "description": "Swedish mobile payment system", "category": "Finance", "auth": "certificate", "https": True, "cors": "no", "link": "https://developer.swish.nu/", "pricing": "paid", "keywords": ["payments", "mobile", "sweden"]},
        {"id": "scb-api", "name": "Statistics Sweden", "description": "Official Swedish statistics and data", "category": "Open Data", "auth": "None", "https": True, "cors": "yes", "link": "https://www.scb.se/en/services/open-data-api/", "pricing": "free", "keywords": ["statistics", "sweden", "government", "data"]},
        
        # AI/ML APIs
        {"id": "anthropic-claude", "name": "Anthropic Claude", "description": "Claude AI assistant API for conversational AI", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.anthropic.com/", "pricing": "paid", "keywords": ["ai", "llm", "chat", "assistant"]},
        {"id": "openai-gpt", "name": "OpenAI GPT", "description": "GPT language models for text generation", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.openai.com/docs/", "pricing": "paid", "keywords": ["ai", "llm", "gpt", "text"]},
        {"id": "perplexity", "name": "Perplexity AI", "description": "AI-powered search and answer engine", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.perplexity.ai/", "pricing": "paid", "keywords": ["ai", "search", "llm"]},
        {"id": "groq", "name": "Groq", "description": "Fast inference for LLMs on custom hardware", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://console.groq.com/docs/", "pricing": "freemium", "keywords": ["ai", "llm", "inference", "fast"]},
        {"id": "together-ai", "name": "Together AI", "description": "Run and fine-tune open-source AI models", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.together.ai/", "pricing": "freemium", "keywords": ["ai", "llm", "open-source"]},
        {"id": "replicate", "name": "Replicate", "description": "Run machine learning models in the cloud", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://replicate.com/docs/", "pricing": "paid", "keywords": ["ai", "ml", "models", "cloud"]},
        {"id": "huggingface-inference", "name": "Hugging Face Inference", "description": "Inference API for thousands of ML models", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://huggingface.co/docs/api-inference/", "pricing": "freemium", "keywords": ["ai", "ml", "models", "transformers"]},
        {"id": "stability-ai", "name": "Stability AI", "description": "Stable Diffusion and other generative models", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.stability.ai/docs/", "pricing": "paid", "keywords": ["ai", "images", "generation", "diffusion"]},
        {"id": "midjourney", "name": "Midjourney", "description": "AI image generation service", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://docs.midjourney.com/", "pricing": "paid", "keywords": ["ai", "images", "generation", "art"]},
        {"id": "elevenlabs", "name": "ElevenLabs", "description": "AI voice synthesis and cloning", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.elevenlabs.io/", "pricing": "freemium", "keywords": ["ai", "voice", "tts", "audio"]},
        {"id": "assembly-ai", "name": "AssemblyAI", "description": "Speech-to-text and audio intelligence", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.assemblyai.com/docs/", "pricing": "freemium", "keywords": ["ai", "speech", "transcription", "audio"]},
        {"id": "deepgram", "name": "Deepgram", "description": "Speech recognition and understanding API", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.deepgram.com/", "pricing": "freemium", "keywords": ["ai", "speech", "transcription"]},
        {"id": "cohere", "name": "Cohere", "description": "Enterprise NLP and embeddings API", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.cohere.com/", "pricing": "freemium", "keywords": ["ai", "nlp", "embeddings", "enterprise"]},
        {"id": "voyage-ai", "name": "Voyage AI", "description": "State-of-the-art embedding models", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.voyageai.com/", "pricing": "paid", "keywords": ["ai", "embeddings", "search"]},
        
        # Developer Tools
        {"id": "vercel-api", "name": "Vercel", "description": "Deploy and manage web applications", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://vercel.com/docs/rest-api", "pricing": "freemium", "keywords": ["hosting", "deploy", "serverless"]},
        {"id": "railway", "name": "Railway", "description": "Deploy apps and databases instantly", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.railway.app/reference/public-api", "pricing": "freemium", "keywords": ["hosting", "deploy", "database"]},
        {"id": "render-api", "name": "Render", "description": "Cloud application platform API", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://render.com/docs/api", "pricing": "freemium", "keywords": ["hosting", "deploy", "cloud"]},
        {"id": "supabase", "name": "Supabase", "description": "Open source Firebase alternative", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://supabase.com/docs/reference/api", "pricing": "freemium", "keywords": ["database", "auth", "storage", "realtime"]},
        {"id": "planetscale", "name": "PlanetScale", "description": "Serverless MySQL platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://planetscale.com/docs/concepts/api", "pricing": "freemium", "keywords": ["database", "mysql", "serverless"]},
        {"id": "neon", "name": "Neon", "description": "Serverless Postgres database", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://neon.tech/docs/reference/api-reference", "pricing": "freemium", "keywords": ["database", "postgres", "serverless"]},
        {"id": "upstash", "name": "Upstash", "description": "Serverless Redis and Kafka", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.upstash.com/redis/rest/getstarted", "pricing": "freemium", "keywords": ["database", "redis", "kafka", "serverless"]},
        {"id": "turso", "name": "Turso", "description": "SQLite at the edge", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.turso.tech/", "pricing": "freemium", "keywords": ["database", "sqlite", "edge"]},
        {"id": "convex", "name": "Convex", "description": "Reactive backend platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.convex.dev/", "pricing": "freemium", "keywords": ["database", "backend", "realtime"]},
        
        # Communication
        {"id": "resend", "name": "Resend", "description": "Email API for developers", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://resend.com/docs/api-reference/introduction", "pricing": "freemium", "keywords": ["email", "smtp", "transactional"]},
        {"id": "postmark", "name": "Postmark", "description": "Transactional email delivery", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://postmarkapp.com/developer", "pricing": "paid", "keywords": ["email", "transactional"]},
        {"id": "46elks", "name": "46elks", "description": "SMS, MMS, and voice API", "category": "Communication", "auth": "HTTP Basic", "https": True, "cors": "yes", "link": "https://46elks.com/docs", "pricing": "paid", "keywords": ["sms", "voice", "mms", "nordic"]},
        {"id": "telnyx", "name": "Telnyx", "description": "Global communications platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.telnyx.com/", "pricing": "paid", "keywords": ["sms", "voice", "sip"]},
        {"id": "plivo", "name": "Plivo", "description": "Voice and SMS API platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.plivo.com/docs/", "pricing": "paid", "keywords": ["sms", "voice", "telephony"]},
        {"id": "vonage", "name": "Vonage", "description": "Communications APIs (formerly Nexmo)", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.vonage.com/", "pricing": "paid", "keywords": ["sms", "voice", "video", "verify"]},
        {"id": "messagebird", "name": "MessageBird", "description": "Omnichannel communication platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.messagebird.com/", "pricing": "paid", "keywords": ["sms", "whatsapp", "voice"]},
        
        # E-commerce & Payments
        {"id": "shopify-admin", "name": "Shopify Admin", "description": "Manage Shopify stores programmatically", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://shopify.dev/docs/admin-api", "pricing": "paid", "keywords": ["ecommerce", "shop", "products"]},
        {"id": "woocommerce", "name": "WooCommerce", "description": "WordPress e-commerce REST API", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "pricing": "free", "keywords": ["ecommerce", "wordpress", "products"]},
        {"id": "bigcommerce", "name": "BigCommerce", "description": "E-commerce platform API", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.bigcommerce.com/", "pricing": "paid", "keywords": ["ecommerce", "shop", "products"]},
        {"id": "mollie", "name": "Mollie", "description": "European payment gateway", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mollie.com/", "pricing": "paid", "keywords": ["payments", "europe", "gateway"]},
        {"id": "adyen-api", "name": "Adyen", "description": "Global payment platform", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.adyen.com/", "pricing": "paid", "keywords": ["payments", "global", "enterprise"]},
        {"id": "wise-api", "name": "Wise (TransferWise)", "description": "International money transfers", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api-docs.wise.com/", "pricing": "paid", "keywords": ["payments", "transfer", "forex"]},
        {"id": "revolut-business", "name": "Revolut Business", "description": "Business banking and payments", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.revolut.com/docs/business/", "pricing": "paid", "keywords": ["banking", "payments", "business"]},
        
        # Social & Marketing
        {"id": "meta-graph", "name": "Meta Graph API", "description": "Access Facebook and Instagram data", "category": "Social", "auth": "OAuth", "https": True, "cors": "no", "link": "https://developers.facebook.com/docs/graph-api/", "pricing": "free", "keywords": ["facebook", "instagram", "social"]},
        {"id": "linkedin-api", "name": "LinkedIn", "description": "Professional network API", "category": "Social", "auth": "OAuth", "https": True, "cors": "no", "link": "https://learn.microsoft.com/en-us/linkedin/", "pricing": "free", "keywords": ["linkedin", "professional", "social"]},
        {"id": "tiktok-api", "name": "TikTok", "description": "TikTok for developers", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.tiktok.com/", "pricing": "free", "keywords": ["tiktok", "video", "social"]},
        {"id": "pinterest-api", "name": "Pinterest", "description": "Visual discovery platform API", "category": "Social", "auth": "OAuth", "https": True, "cors": "unknown", "link": "https://developers.pinterest.com/docs/api/v5/", "pricing": "free", "keywords": ["pinterest", "visual", "social"]},
        {"id": "reddit-api", "name": "Reddit", "description": "Reddit data and posting API", "category": "Social", "auth": "OAuth", "https": True, "cors": "no", "link": "https://www.reddit.com/dev/api/", "pricing": "free", "keywords": ["reddit", "community", "social"]},
        {"id": "discord-api", "name": "Discord", "description": "Chat and community platform API", "category": "Social", "auth": "apiKey", "https": True, "cors": "no", "link": "https://discord.com/developers/docs/intro", "pricing": "free", "keywords": ["discord", "chat", "gaming"]},
        {"id": "slack-api", "name": "Slack", "description": "Team communication platform API", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://api.slack.com/", "pricing": "freemium", "keywords": ["slack", "chat", "team"]},
        {"id": "notion-api", "name": "Notion", "description": "Workspace and notes API", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.notion.com/", "pricing": "freemium", "keywords": ["notion", "notes", "workspace"]},
        {"id": "airtable-api", "name": "Airtable", "description": "Spreadsheet-database hybrid API", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://airtable.com/developers/web/api/introduction", "pricing": "freemium", "keywords": ["airtable", "database", "spreadsheet"]},
        
        # Media & Content
        {"id": "cloudflare-images", "name": "Cloudflare Images", "description": "Image storage and optimization", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.cloudflare.com/images/", "pricing": "paid", "keywords": ["images", "cdn", "optimization"]},
        {"id": "cloudinary", "name": "Cloudinary", "description": "Media management platform", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://cloudinary.com/documentation/", "pricing": "freemium", "keywords": ["images", "video", "media"]},
        {"id": "imgix", "name": "Imgix", "description": "Real-time image processing", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.imgix.com/", "pricing": "paid", "keywords": ["images", "processing", "cdn"]},
        {"id": "mux", "name": "Mux", "description": "Video infrastructure API", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mux.com/", "pricing": "paid", "keywords": ["video", "streaming", "analytics"]},
        {"id": "bunny-stream", "name": "Bunny Stream", "description": "Video hosting and delivery", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.bunny.net/docs/stream-api", "pricing": "paid", "keywords": ["video", "streaming", "cdn"]},
        
        # Data & Analytics
        {"id": "plausible", "name": "Plausible Analytics", "description": "Privacy-friendly web analytics", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://plausible.io/docs/stats-api", "pricing": "paid", "keywords": ["analytics", "privacy", "web"]},
        {"id": "posthog", "name": "PostHog", "description": "Product analytics platform", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://posthog.com/docs/api", "pricing": "freemium", "keywords": ["analytics", "product", "events"]},
        {"id": "mixpanel", "name": "Mixpanel", "description": "Product analytics and engagement", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.mixpanel.com/", "pricing": "freemium", "keywords": ["analytics", "events", "funnels"]},
        {"id": "amplitude", "name": "Amplitude", "description": "Digital analytics platform", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.docs.developers.amplitude.com/", "pricing": "freemium", "keywords": ["analytics", "digital", "product"]},
        {"id": "segment", "name": "Segment", "description": "Customer data platform", "category": "Analytics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://segment.com/docs/connections/sources/catalog/libraries/server/", "pricing": "freemium", "keywords": ["cdp", "data", "tracking"]},
        
        # Search & Discovery
        {"id": "algolia", "name": "Algolia", "description": "Search and discovery platform", "category": "Search", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.algolia.com/doc/", "pricing": "freemium", "keywords": ["search", "discovery", "instant"]},
        {"id": "typesense", "name": "Typesense", "description": "Open source search engine", "category": "Search", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://typesense.org/docs/", "pricing": "freemium", "keywords": ["search", "open-source", "typo-tolerant"]},
        {"id": "meilisearch", "name": "Meilisearch", "description": "Lightning-fast search engine", "category": "Search", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.meilisearch.com/docs", "pricing": "freemium", "keywords": ["search", "fast", "open-source"]},
        {"id": "pinecone", "name": "Pinecone", "description": "Vector database for ML", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.pinecone.io/", "pricing": "freemium", "keywords": ["vector", "database", "ml", "embeddings"]},
        {"id": "weaviate", "name": "Weaviate", "description": "Vector search engine", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://weaviate.io/developers/weaviate", "pricing": "freemium", "keywords": ["vector", "search", "ml"]},
        {"id": "qdrant", "name": "Qdrant", "description": "Vector similarity search engine", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://qdrant.tech/documentation/", "pricing": "freemium", "keywords": ["vector", "search", "similarity"]},
        {"id": "chroma", "name": "Chroma", "description": "AI-native embedding database", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.trychroma.com/", "pricing": "freemium", "keywords": ["vector", "embeddings", "ai"]},
        
        # Automation & Integration
        {"id": "zapier-api", "name": "Zapier", "description": "Workflow automation platform", "category": "Automation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.zapier.com/docs/start", "pricing": "freemium", "keywords": ["automation", "integration", "workflow"]},
        {"id": "make-api", "name": "Make (Integromat)", "description": "Visual automation platform", "category": "Automation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.make.com/en/api-documentation", "pricing": "freemium", "keywords": ["automation", "integration", "visual"]},
        {"id": "n8n-api", "name": "n8n", "description": "Fair-code workflow automation", "category": "Automation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.n8n.io/api/", "pricing": "freemium", "keywords": ["automation", "workflow", "self-hosted"]},
        {"id": "pipedream", "name": "Pipedream", "description": "Developer-focused integration platform", "category": "Automation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://pipedream.com/docs/api/", "pricing": "freemium", "keywords": ["automation", "integration", "code"]},
        
        # More AI Tools
        {"id": "langchain", "name": "LangChain", "description": "LLM application framework", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://python.langchain.com/docs/", "pricing": "free", "keywords": ["ai", "llm", "framework", "agents"]},
        {"id": "llamaindex", "name": "LlamaIndex", "description": "Data framework for LLM apps", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.llamaindex.ai/", "pricing": "free", "keywords": ["ai", "llm", "rag", "data"]},
        {"id": "openrouter", "name": "OpenRouter", "description": "Unified API for LLMs", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://openrouter.ai/docs", "pricing": "paid", "keywords": ["ai", "llm", "unified", "routing"]},
        {"id": "fireworks-ai", "name": "Fireworks AI", "description": "Fast generative AI inference", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://readme.fireworks.ai/docs", "pricing": "freemium", "keywords": ["ai", "inference", "fast"]},
        {"id": "mistral-api", "name": "Mistral AI", "description": "Mistral language models API", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mistral.ai/", "pricing": "paid", "keywords": ["ai", "llm", "mistral"]},
        {"id": "anthropic-tools", "name": "Anthropic Tools", "description": "Tool use and function calling for Claude", "category": "Machine Learning", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.anthropic.com/claude/docs/tool-use", "pricing": "paid", "keywords": ["ai", "tools", "function-calling"]},
        {"id": "cursor-api", "name": "Cursor", "description": "AI code editor API", "category": "Development", "auth": "apiKey", "https": True, "cors": "unknown", "link": "https://cursor.sh/", "pricing": "freemium", "keywords": ["ai", "coding", "editor"]},
        {"id": "codeium", "name": "Codeium", "description": "Free AI code completion", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://codeium.com/", "pricing": "freemium", "keywords": ["ai", "coding", "completion"]},
        {"id": "tabnine", "name": "Tabnine", "description": "AI code assistant", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.tabnine.com/", "pricing": "freemium", "keywords": ["ai", "coding", "completion"]},
        
        # Crypto & Web3
        {"id": "coinbase-api", "name": "Coinbase", "description": "Cryptocurrency exchange API", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.cdp.coinbase.com/", "pricing": "freemium", "keywords": ["crypto", "exchange", "trading"]},
        {"id": "binance-api", "name": "Binance", "description": "Largest crypto exchange API", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://binance-docs.github.io/apidocs/", "pricing": "free", "keywords": ["crypto", "exchange", "trading"]},
        {"id": "kraken-api", "name": "Kraken", "description": "Crypto exchange and bank API", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.kraken.com/", "pricing": "freemium", "keywords": ["crypto", "exchange", "trading"]},
        {"id": "alchemy", "name": "Alchemy", "description": "Web3 development platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.alchemy.com/", "pricing": "freemium", "keywords": ["web3", "blockchain", "ethereum"]},
        {"id": "infura", "name": "Infura", "description": "Ethereum and IPFS APIs", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.infura.io/", "pricing": "freemium", "keywords": ["web3", "ethereum", "ipfs"]},
        {"id": "moralis", "name": "Moralis", "description": "Web3 data API", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.moralis.io/", "pricing": "freemium", "keywords": ["web3", "blockchain", "data"]},
        {"id": "thegraph", "name": "The Graph", "description": "Blockchain data indexing protocol", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://thegraph.com/docs/", "pricing": "freemium", "keywords": ["web3", "indexing", "graphql"]},
        
        # Security & Auth
        {"id": "auth0", "name": "Auth0", "description": "Identity platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://auth0.com/docs/api", "pricing": "freemium", "keywords": ["auth", "identity", "sso"]},
        {"id": "clerk", "name": "Clerk", "description": "User management and auth", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://clerk.com/docs/reference/backend-api", "pricing": "freemium", "keywords": ["auth", "users", "management"]},
        {"id": "workos", "name": "WorkOS", "description": "Enterprise-ready auth", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://workos.com/docs/reference", "pricing": "freemium", "keywords": ["auth", "sso", "enterprise"]},
        {"id": "stytch", "name": "Stytch", "description": "Passwordless auth platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://stytch.com/docs/api", "pricing": "freemium", "keywords": ["auth", "passwordless", "magic-link"]},
        {"id": "passage", "name": "Passage by 1Password", "description": "Passkey authentication", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.passage.id/", "pricing": "freemium", "keywords": ["auth", "passkeys", "biometric"]},
        {"id": "snyk", "name": "Snyk", "description": "Security vulnerability scanning", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://snyk.docs.apiary.io/", "pricing": "freemium", "keywords": ["security", "vulnerabilities", "scanning"]},
        {"id": "sonarcloud", "name": "SonarCloud", "description": "Code quality and security", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://sonarcloud.io/web_api", "pricing": "freemium", "keywords": ["code-quality", "security", "analysis"]},
        
        # Monitoring & Observability
        {"id": "sentry-api", "name": "Sentry", "description": "Error tracking and monitoring", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.sentry.io/api/", "pricing": "freemium", "keywords": ["errors", "monitoring", "debugging"]},
        {"id": "datadog-api", "name": "Datadog", "description": "Infrastructure monitoring", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.datadoghq.com/api/", "pricing": "paid", "keywords": ["monitoring", "metrics", "apm"]},
        {"id": "newrelic", "name": "New Relic", "description": "Full-stack observability", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.newrelic.com/docs/apis/intro-apis/", "pricing": "freemium", "keywords": ["monitoring", "apm", "observability"]},
        {"id": "grafana", "name": "Grafana Cloud", "description": "Observability platform", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://grafana.com/docs/grafana/latest/http_api/", "pricing": "freemium", "keywords": ["monitoring", "dashboards", "metrics"]},
        {"id": "pagerduty", "name": "PagerDuty", "description": "Incident management", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.pagerduty.com/docs/", "pricing": "paid", "keywords": ["incidents", "alerts", "oncall"]},
        {"id": "opsgenie", "name": "Opsgenie", "description": "Alert management", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.opsgenie.com/docs/api-overview", "pricing": "freemium", "keywords": ["alerts", "oncall", "management"]},
        {"id": "betteruptime", "name": "Better Uptime", "description": "Uptime monitoring", "category": "Development", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://betterstack.com/docs/uptime/api/", "pricing": "freemium", "keywords": ["uptime", "monitoring", "status"]},
    ]

def main():
    print(f"🦞 APIClaw Night Expansion - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Load current registry
    registry = load_registry()
    initial_count = len(registry.get('apis', []))
    print(f"📊 Current API count: {initial_count}")
    
    existing_ids = get_existing_ids(registry)
    print(f"📝 Existing unique IDs: {len(existing_ids)}")
    
    added = 0
    skipped = 0
    
    # Process APIs.guru
    print("\n🌐 Processing APIs.guru...")
    try:
        apisguru_data = fetch_apisguru()
        for provider, data in apisguru_data.items():
            api_entry = parse_apisguru_entry(provider, data)
            if api_entry and api_entry['id'].lower() not in existing_ids:
                registry['apis'].append(api_entry)
                existing_ids.add(api_entry['id'].lower())
                added += 1
            else:
                skipped += 1
        print(f"   ✅ APIs.guru: +{added} added, {skipped} skipped (duplicates)")
    except Exception as e:
        print(f"   ❌ APIs.guru error: {e}")
    
    # Add curated APIs
    print("\n📦 Adding curated APIs...")
    curated_added = 0
    curated_skipped = 0
    for api in generate_additional_apis():
        if api['id'].lower() not in existing_ids:
            registry['apis'].append(api)
            existing_ids.add(api['id'].lower())
            curated_added += 1
        else:
            curated_skipped += 1
    print(f"   ✅ Curated: +{curated_added} added, {curated_skipped} skipped")
    
    # Save updated registry
    save_registry(registry)
    
    final_count = len(registry.get('apis', []))
    total_added = final_count - initial_count
    
    print("\n" + "=" * 60)
    print(f"📈 RESULTS:")
    print(f"   Initial: {initial_count}")
    print(f"   Final:   {final_count}")
    print(f"   Added:   +{total_added}")
    print("=" * 60)
    
    return total_added

if __name__ == "__main__":
    added = main()
    print(f"\n✅ Expansion complete: +{added} APIs")
