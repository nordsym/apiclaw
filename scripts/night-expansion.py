#!/usr/bin/env python3
"""
APIClaw Night Expansion - Auto-fetch and add new APIs
Sources: apis.guru, Awesome APIs lists, OpenAPI directories
"""

import json
import re
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    """Generate clean ID from name"""
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def fetch_json(url: str, timeout: int = 30) -> dict:
    """Fetch JSON from URL"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'APIClaw/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None

def load_registry() -> dict:
    """Load existing registry"""
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry: dict):
    """Save registry"""
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

def get_existing_ids(registry: dict) -> set:
    """Get set of existing API IDs"""
    return {api['id'] for api in registry['apis']}

def parse_apis_guru(data: dict) -> list:
    """Parse apis.guru format into our registry format"""
    apis = []
    
    for provider, info in data.items():
        try:
            preferred = info.get('preferred', '')
            versions = info.get('versions', {})
            
            if not versions:
                continue
            
            version_info = versions.get(preferred, list(versions.values())[0])
            api_info = version_info.get('info', {})
            
            name = api_info.get('title', provider)
            description = api_info.get('description', '')[:500] if api_info.get('description') else f"API for {name}"
            
            # Extract category from x-apisguru-categories
            categories = api_info.get('x-apisguru-categories', [])
            category = categories[0].capitalize() if categories else 'API Services'
            
            # Clean category names
            category_map = {
                'financial': 'Finance',
                'cloud': 'Cloud Services', 
                'machine_learning': 'Machine Learning',
                'ecommerce': 'E-Commerce',
                'iot': 'IoT',
                'payment': 'Payments',
                'security': 'Security',
                'social': 'Social Media',
                'marketing': 'Marketing',
                'analytics': 'Analytics',
                'media': 'Media',
                'messaging': 'Communication',
                'location': 'Geocoding',
                'storage': 'Cloud Storage',
                'developer_tools': 'Development',
                'telecom': 'Communication',
                'text': 'Text Analysis',
                'energy': 'Utilities',
                'enterprise': 'Business',
                'backend': 'Backend Services',
                'open_data': 'Open Data',
                'search': 'Search',
                'entertainment': 'Entertainment',
                'email': 'Email',
                'hosting': 'Hosting',
                'collaboration': 'Collaboration',
                'support': 'Customer Support',
                'transport': 'Transportation'
            }
            category = category_map.get(category.lower(), category)
            
            # Get contact/link info
            contact = api_info.get('contact', {})
            link = contact.get('url', '')
            if not link:
                link = f"https://{provider}"
            
            # Determine auth type
            auth = 'apiKey'  # Most OpenAPI specs use API keys
            
            api_id = generate_id(name)
            
            apis.append({
                "id": api_id,
                "name": name,
                "description": description[:300],
                "category": category,
                "auth": auth,
                "https": True,
                "cors": "unknown",
                "link": link,
                "pricing": "unknown",
                "keywords": categories[:5] if categories else [],
                "source": "apis.guru"
            })
        except Exception as e:
            print(f"  Error parsing {provider}: {e}")
            continue
    
    return apis

def add_awesome_apis_batch() -> list:
    """Add curated APIs from Awesome APIs and other sources"""
    apis = [
        # DevOps & CI/CD
        {"name": "Jenkins API", "description": "Jenkins automation server REST API", "category": "Development", "link": "https://www.jenkins.io/doc/book/using/remote-access-api/", "auth": "apiKey"},
        {"name": "Terraform Cloud API", "description": "HashiCorp Terraform Cloud REST API", "category": "Development", "link": "https://developer.hashicorp.com/terraform/cloud-docs/api-docs", "auth": "apiKey"},
        {"name": "Ansible Tower API", "description": "Red Hat Ansible Automation Platform API", "category": "Development", "link": "https://docs.ansible.com/ansible-tower/latest/html/towerapi/", "auth": "apiKey"},
        {"name": "Pulumi API", "description": "Infrastructure as Code platform API", "category": "Development", "link": "https://www.pulumi.com/docs/reference/service-rest-api/", "auth": "apiKey"},
        
        # Database & Data
        {"name": "MongoDB Atlas API", "description": "Cloud database service management API", "category": "Databases", "link": "https://www.mongodb.com/docs/atlas/api/", "auth": "apiKey"},
        {"name": "Redis Cloud API", "description": "Redis Enterprise Cloud API", "category": "Databases", "link": "https://docs.redis.com/latest/rc/api/", "auth": "apiKey"},
        {"name": "Elastic Cloud API", "description": "Elasticsearch Service API", "category": "Databases", "link": "https://www.elastic.co/guide/en/cloud/current/ec-restful-api.html", "auth": "apiKey"},
        {"name": "Fauna API", "description": "Serverless database API", "category": "Databases", "link": "https://docs.fauna.com/fauna/current/reference/http/", "auth": "apiKey"},
        {"name": "PlanetScale API", "description": "MySQL-compatible serverless database", "category": "Databases", "link": "https://docs.planetscale.com/docs/concepts/planetscale-api-overview", "auth": "apiKey"},
        {"name": "Neon API", "description": "Serverless Postgres API", "category": "Databases", "link": "https://neon.tech/docs/introduction/about", "auth": "apiKey"},
        {"name": "Turso API", "description": "Edge SQLite database API", "category": "Databases", "link": "https://docs.turso.tech/reference/client-access", "auth": "apiKey"},
        
        # E-commerce
        {"name": "Shopify Storefront API", "description": "Build custom shopping experiences", "category": "E-Commerce", "link": "https://shopify.dev/docs/api/storefront", "auth": "OAuth"},
        {"name": "WooCommerce API", "description": "WordPress e-commerce REST API", "category": "E-Commerce", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "auth": "apiKey"},
        {"name": "BigCommerce API", "description": "E-commerce platform API", "category": "E-Commerce", "link": "https://developer.bigcommerce.com/docs/rest-catalog", "auth": "apiKey"},
        {"name": "Magento API", "description": "Adobe Commerce REST API", "category": "E-Commerce", "link": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html", "auth": "OAuth"},
        {"name": "Saleor API", "description": "Open-source e-commerce GraphQL API", "category": "E-Commerce", "link": "https://docs.saleor.io/docs/developer/api-conventions", "auth": "apiKey"},
        
        # Marketing & Analytics
        {"name": "HubSpot API", "description": "CRM and marketing automation API", "category": "Marketing", "link": "https://developers.hubspot.com/docs/api/overview", "auth": "OAuth"},
        {"name": "Mailchimp API", "description": "Email marketing platform API", "category": "Marketing", "link": "https://mailchimp.com/developer/marketing/api/", "auth": "apiKey"},
        {"name": "Mixpanel API", "description": "Product analytics API", "category": "Analytics", "link": "https://developer.mixpanel.com/reference/overview", "auth": "apiKey"},
        {"name": "Amplitude API", "description": "Product analytics platform API", "category": "Analytics", "link": "https://www.docs.developers.amplitude.com/", "auth": "apiKey"},
        {"name": "Segment API", "description": "Customer data platform API", "category": "Analytics", "link": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/", "auth": "apiKey"},
        {"name": "Plausible API", "description": "Privacy-friendly analytics API", "category": "Analytics", "link": "https://plausible.io/docs/stats-api", "auth": "apiKey"},
        {"name": "PostHog API", "description": "Open-source product analytics API", "category": "Analytics", "link": "https://posthog.com/docs/api", "auth": "apiKey"},
        
        # Communication & Messaging
        {"name": "Twilio API", "description": "Cloud communications platform", "category": "Communication", "link": "https://www.twilio.com/docs/usage/api", "auth": "apiKey"},
        {"name": "SendGrid API", "description": "Email delivery service API", "category": "Email", "link": "https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/authentication", "auth": "apiKey"},
        {"name": "Vonage API", "description": "Communication APIs (formerly Nexmo)", "category": "Communication", "link": "https://developer.vonage.com/en/api", "auth": "apiKey"},
        {"name": "Pusher API", "description": "Real-time messaging API", "category": "Communication", "link": "https://pusher.com/docs/channels/library_auth_reference/rest-api/", "auth": "apiKey"},
        {"name": "Ably API", "description": "Real-time messaging infrastructure", "category": "Communication", "link": "https://ably.com/docs/api", "auth": "apiKey"},
        {"name": "Stream API", "description": "Activity feeds and chat API", "category": "Communication", "link": "https://getstream.io/docs/rest/", "auth": "apiKey"},
        {"name": "Intercom API", "description": "Customer messaging platform API", "category": "Customer Support", "link": "https://developers.intercom.com/intercom-api-reference/reference", "auth": "apiKey"},
        {"name": "Zendesk API", "description": "Customer service platform API", "category": "Customer Support", "link": "https://developer.zendesk.com/api-reference/", "auth": "apiKey"},
        {"name": "Freshdesk API", "description": "Customer support software API", "category": "Customer Support", "link": "https://developers.freshdesk.com/api/", "auth": "apiKey"},
        
        # AI & Machine Learning
        {"name": "OpenAI API", "description": "GPT models and AI services", "category": "Machine Learning", "link": "https://platform.openai.com/docs/api-reference", "auth": "apiKey"},
        {"name": "Anthropic API", "description": "Claude AI assistant API", "category": "Machine Learning", "link": "https://docs.anthropic.com/claude/reference/getting-started-with-the-api", "auth": "apiKey"},
        {"name": "Cohere API", "description": "Enterprise AI platform API", "category": "Machine Learning", "link": "https://docs.cohere.com/reference/about", "auth": "apiKey"},
        {"name": "Replicate API", "description": "Run ML models in the cloud", "category": "Machine Learning", "link": "https://replicate.com/docs/reference/http", "auth": "apiKey"},
        {"name": "Hugging Face API", "description": "ML model inference API", "category": "Machine Learning", "link": "https://huggingface.co/docs/api-inference/index", "auth": "apiKey"},
        {"name": "Stability AI API", "description": "Image generation API", "category": "Machine Learning", "link": "https://platform.stability.ai/docs/api-reference", "auth": "apiKey"},
        {"name": "ElevenLabs API", "description": "AI voice synthesis API", "category": "Machine Learning", "link": "https://docs.elevenlabs.io/api-reference/text-to-speech", "auth": "apiKey"},
        {"name": "AssemblyAI API", "description": "Speech-to-text AI API", "category": "Machine Learning", "link": "https://www.assemblyai.com/docs/", "auth": "apiKey"},
        {"name": "Deepgram API", "description": "Speech recognition API", "category": "Machine Learning", "link": "https://developers.deepgram.com/docs/", "auth": "apiKey"},
        {"name": "Perplexity API", "description": "AI search and research API", "category": "Machine Learning", "link": "https://docs.perplexity.ai/", "auth": "apiKey"},
        
        # Cloud Platforms
        {"name": "Vercel API", "description": "Frontend deployment platform API", "category": "Cloud Services", "link": "https://vercel.com/docs/rest-api", "auth": "apiKey"},
        {"name": "Netlify API", "description": "Web deployment platform API", "category": "Cloud Services", "link": "https://docs.netlify.com/api/get-started/", "auth": "apiKey"},
        {"name": "Railway API", "description": "Infrastructure deployment platform", "category": "Cloud Services", "link": "https://docs.railway.app/reference/public-api", "auth": "apiKey"},
        {"name": "Render API", "description": "Cloud application platform API", "category": "Cloud Services", "link": "https://api-docs.render.com/reference/introduction", "auth": "apiKey"},
        {"name": "Fly.io API", "description": "Distributed application platform", "category": "Cloud Services", "link": "https://fly.io/docs/reference/machines/", "auth": "apiKey"},
        {"name": "Cloudflare API", "description": "CDN and security services API", "category": "Cloud Services", "link": "https://developers.cloudflare.com/api/", "auth": "apiKey"},
        {"name": "DigitalOcean API", "description": "Cloud infrastructure API", "category": "Cloud Services", "link": "https://docs.digitalocean.com/reference/api/", "auth": "apiKey"},
        {"name": "Linode API", "description": "Cloud computing services API", "category": "Cloud Services", "link": "https://www.linode.com/docs/api/", "auth": "apiKey"},
        {"name": "Vultr API", "description": "Cloud compute API", "category": "Cloud Services", "link": "https://www.vultr.com/api/", "auth": "apiKey"},
        {"name": "Hetzner Cloud API", "description": "European cloud platform API", "category": "Cloud Services", "link": "https://docs.hetzner.cloud/", "auth": "apiKey"},
        
        # Payments
        {"name": "Stripe API", "description": "Payment processing platform", "category": "Payments", "link": "https://stripe.com/docs/api", "auth": "apiKey"},
        {"name": "Square API", "description": "Payment and commerce platform", "category": "Payments", "link": "https://developer.squareup.com/reference/square", "auth": "OAuth"},
        {"name": "Braintree API", "description": "PayPal payment gateway API", "category": "Payments", "link": "https://developer.paypal.com/braintree/docs/start/overview", "auth": "apiKey"},
        {"name": "Adyen API", "description": "Global payments platform API", "category": "Payments", "link": "https://docs.adyen.com/api-explorer/", "auth": "apiKey"},
        {"name": "Paddle API", "description": "SaaS billing platform API", "category": "Payments", "link": "https://developer.paddle.com/api-reference/about-paddle-api/", "auth": "apiKey"},
        {"name": "Lemon Squeezy API", "description": "Digital product payments API", "category": "Payments", "link": "https://docs.lemonsqueezy.com/api", "auth": "apiKey"},
        {"name": "Wise API", "description": "International payments API", "category": "Payments", "link": "https://docs.wise.com/api-docs/", "auth": "apiKey"},
        {"name": "Plaid API", "description": "Financial data connectivity", "category": "Finance", "link": "https://plaid.com/docs/api/", "auth": "apiKey"},
        {"name": "Dwolla API", "description": "ACH payment platform API", "category": "Payments", "link": "https://developers.dwolla.com/docs", "auth": "apiKey"},
        
        # Crypto & Web3
        {"name": "Alchemy API", "description": "Web3 development platform", "category": "Blockchain", "link": "https://docs.alchemy.com/reference/api-overview", "auth": "apiKey"},
        {"name": "Infura API", "description": "Ethereum node API", "category": "Blockchain", "link": "https://docs.infura.io/infura/", "auth": "apiKey"},
        {"name": "Moralis API", "description": "Web3 data API", "category": "Blockchain", "link": "https://docs.moralis.io/web3-data-api/", "auth": "apiKey"},
        {"name": "QuickNode API", "description": "Blockchain infrastructure API", "category": "Blockchain", "link": "https://www.quicknode.com/docs/welcome", "auth": "apiKey"},
        {"name": "CoinGecko API", "description": "Cryptocurrency data API", "category": "Cryptocurrency", "link": "https://www.coingecko.com/en/api/documentation", "auth": "None"},
        {"name": "CoinMarketCap API", "description": "Crypto market data API", "category": "Cryptocurrency", "link": "https://coinmarketcap.com/api/documentation/v1/", "auth": "apiKey"},
        {"name": "Binance API", "description": "Cryptocurrency exchange API", "category": "Cryptocurrency", "link": "https://binance-docs.github.io/apidocs/", "auth": "apiKey"},
        {"name": "Coinbase API", "description": "Cryptocurrency platform API", "category": "Cryptocurrency", "link": "https://docs.cdp.coinbase.com/", "auth": "apiKey"},
        {"name": "Kraken API", "description": "Crypto exchange API", "category": "Cryptocurrency", "link": "https://docs.kraken.com/rest/", "auth": "apiKey"},
        
        # Media & Content
        {"name": "Cloudinary API", "description": "Media management platform", "category": "Media", "link": "https://cloudinary.com/documentation/image_transformations", "auth": "apiKey"},
        {"name": "Imgix API", "description": "Real-time image processing", "category": "Media", "link": "https://docs.imgix.com/apis/rendering", "auth": "apiKey"},
        {"name": "Mux API", "description": "Video infrastructure API", "category": "Media", "link": "https://docs.mux.com/api-reference", "auth": "apiKey"},
        {"name": "Bunny.net API", "description": "CDN and storage API", "category": "Media", "link": "https://docs.bunny.net/reference/bunnynet-api-overview", "auth": "apiKey"},
        {"name": "Uploadcare API", "description": "File handling API", "category": "Media", "link": "https://uploadcare.com/docs/start/", "auth": "apiKey"},
        
        # Authentication
        {"name": "Auth0 API", "description": "Identity platform API", "category": "Security", "link": "https://auth0.com/docs/api", "auth": "apiKey"},
        {"name": "Clerk API", "description": "User authentication API", "category": "Security", "link": "https://clerk.com/docs/reference/backend-api", "auth": "apiKey"},
        {"name": "Supabase Auth API", "description": "Authentication service API", "category": "Security", "link": "https://supabase.com/docs/reference/javascript/auth-api", "auth": "apiKey"},
        {"name": "Firebase Auth API", "description": "Google authentication API", "category": "Security", "link": "https://firebase.google.com/docs/reference/rest/auth", "auth": "apiKey"},
        {"name": "WorkOS API", "description": "Enterprise auth API", "category": "Security", "link": "https://workos.com/docs/reference", "auth": "apiKey"},
        {"name": "Stytch API", "description": "Passwordless auth API", "category": "Security", "link": "https://stytch.com/docs/api", "auth": "apiKey"},
        
        # Productivity
        {"name": "Notion API", "description": "Workspace and notes API", "category": "Productivity", "link": "https://developers.notion.com/reference/intro", "auth": "apiKey"},
        {"name": "Airtable API", "description": "Database/spreadsheet API", "category": "Productivity", "link": "https://airtable.com/developers/web/api/introduction", "auth": "apiKey"},
        {"name": "Linear API", "description": "Issue tracking API", "category": "Productivity", "link": "https://developers.linear.app/docs/graphql/working-with-the-graphql-api", "auth": "apiKey"},
        {"name": "Todoist API", "description": "Task management API", "category": "Productivity", "link": "https://developer.todoist.com/rest/v2/", "auth": "apiKey"},
        {"name": "ClickUp API", "description": "Project management API", "category": "Productivity", "link": "https://clickup.com/api", "auth": "apiKey"},
        {"name": "Monday.com API", "description": "Work management platform API", "category": "Productivity", "link": "https://developer.monday.com/api-reference/docs", "auth": "apiKey"},
        {"name": "Asana API", "description": "Project management API", "category": "Productivity", "link": "https://developers.asana.com/docs/asana", "auth": "apiKey"},
        
        # Social & Content Platforms
        {"name": "Discord API", "description": "Chat platform API", "category": "Social Media", "link": "https://discord.com/developers/docs/intro", "auth": "apiKey"},
        {"name": "Slack API", "description": "Workspace messaging API", "category": "Social Media", "link": "https://api.slack.com/", "auth": "OAuth"},
        {"name": "Twitter/X API", "description": "Social media platform API", "category": "Social Media", "link": "https://developer.twitter.com/en/docs", "auth": "OAuth"},
        {"name": "Meta Graph API", "description": "Facebook/Instagram API", "category": "Social Media", "link": "https://developers.facebook.com/docs/graph-api/", "auth": "OAuth"},
        {"name": "TikTok API", "description": "Short video platform API", "category": "Social Media", "link": "https://developers.tiktok.com/doc/overview", "auth": "OAuth"},
        {"name": "Reddit API", "description": "Social news platform API", "category": "Social Media", "link": "https://www.reddit.com/dev/api/", "auth": "OAuth"},
        {"name": "Mastodon API", "description": "Decentralized social API", "category": "Social Media", "link": "https://docs.joinmastodon.org/api/", "auth": "OAuth"},
        {"name": "Bluesky API", "description": "Decentralized social protocol", "category": "Social Media", "link": "https://docs.bsky.app/docs/api/", "auth": "apiKey"},
        
        # Geographic & Location
        {"name": "Mapbox API", "description": "Maps and location services", "category": "Geocoding", "link": "https://docs.mapbox.com/api/overview/", "auth": "apiKey"},
        {"name": "HERE API", "description": "Location platform services", "category": "Geocoding", "link": "https://developer.here.com/documentation", "auth": "apiKey"},
        {"name": "Geocod.io API", "description": "US/Canada geocoding API", "category": "Geocoding", "link": "https://www.geocod.io/docs/", "auth": "apiKey"},
        {"name": "OpenCage API", "description": "Forward/reverse geocoding", "category": "Geocoding", "link": "https://opencagedata.com/api", "auth": "apiKey"},
        {"name": "IPinfo API", "description": "IP geolocation API", "category": "Geocoding", "link": "https://ipinfo.io/developers", "auth": "apiKey"},
        {"name": "MaxMind GeoIP API", "description": "IP intelligence API", "category": "Geocoding", "link": "https://dev.maxmind.com/geoip/", "auth": "apiKey"},
        
        # Health & Fitness
        {"name": "Apple HealthKit API", "description": "Health data API for iOS", "category": "Health", "link": "https://developer.apple.com/documentation/healthkit", "auth": "OAuth"},
        {"name": "Google Fit API", "description": "Fitness tracking API", "category": "Health", "link": "https://developers.google.com/fit/rest/", "auth": "OAuth"},
        {"name": "Withings API", "description": "Health device data API", "category": "Health", "link": "https://developer.withings.com/api-reference", "auth": "OAuth"},
        {"name": "Peloton API", "description": "Connected fitness API", "category": "Health", "link": "https://github.com/philosowaffle/peloton-to-garmin", "auth": "apiKey"},
        
        # Food & Recipes
        {"name": "Edamam API", "description": "Nutrition and recipe API", "category": "Food & Drink", "link": "https://developer.edamam.com/", "auth": "apiKey"},
        {"name": "Spoonacular API", "description": "Food and recipe data API", "category": "Food & Drink", "link": "https://spoonacular.com/food-api/docs", "auth": "apiKey"},
        {"name": "Yummly API", "description": "Recipe search API", "category": "Food & Drink", "link": "https://developer.yummly.com/", "auth": "apiKey"},
        
        # News & Media
        {"name": "NewsAPI", "description": "News aggregation API", "category": "News", "link": "https://newsapi.org/docs", "auth": "apiKey"},
        {"name": "Guardian API", "description": "The Guardian news API", "category": "News", "link": "https://open-platform.theguardian.com/documentation/", "auth": "apiKey"},
        {"name": "NY Times API", "description": "New York Times content", "category": "News", "link": "https://developer.nytimes.com/apis", "auth": "apiKey"},
        {"name": "GNews API", "description": "Google News aggregator", "category": "News", "link": "https://gnews.io/docs/v4", "auth": "apiKey"},
        {"name": "Currents API", "description": "World news API", "category": "News", "link": "https://currentsapi.services/en/docs/", "auth": "apiKey"},
        
        # More AI/ML Services
        {"name": "Whisper API", "description": "OpenAI speech recognition", "category": "Machine Learning", "link": "https://platform.openai.com/docs/guides/speech-to-text", "auth": "apiKey"},
        {"name": "DALL-E API", "description": "OpenAI image generation", "category": "Machine Learning", "link": "https://platform.openai.com/docs/guides/images", "auth": "apiKey"},
        {"name": "Midjourney API", "description": "AI image generation", "category": "Machine Learning", "link": "https://docs.midjourney.com/", "auth": "apiKey"},
        {"name": "RunPod API", "description": "GPU cloud for AI", "category": "Machine Learning", "link": "https://docs.runpod.io/reference/overview", "auth": "apiKey"},
        {"name": "Modal API", "description": "Serverless GPU/ML platform", "category": "Machine Learning", "link": "https://modal.com/docs/reference", "auth": "apiKey"},
        {"name": "Together AI API", "description": "Open-source LLM hosting", "category": "Machine Learning", "link": "https://docs.together.ai/reference/inference", "auth": "apiKey"},
        {"name": "Groq API", "description": "Fast LLM inference API", "category": "Machine Learning", "link": "https://console.groq.com/docs/quickstart", "auth": "apiKey"},
        {"name": "Mistral API", "description": "Open-weight LLM API", "category": "Machine Learning", "link": "https://docs.mistral.ai/api/", "auth": "apiKey"},
        
        # Government & Public Data
        {"name": "Data.gov API", "description": "US Government open data", "category": "Government", "link": "https://api.data.gov/docs/", "auth": "apiKey"},
        {"name": "UK Parliament API", "description": "UK legislative data", "category": "Government", "link": "https://developer.parliament.uk/", "auth": "None"},
        {"name": "OpenFDA API", "description": "FDA public data API", "category": "Health", "link": "https://open.fda.gov/apis/", "auth": "None"},
        {"name": "SEC EDGAR API", "description": "US financial filings", "category": "Finance", "link": "https://www.sec.gov/search-filings/edgar-application-programming-interfaces", "auth": "None"},
        {"name": "FCC API", "description": "Federal Communications data", "category": "Government", "link": "https://www.fcc.gov/developers", "auth": "None"},
        {"name": "Census Bureau API", "description": "US demographic data", "category": "Government", "link": "https://www.census.gov/data/developers/data-sets.html", "auth": "apiKey"},
        
        # Finance & Trading
        {"name": "Alpha Vantage API", "description": "Stock market data API", "category": "Finance", "link": "https://www.alphavantage.co/documentation/", "auth": "apiKey"},
        {"name": "Polygon.io API", "description": "Financial market data", "category": "Finance", "link": "https://polygon.io/docs/", "auth": "apiKey"},
        {"name": "IEX Cloud API", "description": "Financial data platform", "category": "Finance", "link": "https://iexcloud.io/docs/", "auth": "apiKey"},
        {"name": "Yahoo Finance API", "description": "Stock quotes and data", "category": "Finance", "link": "https://www.yahoofinanceapi.com/", "auth": "apiKey"},
        {"name": "Finnhub API", "description": "Real-time stock API", "category": "Finance", "link": "https://finnhub.io/docs/api", "auth": "apiKey"},
        {"name": "Twelve Data API", "description": "Financial data API", "category": "Finance", "link": "https://twelvedata.com/docs", "auth": "apiKey"},
        {"name": "Tradier API", "description": "Brokerage trading API", "category": "Finance", "link": "https://documentation.tradier.com/", "auth": "apiKey"},
        {"name": "Interactive Brokers API", "description": "Trading platform API", "category": "Finance", "link": "https://interactivebrokers.github.io/cpwebapi/", "auth": "apiKey"},
        
        # More Services
        {"name": "Calendly API", "description": "Scheduling automation API", "category": "Productivity", "link": "https://developer.calendly.com/api-docs/", "auth": "apiKey"},
        {"name": "Cal.com API", "description": "Open-source scheduling API", "category": "Productivity", "link": "https://cal.com/docs/enterprise-features/api", "auth": "apiKey"},
        {"name": "Typeform API", "description": "Form builder API", "category": "Productivity", "link": "https://developer.typeform.com/", "auth": "apiKey"},
        {"name": "Tally API", "description": "Form creation API", "category": "Productivity", "link": "https://tally.so/help/webhooks", "auth": "apiKey"},
        {"name": "Jotform API", "description": "Online forms API", "category": "Productivity", "link": "https://api.jotform.com/docs/", "auth": "apiKey"},
        {"name": "DocuSign API", "description": "E-signature platform API", "category": "Business", "link": "https://developers.docusign.com/docs/esign-rest-api/", "auth": "OAuth"},
        {"name": "PandaDoc API", "description": "Document automation API", "category": "Business", "link": "https://developers.pandadoc.com/reference/about-pandadoc-api", "auth": "apiKey"},
        {"name": "HelloSign API", "description": "E-signature API (Dropbox)", "category": "Business", "link": "https://developers.hellosign.com/", "auth": "apiKey"},
        {"name": "Loom API", "description": "Video messaging API", "category": "Media", "link": "https://dev.loom.com/docs/", "auth": "apiKey"},
        {"name": "Descript API", "description": "Audio/video editing API", "category": "Media", "link": "https://api.descript.com/", "auth": "apiKey"},
        
        # Gaming & Entertainment
        {"name": "RAWG API", "description": "Video game database API", "category": "Games", "link": "https://rawg.io/apidocs", "auth": "apiKey"},
        {"name": "IGDB API", "description": "Internet Game Database API", "category": "Games", "link": "https://api-docs.igdb.com/", "auth": "apiKey"},
        {"name": "Giant Bomb API", "description": "Video game wiki API", "category": "Games", "link": "https://www.giantbomb.com/api/", "auth": "apiKey"},
        {"name": "Chess.com API", "description": "Chess platform API", "category": "Games", "link": "https://www.chess.com/news/view/published-data-api", "auth": "None"},
        {"name": "Lichess API", "description": "Open-source chess API", "category": "Games", "link": "https://lichess.org/api", "auth": "apiKey"},
        {"name": "Pokemon TCG API", "description": "Pokemon card game data", "category": "Games", "link": "https://pokemontcg.io/", "auth": "None"},
        {"name": "Magic: The Gathering API", "description": "MTG card database", "category": "Games", "link": "https://docs.magicthegathering.io/", "auth": "None"},
        
        # Email Services
        {"name": "Resend API", "description": "Email for developers", "category": "Email", "link": "https://resend.com/docs/api-reference/introduction", "auth": "apiKey"},
        {"name": "Postmark API", "description": "Transactional email API", "category": "Email", "link": "https://postmarkapp.com/developer", "auth": "apiKey"},
        {"name": "Mailgun API", "description": "Email delivery API", "category": "Email", "link": "https://documentation.mailgun.com/en/latest/api_reference.html", "auth": "apiKey"},
        {"name": "Amazon SES API", "description": "AWS email service", "category": "Email", "link": "https://docs.aws.amazon.com/ses/latest/APIReference/Welcome.html", "auth": "apiKey"},
        {"name": "SparkPost API", "description": "Email delivery platform", "category": "Email", "link": "https://developers.sparkpost.com/api/", "auth": "apiKey"},
        {"name": "Loops API", "description": "Email for SaaS", "category": "Email", "link": "https://loops.so/docs/api-reference/overview", "auth": "apiKey"},
        
        # Testing & QA
        {"name": "BrowserStack API", "description": "Cross-browser testing API", "category": "Development", "link": "https://www.browserstack.com/docs/automate/api-reference/selenium/introduction", "auth": "apiKey"},
        {"name": "Sauce Labs API", "description": "Testing platform API", "category": "Development", "link": "https://docs.saucelabs.com/dev/api/", "auth": "apiKey"},
        {"name": "LambdaTest API", "description": "Browser testing API", "category": "Development", "link": "https://www.lambdatest.com/support/api-doc/", "auth": "apiKey"},
        {"name": "Checkly API", "description": "Monitoring and testing API", "category": "Development", "link": "https://www.checklyhq.com/docs/cli/", "auth": "apiKey"},
        
        # Search
        {"name": "Algolia API", "description": "Search-as-a-service API", "category": "Search", "link": "https://www.algolia.com/doc/api-reference/api-methods/", "auth": "apiKey"},
        {"name": "Elasticsearch API", "description": "Search engine API", "category": "Search", "link": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html", "auth": "apiKey"},
        {"name": "Typesense API", "description": "Open-source search API", "category": "Search", "link": "https://typesense.org/docs/0.25.1/api/", "auth": "apiKey"},
        {"name": "Meilisearch API", "description": "Open-source search engine", "category": "Search", "link": "https://www.meilisearch.com/docs/reference/api/overview", "auth": "apiKey"},
        {"name": "Pinecone API", "description": "Vector database API", "category": "Search", "link": "https://docs.pinecone.io/reference/api/introduction", "auth": "apiKey"},
        {"name": "Weaviate API", "description": "Vector search engine", "category": "Search", "link": "https://weaviate.io/developers/weaviate/api", "auth": "apiKey"},
        {"name": "Qdrant API", "description": "Vector similarity search", "category": "Search", "link": "https://qdrant.tech/documentation/", "auth": "apiKey"},
        
        # Swedish/Nordic APIs
        {"name": "Swish API", "description": "Swedish mobile payments", "category": "Payments", "link": "https://developer.swish.nu/", "auth": "apiKey"},
        {"name": "BankID API", "description": "Swedish electronic ID", "category": "Security", "link": "https://www.bankid.com/utvecklare/rp-info", "auth": "apiKey"},
        {"name": "Klarna API", "description": "Buy now pay later API", "category": "Payments", "link": "https://docs.klarna.com/", "auth": "apiKey"},
        {"name": "Trafiklab API", "description": "Swedish transit data", "category": "Transportation", "link": "https://www.trafiklab.se/api", "auth": "apiKey"},
        {"name": "SMHI API", "description": "Swedish weather data", "category": "Weather", "link": "https://opendata.smhi.se/apidocs/", "auth": "None"},
        {"name": "SCB API", "description": "Swedish statistics", "category": "Government", "link": "https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/", "auth": "None"},
        {"name": "Postnord API", "description": "Nordic postal services", "category": "Transportation", "link": "https://developer.postnord.com/", "auth": "apiKey"},
        {"name": "Vipps API", "description": "Norwegian mobile payments", "category": "Payments", "link": "https://developer.vippsmobilepay.com/", "auth": "apiKey"},
    ]
    
    formatted = []
    for api in apis:
        formatted.append({
            "id": generate_id(api["name"]),
            "name": api["name"],
            "description": api["description"],
            "category": api.get("category", "API Services"),
            "auth": api.get("auth", "apiKey"),
            "https": True,
            "cors": "unknown",
            "link": api["link"],
            "pricing": "unknown",
            "keywords": [],
            "source": "curated"
        })
    
    return formatted


def main():
    print(f"🦞 APIClaw Night Expansion - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Load existing registry
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    initial_count = len(registry['apis'])
    print(f"📊 Current registry: {initial_count} APIs")
    
    added_count = 0
    
    # 1. Fetch from apis.guru
    print("\n📥 Fetching from apis.guru...")
    apis_guru_data = fetch_json("https://api.apis.guru/v2/list.json")
    if apis_guru_data:
        apis_guru_apis = parse_apis_guru(apis_guru_data)
        print(f"  Found {len(apis_guru_apis)} APIs from apis.guru")
        
        for api in apis_guru_apis:
            if api['id'] not in existing_ids:
                registry['apis'].append(api)
                existing_ids.add(api['id'])
                added_count += 1
        
        print(f"  Added {added_count} new APIs from apis.guru")
    
    # 2. Add curated APIs
    print("\n📥 Adding curated APIs from Awesome APIs lists...")
    curated_apis = add_awesome_apis_batch()
    curated_added = 0
    for api in curated_apis:
        if api['id'] not in existing_ids:
            registry['apis'].append(api)
            existing_ids.add(api['id'])
            curated_added += 1
    
    added_count += curated_added
    print(f"  Added {curated_added} new curated APIs")
    
    # Update registry metadata
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    
    # Save
    save_registry(registry)
    
    print("\n" + "=" * 60)
    print(f"✅ Expansion complete!")
    print(f"  Before: {initial_count}")
    print(f"  Added:  {added_count}")
    print(f"  Total:  {registry['count']}")
    
    return added_count


if __name__ == "__main__":
    added = main()
    print(f"\n🎯 Result: +{added} APIs added this run")
