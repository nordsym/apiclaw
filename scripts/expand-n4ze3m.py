#!/usr/bin/env python3
"""
APIClaw Expansion: Parse n4ze3m/public-apis (includes ML/AI focus)
"""
import json
import re
from pathlib import Path

registry_path = Path(__file__).parent.parent / 'src/registry/apis.json'

# Load existing registry
with open(registry_path) as f:
    registry = json.load(f)

existing_ids = {a['id'].lower() for a in registry['apis']}
existing_links = {a.get('link', '').lower().rstrip('/') for a in registry['apis']}
existing_names = {a['name'].lower() for a in registry['apis']}

def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug[:50] if len(slug) > 50 else slug

def add_api(name, desc, category, link, auth='None', https=True, cors='unknown'):
    api_id = make_id(name)
    
    if api_id in existing_ids:
        return False
    if link.lower().rstrip('/') in existing_links:
        return False
    if name.lower() in existing_names:
        return False
    
    keywords = [category.lower()]
    desc_lower = desc.lower()
    if 'free' in desc_lower:
        keywords.append('free')
    if 'ai' in desc_lower or 'machine learning' in desc_lower:
        keywords.append('ai')
    if 'api' in desc_lower:
        keywords.append('api')
    
    registry['apis'].append({
        'id': api_id,
        'name': name,
        'description': desc[:500],
        'category': category,
        'auth': auth,
        'https': https,
        'cors': cors,
        'link': link,
        'pricing': 'unknown',
        'keywords': list(set(keywords)),
        'source': 'n4ze3m-public-apis'
    })
    existing_ids.add(api_id)
    existing_links.add(link.lower().rstrip('/'))
    existing_names.add(name.lower())
    return True

added = 0

# From n4ze3m/public-apis - extracted unique AI/ML focused ones
apis = [
    # AI & Machine Learning
    ("Anthropic Claude", "Claude AI assistant API for text generation and analysis", "AI", "https://docs.anthropic.com/claude/reference/getting-started-with-the-api"),
    ("Cohere", "Natural language processing with generate, embed, classify", "AI", "https://docs.cohere.com/"),
    ("AI21 Labs", "Jurassic language models for text generation", "AI", "https://docs.ai21.com/"),
    ("Stability AI", "Stable Diffusion and other image generation models", "AI", "https://platform.stability.ai/docs/api-reference"),
    ("RunwayML", "AI-powered creative tools API", "AI", "https://docs.runwayml.com/"),
    ("Mistral AI", "Open-weight large language models API", "AI", "https://docs.mistral.ai/"),
    ("Perplexity AI", "AI-powered search and answer engine API", "AI", "https://docs.perplexity.ai/"),
    ("Together AI", "Run open-source models at scale", "AI", "https://docs.together.ai/"),
    ("Fireworks AI", "Fast inference for open-source models", "AI", "https://readme.fireworks.ai/"),
    ("Anyscale", "Scalable AI application platform", "AI", "https://docs.anyscale.com/"),
    ("Groq", "Ultra-fast LLM inference using LPU hardware", "AI", "https://console.groq.com/docs"),
    ("Modal", "Serverless infrastructure for AI applications", "AI", "https://modal.com/docs"),
    ("Banana", "ML model hosting and inference", "AI", "https://docs.banana.dev/"),
    ("Baseten", "Deploy and scale ML models", "AI", "https://docs.baseten.co/"),
    ("Cerebrium", "Serverless GPU infrastructure for ML", "AI", "https://docs.cerebrium.ai/"),
    ("Lepton AI", "AI infrastructure for developers", "AI", "https://www.lepton.ai/docs"),
    ("Octoai", "GenAI infrastructure platform", "AI", "https://docs.octoai.cloud/"),
    ("Deepgram", "Speech recognition and transcription API", "AI", "https://developers.deepgram.com/"),
    ("AssemblyAI", "Speech-to-text and audio intelligence API", "AI", "https://www.assemblyai.com/docs"),
    ("Speechmatics", "Automatic speech recognition API", "AI", "https://docs.speechmatics.com/"),
    ("Rev AI", "Speech recognition and transcription", "AI", "https://docs.rev.ai/"),
    ("Symbl.ai", "Conversation intelligence and insights API", "AI", "https://docs.symbl.ai/"),
    ("Hume AI", "Expressive and empathic AI", "AI", "https://dev.hume.ai/docs"),
    ("LangSmith", "LLM application observability and testing", "AI", "https://docs.smith.langchain.com/"),
    ("Weights & Biases", "ML experiment tracking and model management", "AI", "https://docs.wandb.ai/"),
    ("Galileo", "LLM observability and evaluation", "AI", "https://docs.galileo.ai/"),
    ("Arthur AI", "ML performance monitoring", "AI", "https://docs.arthur.ai/"),
    ("Arize AI", "ML observability platform", "AI", "https://docs.arize.com/"),
    ("Gantry", "ML model evaluation and monitoring", "AI", "https://docs.gantry.io/"),
    ("WhyLabs", "AI observability and monitoring", "AI", "https://docs.whylabs.ai/"),
    ("Scale AI", "AI training data platform", "AI", "https://scale.com/docs"),
    ("Snorkel AI", "Data labeling and model development", "AI", "https://snorkel.ai/platform/"),
    ("Labelbox", "Training data platform for AI", "AI", "https://docs.labelbox.com/"),
    ("Roboflow", "Computer vision model training and deployment", "AI", "https://docs.roboflow.com/"),
    ("Landing AI", "Visual inspection and computer vision", "AI", "https://landing.ai/platform/"),
    ("Clarifai", "AI platform for computer vision and NLP", "AI", "https://docs.clarifai.com/"),
    ("Sightengine", "Image and video moderation API", "AI", "https://sightengine.com/docs/"),
    ("Eden AI", "Unified AI API for multiple providers", "AI", "https://docs.edenai.co/"),
    ("Relevance AI", "AI-powered document processing and analytics", "AI", "https://docs.relevanceai.com/"),
    ("Coactive AI", "Visual data understanding platform", "AI", "https://coactive.ai/developers"),
    ("Twelve Labs", "Video understanding API", "AI", "https://docs.twelvelabs.io/"),
    ("Luma AI", "3D capture and generation API", "AI", "https://lumalabs.ai/api"),
    ("Meshy", "Text to 3D and image to 3D generation", "AI", "https://docs.meshy.ai/"),
    ("Kaedim", "2D to 3D model generation", "AI", "https://www.kaedim3d.com/api"),
    ("Scenario", "Game asset generation with AI", "AI", "https://docs.scenario.com/"),
    ("Leonardo AI", "AI image generation for games and design", "AI", "https://docs.leonardo.ai/"),
    ("Krea AI", "Real-time AI generation tools", "AI", "https://www.krea.ai/docs"),
    ("Pika Labs", "AI video generation platform", "AI", "https://pika.art/"),
    ("Descript", "AI-powered audio and video editing", "AI", "https://www.descript.com/developers"),
    ("Papercup", "AI dubbing and video translation", "AI", "https://www.papercup.com/developers"),
    
    # Vector Databases
    ("Pinecone", "Vector database for ML applications", "Database", "https://docs.pinecone.io/"),
    ("Weaviate", "Open-source vector database", "Database", "https://weaviate.io/developers/weaviate"),
    ("Qdrant", "Vector similarity search engine", "Database", "https://qdrant.tech/documentation/"),
    ("Milvus", "Open-source vector database for AI", "Database", "https://milvus.io/docs"),
    ("Chroma", "Open-source embedding database", "Database", "https://docs.trychroma.com/"),
    ("Vespa", "Search and recommendation system", "Database", "https://docs.vespa.ai/"),
    ("Zilliz Cloud", "Managed vector database service", "Database", "https://docs.zilliz.com/"),
    
    # RAG & Knowledge
    ("LlamaIndex", "Data framework for LLM applications", "AI", "https://docs.llamaindex.ai/"),
    ("LangChain", "Framework for developing LLM applications", "AI", "https://python.langchain.com/docs/"),
    ("Haystack", "Open-source framework for building NLP apps", "AI", "https://docs.haystack.deepset.ai/"),
    ("Vectara", "GenAI platform with RAG as a service", "AI", "https://docs.vectara.com/"),
    ("Unstructured", "Data preprocessing for LLMs", "AI", "https://unstructured-io.github.io/unstructured/"),
    ("Jina AI", "Multimodal AI for search and generation", "AI", "https://docs.jina.ai/"),
    ("Marvin", "AI engineering framework by Prefect", "AI", "https://www.askmarvin.ai/docs/"),
    ("Instructor", "Structured extraction from LLMs", "AI", "https://jxnl.github.io/instructor/"),
    ("Outlines", "Structured generation with LLMs", "AI", "https://outlines-dev.github.io/outlines/"),
    ("Guidance", "Efficient structured prompting", "AI", "https://github.com/guidance-ai/guidance"),
    ("DSPy", "Programming framework for LLMs", "AI", "https://dspy-docs.vercel.app/"),
    
    # Code & Development AI
    ("Codeium", "AI-powered code completion", "AI", "https://codeium.com/api"),
    ("Tabnine", "AI code assistant", "AI", "https://www.tabnine.com/developers"),
    ("Sourcegraph Cody", "AI coding assistant with code search", "AI", "https://sourcegraph.com/docs/cody"),
    ("Replit", "Cloud development environment with AI", "Development", "https://docs.replit.com/"),
    ("Codestral", "Mistral's code generation model", "AI", "https://docs.mistral.ai/capabilities/code_generation/"),
    
    # More unique APIs
    ("Abstract API", "Collection of APIs for validation and enrichment", "Utility", "https://www.abstractapi.com/docs"),
    ("APILayer", "Marketplace of curated APIs", "Platform", "https://apilayer.com/"),
    ("Apify", "Web scraping and automation platform", "Automation", "https://docs.apify.com/"),
    ("BrowserStack", "Cross-browser testing platform", "Development", "https://www.browserstack.com/docs"),
    ("SerpApi", "Search engine results page scraping", "Search", "https://serpapi.com/"),
    ("ScrapingBee", "Web scraping API", "Automation", "https://www.scrapingbee.com/documentation/"),
    ("Oxylabs", "Web scraping infrastructure", "Automation", "https://developers.oxylabs.io/"),
    ("Brightdata", "Web data platform", "Data", "https://docs.brightdata.com/"),
    ("Diffbot", "AI-powered web data extraction", "Data", "https://docs.diffbot.com/"),
    ("Kapiche", "Text analytics platform", "Analytics", "https://www.kapiche.com/api"),
    ("Rasa", "Open-source conversational AI", "AI", "https://rasa.com/docs/"),
    ("Botpress", "Open-source chatbot platform", "AI", "https://botpress.com/docs"),
    ("Voiceflow", "Conversation design platform", "AI", "https://developer.voiceflow.com/"),
    ("Typebot", "Open-source conversational forms", "AI", "https://docs.typebot.io/"),
    ("Dify", "LLM application development platform", "AI", "https://docs.dify.ai/"),
    ("Flowise", "Open-source LLM flow builder", "AI", "https://docs.flowiseai.com/"),
    ("Stack AI", "No-code AI workflow builder", "AI", "https://docs.stack-ai.com/"),
    
    # Fintech
    ("Wise", "International money transfer API", "Finance", "https://api-docs.wise.com/"),
    ("Mercury", "Business banking API", "Finance", "https://docs.mercury.com/"),
    ("Modern Treasury", "Payment operations platform", "Finance", "https://docs.moderntreasury.com/"),
    ("Moov", "Money movement infrastructure", "Finance", "https://docs.moov.io/"),
    ("Unit", "Banking-as-a-service platform", "Finance", "https://docs.unit.co/"),
    ("Treasury Prime", "Banking-as-a-service API", "Finance", "https://docs.treasuryprime.com/"),
    ("Column", "Developer-first bank", "Finance", "https://column.com/docs"),
    ("Brex", "Business finance platform API", "Finance", "https://developer.brex.com/"),
    ("Ramp", "Corporate cards and spend management", "Finance", "https://docs.ramp.com/"),
    ("Marqeta", "Modern card issuing platform", "Finance", "https://www.marqeta.com/docs/"),
    ("Lithic", "Card issuing and processing", "Finance", "https://docs.lithic.com/"),
    ("Bond", "Embedded finance platform", "Finance", "https://docs.bond.tech/"),
    ("Alloy", "Identity verification and fraud prevention", "Finance", "https://docs.alloy.com/"),
    ("Plaid Identity", "Identity verification via bank login", "Finance", "https://plaid.com/docs/identity-verification/"),
    ("Persona", "Identity verification infrastructure", "Finance", "https://docs.withpersona.com/"),
    ("Sardine", "Fraud prevention platform", "Finance", "https://docs.sardine.ai/"),
    ("Seon", "Fraud detection API", "Finance", "https://docs.seon.io/"),
]

for name, desc, category, link in apis:
    if add_api(name, desc, category, link):
        added += 1

# Update metadata
registry['count'] = len(registry['apis'])
registry['lastUpdated'] = '2026-02-22'

# Write back
with open(registry_path, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✅ APIClaw n4ze3m/AI-focused Expansion Complete")
print(f"   Added: {added} new APIs")
print(f"   Total: {registry['count']} APIs")
