#!/usr/bin/env python3
"""
APIClaw Night Expansion Batch 2 - 2026-02-24 02:00
More APIs from various categories
"""

import json
import re
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

def extract_keywords(name, description, category):
    keywords = []
    text = f"{name} {description} {category}".lower()
    keyword_patterns = ['ai', 'ml', 'api', 'rest', 'graphql', 'json', 'free', 'real-time', 
                       'weather', 'crypto', 'blockchain', 'sms', 'email', 'voice', 'payment',
                       'image', 'video', 'audio', 'music', 'geo', 'map', 'location', 'social',
                       'auth', 'search', 'analytics', 'data', 'cloud', 'storage', 'news',
                       'health', 'game', 'translate', 'language', 'nlp']
    for kw in keyword_patterns:
        if kw in text and kw not in keywords:
            keywords.append(kw)
    return keywords[:5]

# Additional APIs to add - categorized batches
MORE_APIS = [
    # AI/ML APIs (30 more)
    {"name": "Anthropic Claude", "url": "https://docs.anthropic.com/claude/reference/", "desc": "Claude AI assistant API for natural language tasks", "cat": "AI & ML"},
    {"name": "Google Gemini", "url": "https://ai.google.dev/docs", "desc": "Google's multimodal AI model API", "cat": "AI & ML"},
    {"name": "Mistral AI", "url": "https://docs.mistral.ai/", "desc": "Open source AI models API", "cat": "AI & ML"},
    {"name": "Groq", "url": "https://console.groq.com/docs/", "desc": "Fast LLM inference API", "cat": "AI & ML"},
    {"name": "Perplexity AI", "url": "https://docs.perplexity.ai/", "desc": "AI search and answer engine API", "cat": "AI & ML"},
    {"name": "Together AI", "url": "https://docs.together.ai/", "desc": "Run open source AI models API", "cat": "AI & ML"},
    {"name": "Anyscale", "url": "https://docs.anyscale.com/", "desc": "Scalable AI compute API", "cat": "AI & ML"},
    {"name": "Fireworks AI", "url": "https://readme.fireworks.ai/docs", "desc": "Fast generative AI API", "cat": "AI & ML"},
    {"name": "Cerebras", "url": "https://docs.cerebras.ai/", "desc": "High-performance AI inference API", "cat": "AI & ML"},
    {"name": "DeepSeek", "url": "https://api-docs.deepseek.com/", "desc": "DeepSeek AI models API", "cat": "AI & ML"},
    {"name": "Llama API", "url": "https://www.llama-api.com/", "desc": "Meta Llama models API", "cat": "AI & ML"},
    {"name": "Cohere Embed", "url": "https://docs.cohere.com/reference/embed", "desc": "Text embeddings API", "cat": "AI & ML"},
    {"name": "Voyage AI", "url": "https://docs.voyageai.com/", "desc": "Embedding models API", "cat": "AI & ML"},
    {"name": "Jina AI Embeddings", "url": "https://jina.ai/embeddings/", "desc": "Open source embeddings API", "cat": "AI & ML"},
    {"name": "Nomic Atlas", "url": "https://docs.nomic.ai/", "desc": "AI data visualization and embeddings", "cat": "AI & ML"},
    {"name": "Pinecone", "url": "https://docs.pinecone.io/", "desc": "Vector database API", "cat": "AI & ML"},
    {"name": "Weaviate", "url": "https://weaviate.io/developers/weaviate", "desc": "Vector search engine API", "cat": "AI & ML"},
    {"name": "Qdrant", "url": "https://qdrant.github.io/qdrant/redoc/", "desc": "Vector similarity search API", "cat": "AI & ML"},
    {"name": "Milvus", "url": "https://milvus.io/api-reference/", "desc": "Open source vector database API", "cat": "AI & ML"},
    {"name": "ChromaDB", "url": "https://docs.trychroma.com/", "desc": "Open source embedding database", "cat": "AI & ML"},
    {"name": "LanceDB", "url": "https://lancedb.github.io/lancedb/", "desc": "Serverless vector database", "cat": "AI & ML"},
    {"name": "Vectara", "url": "https://docs.vectara.com/docs", "desc": "AI-powered search platform API", "cat": "AI & ML"},
    {"name": "Stability AI", "url": "https://platform.stability.ai/docs/api-reference", "desc": "Stable Diffusion and AI image generation", "cat": "AI & ML"},
    {"name": "Midjourney", "url": "https://docs.midjourney.com/", "desc": "AI image generation API", "cat": "AI & ML"},
    {"name": "Leonardo AI", "url": "https://docs.leonardo.ai/", "desc": "AI image generation platform API", "cat": "AI & ML"},
    {"name": "Ideogram", "url": "https://api.ideogram.ai/docs", "desc": "AI image and text generation", "cat": "AI & ML"},
    {"name": "Flux AI", "url": "https://blackforestlabs.ai/", "desc": "Black Forest Labs Flux image models", "cat": "AI & ML"},
    {"name": "Runway ML", "url": "https://docs.runwayml.com/", "desc": "AI video generation API", "cat": "AI & ML"},
    {"name": "Pika Labs", "url": "https://pika.art/developers", "desc": "AI video creation API", "cat": "AI & ML"},
    {"name": "D-ID", "url": "https://docs.d-id.com/", "desc": "AI video avatars and synthesis", "cat": "AI & ML"},
    
    # Payment/Fintech (25 more)
    {"name": "Plaid", "url": "https://plaid.com/docs/", "desc": "Financial data aggregation API", "cat": "Finance"},
    {"name": "Teller", "url": "https://teller.io/docs", "desc": "Bank data API for developers", "cat": "Finance"},
    {"name": "MX Platform", "url": "https://docs.mx.com/", "desc": "Financial data connectivity API", "cat": "Finance"},
    {"name": "Finicity", "url": "https://docs.finicity.com/", "desc": "Financial data and insights API", "cat": "Finance"},
    {"name": "Akoya", "url": "https://developer.akoya.com/", "desc": "Consumer-permissioned data network", "cat": "Finance"},
    {"name": "Yodlee", "url": "https://developer.yodlee.com/", "desc": "Financial data aggregation platform", "cat": "Finance"},
    {"name": "Adyen", "url": "https://docs.adyen.com/", "desc": "Global payment platform API", "cat": "Payments"},
    {"name": "Checkout.com", "url": "https://api-reference.checkout.com/", "desc": "Payment processing API", "cat": "Payments"},
    {"name": "Worldpay", "url": "https://developer.worldpay.com/", "desc": "Global payments API", "cat": "Payments"},
    {"name": "Square", "url": "https://developer.squareup.com/reference/square", "desc": "Payment and commerce API", "cat": "Payments"},
    {"name": "Razorpay", "url": "https://razorpay.com/docs/api/", "desc": "India payment gateway API", "cat": "Payments"},
    {"name": "PayU", "url": "https://developers.payu.com/", "desc": "Global payment solutions API", "cat": "Payments"},
    {"name": "Klarna", "url": "https://developers.klarna.com/", "desc": "Buy now pay later API", "cat": "Payments"},
    {"name": "Afterpay", "url": "https://developers.afterpay.com/", "desc": "Installment payments API", "cat": "Payments"},
    {"name": "Affirm", "url": "https://docs.affirm.com/", "desc": "Consumer financing API", "cat": "Payments"},
    {"name": "Wise (TransferWise)", "url": "https://api-docs.wise.com/", "desc": "International money transfer API", "cat": "Finance"},
    {"name": "Remitly", "url": "https://developers.remitly.com/", "desc": "International remittance API", "cat": "Finance"},
    {"name": "Revolut Business", "url": "https://developer.revolut.com/", "desc": "Banking and payments API", "cat": "Finance"},
    {"name": "Mercury", "url": "https://docs.mercury.com/", "desc": "Startup banking API", "cat": "Finance"},
    {"name": "Modern Treasury", "url": "https://docs.moderntreasury.com/", "desc": "Payment operations API", "cat": "Finance"},
    {"name": "Column", "url": "https://column.com/docs", "desc": "Banking as a service API", "cat": "Finance"},
    {"name": "Unit", "url": "https://docs.unit.co/", "desc": "Embedded banking API", "cat": "Finance"},
    {"name": "Treasury Prime", "url": "https://developer.treasuryprime.com/", "desc": "Bank connectivity API", "cat": "Finance"},
    {"name": "Synapse", "url": "https://docs.synapsefi.com/", "desc": "Banking as a service platform", "cat": "Finance"},
    {"name": "Marqeta", "url": "https://www.marqeta.com/docs/", "desc": "Card issuing and processing API", "cat": "Payments"},
    
    # E-commerce/Retail (25 more)
    {"name": "Shopify", "url": "https://shopify.dev/docs/api", "desc": "E-commerce platform API", "cat": "E-commerce"},
    {"name": "WooCommerce", "url": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "desc": "WordPress e-commerce API", "cat": "E-commerce"},
    {"name": "BigCommerce", "url": "https://developer.bigcommerce.com/docs", "desc": "E-commerce platform API", "cat": "E-commerce"},
    {"name": "Magento", "url": "https://developer.adobe.com/commerce/", "desc": "Adobe Commerce API", "cat": "E-commerce"},
    {"name": "Salesforce Commerce Cloud", "url": "https://developer.salesforce.com/docs/commerce", "desc": "Enterprise e-commerce API", "cat": "E-commerce"},
    {"name": "Swell", "url": "https://swell.is/docs/api", "desc": "Headless e-commerce API", "cat": "E-commerce"},
    {"name": "Medusa", "url": "https://docs.medusajs.com/api/", "desc": "Open source e-commerce API", "cat": "E-commerce"},
    {"name": "Saleor", "url": "https://docs.saleor.io/api/", "desc": "GraphQL e-commerce API", "cat": "E-commerce"},
    {"name": "Vendure", "url": "https://www.vendure.io/docs/graphql-api/", "desc": "Headless commerce framework API", "cat": "E-commerce"},
    {"name": "Printful", "url": "https://developers.printful.com/docs/", "desc": "Print on demand API", "cat": "E-commerce"},
    {"name": "Printify", "url": "https://developers.printify.com/", "desc": "Print on demand platform API", "cat": "E-commerce"},
    {"name": "Shippo", "url": "https://goshippo.com/docs/", "desc": "Multi-carrier shipping API", "cat": "Transportation"},
    {"name": "EasyPost", "url": "https://www.easypost.com/docs/api", "desc": "Shipping and logistics API", "cat": "Transportation"},
    {"name": "Shipstation", "url": "https://www.shipstation.com/docs/api/", "desc": "Shipping management API", "cat": "Transportation"},
    {"name": "ShipEngine", "url": "https://shipengine.github.io/shipengine-openapi/", "desc": "Multi-carrier shipping API", "cat": "Transportation"},
    {"name": "Ordoro", "url": "https://www.ordoro.com/api", "desc": "Inventory and shipping API", "cat": "E-commerce"},
    {"name": "Algolia", "url": "https://www.algolia.com/doc/api-reference/", "desc": "Search and discovery API", "cat": "Search"},
    {"name": "Typesense", "url": "https://typesense.org/docs/", "desc": "Open source search engine API", "cat": "Search"},
    {"name": "Meilisearch", "url": "https://docs.meilisearch.com/reference/api/", "desc": "Fast open source search API", "cat": "Search"},
    {"name": "Elasticsearch", "url": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html", "desc": "Distributed search and analytics", "cat": "Search"},
    {"name": "Coveo", "url": "https://docs.coveo.com/en/", "desc": "AI-powered search and relevance API", "cat": "Search"},
    {"name": "Bloomreach", "url": "https://documentation.bloomreach.com/", "desc": "Commerce search and personalization", "cat": "E-commerce"},
    {"name": "Nosto", "url": "https://developers.nosto.com/", "desc": "E-commerce personalization API", "cat": "E-commerce"},
    {"name": "Dynamic Yield", "url": "https://www.dynamicyield.com/api-docs/", "desc": "Personalization platform API", "cat": "E-commerce"},
    {"name": "Optimizely", "url": "https://docs.developers.optimizely.com/", "desc": "Experimentation platform API", "cat": "Analytics"},
    
    # CRM/Sales (20 more)
    {"name": "Salesforce", "url": "https://developer.salesforce.com/docs/apis", "desc": "CRM and business platform APIs", "cat": "CRM"},
    {"name": "HubSpot", "url": "https://developers.hubspot.com/docs/api/overview", "desc": "CRM and marketing platform API", "cat": "CRM"},
    {"name": "Pipedrive", "url": "https://developers.pipedrive.com/docs/api/v1", "desc": "Sales CRM API", "cat": "CRM"},
    {"name": "Zoho CRM", "url": "https://www.zoho.com/crm/developer/docs/api/v5/", "desc": "CRM platform API", "cat": "CRM"},
    {"name": "Copper", "url": "https://developer.copper.com/", "desc": "Google Workspace CRM API", "cat": "CRM"},
    {"name": "Close", "url": "https://developer.close.com/", "desc": "Sales CRM API", "cat": "CRM"},
    {"name": "Freshsales", "url": "https://developers.freshworks.com/crm/", "desc": "Sales CRM by Freshworks", "cat": "CRM"},
    {"name": "Monday.com", "url": "https://developer.monday.com/api-reference/docs", "desc": "Work OS platform API", "cat": "Productivity"},
    {"name": "Notion", "url": "https://developers.notion.com/", "desc": "Workspace and notes API", "cat": "Productivity"},
    {"name": "Airtable", "url": "https://airtable.com/developers/web/api/introduction", "desc": "Database and spreadsheet API", "cat": "Productivity"},
    {"name": "Asana", "url": "https://developers.asana.com/docs", "desc": "Project management API", "cat": "Productivity"},
    {"name": "Jira", "url": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/", "desc": "Issue tracking API", "cat": "Productivity"},
    {"name": "Linear", "url": "https://developers.linear.app/docs", "desc": "Issue tracking API", "cat": "Productivity"},
    {"name": "ClickUp", "url": "https://clickup.com/api", "desc": "Productivity platform API", "cat": "Productivity"},
    {"name": "Todoist", "url": "https://developer.todoist.com/rest/v2/", "desc": "Task management API", "cat": "Productivity"},
    {"name": "Trello", "url": "https://developer.atlassian.com/cloud/trello/rest/", "desc": "Kanban board API", "cat": "Productivity"},
    {"name": "Basecamp", "url": "https://github.com/basecamp/bc3-api", "desc": "Project management API", "cat": "Productivity"},
    {"name": "Smartsheet", "url": "https://smartsheet.redoc.ly/", "desc": "Work management platform API", "cat": "Productivity"},
    {"name": "Coda", "url": "https://coda.io/developers/apis/v1", "desc": "Document automation API", "cat": "Productivity"},
    {"name": "Fibery", "url": "https://the-fibery.notion.site/Fibery-API-e3ab6b1c8d584c3a8f00e1b7b8dbd6a6", "desc": "Work management API", "cat": "Productivity"},
    
    # DevOps/Infrastructure (25 more)
    {"name": "Vercel", "url": "https://vercel.com/docs/rest-api", "desc": "Frontend deployment platform API", "cat": "DevOps"},
    {"name": "Netlify", "url": "https://open-api.netlify.com/", "desc": "Web hosting platform API", "cat": "DevOps"},
    {"name": "Render", "url": "https://api-docs.render.com/reference", "desc": "Cloud application platform API", "cat": "DevOps"},
    {"name": "Railway", "url": "https://docs.railway.app/reference/graphql-api", "desc": "Infrastructure platform API", "cat": "DevOps"},
    {"name": "Fly.io", "url": "https://fly.io/docs/machines/api/", "desc": "Edge application platform API", "cat": "DevOps"},
    {"name": "Cloudflare", "url": "https://api.cloudflare.com/", "desc": "Edge network and security API", "cat": "DevOps"},
    {"name": "Fastly", "url": "https://developer.fastly.com/reference/api/", "desc": "Edge cloud platform API", "cat": "DevOps"},
    {"name": "Akamai", "url": "https://developer.akamai.com/api", "desc": "CDN and security API", "cat": "DevOps"},
    {"name": "DigitalOcean", "url": "https://docs.digitalocean.com/reference/api/", "desc": "Cloud infrastructure API", "cat": "DevOps"},
    {"name": "Linode", "url": "https://www.linode.com/docs/api/", "desc": "Cloud computing API", "cat": "DevOps"},
    {"name": "Vultr", "url": "https://www.vultr.com/api/", "desc": "Cloud infrastructure API", "cat": "DevOps"},
    {"name": "Hetzner", "url": "https://docs.hetzner.cloud/", "desc": "Cloud servers API", "cat": "DevOps"},
    {"name": "AWS", "url": "https://docs.aws.amazon.com/", "desc": "Amazon Web Services APIs", "cat": "DevOps"},
    {"name": "Google Cloud", "url": "https://cloud.google.com/apis/docs/overview", "desc": "Google Cloud Platform APIs", "cat": "DevOps"},
    {"name": "Azure", "url": "https://docs.microsoft.com/en-us/rest/api/azure/", "desc": "Microsoft Azure APIs", "cat": "DevOps"},
    {"name": "Terraform Cloud", "url": "https://developer.hashicorp.com/terraform/cloud-docs/api-docs", "desc": "Infrastructure as code API", "cat": "DevOps"},
    {"name": "Pulumi", "url": "https://www.pulumi.com/docs/reference/pulumi-api/", "desc": "Infrastructure as code platform", "cat": "DevOps"},
    {"name": "Kubernetes", "url": "https://kubernetes.io/docs/reference/kubernetes-api/", "desc": "Container orchestration API", "cat": "DevOps"},
    {"name": "Docker Hub", "url": "https://docs.docker.com/docker-hub/api/latest/", "desc": "Container registry API", "cat": "DevOps"},
    {"name": "CircleCI", "url": "https://circleci.com/docs/api/v2/", "desc": "CI/CD platform API", "cat": "DevOps"},
    {"name": "GitHub Actions", "url": "https://docs.github.com/en/rest/actions", "desc": "GitHub CI/CD API", "cat": "DevOps"},
    {"name": "GitLab CI", "url": "https://docs.gitlab.com/ee/api/api_resources.html", "desc": "GitLab CI/CD API", "cat": "DevOps"},
    {"name": "Jenkins", "url": "https://www.jenkins.io/doc/book/using/remote-access-api/", "desc": "CI/CD automation server API", "cat": "DevOps"},
    {"name": "Datadog", "url": "https://docs.datadoghq.com/api/latest/", "desc": "Monitoring and observability API", "cat": "DevOps"},
    {"name": "New Relic", "url": "https://docs.newrelic.com/docs/apis/rest-api-v2/", "desc": "Application monitoring API", "cat": "DevOps"},
    
    # Communication/Collaboration (20 more)
    {"name": "Slack", "url": "https://api.slack.com/", "desc": "Team messaging platform API", "cat": "Communication"},
    {"name": "Discord", "url": "https://discord.com/developers/docs/reference", "desc": "Community platform API", "cat": "Communication"},
    {"name": "Microsoft Teams", "url": "https://docs.microsoft.com/en-us/graph/teams-concept-overview", "desc": "Team collaboration API", "cat": "Communication"},
    {"name": "Zoom", "url": "https://developers.zoom.us/docs/api/", "desc": "Video conferencing API", "cat": "Communication"},
    {"name": "Google Meet", "url": "https://developers.google.com/meet/api", "desc": "Video meetings API", "cat": "Communication"},
    {"name": "Webex", "url": "https://developer.webex.com/docs/api/getting-started", "desc": "Cisco collaboration API", "cat": "Communication"},
    {"name": "RingCentral", "url": "https://developers.ringcentral.com/api-reference", "desc": "Cloud communications API", "cat": "Communication"},
    {"name": "Vonage", "url": "https://developer.vonage.com/", "desc": "Communications APIs (formerly Nexmo)", "cat": "Communication"},
    {"name": "Bandwidth", "url": "https://dev.bandwidth.com/apis/", "desc": "Enterprise communications API", "cat": "Communication"},
    {"name": "Plivo", "url": "https://www.plivo.com/docs/", "desc": "Voice and SMS API", "cat": "Communication"},
    {"name": "MessageBird", "url": "https://developers.messagebird.com/", "desc": "Omnichannel messaging API", "cat": "Communication"},
    {"name": "Sinch", "url": "https://developers.sinch.com/", "desc": "Customer engagement API", "cat": "Communication"},
    {"name": "Infobip", "url": "https://www.infobip.com/docs/api", "desc": "Customer engagement platform", "cat": "Communication"},
    {"name": "SendBird", "url": "https://sendbird.com/docs", "desc": "In-app messaging and chat API", "cat": "Communication"},
    {"name": "Stream", "url": "https://getstream.io/chat/docs/", "desc": "Chat and activity feeds API", "cat": "Communication"},
    {"name": "Pusher", "url": "https://pusher.com/docs/", "desc": "Realtime messaging API", "cat": "Communication"},
    {"name": "Ably", "url": "https://ably.com/docs/api", "desc": "Realtime experience platform", "cat": "Communication"},
    {"name": "Livekit", "url": "https://docs.livekit.io/", "desc": "Open source WebRTC platform", "cat": "Communication"},
    {"name": "Daily", "url": "https://docs.daily.co/reference", "desc": "Video calling API", "cat": "Communication"},
    {"name": "Whereby", "url": "https://docs.whereby.com/", "desc": "Embedded video meetings API", "cat": "Communication"},
    
    # Email Services (15 more)
    {"name": "SendGrid", "url": "https://docs.sendgrid.com/api-reference/", "desc": "Email delivery API", "cat": "Email"},
    {"name": "Mailchimp", "url": "https://mailchimp.com/developer/", "desc": "Email marketing API", "cat": "Email"},
    {"name": "Postmark", "url": "https://postmarkapp.com/developer", "desc": "Transactional email API", "cat": "Email"},
    {"name": "Amazon SES", "url": "https://docs.aws.amazon.com/ses/latest/APIReference/", "desc": "Amazon email service API", "cat": "Email"},
    {"name": "Mailjet", "url": "https://dev.mailjet.com/", "desc": "Email and SMS API", "cat": "Email"},
    {"name": "SparkPost", "url": "https://developers.sparkpost.com/api/", "desc": "Email delivery service API", "cat": "Email"},
    {"name": "Customer.io", "url": "https://customer.io/docs/api/", "desc": "Marketing automation API", "cat": "Email"},
    {"name": "Brevo (Sendinblue)", "url": "https://developers.brevo.com/docs", "desc": "Marketing platform API", "cat": "Email"},
    {"name": "Klaviyo", "url": "https://developers.klaviyo.com/", "desc": "Marketing automation API", "cat": "Email"},
    {"name": "Drip", "url": "https://developer.drip.com/", "desc": "E-commerce CRM API", "cat": "Email"},
    {"name": "ConvertKit", "url": "https://developers.convertkit.com/", "desc": "Creator marketing API", "cat": "Email"},
    {"name": "ActiveCampaign", "url": "https://developers.activecampaign.com/reference/", "desc": "Marketing automation API", "cat": "Email"},
    {"name": "Mailgun Validate", "url": "https://documentation.mailgun.com/en/latest/api-email-validation.html", "desc": "Email validation API", "cat": "Email"},
    {"name": "ZeroBounce", "url": "https://www.zerobounce.net/docs/", "desc": "Email validation API", "cat": "Email"},
    {"name": "Hunter.io", "url": "https://hunter.io/api-documentation/v2", "desc": "Email finder and verifier API", "cat": "Email"},
    
    # Media/CDN (15 more)
    {"name": "Cloudinary", "url": "https://cloudinary.com/documentation/image_upload_api_reference", "desc": "Media management and CDN API", "cat": "Media"},
    {"name": "Imgix", "url": "https://docs.imgix.com/apis", "desc": "Image processing and CDN API", "cat": "Media"},
    {"name": "ImageKit", "url": "https://docs.imagekit.io/api-reference/api-introduction", "desc": "Image CDN and optimization API", "cat": "Media"},
    {"name": "Uploadcare", "url": "https://uploadcare.com/api-refs/rest-api/v0.7.0/", "desc": "File handling and CDN API", "cat": "Media"},
    {"name": "Bunny.net", "url": "https://docs.bunny.net/reference/", "desc": "CDN and storage API", "cat": "Media"},
    {"name": "KeyCDN", "url": "https://www.keycdn.com/api", "desc": "Content delivery network API", "cat": "Media"},
    {"name": "StackPath", "url": "https://developer.stackpath.com/", "desc": "Edge platform API", "cat": "Media"},
    {"name": "Mux", "url": "https://docs.mux.com/api-reference/", "desc": "Video streaming API", "cat": "Media"},
    {"name": "Cloudflare Stream", "url": "https://developers.cloudflare.com/stream/", "desc": "Video streaming API", "cat": "Media"},
    {"name": "Vimeo OTT", "url": "https://developer.vimeo.com/ott", "desc": "Video monetization API", "cat": "Media"},
    {"name": "Wistia", "url": "https://wistia.com/support/developers", "desc": "Video hosting API", "cat": "Media"},
    {"name": "JW Player", "url": "https://developer.jwplayer.com/jwplayer/reference", "desc": "Video player and streaming API", "cat": "Media"},
    {"name": "Brightcove", "url": "https://apis.support.brightcove.com/", "desc": "Video platform API", "cat": "Media"},
    {"name": "Kaltura", "url": "https://developer.kaltura.com/api-docs/", "desc": "Video platform API", "cat": "Media"},
    {"name": "Dacast", "url": "https://www.dacast.com/support/api/", "desc": "Video streaming platform API", "cat": "Media"},
    
    # Security (20 more)
    {"name": "Auth0", "url": "https://auth0.com/docs/api", "desc": "Identity platform API", "cat": "Authentication"},
    {"name": "Okta", "url": "https://developer.okta.com/docs/reference/", "desc": "Identity and access management API", "cat": "Authentication"},
    {"name": "Clerk", "url": "https://clerk.com/docs/reference/", "desc": "User management API", "cat": "Authentication"},
    {"name": "Stytch", "url": "https://stytch.com/docs/api", "desc": "Passwordless authentication API", "cat": "Authentication"},
    {"name": "Magic", "url": "https://magic.link/docs/api-reference/", "desc": "Web3 authentication API", "cat": "Authentication"},
    {"name": "FusionAuth", "url": "https://fusionauth.io/docs/apis/", "desc": "Identity management API", "cat": "Authentication"},
    {"name": "Supertokens", "url": "https://supertokens.com/docs/api", "desc": "Open source auth API", "cat": "Authentication"},
    {"name": "Descope", "url": "https://docs.descope.com/api/", "desc": "Passwordless authentication API", "cat": "Authentication"},
    {"name": "Snyk", "url": "https://snyk.docs.apiary.io/", "desc": "Security vulnerability scanning API", "cat": "Security"},
    {"name": "SonarQube", "url": "https://docs.sonarqube.org/latest/extension-guide/web-api/", "desc": "Code quality and security API", "cat": "Security"},
    {"name": "Veracode", "url": "https://docs.veracode.com/r/c_rest_intro", "desc": "Application security testing API", "cat": "Security"},
    {"name": "Checkmarx", "url": "https://checkmarx.com/developers/", "desc": "Application security API", "cat": "Security"},
    {"name": "HashiCorp Vault", "url": "https://developer.hashicorp.com/vault/api-docs", "desc": "Secrets management API", "cat": "Security"},
    {"name": "AWS Secrets Manager", "url": "https://docs.aws.amazon.com/secretsmanager/latest/apireference/", "desc": "Secrets management API", "cat": "Security"},
    {"name": "Doppler", "url": "https://docs.doppler.com/reference/api", "desc": "Secrets management platform API", "cat": "Security"},
    {"name": "1Password", "url": "https://developer.1password.com/docs/connect/", "desc": "Password manager API", "cat": "Security"},
    {"name": "Bitwarden", "url": "https://bitwarden.com/help/public-api/", "desc": "Password manager API", "cat": "Security"},
    {"name": "Cloudflare Access", "url": "https://developers.cloudflare.com/api/operations/access-applications-list-access-applications", "desc": "Zero trust security API", "cat": "Security"},
    {"name": "Zscaler", "url": "https://help.zscaler.com/zia/api", "desc": "Cloud security API", "cat": "Security"},
    {"name": "CrowdStrike", "url": "https://developer.crowdstrike.com/", "desc": "Endpoint security API", "cat": "Security"},
    
    # Forms/Surveys (10 more)
    {"name": "Typeform", "url": "https://developer.typeform.com/", "desc": "Interactive forms API", "cat": "Survey"},
    {"name": "Jotform", "url": "https://api.jotform.com/docs/", "desc": "Online forms API", "cat": "Survey"},
    {"name": "Formstack", "url": "https://developers.formstack.com/", "desc": "Form builder API", "cat": "Survey"},
    {"name": "Cognito Forms", "url": "https://www.cognitoforms.com/api", "desc": "Online forms API", "cat": "Survey"},
    {"name": "SurveyMonkey", "url": "https://developer.surveymonkey.com/api/v3/", "desc": "Survey platform API", "cat": "Survey"},
    {"name": "Qualtrics", "url": "https://api.qualtrics.com/", "desc": "Experience management API", "cat": "Survey"},
    {"name": "Alchemer (SurveyGizmo)", "url": "https://apihelp.alchemer.com/", "desc": "Survey software API", "cat": "Survey"},
    {"name": "Tally", "url": "https://tally.so/help/developer-api", "desc": "Free form builder API", "cat": "Survey"},
    {"name": "Formbricks", "url": "https://formbricks.com/docs/api", "desc": "Open source survey API", "cat": "Survey"},
    {"name": "Fillout", "url": "https://www.fillout.com/docs/api", "desc": "Form builder API", "cat": "Survey"},
    
    # Analytics/BI (15 more)
    {"name": "Amplitude", "url": "https://amplitude.com/docs/apis", "desc": "Product analytics API", "cat": "Analytics"},
    {"name": "Mixpanel", "url": "https://developer.mixpanel.com/reference", "desc": "Product analytics API", "cat": "Analytics"},
    {"name": "Segment", "url": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/", "desc": "Customer data platform API", "cat": "Analytics"},
    {"name": "PostHog", "url": "https://posthog.com/docs/api", "desc": "Open source product analytics API", "cat": "Analytics"},
    {"name": "Heap", "url": "https://developers.heap.io/reference", "desc": "Digital insights platform API", "cat": "Analytics"},
    {"name": "Fullstory", "url": "https://developer.fullstory.com/", "desc": "Digital experience analytics API", "cat": "Analytics"},
    {"name": "Hotjar", "url": "https://help.hotjar.com/hc/en-us/articles/4405109971095-Hotjar-API", "desc": "User behavior analytics API", "cat": "Analytics"},
    {"name": "LogRocket", "url": "https://docs.logrocket.com/reference", "desc": "Session replay and analytics API", "cat": "Analytics"},
    {"name": "Plausible", "url": "https://plausible.io/docs/stats-api", "desc": "Privacy-friendly analytics API", "cat": "Analytics"},
    {"name": "Fathom", "url": "https://usefathom.com/docs/api", "desc": "Privacy-first analytics API", "cat": "Analytics"},
    {"name": "Simple Analytics", "url": "https://docs.simpleanalytics.com/api", "desc": "Privacy analytics API", "cat": "Analytics"},
    {"name": "Umami", "url": "https://umami.is/docs/api", "desc": "Open source analytics API", "cat": "Analytics"},
    {"name": "Metabase", "url": "https://www.metabase.com/docs/latest/api-documentation", "desc": "Open source BI API", "cat": "Analytics"},
    {"name": "Superset", "url": "https://superset.apache.org/docs/api/", "desc": "Apache BI platform API", "cat": "Analytics"},
    {"name": "Looker", "url": "https://developers.looker.com/api/overview", "desc": "Google BI platform API", "cat": "Analytics"},
    
    # Misc useful APIs (50 more)
    {"name": "OpenAI Whisper", "url": "https://platform.openai.com/docs/guides/speech-to-text", "desc": "Speech to text API", "cat": "AI & ML"},
    {"name": "AssemblyAI", "url": "https://www.assemblyai.com/docs", "desc": "Speech recognition API", "cat": "AI & ML"},
    {"name": "Deepgram", "url": "https://developers.deepgram.com/docs", "desc": "Voice AI platform API", "cat": "AI & ML"},
    {"name": "Rev.ai", "url": "https://docs.rev.ai/", "desc": "Speech recognition API", "cat": "AI & ML"},
    {"name": "Speechmatics", "url": "https://docs.speechmatics.com/", "desc": "Speech technology API", "cat": "AI & ML"},
    {"name": "Symbl.ai", "url": "https://docs.symbl.ai/docs", "desc": "Conversation intelligence API", "cat": "AI & ML"},
    {"name": "Hume AI", "url": "https://docs.hume.ai/", "desc": "Emotion AI API", "cat": "AI & ML"},
    {"name": "Affectiva", "url": "https://developer.affectiva.com/", "desc": "Emotion recognition API", "cat": "AI & ML"},
    {"name": "Lobe", "url": "https://lobe.ai/", "desc": "ML model training by Microsoft", "cat": "AI & ML"},
    {"name": "Teachable Machine", "url": "https://teachablemachine.withgoogle.com/", "desc": "Google ML training tool", "cat": "AI & ML"},
    {"name": "Roboflow", "url": "https://docs.roboflow.com/", "desc": "Computer vision platform API", "cat": "AI & ML"},
    {"name": "Clarifai", "url": "https://docs.clarifai.com/api-guide/api-overview", "desc": "AI platform for unstructured data", "cat": "AI & ML"},
    {"name": "Hugging Face", "url": "https://huggingface.co/docs/api-inference/index", "desc": "ML model hub API", "cat": "AI & ML"},
    {"name": "Weights & Biases", "url": "https://docs.wandb.ai/ref/python", "desc": "ML experiment tracking API", "cat": "AI & ML"},
    {"name": "MLflow", "url": "https://mlflow.org/docs/latest/rest-api.html", "desc": "ML lifecycle platform API", "cat": "AI & ML"},
    {"name": "Neptune.ai", "url": "https://docs.neptune.ai/api-reference", "desc": "ML metadata store API", "cat": "AI & ML"},
    {"name": "Comet", "url": "https://www.comet.com/docs/v2/api-and-sdk/rest-api/", "desc": "ML experiment platform API", "cat": "AI & ML"},
    {"name": "DVC", "url": "https://dvc.org/doc/api-reference", "desc": "Data version control API", "cat": "AI & ML"},
    {"name": "Label Studio", "url": "https://labelstud.io/api", "desc": "Data labeling platform API", "cat": "AI & ML"},
    {"name": "Scale AI", "url": "https://docs.scale.com/reference", "desc": "Data annotation API", "cat": "AI & ML"},
    {"name": "Labelbox", "url": "https://docs.labelbox.com/reference", "desc": "Training data platform API", "cat": "AI & ML"},
    {"name": "Snorkel", "url": "https://snorkel.ai/documentation/", "desc": "AI data development API", "cat": "AI & ML"},
    {"name": "Great Expectations", "url": "https://docs.greatexpectations.io/docs/reference/api_reference", "desc": "Data quality API", "cat": "Data & Analytics"},
    {"name": "dbt", "url": "https://docs.getdbt.com/docs/dbt-cloud-apis/overview", "desc": "Data transformation API", "cat": "Data & Analytics"},
    {"name": "Fivetran", "url": "https://fivetran.com/docs/rest-api", "desc": "Data integration API", "cat": "Data & Analytics"},
    {"name": "Airbyte", "url": "https://reference.airbyte.com/reference/", "desc": "Open source data integration API", "cat": "Data & Analytics"},
    {"name": "Stitch", "url": "https://www.stitchdata.com/docs/developers", "desc": "ETL service API", "cat": "Data & Analytics"},
    {"name": "Census", "url": "https://docs.getcensus.com/api", "desc": "Reverse ETL platform API", "cat": "Data & Analytics"},
    {"name": "Hightouch", "url": "https://hightouch.com/docs/api", "desc": "Reverse ETL platform API", "cat": "Data & Analytics"},
    {"name": "Snowflake", "url": "https://docs.snowflake.com/en/developer-guide/sql-api/", "desc": "Data cloud platform API", "cat": "Data & Analytics"},
    {"name": "Databricks", "url": "https://docs.databricks.com/api/", "desc": "Data and AI platform API", "cat": "Data & Analytics"},
    {"name": "BigQuery", "url": "https://cloud.google.com/bigquery/docs/reference/rest", "desc": "Google data warehouse API", "cat": "Data & Analytics"},
    {"name": "Redshift", "url": "https://docs.aws.amazon.com/redshift/latest/APIReference/", "desc": "AWS data warehouse API", "cat": "Data & Analytics"},
    {"name": "Clickhouse", "url": "https://clickhouse.com/docs/en/sql-reference", "desc": "Column-oriented database API", "cat": "Databases"},
    {"name": "TimescaleDB", "url": "https://docs.timescale.com/api/latest/", "desc": "Time-series database API", "cat": "Databases"},
    {"name": "InfluxDB", "url": "https://docs.influxdata.com/influxdb/cloud/api/", "desc": "Time series platform API", "cat": "Databases"},
    {"name": "QuestDB", "url": "https://questdb.io/docs/reference/api/rest/", "desc": "Time series database API", "cat": "Databases"},
    {"name": "CockroachDB", "url": "https://www.cockroachlabs.com/docs/stable/api-support-policy.html", "desc": "Distributed SQL database", "cat": "Databases"},
    {"name": "PlanetScale", "url": "https://planetscale.com/docs/concepts/api", "desc": "Serverless MySQL API", "cat": "Databases"},
    {"name": "Neon", "url": "https://neon.tech/docs/reference/api-reference", "desc": "Serverless Postgres API", "cat": "Databases"},
    {"name": "Supabase", "url": "https://supabase.com/docs/reference", "desc": "Open source Firebase alternative", "cat": "Databases"},
    {"name": "Firebase", "url": "https://firebase.google.com/docs/reference", "desc": "App development platform API", "cat": "Databases"},
    {"name": "FaunaDB", "url": "https://docs.fauna.com/fauna/current/reference/http/", "desc": "Distributed database API", "cat": "Databases"},
    {"name": "MongoDB Atlas", "url": "https://www.mongodb.com/docs/atlas/api/", "desc": "MongoDB cloud database API", "cat": "Databases"},
    {"name": "Redis Cloud", "url": "https://docs.redis.com/latest/rc/api/", "desc": "Redis cloud database API", "cat": "Databases"},
    {"name": "Upstash", "url": "https://upstash.com/docs/redis/overall/redisapi", "desc": "Serverless Redis API", "cat": "Databases"},
    {"name": "Xata", "url": "https://xata.io/docs/api-reference", "desc": "Serverless database API", "cat": "Databases"},
    {"name": "EdgeDB", "url": "https://www.edgedb.com/docs/reference/protocol", "desc": "Graph-relational database API", "cat": "Databases"},
    {"name": "SurrealDB", "url": "https://surrealdb.com/docs/integration/http", "desc": "Multi-model database API", "cat": "Databases"},
    {"name": "Dgraph", "url": "https://dgraph.io/docs/graphql/api/", "desc": "Native GraphQL database", "cat": "Databases"},
]

def main():
    print("="*60)
    print("APIClaw Night Expansion Batch 2 - 2026-02-24 02:00")
    print("="*60)
    
    # Load existing registry
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    existing_ids = {api['id'] for api in registry['apis']}
    existing_names = {api['name'].lower() for api in registry['apis']}
    initial_count = len(registry['apis'])
    
    print(f"Current registry: {initial_count} APIs")
    print(f"Processing {len(MORE_APIS)} additional APIs...")
    
    added = 0
    skipped = 0
    
    for entry in MORE_APIS:
        # Generate ID
        api_id = entry['name'].lower().replace(' ', '-').replace('.', '-').replace('_', '-')
        api_id = re.sub(r'[^a-z0-9-]', '', api_id)
        api_id = re.sub(r'-+', '-', api_id).strip('-')
        
        # Skip if already exists
        if api_id in existing_ids or entry['name'].lower() in existing_names:
            skipped += 1
            continue
        
        # Create API entry
        api_entry = {
            "id": api_id,
            "name": entry['name'],
            "description": entry.get('desc', f"{entry['name']} API"),
            "category": entry.get('cat', 'Other'),
            "auth": "apikey",
            "https": True,
            "cors": "unknown",
            "link": entry.get('url', ''),
            "pricing": "unknown",
            "keywords": extract_keywords(entry['name'], entry.get('desc', ''), entry.get('cat', ''))
        }
        
        registry['apis'].append(api_entry)
        existing_ids.add(api_id)
        existing_names.add(entry['name'].lower())
        added += 1
    
    # Update metadata
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = datetime.now().isoformat()
    registry['version'] = "3.2.3"
    
    # Save registry
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)
    
    final_count = len(registry['apis'])
    
    print(f"\nResults:")
    print(f"  Added: {added}")
    print(f"  Skipped (duplicates): {skipped}")
    print(f"  Total APIs: {initial_count} → {final_count}")
    print(f"\nRegistry updated!")

if __name__ == "__main__":
    main()
