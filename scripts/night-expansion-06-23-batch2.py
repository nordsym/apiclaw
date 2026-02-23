#!/usr/bin/env python3
"""
APIClaw Night Expansion - Batch 2 - Niche APIs
February 23, 2026 06:00
"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(data):
    data['lastUpdated'] = datetime.utcnow().isoformat()
    data['count'] = len(data['apis'])
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(data, f, indent=2)

def generate_id(name):
    return name.lower().replace(' ', '-').replace('.', '-').replace('/', '-').replace('(', '').replace(')', '')[:50]

def add_apis(registry, new_apis):
    existing_ids = {api['id'] for api in registry['apis']}
    added = 0
    for api in new_apis:
        api_id = generate_id(api['name'])
        if api_id not in existing_ids:
            api['id'] = api_id
            registry['apis'].append(api)
            existing_ids.add(api_id)
            added += 1
    return added

# =========================================
# NICHE CATEGORIES - MORE SPECIFIC APIs
# =========================================

WEB3_BLOCKCHAIN = [
    {"name": "Alchemy API", "description": "Blockchain developer platform for Web3", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.alchemy.com/", "pricing": "freemium"},
    {"name": "Infura API", "description": "Ethereum and IPFS API infrastructure", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.infura.io/", "pricing": "freemium"},
    {"name": "QuickNode API", "description": "Blockchain infrastructure for Web3", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.quicknode.com/docs", "pricing": "freemium"},
    {"name": "Moralis API", "description": "Web3 development platform", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.moralis.io/", "pricing": "freemium"},
    {"name": "The Graph API", "description": "Decentralized indexing protocol", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://thegraph.com/docs/", "pricing": "freemium"},
    {"name": "Chainlink API", "description": "Decentralized oracle network", "category": "Web3", "auth": "None", "https": True, "cors": "yes", "link": "https://docs.chain.link/", "pricing": "paid"},
    {"name": "Etherscan API", "description": "Ethereum blockchain explorer API", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.etherscan.io/", "pricing": "freemium"},
    {"name": "Polygonscan API", "description": "Polygon blockchain explorer", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.polygonscan.com/", "pricing": "freemium"},
    {"name": "BscScan API", "description": "BNB Chain blockchain explorer", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.bscscan.com/", "pricing": "freemium"},
    {"name": "Arbiscan API", "description": "Arbitrum blockchain explorer", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.arbiscan.io/", "pricing": "freemium"},
    {"name": "Optimism Etherscan API", "description": "Optimism blockchain explorer", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.optimism.etherscan.io/", "pricing": "freemium"},
    {"name": "Solscan API", "description": "Solana blockchain explorer", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.solscan.io/", "pricing": "freemium"},
    {"name": "Blockfrost API", "description": "Cardano blockchain API", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://blockfrost.dev/docs/", "pricing": "freemium"},
    {"name": "Tatum API", "description": "Unified blockchain development platform", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.tatum.io/", "pricing": "freemium"},
    {"name": "Covalent API", "description": "Multi-chain data aggregator", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.covalenthq.com/docs/api/", "pricing": "freemium"},
    {"name": "Bitquery API", "description": "Blockchain data and analytics", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://bitquery.io/products/streaming", "pricing": "freemium"},
    {"name": "Nansen API", "description": "Blockchain analytics platform", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.nansen.ai/", "pricing": "paid"},
    {"name": "Dune Analytics API", "description": "Crypto analytics platform", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.dune.com/api-reference/", "pricing": "freemium"},
    {"name": "Helius API", "description": "Solana developer platform", "category": "Web3", "auth": "apiKey", "https": "True", "cors": "yes", "link": "https://docs.helius.dev/", "pricing": "freemium"},
    {"name": "SimpleHash API", "description": "NFT data API across chains", "category": "Web3", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.simplehash.com/", "pricing": "freemium"},
]

SECURITY_APIS = [
    {"name": "HaveIBeenPwned API", "description": "Check if credentials have been compromised", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://haveibeenpwned.com/API/v3", "pricing": "freemium"},
    {"name": "VirusTotal API", "description": "Malware and URL scanning", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.virustotal.com/", "pricing": "freemium"},
    {"name": "Shodan API", "description": "Internet-connected device search engine", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.shodan.io/", "pricing": "freemium"},
    {"name": "Censys API", "description": "Internet asset discovery and monitoring", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://search.censys.io/api", "pricing": "freemium"},
    {"name": "SecurityTrails API", "description": "Historical DNS and WHOIS data", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.securitytrails.com/reference", "pricing": "freemium"},
    {"name": "URLScan API", "description": "Website security scanning", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://urlscan.io/docs/api/", "pricing": "freemium"},
    {"name": "Hybrid Analysis API", "description": "Free malware analysis service", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.hybrid-analysis.com/docs/api/v2", "pricing": "freemium"},
    {"name": "AlienVault OTX API", "description": "Open threat exchange platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://otx.alienvault.com/api", "pricing": "free"},
    {"name": "AbuseIPDB API", "description": "IP address abuse reporting database", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.abuseipdb.com/", "pricing": "freemium"},
    {"name": "IPQualityScore API", "description": "Fraud prevention and IP reputation", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ipqualityscore.com/documentation/overview", "pricing": "freemium"},
    {"name": "Snyk API", "description": "Developer security platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.snyk.io/snyk-api/", "pricing": "freemium"},
    {"name": "GitHub Security Advisory API", "description": "Security vulnerability database", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.github.com/en/graphql/reference/objects#securityadvisory", "pricing": "free"},
    {"name": "NVD API", "description": "National Vulnerability Database", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://nvd.nist.gov/developers/vulnerabilities", "pricing": "free"},
    {"name": "WhoisXML API", "description": "WHOIS, DNS, and IP data", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://whoisxmlapi.com/", "pricing": "freemium"},
    {"name": "Greynoise API", "description": "Internet background noise intelligence", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.greynoise.io/", "pricing": "freemium"},
    {"name": "ThreatFox API", "description": "Indicators of compromise sharing", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://threatfox.abuse.ch/api/", "pricing": "free"},
    {"name": "MalwareBazaar API", "description": "Malware sample repository", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://bazaar.abuse.ch/api/", "pricing": "free"},
    {"name": "Feodo Tracker API", "description": "Botnet C2 tracking", "category": "Security", "auth": "None", "https": True, "cors": "yes", "link": "https://feodotracker.abuse.ch/", "pricing": "free"},
    {"name": "SSL Labs API", "description": "SSL/TLS server testing", "category": "Security", "auth": "None", "https": True, "cors": "yes", "link": "https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md", "pricing": "free"},
    {"name": "CrowdSec API", "description": "Collaborative security platform", "category": "Security", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.crowdsec.net/docs/intro", "pricing": "freemium"},
]

LOGISTICS_SHIPPING = [
    {"name": "FedEx API", "description": "Shipping and tracking services", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.fedex.com/api/en-us/home.html", "pricing": "free"},
    {"name": "UPS API", "description": "Shipping, tracking, and logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.ups.com/", "pricing": "free"},
    {"name": "DHL API", "description": "Global logistics and shipping", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.dhl.com/", "pricing": "free"},
    {"name": "USPS API", "description": "US postal service shipping and tracking", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.usps.com/business/web-tools-apis/", "pricing": "free"},
    {"name": "Canada Post API", "description": "Canadian shipping and postal services", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/", "pricing": "free"},
    {"name": "Royal Mail API", "description": "UK postal and delivery services", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.royalmail.net/", "pricing": "free"},
    {"name": "PostNord API", "description": "Nordic shipping and logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.postnord.com/", "pricing": "free"},
    {"name": "Bring API", "description": "Norwegian shipping and logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.bring.com/", "pricing": "free"},
    {"name": "DB Schenker API", "description": "Global logistics services", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.dbschenker.com/", "pricing": "free"},
    {"name": "Maersk API", "description": "Container shipping and logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.maersk.com/", "pricing": "free"},
    {"name": "EasyPost API", "description": "Shipping API for multiple carriers", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.easypost.com/docs/api", "pricing": "freemium"},
    {"name": "AfterShip API", "description": "Shipment tracking for multiple carriers", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.aftership.com/docs/tracking/", "pricing": "freemium"},
    {"name": "17Track API", "description": "All-in-one package tracking", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.17track.net/en/doc", "pricing": "freemium"},
    {"name": "Flexport API", "description": "Freight forwarding and logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://apidocs.flexport.com/", "pricing": "paid"},
    {"name": "Project44 API", "description": "Supply chain visibility platform", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.project44.com/", "pricing": "paid"},
    {"name": "Freightos API", "description": "Freight rate comparison", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.freightos.com/api/", "pricing": "paid"},
    {"name": "ShipEngine API", "description": "Multi-carrier shipping platform", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.shipengine.com/docs/", "pricing": "freemium"},
    {"name": "Sendle API", "description": "Sustainable parcel delivery", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.sendle.com/", "pricing": "freemium"},
    {"name": "Lalamove API", "description": "On-demand delivery logistics", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.lalamove.com/", "pricing": "paid"},
    {"name": "Routific API", "description": "Route optimization for deliveries", "category": "Logistics", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.routific.com/", "pricing": "paid"},
]

HEALTHCARE_APIS = [
    {"name": "FHIR API", "description": "Healthcare interoperability standard", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.hl7.org/fhir/", "pricing": "free"},
    {"name": "Epic on FHIR API", "description": "Epic EHR integration", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://fhir.epic.com/", "pricing": "free"},
    {"name": "Cerner FHIR API", "description": "Cerner EHR integration", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://fhir.cerner.com/", "pricing": "free"},
    {"name": "Allscripts FHIR API", "description": "Allscripts EHR integration", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.allscripts.com/", "pricing": "free"},
    {"name": "athenahealth API", "description": "Healthcare network and EHR", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://docs.athenahealth.com/", "pricing": "free"},
    {"name": "DrChrono API", "description": "EHR and practice management", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://drchrono.com/api/", "pricing": "free"},
    {"name": "Redox API", "description": "Healthcare data integration platform", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.redoxengine.com/", "pricing": "paid"},
    {"name": "Health Gorilla API", "description": "Clinical data network", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.healthgorilla.com/", "pricing": "paid"},
    {"name": "1upHealth API", "description": "Healthcare data aggregation", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://1up.health/docs/", "pricing": "paid"},
    {"name": "Particle Health API", "description": "Medical record aggregation", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.particlehealth.com/", "pricing": "paid"},
    {"name": "Flexpa API", "description": "Healthcare claims data access", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.flexpa.com/docs/", "pricing": "paid"},
    {"name": "Human API", "description": "Health data aggregation platform", "category": "Healthcare", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://docs.humanapi.co/", "pricing": "paid"},
    {"name": "Validic API", "description": "Digital health data platform", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.validic.com/", "pricing": "paid"},
    {"name": "OpenFDA API", "description": "FDA public data access", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://open.fda.gov/apis/", "pricing": "free"},
    {"name": "RxNorm API", "description": "Normalized drug names", "category": "Healthcare", "auth": "None", "https": True, "cors": "yes", "link": "https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html", "pricing": "free"},
    {"name": "DrugBank API", "description": "Comprehensive drug database", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.drugbank.com/", "pricing": "freemium"},
    {"name": "PubChem API", "description": "Chemical information database", "category": "Healthcare", "auth": "None", "https": True, "cors": "yes", "link": "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest", "pricing": "free"},
    {"name": "ClinVar API", "description": "Genetic variant information", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ncbi.nlm.nih.gov/clinvar/docs/api/", "pricing": "free"},
    {"name": "UMLS API", "description": "Unified Medical Language System", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://documentation.uts.nlm.nih.gov/rest/", "pricing": "free"},
    {"name": "Coverdale API", "description": "Healthcare verification platform", "category": "Healthcare", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.coverdale.health/", "pricing": "paid"},
]

GEOLOCATION_MAPS = [
    {"name": "Mapbox API", "description": "Custom maps and location services", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mapbox.com/api/", "pricing": "freemium"},
    {"name": "HERE API", "description": "Location platform for developers", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.here.com/", "pricing": "freemium"},
    {"name": "TomTom API", "description": "Maps, routing, and traffic", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.tomtom.com/", "pricing": "freemium"},
    {"name": "OpenStreetMap Nominatim API", "description": "OpenStreetMap geocoding", "category": "Geolocation", "auth": "None", "https": True, "cors": "yes", "link": "https://nominatim.org/release-docs/latest/api/Overview/", "pricing": "free"},
    {"name": "OpenRouteService API", "description": "Open-source routing and geocoding", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://openrouteservice.org/dev/#/api-docs", "pricing": "freemium"},
    {"name": "Geoapify API", "description": "Location and maps platform", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.geoapify.com/api/", "pricing": "freemium"},
    {"name": "LocationIQ API", "description": "Affordable geocoding and routing", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://locationiq.com/docs", "pricing": "freemium"},
    {"name": "Radar API", "description": "Location infrastructure for apps", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://radar.com/documentation/api", "pricing": "freemium"},
    {"name": "What3Words API", "description": "Three-word location addressing", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.what3words.com/public-api", "pricing": "freemium"},
    {"name": "Pelias API", "description": "Open-source geocoder", "category": "Geolocation", "auth": "None", "https": True, "cors": "yes", "link": "https://github.com/pelias/documentation", "pricing": "free"},
    {"name": "Graphhopper API", "description": "Routing and geocoding", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.graphhopper.com/", "pricing": "freemium"},
    {"name": "OSRM API", "description": "Open Source Routing Machine", "category": "Geolocation", "auth": "None", "https": True, "cors": "yes", "link": "http://project-osrm.org/docs/", "pricing": "free"},
    {"name": "Valhalla API", "description": "Open-source routing engine", "category": "Geolocation", "auth": "None", "https": True, "cors": "yes", "link": "https://valhalla.github.io/valhalla/", "pricing": "free"},
    {"name": "SmartyStreets API", "description": "Address validation and verification", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.smartystreets.com/docs/", "pricing": "freemium"},
    {"name": "Lob Address API", "description": "Address verification and autocomplete", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.lob.com/", "pricing": "freemium"},
    {"name": "Melissa API", "description": "Global address verification", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.melissa.com/developer", "pricing": "paid"},
    {"name": "Loqate API", "description": "Address verification by GBG", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.loqate.com/resources/support/apis/", "pricing": "paid"},
    {"name": "Precisely API", "description": "Location intelligence platform", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.precisely.com/", "pricing": "paid"},
    {"name": "Esri ArcGIS API", "description": "Enterprise GIS platform", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.arcgis.com/", "pricing": "freemium"},
    {"name": "Stadia Maps API", "description": "Map tiles and geocoding", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.stadiamaps.com/", "pricing": "freemium"},
]

IOT_EMBEDDED = [
    {"name": "Arduino IoT Cloud API", "description": "IoT platform for Arduino devices", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.arduino.cc/arduino-cloud/api/", "pricing": "freemium"},
    {"name": "Particle API", "description": "IoT platform for connected products", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.particle.io/reference/cloud-apis/", "pricing": "freemium"},
    {"name": "ThingSpeak API", "description": "IoT analytics platform", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://thingspeak.com/docs", "pricing": "freemium"},
    {"name": "Blynk API", "description": "IoT platform for mobile apps", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.blynk.io/", "pricing": "freemium"},
    {"name": "Cayenne API", "description": "IoT project builder", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.mydevices.com/", "pricing": "freemium"},
    {"name": "Losant API", "description": "Enterprise IoT platform", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.losant.com/rest-api/overview/", "pricing": "freemium"},
    {"name": "Ubidots API", "description": "IoT data analytics platform", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://ubidots.com/docs/api/", "pricing": "freemium"},
    {"name": "Hologram API", "description": "Cellular IoT connectivity", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.hologram.io/references/api/", "pricing": "paid"},
    {"name": "Twilio IoT API", "description": "Programmable connectivity for IoT", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.twilio.com/docs/iot", "pricing": "paid"},
    {"name": "Helium API", "description": "Decentralized IoT network", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.helium.com/api/", "pricing": "paid"},
    {"name": "The Things Network API", "description": "LoRaWAN IoT network", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.thethingsnetwork.org/docs/", "pricing": "freemium"},
    {"name": "AWS IoT Core API", "description": "Managed IoT cloud service", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/iot/", "pricing": "paid"},
    {"name": "Azure IoT Hub API", "description": "Enterprise IoT platform", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/rest/api/iothub/", "pricing": "paid"},
    {"name": "Google Cloud IoT API", "description": "Fully managed IoT service", "category": "IoT", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/iot/docs/reference/cloudiot/rest", "pricing": "paid"},
    {"name": "Tuya API", "description": "IoT development platform", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.tuya.com/en/docs/", "pricing": "freemium"},
    {"name": "SmartThings API", "description": "Samsung IoT platform", "category": "IoT", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.smartthings.com/docs/api/", "pricing": "free"},
    {"name": "Home Assistant API", "description": "Open-source home automation", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.home-assistant.io/docs/api/", "pricing": "free"},
    {"name": "Philips Hue API", "description": "Smart lighting control", "category": "IoT", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.meethue.com/", "pricing": "free"},
    {"name": "Ecobee API", "description": "Smart thermostat platform", "category": "IoT", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.ecobee.com/home/developer/api/introduction/", "pricing": "free"},
    {"name": "Netatmo API", "description": "Connected home devices", "category": "IoT", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://dev.netatmo.com/", "pricing": "free"},
]

MEDIA_CONTENT = [
    {"name": "Cloudinary API", "description": "Media management and transformation", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://cloudinary.com/documentation/", "pricing": "freemium"},
    {"name": "Imgix API", "description": "Real-time image processing", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.imgix.com/", "pricing": "paid"},
    {"name": "ImageKit API", "description": "Image CDN and optimization", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.imagekit.io/", "pricing": "freemium"},
    {"name": "Uploadcare API", "description": "File uploading and processing", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://uploadcare.com/docs/", "pricing": "freemium"},
    {"name": "Filestack API", "description": "File handling infrastructure", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.filestack.com/docs/", "pricing": "freemium"},
    {"name": "Mux API", "description": "Video infrastructure for developers", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mux.com/", "pricing": "freemium"},
    {"name": "Cloudflare Stream API", "description": "Video streaming platform", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.cloudflare.com/stream/", "pricing": "paid"},
    {"name": "Wistia API", "description": "Video hosting for business", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://wistia.com/support/developers", "pricing": "freemium"},
    {"name": "Vimeo API", "description": "Professional video platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.vimeo.com/", "pricing": "freemium"},
    {"name": "YouTube Data API", "description": "YouTube video platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.google.com/youtube/v3", "pricing": "free"},
    {"name": "Giphy API", "description": "GIF search and creation", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.giphy.com/docs/api/", "pricing": "free"},
    {"name": "Tenor API", "description": "GIF search engine", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://tenor.com/developer/dashboard", "pricing": "free"},
    {"name": "Unsplash API", "description": "Free high-resolution photos", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://unsplash.com/developers", "pricing": "free"},
    {"name": "Pexels API", "description": "Free stock photos and videos", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.pexels.com/api/documentation/", "pricing": "free"},
    {"name": "Pixabay API", "description": "Free images and videos", "category": "Media", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://pixabay.com/api/docs/", "pricing": "free"},
    {"name": "Getty Images API", "description": "Premium stock imagery", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://api.gettyimages.com/", "pricing": "paid"},
    {"name": "Shutterstock API", "description": "Stock photos, vectors, videos", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.shutterstock.com/developers", "pricing": "paid"},
    {"name": "Adobe Stock API", "description": "Adobe stock content platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.adobe.com/stock/docs/", "pricing": "paid"},
    {"name": "Spotify API", "description": "Music streaming platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.spotify.com/documentation/web-api/", "pricing": "free"},
    {"name": "SoundCloud API", "description": "Audio streaming platform", "category": "Media", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.soundcloud.com/docs/api/", "pricing": "free"},
]

LEGAL_COMPLIANCE = [
    {"name": "DocuSign API", "description": "Electronic signature platform", "category": "Legal", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.docusign.com/", "pricing": "paid"},
    {"name": "HelloSign API", "description": "eSignature and document management", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.hellosign.com/", "pricing": "freemium"},
    {"name": "PandaDoc API", "description": "Document workflow automation", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.pandadoc.com/", "pricing": "freemium"},
    {"name": "SignNow API", "description": "eSignature solutions", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://signnow.com/api", "pricing": "paid"},
    {"name": "Adobe Sign API", "description": "Enterprise eSignature", "category": "Legal", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://opensource.adobe.com/acrobat-sign/developer_guide/", "pricing": "paid"},
    {"name": "Ironclad API", "description": "Contract lifecycle management", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.ironcladapp.com/", "pricing": "paid"},
    {"name": "ContractPodAi API", "description": "AI-powered contract management", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.contractpodai.com/", "pricing": "paid"},
    {"name": "Clio API", "description": "Legal practice management", "category": "Legal", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.clio.com/", "pricing": "paid"},
    {"name": "LexisNexis API", "description": "Legal research database", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.lexisnexis.com/", "pricing": "paid"},
    {"name": "Westlaw API", "description": "Legal research platform", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.westlaw.com/", "pricing": "paid"},
    {"name": "Persona API", "description": "Identity verification platform", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.withpersona.com/", "pricing": "paid"},
    {"name": "Jumio API", "description": "Identity verification and KYC", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.jumio.com/", "pricing": "paid"},
    {"name": "Onfido API", "description": "Identity verification and compliance", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://documentation.onfido.com/", "pricing": "paid"},
    {"name": "Veriff API", "description": "Identity verification platform", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.veriff.com/", "pricing": "paid"},
    {"name": "Sumsub API", "description": "KYC/AML verification", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.sumsub.com/", "pricing": "paid"},
    {"name": "Trulioo API", "description": "Global identity verification", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.trulioo.com/", "pricing": "paid"},
    {"name": "ComplyAdvantage API", "description": "AML and fraud detection", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.complyadvantage.com/", "pricing": "paid"},
    {"name": "Chainalysis API", "description": "Blockchain compliance and investigation", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.chainalysis.com/", "pricing": "paid"},
    {"name": "Elliptic API", "description": "Crypto compliance and risk management", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.elliptic.co/products/apis", "pricing": "paid"},
    {"name": "Notarize API", "description": "Online notarization platform", "category": "Legal", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.notarize.com/", "pricing": "paid"},
]

def main():
    print("🦞 APIClaw Night Expansion - Batch 2 (Niche APIs)")
    print("=" * 50)
    
    registry = load_registry()
    initial_count = len(registry['apis'])
    print(f"Starting with {initial_count} APIs")
    
    all_batches = [
        ("Web3 & Blockchain", WEB3_BLOCKCHAIN),
        ("Security", SECURITY_APIS),
        ("Logistics & Shipping", LOGISTICS_SHIPPING),
        ("Healthcare", HEALTHCARE_APIS),
        ("Geolocation & Maps", GEOLOCATION_MAPS),
        ("IoT & Embedded", IOT_EMBEDDED),
        ("Media & Content", MEDIA_CONTENT),
        ("Legal & Compliance", LEGAL_COMPLIANCE),
    ]
    
    total_added = 0
    for name, batch in all_batches:
        added = add_apis(registry, batch)
        total_added += added
        print(f"  {name}: +{added} APIs")
    
    save_registry(registry)
    final_count = len(registry['apis'])
    
    print("=" * 50)
    print(f"✅ Added {total_added} new APIs")
    print(f"📊 Total: {initial_count} → {final_count}")
    
    return total_added

if __name__ == "__main__":
    main()
