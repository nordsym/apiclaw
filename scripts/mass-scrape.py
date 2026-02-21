#!/usr/bin/env python3
"""
APIClaw Mass API Scraper
Goal: Expand from 4,518 to 20,000+ APIs
Sources: APIs.guru, Public APIs GitHub, Postman Collections, manual curated lists
"""

import json
import requests
import hashlib
import re
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

REGISTRY_PATH = Path.home() / "Projects/apiclaw/src/registry/apis.json"
OUTPUT_PATH = Path.home() / "Projects/apiclaw/src/registry/apis_expanded.json"

# Track progress
stats = {
    "initial": 0,
    "added": 0,
    "duplicates": 0,
    "errors": 0
}

def load_existing():
    """Load existing APIs registry"""
    with open(REGISTRY_PATH) as f:
        data = json.load(f)
    stats["initial"] = data["count"]
    return data

def generate_id(name):
    """Generate a unique ID from name"""
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50] if clean else hashlib.md5(name.encode()).hexdigest()[:12]

def normalize_category(cat):
    """Normalize category names"""
    mappings = {
        "machine learning": "AI & Machine Learning",
        "artificial intelligence": "AI & Machine Learning",
        "ai": "AI & Machine Learning",
        "ml": "AI & Machine Learning",
        "nlp": "AI & Machine Learning",
        "finance": "Finance & Banking",
        "banking": "Finance & Banking",
        "fintech": "Finance & Banking",
        "payments": "Finance & Banking",
        "crypto": "Cryptocurrency",
        "blockchain": "Cryptocurrency",
        "weather": "Weather",
        "music": "Music & Audio",
        "audio": "Music & Audio",
        "video": "Video & Streaming",
        "streaming": "Video & Streaming",
        "social": "Social Media",
        "social media": "Social Media",
        "email": "Email & Messaging",
        "messaging": "Email & Messaging",
        "sms": "Email & Messaging",
        "communication": "Email & Messaging",
        "maps": "Maps & Geolocation",
        "geolocation": "Maps & Geolocation",
        "geo": "Maps & Geolocation",
        "location": "Maps & Geolocation",
        "ecommerce": "E-Commerce",
        "e-commerce": "E-Commerce",
        "shopping": "E-Commerce",
        "health": "Health & Fitness",
        "fitness": "Health & Fitness",
        "medical": "Health & Fitness",
        "sports": "Sports",
        "news": "News & Media",
        "media": "News & Media",
        "travel": "Travel & Transportation",
        "transportation": "Travel & Transportation",
        "food": "Food & Recipes",
        "recipes": "Food & Recipes",
        "games": "Games & Entertainment",
        "gaming": "Games & Entertainment",
        "entertainment": "Games & Entertainment",
        "security": "Security & Authentication",
        "authentication": "Security & Authentication",
        "auth": "Security & Authentication",
        "analytics": "Analytics & Data",
        "data": "Analytics & Data",
        "database": "Databases",
        "storage": "Storage & Files",
        "files": "Storage & Files",
        "cloud": "Cloud & Infrastructure",
        "infrastructure": "Cloud & Infrastructure",
        "devops": "DevOps & CI/CD",
        "ci/cd": "DevOps & CI/CD",
        "testing": "Testing & QA",
        "qa": "Testing & QA",
        "search": "Search",
        "images": "Images & Media",
        "photos": "Images & Media",
        "text": "Text & NLP",
        "translation": "Translation",
        "language": "Translation",
        "calendar": "Calendar & Scheduling",
        "scheduling": "Calendar & Scheduling",
        "iot": "IoT & Hardware",
        "hardware": "IoT & Hardware",
        "government": "Government & Open Data",
        "open data": "Government & Open Data",
        "education": "Education",
        "jobs": "Jobs & Careers",
        "careers": "Jobs & Careers",
        "real estate": "Real Estate",
        "property": "Real Estate",
        "automotive": "Automotive",
        "vehicles": "Automotive",
        "cars": "Automotive",
    }
    cat_lower = cat.lower().strip()
    return mappings.get(cat_lower, cat.title())

def extract_keywords(text):
    """Extract keywords from description"""
    if not text:
        return []
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'your', 'our', 'their', 'api', 'apis', 'service', 'services', 'data', 'get', 'set', 'use', 'used', 'using'}
    words = re.findall(r'\b[a-z]{3,15}\b', text.lower())
    keywords = [w for w in words if w not in stop_words]
    return list(set(keywords))[:10]

def fetch_apis_guru():
    """Fetch from APIs.guru OpenAPI directory"""
    print("📥 Fetching APIs.guru...")
    apis = []
    try:
        resp = requests.get("https://api.apis.guru/v2/list.json", timeout=30)
        data = resp.json()
        
        for provider, versions in data.items():
            try:
                # Get the preferred/latest version
                preferred = versions.get("preferred", list(versions["versions"].keys())[0])
                api_info = versions["versions"][preferred]
                info = api_info.get("info", {})
                
                name = info.get("title", provider)
                description = info.get("description", "")[:500] if info.get("description") else f"API from {provider}"
                
                # Clean HTML from description
                description = re.sub(r'<[^>]+>', '', description)
                description = re.sub(r'\s+', ' ', description).strip()[:300]
                
                category = "Uncategorized"
                if "x-apisguru-categories" in info:
                    cats = info["x-apisguru-categories"]
                    if cats:
                        category = normalize_category(cats[0])
                
                link = info.get("x-origin", [{}])[0].get("url", "") if info.get("x-origin") else ""
                if not link:
                    link = api_info.get("swaggerUrl", f"https://apis.guru/browse-apis/?search={provider}")
                
                apis.append({
                    "id": generate_id(name),
                    "name": name[:100],
                    "description": description or f"OpenAPI spec for {name}",
                    "category": category,
                    "auth": "apiKey" if "security" in str(api_info) else "unknown",
                    "https": True,
                    "cors": "unknown",
                    "link": link,
                    "pricing": "unknown",
                    "keywords": extract_keywords(description),
                    "source": "apis.guru"
                })
            except Exception as e:
                stats["errors"] += 1
                continue
                
        print(f"  ✓ APIs.guru: {len(apis)} APIs")
    except Exception as e:
        print(f"  ✗ APIs.guru error: {e}")
    
    return apis

def fetch_public_apis_github():
    """Fetch from public-apis GitHub repo (additional entries)"""
    print("📥 Fetching Public APIs GitHub...")
    apis = []
    try:
        # Try multiple mirrors/formats
        urls = [
            "https://raw.githubusercontent.com/public-apis/public-apis/master/apis.json",
            "https://api.publicapis.org/entries",
        ]
        
        for url in urls:
            try:
                resp = requests.get(url, timeout=30)
                if resp.status_code == 200:
                    data = resp.json()
                    entries = data.get("entries", data) if isinstance(data, dict) else data
                    
                    for entry in entries:
                        if isinstance(entry, dict):
                            name = entry.get("API", entry.get("name", ""))
                            if not name:
                                continue
                            
                            apis.append({
                                "id": generate_id(name),
                                "name": name,
                                "description": entry.get("Description", entry.get("description", "")),
                                "category": normalize_category(entry.get("Category", entry.get("category", "Uncategorized"))),
                                "auth": entry.get("Auth", entry.get("auth", "unknown")) or "None",
                                "https": entry.get("HTTPS", entry.get("https", True)),
                                "cors": entry.get("Cors", entry.get("cors", "unknown")),
                                "link": entry.get("Link", entry.get("link", "")),
                                "pricing": "unknown",
                                "keywords": extract_keywords(entry.get("Description", "")),
                                "source": "public-apis"
                            })
                    break
            except:
                continue
        
        print(f"  ✓ Public APIs: {len(apis)} APIs")
    except Exception as e:
        print(f"  ✗ Public APIs error: {e}")
    
    return apis

def generate_curated_apis():
    """Generate curated list of well-known APIs"""
    print("📥 Generating curated API list...")
    
    curated = [
        # AI & Machine Learning
        {"name": "OpenAI GPT-4", "description": "Advanced language model API for text generation, analysis, and conversation", "category": "AI & Machine Learning", "link": "https://platform.openai.com/docs/api-reference", "auth": "apiKey", "pricing": "paid"},
        {"name": "OpenAI DALL-E", "description": "AI image generation from text descriptions", "category": "AI & Machine Learning", "link": "https://platform.openai.com/docs/api-reference/images", "auth": "apiKey", "pricing": "paid"},
        {"name": "OpenAI Whisper", "description": "Speech-to-text transcription API", "category": "AI & Machine Learning", "link": "https://platform.openai.com/docs/api-reference/audio", "auth": "apiKey", "pricing": "paid"},
        {"name": "Anthropic Claude", "description": "Advanced AI assistant API for safe and helpful AI interactions", "category": "AI & Machine Learning", "link": "https://docs.anthropic.com/claude/reference", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Gemini", "description": "Google's multimodal AI model API", "category": "AI & Machine Learning", "link": "https://ai.google.dev/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Google Cloud Vision", "description": "Image analysis and recognition API", "category": "AI & Machine Learning", "link": "https://cloud.google.com/vision/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Natural Language", "description": "Text analysis and entity extraction", "category": "AI & Machine Learning", "link": "https://cloud.google.com/natural-language/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Speech-to-Text", "description": "Convert audio to text using machine learning", "category": "AI & Machine Learning", "link": "https://cloud.google.com/speech-to-text/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Text-to-Speech", "description": "Convert text to natural-sounding speech", "category": "AI & Machine Learning", "link": "https://cloud.google.com/text-to-speech/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS Bedrock", "description": "Access to foundation models including Claude, Llama, and Titan", "category": "AI & Machine Learning", "link": "https://docs.aws.amazon.com/bedrock/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS Comprehend", "description": "Natural language processing and text analytics", "category": "AI & Machine Learning", "link": "https://docs.aws.amazon.com/comprehend/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS Rekognition", "description": "Image and video analysis with deep learning", "category": "AI & Machine Learning", "link": "https://docs.aws.amazon.com/rekognition/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS Polly", "description": "Text-to-speech service with lifelike voices", "category": "AI & Machine Learning", "link": "https://docs.aws.amazon.com/polly/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS Transcribe", "description": "Automatic speech recognition service", "category": "AI & Machine Learning", "link": "https://docs.aws.amazon.com/transcribe/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Azure OpenAI Service", "description": "OpenAI models on Azure infrastructure", "category": "AI & Machine Learning", "link": "https://learn.microsoft.com/en-us/azure/ai-services/openai/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Azure Cognitive Services", "description": "Suite of AI APIs for vision, speech, language, and decision", "category": "AI & Machine Learning", "link": "https://azure.microsoft.com/en-us/products/cognitive-services/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Hugging Face Inference", "description": "Run ML models via simple API calls", "category": "AI & Machine Learning", "link": "https://huggingface.co/docs/api-inference/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Replicate", "description": "Run open-source machine learning models in the cloud", "category": "AI & Machine Learning", "link": "https://replicate.com/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Stability AI", "description": "Stable Diffusion and other generative AI models", "category": "AI & Machine Learning", "link": "https://platform.stability.ai/docs/api", "auth": "apiKey", "pricing": "paid"},
        {"name": "Cohere", "description": "Enterprise-grade NLP models for text understanding", "category": "AI & Machine Learning", "link": "https://docs.cohere.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Mistral AI", "description": "Open and portable generative AI models", "category": "AI & Machine Learning", "link": "https://docs.mistral.ai/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Perplexity AI", "description": "AI-powered search and answer engine API", "category": "AI & Machine Learning", "link": "https://docs.perplexity.ai/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Together AI", "description": "Run and fine-tune open-source LLMs", "category": "AI & Machine Learning", "link": "https://docs.together.ai/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Groq", "description": "Ultra-fast LLM inference API", "category": "AI & Machine Learning", "link": "https://console.groq.com/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Deepgram", "description": "Speech recognition and understanding API", "category": "AI & Machine Learning", "link": "https://developers.deepgram.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AssemblyAI", "description": "Speech-to-text and audio intelligence API", "category": "AI & Machine Learning", "link": "https://www.assemblyai.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "ElevenLabs", "description": "AI voice synthesis and cloning", "category": "AI & Machine Learning", "link": "https://elevenlabs.io/docs/api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Runway ML", "description": "Creative AI tools for video and image generation", "category": "AI & Machine Learning", "link": "https://docs.runwayml.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Midjourney", "description": "AI image generation service", "category": "AI & Machine Learning", "link": "https://docs.midjourney.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Leonardo AI", "description": "AI image generation with fine-tuning capabilities", "category": "AI & Machine Learning", "link": "https://docs.leonardo.ai/", "auth": "apiKey", "pricing": "freemium"},
        
        # Finance & Banking
        {"name": "Stripe", "description": "Payment processing and financial infrastructure", "category": "Finance & Banking", "link": "https://stripe.com/docs/api", "auth": "apiKey", "pricing": "paid"},
        {"name": "Stripe Connect", "description": "Marketplace and platform payments", "category": "Finance & Banking", "link": "https://stripe.com/docs/connect", "auth": "apiKey", "pricing": "paid"},
        {"name": "Stripe Billing", "description": "Subscription and recurring billing", "category": "Finance & Banking", "link": "https://stripe.com/docs/billing", "auth": "apiKey", "pricing": "paid"},
        {"name": "PayPal", "description": "Online payment system and money transfers", "category": "Finance & Banking", "link": "https://developer.paypal.com/docs/api/overview/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Square", "description": "Payment processing for businesses", "category": "Finance & Banking", "link": "https://developer.squareup.com/docs", "auth": "OAuth", "pricing": "paid"},
        {"name": "Plaid", "description": "Connect bank accounts and financial data", "category": "Finance & Banking", "link": "https://plaid.com/docs/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Braintree", "description": "Full-stack payment platform by PayPal", "category": "Finance & Banking", "link": "https://developer.paypal.com/braintree/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Adyen", "description": "Global payment platform for enterprises", "category": "Finance & Banking", "link": "https://docs.adyen.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Klarna", "description": "Buy now, pay later payment solutions", "category": "Finance & Banking", "link": "https://docs.klarna.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Wise (TransferWise)", "description": "International money transfers", "category": "Finance & Banking", "link": "https://api-docs.wise.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Revolut Business", "description": "Business banking and payments API", "category": "Finance & Banking", "link": "https://developer.revolut.com/docs/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Tink", "description": "Open banking data aggregation", "category": "Finance & Banking", "link": "https://docs.tink.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Yodlee", "description": "Financial data aggregation and analytics", "category": "Finance & Banking", "link": "https://developer.yodlee.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "MX", "description": "Financial data connectivity platform", "category": "Finance & Banking", "link": "https://docs.mx.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Finicity", "description": "Financial data and verification services", "category": "Finance & Banking", "link": "https://developer.finicity.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Alpha Vantage", "description": "Stock, forex, and crypto market data", "category": "Finance & Banking", "link": "https://www.alphavantage.co/documentation/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "IEX Cloud", "description": "Financial market data platform", "category": "Finance & Banking", "link": "https://iexcloud.io/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Polygon.io", "description": "Real-time and historical stock market data", "category": "Finance & Banking", "link": "https://polygon.io/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Yahoo Finance", "description": "Stock quotes and financial news", "category": "Finance & Banking", "link": "https://www.yahoofinanceapi.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Morningstar", "description": "Investment research and data", "category": "Finance & Banking", "link": "https://developer.morningstar.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Bloomberg", "description": "Financial data and analytics", "category": "Finance & Banking", "link": "https://www.bloomberg.com/professional/support/api-library/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Refinitiv", "description": "Financial market data and infrastructure", "category": "Finance & Banking", "link": "https://developers.refinitiv.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Quandl", "description": "Financial and economic datasets", "category": "Finance & Banking", "link": "https://docs.quandl.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Open Exchange Rates", "description": "Currency conversion and exchange rates", "category": "Finance & Banking", "link": "https://docs.openexchangerates.org/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "XE Currency", "description": "Currency conversion API", "category": "Finance & Banking", "link": "https://xecdapi.xe.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Currencycloud", "description": "B2B cross-border payments", "category": "Finance & Banking", "link": "https://developer.currencycloud.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "GoCardless", "description": "Direct debit and bank payment collection", "category": "Finance & Banking", "link": "https://developer.gocardless.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Dwolla", "description": "Bank transfers and payment processing", "category": "Finance & Banking", "link": "https://developers.dwolla.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Marqeta", "description": "Modern card issuing platform", "category": "Finance & Banking", "link": "https://www.marqeta.com/docs/developer-guides", "auth": "apiKey", "pricing": "paid"},
        {"name": "Galileo", "description": "Card issuing and digital banking", "category": "Finance & Banking", "link": "https://docs.galileo-ft.com/", "auth": "apiKey", "pricing": "paid"},
        
        # Cryptocurrency
        {"name": "Binance", "description": "Cryptocurrency exchange trading API", "category": "Cryptocurrency", "link": "https://binance-docs.github.io/apidocs/", "auth": "apiKey", "pricing": "free"},
        {"name": "Coinbase", "description": "Cryptocurrency trading and wallet API", "category": "Cryptocurrency", "link": "https://docs.cloud.coinbase.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Coinbase Pro", "description": "Advanced cryptocurrency trading", "category": "Cryptocurrency", "link": "https://docs.cloud.coinbase.com/exchange/", "auth": "apiKey", "pricing": "free"},
        {"name": "Kraken", "description": "Cryptocurrency exchange API", "category": "Cryptocurrency", "link": "https://docs.kraken.com/rest/", "auth": "apiKey", "pricing": "free"},
        {"name": "Bitfinex", "description": "Cryptocurrency trading platform API", "category": "Cryptocurrency", "link": "https://docs.bitfinex.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "FTX", "description": "Cryptocurrency derivatives exchange", "category": "Cryptocurrency", "link": "https://docs.ftx.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "KuCoin", "description": "Global cryptocurrency exchange", "category": "Cryptocurrency", "link": "https://docs.kucoin.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "Bybit", "description": "Crypto derivatives trading platform", "category": "Cryptocurrency", "link": "https://bybit-exchange.github.io/docs/", "auth": "apiKey", "pricing": "free"},
        {"name": "OKX", "description": "Cryptocurrency trading and Web3 API", "category": "Cryptocurrency", "link": "https://www.okx.com/docs-v5/", "auth": "apiKey", "pricing": "free"},
        {"name": "Gate.io", "description": "Cryptocurrency exchange and trading", "category": "Cryptocurrency", "link": "https://www.gate.io/docs/developers/apiv4/", "auth": "apiKey", "pricing": "free"},
        {"name": "Huobi", "description": "Global digital asset exchange", "category": "Cryptocurrency", "link": "https://huobiapi.github.io/docs/", "auth": "apiKey", "pricing": "free"},
        {"name": "CoinGecko", "description": "Cryptocurrency data aggregator", "category": "Cryptocurrency", "link": "https://www.coingecko.com/en/api/documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "CoinMarketCap", "description": "Cryptocurrency market data", "category": "Cryptocurrency", "link": "https://coinmarketcap.com/api/documentation/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Messari", "description": "Crypto market intelligence", "category": "Cryptocurrency", "link": "https://messari.io/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Etherscan", "description": "Ethereum blockchain explorer API", "category": "Cryptocurrency", "link": "https://docs.etherscan.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Alchemy", "description": "Web3 development platform", "category": "Cryptocurrency", "link": "https://docs.alchemy.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Infura", "description": "Ethereum and IPFS API access", "category": "Cryptocurrency", "link": "https://docs.infura.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "QuickNode", "description": "Blockchain node infrastructure", "category": "Cryptocurrency", "link": "https://www.quicknode.com/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Moralis", "description": "Web3 data and authentication", "category": "Cryptocurrency", "link": "https://docs.moralis.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "The Graph", "description": "Blockchain data indexing protocol", "category": "Cryptocurrency", "link": "https://thegraph.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Chainlink", "description": "Decentralized oracle network", "category": "Cryptocurrency", "link": "https://docs.chain.link/", "auth": "apiKey", "pricing": "paid"},
        {"name": "OpenSea", "description": "NFT marketplace API", "category": "Cryptocurrency", "link": "https://docs.opensea.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Rarible", "description": "NFT marketplace protocol", "category": "Cryptocurrency", "link": "https://docs.rarible.org/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Uniswap", "description": "Decentralized exchange protocol", "category": "Cryptocurrency", "link": "https://docs.uniswap.org/", "auth": "None", "pricing": "free"},
        {"name": "0x Protocol", "description": "DEX aggregator and liquidity API", "category": "Cryptocurrency", "link": "https://0x.org/docs/", "auth": "apiKey", "pricing": "freemium"},
        
        # E-Commerce
        {"name": "Shopify", "description": "E-commerce platform API", "category": "E-Commerce", "link": "https://shopify.dev/docs/api", "auth": "OAuth", "pricing": "paid"},
        {"name": "WooCommerce", "description": "WordPress e-commerce plugin API", "category": "E-Commerce", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "Magento", "description": "Enterprise e-commerce platform", "category": "E-Commerce", "link": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html", "auth": "OAuth", "pricing": "freemium"},
        {"name": "BigCommerce", "description": "E-commerce platform for growing brands", "category": "E-Commerce", "link": "https://developer.bigcommerce.com/docs", "auth": "OAuth", "pricing": "paid"},
        {"name": "Salesforce Commerce Cloud", "description": "Enterprise commerce platform", "category": "E-Commerce", "link": "https://developer.salesforce.com/docs/commerce", "auth": "OAuth", "pricing": "paid"},
        {"name": "Amazon Product Advertising", "description": "Amazon product data and affiliate links", "category": "E-Commerce", "link": "https://webservices.amazon.com/paapi5/documentation/", "auth": "apiKey", "pricing": "free"},
        {"name": "Amazon SP-API", "description": "Amazon Selling Partner API", "category": "E-Commerce", "link": "https://developer-docs.amazon.com/sp-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "eBay", "description": "Online marketplace API", "category": "E-Commerce", "link": "https://developer.ebay.com/docs", "auth": "OAuth", "pricing": "free"},
        {"name": "Etsy", "description": "Handmade and vintage marketplace", "category": "E-Commerce", "link": "https://developers.etsy.com/documentation/", "auth": "OAuth", "pricing": "free"},
        {"name": "Printful", "description": "Print-on-demand fulfillment", "category": "E-Commerce", "link": "https://developers.printful.com/docs/", "auth": "apiKey", "pricing": "free"},
        {"name": "Printify", "description": "Print-on-demand product creation", "category": "E-Commerce", "link": "https://developers.printify.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "ShipStation", "description": "Shipping and order fulfillment", "category": "E-Commerce", "link": "https://www.shipstation.com/docs/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Shippo", "description": "Multi-carrier shipping API", "category": "E-Commerce", "link": "https://goshippo.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "EasyPost", "description": "Shipping logistics API", "category": "E-Commerce", "link": "https://www.easypost.com/docs/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Aftership", "description": "Shipment tracking API", "category": "E-Commerce", "link": "https://developers.aftership.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Snipcart", "description": "Shopping cart for developers", "category": "E-Commerce", "link": "https://docs.snipcart.com/v3/api-reference/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Paddle", "description": "SaaS billing and payments", "category": "E-Commerce", "link": "https://developer.paddle.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Gumroad", "description": "Creator economy e-commerce", "category": "E-Commerce", "link": "https://app.gumroad.com/api", "auth": "OAuth", "pricing": "free"},
        {"name": "Lemon Squeezy", "description": "Digital product selling platform", "category": "E-Commerce", "link": "https://docs.lemonsqueezy.com/api", "auth": "apiKey", "pricing": "free"},
        
        # Communication & Messaging
        {"name": "Twilio", "description": "Cloud communications platform for SMS, voice, video", "category": "Email & Messaging", "link": "https://www.twilio.com/docs/usage/api", "auth": "apiKey", "pricing": "paid"},
        {"name": "Twilio SendGrid", "description": "Email delivery and marketing", "category": "Email & Messaging", "link": "https://docs.sendgrid.com/api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Mailgun", "description": "Email sending and validation", "category": "Email & Messaging", "link": "https://documentation.mailgun.com/en/latest/api_reference.html", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Mailchimp", "description": "Email marketing platform", "category": "Email & Messaging", "link": "https://mailchimp.com/developer/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Postmark", "description": "Transactional email service", "category": "Email & Messaging", "link": "https://postmarkapp.com/developer", "auth": "apiKey", "pricing": "paid"},
        {"name": "Amazon SES", "description": "Cloud email sending service", "category": "Email & Messaging", "link": "https://docs.aws.amazon.com/ses/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Resend", "description": "Email API for developers", "category": "Email & Messaging", "link": "https://resend.com/docs/api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Brevo (Sendinblue)", "description": "Email and marketing automation", "category": "Email & Messaging", "link": "https://developers.brevo.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Customer.io", "description": "Behavioral messaging platform", "category": "Email & Messaging", "link": "https://customer.io/docs/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Intercom", "description": "Customer messaging platform", "category": "Email & Messaging", "link": "https://developers.intercom.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Zendesk", "description": "Customer service platform", "category": "Email & Messaging", "link": "https://developer.zendesk.com/api-reference/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Freshdesk", "description": "Customer support software", "category": "Email & Messaging", "link": "https://developers.freshdesk.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Slack", "description": "Team communication platform", "category": "Email & Messaging", "link": "https://api.slack.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Discord", "description": "Community and gaming chat", "category": "Email & Messaging", "link": "https://discord.com/developers/docs", "auth": "OAuth", "pricing": "free"},
        {"name": "Telegram Bot", "description": "Messaging bot platform", "category": "Email & Messaging", "link": "https://core.telegram.org/bots/api", "auth": "apiKey", "pricing": "free"},
        {"name": "WhatsApp Business", "description": "Business messaging on WhatsApp", "category": "Email & Messaging", "link": "https://developers.facebook.com/docs/whatsapp", "auth": "apiKey", "pricing": "paid"},
        {"name": "MessageBird", "description": "Omnichannel communication platform", "category": "Email & Messaging", "link": "https://developers.messagebird.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Vonage (Nexmo)", "description": "Communications APIs for messaging and voice", "category": "Email & Messaging", "link": "https://developer.vonage.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Plivo", "description": "Cloud communications for voice and SMS", "category": "Email & Messaging", "link": "https://www.plivo.com/docs/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Telnyx", "description": "Communications platform for voice, messaging, and networking", "category": "Email & Messaging", "link": "https://developers.telnyx.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Stream Chat", "description": "In-app messaging infrastructure", "category": "Email & Messaging", "link": "https://getstream.io/chat/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Pusher", "description": "Real-time messaging infrastructure", "category": "Email & Messaging", "link": "https://pusher.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Ably", "description": "Real-time messaging and streaming", "category": "Email & Messaging", "link": "https://ably.com/docs/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PubNub", "description": "Real-time communication infrastructure", "category": "Email & Messaging", "link": "https://www.pubnub.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        
        # Social Media
        {"name": "Twitter/X API", "description": "Twitter data and posting API", "category": "Social Media", "link": "https://developer.twitter.com/en/docs", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Facebook Graph API", "description": "Facebook data and marketing", "category": "Social Media", "link": "https://developers.facebook.com/docs/graph-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Instagram Graph API", "description": "Instagram business account access", "category": "Social Media", "link": "https://developers.facebook.com/docs/instagram-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "LinkedIn Marketing", "description": "LinkedIn advertising and analytics", "category": "Social Media", "link": "https://learn.microsoft.com/en-us/linkedin/marketing/", "auth": "OAuth", "pricing": "free"},
        {"name": "TikTok for Business", "description": "TikTok marketing and ads", "category": "Social Media", "link": "https://developers.tiktok.com/", "auth": "OAuth", "pricing": "free"},
        {"name": "YouTube Data API", "description": "YouTube video and channel data", "category": "Social Media", "link": "https://developers.google.com/youtube/v3", "auth": "OAuth", "pricing": "free"},
        {"name": "Pinterest", "description": "Visual discovery platform API", "category": "Social Media", "link": "https://developers.pinterest.com/", "auth": "OAuth", "pricing": "free"},
        {"name": "Reddit", "description": "Social news aggregation API", "category": "Social Media", "link": "https://www.reddit.com/dev/api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Snapchat Marketing", "description": "Snapchat advertising API", "category": "Social Media", "link": "https://developers.snap.com/", "auth": "OAuth", "pricing": "free"},
        {"name": "Threads API", "description": "Meta's Threads platform", "category": "Social Media", "link": "https://developers.facebook.com/docs/threads", "auth": "OAuth", "pricing": "free"},
        {"name": "Mastodon", "description": "Decentralized social network", "category": "Social Media", "link": "https://docs.joinmastodon.org/api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Bluesky", "description": "Decentralized social protocol", "category": "Social Media", "link": "https://docs.bsky.app/", "auth": "apiKey", "pricing": "free"},
        
        # Maps & Geolocation
        {"name": "Google Maps Platform", "description": "Maps, routes, and places API", "category": "Maps & Geolocation", "link": "https://developers.google.com/maps", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Google Places", "description": "Place information and search", "category": "Maps & Geolocation", "link": "https://developers.google.com/maps/documentation/places", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Geocoding", "description": "Address to coordinates conversion", "category": "Maps & Geolocation", "link": "https://developers.google.com/maps/documentation/geocoding", "auth": "apiKey", "pricing": "paid"},
        {"name": "Mapbox", "description": "Maps and location services", "category": "Maps & Geolocation", "link": "https://docs.mapbox.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "HERE Maps", "description": "Location data and mapping", "category": "Maps & Geolocation", "link": "https://developer.here.com/documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "OpenStreetMap", "description": "Open source map data", "category": "Maps & Geolocation", "link": "https://wiki.openstreetmap.org/wiki/API", "auth": "None", "pricing": "free"},
        {"name": "TomTom", "description": "Maps and traffic data", "category": "Maps & Geolocation", "link": "https://developer.tomtom.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Foursquare", "description": "Location data and places API", "category": "Maps & Geolocation", "link": "https://location.foursquare.com/developer/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "What3Words", "description": "Location encoding system", "category": "Maps & Geolocation", "link": "https://developer.what3words.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "IPinfo", "description": "IP geolocation and data", "category": "Maps & Geolocation", "link": "https://ipinfo.io/developers", "auth": "apiKey", "pricing": "freemium"},
        {"name": "MaxMind GeoIP", "description": "IP geolocation database", "category": "Maps & Geolocation", "link": "https://dev.maxmind.com/geoip", "auth": "apiKey", "pricing": "freemium"},
        {"name": "IP-API", "description": "Free geolocation API", "category": "Maps & Geolocation", "link": "https://ip-api.com/docs", "auth": "None", "pricing": "freemium"},
        {"name": "Abstract IP Geolocation", "description": "IP to location lookup", "category": "Maps & Geolocation", "link": "https://www.abstractapi.com/api/ip-geolocation-api", "auth": "apiKey", "pricing": "freemium"},
        
        # Cloud & Infrastructure
        {"name": "AWS Lambda", "description": "Serverless compute service", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/lambda/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS S3", "description": "Object storage service", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/s3/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS EC2", "description": "Elastic compute cloud", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/ec2/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS DynamoDB", "description": "NoSQL database service", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/dynamodb/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS SQS", "description": "Message queuing service", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/sqs/", "auth": "apiKey", "pricing": "paid"},
        {"name": "AWS SNS", "description": "Push notification service", "category": "Cloud & Infrastructure", "link": "https://docs.aws.amazon.com/sns/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Functions", "description": "Serverless event-driven compute", "category": "Cloud & Infrastructure", "link": "https://cloud.google.com/functions/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Storage", "description": "Object storage on GCP", "category": "Cloud & Infrastructure", "link": "https://cloud.google.com/storage/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Cloud Run", "description": "Managed serverless containers", "category": "Cloud & Infrastructure", "link": "https://cloud.google.com/run/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google BigQuery", "description": "Data warehouse and analytics", "category": "Cloud & Infrastructure", "link": "https://cloud.google.com/bigquery/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Azure Functions", "description": "Serverless compute on Azure", "category": "Cloud & Infrastructure", "link": "https://learn.microsoft.com/en-us/azure/azure-functions/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Azure Blob Storage", "description": "Object storage on Azure", "category": "Cloud & Infrastructure", "link": "https://learn.microsoft.com/en-us/azure/storage/blobs/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Cloudflare Workers", "description": "Edge serverless compute", "category": "Cloud & Infrastructure", "link": "https://developers.cloudflare.com/workers/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Cloudflare R2", "description": "S3-compatible object storage", "category": "Cloud & Infrastructure", "link": "https://developers.cloudflare.com/r2/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Vercel", "description": "Frontend deployment platform", "category": "Cloud & Infrastructure", "link": "https://vercel.com/docs/rest-api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Netlify", "description": "Web deployment and hosting", "category": "Cloud & Infrastructure", "link": "https://docs.netlify.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Railway", "description": "Infrastructure deployment platform", "category": "Cloud & Infrastructure", "link": "https://docs.railway.app/reference/public-api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Render", "description": "Cloud application hosting", "category": "Cloud & Infrastructure", "link": "https://render.com/docs/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Fly.io", "description": "App deployment close to users", "category": "Cloud & Infrastructure", "link": "https://fly.io/docs/reference/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "DigitalOcean", "description": "Cloud infrastructure provider", "category": "Cloud & Infrastructure", "link": "https://docs.digitalocean.com/reference/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Linode", "description": "Cloud computing provider", "category": "Cloud & Infrastructure", "link": "https://www.linode.com/docs/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Vultr", "description": "Cloud compute and storage", "category": "Cloud & Infrastructure", "link": "https://www.vultr.com/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Heroku", "description": "Platform as a service", "category": "Cloud & Infrastructure", "link": "https://devcenter.heroku.com/articles/platform-api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Deno Deploy", "description": "Edge-native serverless", "category": "Cloud & Infrastructure", "link": "https://deno.com/deploy/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Supabase", "description": "Open source Firebase alternative", "category": "Cloud & Infrastructure", "link": "https://supabase.com/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Firebase", "description": "App development platform by Google", "category": "Cloud & Infrastructure", "link": "https://firebase.google.com/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PlanetScale", "description": "Serverless MySQL platform", "category": "Cloud & Infrastructure", "link": "https://planetscale.com/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Neon", "description": "Serverless Postgres", "category": "Cloud & Infrastructure", "link": "https://neon.tech/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Upstash", "description": "Serverless Redis and Kafka", "category": "Cloud & Infrastructure", "link": "https://upstash.com/docs/redis", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Convex", "description": "Backend application platform", "category": "Cloud & Infrastructure", "link": "https://docs.convex.dev/api", "auth": "apiKey", "pricing": "freemium"},
        
        # Developer Tools
        {"name": "GitHub", "description": "Code hosting and collaboration", "category": "Developer Tools", "link": "https://docs.github.com/en/rest", "auth": "OAuth", "pricing": "freemium"},
        {"name": "GitLab", "description": "DevOps platform", "category": "Developer Tools", "link": "https://docs.gitlab.com/ee/api/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Bitbucket", "description": "Git code management", "category": "Developer Tools", "link": "https://developer.atlassian.com/cloud/bitbucket/rest/intro/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Jira", "description": "Project management and issue tracking", "category": "Developer Tools", "link": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Confluence", "description": "Team documentation wiki", "category": "Developer Tools", "link": "https://developer.atlassian.com/cloud/confluence/rest/v1/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Linear", "description": "Project management for software teams", "category": "Developer Tools", "link": "https://developers.linear.app/docs", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Notion", "description": "Workspace and documentation", "category": "Developer Tools", "link": "https://developers.notion.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Airtable", "description": "Spreadsheet-database hybrid", "category": "Developer Tools", "link": "https://airtable.com/developers/web/api/introduction", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Trello", "description": "Kanban project management", "category": "Developer Tools", "link": "https://developer.atlassian.com/cloud/trello/rest/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Asana", "description": "Work management platform", "category": "Developer Tools", "link": "https://developers.asana.com/reference", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Monday.com", "description": "Work operating system", "category": "Developer Tools", "link": "https://developer.monday.com/api-reference/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "ClickUp", "description": "Productivity platform", "category": "Developer Tools", "link": "https://clickup.com/api/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Figma", "description": "Design and prototyping tool", "category": "Developer Tools", "link": "https://www.figma.com/developers/api", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Sentry", "description": "Error tracking and monitoring", "category": "Developer Tools", "link": "https://docs.sentry.io/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Datadog", "description": "Monitoring and security platform", "category": "Developer Tools", "link": "https://docs.datadoghq.com/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "New Relic", "description": "Application performance monitoring", "category": "Developer Tools", "link": "https://docs.newrelic.com/docs/apis/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PagerDuty", "description": "Incident management", "category": "Developer Tools", "link": "https://developer.pagerduty.com/api-reference/", "auth": "apiKey", "pricing": "paid"},
        {"name": "CircleCI", "description": "Continuous integration and delivery", "category": "Developer Tools", "link": "https://circleci.com/docs/api/v2/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Travis CI", "description": "Hosted CI service", "category": "Developer Tools", "link": "https://docs.travis-ci.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "GitHub Actions", "description": "CI/CD workflows on GitHub", "category": "Developer Tools", "link": "https://docs.github.com/en/rest/actions", "auth": "OAuth", "pricing": "freemium"},
        {"name": "npm", "description": "Node package registry", "category": "Developer Tools", "link": "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PyPI", "description": "Python package index", "category": "Developer Tools", "link": "https://warehouse.pypa.io/api-reference/", "auth": "None", "pricing": "free"},
        {"name": "Docker Hub", "description": "Container image registry", "category": "Developer Tools", "link": "https://docs.docker.com/docker-hub/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Terraform Cloud", "description": "Infrastructure as code platform", "category": "Developer Tools", "link": "https://developer.hashicorp.com/terraform/cloud-docs/api-docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "LaunchDarkly", "description": "Feature flag management", "category": "Developer Tools", "link": "https://apidocs.launchdarkly.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Segment", "description": "Customer data platform", "category": "Developer Tools", "link": "https://segment.com/docs/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Amplitude", "description": "Product analytics", "category": "Developer Tools", "link": "https://developers.amplitude.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Mixpanel", "description": "User analytics platform", "category": "Developer Tools", "link": "https://developer.mixpanel.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PostHog", "description": "Open source product analytics", "category": "Developer Tools", "link": "https://posthog.com/docs/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Hotjar", "description": "Behavior analytics and feedback", "category": "Developer Tools", "link": "https://help.hotjar.com/hc/en-us/articles/115011867568", "auth": "apiKey", "pricing": "freemium"},
        
        # CRM & Sales
        {"name": "Salesforce", "description": "Enterprise CRM platform", "category": "CRM & Sales", "link": "https://developer.salesforce.com/docs/apis", "auth": "OAuth", "pricing": "paid"},
        {"name": "HubSpot", "description": "CRM, marketing, and sales platform", "category": "CRM & Sales", "link": "https://developers.hubspot.com/docs/api/overview", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Pipedrive", "description": "Sales CRM and pipeline management", "category": "CRM & Sales", "link": "https://developers.pipedrive.com/docs/api/v1", "auth": "apiKey", "pricing": "paid"},
        {"name": "Zoho CRM", "description": "Customer relationship management", "category": "CRM & Sales", "link": "https://www.zoho.com/crm/developer/docs/api/v5/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Close", "description": "Sales CRM for startups", "category": "CRM & Sales", "link": "https://developer.close.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Copper", "description": "CRM for Google Workspace", "category": "CRM & Sales", "link": "https://developer.copper.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Freshsales", "description": "Sales CRM software", "category": "CRM & Sales", "link": "https://developers.freshsales.io/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Apollo.io", "description": "Sales intelligence and engagement", "category": "CRM & Sales", "link": "https://apolloio.github.io/apollo-api-docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Clearbit", "description": "B2B data enrichment", "category": "CRM & Sales", "link": "https://dashboard.clearbit.com/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "ZoomInfo", "description": "B2B contact database", "category": "CRM & Sales", "link": "https://api-docs.zoominfo.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "LinkedIn Sales Navigator", "description": "Sales prospecting tool", "category": "CRM & Sales", "link": "https://learn.microsoft.com/en-us/linkedin/sales/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Outreach", "description": "Sales engagement platform", "category": "CRM & Sales", "link": "https://api.outreach.io/api/v2/docs", "auth": "OAuth", "pricing": "paid"},
        {"name": "SalesLoft", "description": "Sales engagement and automation", "category": "CRM & Sales", "link": "https://developers.salesloft.com/api.html", "auth": "OAuth", "pricing": "paid"},
        {"name": "Gong", "description": "Revenue intelligence platform", "category": "CRM & Sales", "link": "https://gong.io/api/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Drift", "description": "Conversational marketing", "category": "CRM & Sales", "link": "https://devdocs.drift.com/docs", "auth": "OAuth", "pricing": "freemium"},
        
        # Search & Data
        {"name": "Algolia", "description": "Search and discovery API", "category": "Search", "link": "https://www.algolia.com/doc/rest-api/search/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Elasticsearch", "description": "Distributed search and analytics", "category": "Search", "link": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Meilisearch", "description": "Open source search engine", "category": "Search", "link": "https://www.meilisearch.com/docs/reference/api/overview", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Typesense", "description": "Fast, typo-tolerant search", "category": "Search", "link": "https://typesense.org/docs/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Pinecone", "description": "Vector database for AI", "category": "Search", "link": "https://docs.pinecone.io/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Weaviate", "description": "Vector search engine", "category": "Search", "link": "https://weaviate.io/developers/weaviate/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Qdrant", "description": "Vector similarity search", "category": "Search", "link": "https://qdrant.tech/documentation/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Chroma", "description": "AI-native embedding database", "category": "Search", "link": "https://docs.trychroma.com/", "auth": "None", "pricing": "free"},
        {"name": "SerpApi", "description": "Search engine results API", "category": "Search", "link": "https://serpapi.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Brave Search", "description": "Privacy-focused search API", "category": "Search", "link": "https://brave.com/search/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Bing Search", "description": "Microsoft's search API", "category": "Search", "link": "https://www.microsoft.com/en-us/bing/apis/bing-web-search-api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Google Custom Search", "description": "Programmable search engine", "category": "Search", "link": "https://developers.google.com/custom-search/v1/introduction", "auth": "apiKey", "pricing": "freemium"},
        
        # Media & Content
        {"name": "Cloudinary", "description": "Image and video management", "category": "Images & Media", "link": "https://cloudinary.com/documentation/cloudinary_sdks", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Imgix", "description": "Real-time image processing", "category": "Images & Media", "link": "https://docs.imgix.com/apis", "auth": "apiKey", "pricing": "paid"},
        {"name": "ImageKit", "description": "Image CDN and optimization", "category": "Images & Media", "link": "https://docs.imagekit.io/api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Uploadcare", "description": "File upload and delivery", "category": "Images & Media", "link": "https://uploadcare.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Filestack", "description": "File upload and transformation", "category": "Images & Media", "link": "https://www.filestack.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Remove.bg", "description": "Remove image backgrounds", "category": "Images & Media", "link": "https://www.remove.bg/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "TinyPNG", "description": "Image compression API", "category": "Images & Media", "link": "https://tinypng.com/developers/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Unsplash", "description": "Free high-resolution photos", "category": "Images & Media", "link": "https://unsplash.com/documentation", "auth": "apiKey", "pricing": "free"},
        {"name": "Pexels", "description": "Free stock photos and videos", "category": "Images & Media", "link": "https://www.pexels.com/api/documentation/", "auth": "apiKey", "pricing": "free"},
        {"name": "Giphy", "description": "GIF search and sharing", "category": "Images & Media", "link": "https://developers.giphy.com/docs/api/", "auth": "apiKey", "pricing": "free"},
        {"name": "Mux", "description": "Video streaming infrastructure", "category": "Video & Streaming", "link": "https://docs.mux.com/api-reference", "auth": "apiKey", "pricing": "paid"},
        {"name": "api.video", "description": "Video hosting and streaming", "category": "Video & Streaming", "link": "https://docs.api.video/reference/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Cloudflare Stream", "description": "Video streaming at scale", "category": "Video & Streaming", "link": "https://developers.cloudflare.com/stream/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Vimeo", "description": "Video hosting platform", "category": "Video & Streaming", "link": "https://developer.vimeo.com/api/reference", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Wistia", "description": "Video marketing platform", "category": "Video & Streaming", "link": "https://wistia.com/support/developers", "auth": "apiKey", "pricing": "freemium"},
        {"name": "JW Player", "description": "Video player and hosting", "category": "Video & Streaming", "link": "https://developer.jwplayer.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Brightcove", "description": "Video technology platform", "category": "Video & Streaming", "link": "https://apis.support.brightcove.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Spotify", "description": "Music streaming platform", "category": "Music & Audio", "link": "https://developer.spotify.com/documentation/web-api", "auth": "OAuth", "pricing": "free"},
        {"name": "SoundCloud", "description": "Audio platform and sharing", "category": "Music & Audio", "link": "https://developers.soundcloud.com/docs/api/reference", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Deezer", "description": "Music streaming service", "category": "Music & Audio", "link": "https://developers.deezer.com/api", "auth": "OAuth", "pricing": "free"},
        {"name": "Last.fm", "description": "Music discovery and scrobbling", "category": "Music & Audio", "link": "https://www.last.fm/api", "auth": "apiKey", "pricing": "free"},
        {"name": "Genius", "description": "Song lyrics and annotations", "category": "Music & Audio", "link": "https://docs.genius.com/", "auth": "OAuth", "pricing": "free"},
        {"name": "Shazam", "description": "Music recognition", "category": "Music & Audio", "link": "https://rapidapi.com/apidojo/api/shazam/", "auth": "apiKey", "pricing": "freemium"},
        
        # Auth & Security  
        {"name": "Auth0", "description": "Identity and authentication platform", "category": "Security & Authentication", "link": "https://auth0.com/docs/api", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Okta", "description": "Enterprise identity management", "category": "Security & Authentication", "link": "https://developer.okta.com/docs/reference/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Clerk", "description": "User authentication for developers", "category": "Security & Authentication", "link": "https://clerk.com/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Supabase Auth", "description": "Authentication service", "category": "Security & Authentication", "link": "https://supabase.com/docs/reference/javascript/auth-signup", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Firebase Auth", "description": "User authentication by Google", "category": "Security & Authentication", "link": "https://firebase.google.com/docs/auth", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AWS Cognito", "description": "User identity and access management", "category": "Security & Authentication", "link": "https://docs.aws.amazon.com/cognito/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Stytch", "description": "Passwordless authentication", "category": "Security & Authentication", "link": "https://stytch.com/docs/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "WorkOS", "description": "Enterprise SSO and directory sync", "category": "Security & Authentication", "link": "https://workos.com/docs/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "FusionAuth", "description": "Authentication for developers", "category": "Security & Authentication", "link": "https://fusionauth.io/docs/apis/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Keycloak", "description": "Open source identity management", "category": "Security & Authentication", "link": "https://www.keycloak.org/docs/latest/server_development/", "auth": "OAuth", "pricing": "free"},
        {"name": "OneLogin", "description": "Identity access management", "category": "Security & Authentication", "link": "https://developers.onelogin.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "1Password Connect", "description": "Secrets management API", "category": "Security & Authentication", "link": "https://developer.1password.com/docs/connect/", "auth": "apiKey", "pricing": "paid"},
        {"name": "HashiCorp Vault", "description": "Secrets management", "category": "Security & Authentication", "link": "https://developer.hashicorp.com/vault/api-docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Doppler", "description": "Secrets management platform", "category": "Security & Authentication", "link": "https://docs.doppler.com/reference/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "reCAPTCHA", "description": "Bot protection by Google", "category": "Security & Authentication", "link": "https://developers.google.com/recaptcha/docs/v3", "auth": "apiKey", "pricing": "freemium"},
        {"name": "hCaptcha", "description": "Bot protection alternative", "category": "Security & Authentication", "link": "https://docs.hcaptcha.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Turnstile", "description": "Cloudflare's CAPTCHA alternative", "category": "Security & Authentication", "link": "https://developers.cloudflare.com/turnstile/", "auth": "apiKey", "pricing": "free"},
        {"name": "Have I Been Pwned", "description": "Data breach checking", "category": "Security & Authentication", "link": "https://haveibeenpwned.com/API/v3", "auth": "apiKey", "pricing": "freemium"},
        
        # Weather & Environment
        {"name": "OpenWeatherMap", "description": "Weather data and forecasts", "category": "Weather", "link": "https://openweathermap.org/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Weather API", "description": "Real-time weather data", "category": "Weather", "link": "https://www.weatherapi.com/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Tomorrow.io", "description": "Weather intelligence platform", "category": "Weather", "link": "https://docs.tomorrow.io/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AccuWeather", "description": "Weather forecasting service", "category": "Weather", "link": "https://developer.accuweather.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Visual Crossing", "description": "Weather data and history", "category": "Weather", "link": "https://www.visualcrossing.com/resources/documentation/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Meteomatics", "description": "Weather data platform", "category": "Weather", "link": "https://www.meteomatics.com/en/api/overview/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Stormglass", "description": "Marine weather data", "category": "Weather", "link": "https://docs.stormglass.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AirVisual", "description": "Air quality data", "category": "Weather", "link": "https://api-docs.iqair.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "OpenAQ", "description": "Open air quality data", "category": "Weather", "link": "https://docs.openaq.org/", "auth": "None", "pricing": "free"},
        {"name": "AQI.in", "description": "World air quality index", "category": "Weather", "link": "https://aqicn.org/api/", "auth": "apiKey", "pricing": "freemium"},
        
        # Travel & Transportation
        {"name": "Amadeus", "description": "Travel booking and data", "category": "Travel & Transportation", "link": "https://developers.amadeus.com/self-service", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Skyscanner", "description": "Flight search engine", "category": "Travel & Transportation", "link": "https://developers.skyscanner.net/docs", "auth": "apiKey", "pricing": "free"},
        {"name": "Booking.com", "description": "Hotel booking API", "category": "Travel & Transportation", "link": "https://developers.booking.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "Expedia", "description": "Travel booking platform", "category": "Travel & Transportation", "link": "https://developers.expediagroup.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "Airbnb", "description": "Vacation rental platform", "category": "Travel & Transportation", "link": "https://www.airbnb.com/partner", "auth": "OAuth", "pricing": "free"},
        {"name": "FlightAware", "description": "Flight tracking data", "category": "Travel & Transportation", "link": "https://flightaware.com/commercial/aeroapi/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AviationStack", "description": "Real-time flight data", "category": "Travel & Transportation", "link": "https://aviationstack.com/documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "AeroDataBox", "description": "Aviation database API", "category": "Travel & Transportation", "link": "https://www.aerodatabox.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "OpenSky Network", "description": "Flight tracking network", "category": "Travel & Transportation", "link": "https://openskynetwork.github.io/opensky-api/", "auth": "None", "pricing": "free"},
        {"name": "Uber", "description": "Ride-hailing platform", "category": "Travel & Transportation", "link": "https://developer.uber.com/docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "Lyft", "description": "Ride-sharing service", "category": "Travel & Transportation", "link": "https://developer.lyft.com/docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "Citymapper", "description": "Urban mobility routing", "category": "Travel & Transportation", "link": "https://citymapper.com/tools/api", "auth": "apiKey", "pricing": "paid"},
        {"name": "Rome2Rio", "description": "Multi-modal travel search", "category": "Travel & Transportation", "link": "https://www.rome2rio.com/documentation/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Transitland", "description": "Transit data aggregator", "category": "Travel & Transportation", "link": "https://www.transit.land/documentation", "auth": "None", "pricing": "free"},
        {"name": "GTFS", "description": "General transit feed specification", "category": "Travel & Transportation", "link": "https://gtfs.org/documentation/", "auth": "None", "pricing": "free"},
        
        # Food & Recipes
        {"name": "Spoonacular", "description": "Recipe and food database", "category": "Food & Recipes", "link": "https://spoonacular.com/food-api/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Edamam", "description": "Food and nutrition data", "category": "Food & Recipes", "link": "https://developer.edamam.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "TheMealDB", "description": "Open meal database", "category": "Food & Recipes", "link": "https://www.themealdb.com/api.php", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Nutritionix", "description": "Nutrition database", "category": "Food & Recipes", "link": "https://www.nutritionix.com/business/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Open Food Facts", "description": "Food products database", "category": "Food & Recipes", "link": "https://world.openfoodfacts.org/data", "auth": "None", "pricing": "free"},
        {"name": "Yelp Fusion", "description": "Local business and restaurant data", "category": "Food & Recipes", "link": "https://docs.developer.yelp.com/docs/fusion-intro", "auth": "apiKey", "pricing": "free"},
        {"name": "Zomato", "description": "Restaurant discovery", "category": "Food & Recipes", "link": "https://developers.zomato.com/api", "auth": "apiKey", "pricing": "free"},
        {"name": "DoorDash", "description": "Food delivery platform", "category": "Food & Recipes", "link": "https://developer.doordash.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "Uber Eats", "description": "Food delivery service", "category": "Food & Recipes", "link": "https://developer.uber.com/docs/eats", "auth": "OAuth", "pricing": "free"},
        {"name": "Instacart", "description": "Grocery delivery API", "category": "Food & Recipes", "link": "https://docs.instacart.com/", "auth": "apiKey", "pricing": "free"},
        
        # News & Media
        {"name": "News API", "description": "News articles aggregator", "category": "News & Media", "link": "https://newsapi.org/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "GNews", "description": "Google News API alternative", "category": "News & Media", "link": "https://gnews.io/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Currents API", "description": "News aggregation service", "category": "News & Media", "link": "https://currentsapi.services/en/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "MediaStack", "description": "Real-time news data", "category": "News & Media", "link": "https://mediastack.com/documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "New York Times", "description": "NYT articles and archives", "category": "News & Media", "link": "https://developer.nytimes.com/apis", "auth": "apiKey", "pricing": "freemium"},
        {"name": "The Guardian", "description": "Guardian content API", "category": "News & Media", "link": "https://open-platform.theguardian.com/documentation/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Associated Press", "description": "AP news content", "category": "News & Media", "link": "https://developer.ap.org/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Reuters", "description": "Reuters news content", "category": "News & Media", "link": "https://www.reuters.com/tools/", "auth": "apiKey", "pricing": "paid"},
        
        # Sports
        {"name": "ESPN", "description": "Sports data and content", "category": "Sports", "link": "https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b", "auth": "None", "pricing": "free"},
        {"name": "SportRadar", "description": "Comprehensive sports data", "category": "Sports", "link": "https://developer.sportradar.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "API-Football", "description": "Football/soccer data", "category": "Sports", "link": "https://www.api-football.com/documentation-v3", "auth": "apiKey", "pricing": "freemium"},
        {"name": "NBA API", "description": "NBA statistics data", "category": "Sports", "link": "https://github.com/swar/nba_api", "auth": "None", "pricing": "free"},
        {"name": "MLB-StatsAPI", "description": "Major League Baseball data", "category": "Sports", "link": "https://github.com/toddrob99/MLB-StatsAPI", "auth": "None", "pricing": "free"},
        {"name": "NHL API", "description": "National Hockey League data", "category": "Sports", "link": "https://gitlab.com/dword4/nhlapi", "auth": "None", "pricing": "free"},
        {"name": "TheSportsDB", "description": "Open sports database", "category": "Sports", "link": "https://www.thesportsdb.com/api.php", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Football-Data.org", "description": "European football data", "category": "Sports", "link": "https://www.football-data.org/documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Odds API", "description": "Sports betting odds", "category": "Sports", "link": "https://the-odds-api.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Strava", "description": "Fitness tracking platform", "category": "Sports", "link": "https://developers.strava.com/docs/reference/", "auth": "OAuth", "pricing": "free"},
        
        # Gaming
        {"name": "Steam", "description": "Gaming platform API", "category": "Games & Entertainment", "link": "https://developer.valvesoftware.com/wiki/Steam_Web_API", "auth": "apiKey", "pricing": "free"},
        {"name": "Twitch", "description": "Live streaming platform", "category": "Games & Entertainment", "link": "https://dev.twitch.tv/docs/api/reference", "auth": "OAuth", "pricing": "free"},
        {"name": "RAWG", "description": "Video games database", "category": "Games & Entertainment", "link": "https://rawg.io/apidocs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "IGDB", "description": "Internet Games Database", "category": "Games & Entertainment", "link": "https://api-docs.igdb.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "GiantBomb", "description": "Video games encyclopedia", "category": "Games & Entertainment", "link": "https://www.giantbomb.com/api/documentation/", "auth": "apiKey", "pricing": "free"},
        {"name": "Epic Games", "description": "Epic Games Store API", "category": "Games & Entertainment", "link": "https://dev.epicgames.com/docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "Riot Games", "description": "League of Legends and Valorant data", "category": "Games & Entertainment", "link": "https://developer.riotgames.com/apis", "auth": "apiKey", "pricing": "free"},
        {"name": "Blizzard", "description": "Blizzard games API", "category": "Games & Entertainment", "link": "https://develop.battle.net/documentation", "auth": "OAuth", "pricing": "free"},
        {"name": "Xbox Live", "description": "Xbox gaming services", "category": "Games & Entertainment", "link": "https://docs.microsoft.com/en-us/gaming/xbox-live/", "auth": "OAuth", "pricing": "free"},
        {"name": "PlayStation Network", "description": "PlayStation gaming services", "category": "Games & Entertainment", "link": "https://andshrew.github.io/PlayStation-Trophies/", "auth": "OAuth", "pricing": "free"},
        {"name": "Pokemon TCG", "description": "Pokemon trading card game", "category": "Games & Entertainment", "link": "https://docs.pokemontcg.io/", "auth": "None", "pricing": "free"},
        {"name": "Hearthstone", "description": "Hearthstone card data", "category": "Games & Entertainment", "link": "https://rapidapi.com/omgvamp/api/hearthstone/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Magic: The Gathering", "description": "MTG card database", "category": "Games & Entertainment", "link": "https://docs.magicthegathering.io/", "auth": "None", "pricing": "free"},
        {"name": "Chess.com", "description": "Chess platform data", "category": "Games & Entertainment", "link": "https://www.chess.com/news/view/published-data-api", "auth": "None", "pricing": "free"},
        {"name": "Lichess", "description": "Open source chess platform", "category": "Games & Entertainment", "link": "https://lichess.org/api", "auth": "OAuth", "pricing": "free"},
        
        # Government & Open Data
        {"name": "data.gov", "description": "US government open data", "category": "Government & Open Data", "link": "https://api.data.gov/", "auth": "apiKey", "pricing": "free"},
        {"name": "UK Government", "description": "UK public sector data", "category": "Government & Open Data", "link": "https://www.api.gov.uk/", "auth": "None", "pricing": "free"},
        {"name": "EU Open Data Portal", "description": "European Union data", "category": "Government & Open Data", "link": "https://data.europa.eu/en/", "auth": "None", "pricing": "free"},
        {"name": "World Bank", "description": "Global development data", "category": "Government & Open Data", "link": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392", "auth": "None", "pricing": "free"},
        {"name": "UN Data", "description": "United Nations statistics", "category": "Government & Open Data", "link": "https://data.un.org/", "auth": "None", "pricing": "free"},
        {"name": "Census Bureau", "description": "US Census data", "category": "Government & Open Data", "link": "https://www.census.gov/data/developers.html", "auth": "apiKey", "pricing": "free"},
        {"name": "FDA", "description": "US Food and Drug Administration", "category": "Government & Open Data", "link": "https://open.fda.gov/apis/", "auth": "None", "pricing": "free"},
        {"name": "NASA", "description": "Space and earth science data", "category": "Government & Open Data", "link": "https://api.nasa.gov/", "auth": "apiKey", "pricing": "free"},
        {"name": "NOAA", "description": "Weather and climate data", "category": "Government & Open Data", "link": "https://www.weather.gov/documentation/services-web-api", "auth": "None", "pricing": "free"},
        {"name": "USGS", "description": "Geological survey data", "category": "Government & Open Data", "link": "https://www.usgs.gov/products/web-tools/apis", "auth": "None", "pricing": "free"},
        {"name": "SEC EDGAR", "description": "Financial filings database", "category": "Government & Open Data", "link": "https://www.sec.gov/developer", "auth": "None", "pricing": "free"},
        {"name": "FEC", "description": "Campaign finance data", "category": "Government & Open Data", "link": "https://api.open.fec.gov/developers/", "auth": "apiKey", "pricing": "free"},
        {"name": "Patents API", "description": "USPTO patent database", "category": "Government & Open Data", "link": "https://developer.uspto.gov/api-catalog", "auth": "None", "pricing": "free"},
        
        # Education
        {"name": "Google Classroom", "description": "Education management", "category": "Education", "link": "https://developers.google.com/classroom", "auth": "OAuth", "pricing": "free"},
        {"name": "Canvas LMS", "description": "Learning management system", "category": "Education", "link": "https://canvas.instructure.com/doc/api/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Coursera", "description": "Online learning platform", "category": "Education", "link": "https://build.coursera.org/", "auth": "OAuth", "pricing": "free"},
        {"name": "Udemy", "description": "Online course marketplace", "category": "Education", "link": "https://www.udemy.com/developers/affiliate/", "auth": "apiKey", "pricing": "free"},
        {"name": "edX", "description": "Online education platform", "category": "Education", "link": "https://courses.edx.org/api-docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "Khan Academy", "description": "Free educational resources", "category": "Education", "link": "https://github.com/Khan/khan-api", "auth": "OAuth", "pricing": "free"},
        {"name": "Duolingo", "description": "Language learning platform", "category": "Education", "link": "https://www.duolingo.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Open Library", "description": "Open book database", "category": "Education", "link": "https://openlibrary.org/developers/api", "auth": "None", "pricing": "free"},
        {"name": "Google Books", "description": "Books search and metadata", "category": "Education", "link": "https://developers.google.com/books", "auth": "apiKey", "pricing": "free"},
        {"name": "Wikipedia", "description": "Free encyclopedia API", "category": "Education", "link": "https://www.mediawiki.org/wiki/API:Main_page", "auth": "None", "pricing": "free"},
        {"name": "Wikidata", "description": "Structured knowledge base", "category": "Education", "link": "https://www.wikidata.org/wiki/Wikidata:Data_access", "auth": "None", "pricing": "free"},
        {"name": "arXiv", "description": "Scientific papers repository", "category": "Education", "link": "https://arxiv.org/help/api/", "auth": "None", "pricing": "free"},
        {"name": "Semantic Scholar", "description": "AI research paper search", "category": "Education", "link": "https://api.semanticscholar.org/", "auth": "None", "pricing": "free"},
        {"name": "CrossRef", "description": "Citation linking service", "category": "Education", "link": "https://api.crossref.org/", "auth": "None", "pricing": "free"},
        
        # Health & Fitness
        {"name": "Apple HealthKit", "description": "iOS health data", "category": "Health & Fitness", "link": "https://developer.apple.com/documentation/healthkit", "auth": "OAuth", "pricing": "free"},
        {"name": "Google Fit", "description": "Android health data", "category": "Health & Fitness", "link": "https://developers.google.com/fit", "auth": "OAuth", "pricing": "free"},
        {"name": "Fitbit", "description": "Fitness tracking data", "category": "Health & Fitness", "link": "https://dev.fitbit.com/build/reference/web-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Withings", "description": "Health device data", "category": "Health & Fitness", "link": "https://developer.withings.com/api-reference", "auth": "OAuth", "pricing": "free"},
        {"name": "Garmin", "description": "Fitness and wellness data", "category": "Health & Fitness", "link": "https://developer.garmin.com/health-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Oura", "description": "Sleep and activity tracking", "category": "Health & Fitness", "link": "https://cloud.ouraring.com/docs/", "auth": "OAuth", "pricing": "free"},
        {"name": "WHOOP", "description": "Fitness and recovery data", "category": "Health & Fitness", "link": "https://developer.whoop.com/", "auth": "OAuth", "pricing": "free"},
        {"name": "MyFitnessPal", "description": "Nutrition tracking", "category": "Health & Fitness", "link": "https://www.myfitnesspal.com/api", "auth": "OAuth", "pricing": "free"},
        {"name": "BetterDoctor", "description": "Doctor search API", "category": "Health & Fitness", "link": "https://developer.betterdoctor.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "openFDA", "description": "Drug and medical device data", "category": "Health & Fitness", "link": "https://open.fda.gov/apis/", "auth": "None", "pricing": "free"},
        {"name": "Human API", "description": "Health data aggregation", "category": "Health & Fitness", "link": "https://docs.humanapi.co/", "auth": "OAuth", "pricing": "paid"},
        {"name": "Gyms API", "description": "Gym and fitness center data", "category": "Health & Fitness", "link": "https://www.gyms.ninja/api", "auth": "apiKey", "pricing": "freemium"},
        
        # IoT & Hardware
        {"name": "Particle", "description": "IoT device platform", "category": "IoT & Hardware", "link": "https://docs.particle.io/reference/cloud-apis/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Arduino IoT Cloud", "description": "Arduino IoT platform", "category": "IoT & Hardware", "link": "https://www.arduino.cc/reference/en/iot/api/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Tuya", "description": "IoT development platform", "category": "IoT & Hardware", "link": "https://developer.tuya.com/en/docs/iot", "auth": "apiKey", "pricing": "freemium"},
        {"name": "SmartThings", "description": "Samsung smart home", "category": "IoT & Hardware", "link": "https://developer.smartthings.com/docs/api/", "auth": "OAuth", "pricing": "free"},
        {"name": "Philips Hue", "description": "Smart lighting control", "category": "IoT & Hardware", "link": "https://developers.meethue.com/", "auth": "apiKey", "pricing": "free"},
        {"name": "Nest", "description": "Smart home devices", "category": "IoT & Hardware", "link": "https://developers.google.com/nest/device-access", "auth": "OAuth", "pricing": "free"},
        {"name": "Ring", "description": "Home security devices", "category": "IoT & Hardware", "link": "https://github.com/dgreif/ring", "auth": "OAuth", "pricing": "free"},
        {"name": "ecobee", "description": "Smart thermostat API", "category": "IoT & Hardware", "link": "https://www.ecobee.com/home/developer/api/introduction/", "auth": "OAuth", "pricing": "free"},
        {"name": "Sonos", "description": "Smart speaker control", "category": "IoT & Hardware", "link": "https://developer.sonos.com/reference/control-api/", "auth": "OAuth", "pricing": "free"},
        {"name": "IFTTT", "description": "Automation platform", "category": "IoT & Hardware", "link": "https://ifttt.com/docs/api_reference", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Zapier", "description": "Workflow automation", "category": "IoT & Hardware", "link": "https://zapier.com/developer/documentation/v2/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Make (Integromat)", "description": "Visual automation platform", "category": "IoT & Hardware", "link": "https://www.make.com/en/api-documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "n8n", "description": "Workflow automation tool", "category": "IoT & Hardware", "link": "https://docs.n8n.io/api/", "auth": "apiKey", "pricing": "freemium"},
        
        # Text & Document Processing
        {"name": "DeepL", "description": "AI-powered translation", "category": "Translation", "link": "https://www.deepl.com/docs-api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Google Translate", "description": "Language translation API", "category": "Translation", "link": "https://cloud.google.com/translate/docs", "auth": "apiKey", "pricing": "paid"},
        {"name": "Microsoft Translator", "description": "Azure translation service", "category": "Translation", "link": "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/", "auth": "apiKey", "pricing": "paid"},
        {"name": "LibreTranslate", "description": "Open source translation", "category": "Translation", "link": "https://libretranslate.com/docs/", "auth": "None", "pricing": "freemium"},
        {"name": "Google Docs API", "description": "Document management", "category": "Text & NLP", "link": "https://developers.google.com/docs/api", "auth": "OAuth", "pricing": "free"},
        {"name": "Google Sheets API", "description": "Spreadsheet management", "category": "Text & NLP", "link": "https://developers.google.com/sheets/api", "auth": "OAuth", "pricing": "free"},
        {"name": "Dropbox Sign", "description": "Electronic signatures", "category": "Text & NLP", "link": "https://developers.hellosign.com/", "auth": "apiKey", "pricing": "paid"},
        {"name": "DocuSign", "description": "E-signature platform", "category": "Text & NLP", "link": "https://developers.docusign.com/", "auth": "OAuth", "pricing": "paid"},
        {"name": "PandaDoc", "description": "Document automation", "category": "Text & NLP", "link": "https://developers.pandadoc.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "PDF.co", "description": "PDF manipulation API", "category": "Text & NLP", "link": "https://apidocs.pdf.co/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "iLovePDF", "description": "PDF tools API", "category": "Text & NLP", "link": "https://developer.ilovepdf.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "ConvertAPI", "description": "File format conversion", "category": "Text & NLP", "link": "https://www.convertapi.com/doc", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Textract", "description": "AWS document extraction", "category": "Text & NLP", "link": "https://docs.aws.amazon.com/textract/", "auth": "apiKey", "pricing": "paid"},
        {"name": "Google Document AI", "description": "Document understanding", "category": "Text & NLP", "link": "https://cloud.google.com/document-ai/docs", "auth": "apiKey", "pricing": "paid"},
        
        # Misc & Utility
        {"name": "Abstract API", "description": "Suite of utility APIs", "category": "Utilities", "link": "https://www.abstractapi.com/api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "API Ninjas", "description": "Collection of diverse APIs", "category": "Utilities", "link": "https://api-ninjas.com/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "RapidAPI Hub", "description": "API marketplace", "category": "Utilities", "link": "https://rapidapi.com/hub", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Postman", "description": "API development platform", "category": "Utilities", "link": "https://learning.postman.com/docs/developer/postman-api/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Swagger", "description": "API documentation tools", "category": "Utilities", "link": "https://swagger.io/tools/", "auth": "None", "pricing": "freemium"},
        {"name": "JSON Placeholder", "description": "Fake REST API for testing", "category": "Utilities", "link": "https://jsonplaceholder.typicode.com/", "auth": "None", "pricing": "free"},
        {"name": "Random User", "description": "Random user generator", "category": "Utilities", "link": "https://randomuser.me/documentation", "auth": "None", "pricing": "free"},
        {"name": "UUID Generator", "description": "UUID generation API", "category": "Utilities", "link": "https://www.uuidtools.com/api", "auth": "None", "pricing": "free"},
        {"name": "QR Code Generator", "description": "Generate QR codes", "category": "Utilities", "link": "https://goqr.me/api/", "auth": "None", "pricing": "free"},
        {"name": "Barcode Lookup", "description": "Product barcode database", "category": "Utilities", "link": "https://www.barcodelookup.com/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Short URL", "description": "URL shortening services", "category": "Utilities", "link": "https://developers.short.io/reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Bitly", "description": "Link management platform", "category": "Utilities", "link": "https://dev.bitly.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Rebrandly", "description": "Custom URL shortener", "category": "Utilities", "link": "https://developers.rebrandly.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Calendly", "description": "Scheduling automation", "category": "Calendar & Scheduling", "link": "https://developer.calendly.com/api-docs", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Cal.com", "description": "Open source scheduling", "category": "Calendar & Scheduling", "link": "https://cal.com/docs/api-reference", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Cronofy", "description": "Calendar integration", "category": "Calendar & Scheduling", "link": "https://docs.cronofy.com/developers/api/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Google Calendar", "description": "Calendar management", "category": "Calendar & Scheduling", "link": "https://developers.google.com/calendar/api", "auth": "OAuth", "pricing": "free"},
        {"name": "Microsoft Graph Calendar", "description": "Outlook calendar API", "category": "Calendar & Scheduling", "link": "https://docs.microsoft.com/en-us/graph/api/resources/calendar", "auth": "OAuth", "pricing": "free"},
        {"name": "Nylas", "description": "Email and calendar APIs", "category": "Calendar & Scheduling", "link": "https://developer.nylas.com/", "auth": "OAuth", "pricing": "freemium"},
        {"name": "Hunter.io", "description": "Email finder and verifier", "category": "Utilities", "link": "https://hunter.io/api-documentation", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Clearout", "description": "Email verification", "category": "Utilities", "link": "https://docs.clearout.io/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "ZeroBounce", "description": "Email validation service", "category": "Utilities", "link": "https://www.zerobounce.net/docs/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Kickbox", "description": "Email verification API", "category": "Utilities", "link": "https://docs.kickbox.com/", "auth": "apiKey", "pricing": "freemium"},
        {"name": "IPify", "description": "Public IP address API", "category": "Utilities", "link": "https://www.ipify.org/", "auth": "None", "pricing": "free"},
        {"name": "Country.io", "description": "Country data API", "category": "Utilities", "link": "http://country.io/", "auth": "None", "pricing": "free"},
        {"name": "REST Countries", "description": "Country information", "category": "Utilities", "link": "https://restcountries.com/", "auth": "None", "pricing": "free"},
        {"name": "Holidays API", "description": "Public holidays data", "category": "Utilities", "link": "https://holidayapi.com/docs", "auth": "apiKey", "pricing": "freemium"},
        {"name": "Time Zone DB", "description": "Time zone data", "category": "Utilities", "link": "https://timezonedb.com/api", "auth": "apiKey", "pricing": "freemium"},
        {"name": "World Time API", "description": "Time zone lookup", "category": "Utilities", "link": "http://worldtimeapi.org/", "auth": "None", "pricing": "free"},
    ]
    
    apis = []
    for item in curated:
        apis.append({
            "id": generate_id(item["name"]),
            "name": item["name"],
            "description": item["description"],
            "category": item["category"],
            "auth": item.get("auth", "unknown"),
            "https": True,
            "cors": "unknown",
            "link": item["link"],
            "pricing": item.get("pricing", "unknown"),
            "keywords": extract_keywords(item["description"]),
            "source": "curated"
        })
    
    print(f"  ✓ Curated list: {len(apis)} APIs")
    return apis

def generate_category_apis():
    """Generate additional APIs by category expansion"""
    print("📥 Generating category-based APIs...")
    
    # Additional APIs organized by category
    categories_apis = {
        "AI & Machine Learning": [
            ("Vertex AI", "Google Cloud's unified ML platform", "https://cloud.google.com/vertex-ai/docs"),
            ("SageMaker", "AWS machine learning service", "https://docs.aws.amazon.com/sagemaker/"),
            ("Azure Machine Learning", "Microsoft ML platform", "https://learn.microsoft.com/azure/machine-learning/"),
            ("DataRobot", "Automated machine learning", "https://docs.datarobot.com/"),
            ("H2O.ai", "Open source ML platform", "https://docs.h2o.ai/"),
            ("MLflow", "ML lifecycle platform", "https://mlflow.org/docs/"),
            ("Weights & Biases", "ML experiment tracking", "https://docs.wandb.ai/"),
            ("Neptune.ai", "ML metadata store", "https://docs.neptune.ai/"),
            ("Clarifai", "Computer vision AI", "https://docs.clarifai.com/"),
            ("Roboflow", "Computer vision tools", "https://docs.roboflow.com/"),
            ("Scale AI", "Data labeling platform", "https://scale.com/docs"),
            ("Labelbox", "Training data platform", "https://docs.labelbox.com/"),
            ("Snorkel AI", "Data-centric AI", "https://www.snorkel.ai/docs/"),
            ("Determined AI", "Deep learning training", "https://docs.determined.ai/"),
            ("Anyscale", "Ray-based ML scaling", "https://docs.anyscale.com/"),
            ("Modal", "Serverless GPU compute", "https://modal.com/docs"),
            ("Banana", "ML inference hosting", "https://docs.banana.dev/"),
            ("Beam", "Python runtime for ML", "https://docs.beam.cloud/"),
            ("Baseten", "ML model deployment", "https://docs.baseten.co/"),
            ("Fireworks AI", "Fast LLM inference", "https://docs.fireworks.ai/"),
            ("Anyscale Endpoints", "LLM serving", "https://docs.endpoints.anyscale.com/"),
            ("vLLM", "High-throughput LLM serving", "https://docs.vllm.ai/"),
            ("Text Generation Inference", "Hugging Face inference", "https://huggingface.co/docs/text-generation-inference/"),
            ("LangChain", "LLM application framework", "https://python.langchain.com/docs/"),
            ("LlamaIndex", "Data framework for LLMs", "https://docs.llamaindex.ai/"),
            ("Semantic Kernel", "Microsoft AI orchestration", "https://learn.microsoft.com/semantic-kernel/"),
            ("AutoGPT", "Autonomous AI agents", "https://docs.agpt.co/"),
            ("CrewAI", "AI agent framework", "https://docs.crewai.com/"),
            ("Fixie", "AI agent platform", "https://docs.fixie.ai/"),
            ("Dust", "AI assistant builder", "https://docs.dust.tt/"),
        ],
        "Databases": [
            ("MongoDB Atlas", "Cloud database service", "https://www.mongodb.com/docs/atlas/"),
            ("PostgreSQL", "Open source relational database", "https://www.postgresql.org/docs/"),
            ("MySQL", "Popular relational database", "https://dev.mysql.com/doc/"),
            ("Redis", "In-memory data store", "https://redis.io/docs/"),
            ("Cassandra", "Distributed NoSQL database", "https://cassandra.apache.org/doc/"),
            ("CockroachDB", "Distributed SQL database", "https://www.cockroachlabs.com/docs/"),
            ("TiDB", "Distributed SQL database", "https://docs.pingcap.com/tidb/"),
            ("Yugabyte", "Distributed PostgreSQL", "https://docs.yugabyte.com/"),
            ("ScyllaDB", "High-performance NoSQL", "https://docs.scylladb.com/"),
            ("FoundationDB", "Distributed database", "https://apple.github.io/foundationdb/"),
            ("Fauna", "Serverless database", "https://docs.fauna.com/"),
            ("SingleStore", "Real-time database", "https://docs.singlestore.com/"),
            ("Timescale", "Time-series database", "https://docs.timescale.com/"),
            ("InfluxDB", "Time-series platform", "https://docs.influxdata.com/"),
            ("QuestDB", "Fast time-series database", "https://questdb.io/docs/"),
            ("ClickHouse", "OLAP database", "https://clickhouse.com/docs/"),
            ("Druid", "Real-time analytics", "https://druid.apache.org/docs/"),
            ("Snowflake", "Cloud data warehouse", "https://docs.snowflake.com/"),
            ("Databricks", "Unified analytics platform", "https://docs.databricks.com/"),
            ("Dremio", "Data lakehouse platform", "https://docs.dremio.com/"),
            ("Firebolt", "Cloud data warehouse", "https://docs.firebolt.io/"),
            ("StarRocks", "Analytics database", "https://docs.starrocks.io/"),
            ("Apache Doris", "Real-time analytics", "https://doris.apache.org/docs/"),
            ("Materialize", "Streaming database", "https://materialize.com/docs/"),
            ("RisingWave", "Streaming database", "https://docs.risingwave.com/"),
            ("Rockset", "Real-time analytics", "https://docs.rockset.com/"),
            ("Tinybird", "Real-time data platform", "https://www.tinybird.co/docs"),
            ("Hydrolix", "Streaming analytics", "https://docs.hydrolix.io/"),
            ("DuckDB", "In-process analytics", "https://duckdb.org/docs/"),
            ("SQLite", "Embedded database", "https://sqlite.org/docs.html"),
        ],
        "DevOps & CI/CD": [
            ("Jenkins", "Automation server", "https://www.jenkins.io/doc/"),
            ("GitLab CI", "DevOps platform CI/CD", "https://docs.gitlab.com/ee/ci/"),
            ("Argo CD", "GitOps continuous delivery", "https://argo-cd.readthedocs.io/"),
            ("Flux", "GitOps toolkit", "https://fluxcd.io/docs/"),
            ("Tekton", "Cloud-native CI/CD", "https://tekton.dev/docs/"),
            ("Spinnaker", "Multi-cloud deployment", "https://spinnaker.io/docs/"),
            ("Harness", "Software delivery platform", "https://developer.harness.io/"),
            ("Buildkite", "CI/CD for teams", "https://buildkite.com/docs/"),
            ("Drone", "Container-native CI/CD", "https://docs.drone.io/"),
            ("Semaphore", "Continuous integration", "https://docs.semaphoreci.com/"),
            ("Codefresh", "GitOps CI/CD", "https://codefresh.io/docs/"),
            ("Octopus Deploy", "Deployment automation", "https://octopus.com/docs/"),
            ("Spacelift", "Infrastructure orchestration", "https://docs.spacelift.io/"),
            ("Env0", "IaC automation", "https://docs.env0.com/"),
            ("Pulumi", "Infrastructure as code", "https://www.pulumi.com/docs/"),
            ("Crossplane", "Cloud-native control plane", "https://docs.crossplane.io/"),
            ("Ansible", "IT automation", "https://docs.ansible.com/"),
            ("Chef", "Infrastructure automation", "https://docs.chef.io/"),
            ("Puppet", "Infrastructure management", "https://puppet.com/docs/"),
            ("SaltStack", "Event-driven automation", "https://docs.saltproject.io/"),
            ("Kubernetes", "Container orchestration", "https://kubernetes.io/docs/reference/"),
            ("Docker", "Container platform", "https://docs.docker.com/engine/api/"),
            ("Podman", "Container tools", "https://docs.podman.io/"),
            ("containerd", "Container runtime", "https://containerd.io/docs/"),
            ("Nomad", "Workload orchestration", "https://developer.hashicorp.com/nomad/api-docs"),
            ("Consul", "Service networking", "https://developer.hashicorp.com/consul/api-docs"),
            ("Istio", "Service mesh", "https://istio.io/latest/docs/reference/"),
            ("Linkerd", "Service mesh", "https://linkerd.io/docs/"),
            ("Cilium", "eBPF-based networking", "https://docs.cilium.io/"),
            ("Prometheus", "Monitoring system", "https://prometheus.io/docs/prometheus/latest/querying/api/"),
            ("Grafana", "Observability platform", "https://grafana.com/docs/grafana/latest/developers/http_api/"),
            ("Jaeger", "Distributed tracing", "https://www.jaegertracing.io/docs/"),
            ("OpenTelemetry", "Observability framework", "https://opentelemetry.io/docs/"),
            ("Loki", "Log aggregation", "https://grafana.com/docs/loki/latest/api/"),
            ("Tempo", "Distributed tracing", "https://grafana.com/docs/tempo/latest/api_docs/"),
            ("Mimir", "Metrics backend", "https://grafana.com/docs/mimir/latest/references/http-api/"),
        ],
        "Testing & QA": [
            ("Selenium", "Browser automation", "https://www.selenium.dev/documentation/"),
            ("Playwright", "Browser testing", "https://playwright.dev/docs/api/"),
            ("Cypress", "JavaScript testing", "https://docs.cypress.io/api/"),
            ("Puppeteer", "Chrome automation", "https://pptr.dev/api"),
            ("WebdriverIO", "Browser automation", "https://webdriver.io/docs/api"),
            ("Appium", "Mobile app testing", "https://appium.io/docs/en/latest/"),
            ("Detox", "React Native testing", "https://wix.github.io/Detox/docs/api/"),
            ("Maestro", "Mobile UI testing", "https://maestro.mobile.dev/api-reference"),
            ("k6", "Load testing", "https://k6.io/docs/"),
            ("Locust", "Load testing tool", "https://docs.locust.io/"),
            ("Gatling", "Load testing tool", "https://gatling.io/docs/"),
            ("Artillery", "Performance testing", "https://www.artillery.io/docs/"),
            ("JMeter", "Performance testing", "https://jmeter.apache.org/usermanual/"),
            ("Postman", "API testing", "https://learning.postman.com/docs/"),
            ("Insomnia", "API client", "https://docs.insomnia.rest/"),
            ("Hoppscotch", "API development", "https://docs.hoppscotch.io/"),
            ("Bruno", "API client", "https://docs.usebruno.com/"),
            ("SoapUI", "API testing", "https://www.soapui.org/docs/"),
            ("Pact", "Contract testing", "https://docs.pact.io/"),
            ("Dredd", "API testing", "https://dredd.org/"),
            ("Karate", "API test automation", "https://github.com/karatelabs/karate"),
            ("REST Assured", "Java API testing", "https://rest-assured.io/"),
            ("BrowserStack", "Testing infrastructure", "https://www.browserstack.com/docs/"),
            ("Sauce Labs", "Testing platform", "https://docs.saucelabs.com/"),
            ("LambdaTest", "Testing cloud", "https://www.lambdatest.com/support/docs/"),
            ("Percy", "Visual testing", "https://docs.percy.io/"),
            ("Applitools", "Visual AI testing", "https://applitools.com/docs/"),
            ("Chromatic", "UI testing", "https://www.chromatic.com/docs/"),
            ("Checkly", "Synthetic monitoring", "https://www.checklyhq.com/docs/"),
            ("Testim", "AI-powered testing", "https://help.testim.io/"),
        ],
        "Automation & Integration": [
            ("Zapier", "Workflow automation", "https://zapier.com/developer/documentation/v2/"),
            ("Make (Integromat)", "Visual automation", "https://www.make.com/en/api-documentation"),
            ("n8n", "Workflow automation", "https://docs.n8n.io/api/"),
            ("Pipedream", "Integration platform", "https://pipedream.com/docs/api/"),
            ("Tray.io", "Integration platform", "https://tray.io/documentation/"),
            ("Workato", "Enterprise automation", "https://docs.workato.com/"),
            ("Power Automate", "Microsoft automation", "https://learn.microsoft.com/power-automate/"),
            ("Automate.io", "Cloud integration", "https://automate.io/integration-api"),
            ("Integrately", "App integration", "https://integrately.com/"),
            ("Pabbly Connect", "Workflow automation", "https://www.pabbly.com/connect/"),
            ("Bardeen", "Browser automation", "https://www.bardeen.ai/docs"),
            ("Activepieces", "Open source automation", "https://www.activepieces.com/docs"),
            ("Alloy", "Unified API", "https://docs.runalloy.com/"),
            ("Merge", "Unified API platform", "https://docs.merge.dev/"),
            ("Finch", "Employment API", "https://developer.tryfinch.com/"),
            ("Apideck", "Unified APIs", "https://developers.apideck.com/"),
            ("Unified.to", "Unified APIs", "https://unified.to/docs"),
            ("Paragon", "Embedded integrations", "https://docs.useparagon.com/"),
            ("Vessel", "CRM integration", "https://docs.vessel.land/"),
            ("Sequin", "Database sync", "https://docs.sequinstream.com/"),
            ("Airbyte", "Data integration", "https://docs.airbyte.com/api-documentation/"),
            ("Fivetran", "Data pipelines", "https://fivetran.com/docs/rest-api"),
            ("Stitch", "Data pipeline", "https://www.stitchdata.com/docs/"),
            ("Census", "Reverse ETL", "https://docs.getcensus.com/"),
            ("Hightouch", "Reverse ETL", "https://hightouch.com/docs/"),
            ("Rudderstack", "Customer data platform", "https://www.rudderstack.com/docs/"),
            ("Segment", "Customer data platform", "https://segment.com/docs/"),
            ("mParticle", "Customer data platform", "https://docs.mparticle.com/"),
            ("Tealium", "Customer data hub", "https://docs.tealium.com/"),
            ("Lytics", "Customer data platform", "https://docs.lytics.com/"),
        ],
        "Low-Code & No-Code": [
            ("Airtable", "Database-spreadsheet", "https://airtable.com/developers/web/api/introduction"),
            ("Notion", "Workspace", "https://developers.notion.com/"),
            ("Coda", "Doc-app hybrid", "https://coda.io/developers/apis/v1"),
            ("Retool", "Internal tools", "https://docs.retool.com/"),
            ("Appsmith", "Internal tools", "https://docs.appsmith.com/"),
            ("Budibase", "Low-code platform", "https://docs.budibase.com/"),
            ("Tooljet", "Internal tools", "https://docs.tooljet.com/"),
            ("Airplane", "Internal tools", "https://docs.airplane.dev/"),
            ("Superblocks", "Internal apps", "https://docs.superblocks.com/"),
            ("DronaHQ", "Low-code platform", "https://docs.dronahq.com/"),
            ("UI Bakery", "Internal tools", "https://docs.uibakery.io/"),
            ("Jet Admin", "Internal tools", "https://docs.jetadmin.io/"),
            ("Forest Admin", "Admin panel", "https://docs.forestadmin.com/"),
            ("Strapi", "Headless CMS", "https://docs.strapi.io/"),
            ("Directus", "Data platform", "https://docs.directus.io/"),
            ("Sanity", "Content platform", "https://www.sanity.io/docs/"),
            ("Contentful", "Content platform", "https://www.contentful.com/developers/docs/"),
            ("Prismic", "Headless CMS", "https://prismic.io/docs/api"),
            ("Hygraph", "GraphQL CMS", "https://hygraph.com/docs/api-reference"),
            ("Storyblok", "Headless CMS", "https://www.storyblok.com/docs/api"),
            ("Builder.io", "Visual CMS", "https://www.builder.io/c/docs/"),
            ("Plasmic", "Visual builder", "https://docs.plasmic.app/"),
            ("Webflow", "Visual development", "https://developers.webflow.com/"),
            ("Framer", "Design and publish", "https://www.framer.com/developers/"),
            ("Softr", "No-code apps", "https://docs.softr.io/"),
            ("Glide", "No-code apps", "https://www.glideapps.com/docs"),
            ("Adalo", "No-code apps", "https://help.adalo.com/"),
            ("Bubble", "No-code platform", "https://manual.bubble.io/"),
            ("FlutterFlow", "No-code Flutter", "https://docs.flutterflow.io/"),
            ("Draftbit", "No-code mobile", "https://docs.draftbit.com/"),
        ],
        "Analytics & Business Intelligence": [
            ("Google Analytics", "Web analytics", "https://developers.google.com/analytics"),
            ("Mixpanel", "Product analytics", "https://developer.mixpanel.com/"),
            ("Amplitude", "Product analytics", "https://www.docs.developers.amplitude.com/"),
            ("Heap", "Digital analytics", "https://developers.heap.io/"),
            ("PostHog", "Product analytics", "https://posthog.com/docs/api"),
            ("Pendo", "Product experience", "https://support.pendo.io/hc/en-us/articles/360032294291"),
            ("FullStory", "Digital experience", "https://developer.fullstory.com/"),
            ("LogRocket", "Session replay", "https://docs.logrocket.com/reference"),
            ("Smartlook", "User behavior", "https://developers.smartlook.com/"),
            ("Lucky Orange", "Conversion optimization", "https://help.luckyorange.com/article/350"),
            ("Crazy Egg", "Heatmaps", "https://help.crazyegg.com/"),
            ("Mouseflow", "Behavior analytics", "https://mouseflow.com/docs/"),
            ("Contentsquare", "Digital experience", "https://docs.contentsquare.com/"),
            ("Quantum Metric", "Digital intelligence", "https://quantummetric.com/"),
            ("Glassbox", "Experience analytics", "https://www.glassbox.com/"),
            ("Tableau", "Business intelligence", "https://help.tableau.com/current/api/"),
            ("Power BI", "Business analytics", "https://learn.microsoft.com/en-us/rest/api/power-bi/"),
            ("Looker", "Business intelligence", "https://developers.looker.com/api/"),
            ("Metabase", "Business intelligence", "https://www.metabase.com/docs/latest/api-documentation"),
            ("Superset", "Data exploration", "https://superset.apache.org/docs/api"),
            ("Redash", "Data visualization", "https://redash.io/help/user-guide/integrations-and-api/api"),
            ("Mode", "Collaborative analytics", "https://mode.com/developer/api-reference/"),
            ("Sisense", "Analytics platform", "https://sisense.dev/reference/rest"),
            ("Domo", "Business cloud", "https://developer.domo.com/"),
            ("Qlik Sense", "Analytics platform", "https://qlik.dev/"),
            ("ThoughtSpot", "Search analytics", "https://developers.thoughtspot.com/"),
            ("Holistics", "BI platform", "https://docs.holistics.io/api"),
            ("Cube.js", "Analytics framework", "https://cube.dev/docs/reference/rest-api"),
            ("GoodData", "Analytics platform", "https://www.gooddata.com/developers/"),
            ("Klipfolio", "Dashboard software", "https://support.klipfolio.com/hc/en-us/articles/"),
            ("Geckoboard", "KPI dashboards", "https://developer.geckoboard.com/"),
            ("Chartio", "Cloud BI", "https://chartio.com/"),
        ],
        "Marketing & Advertising": [
            ("Google Ads", "Online advertising", "https://developers.google.com/google-ads/api/docs"),
            ("Facebook Marketing", "Social advertising", "https://developers.facebook.com/docs/marketing-apis/"),
            ("LinkedIn Marketing", "B2B advertising", "https://learn.microsoft.com/en-us/linkedin/marketing/"),
            ("Twitter Ads", "Social advertising", "https://developer.twitter.com/en/docs/twitter-ads-api"),
            ("TikTok Marketing", "Video advertising", "https://business-api.tiktok.com/portal/docs"),
            ("Pinterest Ads", "Visual advertising", "https://developers.pinterest.com/docs/api/v5/"),
            ("Snapchat Marketing", "Snap advertising", "https://marketingapi.snapchat.com/docs/"),
            ("Amazon Advertising", "E-commerce ads", "https://advertising.amazon.com/API/docs/"),
            ("Microsoft Advertising", "Search advertising", "https://learn.microsoft.com/en-us/advertising/guides/"),
            ("AdRoll", "Retargeting platform", "https://developers.adroll.com/"),
            ("Criteo", "Performance marketing", "https://developers.criteo.com/"),
            ("Taboola", "Native advertising", "https://developers.taboola.com/"),
            ("Outbrain", "Native advertising", "https://developer.outbrain.com/"),
            ("MediaMath", "Programmatic advertising", "https://developer.mediamath.com/"),
            ("The Trade Desk", "Demand-side platform", "https://partner.thetradedesk.com/v3/portal/api"),
            ("DoubleVerify", "Ad verification", "https://doubleverify.com/"),
            ("IAS", "Ad verification", "https://integralads.com/"),
            ("Moat", "Ad measurement", "https://moat.com/"),
            ("AppsFlyer", "Mobile attribution", "https://support.appsflyer.com/hc/en-us/articles/"),
            ("Adjust", "Mobile analytics", "https://help.adjust.com/en/article/api"),
            ("Branch", "Deep linking", "https://help.branch.io/developers-hub"),
            ("Singular", "Marketing analytics", "https://developers.singular.net/"),
            ("Kochava", "Mobile attribution", "https://support.kochava.com/sdk-integration/"),
            ("Iterable", "Growth marketing", "https://api.iterable.com/api/docs"),
            ("Braze", "Customer engagement", "https://www.braze.com/docs/api/basics"),
            ("Klaviyo", "Email marketing", "https://developers.klaviyo.com/"),
            ("Attentive", "SMS marketing", "https://docs.attentivemobile.com/"),
            ("OneSignal", "Push notifications", "https://documentation.onesignal.com/reference"),
            ("Airship", "Customer engagement", "https://docs.airship.com/api/"),
            ("Leanplum", "Mobile engagement", "https://docs.leanplum.com/reference"),
        ],
        "HR & Recruitment": [
            ("Workday", "HR management", "https://community.workday.com/sites/default/files/file-hosting/productionapi/"),
            ("BambooHR", "HR software", "https://documentation.bamboohr.com/reference"),
            ("Greenhouse", "Recruiting software", "https://developers.greenhouse.io/"),
            ("Lever", "Recruiting software", "https://hire.lever.co/developer/documentation"),
            ("Ashby", "Recruiting platform", "https://developers.ashbyhq.com/"),
            ("Workable", "Recruiting software", "https://workable.readme.io/"),
            ("JazzHR", "Recruiting software", "https://www.jazzhr.com/api-documentation/"),
            ("SmartRecruiters", "Talent acquisition", "https://developers.smartrecruiters.com/"),
            ("Breezy HR", "Recruiting software", "https://developer.breezy.hr/"),
            ("Recruitee", "Collaborative hiring", "https://docs.recruitee.com/reference"),
            ("Teamtailor", "Employer branding", "https://docs.teamtailor.com/"),
            ("Personio", "HR software", "https://developer.personio.de/"),
            ("HiBob", "HR platform", "https://apidocs.hibob.com/"),
            ("Rippling", "HR platform", "https://developer.rippling.com/"),
            ("Gusto", "Payroll & HR", "https://docs.gusto.com/"),
            ("Justworks", "PEO platform", "https://justworks.com/"),
            ("Deel", "Global HR", "https://developer.deel.com/"),
            ("Remote", "Global HR", "https://remote.com/resources/api"),
            ("Oyster", "Global employment", "https://oysterhr.com/"),
            ("Papaya Global", "Global payroll", "https://papayaglobal.com/"),
            ("Lattice", "People management", "https://developers.lattice.com/"),
            ("Culture Amp", "Employee engagement", "https://developer.cultureamp.com/"),
            ("15Five", "Performance management", "https://support.15five.com/hc/en-us/articles/"),
            ("Leapsome", "People enablement", "https://www.leapsome.com/"),
            ("Betterworks", "Performance management", "https://betterworks.com/"),
            ("Namely", "HR platform", "https://developers.namely.com/"),
            ("Paychex", "Payroll services", "https://developer.paychex.com/"),
            ("ADP", "HR and payroll", "https://developers.adp.com/"),
            ("Paylocity", "Payroll software", "https://www.paylocity.com/"),
            ("Ceridian", "HCM platform", "https://developers.dayforce.com/"),
        ],
        "Legal & Compliance": [
            ("DocuSign", "E-signatures", "https://developers.docusign.com/"),
            ("Adobe Sign", "E-signatures", "https://secure.adobesign.com/public/docs/restapi/v6"),
            ("PandaDoc", "Document automation", "https://developers.pandadoc.com/"),
            ("HelloSign", "E-signatures", "https://developers.hellosign.com/"),
            ("SignNow", "E-signatures", "https://www.signnow.com/developers"),
            ("SignRequest", "E-signatures", "https://signrequest.com/api/v1/docs/"),
            ("Ironclad", "Contract management", "https://developer.ironcladapp.com/"),
            ("Agiloft", "Contract management", "https://www.agiloft.com/"),
            ("ContractPodAi", "Contract management", "https://contractpodai.com/"),
            ("Juro", "Contract automation", "https://juro.com/"),
            ("LinkSquares", "Contract analytics", "https://linksquares.com/"),
            ("LawGeex", "Contract review", "https://www.lawgeex.com/"),
            ("Kira Systems", "Contract analysis", "https://kirasystems.com/"),
            ("Luminance", "Legal AI", "https://www.luminance.com/"),
            ("Clio", "Legal practice management", "https://app.clio.com/api/v4/documentation"),
            ("MyCase", "Legal software", "https://www.mycase.com/"),
            ("PracticePanther", "Legal software", "https://www.practicepanther.com/"),
            ("Smokeball", "Legal software", "https://www.smokeball.com/"),
            ("GDPR Advisor", "Compliance tool", "https://gdpr-advisor.com/"),
            ("OneTrust", "Privacy management", "https://developer.onetrust.com/"),
            ("TrustArc", "Privacy compliance", "https://trustarc.com/"),
            ("BigID", "Data intelligence", "https://docs.bigid.com/"),
            ("Securiti", "Data governance", "https://securiti.ai/"),
            ("Collibra", "Data governance", "https://developer.collibra.com/"),
            ("Alation", "Data catalog", "https://developer.alation.com/"),
            ("Atlan", "Data workspace", "https://atlan.com/"),
            ("Satori", "Data access", "https://satoricyber.com/"),
            ("Immuta", "Data access", "https://documentation.immuta.com/"),
            ("Privacera", "Data governance", "https://privacera.com/"),
            ("Drata", "Compliance automation", "https://docs.drata.com/"),
        ],
        "Customer Success": [
            ("Gainsight", "Customer success", "https://developer.gainsight.com/"),
            ("Totango", "Customer success", "https://support.totango.com/hc/en-us/articles/"),
            ("ChurnZero", "Customer success", "https://support.churnzero.net/hc/en-us/articles/"),
            ("Planhat", "Customer success", "https://docs.planhat.com/"),
            ("Catalyst", "Customer success", "https://docs.catalyst.io/"),
            ("Vitally", "Customer success", "https://docs.vitally.io/"),
            ("UserIQ", "Customer success", "https://useriq.com/"),
            ("Custify", "Customer success", "https://www.custify.com/"),
            ("Akita", "Customer success", "https://www.akitaapp.com/"),
            ("Natero", "Customer success", "https://www.natero.com/"),
            ("Strikedeck", "Customer success", "https://strikedeck.com/"),
            ("ClientSuccess", "Customer success", "https://www.clientsuccess.com/"),
            ("Freshsuccess", "Customer success", "https://www.freshworks.com/customer-success-software/"),
            ("Amity", "Customer success", "https://getamity.com/"),
            ("Skalin", "Customer success", "https://www.skalin.io/"),
        ],
        "Project Management": [
            ("Jira", "Issue tracking", "https://developer.atlassian.com/cloud/jira/platform/rest/v3/"),
            ("Asana", "Work management", "https://developers.asana.com/reference"),
            ("Monday.com", "Work OS", "https://developer.monday.com/api-reference/docs"),
            ("ClickUp", "Productivity", "https://clickup.com/api"),
            ("Linear", "Project tracking", "https://developers.linear.app/docs"),
            ("Notion", "Workspace", "https://developers.notion.com/"),
            ("Trello", "Kanban boards", "https://developer.atlassian.com/cloud/trello/rest/"),
            ("Basecamp", "Project management", "https://github.com/basecamp/bc3-api"),
            ("Wrike", "Work management", "https://developers.wrike.com/"),
            ("Smartsheet", "Work execution", "https://smartsheet.redoc.ly/"),
            ("Teamwork", "Project management", "https://developer.teamwork.com/"),
            ("Hive", "Project management", "https://developers.hive.com/"),
            ("Airtable", "Database apps", "https://airtable.com/developers/web/api/introduction"),
            ("Coda", "Doc apps", "https://coda.io/developers/apis/v1"),
            ("Fibery", "Work management", "https://api.fibery.io/"),
            ("Height", "Project management", "https://height.notion.site/"),
            ("Shortcut", "Project management", "https://developer.shortcut.com/api/rest/v3"),
            ("Plane", "Project tracking", "https://docs.plane.so/"),
            ("Zenhub", "Agile boards", "https://developers.zenhub.com/"),
            ("Clubhouse", "Project management", "https://shortcut.com/api/"),
        ],
        "Scheduling & Booking": [
            ("Calendly", "Scheduling", "https://developer.calendly.com/api-docs"),
            ("Cal.com", "Scheduling", "https://cal.com/docs/api-reference"),
            ("Acuity Scheduling", "Scheduling", "https://developers.acuityscheduling.com/"),
            ("Doodle", "Scheduling", "https://developer.doodle.com/"),
            ("Chili Piper", "Scheduling", "https://help.chilipiper.com/"),
            ("SavvyCal", "Scheduling", "https://savvycal.com/"),
            ("YouCanBook.me", "Scheduling", "https://api.youcanbook.me/"),
            ("Appointy", "Scheduling", "https://www.appointy.com/"),
            ("Setmore", "Scheduling", "https://www.setmore.com/"),
            ("SimplyBook.me", "Booking system", "https://simplybook.me/"),
            ("Bookeo", "Booking system", "https://www.bookeo.com/apiref/"),
            ("Bookafy", "Scheduling", "https://bookafy.com/"),
            ("Hubspot Meetings", "Scheduling", "https://developers.hubspot.com/docs/api/"),
            ("Reclaim", "AI scheduling", "https://reclaim.ai/"),
            ("Clockwise", "Calendar optimization", "https://www.getclockwise.com/"),
        ],
        "Form Builders": [
            ("Typeform", "Interactive forms", "https://developer.typeform.com/"),
            ("JotForm", "Online forms", "https://api.jotform.com/docs/"),
            ("Google Forms", "Simple forms", "https://developers.google.com/forms/api"),
            ("Tally", "Form builder", "https://tally.so/"),
            ("Paperform", "Smart forms", "https://paperform.co/help/"),
            ("Formstack", "Form builder", "https://developers.formstack.com/"),
            ("Cognito Forms", "Form builder", "https://www.cognitoforms.com/api"),
            ("123FormBuilder", "Form builder", "https://www.123formbuilder.com/api-documentation/"),
            ("Wufoo", "Online forms", "https://wufoo.github.io/docs/"),
            ("SurveyMonkey", "Surveys", "https://developer.surveymonkey.com/api/v3/"),
            ("Qualtrics", "Experience management", "https://api.qualtrics.com/"),
            ("Alchemer", "Surveys", "https://apihelp.alchemer.com/"),
            ("Delighted", "NPS surveys", "https://delighted.com/docs/api"),
            ("AskNicely", "NPS platform", "https://asknicely.com/"),
            ("SatisMeter", "User feedback", "https://satismeter.com/"),
            ("Refiner", "User surveys", "https://refiner.io/"),
            ("Screeb", "Product surveys", "https://screeb.app/"),
            ("Sprig", "User research", "https://sprig.com/"),
            ("Maze", "User testing", "https://maze.co/"),
            ("Useberry", "User testing", "https://www.useberry.com/"),
        ],
        "Support & Helpdesk": [
            ("Zendesk", "Customer service", "https://developer.zendesk.com/api-reference/"),
            ("Freshdesk", "Helpdesk", "https://developers.freshdesk.com/api/"),
            ("Intercom", "Customer messaging", "https://developers.intercom.com/"),
            ("HelpScout", "Customer support", "https://developer.helpscout.com/"),
            ("Front", "Customer operations", "https://dev.frontapp.com/reference"),
            ("Gladly", "Customer service", "https://developer.gladly.com/"),
            ("Kustomer", "CRM platform", "https://developer.kustomer.com/"),
            ("Gorgias", "E-commerce support", "https://developers.gorgias.com/"),
            ("Re:amaze", "Customer support", "https://www.reamaze.com/api"),
            ("Crisp", "Customer messaging", "https://docs.crisp.chat/api/v1/"),
            ("LiveChat", "Live chat", "https://developers.livechat.com/"),
            ("Tawk.to", "Live chat", "https://developer.tawk.to/"),
            ("Drift", "Conversational marketing", "https://devdocs.drift.com/docs"),
            ("Olark", "Live chat", "https://www.olark.com/help/api"),
            ("SnapEngage", "Live chat", "https://snapengage.com/"),
            ("Kayako", "Customer service", "https://developer.kayako.com/"),
            ("ServiceNow", "IT service management", "https://developer.servicenow.com/"),
            ("Freshservice", "IT helpdesk", "https://api.freshservice.com/v2/"),
            ("Jira Service Management", "ITSM", "https://developer.atlassian.com/cloud/jira/service-desk/rest/"),
            ("Halp", "Conversational ticketing", "https://www.atlassian.com/software/halp"),
        ],
    }
    
    apis = []
    for category, api_list in categories_apis.items():
        for item in api_list:
            name, desc, link = item
            apis.append({
                "id": generate_id(name),
                "name": name,
                "description": desc,
                "category": category,
                "auth": "apiKey",
                "https": True,
                "cors": "unknown",
                "link": link,
                "pricing": "unknown",
                "keywords": extract_keywords(desc),
                "source": "category_expansion"
            })
    
    print(f"  ✓ Category expansion: {len(apis)} APIs")
    return apis


def deduplicate(apis, existing_ids):
    """Remove duplicates based on ID and name similarity"""
    seen_ids = set(existing_ids)
    seen_names = set()
    unique = []
    
    for api in apis:
        api_id = api["id"]
        name_lower = api["name"].lower().strip()
        
        # Skip if ID already exists
        if api_id in seen_ids:
            stats["duplicates"] += 1
            continue
        
        # Skip if name is very similar
        if name_lower in seen_names:
            stats["duplicates"] += 1
            continue
        
        seen_ids.add(api_id)
        seen_names.add(name_lower)
        unique.append(api)
        stats["added"] += 1
    
    return unique

def main():
    print("🚀 APIClaw Mass API Expansion")
    print("=" * 50)
    
    # Load existing
    registry = load_existing()
    
    # Fix any APIs missing IDs
    for api in registry["apis"]:
        if "id" not in api or not api["id"]:
            api["id"] = generate_id(api.get("name", "unknown"))
    
    existing_ids = {api.get("id", "") for api in registry["apis"] if api.get("id")}
    existing_names = {api.get("name", "").lower() for api in registry["apis"] if api.get("name")}
    
    print(f"📊 Starting with {stats['initial']} APIs")
    print()
    
    # Fetch from all sources
    all_new_apis = []
    
    # 1. APIs.guru
    apis_guru = fetch_apis_guru()
    all_new_apis.extend(apis_guru)
    
    # 2. Public APIs GitHub
    public_apis = fetch_public_apis_github()
    all_new_apis.extend(public_apis)
    
    # 3. Curated list
    curated = generate_curated_apis()
    all_new_apis.extend(curated)
    
    # 4. Category expansion
    category_apis = generate_category_apis()
    all_new_apis.extend(category_apis)
    
    print()
    print(f"📥 Total fetched: {len(all_new_apis)} APIs")
    
    # Deduplicate
    print("🔄 Deduplicating...")
    unique_new = deduplicate(all_new_apis, existing_ids)
    
    # Merge with existing
    registry["apis"].extend(unique_new)
    registry["count"] = len(registry["apis"])
    registry["lastUpdated"] = "2026-02-22"
    
    # Save
    print(f"💾 Saving to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(registry, f, indent=2)
    
    # Stats
    print()
    print("=" * 50)
    print("📊 FINAL STATS")
    print(f"  Initial APIs: {stats['initial']}")
    print(f"  New APIs added: {stats['added']}")
    print(f"  Duplicates skipped: {stats['duplicates']}")
    print(f"  Errors: {stats['errors']}")
    print(f"  TOTAL: {registry['count']} APIs")
    print("=" * 50)
    
    if registry["count"] >= 20000:
        print("🎉 SUCCESS! Reached 20,000+ APIs!")
    else:
        print(f"📈 Need {20000 - registry['count']} more APIs to reach goal")

if __name__ == "__main__":
    main()
