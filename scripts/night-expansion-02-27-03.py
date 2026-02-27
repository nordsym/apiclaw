#!/usr/bin/env python3
"""APIClaw Night Expansion - 2026-02-27 03:00 batch"""

import json
from datetime import datetime

# Batch 1: E-commerce & Retail APIs
ECOMMERCE_APIS = [
    {"name": "Shopify Admin API", "description": "Manage Shopify stores programmatically", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://shopify.dev/docs/admin-api"},
    {"name": "Shopify Storefront API", "description": "Build custom storefronts with GraphQL", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://shopify.dev/docs/storefront-api"},
    {"name": "WooCommerce REST API", "description": "WordPress e-commerce platform API", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs/"},
    {"name": "BigCommerce API", "description": "Enterprise e-commerce platform", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://developer.bigcommerce.com/"},
    {"name": "Magento REST API", "description": "Adobe Commerce platform API", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html"},
    {"name": "Square API", "description": "Payments, orders, inventory management", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://developer.squareup.com/"},
    {"name": "Etsy API", "description": "Handmade marketplace API", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://developers.etsy.com/documentation/"},
    {"name": "eBay Browse API", "description": "Search and browse eBay listings", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://developer.ebay.com/api-docs/buy/browse/overview.html"},
    {"name": "eBay Sell API", "description": "List and manage eBay inventory", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://developer.ebay.com/api-docs/sell/inventory/overview.html"},
    {"name": "Amazon SP-API", "description": "Amazon Selling Partner API", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://developer-docs.amazon.com/sp-api/"},
    {"name": "Printful API", "description": "Print-on-demand dropshipping", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://developers.printful.com/docs/"},
    {"name": "Printify API", "description": "Custom print products API", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://developers.printify.com/"},
    {"name": "Oberlo API", "description": "Dropshipping product sourcing", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://oberlo.com/"},
    {"name": "Spocket API", "description": "US/EU dropshipping suppliers", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.spocket.co/"},
    {"name": "Snipcart API", "description": "Developer-first shopping cart", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://docs.snipcart.com/v3/api-reference/"},
    {"name": "Paddle API", "description": "SaaS billing and subscriptions", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://developer.paddle.com/"},
    {"name": "FastSpring API", "description": "Digital commerce platform", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://fastspring.com/docs/"},
    {"name": "Gumroad API", "description": "Sell digital products directly", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://gumroad.com/api"},
    {"name": "Podia API", "description": "Online courses and memberships", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.podia.com/"},
    {"name": "Sellix API", "description": "Digital product marketplace", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://docs.sellix.io/"},
    {"name": "Lemon Squeezy API", "description": "Software payments made easy", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://docs.lemonsqueezy.com/api"},
    {"name": "Medusa Commerce API", "description": "Open source headless commerce", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://docs.medusajs.com/api/"},
    {"name": "Saleor API", "description": "GraphQL-first e-commerce", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://docs.saleor.io/docs/3.x/api-reference/"},
    {"name": "Vendure API", "description": "TypeScript headless commerce", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.vendure.io/docs/"},
    {"name": "Crystallize API", "description": "Headless PIM and commerce", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://crystallize.com/learn/developer-guides/api"},
]

# Batch 2: Marketing & Analytics APIs
MARKETING_APIS = [
    {"name": "Mailchimp API", "description": "Email marketing automation", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://mailchimp.com/developer/"},
    {"name": "SendGrid API", "description": "Transactional email service", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://docs.sendgrid.com/api-reference/"},
    {"name": "Mailgun API", "description": "Email API for developers", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://documentation.mailgun.com/en/latest/api_reference.html"},
    {"name": "Postmark API", "description": "Fast transactional email", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://postmarkapp.com/developer"},
    {"name": "Amazon SES API", "description": "AWS Simple Email Service", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/ses/latest/APIReference/"},
    {"name": "ConvertKit API", "description": "Creator email marketing", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.convertkit.com/"},
    {"name": "Drip API", "description": "E-commerce email automation", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developer.drip.com/"},
    {"name": "ActiveCampaign API", "description": "Marketing automation platform", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.activecampaign.com/"},
    {"name": "HubSpot API", "description": "CRM and marketing platform", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.hubspot.com/docs/api/overview"},
    {"name": "Salesforce API", "description": "CRM platform APIs", "category": "CRM", "authType": "oauth", "baseUrl": "https://developer.salesforce.com/docs/apis"},
    {"name": "Pipedrive API", "description": "Sales CRM for small teams", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.pipedrive.com/docs/api/v1"},
    {"name": "Zoho CRM API", "description": "Cloud-based CRM platform", "category": "CRM", "authType": "oauth", "baseUrl": "https://www.zoho.com/crm/developer/docs/api/v2/"},
    {"name": "Freshsales API", "description": "AI-powered CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.freshsales.io/"},
    {"name": "Close API", "description": "CRM for startups and SMBs", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developer.close.com/"},
    {"name": "Copper CRM API", "description": "Google Workspace CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developer.copper.com/"},
    {"name": "Intercom API", "description": "Customer messaging platform", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.intercom.com/docs"},
    {"name": "Crisp API", "description": "Customer messaging software", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://docs.crisp.chat/api/v1/"},
    {"name": "Drift API", "description": "Conversational marketing", "category": "Marketing", "authType": "oauth", "baseUrl": "https://devdocs.drift.com/"},
    {"name": "Zendesk API", "description": "Customer service platform", "category": "Support", "authType": "apiKey", "baseUrl": "https://developer.zendesk.com/api-reference/"},
    {"name": "Freshdesk API", "description": "Cloud helpdesk software", "category": "Support", "authType": "apiKey", "baseUrl": "https://developers.freshdesk.com/api/"},
    {"name": "Help Scout API", "description": "Customer support platform", "category": "Support", "authType": "oauth", "baseUrl": "https://developer.helpscout.com/"},
    {"name": "Segment API", "description": "Customer data platform", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/"},
    {"name": "Mixpanel API", "description": "Product analytics platform", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://developer.mixpanel.com/docs"},
    {"name": "Amplitude API", "description": "Product analytics", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://www.docs.developers.amplitude.com/"},
    {"name": "Heap API", "description": "Digital insights platform", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://developers.heap.io/"},
    {"name": "PostHog API", "description": "Open source product analytics", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://posthog.com/docs/api"},
    {"name": "Plausible API", "description": "Privacy-friendly analytics", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://plausible.io/docs/stats-api"},
    {"name": "Fathom Analytics API", "description": "Privacy-first website analytics", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://usefathom.com/api"},
    {"name": "Hotjar API", "description": "Heatmaps and user recordings", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://help.hotjar.com/hc/en-us/articles/115011867948-Hotjar-API-Reference"},
    {"name": "FullStory API", "description": "Digital experience intelligence", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://developer.fullstory.com/"},
]

# Batch 3: DevOps & Infrastructure APIs
DEVOPS_APIS = [
    {"name": "GitHub REST API", "description": "GitHub platform integration", "category": "DevOps", "authType": "oauth", "baseUrl": "https://docs.github.com/en/rest"},
    {"name": "GitHub GraphQL API", "description": "GitHub data via GraphQL", "category": "DevOps", "authType": "oauth", "baseUrl": "https://docs.github.com/en/graphql"},
    {"name": "GitLab API", "description": "GitLab DevOps platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.gitlab.com/ee/api/"},
    {"name": "Bitbucket API", "description": "Atlassian Git hosting", "category": "DevOps", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/cloud/bitbucket/rest/intro/"},
    {"name": "CircleCI API", "description": "Continuous integration platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://circleci.com/docs/api/v2/"},
    {"name": "Travis CI API", "description": "CI/CD for open source", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.travis-ci.com/api/"},
    {"name": "Jenkins API", "description": "Automation server API", "category": "DevOps", "authType": "basic", "baseUrl": "https://www.jenkins.io/doc/book/using/remote-access-api/"},
    {"name": "Buildkite API", "description": "CI/CD for scaling teams", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://buildkite.com/docs/apis"},
    {"name": "Drone CI API", "description": "Container-native CI/CD", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.drone.io/api/overview/"},
    {"name": "Vercel API", "description": "Frontend cloud platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://vercel.com/docs/rest-api"},
    {"name": "Netlify API", "description": "Jamstack platform API", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.netlify.com/api/get-started/"},
    {"name": "Railway API", "description": "Modern app deployment", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.railway.app/reference/public-api"},
    {"name": "Render API", "description": "Cloud application platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://api-docs.render.com/"},
    {"name": "Fly.io API", "description": "Deploy app servers close to users", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://fly.io/docs/machines/api/"},
    {"name": "Heroku Platform API", "description": "Cloud application platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://devcenter.heroku.com/articles/platform-api-reference"},
    {"name": "DigitalOcean API", "description": "Cloud infrastructure provider", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.digitalocean.com/reference/api/"},
    {"name": "Linode API", "description": "Cloud hosting platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://www.linode.com/docs/api/"},
    {"name": "Vultr API", "description": "Cloud compute provider", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://www.vultr.com/api/"},
    {"name": "AWS EC2 API", "description": "Amazon Elastic Compute Cloud", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/AWSEC2/latest/APIReference/"},
    {"name": "AWS Lambda API", "description": "Serverless compute", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/lambda/latest/dg/API_Reference.html"},
    {"name": "AWS S3 API", "description": "Object storage service", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/AmazonS3/latest/API/"},
    {"name": "Google Cloud Run API", "description": "Serverless containers", "category": "DevOps", "authType": "oauth", "baseUrl": "https://cloud.google.com/run/docs/reference/rest"},
    {"name": "Azure Functions API", "description": "Microsoft serverless compute", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference"},
    {"name": "Cloudflare API", "description": "CDN and security services", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://developers.cloudflare.com/api/"},
    {"name": "Cloudflare Workers API", "description": "Edge computing platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://developers.cloudflare.com/workers/"},
    {"name": "Fastly API", "description": "Edge cloud platform", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://developer.fastly.com/reference/api/"},
    {"name": "Bunny CDN API", "description": "Content delivery network", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.bunny.net/reference/bunnynet-api-overview"},
    {"name": "KeyCDN API", "description": "High-performance CDN", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://www.keycdn.com/api"},
    {"name": "Docker Hub API", "description": "Container registry", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://docs.docker.com/docker-hub/api/latest/"},
    {"name": "Kubernetes API", "description": "Container orchestration", "category": "DevOps", "authType": "apiKey", "baseUrl": "https://kubernetes.io/docs/reference/kubernetes-api/"},
]

# Batch 4: Productivity & Collaboration APIs
PRODUCTIVITY_APIS = [
    {"name": "Slack API", "description": "Team messaging platform", "category": "Communication", "authType": "oauth", "baseUrl": "https://api.slack.com/"},
    {"name": "Discord API", "description": "Gaming and community platform", "category": "Communication", "authType": "oauth", "baseUrl": "https://discord.com/developers/docs/intro"},
    {"name": "Microsoft Teams API", "description": "Enterprise collaboration", "category": "Communication", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/graph/teams-concept-overview"},
    {"name": "Zoom API", "description": "Video conferencing platform", "category": "Communication", "authType": "oauth", "baseUrl": "https://marketplace.zoom.us/docs/api-reference/zoom-api/"},
    {"name": "Google Meet API", "description": "Video meetings API", "category": "Communication", "authType": "oauth", "baseUrl": "https://developers.google.com/meet/api"},
    {"name": "Webex API", "description": "Cisco collaboration tools", "category": "Communication", "authType": "oauth", "baseUrl": "https://developer.webex.com/docs/api/getting-started"},
    {"name": "Notion API", "description": "Workspace and notes platform", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developers.notion.com/"},
    {"name": "Airtable API", "description": "Spreadsheet-database hybrid", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://airtable.com/developers/web/api/introduction"},
    {"name": "Coda API", "description": "Collaborative documents", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://coda.io/developers/apis/v1"},
    {"name": "Asana API", "description": "Work management platform", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developers.asana.com/docs"},
    {"name": "Monday.com API", "description": "Work OS platform", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://developer.monday.com/api-reference/docs"},
    {"name": "ClickUp API", "description": "Productivity platform", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://clickup.com/api/"},
    {"name": "Linear API", "description": "Issue tracking for teams", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://developers.linear.app/docs"},
    {"name": "Jira API", "description": "Project management platform", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/"},
    {"name": "Trello API", "description": "Kanban-style boards", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://developer.atlassian.com/cloud/trello/rest/"},
    {"name": "Basecamp API", "description": "Project management tool", "category": "Productivity", "authType": "oauth", "baseUrl": "https://github.com/basecamp/bc3-api"},
    {"name": "Todoist API", "description": "Task management app", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developer.todoist.com/rest/v2/"},
    {"name": "Things API", "description": "Personal task manager", "category": "Productivity", "authType": "none", "baseUrl": "https://culturedcode.com/things/support/articles/2803573/"},
    {"name": "Roam Research API", "description": "Note-taking tool for networked thought", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://roamresearch.com/"},
    {"name": "Obsidian Local REST API", "description": "Knowledge base note-taking", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://github.com/coddingtonbear/obsidian-local-rest-api"},
    {"name": "Google Calendar API", "description": "Calendar scheduling", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developers.google.com/calendar/api"},
    {"name": "Calendly API", "description": "Scheduling automation", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://developer.calendly.com/api-docs"},
    {"name": "Cal.com API", "description": "Open source scheduling", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://cal.com/docs/api-reference"},
    {"name": "Doodle API", "description": "Group scheduling tool", "category": "Productivity", "authType": "oauth", "baseUrl": "https://doodle.com/en/api/"},
    {"name": "Google Drive API", "description": "Cloud storage and collaboration", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developers.google.com/drive/api"},
    {"name": "Dropbox API", "description": "Cloud file storage", "category": "Productivity", "authType": "oauth", "baseUrl": "https://www.dropbox.com/developers/documentation"},
    {"name": "Box API", "description": "Enterprise content management", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developer.box.com/reference/"},
    {"name": "OneDrive API", "description": "Microsoft cloud storage", "category": "Productivity", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/onedrive/developer/rest-api/"},
    {"name": "Figma API", "description": "Design collaboration platform", "category": "Design", "authType": "oauth", "baseUrl": "https://www.figma.com/developers/api"},
    {"name": "Canva API", "description": "Graphic design platform", "category": "Design", "authType": "oauth", "baseUrl": "https://www.canva.dev/docs/"},
]

# Batch 5: AI & Machine Learning APIs
AI_ML_APIS = [
    {"name": "OpenAI API", "description": "GPT and DALL-E models", "category": "AI", "authType": "apiKey", "baseUrl": "https://platform.openai.com/docs/api-reference"},
    {"name": "Anthropic Claude API", "description": "Claude AI assistant", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.anthropic.com/claude/reference/"},
    {"name": "Google Gemini API", "description": "Google's multimodal AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://ai.google.dev/docs"},
    {"name": "Cohere API", "description": "Enterprise NLP models", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.cohere.com/reference/about"},
    {"name": "Hugging Face Inference API", "description": "Open source ML models", "category": "AI", "authType": "apiKey", "baseUrl": "https://huggingface.co/docs/api-inference/"},
    {"name": "Replicate API", "description": "Run ML models in the cloud", "category": "AI", "authType": "apiKey", "baseUrl": "https://replicate.com/docs/reference/http"},
    {"name": "Stability AI API", "description": "Stable Diffusion image generation", "category": "AI", "authType": "apiKey", "baseUrl": "https://platform.stability.ai/docs/api-reference"},
    {"name": "Midjourney API", "description": "AI image generation", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.midjourney.com/"},
    {"name": "DALL-E API", "description": "OpenAI image generation", "category": "AI", "authType": "apiKey", "baseUrl": "https://platform.openai.com/docs/guides/images"},
    {"name": "ElevenLabs API", "description": "AI voice synthesis", "category": "AI", "authType": "apiKey", "baseUrl": "https://elevenlabs.io/docs/api-reference"},
    {"name": "Play.ht API", "description": "Text-to-speech AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.play.ht/"},
    {"name": "Murf AI API", "description": "AI voice generator", "category": "AI", "authType": "apiKey", "baseUrl": "https://murf.ai/api"},
    {"name": "Deepgram API", "description": "Speech recognition AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://developers.deepgram.com/docs"},
    {"name": "AssemblyAI API", "description": "Speech-to-text AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://www.assemblyai.com/docs/"},
    {"name": "Whisper API", "description": "OpenAI speech recognition", "category": "AI", "authType": "apiKey", "baseUrl": "https://platform.openai.com/docs/guides/speech-to-text"},
    {"name": "Rev AI API", "description": "Speech recognition service", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.rev.ai/"},
    {"name": "LangChain API", "description": "LLM application framework", "category": "AI", "authType": "apiKey", "baseUrl": "https://python.langchain.com/docs/"},
    {"name": "LlamaIndex API", "description": "Data framework for LLMs", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.llamaindex.ai/"},
    {"name": "Pinecone API", "description": "Vector database for AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.pinecone.io/reference/api/"},
    {"name": "Weaviate API", "description": "Vector search engine", "category": "AI", "authType": "apiKey", "baseUrl": "https://weaviate.io/developers/weaviate/api"},
    {"name": "Qdrant API", "description": "Vector similarity search", "category": "AI", "authType": "apiKey", "baseUrl": "https://qdrant.tech/documentation/"},
    {"name": "Chroma API", "description": "AI-native open-source embedding database", "category": "AI", "authType": "none", "baseUrl": "https://docs.trychroma.com/"},
    {"name": "Clarifai API", "description": "Computer vision AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.clarifai.com/api-guide/api-overview"},
    {"name": "Roboflow API", "description": "Computer vision deployment", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.roboflow.com/"},
    {"name": "Ultralytics API", "description": "YOLO object detection", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.ultralytics.com/"},
    {"name": "AWS Rekognition API", "description": "Image and video analysis", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/rekognition/latest/dg/API_Reference.html"},
    {"name": "Google Cloud Vision API", "description": "Image analysis service", "category": "AI", "authType": "apiKey", "baseUrl": "https://cloud.google.com/vision/docs/reference/rest"},
    {"name": "Azure Cognitive Services API", "description": "Microsoft AI services", "category": "AI", "authType": "apiKey", "baseUrl": "https://docs.microsoft.com/en-us/azure/cognitive-services/"},
    {"name": "Wolfram Alpha API", "description": "Computational knowledge engine", "category": "AI", "authType": "apiKey", "baseUrl": "https://products.wolframalpha.com/api/"},
    {"name": "IBM Watson API", "description": "Enterprise AI services", "category": "AI", "authType": "apiKey", "baseUrl": "https://cloud.ibm.com/docs/watson"},
]

# Batch 6: Data & Database APIs
DATA_APIS = [
    {"name": "Supabase API", "description": "Open source Firebase alternative", "category": "Database", "authType": "apiKey", "baseUrl": "https://supabase.com/docs/reference"},
    {"name": "Firebase Realtime Database", "description": "Google realtime database", "category": "Database", "authType": "apiKey", "baseUrl": "https://firebase.google.com/docs/database/rest/start"},
    {"name": "Firebase Firestore", "description": "NoSQL document database", "category": "Database", "authType": "apiKey", "baseUrl": "https://firebase.google.com/docs/firestore/use-rest-api"},
    {"name": "PlanetScale API", "description": "Serverless MySQL platform", "category": "Database", "authType": "apiKey", "baseUrl": "https://planetscale.com/docs/reference/api"},
    {"name": "Neon API", "description": "Serverless Postgres", "category": "Database", "authType": "apiKey", "baseUrl": "https://neon.tech/docs/reference/api-reference"},
    {"name": "CockroachDB API", "description": "Distributed SQL database", "category": "Database", "authType": "apiKey", "baseUrl": "https://www.cockroachlabs.com/docs/api/"},
    {"name": "MongoDB Atlas API", "description": "Cloud MongoDB service", "category": "Database", "authType": "apiKey", "baseUrl": "https://www.mongodb.com/docs/atlas/api/"},
    {"name": "FaunaDB API", "description": "Distributed document database", "category": "Database", "authType": "apiKey", "baseUrl": "https://docs.fauna.com/fauna/current/api/"},
    {"name": "Upstash Redis API", "description": "Serverless Redis", "category": "Database", "authType": "apiKey", "baseUrl": "https://docs.upstash.com/redis/features/restapi"},
    {"name": "Upstash Kafka API", "description": "Serverless Kafka", "category": "Database", "authType": "apiKey", "baseUrl": "https://docs.upstash.com/kafka/api"},
    {"name": "Convex API", "description": "Backend application platform", "category": "Database", "authType": "apiKey", "baseUrl": "https://docs.convex.dev/api"},
    {"name": "Xata API", "description": "Serverless database platform", "category": "Database", "authType": "apiKey", "baseUrl": "https://xata.io/docs/api-reference/"},
    {"name": "Turso API", "description": "Edge SQLite database", "category": "Database", "authType": "apiKey", "baseUrl": "https://docs.turso.tech/reference/"},
    {"name": "Deta Base API", "description": "Free NoSQL database", "category": "Database", "authType": "apiKey", "baseUrl": "https://deta.space/docs/en/reference/base/sdk"},
    {"name": "Hasura GraphQL API", "description": "Instant GraphQL on databases", "category": "Database", "authType": "apiKey", "baseUrl": "https://hasura.io/docs/latest/api-reference/graphql-api/index/"},
    {"name": "Prisma Data Platform API", "description": "ORM and database tools", "category": "Database", "authType": "apiKey", "baseUrl": "https://www.prisma.io/docs/data-platform"},
    {"name": "Algolia API", "description": "Search and discovery platform", "category": "Search", "authType": "apiKey", "baseUrl": "https://www.algolia.com/doc/api-reference/"},
    {"name": "Elasticsearch API", "description": "Search and analytics engine", "category": "Search", "authType": "apiKey", "baseUrl": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html"},
    {"name": "Meilisearch API", "description": "Fast search engine", "category": "Search", "authType": "apiKey", "baseUrl": "https://www.meilisearch.com/docs/reference/api/overview"},
    {"name": "Typesense API", "description": "Fast typo-tolerant search", "category": "Search", "authType": "apiKey", "baseUrl": "https://typesense.org/docs/0.24.0/api/"},
    {"name": "Apache Solr API", "description": "Enterprise search platform", "category": "Search", "authType": "basic", "baseUrl": "https://solr.apache.org/guide/solr/latest/"},
    {"name": "Socrata Open Data API", "description": "Government open data", "category": "Data", "authType": "apiKey", "baseUrl": "https://dev.socrata.com/docs/endpoints.html"},
    {"name": "Data.gov API", "description": "US government data catalog", "category": "Data", "authType": "none", "baseUrl": "https://www.data.gov/developers/apis"},
    {"name": "World Bank API", "description": "Global development data", "category": "Data", "authType": "none", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information"},
    {"name": "UN Data API", "description": "United Nations statistics", "category": "Data", "authType": "none", "baseUrl": "https://data.un.org/Host.aspx?Content=API"},
    {"name": "Eurostat API", "description": "European statistics", "category": "Data", "authType": "none", "baseUrl": "https://ec.europa.eu/eurostat/web/main/data/web-services"},
    {"name": "Census API", "description": "US Census Bureau data", "category": "Data", "authType": "apiKey", "baseUrl": "https://www.census.gov/data/developers/data-sets.html"},
    {"name": "FRED API", "description": "Federal Reserve economic data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://fred.stlouisfed.org/docs/api/"},
    {"name": "Yahoo Finance API", "description": "Stock market data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.yahoofinanceapi.com/"},
    {"name": "Alpha Vantage API", "description": "Stock and crypto data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.alphavantage.co/documentation/"},
]

# Batch 7: Media & Entertainment APIs
MEDIA_APIS = [
    {"name": "Spotify Web API", "description": "Music streaming platform", "category": "Media", "authType": "oauth", "baseUrl": "https://developer.spotify.com/documentation/web-api/"},
    {"name": "Apple Music API", "description": "Apple music service", "category": "Media", "authType": "apiKey", "baseUrl": "https://developer.apple.com/documentation/applemusicapi"},
    {"name": "SoundCloud API", "description": "Audio platform", "category": "Media", "authType": "oauth", "baseUrl": "https://developers.soundcloud.com/docs/api/guide"},
    {"name": "Deezer API", "description": "Music streaming service", "category": "Media", "authType": "oauth", "baseUrl": "https://developers.deezer.com/api"},
    {"name": "Tidal API", "description": "Hi-fi music streaming", "category": "Media", "authType": "oauth", "baseUrl": "https://developer.tidal.com/"},
    {"name": "YouTube Data API", "description": "YouTube video platform", "category": "Media", "authType": "apiKey", "baseUrl": "https://developers.google.com/youtube/v3/docs"},
    {"name": "Vimeo API", "description": "Video hosting platform", "category": "Media", "authType": "oauth", "baseUrl": "https://developer.vimeo.com/api/reference"},
    {"name": "Twitch API", "description": "Live streaming platform", "category": "Media", "authType": "oauth", "baseUrl": "https://dev.twitch.tv/docs/api/reference"},
    {"name": "Dailymotion API", "description": "Video sharing platform", "category": "Media", "authType": "oauth", "baseUrl": "https://developer.dailymotion.com/api/"},
    {"name": "Mux API", "description": "Video infrastructure", "category": "Media", "authType": "apiKey", "baseUrl": "https://docs.mux.com/api-reference"},
    {"name": "Cloudinary API", "description": "Media management platform", "category": "Media", "authType": "apiKey", "baseUrl": "https://cloudinary.com/documentation/cloudinary_references"},
    {"name": "Imgix API", "description": "Real-time image processing", "category": "Media", "authType": "apiKey", "baseUrl": "https://docs.imgix.com/apis/rendering"},
    {"name": "Uploadcare API", "description": "File uploading and delivery", "category": "Media", "authType": "apiKey", "baseUrl": "https://uploadcare.com/api-refs/"},
    {"name": "ImageKit API", "description": "Image CDN and optimization", "category": "Media", "authType": "apiKey", "baseUrl": "https://docs.imagekit.io/api-reference/api-introduction"},
    {"name": "Unsplash API", "description": "Free high-res photos", "category": "Media", "authType": "apiKey", "baseUrl": "https://unsplash.com/documentation"},
    {"name": "Pexels API", "description": "Free stock photos and videos", "category": "Media", "authType": "apiKey", "baseUrl": "https://www.pexels.com/api/documentation/"},
    {"name": "Pixabay API", "description": "Free images and videos", "category": "Media", "authType": "apiKey", "baseUrl": "https://pixabay.com/api/docs/"},
    {"name": "Giphy API", "description": "GIF search and sharing", "category": "Media", "authType": "apiKey", "baseUrl": "https://developers.giphy.com/docs/api/"},
    {"name": "Tenor API", "description": "GIF platform by Google", "category": "Media", "authType": "apiKey", "baseUrl": "https://tenor.com/gifapi/documentation"},
    {"name": "TMDb API", "description": "Movie database", "category": "Media", "authType": "apiKey", "baseUrl": "https://developers.themoviedb.org/3"},
    {"name": "OMDb API", "description": "Open movie database", "category": "Media", "authType": "apiKey", "baseUrl": "https://www.omdbapi.com/"},
    {"name": "IMDb API", "description": "Movie and TV database", "category": "Media", "authType": "apiKey", "baseUrl": "https://developer.imdb.com/"},
    {"name": "TVmaze API", "description": "TV show information", "category": "Media", "authType": "none", "baseUrl": "https://www.tvmaze.com/api"},
    {"name": "RAWG API", "description": "Video games database", "category": "Media", "authType": "apiKey", "baseUrl": "https://rawg.io/apidocs"},
    {"name": "IGDB API", "description": "Internet Game Database", "category": "Media", "authType": "oauth", "baseUrl": "https://api-docs.igdb.com/"},
    {"name": "Steam Web API", "description": "Steam gaming platform", "category": "Media", "authType": "apiKey", "baseUrl": "https://developer.valvesoftware.com/wiki/Steam_Web_API"},
    {"name": "Podcast Index API", "description": "Podcast database", "category": "Media", "authType": "apiKey", "baseUrl": "https://podcastindex-org.github.io/docs-api/"},
    {"name": "Listen Notes API", "description": "Podcast search engine", "category": "Media", "authType": "apiKey", "baseUrl": "https://www.listennotes.com/api/docs/"},
    {"name": "Audible API", "description": "Audiobook platform", "category": "Media", "authType": "oauth", "baseUrl": "https://www.audible.com/"},
    {"name": "Google Books API", "description": "Book search and metadata", "category": "Media", "authType": "apiKey", "baseUrl": "https://developers.google.com/books/docs/v1/reference"},
]

# Batch 8: Utility & Miscellaneous APIs
UTILITY_APIS = [
    {"name": "IP-API", "description": "IP geolocation service", "category": "Utilities", "authType": "none", "baseUrl": "https://ip-api.com/docs/"},
    {"name": "ipinfo.io API", "description": "IP address data", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://ipinfo.io/developers"},
    {"name": "MaxMind GeoIP2", "description": "IP geolocation database", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://dev.maxmind.com/geoip/docs/web-services"},
    {"name": "Abstract API", "description": "Suite of utility APIs", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/"},
    {"name": "APILayer", "description": "API marketplace", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://apilayer.com/"},
    {"name": "RapidAPI", "description": "API marketplace hub", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://rapidapi.com/"},
    {"name": "VAT Layers API", "description": "EU VAT validation", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://vatlayer.com/documentation"},
    {"name": "Country.io API", "description": "Country information", "category": "Utilities", "authType": "none", "baseUrl": "http://country.io/"},
    {"name": "REST Countries API", "description": "Country data API", "category": "Utilities", "authType": "none", "baseUrl": "https://restcountries.com/"},
    {"name": "Country State City API", "description": "Geographic data", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://countrystatecity.in/docs/"},
    {"name": "Zippopotam.us", "description": "Postal code lookup", "category": "Utilities", "authType": "none", "baseUrl": "http://www.zippopotam.us/"},
    {"name": "Postcode.io API", "description": "UK postcode lookup", "category": "Utilities", "authType": "none", "baseUrl": "https://postcodes.io/docs"},
    {"name": "Random User API", "description": "Random user data generator", "category": "Utilities", "authType": "none", "baseUrl": "https://randomuser.me/documentation"},
    {"name": "UUID Generator API", "description": "Generate UUIDs", "category": "Utilities", "authType": "none", "baseUrl": "https://www.uuidtools.com/api"},
    {"name": "Lorem Ipsum API", "description": "Placeholder text generator", "category": "Utilities", "authType": "none", "baseUrl": "https://loripsum.net/"},
    {"name": "JSONPlaceholder", "description": "Fake REST API for testing", "category": "Utilities", "authType": "none", "baseUrl": "https://jsonplaceholder.typicode.com/"},
    {"name": "ReqRes API", "description": "Fake REST API for testing", "category": "Utilities", "authType": "none", "baseUrl": "https://reqres.in/"},
    {"name": "httpbin API", "description": "HTTP request testing", "category": "Utilities", "authType": "none", "baseUrl": "https://httpbin.org/"},
    {"name": "What3words API", "description": "3-word location system", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developer.what3words.com/public-api"},
    {"name": "Nominatim API", "description": "OpenStreetMap geocoding", "category": "Utilities", "authType": "none", "baseUrl": "https://nominatim.org/release-docs/latest/api/Overview/"},
    {"name": "Mapbox Geocoding API", "description": "Location search", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://docs.mapbox.com/api/search/geocoding/"},
    {"name": "Google Geocoding API", "description": "Address to coordinates", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developers.google.com/maps/documentation/geocoding/overview"},
    {"name": "HERE Geocoding API", "description": "Location services", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html"},
    {"name": "Open-Meteo API", "description": "Free weather API", "category": "Weather", "authType": "none", "baseUrl": "https://open-meteo.com/en/docs"},
    {"name": "OpenWeatherMap API", "description": "Weather data service", "category": "Weather", "authType": "apiKey", "baseUrl": "https://openweathermap.org/api"},
    {"name": "WeatherAPI", "description": "Weather and geo data", "category": "Weather", "authType": "apiKey", "baseUrl": "https://www.weatherapi.com/docs/"},
    {"name": "Visual Crossing API", "description": "Weather data and history", "category": "Weather", "authType": "apiKey", "baseUrl": "https://www.visualcrossing.com/resources/documentation/"},
    {"name": "Tomorrow.io API", "description": "Weather intelligence platform", "category": "Weather", "authType": "apiKey", "baseUrl": "https://docs.tomorrow.io/"},
    {"name": "NewsAPI", "description": "News article search", "category": "News", "authType": "apiKey", "baseUrl": "https://newsapi.org/docs"},
    {"name": "GNews API", "description": "Google News aggregator", "category": "News", "authType": "apiKey", "baseUrl": "https://gnews.io/docs/v4"},
]

# Batch 9: Security & Authentication APIs
SECURITY_APIS = [
    {"name": "Auth0 API", "description": "Identity platform", "category": "Security", "authType": "apiKey", "baseUrl": "https://auth0.com/docs/api"},
    {"name": "Okta API", "description": "Identity management", "category": "Security", "authType": "apiKey", "baseUrl": "https://developer.okta.com/docs/reference/"},
    {"name": "Clerk API", "description": "User management platform", "category": "Security", "authType": "apiKey", "baseUrl": "https://clerk.com/docs/reference/backend-api"},
    {"name": "Supabase Auth API", "description": "Authentication service", "category": "Security", "authType": "apiKey", "baseUrl": "https://supabase.com/docs/reference/javascript/auth-api"},
    {"name": "Firebase Auth API", "description": "Google authentication", "category": "Security", "authType": "apiKey", "baseUrl": "https://firebase.google.com/docs/reference/rest/auth"},
    {"name": "AWS Cognito API", "description": "User pools and identity", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-reference.html"},
    {"name": "Stytch API", "description": "Passwordless authentication", "category": "Security", "authType": "apiKey", "baseUrl": "https://stytch.com/docs/api"},
    {"name": "Magic Link API", "description": "Web3 authentication", "category": "Security", "authType": "apiKey", "baseUrl": "https://magic.link/docs/api-reference/"},
    {"name": "WorkOS API", "description": "Enterprise SSO", "category": "Security", "authType": "apiKey", "baseUrl": "https://workos.com/docs/reference"},
    {"name": "Passage by 1Password", "description": "Passkey authentication", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.passage.id/"},
    {"name": "Snyk API", "description": "Security vulnerability scanning", "category": "Security", "authType": "apiKey", "baseUrl": "https://snyk.docs.apiary.io/"},
    {"name": "Checkmarx API", "description": "Application security testing", "category": "Security", "authType": "apiKey", "baseUrl": "https://checkmarx.com/resource/documents/en/34965-68730-checkmarx-one-api.html"},
    {"name": "SonarQube API", "description": "Code quality and security", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.sonarqube.org/latest/extension-guide/web-api/"},
    {"name": "Have I Been Pwned API", "description": "Data breach checking", "category": "Security", "authType": "apiKey", "baseUrl": "https://haveibeenpwned.com/API/v3"},
    {"name": "VirusTotal API", "description": "File and URL scanning", "category": "Security", "authType": "apiKey", "baseUrl": "https://developers.virustotal.com/reference/overview"},
    {"name": "Shodan API", "description": "Internet intelligence", "category": "Security", "authType": "apiKey", "baseUrl": "https://developer.shodan.io/api"},
    {"name": "SecurityTrails API", "description": "DNS and domain intelligence", "category": "Security", "authType": "apiKey", "baseUrl": "https://securitytrails.com/corp/api"},
    {"name": "Censys API", "description": "Internet asset discovery", "category": "Security", "authType": "apiKey", "baseUrl": "https://search.censys.io/api"},
    {"name": "ReCAPTCHA API", "description": "Bot protection", "category": "Security", "authType": "apiKey", "baseUrl": "https://developers.google.com/recaptcha/docs/v3"},
    {"name": "hCaptcha API", "description": "Privacy-focused captcha", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.hcaptcha.com/"},
    {"name": "Cloudflare Turnstile API", "description": "CAPTCHA alternative", "category": "Security", "authType": "apiKey", "baseUrl": "https://developers.cloudflare.com/turnstile/"},
    {"name": "Vault by HashiCorp API", "description": "Secrets management", "category": "Security", "authType": "apiKey", "baseUrl": "https://developer.hashicorp.com/vault/api-docs"},
    {"name": "1Password Connect API", "description": "Password manager integration", "category": "Security", "authType": "apiKey", "baseUrl": "https://developer.1password.com/docs/connect/"},
    {"name": "Doppler API", "description": "Secrets management platform", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.doppler.com/reference/api"},
    {"name": "Infisical API", "description": "Open source secrets management", "category": "Security", "authType": "apiKey", "baseUrl": "https://infisical.com/docs/api-reference/overview/introduction"},
]

# Batch 10: Blockchain & Web3 APIs
WEB3_APIS = [
    {"name": "Ethereum JSON-RPC", "description": "Ethereum node interface", "category": "Blockchain", "authType": "none", "baseUrl": "https://ethereum.org/en/developers/docs/apis/json-rpc/"},
    {"name": "Alchemy API", "description": "Web3 development platform", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.alchemy.com/reference/api-overview"},
    {"name": "Infura API", "description": "Ethereum infrastructure", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.infura.io/networks/ethereum"},
    {"name": "QuickNode API", "description": "Multi-chain infrastructure", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://www.quicknode.com/docs/welcome"},
    {"name": "Moralis API", "description": "Web3 data API", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.moralis.io/web3-data-api"},
    {"name": "The Graph API", "description": "Blockchain data indexing", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://thegraph.com/docs/en/"},
    {"name": "Chainlink API", "description": "Decentralized oracles", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.chain.link/"},
    {"name": "OpenSea API", "description": "NFT marketplace", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.opensea.io/reference/api-overview"},
    {"name": "Rarible API", "description": "Multi-chain NFT protocol", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.rarible.org/"},
    {"name": "Zora API", "description": "NFT infrastructure", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.zora.co/docs/zora-api/intro"},
    {"name": "Uniswap API", "description": "DEX protocol data", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.uniswap.org/api/subgraph/overview"},
    {"name": "Aave API", "description": "DeFi lending protocol", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.aave.com/developers/"},
    {"name": "Compound API", "description": "DeFi protocol", "category": "Blockchain", "authType": "none", "baseUrl": "https://compound.finance/docs"},
    {"name": "Solana JSON-RPC", "description": "Solana blockchain API", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.solana.com/developing/clients/jsonrpc-api"},
    {"name": "Helius API", "description": "Solana developer platform", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.helius.dev/"},
    {"name": "Polygon API", "description": "Ethereum scaling solution", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://wiki.polygon.technology/docs/tools/apis/"},
    {"name": "Arbitrum API", "description": "Ethereum L2 scaling", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.arbitrum.io/"},
    {"name": "Optimism API", "description": "Ethereum L2 network", "category": "Blockchain", "authType": "none", "baseUrl": "https://community.optimism.io/docs/developers/"},
    {"name": "Base API", "description": "Coinbase L2 chain", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.base.org/"},
    {"name": "zkSync API", "description": "zkRollup L2 solution", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.zksync.io/build"},
    {"name": "Starknet API", "description": "Ethereum validity rollup", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.starknet.io/documentation/"},
    {"name": "Avalanche API", "description": "High-performance blockchain", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.avax.network/reference"},
    {"name": "BNB Chain API", "description": "Binance blockchain", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.bnbchain.org/docs/beaconchain/develop/api-reference/"},
    {"name": "Near Protocol API", "description": "Sharded blockchain", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.near.org/api/rpc/introduction"},
    {"name": "Cosmos API", "description": "Interchain ecosystem", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.cosmos.network/main/modules/staking/05_client"},
]

# Combine all batches
ALL_APIS = (
    ECOMMERCE_APIS +
    MARKETING_APIS +
    DEVOPS_APIS +
    PRODUCTIVITY_APIS +
    AI_ML_APIS +
    DATA_APIS +
    MEDIA_APIS +
    UTILITY_APIS +
    SECURITY_APIS +
    WEB3_APIS
)

def main():
    print(f"📦 Night Expansion 02-27 03:00")
    print(f"   Total new APIs: {len(ALL_APIS)}")
    
    # Save to file
    output_file = f"/Users/gustavhemmingsson/Projects/apiclaw/data/night-expansion-02-27-03.json"
    with open(output_file, 'w') as f:
        json.dump(ALL_APIS, f, indent=2)
    
    print(f"   Saved to: {output_file}")
    
    # Count by category
    categories = {}
    for api in ALL_APIS:
        cat = api.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📊 By category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:15]:
        print(f"   {cat}: {count}")
    
    return len(ALL_APIS)

if __name__ == "__main__":
    main()
