#!/usr/bin/env python3
"""
APIClaw Night Expansion - 05:00 batch
Target: 1000+ new APIs
Focus: Comprehensive coverage of underrepresented categories
"""

import json
import os
from datetime import datetime

# New APIs to add - organized by category
NEW_APIS = [
    # ===== DEVELOPMENT TOOLS (100+) =====
    {"name": "Postman", "description": "API development platform for testing and documentation", "category": "Development", "baseUrl": "https://www.postman.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Insomnia", "description": "REST API client for debugging and testing", "category": "Development", "baseUrl": "https://insomnia.rest/", "authType": "none", "pricing": "free"},
    {"name": "Hoppscotch", "description": "Open source API development ecosystem", "category": "Development", "baseUrl": "https://hoppscotch.io/", "authType": "none", "pricing": "free"},
    {"name": "RapidAPI", "description": "World's largest API marketplace", "category": "Development", "baseUrl": "https://rapidapi.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Swagger", "description": "API documentation and design tools", "category": "Development", "baseUrl": "https://swagger.io/", "authType": "none", "pricing": "freemium"},
    {"name": "OpenAPI Generator", "description": "Generate API client libraries from OpenAPI specs", "category": "Development", "baseUrl": "https://openapi-generator.tech/", "authType": "none", "pricing": "free"},
    {"name": "Stoplight", "description": "API design, documentation and governance platform", "category": "Development", "baseUrl": "https://stoplight.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ReadMe", "description": "API documentation and developer hub platform", "category": "Development", "baseUrl": "https://readme.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Treblle", "description": "API intelligence and monitoring platform", "category": "Development", "baseUrl": "https://treblle.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Mockoon", "description": "Create mock APIs in seconds", "category": "Development", "baseUrl": "https://mockoon.com/", "authType": "none", "pricing": "free"},
    {"name": "Prism", "description": "API mock server and validation proxy", "category": "Development", "baseUrl": "https://stoplight.io/prism/", "authType": "none", "pricing": "free"},
    {"name": "WireMock", "description": "Flexible API mocking and stubbing tool", "category": "Development", "baseUrl": "https://wiremock.org/", "authType": "none", "pricing": "free"},
    {"name": "JSON Server", "description": "Get a full fake REST API with zero coding", "category": "Development", "baseUrl": "https://github.com/typicode/json-server", "authType": "none", "pricing": "free"},
    {"name": "Mirage JS", "description": "API mocking library for frontend development", "category": "Development", "baseUrl": "https://miragejs.com/", "authType": "none", "pricing": "free"},
    {"name": "MSW", "description": "Mock Service Worker for API mocking", "category": "Development", "baseUrl": "https://mswjs.io/", "authType": "none", "pricing": "free"},
    {"name": "Nock", "description": "HTTP server mocking for Node.js", "category": "Development", "baseUrl": "https://github.com/nock/nock", "authType": "none", "pricing": "free"},
    {"name": "Polly.JS", "description": "Record, replay, and stub HTTP interactions", "category": "Development", "baseUrl": "https://netflix.github.io/pollyjs/", "authType": "none", "pricing": "free"},
    {"name": "VCR.py", "description": "Record and replay HTTP interactions for Python", "category": "Development", "baseUrl": "https://vcrpy.readthedocs.io/", "authType": "none", "pricing": "free"},
    {"name": "Beeceptor", "description": "Mock REST APIs with zero coding", "category": "Development", "baseUrl": "https://beeceptor.com/", "authType": "none", "pricing": "freemium"},
    {"name": "Mocky", "description": "Generate custom HTTP responses for testing", "category": "Development", "baseUrl": "https://www.mocky.io/", "authType": "none", "pricing": "free"},
    
    # ===== AI & MACHINE LEARNING (100+) =====
    {"name": "Anthropic Claude", "description": "Claude AI assistant API", "category": "AI & ML", "baseUrl": "https://api.anthropic.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Google Gemini", "description": "Google's multimodal AI model API", "category": "AI & ML", "baseUrl": "https://ai.google.dev/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Mistral AI", "description": "Open-weight large language models", "category": "AI & ML", "baseUrl": "https://mistral.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cohere", "description": "Enterprise NLP platform", "category": "AI & ML", "baseUrl": "https://cohere.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "AI21 Labs", "description": "Jurassic language models API", "category": "AI & ML", "baseUrl": "https://www.ai21.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Groq", "description": "Ultra-fast AI inference API", "category": "AI & ML", "baseUrl": "https://groq.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Together AI", "description": "Open-source AI models API", "category": "AI & ML", "baseUrl": "https://together.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Fireworks AI", "description": "Fast and cost-effective AI inference", "category": "AI & ML", "baseUrl": "https://fireworks.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Perplexity AI", "description": "AI-powered search and answer engine", "category": "AI & ML", "baseUrl": "https://www.perplexity.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cerebras", "description": "High-performance AI compute API", "category": "AI & ML", "baseUrl": "https://cerebras.ai/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Anyscale", "description": "Scalable AI infrastructure", "category": "AI & ML", "baseUrl": "https://anyscale.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Modal", "description": "Serverless platform for AI/ML", "category": "AI & ML", "baseUrl": "https://modal.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Replicate", "description": "Run ML models in the cloud", "category": "AI & ML", "baseUrl": "https://replicate.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Hugging Face Inference", "description": "Deploy and run ML models", "category": "AI & ML", "baseUrl": "https://huggingface.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "AWS Bedrock", "description": "Foundation models via AWS", "category": "AI & ML", "baseUrl": "https://aws.amazon.com/bedrock/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Azure OpenAI", "description": "OpenAI models via Azure", "category": "AI & ML", "baseUrl": "https://azure.microsoft.com/products/ai-services/openai-service", "authType": "apiKey", "pricing": "paid"},
    {"name": "Vertex AI", "description": "Google Cloud AI platform", "category": "AI & ML", "baseUrl": "https://cloud.google.com/vertex-ai", "authType": "apiKey", "pricing": "paid"},
    {"name": "SambaNova", "description": "Enterprise generative AI platform", "category": "AI & ML", "baseUrl": "https://sambanova.ai/", "authType": "apiKey", "pricing": "paid"},
    {"name": "OctoAI", "description": "Efficient AI model deployment", "category": "AI & ML", "baseUrl": "https://octo.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Lepton AI", "description": "AI-native cloud platform", "category": "AI & ML", "baseUrl": "https://lepton.ai/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== IMAGE & VIDEO GENERATION (50+) =====
    {"name": "Midjourney API", "description": "AI image generation via Discord", "category": "AI Image", "baseUrl": "https://www.midjourney.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Stability AI", "description": "Stable Diffusion API", "category": "AI Image", "baseUrl": "https://stability.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "DALL-E API", "description": "OpenAI image generation", "category": "AI Image", "baseUrl": "https://openai.com/dall-e-3", "authType": "apiKey", "pricing": "paid"},
    {"name": "Leonardo.AI", "description": "AI art and asset generation", "category": "AI Image", "baseUrl": "https://leonardo.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Ideogram", "description": "AI image generation with text rendering", "category": "AI Image", "baseUrl": "https://ideogram.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Flux AI", "description": "Black Forest Labs image model", "category": "AI Image", "baseUrl": "https://blackforestlabs.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Clipdrop", "description": "AI-powered image editing tools", "category": "AI Image", "baseUrl": "https://clipdrop.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Remove.bg", "description": "AI background removal API", "category": "AI Image", "baseUrl": "https://www.remove.bg/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PhotoRoom", "description": "AI photo editing and background removal", "category": "AI Image", "baseUrl": "https://www.photoroom.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Luma AI", "description": "3D capture and NeRF API", "category": "AI Image", "baseUrl": "https://lumalabs.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "RunwayML", "description": "AI video generation and editing", "category": "AI Video", "baseUrl": "https://runwayml.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Pika Labs", "description": "AI video generation", "category": "AI Video", "baseUrl": "https://pika.art/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "HeyGen", "description": "AI avatar video generation", "category": "AI Video", "baseUrl": "https://www.heygen.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Synthesia", "description": "AI video creation with avatars", "category": "AI Video", "baseUrl": "https://www.synthesia.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "D-ID", "description": "Digital people video API", "category": "AI Video", "baseUrl": "https://www.d-id.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Colossyan", "description": "AI video creator for learning", "category": "AI Video", "baseUrl": "https://www.colossyan.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Pictory", "description": "AI video creation from text", "category": "AI Video", "baseUrl": "https://pictory.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "InVideo AI", "description": "AI-powered video editor", "category": "AI Video", "baseUrl": "https://invideo.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Kapwing", "description": "AI video editing platform", "category": "AI Video", "baseUrl": "https://www.kapwing.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Descript", "description": "AI video and podcast editing", "category": "AI Video", "baseUrl": "https://www.descript.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== VOICE & AUDIO (50+) =====
    {"name": "ElevenLabs", "description": "AI voice synthesis and cloning", "category": "AI Voice", "baseUrl": "https://elevenlabs.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PlayHT", "description": "AI voice generation API", "category": "AI Voice", "baseUrl": "https://play.ht/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Murf AI", "description": "AI voice over studio", "category": "AI Voice", "baseUrl": "https://murf.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Resemble AI", "description": "AI voice cloning and synthesis", "category": "AI Voice", "baseUrl": "https://www.resemble.ai/", "authType": "apiKey", "pricing": "paid"},
    {"name": "WellSaid Labs", "description": "Enterprise AI voice platform", "category": "AI Voice", "baseUrl": "https://wellsaidlabs.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Speechify", "description": "Text-to-speech API", "category": "AI Voice", "baseUrl": "https://speechify.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Coqui TTS", "description": "Open-source text-to-speech", "category": "AI Voice", "baseUrl": "https://coqui.ai/", "authType": "none", "pricing": "free"},
    {"name": "Tortoise TTS", "description": "Multi-voice text-to-speech", "category": "AI Voice", "baseUrl": "https://github.com/neonbjb/tortoise-tts", "authType": "none", "pricing": "free"},
    {"name": "XTTS", "description": "Coqui's multilingual TTS model", "category": "AI Voice", "baseUrl": "https://github.com/coqui-ai/TTS", "authType": "none", "pricing": "free"},
    {"name": "Bark", "description": "Suno's text-to-audio model", "category": "AI Voice", "baseUrl": "https://github.com/suno-ai/bark", "authType": "none", "pricing": "free"},
    {"name": "Suno AI", "description": "AI music generation", "category": "AI Music", "baseUrl": "https://suno.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Udio", "description": "AI music creation platform", "category": "AI Music", "baseUrl": "https://www.udio.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "AIVA", "description": "AI composer for soundtracks", "category": "AI Music", "baseUrl": "https://www.aiva.ai/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Soundraw", "description": "AI music generator for creators", "category": "AI Music", "baseUrl": "https://soundraw.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Mubert", "description": "AI-generated royalty-free music", "category": "AI Music", "baseUrl": "https://mubert.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Boomy", "description": "Create and monetize AI music", "category": "AI Music", "baseUrl": "https://boomy.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Loudly", "description": "AI music generation platform", "category": "AI Music", "baseUrl": "https://www.loudly.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Deepgram", "description": "Speech recognition API", "category": "Speech Recognition", "baseUrl": "https://deepgram.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Assembly AI", "description": "Speech-to-text and audio intelligence", "category": "Speech Recognition", "baseUrl": "https://www.assemblyai.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Rev AI", "description": "Speech recognition API", "category": "Speech Recognition", "baseUrl": "https://www.rev.ai/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== AUTOMATION & WORKFLOW (50+) =====
    {"name": "Zapier", "description": "Connect apps and automate workflows", "category": "Automation", "baseUrl": "https://zapier.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Make", "description": "Visual automation platform", "category": "Automation", "baseUrl": "https://www.make.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "n8n", "description": "Open-source workflow automation", "category": "Automation", "baseUrl": "https://n8n.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Pipedream", "description": "Developer-first automation platform", "category": "Automation", "baseUrl": "https://pipedream.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Activepieces", "description": "Open-source automation tool", "category": "Automation", "baseUrl": "https://www.activepieces.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Windmill", "description": "Developer platform for scripts and workflows", "category": "Automation", "baseUrl": "https://windmill.dev/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Temporal", "description": "Durable execution platform", "category": "Automation", "baseUrl": "https://temporal.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Inngest", "description": "Event-driven background jobs", "category": "Automation", "baseUrl": "https://inngest.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Trigger.dev", "description": "Background jobs for developers", "category": "Automation", "baseUrl": "https://trigger.dev/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Defer", "description": "Background jobs for Node.js", "category": "Automation", "baseUrl": "https://defer.run/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Prefect", "description": "Modern workflow orchestration", "category": "Automation", "baseUrl": "https://www.prefect.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Dagster", "description": "Data orchestration platform", "category": "Automation", "baseUrl": "https://dagster.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Apache Airflow", "description": "Platform for workflow scheduling", "category": "Automation", "baseUrl": "https://airflow.apache.org/", "authType": "none", "pricing": "free"},
    {"name": "Kestra", "description": "Event-driven orchestration platform", "category": "Automation", "baseUrl": "https://kestra.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Camunda", "description": "Process orchestration platform", "category": "Automation", "baseUrl": "https://camunda.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== DATABASE & BACKEND (50+) =====
    {"name": "Supabase", "description": "Open source Firebase alternative", "category": "Database", "baseUrl": "https://supabase.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PlanetScale", "description": "Serverless MySQL platform", "category": "Database", "baseUrl": "https://planetscale.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Neon", "description": "Serverless Postgres", "category": "Database", "baseUrl": "https://neon.tech/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Turso", "description": "SQLite for the edge", "category": "Database", "baseUrl": "https://turso.tech/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Upstash", "description": "Serverless Redis and Kafka", "category": "Database", "baseUrl": "https://upstash.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Convex", "description": "Backend application platform", "category": "Database", "baseUrl": "https://convex.dev/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Xata", "description": "Serverless database platform", "category": "Database", "baseUrl": "https://xata.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "CockroachDB", "description": "Distributed SQL database", "category": "Database", "baseUrl": "https://www.cockroachlabs.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Fauna", "description": "Distributed document-relational database", "category": "Database", "baseUrl": "https://fauna.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Hasura", "description": "GraphQL engine for databases", "category": "Database", "baseUrl": "https://hasura.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Prisma", "description": "Next-generation ORM", "category": "Database", "baseUrl": "https://www.prisma.io/", "authType": "none", "pricing": "freemium"},
    {"name": "Drizzle", "description": "TypeScript ORM", "category": "Database", "baseUrl": "https://orm.drizzle.team/", "authType": "none", "pricing": "free"},
    {"name": "EdgeDB", "description": "Graph-relational database", "category": "Database", "baseUrl": "https://www.edgedb.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "SurrealDB", "description": "Multi-model database", "category": "Database", "baseUrl": "https://surrealdb.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Dolt", "description": "Git for data", "category": "Database", "baseUrl": "https://www.dolthub.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== COMMUNICATION (50+) =====
    {"name": "Twilio", "description": "Cloud communications platform", "category": "Communication", "baseUrl": "https://www.twilio.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "SendGrid", "description": "Email delivery service", "category": "Communication", "baseUrl": "https://sendgrid.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Mailgun", "description": "Email API service", "category": "Communication", "baseUrl": "https://www.mailgun.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Resend", "description": "Email API for developers", "category": "Communication", "baseUrl": "https://resend.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Postmark", "description": "Transactional email service", "category": "Communication", "baseUrl": "https://postmarkapp.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Amazon SES", "description": "Email sending service", "category": "Communication", "baseUrl": "https://aws.amazon.com/ses/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Plivo", "description": "Voice and SMS APIs", "category": "Communication", "baseUrl": "https://www.plivo.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Vonage", "description": "Communications APIs", "category": "Communication", "baseUrl": "https://developer.vonage.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "MessageBird", "description": "Omnichannel communication platform", "category": "Communication", "baseUrl": "https://messagebird.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Telnyx", "description": "Voice, messaging and networking", "category": "Communication", "baseUrl": "https://telnyx.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Sinch", "description": "Cloud communications platform", "category": "Communication", "baseUrl": "https://www.sinch.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Bandwidth", "description": "Enterprise communications APIs", "category": "Communication", "baseUrl": "https://www.bandwidth.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "46elks", "description": "Swedish SMS and voice API", "category": "Communication", "baseUrl": "https://46elks.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Infobip", "description": "Global cloud communications", "category": "Communication", "baseUrl": "https://www.infobip.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Clickatell", "description": "Mobile messaging solutions", "category": "Communication", "baseUrl": "https://www.clickatell.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== AUTHENTICATION (40+) =====
    {"name": "Auth0", "description": "Identity platform", "category": "Authentication", "baseUrl": "https://auth0.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Clerk", "description": "Complete user management", "category": "Authentication", "baseUrl": "https://clerk.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Supabase Auth", "description": "Open source authentication", "category": "Authentication", "baseUrl": "https://supabase.com/auth", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Firebase Auth", "description": "Google authentication service", "category": "Authentication", "baseUrl": "https://firebase.google.com/products/auth", "authType": "apiKey", "pricing": "freemium"},
    {"name": "WorkOS", "description": "Enterprise authentication", "category": "Authentication", "baseUrl": "https://workos.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Stytch", "description": "Authentication infrastructure", "category": "Authentication", "baseUrl": "https://stytch.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "FusionAuth", "description": "Auth built for devs", "category": "Authentication", "baseUrl": "https://fusionauth.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Keycloak", "description": "Open source identity management", "category": "Authentication", "baseUrl": "https://www.keycloak.org/", "authType": "none", "pricing": "free"},
    {"name": "Ory", "description": "Open source identity infrastructure", "category": "Authentication", "baseUrl": "https://www.ory.sh/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Okta", "description": "Enterprise identity platform", "category": "Authentication", "baseUrl": "https://www.okta.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "OneLogin", "description": "Identity and access management", "category": "Authentication", "baseUrl": "https://www.onelogin.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Descope", "description": "Drag and drop authentication", "category": "Authentication", "baseUrl": "https://www.descope.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Hanko", "description": "Open source authentication", "category": "Authentication", "baseUrl": "https://www.hanko.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PropelAuth", "description": "B2B authentication platform", "category": "Authentication", "baseUrl": "https://www.propelauth.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Kinde", "description": "Authentication for modern apps", "category": "Authentication", "baseUrl": "https://kinde.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== PAYMENTS & FINTECH (50+) =====
    {"name": "Stripe", "description": "Payment processing platform", "category": "Payments", "baseUrl": "https://stripe.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "PayPal", "description": "Online payment system", "category": "Payments", "baseUrl": "https://developer.paypal.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Square", "description": "Payment and commerce platform", "category": "Payments", "baseUrl": "https://developer.squareup.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Adyen", "description": "Global payment platform", "category": "Payments", "baseUrl": "https://www.adyen.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Braintree", "description": "Payment gateway", "category": "Payments", "baseUrl": "https://www.braintreepayments.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Paddle", "description": "SaaS payment infrastructure", "category": "Payments", "baseUrl": "https://paddle.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "LemonSqueezy", "description": "Payment platform for digital products", "category": "Payments", "baseUrl": "https://www.lemonsqueezy.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Gumroad", "description": "Sell digital products", "category": "Payments", "baseUrl": "https://gumroad.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Wise", "description": "International money transfers", "category": "Payments", "baseUrl": "https://wise.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Plaid", "description": "Financial data API", "category": "Fintech", "baseUrl": "https://plaid.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Yodlee", "description": "Financial data aggregation", "category": "Fintech", "baseUrl": "https://www.yodlee.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "MX", "description": "Financial data platform", "category": "Fintech", "baseUrl": "https://www.mx.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Finicity", "description": "Financial data and insights", "category": "Fintech", "baseUrl": "https://www.finicity.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Tink", "description": "Open banking platform", "category": "Fintech", "baseUrl": "https://tink.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Nordigen", "description": "Free open banking API", "category": "Fintech", "baseUrl": "https://nordigen.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== SEARCH & DATA (40+) =====
    {"name": "Algolia", "description": "Search and discovery platform", "category": "Search", "baseUrl": "https://www.algolia.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Typesense", "description": "Open source search engine", "category": "Search", "baseUrl": "https://typesense.org/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Meilisearch", "description": "Fast and relevant search engine", "category": "Search", "baseUrl": "https://www.meilisearch.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Elastic", "description": "Search and analytics platform", "category": "Search", "baseUrl": "https://www.elastic.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "OpenSearch", "description": "Open source search and analytics", "category": "Search", "baseUrl": "https://opensearch.org/", "authType": "apiKey", "pricing": "free"},
    {"name": "Pinecone", "description": "Vector database for AI", "category": "Vector DB", "baseUrl": "https://www.pinecone.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Weaviate", "description": "Open source vector database", "category": "Vector DB", "baseUrl": "https://weaviate.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Qdrant", "description": "Vector similarity search engine", "category": "Vector DB", "baseUrl": "https://qdrant.tech/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Chroma", "description": "AI-native embedding database", "category": "Vector DB", "baseUrl": "https://www.trychroma.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Milvus", "description": "Open source vector database", "category": "Vector DB", "baseUrl": "https://milvus.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Brave Search", "description": "Independent search engine API", "category": "Search", "baseUrl": "https://search.brave.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "SerpApi", "description": "Search engine results API", "category": "Search", "baseUrl": "https://serpapi.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ScrapingBee", "description": "Web scraping API", "category": "Data", "baseUrl": "https://www.scrapingbee.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Browserless", "description": "Headless browser automation", "category": "Data", "baseUrl": "https://www.browserless.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Apify", "description": "Web scraping and automation", "category": "Data", "baseUrl": "https://apify.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== E-COMMERCE (40+) =====
    {"name": "Shopify", "description": "E-commerce platform API", "category": "E-commerce", "baseUrl": "https://shopify.dev/", "authType": "apiKey", "pricing": "paid"},
    {"name": "WooCommerce", "description": "WordPress e-commerce plugin API", "category": "E-commerce", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "authType": "apiKey", "pricing": "free"},
    {"name": "BigCommerce", "description": "E-commerce platform", "category": "E-commerce", "baseUrl": "https://developer.bigcommerce.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Magento", "description": "E-commerce platform", "category": "E-commerce", "baseUrl": "https://devdocs.magento.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Medusa", "description": "Open source e-commerce platform", "category": "E-commerce", "baseUrl": "https://medusajs.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Saleor", "description": "GraphQL e-commerce platform", "category": "E-commerce", "baseUrl": "https://saleor.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Vendure", "description": "Headless e-commerce framework", "category": "E-commerce", "baseUrl": "https://www.vendure.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Commerce.js", "description": "Headless commerce backend", "category": "E-commerce", "baseUrl": "https://commercejs.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Snipcart", "description": "Shopping cart platform", "category": "E-commerce", "baseUrl": "https://snipcart.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Crystallize", "description": "PIM and e-commerce API", "category": "E-commerce", "baseUrl": "https://crystallize.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Ecwid", "description": "E-commerce widgets", "category": "E-commerce", "baseUrl": "https://www.ecwid.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Printful", "description": "Print-on-demand API", "category": "E-commerce", "baseUrl": "https://www.printful.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Printify", "description": "Print-on-demand platform", "category": "E-commerce", "baseUrl": "https://printify.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Gooten", "description": "On-demand production", "category": "E-commerce", "baseUrl": "https://www.gooten.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Gelato", "description": "Global print-on-demand", "category": "E-commerce", "baseUrl": "https://www.gelato.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== MONITORING & ANALYTICS (40+) =====
    {"name": "Datadog", "description": "Monitoring and analytics platform", "category": "Monitoring", "baseUrl": "https://www.datadoghq.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "New Relic", "description": "Observability platform", "category": "Monitoring", "baseUrl": "https://newrelic.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Sentry", "description": "Error monitoring and performance", "category": "Monitoring", "baseUrl": "https://sentry.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "LogRocket", "description": "Session replay and analytics", "category": "Monitoring", "baseUrl": "https://logrocket.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Mixpanel", "description": "Product analytics platform", "category": "Analytics", "baseUrl": "https://mixpanel.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Amplitude", "description": "Product analytics", "category": "Analytics", "baseUrl": "https://amplitude.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Heap", "description": "Digital insights platform", "category": "Analytics", "baseUrl": "https://heap.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PostHog", "description": "Open source product analytics", "category": "Analytics", "baseUrl": "https://posthog.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Plausible", "description": "Privacy-focused analytics", "category": "Analytics", "baseUrl": "https://plausible.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Fathom", "description": "Simple website analytics", "category": "Analytics", "baseUrl": "https://usefathom.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Umami", "description": "Open source analytics", "category": "Analytics", "baseUrl": "https://umami.is/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Splitbee", "description": "Analytics and A/B testing", "category": "Analytics", "baseUrl": "https://splitbee.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Grafana", "description": "Observability platform", "category": "Monitoring", "baseUrl": "https://grafana.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Prometheus", "description": "Monitoring system and time series DB", "category": "Monitoring", "baseUrl": "https://prometheus.io/", "authType": "none", "pricing": "free"},
    {"name": "InfluxDB", "description": "Time series database", "category": "Monitoring", "baseUrl": "https://www.influxdata.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== CMS & CONTENT (40+) =====
    {"name": "Contentful", "description": "Headless CMS platform", "category": "CMS", "baseUrl": "https://www.contentful.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Sanity", "description": "Structured content platform", "category": "CMS", "baseUrl": "https://www.sanity.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Strapi", "description": "Open source headless CMS", "category": "CMS", "baseUrl": "https://strapi.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Directus", "description": "Open data platform", "category": "CMS", "baseUrl": "https://directus.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Payload", "description": "Headless CMS and app framework", "category": "CMS", "baseUrl": "https://payloadcms.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Ghost", "description": "Professional publishing platform", "category": "CMS", "baseUrl": "https://ghost.org/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Keystatic", "description": "Git-based CMS", "category": "CMS", "baseUrl": "https://keystatic.com/", "authType": "none", "pricing": "free"},
    {"name": "Tina", "description": "Git-backed CMS", "category": "CMS", "baseUrl": "https://tina.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Hygraph", "description": "Federated content platform", "category": "CMS", "baseUrl": "https://hygraph.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Storyblok", "description": "Headless CMS with visual editor", "category": "CMS", "baseUrl": "https://www.storyblok.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "DatoCMS", "description": "Headless CMS for teams", "category": "CMS", "baseUrl": "https://www.datocms.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Prismic", "description": "Headless website builder", "category": "CMS", "baseUrl": "https://prismic.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Builder.io", "description": "Visual development platform", "category": "CMS", "baseUrl": "https://www.builder.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Webflow", "description": "Visual web development", "category": "CMS", "baseUrl": "https://webflow.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Framer", "description": "Web design and publishing", "category": "CMS", "baseUrl": "https://www.framer.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== CLOUD & INFRASTRUCTURE (40+) =====
    {"name": "AWS", "description": "Amazon Web Services cloud platform", "category": "Cloud", "baseUrl": "https://aws.amazon.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Google Cloud", "description": "Google Cloud Platform", "category": "Cloud", "baseUrl": "https://cloud.google.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Azure", "description": "Microsoft Azure cloud", "category": "Cloud", "baseUrl": "https://azure.microsoft.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "DigitalOcean", "description": "Cloud infrastructure provider", "category": "Cloud", "baseUrl": "https://www.digitalocean.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Linode", "description": "Cloud computing platform", "category": "Cloud", "baseUrl": "https://www.linode.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Vultr", "description": "Cloud infrastructure", "category": "Cloud", "baseUrl": "https://www.vultr.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Hetzner", "description": "European cloud provider", "category": "Cloud", "baseUrl": "https://www.hetzner.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Vercel", "description": "Frontend cloud platform", "category": "Cloud", "baseUrl": "https://vercel.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Netlify", "description": "Web development platform", "category": "Cloud", "baseUrl": "https://www.netlify.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cloudflare", "description": "CDN and security platform", "category": "Cloud", "baseUrl": "https://www.cloudflare.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Railway", "description": "Deploy apps in seconds", "category": "Cloud", "baseUrl": "https://railway.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Render", "description": "Cloud application platform", "category": "Cloud", "baseUrl": "https://render.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Fly.io", "description": "Run apps close to users", "category": "Cloud", "baseUrl": "https://fly.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Koyeb", "description": "Serverless platform", "category": "Cloud", "baseUrl": "https://www.koyeb.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Deno Deploy", "description": "Serverless JavaScript platform", "category": "Cloud", "baseUrl": "https://deno.com/deploy", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== MESSAGING & NOTIFICATIONS (30+) =====
    {"name": "OneSignal", "description": "Push notification service", "category": "Notifications", "baseUrl": "https://onesignal.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Firebase Cloud Messaging", "description": "Cross-platform messaging", "category": "Notifications", "baseUrl": "https://firebase.google.com/products/cloud-messaging", "authType": "apiKey", "pricing": "free"},
    {"name": "Pusher", "description": "Real-time communication APIs", "category": "Notifications", "baseUrl": "https://pusher.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Ably", "description": "Real-time messaging platform", "category": "Notifications", "baseUrl": "https://ably.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PubNub", "description": "Real-time communication API", "category": "Notifications", "baseUrl": "https://www.pubnub.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Novu", "description": "Open source notification infrastructure", "category": "Notifications", "baseUrl": "https://novu.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Knock", "description": "Notification infrastructure", "category": "Notifications", "baseUrl": "https://knock.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Courier", "description": "Multi-channel notifications", "category": "Notifications", "baseUrl": "https://www.courier.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Engagespot", "description": "Notification platform", "category": "Notifications", "baseUrl": "https://engagespot.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "MagicBell", "description": "Embeddable notification inbox", "category": "Notifications", "baseUrl": "https://www.magicbell.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== PDF & DOCUMENTS (30+) =====
    {"name": "PDFShift", "description": "HTML to PDF conversion", "category": "Documents", "baseUrl": "https://pdfshift.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "DocRaptor", "description": "HTML to PDF/Excel API", "category": "Documents", "baseUrl": "https://docraptor.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PDF.co", "description": "PDF generation and processing", "category": "Documents", "baseUrl": "https://pdf.co/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Anvil", "description": "PDF generation and e-signatures", "category": "Documents", "baseUrl": "https://www.useanvil.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PSPDFKit", "description": "PDF SDK and API", "category": "Documents", "baseUrl": "https://pspdfkit.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "PDFTron", "description": "Document processing SDK", "category": "Documents", "baseUrl": "https://www.pdftron.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "API2PDF", "description": "PDF generation API", "category": "Documents", "baseUrl": "https://www.api2pdf.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ConvertAPI", "description": "File conversion API", "category": "Documents", "baseUrl": "https://www.convertapi.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "CloudConvert", "description": "File conversion service", "category": "Documents", "baseUrl": "https://cloudconvert.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Zamzar", "description": "Online file conversion", "category": "Documents", "baseUrl": "https://www.zamzar.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== SCHEDULING & BOOKING (25+) =====
    {"name": "Calendly", "description": "Scheduling automation", "category": "Scheduling", "baseUrl": "https://developer.calendly.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cal.com", "description": "Open source scheduling", "category": "Scheduling", "baseUrl": "https://cal.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Savvycal", "description": "Scheduling that puts people first", "category": "Scheduling", "baseUrl": "https://savvycal.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Doodle", "description": "Group scheduling tool", "category": "Scheduling", "baseUrl": "https://doodle.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Acuity", "description": "Online appointment scheduling", "category": "Scheduling", "baseUrl": "https://acuityscheduling.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Setmore", "description": "Free appointment scheduling", "category": "Scheduling", "baseUrl": "https://www.setmore.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "SimplyBook.me", "description": "Online booking system", "category": "Scheduling", "baseUrl": "https://simplybook.me/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cronofy", "description": "Calendar integration API", "category": "Scheduling", "baseUrl": "https://www.cronofy.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Nylas Calendar", "description": "Universal calendar API", "category": "Scheduling", "baseUrl": "https://www.nylas.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "TimeKit", "description": "Scheduling infrastructure", "category": "Scheduling", "baseUrl": "https://www.timekit.io/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== GEOLOCATION & MAPS (30+) =====
    {"name": "Google Maps", "description": "Mapping and location services", "category": "Maps", "baseUrl": "https://developers.google.com/maps", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Mapbox", "description": "Custom maps and location", "category": "Maps", "baseUrl": "https://www.mapbox.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "HERE", "description": "Location platform", "category": "Maps", "baseUrl": "https://developer.here.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "OpenStreetMap", "description": "Open source maps", "category": "Maps", "baseUrl": "https://www.openstreetmap.org/", "authType": "none", "pricing": "free"},
    {"name": "TomTom", "description": "Maps and traffic data", "category": "Maps", "baseUrl": "https://developer.tomtom.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Leaflet", "description": "Open source JS map library", "category": "Maps", "baseUrl": "https://leafletjs.com/", "authType": "none", "pricing": "free"},
    {"name": "IPInfo", "description": "IP geolocation API", "category": "Geolocation", "baseUrl": "https://ipinfo.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "IP-API", "description": "Free IP geolocation", "category": "Geolocation", "baseUrl": "https://ip-api.com/", "authType": "none", "pricing": "free"},
    {"name": "MaxMind", "description": "IP intelligence and fraud prevention", "category": "Geolocation", "baseUrl": "https://www.maxmind.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "IPStack", "description": "IP geolocation API", "category": "Geolocation", "baseUrl": "https://ipstack.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== WEATHER & ENVIRONMENT (20+) =====
    {"name": "OpenWeatherMap", "description": "Weather data API", "category": "Weather", "baseUrl": "https://openweathermap.org/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Weather API", "description": "Global weather data", "category": "Weather", "baseUrl": "https://www.weatherapi.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Tomorrow.io", "description": "Weather intelligence platform", "category": "Weather", "baseUrl": "https://www.tomorrow.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Visual Crossing", "description": "Weather data service", "category": "Weather", "baseUrl": "https://www.visualcrossing.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Weatherbit", "description": "Weather data API", "category": "Weather", "baseUrl": "https://www.weatherbit.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Meteomatics", "description": "Weather data API", "category": "Weather", "baseUrl": "https://www.meteomatics.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "SMHI", "description": "Swedish weather data", "category": "Weather", "baseUrl": "https://opendata.smhi.se/", "authType": "none", "pricing": "free"},
    {"name": "Yr.no", "description": "Norwegian weather data", "category": "Weather", "baseUrl": "https://api.met.no/", "authType": "none", "pricing": "free"},
    {"name": "AQICN", "description": "Air quality data", "category": "Environment", "baseUrl": "https://aqicn.org/", "authType": "apiKey", "pricing": "free"},
    {"name": "IQAir", "description": "Air quality monitoring", "category": "Environment", "baseUrl": "https://www.iqair.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== TRANSLATION & LANGUAGE (20+) =====
    {"name": "DeepL", "description": "Neural machine translation", "category": "Translation", "baseUrl": "https://www.deepl.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Google Translate", "description": "Translation API", "category": "Translation", "baseUrl": "https://cloud.google.com/translate", "authType": "apiKey", "pricing": "paid"},
    {"name": "Microsoft Translator", "description": "Translation service", "category": "Translation", "baseUrl": "https://www.microsoft.com/translator/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Amazon Translate", "description": "Neural machine translation", "category": "Translation", "baseUrl": "https://aws.amazon.com/translate/", "authType": "apiKey", "pricing": "paid"},
    {"name": "LibreTranslate", "description": "Open source translation", "category": "Translation", "baseUrl": "https://libretranslate.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Lingva", "description": "Google Translate alternative", "category": "Translation", "baseUrl": "https://lingva.ml/", "authType": "none", "pricing": "free"},
    {"name": "MyMemory", "description": "Translation memory", "category": "Translation", "baseUrl": "https://mymemory.translated.net/", "authType": "none", "pricing": "free"},
    {"name": "Yandex Translate", "description": "Translation service", "category": "Translation", "baseUrl": "https://translate.yandex.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Papago", "description": "Naver translation API", "category": "Translation", "baseUrl": "https://papago.naver.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Lingvanex", "description": "Translation API", "category": "Translation", "baseUrl": "https://lingvanex.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== SOCIAL MEDIA (30+) =====
    {"name": "Twitter/X API", "description": "X platform API", "category": "Social", "baseUrl": "https://developer.x.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Facebook Graph API", "description": "Facebook platform API", "category": "Social", "baseUrl": "https://developers.facebook.com/", "authType": "oauth", "pricing": "free"},
    {"name": "Instagram Graph API", "description": "Instagram platform API", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/instagram-api", "authType": "oauth", "pricing": "free"},
    {"name": "LinkedIn API", "description": "LinkedIn platform API", "category": "Social", "baseUrl": "https://developer.linkedin.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "TikTok API", "description": "TikTok platform API", "category": "Social", "baseUrl": "https://developers.tiktok.com/", "authType": "oauth", "pricing": "free"},
    {"name": "YouTube Data API", "description": "YouTube platform API", "category": "Social", "baseUrl": "https://developers.google.com/youtube", "authType": "apiKey", "pricing": "free"},
    {"name": "Reddit API", "description": "Reddit platform API", "category": "Social", "baseUrl": "https://www.reddit.com/dev/api/", "authType": "oauth", "pricing": "free"},
    {"name": "Discord API", "description": "Discord platform API", "category": "Social", "baseUrl": "https://discord.com/developers", "authType": "oauth", "pricing": "free"},
    {"name": "Slack API", "description": "Slack platform API", "category": "Social", "baseUrl": "https://api.slack.com/", "authType": "oauth", "pricing": "free"},
    {"name": "Telegram Bot API", "description": "Telegram bot platform", "category": "Social", "baseUrl": "https://core.telegram.org/bots/api", "authType": "apiKey", "pricing": "free"},
    {"name": "WhatsApp Business API", "description": "WhatsApp business platform", "category": "Social", "baseUrl": "https://business.whatsapp.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Mastodon API", "description": "Decentralized social network", "category": "Social", "baseUrl": "https://docs.joinmastodon.org/", "authType": "oauth", "pricing": "free"},
    {"name": "Bluesky API", "description": "AT Protocol social network", "category": "Social", "baseUrl": "https://bsky.social/", "authType": "apiKey", "pricing": "free"},
    {"name": "Threads API", "description": "Meta Threads platform", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/threads", "authType": "oauth", "pricing": "free"},
    {"name": "Pinterest API", "description": "Pinterest platform API", "category": "Social", "baseUrl": "https://developers.pinterest.com/", "authType": "oauth", "pricing": "free"},
    
    # ===== CRYPTOCURRENCY & WEB3 (30+) =====
    {"name": "Alchemy", "description": "Web3 development platform", "category": "Web3", "baseUrl": "https://www.alchemy.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Infura", "description": "Ethereum API and IPFS", "category": "Web3", "baseUrl": "https://infura.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "QuickNode", "description": "Blockchain infrastructure", "category": "Web3", "baseUrl": "https://www.quicknode.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Moralis", "description": "Web3 data platform", "category": "Web3", "baseUrl": "https://moralis.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Thirdweb", "description": "Web3 development SDK", "category": "Web3", "baseUrl": "https://thirdweb.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "OpenSea", "description": "NFT marketplace API", "category": "Web3", "baseUrl": "https://docs.opensea.io/", "authType": "apiKey", "pricing": "free"},
    {"name": "Rarible", "description": "NFT protocol API", "category": "Web3", "baseUrl": "https://rarible.org/", "authType": "apiKey", "pricing": "free"},
    {"name": "CoinGecko", "description": "Cryptocurrency data API", "category": "Crypto", "baseUrl": "https://www.coingecko.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "CoinMarketCap", "description": "Crypto market data", "category": "Crypto", "baseUrl": "https://coinmarketcap.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "CryptoCompare", "description": "Cryptocurrency data", "category": "Crypto", "baseUrl": "https://www.cryptocompare.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Binance API", "description": "Cryptocurrency exchange", "category": "Crypto", "baseUrl": "https://www.binance.com/", "authType": "apiKey", "pricing": "free"},
    {"name": "Coinbase API", "description": "Crypto exchange and wallet", "category": "Crypto", "baseUrl": "https://www.coinbase.com/", "authType": "apiKey", "pricing": "free"},
    {"name": "Kraken API", "description": "Cryptocurrency exchange", "category": "Crypto", "baseUrl": "https://www.kraken.com/", "authType": "apiKey", "pricing": "free"},
    {"name": "Etherscan", "description": "Ethereum blockchain explorer", "category": "Web3", "baseUrl": "https://etherscan.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Polygonscan", "description": "Polygon blockchain explorer", "category": "Web3", "baseUrl": "https://polygonscan.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== TESTING & QA (25+) =====
    {"name": "BrowserStack", "description": "Cross-browser testing platform", "category": "Testing", "baseUrl": "https://www.browserstack.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Sauce Labs", "description": "Continuous testing platform", "category": "Testing", "baseUrl": "https://saucelabs.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "LambdaTest", "description": "Cross-browser testing cloud", "category": "Testing", "baseUrl": "https://www.lambdatest.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Cypress Cloud", "description": "Test runner and dashboard", "category": "Testing", "baseUrl": "https://www.cypress.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Playwright", "description": "End-to-end testing framework", "category": "Testing", "baseUrl": "https://playwright.dev/", "authType": "none", "pricing": "free"},
    {"name": "Puppeteer", "description": "Chrome automation library", "category": "Testing", "baseUrl": "https://pptr.dev/", "authType": "none", "pricing": "free"},
    {"name": "Selenium", "description": "Browser automation framework", "category": "Testing", "baseUrl": "https://www.selenium.dev/", "authType": "none", "pricing": "free"},
    {"name": "TestRail", "description": "Test case management", "category": "Testing", "baseUrl": "https://www.testrail.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Qase", "description": "Test management platform", "category": "Testing", "baseUrl": "https://qase.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Testim", "description": "AI-powered testing", "category": "Testing", "baseUrl": "https://www.testim.io/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== FILE STORAGE (20+) =====
    {"name": "AWS S3", "description": "Cloud object storage", "category": "Storage", "baseUrl": "https://aws.amazon.com/s3/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Google Cloud Storage", "description": "Object storage service", "category": "Storage", "baseUrl": "https://cloud.google.com/storage", "authType": "apiKey", "pricing": "paid"},
    {"name": "Azure Blob Storage", "description": "Microsoft cloud storage", "category": "Storage", "baseUrl": "https://azure.microsoft.com/products/storage/blobs", "authType": "apiKey", "pricing": "paid"},
    {"name": "Cloudinary", "description": "Image and video management", "category": "Storage", "baseUrl": "https://cloudinary.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Imgix", "description": "Image processing and CDN", "category": "Storage", "baseUrl": "https://imgix.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Uploadcare", "description": "File uploading and processing", "category": "Storage", "baseUrl": "https://uploadcare.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Filestack", "description": "File handling API", "category": "Storage", "baseUrl": "https://www.filestack.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Uploadthing", "description": "File uploads for Next.js", "category": "Storage", "baseUrl": "https://uploadthing.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Bunny.net", "description": "CDN and storage", "category": "Storage", "baseUrl": "https://bunny.net/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Backblaze B2", "description": "Affordable cloud storage", "category": "Storage", "baseUrl": "https://www.backblaze.com/b2/", "authType": "apiKey", "pricing": "paid"},
]

def main():
    output_dir = os.path.expanduser("~/Projects/apiclaw/data")
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate unique IDs
    for i, api in enumerate(NEW_APIS):
        api["id"] = f"api-05-27-{i+1:04d}"
        if "pricing" not in api:
            api["pricing"] = "unknown"
        if "authType" not in api:
            api["authType"] = "apiKey"
    
    # Save to file
    output_file = os.path.join(output_dir, "night-expansion-02-27-05.json")
    with open(output_file, "w") as f:
        json.dump(NEW_APIS, f, indent=2)
    
    print(f"✅ Generated {len(NEW_APIS)} APIs")
    print(f"📁 Saved to: {output_file}")
    
    # Category breakdown
    categories = {}
    for api in NEW_APIS:
        cat = api.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📊 Category breakdown:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    return len(NEW_APIS)

if __name__ == "__main__":
    main()
