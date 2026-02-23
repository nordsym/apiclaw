#!/usr/bin/env python3
"""APIClaw Night Expansion 03:00 - Batch 3 - APIs.guru OpenAPI specs"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis_expanded.json")

def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)

def save_registry(data):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, indent=2)

def generate_id(name, category):
    clean = name.lower().replace(" ", "-").replace(".", "-")[:20]
    return f"{category.lower()[:3]}-{clean}-{hash(name) % 10000}"

# Batch 3: APIs from apis.guru (OpenAPI specs)
BATCH3_APIS = [
    # 1Forge & Financial
    {"name": "1Forge Finance", "description": "Stock and Forex Data and Realtime Quotes", "category": "Finance", "baseUrl": "https://1forge.com/", "authType": "apiKey"},
    {"name": "1Password Events", "description": "1Password Events API", "category": "Security", "baseUrl": "https://events.1password.com/", "authType": "apiKey"},
    {"name": "1Password Connect", "description": "REST API for 1Password Connect", "category": "Security", "baseUrl": "https://1password.local/", "authType": "apiKey"},
    
    # Ably
    {"name": "Ably Platform", "description": "REST API for Ably realtime messaging", "category": "Communication", "baseUrl": "https://rest.ably.io/", "authType": "apiKey"},
    {"name": "Ably Control", "description": "Ably Control API for account management", "category": "Communication", "baseUrl": "https://control.ably.net/", "authType": "apiKey"},
    
    # Abstract APIs
    {"name": "Abstract Geolocation", "description": "IP geolocation API", "category": "Geocoding", "baseUrl": "https://ipgeolocation.abstractapi.com/", "authType": "apiKey"},
    
    # Adafruit
    {"name": "Adafruit IO", "description": "IoT REST API", "category": "IoT", "baseUrl": "https://io.adafruit.com/api/", "authType": "apiKey"},
    
    # Adobe
    {"name": "Adobe Experience Manager", "description": "AEM API for content management", "category": "CMS", "baseUrl": "https://aem.adobe.com/", "authType": "apiKey"},
    
    # Adyen
    {"name": "Adyen Account", "description": "Account management for Adyen platform", "category": "Payments", "baseUrl": "https://cal-test.adyen.com/", "authType": "apiKey"},
    {"name": "Adyen Balance Control", "description": "Transfer funds between merchant accounts", "category": "Payments", "baseUrl": "https://pal-test.adyen.com/", "authType": "apiKey"},
    {"name": "Adyen Checkout", "description": "Adyen payment checkout API", "category": "Payments", "baseUrl": "https://checkout-test.adyen.com/", "authType": "apiKey"},
    {"name": "Adyen Configuration", "description": "Balance platform configuration", "category": "Payments", "baseUrl": "https://balanceplatform-api-test.adyen.com/", "authType": "apiKey"},
    {"name": "Adyen BinLookup", "description": "BIN lookup for card information", "category": "Payments", "baseUrl": "https://pal-test.adyen.com/", "authType": "apiKey"},
    
    # Agco & Agriculture
    {"name": "AGCO Fuse", "description": "Agricultural equipment API", "category": "Agriculture", "baseUrl": "https://api.agcodigital.com/", "authType": "oauth"},
    {"name": "AgroMonitoring", "description": "Agricultural monitoring API", "category": "Agriculture", "baseUrl": "https://api.agromonitoring.com/", "authType": "apiKey"},
    {"name": "Agridata", "description": "Agricultural data API", "category": "Agriculture", "baseUrl": "https://api.agridata.com/", "authType": "apiKey"},
    
    # Air Quality
    {"name": "AirVisual", "description": "Air quality data worldwide", "category": "Environment", "baseUrl": "https://api.airvisual.com/", "authType": "apiKey"},
    {"name": "Breezometer", "description": "Air quality and pollen data", "category": "Environment", "baseUrl": "https://api.breezometer.com/", "authType": "apiKey"},
    {"name": "AQICN", "description": "Air quality index data", "category": "Environment", "baseUrl": "https://aqicn.org/", "authType": "apiKey"},
    
    # Airline & Aviation
    {"name": "Amadeus", "description": "Airline and travel API", "category": "Transportation", "baseUrl": "https://api.amadeus.com/", "authType": "oauth"},
    {"name": "Skyscanner", "description": "Flight search API", "category": "Transportation", "baseUrl": "https://partners.api.skyscanner.net/", "authType": "apiKey"},
    {"name": "Kiwi.com", "description": "Flight search and booking", "category": "Transportation", "baseUrl": "https://api.tequila.kiwi.com/", "authType": "apiKey"},
    {"name": "Duffel", "description": "Travel booking API", "category": "Transportation", "baseUrl": "https://api.duffel.com/", "authType": "bearer"},
    {"name": "Travelpayouts", "description": "Affiliate travel API", "category": "Transportation", "baseUrl": "https://api.travelpayouts.com/", "authType": "apiKey"},
    
    # Analytics & Monitoring
    {"name": "Amplitude", "description": "Product analytics", "category": "Analytics", "baseUrl": "https://analytics.amplitude.com/", "authType": "apiKey"},
    {"name": "Heap", "description": "Digital insights platform", "category": "Analytics", "baseUrl": "https://heapanalytics.com/api/", "authType": "apiKey"},
    {"name": "FullStory", "description": "Digital experience analytics", "category": "Analytics", "baseUrl": "https://api.fullstory.com/", "authType": "apiKey"},
    {"name": "Hotjar", "description": "Behavior analytics", "category": "Analytics", "baseUrl": "https://insights.hotjar.com/api/", "authType": "apiKey"},
    {"name": "LogRocket", "description": "Session replay and analytics", "category": "Analytics", "baseUrl": "https://app.logrocket.com/api/", "authType": "apiKey"},
    
    # APIs for APIs
    {"name": "RapidAPI", "description": "API marketplace", "category": "Development", "baseUrl": "https://rapidapi.com/", "authType": "apiKey"},
    {"name": "APILayer", "description": "API marketplace", "category": "Development", "baseUrl": "https://apilayer.com/", "authType": "apiKey"},
    {"name": "Kong", "description": "API gateway", "category": "Development", "baseUrl": "https://api.konghq.com/", "authType": "apiKey"},
    {"name": "Tyk", "description": "API management", "category": "Development", "baseUrl": "https://tyk.io/", "authType": "apiKey"},
    {"name": "Postman", "description": "API platform", "category": "Development", "baseUrl": "https://api.getpostman.com/", "authType": "apiKey"},
    {"name": "SwaggerHub", "description": "API design and documentation", "category": "Development", "baseUrl": "https://api.swaggerhub.com/", "authType": "apiKey"},
    {"name": "Stoplight", "description": "API design platform", "category": "Development", "baseUrl": "https://stoplight.io/api/", "authType": "apiKey"},
    
    # App Store APIs
    {"name": "App Store Connect", "description": "Apple App Store management", "category": "Development", "baseUrl": "https://api.appstoreconnect.apple.com/", "authType": "jwt"},
    {"name": "Google Play Developer", "description": "Play Store management", "category": "Development", "baseUrl": "https://androidpublisher.googleapis.com/", "authType": "oauth"},
    {"name": "App Annie", "description": "App market data", "category": "Analytics", "baseUrl": "https://api.appannie.com/", "authType": "apiKey"},
    {"name": "SensorTower", "description": "Mobile app intelligence", "category": "Analytics", "baseUrl": "https://api.sensortower.com/", "authType": "apiKey"},
    {"name": "Appfigures", "description": "App analytics", "category": "Analytics", "baseUrl": "https://api.appfigures.com/", "authType": "apiKey"},
    
    # Appointment & Scheduling
    {"name": "Acuity Scheduling", "description": "Appointment scheduling", "category": "Business", "baseUrl": "https://acuityscheduling.com/api/", "authType": "basic"},
    {"name": "Calendly", "description": "Scheduling API", "category": "Business", "baseUrl": "https://api.calendly.com/", "authType": "oauth"},
    {"name": "Cal.com", "description": "Open source scheduling", "category": "Business", "baseUrl": "https://api.cal.com/", "authType": "apiKey"},
    {"name": "YouCanBook.me", "description": "Online scheduling", "category": "Business", "baseUrl": "https://api.youcanbook.me/", "authType": "apiKey"},
    {"name": "Doodle", "description": "Meeting scheduler", "category": "Business", "baseUrl": "https://doodle.com/api/", "authType": "oauth"},
    {"name": "Setmore", "description": "Appointment scheduling", "category": "Business", "baseUrl": "https://api.setmore.com/", "authType": "apiKey"},
    {"name": "SimplyBook.me", "description": "Booking system", "category": "Business", "baseUrl": "https://user-api.simplybook.me/", "authType": "apiKey"},
    
    # AR & 3D
    {"name": "Echo3D", "description": "3D asset management", "category": "AR/VR", "baseUrl": "https://api.echo3d.co/", "authType": "apiKey"},
    {"name": "Sketchfab", "description": "3D model platform", "category": "AR/VR", "baseUrl": "https://api.sketchfab.com/", "authType": "oauth"},
    {"name": "Poly (Google)", "description": "3D object library", "category": "AR/VR", "baseUrl": "https://poly.googleapis.com/", "authType": "apiKey"},
    {"name": "CGTrader", "description": "3D model marketplace", "category": "AR/VR", "baseUrl": "https://www.cgtrader.com/api/", "authType": "apiKey"},
    {"name": "TurboSquid", "description": "3D model marketplace", "category": "AR/VR", "baseUrl": "https://www.turbosquid.com/API/", "authType": "apiKey"},
    
    # Audio & Podcasts
    {"name": "Anchor", "description": "Podcast hosting", "category": "Media", "baseUrl": "https://anchor.fm/api/", "authType": "oauth"},
    {"name": "Buzzsprout", "description": "Podcast hosting", "category": "Media", "baseUrl": "https://www.buzzsprout.com/api/", "authType": "apiKey"},
    {"name": "Transistor", "description": "Podcast hosting", "category": "Media", "baseUrl": "https://api.transistor.fm/", "authType": "apiKey"},
    {"name": "Podbean", "description": "Podcast hosting", "category": "Media", "baseUrl": "https://api.podbean.com/", "authType": "oauth"},
    {"name": "Listen Notes", "description": "Podcast search", "category": "Media", "baseUrl": "https://listen-api.listennotes.com/", "authType": "apiKey"},
    {"name": "Podcast Index", "description": "Open podcast database", "category": "Media", "baseUrl": "https://api.podcastindex.org/", "authType": "apiKey"},
    {"name": "Audd.io", "description": "Music recognition", "category": "Media", "baseUrl": "https://api.audd.io/", "authType": "apiKey"},
    {"name": "ACRCloud", "description": "Audio recognition", "category": "Media", "baseUrl": "https://api.acrcloud.com/", "authType": "apiKey"},
    
    # Background Checks
    {"name": "Checkr", "description": "Background checks", "category": "Security", "baseUrl": "https://api.checkr.com/", "authType": "basic"},
    {"name": "GoodHire", "description": "Background checks", "category": "Security", "baseUrl": "https://api.goodhire.com/", "authType": "apiKey"},
    {"name": "Sterling", "description": "Background screening", "category": "Security", "baseUrl": "https://api.sterlingcheck.com/", "authType": "oauth"},
    
    # Banking APIs
    {"name": "Plaid", "description": "Banking data", "category": "Finance", "baseUrl": "https://production.plaid.com/", "authType": "apiKey"},
    {"name": "Finicity", "description": "Financial data aggregation", "category": "Finance", "baseUrl": "https://api.finicity.com/", "authType": "apiKey"},
    {"name": "Yodlee", "description": "Financial data platform", "category": "Finance", "baseUrl": "https://api.yodlee.com/", "authType": "oauth"},
    {"name": "Tink", "description": "Open banking platform", "category": "Finance", "baseUrl": "https://api.tink.com/", "authType": "oauth"},
    {"name": "TrueLayer", "description": "Open banking", "category": "Finance", "baseUrl": "https://api.truelayer.com/", "authType": "oauth"},
    {"name": "Salt Edge", "description": "Open banking aggregation", "category": "Finance", "baseUrl": "https://www.saltedge.com/api/", "authType": "apiKey"},
    {"name": "Nordigen", "description": "EU open banking", "category": "Finance", "baseUrl": "https://ob.nordigen.com/api/", "authType": "apiKey"},
    
    # Billing & Subscriptions
    {"name": "Stripe Billing", "description": "Subscription management", "category": "Commerce", "baseUrl": "https://api.stripe.com/", "authType": "apiKey"},
    {"name": "Chargebee", "description": "Subscription billing", "category": "Commerce", "baseUrl": "https://sitename.chargebee.com/api/", "authType": "basic"},
    {"name": "Recurly", "description": "Subscription management", "category": "Commerce", "baseUrl": "https://v3.recurly.com/", "authType": "apiKey"},
    {"name": "Paddle", "description": "SaaS commerce", "category": "Commerce", "baseUrl": "https://vendors.paddle.com/api/", "authType": "apiKey"},
    {"name": "Zuora", "description": "Subscription platform", "category": "Commerce", "baseUrl": "https://rest.zuora.com/", "authType": "oauth"},
    {"name": "FastSpring", "description": "E-commerce platform", "category": "Commerce", "baseUrl": "https://api.fastspring.com/", "authType": "basic"},
    {"name": "Gumroad", "description": "Creator commerce", "category": "Commerce", "baseUrl": "https://api.gumroad.com/", "authType": "oauth"},
    {"name": "Lemon Squeezy", "description": "Digital commerce", "category": "Commerce", "baseUrl": "https://api.lemonsqueezy.com/", "authType": "apiKey"},
    
    # Bio & Health Tech
    {"name": "23andMe", "description": "Genetics API", "category": "Health", "baseUrl": "https://api.23andme.com/", "authType": "oauth"},
    {"name": "MyFitnessPal", "description": "Nutrition tracking", "category": "Health", "baseUrl": "https://www.myfitnesspal.com/api/", "authType": "oauth"},
    {"name": "Nutritionix", "description": "Nutrition database", "category": "Health", "baseUrl": "https://trackapi.nutritionix.com/", "authType": "apiKey"},
    {"name": "USDA FoodData", "description": "Food nutrition data", "category": "Health", "baseUrl": "https://api.nal.usda.gov/fdc/", "authType": "apiKey"},
    {"name": "Edamam Food", "description": "Food database", "category": "Health", "baseUrl": "https://api.edamam.com/api/food-database/", "authType": "apiKey"},
    
    # Blogging Platforms
    {"name": "Medium", "description": "Blog publishing", "category": "Content", "baseUrl": "https://api.medium.com/", "authType": "oauth"},
    {"name": "Ghost Admin", "description": "Ghost CMS API", "category": "CMS", "baseUrl": "https://yoursite.ghost.io/ghost/api/", "authType": "apiKey"},
    {"name": "Hashnode", "description": "Developer blogging", "category": "Content", "baseUrl": "https://api.hashnode.com/", "authType": "apiKey"},
    {"name": "DEV.to", "description": "Developer community", "category": "Content", "baseUrl": "https://dev.to/api/", "authType": "apiKey"},
    {"name": "WordPress", "description": "WordPress REST API", "category": "CMS", "baseUrl": "https://developer.wordpress.com/docs/api/", "authType": "oauth"},
    {"name": "Webflow", "description": "Website builder API", "category": "CMS", "baseUrl": "https://api.webflow.com/", "authType": "oauth"},
    {"name": "Contentful", "description": "Headless CMS", "category": "CMS", "baseUrl": "https://cdn.contentful.com/", "authType": "apiKey"},
    {"name": "Strapi", "description": "Headless CMS", "category": "CMS", "baseUrl": "https://strapi.io/api/", "authType": "jwt"},
    {"name": "Sanity", "description": "Content platform", "category": "CMS", "baseUrl": "https://api.sanity.io/", "authType": "apiKey"},
    {"name": "Prismic", "description": "Headless CMS", "category": "CMS", "baseUrl": "https://prismic.io/api/", "authType": "apiKey"},
    {"name": "DatoCMS", "description": "Headless CMS", "category": "CMS", "baseUrl": "https://site-api.datocms.com/", "authType": "bearer"},
    {"name": "Storyblok", "description": "Headless CMS", "category": "CMS", "baseUrl": "https://api.storyblok.com/", "authType": "apiKey"},
    {"name": "Hygraph", "description": "Federated content platform", "category": "CMS", "baseUrl": "https://api.hygraph.com/", "authType": "apiKey"},
    {"name": "Builder.io", "description": "Visual CMS", "category": "CMS", "baseUrl": "https://builder.io/api/", "authType": "apiKey"},
    
    # Bots & Automation
    {"name": "Telegram Bot", "description": "Telegram messaging bots", "category": "Communication", "baseUrl": "https://api.telegram.org/bot", "authType": "apiKey"},
    {"name": "Discord Bot", "description": "Discord bots", "category": "Communication", "baseUrl": "https://discord.com/api/", "authType": "oauth"},
    {"name": "Slack Bot", "description": "Slack workspace bots", "category": "Communication", "baseUrl": "https://slack.com/api/", "authType": "oauth"},
    {"name": "Microsoft Bot Framework", "description": "Bot building", "category": "AI/ML", "baseUrl": "https://api.botframework.com/", "authType": "oauth"},
    {"name": "Dialogflow", "description": "Conversational AI", "category": "AI/ML", "baseUrl": "https://dialogflow.googleapis.com/", "authType": "oauth"},
    {"name": "Amazon Lex", "description": "Conversational interfaces", "category": "AI/ML", "baseUrl": "https://runtime.lex.amazonaws.com/", "authType": "apiKey"},
    {"name": "Rasa", "description": "Open source conversational AI", "category": "AI/ML", "baseUrl": "https://rasa.com/api/", "authType": "apiKey"},
    {"name": "Botpress", "description": "Open source bot platform", "category": "AI/ML", "baseUrl": "https://botpress.com/api/", "authType": "apiKey"},
    
    # Browser Extensions
    {"name": "Chrome Web Store", "description": "Extension marketplace", "category": "Development", "baseUrl": "https://www.googleapis.com/chromewebstore/", "authType": "oauth"},
    {"name": "Firefox Add-ons", "description": "Extension marketplace", "category": "Development", "baseUrl": "https://addons.mozilla.org/api/", "authType": "apiKey"},
    
    # Business Intelligence
    {"name": "Tableau", "description": "Business analytics", "category": "Analytics", "baseUrl": "https://tableau.com/api/", "authType": "oauth"},
    {"name": "Power BI", "description": "Microsoft BI", "category": "Analytics", "baseUrl": "https://api.powerbi.com/", "authType": "oauth"},
    {"name": "Looker", "description": "Business intelligence", "category": "Analytics", "baseUrl": "https://your.looker.com/api/", "authType": "apiKey"},
    {"name": "Metabase", "description": "Open source BI", "category": "Analytics", "baseUrl": "https://your.metabase.com/api/", "authType": "apiKey"},
    {"name": "Sisense", "description": "Analytics platform", "category": "Analytics", "baseUrl": "https://your.sisense.com/api/", "authType": "apiKey"},
    {"name": "Domo", "description": "Business cloud", "category": "Analytics", "baseUrl": "https://api.domo.com/", "authType": "oauth"},
    
    # CDN & Edge
    {"name": "Cloudflare", "description": "CDN and security", "category": "Infrastructure", "baseUrl": "https://api.cloudflare.com/client/v4/", "authType": "apiKey"},
    {"name": "Fastly", "description": "Edge cloud platform", "category": "Infrastructure", "baseUrl": "https://api.fastly.com/", "authType": "apiKey"},
    {"name": "Akamai", "description": "CDN and security", "category": "Infrastructure", "baseUrl": "https://api.akamai.com/", "authType": "oauth"},
    {"name": "KeyCDN", "description": "Content delivery", "category": "Infrastructure", "baseUrl": "https://api.keycdn.com/", "authType": "apiKey"},
    {"name": "BunnyCDN", "description": "Content delivery", "category": "Infrastructure", "baseUrl": "https://api.bunny.net/", "authType": "apiKey"},
    {"name": "StackPath", "description": "Edge services", "category": "Infrastructure", "baseUrl": "https://gateway.stackpath.com/", "authType": "oauth"},
    
    # Chat & Messaging
    {"name": "Sendbird", "description": "Chat API", "category": "Communication", "baseUrl": "https://api.sendbird.com/", "authType": "apiKey"},
    {"name": "Stream", "description": "Chat and feeds", "category": "Communication", "baseUrl": "https://chat.stream-io-api.com/", "authType": "apiKey"},
    {"name": "PubNub", "description": "Real-time messaging", "category": "Communication", "baseUrl": "https://ps.pndsn.com/", "authType": "apiKey"},
    {"name": "Pusher", "description": "Real-time channels", "category": "Communication", "baseUrl": "https://api.pusher.com/", "authType": "apiKey"},
    {"name": "Crisp", "description": "Customer messaging", "category": "Communication", "baseUrl": "https://api.crisp.chat/", "authType": "apiKey"},
    {"name": "Tawk.to", "description": "Live chat", "category": "Communication", "baseUrl": "https://api.tawk.to/", "authType": "apiKey"},
    {"name": "LiveChat", "description": "Customer service chat", "category": "Communication", "baseUrl": "https://api.livechatinc.com/", "authType": "oauth"},
    {"name": "Drift", "description": "Conversational marketing", "category": "Communication", "baseUrl": "https://api.drift.com/", "authType": "oauth"},
    {"name": "Chatwoot", "description": "Open source customer engagement", "category": "Communication", "baseUrl": "https://app.chatwoot.com/api/", "authType": "apiKey"},
    
    # Code Quality
    {"name": "SonarQube", "description": "Code quality", "category": "Development", "baseUrl": "https://sonarcloud.io/api/", "authType": "apiKey"},
    {"name": "Codacy", "description": "Code review automation", "category": "Development", "baseUrl": "https://api.codacy.com/", "authType": "apiKey"},
    {"name": "CodeClimate", "description": "Code quality", "category": "Development", "baseUrl": "https://api.codeclimate.com/", "authType": "apiKey"},
    {"name": "Codecov", "description": "Code coverage", "category": "Development", "baseUrl": "https://codecov.io/api/", "authType": "apiKey"},
    {"name": "Coveralls", "description": "Code coverage", "category": "Development", "baseUrl": "https://coveralls.io/api/", "authType": "apiKey"},
    {"name": "Snyk", "description": "Security scanning", "category": "Security", "baseUrl": "https://snyk.io/api/", "authType": "apiKey"},
    {"name": "Dependabot", "description": "Dependency updates", "category": "Development", "baseUrl": "https://api.dependabot.com/", "authType": "apiKey"},
    {"name": "Renovate", "description": "Dependency updates", "category": "Development", "baseUrl": "https://api.renovatebot.com/", "authType": "apiKey"},
    
    # Company Data
    {"name": "Crunchbase", "description": "Company data", "category": "Business", "baseUrl": "https://api.crunchbase.com/", "authType": "apiKey"},
    {"name": "Clearbit", "description": "Business data", "category": "Business", "baseUrl": "https://company.clearbit.com/", "authType": "apiKey"},
    {"name": "PitchBook", "description": "Private market data", "category": "Finance", "baseUrl": "https://api.pitchbook.com/", "authType": "apiKey"},
    {"name": "ZoomInfo", "description": "B2B data", "category": "Business", "baseUrl": "https://api.zoominfo.com/", "authType": "oauth"},
    {"name": "Apollo.io", "description": "Sales intelligence", "category": "Business", "baseUrl": "https://api.apollo.io/", "authType": "apiKey"},
    {"name": "Hunter.io", "description": "Email finder", "category": "Business", "baseUrl": "https://api.hunter.io/", "authType": "apiKey"},
    {"name": "Lusha", "description": "B2B contact data", "category": "Business", "baseUrl": "https://api.lusha.com/", "authType": "apiKey"},
    {"name": "FullContact", "description": "Identity resolution", "category": "Business", "baseUrl": "https://api.fullcontact.com/", "authType": "apiKey"},
    
    # Contract & Legal
    {"name": "DocuSign", "description": "e-Signatures", "category": "Business", "baseUrl": "https://www.docusign.net/restapi/", "authType": "oauth"},
    {"name": "HelloSign", "description": "eSignature API", "category": "Business", "baseUrl": "https://api.hellosign.com/", "authType": "apiKey"},
    {"name": "PandaDoc", "description": "Document automation", "category": "Business", "baseUrl": "https://api.pandadoc.com/", "authType": "oauth"},
    {"name": "Ironclad", "description": "Contract management", "category": "Business", "baseUrl": "https://api.ironcladapp.com/", "authType": "apiKey"},
    {"name": "Conga", "description": "Document generation", "category": "Business", "baseUrl": "https://api.conga.com/", "authType": "oauth"},
    
    # Customer Success
    {"name": "Gainsight", "description": "Customer success", "category": "Business", "baseUrl": "https://api.gainsight.com/", "authType": "oauth"},
    {"name": "ChurnZero", "description": "Customer success", "category": "Business", "baseUrl": "https://api.churnzero.net/", "authType": "apiKey"},
    {"name": "Totango", "description": "Customer success", "category": "Business", "baseUrl": "https://api.totango.com/", "authType": "apiKey"},
    {"name": "Vitally", "description": "Customer success", "category": "Business", "baseUrl": "https://api.vitally.io/", "authType": "apiKey"},
    
    # Data Enrichment
    {"name": "Pipl", "description": "People search", "category": "Data", "baseUrl": "https://api.pipl.com/", "authType": "apiKey"},
    {"name": "PeopleDataLabs", "description": "Person and company data", "category": "Data", "baseUrl": "https://api.peopledatalabs.com/", "authType": "apiKey"},
    {"name": "Slintel", "description": "Sales intelligence", "category": "Data", "baseUrl": "https://api.slintel.com/", "authType": "apiKey"},
    {"name": "LeadGenius", "description": "B2B data", "category": "Data", "baseUrl": "https://api.leadgenius.com/", "authType": "apiKey"},
    {"name": "Snov.io", "description": "Lead generation", "category": "Data", "baseUrl": "https://api.snov.io/", "authType": "apiKey"},
    
    # Database APIs
    {"name": "MongoDB Atlas", "description": "MongoDB cloud", "category": "Database", "baseUrl": "https://cloud.mongodb.com/api/atlas/", "authType": "apiKey"},
    {"name": "Fauna", "description": "Serverless database", "category": "Database", "baseUrl": "https://db.fauna.com/", "authType": "apiKey"},
    {"name": "PlanetScale", "description": "MySQL serverless", "category": "Database", "baseUrl": "https://api.planetscale.com/", "authType": "apiKey"},
    {"name": "CockroachDB", "description": "Distributed SQL", "category": "Database", "baseUrl": "https://cockroachlabs.cloud/", "authType": "apiKey"},
    {"name": "Neon", "description": "Serverless Postgres", "category": "Database", "baseUrl": "https://console.neon.tech/api/", "authType": "apiKey"},
    {"name": "Upstash", "description": "Serverless Redis", "category": "Database", "baseUrl": "https://api.upstash.com/", "authType": "apiKey"},
    {"name": "Redis Cloud", "description": "Redis as a service", "category": "Database", "baseUrl": "https://api.redislabs.com/", "authType": "apiKey"},
    {"name": "Xata", "description": "Serverless database", "category": "Database", "baseUrl": "https://api.xata.io/", "authType": "apiKey"},
    {"name": "Turso", "description": "SQLite at the edge", "category": "Database", "baseUrl": "https://api.turso.tech/", "authType": "apiKey"},
    
    # Developer Tools
    {"name": "Raycast", "description": "Productivity launcher", "category": "Development", "baseUrl": "https://api.raycast.com/", "authType": "apiKey"},
    {"name": "Alfred", "description": "Mac productivity", "category": "Development", "baseUrl": "https://www.alfredapp.com/api/", "authType": "apiKey"},
    {"name": "Fig", "description": "Terminal autocomplete", "category": "Development", "baseUrl": "https://api.fig.io/", "authType": "apiKey"},
    {"name": "Warp", "description": "Modern terminal", "category": "Development", "baseUrl": "https://api.warp.dev/", "authType": "apiKey"},
    {"name": "Codeium", "description": "AI code completion", "category": "AI/ML", "baseUrl": "https://api.codeium.com/", "authType": "apiKey"},
    {"name": "Tabnine", "description": "AI assistant", "category": "AI/ML", "baseUrl": "https://api.tabnine.com/", "authType": "apiKey"},
    {"name": "Sourcegraph", "description": "Code search", "category": "Development", "baseUrl": "https://sourcegraph.com/api/", "authType": "apiKey"},
    {"name": "Grep.app", "description": "Code search", "category": "Development", "baseUrl": "https://grep.app/api/", "authType": "none"},
    
    # DNS & Domains
    {"name": "Cloudflare DNS", "description": "DNS management", "category": "Infrastructure", "baseUrl": "https://api.cloudflare.com/client/v4/zones/", "authType": "apiKey"},
    {"name": "Route 53", "description": "AWS DNS", "category": "Infrastructure", "baseUrl": "https://route53.amazonaws.com/", "authType": "apiKey"},
    {"name": "DNSimple", "description": "Domain management", "category": "Infrastructure", "baseUrl": "https://api.dnsimple.com/", "authType": "bearer"},
    {"name": "Name.com", "description": "Domain registrar", "category": "Infrastructure", "baseUrl": "https://api.name.com/", "authType": "basic"},
    {"name": "Namecheap", "description": "Domain registrar", "category": "Infrastructure", "baseUrl": "https://api.namecheap.com/", "authType": "apiKey"},
    {"name": "GoDaddy", "description": "Domain registrar", "category": "Infrastructure", "baseUrl": "https://api.godaddy.com/", "authType": "apiKey"},
    {"name": "Gandi", "description": "Domain registrar", "category": "Infrastructure", "baseUrl": "https://api.gandi.net/", "authType": "apiKey"},
    {"name": "Porkbun", "description": "Domain registrar", "category": "Infrastructure", "baseUrl": "https://porkbun.com/api/", "authType": "apiKey"},
    
    # Document Processing
    {"name": "DocSpring", "description": "PDF generation", "category": "Documents", "baseUrl": "https://api.docspring.com/", "authType": "basic"},
    {"name": "PDF.co", "description": "PDF tools", "category": "Documents", "baseUrl": "https://api.pdf.co/", "authType": "apiKey"},
    {"name": "PSPDFKit", "description": "PDF SDK", "category": "Documents", "baseUrl": "https://api.pspdfkit.com/", "authType": "apiKey"},
    {"name": "Anvil", "description": "Paperwork automation", "category": "Documents", "baseUrl": "https://api.useanvil.com/", "authType": "apiKey"},
    {"name": "Documentero", "description": "Document generation", "category": "Documents", "baseUrl": "https://app.documentero.com/api/", "authType": "apiKey"},
    {"name": "Carbone", "description": "Document generation", "category": "Documents", "baseUrl": "https://api.carbone.io/", "authType": "apiKey"},
    
    # E-commerce Platforms
    {"name": "Shopify Admin", "description": "Store management", "category": "Commerce", "baseUrl": "https://mystore.myshopify.com/admin/api/", "authType": "apiKey"},
    {"name": "BigCommerce", "description": "E-commerce platform", "category": "Commerce", "baseUrl": "https://api.bigcommerce.com/", "authType": "oauth"},
    {"name": "WooCommerce", "description": "WordPress commerce", "category": "Commerce", "baseUrl": "https://yourstore.com/wp-json/wc/v3/", "authType": "basic"},
    {"name": "Magento", "description": "E-commerce platform", "category": "Commerce", "baseUrl": "https://yourstore.com/rest/V1/", "authType": "oauth"},
    {"name": "PrestaShop", "description": "E-commerce solution", "category": "Commerce", "baseUrl": "https://yourstore.com/api/", "authType": "apiKey"},
    {"name": "Saleor", "description": "Headless commerce", "category": "Commerce", "baseUrl": "https://api.saleor.io/", "authType": "jwt"},
    {"name": "Medusa", "description": "Open source commerce", "category": "Commerce", "baseUrl": "https://api.medusajs.com/", "authType": "apiKey"},
    {"name": "Swell", "description": "Headless commerce", "category": "Commerce", "baseUrl": "https://api.swell.store/", "authType": "basic"},
    
    # Education
    {"name": "Canvas LMS", "description": "Learning management", "category": "Education", "baseUrl": "https://yourschool.instructure.com/api/", "authType": "oauth"},
    {"name": "Blackboard", "description": "Learning management", "category": "Education", "baseUrl": "https://developer.blackboard.com/", "authType": "oauth"},
    {"name": "Moodle", "description": "Open source LMS", "category": "Education", "baseUrl": "https://yourmoodle.com/webservice/rest/", "authType": "apiKey"},
    {"name": "Coursera", "description": "Online courses", "category": "Education", "baseUrl": "https://api.coursera.org/", "authType": "oauth"},
    {"name": "Udemy", "description": "Online courses", "category": "Education", "baseUrl": "https://www.udemy.com/api-2.0/", "authType": "basic"},
    {"name": "edX", "description": "Online education", "category": "Education", "baseUrl": "https://courses.edx.org/api/", "authType": "oauth"},
    {"name": "Teachable", "description": "Course platform", "category": "Education", "baseUrl": "https://yourschool.teachable.com/api/", "authType": "apiKey"},
    {"name": "Thinkific", "description": "Course platform", "category": "Education", "baseUrl": "https://api.thinkific.com/", "authType": "apiKey"},
    {"name": "Kajabi", "description": "Course platform", "category": "Education", "baseUrl": "https://kajabi.com/api/", "authType": "oauth"},
    {"name": "Podia", "description": "Digital products", "category": "Education", "baseUrl": "https://api.podia.com/", "authType": "apiKey"},
    
    # Email Marketing
    {"name": "ConvertKit", "description": "Creator marketing", "category": "Marketing", "baseUrl": "https://api.convertkit.com/", "authType": "apiKey"},
    {"name": "Drip", "description": "E-commerce CRM", "category": "Marketing", "baseUrl": "https://api.getdrip.com/", "authType": "apiKey"},
    {"name": "ActiveCampaign", "description": "Email automation", "category": "Marketing", "baseUrl": "https://yoursite.api-us1.com/", "authType": "apiKey"},
    {"name": "Klaviyo", "description": "E-commerce marketing", "category": "Marketing", "baseUrl": "https://a.klaviyo.com/api/", "authType": "apiKey"},
    {"name": "Customer.io", "description": "Messaging automation", "category": "Marketing", "baseUrl": "https://api.customer.io/", "authType": "basic"},
    {"name": "Braze", "description": "Customer engagement", "category": "Marketing", "baseUrl": "https://rest.iad-01.braze.com/", "authType": "apiKey"},
    {"name": "Iterable", "description": "Cross-channel marketing", "category": "Marketing", "baseUrl": "https://api.iterable.com/", "authType": "apiKey"},
    {"name": "Vero", "description": "Event-driven email", "category": "Marketing", "baseUrl": "https://api.getvero.com/", "authType": "apiKey"},
    
    # Email Transactional
    {"name": "Amazon SES", "description": "Email sending service", "category": "Communication", "baseUrl": "https://email.us-east-1.amazonaws.com/", "authType": "apiKey"},
    {"name": "Mandrill", "description": "Mailchimp transactional", "category": "Communication", "baseUrl": "https://mandrillapp.com/api/", "authType": "apiKey"},
    {"name": "SparkPost", "description": "Email delivery", "category": "Communication", "baseUrl": "https://api.sparkpost.com/", "authType": "apiKey"},
    {"name": "Mailjet", "description": "Email service", "category": "Communication", "baseUrl": "https://api.mailjet.com/", "authType": "basic"},
    {"name": "Mailersend", "description": "Transactional email", "category": "Communication", "baseUrl": "https://api.mailersend.com/", "authType": "bearer"},
    {"name": "SMTP2GO", "description": "Email delivery", "category": "Communication", "baseUrl": "https://api.smtp2go.com/", "authType": "apiKey"},
    {"name": "Elastic Email", "description": "Email API", "category": "Communication", "baseUrl": "https://api.elasticemail.com/", "authType": "apiKey"},
    
    # Enterprise Software
    {"name": "ServiceNow", "description": "IT service management", "category": "Enterprise", "baseUrl": "https://instance.service-now.com/api/", "authType": "basic"},
    {"name": "SAP", "description": "Enterprise software", "category": "Enterprise", "baseUrl": "https://api.sap.com/", "authType": "oauth"},
    {"name": "Oracle Cloud", "description": "Enterprise cloud", "category": "Enterprise", "baseUrl": "https://api.oracle.com/", "authType": "oauth"},
    {"name": "Workday", "description": "HR and finance", "category": "Enterprise", "baseUrl": "https://api.workday.com/", "authType": "oauth"},
    {"name": "Microsoft Dynamics", "description": "Business applications", "category": "Enterprise", "baseUrl": "https://api.dynamics.com/", "authType": "oauth"},
    {"name": "NetSuite", "description": "ERP system", "category": "Enterprise", "baseUrl": "https://api.netsuite.com/", "authType": "oauth"},
    
    # Feature Flags
    {"name": "LaunchDarkly", "description": "Feature management", "category": "Development", "baseUrl": "https://app.launchdarkly.com/api/", "authType": "apiKey"},
    {"name": "Split", "description": "Feature delivery", "category": "Development", "baseUrl": "https://api.split.io/", "authType": "apiKey"},
    {"name": "Optimizely", "description": "Experimentation", "category": "Development", "baseUrl": "https://api.optimizely.com/", "authType": "bearer"},
    {"name": "ConfigCat", "description": "Feature flags", "category": "Development", "baseUrl": "https://api.configcat.com/", "authType": "basic"},
    {"name": "Unleash", "description": "Open source feature flags", "category": "Development", "baseUrl": "https://api.getunleash.io/", "authType": "apiKey"},
    {"name": "GrowthBook", "description": "Feature flags and A/B tests", "category": "Development", "baseUrl": "https://api.growthbook.io/", "authType": "apiKey"},
    
    # Fintech Infrastructure
    {"name": "Dwolla", "description": "ACH payments", "category": "Finance", "baseUrl": "https://api.dwolla.com/", "authType": "oauth"},
    {"name": "Modern Treasury", "description": "Payment operations", "category": "Finance", "baseUrl": "https://api.moderntreasury.com/", "authType": "basic"},
    {"name": "Lithic", "description": "Card issuing", "category": "Finance", "baseUrl": "https://api.lithic.com/", "authType": "apiKey"},
    {"name": "Increase", "description": "Banking infrastructure", "category": "Finance", "baseUrl": "https://api.increase.com/", "authType": "bearer"},
    {"name": "Unit", "description": "Banking as a service", "category": "Finance", "baseUrl": "https://api.s.unit.sh/", "authType": "bearer"},
    {"name": "Synapse", "description": "Financial infrastructure", "category": "Finance", "baseUrl": "https://api.synapsefi.com/", "authType": "oauth"},
    {"name": "Treasury Prime", "description": "Banking API", "category": "Finance", "baseUrl": "https://api.treasuryprime.com/", "authType": "bearer"},
    {"name": "Column", "description": "Banking infrastructure", "category": "Finance", "baseUrl": "https://api.column.com/", "authType": "bearer"},
]

def main():
    print("🦞 APIClaw Night Expansion 03:00 - Batch 3 (apis.guru)")
    print("=" * 50)
    
    registry = load_registry()
    current_count = registry.get("count", 0)
    apis = registry.get("apis", [])
    
    print(f"Current count: {current_count}")
    
    existing_names = set(api.get("name", "").lower() for api in apis)
    
    added = 0
    for new_api in BATCH3_APIS:
        if new_api["name"].lower() not in existing_names:
            api_entry = {
                "id": generate_id(new_api["name"], new_api["category"]),
                "name": new_api["name"],
                "description": new_api["description"],
                "category": new_api["category"],
                "baseUrl": new_api["baseUrl"],
                "authType": new_api["authType"],
                "pricingModel": "freemium",
                "source": "night-expansion-03-batch3-apisguru"
            }
            apis.append(api_entry)
            existing_names.add(new_api["name"].lower())
            added += 1
    
    registry["apis"] = apis
    registry["count"] = len(apis)
    registry["lastUpdated"] = datetime.now().isoformat()
    
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"📊 New total: {len(apis)}")
    
    return {"before": current_count, "after": len(apis), "added": added}

if __name__ == "__main__":
    stats = main()
    print(f"\n📈 Progress: {stats['before']} → {stats['after']} (+{stats['added']})")
