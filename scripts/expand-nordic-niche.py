#!/usr/bin/env python3
"""
APIClaw Expansion: Nordic APIs + Niche/Hard-to-find APIs
"""
import json
import re
from pathlib import Path

registry_path = Path(__file__).parent.parent / 'src/registry/apis.json'

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
    if api_id in existing_ids: return False
    if link.lower().rstrip('/') in existing_links: return False
    if name.lower() in existing_names: return False
    
    keywords = [category.lower()]
    if any(k in desc.lower() for k in ['sweden', 'swedish', 'nordic', 'denmark', 'norway', 'finland']):
        keywords.append('nordic')
    
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
        'source': 'nordic-niche'
    })
    existing_ids.add(api_id)
    existing_links.add(link.lower().rstrip('/'))
    existing_names.add(name.lower())
    return True

added = 0

# Swedish APIs
swedish_apis = [
    ("Bankgirot", "Swedish payment clearing system API", "Finance", "https://www.bankgirot.se/tjanster-produkter/api/"),
    ("Plusgiro", "Swedish postal giro payment system", "Finance", "https://www.plusgirot.se/"),
    ("Swish Merchant", "Swedish instant mobile payments for businesses", "Finance", "https://developer.swish.nu/"),
    ("Zettle", "Point of sale and payments (PayPal owned)", "Finance", "https://developer.zettle.com/"),
    ("Bokio", "Swedish accounting software API", "Finance", "https://www.bokio.se/integrations/"),
    ("Fortnox", "Swedish business software API", "Business", "https://developer.fortnox.se/"),
    ("Visma", "Nordic business software suite APIs", "Business", "https://developer.visma.com/"),
    ("PE Accounting", "Swedish accounting API", "Finance", "https://docs.accounting.pe/"),
    ("Trafikverket Open API", "Swedish transport administration data", "Transportation", "https://api.trafikinfo.trafikverket.se/"),
    ("SL API", "Stockholm public transport realtime data", "Transportation", "https://www.trafiklab.se/api/sl-realtidsinformation-4"),
    ("Resrobot", "Swedish public transport journey planner", "Transportation", "https://www.trafiklab.se/api/resrobot-reseplanerare"),
    ("GTFS Regional", "Swedish regional GTFS transport data", "Transportation", "https://www.trafiklab.se/api/gtfs-regional"),
    ("Samtrafiken", "Swedish public transport data hub", "Transportation", "https://www.samtrafiken.se/"),
    ("SCB", "Statistics Sweden open data API", "Data", "https://www.scb.se/vara-tjanster/oppna-data/"),
    ("SMHI Open Data", "Swedish meteorological and hydrological data", "Weather", "https://opendata.smhi.se/apidocs/"),
    ("Lantmäteriet", "Swedish mapping and cadastral data", "Maps", "https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/"),
    ("Skatteverket", "Swedish tax authority APIs", "Government", "https://skatteverket.se/foretag/etjanster/"),
    ("Bolagsverket", "Swedish companies registration office", "Business", "https://bolagsverket.se/apiary/"),
    ("PRV", "Swedish Patent and Registration Office", "Business", "https://www.prv.se/sv/"),
    ("Riksarkivet", "Swedish National Archives API", "Data", "https://riksarkivet.se/oppna-data"),
    ("Swedish Parliament", "Riksdagen open data", "Government", "https://data.riksdagen.se/"),
    ("1177 Vårdguiden", "Swedish healthcare guide data", "Health", "https://www.1177.se/"),
    ("FASS", "Swedish pharmaceutical database", "Health", "https://www.fass.se/LIF/developer"),
    ("Apoteket", "Swedish pharmacy chain APIs", "Health", "https://www.apoteket.se/"),
    ("Postnord", "Nordic postal service tracking and shipping", "Logistics", "https://developer.postnord.com/"),
    ("DHL Sweden", "DHL shipping for Sweden", "Logistics", "https://developer.dhl.com/"),
    ("Budbee", "Swedish last-mile delivery API", "Logistics", "https://developer.budbee.com/"),
    ("Instabox", "Nordic parcel locker network", "Logistics", "https://www.instabox.se/"),
    ("Kivra", "Swedish digital mailbox API", "Communication", "https://www.kivra.se/"),
    ("Billogram", "Swedish invoicing platform", "Finance", "https://billogram.com/api/"),
    ("Payson", "Swedish payment provider", "Finance", "https://developers.payson.se/"),
    ("DIBS", "Nordic payment solutions (Nets owned)", "Finance", "https://tech.dibspayment.com/"),
    ("Bambora", "Nordic payment processing", "Finance", "https://developer.bambora.com/"),
    ("Collector Bank", "Swedish consumer finance API", "Finance", "https://developer.collectorbank.se/"),
    ("Walley", "Swedish buy now pay later", "Finance", "https://docs.walley.se/"),
    ("Svea", "Swedish financial services API", "Finance", "https://www.svea.com/se/sv/foretag/integrationer/"),
    
    # Norwegian APIs
    ("Vipps", "Norwegian mobile payment API", "Finance", "https://developer.vipps.no/"),
    ("Yr.no", "Norwegian weather service API", "Weather", "https://developer.yr.no/"),
    ("Vy", "Norwegian railway and bus operator", "Transportation", "https://www.vy.no/"),
    ("Entur", "Norwegian transport journey planner", "Transportation", "https://developer.entur.org/"),
    ("Kartverket", "Norwegian mapping authority", "Maps", "https://kartkatalog.geonorge.no/"),
    ("SSB", "Statistics Norway API", "Data", "https://www.ssb.no/api/"),
    ("Altinn", "Norwegian government services platform", "Government", "https://altinn.no/api/"),
    ("Brønnøysundregistrene", "Norwegian company registry", "Business", "https://data.brreg.no/"),
    
    # Danish APIs
    ("MobilePay", "Danish mobile payment API", "Finance", "https://developer.mobilepay.dk/"),
    ("Rejseplanen", "Danish public transport journey planner", "Transportation", "https://help.rejseplanen.dk/hc/da/articles/214174465"),
    ("DMI", "Danish Meteorological Institute", "Weather", "https://www.dmi.dk/"),
    ("CVR", "Danish company register", "Business", "https://datacvr.virk.dk/"),
    ("NemID", "Danish digital identity", "Government", "https://www.nets.eu/developer"),
    
    # Finnish APIs
    ("Digitraffic Finland", "Finnish transport and traffic data", "Transportation", "https://www.digitraffic.fi/"),
    ("HSL", "Helsinki region transport API", "Transportation", "https://digitransit.fi/en/developers/"),
    ("Finnish Meteorological Institute", "FMI open data", "Weather", "https://en.ilmatieteenlaitos.fi/open-data"),
    ("Suomi.fi", "Finnish government digital services", "Government", "https://www.suomi.fi/palvelut/apis"),
    ("PRH", "Finnish Patent and Registration Office", "Business", "https://www.prh.fi/en/"),
    
    # Hard-to-find niche APIs
    ("Mapillary", "Street-level imagery platform", "Maps", "https://www.mapillary.com/developer/api-documentation/"),
    ("What3Words", "Global addressing system with 3 words", "Maps", "https://developer.what3words.com/"),
    ("OpenCage", "Forward and reverse geocoding API", "Maps", "https://opencagedata.com/api"),
    ("Geocodio", "US and Canada geocoding", "Maps", "https://www.geocod.io/docs/"),
    ("SmartyStreets", "Address validation and geocoding", "Maps", "https://www.smarty.com/docs/"),
    ("Melissa", "Global data quality and address verification", "Data", "https://www.melissa.com/developer"),
    ("Lob", "Print and mail API", "Logistics", "https://docs.lob.com/"),
    ("EasyPost", "Shipping API aggregator", "Logistics", "https://www.easypost.com/docs/api"),
    ("ShipEngine", "Multi-carrier shipping API", "Logistics", "https://www.shipengine.com/docs/"),
    ("Shippo", "Shipping rates and labels API", "Logistics", "https://goshippo.com/docs/"),
    ("Pirate Ship", "USPS shipping discounts API", "Logistics", "https://ship.pirateship.com/"),
    ("Stamps.com", "USPS postage and shipping", "Logistics", "https://developer.stamps.com/"),
    ("ShipStation", "E-commerce shipping platform", "Logistics", "https://www.shipstation.com/docs/api/"),
    ("Ordoro", "Inventory and shipping management", "Logistics", "https://www.ordoro.com/developers"),
    ("Returnly", "Returns management platform", "E-commerce", "https://docs.returnly.com/"),
    ("Loop Returns", "Returns and exchanges platform", "E-commerce", "https://developers.loopreturns.com/"),
    ("Narvar", "Post-purchase experience platform", "E-commerce", "https://narvar.com/"),
    ("Route", "Package tracking and protection", "E-commerce", "https://route.com/api-docs"),
    ("Attentive", "SMS marketing platform", "Marketing", "https://docs.attentivemobile.com/"),
    ("Postscript", "SMS marketing for Shopify", "Marketing", "https://developers.postscript.io/"),
    ("Klaviyo", "Email and SMS marketing automation", "Marketing", "https://developers.klaviyo.com/"),
    ("Omnisend", "E-commerce marketing automation", "Marketing", "https://api-docs.omnisend.com/"),
    ("Drip", "E-commerce CRM and marketing", "Marketing", "https://developer.drip.com/"),
    ("Dotdigital", "Marketing automation platform", "Marketing", "https://developer.dotdigital.com/"),
    ("ActiveCampaign", "Customer experience automation", "Marketing", "https://developers.activecampaign.com/"),
    ("Customer.io", "Automated messaging platform", "Marketing", "https://customer.io/docs/api/"),
    ("Iterable", "Cross-channel marketing platform", "Marketing", "https://api.iterable.com/"),
    ("OneSignal", "Push notification service", "Communication", "https://documentation.onesignal.com/"),
    ("Pusher", "Real-time messaging infrastructure", "Communication", "https://pusher.com/docs/"),
    ("Ably", "Real-time messaging platform", "Communication", "https://ably.com/docs"),
    ("PubNub", "Real-time communication APIs", "Communication", "https://www.pubnub.com/docs/"),
    ("Stream", "Chat and activity feeds API", "Communication", "https://getstream.io/docs/"),
    ("Sendbird", "Chat and messaging API", "Communication", "https://sendbird.com/docs"),
    ("TalkJS", "Chat API and SDK", "Communication", "https://talkjs.com/docs/"),
    ("Cometchat", "In-app chat and calling", "Communication", "https://www.cometchat.com/docs/"),
    ("Vonage Video API", "WebRTC video platform (formerly TokBox)", "Communication", "https://tokbox.com/developer/"),
    ("Daily.co", "Video and audio calling API", "Communication", "https://docs.daily.co/"),
    ("Whereby", "Video meetings API", "Communication", "https://whereby.dev/"),
    ("100ms", "Live video and audio infrastructure", "Communication", "https://www.100ms.live/docs"),
    ("Dyte", "Live video SDK", "Communication", "https://docs.dyte.io/"),
    ("Mux", "Video streaming infrastructure", "Video", "https://docs.mux.com/"),
    ("Cloudflare Stream", "Video streaming with Cloudflare", "Video", "https://developers.cloudflare.com/stream/"),
    ("Bunny Stream", "Video hosting and streaming", "Video", "https://docs.bunny.net/docs/stream-overview"),
    ("api.video", "Video hosting and streaming API", "Video", "https://docs.api.video/"),
    ("Wistia", "Video hosting for business", "Video", "https://wistia.com/support/developers"),
    ("Vidyard", "Video platform for business", "Video", "https://knowledge.vidyard.com/hc/en-us/articles/360010001073"),
    ("Loom", "Video messaging platform", "Video", "https://dev.loom.com/docs"),
    ("Riverside", "Remote recording platform", "Video", "https://riverside.fm/"),
    ("Descript", "Audio and video editing platform", "Video", "https://www.descript.com/developers"),
    ("Remotion", "Programmatic video creation in React", "Video", "https://www.remotion.dev/docs/"),
    ("Creatomate", "Video and image generation API", "Video", "https://creatomate.com/docs/api/introduction"),
    ("Placid", "Image and video generation", "Design", "https://placid.app/docs"),
    ("Bannerbear", "Image and video generation API", "Design", "https://www.bannerbear.com/docs/"),
    ("Cloudinary", "Image and video management", "Media", "https://cloudinary.com/documentation"),
    ("imgix", "Real-time image processing", "Media", "https://docs.imgix.com/"),
    ("ImageKit", "Image CDN and optimization", "Media", "https://docs.imagekit.io/"),
    ("Filestack", "File upload and processing", "Media", "https://www.filestack.com/docs/"),
    ("Uploadcare", "File uploading and processing", "Media", "https://uploadcare.com/docs/"),
    ("Transloadit", "File uploading and encoding", "Media", "https://transloadit.com/docs/"),
]

for name, desc, category, link in swedish_apis:
    if add_api(name, desc, category, link):
        added += 1

registry['count'] = len(registry['apis'])
registry['lastUpdated'] = '2026-02-22'

with open(registry_path, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✅ APIClaw Nordic + Niche Expansion Complete")
print(f"   Added: {added} new APIs")
print(f"   Total: {registry['count']} APIs")
