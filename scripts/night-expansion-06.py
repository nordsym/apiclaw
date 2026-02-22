#!/usr/bin/env python3
"""
APIClaw Night Expansion - 06:00 batch
Target: Add 1000+ APIs from various sources
"""

import json
import urllib.request
import urllib.error
import ssl
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(data):
    data['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    data['count'] = len(data['apis'])
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved {data['count']} APIs to registry")

def get_existing_ids(data):
    return {api.get('id', '').lower() for api in data['apis']}

def make_id(name):
    return name.lower().replace(' ', '-').replace('/', '-').replace('.', '-')[:50]

def fetch_apis_guru():
    """Fetch from apis.guru OpenAPI directory"""
    print("Fetching apis.guru...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        req = urllib.request.Request(
            'https://api.apis.guru/v2/list.json',
            headers={'User-Agent': 'APIClaw/1.0'}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            data = json.loads(response.read().decode())
            apis = []
            for provider, info in data.items():
                preferred = info.get('preferred', '')
                versions = info.get('versions', {})
                if preferred and preferred in versions:
                    v = versions[preferred]
                    api_info = v.get('info', {})
                    cats = api_info.get('x-apisguru-categories', ['general'])
                    apis.append({
                        'id': make_id(provider),
                        'name': api_info.get('title', provider),
                        'description': api_info.get('description', '')[:200] if api_info.get('description') else f"API for {provider}",
                        'category': cats[0] if cats else 'general',
                        'auth': 'apiKey',
                        'https': True,
                        'cors': 'unknown',
                        'link': v.get('swaggerUrl', f'https://{provider}'),
                        'pricing': 'freemium',
                        'keywords': [provider.split('.')[0], cats[0] if cats else 'api']
                    })
            print(f"  Found {len(apis)} from apis.guru")
            return apis
    except Exception as e:
        print(f"  Error fetching apis.guru: {e}")
        return []

# Additional APIs to add - curated categories
ADDITIONAL_APIS = [
    # E-commerce APIs
    {"id": "shopify-admin", "name": "Shopify Admin API", "description": "Full access to Shopify store data including products, orders, customers", "category": "ecommerce", "auth": "OAuth", "https": True, "link": "https://shopify.dev/api/admin", "pricing": "paid", "keywords": ["ecommerce", "shopify", "store"]},
    {"id": "stripe-connect", "name": "Stripe Connect", "description": "Platform payments for marketplaces and SaaS", "category": "payments", "auth": "apiKey", "https": True, "link": "https://stripe.com/docs/connect", "pricing": "paid", "keywords": ["payments", "marketplace", "saas"]},
    {"id": "klarna-checkout", "name": "Klarna Checkout", "description": "Buy now pay later checkout integration", "category": "payments", "auth": "apiKey", "https": True, "link": "https://docs.klarna.com", "pricing": "paid", "keywords": ["payments", "bnpl", "checkout"]},
    {"id": "woocommerce-rest", "name": "WooCommerce REST API", "description": "WordPress ecommerce platform API", "category": "ecommerce", "auth": "OAuth", "https": True, "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "pricing": "free", "keywords": ["wordpress", "ecommerce", "store"]},
    {"id": "bigcommerce-api", "name": "BigCommerce API", "description": "Enterprise ecommerce platform", "category": "ecommerce", "auth": "OAuth", "https": True, "link": "https://developer.bigcommerce.com/api-docs", "pricing": "paid", "keywords": ["ecommerce", "enterprise", "store"]},
    
    # AI/ML APIs
    {"id": "anthropic-claude", "name": "Anthropic Claude API", "description": "Claude AI models for text generation and analysis", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.anthropic.com", "pricing": "paid", "keywords": ["ai", "llm", "claude"]},
    {"id": "mistral-ai", "name": "Mistral AI", "description": "Open-weight LLM models via API", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.mistral.ai", "pricing": "paid", "keywords": ["ai", "llm", "mistral"]},
    {"id": "cohere-api", "name": "Cohere API", "description": "NLP models for text understanding and generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.cohere.com", "pricing": "freemium", "keywords": ["ai", "nlp", "embeddings"]},
    {"id": "perplexity-api", "name": "Perplexity API", "description": "AI search and answer generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.perplexity.ai", "pricing": "paid", "keywords": ["ai", "search", "llm"]},
    {"id": "together-ai", "name": "Together AI", "description": "Run and fine-tune open-source LLMs", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.together.ai", "pricing": "paid", "keywords": ["ai", "llm", "finetuning"]},
    {"id": "groq-api", "name": "Groq API", "description": "Ultra-fast LLM inference", "category": "ai", "auth": "apiKey", "https": True, "link": "https://console.groq.com/docs", "pricing": "freemium", "keywords": ["ai", "llm", "fast"]},
    {"id": "fireworks-ai", "name": "Fireworks AI", "description": "Fast inference for open models", "category": "ai", "auth": "apiKey", "https": True, "link": "https://readme.fireworks.ai", "pricing": "paid", "keywords": ["ai", "llm", "inference"]},
    {"id": "runpod-api", "name": "RunPod API", "description": "GPU cloud for AI inference and training", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.runpod.io", "pricing": "paid", "keywords": ["ai", "gpu", "cloud"]},
    {"id": "huggingface-inference", "name": "HuggingFace Inference API", "description": "Access thousands of ML models", "category": "ai", "auth": "apiKey", "https": True, "link": "https://huggingface.co/docs/api-inference", "pricing": "freemium", "keywords": ["ai", "ml", "models"]},
    {"id": "stability-ai", "name": "Stability AI API", "description": "Stable Diffusion image generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://platform.stability.ai/docs", "pricing": "paid", "keywords": ["ai", "image", "stable-diffusion"]},
    
    # Developer Tools
    {"id": "github-graphql", "name": "GitHub GraphQL API", "description": "Flexible GitHub data queries", "category": "development", "auth": "OAuth", "https": True, "link": "https://docs.github.com/graphql", "pricing": "freemium", "keywords": ["github", "graphql", "git"]},
    {"id": "gitlab-api", "name": "GitLab API", "description": "GitLab project management and CI/CD", "category": "development", "auth": "OAuth", "https": True, "link": "https://docs.gitlab.com/ee/api/", "pricing": "freemium", "keywords": ["gitlab", "ci", "devops"]},
    {"id": "bitbucket-api", "name": "Bitbucket API", "description": "Atlassian Git repository management", "category": "development", "auth": "OAuth", "https": True, "link": "https://developer.atlassian.com/cloud/bitbucket/rest/", "pricing": "freemium", "keywords": ["git", "atlassian", "repository"]},
    {"id": "vercel-api", "name": "Vercel API", "description": "Deploy and manage serverless applications", "category": "development", "auth": "apiKey", "https": True, "link": "https://vercel.com/docs/rest-api", "pricing": "freemium", "keywords": ["serverless", "deploy", "frontend"]},
    {"id": "netlify-api", "name": "Netlify API", "description": "Web hosting and serverless functions", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.netlify.com/api/", "pricing": "freemium", "keywords": ["hosting", "serverless", "jamstack"]},
    {"id": "railway-api", "name": "Railway API", "description": "Deploy infrastructure instantly", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.railway.app/reference/public-api", "pricing": "freemium", "keywords": ["deploy", "infrastructure", "paas"]},
    {"id": "render-api", "name": "Render API", "description": "Cloud application hosting", "category": "development", "auth": "apiKey", "https": True, "link": "https://api-docs.render.com", "pricing": "freemium", "keywords": ["hosting", "cloud", "paas"]},
    {"id": "fly-io-api", "name": "Fly.io API", "description": "Run apps close to users globally", "category": "development", "auth": "apiKey", "https": True, "link": "https://fly.io/docs/machines/api/", "pricing": "freemium", "keywords": ["edge", "deploy", "containers"]},
    
    # Communication APIs
    {"id": "sendgrid-api", "name": "SendGrid API", "description": "Email delivery and marketing", "category": "communication", "auth": "apiKey", "https": True, "link": "https://docs.sendgrid.com", "pricing": "freemium", "keywords": ["email", "marketing", "transactional"]},
    {"id": "mailchimp-api", "name": "Mailchimp API", "description": "Email marketing platform", "category": "communication", "auth": "OAuth", "https": True, "link": "https://mailchimp.com/developer/", "pricing": "freemium", "keywords": ["email", "marketing", "newsletter"]},
    {"id": "postmark-api", "name": "Postmark API", "description": "Reliable transactional email", "category": "communication", "auth": "apiKey", "https": True, "link": "https://postmarkapp.com/developer", "pricing": "paid", "keywords": ["email", "transactional", "smtp"]},
    {"id": "mailgun-api", "name": "Mailgun API", "description": "Email API for developers", "category": "communication", "auth": "apiKey", "https": True, "link": "https://documentation.mailgun.com", "pricing": "freemium", "keywords": ["email", "smtp", "api"]},
    {"id": "messagebird-api", "name": "MessageBird API", "description": "Omnichannel communication platform", "category": "communication", "auth": "apiKey", "https": True, "link": "https://developers.messagebird.com", "pricing": "paid", "keywords": ["sms", "voice", "chat"]},
    {"id": "vonage-api", "name": "Vonage API (Nexmo)", "description": "Communications APIs for voice, SMS, video", "category": "communication", "auth": "apiKey", "https": True, "link": "https://developer.vonage.com", "pricing": "paid", "keywords": ["voice", "sms", "video"]},
    {"id": "plivo-api", "name": "Plivo API", "description": "Voice and SMS cloud communications", "category": "communication", "auth": "apiKey", "https": True, "link": "https://www.plivo.com/docs/", "pricing": "paid", "keywords": ["voice", "sms", "cloud"]},
    {"id": "telnyx-api", "name": "Telnyx API", "description": "Global communications platform", "category": "communication", "auth": "apiKey", "https": True, "link": "https://developers.telnyx.com", "pricing": "paid", "keywords": ["voice", "sms", "telephony"]},
    
    # Data & Analytics
    {"id": "mixpanel-api", "name": "Mixpanel API", "description": "Product analytics platform", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://developer.mixpanel.com", "pricing": "freemium", "keywords": ["analytics", "product", "events"]},
    {"id": "amplitude-api", "name": "Amplitude API", "description": "Digital analytics platform", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://developers.amplitude.com", "pricing": "freemium", "keywords": ["analytics", "product", "behavior"]},
    {"id": "segment-api", "name": "Segment API", "description": "Customer data platform", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://segment.com/docs/api/", "pricing": "freemium", "keywords": ["cdp", "data", "integration"]},
    {"id": "posthog-api", "name": "PostHog API", "description": "Open-source product analytics", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://posthog.com/docs/api", "pricing": "freemium", "keywords": ["analytics", "open-source", "product"]},
    {"id": "plausible-api", "name": "Plausible Analytics API", "description": "Privacy-friendly web analytics", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://plausible.io/docs", "pricing": "paid", "keywords": ["analytics", "privacy", "web"]},
    {"id": "heap-api", "name": "Heap API", "description": "Digital insights platform", "category": "analytics", "auth": "apiKey", "https": True, "link": "https://developers.heap.io", "pricing": "paid", "keywords": ["analytics", "autocapture", "insights"]},
    
    # Database/Storage APIs
    {"id": "supabase-api", "name": "Supabase API", "description": "Open-source Firebase alternative", "category": "database", "auth": "apiKey", "https": True, "link": "https://supabase.com/docs", "pricing": "freemium", "keywords": ["postgres", "realtime", "auth"]},
    {"id": "planetscale-api", "name": "PlanetScale API", "description": "Serverless MySQL platform", "category": "database", "auth": "apiKey", "https": True, "link": "https://docs.planetscale.com/reference/api", "pricing": "freemium", "keywords": ["mysql", "serverless", "scale"]},
    {"id": "neon-api", "name": "Neon API", "description": "Serverless Postgres", "category": "database", "auth": "apiKey", "https": True, "link": "https://neon.tech/docs/reference/api-reference", "pricing": "freemium", "keywords": ["postgres", "serverless", "branching"]},
    {"id": "upstash-api", "name": "Upstash API", "description": "Serverless Redis and Kafka", "category": "database", "auth": "apiKey", "https": True, "link": "https://docs.upstash.com", "pricing": "freemium", "keywords": ["redis", "kafka", "serverless"]},
    {"id": "fauna-api", "name": "Fauna API", "description": "Distributed document-relational database", "category": "database", "auth": "apiKey", "https": True, "link": "https://docs.fauna.com", "pricing": "freemium", "keywords": ["nosql", "distributed", "graphql"]},
    {"id": "cockroachdb-api", "name": "CockroachDB API", "description": "Distributed SQL database", "category": "database", "auth": "apiKey", "https": True, "link": "https://www.cockroachlabs.com/docs/", "pricing": "freemium", "keywords": ["sql", "distributed", "postgres"]},
    {"id": "turso-api", "name": "Turso API", "description": "Edge SQLite database", "category": "database", "auth": "apiKey", "https": True, "link": "https://docs.turso.tech", "pricing": "freemium", "keywords": ["sqlite", "edge", "libsql"]},
    {"id": "cloudflare-d1", "name": "Cloudflare D1 API", "description": "Serverless SQL on the edge", "category": "database", "auth": "apiKey", "https": True, "link": "https://developers.cloudflare.com/d1/", "pricing": "freemium", "keywords": ["sqlite", "edge", "cloudflare"]},
    {"id": "tigris-data", "name": "Tigris Data API", "description": "Globally distributed S3-compatible storage", "category": "storage", "auth": "apiKey", "https": True, "link": "https://www.tigrisdata.com/docs", "pricing": "freemium", "keywords": ["s3", "storage", "global"]},
    {"id": "r2-cloudflare", "name": "Cloudflare R2 API", "description": "Zero egress S3-compatible storage", "category": "storage", "auth": "apiKey", "https": True, "link": "https://developers.cloudflare.com/r2/", "pricing": "freemium", "keywords": ["s3", "storage", "cloudflare"]},
    
    # CRM/Sales APIs
    {"id": "hubspot-api", "name": "HubSpot API", "description": "CRM and marketing automation", "category": "crm", "auth": "OAuth", "https": True, "link": "https://developers.hubspot.com", "pricing": "freemium", "keywords": ["crm", "marketing", "sales"]},
    {"id": "salesforce-api", "name": "Salesforce API", "description": "Enterprise CRM platform", "category": "crm", "auth": "OAuth", "https": True, "link": "https://developer.salesforce.com", "pricing": "paid", "keywords": ["crm", "enterprise", "sales"]},
    {"id": "pipedrive-api", "name": "Pipedrive API", "description": "Sales CRM for small teams", "category": "crm", "auth": "apiKey", "https": True, "link": "https://developers.pipedrive.com", "pricing": "paid", "keywords": ["crm", "sales", "pipeline"]},
    {"id": "close-api", "name": "Close CRM API", "description": "Sales CRM for startups", "category": "crm", "auth": "apiKey", "https": True, "link": "https://developer.close.com", "pricing": "paid", "keywords": ["crm", "sales", "calling"]},
    {"id": "freshsales-api", "name": "Freshsales API", "description": "CRM by Freshworks", "category": "crm", "auth": "apiKey", "https": True, "link": "https://developers.freshworks.com/crm/", "pricing": "freemium", "keywords": ["crm", "freshworks", "sales"]},
    {"id": "zoho-crm-api", "name": "Zoho CRM API", "description": "Comprehensive CRM platform", "category": "crm", "auth": "OAuth", "https": True, "link": "https://www.zoho.com/crm/developer/docs/api/", "pricing": "freemium", "keywords": ["crm", "zoho", "sales"]},
    {"id": "copper-api", "name": "Copper CRM API", "description": "Google Workspace CRM", "category": "crm", "auth": "apiKey", "https": True, "link": "https://developer.copper.com", "pricing": "paid", "keywords": ["crm", "google", "workspace"]},
    
    # Automation/Integration APIs
    {"id": "zapier-api", "name": "Zapier API", "description": "Workflow automation platform", "category": "automation", "auth": "apiKey", "https": True, "link": "https://platform.zapier.com", "pricing": "freemium", "keywords": ["automation", "integration", "workflow"]},
    {"id": "make-api", "name": "Make (Integromat) API", "description": "Visual automation platform", "category": "automation", "auth": "apiKey", "https": True, "link": "https://www.make.com/en/api-documentation", "pricing": "freemium", "keywords": ["automation", "visual", "integration"]},
    {"id": "n8n-api", "name": "n8n API", "description": "Self-hostable workflow automation", "category": "automation", "auth": "apiKey", "https": True, "link": "https://docs.n8n.io/api/", "pricing": "freemium", "keywords": ["automation", "self-hosted", "workflow"]},
    {"id": "pipedream-api", "name": "Pipedream API", "description": "Serverless integration platform", "category": "automation", "auth": "apiKey", "https": True, "link": "https://pipedream.com/docs/api/", "pricing": "freemium", "keywords": ["serverless", "integration", "events"]},
    {"id": "tray-io-api", "name": "Tray.io API", "description": "Enterprise automation platform", "category": "automation", "auth": "apiKey", "https": True, "link": "https://tray.io/documentation", "pricing": "paid", "keywords": ["automation", "enterprise", "integration"]},
    {"id": "workato-api", "name": "Workato API", "description": "Enterprise integration and automation", "category": "automation", "auth": "OAuth", "https": True, "link": "https://docs.workato.com/api.html", "pricing": "paid", "keywords": ["enterprise", "automation", "integration"]},
    
    # Nordic/Swedish APIs
    {"id": "bankid-api", "name": "BankID API", "description": "Swedish electronic identification", "category": "identity", "auth": "certificate", "https": True, "link": "https://www.bankid.com/utvecklare/rp-info", "pricing": "paid", "keywords": ["sweden", "identity", "authentication"]},
    {"id": "swish-api", "name": "Swish API", "description": "Swedish mobile payment system", "category": "payments", "auth": "certificate", "https": True, "link": "https://developer.swish.nu", "pricing": "paid", "keywords": ["sweden", "payments", "mobile"]},
    {"id": "fortnox-api", "name": "Fortnox API", "description": "Swedish accounting software", "category": "finance", "auth": "OAuth", "https": True, "link": "https://developer.fortnox.se", "pricing": "paid", "keywords": ["sweden", "accounting", "erp"]},
    {"id": "visma-api", "name": "Visma API", "description": "Nordic business software", "category": "finance", "auth": "OAuth", "https": True, "link": "https://developer.visma.com", "pricing": "paid", "keywords": ["nordic", "accounting", "erp"]},
    {"id": "scb-api", "name": "SCB (Statistics Sweden) API", "description": "Swedish official statistics", "category": "government", "auth": "None", "https": True, "link": "https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/", "pricing": "free", "keywords": ["sweden", "statistics", "open-data"]},
    {"id": "skatteverket-api", "name": "Skatteverket API", "description": "Swedish Tax Agency services", "category": "government", "auth": "certificate", "https": True, "link": "https://www.skatteverket.se/foretagochorganisationer/etjansterprogram.4.15532c7b1442f256bae11b60.html", "pricing": "free", "keywords": ["sweden", "tax", "government"]},
    {"id": "trafikverket-api", "name": "Trafikverket API", "description": "Swedish transport data", "category": "transportation", "auth": "apiKey", "https": True, "link": "https://api.trafikinfo.trafikverket.se", "pricing": "free", "keywords": ["sweden", "traffic", "transport"]},
    {"id": "hitta-api", "name": "Hitta.se API", "description": "Swedish business directory", "category": "directory", "auth": "apiKey", "https": True, "link": "https://www.hitta.se/api/", "pricing": "paid", "keywords": ["sweden", "business", "directory"]},
    {"id": "postnord-api", "name": "PostNord API", "description": "Nordic postal and logistics", "category": "logistics", "auth": "apiKey", "https": True, "link": "https://developer.postnord.com", "pricing": "freemium", "keywords": ["nordic", "shipping", "tracking"]},
    {"id": "bring-api", "name": "Bring API", "description": "Nordic logistics services", "category": "logistics", "auth": "apiKey", "https": True, "link": "https://developer.bring.com", "pricing": "freemium", "keywords": ["norway", "logistics", "shipping"]},
    
    # Media/Content APIs
    {"id": "spotify-api", "name": "Spotify Web API", "description": "Music streaming data and playback", "category": "media", "auth": "OAuth", "https": True, "link": "https://developer.spotify.com/documentation/web-api/", "pricing": "freemium", "keywords": ["music", "streaming", "audio"]},
    {"id": "soundcloud-api", "name": "SoundCloud API", "description": "Audio platform for creators", "category": "media", "auth": "OAuth", "https": True, "link": "https://developers.soundcloud.com", "pricing": "freemium", "keywords": ["music", "audio", "streaming"]},
    {"id": "deezer-api", "name": "Deezer API", "description": "Music streaming service", "category": "media", "auth": "OAuth", "https": True, "link": "https://developers.deezer.com", "pricing": "freemium", "keywords": ["music", "streaming", "audio"]},
    {"id": "youtube-data-api", "name": "YouTube Data API", "description": "Access YouTube videos and channels", "category": "media", "auth": "apiKey", "https": True, "link": "https://developers.google.com/youtube/v3", "pricing": "freemium", "keywords": ["video", "youtube", "streaming"]},
    {"id": "vimeo-api", "name": "Vimeo API", "description": "Professional video hosting", "category": "media", "auth": "OAuth", "https": True, "link": "https://developer.vimeo.com", "pricing": "freemium", "keywords": ["video", "hosting", "professional"]},
    {"id": "cloudinary-api", "name": "Cloudinary API", "description": "Image and video management", "category": "media", "auth": "apiKey", "https": True, "link": "https://cloudinary.com/documentation/", "pricing": "freemium", "keywords": ["image", "video", "cdn"]},
    {"id": "imgix-api", "name": "imgix API", "description": "Real-time image processing", "category": "media", "auth": "apiKey", "https": True, "link": "https://docs.imgix.com", "pricing": "paid", "keywords": ["image", "cdn", "processing"]},
    {"id": "mux-api", "name": "Mux API", "description": "Video infrastructure platform", "category": "media", "auth": "apiKey", "https": True, "link": "https://docs.mux.com", "pricing": "paid", "keywords": ["video", "streaming", "infrastructure"]},
    
    # Social/Marketing APIs
    {"id": "twitter-api-v2", "name": "Twitter API v2", "description": "Twitter/X platform access", "category": "social", "auth": "OAuth", "https": True, "link": "https://developer.twitter.com/en/docs/twitter-api", "pricing": "freemium", "keywords": ["twitter", "social", "x"]},
    {"id": "linkedin-api", "name": "LinkedIn API", "description": "Professional network integration", "category": "social", "auth": "OAuth", "https": True, "link": "https://developer.linkedin.com", "pricing": "freemium", "keywords": ["linkedin", "professional", "social"]},
    {"id": "instagram-graph-api", "name": "Instagram Graph API", "description": "Instagram business account access", "category": "social", "auth": "OAuth", "https": True, "link": "https://developers.facebook.com/docs/instagram-api/", "pricing": "free", "keywords": ["instagram", "social", "meta"]},
    {"id": "tiktok-api", "name": "TikTok API", "description": "Short video platform integration", "category": "social", "auth": "OAuth", "https": True, "link": "https://developers.tiktok.com", "pricing": "freemium", "keywords": ["tiktok", "video", "social"]},
    {"id": "reddit-api", "name": "Reddit API", "description": "Reddit platform access", "category": "social", "auth": "OAuth", "https": True, "link": "https://www.reddit.com/dev/api/", "pricing": "freemium", "keywords": ["reddit", "social", "community"]},
    {"id": "discord-api", "name": "Discord API", "description": "Gaming chat platform", "category": "social", "auth": "OAuth", "https": True, "link": "https://discord.com/developers/docs", "pricing": "free", "keywords": ["discord", "chat", "gaming"]},
    {"id": "slack-api", "name": "Slack API", "description": "Business messaging platform", "category": "social", "auth": "OAuth", "https": True, "link": "https://api.slack.com", "pricing": "freemium", "keywords": ["slack", "messaging", "business"]},
    
    # Security APIs
    {"id": "auth0-api", "name": "Auth0 API", "description": "Identity and access management", "category": "security", "auth": "apiKey", "https": True, "link": "https://auth0.com/docs/api", "pricing": "freemium", "keywords": ["auth", "identity", "oauth"]},
    {"id": "clerk-api", "name": "Clerk API", "description": "User authentication for React", "category": "security", "auth": "apiKey", "https": True, "link": "https://clerk.com/docs/reference/backend-api", "pricing": "freemium", "keywords": ["auth", "react", "identity"]},
    {"id": "stytch-api", "name": "Stytch API", "description": "Passwordless authentication", "category": "security", "auth": "apiKey", "https": True, "link": "https://stytch.com/docs/api", "pricing": "freemium", "keywords": ["auth", "passwordless", "identity"]},
    {"id": "workos-api", "name": "WorkOS API", "description": "Enterprise identity features", "category": "security", "auth": "apiKey", "https": True, "link": "https://workos.com/docs/reference", "pricing": "freemium", "keywords": ["sso", "enterprise", "directory"]},
    {"id": "snyk-api", "name": "Snyk API", "description": "Security vulnerability scanning", "category": "security", "auth": "apiKey", "https": True, "link": "https://snyk.docs.apiary.io", "pricing": "freemium", "keywords": ["security", "vulnerabilities", "scanning"]},
    {"id": "1password-connect-api", "name": "1Password Connect API", "description": "Secret management for apps", "category": "security", "auth": "apiKey", "https": True, "link": "https://developer.1password.com/docs/connect/", "pricing": "paid", "keywords": ["secrets", "passwords", "vault"]},
    {"id": "hashicorp-vault-api", "name": "HashiCorp Vault API", "description": "Secrets management", "category": "security", "auth": "token", "https": True, "link": "https://developer.hashicorp.com/vault/api-docs", "pricing": "freemium", "keywords": ["secrets", "vault", "encryption"]},
    
    # Finance/Fintech APIs
    {"id": "plaid-api", "name": "Plaid API", "description": "Financial data aggregation", "category": "finance", "auth": "apiKey", "https": True, "link": "https://plaid.com/docs/", "pricing": "paid", "keywords": ["banking", "fintech", "accounts"]},
    {"id": "tink-api", "name": "Tink API", "description": "European open banking", "category": "finance", "auth": "OAuth", "https": True, "link": "https://docs.tink.com", "pricing": "paid", "keywords": ["banking", "open-banking", "europe"]},
    {"id": "wise-api", "name": "Wise API", "description": "International money transfers", "category": "finance", "auth": "apiKey", "https": True, "link": "https://api-docs.wise.com", "pricing": "paid", "keywords": ["payments", "transfers", "forex"]},
    {"id": "revolut-api", "name": "Revolut Business API", "description": "Business banking platform", "category": "finance", "auth": "OAuth", "https": True, "link": "https://developer.revolut.com", "pricing": "freemium", "keywords": ["banking", "payments", "business"]},
    {"id": "alpaca-api", "name": "Alpaca Trading API", "description": "Commission-free stock trading", "category": "finance", "auth": "apiKey", "https": True, "link": "https://alpaca.markets/docs/", "pricing": "freemium", "keywords": ["trading", "stocks", "fintech"]},
    {"id": "polygon-api", "name": "Polygon.io API", "description": "Stock market data", "category": "finance", "auth": "apiKey", "https": True, "link": "https://polygon.io/docs", "pricing": "freemium", "keywords": ["stocks", "market-data", "finance"]},
    {"id": "coingecko-api", "name": "CoinGecko API", "description": "Cryptocurrency data", "category": "finance", "auth": "None", "https": True, "link": "https://www.coingecko.com/api/documentation", "pricing": "freemium", "keywords": ["crypto", "market-data", "free"]},
    {"id": "coinmarketcap-api", "name": "CoinMarketCap API", "description": "Crypto market data", "category": "finance", "auth": "apiKey", "https": True, "link": "https://coinmarketcap.com/api/", "pricing": "freemium", "keywords": ["crypto", "market-data", "prices"]},
    
    # IoT/Hardware APIs
    {"id": "particle-api", "name": "Particle API", "description": "IoT device management", "category": "iot", "auth": "apiKey", "https": True, "link": "https://docs.particle.io/reference/device-cloud/api/", "pricing": "freemium", "keywords": ["iot", "hardware", "devices"]},
    {"id": "arduino-iot-api", "name": "Arduino IoT Cloud API", "description": "Arduino device management", "category": "iot", "auth": "OAuth", "https": True, "link": "https://www.arduino.cc/reference/en/iot/api/", "pricing": "freemium", "keywords": ["iot", "arduino", "hardware"]},
    {"id": "balena-api", "name": "Balena API", "description": "IoT fleet management", "category": "iot", "auth": "apiKey", "https": True, "link": "https://www.balena.io/docs/reference/api/overview/", "pricing": "freemium", "keywords": ["iot", "fleet", "containers"]},
    {"id": "tuya-api", "name": "Tuya API", "description": "Smart home IoT platform", "category": "iot", "auth": "apiKey", "https": True, "link": "https://developer.tuya.com/en/docs", "pricing": "freemium", "keywords": ["iot", "smart-home", "devices"]},
    {"id": "smartthings-api", "name": "SmartThings API", "description": "Samsung smart home platform", "category": "iot", "auth": "OAuth", "https": True, "link": "https://developer.smartthings.com", "pricing": "free", "keywords": ["iot", "smart-home", "samsung"]},
    {"id": "home-assistant-api", "name": "Home Assistant API", "description": "Open-source home automation", "category": "iot", "auth": "token", "https": True, "link": "https://developers.home-assistant.io/docs/api/rest/", "pricing": "free", "keywords": ["iot", "smart-home", "open-source"]},
    
    # Healthcare APIs
    {"id": "epic-fhir-api", "name": "Epic FHIR API", "description": "Healthcare data interoperability", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://fhir.epic.com", "pricing": "paid", "keywords": ["healthcare", "fhir", "ehr"]},
    {"id": "cerner-fhir-api", "name": "Cerner FHIR API", "description": "Electronic health records", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://fhir.cerner.com", "pricing": "paid", "keywords": ["healthcare", "fhir", "ehr"]},
    {"id": "human-api", "name": "Human API", "description": "Consumer health data", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://reference.humanapi.co", "pricing": "paid", "keywords": ["healthcare", "wearables", "data"]},
    {"id": "withings-api", "name": "Withings API", "description": "Health device data", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://developer.withings.com", "pricing": "free", "keywords": ["health", "wearables", "devices"]},
    {"id": "fitbit-api", "name": "Fitbit API", "description": "Fitness and health data", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://dev.fitbit.com", "pricing": "free", "keywords": ["fitness", "wearables", "health"]},
    {"id": "oura-api", "name": "Oura Ring API", "description": "Sleep and activity data", "category": "healthcare", "auth": "OAuth", "https": True, "link": "https://cloud.ouraring.com/docs/", "pricing": "free", "keywords": ["sleep", "wearables", "health"]},
    
    # More AI & ML APIs
    {"id": "openai-api", "name": "OpenAI API", "description": "GPT models and more", "category": "ai", "auth": "apiKey", "https": True, "link": "https://platform.openai.com/docs", "pricing": "paid", "keywords": ["ai", "gpt", "llm"]},
    {"id": "google-gemini-api", "name": "Google Gemini API", "description": "Google's multimodal AI", "category": "ai", "auth": "apiKey", "https": True, "link": "https://ai.google.dev/docs", "pricing": "freemium", "keywords": ["ai", "gemini", "multimodal"]},
    {"id": "aws-bedrock", "name": "AWS Bedrock", "description": "Managed foundation models", "category": "ai", "auth": "aws-sig", "https": True, "link": "https://docs.aws.amazon.com/bedrock/", "pricing": "paid", "keywords": ["ai", "aws", "llm"]},
    {"id": "azure-openai", "name": "Azure OpenAI Service", "description": "OpenAI models on Azure", "category": "ai", "auth": "apiKey", "https": True, "link": "https://learn.microsoft.com/azure/ai-services/openai/", "pricing": "paid", "keywords": ["ai", "azure", "openai"]},
    {"id": "deepl-api", "name": "DeepL API", "description": "Neural machine translation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://www.deepl.com/docs-api", "pricing": "freemium", "keywords": ["translation", "ai", "nlp"]},
    {"id": "assembly-ai", "name": "AssemblyAI", "description": "Speech-to-text and audio AI", "category": "ai", "auth": "apiKey", "https": True, "link": "https://www.assemblyai.com/docs", "pricing": "paid", "keywords": ["speech", "transcription", "ai"]},
    {"id": "deepgram-api", "name": "Deepgram API", "description": "Speech recognition platform", "category": "ai", "auth": "apiKey", "https": True, "link": "https://developers.deepgram.com", "pricing": "freemium", "keywords": ["speech", "transcription", "ai"]},
    {"id": "rev-ai-api", "name": "Rev.ai API", "description": "Speech recognition service", "category": "ai", "auth": "apiKey", "https": True, "link": "https://www.rev.ai/docs", "pricing": "paid", "keywords": ["speech", "transcription", "ai"]},
    {"id": "leonardo-ai", "name": "Leonardo.AI API", "description": "AI image generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.leonardo.ai", "pricing": "freemium", "keywords": ["image", "generation", "ai"]},
    {"id": "ideogram-api", "name": "Ideogram API", "description": "Text-in-image AI generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.ideogram.ai", "pricing": "paid", "keywords": ["image", "generation", "text"]},
    {"id": "flux-api", "name": "Flux (BFL) API", "description": "Black Forest Labs image models", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.bfl.ml", "pricing": "paid", "keywords": ["image", "flux", "generation"]},
    {"id": "luma-ai", "name": "Luma AI API", "description": "3D capture and video generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.lumalabs.ai", "pricing": "paid", "keywords": ["3d", "video", "ai"]},
    {"id": "runway-api", "name": "Runway API", "description": "AI video generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://docs.dev.runwayml.com", "pricing": "paid", "keywords": ["video", "generation", "ai"]},
    {"id": "pika-api", "name": "Pika API", "description": "AI video creation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://pika.art/developers", "pricing": "paid", "keywords": ["video", "generation", "ai"]},
    {"id": "suno-api", "name": "Suno API", "description": "AI music generation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://suno.com/developers", "pricing": "paid", "keywords": ["music", "generation", "ai"]},
    {"id": "udio-api", "name": "Udio API", "description": "AI music creation", "category": "ai", "auth": "apiKey", "https": True, "link": "https://www.udio.com/developers", "pricing": "paid", "keywords": ["music", "generation", "ai"]},
    
    # More Developer Tools
    {"id": "sentry-api", "name": "Sentry API", "description": "Error tracking and monitoring", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.sentry.io/api/", "pricing": "freemium", "keywords": ["errors", "monitoring", "debugging"]},
    {"id": "datadog-api", "name": "Datadog API", "description": "Observability platform", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.datadoghq.com/api/", "pricing": "paid", "keywords": ["monitoring", "observability", "apm"]},
    {"id": "newrelic-api", "name": "New Relic API", "description": "Application performance monitoring", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.newrelic.com/docs/apis/", "pricing": "freemium", "keywords": ["apm", "monitoring", "observability"]},
    {"id": "pagerduty-api", "name": "PagerDuty API", "description": "Incident management", "category": "development", "auth": "apiKey", "https": True, "link": "https://developer.pagerduty.com", "pricing": "freemium", "keywords": ["incidents", "oncall", "alerting"]},
    {"id": "opsgenie-api", "name": "Opsgenie API", "description": "Alerting and on-call management", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.opsgenie.com/docs/api-overview", "pricing": "freemium", "keywords": ["alerts", "oncall", "atlassian"]},
    {"id": "launchdarkly-api", "name": "LaunchDarkly API", "description": "Feature flag management", "category": "development", "auth": "apiKey", "https": True, "link": "https://apidocs.launchdarkly.com", "pricing": "paid", "keywords": ["feature-flags", "deployment", "testing"]},
    {"id": "split-api", "name": "Split API", "description": "Feature delivery platform", "category": "development", "auth": "apiKey", "https": True, "link": "https://help.split.io/hc/en-us/articles/360020093652-Admin-API", "pricing": "freemium", "keywords": ["feature-flags", "experimentation", "testing"]},
    {"id": "flagsmith-api", "name": "Flagsmith API", "description": "Open-source feature flags", "category": "development", "auth": "apiKey", "https": True, "link": "https://docs.flagsmith.com/clients/rest/", "pricing": "freemium", "keywords": ["feature-flags", "open-source", "remote-config"]},
    {"id": "linear-api", "name": "Linear API", "description": "Issue tracking for product teams", "category": "development", "auth": "apiKey", "https": True, "link": "https://developers.linear.app", "pricing": "freemium", "keywords": ["issues", "project", "product"]},
    {"id": "shortcut-api", "name": "Shortcut API", "description": "Project management for software teams", "category": "development", "auth": "apiKey", "https": True, "link": "https://shortcut.com/api/rest/v3", "pricing": "freemium", "keywords": ["project", "agile", "issues"]},
    {"id": "height-api", "name": "Height API", "description": "Autonomous project management", "category": "development", "auth": "apiKey", "https": True, "link": "https://height.notion.site/Height-API", "pricing": "freemium", "keywords": ["project", "tasks", "ai"]},
    
    # Additional Productivity APIs
    {"id": "notion-api", "name": "Notion API", "description": "All-in-one workspace", "category": "productivity", "auth": "OAuth", "https": True, "link": "https://developers.notion.com", "pricing": "freemium", "keywords": ["docs", "database", "workspace"]},
    {"id": "coda-api", "name": "Coda API", "description": "Flexible document platform", "category": "productivity", "auth": "apiKey", "https": True, "link": "https://coda.io/developers/apis/v1", "pricing": "freemium", "keywords": ["docs", "automation", "workspace"]},
    {"id": "airtable-api", "name": "Airtable API", "description": "Spreadsheet-database hybrid", "category": "productivity", "auth": "apiKey", "https": True, "link": "https://airtable.com/developers/web/api", "pricing": "freemium", "keywords": ["database", "spreadsheet", "nocode"]},
    {"id": "monday-api", "name": "Monday.com API", "description": "Work management platform", "category": "productivity", "auth": "apiKey", "https": True, "link": "https://developer.monday.com", "pricing": "freemium", "keywords": ["project", "work", "management"]},
    {"id": "asana-api", "name": "Asana API", "description": "Work management for teams", "category": "productivity", "auth": "OAuth", "https": True, "link": "https://developers.asana.com", "pricing": "freemium", "keywords": ["project", "tasks", "teams"]},
    {"id": "clickup-api", "name": "ClickUp API", "description": "All-in-one productivity", "category": "productivity", "auth": "apiKey", "https": True, "link": "https://clickup.com/api", "pricing": "freemium", "keywords": ["project", "tasks", "productivity"]},
    {"id": "todoist-api", "name": "Todoist API", "description": "Task management", "category": "productivity", "auth": "OAuth", "https": True, "link": "https://developer.todoist.com", "pricing": "freemium", "keywords": ["tasks", "todo", "personal"]},
    {"id": "trello-api", "name": "Trello API", "description": "Kanban-style project management", "category": "productivity", "auth": "apiKey", "https": True, "link": "https://developer.atlassian.com/cloud/trello/rest/", "pricing": "freemium", "keywords": ["kanban", "boards", "atlassian"]},
    {"id": "basecamp-api", "name": "Basecamp API", "description": "Project management and team communication", "category": "productivity", "auth": "OAuth", "https": True, "link": "https://github.com/basecamp/bc3-api", "pricing": "paid", "keywords": ["project", "communication", "teams"]},
    
    # Scheduling APIs
    {"id": "calendly-api", "name": "Calendly API", "description": "Scheduling automation", "category": "scheduling", "auth": "OAuth", "https": True, "link": "https://developer.calendly.com", "pricing": "freemium", "keywords": ["scheduling", "meetings", "calendar"]},
    {"id": "cal-com-api", "name": "Cal.com API", "description": "Open-source scheduling", "category": "scheduling", "auth": "apiKey", "https": True, "link": "https://cal.com/docs/api-reference", "pricing": "freemium", "keywords": ["scheduling", "open-source", "calendar"]},
    {"id": "acuity-api", "name": "Acuity Scheduling API", "description": "Appointment scheduling", "category": "scheduling", "auth": "OAuth", "https": True, "link": "https://developers.acuityscheduling.com", "pricing": "paid", "keywords": ["appointments", "scheduling", "booking"]},
    {"id": "google-calendar-api", "name": "Google Calendar API", "description": "Calendar management", "category": "scheduling", "auth": "OAuth", "https": True, "link": "https://developers.google.com/calendar", "pricing": "free", "keywords": ["calendar", "google", "events"]},
    {"id": "microsoft-graph-calendar", "name": "Microsoft Graph Calendar", "description": "Outlook calendar access", "category": "scheduling", "auth": "OAuth", "https": True, "link": "https://learn.microsoft.com/graph/api/resources/calendar", "pricing": "freemium", "keywords": ["calendar", "outlook", "microsoft"]},
    {"id": "nylas-api", "name": "Nylas API", "description": "Email and calendar integration", "category": "scheduling", "auth": "OAuth", "https": True, "link": "https://developer.nylas.com", "pricing": "freemium", "keywords": ["email", "calendar", "integration"]},
]

def add_cors_field(api):
    """Ensure cors field exists"""
    if 'cors' not in api:
        api['cors'] = 'unknown'
    return api

def main():
    print("=" * 60)
    print("APIClaw Night Expansion - 06:00 batch")
    print("=" * 60)
    
    # Load current registry
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    initial_count = len(registry['apis'])
    
    print(f"\nStarting count: {initial_count}")
    
    added_count = 0
    
    # 1. Fetch from apis.guru
    guru_apis = fetch_apis_guru()
    for api in guru_apis:
        api = add_cors_field(api)
        if api['id'].lower() not in existing_ids:
            registry['apis'].append(api)
            existing_ids.add(api['id'].lower())
            added_count += 1
    print(f"Added from apis.guru: {added_count}")
    
    # 2. Add curated APIs
    curated_added = 0
    for api in ADDITIONAL_APIS:
        api = add_cors_field(api)
        if api['id'].lower() not in existing_ids:
            registry['apis'].append(api)
            existing_ids.add(api['id'].lower())
            curated_added += 1
    print(f"Added curated APIs: {curated_added}")
    added_count += curated_added
    
    # Save registry
    save_registry(registry)
    
    final_count = len(registry['apis'])
    print(f"\n{'=' * 60}")
    print(f"SUMMARY")
    print(f"{'=' * 60}")
    print(f"Initial: {initial_count}")
    print(f"Added: {added_count}")
    print(f"Final: {final_count}")
    print(f"{'=' * 60}")
    
    return added_count

if __name__ == '__main__':
    added = main()
    print(f"\nDONE: +{added} APIs")
