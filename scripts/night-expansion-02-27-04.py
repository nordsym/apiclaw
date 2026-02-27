#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-27 04:00
Target: Add 1000+ APIs from curated sources
"""

import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "night-expansion-02-27-04.json"

# Load existing APIs to check for duplicates
def load_existing():
    existing = set()
    for f in DATA_DIR.glob("*.json"):
        try:
            with open(f) as file:
                data = json.load(file)
                if isinstance(data, list):
                    for api in data:
                        if isinstance(api, dict) and "name" in api:
                            existing.add(api["name"].lower().strip())
        except:
            pass
    return existing

existing_apis = load_existing()
print(f"Found {len(existing_apis)} existing APIs")

new_apis = []

def add_api(name, desc, category, auth="none", base_url=""):
    if name.lower().strip() not in existing_apis:
        new_apis.append({
            "name": name,
            "description": desc,
            "category": category,
            "authType": auth,
            "baseUrl": base_url
        })
        existing_apis.add(name.lower().strip())
        return True
    return False

# ============================================
# BATCH 1: AI & Machine Learning APIs (100+)
# ============================================

ai_ml_apis = [
    ("Anthropic Claude", "Claude AI models for text generation and analysis", "AI/ML", "apiKey", "https://anthropic.com"),
    ("OpenAI", "GPT-4, DALL-E, Whisper and more AI models", "AI/ML", "apiKey", "https://openai.com"),
    ("Google Gemini", "Google's multimodal AI model", "AI/ML", "apiKey", "https://ai.google.dev"),
    ("Mistral AI", "Open-source large language models", "AI/ML", "apiKey", "https://mistral.ai"),
    ("Cohere", "NLP APIs for text generation and classification", "AI/ML", "apiKey", "https://cohere.ai"),
    ("Hugging Face Inference", "Run ML models via API", "AI/ML", "apiKey", "https://huggingface.co"),
    ("Replicate", "Run open-source ML models in the cloud", "AI/ML", "apiKey", "https://replicate.com"),
    ("Together AI", "Fast inference for open-source models", "AI/ML", "apiKey", "https://together.ai"),
    ("Groq", "Ultra-fast LLM inference", "AI/ML", "apiKey", "https://groq.com"),
    ("Perplexity", "AI search and answer engine", "AI/ML", "apiKey", "https://perplexity.ai"),
    ("Stability AI", "Stable Diffusion and image generation", "AI/ML", "apiKey", "https://stability.ai"),
    ("Midjourney", "AI image generation", "AI/ML", "apiKey", "https://midjourney.com"),
    ("RunPod", "GPU cloud for AI inference", "AI/ML", "apiKey", "https://runpod.io"),
    ("Modal", "Serverless functions for ML", "AI/ML", "apiKey", "https://modal.com"),
    ("Banana", "Serverless GPU inference", "AI/ML", "apiKey", "https://banana.dev"),
    ("Cerebrium", "ML model deployment platform", "AI/ML", "apiKey", "https://cerebrium.ai"),
    ("Baseten", "ML model serving infrastructure", "AI/ML", "apiKey", "https://baseten.co"),
    ("OctoML", "ML model optimization and deployment", "AI/ML", "apiKey", "https://octoml.ai"),
    ("Anyscale", "Ray-based ML platform", "AI/ML", "apiKey", "https://anyscale.com"),
    ("AWS SageMaker", "Build and deploy ML models", "AI/ML", "apiKey", "https://aws.amazon.com/sagemaker"),
    ("Azure OpenAI", "OpenAI models on Azure", "AI/ML", "apiKey", "https://azure.microsoft.com"),
    ("Google Vertex AI", "Google Cloud ML platform", "AI/ML", "apiKey", "https://cloud.google.com/vertex-ai"),
    ("IBM Watson", "AI and ML services", "AI/ML", "apiKey", "https://www.ibm.com/watson"),
    ("Deepgram", "Speech recognition API", "AI/ML", "apiKey", "https://deepgram.com"),
    ("AssemblyAI", "Speech-to-text and audio intelligence", "AI/ML", "apiKey", "https://assemblyai.com"),
    ("Speechmatics", "Speech recognition technology", "AI/ML", "apiKey", "https://speechmatics.com"),
    ("Rev.ai", "Speech recognition API", "AI/ML", "apiKey", "https://rev.ai"),
    ("Sonix", "Automated transcription", "AI/ML", "apiKey", "https://sonix.ai"),
    ("Descript", "Audio/video editing with AI", "AI/ML", "apiKey", "https://descript.com"),
    ("Runway ML", "AI creative tools", "AI/ML", "apiKey", "https://runwayml.com"),
    ("Luma AI", "3D capture and reconstruction", "AI/ML", "apiKey", "https://lumalabs.ai"),
    ("Clarifai", "Computer vision and NLP platform", "AI/ML", "apiKey", "https://clarifai.com"),
    ("Google Cloud Vision", "Image analysis API", "AI/ML", "apiKey", "https://cloud.google.com/vision"),
    ("Amazon Rekognition", "Image and video analysis", "AI/ML", "apiKey", "https://aws.amazon.com/rekognition"),
    ("Microsoft Computer Vision", "Image analysis and OCR", "AI/ML", "apiKey", "https://azure.microsoft.com"),
    ("Roboflow", "Computer vision tools and hosting", "AI/ML", "apiKey", "https://roboflow.com"),
    ("Scale AI", "Data labeling and AI infrastructure", "AI/ML", "apiKey", "https://scale.com"),
    ("Labelbox", "Data labeling platform", "AI/ML", "apiKey", "https://labelbox.com"),
    ("Snorkel AI", "Data-centric AI platform", "AI/ML", "apiKey", "https://snorkel.ai"),
    ("Weights & Biases", "ML experiment tracking", "AI/ML", "apiKey", "https://wandb.ai"),
    ("Neptune.ai", "ML experiment tracking", "AI/ML", "apiKey", "https://neptune.ai"),
    ("Comet ML", "ML experiment management", "AI/ML", "apiKey", "https://comet.ml"),
    ("MLflow", "ML lifecycle management", "AI/ML", "none", "https://mlflow.org"),
    ("Kubeflow", "ML on Kubernetes", "AI/ML", "none", "https://kubeflow.org"),
    ("Seldon", "ML model deployment", "AI/ML", "apiKey", "https://seldon.io"),
    ("BentoML", "ML model serving", "AI/ML", "none", "https://bentoml.com"),
    ("Valohai", "MLOps platform", "AI/ML", "apiKey", "https://valohai.com"),
    ("Determined AI", "ML training platform", "AI/ML", "none", "https://determined.ai"),
    ("Paperspace", "GPU cloud for ML", "AI/ML", "apiKey", "https://paperspace.com"),
    ("Lambda Labs", "GPU cloud for deep learning", "AI/ML", "apiKey", "https://lambdalabs.com"),
]

for api in ai_ml_apis:
    add_api(*api)

# ============================================
# BATCH 2: Developer Tools & DevOps (100+)
# ============================================

devtools_apis = [
    ("Vercel", "Frontend cloud platform", "DevTools", "apiKey", "https://vercel.com"),
    ("Netlify", "Web development platform", "DevTools", "apiKey", "https://netlify.com"),
    ("Railway", "Infrastructure platform", "DevTools", "apiKey", "https://railway.app"),
    ("Render", "Cloud application platform", "DevTools", "apiKey", "https://render.com"),
    ("Fly.io", "Deploy app servers close to users", "DevTools", "apiKey", "https://fly.io"),
    ("Cloudflare Workers", "Serverless execution environment", "DevTools", "apiKey", "https://workers.cloudflare.com"),
    ("Deno Deploy", "Serverless JavaScript hosting", "DevTools", "apiKey", "https://deno.com/deploy"),
    ("AWS Lambda", "Serverless compute", "DevTools", "apiKey", "https://aws.amazon.com/lambda"),
    ("Google Cloud Functions", "Serverless functions", "DevTools", "apiKey", "https://cloud.google.com/functions"),
    ("Azure Functions", "Serverless compute service", "DevTools", "apiKey", "https://azure.microsoft.com/functions"),
    ("Supabase", "Open source Firebase alternative", "DevTools", "apiKey", "https://supabase.com"),
    ("Firebase", "Google's app development platform", "DevTools", "apiKey", "https://firebase.google.com"),
    ("PlanetScale", "Serverless MySQL platform", "DevTools", "apiKey", "https://planetscale.com"),
    ("Neon", "Serverless Postgres", "DevTools", "apiKey", "https://neon.tech"),
    ("Turso", "SQLite at the edge", "DevTools", "apiKey", "https://turso.tech"),
    ("Upstash", "Serverless Redis and Kafka", "DevTools", "apiKey", "https://upstash.com"),
    ("Convex", "Reactive backend platform", "DevTools", "apiKey", "https://convex.dev"),
    ("Xata", "Serverless database platform", "DevTools", "apiKey", "https://xata.io"),
    ("CockroachDB", "Distributed SQL database", "DevTools", "apiKey", "https://cockroachlabs.com"),
    ("Fauna", "Distributed document database", "DevTools", "apiKey", "https://fauna.com"),
    ("MongoDB Atlas", "Cloud database service", "DevTools", "apiKey", "https://mongodb.com/atlas"),
    ("Aiven", "Open source data infrastructure", "DevTools", "apiKey", "https://aiven.io"),
    ("Redis Cloud", "Redis database as a service", "DevTools", "apiKey", "https://redis.com"),
    ("Elasticsearch", "Search and analytics engine", "DevTools", "apiKey", "https://elastic.co"),
    ("Algolia", "Search and discovery API", "DevTools", "apiKey", "https://algolia.com"),
    ("Meilisearch", "Open source search engine", "DevTools", "apiKey", "https://meilisearch.com"),
    ("Typesense", "Fast search engine", "DevTools", "apiKey", "https://typesense.org"),
    ("Pinecone", "Vector database", "DevTools", "apiKey", "https://pinecone.io"),
    ("Weaviate", "Vector search engine", "DevTools", "none", "https://weaviate.io"),
    ("Qdrant", "Vector similarity search", "DevTools", "apiKey", "https://qdrant.tech"),
    ("Milvus", "Vector database for AI", "DevTools", "none", "https://milvus.io"),
    ("Chroma", "AI-native embedding database", "DevTools", "none", "https://trychroma.com"),
    ("LaunchDarkly", "Feature flag management", "DevTools", "apiKey", "https://launchdarkly.com"),
    ("Split.io", "Feature flags and experiments", "DevTools", "apiKey", "https://split.io"),
    ("Statsig", "Feature flags and analytics", "DevTools", "apiKey", "https://statsig.com"),
    ("Flagsmith", "Open source feature flags", "DevTools", "apiKey", "https://flagsmith.com"),
    ("Sentry", "Error tracking and monitoring", "DevTools", "apiKey", "https://sentry.io"),
    ("Datadog", "Monitoring and analytics", "DevTools", "apiKey", "https://datadoghq.com"),
    ("New Relic", "Observability platform", "DevTools", "apiKey", "https://newrelic.com"),
    ("Grafana Cloud", "Observability platform", "DevTools", "apiKey", "https://grafana.com"),
    ("Prometheus", "Monitoring system", "DevTools", "none", "https://prometheus.io"),
    ("Honeycomb", "Observability for distributed systems", "DevTools", "apiKey", "https://honeycomb.io"),
    ("Axiom", "Log management", "DevTools", "apiKey", "https://axiom.co"),
    ("Logflare", "Log management for Elixir", "DevTools", "apiKey", "https://logflare.app"),
    ("Papertrail", "Cloud-hosted log management", "DevTools", "apiKey", "https://papertrailapp.com"),
    ("Logtail", "Log management", "DevTools", "apiKey", "https://logtail.com"),
    ("PagerDuty", "Incident management", "DevTools", "apiKey", "https://pagerduty.com"),
    ("Opsgenie", "Incident management by Atlassian", "DevTools", "apiKey", "https://opsgenie.com"),
    ("VictorOps", "Incident management", "DevTools", "apiKey", "https://victorops.com"),
    ("Linear", "Issue tracking for teams", "DevTools", "apiKey", "https://linear.app"),
]

for api in devtools_apis:
    add_api(*api)

# ============================================
# BATCH 3: Communication & Messaging (80+)
# ============================================

communication_apis = [
    ("Twilio", "Cloud communications platform", "Communication", "apiKey", "https://twilio.com"),
    ("SendGrid", "Email delivery service", "Communication", "apiKey", "https://sendgrid.com"),
    ("Mailgun", "Email API service", "Communication", "apiKey", "https://mailgun.com"),
    ("Postmark", "Transactional email service", "Communication", "apiKey", "https://postmarkapp.com"),
    ("Amazon SES", "Email sending service", "Communication", "apiKey", "https://aws.amazon.com/ses"),
    ("Resend", "Email API for developers", "Communication", "apiKey", "https://resend.com"),
    ("Loops", "Email for SaaS", "Communication", "apiKey", "https://loops.so"),
    ("Brevo", "Email and SMS marketing platform", "Communication", "apiKey", "https://brevo.com"),
    ("Mailchimp Transactional", "Transactional email API", "Communication", "apiKey", "https://mailchimp.com"),
    ("Customer.io", "Marketing automation", "Communication", "apiKey", "https://customer.io"),
    ("Intercom", "Customer messaging platform", "Communication", "apiKey", "https://intercom.com"),
    ("Drift", "Conversational marketing", "Communication", "apiKey", "https://drift.com"),
    ("Zendesk", "Customer service platform", "Communication", "apiKey", "https://zendesk.com"),
    ("Freshdesk", "Customer support software", "Communication", "apiKey", "https://freshdesk.com"),
    ("Help Scout", "Customer service software", "Communication", "apiKey", "https://helpscout.com"),
    ("Crisp", "Customer messaging platform", "Communication", "apiKey", "https://crisp.chat"),
    ("Tawk.to", "Live chat software", "Communication", "apiKey", "https://tawk.to"),
    ("LiveChat", "Customer service software", "Communication", "apiKey", "https://livechat.com"),
    ("Chatwoot", "Open-source customer engagement", "Communication", "apiKey", "https://chatwoot.com"),
    ("Telegram Bot API", "Create Telegram bots", "Communication", "apiKey", "https://core.telegram.org/bots"),
    ("Discord API", "Discord bot and integration API", "Communication", "apiKey", "https://discord.com/developers"),
    ("Slack API", "Slack workspace integration", "Communication", "oauth", "https://api.slack.com"),
    ("WhatsApp Business", "WhatsApp messaging for businesses", "Communication", "apiKey", "https://business.whatsapp.com"),
    ("Facebook Messenger", "Messenger bot platform", "Communication", "apiKey", "https://developers.facebook.com"),
    ("Vonage", "Communication APIs", "Communication", "apiKey", "https://vonage.com"),
    ("Plivo", "Cloud communications platform", "Communication", "apiKey", "https://plivo.com"),
    ("MessageBird", "Omnichannel communication", "Communication", "apiKey", "https://messagebird.com"),
    ("Sinch", "Cloud communications", "Communication", "apiKey", "https://sinch.com"),
    ("Bandwidth", "Voice and messaging APIs", "Communication", "apiKey", "https://bandwidth.com"),
    ("Telnyx", "Communications platform", "Communication", "apiKey", "https://telnyx.com"),
    ("46elks", "SMS and voice API for Sweden", "Communication", "basic", "https://46elks.com"),
    ("Infobip", "Omnichannel communication platform", "Communication", "apiKey", "https://infobip.com"),
    ("Africa's Talking", "African communication APIs", "Communication", "apiKey", "https://africastalking.com"),
    ("Nexmo", "Communication APIs by Vonage", "Communication", "apiKey", "https://nexmo.com"),
    ("ClickSend", "SMS, MMS, email APIs", "Communication", "apiKey", "https://clicksend.com"),
    ("TextMagic", "Business SMS service", "Communication", "apiKey", "https://textmagic.com"),
    ("Pusher", "Realtime communication APIs", "Communication", "apiKey", "https://pusher.com"),
    ("Ably", "Realtime messaging infrastructure", "Communication", "apiKey", "https://ably.com"),
    ("Socket.io", "Realtime bidirectional communication", "Communication", "none", "https://socket.io"),
    ("Agora", "Real-time voice and video", "Communication", "apiKey", "https://agora.io"),
    ("Daily", "Video call API", "Communication", "apiKey", "https://daily.co"),
    ("Whereby", "Video meetings API", "Communication", "apiKey", "https://whereby.com"),
    ("Livekit", "Open source WebRTC", "Communication", "apiKey", "https://livekit.io"),
    ("100ms", "Video conferencing infrastructure", "Communication", "apiKey", "https://100ms.live"),
    ("Jitsi", "Open source video conferencing", "Communication", "none", "https://jitsi.org"),
    ("Stream", "Chat and activity feeds", "Communication", "apiKey", "https://getstream.io"),
    ("SendBird", "Chat and messaging API", "Communication", "apiKey", "https://sendbird.com"),
    ("CometChat", "In-app chat SDK", "Communication", "apiKey", "https://cometchat.com"),
    ("TalkJS", "Chat API and SDK", "Communication", "apiKey", "https://talkjs.com"),
    ("Novu", "Open source notification infrastructure", "Communication", "apiKey", "https://novu.co"),
]

for api in communication_apis:
    add_api(*api)

# ============================================
# BATCH 4: E-commerce & Payments (80+)
# ============================================

ecommerce_apis = [
    ("Stripe", "Payment processing platform", "Payments", "apiKey", "https://stripe.com"),
    ("PayPal", "Online payments", "Payments", "oauth", "https://paypal.com"),
    ("Square", "Payment and commerce platform", "Payments", "apiKey", "https://squareup.com"),
    ("Braintree", "Payment gateway", "Payments", "apiKey", "https://braintreepayments.com"),
    ("Adyen", "Payment platform", "Payments", "apiKey", "https://adyen.com"),
    ("Mollie", "European payment service provider", "Payments", "apiKey", "https://mollie.com"),
    ("Paddle", "Payments for SaaS", "Payments", "apiKey", "https://paddle.com"),
    ("Lemon Squeezy", "Payments for digital products", "Payments", "apiKey", "https://lemonsqueezy.com"),
    ("Gumroad", "Sell digital products", "Payments", "apiKey", "https://gumroad.com"),
    ("Chargebee", "Subscription billing", "Payments", "apiKey", "https://chargebee.com"),
    ("Recurly", "Subscription management", "Payments", "apiKey", "https://recurly.com"),
    ("Zuora", "Subscription management platform", "Payments", "apiKey", "https://zuora.com"),
    ("RevenueCat", "In-app subscriptions", "Payments", "apiKey", "https://revenuecat.com"),
    ("Adapty", "In-app subscriptions for mobile", "Payments", "apiKey", "https://adapty.io"),
    ("Superwall", "Paywall infrastructure", "Payments", "apiKey", "https://superwall.com"),
    ("Klarna", "Buy now pay later", "Payments", "apiKey", "https://klarna.com"),
    ("Affirm", "Buy now pay later", "Payments", "apiKey", "https://affirm.com"),
    ("Afterpay", "Buy now pay later", "Payments", "apiKey", "https://afterpay.com"),
    ("Sezzle", "Buy now pay later", "Payments", "apiKey", "https://sezzle.com"),
    ("Wise", "International money transfer", "Payments", "apiKey", "https://wise.com"),
    ("Revolut Business", "Business financial platform", "Payments", "apiKey", "https://revolut.com"),
    ("Mercury", "Banking for startups", "Payments", "apiKey", "https://mercury.com"),
    ("Plaid", "Financial data platform", "Payments", "apiKey", "https://plaid.com"),
    ("MX", "Financial data platform", "Payments", "apiKey", "https://mx.com"),
    ("Finicity", "Financial data aggregation", "Payments", "apiKey", "https://finicity.com"),
    ("Yodlee", "Financial data aggregator", "Payments", "apiKey", "https://yodlee.com"),
    ("Moov", "Money movement APIs", "Payments", "apiKey", "https://moov.io"),
    ("Dwolla", "ACH payment API", "Payments", "apiKey", "https://dwolla.com"),
    ("Modern Treasury", "Payment operations", "Payments", "apiKey", "https://moderntreasury.com"),
    ("Increase", "Banking APIs", "Payments", "apiKey", "https://increase.com"),
    ("Unit", "Banking-as-a-service", "Payments", "apiKey", "https://unit.co"),
    ("Bond", "Embedded finance platform", "Payments", "apiKey", "https://bond.tech"),
    ("Treasury Prime", "Banking infrastructure", "Payments", "apiKey", "https://treasuryprime.com"),
    ("Shopify", "E-commerce platform", "E-commerce", "apiKey", "https://shopify.com"),
    ("WooCommerce", "WordPress e-commerce", "E-commerce", "apiKey", "https://woocommerce.com"),
    ("BigCommerce", "E-commerce platform", "E-commerce", "apiKey", "https://bigcommerce.com"),
    ("Magento", "E-commerce platform", "E-commerce", "apiKey", "https://magento.com"),
    ("Medusa", "Open source e-commerce", "E-commerce", "apiKey", "https://medusajs.com"),
    ("Saleor", "GraphQL e-commerce platform", "E-commerce", "apiKey", "https://saleor.io"),
    ("Commerce.js", "Headless e-commerce API", "E-commerce", "apiKey", "https://commercejs.com"),
    ("Snipcart", "Shopping cart platform", "E-commerce", "apiKey", "https://snipcart.com"),
    ("Crystallize", "Product information management", "E-commerce", "apiKey", "https://crystallize.com"),
    ("Printful", "Print-on-demand", "E-commerce", "apiKey", "https://printful.com"),
    ("Printify", "Print-on-demand platform", "E-commerce", "apiKey", "https://printify.com"),
    ("Shippo", "Shipping API", "E-commerce", "apiKey", "https://goshippo.com"),
    ("EasyPost", "Shipping API", "E-commerce", "apiKey", "https://easypost.com"),
    ("ShipStation", "Shipping solution", "E-commerce", "apiKey", "https://shipstation.com"),
    ("Shipbob", "E-commerce fulfillment", "E-commerce", "apiKey", "https://shipbob.com"),
    ("Orderdesk", "Order management", "E-commerce", "apiKey", "https://orderdesk.com"),
]

for api in ecommerce_apis:
    add_api(*api)

# ============================================
# BATCH 5: Data & Analytics (80+)
# ============================================

analytics_apis = [
    ("Google Analytics 4", "Website analytics", "Analytics", "oauth", "https://analytics.google.com"),
    ("Mixpanel", "Product analytics", "Analytics", "apiKey", "https://mixpanel.com"),
    ("Amplitude", "Product analytics platform", "Analytics", "apiKey", "https://amplitude.com"),
    ("Heap", "Digital analytics platform", "Analytics", "apiKey", "https://heap.io"),
    ("PostHog", "Open source product analytics", "Analytics", "apiKey", "https://posthog.com"),
    ("Plausible", "Privacy-friendly analytics", "Analytics", "apiKey", "https://plausible.io"),
    ("Fathom", "Privacy-focused website analytics", "Analytics", "apiKey", "https://usefathom.com"),
    ("Simple Analytics", "Privacy-friendly analytics", "Analytics", "apiKey", "https://simpleanalytics.com"),
    ("Umami", "Open source website analytics", "Analytics", "none", "https://umami.is"),
    ("Segment", "Customer data platform", "Analytics", "apiKey", "https://segment.com"),
    ("RudderStack", "Customer data platform", "Analytics", "apiKey", "https://rudderstack.com"),
    ("Jitsu", "Open source data collection", "Analytics", "apiKey", "https://jitsu.com"),
    ("Snowplow", "Behavioral data platform", "Analytics", "apiKey", "https://snowplow.io"),
    ("Matomo", "Open source web analytics", "Analytics", "apiKey", "https://matomo.org"),
    ("Looker", "Business intelligence platform", "Analytics", "apiKey", "https://looker.com"),
    ("Metabase", "Open source BI tool", "Analytics", "none", "https://metabase.com"),
    ("Redash", "Connect and query data sources", "Analytics", "apiKey", "https://redash.io"),
    ("Apache Superset", "Data visualization platform", "Analytics", "none", "https://superset.apache.org"),
    ("Mode", "Collaborative analytics", "Analytics", "apiKey", "https://mode.com"),
    ("Dbt", "Data transformation", "Analytics", "apiKey", "https://getdbt.com"),
    ("Fivetran", "Data integration", "Analytics", "apiKey", "https://fivetran.com"),
    ("Airbyte", "Open source data integration", "Analytics", "apiKey", "https://airbyte.com"),
    ("Stitch", "Data integration platform", "Analytics", "apiKey", "https://stitchdata.com"),
    ("Census", "Reverse ETL", "Analytics", "apiKey", "https://getcensus.com"),
    ("Hightouch", "Reverse ETL platform", "Analytics", "apiKey", "https://hightouch.com"),
    ("Clearbit", "B2B data enrichment", "Analytics", "apiKey", "https://clearbit.com"),
    ("ZoomInfo", "B2B data platform", "Analytics", "apiKey", "https://zoominfo.com"),
    ("Apollo.io", "Sales intelligence platform", "Analytics", "apiKey", "https://apollo.io"),
    ("Lusha", "B2B contact data", "Analytics", "apiKey", "https://lusha.com"),
    ("Hunter.io", "Email finder and verifier", "Analytics", "apiKey", "https://hunter.io"),
    ("Snov.io", "Email outreach platform", "Analytics", "apiKey", "https://snov.io"),
    ("Seamless.AI", "Sales leads platform", "Analytics", "apiKey", "https://seamless.ai"),
    ("FullContact", "Identity resolution", "Analytics", "apiKey", "https://fullcontact.com"),
    ("Pipl", "Identity data platform", "Analytics", "apiKey", "https://pipl.com"),
    ("IPInfo", "IP address data", "Analytics", "apiKey", "https://ipinfo.io"),
    ("IP-API", "IP geolocation API", "Analytics", "none", "https://ip-api.com"),
    ("MaxMind GeoIP", "IP intelligence", "Analytics", "apiKey", "https://maxmind.com"),
    ("IPStack", "IP geolocation API", "Analytics", "apiKey", "https://ipstack.com"),
    ("Abstract API", "Various data APIs", "Analytics", "apiKey", "https://abstractapi.com"),
    ("APILayer", "Collection of data APIs", "Analytics", "apiKey", "https://apilayer.com"),
    ("Hotjar", "Heatmaps and recordings", "Analytics", "apiKey", "https://hotjar.com"),
    ("FullStory", "Digital experience analytics", "Analytics", "apiKey", "https://fullstory.com"),
    ("LogRocket", "Session replay and analytics", "Analytics", "apiKey", "https://logrocket.com"),
    ("Smartlook", "Qualitative analytics", "Analytics", "apiKey", "https://smartlook.com"),
    ("Mouseflow", "Session replay and heatmaps", "Analytics", "apiKey", "https://mouseflow.com"),
    ("CrazyEgg", "Heatmaps and A/B testing", "Analytics", "apiKey", "https://crazyegg.com"),
]

for api in analytics_apis:
    add_api(*api)

# ============================================
# BATCH 6: Content & Media (80+)
# ============================================

content_apis = [
    ("Contentful", "Headless CMS", "CMS", "apiKey", "https://contentful.com"),
    ("Sanity", "Headless CMS platform", "CMS", "apiKey", "https://sanity.io"),
    ("Strapi", "Open source headless CMS", "CMS", "apiKey", "https://strapi.io"),
    ("Prismic", "Headless website builder", "CMS", "apiKey", "https://prismic.io"),
    ("Storyblok", "Headless CMS", "CMS", "apiKey", "https://storyblok.com"),
    ("DatoCMS", "Headless CMS", "CMS", "apiKey", "https://datocms.com"),
    ("Hygraph", "Federated content platform", "CMS", "apiKey", "https://hygraph.com"),
    ("Builder.io", "Visual headless CMS", "CMS", "apiKey", "https://builder.io"),
    ("Payload CMS", "Headless CMS and application framework", "CMS", "apiKey", "https://payloadcms.com"),
    ("Ghost", "Publishing platform", "CMS", "apiKey", "https://ghost.org"),
    ("WordPress", "Content management system", "CMS", "apiKey", "https://wordpress.org"),
    ("Webflow", "Visual web development platform", "CMS", "apiKey", "https://webflow.com"),
    ("Framer", "Design and publish websites", "CMS", "apiKey", "https://framer.com"),
    ("Cloudinary", "Image and video management", "Media", "apiKey", "https://cloudinary.com"),
    ("Imgix", "Image processing and CDN", "Media", "apiKey", "https://imgix.com"),
    ("ImageKit", "Image CDN and optimization", "Media", "apiKey", "https://imagekit.io"),
    ("Uploadcare", "File uploads and processing", "Media", "apiKey", "https://uploadcare.com"),
    ("Filestack", "File handling platform", "Media", "apiKey", "https://filestack.com"),
    ("Transloadit", "File processing service", "Media", "apiKey", "https://transloadit.com"),
    ("Mux", "Video streaming API", "Media", "apiKey", "https://mux.com"),
    ("Cloudflare Stream", "Video streaming", "Media", "apiKey", "https://cloudflare.com"),
    ("Bunny Stream", "Video hosting and streaming", "Media", "apiKey", "https://bunny.net"),
    ("api.video", "Video hosting API", "Media", "apiKey", "https://api.video"),
    ("Vimeo", "Video hosting platform", "Media", "apiKey", "https://vimeo.com"),
    ("Wistia", "Video marketing platform", "Media", "apiKey", "https://wistia.com"),
    ("JW Player", "Video player platform", "Media", "apiKey", "https://jwplayer.com"),
    ("Brightcove", "Video technology platform", "Media", "apiKey", "https://brightcove.com"),
    ("Bitmovin", "Video streaming technology", "Media", "apiKey", "https://bitmovin.com"),
    ("Unsplash", "Free images API", "Media", "apiKey", "https://unsplash.com"),
    ("Pexels", "Free stock photos and videos", "Media", "apiKey", "https://pexels.com"),
    ("Pixabay", "Free images and videos", "Media", "apiKey", "https://pixabay.com"),
    ("Getty Images", "Stock photos and media", "Media", "apiKey", "https://gettyimages.com"),
    ("Shutterstock", "Stock photography", "Media", "apiKey", "https://shutterstock.com"),
    ("Adobe Stock", "Stock media assets", "Media", "apiKey", "https://stock.adobe.com"),
    ("iStock", "Stock photos and media", "Media", "apiKey", "https://istockphoto.com"),
    ("Giphy", "GIF search and sharing", "Media", "apiKey", "https://giphy.com"),
    ("Tenor", "GIF search API", "Media", "apiKey", "https://tenor.com"),
    ("Lottie Files", "Lottie animations library", "Media", "apiKey", "https://lottiefiles.com"),
    ("Icons8", "Icons and illustrations", "Media", "apiKey", "https://icons8.com"),
    ("Flaticon", "Free vector icons", "Media", "apiKey", "https://flaticon.com"),
    ("The Noun Project", "Icons and photos", "Media", "apiKey", "https://thenounproject.com"),
    ("Iconfinder", "Icons marketplace", "Media", "apiKey", "https://iconfinder.com"),
    ("RemoveBG", "Remove image backgrounds", "Media", "apiKey", "https://remove.bg"),
    ("Unscreen", "Remove video backgrounds", "Media", "apiKey", "https://unscreen.com"),
    ("Photoroom", "Background removal API", "Media", "apiKey", "https://photoroom.com"),
]

for api in content_apis:
    add_api(*api)

# ============================================
# BATCH 7: Security & Authentication (60+)
# ============================================

security_apis = [
    ("Auth0", "Identity platform", "Security", "apiKey", "https://auth0.com"),
    ("Okta", "Identity management", "Security", "apiKey", "https://okta.com"),
    ("Clerk", "User management platform", "Security", "apiKey", "https://clerk.com"),
    ("WorkOS", "Enterprise-ready auth", "Security", "apiKey", "https://workos.com"),
    ("Stytch", "Passwordless authentication", "Security", "apiKey", "https://stytch.com"),
    ("Magic", "Passwordless login", "Security", "apiKey", "https://magic.link"),
    ("Passage", "Passwordless authentication", "Security", "apiKey", "https://passage.id"),
    ("Descope", "Customer authentication", "Security", "apiKey", "https://descope.com"),
    ("FusionAuth", "Customer identity platform", "Security", "apiKey", "https://fusionauth.io"),
    ("Ory", "Open source identity platform", "Security", "apiKey", "https://ory.sh"),
    ("Keycloak", "Open source IAM", "Security", "none", "https://keycloak.org"),
    ("SuperTokens", "Open source auth", "Security", "apiKey", "https://supertokens.com"),
    ("Hanko", "Passkey authentication", "Security", "apiKey", "https://hanko.io"),
    ("PropelAuth", "B2B authentication", "Security", "apiKey", "https://propelauth.com"),
    ("Kinde", "Auth for modern applications", "Security", "apiKey", "https://kinde.com"),
    ("Snyk", "Security platform for developers", "Security", "apiKey", "https://snyk.io"),
    ("SonarQube", "Code quality and security", "Security", "apiKey", "https://sonarqube.org"),
    ("Checkmarx", "Application security testing", "Security", "apiKey", "https://checkmarx.com"),
    ("Veracode", "Application security", "Security", "apiKey", "https://veracode.com"),
    ("WhiteSource", "Open source security", "Security", "apiKey", "https://whitesourcesoftware.com"),
    ("GitHub Security", "Security features in GitHub", "Security", "apiKey", "https://github.com"),
    ("GitLab Security", "Security scanning", "Security", "apiKey", "https://gitlab.com"),
    ("Dependabot", "Dependency updates", "Security", "none", "https://github.com/dependabot"),
    ("Socket", "Supply chain security", "Security", "apiKey", "https://socket.dev"),
    ("Aqua Security", "Container security", "Security", "apiKey", "https://aquasec.com"),
    ("Trivy", "Vulnerability scanner", "Security", "none", "https://trivy.dev"),
    ("Grype", "Vulnerability scanner", "Security", "none", "https://anchore.com"),
    ("Falco", "Runtime security", "Security", "none", "https://falco.org"),
    ("Vault", "Secrets management", "Security", "apiKey", "https://vaultproject.io"),
    ("Doppler", "Secrets management", "Security", "apiKey", "https://doppler.com"),
    ("1Password Secrets", "Secrets automation", "Security", "apiKey", "https://1password.com"),
    ("Infisical", "Open source secrets management", "Security", "apiKey", "https://infisical.com"),
    ("AWS Secrets Manager", "Secrets management", "Security", "apiKey", "https://aws.amazon.com"),
    ("Azure Key Vault", "Secrets management", "Security", "apiKey", "https://azure.microsoft.com"),
    ("Google Secret Manager", "Secrets management", "Security", "apiKey", "https://cloud.google.com"),
    ("CrowdStrike", "Endpoint security", "Security", "apiKey", "https://crowdstrike.com"),
    ("Carbon Black", "Endpoint security", "Security", "apiKey", "https://carbonblack.com"),
    ("SentinelOne", "Autonomous security", "Security", "apiKey", "https://sentinelone.com"),
    ("Cloudflare", "Web security and CDN", "Security", "apiKey", "https://cloudflare.com"),
    ("Fastly", "Edge cloud platform", "Security", "apiKey", "https://fastly.com"),
    ("Akamai", "CDN and security", "Security", "apiKey", "https://akamai.com"),
]

for api in security_apis:
    add_api(*api)

# ============================================
# BATCH 8: Business & Productivity (60+)
# ============================================

business_apis = [
    ("Notion", "All-in-one workspace", "Productivity", "apiKey", "https://notion.so"),
    ("Airtable", "Spreadsheet-database hybrid", "Productivity", "apiKey", "https://airtable.com"),
    ("Coda", "Doc that grows with your ideas", "Productivity", "apiKey", "https://coda.io"),
    ("ClickUp", "Project management platform", "Productivity", "apiKey", "https://clickup.com"),
    ("Monday.com", "Work management platform", "Productivity", "apiKey", "https://monday.com"),
    ("Asana", "Work management platform", "Productivity", "apiKey", "https://asana.com"),
    ("Jira", "Issue tracking", "Productivity", "apiKey", "https://atlassian.com/jira"),
    ("Trello", "Visual project management", "Productivity", "apiKey", "https://trello.com"),
    ("Basecamp", "Project management", "Productivity", "apiKey", "https://basecamp.com"),
    ("Todoist", "Task management", "Productivity", "apiKey", "https://todoist.com"),
    ("Things", "Task manager for Apple", "Productivity", "none", "https://culturedcode.com"),
    ("Calendly", "Scheduling automation", "Productivity", "apiKey", "https://calendly.com"),
    ("Cal.com", "Open source scheduling", "Productivity", "apiKey", "https://cal.com"),
    ("SavvyCal", "Scheduling made easy", "Productivity", "apiKey", "https://savvycal.com"),
    ("Doodle", "Meeting scheduling", "Productivity", "apiKey", "https://doodle.com"),
    ("Google Calendar", "Calendar service", "Productivity", "oauth", "https://calendar.google.com"),
    ("Microsoft Graph", "Microsoft 365 APIs", "Productivity", "oauth", "https://graph.microsoft.com"),
    ("Zoom", "Video communications", "Productivity", "apiKey", "https://zoom.us"),
    ("Google Meet", "Video meetings", "Productivity", "oauth", "https://meet.google.com"),
    ("Microsoft Teams", "Collaboration platform", "Productivity", "oauth", "https://teams.microsoft.com"),
    ("Webex", "Video conferencing", "Productivity", "apiKey", "https://webex.com"),
    ("Loom", "Video messaging", "Productivity", "apiKey", "https://loom.com"),
    ("Vidyard", "Video hosting for business", "Productivity", "apiKey", "https://vidyard.com"),
    ("DocuSign", "Electronic signature", "Productivity", "apiKey", "https://docusign.com"),
    ("PandaDoc", "Document automation", "Productivity", "apiKey", "https://pandadoc.com"),
    ("HelloSign", "E-signature by Dropbox", "Productivity", "apiKey", "https://hellosign.com"),
    ("SignNow", "Electronic signatures", "Productivity", "apiKey", "https://signnow.com"),
    ("Adobe Sign", "E-signature solution", "Productivity", "apiKey", "https://acrobat.adobe.com"),
    ("Dropbox", "File hosting service", "Productivity", "oauth", "https://dropbox.com"),
    ("Google Drive", "Cloud storage", "Productivity", "oauth", "https://drive.google.com"),
    ("OneDrive", "Microsoft cloud storage", "Productivity", "oauth", "https://onedrive.com"),
    ("Box", "Cloud content management", "Productivity", "oauth", "https://box.com"),
    ("Notion API", "Notion workspace API", "Productivity", "apiKey", "https://developers.notion.com"),
    ("Figma", "Design tool", "Productivity", "apiKey", "https://figma.com"),
    ("Canva", "Design platform", "Productivity", "apiKey", "https://canva.com"),
    ("Pitch", "Presentation software", "Productivity", "apiKey", "https://pitch.com"),
    ("Miro", "Collaborative whiteboard", "Productivity", "apiKey", "https://miro.com"),
    ("FigJam", "Whiteboard by Figma", "Productivity", "apiKey", "https://figma.com/figjam"),
    ("Excalidraw", "Virtual whiteboard", "Productivity", "none", "https://excalidraw.com"),
    ("Whereby Embedded", "Video meeting APIs", "Productivity", "apiKey", "https://whereby.com"),
]

for api in business_apis:
    add_api(*api)

# ============================================
# BATCH 9: Marketing & SEO (60+)
# ============================================

marketing_apis = [
    ("HubSpot", "Marketing and CRM platform", "Marketing", "apiKey", "https://hubspot.com"),
    ("Salesforce", "CRM platform", "Marketing", "oauth", "https://salesforce.com"),
    ("Pipedrive", "Sales CRM", "Marketing", "apiKey", "https://pipedrive.com"),
    ("Close", "Sales engagement CRM", "Marketing", "apiKey", "https://close.com"),
    ("Copper", "CRM for Google Workspace", "Marketing", "apiKey", "https://copper.com"),
    ("Freshsales", "Sales CRM", "Marketing", "apiKey", "https://freshworks.com"),
    ("Zoho CRM", "CRM software", "Marketing", "apiKey", "https://zoho.com/crm"),
    ("ActiveCampaign", "Marketing automation", "Marketing", "apiKey", "https://activecampaign.com"),
    ("Mailchimp", "Email marketing platform", "Marketing", "apiKey", "https://mailchimp.com"),
    ("ConvertKit", "Email marketing for creators", "Marketing", "apiKey", "https://convertkit.com"),
    ("Klaviyo", "Email and SMS marketing", "Marketing", "apiKey", "https://klaviyo.com"),
    ("Drip", "E-commerce email automation", "Marketing", "apiKey", "https://drip.com"),
    ("Beehiiv", "Newsletter platform", "Marketing", "apiKey", "https://beehiiv.com"),
    ("Substack", "Newsletter platform", "Marketing", "apiKey", "https://substack.com"),
    ("Buttondown", "Newsletter tool", "Marketing", "apiKey", "https://buttondown.email"),
    ("Ghost", "Publishing platform", "Marketing", "apiKey", "https://ghost.org"),
    ("Ahrefs", "SEO tools and data", "Marketing", "apiKey", "https://ahrefs.com"),
    ("SEMrush", "SEO and marketing toolkit", "Marketing", "apiKey", "https://semrush.com"),
    ("Moz", "SEO software", "Marketing", "apiKey", "https://moz.com"),
    ("Screaming Frog", "SEO spider tool", "Marketing", "none", "https://screamingfrog.co.uk"),
    ("Sitebulb", "Website auditing tool", "Marketing", "none", "https://sitebulb.com"),
    ("SpyFu", "SEO and PPC tool", "Marketing", "apiKey", "https://spyfu.com"),
    ("Majestic", "Link intelligence", "Marketing", "apiKey", "https://majestic.com"),
    ("LinkResearchTools", "Backlink analysis", "Marketing", "apiKey", "https://linkresearchtools.com"),
    ("Google Search Console", "Search performance", "Marketing", "oauth", "https://search.google.com/search-console"),
    ("Bing Webmaster Tools", "Bing search performance", "Marketing", "apiKey", "https://bing.com/webmasters"),
    ("Google Ads", "Advertising platform", "Marketing", "oauth", "https://ads.google.com"),
    ("Meta Ads", "Facebook and Instagram ads", "Marketing", "oauth", "https://business.facebook.com"),
    ("LinkedIn Ads", "Professional advertising", "Marketing", "oauth", "https://business.linkedin.com"),
    ("Twitter Ads", "Twitter advertising", "Marketing", "oauth", "https://ads.twitter.com"),
    ("TikTok Ads", "TikTok advertising", "Marketing", "oauth", "https://ads.tiktok.com"),
    ("Pinterest Ads", "Pinterest advertising", "Marketing", "oauth", "https://ads.pinterest.com"),
    ("Snapchat Ads", "Snapchat advertising", "Marketing", "oauth", "https://forbusiness.snapchat.com"),
    ("Reddit Ads", "Reddit advertising", "Marketing", "oauth", "https://ads.reddit.com"),
    ("Taboola", "Content discovery platform", "Marketing", "apiKey", "https://taboola.com"),
    ("Outbrain", "Content recommendation", "Marketing", "apiKey", "https://outbrain.com"),
    ("Criteo", "Advertising platform", "Marketing", "apiKey", "https://criteo.com"),
    ("AppsFlyer", "Mobile attribution", "Marketing", "apiKey", "https://appsflyer.com"),
    ("Adjust", "Mobile analytics", "Marketing", "apiKey", "https://adjust.com"),
    ("Branch", "Mobile linking platform", "Marketing", "apiKey", "https://branch.io"),
]

for api in marketing_apis:
    add_api(*api)

# ============================================
# BATCH 10: Miscellaneous & Emerging (100+)
# ============================================

misc_apis = [
    ("OpenWeather", "Weather data API", "Weather", "apiKey", "https://openweathermap.org"),
    ("WeatherAPI", "Weather and geo data", "Weather", "apiKey", "https://weatherapi.com"),
    ("Tomorrow.io", "Weather intelligence", "Weather", "apiKey", "https://tomorrow.io"),
    ("Pirate Weather", "Weather forecasting", "Weather", "apiKey", "https://pirateweather.net"),
    ("Open-Meteo", "Free weather API", "Weather", "none", "https://open-meteo.com"),
    ("Mapbox", "Maps and location services", "Maps", "apiKey", "https://mapbox.com"),
    ("HERE Maps", "Location platform", "Maps", "apiKey", "https://here.com"),
    ("TomTom", "Location technology", "Maps", "apiKey", "https://tomtom.com"),
    ("OpenStreetMap", "Free map data", "Maps", "none", "https://openstreetmap.org"),
    ("What3Words", "Location addressing", "Maps", "apiKey", "https://what3words.com"),
    ("Radar", "Location platform", "Maps", "apiKey", "https://radar.com"),
    ("Foursquare", "Location technology", "Maps", "apiKey", "https://foursquare.com"),
    ("Yelp", "Business reviews", "Maps", "apiKey", "https://yelp.com"),
    ("Google Places", "Place information", "Maps", "apiKey", "https://maps.google.com"),
    ("Twitch", "Live streaming platform", "Entertainment", "oauth", "https://twitch.tv"),
    ("YouTube Data", "YouTube video data", "Entertainment", "apiKey", "https://youtube.com"),
    ("Spotify", "Music streaming", "Entertainment", "oauth", "https://spotify.com"),
    ("SoundCloud", "Audio platform", "Entertainment", "oauth", "https://soundcloud.com"),
    ("Deezer", "Music streaming", "Entertainment", "apiKey", "https://deezer.com"),
    ("Last.fm", "Music discovery", "Entertainment", "apiKey", "https://last.fm"),
    ("Genius", "Song lyrics and knowledge", "Entertainment", "apiKey", "https://genius.com"),
    ("TMDB", "Movie and TV database", "Entertainment", "apiKey", "https://themoviedb.org"),
    ("OMDb", "Open Movie Database", "Entertainment", "apiKey", "https://omdbapi.com"),
    ("TVmaze", "TV show information", "Entertainment", "none", "https://tvmaze.com"),
    ("JustWatch", "Streaming availability", "Entertainment", "apiKey", "https://justwatch.com"),
    ("Goodreads", "Book reviews", "Entertainment", "apiKey", "https://goodreads.com"),
    ("Open Library", "Book data", "Entertainment", "none", "https://openlibrary.org"),
    ("News API", "News aggregation", "News", "apiKey", "https://newsapi.org"),
    ("GNews", "News search API", "News", "apiKey", "https://gnews.io"),
    ("Currents API", "News aggregation", "News", "apiKey", "https://currentsapi.services"),
    ("The Guardian", "News content", "News", "apiKey", "https://theguardian.com"),
    ("New York Times", "News articles", "News", "apiKey", "https://nytimes.com"),
    ("Reddit", "Social news", "Social", "oauth", "https://reddit.com"),
    ("Twitter API", "Twitter data", "Social", "oauth", "https://twitter.com"),
    ("Facebook Graph", "Facebook data", "Social", "oauth", "https://facebook.com"),
    ("Instagram Graph", "Instagram data", "Social", "oauth", "https://instagram.com"),
    ("LinkedIn", "Professional network", "Social", "oauth", "https://linkedin.com"),
    ("TikTok", "Short video platform", "Social", "oauth", "https://tiktok.com"),
    ("Pinterest", "Visual discovery", "Social", "oauth", "https://pinterest.com"),
    ("Mastodon", "Decentralized social network", "Social", "oauth", "https://joinmastodon.org"),
    ("Bluesky", "Decentralized social network", "Social", "apiKey", "https://bsky.app"),
    ("Threads", "Text-based social media", "Social", "oauth", "https://threads.net"),
    ("GitHub", "Code hosting platform", "Development", "oauth", "https://github.com"),
    ("GitLab", "DevOps platform", "Development", "oauth", "https://gitlab.com"),
    ("Bitbucket", "Git repository management", "Development", "oauth", "https://bitbucket.org"),
    ("npm", "Node package manager", "Development", "apiKey", "https://npmjs.com"),
    ("PyPI", "Python package index", "Development", "none", "https://pypi.org"),
    ("RubyGems", "Ruby packages", "Development", "apiKey", "https://rubygems.org"),
    ("Crates.io", "Rust packages", "Development", "none", "https://crates.io"),
    ("Packagist", "PHP packages", "Development", "none", "https://packagist.org"),
    ("Maven Central", "Java packages", "Development", "none", "https://maven.org"),
    ("NuGet", ".NET packages", "Development", "none", "https://nuget.org"),
    ("Docker Hub", "Container images", "Development", "apiKey", "https://hub.docker.com"),
    ("Quay.io", "Container registry", "Development", "apiKey", "https://quay.io"),
    ("AWS", "Cloud services", "Cloud", "apiKey", "https://aws.amazon.com"),
    ("Google Cloud", "Cloud platform", "Cloud", "apiKey", "https://cloud.google.com"),
    ("Microsoft Azure", "Cloud services", "Cloud", "apiKey", "https://azure.microsoft.com"),
    ("DigitalOcean", "Cloud infrastructure", "Cloud", "apiKey", "https://digitalocean.com"),
    ("Linode", "Cloud hosting", "Cloud", "apiKey", "https://linode.com"),
    ("Vultr", "Cloud compute", "Cloud", "apiKey", "https://vultr.com"),
    ("Hetzner", "Cloud hosting", "Cloud", "apiKey", "https://hetzner.com"),
    ("OVH", "Cloud provider", "Cloud", "apiKey", "https://ovh.com"),
    ("Scaleway", "Cloud provider", "Cloud", "apiKey", "https://scaleway.com"),
    ("UpCloud", "Cloud infrastructure", "Cloud", "apiKey", "https://upcloud.com"),
    ("Temporal", "Workflow orchestration", "Automation", "apiKey", "https://temporal.io"),
    ("n8n", "Workflow automation", "Automation", "apiKey", "https://n8n.io"),
    ("Zapier", "Automation platform", "Automation", "apiKey", "https://zapier.com"),
    ("Make", "Automation platform", "Automation", "apiKey", "https://make.com"),
    ("Pipedream", "Serverless integration", "Automation", "apiKey", "https://pipedream.com"),
    ("Tray.io", "Integration platform", "Automation", "apiKey", "https://tray.io"),
    ("Workato", "Enterprise automation", "Automation", "apiKey", "https://workato.com"),
    ("Celigo", "Integration platform", "Automation", "apiKey", "https://celigo.com"),
    ("Retool", "Internal tools builder", "Automation", "apiKey", "https://retool.com"),
    ("Appsmith", "Low-code platform", "Automation", "apiKey", "https://appsmith.com"),
    ("Budibase", "Low-code platform", "Automation", "apiKey", "https://budibase.com"),
    ("Tooljet", "Low-code development", "Automation", "apiKey", "https://tooljet.com"),
    ("Airplane", "Internal tools platform", "Automation", "apiKey", "https://airplane.dev"),
    ("Superblocks", "Internal apps builder", "Automation", "apiKey", "https://superblocks.com"),
    ("Directus", "Headless CMS and data platform", "Automation", "apiKey", "https://directus.io"),
    ("Hasura", "GraphQL engine", "Automation", "apiKey", "https://hasura.io"),
    ("PostgREST", "REST API for PostgreSQL", "Automation", "none", "https://postgrest.org"),
    ("Pocketbase", "Backend in a single file", "Automation", "none", "https://pocketbase.io"),
    ("Appwrite", "Backend server", "Automation", "apiKey", "https://appwrite.io"),
    ("Nhost", "Backend platform", "Automation", "apiKey", "https://nhost.io"),
]

for api in misc_apis:
    add_api(*api)

# Save new APIs
with open(OUTPUT_FILE, "w") as f:
    json.dump(new_apis, f, indent=2)

print(f"\n✅ Added {len(new_apis)} new APIs to {OUTPUT_FILE}")
