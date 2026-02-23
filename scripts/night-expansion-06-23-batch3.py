#!/usr/bin/env python3
"""
APIClaw Night Expansion - Batch 3 - Regional & Specialized APIs
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
    return name.lower().replace(' ', '-').replace('.', '-').replace('/', '-').replace('(', '').replace(')', '').replace('ö', 'o').replace('ä', 'a').replace('å', 'a').replace('ü', 'u').replace('ñ', 'n')[:50]

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
# EUROPEAN GOVERNMENT & REGIONAL APIs
# =========================================

NORDIC_GOVERNMENT = [
    {"name": "Skatteverket API", "description": "Swedish Tax Agency services", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.skatteverket.se/omoss/apierochoppnadata.4.5c281c7015abecc2e2010000.html", "pricing": "free"},
    {"name": "Bolagsverket API", "description": "Swedish Companies Registration Office", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://bolagsverket.se/", "pricing": "paid"},
    {"name": "Lantmäteriet API", "description": "Swedish mapping and property data", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.lantmateriet.se/sv/geodata/", "pricing": "freemium"},
    {"name": "SMHI API", "description": "Swedish weather and climate data", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://opendata.smhi.se/", "pricing": "free"},
    {"name": "SCB API", "description": "Statistics Sweden open data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/", "pricing": "free"},
    {"name": "Trafikverket API", "description": "Swedish transport administration", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.trafikinfo.trafikverket.se/", "pricing": "free"},
    {"name": "Riksbanken API", "description": "Swedish central bank data", "category": "Finance", "auth": "None", "https": True, "cors": "yes", "link": "https://www.riksbank.se/", "pricing": "free"},
    {"name": "Krisinformation API", "description": "Swedish crisis information", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.krisinformation.se/", "pricing": "free"},
    {"name": "Norwegian Tax API", "description": "Norwegian Tax Administration", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://skatteetaten.github.io/api-dokumentasjon/", "pricing": "free"},
    {"name": "Brønnøysundregistrene API", "description": "Norwegian business registry", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.brreg.no/produkter-og-tjenester/apne-data/", "pricing": "free"},
    {"name": "Yr API", "description": "Norwegian weather service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://developer.yr.no/", "pricing": "free"},
    {"name": "Entur API", "description": "Norwegian public transport", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.entur.org/", "pricing": "free"},
    {"name": "Finnish Tax API", "description": "Finnish Tax Administration", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.vero.fi/", "pricing": "free"},
    {"name": "PRH API", "description": "Finnish Patent and Registration Office", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.prh.fi/", "pricing": "free"},
    {"name": "FMI API", "description": "Finnish Meteorological Institute", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://en.ilmatieteenlaitos.fi/open-data", "pricing": "free"},
    {"name": "HSL API", "description": "Helsinki Region Transport", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://digitransit.fi/en/developers/", "pricing": "free"},
    {"name": "Danish CVR API", "description": "Danish Central Business Register", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://datacvr.virk.dk/", "pricing": "free"},
    {"name": "DMI API", "description": "Danish Meteorological Institute", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://opendatadocs.dmi.govcloud.dk/", "pricing": "free"},
    {"name": "Rejseplanen API", "description": "Danish public transport", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://help.rejseplanen.dk/hc/da/categories/201728005-Rejseplanen-Labs", "pricing": "free"},
    {"name": "Iceland Revenue API", "description": "Icelandic Revenue and Customs", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.rsk.is/", "pricing": "free"},
]

EU_GOVERNMENT = [
    {"name": "EU Open Data Portal API", "description": "EU institutions open data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.europa.eu/en/publications/dataeuropa-academy", "pricing": "free"},
    {"name": "Eurostat API", "description": "European statistics", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://ec.europa.eu/eurostat/web/main/data/web-services", "pricing": "free"},
    {"name": "ECB API", "description": "European Central Bank data", "category": "Finance", "auth": "None", "https": True, "cors": "yes", "link": "https://data.ecb.europa.eu/", "pricing": "free"},
    {"name": "UK Companies House API", "description": "UK company information", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.companieshouse.gov.uk/", "pricing": "free"},
    {"name": "UK Land Registry API", "description": "UK property data", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://landregistry.data.gov.uk/", "pricing": "free"},
    {"name": "UK Met Office API", "description": "UK weather data", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.metoffice.gov.uk/services/data", "pricing": "freemium"},
    {"name": "Transport for London API", "description": "London public transport", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.tfl.gov.uk/", "pricing": "free"},
    {"name": "German Bundesanzeiger API", "description": "German Federal Gazette", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.bundesanzeiger.de/", "pricing": "paid"},
    {"name": "DWD API", "description": "German Weather Service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://www.dwd.de/DE/leistungen/opendata/opendata.html", "pricing": "free"},
    {"name": "DB API", "description": "Deutsche Bahn transport", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.deutschebahn.com/", "pricing": "free"},
    {"name": "French INSEE API", "description": "French national statistics", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://api.insee.fr/", "pricing": "free"},
    {"name": "French SIRENE API", "description": "French business registry", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee", "pricing": "free"},
    {"name": "Météo-France API", "description": "French weather service", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://donneespubliques.meteofrance.fr/", "pricing": "freemium"},
    {"name": "SNCF API", "description": "French railways", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.digital.sncf.com/startup/api", "pricing": "free"},
    {"name": "Spanish AEAT API", "description": "Spanish Tax Agency", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agenciatributaria.es/", "pricing": "free"},
    {"name": "Spanish INE API", "description": "Spanish National Statistics", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.ine.es/dyngs/DataLab/en/manual.html?cid=66", "pricing": "free"},
    {"name": "AEMET API", "description": "Spanish weather agency", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://opendata.aemet.es/", "pricing": "free"},
    {"name": "Italian ISTAT API", "description": "Italian National Statistics", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.istat.it/en/information-and-services/developers", "pricing": "free"},
    {"name": "Dutch CBS API", "description": "Statistics Netherlands", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.cbs.nl/en-gb/our-services/open-data", "pricing": "free"},
    {"name": "NS API", "description": "Dutch Railways", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ns.nl/en/travel-information/ns-api", "pricing": "freemium"},
]

ASIAN_APIS = [
    {"name": "Japan e-Stat API", "description": "Japanese government statistics", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.e-stat.go.jp/en/api/", "pricing": "free"},
    {"name": "JMA API", "description": "Japan Meteorological Agency", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://www.jma.go.jp/", "pricing": "free"},
    {"name": "JR API", "description": "Japan Railways data", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer-tokai.jr-central.co.jp/", "pricing": "free"},
    {"name": "Korea Open Data API", "description": "Korean government open data", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.data.go.kr/", "pricing": "free"},
    {"name": "KMA API", "description": "Korea Meteorological Administration", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://data.kma.go.kr/", "pricing": "free"},
    {"name": "Singapore Data API", "description": "Singapore government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.sg/", "pricing": "free"},
    {"name": "Singapore OneMap API", "description": "Singapore mapping services", "category": "Geolocation", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.onemap.gov.sg/apidocs/", "pricing": "free"},
    {"name": "LTA DataMall API", "description": "Singapore transport data", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://datamall.lta.gov.sg/", "pricing": "free"},
    {"name": "Hong Kong Data API", "description": "Hong Kong government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.hk/", "pricing": "free"},
    {"name": "India Data API", "description": "Indian government open data", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://data.gov.in/", "pricing": "free"},
    {"name": "IMD API", "description": "India Meteorological Department", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://mausam.imd.gov.in/", "pricing": "free"},
    {"name": "Indian Railways API", "description": "Indian Railways data", "category": "Transport", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://railwayapi.site/", "pricing": "freemium"},
    {"name": "Taiwan Open Data API", "description": "Taiwan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.tw/", "pricing": "free"},
    {"name": "CWA API", "description": "Taiwan weather service", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://opendata.cwb.gov.tw/", "pricing": "free"},
    {"name": "Thailand Open Data API", "description": "Thai government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.go.th/", "pricing": "free"},
    {"name": "Malaysia Open Data API", "description": "Malaysian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.my/", "pricing": "free"},
    {"name": "Indonesia Open Data API", "description": "Indonesian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.go.id/", "pricing": "free"},
    {"name": "Philippines Open Data API", "description": "Philippine government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.ph/", "pricing": "free"},
    {"name": "Vietnam Open Data API", "description": "Vietnamese government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.vn/", "pricing": "free"},
    {"name": "Bangladesh Open Data API", "description": "Bangladesh government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.bd/", "pricing": "free"},
]

AMERICAS_APIS = [
    {"name": "USA Census API", "description": "US Census Bureau data", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.census.gov/data/developers.html", "pricing": "free"},
    {"name": "Data.gov API", "description": "US government open data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov/", "pricing": "free"},
    {"name": "NOAA API", "description": "US weather and climate data", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.weather.gov/documentation/services-web-api", "pricing": "free"},
    {"name": "NWS API", "description": "National Weather Service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://www.weather.gov/documentation/services-web-api", "pricing": "free"},
    {"name": "FDA API", "description": "US Food and Drug Administration", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://open.fda.gov/apis/", "pricing": "free"},
    {"name": "SEC EDGAR API", "description": "US SEC company filings", "category": "Finance", "auth": "None", "https": True, "cors": "yes", "link": "https://www.sec.gov/edgar/searchedgar/companysearch.html", "pricing": "free"},
    {"name": "NASA API", "description": "NASA open data", "category": "Science", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.nasa.gov/", "pricing": "free"},
    {"name": "USGS API", "description": "US Geological Survey data", "category": "Science", "auth": "None", "https": True, "cors": "yes", "link": "https://www.usgs.gov/products/data-and-tools/apis", "pricing": "free"},
    {"name": "Canada Open Data API", "description": "Canadian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://open.canada.ca/", "pricing": "free"},
    {"name": "Environment Canada API", "description": "Canadian weather service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://dd.weather.gc.ca/", "pricing": "free"},
    {"name": "Mexico Open Data API", "description": "Mexican government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://datos.gob.mx/", "pricing": "free"},
    {"name": "Brazil Open Data API", "description": "Brazilian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://dados.gov.br/", "pricing": "free"},
    {"name": "INMET API", "description": "Brazilian weather service", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://portal.inmet.gov.br/", "pricing": "free"},
    {"name": "Argentina Open Data API", "description": "Argentine government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://datos.gob.ar/", "pricing": "free"},
    {"name": "SMN Argentina API", "description": "Argentine weather service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "https://www.smn.gob.ar/", "pricing": "free"},
    {"name": "Chile Open Data API", "description": "Chilean government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://datos.gob.cl/", "pricing": "free"},
    {"name": "Colombia Open Data API", "description": "Colombian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.datos.gov.co/", "pricing": "free"},
    {"name": "Peru Open Data API", "description": "Peruvian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://www.datosabiertos.gob.pe/", "pricing": "free"},
    {"name": "Ecuador Open Data API", "description": "Ecuadorian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://datosabiertos.gob.ec/", "pricing": "free"},
    {"name": "Uruguay Open Data API", "description": "Uruguayan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://catalogodatos.gub.uy/", "pricing": "free"},
]

OCEANIA_AFRICA_APIS = [
    {"name": "Australia Data API", "description": "Australian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.au/", "pricing": "free"},
    {"name": "BOM API", "description": "Australian weather service", "category": "Weather", "auth": "None", "https": True, "cors": "yes", "link": "http://www.bom.gov.au/catalogue/data-feeds.shtml", "pricing": "free"},
    {"name": "ASIC API", "description": "Australian Securities and Investments", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://asic.gov.au/", "pricing": "free"},
    {"name": "NZ Open Data API", "description": "New Zealand government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.govt.nz/", "pricing": "free"},
    {"name": "MetService API", "description": "New Zealand weather", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.metservice.com/", "pricing": "freemium"},
    {"name": "Companies Register NZ API", "description": "NZ company registry", "category": "Government", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://companies-register.companiesoffice.govt.nz/", "pricing": "free"},
    {"name": "South Africa Data API", "description": "South African government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.za/", "pricing": "free"},
    {"name": "SAWS API", "description": "South African weather service", "category": "Weather", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.weathersa.co.za/", "pricing": "paid"},
    {"name": "Kenya Open Data API", "description": "Kenyan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://opendata.go.ke/", "pricing": "free"},
    {"name": "Nigeria Open Data API", "description": "Nigerian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://nigerianstat.gov.ng/", "pricing": "free"},
    {"name": "Ghana Open Data API", "description": "Ghanaian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.gh/", "pricing": "free"},
    {"name": "Egypt Open Data API", "description": "Egyptian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.eg/", "pricing": "free"},
    {"name": "Morocco Open Data API", "description": "Moroccan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.ma/", "pricing": "free"},
    {"name": "Tunisia Open Data API", "description": "Tunisian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.tn/", "pricing": "free"},
    {"name": "Rwanda Open Data API", "description": "Rwandan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://statistics.gov.rw/", "pricing": "free"},
    {"name": "Tanzania Open Data API", "description": "Tanzanian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "http://opendata.go.tz/", "pricing": "free"},
    {"name": "Uganda Open Data API", "description": "Ugandan government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.ug/", "pricing": "free"},
    {"name": "Ethiopia Open Data API", "description": "Ethiopian government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gov.et/", "pricing": "free"},
    {"name": "Senegal Open Data API", "description": "Senegalese government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gouv.sn/", "pricing": "free"},
    {"name": "Ivory Coast Data API", "description": "Côte d'Ivoire government data", "category": "Government", "auth": "None", "https": True, "cors": "yes", "link": "https://data.gouv.ci/", "pricing": "free"},
]

DEVELOPER_TOOLS = [
    {"name": "Vercel API", "description": "Frontend cloud platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://vercel.com/docs/rest-api", "pricing": "freemium"},
    {"name": "Netlify API", "description": "Web development platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.netlify.com/api/", "pricing": "freemium"},
    {"name": "Railway API", "description": "Infrastructure platform for developers", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.railway.app/reference/public-api", "pricing": "freemium"},
    {"name": "Render API", "description": "Unified cloud for web apps", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api-docs.render.com/", "pricing": "freemium"},
    {"name": "Fly.io API", "description": "App deployment platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://fly.io/docs/machines/api/", "pricing": "freemium"},
    {"name": "Deno Deploy API", "description": "Edge serverless platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://deno.com/deploy/docs", "pricing": "freemium"},
    {"name": "Supabase API", "description": "Open source Firebase alternative", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://supabase.com/docs/reference", "pricing": "freemium"},
    {"name": "PlanetScale API", "description": "Serverless MySQL platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://planetscale.com/docs/reference/api-overview", "pricing": "freemium"},
    {"name": "Neon API", "description": "Serverless Postgres", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://neon.tech/docs/reference/api-reference", "pricing": "freemium"},
    {"name": "Upstash API", "description": "Serverless data platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.upstash.com/", "pricing": "freemium"},
    {"name": "Turso API", "description": "SQLite for the edge", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.turso.tech/", "pricing": "freemium"},
    {"name": "Xata API", "description": "Serverless database platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://xata.io/docs/api-reference/", "pricing": "freemium"},
    {"name": "Fauna API", "description": "Distributed document-relational database", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.fauna.com/fauna/current/reference/http/", "pricing": "freemium"},
    {"name": "CockroachDB API", "description": "Distributed SQL database", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.cockroachlabs.com/docs/api/", "pricing": "freemium"},
    {"name": "Prisma Data Platform API", "description": "Database tools for developers", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.prisma.io/docs/data-platform", "pricing": "freemium"},
    {"name": "Cloudflare Workers API", "description": "Edge serverless platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.cloudflare.com/workers/", "pricing": "freemium"},
    {"name": "Fastly API", "description": "Edge cloud platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.fastly.com/reference/api/", "pricing": "paid"},
    {"name": "Bunny CDN API", "description": "Global content delivery", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.bunny.net/reference/bunnynet-api-overview", "pricing": "paid"},
    {"name": "KeyCDN API", "description": "Content delivery network", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.keycdn.com/api", "pricing": "paid"},
    {"name": "StackPath API", "description": "Edge services platform", "category": "Developer Tools", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://stackpath.dev/reference", "pricing": "paid"},
]

def main():
    print("🦞 APIClaw Night Expansion - Batch 3 (Regional & Specialized)")
    print("=" * 50)
    
    registry = load_registry()
    initial_count = len(registry['apis'])
    print(f"Starting with {initial_count} APIs")
    
    all_batches = [
        ("Nordic Government", NORDIC_GOVERNMENT),
        ("EU Government", EU_GOVERNMENT),
        ("Asian APIs", ASIAN_APIS),
        ("Americas APIs", AMERICAS_APIS),
        ("Oceania & Africa", OCEANIA_AFRICA_APIS),
        ("Developer Tools", DEVELOPER_TOOLS),
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
