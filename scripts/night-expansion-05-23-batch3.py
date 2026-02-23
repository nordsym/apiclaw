#!/usr/bin/env python3
"""
APIClaw Night Expansion - 05:00 Feb 23, 2026 - Batch 3
Government, Environment, Social APIs
"""

import json
import re
from pathlib import Path
from datetime import datetime

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

NEW_APIS = [
    # Government & Public Data (50)
    {"name": "Data.gov", "desc": "US open government data", "category": "Government", "url": "https://data.gov"},
    {"name": "UK Data Gov", "desc": "UK government data", "category": "Government", "url": "https://data.gov.uk"},
    {"name": "EU Open Data", "desc": "European open data", "category": "Government", "url": "https://data.europa.eu"},
    {"name": "SCB Sweden", "desc": "Statistics Sweden API", "category": "Government", "url": "https://scb.se"},
    {"name": "Bolagsverket", "desc": "Swedish Companies Registration", "category": "Government", "url": "https://bolagsverket.se"},
    {"name": "Skatteverket", "desc": "Swedish Tax Agency", "category": "Government", "url": "https://skatteverket.se"},
    {"name": "Trafikverket", "desc": "Swedish Transport Administration", "category": "Government", "url": "https://trafikverket.se"},
    {"name": "SMHI", "desc": "Swedish weather data", "category": "Government", "url": "https://smhi.se"},
    {"name": "Riksbanken", "desc": "Swedish central bank", "category": "Government", "url": "https://riksbank.se"},
    {"name": "Lantmäteriet", "desc": "Swedish land survey", "category": "Government", "url": "https://lantmateriet.se"},
    {"name": "Dataportal.se", "desc": "Swedish open data", "category": "Government", "url": "https://dataportal.se"},
    {"name": "Census Bureau", "desc": "US Census data", "category": "Government", "url": "https://census.gov"},
    {"name": "BLS", "desc": "Bureau of Labor Statistics", "category": "Government", "url": "https://bls.gov"},
    {"name": "SEC EDGAR", "desc": "SEC filings", "category": "Government", "url": "https://sec.gov/edgar"},
    {"name": "FRED", "desc": "Federal Reserve data", "category": "Government", "url": "https://fred.stlouisfed.org"},
    {"name": "IRS", "desc": "US tax data", "category": "Government", "url": "https://irs.gov"},
    {"name": "USPTO", "desc": "US Patent Office", "category": "Government", "url": "https://uspto.gov"},
    {"name": "NASA", "desc": "Space and science data", "category": "Government", "url": "https://api.nasa.gov"},
    {"name": "NOAA", "desc": "Weather and climate", "category": "Government", "url": "https://noaa.gov"},
    {"name": "EPA", "desc": "Environmental data", "category": "Government", "url": "https://epa.gov"},
    {"name": "USGS", "desc": "Geological survey", "category": "Government", "url": "https://usgs.gov"},
    {"name": "CDC", "desc": "Health data", "category": "Government", "url": "https://cdc.gov"},
    {"name": "WHO", "desc": "World Health Organization", "category": "Government", "url": "https://who.int"},
    {"name": "World Bank", "desc": "Global development data", "category": "Government", "url": "https://worldbank.org"},
    {"name": "IMF", "desc": "International Monetary Fund", "category": "Government", "url": "https://imf.org"},
    {"name": "UN Data", "desc": "United Nations data", "category": "Government", "url": "https://data.un.org"},
    {"name": "OECD", "desc": "Economic data", "category": "Government", "url": "https://oecd.org"},
    {"name": "Eurostat", "desc": "European statistics", "category": "Government", "url": "https://ec.europa.eu/eurostat"},
    {"name": "UK Companies House", "desc": "UK company data", "category": "Government", "url": "https://companieshouse.gov.uk"},
    {"name": "OpenCorporates", "desc": "Global company data", "category": "Government", "url": "https://opencorporates.com"},
    {"name": "GovTrack", "desc": "US Congress tracking", "category": "Government", "url": "https://govtrack.us"},
    {"name": "OpenSecrets", "desc": "Money in politics", "category": "Government", "url": "https://opensecrets.org"},
    {"name": "ProPublica", "desc": "Public data", "category": "Government", "url": "https://propublica.org"},
    {"name": "Data Commons", "desc": "Google public data", "category": "Government", "url": "https://datacommons.org"},
    {"name": "Gapminder", "desc": "Global statistics", "category": "Government", "url": "https://gapminder.org"},
    {"name": "Our World in Data", "desc": "Global research", "category": "Government", "url": "https://ourworldindata.org"},
    {"name": "Open Data Soft", "desc": "Data platform", "category": "Government", "url": "https://opendatasoft.com"},
    {"name": "Socrata", "desc": "Government data platform", "category": "Government", "url": "https://socrata.com"},
    {"name": "CKAN", "desc": "Data portal platform", "category": "Government", "url": "https://ckan.org"},
    {"name": "Enigma", "desc": "Public data", "category": "Government", "url": "https://enigma.com"},
    {"name": "Crunchbase", "desc": "Company data", "category": "Government", "url": "https://crunchbase.com"},
    {"name": "PitchBook", "desc": "Private market data", "category": "Government", "url": "https://pitchbook.com"},
    {"name": "CB Insights", "desc": "Business analytics", "category": "Government", "url": "https://cbinsights.com"},
    {"name": "Dealroom", "desc": "Startup data", "category": "Government", "url": "https://dealroom.co"},
    {"name": "Tracxn", "desc": "Startup data", "category": "Government", "url": "https://tracxn.com"},
    {"name": "Owler", "desc": "Company insights", "category": "Government", "url": "https://owler.com"},
    {"name": "SimilarWeb", "desc": "Web traffic data", "category": "Government", "url": "https://similarweb.com"},
    {"name": "Alexa", "desc": "Web analytics", "category": "Government", "url": "https://alexa.com"},
    {"name": "BuiltWith", "desc": "Technology lookup", "category": "Government", "url": "https://builtwith.com"},
    {"name": "Wappalyzer", "desc": "Technology profiler", "category": "Government", "url": "https://wappalyzer.com"},

    # Environment & Sustainability (40)
    {"name": "OpenWeatherMap", "desc": "Weather API", "category": "Environment", "url": "https://openweathermap.org"},
    {"name": "Weather API", "desc": "Weather data", "category": "Environment", "url": "https://weatherapi.com"},
    {"name": "Tomorrow.io", "desc": "Weather intelligence", "category": "Environment", "url": "https://tomorrow.io"},
    {"name": "Climacell", "desc": "Weather API", "category": "Environment", "url": "https://climacell.co"},
    {"name": "Visual Crossing", "desc": "Weather data", "category": "Environment", "url": "https://visualcrossing.com"},
    {"name": "Stormglass", "desc": "Marine weather", "category": "Environment", "url": "https://stormglass.io"},
    {"name": "Open Meteo", "desc": "Free weather API", "category": "Environment", "url": "https://open-meteo.com"},
    {"name": "Aeris Weather", "desc": "Weather data", "category": "Environment", "url": "https://aerisweather.com"},
    {"name": "Weatherbit", "desc": "Weather API", "category": "Environment", "url": "https://weatherbit.io"},
    {"name": "IQAir", "desc": "Air quality", "category": "Environment", "url": "https://iqair.com"},
    {"name": "BreezoMeter", "desc": "Air quality API", "category": "Environment", "url": "https://breezometer.com"},
    {"name": "OpenAQ", "desc": "Air quality data", "category": "Environment", "url": "https://openaq.org"},
    {"name": "AQICN", "desc": "World air quality", "category": "Environment", "url": "https://aqicn.org"},
    {"name": "PurpleAir", "desc": "Air quality sensors", "category": "Environment", "url": "https://purpleair.com"},
    {"name": "Airnow", "desc": "US air quality", "category": "Environment", "url": "https://airnow.gov"},
    {"name": "Earthquake USGS", "desc": "Earthquake data", "category": "Environment", "url": "https://earthquake.usgs.gov"},
    {"name": "Volcano USGS", "desc": "Volcano data", "category": "Environment", "url": "https://volcanoes.usgs.gov"},
    {"name": "Global Forest Watch", "desc": "Forest monitoring", "category": "Environment", "url": "https://globalforestwatch.org"},
    {"name": "Ocean Data", "desc": "Marine data", "category": "Environment", "url": "https://ioc.unesco.org"},
    {"name": "Copernicus", "desc": "Earth observation", "category": "Environment", "url": "https://copernicus.eu"},
    {"name": "Sentinel Hub", "desc": "Satellite imagery", "category": "Environment", "url": "https://sentinel-hub.com"},
    {"name": "Planet", "desc": "Satellite data", "category": "Environment", "url": "https://planet.com"},
    {"name": "Maxar", "desc": "Earth intelligence", "category": "Environment", "url": "https://maxar.com"},
    {"name": "Nearmap", "desc": "Aerial imagery", "category": "Environment", "url": "https://nearmap.com"},
    {"name": "EarthExplorer", "desc": "USGS imagery", "category": "Environment", "url": "https://earthexplorer.usgs.gov"},
    {"name": "Climate Trace", "desc": "Emissions tracking", "category": "Environment", "url": "https://climatetrace.org"},
    {"name": "Carbon Interface", "desc": "Carbon API", "category": "Environment", "url": "https://carboninterface.com"},
    {"name": "Climatiq", "desc": "Carbon footprint", "category": "Environment", "url": "https://climatiq.io"},
    {"name": "Watershed", "desc": "Climate platform", "category": "Environment", "url": "https://watershed.com"},
    {"name": "Persefoni", "desc": "Carbon accounting", "category": "Environment", "url": "https://persefoni.com"},
    {"name": "Greenly", "desc": "Carbon management", "category": "Environment", "url": "https://greenly.earth"},
    {"name": "Normative", "desc": "Carbon accounting", "category": "Environment", "url": "https://normative.io"},
    {"name": "Plan A", "desc": "Sustainability platform", "category": "Environment", "url": "https://plana.earth"},
    {"name": "Sinai", "desc": "Decarbonization", "category": "Environment", "url": "https://sinai.com"},
    {"name": "Patch", "desc": "Carbon removal", "category": "Environment", "url": "https://patch.io"},
    {"name": "Cloverly", "desc": "Carbon offsets API", "category": "Environment", "url": "https://cloverly.com"},
    {"name": "Wren", "desc": "Climate action", "category": "Environment", "url": "https://wren.co"},
    {"name": "Pachama", "desc": "Forest carbon", "category": "Environment", "url": "https://pachama.com"},
    {"name": "NCX", "desc": "Natural carbon", "category": "Environment", "url": "https://ncx.com"},
    {"name": "Nori", "desc": "Carbon removal marketplace", "category": "Environment", "url": "https://nori.com"},

    # Social Platforms (40)
    {"name": "Twitter API", "desc": "Twitter/X platform", "category": "Social", "url": "https://developer.twitter.com"},
    {"name": "Facebook Graph", "desc": "Facebook API", "category": "Social", "url": "https://developers.facebook.com"},
    {"name": "Instagram Graph", "desc": "Instagram API", "category": "Social", "url": "https://developers.facebook.com/docs/instagram"},
    {"name": "LinkedIn Marketing", "desc": "LinkedIn API", "category": "Social", "url": "https://developer.linkedin.com"},
    {"name": "YouTube Data", "desc": "YouTube API", "category": "Social", "url": "https://developers.google.com/youtube"},
    {"name": "TikTok", "desc": "TikTok API", "category": "Social", "url": "https://developers.tiktok.com"},
    {"name": "Pinterest", "desc": "Pinterest API", "category": "Social", "url": "https://developers.pinterest.com"},
    {"name": "Snapchat", "desc": "Snapchat API", "category": "Social", "url": "https://developers.snap.com"},
    {"name": "Reddit", "desc": "Reddit API", "category": "Social", "url": "https://reddit.com/dev/api"},
    {"name": "Telegram Bot", "desc": "Telegram API", "category": "Social", "url": "https://core.telegram.org/bots"},
    {"name": "WhatsApp Business", "desc": "WhatsApp API", "category": "Social", "url": "https://business.whatsapp.com"},
    {"name": "Signal", "desc": "Signal messaging", "category": "Social", "url": "https://signal.org"},
    {"name": "Mastodon", "desc": "Mastodon API", "category": "Social", "url": "https://docs.joinmastodon.org"},
    {"name": "Bluesky", "desc": "Bluesky/AT Protocol", "category": "Social", "url": "https://blueskyweb.xyz"},
    {"name": "Threads", "desc": "Threads API", "category": "Social", "url": "https://threads.net"},
    {"name": "WeChat", "desc": "WeChat API", "category": "Social", "url": "https://developers.weixin.qq.com"},
    {"name": "Line", "desc": "Line messaging", "category": "Social", "url": "https://developers.line.biz"},
    {"name": "Viber", "desc": "Viber API", "category": "Social", "url": "https://developers.viber.com"},
    {"name": "Kik", "desc": "Kik API", "category": "Social", "url": "https://dev.kik.com"},
    {"name": "Clubhouse", "desc": "Audio social", "category": "Social", "url": "https://clubhouse.com"},
    {"name": "Tumblr", "desc": "Tumblr API", "category": "Social", "url": "https://tumblr.com/developers"},
    {"name": "Flickr", "desc": "Photo sharing", "category": "Social", "url": "https://flickr.com/services/api"},
    {"name": "500px", "desc": "Photography community", "category": "Social", "url": "https://500px.com"},
    {"name": "Unsplash", "desc": "Photo library", "category": "Social", "url": "https://unsplash.com/developers"},
    {"name": "Pexels", "desc": "Stock photos", "category": "Social", "url": "https://pexels.com/api"},
    {"name": "Pixabay", "desc": "Free images", "category": "Social", "url": "https://pixabay.com/api"},
    {"name": "Giphy", "desc": "GIF platform", "category": "Social", "url": "https://developers.giphy.com"},
    {"name": "Tenor", "desc": "GIF search", "category": "Social", "url": "https://tenor.com/gifapi"},
    {"name": "Imgur", "desc": "Image hosting", "category": "Social", "url": "https://apidocs.imgur.com"},
    {"name": "Vimeo", "desc": "Video platform", "category": "Social", "url": "https://developer.vimeo.com"},
    {"name": "Dailymotion", "desc": "Video platform", "category": "Social", "url": "https://developer.dailymotion.com"},
    {"name": "Twitch", "desc": "Streaming platform", "category": "Social", "url": "https://dev.twitch.tv"},
    {"name": "Mixcloud", "desc": "Audio streaming", "category": "Social", "url": "https://mixcloud.com"},
    {"name": "Anchor", "desc": "Podcast platform", "category": "Social", "url": "https://anchor.fm"},
    {"name": "Spotify for Podcasters", "desc": "Podcast hosting", "category": "Social", "url": "https://podcasters.spotify.com"},
    {"name": "Apple Podcasts", "desc": "Podcast platform", "category": "Social", "url": "https://podcasts.apple.com"},
    {"name": "Goodreads", "desc": "Book social", "category": "Social", "url": "https://goodreads.com/api"},
    {"name": "Libib", "desc": "Book cataloging", "category": "Social", "url": "https://libib.com"},
    {"name": "Open Library", "desc": "Book database", "category": "Social", "url": "https://openlibrary.org"},
    {"name": "Google Books", "desc": "Book search", "category": "Social", "url": "https://developers.google.com/books"},

    # HR & Recruiting (40)
    {"name": "Greenhouse", "desc": "Recruiting platform", "category": "HR", "url": "https://greenhouse.io"},
    {"name": "Lever", "desc": "Recruiting software", "category": "HR", "url": "https://lever.co"},
    {"name": "Ashby", "desc": "Recruiting platform", "category": "HR", "url": "https://ashbyhq.com"},
    {"name": "Workable", "desc": "Recruiting software", "category": "HR", "url": "https://workable.com"},
    {"name": "JazzHR", "desc": "Recruiting software", "category": "HR", "url": "https://jazzhr.com"},
    {"name": "Breezy HR", "desc": "Recruiting platform", "category": "HR", "url": "https://breezy.hr"},
    {"name": "SmartRecruiters", "desc": "Talent acquisition", "category": "HR", "url": "https://smartrecruiters.com"},
    {"name": "iCIMS", "desc": "Talent platform", "category": "HR", "url": "https://icims.com"},
    {"name": "Workday", "desc": "HR platform", "category": "HR", "url": "https://workday.com"},
    {"name": "BambooHR", "desc": "HR software", "category": "HR", "url": "https://bamboohr.com"},
    {"name": "Namely", "desc": "HR platform", "category": "HR", "url": "https://namely.com"},
    {"name": "Lattice", "desc": "People management", "category": "HR", "url": "https://lattice.com"},
    {"name": "Culture Amp", "desc": "Employee experience", "category": "HR", "url": "https://cultureamp.com"},
    {"name": "15Five", "desc": "Performance management", "category": "HR", "url": "https://15five.com"},
    {"name": "Betterworks", "desc": "Performance management", "category": "HR", "url": "https://betterworks.com"},
    {"name": "Leapsome", "desc": "People enablement", "category": "HR", "url": "https://leapsome.com"},
    {"name": "Small Improvements", "desc": "Performance feedback", "category": "HR", "url": "https://small-improvements.com"},
    {"name": "Peakon", "desc": "Employee engagement", "category": "HR", "url": "https://peakon.com"},
    {"name": "Officevibe", "desc": "Employee engagement", "category": "HR", "url": "https://officevibe.com"},
    {"name": "TINYpulse", "desc": "Employee feedback", "category": "HR", "url": "https://tinypulse.com"},
    {"name": "HireVue", "desc": "Video interviewing", "category": "HR", "url": "https://hirevue.com"},
    {"name": "Spark Hire", "desc": "Video interviews", "category": "HR", "url": "https://sparkhire.com"},
    {"name": "Interviewing.io", "desc": "Technical interviews", "category": "HR", "url": "https://interviewing.io"},
    {"name": "Karat", "desc": "Technical interviews", "category": "HR", "url": "https://karat.com"},
    {"name": "Codility", "desc": "Tech assessment", "category": "HR", "url": "https://codility.com"},
    {"name": "HackerRank", "desc": "Tech screening", "category": "HR", "url": "https://hackerrank.com"},
    {"name": "CodeSignal", "desc": "Tech assessment", "category": "HR", "url": "https://codesignal.com"},
    {"name": "LeetCode", "desc": "Coding practice", "category": "HR", "url": "https://leetcode.com"},
    {"name": "CoderPad", "desc": "Technical interviews", "category": "HR", "url": "https://coderpad.io"},
    {"name": "TestGorilla", "desc": "Pre-employment tests", "category": "HR", "url": "https://testgorilla.com"},
    {"name": "Criteria", "desc": "Pre-employment testing", "category": "HR", "url": "https://criteriacorp.com"},
    {"name": "Vervoe", "desc": "AI hiring", "category": "HR", "url": "https://vervoe.com"},
    {"name": "Eightfold", "desc": "Talent intelligence", "category": "HR", "url": "https://eightfold.ai"},
    {"name": "Beamery", "desc": "Talent lifecycle", "category": "HR", "url": "https://beamery.com"},
    {"name": "Phenom", "desc": "Talent experience", "category": "HR", "url": "https://phenom.com"},
    {"name": "Jobvite", "desc": "Talent acquisition", "category": "HR", "url": "https://jobvite.com"},
    {"name": "Recruitee", "desc": "Hiring platform", "category": "HR", "url": "https://recruitee.com"},
    {"name": "Teamtailor", "desc": "Employer branding", "category": "HR", "url": "https://teamtailor.com"},
    {"name": "Personio", "desc": "HR software", "category": "HR", "url": "https://personio.com"},
    {"name": "Factorial", "desc": "HR software", "category": "HR", "url": "https://factorialhr.com"},

    # Customer Support (30)
    {"name": "Zendesk", "desc": "Customer service", "category": "Support", "url": "https://zendesk.com"},
    {"name": "Freshdesk", "desc": "Help desk", "category": "Support", "url": "https://freshdesk.com"},
    {"name": "Intercom", "desc": "Customer messaging", "category": "Support", "url": "https://intercom.com"},
    {"name": "HubSpot Service", "desc": "Service hub", "category": "Support", "url": "https://hubspot.com/service"},
    {"name": "Salesforce Service", "desc": "Service cloud", "category": "Support", "url": "https://salesforce.com/service-cloud"},
    {"name": "Help Scout", "desc": "Help desk", "category": "Support", "url": "https://helpscout.com"},
    {"name": "Front", "desc": "Customer operations", "category": "Support", "url": "https://front.com"},
    {"name": "Crisp", "desc": "Customer messaging", "category": "Support", "url": "https://crisp.chat"},
    {"name": "Drift", "desc": "Conversational marketing", "category": "Support", "url": "https://drift.com"},
    {"name": "Tidio", "desc": "Live chat", "category": "Support", "url": "https://tidio.com"},
    {"name": "LiveChat", "desc": "Live chat software", "category": "Support", "url": "https://livechat.com"},
    {"name": "Olark", "desc": "Live chat", "category": "Support", "url": "https://olark.com"},
    {"name": "Tawk.to", "desc": "Free live chat", "category": "Support", "url": "https://tawk.to"},
    {"name": "Gorgias", "desc": "E-commerce support", "category": "Support", "url": "https://gorgias.com"},
    {"name": "Gladly", "desc": "Customer service", "category": "Support", "url": "https://gladly.com"},
    {"name": "Kustomer", "desc": "CRM for support", "category": "Support", "url": "https://kustomer.com"},
    {"name": "Dixa", "desc": "Customer service", "category": "Support", "url": "https://dixa.com"},
    {"name": "Kayako", "desc": "Help desk", "category": "Support", "url": "https://kayako.com"},
    {"name": "Zoho Desk", "desc": "Help desk", "category": "Support", "url": "https://zoho.com/desk"},
    {"name": "ServiceNow", "desc": "IT service", "category": "Support", "url": "https://servicenow.com"},
    {"name": "Jira Service", "desc": "Service management", "category": "Support", "url": "https://atlassian.com/software/jira/service-management"},
    {"name": "Pylon", "desc": "B2B support", "category": "Support", "url": "https://usepylon.com"},
    {"name": "Plain", "desc": "Support platform", "category": "Support", "url": "https://plain.com"},
    {"name": "Papercups", "desc": "Open source chat", "category": "Support", "url": "https://papercups.io"},
    {"name": "Chatwoot", "desc": "Open source support", "category": "Support", "url": "https://chatwoot.com"},
    {"name": "Botpress", "desc": "Chatbot platform", "category": "Support", "url": "https://botpress.com"},
    {"name": "Rasa", "desc": "Conversational AI", "category": "Support", "url": "https://rasa.com"},
    {"name": "Dialogflow", "desc": "Google chatbot", "category": "Support", "url": "https://cloud.google.com/dialogflow"},
    {"name": "Amazon Lex", "desc": "AWS chatbot", "category": "Support", "url": "https://aws.amazon.com/lex"},
    {"name": "Watson Assistant", "desc": "IBM chatbot", "category": "Support", "url": "https://ibm.com/watson/assistant"},

    # Shipping & Logistics (30)
    {"name": "Shippo", "desc": "Shipping API", "category": "Logistics", "url": "https://goshippo.com"},
    {"name": "EasyPost", "desc": "Shipping API", "category": "Logistics", "url": "https://easypost.com"},
    {"name": "ShipEngine", "desc": "Shipping platform", "category": "Logistics", "url": "https://shipengine.com"},
    {"name": "Shipstation", "desc": "Shipping software", "category": "Logistics", "url": "https://shipstation.com"},
    {"name": "Pirate Ship", "desc": "Shipping discounts", "category": "Logistics", "url": "https://pirateship.com"},
    {"name": "Stamps.com", "desc": "Postage online", "category": "Logistics", "url": "https://stamps.com"},
    {"name": "Endicia", "desc": "Shipping software", "category": "Logistics", "url": "https://endicia.com"},
    {"name": "AfterShip", "desc": "Shipment tracking", "category": "Logistics", "url": "https://aftership.com"},
    {"name": "Track17", "desc": "Package tracking", "category": "Logistics", "url": "https://17track.net"},
    {"name": "Parcel Monitor", "desc": "Delivery tracking", "category": "Logistics", "url": "https://parcelmonitor.com"},
    {"name": "Ship24", "desc": "Tracking API", "category": "Logistics", "url": "https://ship24.com"},
    {"name": "Trackingmore", "desc": "Shipment tracking", "category": "Logistics", "url": "https://trackingmore.com"},
    {"name": "UPS", "desc": "UPS shipping", "category": "Logistics", "url": "https://ups.com"},
    {"name": "FedEx", "desc": "FedEx shipping", "category": "Logistics", "url": "https://fedex.com"},
    {"name": "USPS", "desc": "US Postal Service", "category": "Logistics", "url": "https://usps.com"},
    {"name": "DHL", "desc": "DHL shipping", "category": "Logistics", "url": "https://dhl.com"},
    {"name": "PostNord", "desc": "Nordic shipping", "category": "Logistics", "url": "https://postnord.com"},
    {"name": "DB Schenker", "desc": "Global logistics", "category": "Logistics", "url": "https://dbschenker.com"},
    {"name": "Flexport", "desc": "Freight forwarding", "category": "Logistics", "url": "https://flexport.com"},
    {"name": "Freightos", "desc": "Freight marketplace", "category": "Logistics", "url": "https://freightos.com"},
    {"name": "Project44", "desc": "Supply chain visibility", "category": "Logistics", "url": "https://project44.com"},
    {"name": "FourKites", "desc": "Supply chain visibility", "category": "Logistics", "url": "https://fourkites.com"},
    {"name": "Transporeon", "desc": "Logistics platform", "category": "Logistics", "url": "https://transporeon.com"},
    {"name": "Convoy", "desc": "Trucking network", "category": "Logistics", "url": "https://convoy.com"},
    {"name": "Uber Freight", "desc": "Freight matching", "category": "Logistics", "url": "https://uberfreight.com"},
    {"name": "Shipwell", "desc": "Shipping management", "category": "Logistics", "url": "https://shipwell.com"},
    {"name": "Stord", "desc": "Fulfillment platform", "category": "Logistics", "url": "https://stord.com"},
    {"name": "ShipBob", "desc": "E-commerce fulfillment", "category": "Logistics", "url": "https://shipbob.com"},
    {"name": "Deliverr", "desc": "Fast fulfillment", "category": "Logistics", "url": "https://deliverr.com"},
    {"name": "Shopify Fulfillment", "desc": "Fulfillment network", "category": "Logistics", "url": "https://shopify.com/fulfillment"},

    # Manufacturing & Supply Chain (30)
    {"name": "SAP", "desc": "Enterprise software", "category": "Manufacturing", "url": "https://sap.com"},
    {"name": "Oracle ERP", "desc": "Enterprise resource", "category": "Manufacturing", "url": "https://oracle.com/erp"},
    {"name": "Microsoft Dynamics", "desc": "Business applications", "category": "Manufacturing", "url": "https://dynamics.microsoft.com"},
    {"name": "Infor", "desc": "Industry cloud", "category": "Manufacturing", "url": "https://infor.com"},
    {"name": "Epicor", "desc": "Manufacturing ERP", "category": "Manufacturing", "url": "https://epicor.com"},
    {"name": "SYSPRO", "desc": "ERP software", "category": "Manufacturing", "url": "https://syspro.com"},
    {"name": "Plex", "desc": "Smart manufacturing", "category": "Manufacturing", "url": "https://plex.com"},
    {"name": "Arena", "desc": "PLM software", "category": "Manufacturing", "url": "https://arenasolutions.com"},
    {"name": "Onshape", "desc": "Cloud CAD", "category": "Manufacturing", "url": "https://onshape.com"},
    {"name": "Fusion 360", "desc": "CAD/CAM/CAE", "category": "Manufacturing", "url": "https://autodesk.com/products/fusion-360"},
    {"name": "SolidWorks", "desc": "3D CAD", "category": "Manufacturing", "url": "https://solidworks.com"},
    {"name": "Inventor", "desc": "3D CAD software", "category": "Manufacturing", "url": "https://autodesk.com/products/inventor"},
    {"name": "PTC Creo", "desc": "CAD software", "category": "Manufacturing", "url": "https://ptc.com/creo"},
    {"name": "Siemens NX", "desc": "Product engineering", "category": "Manufacturing", "url": "https://siemens.com/nx"},
    {"name": "CATIA", "desc": "3D design", "category": "Manufacturing", "url": "https://3ds.com/catia"},
    {"name": "Tulip", "desc": "Frontline operations", "category": "Manufacturing", "url": "https://tulip.co"},
    {"name": "MachineMetrics", "desc": "Manufacturing analytics", "category": "Manufacturing", "url": "https://machinemetrics.com"},
    {"name": "Sight Machine", "desc": "Manufacturing AI", "category": "Manufacturing", "url": "https://sightmachine.com"},
    {"name": "Fiix", "desc": "CMMS software", "category": "Manufacturing", "url": "https://fiixsoftware.com"},
    {"name": "UpKeep", "desc": "Maintenance management", "category": "Manufacturing", "url": "https://upkeep.com"},
    {"name": "Limble", "desc": "CMMS software", "category": "Manufacturing", "url": "https://limblecmms.com"},
    {"name": "Coupa", "desc": "Supply chain", "category": "Manufacturing", "url": "https://coupa.com"},
    {"name": "Jaggaer", "desc": "Procurement", "category": "Manufacturing", "url": "https://jaggaer.com"},
    {"name": "GEP", "desc": "Procurement software", "category": "Manufacturing", "url": "https://gep.com"},
    {"name": "Ivalua", "desc": "Spend management", "category": "Manufacturing", "url": "https://ivalua.com"},
    {"name": "Kinaxis", "desc": "Supply chain planning", "category": "Manufacturing", "url": "https://kinaxis.com"},
    {"name": "o9 Solutions", "desc": "AI planning", "category": "Manufacturing", "url": "https://o9solutions.com"},
    {"name": "Blue Yonder", "desc": "Supply chain", "category": "Manufacturing", "url": "https://blueyonder.com"},
    {"name": "E2open", "desc": "Supply chain", "category": "Manufacturing", "url": "https://e2open.com"},
    {"name": "Manhattan Associates", "desc": "Supply chain", "category": "Manufacturing", "url": "https://manh.com"},

    # Insurance & Risk (20)
    {"name": "Lemonade", "desc": "Insurance platform", "category": "Insurance", "url": "https://lemonade.com"},
    {"name": "Root", "desc": "Car insurance", "category": "Insurance", "url": "https://root.com"},
    {"name": "Hippo", "desc": "Home insurance", "category": "Insurance", "url": "https://hippo.com"},
    {"name": "Next Insurance", "desc": "Business insurance", "category": "Insurance", "url": "https://nextinsurance.com"},
    {"name": "Pie Insurance", "desc": "Workers comp", "category": "Insurance", "url": "https://pieinsurance.com"},
    {"name": "Vouch", "desc": "Startup insurance", "category": "Insurance", "url": "https://vouch.us"},
    {"name": "Embroker", "desc": "Business insurance", "category": "Insurance", "url": "https://embroker.com"},
    {"name": "Coalition", "desc": "Cyber insurance", "category": "Insurance", "url": "https://coalitioninc.com"},
    {"name": "At-Bay", "desc": "Cyber insurance", "category": "Insurance", "url": "https://at-bay.com"},
    {"name": "Cowbell Cyber", "desc": "Cyber insurance", "category": "Insurance", "url": "https://cowbell.insure"},
    {"name": "Clearcover", "desc": "Auto insurance", "category": "Insurance", "url": "https://clearcover.com"},
    {"name": "Metromile", "desc": "Pay-per-mile", "category": "Insurance", "url": "https://metromile.com"},
    {"name": "Safely", "desc": "Vacation rental insurance", "category": "Insurance", "url": "https://safely.com"},
    {"name": "Jetty", "desc": "Renters insurance", "category": "Insurance", "url": "https://jetty.com"},
    {"name": "Socotra", "desc": "Insurance platform", "category": "Insurance", "url": "https://socotra.com"},
    {"name": "Majesco", "desc": "Insurance software", "category": "Insurance", "url": "https://majesco.com"},
    {"name": "Guidewire", "desc": "Insurance platform", "category": "Insurance", "url": "https://guidewire.com"},
    {"name": "Duck Creek", "desc": "Insurance solutions", "category": "Insurance", "url": "https://duckcreek.com"},
    {"name": "Verisk", "desc": "Risk analytics", "category": "Insurance", "url": "https://verisk.com"},
    {"name": "LexisNexis Risk", "desc": "Risk data", "category": "Insurance", "url": "https://risk.lexisnexis.com"},
]

def main():
    print("🦞 APIClaw Night Expansion - Batch 3")
    print("=" * 50)
    
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    
    print(f"Current APIs: {len(registry['apis'])}")
    
    added = 0
    for api in NEW_APIS:
        api_id = generate_id(api['name'])
        
        if api_id in existing_ids:
            continue
        
        new_api = {
            "id": api_id,
            "name": api['name'],
            "description": api['desc'],
            "category": api['category'],
            "authType": "apiKey",
            "baseUrl": api['url'],
            "docsUrl": api['url'],
            "addedAt": datetime.now().isoformat()
        }
        
        registry['apis'].append(new_api)
        existing_ids.add(api_id)
        added += 1
    
    save_registry(registry)
    
    print(f"Added: +{added} APIs")
    print(f"Total: {len(registry['apis'])}")
    
    return added

if __name__ == "__main__":
    main()
