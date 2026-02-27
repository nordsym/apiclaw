#!/usr/bin/env python3
"""
APIClaw Night Expansion 2026-02-26 v2
Parse n0shake/Public-APIs README and extract APIs
"""

import json
import re
from pathlib import Path

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "night-expansion-02-26-v2.json"
REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def parse_markdown_table(content: str):
    """Parse markdown tables from n0shake format"""
    apis = []
    current_category = "General"
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Detect category headers (### Category)
        if line.startswith('### '):
            current_category = line.replace('### ', '').strip()
            continue
        
        # Detect table rows with links
        if '|' in line and '[**' in line:
            # Parse: | [**Name**](url) | Description | Open/Trial |
            match = re.search(r'\[\*\*([^*]+)\*\*\]\(([^)]+)\)\s*\|\s*([^|]+)', line)
            if match:
                name = match.group(1).strip()
                url = match.group(2).strip()
                desc = match.group(3).strip()
                
                # Determine auth type from the line
                auth = "unknown"
                if '💸' in line:
                    auth = "apiKey"
                elif 'Open Source' in line or 'opensource' in line.lower():
                    auth = "None"
                else:
                    auth = "None"
                
                apis.append({
                    "name": name,
                    "description": desc[:200] if len(desc) > 200 else desc,
                    "category": current_category,
                    "link": url,
                    "auth": auth
                })
    
    return apis

# Additional APIs from various sources (curated)
EXTRA_APIS = [
    # Government & Open Data
    {"name": "USAspending.gov", "description": "US federal spending data", "category": "Government", "link": "https://api.usaspending.gov/", "auth": "None"},
    {"name": "OpenFEC", "description": "FEC campaign finance data", "category": "Government", "link": "https://api.open.fec.gov/", "auth": "apiKey"},
    {"name": "Congress.gov API", "description": "US Congress data", "category": "Government", "link": "https://api.congress.gov/", "auth": "apiKey"},
    {"name": "UK Parliament API", "description": "UK Parliament data", "category": "Government", "link": "https://developer.parliament.uk/", "auth": "None"},
    {"name": "EU Open Data Portal", "description": "European Union open data", "category": "Government", "link": "https://data.europa.eu/api/hub/repo/", "auth": "None"},
    {"name": "Data.gov", "description": "US government open data", "category": "Government", "link": "https://catalog.data.gov/api/", "auth": "None"},
    {"name": "World Bank Open Data", "description": "World Bank development data", "category": "Finance", "link": "https://data.worldbank.org/", "auth": "None"},
    {"name": "UN Data API", "description": "United Nations statistics", "category": "Government", "link": "http://data.un.org/Host.aspx?Content=API", "auth": "None"},
    {"name": "OECD Data", "description": "OECD economic data", "category": "Finance", "link": "https://data.oecd.org/", "auth": "None"},
    {"name": "IMF Data", "description": "IMF economic indicators", "category": "Finance", "link": "https://datahelp.imf.org/knowledgebase/articles/630877-data-services", "auth": "None"},
    
    # Healthcare & Medical
    {"name": "OpenFDA", "description": "FDA drug, device, food data", "category": "Healthcare", "link": "https://open.fda.gov/apis/", "auth": "None"},
    {"name": "ClinicalTrials.gov", "description": "Clinical trials database", "category": "Healthcare", "link": "https://clinicaltrials.gov/api/gui", "auth": "None"},
    {"name": "Disease.sh", "description": "COVID-19 and disease data", "category": "Healthcare", "link": "https://disease.sh/docs/", "auth": "None"},
    {"name": "openFDA Drug Labels", "description": "Drug labeling information", "category": "Healthcare", "link": "https://open.fda.gov/apis/drug/label/", "auth": "None"},
    {"name": "Human Protein Atlas", "description": "Human proteome data", "category": "Science", "link": "https://www.proteinatlas.org/about/help/dataaccess", "auth": "None"},
    {"name": "DrugBank", "description": "Drug and drug target database", "category": "Healthcare", "link": "https://go.drugbank.com/", "auth": "apiKey"},
    {"name": "ChEMBL", "description": "Bioactive molecules database", "category": "Science", "link": "https://www.ebi.ac.uk/chembl/api/data/docs", "auth": "None"},
    {"name": "PubChem", "description": "Chemical information", "category": "Science", "link": "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest", "auth": "None"},
    {"name": "BioPortal", "description": "Biomedical ontologies", "category": "Science", "link": "http://data.bioontology.org/documentation", "auth": "apiKey"},
    {"name": "Ensembl", "description": "Genome databases", "category": "Science", "link": "https://rest.ensembl.org/", "auth": "None"},
    
    # Space & Astronomy  
    {"name": "NASA APOD", "description": "Astronomy Picture of the Day", "category": "Science", "link": "https://api.nasa.gov/", "auth": "apiKey"},
    {"name": "NASA Mars Rover Photos", "description": "Mars rover imagery", "category": "Science", "link": "https://api.nasa.gov/", "auth": "apiKey"},
    {"name": "NASA Exoplanet Archive", "description": "Exoplanet data", "category": "Science", "link": "https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html", "auth": "None"},
    {"name": "NASA EONET", "description": "Earth natural events", "category": "Science", "link": "https://eonet.gsfc.nasa.gov/docs/v3", "auth": "None"},
    {"name": "N2YO", "description": "Satellite tracking", "category": "Science", "link": "https://www.n2yo.com/api/", "auth": "apiKey"},
    {"name": "Sunrise Sunset", "description": "Sunrise and sunset times", "category": "Science", "link": "https://sunrise-sunset.org/api", "auth": "None"},
    {"name": "Open Notify", "description": "ISS location and astronauts", "category": "Science", "link": "http://open-notify.org/", "auth": "None"},
    {"name": "SpaceX API", "description": "SpaceX rockets and launches", "category": "Science", "link": "https://github.com/r-spacex/SpaceX-API", "auth": "None"},
    {"name": "Launch Library 2", "description": "Space launch data", "category": "Science", "link": "https://thespacedevs.com/llapi", "auth": "None"},
    {"name": "AstroBin", "description": "Astrophotography community", "category": "Science", "link": "https://www.astrobin.com/help/api/", "auth": "apiKey"},
    
    # Education
    {"name": "Open Library", "description": "Internet Archive book data", "category": "Books", "link": "https://openlibrary.org/developers/api", "auth": "None"},
    {"name": "Open Trivia Database", "description": "Trivia questions", "category": "Entertainment", "link": "https://opentdb.com/api_config.php", "auth": "None"},
    {"name": "Numbers API", "description": "Number facts", "category": "Education", "link": "http://numbersapi.com/", "auth": "None"},
    {"name": "Agify", "description": "Age prediction from name", "category": "Data", "link": "https://agify.io/", "auth": "None"},
    {"name": "Genderize", "description": "Gender prediction from name", "category": "Data", "link": "https://genderize.io/", "auth": "None"},
    {"name": "Nationalize", "description": "Nationality prediction from name", "category": "Data", "link": "https://nationalize.io/", "auth": "None"},
    {"name": "University Domains", "description": "University domains worldwide", "category": "Education", "link": "https://github.com/Hipo/university-domains-list", "auth": "None"},
    {"name": "Nobel Prize API", "description": "Nobel Prize laureates data", "category": "Education", "link": "https://www.nobelprize.org/about/developer-zone-2/", "auth": "None"},
    {"name": "Gutendex", "description": "Project Gutenberg books", "category": "Books", "link": "https://gutendex.com/", "auth": "None"},
    {"name": "Bible API", "description": "Bible verses and search", "category": "Books", "link": "https://bible-api.com/", "auth": "None"},
    
    # Food & Drink
    {"name": "Open Food Facts", "description": "Food products database", "category": "Food", "link": "https://world.openfoodfacts.org/data", "auth": "None"},
    {"name": "TheMealDB", "description": "Meal recipes database", "category": "Food", "link": "https://www.themealdb.com/api.php", "auth": "apiKey"},
    {"name": "TheCocktailDB", "description": "Cocktail recipes database", "category": "Food", "link": "https://www.thecocktaildb.com/api.php", "auth": "apiKey"},
    {"name": "Spoonacular", "description": "Food and recipe data", "category": "Food", "link": "https://spoonacular.com/food-api", "auth": "apiKey"},
    {"name": "Edamam Food", "description": "Nutrition analysis", "category": "Food", "link": "https://developer.edamam.com/", "auth": "apiKey"},
    {"name": "Nutritionix", "description": "Nutrition database", "category": "Food", "link": "https://developer.nutritionix.com/", "auth": "apiKey"},
    {"name": "PunkAPI", "description": "BrewDog beer recipes", "category": "Food", "link": "https://punkapi.com/documentation/v2", "auth": "None"},
    {"name": "Open Brewery DB", "description": "Breweries database", "category": "Food", "link": "https://www.openbrewerydb.org/", "auth": "None"},
    {"name": "WhiskyHunter", "description": "Whisky auction data", "category": "Food", "link": "https://whiskyhunter.net/api/", "auth": "None"},
    {"name": "Coffee API", "description": "Coffee brewing recipes", "category": "Food", "link": "https://coffee.alexflipnote.dev/", "auth": "None"},
    
    # Environment & Climate
    {"name": "AirVisual", "description": "Air quality data", "category": "Environment", "link": "https://www.iqair.com/air-pollution-data-api", "auth": "apiKey"},
    {"name": "OpenAQ", "description": "Air quality aggregated data", "category": "Environment", "link": "https://docs.openaq.org/", "auth": "None"},
    {"name": "Breezometer", "description": "Air quality, pollen, fires", "category": "Environment", "link": "https://docs.breezometer.com/", "auth": "apiKey"},
    {"name": "AQICN", "description": "Air quality index", "category": "Environment", "link": "https://aqicn.org/api/", "auth": "apiKey"},
    {"name": "Carbon Interface", "description": "Carbon footprint API", "category": "Environment", "link": "https://docs.carboninterface.com/", "auth": "apiKey"},
    {"name": "USGS Earthquake Hazards", "description": "Real-time earthquakes", "category": "Environment", "link": "https://earthquake.usgs.gov/fdsnws/event/1/", "auth": "None"},
    {"name": "Global Fishing Watch", "description": "Fishing activity data", "category": "Environment", "link": "https://globalfishingwatch.org/our-apis/", "auth": "apiKey"},
    {"name": "OceanCurrent", "description": "Ocean temperature data", "category": "Environment", "link": "https://imos.org.au/facilities/oceandata", "auth": "None"},
    {"name": "SunriseSunset.io", "description": "Sun position and times", "category": "Environment", "link": "https://sunrisesunset.io/api/", "auth": "None"},
    {"name": "UV Index", "description": "UV radiation data", "category": "Environment", "link": "https://www.openuv.io/", "auth": "apiKey"},
    
    # Business & Enterprise
    {"name": "Clearbit", "description": "Company and person data enrichment", "category": "Business", "link": "https://clearbit.com/docs", "auth": "apiKey"},
    {"name": "FullContact", "description": "Identity resolution API", "category": "Business", "link": "https://docs.fullcontact.com/", "auth": "apiKey"},
    {"name": "Hunter.io", "description": "Email finder", "category": "Business", "link": "https://hunter.io/api-documentation/v2", "auth": "apiKey"},
    {"name": "Lob", "description": "Direct mail printing", "category": "Business", "link": "https://docs.lob.com/", "auth": "apiKey"},
    {"name": "Abstract Company Enrichment", "description": "Company data lookup", "category": "Business", "link": "https://www.abstractapi.com/api/company-enrichment", "auth": "apiKey"},
    {"name": "People Data Labs", "description": "Person and company data", "category": "Business", "link": "https://docs.peopledatalabs.com/", "auth": "apiKey"},
    {"name": "ZoomInfo", "description": "B2B data platform", "category": "Business", "link": "https://www.zoominfo.com/solutions/api", "auth": "apiKey"},
    {"name": "RocketReach", "description": "Professional contact data", "category": "Business", "link": "https://rocketreach.co/api", "auth": "apiKey"},
    {"name": "Crunchbase", "description": "Startup and funding data", "category": "Business", "link": "https://data.crunchbase.com/docs", "auth": "apiKey"},
    {"name": "AngelList", "description": "Startup ecosystem data", "category": "Business", "link": "https://angel.co/api", "auth": "OAuth"},
    
    # Jobs & Career
    {"name": "Adzuna", "description": "Job search API", "category": "Jobs", "link": "https://developer.adzuna.com/", "auth": "apiKey"},
    {"name": "Careerjet", "description": "Job listings search", "category": "Jobs", "link": "https://www.careerjet.com/partners/api/", "auth": "apiKey"},
    {"name": "Jooble", "description": "Job search aggregator", "category": "Jobs", "link": "https://jooble.org/api/about", "auth": "apiKey"},
    {"name": "Reed.co.uk", "description": "UK job listings", "category": "Jobs", "link": "https://www.reed.co.uk/developers", "auth": "apiKey"},
    {"name": "The Muse", "description": "Job listings and company profiles", "category": "Jobs", "link": "https://www.themuse.com/developers/api/v2", "auth": "apiKey"},
    {"name": "Remotive", "description": "Remote jobs", "category": "Jobs", "link": "https://remotive.io/api-documentation", "auth": "None"},
    {"name": "Working Nomads", "description": "Remote job listings", "category": "Jobs", "link": "https://www.workingnomads.co/api/exposed_jobs/", "auth": "None"},
    {"name": "Arbeitnow", "description": "Free job board API", "category": "Jobs", "link": "https://www.arbeitnow.com/api", "auth": "None"},
    {"name": "FindWork", "description": "Software jobs", "category": "Jobs", "link": "https://findwork.dev/developers/", "auth": "apiKey"},
    {"name": "JSearch", "description": "Job listings API", "category": "Jobs", "link": "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch", "auth": "apiKey"},
    
    # Sports & Fitness
    {"name": "API-Football", "description": "Football/Soccer data", "category": "Sports", "link": "https://www.api-football.com/documentation-v3", "auth": "apiKey"},
    {"name": "API-NBA", "description": "NBA statistics", "category": "Sports", "link": "https://www.api-basketball.com/documentation", "auth": "apiKey"},
    {"name": "Balldontlie", "description": "NBA data", "category": "Sports", "link": "https://www.balldontlie.io/", "auth": "None"},
    {"name": "ESPN API", "description": "Sports scores and news", "category": "Sports", "link": "https://developer.espn.com/", "auth": "apiKey"},
    {"name": "Football-Data.org", "description": "European football data", "category": "Sports", "link": "https://www.football-data.org/documentation/quickstart", "auth": "apiKey"},
    {"name": "MLB Stats", "description": "Major League Baseball data", "category": "Sports", "link": "https://statsapi.mlb.com/docs/", "auth": "None"},
    {"name": "NHL API", "description": "National Hockey League data", "category": "Sports", "link": "https://gitlab.com/dword4/nhlapi", "auth": "None"},
    {"name": "SportsDB", "description": "Sports events and results", "category": "Sports", "link": "https://www.thesportsdb.com/free_sports_api", "auth": "apiKey"},
    {"name": "Strava", "description": "Fitness tracking data", "category": "Sports", "link": "https://developers.strava.com/docs/reference/", "auth": "OAuth"},
    {"name": "Wger Workout Manager", "description": "Workout and exercise data", "category": "Sports", "link": "https://wger.de/en/software/api", "auth": "None"},
    
    # Communication
    {"name": "Discord API", "description": "Discord bot and app integration", "category": "Communication", "link": "https://discord.com/developers/docs/intro", "auth": "OAuth"},
    {"name": "Slack API", "description": "Slack workspace integration", "category": "Communication", "link": "https://api.slack.com/", "auth": "OAuth"},
    {"name": "Telegram Bot API", "description": "Telegram bot creation", "category": "Communication", "link": "https://core.telegram.org/bots/api", "auth": "apiKey"},
    {"name": "Matrix", "description": "Decentralized communication", "category": "Communication", "link": "https://matrix.org/docs/api/", "auth": "OAuth"},
    {"name": "Zulip API", "description": "Zulip chat integration", "category": "Communication", "link": "https://zulip.com/api/", "auth": "apiKey"},
    {"name": "Rocket.Chat API", "description": "Rocket.Chat integration", "category": "Communication", "link": "https://developer.rocket.chat/reference/api", "auth": "apiKey"},
    {"name": "Gitter API", "description": "Developer chat rooms", "category": "Communication", "link": "https://developer.gitter.im/docs/", "auth": "OAuth"},
    {"name": "LINE Messaging", "description": "LINE messenger API", "category": "Communication", "link": "https://developers.line.biz/en/docs/messaging-api/", "auth": "apiKey"},
    {"name": "WhatsApp Business", "description": "WhatsApp business messaging", "category": "Communication", "link": "https://developers.facebook.com/docs/whatsapp/", "auth": "apiKey"},
    {"name": "Zoom API", "description": "Zoom video conferencing", "category": "Communication", "link": "https://marketplace.zoom.us/docs/api-reference/zoom-api", "auth": "OAuth"},
    
    # Development Tools
    {"name": "GitHub API", "description": "GitHub repository and user data", "category": "Development", "link": "https://docs.github.com/en/rest", "auth": "OAuth"},
    {"name": "GitLab API", "description": "GitLab integration", "category": "Development", "link": "https://docs.gitlab.com/ee/api/", "auth": "apiKey"},
    {"name": "Bitbucket API", "description": "Bitbucket repository API", "category": "Development", "link": "https://developer.atlassian.com/bitbucket/api/2/reference/", "auth": "OAuth"},
    {"name": "npm Registry", "description": "npm package data", "category": "Development", "link": "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md", "auth": "None"},
    {"name": "Packagist", "description": "PHP package data", "category": "Development", "link": "https://packagist.org/apidoc", "auth": "None"},
    {"name": "PyPI", "description": "Python package index", "category": "Development", "link": "https://warehouse.pypa.io/api-reference/", "auth": "None"},
    {"name": "RubyGems", "description": "Ruby gems data", "category": "Development", "link": "https://guides.rubygems.org/rubygems-org-api/", "auth": "None"},
    {"name": "Crates.io", "description": "Rust packages", "category": "Development", "link": "https://crates.io/data-access", "auth": "None"},
    {"name": "Libraries.io", "description": "Package monitoring", "category": "Development", "link": "https://libraries.io/api", "auth": "apiKey"},
    {"name": "Snyk Vulnerability DB", "description": "Security vulnerabilities", "category": "Security", "link": "https://snyk.io/api/", "auth": "apiKey"},
    
    # Gaming
    {"name": "Steam Web API", "description": "Steam games and users", "category": "Games", "link": "https://developer.valvesoftware.com/wiki/Steam_Web_API", "auth": "apiKey"},
    {"name": "RAWG", "description": "Video games database", "category": "Games", "link": "https://rawg.io/apidocs", "auth": "apiKey"},
    {"name": "IGDB", "description": "Video game database", "category": "Games", "link": "https://api-docs.igdb.com/", "auth": "apiKey"},
    {"name": "CheapShark", "description": "Game deal prices", "category": "Games", "link": "https://apidocs.cheapshark.com/", "auth": "None"},
    {"name": "Fortnite API", "description": "Fortnite game data", "category": "Games", "link": "https://fortnite-api.com/", "auth": "None"},
    {"name": "Hytale API", "description": "Hytale game news", "category": "Games", "link": "https://hytale-api.com/", "auth": "None"},
    {"name": "OSRS API", "description": "Old School RuneScape", "category": "Games", "link": "https://oldschool.runescape.wiki/w/API", "auth": "None"},
    {"name": "Pokémon TCG API", "description": "Pokémon Trading Card Game", "category": "Games", "link": "https://pokemontcg.io/", "auth": "None"},
    {"name": "Magic: The Gathering", "description": "MTG card database", "category": "Games", "link": "https://docs.magicthegathering.io/", "auth": "None"},
    {"name": "Yu-Gi-Oh! API", "description": "Yu-Gi-Oh! card database", "category": "Games", "link": "https://db.ygoprodeck.com/api-guide/", "auth": "None"},
    
    # Real Estate
    {"name": "Zillow", "description": "Real estate data", "category": "Real Estate", "link": "https://www.zillow.com/howto/api/APIOverview.htm", "auth": "apiKey"},
    {"name": "Realtor.com", "description": "Property listings", "category": "Real Estate", "link": "https://www.realtor.com/api", "auth": "apiKey"},
    {"name": "Redfin", "description": "Home price estimates", "category": "Real Estate", "link": "https://www.redfin.com/", "auth": "None"},
    {"name": "Estated", "description": "Property data API", "category": "Real Estate", "link": "https://estated.com/developers/docs", "auth": "apiKey"},
    {"name": "HouseCanary", "description": "Residential property data", "category": "Real Estate", "link": "https://api-docs.housecanary.com/", "auth": "apiKey"},
    {"name": "Attom Data", "description": "Property and real estate data", "category": "Real Estate", "link": "https://api.developer.attomdata.com/", "auth": "apiKey"},
    {"name": "Mashvisor", "description": "Real estate investment data", "category": "Real Estate", "link": "https://mashvisor.com/api", "auth": "apiKey"},
    {"name": "Rentberry", "description": "Rental property data", "category": "Real Estate", "link": "https://rentberry.com/api", "auth": "apiKey"},
    {"name": "Walk Score", "description": "Walkability and transit scores", "category": "Real Estate", "link": "https://www.walkscore.com/professional/api.php", "auth": "apiKey"},
    {"name": "Precisely", "description": "Property boundaries", "category": "Real Estate", "link": "https://developer.precisely.com/", "auth": "apiKey"},
    
    # E-commerce
    {"name": "Shopify Admin API", "description": "Shopify store management", "category": "E-commerce", "link": "https://shopify.dev/api/admin-rest", "auth": "OAuth"},
    {"name": "WooCommerce", "description": "WooCommerce store API", "category": "E-commerce", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "auth": "OAuth"},
    {"name": "BigCommerce", "description": "BigCommerce store API", "category": "E-commerce", "link": "https://developer.bigcommerce.com/api-docs", "auth": "OAuth"},
    {"name": "Magento", "description": "Magento e-commerce API", "category": "E-commerce", "link": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html", "auth": "OAuth"},
    {"name": "PrestaShop", "description": "PrestaShop webservice", "category": "E-commerce", "link": "https://devdocs.prestashop.com/1.7/webservice/", "auth": "apiKey"},
    {"name": "Saleor", "description": "Headless commerce GraphQL", "category": "E-commerce", "link": "https://docs.saleor.io/docs/3.x/api-reference/", "auth": "apiKey"},
    {"name": "Medusa", "description": "Open source headless commerce", "category": "E-commerce", "link": "https://docs.medusajs.com/api/", "auth": "apiKey"},
    {"name": "Printful", "description": "Print-on-demand fulfillment", "category": "E-commerce", "link": "https://developers.printful.com/docs/", "auth": "apiKey"},
    {"name": "Shippo", "description": "Shipping rates and labels", "category": "E-commerce", "link": "https://goshippo.com/docs/intro/", "auth": "apiKey"},
    {"name": "EasyPost", "description": "Shipping API", "category": "E-commerce", "link": "https://www.easypost.com/docs/api", "auth": "apiKey"},
    
    # Utilities
    {"name": "IP-API", "description": "IP geolocation", "category": "Utilities", "link": "https://ip-api.com/docs/", "auth": "None"},
    {"name": "IPinfo", "description": "IP address data", "category": "Utilities", "link": "https://ipinfo.io/developers", "auth": "apiKey"},
    {"name": "IPify", "description": "Public IP address", "category": "Utilities", "link": "https://www.ipify.org/", "auth": "None"},
    {"name": "ipstack", "description": "IP geolocation API", "category": "Utilities", "link": "https://ipstack.com/documentation", "auth": "apiKey"},
    {"name": "Abstract IP Geolocation", "description": "IP to location", "category": "Utilities", "link": "https://www.abstractapi.com/ip-geolocation-api", "auth": "apiKey"},
    {"name": "WhoisXML", "description": "Domain WHOIS data", "category": "Utilities", "link": "https://www.whoisxmlapi.com/", "auth": "apiKey"},
    {"name": "URL Shortener API", "description": "Shorten URLs", "category": "Utilities", "link": "https://t.ly/docs", "auth": "apiKey"},
    {"name": "QR Code Generator", "description": "Generate QR codes", "category": "Utilities", "link": "http://goqr.me/api/", "auth": "None"},
    {"name": "CountAPI", "description": "Simple counting service", "category": "Utilities", "link": "https://countapi.xyz/", "auth": "None"},
    {"name": "ZipCodeAPI", "description": "US zip code data", "category": "Utilities", "link": "https://www.zipcodeapi.com/", "auth": "apiKey"},
    
    # AI/ML Additional
    {"name": "OpenAI", "description": "GPT and DALL-E APIs", "category": "AI/ML", "link": "https://platform.openai.com/docs/api-reference", "auth": "apiKey"},
    {"name": "Anthropic Claude", "description": "Claude AI API", "category": "AI/ML", "link": "https://docs.anthropic.com/claude/reference/getting-started-with-the-api", "auth": "apiKey"},
    {"name": "Cohere", "description": "NLP and embeddings", "category": "AI/ML", "link": "https://docs.cohere.com/", "auth": "apiKey"},
    {"name": "Hugging Face", "description": "ML models hub", "category": "AI/ML", "link": "https://huggingface.co/docs/api-inference/index", "auth": "apiKey"},
    {"name": "Replicate", "description": "Run ML models", "category": "AI/ML", "link": "https://replicate.com/docs", "auth": "apiKey"},
    {"name": "Stability AI", "description": "Stable Diffusion API", "category": "AI/ML", "link": "https://platform.stability.ai/docs/api-reference", "auth": "apiKey"},
    {"name": "DeepL", "description": "Translation API", "category": "AI/ML", "link": "https://www.deepl.com/docs-api", "auth": "apiKey"},
    {"name": "AssemblyAI", "description": "Speech-to-text", "category": "AI/ML", "link": "https://www.assemblyai.com/docs/", "auth": "apiKey"},
    {"name": "Deepgram", "description": "Speech recognition", "category": "AI/ML", "link": "https://developers.deepgram.com/", "auth": "apiKey"},
    {"name": "ElevenLabs", "description": "Text-to-speech AI", "category": "AI/ML", "link": "https://elevenlabs.io/docs/api-reference/", "auth": "apiKey"},
]

def main():
    # Load existing registry to check for duplicates
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    existing_names = {api['name'].lower() for api in registry['apis']}
    existing_ids = {api['id'] for api in registry['apis']}
    
    print(f"Existing APIs in registry: {len(registry['apis'])}")
    
    # Collect new unique APIs
    new_apis = []
    
    for api in EXTRA_APIS:
        name_lower = api['name'].lower()
        api_id = generate_id(api['name'])
        
        if name_lower in existing_names or api_id in existing_ids:
            continue
        
        new_apis.append({
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api['category'],
            "link": api['link'],
            "auth": api['auth']
        })
        existing_names.add(name_lower)
        existing_ids.add(api_id)
    
    print(f"New unique APIs to add: {len(new_apis)}")
    
    # Save to output
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(new_apis, f, indent=2)
    
    print(f"Saved to {OUTPUT_PATH}")
    
    return new_apis

if __name__ == "__main__":
    apis = main()
    print(f"\nReady to merge {len(apis)} APIs")
