#!/usr/bin/env python3
"""APIClaw Night Expansion 03:00 - Batch 2 - More APIs from public-apis list"""

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

# Batch 2: More APIs from public-apis and n0shake repos
BATCH2_APIS = [
    # Animals
    {"name": "AdoptAPet", "description": "Resource to help get pets adopted", "category": "Animals", "baseUrl": "https://www.adoptapet.com/public/apis/", "authType": "apiKey"},
    {"name": "Axolotl API", "description": "Collection of axolotl pictures and facts", "category": "Animals", "baseUrl": "https://theaxolotlapi.netlify.app/", "authType": "none"},
    {"name": "Cat Facts", "description": "Daily cat facts", "category": "Animals", "baseUrl": "https://alexwohlbruck.github.io/cat-facts/", "authType": "none"},
    {"name": "Cataas", "description": "Cat as a service", "category": "Animals", "baseUrl": "https://cataas.com/", "authType": "none"},
    {"name": "The Cat API", "description": "Pictures of cats from Tumblr", "category": "Animals", "baseUrl": "https://thecatapi.com/", "authType": "apiKey"},
    {"name": "Dog Facts", "description": "Random dog facts", "category": "Animals", "baseUrl": "https://dukengn.github.io/Dog-facts-API/", "authType": "none"},
    {"name": "Dog CEO", "description": "Dogs based on Stanford Dogs Dataset", "category": "Animals", "baseUrl": "https://dog.ceo/dog-api/", "authType": "none"},
    {"name": "eBird", "description": "Birding observations within a region", "category": "Animals", "baseUrl": "https://documenter.getpostman.com/view/664302/S1ENwy59", "authType": "apiKey"},
    {"name": "FishWatch", "description": "Fish species information", "category": "Animals", "baseUrl": "https://www.fishwatch.gov/developers", "authType": "none"},
    {"name": "HTTP Cat", "description": "Cat for every HTTP status", "category": "Animals", "baseUrl": "https://http.cat/", "authType": "none"},
    {"name": "HTTP Dog", "description": "Dog for every HTTP status", "category": "Animals", "baseUrl": "https://http.dog/", "authType": "none"},
    {"name": "IUCN Red List", "description": "Threatened species data", "category": "Animals", "baseUrl": "https://apiv3.iucnredlist.org/", "authType": "apiKey"},
    {"name": "Petfinder", "description": "Pet adoption listings", "category": "Animals", "baseUrl": "https://www.petfinder.com/developers/", "authType": "apiKey"},
    {"name": "PlaceBear", "description": "Placeholder bear pictures", "category": "Animals", "baseUrl": "https://placebear.com/", "authType": "none"},
    {"name": "Random Dog", "description": "Random dog pictures", "category": "Animals", "baseUrl": "https://random.dog/", "authType": "none"},
    {"name": "Random Duck", "description": "Random duck pictures", "category": "Animals", "baseUrl": "https://random-d.uk/", "authType": "none"},
    {"name": "Random Fox", "description": "Random fox pictures", "category": "Animals", "baseUrl": "https://randomfox.ca/", "authType": "none"},
    {"name": "Shibe.Online", "description": "Random Shiba Inu pictures", "category": "Animals", "baseUrl": "https://shibe.online/", "authType": "none"},
    {"name": "The Dog API", "description": "All about dogs", "category": "Animals", "baseUrl": "https://thedogapi.com/", "authType": "apiKey"},
    {"name": "xeno-canto", "description": "Bird recordings", "category": "Animals", "baseUrl": "https://xeno-canto.org/explore/api", "authType": "none"},
    {"name": "Zoo Animals", "description": "Zoo animal facts", "category": "Animals", "baseUrl": "https://zoo-animal-api.herokuapp.com/", "authType": "none"},
    
    # Anime
    {"name": "AniAPI", "description": "Anime discovery and streaming", "category": "Anime", "baseUrl": "https://aniapi.com/docs/", "authType": "oauth"},
    {"name": "AniDB", "description": "Anime database", "category": "Anime", "baseUrl": "https://wiki.anidb.net/HTTP_API_Definition", "authType": "apiKey"},
    {"name": "AnimeChan", "description": "Anime quotes", "category": "Anime", "baseUrl": "https://animechan.xyz/", "authType": "none"},
    {"name": "AnimeFacts", "description": "Anime facts", "category": "Anime", "baseUrl": "https://chandan-02.github.io/anime-facts-rest-api/", "authType": "none"},
    {"name": "AnimeNewsNetwork", "description": "Anime industry news", "category": "Anime", "baseUrl": "https://www.animenewsnetwork.com/encyclopedia/api.php", "authType": "none"},
    {"name": "Catboy", "description": "Neko images and GIFs", "category": "Anime", "baseUrl": "https://catboys.com/api", "authType": "none"},
    {"name": "Danbooru", "description": "Anime images by tags", "category": "Anime", "baseUrl": "https://danbooru.donmai.us/wiki_pages/help:api", "authType": "apiKey"},
    {"name": "Kitsu", "description": "Anime discovery platform", "category": "Anime", "baseUrl": "https://kitsu.docs.apiary.io/", "authType": "oauth"},
    {"name": "MangaDex", "description": "Manga database", "category": "Anime", "baseUrl": "https://api.mangadex.org/docs.html", "authType": "apiKey"},
    {"name": "MyAnimeList (Jikan)", "description": "Unofficial MAL API", "category": "Anime", "baseUrl": "https://jikan.moe/", "authType": "none"},
    {"name": "NekosBest", "description": "Neko images and GIFs", "category": "Anime", "baseUrl": "https://docs.nekos.best/", "authType": "none"},
    {"name": "Shikimori", "description": "Anime discovery and tracking", "category": "Anime", "baseUrl": "https://shikimori.one/api/doc", "authType": "oauth"},
    {"name": "Studio Ghibli", "description": "Ghibli films data", "category": "Anime", "baseUrl": "https://ghibliapi.herokuapp.com/", "authType": "none"},
    {"name": "Trace.moe", "description": "Scene finder from screenshot", "category": "Anime", "baseUrl": "https://soruly.github.io/trace.moe-api/", "authType": "none"},
    {"name": "Waifu.im", "description": "Waifu pictures", "category": "Anime", "baseUrl": "https://waifu.im/docs", "authType": "none"},
    {"name": "Waifu.pics", "description": "Anime images", "category": "Anime", "baseUrl": "https://waifu.pics/docs", "authType": "none"},
    
    # Art & Design
    {"name": "Améthyste", "description": "Generate images for Discord", "category": "Art", "baseUrl": "https://api.amethyste.moe/", "authType": "apiKey"},
    {"name": "Art Institute of Chicago", "description": "Art collection API", "category": "Art", "baseUrl": "https://api.artic.edu/docs/", "authType": "none"},
    {"name": "Colormind", "description": "Color scheme generator", "category": "Art", "baseUrl": "http://colormind.io/api-access/", "authType": "none"},
    {"name": "ColourLovers", "description": "Patterns and palettes", "category": "Art", "baseUrl": "http://www.colourlovers.com/api", "authType": "none"},
    {"name": "Cooper Hewitt", "description": "Smithsonian Design Museum", "category": "Art", "baseUrl": "https://collection.cooperhewitt.org/api", "authType": "apiKey"},
    {"name": "EmojiHub", "description": "Emojis by categories", "category": "Art", "baseUrl": "https://github.com/cheatsnake/emojihub", "authType": "none"},
    {"name": "Europeana", "description": "European museums content", "category": "Art", "baseUrl": "https://pro.europeana.eu/resources/apis/search", "authType": "apiKey"},
    {"name": "Harvard Art Museums", "description": "Art collection API", "category": "Art", "baseUrl": "https://github.com/harvardartmuseums/api-docs", "authType": "apiKey"},
    {"name": "Iconfinder", "description": "Icons marketplace", "category": "Art", "baseUrl": "https://developer.iconfinder.com/", "authType": "apiKey"},
    {"name": "Lordicon", "description": "Animated icons", "category": "Art", "baseUrl": "https://lordicon.com/", "authType": "none"},
    {"name": "Metropolitan Museum", "description": "Met Museum data", "category": "Art", "baseUrl": "https://metmuseum.github.io/", "authType": "none"},
    {"name": "Noun Project", "description": "Icons and symbols", "category": "Art", "baseUrl": "https://api.thenounproject.com/", "authType": "oauth"},
    {"name": "PHP-Noise", "description": "Noise background generator", "category": "Art", "baseUrl": "https://php-noise.com/", "authType": "none"},
    {"name": "Pixel Encounter", "description": "SVG icon generator", "category": "Art", "baseUrl": "https://pixelencounter.com/api", "authType": "none"},
    {"name": "Rijksmuseum", "description": "Dutch art collection", "category": "Art", "baseUrl": "https://data.rijksmuseum.nl/", "authType": "apiKey"},
    {"name": "xColors", "description": "Generate and convert colors", "category": "Art", "baseUrl": "https://x-colors.herokuapp.com/", "authType": "none"},
    
    # Books
    {"name": "A Bíblia Digital", "description": "Bible versions API", "category": "Books", "baseUrl": "https://www.abibliadigital.com.br/", "authType": "apiKey"},
    {"name": "Bhagavad Gita", "description": "Bhagavad Gita text", "category": "Books", "baseUrl": "https://docs.bhagavadgitaapi.in/", "authType": "apiKey"},
    {"name": "Bible-api", "description": "Free Bible API", "category": "Books", "baseUrl": "https://bible-api.com/", "authType": "none"},
    {"name": "British National Bibliography", "description": "Books metadata", "category": "Books", "baseUrl": "http://bnb.data.bl.uk/", "authType": "none"},
    {"name": "Crossref", "description": "Books and articles metadata", "category": "Books", "baseUrl": "https://github.com/CrossRef/rest-api-doc", "authType": "none"},
    {"name": "Google Books", "description": "Books and libraries", "category": "Books", "baseUrl": "https://developers.google.com/books/", "authType": "oauth"},
    {"name": "Gutendex", "description": "Project Gutenberg books", "category": "Books", "baseUrl": "https://gutendex.com/", "authType": "none"},
    {"name": "Open Library", "description": "Books and covers", "category": "Books", "baseUrl": "https://openlibrary.org/developers/api", "authType": "none"},
    {"name": "PoetryDB", "description": "Poetry collection", "category": "Books", "baseUrl": "https://github.com/thundercomb/poetrydb", "authType": "none"},
    {"name": "Quran", "description": "Quran API", "category": "Books", "baseUrl": "https://quran.api-docs.io/", "authType": "none"},
    {"name": "Quran Cloud", "description": "Quran translations", "category": "Books", "baseUrl": "https://alquran.cloud/api", "authType": "none"},
    {"name": "The Bible", "description": "Bible API", "category": "Books", "baseUrl": "https://docs.api.bible/", "authType": "apiKey"},
    {"name": "Wizard World", "description": "Harry Potter universe", "category": "Books", "baseUrl": "https://wizard-world-api.herokuapp.com/", "authType": "none"},
    
    # Business
    {"name": "Apache Superset", "description": "BI dashboard API", "category": "Business", "baseUrl": "https://superset.apache.org/docs/api", "authType": "apiKey"},
    {"name": "Charity Search", "description": "Non-profit charity data", "category": "Business", "baseUrl": "http://charityapi.orghunter.com/", "authType": "apiKey"},
    {"name": "Clearbit Logo", "description": "Company logos", "category": "Business", "baseUrl": "https://clearbit.com/docs", "authType": "apiKey"},
    {"name": "Domainsdb.info", "description": "Domain name search", "category": "Business", "baseUrl": "https://domainsdb.info/", "authType": "none"},
    {"name": "Freelancer", "description": "Hire freelancers", "category": "Business", "baseUrl": "https://developers.freelancer.com/", "authType": "oauth"},
    {"name": "Gmail API", "description": "Gmail access", "category": "Business", "baseUrl": "https://developers.google.com/gmail/api/", "authType": "oauth"},
    {"name": "Google Analytics", "description": "Web analytics", "category": "Business", "baseUrl": "https://developers.google.com/analytics/", "authType": "oauth"},
    {"name": "Instatus", "description": "Status page API", "category": "Business", "baseUrl": "https://instatus.com/help/api", "authType": "apiKey"},
    {"name": "markerapi", "description": "Trademark search", "category": "Business", "baseUrl": "https://markerapi.com/", "authType": "none"},
    {"name": "ORB Intelligence", "description": "Company lookup", "category": "Business", "baseUrl": "https://api.orb-intelligence.com/", "authType": "apiKey"},
    {"name": "Redash", "description": "Query and dashboard API", "category": "Business", "baseUrl": "https://redash.io/help/user-guide/integrations-and-api/api", "authType": "apiKey"},
    {"name": "Smartsheet", "description": "Smartsheet data API", "category": "Business", "baseUrl": "https://smartsheet.redoc.ly/", "authType": "oauth"},
    {"name": "SwiftKanban", "description": "Kanban software API", "category": "Business", "baseUrl": "https://www.digite.com/knowledge-base/swiftkanban/", "authType": "apiKey"},
    {"name": "Tomba", "description": "Email finder", "category": "Business", "baseUrl": "https://tomba.io/api", "authType": "apiKey"},
    
    # Cloud Storage
    {"name": "AnonFiles", "description": "Anonymous file upload", "category": "Storage", "baseUrl": "https://anonfiles.com/docs/api", "authType": "none"},
    {"name": "Box", "description": "File sharing", "category": "Storage", "baseUrl": "https://developer.box.com/", "authType": "oauth"},
    {"name": "Dropbox", "description": "File storage", "category": "Storage", "baseUrl": "https://www.dropbox.com/developers", "authType": "oauth"},
    {"name": "File.io", "description": "Temporary file sharing", "category": "Storage", "baseUrl": "https://www.file.io/", "authType": "none"},
    {"name": "Filestack", "description": "File upload and processing", "category": "Storage", "baseUrl": "https://www.filestack.com/docs/", "authType": "apiKey"},
    {"name": "GoFile", "description": "Unlimited file upload", "category": "Storage", "baseUrl": "https://gofile.io/api", "authType": "apiKey"},
    {"name": "Google Drive", "description": "File storage", "category": "Storage", "baseUrl": "https://developers.google.com/drive/", "authType": "oauth"},
    {"name": "Gyazo", "description": "Screen capture sharing", "category": "Storage", "baseUrl": "https://gyazo.com/api/docs", "authType": "apiKey"},
    {"name": "Imgbb", "description": "Image hosting", "category": "Storage", "baseUrl": "https://api.imgbb.com/", "authType": "apiKey"},
    {"name": "OneDrive", "description": "Microsoft file storage", "category": "Storage", "baseUrl": "https://developer.microsoft.com/onedrive", "authType": "oauth"},
    {"name": "Pantry", "description": "Free JSON storage", "category": "Storage", "baseUrl": "https://getpantry.cloud/", "authType": "none"},
    {"name": "Pastebin", "description": "Text storage", "category": "Storage", "baseUrl": "https://pastebin.com/doc_api", "authType": "apiKey"},
    {"name": "Pinata", "description": "IPFS pinning", "category": "Storage", "baseUrl": "https://docs.pinata.cloud/", "authType": "apiKey"},
    {"name": "Storj", "description": "Decentralized storage", "category": "Storage", "baseUrl": "https://docs.storj.io/", "authType": "apiKey"},
    {"name": "Web3.Storage", "description": "IPFS storage", "category": "Storage", "baseUrl": "https://web3.storage/", "authType": "apiKey"},
    
    # CI/CD
    {"name": "Azure DevOps Health", "description": "Azure resource health", "category": "CI/CD", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/resourcehealth", "authType": "apiKey"},
    {"name": "Bitrise", "description": "Mobile CI/CD", "category": "CI/CD", "baseUrl": "https://api-docs.bitrise.io/", "authType": "apiKey"},
    {"name": "Buddy", "description": "CI/CD for web", "category": "CI/CD", "baseUrl": "https://buddy.works/docs/api/", "authType": "oauth"},
    {"name": "Codeship", "description": "Cloud CI platform", "category": "CI/CD", "baseUrl": "https://docs.cloudbees.com/docs/cloudbees-codeship/", "authType": "apiKey"},
    
    # Data Validation
    {"name": "Lob", "description": "Address verification", "category": "Validation", "baseUrl": "https://www.lob.com/", "authType": "apiKey"},
    {"name": "Postman Echo", "description": "Test API server", "category": "Validation", "baseUrl": "https://www.postman-echo.com/", "authType": "none"},
    {"name": "PurgoMalum", "description": "Profanity filter", "category": "Validation", "baseUrl": "http://www.purgomalum.com/", "authType": "none"},
    {"name": "Smarty", "description": "US address validation", "category": "Validation", "baseUrl": "https://www.smarty.com/docs/", "authType": "apiKey"},
    {"name": "vatlayer", "description": "VAT number validation", "category": "Validation", "baseUrl": "https://vatlayer.com/documentation", "authType": "apiKey"},
    
    # Email Validation
    {"name": "Email Validation (Abstract)", "description": "Email verification", "category": "Email", "baseUrl": "https://www.abstractapi.com/email-verification-validation-api", "authType": "apiKey"},
    {"name": "Cloudmersive Validate", "description": "Email and phone validation", "category": "Email", "baseUrl": "https://cloudmersive.com/validate-api", "authType": "apiKey"},
    {"name": "Disify", "description": "Disposable email detection", "category": "Email", "baseUrl": "https://www.disify.com/", "authType": "none"},
    {"name": "DropMail", "description": "Temporary email inbox", "category": "Email", "baseUrl": "https://dropmail.me/api/", "authType": "none"},
    {"name": "EVA", "description": "Email validation", "category": "Email", "baseUrl": "https://eva.pingutil.com/", "authType": "none"},
    {"name": "Guerrilla Mail", "description": "Disposable email", "category": "Email", "baseUrl": "https://www.guerrillamail.com/GuerrillaMailAPI.html", "authType": "none"},
    {"name": "ImprovMX", "description": "Email forwarding", "category": "Email", "baseUrl": "https://improvmx.com/api", "authType": "apiKey"},
    {"name": "Kickbox", "description": "Email verification", "category": "Email", "baseUrl": "https://open.kickbox.com/", "authType": "none"},
    {"name": "mail.gw", "description": "10-minute mail", "category": "Email", "baseUrl": "https://docs.mail.gw/", "authType": "none"},
    {"name": "mail.tm", "description": "Temporary email", "category": "Email", "baseUrl": "https://docs.mail.tm/", "authType": "none"},
    {"name": "MailboxValidator", "description": "Email validation", "category": "Email", "baseUrl": "https://www.mailboxvalidator.com/api-email-free", "authType": "apiKey"},
    {"name": "MailCheck.ai", "description": "Temp email detection", "category": "Email", "baseUrl": "https://www.mailcheck.ai/", "authType": "none"},
    {"name": "Mailtrap", "description": "Email testing", "category": "Email", "baseUrl": "https://mailtrap.docs.apiary.io/", "authType": "apiKey"},
    {"name": "Sendinblue", "description": "Marketing and transactional email", "category": "Email", "baseUrl": "https://developers.sendinblue.com/docs", "authType": "apiKey"},
    {"name": "Verifier", "description": "Email verification", "category": "Email", "baseUrl": "https://verifier.meetchopra.com/docs", "authType": "apiKey"},
    
    # Entertainment - Comedy & Memes
    {"name": "Chuck Norris", "description": "Chuck Norris jokes", "category": "Entertainment", "baseUrl": "https://api.chucknorris.io/", "authType": "none"},
    {"name": "Corporate Buzz Words", "description": "Corporate jargon generator", "category": "Entertainment", "baseUrl": "https://github.com/sameerkumar18/corporate-bs-generator-api", "authType": "none"},
    {"name": "Excuser", "description": "Random excuses", "category": "Entertainment", "baseUrl": "https://excuser.herokuapp.com/", "authType": "none"},
    {"name": "Fun Fact", "description": "Random fun facts", "category": "Entertainment", "baseUrl": "https://api.aakhilv.me/", "authType": "none"},
    {"name": "Imgflip", "description": "Meme templates", "category": "Entertainment", "baseUrl": "https://imgflip.com/api", "authType": "none"},
    {"name": "Meme Maker", "description": "Create memes", "category": "Entertainment", "baseUrl": "https://mememaker.github.io/API/", "authType": "none"},
    {"name": "Random Useless Facts", "description": "Useless facts", "category": "Entertainment", "baseUrl": "https://uselessfacts.jsph.pl/", "authType": "none"},
    {"name": "Techy", "description": "Tech-savvy phrases", "category": "Entertainment", "baseUrl": "https://techy-api.vercel.app/", "authType": "none"},
    {"name": "Yo Momma Jokes", "description": "Yo Momma jokes", "category": "Entertainment", "baseUrl": "https://github.com/beanboi7/yomomma-apiv2", "authType": "none"},
    
    # Entertainment - TV & Movies
    {"name": "Bob's Burgers", "description": "Bob's Burgers data", "category": "Entertainment", "baseUrl": "https://www.bobsburgersapi.com/", "authType": "none"},
    {"name": "Breaking Bad", "description": "Breaking Bad data", "category": "Entertainment", "baseUrl": "https://breakingbadapi.com/", "authType": "none"},
    {"name": "Comic Vine", "description": "Comic information", "category": "Entertainment", "baseUrl": "https://comicvine.gamespot.com/api/", "authType": "apiKey"},
    {"name": "Dune API", "description": "Dune book/movie data", "category": "Entertainment", "baseUrl": "https://github.com/ywalia01/dune-api", "authType": "none"},
    {"name": "Final Space", "description": "Final Space show data", "category": "Entertainment", "baseUrl": "https://finalspaceapi.com/docs/", "authType": "none"},
    {"name": "Fun Translations", "description": "Translate to movie languages", "category": "Entertainment", "baseUrl": "https://funtranslations.com/api/", "authType": "apiKey"},
    {"name": "Lord of the Rings", "description": "LOTR data", "category": "Entertainment", "baseUrl": "https://the-one-api.dev/documentation", "authType": "apiKey"},
    {"name": "Owen Wilson Wow", "description": "Owen Wilson wow clips", "category": "Entertainment", "baseUrl": "https://owen-wilson-wow-api.onrender.com/", "authType": "none"},
    {"name": "Star Trek", "description": "Star Trek data", "category": "Entertainment", "baseUrl": "https://stapi.co/api-documentation", "authType": "none"},
    {"name": "StockX", "description": "Sneaker and fashion data", "category": "Entertainment", "baseUrl": "https://stockx.vlour.me/", "authType": "none"},
    {"name": "TCGdex", "description": "Pokemon TCG data", "category": "Entertainment", "baseUrl": "https://www.tcgdex.dev/", "authType": "none"},
    
    # Face Recognition
    {"name": "Kairos", "description": "Face recognition", "category": "AI/ML", "baseUrl": "https://www.kairos.com/", "authType": "apiKey"},
    {"name": "Skybiometry", "description": "Face detection", "category": "AI/ML", "baseUrl": "https://skybiometry.com/", "authType": "apiKey"},
    
    # File Manipulation
    {"name": "Amazon S3", "description": "Object storage", "category": "Storage", "baseUrl": "https://docs.aws.amazon.com/s3/", "authType": "apiKey"},
    {"name": "Cloudinary", "description": "Image and video CDN", "category": "Storage", "baseUrl": "https://cloudinary.com/documentation", "authType": "apiKey"},
    {"name": "DigitalOcean Spaces", "description": "Object storage", "category": "Storage", "baseUrl": "https://docs.digitalocean.com/products/spaces/", "authType": "apiKey"},
    {"name": "Microsoft Graph", "description": "OneDrive access", "category": "Storage", "baseUrl": "https://docs.microsoft.com/en-us/graph/", "authType": "oauth"},
    {"name": "PDF Blocks", "description": "PDF operations", "category": "Storage", "baseUrl": "https://www.pdfblocks.com/docs/api/", "authType": "apiKey"},
    {"name": "SignNow", "description": "eSignature API", "category": "Storage", "baseUrl": "https://docs.signnow.com/", "authType": "oauth"},
    {"name": "Smash", "description": "Large file upload", "category": "Storage", "baseUrl": "https://api.fromsmash.com/", "authType": "apiKey"},
    {"name": "Vector Express", "description": "Vector file conversion", "category": "Storage", "baseUrl": "https://github.com/smidyo/vectorexpress-api", "authType": "none"},
    {"name": "Vertopal", "description": "File format conversion", "category": "Storage", "baseUrl": "https://www.vertopal.com/en/developer/api/", "authType": "apiKey"},
    
    # Finance - Additional
    {"name": "Atom Finance", "description": "Market and earnings data", "category": "Finance", "baseUrl": "https://docs.atom.finance/", "authType": "apiKey"},
    {"name": "Binance", "description": "Crypto exchange", "category": "Finance", "baseUrl": "https://github.com/binance/binance-spot-api-docs", "authType": "apiKey"},
    {"name": "Finage", "description": "Stock and forex data", "category": "Finance", "baseUrl": "https://finage.co.uk/", "authType": "apiKey"},
    {"name": "IBANAPI", "description": "IBAN validation", "category": "Finance", "baseUrl": "https://ibanapi.com/", "authType": "apiKey"},
    {"name": "Parqet Logo", "description": "Company logos", "category": "Finance", "baseUrl": "https://developers.parqet.com/", "authType": "none"},
    {"name": "Portfolio Optimizer", "description": "Portfolio analysis", "category": "Finance", "baseUrl": "https://portfoliooptimizer.io/", "authType": "none"},
    {"name": "SEC EDGAR", "description": "US company filings", "category": "Finance", "baseUrl": "https://www.sec.gov/edgar/sec-api-documentation", "authType": "none"},
    {"name": "SmartAPI", "description": "Indian broker API", "category": "Finance", "baseUrl": "https://smartapi.angelbroking.com/", "authType": "apiKey"},
    {"name": "StockData", "description": "Stock market data", "category": "Finance", "baseUrl": "https://www.stockdata.org/", "authType": "apiKey"},
    {"name": "Styvio", "description": "Stock sentiment", "category": "Finance", "baseUrl": "https://www.styvio.com/", "authType": "apiKey"},
    {"name": "YNAB", "description": "Budgeting API", "category": "Finance", "baseUrl": "https://api.youneedabudget.com/", "authType": "oauth"},
    {"name": "Zoho Books", "description": "Accounting API", "category": "Finance", "baseUrl": "https://www.zoho.com/books/api/v3/", "authType": "oauth"},
    
    # Fitness
    {"name": "FitBit", "description": "Fitness tracking", "category": "Fitness", "baseUrl": "https://dev.fitbit.com/", "authType": "oauth"},
    {"name": "HealthGraph (RunKeeper)", "description": "Health data", "category": "Fitness", "baseUrl": "https://runkeeper.com/developer/healthgraph/", "authType": "oauth"},
    {"name": "Open Food Facts", "description": "Food database", "category": "Fitness", "baseUrl": "https://world.openfoodfacts.org/data", "authType": "none"},
    {"name": "Strava", "description": "Athletic activity", "category": "Fitness", "baseUrl": "https://developers.strava.com/", "authType": "oauth"},
    {"name": "VeganCheck", "description": "Product vegan check", "category": "Fitness", "baseUrl": "https://jokenetwork.de/vegancheck-api", "authType": "none"},
    {"name": "Withings", "description": "Health devices", "category": "Fitness", "baseUrl": "https://developer.withings.com/", "authType": "oauth"},
    
    # Google APIs
    {"name": "Google BigQuery", "description": "Data warehouse", "category": "Google", "baseUrl": "https://cloud.google.com/bigquery/docs/reference/rest/", "authType": "oauth"},
    {"name": "Google Calendar", "description": "Calendar management", "category": "Google", "baseUrl": "https://developers.google.com/calendar/", "authType": "oauth"},
    {"name": "Google Classroom", "description": "Education platform", "category": "Google", "baseUrl": "https://developers.google.com/classroom/", "authType": "oauth"},
    {"name": "Google CustomSearch", "description": "Custom search engine", "category": "Google", "baseUrl": "https://developers.google.com/custom-search/", "authType": "apiKey"},
    {"name": "Google Fitness", "description": "Health tracking", "category": "Google", "baseUrl": "https://developers.google.com/fit/", "authType": "oauth"},
    {"name": "Google Fonts", "description": "Web fonts", "category": "Google", "baseUrl": "https://developers.google.com/fonts/", "authType": "apiKey"},
    {"name": "Google Genomics", "description": "Genomics data", "category": "Google", "baseUrl": "https://cloud.google.com/genomics/", "authType": "oauth"},
    {"name": "Google Identity", "description": "Identity platform", "category": "Google", "baseUrl": "https://developers.google.com/identity/", "authType": "oauth"},
    {"name": "Google Monitoring", "description": "Cloud monitoring", "category": "Google", "baseUrl": "https://cloud.google.com/monitoring/api/", "authType": "apiKey"},
    
    # Identity Verification
    {"name": "BlockScore", "description": "Identity verification", "category": "Security", "baseUrl": "https://docs.blockscore.com/", "authType": "apiKey"},
    {"name": "Cognito", "description": "Identity verification", "category": "Security", "baseUrl": "https://cognitohq.com/docs", "authType": "apiKey"},
    {"name": "Whitepages Pro", "description": "Identity verification", "category": "Security", "baseUrl": "https://pro.whitepages.com/", "authType": "apiKey"},
    
    # Login & Auth
    {"name": "Auth0", "description": "Authentication platform", "category": "Auth", "baseUrl": "https://auth0.com/docs/api/", "authType": "apiKey"},
    {"name": "Facebook Login", "description": "Facebook authentication", "category": "Auth", "baseUrl": "https://developers.facebook.com/docs/facebook-login", "authType": "oauth"},
    {"name": "GitHub Auth", "description": "GitHub authentication", "category": "Auth", "baseUrl": "https://docs.github.com/en/developers/apps/building-oauth-apps", "authType": "oauth"},
    {"name": "Instagram Auth", "description": "Instagram login", "category": "Auth", "baseUrl": "https://developers.facebook.com/docs/instagram-basic-display-api/", "authType": "oauth"},
    {"name": "LinkedIn Auth", "description": "LinkedIn sign-in", "category": "Auth", "baseUrl": "https://docs.microsoft.com/en-us/linkedin/shared/authentication/", "authType": "oauth"},
    {"name": "PayPal Auth", "description": "PayPal login", "category": "Auth", "baseUrl": "https://developer.paypal.com/docs/log-in-with-paypal/", "authType": "oauth"},
    {"name": "Salesforce Auth", "description": "Salesforce authentication", "category": "Auth", "baseUrl": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm", "authType": "oauth"},
    {"name": "Twitter Auth", "description": "Twitter sign-in", "category": "Auth", "baseUrl": "https://developer.twitter.com/en/docs/authentication", "authType": "oauth"},
    {"name": "WorkOS", "description": "Enterprise SSO", "category": "Auth", "baseUrl": "https://workos.com/docs/", "authType": "apiKey"},
    
    # Test Data
    {"name": "Faker API", "description": "Fake data generation", "category": "Test Data", "baseUrl": "https://fakerapi.it/en", "authType": "none"},
    {"name": "RandomUser", "description": "Random user data", "category": "Test Data", "baseUrl": "https://randomuser.me/", "authType": "none"},
    {"name": "UUID Generator", "description": "Generate UUIDs", "category": "Test Data", "baseUrl": "https://www.uuidgenerator.net/api", "authType": "none"},
    {"name": "Lorem Ipsum", "description": "Placeholder text", "category": "Test Data", "baseUrl": "https://loripsum.net/", "authType": "none"},
    {"name": "Mockaroo", "description": "Test data generation", "category": "Test Data", "baseUrl": "https://www.mockaroo.com/api/docs", "authType": "apiKey"},
    {"name": "Random Data API", "description": "Random data types", "category": "Test Data", "baseUrl": "https://random-data-api.com/documentation", "authType": "none"},
    
    # Text Analysis
    {"name": "Aylien", "description": "NLP and text analysis", "category": "AI/ML", "baseUrl": "https://docs.aylien.com/textapi/", "authType": "apiKey"},
    {"name": "Dandelion", "description": "Semantic text analytics", "category": "AI/ML", "baseUrl": "https://dandelion.eu/docs/", "authType": "apiKey"},
    {"name": "Google Natural Language", "description": "NLP API", "category": "AI/ML", "baseUrl": "https://cloud.google.com/natural-language/docs/", "authType": "apiKey"},
    {"name": "Language Tool", "description": "Grammar checking", "category": "AI/ML", "baseUrl": "https://languagetool.org/http-api/", "authType": "none"},
    {"name": "Lilt", "description": "Translation API", "category": "AI/ML", "baseUrl": "https://lilt.com/docs/api/", "authType": "apiKey"},
    {"name": "Meaning Cloud", "description": "Text analytics", "category": "AI/ML", "baseUrl": "https://www.meaningcloud.com/developer/", "authType": "apiKey"},
    {"name": "TextRazor", "description": "Text analysis", "category": "AI/ML", "baseUrl": "https://www.textrazor.com/docs", "authType": "apiKey"},
    {"name": "Tisane", "description": "NLP for abuse detection", "category": "AI/ML", "baseUrl": "https://tisane.ai/docs/", "authType": "apiKey"},
    
    # Tracking
    {"name": "AfterShip", "description": "Shipment tracking", "category": "Tracking", "baseUrl": "https://www.aftership.com/docs/aftership", "authType": "apiKey"},
    {"name": "Easypost", "description": "Shipping API", "category": "Tracking", "baseUrl": "https://www.easypost.com/docs/api", "authType": "apiKey"},
    {"name": "Postmates", "description": "Local delivery", "category": "Tracking", "baseUrl": "https://developer.postmates.com/docs", "authType": "apiKey"},
    {"name": "Ship24", "description": "Universal tracking", "category": "Tracking", "baseUrl": "https://www.ship24.com/en/developer", "authType": "apiKey"},
    {"name": "Shippo", "description": "Shipping rates and labels", "category": "Tracking", "baseUrl": "https://goshippo.com/docs/", "authType": "apiKey"},
    {"name": "TrackingMore", "description": "Multi-carrier tracking", "category": "Tracking", "baseUrl": "https://www.trackingmore.com/api-index.html", "authType": "apiKey"},
    {"name": "UPS", "description": "UPS shipping", "category": "Tracking", "baseUrl": "https://www.ups.com/upsdeveloperkit", "authType": "apiKey"},
    {"name": "USPS", "description": "US Postal Service", "category": "Tracking", "baseUrl": "https://www.usps.com/business/web-tools-apis/", "authType": "apiKey"},
    {"name": "FedEx", "description": "FedEx shipping", "category": "Tracking", "baseUrl": "https://developer.fedex.com/api/en-us/home.html", "authType": "apiKey"},
    {"name": "DHL", "description": "DHL shipping", "category": "Tracking", "baseUrl": "https://developer.dhl.com/", "authType": "apiKey"},
    
    # Web Scraping & Screenshots
    {"name": "ApiFlash", "description": "Screenshot API", "category": "Development", "baseUrl": "https://apiflash.com/", "authType": "apiKey"},
    {"name": "Browshot", "description": "Screenshot service", "category": "Development", "baseUrl": "https://browshot.com/api/documentation", "authType": "apiKey"},
    {"name": "ProxyCrawl", "description": "Web scraping proxy", "category": "Development", "baseUrl": "https://proxycrawl.com/", "authType": "apiKey"},
    {"name": "ScrapeNinja", "description": "Web scraping", "category": "Development", "baseUrl": "https://scrapeninja.net/", "authType": "apiKey"},
    {"name": "ScraperAPI", "description": "Web scraping", "category": "Development", "baseUrl": "https://www.scraperapi.com/", "authType": "apiKey"},
    {"name": "scrapestack", "description": "Web scraping", "category": "Development", "baseUrl": "https://scrapestack.com/", "authType": "apiKey"},
    {"name": "ScrapingAnt", "description": "Headless scraping", "category": "Development", "baseUrl": "https://scrapingant.com/", "authType": "apiKey"},
    {"name": "ScrapingDog", "description": "Proxy scraping", "category": "Development", "baseUrl": "https://www.scrapingdog.com/", "authType": "apiKey"},
    {"name": "ScreenshotAPI", "description": "Website screenshots", "category": "Development", "baseUrl": "https://screenshotapi.net/", "authType": "apiKey"},
    {"name": "serpstack", "description": "Search result scraping", "category": "Development", "baseUrl": "https://serpstack.com/", "authType": "apiKey"},
    {"name": "WebScraping.AI", "description": "AI web scraping", "category": "Development", "baseUrl": "https://webscraping.ai/", "authType": "apiKey"},
    {"name": "ZenRows", "description": "Anti-bot bypass", "category": "Development", "baseUrl": "https://www.zenrows.com/", "authType": "apiKey"},
]

def main():
    print("🦞 APIClaw Night Expansion 03:00 - Batch 2")
    print("=" * 50)
    
    registry = load_registry()
    current_count = registry.get("count", 0)
    apis = registry.get("apis", [])
    
    print(f"Current count: {current_count}")
    
    existing_names = set(api.get("name", "").lower() for api in apis)
    
    added = 0
    for new_api in BATCH2_APIS:
        if new_api["name"].lower() not in existing_names:
            api_entry = {
                "id": generate_id(new_api["name"], new_api["category"]),
                "name": new_api["name"],
                "description": new_api["description"],
                "category": new_api["category"],
                "baseUrl": new_api["baseUrl"],
                "authType": new_api["authType"],
                "pricingModel": "freemium",
                "source": "night-expansion-03-batch2"
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
