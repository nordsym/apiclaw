#!/usr/bin/env python3
"""
APIClaw 2026 Night Batch - Additional APIs from curated sources
Focus: Modern/2024-2026 APIs that may not be in older lists
"""

import json
import re
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def load_registry() -> dict:
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry: dict):
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

def get_existing_ids(registry: dict) -> set:
    return {api['id'] for api in registry['apis']}

# Modern APIs from 2024-2026
MODERN_APIS = [
    # === AI/ML 2024-2026 ===
    {"name": "Anthropic Claude API", "description": "Claude AI models API for conversation and analysis", "category": "AI/ML", "link": "https://docs.anthropic.com/en/api/getting-started", "auth": "apiKey"},
    {"name": "Mistral AI", "description": "Open-weight LLMs with API access", "category": "AI/ML", "link": "https://docs.mistral.ai/", "auth": "apiKey"},
    {"name": "Perplexity API", "description": "AI-powered search and question answering", "category": "AI/ML", "link": "https://docs.perplexity.ai/", "auth": "apiKey"},
    {"name": "Groq API", "description": "Ultra-fast LLM inference", "category": "AI/ML", "link": "https://console.groq.com/docs/quickstart", "auth": "apiKey"},
    {"name": "Together AI", "description": "Open source AI models API", "category": "AI/ML", "link": "https://docs.together.ai/", "auth": "apiKey"},
    {"name": "Replicate", "description": "Run ML models in the cloud", "category": "AI/ML", "link": "https://replicate.com/docs", "auth": "apiKey"},
    {"name": "Hugging Face Inference", "description": "Run ML models via API", "category": "AI/ML", "link": "https://huggingface.co/docs/api-inference/", "auth": "apiKey"},
    {"name": "Stability AI", "description": "Stable Diffusion and generative AI", "category": "AI/ML", "link": "https://platform.stability.ai/docs/api-reference", "auth": "apiKey"},
    {"name": "Leonardo AI", "description": "AI image generation API", "category": "AI/ML", "link": "https://docs.leonardo.ai/", "auth": "apiKey"},
    {"name": "Ideogram API", "description": "AI image generation with text rendering", "category": "AI/ML", "link": "https://api.ideogram.ai/docs", "auth": "apiKey"},
    {"name": "Midjourney API", "description": "AI image generation (unofficial)", "category": "AI/ML", "link": "https://docs.midjourney.com/", "auth": "apiKey"},
    {"name": "ElevenLabs", "description": "AI voice generation and cloning", "category": "AI/ML", "link": "https://elevenlabs.io/docs/api-reference/", "auth": "apiKey"},
    {"name": "PlayHT", "description": "AI voice generation", "category": "AI/ML", "link": "https://docs.play.ht/", "auth": "apiKey"},
    {"name": "Resemble AI", "description": "AI voice cloning and synthesis", "category": "AI/ML", "link": "https://docs.resemble.ai/", "auth": "apiKey"},
    {"name": "Descript API", "description": "AI audio/video editing", "category": "AI/ML", "link": "https://www.descript.com/api", "auth": "apiKey"},
    {"name": "Runway ML", "description": "AI video generation and editing", "category": "AI/ML", "link": "https://docs.runwayml.com/", "auth": "apiKey"},
    {"name": "Pika Labs", "description": "AI video generation", "category": "AI/ML", "link": "https://pika.art/", "auth": "apiKey"},
    {"name": "Suno AI", "description": "AI music generation", "category": "AI/ML", "link": "https://suno.ai/", "auth": "apiKey"},
    {"name": "Udio", "description": "AI music generation", "category": "AI/ML", "link": "https://www.udio.com/", "auth": "apiKey"},
    {"name": "Luma AI", "description": "3D capture and AI video", "category": "AI/ML", "link": "https://lumalabs.ai/", "auth": "apiKey"},
    {"name": "Cursor AI", "description": "AI code editor API", "category": "AI/ML", "link": "https://cursor.sh/", "auth": "apiKey"},
    {"name": "GitHub Copilot API", "description": "AI pair programming", "category": "AI/ML", "link": "https://docs.github.com/en/copilot", "auth": "apiKey"},
    {"name": "Codeium", "description": "Free AI code completion", "category": "AI/ML", "link": "https://codeium.com/docs", "auth": "apiKey"},
    {"name": "Tabnine", "description": "AI code completion", "category": "AI/ML", "link": "https://docs.tabnine.com/", "auth": "apiKey"},
    {"name": "Sourcegraph Cody", "description": "AI code assistant", "category": "AI/ML", "link": "https://docs.sourcegraph.com/cody", "auth": "apiKey"},
    {"name": "Continue", "description": "Open source AI code assistant", "category": "AI/ML", "link": "https://docs.continue.dev/", "auth": "none"},
    {"name": "Mem0", "description": "Memory layer for AI applications", "category": "AI/ML", "link": "https://docs.mem0.ai/", "auth": "apiKey"},
    {"name": "LangChain Hub", "description": "Discover and share LLM prompts", "category": "AI/ML", "link": "https://docs.smith.langchain.com/", "auth": "apiKey"},
    {"name": "Pinecone", "description": "Vector database for AI", "category": "AI/ML", "link": "https://docs.pinecone.io/", "auth": "apiKey"},
    {"name": "Weaviate", "description": "Open source vector database", "category": "AI/ML", "link": "https://weaviate.io/developers/weaviate", "auth": "apiKey"},
    {"name": "Qdrant", "description": "Vector database for AI", "category": "AI/ML", "link": "https://qdrant.tech/documentation/", "auth": "apiKey"},
    {"name": "Chroma", "description": "Open source embedding database", "category": "AI/ML", "link": "https://docs.trychroma.com/", "auth": "none"},
    {"name": "Milvus", "description": "Vector database for similarity search", "category": "AI/ML", "link": "https://milvus.io/docs", "auth": "none"},
    
    # === Databases 2024-2026 ===
    {"name": "Supabase", "description": "Open source Firebase alternative", "category": "Databases", "link": "https://supabase.com/docs/reference", "auth": "apiKey"},
    {"name": "Convex", "description": "Fullstack TypeScript platform", "category": "Databases", "link": "https://docs.convex.dev/", "auth": "apiKey"},
    {"name": "Xata", "description": "Serverless database built on Postgres", "category": "Databases", "link": "https://xata.io/docs", "auth": "apiKey"},
    {"name": "EdgeDB", "description": "Graph-relational database", "category": "Databases", "link": "https://www.edgedb.com/docs/", "auth": "apiKey"},
    {"name": "CockroachDB", "description": "Distributed SQL database", "category": "Databases", "link": "https://www.cockroachlabs.com/docs/", "auth": "apiKey"},
    {"name": "TiDB", "description": "Distributed HTAP database", "category": "Databases", "link": "https://docs.pingcap.com/", "auth": "apiKey"},
    {"name": "SingleStore", "description": "Distributed SQL database", "category": "Databases", "link": "https://docs.singlestore.com/", "auth": "apiKey"},
    {"name": "Drizzle ORM", "description": "TypeScript ORM for SQL", "category": "Databases", "link": "https://orm.drizzle.team/docs/overview", "auth": "none"},
    {"name": "Prisma", "description": "Next-gen Node.js ORM", "category": "Databases", "link": "https://www.prisma.io/docs/", "auth": "none"},
    {"name": "Upstash", "description": "Serverless Redis and Kafka", "category": "Databases", "link": "https://docs.upstash.com/", "auth": "apiKey"},
    {"name": "Deno KV", "description": "Key-value store for Deno Deploy", "category": "Databases", "link": "https://docs.deno.com/kv/manual/", "auth": "apiKey"},
    {"name": "Momento", "description": "Serverless cache", "category": "Databases", "link": "https://docs.momentohq.com/", "auth": "apiKey"},
    
    # === Auth 2024-2026 ===
    {"name": "Clerk", "description": "Complete user management", "category": "Authentication", "link": "https://clerk.com/docs", "auth": "apiKey"},
    {"name": "Auth.js", "description": "Authentication for the web", "category": "Authentication", "link": "https://authjs.dev/getting-started/introduction", "auth": "none"},
    {"name": "Lucia Auth", "description": "Simple session-based auth", "category": "Authentication", "link": "https://lucia-auth.com/", "auth": "none"},
    {"name": "Kinde", "description": "Authentication and authorization", "category": "Authentication", "link": "https://docs.kinde.com/", "auth": "apiKey"},
    {"name": "Stytch", "description": "Authentication infrastructure", "category": "Authentication", "link": "https://stytch.com/docs", "auth": "apiKey"},
    {"name": "FusionAuth", "description": "Customer identity platform", "category": "Authentication", "link": "https://fusionauth.io/docs/", "auth": "apiKey"},
    {"name": "Descope", "description": "Passwordless authentication", "category": "Authentication", "link": "https://docs.descope.com/", "auth": "apiKey"},
    {"name": "Hanko", "description": "Passkey-first authentication", "category": "Authentication", "link": "https://docs.hanko.io/", "auth": "apiKey"},
    {"name": "Ory", "description": "Open source identity platform", "category": "Authentication", "link": "https://www.ory.sh/docs/", "auth": "apiKey"},
    {"name": "SuperTokens", "description": "Open source authentication", "category": "Authentication", "link": "https://supertokens.com/docs/", "auth": "apiKey"},
    
    # === Payments 2024-2026 ===
    {"name": "Polar", "description": "Monetization for developers", "category": "Payments", "link": "https://docs.polar.sh/", "auth": "apiKey"},
    {"name": "Lemon Squeezy", "description": "Payments for digital products", "category": "Payments", "link": "https://docs.lemonsqueezy.com/", "auth": "apiKey"},
    {"name": "Paddle", "description": "Revenue delivery platform", "category": "Payments", "link": "https://developer.paddle.com/", "auth": "apiKey"},
    {"name": "Chargebee", "description": "Subscription billing", "category": "Payments", "link": "https://www.chargebee.com/docs/", "auth": "apiKey"},
    {"name": "Recurly", "description": "Subscription management", "category": "Payments", "link": "https://developers.recurly.com/", "auth": "apiKey"},
    {"name": "Lago", "description": "Open source metering and billing", "category": "Payments", "link": "https://docs.getlago.com/", "auth": "apiKey"},
    {"name": "Hyperline", "description": "Usage-based billing", "category": "Payments", "link": "https://docs.hyperline.co/", "auth": "apiKey"},
    {"name": "Cryptomus", "description": "Crypto payment gateway", "category": "Payments", "link": "https://doc.cryptomus.com/", "auth": "apiKey"},
    {"name": "NOWPayments", "description": "Crypto payment gateway", "category": "Payments", "link": "https://nowpayments.io/doc/", "auth": "apiKey"},
    {"name": "BTCPay Server", "description": "Self-hosted crypto payments", "category": "Payments", "link": "https://docs.btcpayserver.org/", "auth": "apiKey"},
    
    # === Email 2024-2026 ===
    {"name": "Resend", "description": "Email API for developers", "category": "Email", "link": "https://resend.com/docs/api-reference/introduction", "auth": "apiKey"},
    {"name": "Postmark", "description": "Transactional email service", "category": "Email", "link": "https://postmarkapp.com/developer", "auth": "apiKey"},
    {"name": "Loops", "description": "Email for SaaS", "category": "Email", "link": "https://loops.so/docs/api-reference", "auth": "apiKey"},
    {"name": "Plunk", "description": "Open source email platform", "category": "Email", "link": "https://docs.useplunk.com/", "auth": "apiKey"},
    {"name": "Buttondown", "description": "Newsletter platform API", "category": "Email", "link": "https://api.buttondown.email/v1/docs", "auth": "apiKey"},
    {"name": "ConvertKit", "description": "Creator email marketing", "category": "Email", "link": "https://developers.convertkit.com/", "auth": "apiKey"},
    {"name": "Mailersend", "description": "Transactional email API", "category": "Email", "link": "https://developers.mailersend.com/", "auth": "apiKey"},
    {"name": "Mailpace", "description": "Transactional email", "category": "Email", "link": "https://docs.mailpace.com/", "auth": "apiKey"},
    
    # === Communication 2024-2026 ===
    {"name": "Novu", "description": "Open source notifications", "category": "Communication", "link": "https://docs.novu.co/", "auth": "apiKey"},
    {"name": "Knock", "description": "Notifications infrastructure", "category": "Communication", "link": "https://docs.knock.app/", "auth": "apiKey"},
    {"name": "Courier", "description": "Multi-channel notifications", "category": "Communication", "link": "https://www.courier.com/docs/", "auth": "apiKey"},
    {"name": "MagicBell", "description": "In-app notifications", "category": "Communication", "link": "https://www.magicbell.com/docs", "auth": "apiKey"},
    {"name": "Engagespot", "description": "In-app notification center", "category": "Communication", "link": "https://docs.engagespot.co/", "auth": "apiKey"},
    {"name": "Ably", "description": "Realtime messaging infrastructure", "category": "Communication", "link": "https://ably.com/docs/", "auth": "apiKey"},
    {"name": "Pusher", "description": "Realtime notifications", "category": "Communication", "link": "https://pusher.com/docs/", "auth": "apiKey"},
    {"name": "Stream Chat", "description": "In-app messaging SDK", "category": "Communication", "link": "https://getstream.io/chat/docs/", "auth": "apiKey"},
    {"name": "Sendbird", "description": "Chat, voice, video API", "category": "Communication", "link": "https://sendbird.com/docs/", "auth": "apiKey"},
    {"name": "Livekit", "description": "Open source video/audio", "category": "Communication", "link": "https://docs.livekit.io/", "auth": "apiKey"},
    {"name": "Daily.co", "description": "Video call API", "category": "Communication", "link": "https://docs.daily.co/", "auth": "apiKey"},
    {"name": "Whereby", "description": "Video meetings API", "category": "Communication", "link": "https://whereby.dev/", "auth": "apiKey"},
    
    # === CMS 2024-2026 ===
    {"name": "Payload CMS", "description": "Headless CMS with code-first", "category": "CMS", "link": "https://payloadcms.com/docs", "auth": "apiKey"},
    {"name": "Sanity", "description": "Structured content platform", "category": "CMS", "link": "https://www.sanity.io/docs", "auth": "apiKey"},
    {"name": "Directus", "description": "Open data platform", "category": "CMS", "link": "https://docs.directus.io/", "auth": "apiKey"},
    {"name": "Strapi", "description": "Open source headless CMS", "category": "CMS", "link": "https://docs.strapi.io/", "auth": "apiKey"},
    {"name": "Builder.io", "description": "Headless visual CMS", "category": "CMS", "link": "https://www.builder.io/c/docs/", "auth": "apiKey"},
    {"name": "Storyblok", "description": "Headless CMS", "category": "CMS", "link": "https://www.storyblok.com/docs/", "auth": "apiKey"},
    {"name": "Hygraph", "description": "GraphQL headless CMS", "category": "CMS", "link": "https://hygraph.com/docs", "auth": "apiKey"},
    {"name": "Contentful", "description": "Content platform", "category": "CMS", "link": "https://www.contentful.com/developers/docs/", "auth": "apiKey"},
    {"name": "Ghost CMS", "description": "Publishing platform", "category": "CMS", "link": "https://ghost.org/docs/content-api/", "auth": "apiKey"},
    {"name": "Keystatic", "description": "Git-based CMS", "category": "CMS", "link": "https://keystatic.com/docs", "auth": "none"},
    {"name": "Tinacms", "description": "Git-backed headless CMS", "category": "CMS", "link": "https://tina.io/docs/", "auth": "apiKey"},
    {"name": "Outstatic", "description": "Static CMS for Next.js", "category": "CMS", "link": "https://outstatic.com/docs/", "auth": "none"},
    
    # === Analytics 2024-2026 ===
    {"name": "PostHog", "description": "Open source product analytics", "category": "Analytics", "link": "https://posthog.com/docs/api", "auth": "apiKey"},
    {"name": "Plausible", "description": "Privacy-friendly analytics", "category": "Analytics", "link": "https://plausible.io/docs/", "auth": "apiKey"},
    {"name": "Umami", "description": "Open source web analytics", "category": "Analytics", "link": "https://umami.is/docs/", "auth": "apiKey"},
    {"name": "Pirsch", "description": "Privacy-focused analytics", "category": "Analytics", "link": "https://docs.pirsch.io/", "auth": "apiKey"},
    {"name": "Fathom", "description": "Privacy-first analytics", "category": "Analytics", "link": "https://usefathom.com/docs/", "auth": "apiKey"},
    {"name": "Simple Analytics", "description": "Privacy-first analytics", "category": "Analytics", "link": "https://docs.simpleanalytics.com/", "auth": "apiKey"},
    {"name": "June", "description": "Product analytics for B2B SaaS", "category": "Analytics", "link": "https://www.june.so/docs/", "auth": "apiKey"},
    {"name": "Mixpanel", "description": "Product analytics", "category": "Analytics", "link": "https://developer.mixpanel.com/", "auth": "apiKey"},
    {"name": "Amplitude", "description": "Digital analytics platform", "category": "Analytics", "link": "https://www.docs.developers.amplitude.com/", "auth": "apiKey"},
    {"name": "Heap", "description": "Auto-capture analytics", "category": "Analytics", "link": "https://developers.heap.io/", "auth": "apiKey"},
    {"name": "LogSnag", "description": "Event tracking for devs", "category": "Analytics", "link": "https://docs.logsnag.com/", "auth": "apiKey"},
    {"name": "Highlight.io", "description": "Session replay and monitoring", "category": "Analytics", "link": "https://www.highlight.io/docs/", "auth": "apiKey"},
    
    # === Monitoring 2024-2026 ===
    {"name": "Sentry", "description": "Error tracking and monitoring", "category": "Monitoring", "link": "https://docs.sentry.io/", "auth": "apiKey"},
    {"name": "BetterStack", "description": "Logging and monitoring", "category": "Monitoring", "link": "https://betterstack.com/docs/", "auth": "apiKey"},
    {"name": "Grafana Cloud", "description": "Observability platform", "category": "Monitoring", "link": "https://grafana.com/docs/", "auth": "apiKey"},
    {"name": "Axiom", "description": "Log management", "category": "Monitoring", "link": "https://axiom.co/docs/", "auth": "apiKey"},
    {"name": "Checkly", "description": "Synthetic monitoring", "category": "Monitoring", "link": "https://www.checklyhq.com/docs/", "auth": "apiKey"},
    {"name": "Cronitor", "description": "Cron job monitoring", "category": "Monitoring", "link": "https://cronitor.io/docs/", "auth": "apiKey"},
    {"name": "Datadog", "description": "Cloud monitoring", "category": "Monitoring", "link": "https://docs.datadoghq.com/api/", "auth": "apiKey"},
    {"name": "New Relic", "description": "Observability platform", "category": "Monitoring", "link": "https://docs.newrelic.com/docs/apis/", "auth": "apiKey"},
    {"name": "Instatus", "description": "Status page service", "category": "Monitoring", "link": "https://instatus.com/help/api", "auth": "apiKey"},
    {"name": "Openstatus", "description": "Open source status page", "category": "Monitoring", "link": "https://docs.openstatus.dev/", "auth": "apiKey"},
    {"name": "Incident.io", "description": "Incident management", "category": "Monitoring", "link": "https://api-docs.incident.io/", "auth": "apiKey"},
    
    # === Search 2024-2026 ===
    {"name": "Typesense", "description": "Open source search engine", "category": "Search", "link": "https://typesense.org/docs/", "auth": "apiKey"},
    {"name": "Meilisearch", "description": "Fast search API", "category": "Search", "link": "https://www.meilisearch.com/docs/", "auth": "apiKey"},
    {"name": "Algolia", "description": "Search and discovery API", "category": "Search", "link": "https://www.algolia.com/doc/", "auth": "apiKey"},
    {"name": "Elasticsearch", "description": "Distributed search engine", "category": "Search", "link": "https://www.elastic.co/guide/", "auth": "apiKey"},
    {"name": "Orama", "description": "Full-text search engine", "category": "Search", "link": "https://docs.oramasearch.com/", "auth": "apiKey"},
    {"name": "Zinc Search", "description": "Lightweight search engine", "category": "Search", "link": "https://zincsearch.com/docs/", "auth": "apiKey"},
    
    # === Developer Tools 2024-2026 ===
    {"name": "Vercel", "description": "Frontend cloud platform", "category": "Development", "link": "https://vercel.com/docs/rest-api", "auth": "apiKey"},
    {"name": "Netlify", "description": "Web development platform", "category": "Development", "link": "https://docs.netlify.com/api/", "auth": "apiKey"},
    {"name": "Railway", "description": "Infrastructure platform", "category": "Development", "link": "https://docs.railway.app/reference/public-api", "auth": "apiKey"},
    {"name": "Render", "description": "Cloud application platform", "category": "Development", "link": "https://api-docs.render.com/", "auth": "apiKey"},
    {"name": "Fly.io", "description": "App deployment platform", "category": "Development", "link": "https://fly.io/docs/machines/api/", "auth": "apiKey"},
    {"name": "Coolify", "description": "Self-hostable Heroku alternative", "category": "Development", "link": "https://coolify.io/docs/", "auth": "apiKey"},
    {"name": "SST", "description": "Serverless framework", "category": "Development", "link": "https://docs.sst.dev/", "auth": "none"},
    {"name": "Pulumi", "description": "Infrastructure as code", "category": "Development", "link": "https://www.pulumi.com/docs/", "auth": "apiKey"},
    {"name": "Terraform Cloud", "description": "Infrastructure automation", "category": "Development", "link": "https://developer.hashicorp.com/terraform/cloud-docs/api-docs", "auth": "apiKey"},
    {"name": "Doppler", "description": "Secret management", "category": "Development", "link": "https://docs.doppler.com/reference/api", "auth": "apiKey"},
    {"name": "Infisical", "description": "Open source secret management", "category": "Development", "link": "https://infisical.com/docs/api-reference/", "auth": "apiKey"},
    {"name": "Hashicorp Vault", "description": "Secret management", "category": "Development", "link": "https://developer.hashicorp.com/vault/api-docs", "auth": "apiKey"},
    {"name": "Trigger.dev", "description": "Background jobs", "category": "Development", "link": "https://trigger.dev/docs/", "auth": "apiKey"},
    {"name": "Inngest", "description": "Event-driven background jobs", "category": "Development", "link": "https://www.inngest.com/docs/", "auth": "apiKey"},
    {"name": "Temporal", "description": "Workflow orchestration", "category": "Development", "link": "https://docs.temporal.io/", "auth": "apiKey"},
    {"name": "Prefect", "description": "Workflow orchestration", "category": "Development", "link": "https://docs.prefect.io/", "auth": "apiKey"},
    {"name": "Dagster", "description": "Data orchestration", "category": "Development", "link": "https://docs.dagster.io/", "auth": "apiKey"},
    {"name": "Windmill", "description": "Developer platform for workflows", "category": "Development", "link": "https://docs.windmill.dev/", "auth": "apiKey"},
    {"name": "n8n", "description": "Workflow automation", "category": "Development", "link": "https://docs.n8n.io/api/", "auth": "apiKey"},
    {"name": "Pipedream", "description": "Integration platform", "category": "Development", "link": "https://pipedream.com/docs/api/", "auth": "apiKey"},
    {"name": "Activepieces", "description": "Open source automation", "category": "Development", "link": "https://www.activepieces.com/docs/", "auth": "apiKey"},
    
    # === File Storage 2024-2026 ===
    {"name": "Uploadthing", "description": "File uploads for TypeScript", "category": "Cloud Storage", "link": "https://docs.uploadthing.com/", "auth": "apiKey"},
    {"name": "Filebase", "description": "Web3 object storage", "category": "Cloud Storage", "link": "https://docs.filebase.com/", "auth": "apiKey"},
    {"name": "Backblaze B2", "description": "Cloud object storage", "category": "Cloud Storage", "link": "https://www.backblaze.com/b2/docs/", "auth": "apiKey"},
    {"name": "Wasabi", "description": "Cloud object storage", "category": "Cloud Storage", "link": "https://wasabi.com/developers/", "auth": "apiKey"},
    {"name": "Tigris", "description": "Globally distributed S3 storage", "category": "Cloud Storage", "link": "https://www.tigrisdata.com/docs/", "auth": "apiKey"},
    {"name": "MinIO", "description": "S3 compatible object storage", "category": "Cloud Storage", "link": "https://min.io/docs/minio/linux/developers/minio-drivers.html", "auth": "apiKey"},
    {"name": "Bunny CDN", "description": "CDN and storage", "category": "Cloud Storage", "link": "https://docs.bunny.net/", "auth": "apiKey"},
    
    # === Feature Flags 2024-2026 ===
    {"name": "LaunchDarkly", "description": "Feature management platform", "category": "Development", "link": "https://docs.launchdarkly.com/home/", "auth": "apiKey"},
    {"name": "Flagsmith", "description": "Open source feature flags", "category": "Development", "link": "https://docs.flagsmith.com/", "auth": "apiKey"},
    {"name": "GrowthBook", "description": "Open source A/B testing", "category": "Development", "link": "https://docs.growthbook.io/", "auth": "apiKey"},
    {"name": "Unleash", "description": "Open source feature flags", "category": "Development", "link": "https://docs.getunleash.io/", "auth": "apiKey"},
    {"name": "ConfigCat", "description": "Feature flags service", "category": "Development", "link": "https://configcat.com/docs/", "auth": "apiKey"},
    {"name": "Statsig", "description": "Feature flags and analytics", "category": "Development", "link": "https://docs.statsig.com/", "auth": "apiKey"},
    {"name": "Eppo", "description": "A/B testing platform", "category": "Development", "link": "https://docs.geteppo.com/", "auth": "apiKey"},
    
    # === Forms 2024-2026 ===
    {"name": "Tally", "description": "Form builder", "category": "Business", "link": "https://tally.so/help/developer-resources", "auth": "apiKey"},
    {"name": "Formbricks", "description": "Open source surveys", "category": "Business", "link": "https://formbricks.com/docs/", "auth": "apiKey"},
    {"name": "Fillout", "description": "Form builder", "category": "Business", "link": "https://www.fillout.com/docs", "auth": "apiKey"},
    {"name": "Formspree", "description": "Form backend", "category": "Business", "link": "https://formspree.io/docs/", "auth": "apiKey"},
    {"name": "Basin", "description": "Form backend", "category": "Business", "link": "https://usebasin.com/docs", "auth": "apiKey"},
    {"name": "Getform", "description": "Form endpoint service", "category": "Business", "link": "https://getform.io/docs", "auth": "apiKey"},
    
    # === Scheduling 2024-2026 ===
    {"name": "Cal.com", "description": "Open source scheduling", "category": "Business", "link": "https://cal.com/docs/", "auth": "apiKey"},
    {"name": "Calendly", "description": "Scheduling platform", "category": "Business", "link": "https://developer.calendly.com/", "auth": "apiKey"},
    {"name": "SavvyCal", "description": "Scheduling links", "category": "Business", "link": "https://docs.savvycal.com/", "auth": "apiKey"},
    {"name": "Nylas", "description": "Email and calendar API", "category": "Business", "link": "https://developer.nylas.com/", "auth": "apiKey"},
    {"name": "Cronofy", "description": "Calendar API", "category": "Business", "link": "https://docs.cronofy.com/", "auth": "apiKey"},
    
    # === Support 2024-2026 ===
    {"name": "Plain", "description": "Customer support API-first", "category": "Customer Support", "link": "https://www.plain.com/docs/api", "auth": "apiKey"},
    {"name": "Intercom", "description": "Customer messaging", "category": "Customer Support", "link": "https://developers.intercom.com/", "auth": "apiKey"},
    {"name": "Crisp", "description": "Customer messaging platform", "category": "Customer Support", "link": "https://docs.crisp.chat/", "auth": "apiKey"},
    {"name": "Chatwoot", "description": "Open source customer engagement", "category": "Customer Support", "link": "https://www.chatwoot.com/developers/api/", "auth": "apiKey"},
    {"name": "Tawk.to", "description": "Live chat", "category": "Customer Support", "link": "https://developer.tawk.to/", "auth": "apiKey"},
    {"name": "Help Scout", "description": "Customer support platform", "category": "Customer Support", "link": "https://developer.helpscout.com/", "auth": "apiKey"},
    {"name": "Freshdesk", "description": "Customer support software", "category": "Customer Support", "link": "https://developers.freshdesk.com/", "auth": "apiKey"},
    {"name": "Zendesk", "description": "Customer service software", "category": "Customer Support", "link": "https://developer.zendesk.com/", "auth": "apiKey"},
    
    # === Documentation 2024-2026 ===
    {"name": "Mintlify", "description": "Documentation platform", "category": "Documentation", "link": "https://mintlify.com/docs/", "auth": "apiKey"},
    {"name": "GitBook", "description": "Documentation platform", "category": "Documentation", "link": "https://developer.gitbook.com/", "auth": "apiKey"},
    {"name": "ReadMe", "description": "Developer documentation", "category": "Documentation", "link": "https://docs.readme.com/reference/", "auth": "apiKey"},
    {"name": "Archbee", "description": "Documentation for teams", "category": "Documentation", "link": "https://docs.archbee.com/", "auth": "apiKey"},
    {"name": "Swimm", "description": "Code documentation", "category": "Documentation", "link": "https://docs.swimm.io/", "auth": "apiKey"},
    
    # === Miscellaneous 2024-2026 ===
    {"name": "Apify", "description": "Web scraping platform", "category": "Development", "link": "https://docs.apify.com/api/v2", "auth": "apiKey"},
    {"name": "Crawlee", "description": "Web scraping library", "category": "Development", "link": "https://crawlee.dev/docs/", "auth": "none"},
    {"name": "ScrapingBee", "description": "Web scraping API", "category": "Development", "link": "https://www.scrapingbee.com/documentation/", "auth": "apiKey"},
    {"name": "Browserless", "description": "Headless browser service", "category": "Development", "link": "https://docs.browserless.io/", "auth": "apiKey"},
    {"name": "BrowserStack", "description": "Cross-browser testing", "category": "Development", "link": "https://www.browserstack.com/docs/", "auth": "apiKey"},
    {"name": "Sauce Labs", "description": "Testing platform", "category": "Development", "link": "https://docs.saucelabs.com/dev/api/", "auth": "apiKey"},
    {"name": "ScreenshotOne", "description": "Screenshot API", "category": "Development", "link": "https://screenshotone.com/docs/", "auth": "apiKey"},
    {"name": "urlbox", "description": "Screenshot API", "category": "Development", "link": "https://urlbox.io/docs", "auth": "apiKey"},
    {"name": "Browserless PDF", "description": "HTML to PDF API", "category": "Document", "link": "https://docs.browserless.io/docs/pdf.html", "auth": "apiKey"},
    {"name": "DocSpring", "description": "PDF generation API", "category": "Document", "link": "https://docspring.com/docs/", "auth": "apiKey"},
    {"name": "PDFShift", "description": "HTML to PDF API", "category": "Document", "link": "https://pdfshift.io/documentation", "auth": "apiKey"},
    {"name": "Bannerbear", "description": "Auto-generate images", "category": "Design", "link": "https://www.bannerbear.com/api/", "auth": "apiKey"},
    {"name": "Placid", "description": "Creative automation", "category": "Design", "link": "https://placid.app/docs", "auth": "apiKey"},
    {"name": "Abyssale", "description": "Banner generation API", "category": "Design", "link": "https://developer.abyssale.com/", "auth": "apiKey"},
    {"name": "Dub.co", "description": "Link management API", "category": "Utilities", "link": "https://dub.co/docs/api-reference", "auth": "apiKey"},
    {"name": "Short.io", "description": "URL shortener API", "category": "Utilities", "link": "https://developers.short.io/", "auth": "apiKey"},
    {"name": "Rebrandly", "description": "Branded link management", "category": "Utilities", "link": "https://developers.rebrandly.com/", "auth": "apiKey"},
    {"name": "IPinfo", "description": "IP geolocation API", "category": "Utilities", "link": "https://ipinfo.io/developers", "auth": "apiKey"},
    {"name": "IPify", "description": "Simple public IP API", "category": "Utilities", "link": "https://www.ipify.org/", "auth": "none"},
    {"name": "IP-API", "description": "IP geolocation API", "category": "Utilities", "link": "https://ip-api.com/docs/", "auth": "none"},
    {"name": "Abstract API", "description": "Suite of utility APIs", "category": "Utilities", "link": "https://www.abstractapi.com/docs/", "auth": "apiKey"},
    {"name": "IPdata", "description": "IP intelligence API", "category": "Utilities", "link": "https://docs.ipdata.co/", "auth": "apiKey"},
    {"name": "MaxMind GeoIP", "description": "IP geolocation", "category": "Utilities", "link": "https://dev.maxmind.com/geoip/", "auth": "apiKey"},
    {"name": "ZeroBounce", "description": "Email validation", "category": "Email", "link": "https://www.zerobounce.net/docs/", "auth": "apiKey"},
    {"name": "Hunter", "description": "Email finder API", "category": "Email", "link": "https://hunter.io/api-documentation/v2", "auth": "apiKey"},
    {"name": "Clearbit", "description": "Business intelligence APIs", "category": "Business", "link": "https://clearbit.com/docs", "auth": "apiKey"},
    {"name": "Apollo.io", "description": "Sales intelligence API", "category": "Business", "link": "https://apolloio.github.io/apollo-api-docs/", "auth": "apiKey"},
    {"name": "Crunchbase", "description": "Business data API", "category": "Business", "link": "https://data.crunchbase.com/docs", "auth": "apiKey"},
    {"name": "PDL", "description": "People Data Labs API", "category": "Business", "link": "https://docs.peopledatalabs.com/", "auth": "apiKey"},
    {"name": "Clay", "description": "Data enrichment", "category": "Business", "link": "https://docs.clay.com/", "auth": "apiKey"},
    {"name": "Snov.io", "description": "Email finder and verifier", "category": "Email", "link": "https://snov.io/api", "auth": "apiKey"},
    {"name": "Anymail Finder", "description": "Email finder API", "category": "Email", "link": "https://anymailfinder.com/docs/", "auth": "apiKey"},
    {"name": "Firecrawl", "description": "Web scraping to markdown", "category": "Development", "link": "https://docs.firecrawl.dev/", "auth": "apiKey"},
    {"name": "Jina Reader", "description": "Web to LLM-ready content", "category": "AI/ML", "link": "https://jina.ai/reader/", "auth": "none"},
    {"name": "AssemblyAI", "description": "Speech-to-text API", "category": "AI/ML", "link": "https://www.assemblyai.com/docs/", "auth": "apiKey"},
    {"name": "Deepgram", "description": "Speech recognition API", "category": "AI/ML", "link": "https://developers.deepgram.com/", "auth": "apiKey"},
    {"name": "Rev.ai", "description": "Speech recognition API", "category": "AI/ML", "link": "https://docs.rev.ai/", "auth": "apiKey"},
    {"name": "Whisper API", "description": "OpenAI speech recognition", "category": "AI/ML", "link": "https://platform.openai.com/docs/guides/speech-to-text", "auth": "apiKey"},
    {"name": "Roboflow", "description": "Computer vision API", "category": "AI/ML", "link": "https://docs.roboflow.com/", "auth": "apiKey"},
    {"name": "Ultralytics", "description": "YOLO models API", "category": "AI/ML", "link": "https://docs.ultralytics.com/", "auth": "none"},
    {"name": "Remove.bg", "description": "Background removal API", "category": "AI/ML", "link": "https://www.remove.bg/api", "auth": "apiKey"},
    {"name": "Photoroom", "description": "Background removal API", "category": "AI/ML", "link": "https://www.photoroom.com/api", "auth": "apiKey"},
    {"name": "Unscreen", "description": "Video background removal", "category": "AI/ML", "link": "https://www.unscreen.com/api", "auth": "apiKey"},
]

def main():
    print("🦞 APIClaw 2026 Night Batch - Modern APIs")
    print("=" * 50)
    
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    
    added = 0
    skipped = 0
    
    for api in MODERN_APIS:
        api_id = generate_id(api['name'])
        
        if api_id in existing_ids:
            skipped += 1
            continue
        
        registry['apis'].append({
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api['category'],
            "auth": api.get('auth', 'apiKey'),
            "https": True,
            "cors": "unknown",
            "link": api['link'],
            "pricing": "unknown",
            "keywords": [],
            "source": "curated-2026"
        })
        existing_ids.add(api_id)
        added += 1
    
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️  Skipped (duplicates): {skipped}")
    print(f"📊 Total APIs in registry: {len(registry['apis'])}")

if __name__ == "__main__":
    main()
