#!/usr/bin/env python3
"""
APIClaw Natt-Expansion v2 - Parse public-apis README and add missing APIs
"""

import json
import re
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    """Generate clean ID from name"""
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

# Additional APIs parsed from public-apis README and other sources
# Focus on APIs NOT already in our registry
ADDITIONAL_APIS = [
    # === ANIMALS ===
    {"name": "Axolotl API", "description": "Collection of axolotl pictures and facts", "category": "Animals", "link": "https://theaxolotlapi.netlify.app/", "auth": "None"},
    {"name": "Cat Facts API", "description": "Daily cat facts", "category": "Animals", "link": "https://alexwohlbruck.github.io/cat-facts/", "auth": "None"},
    {"name": "Dog Facts API", "description": "Random dog facts", "category": "Animals", "link": "https://dukengn.github.io/Dog-facts-API/", "auth": "None"},
    {"name": "eBird API", "description": "Retrieve recent or notable birding observations within a region", "category": "Animals", "link": "https://documenter.getpostman.com/view/664302/S1ENwy59", "auth": "apiKey"},
    {"name": "FishWatch API", "description": "Information and pictures about individual fish species", "category": "Animals", "link": "https://www.fishwatch.gov/developers", "auth": "None"},
    {"name": "HTTP Cat", "description": "Cat for every HTTP Status", "category": "Entertainment", "link": "https://http.cat/", "auth": "None"},
    {"name": "HTTP Dog", "description": "Dogs for every HTTP response status code", "category": "Entertainment", "link": "https://http.dog/", "auth": "None"},
    {"name": "IUCN Red List", "description": "IUCN Red List of Threatened Species", "category": "Science", "link": "http://apiv3.iucnredlist.org/api/v3/docs", "auth": "apiKey"},
    {"name": "MeowFacts", "description": "Get random cat facts", "category": "Animals", "link": "https://github.com/wh-iterabb-it/meowfacts", "auth": "None"},
    {"name": "Movebank API", "description": "Movement and Migration data of animals", "category": "Science", "link": "https://github.com/movebank/movebank-api-doc", "auth": "None"},
    {"name": "PlaceBear", "description": "Placeholder bear pictures", "category": "Design", "link": "https://placebear.com/", "auth": "None"},
    {"name": "PlaceDog", "description": "Placeholder Dog pictures", "category": "Design", "link": "https://place.dog", "auth": "None"},
    {"name": "PlaceKitten", "description": "Placeholder Kitten pictures", "category": "Design", "link": "https://placekitten.com/", "auth": "None"},
    {"name": "RandomDog", "description": "Random pictures of dogs", "category": "Entertainment", "link": "https://random.dog/woof.json", "auth": "None"},
    {"name": "RandomDuck", "description": "Random pictures of ducks", "category": "Entertainment", "link": "https://random-d.uk/api", "auth": "None"},
    {"name": "RandomFox", "description": "Random pictures of foxes", "category": "Entertainment", "link": "https://randomfox.ca/floof/", "auth": "None"},
    {"name": "RescueGroups", "description": "Pet adoption data", "category": "Animals", "link": "https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home", "auth": "None"},
    {"name": "Shibe.Online", "description": "Random pictures of Shiba Inu, cats or birds", "category": "Entertainment", "link": "http://shibe.online/", "auth": "None"},
    {"name": "xeno-canto", "description": "Bird recordings", "category": "Science", "link": "https://xeno-canto.org/explore/api", "auth": "None"},
    {"name": "Zoo Animals API", "description": "Facts and pictures of zoo animals", "category": "Animals", "link": "https://zoo-animal-api.herokuapp.com/", "auth": "None"},
    
    # === ANIME ===
    {"name": "AniAPI", "description": "Anime discovery, streaming & syncing with trackers", "category": "Entertainment", "link": "https://aniapi.com/docs/", "auth": "OAuth"},
    {"name": "AniDB", "description": "Anime Database", "category": "Entertainment", "link": "https://wiki.anidb.net/HTTP_API_Definition", "auth": "apiKey"},
    {"name": "AnimeChan", "description": "Anime quotes (over 10k+)", "category": "Entertainment", "link": "https://github.com/RocktimSaikia/anime-chan", "auth": "None"},
    {"name": "AnimeFacts", "description": "Anime Facts (over 100+)", "category": "Entertainment", "link": "https://chandan-02.github.io/anime-facts-rest-api/", "auth": "None"},
    {"name": "AnimeNewsNetwork", "description": "Anime industry news", "category": "News", "link": "https://www.animenewsnetwork.com/encyclopedia/api.php", "auth": "None"},
    {"name": "Catboy API", "description": "Neko images, funny GIFs & more", "category": "Entertainment", "link": "https://catboys.com/api", "auth": "None"},
    {"name": "Danbooru Anime", "description": "Thousands of anime artist database to find good anime art", "category": "Entertainment", "link": "https://danbooru.donmai.us/wiki_pages/help:api", "auth": "apiKey"},
    {"name": "MangaDex", "description": "Manga Database and Community", "category": "Entertainment", "link": "https://api.mangadex.org/docs.html", "auth": "apiKey"},
    {"name": "NekosBest", "description": "Neko Images & Anime roleplaying GIFs", "category": "Entertainment", "link": "https://docs.nekos.best", "auth": "None"},
    {"name": "Shikimori", "description": "Anime discovery, tracking, forum, rates", "category": "Entertainment", "link": "https://shikimori.one/api/doc", "auth": "OAuth"},
    {"name": "Trace Moe", "description": "Get the exact scene of an anime from a screenshot", "category": "AI/ML", "link": "https://soruly.github.io/trace.moe-api/#/", "auth": "None"},
    {"name": "Waifu.im", "description": "Get waifu pictures from an archive of over 4000 images", "category": "Entertainment", "link": "https://waifu.im/docs", "auth": "None"},
    {"name": "Waifu.pics", "description": "Image sharing platform for anime images", "category": "Entertainment", "link": "https://waifu.pics/docs", "auth": "None"},
    
    # === ANTI-MALWARE / SECURITY ===
    {"name": "AbuseIPDB", "description": "IP/domain/URL reputation", "category": "Security", "link": "https://docs.abuseipdb.com/", "auth": "apiKey"},
    {"name": "AlienVault OTX", "description": "IP/domain/URL reputation", "category": "Security", "link": "https://otx.alienvault.com/api", "auth": "apiKey"},
    {"name": "CAPEsandbox", "description": "Malware execution and analysis", "category": "Security", "link": "https://capev2.readthedocs.io/en/latest/usage/api.html", "auth": "apiKey"},
    {"name": "MalDatabase", "description": "Provide malware datasets and threat intelligence feeds", "category": "Security", "link": "https://maldatabase.com/api-doc.html", "auth": "apiKey"},
    {"name": "MalShare", "description": "Malware Archive / file sourcing", "category": "Security", "link": "https://malshare.com/doc.php", "auth": "apiKey"},
    {"name": "MalwareBazaar", "description": "Collect and share malware samples", "category": "Security", "link": "https://bazaar.abuse.ch/api/", "auth": "apiKey"},
    {"name": "NoPhishy", "description": "Check links to see if they're known phishing attempts", "category": "Security", "link": "https://rapidapi.com/Amiichu/api/exerra-phishing-check/", "auth": "apiKey"},
    {"name": "Phisherman", "description": "IP/domain/URL reputation for phishing detection", "category": "Security", "link": "https://phisherman.gg/", "auth": "apiKey"},
    {"name": "Scanii", "description": "Scan documents/files for the presence of threats", "category": "Security", "link": "https://docs.scanii.com/", "auth": "apiKey"},
    {"name": "URLhaus", "description": "Bulk queries and Download Malware Samples", "category": "Security", "link": "https://urlhaus-api.abuse.ch/", "auth": "None"},
    {"name": "URLScan.io", "description": "Scan and Analyse URLs", "category": "Security", "link": "https://urlscan.io/about-api/", "auth": "apiKey"},
    {"name": "Web of Trust API", "description": "IP/domain/URL reputation", "category": "Security", "link": "https://support.mywot.com/hc/en-us/sections/360004477734-API-", "auth": "apiKey"},
    
    # === ART & DESIGN ===
    {"name": "Améthyste API", "description": "Generate images for Discord users", "category": "Design", "link": "https://api.amethyste.moe/", "auth": "apiKey"},
    {"name": "Colormind", "description": "Color scheme generator", "category": "Design", "link": "http://colormind.io/api-access/", "auth": "None"},
    {"name": "ColourLovers", "description": "Get various patterns, palettes and images", "category": "Design", "link": "http://www.colourlovers.com/api", "auth": "None"},
    {"name": "Cooper Hewitt", "description": "Smithsonian Design Museum", "category": "Content", "link": "https://collection.cooperhewitt.org/api", "auth": "apiKey"},
    {"name": "EmojiHub", "description": "Get emojis by categories and groups", "category": "Content", "link": "https://github.com/cheatsnake/emojihub", "auth": "None"},
    {"name": "Europeana", "description": "European Museum and Galleries content", "category": "Content", "link": "https://pro.europeana.eu/resources/apis/search", "auth": "apiKey"},
    {"name": "Harvard Art Museums", "description": "Art from Harvard", "category": "Content", "link": "https://github.com/harvardartmuseums/api-docs", "auth": "apiKey"},
    {"name": "Lordicon", "description": "Icons with predone Animations", "category": "Design", "link": "https://lordicon.com/", "auth": "None"},
    {"name": "Metropolitan Museum of Art", "description": "Met Museum of Art data", "category": "Content", "link": "https://metmuseum.github.io/", "auth": "None"},
    {"name": "Noun Project", "description": "Icons", "category": "Design", "link": "http://api.thenounproject.com/index.html", "auth": "OAuth"},
    {"name": "Pixel Encounter", "description": "SVG Icon Generator", "category": "Design", "link": "https://pixelencounter.com/api", "auth": "None"},
    {"name": "Rijksmuseum", "description": "RijksMuseum Data", "category": "Content", "link": "https://data.rijksmuseum.nl/object-metadata/api/", "auth": "apiKey"},
    {"name": "Word Cloud API", "description": "Easily create word clouds", "category": "Design", "link": "https://wordcloudapi.com/", "auth": "apiKey"},
    {"name": "xColors", "description": "Generate & convert colors", "category": "Design", "link": "https://x-colors.herokuapp.com/", "auth": "None"},
    
    # === AUTHENTICATION ===
    {"name": "GetOTP", "description": "Implement OTP flow quickly", "category": "Security", "link": "https://otp.dev/en/docs/", "auth": "apiKey"},
    {"name": "Micro User Service", "description": "User management and authentication", "category": "Security", "link": "https://m3o.com/user", "auth": "apiKey"},
    {"name": "MojoAuth", "description": "Secure and modern passwordless authentication platform", "category": "Security", "link": "https://mojoauth.com", "auth": "apiKey"},
    {"name": "SAWO Labs", "description": "Simplify login and improve user experience by integrating passwordless authentication", "category": "Security", "link": "https://sawolabs.com", "auth": "apiKey"},
    {"name": "Stytch", "description": "User infrastructure for modern applications", "category": "Security", "link": "https://stytch.com/", "auth": "apiKey"},
    {"name": "Warrant", "description": "APIs for authorization and access control", "category": "Security", "link": "https://warrant.dev/", "auth": "apiKey"},
    
    # === BLOCKCHAIN ===
    {"name": "Bitquery", "description": "Onchain GraphQL APIs & DEX APIs", "category": "Finance", "link": "https://graphql.bitquery.io/ide", "auth": "apiKey"},
    {"name": "Chainlink", "description": "Build hybrid smart contracts with Chainlink", "category": "Finance", "link": "https://chain.link/developer-resources", "auth": "None"},
    {"name": "Chainpoint", "description": "Anchoring data to the Bitcoin blockchain", "category": "Finance", "link": "https://tierion.com/chainpoint/", "auth": "None"},
    {"name": "Etherscan", "description": "Ethereum explorer API", "category": "Finance", "link": "https://etherscan.io/apis", "auth": "apiKey"},
    {"name": "Helium Blockchain", "description": "Helium network data for IoT Hotspots", "category": "IoT", "link": "https://docs.helium.com/api/blockchain/introduction/", "auth": "None"},
    {"name": "Nownodes", "description": "Blockchain-as-a-service solution", "category": "Finance", "link": "https://nownodes.io/", "auth": "apiKey"},
    {"name": "The Graph", "description": "Indexing protocol for querying networks like Ethereum with GraphQL", "category": "Finance", "link": "https://thegraph.com", "auth": "apiKey"},
    {"name": "Walltime", "description": "Retrieve Walltime's market info", "category": "Finance", "link": "https://walltime.info/api.html", "auth": "None"},
    {"name": "Watchdata", "description": "Simple and reliable API access to Ethereum blockchain", "category": "Finance", "link": "https://docs.watchdata.io", "auth": "apiKey"},
    
    # === BOOKS ===
    {"name": "A Bíblia Digital", "description": "Multiple versions of the Bible", "category": "Content", "link": "https://www.abibliadigital.com.br/en", "auth": "apiKey"},
    {"name": "Bhagavad Gita API", "description": "Open Source Shrimad Bhagavad Gita API", "category": "Content", "link": "https://docs.bhagavadgitaapi.in", "auth": "apiKey"},
    {"name": "British National Bibliography", "description": "Books data from BNB", "category": "Content", "link": "http://bnb.data.bl.uk/", "auth": "None"},
    {"name": "Crossref Metadata", "description": "Books & Articles Metadata", "category": "Content", "link": "https://github.com/CrossRef/rest-api-doc", "auth": "None"},
    {"name": "Ganjoor", "description": "Classic Persian poetry works", "category": "Content", "link": "https://api.ganjoor.net", "auth": "OAuth"},
    {"name": "GurbaniNow", "description": "Fast and Accurate Gurbani RESTful API", "category": "Content", "link": "https://github.com/GurbaniNow/api", "auth": "None"},
    {"name": "Gutendex", "description": "Web-API for fetching data from Project Gutenberg Books Library", "category": "Content", "link": "https://gutendex.com/", "auth": "None"},
    {"name": "Penguin Publishing", "description": "Books, book covers and related data", "category": "Content", "link": "http://www.penguinrandomhouse.biz/webservices/rest/", "auth": "None"},
    {"name": "PoetryDB", "description": "Poetry collection API", "category": "Content", "link": "https://github.com/thundercomb/poetrydb#readme", "auth": "None"},
    {"name": "Quran Cloud", "description": "A RESTful Quran API to retrieve an Ayah, Surah, Juz", "category": "Content", "link": "https://alquran.cloud/api", "auth": "None"},
    {"name": "Rig Veda", "description": "Gods and poets, their categories, and the verse meters", "category": "Content", "link": "https://aninditabasu.github.io/indica/html/rv.html", "auth": "None"},
    {"name": "The Bible API", "description": "Everything you need from the Bible in one discoverable place", "category": "Content", "link": "https://docs.api.bible", "auth": "apiKey"},
    {"name": "Thirukkural", "description": "1330 Thirukkural poems and explanation in Tamil and English", "category": "Content", "link": "https://api-thirukkural.web.app/", "auth": "None"},
    {"name": "Vedic Society", "description": "Descriptions of all nouns from vedic literature", "category": "Content", "link": "https://aninditabasu.github.io/indica/html/vs.html", "auth": "None"},
    {"name": "Wizard World API", "description": "Get information from the Harry Potter universe", "category": "Entertainment", "link": "https://wizard-world-api.herokuapp.com/swagger/index.html", "auth": "None"},
    {"name": "Wolne Lektury", "description": "E-books from WolneLektury.pl", "category": "Content", "link": "https://wolnelektury.pl/api/", "auth": "None"},
    
    # === BUSINESS ===
    {"name": "Apache Superset", "description": "API to manage your BI dashboards and data sources", "category": "Business", "link": "https://superset.apache.org/docs/api", "auth": "apiKey"},
    {"name": "Charity Search", "description": "Non-profit charity data", "category": "Business", "link": "http://charityapi.orghunter.com/", "auth": "apiKey"},
    {"name": "Clearbit Logo", "description": "Search for company logos and embed them in your projects", "category": "Business", "link": "https://clearbit.com/docs#logo-api", "auth": "apiKey"},
    {"name": "Instatus", "description": "Post to and update maintenance and incidents on your status page", "category": "Business", "link": "https://instatus.com/help/api", "auth": "apiKey"},
    {"name": "markerapi", "description": "Trademark Search", "category": "Business", "link": "https://markerapi.com", "auth": "None"},
    {"name": "ORB Intelligence", "description": "Company lookup", "category": "Business", "link": "https://api.orb-intelligence.com/docs/", "auth": "apiKey"},
    {"name": "Redash", "description": "Access your queries and dashboards on Redash", "category": "Business", "link": "https://redash.io/help/user-guide/integrations-and-api/api", "auth": "apiKey"},
    {"name": "Smartsheet API", "description": "Programmatically access Smartsheet data", "category": "Business", "link": "https://smartsheet.redoc.ly/", "auth": "OAuth"},
    {"name": "SwiftKanban", "description": "Kanban software, Visualize Work", "category": "Business", "link": "https://www.digite.com/knowledge-base/swiftkanban/article/api-for-swift-kanban-web-services/#restapi", "auth": "apiKey"},
    {"name": "Tenders Hungary", "description": "Procurements in Hungary in JSON format", "category": "Business", "link": "https://tenders.guru/hu/api", "auth": "None"},
    {"name": "Tenders Poland", "description": "Procurements in Poland in JSON format", "category": "Business", "link": "https://tenders.guru/pl/api", "auth": "None"},
    {"name": "Tenders Romania", "description": "Procurements in Romania in JSON format", "category": "Business", "link": "https://tenders.guru/ro/api", "auth": "None"},
    {"name": "Tenders Spain", "description": "Procurements in Spain in JSON format", "category": "Business", "link": "https://tenders.guru/es/api", "auth": "None"},
    {"name": "Tenders Ukraine", "description": "Procurements in Ukraine in JSON format", "category": "Business", "link": "https://tenders.guru/ua/api", "auth": "None"},
    {"name": "Tomba Email Finder", "description": "Email Finder for B2B sales and email marketing", "category": "Business", "link": "https://tomba.io/api", "auth": "apiKey"},
    
    # === CALENDAR ===
    {"name": "Abstract Public Holidays", "description": "Data on national, regional, and religious holidays via API", "category": "Utilities", "link": "https://www.abstractapi.com/holidays-api", "auth": "apiKey"},
    {"name": "Calendarific", "description": "Worldwide Holidays", "category": "Utilities", "link": "https://calendarific.com/", "auth": "apiKey"},
    {"name": "Church Calendar", "description": "Catholic liturgical calendar", "category": "Utilities", "link": "http://calapi.inadiutorium.cz/", "auth": "None"},
    {"name": "Czech Namedays", "description": "Lookup for a name and returns nameday date", "category": "Utilities", "link": "https://svatky.adresa.info", "auth": "None"},
    {"name": "Festivo Public Holidays", "description": "Fastest public holiday and observance service", "category": "Utilities", "link": "https://docs.getfestivo.com/docs/products/public-holidays-api/intro", "auth": "apiKey"},
    {"name": "Hebrew Calendar", "description": "Convert between Gregorian and Hebrew, fetch Shabbat and Holiday times", "category": "Utilities", "link": "https://www.hebcal.com/home/developer-apis", "auth": "None"},
    {"name": "LectServe", "description": "Protestant liturgical calendar", "category": "Utilities", "link": "http://www.lectserve.com", "auth": "None"},
    {"name": "Nager.Date", "description": "Public holidays for more than 90 countries", "category": "Utilities", "link": "https://date.nager.at", "auth": "None"},
    {"name": "Namedays Calendar", "description": "Provides namedays for multiple countries", "category": "Utilities", "link": "https://nameday.abalin.net", "auth": "None"},
    {"name": "Non-Working Days ICS", "description": "Database of ICS files for non working days", "category": "Utilities", "link": "https://github.com/gadael/icsdb", "auth": "None"},
    {"name": "Russian Calendar", "description": "Check if a date is a Russian holiday or not", "category": "Utilities", "link": "https://github.com/egno/work-calendar", "auth": "None"},
    {"name": "UK Bank Holidays", "description": "Bank holidays in England and Wales, Scotland and Northern Ireland", "category": "Utilities", "link": "https://www.gov.uk/bank-holidays.json", "auth": "None"},
    
    # === CLOUD STORAGE ===
    {"name": "AnonFiles", "description": "Upload and share your files anonymously", "category": "Cloud Storage", "link": "https://anonfiles.com/docs/api", "auth": "None"},
    {"name": "BayFiles", "description": "Upload and share your files", "category": "Cloud Storage", "link": "https://bayfiles.com/docs/api", "auth": "None"},
    {"name": "ddownload", "description": "File Sharing and Storage", "category": "Cloud Storage", "link": "https://ddownload.com/api", "auth": "apiKey"},
    {"name": "File.io", "description": "Super simple file sharing, convenient, anonymous and secure", "category": "Cloud Storage", "link": "https://www.file.io", "auth": "None"},
    {"name": "GoFile", "description": "Unlimited size file uploads for free", "category": "Cloud Storage", "link": "https://gofile.io/api", "auth": "apiKey"},
    {"name": "Imgbb", "description": "Simple and quick private image sharing", "category": "Cloud Storage", "link": "https://api.imgbb.com/", "auth": "apiKey"},
    {"name": "Pantry", "description": "Free JSON storage for small projects", "category": "Cloud Storage", "link": "https://getpantry.cloud/", "auth": "None"},
    {"name": "Pinata IPFS", "description": "IPFS Pinning Services API", "category": "Cloud Storage", "link": "https://docs.pinata.cloud/", "auth": "apiKey"},
    {"name": "Quip", "description": "File Sharing and Storage for groups", "category": "Cloud Storage", "link": "https://quip.com/dev/automation/documentation", "auth": "apiKey"},
    {"name": "Storj", "description": "Decentralized Open-Source Cloud Storage", "category": "Cloud Storage", "link": "https://docs.storj.io/dcs/", "auth": "apiKey"},
    {"name": "The Null Pointer", "description": "No-bullshit file hosting and URL shortening service", "category": "Cloud Storage", "link": "https://0x0.st", "auth": "None"},
    {"name": "Web3 Storage", "description": "File Sharing and Storage with 1TB Space", "category": "Cloud Storage", "link": "https://web3.storage/", "auth": "apiKey"},
    
    # === CI/CD ===
    {"name": "Azure DevOps Health", "description": "Resource health helps you diagnose Azure issues", "category": "Development", "link": "https://docs.microsoft.com/en-us/rest/api/resourcehealth", "auth": "apiKey"},
    {"name": "Bitrise", "description": "Build tool and processes integrations", "category": "Development", "link": "https://api-docs.bitrise.io/", "auth": "apiKey"},
    {"name": "Buddy CI", "description": "Fastest continuous integration and continuous delivery platform", "category": "Development", "link": "https://buddy.works/docs/api/getting-started/overview", "auth": "OAuth"},
    {"name": "Codeship", "description": "Continuous Integration Platform in the cloud", "category": "Development", "link": "https://docs.cloudbees.com/docs/cloudbees-codeship/latest/api-overview/", "auth": "apiKey"},
    
    # === CRYPTO ===
    {"name": "0x API", "description": "API for querying token and pool stats across liquidity pools", "category": "Finance", "link": "https://0x.org/api", "auth": "None"},
    {"name": "1inch", "description": "API for querying decentralize exchange", "category": "Finance", "link": "https://1inch.io/api/", "auth": "None"},
    {"name": "Alchemy Ethereum", "description": "Ethereum Node-as-a-Service Provider", "category": "Finance", "link": "https://docs.alchemy.com/alchemy/", "auth": "apiKey"},
    {"name": "Apilayer Coinlayer", "description": "Real-time Crypto Currency Exchange Rates", "category": "Finance", "link": "https://coinlayer.com", "auth": "apiKey"},
    {"name": "Bitcambio", "description": "List of all traded assets in the exchange", "category": "Finance", "link": "https://nova.bitcambio.com.br/api/v3/docs#a-public", "auth": "None"},
    {"name": "BitcoinAverage", "description": "Digital Asset Price Data for the blockchain industry", "category": "Finance", "link": "https://apiv2.bitcoinaverage.com/", "auth": "apiKey"},
    {"name": "BitcoinCharts", "description": "Financial and Technical Data related to the Bitcoin Network", "category": "Finance", "link": "https://bitcoincharts.com/about/exchanges/", "auth": "None"},
    {"name": "Bitmex", "description": "Real-Time Cryptocurrency derivatives trading platform", "category": "Finance", "link": "https://www.bitmex.com/app/apiOverview", "auth": "apiKey"},
    {"name": "Bittrex", "description": "Next Generation Crypto Trading Platform", "category": "Finance", "link": "https://bittrex.github.io/api/v3", "auth": "apiKey"},
    {"name": "Block.io", "description": "Bitcoin Payment, Wallet & Transaction Data", "category": "Finance", "link": "https://block.io/docs/basic", "auth": "apiKey"},
    {"name": "Blockfrost Cardano", "description": "Interaction with the Cardano mainnet and testnets", "category": "Finance", "link": "https://blockfrost.io/", "auth": "apiKey"},
    {"name": "Brave NewCoin", "description": "Real-time and historic crypto data from 200+ exchanges", "category": "Finance", "link": "https://bravenewcoin.com/developers", "auth": "apiKey"},
    {"name": "BtcTurk", "description": "Real-time cryptocurrency data, graphs and API", "category": "Finance", "link": "https://docs.btcturk.com/", "auth": "apiKey"},
    {"name": "Bybit", "description": "Cryptocurrency data feed and algorithmic trading", "category": "Finance", "link": "https://bybit-exchange.github.io/docs/linear/#t-introduction", "auth": "apiKey"},
    {"name": "CoinCap", "description": "Real time Cryptocurrency prices through a RESTful API", "category": "Finance", "link": "https://docs.coincap.io/", "auth": "None"},
    {"name": "CoinDCX", "description": "Cryptocurrency Trading Platform", "category": "Finance", "link": "https://docs.coindcx.com/", "auth": "apiKey"},
    {"name": "Coinlib", "description": "Crypto Currency Prices", "category": "Finance", "link": "https://coinlib.io/apidocs", "auth": "apiKey"},
    {"name": "CoinRanking", "description": "Live Cryptocurrency data", "category": "Finance", "link": "https://developers.coinranking.com/api/documentation", "auth": "apiKey"},
    {"name": "Coinremitter", "description": "Cryptocurrencies Payment & Prices", "category": "Finance", "link": "https://coinremitter.com/docs", "auth": "apiKey"},
    {"name": "CoinStats", "description": "Crypto Tracker", "category": "Finance", "link": "https://documenter.getpostman.com/view/5734027/RzZ6Hzr3?version=latest", "auth": "None"},
    {"name": "CryptAPI", "description": "Cryptocurrency Payment Processor", "category": "Finance", "link": "https://docs.cryptapi.io/", "auth": "None"},
    {"name": "CryptingUp", "description": "Cryptocurrency data", "category": "Finance", "link": "https://www.cryptingup.com/apidoc/#introduction", "auth": "None"},
    {"name": "CryptoMarket", "description": "Cryptocurrencies Trading platform", "category": "Finance", "link": "https://api.exchange.cryptomkt.com/", "auth": "apiKey"},
    {"name": "dYdX", "description": "Decentralized cryptocurrency exchange", "category": "Finance", "link": "https://docs.dydx.exchange/", "auth": "apiKey"},
    {"name": "Ethplorer", "description": "Ethereum tokens, balances, addresses, history", "category": "Finance", "link": "https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API", "auth": "apiKey"},
    {"name": "EXMO", "description": "Cryptocurrencies exchange based in UK", "category": "Finance", "link": "https://documenter.getpostman.com/view/10287440/SzYXWKPi", "auth": "apiKey"},
    {"name": "Gateio", "description": "API provides spot, margin and futures trading operations", "category": "Finance", "link": "https://www.gate.io/api2", "auth": "apiKey"},
    {"name": "Gemini Crypto", "description": "Cryptocurrencies Exchange", "category": "Finance", "link": "https://docs.gemini.com/rest-api/", "auth": "None"},
    {"name": "Hirak Exchange Rates", "description": "Exchange rates between 162 currency & 300 crypto", "category": "Finance", "link": "https://rates.hirak.site/", "auth": "apiKey"},
    {"name": "icy.tools", "description": "GraphQL based NFT API", "category": "Finance", "link": "https://developers.icy.tools/", "auth": "apiKey"},
    {"name": "Indodax", "description": "Trade your Bitcoin and other assets with rupiah", "category": "Finance", "link": "https://github.com/btcid/indodax-official-api-docs", "auth": "apiKey"},
    {"name": "INFURA Ethereum", "description": "Interaction with the Ethereum mainnet and testnets", "category": "Finance", "link": "https://infura.io/product/ethereum", "auth": "apiKey"},
    {"name": "KuCoin", "description": "Cryptocurrency Trading Platform", "category": "Finance", "link": "https://docs.kucoin.com/", "auth": "apiKey"},
    {"name": "Localbitcoins", "description": "P2P platform to buy and sell Bitcoins", "category": "Finance", "link": "https://localbitcoins.com/api-docs/", "auth": "None"},
    {"name": "Mempool", "description": "Bitcoin API Service focusing on transaction fee", "category": "Finance", "link": "https://mempool.space/api", "auth": "None"},
    {"name": "MercadoBitcoin", "description": "Brazilian Cryptocurrency Information", "category": "Finance", "link": "https://www.mercadobitcoin.com.br/api-doc/", "auth": "None"},
    {"name": "Messari", "description": "API endpoints for thousands of crypto assets", "category": "Finance", "link": "https://messari.io/api", "auth": "None"},
    {"name": "Nexchange", "description": "Automated cryptocurrency exchange service", "category": "Finance", "link": "https://nexchange2.docs.apiary.io/", "auth": "None"},
    {"name": "Nomics", "description": "Historical and realtime cryptocurrency prices and market data", "category": "Finance", "link": "https://nomics.com/docs/", "auth": "apiKey"},
    {"name": "NovaDax", "description": "NovaDAX API to access all market data", "category": "Finance", "link": "https://doc.novadax.com/en-US/#introduction", "auth": "apiKey"},
    {"name": "OKEx", "description": "Cryptocurrency exchange based in Seychelles", "category": "Finance", "link": "https://www.okex.com/docs/", "auth": "apiKey"},
    {"name": "Solana JSON RPC", "description": "Interact with the Solana Blockchain", "category": "Finance", "link": "https://docs.solana.com/developing/clients/jsonrpc-api", "auth": "None"},
    {"name": "Technical Analysis API", "description": "Cryptocurrency prices and technical analysis", "category": "Finance", "link": "https://technical-analysis-api.com", "auth": "apiKey"},
    {"name": "VALR", "description": "Cryptocurrency Exchange based in South Africa", "category": "Finance", "link": "https://docs.valr.com/", "auth": "apiKey"},
    {"name": "WorldCoinIndex", "description": "Cryptocurrencies Prices", "category": "Finance", "link": "https://www.worldcoinindex.com/apiservice", "auth": "apiKey"},
    {"name": "ZMOK", "description": "Ethereum JSON RPC API and Web3 provider", "category": "Finance", "link": "https://zmok.io", "auth": "None"},
    
    # === DEVELOPMENT ===
    {"name": "24 Pull Requests", "description": "Project to promote open source collaboration during December", "category": "Development", "link": "https://24pullrequests.com/api", "auth": "None"},
    {"name": "Abstract Screenshot", "description": "Take programmatic screenshots of web pages", "category": "Development", "link": "https://www.abstractapi.com/website-screenshot-api", "auth": "apiKey"},
    {"name": "Agify.io", "description": "Estimates the age from a first name", "category": "Utilities", "link": "https://agify.io", "auth": "None"},
    {"name": "API Grátis", "description": "Multiple services and public APIs", "category": "Development", "link": "https://apigratis.com.br/", "auth": "None"},
    {"name": "ApicAgent", "description": "Extract device details from user-agent string", "category": "Development", "link": "https://www.apicagent.com", "auth": "None"},
    {"name": "Apilayer Userstack", "description": "Secure User-Agent String Lookup JSON API", "category": "Development", "link": "https://userstack.com/", "auth": "OAuth"},
    {"name": "Azure DevOps API", "description": "The Azure DevOps basic components of a REST API", "category": "Development", "link": "https://docs.microsoft.com/en-us/rest/api/azure/devops", "auth": "apiKey"},
    {"name": "Base API", "description": "Building quick backends", "category": "Development", "link": "https://www.base-api.io/", "auth": "apiKey"},
    {"name": "Beeceptor", "description": "Build a mock Rest API endpoint in seconds", "category": "Development", "link": "https://beeceptor.com/", "auth": "None"},
    {"name": "Blague.xyz", "description": "La plus grande API de Blagues FR", "category": "Entertainment", "link": "https://blague.xyz/", "auth": "apiKey"},
    {"name": "Blitapp", "description": "Schedule screenshots of web pages", "category": "Development", "link": "https://blitapp.com/api/", "auth": "apiKey"},
    {"name": "Blynk-Cloud", "description": "Control IoT Devices from Blynk IoT Cloud", "category": "IoT", "link": "https://blynkapi.docs.apiary.io/#", "auth": "apiKey"},
    {"name": "Brainshop.ai", "description": "Make A Free A.I Brain", "category": "AI/ML", "link": "https://brainshop.ai/", "auth": "apiKey"},
    {"name": "Browshot", "description": "Easily make screenshots of web pages in any screen size", "category": "Development", "link": "https://browshot.com/api/documentation", "auth": "apiKey"},
    {"name": "CDNJS API", "description": "Library info on CDNJS", "category": "Development", "link": "https://api.cdnjs.com/libraries/jquery", "auth": "None"},
    {"name": "Changelogs.md", "description": "Structured changelog metadata from open source projects", "category": "Development", "link": "https://changelogs.md", "auth": "None"},
    {"name": "Ciprand", "description": "Secure random string generator", "category": "Development", "link": "https://github.com/polarspetroll/ciprand", "auth": "None"},
    {"name": "Cloudflare Trace API", "description": "Get IP Address, Timestamp, User Agent, Country Code", "category": "Development", "link": "https://github.com/fawazahmed0/cloudflare-trace-api", "auth": "None"},
    {"name": "CodeX Compiler", "description": "Online Compiler for Various Languages", "category": "Development", "link": "https://github.com/Jaagrav/CodeX", "auth": "None"},
    {"name": "Contentful Images", "description": "Retrieve and apply transformations to images", "category": "Design", "link": "https://www.contentful.com/developers/docs/references/images-api/", "auth": "apiKey"},
    {"name": "CORS Proxy", "description": "Get around the dreaded CORS error", "category": "Development", "link": "https://github.com/burhanuday/cors-proxy", "auth": "None"},
    {"name": "CountAPI", "description": "Free and simple counting service", "category": "Development", "link": "https://countapi.xyz", "auth": "None"},
    {"name": "Databricks API", "description": "Service to manage your databricks account", "category": "Development", "link": "https://docs.databricks.com/dev-tools/api/latest/index.html", "auth": "apiKey"},
    {"name": "DigitalOcean Status", "description": "Status of all DigitalOcean services", "category": "Development", "link": "https://status.digitalocean.com/api", "auth": "None"},
    {"name": "Docker Hub API", "description": "Interact with Docker Hub", "category": "Development", "link": "https://docs.docker.com/docker-hub/api/latest/", "auth": "apiKey"},
    {"name": "ExtendsClass JSON Storage", "description": "A simple JSON store API", "category": "Development", "link": "https://extendsclass.com/json-storage.html", "auth": "None"},
    {"name": "GeekFlare API", "description": "Testing and monitoring methods for websites", "category": "Development", "link": "https://apidocs.geekflare.com/docs/geekflare-api", "auth": "apiKey"},
    {"name": "Genderize.io", "description": "Estimates a gender from a first name", "category": "Utilities", "link": "https://genderize.io", "auth": "None"},
    {"name": "GETPing", "description": "Trigger an email notification with a simple GET request", "category": "Development", "link": "https://www.getping.info", "auth": "apiKey"},
    {"name": "Ghost CMS API", "description": "Get Published content into your Website", "category": "Development", "link": "https://ghost.org/", "auth": "apiKey"},
    {"name": "Glitterly", "description": "Image generation API", "category": "Design", "link": "https://developers.glitterly.app", "auth": "apiKey"},
    {"name": "Gorest", "description": "Online REST API for Testing and Prototyping", "category": "Development", "link": "https://gorest.co.in/", "auth": "OAuth"},
    {"name": "Hasura", "description": "GraphQL and REST API Engine with built in Authorization", "category": "Development", "link": "https://hasura.io/opensource/", "auth": "apiKey"},
    {"name": "Heroku API", "description": "REST API to programmatically create apps", "category": "Development", "link": "https://devcenter.heroku.com/articles/platform-api-reference/", "auth": "OAuth"},
    {"name": "host-t.com", "description": "Basic DNS query via HTTP GET request", "category": "Development", "link": "https://host-t.com", "auth": "None"},
    {"name": "Host.io", "description": "Domains Data API for Developers", "category": "Development", "link": "https://host.io", "auth": "apiKey"},
    {"name": "HTTP2.Pro", "description": "Test endpoints for HTTP/2 protocol support", "category": "Development", "link": "https://http2.pro/doc/api", "auth": "None"},
    {"name": "Httpbin Cloudflare", "description": "HTTP Request & Response Service with HTTP/3 Support", "category": "Development", "link": "https://cloudflare-quic.com/b/", "auth": "None"},
    {"name": "Hunter API", "description": "API for domain search, professional email finder", "category": "Business", "link": "https://hunter.io/api", "auth": "apiKey"},
    {"name": "IBM Text to Speech", "description": "Convert text to speech", "category": "AI/ML", "link": "https://cloud.ibm.com/docs/text-to-speech/getting-started.html", "auth": "apiKey"},
    {"name": "Icanhazepoch", "description": "Get Epoch time", "category": "Utilities", "link": "https://icanhazepoch.com", "auth": "None"},
    {"name": "Icanhazip", "description": "IP Address API", "category": "Utilities", "link": "https://major.io/icanhazip-com-faq/", "auth": "None"},
    {"name": "IFTTT Connect API", "description": "IFTTT Connect API", "category": "Development", "link": "https://platform.ifttt.com/docs/connect_api", "auth": "None"},
    {"name": "import.io", "description": "Retrieve structured data from a website or RSS feed", "category": "Development", "link": "http://api.docs.import.io/", "auth": "apiKey"},
    {"name": "ip-fast.com", "description": "IP address, country and city", "category": "Utilities", "link": "https://ip-fast.com/docs/", "auth": "None"},
    {"name": "IP2WHOIS", "description": "WHOIS domain name lookup", "category": "Development", "link": "https://www.ip2whois.com/", "auth": "apiKey"},
    {"name": "ipfind.io", "description": "Geographic location of an IP address or domain", "category": "Geocoding", "link": "https://ipfind.io", "auth": "apiKey"},
    {"name": "jsDelivr API", "description": "Package info and download stats on jsDelivr CDN", "category": "Development", "link": "https://github.com/jsdelivr/data.jsdelivr.com", "auth": "None"},
    {"name": "JSON 2 JSONP", "description": "Convert JSON to JSONP for cross-domain data requests", "category": "Development", "link": "https://json2jsonp.com/", "auth": "None"},
    {"name": "Kroki", "description": "Creates diagrams from textual descriptions", "category": "Development", "link": "https://kroki.io", "auth": "None"},
    {"name": "License-API", "description": "Unofficial REST API for choosealicense.com", "category": "Development", "link": "https://github.com/cmccandless/license-api/blob/master/README.md", "auth": "None"},
    {"name": "Logs.to", "description": "Generate logs", "category": "Development", "link": "https://logs.to/", "auth": "apiKey"},
    {"name": "Lua Decompiler", "description": "Online Lua 5.1 Decompiler", "category": "Development", "link": "https://lua-decompiler.ferib.dev/", "auth": "None"},
    {"name": "MAC address vendor lookup", "description": "Retrieve vendor details regarding a MAC address", "category": "Development", "link": "https://macaddress.io/api", "auth": "apiKey"},
    {"name": "Micro DB", "description": "Simple database service", "category": "Development", "link": "https://m3o.com/db", "auth": "apiKey"},
    {"name": "MicroENV", "description": "Fake Rest API for developers", "category": "Development", "link": "https://microenv.com/", "auth": "None"},
    {"name": "Mocky", "description": "Mock user defined test JSON for REST API endpoints", "category": "Development", "link": "https://designer.mocky.io/", "auth": "None"},
    {"name": "MY IP API", "description": "Get IP address information", "category": "Utilities", "link": "https://www.myip.com/api-docs/", "auth": "None"},
    {"name": "Nationalize.io", "description": "Estimate the nationality of a first name", "category": "Utilities", "link": "https://nationalize.io", "auth": "None"},
    
    # === MORE POPULAR APIs ===
    {"name": "GNews API", "description": "Search for news from 60,000+ sources", "category": "News", "link": "https://gnews.io/docs/v4", "auth": "apiKey"},
    {"name": "Perigon News", "description": "Real-time global news API", "category": "News", "link": "https://www.goperigon.com/", "auth": "apiKey"},
    {"name": "Mailgun Email Validation", "description": "Validate email addresses", "category": "Email", "link": "https://documentation.mailgun.com/en/latest/api-email-validation.html", "auth": "apiKey"},
    {"name": "Abstract Email Validation", "description": "Validate email addresses in real-time", "category": "Email", "link": "https://www.abstractapi.com/email-verification-validation-api", "auth": "apiKey"},
    {"name": "Eva Email Validation", "description": "Validate email addresses and get deliverability info", "category": "Email", "link": "https://eva.pingutil.com/", "auth": "apiKey"},
    {"name": "PromptPerfect", "description": "AI prompt optimization API", "category": "AI/ML", "link": "https://promptperfect.jina.ai/api", "auth": "apiKey"},
    {"name": "Replicate", "description": "Run AI models in the cloud", "category": "AI/ML", "link": "https://replicate.com/docs/reference/http", "auth": "apiKey"},
    {"name": "Hugging Face Inference", "description": "Run ML models using the Hugging Face API", "category": "AI/ML", "link": "https://huggingface.co/docs/api-inference/", "auth": "apiKey"},
    {"name": "AI21 Labs", "description": "AI models for natural language processing", "category": "AI/ML", "link": "https://docs.ai21.com/", "auth": "apiKey"},
    {"name": "Cohere AI", "description": "Large language models for text generation", "category": "AI/ML", "link": "https://docs.cohere.com/", "auth": "apiKey"},
    {"name": "Claude API", "description": "Anthropic's Claude language model API", "category": "AI/ML", "link": "https://docs.anthropic.com/", "auth": "apiKey"},
    {"name": "Stability AI", "description": "Image generation with Stable Diffusion", "category": "AI/ML", "link": "https://platform.stability.ai/docs/api-reference", "auth": "apiKey"},
    {"name": "DALL-E API", "description": "OpenAI's image generation API", "category": "AI/ML", "link": "https://platform.openai.com/docs/guides/images", "auth": "apiKey"},
    {"name": "Midjourney API", "description": "Unofficial Midjourney image generation API", "category": "AI/ML", "link": "https://docs.midjourney.com/", "auth": "apiKey"},
    {"name": "Runway ML", "description": "AI-powered creative tools API", "category": "AI/ML", "link": "https://runwayml.com/docs/", "auth": "apiKey"},
    {"name": "AssemblyAI", "description": "Speech-to-Text and audio intelligence API", "category": "AI/ML", "link": "https://www.assemblyai.com/docs/", "auth": "apiKey"},
    {"name": "Deepgram", "description": "Speech recognition API for developers", "category": "AI/ML", "link": "https://developers.deepgram.com/", "auth": "apiKey"},
    {"name": "Rev.ai", "description": "Speech recognition API", "category": "AI/ML", "link": "https://www.rev.ai/docs", "auth": "apiKey"},
    {"name": "Otter.ai", "description": "Meeting transcription and notes", "category": "AI/ML", "link": "https://otter.ai/api", "auth": "apiKey"},
    {"name": "Sonix", "description": "Automated transcription API", "category": "AI/ML", "link": "https://sonix.ai/api", "auth": "apiKey"},
    {"name": "Writesonic", "description": "AI writing assistant API", "category": "AI/ML", "link": "https://writesonic.com/api", "auth": "apiKey"},
    {"name": "Copy.ai", "description": "AI copywriting API", "category": "AI/ML", "link": "https://www.copy.ai/api", "auth": "apiKey"},
    {"name": "Jasper AI", "description": "AI content creation API", "category": "AI/ML", "link": "https://www.jasper.ai/api", "auth": "apiKey"},
    {"name": "ContentBot", "description": "AI content generation API", "category": "AI/ML", "link": "https://contentbot.ai/api", "auth": "apiKey"},
    {"name": "Notion API", "description": "Interact with Notion databases and pages", "category": "Business", "link": "https://developers.notion.com/", "auth": "OAuth"},
    {"name": "Coda API", "description": "Interact with Coda docs programmatically", "category": "Business", "link": "https://coda.io/developers/apis/v1", "auth": "apiKey"},
    {"name": "Linear API", "description": "Issue tracking and project management API", "category": "Business", "link": "https://linear.app/docs/api", "auth": "apiKey"},
    {"name": "Height API", "description": "Task management API", "category": "Business", "link": "https://height.notion.site/API-a35e5f12d5844f6a8e8b96fd00f282cc", "auth": "apiKey"},
    {"name": "Fibery API", "description": "Work management platform API", "category": "Business", "link": "https://api.fibery.io/", "auth": "apiKey"},
    {"name": "Monday.com", "description": "Work OS API", "category": "Business", "link": "https://developer.monday.com/api-reference/docs", "auth": "apiKey"},
    {"name": "ClickUp API", "description": "Productivity platform API", "category": "Business", "link": "https://clickup.com/api", "auth": "apiKey"},
    {"name": "Basecamp API", "description": "Project management API", "category": "Business", "link": "https://github.com/basecamp/bc3-api", "auth": "OAuth"},
    {"name": "Teamwork API", "description": "Project management platform API", "category": "Business", "link": "https://developer.teamwork.com/", "auth": "apiKey"},
    {"name": "Wrike API", "description": "Work management platform API", "category": "Business", "link": "https://developers.wrike.com/", "auth": "OAuth"},
    {"name": "Resend Email", "description": "Modern email API for developers", "category": "Email", "link": "https://resend.com/docs/api-reference/introduction", "auth": "apiKey"},
    {"name": "Postmark", "description": "Transactional email API", "category": "Email", "link": "https://postmarkapp.com/developer", "auth": "apiKey"},
    {"name": "SendGrid", "description": "Email delivery API", "category": "Email", "link": "https://docs.sendgrid.com/api-reference/", "auth": "apiKey"},
    {"name": "Mailjet", "description": "Email delivery and marketing API", "category": "Email", "link": "https://dev.mailjet.com/email/reference/", "auth": "apiKey"},
    {"name": "Amazon SES", "description": "Email sending service API", "category": "Email", "link": "https://docs.aws.amazon.com/ses/latest/APIReference/", "auth": "apiKey"},
    {"name": "SparkPost", "description": "Email delivery API", "category": "Email", "link": "https://developers.sparkpost.com/api/", "auth": "apiKey"},
    {"name": "Mandrill", "description": "Transactional email API from Mailchimp", "category": "Email", "link": "https://mailchimp.com/developer/transactional/api/", "auth": "apiKey"},
    {"name": "Customer.io", "description": "Marketing automation API", "category": "Marketing", "link": "https://customer.io/docs/api/", "auth": "apiKey"},
    {"name": "Iterable", "description": "Growth marketing platform API", "category": "Marketing", "link": "https://api.iterable.com/api/docs", "auth": "apiKey"},
    {"name": "Klaviyo", "description": "Email marketing API", "category": "Marketing", "link": "https://developers.klaviyo.com/en", "auth": "apiKey"},
    {"name": "ActiveCampaign", "description": "Marketing automation API", "category": "Marketing", "link": "https://developers.activecampaign.com/reference", "auth": "apiKey"},
    {"name": "Drip", "description": "Ecommerce marketing automation API", "category": "Marketing", "link": "https://developer.drip.com/", "auth": "apiKey"},
    {"name": "ConvertKit", "description": "Email marketing for creators API", "category": "Marketing", "link": "https://developers.convertkit.com/", "auth": "apiKey"},
    {"name": "Beehiiv", "description": "Newsletter platform API", "category": "Marketing", "link": "https://developers.beehiiv.com/", "auth": "apiKey"},
    {"name": "Substack", "description": "Newsletter publishing platform", "category": "Content", "link": "https://substack.com/api", "auth": "apiKey"},
    {"name": "Ghost CMS", "description": "Publishing platform API", "category": "Content", "link": "https://ghost.org/docs/admin-api/", "auth": "apiKey"},
    {"name": "Contentful", "description": "Content management API", "category": "Content", "link": "https://www.contentful.com/developers/docs/references/content-delivery-api/", "auth": "apiKey"},
    {"name": "Sanity", "description": "Content platform API", "category": "Content", "link": "https://www.sanity.io/docs/api-versioning", "auth": "apiKey"},
    {"name": "Strapi", "description": "Headless CMS API", "category": "Content", "link": "https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest-api.html", "auth": "apiKey"},
    {"name": "DatoCMS", "description": "Content management API", "category": "Content", "link": "https://www.datocms.com/docs/content-delivery-api", "auth": "apiKey"},
    {"name": "Hygraph", "description": "GraphQL content API", "category": "Content", "link": "https://hygraph.com/docs/api-reference", "auth": "apiKey"},
    {"name": "Builder.io", "description": "Visual content management API", "category": "Content", "link": "https://www.builder.io/c/docs/content-api", "auth": "apiKey"},
    {"name": "Prismic", "description": "Headless CMS API", "category": "Content", "link": "https://prismic.io/docs/api", "auth": "apiKey"},
    {"name": "Storyblok", "description": "Content management API", "category": "Content", "link": "https://www.storyblok.com/docs/api/content-delivery", "auth": "apiKey"},
    {"name": "ButterCMS", "description": "Headless CMS API", "category": "Content", "link": "https://buttercms.com/docs/api/", "auth": "apiKey"},
    {"name": "Payload CMS", "description": "Open source headless CMS", "category": "Content", "link": "https://payloadcms.com/docs/rest-api/overview", "auth": "apiKey"},
    {"name": "Directus", "description": "Open data platform API", "category": "Content", "link": "https://docs.directus.io/reference/introduction.html", "auth": "apiKey"},
    {"name": "Keystone", "description": "Headless CMS and GraphQL API", "category": "Content", "link": "https://keystonejs.com/docs/apis/graphql", "auth": "apiKey"},
    {"name": "Segment", "description": "Customer data platform API", "category": "Analytics", "link": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/", "auth": "apiKey"},
    {"name": "Amplitude", "description": "Product analytics API", "category": "Analytics", "link": "https://www.docs.developers.amplitude.com/analytics/apis/http-v2-api/", "auth": "apiKey"},
    {"name": "Heap", "description": "Digital insights platform API", "category": "Analytics", "link": "https://developers.heap.io/reference", "auth": "apiKey"},
    {"name": "PostHog", "description": "Product analytics API", "category": "Analytics", "link": "https://posthog.com/docs/api", "auth": "apiKey"},
    {"name": "June.so", "description": "Product analytics for B2B SaaS", "category": "Analytics", "link": "https://www.june.so/docs/api", "auth": "apiKey"},
    {"name": "Plausible", "description": "Privacy-focused analytics API", "category": "Analytics", "link": "https://plausible.io/docs/stats-api", "auth": "apiKey"},
    {"name": "Fathom Analytics", "description": "Privacy-focused web analytics", "category": "Analytics", "link": "https://usefathom.com/api", "auth": "apiKey"},
    {"name": "Simple Analytics", "description": "Privacy-first analytics API", "category": "Analytics", "link": "https://docs.simpleanalytics.com/api", "auth": "apiKey"},
    {"name": "Pirsch", "description": "Cookie-free web analytics API", "category": "Analytics", "link": "https://pirsch.io/docs/api", "auth": "apiKey"},
    {"name": "Splitbee", "description": "Analytics API", "category": "Analytics", "link": "https://splitbee.io/docs/api", "auth": "apiKey"},
]

def main():
    print("🦞 APIClaw Public APIs Mass Import v2")
    print("=" * 50)
    
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    existing_names = {api['name'].lower() for api in registry['apis']}
    
    added = 0
    skipped = 0
    
    for api in ADDITIONAL_APIS:
        api_id = generate_id(api['name'])
        
        # Skip if already exists by ID or name
        if api_id in existing_ids or api['name'].lower() in existing_names:
            skipped += 1
            continue
        
        registry['apis'].append({
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api.get('category', 'Other'),
            "auth": api.get('auth', 'apiKey'),
            "https": True,
            "cors": "unknown",
            "link": api['link'],
            "pricing": "unknown",
            "keywords": [],
            "source": "public-apis-v2"
        })
        existing_ids.add(api_id)
        existing_names.add(api['name'].lower())
        added += 1
    
    # Update count and version
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = "2026-02-26"
    registry['version'] = "3.2.4"
    
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️  Skipped (duplicates): {skipped}")
    print(f"📊 Total APIs in registry: {registry['count']}")

if __name__ == "__main__":
    main()
