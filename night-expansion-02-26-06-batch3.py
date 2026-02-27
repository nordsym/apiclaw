#!/usr/bin/env python3
"""
APIClaw Night Expansion 2026-02-26 06:00 - Batch 3
Target: More APIs to reach 1000+ new for this run
"""

import json
import re
from pathlib import Path

combined_file = Path("/Users/gustavhemmingsson/Projects/apiclaw/data/combined-02-26.json")
existing_ids = set()
if combined_file.exists():
    with open(combined_file) as f:
        for api in json.load(f):
            existing_ids.add(api.get('id', ''))

print(f"Loaded {len(existing_ids)} existing API IDs")

def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug[:50]

batch3_apis = [
    # More AI/ML Services
    {"name": "Together AI", "desc": "Open source AI models", "cat": "AI", "url": "https://docs.together.ai/", "auth": "apiKey"},
    {"name": "Groq", "desc": "Fast AI inference", "cat": "AI", "url": "https://console.groq.com/docs/", "auth": "apiKey"},
    {"name": "Fireworks AI", "desc": "AI model hosting", "cat": "AI", "url": "https://readme.fireworks.ai/", "auth": "apiKey"},
    {"name": "Perplexity", "desc": "AI search", "cat": "AI", "url": "https://docs.perplexity.ai/", "auth": "apiKey"},
    {"name": "Mistral AI", "desc": "AI models", "cat": "AI", "url": "https://docs.mistral.ai/", "auth": "apiKey"},
    {"name": "AI21 Labs", "desc": "AI language models", "cat": "AI", "url": "https://docs.ai21.com/", "auth": "apiKey"},
    {"name": "Writer", "desc": "Enterprise AI", "cat": "AI", "url": "https://dev.writer.com/", "auth": "apiKey"},
    {"name": "Jasper AI", "desc": "Content AI", "cat": "AI", "url": "https://developers.jasper.ai/", "auth": "apiKey"},
    {"name": "Tome", "desc": "AI presentations", "cat": "AI", "url": "https://tome.app/api", "auth": "apiKey"},
    {"name": "Mem AI", "desc": "AI knowledge base", "cat": "AI", "url": "https://mem.ai/api", "auth": "apiKey"},
    {"name": "Runway ML", "desc": "Creative AI", "cat": "AI", "url": "https://docs.runwayml.com/", "auth": "apiKey"},
    {"name": "Leonardo AI", "desc": "AI image generation", "cat": "AI", "url": "https://docs.leonardo.ai/", "auth": "apiKey"},
    {"name": "Ideogram", "desc": "AI image generation", "cat": "AI", "url": "https://ideogram.ai/api", "auth": "apiKey"},
    {"name": "Midjourney", "desc": "AI art generation", "cat": "AI", "url": "https://docs.midjourney.com/", "auth": "apiKey"},
    {"name": "DALL-E", "desc": "OpenAI image generation", "cat": "AI", "url": "https://platform.openai.com/docs/guides/images", "auth": "apiKey"},
    
    # Image Processing
    {"name": "Remove.bg", "desc": "Background removal", "cat": "Media", "url": "https://www.remove.bg/api", "auth": "apiKey"},
    {"name": "Imgix", "desc": "Image CDN", "cat": "Media", "url": "https://docs.imgix.com/apis/", "auth": "apiKey"},
    {"name": "Thumbor", "desc": "Image processing", "cat": "Media", "url": "https://thumbor.readthedocs.io/", "auth": "None"},
    {"name": "TinyPNG", "desc": "Image compression", "cat": "Media", "url": "https://tinypng.com/developers", "auth": "apiKey"},
    {"name": "Imagga", "desc": "Image recognition", "cat": "AI", "url": "https://docs.imagga.com/", "auth": "apiKey"},
    {"name": "Kraken.io", "desc": "Image optimization", "cat": "Media", "url": "https://kraken.io/docs/", "auth": "apiKey"},
    {"name": "Sharp", "desc": "Image processing", "cat": "Media", "url": "https://sharp.pixelplumbing.com/api", "auth": "None"},
    {"name": "Uploadcare", "desc": "File uploading", "cat": "Media", "url": "https://uploadcare.com/api-refs/", "auth": "apiKey"},
    {"name": "Sirv", "desc": "Image CDN", "cat": "Media", "url": "https://sirv.com/help/api/", "auth": "apiKey"},
    {"name": "ImageKit", "desc": "Image CDN", "cat": "Media", "url": "https://docs.imagekit.io/", "auth": "apiKey"},
    
    # Testing & QA
    {"name": "BrowserStack", "desc": "Browser testing", "cat": "Testing", "url": "https://www.browserstack.com/docs/automate/api-reference/", "auth": "apiKey"},
    {"name": "Sauce Labs", "desc": "Testing platform", "cat": "Testing", "url": "https://docs.saucelabs.com/dev/api/", "auth": "apiKey"},
    {"name": "LambdaTest", "desc": "Browser testing", "cat": "Testing", "url": "https://www.lambdatest.com/support/api-doc/", "auth": "apiKey"},
    {"name": "Testim", "desc": "AI testing", "cat": "Testing", "url": "https://help.testim.io/docs/api", "auth": "apiKey"},
    {"name": "Mabl", "desc": "Test automation", "cat": "Testing", "url": "https://help.mabl.com/docs/api-overview", "auth": "apiKey"},
    {"name": "Cypress Dashboard", "desc": "Test recording", "cat": "Testing", "url": "https://docs.cypress.io/guides/cloud/api", "auth": "apiKey"},
    {"name": "Applitools", "desc": "Visual testing", "cat": "Testing", "url": "https://applitools.com/docs/api/eyes-sdk/", "auth": "apiKey"},
    {"name": "Percy", "desc": "Visual testing", "cat": "Testing", "url": "https://docs.percy.io/docs/api", "auth": "apiKey"},
    {"name": "Checkly", "desc": "Monitoring", "cat": "Testing", "url": "https://www.checklyhq.com/docs/api/", "auth": "apiKey"},
    {"name": "k6", "desc": "Load testing", "cat": "Testing", "url": "https://k6.io/docs/cloud/cloud-reference/cloud-rest-api/", "auth": "apiKey"},
    
    # Security
    {"name": "Snyk", "desc": "Security scanning", "cat": "Security", "url": "https://snyk.docs.apiary.io/", "auth": "apiKey"},
    {"name": "SonarQube", "desc": "Code quality", "cat": "Security", "url": "https://docs.sonarqube.org/latest/extend/web-api/", "auth": "apiKey"},
    {"name": "Detectify", "desc": "Web security", "cat": "Security", "url": "https://developer.detectify.com/", "auth": "apiKey"},
    {"name": "SecurityTrails", "desc": "DNS data", "cat": "Security", "url": "https://securitytrails.com/corp/api", "auth": "apiKey"},
    {"name": "VirusTotal", "desc": "File scanning", "cat": "Security", "url": "https://developers.virustotal.com/", "auth": "apiKey"},
    {"name": "URLScan", "desc": "URL analysis", "cat": "Security", "url": "https://urlscan.io/docs/api/", "auth": "apiKey"},
    {"name": "Shodan", "desc": "Internet scanner", "cat": "Security", "url": "https://developer.shodan.io/", "auth": "apiKey"},
    {"name": "Censys", "desc": "Internet data", "cat": "Security", "url": "https://censys.io/api", "auth": "apiKey"},
    {"name": "AlienVault OTX", "desc": "Threat intelligence", "cat": "Security", "url": "https://otx.alienvault.com/api", "auth": "apiKey"},
    {"name": "GreyNoise", "desc": "Threat intelligence", "cat": "Security", "url": "https://docs.greynoise.io/", "auth": "apiKey"},
    
    # Language & Translation
    {"name": "LibreTranslate", "desc": "Open source translation", "cat": "Language", "url": "https://libretranslate.com/docs/", "auth": "apiKey"},
    {"name": "Lingva", "desc": "Translation proxy", "cat": "Language", "url": "https://github.com/thedaviddelta/lingva-translate", "auth": "None"},
    {"name": "MyMemory", "desc": "Translation memory", "cat": "Language", "url": "https://mymemory.translated.net/doc/spec.php", "auth": "None"},
    {"name": "Lilt", "desc": "AI translation", "cat": "Language", "url": "https://lilt.com/docs/api", "auth": "apiKey"},
    {"name": "Smartling", "desc": "Translation platform", "cat": "Language", "url": "https://help.smartling.com/hc/en-us/sections/360005019093-API", "auth": "apiKey"},
    {"name": "Crowdin", "desc": "Localization platform", "cat": "Language", "url": "https://developer.crowdin.com/", "auth": "apiKey"},
    {"name": "Lokalise", "desc": "Localization platform", "cat": "Language", "url": "https://developers.lokalise.com/", "auth": "apiKey"},
    {"name": "Phrase", "desc": "Localization", "cat": "Language", "url": "https://developers.phrase.com/", "auth": "apiKey"},
    {"name": "Transifex", "desc": "Localization platform", "cat": "Language", "url": "https://developers.transifex.com/", "auth": "apiKey"},
    {"name": "POEditor", "desc": "Localization platform", "cat": "Language", "url": "https://poeditor.com/docs/api", "auth": "apiKey"},
    
    # SEO & Web Analytics
    {"name": "Ahrefs", "desc": "SEO tools", "cat": "Marketing", "url": "https://ahrefs.com/api/documentation", "auth": "apiKey"},
    {"name": "Moz", "desc": "SEO software", "cat": "Marketing", "url": "https://moz.com/products/api", "auth": "apiKey"},
    {"name": "Semrush", "desc": "Marketing platform", "cat": "Marketing", "url": "https://www.semrush.com/api-documentation/", "auth": "apiKey"},
    {"name": "Majestic", "desc": "Backlink analysis", "cat": "Marketing", "url": "https://developer-support.majestic.com/", "auth": "apiKey"},
    {"name": "Screaming Frog", "desc": "SEO spider", "cat": "Marketing", "url": "https://www.screamingfrog.co.uk/seo-spider/api/", "auth": "apiKey"},
    {"name": "SpyFu", "desc": "Competitor research", "cat": "Marketing", "url": "https://www.spyfu.com/api", "auth": "apiKey"},
    {"name": "SimilarWeb", "desc": "Web analytics", "cat": "Analytics", "url": "https://developer.similarweb.com/", "auth": "apiKey"},
    {"name": "BuiltWith", "desc": "Technology lookup", "cat": "Marketing", "url": "https://api.builtwith.com/", "auth": "apiKey"},
    {"name": "Wappalyzer", "desc": "Technology profiler", "cat": "Tools", "url": "https://www.wappalyzer.com/docs/api/", "auth": "apiKey"},
    {"name": "PageSpeed Insights", "desc": "Performance testing", "cat": "Tools", "url": "https://developers.google.com/speed/docs/insights/v5/get-started", "auth": "apiKey"},
    
    # Events & Ticketing
    {"name": "Eventbrite", "desc": "Event management", "cat": "Events", "url": "https://www.eventbrite.com/platform/docs/", "auth": "OAuth"},
    {"name": "Ticketmaster", "desc": "Ticketing platform", "cat": "Events", "url": "https://developer.ticketmaster.com/", "auth": "apiKey"},
    {"name": "Meetup", "desc": "Events platform", "cat": "Events", "url": "https://www.meetup.com/api/", "auth": "OAuth"},
    {"name": "Luma", "desc": "Event hosting", "cat": "Events", "url": "https://docs.lu.ma/", "auth": "apiKey"},
    {"name": "Splash", "desc": "Event marketing", "cat": "Events", "url": "https://api.splashthat.com/", "auth": "apiKey"},
    {"name": "Bizzabo", "desc": "Event software", "cat": "Events", "url": "https://developers.bizzabo.com/", "auth": "apiKey"},
    {"name": "Hopin", "desc": "Virtual events", "cat": "Events", "url": "https://hopin.com/developers", "auth": "apiKey"},
    {"name": "Zoom Events", "desc": "Event platform", "cat": "Events", "url": "https://marketplace.zoom.us/docs/api-reference/events/", "auth": "OAuth"},
    {"name": "On24", "desc": "Webinar platform", "cat": "Events", "url": "https://developer.on24.com/", "auth": "apiKey"},
    {"name": "Goldcast", "desc": "B2B events", "cat": "Events", "url": "https://www.goldcast.io/api", "auth": "apiKey"},
    
    # Podcasts & Audio
    {"name": "Spotify for Podcasters", "desc": "Podcast analytics", "cat": "Music", "url": "https://developers.spotify.com/documentation/web-api/", "auth": "OAuth"},
    {"name": "Podchaser", "desc": "Podcast database", "cat": "Music", "url": "https://api-docs.podchaser.com/", "auth": "apiKey"},
    {"name": "Listen Notes", "desc": "Podcast search", "cat": "Music", "url": "https://www.listennotes.com/api/docs/", "auth": "apiKey"},
    {"name": "Transistor", "desc": "Podcast hosting", "cat": "Music", "url": "https://developers.transistor.fm/", "auth": "apiKey"},
    {"name": "Buzzsprout", "desc": "Podcast hosting", "cat": "Music", "url": "https://www.buzzsprout.com/api", "auth": "apiKey"},
    {"name": "Anchor", "desc": "Podcast platform", "cat": "Music", "url": "https://anchor.fm/api", "auth": "OAuth"},
    {"name": "Podbean", "desc": "Podcast hosting", "cat": "Music", "url": "https://developers.podbean.com/", "auth": "OAuth"},
    {"name": "Spreaker", "desc": "Podcast hosting", "cat": "Music", "url": "https://developers.spreaker.com/", "auth": "OAuth"},
    {"name": "Audioboom", "desc": "Podcast network", "cat": "Music", "url": "https://audioboom.com/api", "auth": "apiKey"},
    {"name": "Libsyn", "desc": "Podcast hosting", "cat": "Music", "url": "https://api.libsyn.com/", "auth": "apiKey"},
    
    # SMS & Voice (more)
    {"name": "Clicksend", "desc": "SMS gateway", "cat": "Communication", "url": "https://developers.clicksend.com/", "auth": "apiKey"},
    {"name": "Textmagic", "desc": "SMS marketing", "cat": "Communication", "url": "https://www.textmagic.com/docs/api/", "auth": "apiKey"},
    {"name": "Messente", "desc": "SMS API", "cat": "Communication", "url": "https://messente.com/documentation/", "auth": "apiKey"},
    {"name": "Infobip", "desc": "Communications platform", "cat": "Communication", "url": "https://www.infobip.com/docs/api", "auth": "apiKey"},
    {"name": "Kaleyra", "desc": "CPaaS platform", "cat": "Communication", "url": "https://developers.kaleyra.com/", "auth": "apiKey"},
    {"name": "Routee", "desc": "Messaging platform", "cat": "Communication", "url": "https://docs.routee.net/", "auth": "apiKey"},
    {"name": "Smsapi", "desc": "SMS gateway", "cat": "Communication", "url": "https://www.smsapi.com/docs/", "auth": "apiKey"},
    {"name": "Bulksms", "desc": "SMS gateway", "cat": "Communication", "url": "https://www.bulksms.com/developer/", "auth": "apiKey"},
    {"name": "Textlocal", "desc": "SMS service", "cat": "Communication", "url": "https://api.txtlocal.com/docs/", "auth": "apiKey"},
    {"name": "Tatango", "desc": "SMS marketing", "cat": "Communication", "url": "https://www.tatango.com/api/", "auth": "apiKey"},
    
    # Location & Geospatial
    {"name": "Mapbox", "desc": "Maps platform", "cat": "Maps", "url": "https://docs.mapbox.com/api/", "auth": "apiKey"},
    {"name": "OpenStreetMap", "desc": "Open maps", "cat": "Maps", "url": "https://wiki.openstreetmap.org/wiki/API", "auth": "None"},
    {"name": "TomTom", "desc": "Maps and navigation", "cat": "Maps", "url": "https://developer.tomtom.com/", "auth": "apiKey"},
    {"name": "MapQuest", "desc": "Maps and routing", "cat": "Maps", "url": "https://developer.mapquest.com/documentation/", "auth": "apiKey"},
    {"name": "Opencage", "desc": "Geocoding", "cat": "Maps", "url": "https://opencagedata.com/api", "auth": "apiKey"},
    {"name": "PositionStack", "desc": "Geocoding", "cat": "Maps", "url": "https://positionstack.com/documentation", "auth": "apiKey"},
    {"name": "What3words", "desc": "Location system", "cat": "Maps", "url": "https://developer.what3words.com/", "auth": "apiKey"},
    {"name": "Radar", "desc": "Location infrastructure", "cat": "Maps", "url": "https://radar.com/documentation/api", "auth": "apiKey"},
    {"name": "Precisely", "desc": "Location intelligence", "cat": "Maps", "url": "https://developer.precisely.com/", "auth": "apiKey"},
    {"name": "Smarty", "desc": "Address validation", "cat": "Tools", "url": "https://www.smarty.com/docs/", "auth": "apiKey"},
    
    # Blockchain & Web3
    {"name": "Alchemy", "desc": "Blockchain infrastructure", "cat": "Blockchain", "url": "https://docs.alchemy.com/", "auth": "apiKey"},
    {"name": "Infura", "desc": "Ethereum API", "cat": "Blockchain", "url": "https://docs.infura.io/", "auth": "apiKey"},
    {"name": "QuickNode", "desc": "Blockchain nodes", "cat": "Blockchain", "url": "https://www.quicknode.com/docs/", "auth": "apiKey"},
    {"name": "Moralis", "desc": "Web3 API", "cat": "Blockchain", "url": "https://docs.moralis.io/", "auth": "apiKey"},
    {"name": "Ankr", "desc": "Web3 infrastructure", "cat": "Blockchain", "url": "https://www.ankr.com/docs/", "auth": "apiKey"},
    {"name": "Chainlink", "desc": "Oracle network", "cat": "Blockchain", "url": "https://docs.chain.link/", "auth": "None"},
    {"name": "The Graph", "desc": "Blockchain indexing", "cat": "Blockchain", "url": "https://thegraph.com/docs/", "auth": "apiKey"},
    {"name": "Etherscan", "desc": "Ethereum explorer", "cat": "Blockchain", "url": "https://docs.etherscan.io/", "auth": "apiKey"},
    {"name": "OpenSea", "desc": "NFT marketplace", "cat": "Blockchain", "url": "https://docs.opensea.io/reference/api-overview", "auth": "apiKey"},
    {"name": "NFTPort", "desc": "NFT API", "cat": "Blockchain", "url": "https://docs.nftport.xyz/", "auth": "apiKey"},
    
    # No-code / Low-code
    {"name": "Bubble", "desc": "No-code platform", "cat": "Development", "url": "https://manual.bubble.io/", "auth": "apiKey"},
    {"name": "Webflow", "desc": "Web design platform", "cat": "Development", "url": "https://developers.webflow.com/", "auth": "OAuth"},
    {"name": "Airtable", "desc": "Database platform", "cat": "Database", "url": "https://airtable.com/developers/web/api/introduction", "auth": "apiKey"},
    {"name": "Notion API", "desc": "Workspace platform", "cat": "Productivity", "url": "https://developers.notion.com/", "auth": "OAuth"},
    {"name": "Coda", "desc": "Document platform", "cat": "Productivity", "url": "https://coda.io/developers/apis/v1", "auth": "apiKey"},
    {"name": "Retool", "desc": "Internal tools", "cat": "Development", "url": "https://docs.retool.com/", "auth": "apiKey"},
    {"name": "Appsmith", "desc": "Internal tools", "cat": "Development", "url": "https://docs.appsmith.com/", "auth": "apiKey"},
    {"name": "Budibase", "desc": "Internal tools", "cat": "Development", "url": "https://docs.budibase.com/", "auth": "apiKey"},
    {"name": "Tooljet", "desc": "Low-code platform", "cat": "Development", "url": "https://docs.tooljet.com/", "auth": "apiKey"},
    {"name": "Noloco", "desc": "Internal tools", "cat": "Development", "url": "https://docs.noloco.io/", "auth": "apiKey"},
    
    # Business Intelligence
    {"name": "Metabase", "desc": "Business analytics", "cat": "Analytics", "url": "https://www.metabase.com/docs/latest/api-documentation", "auth": "apiKey"},
    {"name": "Tableau", "desc": "Data visualization", "cat": "Analytics", "url": "https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api.htm", "auth": "OAuth"},
    {"name": "Looker", "desc": "Business intelligence", "cat": "Analytics", "url": "https://cloud.google.com/looker/docs/api", "auth": "OAuth"},
    {"name": "PowerBI", "desc": "Business analytics", "cat": "Analytics", "url": "https://docs.microsoft.com/en-us/rest/api/power-bi/", "auth": "OAuth"},
    {"name": "Mode", "desc": "Analytics platform", "cat": "Analytics", "url": "https://mode.com/developer/api-reference/", "auth": "apiKey"},
    {"name": "Domo", "desc": "Business cloud", "cat": "Analytics", "url": "https://developer.domo.com/", "auth": "OAuth"},
    {"name": "Sisense", "desc": "Analytics platform", "cat": "Analytics", "url": "https://sisense.dev/", "auth": "apiKey"},
    {"name": "Preset", "desc": "Data exploration", "cat": "Analytics", "url": "https://preset.io/api/", "auth": "apiKey"},
    {"name": "Redash", "desc": "Data visualization", "cat": "Analytics", "url": "https://redash.io/help/user-guide/integrations-and-api/api", "auth": "apiKey"},
    {"name": "Observable", "desc": "Data exploration", "cat": "Analytics", "url": "https://observablehq.com/documentation/api/", "auth": "apiKey"},
    
    # Customer Data Platforms
    {"name": "Segment", "desc": "Customer data platform", "cat": "Analytics", "url": "https://segment.com/docs/connections/sources/catalog/", "auth": "apiKey"},
    {"name": "mParticle", "desc": "Customer data platform", "cat": "Analytics", "url": "https://docs.mparticle.com/developers/", "auth": "apiKey"},
    {"name": "RudderStack", "desc": "Customer data platform", "cat": "Analytics", "url": "https://www.rudderstack.com/docs/", "auth": "apiKey"},
    {"name": "Amplitude", "desc": "Product analytics", "cat": "Analytics", "url": "https://www.docs.developers.amplitude.com/", "auth": "apiKey"},
    {"name": "Heap", "desc": "Digital insights", "cat": "Analytics", "url": "https://developers.heap.io/", "auth": "apiKey"},
    {"name": "PostHog", "desc": "Product analytics", "cat": "Analytics", "url": "https://posthog.com/docs/api", "auth": "apiKey"},
    {"name": "Mixpanel API", "desc": "Product analytics", "cat": "Analytics", "url": "https://developer.mixpanel.com/reference/", "auth": "apiKey"},
    {"name": "FullStory", "desc": "Digital experience", "cat": "Analytics", "url": "https://developer.fullstory.com/", "auth": "apiKey"},
    {"name": "Hotjar", "desc": "Behavior analytics", "cat": "Analytics", "url": "https://help.hotjar.com/hc/en-us/articles/115011789688-Hotjar-API", "auth": "apiKey"},
    {"name": "Pendo", "desc": "Product experience", "cat": "Analytics", "url": "https://engageapi.pendo.io/", "auth": "apiKey"},
    
    # Feature Flags & Experimentation
    {"name": "LaunchDarkly", "desc": "Feature management", "cat": "Development", "url": "https://apidocs.launchdarkly.com/", "auth": "apiKey"},
    {"name": "Split", "desc": "Feature delivery", "cat": "Development", "url": "https://help.split.io/hc/en-us/articles/360020564931-REST-API", "auth": "apiKey"},
    {"name": "Optimizely", "desc": "Experimentation", "cat": "Development", "url": "https://docs.developers.optimizely.com/", "auth": "apiKey"},
    {"name": "VWO", "desc": "A/B testing", "cat": "Development", "url": "https://developers.vwo.com/", "auth": "apiKey"},
    {"name": "AB Tasty", "desc": "Experience optimization", "cat": "Development", "url": "https://developers.abtasty.com/", "auth": "apiKey"},
    {"name": "Kameleoon", "desc": "Feature experimentation", "cat": "Development", "url": "https://developers.kameleoon.com/", "auth": "apiKey"},
    {"name": "Statsig", "desc": "Feature management", "cat": "Development", "url": "https://docs.statsig.com/", "auth": "apiKey"},
    {"name": "Flagsmith", "desc": "Feature flags", "cat": "Development", "url": "https://docs.flagsmith.com/", "auth": "apiKey"},
    {"name": "GrowthBook", "desc": "Feature flags", "cat": "Development", "url": "https://docs.growthbook.io/", "auth": "apiKey"},
    {"name": "Unleash", "desc": "Feature toggles", "cat": "Development", "url": "https://docs.getunleash.io/reference/api/", "auth": "apiKey"},
    
    # Data Integration / ETL
    {"name": "Airbyte", "desc": "Data integration", "cat": "Data", "url": "https://docs.airbyte.com/api-documentation/", "auth": "apiKey"},
    {"name": "Fivetran", "desc": "Data pipelines", "cat": "Data", "url": "https://fivetran.com/docs/rest-api", "auth": "apiKey"},
    {"name": "Stitch", "desc": "ETL platform", "cat": "Data", "url": "https://www.stitchdata.com/docs/developers", "auth": "apiKey"},
    {"name": "dbt Cloud", "desc": "Data transformation", "cat": "Data", "url": "https://docs.getdbt.com/dbt-cloud/api-v2", "auth": "apiKey"},
    {"name": "Hevo", "desc": "Data pipeline", "cat": "Data", "url": "https://docs.hevodata.com/", "auth": "apiKey"},
    {"name": "Matillion", "desc": "Data integration", "cat": "Data", "url": "https://documentation.matillion.com/", "auth": "apiKey"},
    {"name": "Hightouch", "desc": "Reverse ETL", "cat": "Data", "url": "https://hightouch.com/docs/developer-tools/api", "auth": "apiKey"},
    {"name": "Census", "desc": "Reverse ETL", "cat": "Data", "url": "https://docs.getcensus.com/", "auth": "apiKey"},
    {"name": "Polytomic", "desc": "Data sync", "cat": "Data", "url": "https://apidocs.polytomic.com/", "auth": "apiKey"},
    {"name": "Grouparoo", "desc": "Data sync", "cat": "Data", "url": "https://www.grouparoo.com/docs/", "auth": "apiKey"},
    
    # Knowledge Management
    {"name": "Confluence", "desc": "Team workspace", "cat": "Productivity", "url": "https://developer.atlassian.com/cloud/confluence/rest/", "auth": "OAuth"},
    {"name": "Guru", "desc": "Knowledge management", "cat": "Productivity", "url": "https://developer.getguru.com/", "auth": "apiKey"},
    {"name": "Tettra", "desc": "Knowledge base", "cat": "Productivity", "url": "https://tettra.com/api/", "auth": "apiKey"},
    {"name": "Slite", "desc": "Team knowledge", "cat": "Productivity", "url": "https://developers.slite.com/", "auth": "apiKey"},
    {"name": "Nuclino", "desc": "Knowledge wiki", "cat": "Productivity", "url": "https://help.nuclino.com/d3f3b5cb-api", "auth": "apiKey"},
    {"name": "Almanac", "desc": "Document platform", "cat": "Productivity", "url": "https://almanac.io/api/", "auth": "apiKey"},
    {"name": "Swimm", "desc": "Code documentation", "cat": "Development", "url": "https://docs.swimm.io/", "auth": "apiKey"},
    {"name": "GitBook", "desc": "Documentation", "cat": "Documentation", "url": "https://developer.gitbook.com/", "auth": "apiKey"},
    {"name": "ReadMe", "desc": "Developer docs", "cat": "Documentation", "url": "https://docs.readme.com/reference/intro", "auth": "apiKey"},
    {"name": "Mintlify", "desc": "Documentation", "cat": "Documentation", "url": "https://mintlify.com/docs/api-reference/", "auth": "apiKey"},
    
    # Project Management (more)
    {"name": "Jira", "desc": "Project tracking", "cat": "Productivity", "url": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/", "auth": "OAuth"},
    {"name": "Linear", "desc": "Issue tracking", "cat": "Productivity", "url": "https://developers.linear.app/", "auth": "OAuth"},
    {"name": "Height", "desc": "Project management", "cat": "Productivity", "url": "https://height.notion.site/API-9aa0e18a00824b23a1a77f2fdb2ef898", "auth": "apiKey"},
    {"name": "Shortcut", "desc": "Project management", "cat": "Productivity", "url": "https://developer.shortcut.com/api/rest/v3", "auth": "apiKey"},
    {"name": "Basecamp", "desc": "Project management", "cat": "Productivity", "url": "https://github.com/basecamp/bc3-api", "auth": "OAuth"},
    {"name": "Teamwork", "desc": "Project management", "cat": "Productivity", "url": "https://developer.teamwork.com/", "auth": "apiKey"},
    {"name": "Wrike", "desc": "Work management", "cat": "Productivity", "url": "https://developers.wrike.com/", "auth": "OAuth"},
    {"name": "Smartsheet", "desc": "Work execution", "cat": "Productivity", "url": "https://smartsheet-platform.github.io/api-docs/", "auth": "apiKey"},
    {"name": "Hive", "desc": "Project management", "cat": "Productivity", "url": "https://developers.hive.com/", "auth": "apiKey"},
    {"name": "Nifty", "desc": "Project management", "cat": "Productivity", "url": "https://niftypm.com/api/", "auth": "apiKey"},
    
    # Additional misc APIs
    {"name": "Lorem Ipsum", "desc": "Placeholder text", "cat": "Tools", "url": "https://loripsum.net/", "auth": "None"},
    {"name": "Bacon Ipsum", "desc": "Meaty placeholder text", "cat": "Entertainment", "url": "https://baconipsum.com/json-api/", "auth": "None"},
    {"name": "Hipster Ipsum", "desc": "Hipster placeholder", "cat": "Entertainment", "url": "https://hipsum.co/api/", "auth": "None"},
    {"name": "Cupcake Ipsum", "desc": "Sweet placeholder", "cat": "Entertainment", "url": "http://www.cupcakeipsum.com/", "auth": "None"},
    {"name": "Cheese Ipsum", "desc": "Cheesy placeholder", "cat": "Entertainment", "url": "http://www.cheeseipsum.co.uk/", "auth": "None"},
    {"name": "Pirate Ipsum", "desc": "Pirate placeholder", "cat": "Entertainment", "url": "https://pirateipsum.me/api", "auth": "None"},
    {"name": "Zombie Ipsum", "desc": "Zombie placeholder", "cat": "Entertainment", "url": "http://www.zombieipsum.com/", "auth": "None"},
    {"name": "Samuel L Ipsum", "desc": "Samuel L Jackson text", "cat": "Entertainment", "url": "https://slipsum.com/", "auth": "None"},
    {"name": "Office Ipsum", "desc": "Office jargon", "cat": "Entertainment", "url": "http://officeipsum.com/", "auth": "None"},
    {"name": "Cat Ipsum", "desc": "Cat-themed placeholder", "cat": "Entertainment", "url": "http://www.catipsum.com/", "auth": "None"},
]

# Convert and dedupe
new_apis = []
seen_ids = set()

for api in batch3_apis:
    api_id = make_id(api.get('name', ''))
    
    if api_id in existing_ids or api_id in seen_ids or not api_id:
        continue
    
    seen_ids.add(api_id)
    
    entry = {
        "id": api_id,
        "name": api.get('name', api_id),
        "description": api.get('desc', ''),
        "category": api.get('cat', 'Uncategorized'),
        "link": api.get('url', ''),
        "auth": api.get('auth', 'None')
    }
    new_apis.append(entry)

print(f"New unique APIs in batch 3: {len(new_apis)}")

# Save batch 3
output_file = Path("/Users/gustavhemmingsson/Projects/apiclaw/data/night-expansion-02-26-06-batch3.json")
with open(output_file, 'w') as f:
    json.dump(new_apis, f, indent=2)

print(f"Saved {len(new_apis)} APIs to {output_file}")

# Update combined file
with open(combined_file) as f:
    combined_apis = json.load(f)

combined_apis.extend(new_apis)

with open(combined_file, 'w') as f:
    json.dump(combined_apis, f, indent=2)

print(f"Updated combined file: {len(combined_apis)} total APIs")
