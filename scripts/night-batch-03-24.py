#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-24 03:00
Mål: +1000 APIs
"""

import json
import os
import subprocess
from datetime import datetime

# APIs parsed from public-apis/public-apis README
NEW_APIS = [
    # === ANIMALS ===
    {"name": "AdoptAPet", "description": "Resource to help get pets adopted", "category": "Animals", "baseUrl": "https://www.adoptapet.com/public/apis/pet_list.html", "authType": "apiKey"},
    {"name": "Axolotl API", "description": "Collection of axolotl pictures and facts", "category": "Animals", "baseUrl": "https://theaxolotlapi.netlify.app/", "authType": "none"},
    {"name": "Cat Facts", "description": "Daily cat facts", "category": "Animals", "baseUrl": "https://alexwohlbruck.github.io/cat-facts/", "authType": "none"},
    {"name": "Cataas", "description": "Cat as a service - cats pictures and gifs", "category": "Animals", "baseUrl": "https://cataas.com/", "authType": "none"},
    {"name": "The Cat API", "description": "Pictures of cats from Tumblr", "category": "Animals", "baseUrl": "https://docs.thecatapi.com/", "authType": "apiKey"},
    {"name": "Dog Facts", "description": "Random dog facts API", "category": "Animals", "baseUrl": "https://dukengn.github.io/Dog-facts-API/", "authType": "none"},
    {"name": "Dog CEO", "description": "Dog pictures based on Stanford Dogs Dataset", "category": "Animals", "baseUrl": "https://dog.ceo/dog-api/", "authType": "none"},
    {"name": "eBird", "description": "Retrieve birding observations within a region", "category": "Animals", "baseUrl": "https://documenter.getpostman.com/view/664302/S1ENwy59", "authType": "apiKey"},
    {"name": "FishWatch", "description": "Information and pictures about fish species", "category": "Animals", "baseUrl": "https://www.fishwatch.gov/developers", "authType": "none"},
    {"name": "HTTP Cat", "description": "Cat images for every HTTP status", "category": "Animals", "baseUrl": "https://http.cat/", "authType": "none"},
    {"name": "HTTP Dog", "description": "Dog images for every HTTP status", "category": "Animals", "baseUrl": "https://http.dog/", "authType": "none"},
    {"name": "IUCN Red List", "description": "Threatened species database", "category": "Animals", "baseUrl": "http://apiv3.iucnredlist.org/api/v3/docs", "authType": "apiKey"},
    {"name": "MeowFacts", "description": "Random cat facts", "category": "Animals", "baseUrl": "https://github.com/wh-iterabb-it/meowfacts", "authType": "none"},
    {"name": "Movebank", "description": "Movement and migration data of animals", "category": "Animals", "baseUrl": "https://github.com/movebank/movebank-api-doc", "authType": "none"},
    {"name": "Petfinder", "description": "Find pets for adoption", "category": "Animals", "baseUrl": "https://www.petfinder.com/developers/", "authType": "apiKey"},
    {"name": "PlaceBear", "description": "Placeholder bear pictures", "category": "Animals", "baseUrl": "https://placebear.com/", "authType": "none"},
    {"name": "PlaceDog", "description": "Placeholder dog pictures", "category": "Animals", "baseUrl": "https://place.dog", "authType": "none"},
    {"name": "PlaceKitten", "description": "Placeholder kitten pictures", "category": "Animals", "baseUrl": "https://placekitten.com/", "authType": "none"},
    {"name": "RandomDog", "description": "Random pictures of dogs", "category": "Animals", "baseUrl": "https://random.dog/", "authType": "none"},
    {"name": "RandomDuck", "description": "Random pictures of ducks", "category": "Animals", "baseUrl": "https://random-d.uk/api", "authType": "none"},
    {"name": "RandomFox", "description": "Random pictures of foxes", "category": "Animals", "baseUrl": "https://randomfox.ca/", "authType": "none"},
    {"name": "RescueGroups", "description": "Pet adoption API", "category": "Animals", "baseUrl": "https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home", "authType": "none"},
    {"name": "Shibe.Online", "description": "Random Shiba Inu, cats or birds pictures", "category": "Animals", "baseUrl": "http://shibe.online/", "authType": "none"},
    {"name": "The Dog API", "description": "Public service about dogs", "category": "Animals", "baseUrl": "https://thedogapi.com/", "authType": "apiKey"},
    {"name": "xeno-canto", "description": "Bird recordings database", "category": "Animals", "baseUrl": "https://xeno-canto.org/explore/api", "authType": "none"},
    {"name": "Zoo Animals", "description": "Facts and pictures of zoo animals", "category": "Animals", "baseUrl": "https://zoo-animal-api.herokuapp.com/", "authType": "none"},

    # === ANIME ===
    {"name": "AniAPI", "description": "Anime discovery, streaming & tracking", "category": "Anime", "baseUrl": "https://aniapi.com/docs/", "authType": "oauth"},
    {"name": "AniDB", "description": "Anime database", "category": "Anime", "baseUrl": "https://wiki.anidb.net/HTTP_API_Definition", "authType": "apiKey"},
    {"name": "AniList", "description": "Anime discovery & tracking GraphQL", "category": "Anime", "baseUrl": "https://github.com/AniList/ApiV2-GraphQL-Docs", "authType": "oauth"},
    {"name": "AnimeChan", "description": "Anime quotes over 10k+", "category": "Anime", "baseUrl": "https://github.com/RocktimSaikia/anime-chan", "authType": "none"},
    {"name": "AnimeFacts", "description": "Anime facts over 100+", "category": "Anime", "baseUrl": "https://chandan-02.github.io/anime-facts-rest-api/", "authType": "none"},
    {"name": "AnimeNewsNetwork", "description": "Anime industry news", "category": "Anime", "baseUrl": "https://www.animenewsnetwork.com/encyclopedia/api.php", "authType": "none"},
    {"name": "Catboy", "description": "Neko images and funny GIFs", "category": "Anime", "baseUrl": "https://catboys.com/api", "authType": "none"},
    {"name": "Danbooru", "description": "Anime artist database", "category": "Anime", "baseUrl": "https://danbooru.donmai.us/wiki_pages/help:api", "authType": "apiKey"},
    {"name": "Jikan", "description": "Unofficial MyAnimeList API", "category": "Anime", "baseUrl": "https://jikan.moe", "authType": "none"},
    {"name": "Kitsu", "description": "Anime discovery platform", "category": "Anime", "baseUrl": "https://kitsu.docs.apiary.io/", "authType": "oauth"},
    {"name": "MangaDex", "description": "Manga database and community", "category": "Anime", "baseUrl": "https://api.mangadex.org/docs.html", "authType": "apiKey"},
    {"name": "MyAnimeList", "description": "Anime and manga database", "category": "Anime", "baseUrl": "https://myanimelist.net/apiconfig/references/api/v2", "authType": "oauth"},
    {"name": "NekosBest", "description": "Neko images & anime GIFs", "category": "Anime", "baseUrl": "https://docs.nekos.best", "authType": "none"},
    {"name": "Shikimori", "description": "Anime discovery and tracking", "category": "Anime", "baseUrl": "https://shikimori.one/api/doc", "authType": "oauth"},
    {"name": "Studio Ghibli API", "description": "Resources from Studio Ghibli films", "category": "Anime", "baseUrl": "https://ghibliapi.vercel.app/", "authType": "none"},
    {"name": "Trace.moe", "description": "Find anime scene from screenshot", "category": "Anime", "baseUrl": "https://soruly.github.io/trace.moe-api/", "authType": "none"},
    {"name": "Waifu.im", "description": "Waifu pictures archive", "category": "Anime", "baseUrl": "https://waifu.im/docs", "authType": "none"},
    {"name": "Waifu.pics", "description": "Anime image sharing platform", "category": "Anime", "baseUrl": "https://waifu.pics/docs", "authType": "none"},

    # === ANTI-MALWARE / SECURITY ===
    {"name": "AbuseIPDB", "description": "IP/domain/URL reputation", "category": "Security", "baseUrl": "https://docs.abuseipdb.com/", "authType": "apiKey"},
    {"name": "AlienVault OTX", "description": "Open Threat Exchange API", "category": "Security", "baseUrl": "https://otx.alienvault.com/api", "authType": "apiKey"},
    {"name": "CAPEsandbox", "description": "Malware execution and analysis", "category": "Security", "baseUrl": "https://capev2.readthedocs.io/en/latest/usage/api.html", "authType": "apiKey"},
    {"name": "Google Safe Browsing", "description": "Link/domain flagging service", "category": "Security", "baseUrl": "https://developers.google.com/safe-browsing/", "authType": "apiKey"},
    {"name": "MalDatabase", "description": "Malware datasets and threat intelligence", "category": "Security", "baseUrl": "https://maldatabase.com/api-doc.html", "authType": "apiKey"},
    {"name": "MalShare", "description": "Malware archive and file sourcing", "category": "Security", "baseUrl": "https://malshare.com/doc.php", "authType": "apiKey"},
    {"name": "MalwareBazaar", "description": "Collect and share malware samples", "category": "Security", "baseUrl": "https://bazaar.abuse.ch/api/", "authType": "apiKey"},
    {"name": "Metacert", "description": "Link flagging service", "category": "Security", "baseUrl": "https://metacert.com/", "authType": "apiKey"},
    {"name": "NoPhishy", "description": "Check links for phishing attempts", "category": "Security", "baseUrl": "https://rapidapi.com/Amiichu/api/exerra-phishing-check/", "authType": "apiKey"},
    {"name": "Phisherman", "description": "IP/domain/URL reputation", "category": "Security", "baseUrl": "https://phisherman.gg/", "authType": "apiKey"},
    {"name": "Scanii", "description": "Scan documents for threats", "category": "Security", "baseUrl": "https://docs.scanii.com/", "authType": "apiKey"},
    {"name": "URLhaus", "description": "Malware URL database", "category": "Security", "baseUrl": "https://urlhaus-api.abuse.ch/", "authType": "none"},
    {"name": "URLScan.io", "description": "Scan and analyse URLs", "category": "Security", "baseUrl": "https://urlscan.io/about-api/", "authType": "apiKey"},
    {"name": "VirusTotal", "description": "File/URL analysis", "category": "Security", "baseUrl": "https://www.virustotal.com/en/documentation/public-api/", "authType": "apiKey"},
    {"name": "Web of Trust", "description": "Website reputation API", "category": "Security", "baseUrl": "https://support.mywot.com/hc/en-us/sections/360004477734-API-", "authType": "apiKey"},

    # === ART & DESIGN ===
    {"name": "Améthyste", "description": "Generate images for Discord users", "category": "Art & Design", "baseUrl": "https://api.amethyste.moe/", "authType": "apiKey"},
    {"name": "Art Institute of Chicago", "description": "Art collection API", "category": "Art & Design", "baseUrl": "https://api.artic.edu/docs/", "authType": "none"},
    {"name": "Colormind", "description": "Color scheme generator", "category": "Art & Design", "baseUrl": "http://colormind.io/api-access/", "authType": "none"},
    {"name": "ColourLovers", "description": "Patterns, palettes and images", "category": "Art & Design", "baseUrl": "http://www.colourlovers.com/api", "authType": "none"},
    {"name": "Cooper Hewitt", "description": "Smithsonian Design Museum", "category": "Art & Design", "baseUrl": "https://collection.cooperhewitt.org/api", "authType": "apiKey"},
    {"name": "Dribbble API", "description": "Top designers & creatives", "category": "Art & Design", "baseUrl": "https://developer.dribbble.com", "authType": "oauth"},
    {"name": "EmojiHub", "description": "Get emojis by categories", "category": "Art & Design", "baseUrl": "https://github.com/cheatsnake/emojihub", "authType": "none"},
    {"name": "Europeana", "description": "European museum content", "category": "Art & Design", "baseUrl": "https://pro.europeana.eu/resources/apis/search", "authType": "apiKey"},
    {"name": "Harvard Art Museums", "description": "Art collection API", "category": "Art & Design", "baseUrl": "https://github.com/harvardartmuseums/api-docs", "authType": "apiKey"},
    {"name": "Icon Horse", "description": "Favicon for any website", "category": "Art & Design", "baseUrl": "https://icon.horse", "authType": "none"},
    {"name": "Iconfinder", "description": "Icon search API", "category": "Art & Design", "baseUrl": "https://developer.iconfinder.com", "authType": "apiKey"},
    {"name": "Icons8", "description": "Icon search and download", "category": "Art & Design", "baseUrl": "https://img.icons8.com/", "authType": "none"},
    {"name": "Lordicon", "description": "Animated icons", "category": "Art & Design", "baseUrl": "https://lordicon.com/", "authType": "none"},
    {"name": "Metropolitan Museum", "description": "Met Museum art collection", "category": "Art & Design", "baseUrl": "https://metmuseum.github.io/", "authType": "none"},
    {"name": "Noun Project", "description": "Icons API", "category": "Art & Design", "baseUrl": "http://api.thenounproject.com/index.html", "authType": "oauth"},
    {"name": "PHP-Noise", "description": "Noise background image generator", "category": "Art & Design", "baseUrl": "https://php-noise.com/", "authType": "none"},
    {"name": "Pixel Encounter", "description": "SVG icon generator", "category": "Art & Design", "baseUrl": "https://pixelencounter.com/api", "authType": "none"},
    {"name": "Rijksmuseum", "description": "Dutch art museum data", "category": "Art & Design", "baseUrl": "https://data.rijksmuseum.nl/object-metadata/api/", "authType": "apiKey"},
    {"name": "Word Cloud API", "description": "Create word clouds", "category": "Art & Design", "baseUrl": "https://wordcloudapi.com/", "authType": "apiKey"},
    {"name": "xColors", "description": "Generate & convert colors", "category": "Art & Design", "baseUrl": "https://x-colors.herokuapp.com/", "authType": "none"},

    # === AUTHENTICATION ===
    {"name": "Auth0 API", "description": "Authentication platform", "category": "Authentication", "baseUrl": "https://auth0.com/docs/api", "authType": "apiKey"},
    {"name": "GetOTP", "description": "OTP flow implementation", "category": "Authentication", "baseUrl": "https://otp.dev/en/docs/", "authType": "apiKey"},
    {"name": "Micro User Service", "description": "User management and auth", "category": "Authentication", "baseUrl": "https://m3o.com/user", "authType": "apiKey"},
    {"name": "MojoAuth", "description": "Passwordless authentication", "category": "Authentication", "baseUrl": "https://mojoauth.com", "authType": "apiKey"},
    {"name": "SAWO Labs", "description": "Passwordless auth integration", "category": "Authentication", "baseUrl": "https://sawolabs.com", "authType": "apiKey"},
    {"name": "Stytch", "description": "User infrastructure for apps", "category": "Authentication", "baseUrl": "https://stytch.com/", "authType": "apiKey"},
    {"name": "Warrant", "description": "Authorization and access control", "category": "Authentication", "baseUrl": "https://warrant.dev/", "authType": "apiKey"},

    # === BLOCKCHAIN ===
    {"name": "Bitquery", "description": "Onchain GraphQL APIs", "category": "Blockchain", "baseUrl": "https://graphql.bitquery.io/ide", "authType": "apiKey"},
    {"name": "Chainlink", "description": "Hybrid smart contracts", "category": "Blockchain", "baseUrl": "https://chain.link/developer-resources", "authType": "none"},
    {"name": "Chainpoint", "description": "Anchor data to Bitcoin", "category": "Blockchain", "baseUrl": "https://tierion.com/chainpoint/", "authType": "none"},
    {"name": "Covalent", "description": "Multi-blockchain data aggregator", "category": "Blockchain", "baseUrl": "https://www.covalenthq.com/docs/api/", "authType": "apiKey"},
    {"name": "Etherscan", "description": "Ethereum explorer API", "category": "Blockchain", "baseUrl": "https://etherscan.io/apis", "authType": "apiKey"},
    {"name": "Helium", "description": "Helium network API", "category": "Blockchain", "baseUrl": "https://docs.helium.com/api/blockchain/introduction/", "authType": "none"},
    {"name": "NowNodes", "description": "Blockchain-as-a-service", "category": "Blockchain", "baseUrl": "https://nownodes.io/", "authType": "apiKey"},
    {"name": "Steem", "description": "Blockchain blogging platform", "category": "Blockchain", "baseUrl": "https://developers.steem.io/", "authType": "none"},
    {"name": "The Graph", "description": "Indexing protocol for Ethereum", "category": "Blockchain", "baseUrl": "https://thegraph.com", "authType": "apiKey"},
    {"name": "Walltime", "description": "Market info API", "category": "Blockchain", "baseUrl": "https://walltime.info/api.html", "authType": "none"},
    {"name": "Watchdata", "description": "Ethereum blockchain access", "category": "Blockchain", "baseUrl": "https://docs.watchdata.io", "authType": "apiKey"},

    # === BOOKS ===
    {"name": "A Bíblia Digital", "description": "Bible versions API", "category": "Books", "baseUrl": "https://www.abibliadigital.com.br/en", "authType": "apiKey"},
    {"name": "Bhagavad Gita API", "description": "Bhagavad Gita text translations", "category": "Books", "baseUrl": "https://docs.bhagavadgitaapi.in", "authType": "apiKey"},
    {"name": "Bible-api", "description": "Free Bible API multiple languages", "category": "Books", "baseUrl": "https://bible-api.com/", "authType": "none"},
    {"name": "British National Bibliography", "description": "Books metadata", "category": "Books", "baseUrl": "http://bnb.data.bl.uk/", "authType": "none"},
    {"name": "Crossref", "description": "Books & articles metadata", "category": "Books", "baseUrl": "https://github.com/CrossRef/rest-api-doc", "authType": "none"},
    {"name": "Ganjoor", "description": "Classic Persian poetry", "category": "Books", "baseUrl": "https://api.ganjoor.net", "authType": "oauth"},
    {"name": "Google Books", "description": "Books search and metadata", "category": "Books", "baseUrl": "https://developers.google.com/books/", "authType": "oauth"},
    {"name": "GurbaniNow", "description": "Gurbani RESTful API", "category": "Books", "baseUrl": "https://github.com/GurbaniNow/api", "authType": "none"},
    {"name": "Gutendex", "description": "Project Gutenberg books", "category": "Books", "baseUrl": "https://gutendex.com/", "authType": "none"},
    {"name": "Open Library", "description": "Books database", "category": "Books", "baseUrl": "https://openlibrary.org/developers/api", "authType": "none"},
    {"name": "Penguin Publishing", "description": "Books and covers data", "category": "Books", "baseUrl": "http://www.penguinrandomhouse.biz/webservices/rest/", "authType": "none"},
    {"name": "PoetryDB", "description": "Poetry collection API", "category": "Books", "baseUrl": "https://github.com/thundercomb/poetrydb", "authType": "none"},
    {"name": "Quran API", "description": "Quran data API", "category": "Books", "baseUrl": "https://quran.api-docs.io/", "authType": "none"},
    {"name": "Quran Cloud", "description": "RESTful Quran API", "category": "Books", "baseUrl": "https://alquran.cloud/api", "authType": "none"},
    {"name": "The Bible API", "description": "Bible data and search", "category": "Books", "baseUrl": "https://docs.api.bible", "authType": "apiKey"},
    {"name": "Thirukkural", "description": "Tamil poems and explanation", "category": "Books", "baseUrl": "https://api-thirukkural.web.app/", "authType": "none"},
    {"name": "Wizard World", "description": "Harry Potter universe data", "category": "Books", "baseUrl": "https://wizard-world-api.herokuapp.com/swagger/index.html", "authType": "none"},
    {"name": "Wolne Lektury", "description": "Polish e-books API", "category": "Books", "baseUrl": "https://wolnelektury.pl/api/", "authType": "none"},

    # === BUSINESS ===
    {"name": "Apache Superset", "description": "BI dashboards API", "category": "Business", "baseUrl": "https://superset.apache.org/docs/api", "authType": "apiKey"},
    {"name": "Charity Search", "description": "Non-profit charity data", "category": "Business", "baseUrl": "http://charityapi.orghunter.com/", "authType": "apiKey"},
    {"name": "Clearbit Logo", "description": "Company logo search", "category": "Business", "baseUrl": "https://clearbit.com/docs#logo-api", "authType": "apiKey"},
    {"name": "Domainsdb", "description": "Registered domain search", "category": "Business", "baseUrl": "https://domainsdb.info/", "authType": "none"},
    {"name": "Freelancer API", "description": "Hire freelancers platform", "category": "Business", "baseUrl": "https://developers.freelancer.com", "authType": "oauth"},
    {"name": "Gmail API", "description": "Access Gmail inbox", "category": "Business", "baseUrl": "https://developers.google.com/gmail/api/", "authType": "oauth"},
    {"name": "Google Analytics", "description": "Analytics reporting API", "category": "Business", "baseUrl": "https://developers.google.com/analytics/", "authType": "oauth"},
    {"name": "Instatus", "description": "Status page API", "category": "Business", "baseUrl": "https://instatus.com/help/api", "authType": "apiKey"},
    {"name": "Mailchimp", "description": "Marketing email API", "category": "Business", "baseUrl": "https://mailchimp.com/developer/", "authType": "apiKey"},
    {"name": "Mailjet", "description": "Email sending API", "category": "Business", "baseUrl": "https://www.mailjet.com/", "authType": "apiKey"},
    {"name": "markerapi", "description": "Trademark search", "category": "Business", "baseUrl": "https://markerapi.com", "authType": "none"},
    {"name": "ORB Intelligence", "description": "Company lookup API", "category": "Business", "baseUrl": "https://api.orb-intelligence.com/docs/", "authType": "apiKey"},
    {"name": "Redash", "description": "Queries and dashboards API", "category": "Business", "baseUrl": "https://redash.io/help/user-guide/integrations-and-api/api", "authType": "apiKey"},
    {"name": "Smartsheet", "description": "Project management API", "category": "Business", "baseUrl": "https://smartsheet.redoc.ly/", "authType": "oauth"},
    {"name": "Square", "description": "Payment and commerce API", "category": "Business", "baseUrl": "https://developer.squareup.com/reference/square", "authType": "oauth"},
    {"name": "SwiftKanban", "description": "Kanban software API", "category": "Business", "baseUrl": "https://www.digite.com/knowledge-base/swiftkanban/article/api-for-swift-kanban-web-services/", "authType": "apiKey"},
    {"name": "Tomba", "description": "Email finder for B2B", "category": "Business", "baseUrl": "https://tomba.io/api", "authType": "apiKey"},
    {"name": "Trello API", "description": "Project boards API", "category": "Business", "baseUrl": "https://developers.trello.com/", "authType": "oauth"},

    # === CALENDAR ===
    {"name": "Abstract Holidays", "description": "Public holidays API", "category": "Calendar", "baseUrl": "https://www.abstractapi.com/holidays-api", "authType": "apiKey"},
    {"name": "Calendarific", "description": "Worldwide holidays", "category": "Calendar", "baseUrl": "https://calendarific.com/", "authType": "apiKey"},
    {"name": "Checkiday", "description": "Holiday API over 5000 holidays", "category": "Calendar", "baseUrl": "https://apilayer.com/marketplace/checkiday-api", "authType": "apiKey"},
    {"name": "Church Calendar", "description": "Catholic liturgical calendar", "category": "Calendar", "baseUrl": "http://calapi.inadiutorium.cz/", "authType": "none"},
    {"name": "Festivo", "description": "Public holidays and observances", "category": "Calendar", "baseUrl": "https://docs.getfestivo.com/docs/products/public-holidays-api/intro", "authType": "apiKey"},
    {"name": "Google Calendar API", "description": "Calendar events management", "category": "Calendar", "baseUrl": "https://developers.google.com/google-apps/calendar/", "authType": "oauth"},
    {"name": "Hebrew Calendar", "description": "Gregorian to Hebrew conversion", "category": "Calendar", "baseUrl": "https://www.hebcal.com/home/developer-apis", "authType": "none"},
    {"name": "Holiday API", "description": "Historical holidays data", "category": "Calendar", "baseUrl": "https://holidayapi.com/", "authType": "apiKey"},
    {"name": "Nager.Date", "description": "Public holidays 90+ countries", "category": "Calendar", "baseUrl": "https://date.nager.at", "authType": "none"},
    {"name": "Namedays Calendar", "description": "Namedays for countries", "category": "Calendar", "baseUrl": "https://nameday.abalin.net", "authType": "none"},
    {"name": "UK Bank Holidays", "description": "UK bank holidays JSON", "category": "Calendar", "baseUrl": "https://www.gov.uk/bank-holidays.json", "authType": "none"},

    # === CLOUD STORAGE ===
    {"name": "AnonFiles", "description": "Anonymous file upload", "category": "Cloud Storage", "baseUrl": "https://anonfiles.com/docs/api", "authType": "none"},
    {"name": "BayFiles", "description": "File upload and share", "category": "Cloud Storage", "baseUrl": "https://bayfiles.com/docs/api", "authType": "none"},
    {"name": "Box", "description": "File sharing and storage", "category": "Cloud Storage", "baseUrl": "https://developer.box.com/", "authType": "oauth"},
    {"name": "Dropbox API", "description": "File sharing and storage", "category": "Cloud Storage", "baseUrl": "https://www.dropbox.com/developers", "authType": "oauth"},
    {"name": "File.io", "description": "Simple file sharing", "category": "Cloud Storage", "baseUrl": "https://www.file.io", "authType": "none"},
    {"name": "Filestack", "description": "File upload API", "category": "Cloud Storage", "baseUrl": "https://www.filestack.com", "authType": "apiKey"},
    {"name": "GoFile", "description": "Unlimited file uploads", "category": "Cloud Storage", "baseUrl": "https://gofile.io/api", "authType": "apiKey"},
    {"name": "Google Drive API", "description": "Cloud file storage", "category": "Cloud Storage", "baseUrl": "https://developers.google.com/drive/", "authType": "oauth"},
    {"name": "Gyazo", "description": "Screenshot sharing", "category": "Cloud Storage", "baseUrl": "https://gyazo.com/api/docs", "authType": "apiKey"},
    {"name": "Imgbb", "description": "Image hosting API", "category": "Cloud Storage", "baseUrl": "https://api.imgbb.com/", "authType": "apiKey"},
    {"name": "OneDrive API", "description": "Microsoft cloud storage", "category": "Cloud Storage", "baseUrl": "https://developer.microsoft.com/onedrive", "authType": "oauth"},
    {"name": "Pantry", "description": "Free JSON storage", "category": "Cloud Storage", "baseUrl": "https://getpantry.cloud/", "authType": "none"},
    {"name": "Pastebin", "description": "Plain text storage", "category": "Cloud Storage", "baseUrl": "https://pastebin.com/doc_api", "authType": "apiKey"},
    {"name": "Pinata", "description": "IPFS pinning services", "category": "Cloud Storage", "baseUrl": "https://docs.pinata.cloud/", "authType": "apiKey"},
    {"name": "Storj", "description": "Decentralized cloud storage", "category": "Cloud Storage", "baseUrl": "https://docs.storj.io/dcs/", "authType": "apiKey"},
    {"name": "Web3.Storage", "description": "IPFS file storage 1TB free", "category": "Cloud Storage", "baseUrl": "https://web3.storage/", "authType": "apiKey"},

    # === CI/CD ===
    {"name": "Azure DevOps Health", "description": "Resource health diagnostics", "category": "CI/CD", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/resourcehealth", "authType": "apiKey"},
    {"name": "Bitrise", "description": "Mobile CI/CD platform", "category": "CI/CD", "baseUrl": "https://api-docs.bitrise.io/", "authType": "apiKey"},
    {"name": "Buddy", "description": "CI/CD platform", "category": "CI/CD", "baseUrl": "https://buddy.works/docs/api/getting-started/overview", "authType": "oauth"},
    {"name": "CircleCI", "description": "Continuous integration", "category": "CI/CD", "baseUrl": "https://circleci.com/docs/api/v1-reference/", "authType": "apiKey"},
    {"name": "Codeship", "description": "Cloud-based CI platform", "category": "CI/CD", "baseUrl": "https://docs.cloudbees.com/docs/cloudbees-codeship/latest/api-overview/", "authType": "apiKey"},
    {"name": "Travis CI", "description": "Continuous integration", "category": "CI/CD", "baseUrl": "https://docs.travis-ci.com/api/", "authType": "apiKey"},

    # === CRYPTOCURRENCY ===
    {"name": "0x Protocol", "description": "DEX liquidity API", "category": "Cryptocurrency", "baseUrl": "https://0x.org/api", "authType": "none"},
    {"name": "1inch", "description": "DEX aggregator API", "category": "Cryptocurrency", "baseUrl": "https://1inch.io/api/", "authType": "none"},
    {"name": "Alchemy Ethereum", "description": "Ethereum Node-as-a-Service", "category": "Cryptocurrency", "baseUrl": "https://docs.alchemy.com/alchemy/", "authType": "apiKey"},
    {"name": "Coinlayer", "description": "Crypto exchange rates", "category": "Cryptocurrency", "baseUrl": "https://coinlayer.com", "authType": "apiKey"},
    {"name": "Binance", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://github.com/binance/binance-spot-api-docs", "authType": "apiKey"},
    {"name": "Bitcambio", "description": "Brazilian crypto exchange", "category": "Cryptocurrency", "baseUrl": "https://nova.bitcambio.com.br/api/v3/docs", "authType": "none"},
    {"name": "BitcoinAverage", "description": "Digital asset price data", "category": "Cryptocurrency", "baseUrl": "https://apiv2.bitcoinaverage.com/", "authType": "apiKey"},
    {"name": "BitcoinCharts", "description": "Bitcoin network data", "category": "Cryptocurrency", "baseUrl": "https://bitcoincharts.com/about/exchanges/", "authType": "none"},
    {"name": "Bitfinex", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://docs.bitfinex.com/docs", "authType": "apiKey"},
    {"name": "Bitmex", "description": "Crypto derivatives trading", "category": "Cryptocurrency", "baseUrl": "https://www.bitmex.com/app/apiOverview", "authType": "apiKey"},
    {"name": "Bittrex", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://bittrex.github.io/api/v3", "authType": "apiKey"},
    {"name": "Block.io", "description": "Bitcoin wallet API", "category": "Cryptocurrency", "baseUrl": "https://block.io/docs/basic", "authType": "apiKey"},
    {"name": "Blockchain.com", "description": "Bitcoin payment and wallet", "category": "Cryptocurrency", "baseUrl": "https://www.blockchain.com/api", "authType": "apiKey"},
    {"name": "Blockfrost Cardano", "description": "Cardano blockchain API", "category": "Cryptocurrency", "baseUrl": "https://blockfrost.io/", "authType": "apiKey"},
    {"name": "Brave NewCoin", "description": "Crypto data 200+ exchanges", "category": "Cryptocurrency", "baseUrl": "https://bravenewcoin.com/developers", "authType": "apiKey"},
    {"name": "BtcTurk", "description": "Crypto data and trading", "category": "Cryptocurrency", "baseUrl": "https://docs.btcturk.com/", "authType": "apiKey"},
    {"name": "Bybit", "description": "Crypto data feed", "category": "Cryptocurrency", "baseUrl": "https://bybit-exchange.github.io/docs/linear/", "authType": "apiKey"},
    {"name": "CoinAPI", "description": "All currency exchanges API", "category": "Cryptocurrency", "baseUrl": "https://docs.coinapi.io/", "authType": "apiKey"},
    {"name": "Coinbase", "description": "Crypto prices and wallets", "category": "Cryptocurrency", "baseUrl": "https://developers.coinbase.com", "authType": "apiKey"},
    {"name": "Coinbase Pro", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://docs.pro.coinbase.com/", "authType": "apiKey"},
    {"name": "CoinCap", "description": "Real-time crypto prices", "category": "Cryptocurrency", "baseUrl": "https://docs.coincap.io/", "authType": "none"},
    {"name": "CoinDCX", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://docs.coindcx.com/", "authType": "apiKey"},
    {"name": "CoinDesk", "description": "Bitcoin Price Index", "category": "Cryptocurrency", "baseUrl": "https://old.coindesk.com/coindesk-api/", "authType": "none"},
    {"name": "CoinGecko", "description": "Crypto price and market data", "category": "Cryptocurrency", "baseUrl": "http://www.coingecko.com/api", "authType": "none"},
    {"name": "Coinigy", "description": "Exchange account management", "category": "Cryptocurrency", "baseUrl": "https://coinigy.docs.apiary.io", "authType": "apiKey"},
    {"name": "Coinlib", "description": "Crypto currency prices", "category": "Cryptocurrency", "baseUrl": "https://coinlib.io/apidocs", "authType": "apiKey"},
    {"name": "Coinlore", "description": "Crypto prices and volume", "category": "Cryptocurrency", "baseUrl": "https://www.coinlore.com/cryptocurrency-data-api", "authType": "none"},
    {"name": "CoinMarketCap", "description": "Crypto prices API", "category": "Cryptocurrency", "baseUrl": "https://coinmarketcap.com/api/", "authType": "apiKey"},
    {"name": "Coinpaprika", "description": "Crypto prices and volume", "category": "Cryptocurrency", "baseUrl": "https://api.coinpaprika.com", "authType": "none"},
    {"name": "CoinRanking", "description": "Live crypto data", "category": "Cryptocurrency", "baseUrl": "https://developers.coinranking.com/api/documentation", "authType": "apiKey"},
    {"name": "CoinStats", "description": "Crypto tracker API", "category": "Cryptocurrency", "baseUrl": "https://documenter.getpostman.com/view/5734027/RzZ6Hzr3", "authType": "none"},
    {"name": "CryptAPI", "description": "Crypto payment processor", "category": "Cryptocurrency", "baseUrl": "https://docs.cryptapi.io/", "authType": "none"},
    {"name": "CryptoCompare", "description": "Crypto comparison API", "category": "Cryptocurrency", "baseUrl": "https://www.cryptocompare.com/api", "authType": "none"},
    {"name": "CryptoMarket", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://api.exchange.cryptomkt.com/", "authType": "apiKey"},
    {"name": "Cryptonator", "description": "Crypto exchange rates", "category": "Cryptocurrency", "baseUrl": "https://www.cryptonator.com/api/", "authType": "none"},
    {"name": "dYdX", "description": "Decentralized crypto exchange", "category": "Cryptocurrency", "baseUrl": "https://docs.dydx.exchange/", "authType": "apiKey"},
    {"name": "Ethplorer", "description": "Ethereum tokens and balances", "category": "Cryptocurrency", "baseUrl": "https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API", "authType": "apiKey"},
    {"name": "FTX", "description": "Crypto trading API", "category": "Cryptocurrency", "baseUrl": "https://docs.ftx.com/", "authType": "apiKey"},
    {"name": "Gate.io", "description": "Crypto trading API", "category": "Cryptocurrency", "baseUrl": "https://www.gate.io/api2", "authType": "apiKey"},
    {"name": "Gemini", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://docs.gemini.com/rest-api/", "authType": "none"},
    {"name": "Huobi", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://huobiapi.github.io/docs/spot/v1/en/", "authType": "apiKey"},
    {"name": "icy.tools", "description": "NFT API GraphQL", "category": "Cryptocurrency", "baseUrl": "https://developers.icy.tools/", "authType": "apiKey"},
    {"name": "Indodax", "description": "Indonesian crypto exchange", "category": "Cryptocurrency", "baseUrl": "https://github.com/btcid/indodax-official-api-docs", "authType": "apiKey"},
    {"name": "INFURA Ethereum", "description": "Ethereum mainnet access", "category": "Cryptocurrency", "baseUrl": "https://infura.io/product/ethereum", "authType": "apiKey"},
    {"name": "Kraken", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://docs.kraken.com/rest/", "authType": "apiKey"},
    {"name": "KuCoin", "description": "Crypto trading platform", "category": "Cryptocurrency", "baseUrl": "https://docs.kucoin.com/", "authType": "apiKey"},
    {"name": "Localbitcoins", "description": "P2P Bitcoin trading", "category": "Cryptocurrency", "baseUrl": "https://localbitcoins.com/api-docs/", "authType": "none"},
    {"name": "Mempool", "description": "Bitcoin transaction API", "category": "Cryptocurrency", "baseUrl": "https://mempool.space/api", "authType": "none"},
    {"name": "MercadoBitcoin", "description": "Brazilian crypto info", "category": "Cryptocurrency", "baseUrl": "https://www.mercadobitcoin.com.br/api-doc/", "authType": "none"},
    {"name": "Messari", "description": "Crypto assets API", "category": "Cryptocurrency", "baseUrl": "https://messari.io/api", "authType": "none"},
    {"name": "Nomics", "description": "Crypto prices historical", "category": "Cryptocurrency", "baseUrl": "https://nomics.com/docs/", "authType": "apiKey"},
    {"name": "NovaDax", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://doc.novadax.com/en-US/", "authType": "apiKey"},
    {"name": "OKEx", "description": "Crypto exchange API", "category": "Cryptocurrency", "baseUrl": "https://www.okex.com/docs/", "authType": "apiKey"},
    {"name": "Poloniex", "description": "Digital asset exchange", "category": "Cryptocurrency", "baseUrl": "https://docs.poloniex.com", "authType": "apiKey"},
    {"name": "Solana JSON RPC", "description": "Solana blockchain API", "category": "Cryptocurrency", "baseUrl": "https://docs.solana.com/developing/clients/jsonrpc-api", "authType": "none"},
    {"name": "Technical Analysis API", "description": "Crypto technical analysis", "category": "Cryptocurrency", "baseUrl": "https://technical-analysis-api.com", "authType": "apiKey"},
    {"name": "VALR", "description": "South African crypto exchange", "category": "Cryptocurrency", "baseUrl": "https://docs.valr.com/", "authType": "apiKey"},
    {"name": "WorldCoinIndex", "description": "Crypto prices API", "category": "Cryptocurrency", "baseUrl": "https://www.worldcoinindex.com/apiservice", "authType": "apiKey"},
    {"name": "ZMOK", "description": "Ethereum JSON RPC", "category": "Cryptocurrency", "baseUrl": "https://zmok.io", "authType": "none"},

    # === CURRENCY ===
    {"name": "1Forge", "description": "Forex market data", "category": "Currency", "baseUrl": "https://1forge.com/forex-data-api/api-documentation", "authType": "apiKey"},
    {"name": "Amdoren", "description": "Currency API 150+ currencies", "category": "Currency", "baseUrl": "https://www.amdoren.com/currency-api/", "authType": "apiKey"},
    {"name": "Fixer.io", "description": "Exchange rates and conversion", "category": "Currency", "baseUrl": "https://fixer.io", "authType": "apiKey"},
    {"name": "Bank of Russia", "description": "Russian exchange rates", "category": "Currency", "baseUrl": "https://www.cbr.ru/development/SXML/", "authType": "none"},
    {"name": "Currency-api", "description": "Free currency rates no limits", "category": "Currency", "baseUrl": "https://github.com/fawazahmed0/currency-api", "authType": "none"},
    {"name": "CurrencyFreaks", "description": "Currency exchange rates", "category": "Currency", "baseUrl": "https://currencyfreaks.com/", "authType": "apiKey"},
    {"name": "Currencylayer", "description": "Exchange rates API", "category": "Currency", "baseUrl": "https://currencylayer.com/documentation", "authType": "apiKey"},
    {"name": "CurrencyScoop", "description": "Real-time currency rates", "category": "Currency", "baseUrl": "https://currencyscoop.com/api-documentation", "authType": "apiKey"},
    {"name": "ExchangeRate-API", "description": "Free currency conversion", "category": "Currency", "baseUrl": "https://www.exchangerate-api.com", "authType": "apiKey"},
    {"name": "Exchangerate.host", "description": "Free forex and crypto rates", "category": "Currency", "baseUrl": "https://exchangerate.host", "authType": "none"},
    {"name": "Frankfurter", "description": "Exchange rates API", "category": "Currency", "baseUrl": "https://www.frankfurter.app/docs", "authType": "none"},
    {"name": "FreeForexAPI", "description": "Real-time forex rates", "category": "Currency", "baseUrl": "https://freeforexapi.com/Home/Api", "authType": "none"},
    {"name": "VATComply", "description": "Exchange rates and VAT", "category": "Currency", "baseUrl": "https://www.vatcomply.com/documentation", "authType": "none"},

    # === ENTERTAINMENT ===
    {"name": "Bob's Burgers API", "description": "Bob's Burgers show data", "category": "Entertainment", "baseUrl": "https://www.bobsburgersapi.com/documentation", "authType": "none"},
    {"name": "Breaking Bad API", "description": "Breaking Bad show data", "category": "Entertainment", "baseUrl": "https://breakingbadapi.com/documentation", "authType": "none"},
    {"name": "Buffy API", "description": "Buffy and Angel show data", "category": "Entertainment", "baseUrl": "https://github.com/Thatskat/btvs-angel-api", "authType": "none"},
    {"name": "Comic Vine", "description": "Comic database", "category": "Entertainment", "baseUrl": "http://comicvine.gamespot.com/api/", "authType": "none"},
    {"name": "Comichron Data", "description": "Comic sales data", "category": "Entertainment", "baseUrl": "https://github.com/comichron-data/api", "authType": "none"},
    {"name": "Dune API", "description": "Dune book/movie data", "category": "Entertainment", "baseUrl": "https://github.com/ywalia01/dune-api", "authType": "none"},
    {"name": "Final Space API", "description": "Final Space show data", "category": "Entertainment", "baseUrl": "https://finalspaceapi.com/docs/", "authType": "none"},
    {"name": "Fun Translations", "description": "Translate to 50+ languages", "category": "Entertainment", "baseUrl": "https://funtranslations.com/api/", "authType": "none"},
    {"name": "Lord of the Rings API", "description": "LOTR data", "category": "Entertainment", "baseUrl": "https://the-one-api.dev/documentation", "authType": "none"},
    {"name": "Marvel API", "description": "Marvel comics data", "category": "Entertainment", "baseUrl": "https://developer.marvel.com/", "authType": "none"},
    {"name": "Nick Cannon Baby API", "description": "Nick Cannon children data", "category": "Entertainment", "baseUrl": "https://nick-cannon-baby-api.onrender.com/", "authType": "none"},
    {"name": "Owen Wilson Wow API", "description": "Owen Wilson wow clips", "category": "Entertainment", "baseUrl": "https://owen-wilson-wow-api.onrender.com/", "authType": "none"},
    {"name": "Pokéapi", "description": "Pokémon data", "category": "Entertainment", "baseUrl": "https://pokeapi.co/", "authType": "none"},
    {"name": "Rick and Morty API", "description": "Rick and Morty data", "category": "Entertainment", "baseUrl": "https://rickandmortyapi.com/", "authType": "none"},
    {"name": "Riddles API", "description": "Random riddles", "category": "Entertainment", "baseUrl": "https://riddles-api.vercel.app/", "authType": "none"},
    {"name": "Star Trek API", "description": "Star Trek data", "category": "Entertainment", "baseUrl": "https://stapi.co/api-documentation", "authType": "none"},
    {"name": "Star Wars API", "description": "Star Wars data", "category": "Entertainment", "baseUrl": "https://www.swapi.tech/", "authType": "none"},
    {"name": "TCGdex", "description": "Pokémon TCG data", "category": "Entertainment", "baseUrl": "https://www.tcgdex.dev/", "authType": "none"},

    # === MORE FROM n0shake ===
    {"name": "Amazon Mobile Ads", "description": "Mobile ad monetization", "category": "Advertising", "baseUrl": "https://developer.amazon.com/mobile-ads", "authType": "apiKey"},
    {"name": "Facebook Marketing API", "description": "Manage Facebook ads", "category": "Advertising", "baseUrl": "https://developers.facebook.com/docs/marketing-apis", "authType": "oauth"},
    {"name": "Google AdSense", "description": "Website monetization", "category": "Advertising", "baseUrl": "https://developers.google.com/adsense/", "authType": "oauth"},
    {"name": "Google AdWords API", "description": "Manage Google Ads", "category": "Advertising", "baseUrl": "https://developers.google.com/adwords/api/docs/guides/start", "authType": "oauth"},
    {"name": "Kevel Ad APIs", "description": "Build custom ad server", "category": "Advertising", "baseUrl": "https://dev.kevel.co", "authType": "apiKey"},
    {"name": "Bing Ads API", "description": "Microsoft advertising", "category": "Advertising", "baseUrl": "https://msdn.microsoft.com/en-us/library/bing-ads-api.aspx", "authType": "apiKey"},
    {"name": "Yahoo Gemini API", "description": "Yahoo advertising", "category": "Advertising", "baseUrl": "https://developer.yahoo.com/gemini/", "authType": "oauth"},
    
    {"name": "Amazon Mobile Analytics", "description": "Mobile app analytics", "category": "Analytics", "baseUrl": "https://aws.amazon.com/documentation/mobileanalytics/", "authType": "apiKey"},
    {"name": "Clicky Analytics", "description": "Website traffic data", "category": "Analytics", "baseUrl": "https://clicky.com/help/api", "authType": "apiKey"},
    {"name": "DitchCarbon API", "description": "Carbon emissions data", "category": "Analytics", "baseUrl": "https://docs.ditchcarbon.com/", "authType": "apiKey"},
    {"name": "Fabric Analytics", "description": "Mobile analytics (Firebase)", "category": "Analytics", "baseUrl": "https://firebase.google.com/", "authType": "apiKey"},
    {"name": "Localytics", "description": "Mobile analytics platform", "category": "Analytics", "baseUrl": "http://docs.localytics.com/dev/query-api.html", "authType": "apiKey"},
    {"name": "Matomo Analytics", "description": "Web analytics platform", "category": "Analytics", "baseUrl": "https://matomo.org/docs/analytics-api/", "authType": "apiKey"},
    {"name": "MixPanel", "description": "Product analytics", "category": "Analytics", "baseUrl": "https://developer.mixpanel.com/docs/implement-mixpanel", "authType": "apiKey"},
    {"name": "Open Web Analytics", "description": "Open source web analytics", "category": "Analytics", "baseUrl": "https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API", "authType": "apiKey"},
    {"name": "Ticksel Analytics", "description": "Friendly web analytics", "category": "Analytics", "baseUrl": "https://ticksel.com", "authType": "apiKey"},
    {"name": "Woopra", "description": "Real-time website analysis", "category": "Analytics", "baseUrl": "https://www.woopra.com/docs/developer/analytics-api/", "authType": "apiKey"},
    {"name": "Zoho Reports", "description": "Reporting and analytics", "category": "Analytics", "baseUrl": "https://zohoreportsapi.wiki.zoho.com/", "authType": "apiKey"},
    
    {"name": "Vuforia", "description": "AR development SDK", "category": "AR/VR", "baseUrl": "https://library.vuforia.com/", "authType": "apiKey"},
    {"name": "Wikitude", "description": "AR SDK with tracking", "category": "AR/VR", "baseUrl": "http://www.wikitude.com/download/", "authType": "apiKey"},
    
    {"name": "Dynamic QR Code", "description": "QR code generator", "category": "Barcode", "baseUrl": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/", "authType": "apiKey"},
    {"name": "Google Barcode API", "description": "Real-time barcode detection", "category": "Barcode", "baseUrl": "https://developers.google.com/vision/barcodes-overview", "authType": "none"},
    {"name": "EAN-Search", "description": "Product barcode lookup", "category": "Barcode", "baseUrl": "https://www.ean-search.org/ean-database-api.html", "authType": "apiKey"},
    {"name": "QR Code API", "description": "QR code REST API", "category": "Barcode", "baseUrl": "https://fungenerators.com/api/qrcode/", "authType": "apiKey"},
    {"name": "OpenQR API", "description": "QR code generator", "category": "Barcode", "baseUrl": "https://docs.openqr.io/", "authType": "apiKey"},
    
    {"name": "Google Charts", "description": "Data visualization", "category": "Big Data", "baseUrl": "https://developers.google.com/chart/interactive/docs/", "authType": "none"},
    {"name": "Keen IO", "description": "Big data analytics", "category": "Big Data", "baseUrl": "https://keen.io/docs/api/", "authType": "apiKey"},
    {"name": "MongoDB API", "description": "NoSQL database", "category": "Big Data", "baseUrl": "https://github.com/mongodb", "authType": "apiKey"},
    {"name": "LinkedData.Center", "description": "RDF graph database", "category": "Big Data", "baseUrl": "http://linkeddata.center/home/gdaas", "authType": "apiKey"},
    
    {"name": "Bitcoin Developer", "description": "Bitcoin protocol documentation", "category": "Cryptocurrency", "baseUrl": "https://developer.bitcoin.org/", "authType": "none"},
    {"name": "PENDAX", "description": "Multi-exchange trading SDK", "category": "Cryptocurrency", "baseUrl": "https://github.com/CompendiumFi/PENDAX-SDK", "authType": "none"},
    {"name": "ShapeShift", "description": "Crypto exchange no account", "category": "Cryptocurrency", "baseUrl": "https://shapeshift.io/", "authType": "none"},
    
    {"name": "CalendarIndex", "description": "Worldwide holidays API", "category": "Calendar", "baseUrl": "https://www.calendarindex.com", "authType": "apiKey"},
    {"name": "DigiDates API", "description": "Date calculations", "category": "Calendar", "baseUrl": "https://digidates.de/en/", "authType": "none"},
    {"name": "Holiday API PL", "description": "Polish holidays", "category": "Calendar", "baseUrl": "https://holidayapi.pl/", "authType": "none"},
    {"name": "OpenHolidays API", "description": "European holidays", "category": "Calendar", "baseUrl": "https://www.openholidaysapi.org/", "authType": "none"},
    
    {"name": "Anti-Captcha", "description": "Captcha solving API", "category": "Security", "baseUrl": "https://anti-captcha.com/apidoc", "authType": "apiKey"},
    {"name": "ProxyCrawl", "description": "Web scraping with captcha solving", "category": "Security", "baseUrl": "https://proxycrawl.com", "authType": "apiKey"},
    {"name": "Google reCAPTCHA", "description": "Captcha protection", "category": "Security", "baseUrl": "https://developers.google.com/recaptcha/intro", "authType": "apiKey"},
    
    {"name": "Facebook Check-In", "description": "Location check-ins", "category": "Location", "baseUrl": "https://developers.facebook.com/docs/graph-api/reference/v2.3/checkin", "authType": "oauth"},
    {"name": "Google Places", "description": "Places and locations", "category": "Location", "baseUrl": "https://developers.google.com/places/", "authType": "apiKey"},
    {"name": "Foursquare Check-In", "description": "Check-in to places", "category": "Location", "baseUrl": "https://developer.foursquare.com/reference/v2-checkins-add", "authType": "oauth"},
    
    {"name": "Commerce Layer", "description": "Headless commerce API", "category": "Commerce", "baseUrl": "https://docs.commercelayer.io/api/", "authType": "apiKey"},
    {"name": "envoice", "description": "Invoicing API", "category": "Commerce", "baseUrl": "https://www.envoice.in/reference/api/docs", "authType": "apiKey"},
    {"name": "koomalooma", "description": "Loyalty program API", "category": "Commerce", "baseUrl": "http://business.koomalooma.com", "authType": "apiKey"},
    {"name": "Moltin", "description": "E-commerce API", "category": "Commerce", "baseUrl": "https://www.moltin.com/developers", "authType": "apiKey"},
    {"name": "Stripe", "description": "Payment processing", "category": "Commerce", "baseUrl": "https://stripe.com/docs/api", "authType": "apiKey"},
    {"name": "Repetiti", "description": "3D printer management", "category": "Commerce", "baseUrl": "https://developers.repetiti.com", "authType": "apiKey"},
    {"name": "Braintree", "description": "Payment systems", "category": "Commerce", "baseUrl": "https://developers.braintreepayments.com", "authType": "apiKey"},
    {"name": "Yellow Pages API", "description": "US business data", "category": "Commerce", "baseUrl": "https://github.com/Hrushi11/Yellow-Pages-End-API", "authType": "none"},
    
    {"name": "Africa's Talking", "description": "African telco services", "category": "Communication", "baseUrl": "https://africastalking.com/", "authType": "apiKey"},
    {"name": "iP1sms", "description": "Global SMS API", "category": "Communication", "baseUrl": "https://www.ip1sms.com/en/developer/", "authType": "apiKey"},
    {"name": "Eqivo", "description": "Programmable voice API", "category": "Communication", "baseUrl": "https://eqivo.org", "authType": "apiKey"},
    {"name": "MailGun", "description": "Transactional email", "category": "Communication", "baseUrl": "https://mailgun.com", "authType": "apiKey"},
    {"name": "Nexmo", "description": "Phone calls and SMS", "category": "Communication", "baseUrl": "https://developer.nexmo.com", "authType": "apiKey"},
    {"name": "Sakari", "description": "Global SMS API", "category": "Communication", "baseUrl": "https://developer.sakari.io", "authType": "apiKey"},
    {"name": "Telnyx", "description": "Voice SMS Fax API", "category": "Communication", "baseUrl": "https://developers.telnyx.com/", "authType": "apiKey"},
    {"name": "The SMS Works", "description": "Low-cost SMS API", "category": "Communication", "baseUrl": "https://thesmsworks.co.uk/sms-api", "authType": "apiKey"},
    
    {"name": "Bible API", "description": "Bible translations API", "category": "Content", "baseUrl": "https://github.com/wldeh/bible-api", "authType": "none"},
    {"name": "Bible API Simple", "description": "Public domain Bible", "category": "Content", "baseUrl": "https://bible-api.com/", "authType": "none"},
    {"name": "Fruits API", "description": "Fruit trees GraphQL", "category": "Content", "baseUrl": "https://github.com/Franqsanz/fruits-api", "authType": "none"},
    {"name": "Jokes API", "description": "Jokes API", "category": "Content", "baseUrl": "https://jokes.one/api/joke/", "authType": "apiKey"},
    {"name": "Perfect Tense", "description": "Grammar checking API", "category": "Content", "baseUrl": "https://www.perfecttense.com/developers", "authType": "apiKey"},
    {"name": "qKast", "description": "Live content collections", "category": "Content", "baseUrl": "https://github.com/egfx/qKast", "authType": "none"},
    {"name": "Randommer", "description": "Random data generator", "category": "Content", "baseUrl": "https://randommer.io/randommer-api", "authType": "apiKey"},
    {"name": "Random Facts", "description": "Random facts API", "category": "Content", "baseUrl": "https://fungenerators.com/api/facts/", "authType": "apiKey"},
    {"name": "SLF Database", "description": "German geography data", "category": "Content", "baseUrl": "https://github.com/slftool/slftool.github.io/blob/master/API.md", "authType": "none"},
    {"name": "Today in History", "description": "Historical events API", "category": "Content", "baseUrl": "https://history.muffinlabs.com/", "authType": "none"},
    {"name": "Wikipedia API", "description": "Wikipedia content", "category": "Content", "baseUrl": "https://en.wikipedia.org/w/api.php", "authType": "none"},
]

def get_current_count():
    """Get current API count from registry"""
    registry_file = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
    try:
        with open(registry_file, 'r') as f:
            registry = json.load(f)
            return registry.get('count', len(registry.get('apis', [])))
    except:
        return 0

def add_apis_to_registry(apis):
    """Add APIs to the registry"""
    registry_file = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
    
    try:
        with open(registry_file, 'r') as f:
            registry = json.load(f)
    except:
        registry = {"version": "3.2.3", "source": "APIClaw aggregated registry", "apis": [], "count": 0}
    
    existing_names = {api.get('name', '').lower() for api in registry.get('apis', [])}
    existing_ids = {api.get('id', '').lower() for api in registry.get('apis', [])}
    
    added = 0
    for api in apis:
        # Generate ID from name
        api_id = api['name'].lower().replace(' ', '-').replace('_', '-')
        api_id = ''.join(c for c in api_id if c.isalnum() or c == '-')
        
        name_lower = api['name'].lower()
        
        if name_lower not in existing_names and api_id not in existing_ids:
            new_api = {
                "id": api_id,
                "name": api['name'],
                "description": api['description'],
                "category": api['category'],
                "auth": api.get('authType', 'None'),
                "https": True,
                "cors": "unknown",
                "link": api.get('baseUrl', ''),
                "pricing": "unknown",
                "keywords": []
            }
            registry['apis'].append(new_api)
            existing_names.add(name_lower)
            existing_ids.add(api_id)
            added += 1
    
    registry['lastUpdated'] = datetime.now().isoformat()
    registry['count'] = len(registry['apis'])
    
    with open(registry_file, 'w') as f:
        json.dump(registry, f, indent=2)
    
    return added, len(registry['apis'])

if __name__ == "__main__":
    before = get_current_count()
    print(f"🦞 APIClaw Night Expansion - 2026-02-24 03:00")
    print(f"Before: {before} APIs")
    
    added, total = add_apis_to_registry(NEW_APIS)
    
    print(f"Added: {added} new APIs")
    print(f"Total: {total} APIs")
    print(f"✅ Done!")
