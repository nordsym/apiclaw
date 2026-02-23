#!/usr/bin/env python3
"""
APIClaw Night Expansion Batch 2 - 2026-02-23 02:00
More APIs from awesome-apis lists
"""

import json
import re
from pathlib import Path
from datetime import datetime

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

# More unique APIs - focusing on ones not likely to be in registry
BATCH2_APIS = [
    # Music APIs
    {"id": "deezer-api", "name": "Deezer", "description": "Internet-based music streaming service", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.deezer.com/", "pricing": "freemium", "keywords": ["music", "streaming", "audio"]},
    {"id": "lastfm-api", "name": "Last.fm", "description": "Build programs using Last.fm data", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "http://www.last.fm/api", "pricing": "free", "keywords": ["music", "scrobbling", "social"]},
    {"id": "musicgraph", "name": "MusicGraph", "description": "World's first knowledge engine for music", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.musicgraph.com/", "pricing": "freemium", "keywords": ["music", "knowledge", "graph"]},
    {"id": "musixmatch", "name": "Musixmatch", "description": "Bring lyrics on your application", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.musixmatch.com/", "pricing": "freemium", "keywords": ["music", "lyrics", "songs"]},
    {"id": "onemusicapi", "name": "One Music API", "description": "Metadata about an astonishing range of music", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "http://www.onemusicapi.com/", "pricing": "freemium", "keywords": ["music", "metadata", "aggregation"]},
    {"id": "searchly-music", "name": "SearchLy", "description": "Similarities search based on song lyrics", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://github.com/AlbertSuarez/searchly", "pricing": "free", "keywords": ["music", "lyrics", "search"]},
    {"id": "soundcloud-api", "name": "SoundCloud API", "description": "Upload and share sounds across the web", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.soundcloud.com/", "pricing": "freemium", "keywords": ["music", "audio", "sharing"]},
    {"id": "spotify-web-api", "name": "Spotify Web API", "description": "Fetch data from Spotify music catalog", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developer.spotify.com/web-api/", "pricing": "freemium", "keywords": ["music", "streaming", "playlists"]},

    # News & Information
    {"id": "aztro", "name": "aztro", "description": "Horoscope information REST API", "category": "Content", "auth": "None", "https": True, "link": "https://aztro.sameerkumar.website", "pricing": "free", "keywords": ["horoscope", "astrology", "daily"]},
    {"id": "brewerydb", "name": "BreweryDB", "description": "Database of breweries, beers, events and guilds", "category": "Content", "auth": "apiKey", "https": True, "link": "http://www.brewerydb.com/developers", "pricing": "freemium", "keywords": ["beer", "brewery", "food"]},
    {"id": "diigo-api", "name": "Diigo API", "description": "Build apps that interact with Diigo", "category": "Content", "auth": "OAuth", "https": True, "link": "https://www.diigo.com/api_dev", "pricing": "freemium", "keywords": ["bookmarks", "social", "research"]},
    {"id": "feedly-api", "name": "Feedly API", "description": "Access to feedly's RSS and news API", "category": "Content", "auth": "OAuth", "https": True, "link": "https://developer.feedly.com/", "pricing": "freemium", "keywords": ["rss", "news", "reader"]},
    {"id": "genius-api", "name": "Genius API", "description": "World's greatest public knowledge project", "category": "Content", "auth": "OAuth", "https": True, "link": "https://docs.genius.com/", "pricing": "free", "keywords": ["lyrics", "music", "knowledge"]},
    {"id": "goodreads-api", "name": "Goodreads API", "description": "Access to Goodreads data for book apps", "category": "Content", "auth": "OAuth", "https": True, "link": "https://www.goodreads.com/api", "pricing": "free", "keywords": ["books", "reading", "social"]},
    {"id": "hackernews-api", "name": "Hacker News API", "description": "Official HN API documentation", "category": "Content", "auth": "None", "https": True, "link": "https://github.com/HackerNews/API", "pricing": "free", "keywords": ["news", "tech", "startup"]},
    {"id": "inoreader-api", "name": "Inoreader API", "description": "Subscribe to feeds, read articles", "category": "Content", "auth": "OAuth", "https": True, "link": "https://www.inoreader.com/developers/", "pricing": "freemium", "keywords": ["rss", "news", "reader"]},
    {"id": "instapaper-api", "name": "Instapaper API", "description": "Add URLs to Instapaper", "category": "Content", "auth": "OAuth", "https": True, "link": "https://www.instapaper.com/api", "pricing": "freemium", "keywords": ["read-later", "bookmarks", "articles"]},
    {"id": "narro-api", "name": "Narro API", "description": "Access articles and submit on behalf of customers", "category": "Content", "auth": "apiKey", "https": True, "link": "https://docs.narro.co/", "pricing": "freemium", "keywords": ["articles", "text-to-speech", "accessibility"]},
    {"id": "newsblur-api", "name": "NewsBlur API", "description": "Retrieve feeds, feed counts, feed stories", "category": "Content", "auth": "apiKey", "https": True, "link": "https://newsblur.com/api", "pricing": "freemium", "keywords": ["rss", "news", "reader"]},
    {"id": "npr-api", "name": "NPR API", "description": "Access to NPR content and data", "category": "Content", "auth": "apiKey", "https": True, "link": "http://www.npr.org/api/index", "pricing": "free", "keywords": ["radio", "news", "public"]},
    {"id": "pinboard-api", "name": "Pinboard API", "description": "Interact with bookmarks, notes and data", "category": "Content", "auth": "apiKey", "https": True, "link": "https://pinboard.in/api", "pricing": "paid", "keywords": ["bookmarks", "notes", "archiving"]},
    {"id": "pocket-api", "name": "Pocket API", "description": "Save for later functionality", "category": "Content", "auth": "OAuth", "https": True, "link": "https://getpocket.com/developer/", "pricing": "free", "keywords": ["read-later", "bookmarks", "save"]},
    {"id": "producthunt-api", "name": "Product Hunt API", "description": "Access to producthunt.com's API", "category": "Content", "auth": "OAuth", "https": True, "link": "https://api.producthunt.com/v1/docs", "pricing": "free", "keywords": ["products", "startups", "tech"]},
    {"id": "nyt-api", "name": "The New York Times API", "description": "Access to NYT articles and data", "category": "Content", "auth": "apiKey", "https": True, "link": "https://developer.nytimes.com/", "pricing": "freemium", "keywords": ["news", "journalism", "articles"]},
    {"id": "usatoday-api", "name": "USA TODAY API", "description": "Latest news and stories from USA TODAY", "category": "Content", "auth": "apiKey", "https": True, "link": "https://developer.usatoday.com/docs/", "pricing": "freemium", "keywords": ["news", "usa", "articles"]},

    # Notes
    {"id": "evernote-api", "name": "Evernote API", "description": "Access to Evernote's API references and guides", "category": "Business", "auth": "OAuth", "https": True, "link": "https://dev.evernote.com/doc/", "pricing": "freemium", "keywords": ["notes", "productivity", "organization"]},
    {"id": "onenote-api", "name": "OneNote API", "description": "Access to OneNote's RESTful APIs", "category": "Business", "auth": "OAuth", "https": True, "link": "https://msdn.microsoft.com/en-us/office/office365/howto/onenote", "pricing": "free", "keywords": ["notes", "microsoft", "office"]},

    # Payment - additional
    {"id": "paymill", "name": "Paymill", "description": "Access the full API reference for payments", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://developers.paymill.com/", "pricing": "paid", "keywords": ["payments", "europe", "cards"]},
    {"id": "paytm", "name": "Paytm", "description": "Payments using Paytm Wallet", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://paytm.com/business/payments/developers", "pricing": "freemium", "keywords": ["payments", "india", "wallet"]},
    {"id": "wepay", "name": "WePay", "description": "Seamless user experience for marketplaces", "category": "Finance", "auth": "OAuth", "https": True, "link": "https://www.wepay.com/", "pricing": "paid", "keywords": ["payments", "marketplace", "platforms"]},

    # Photography - additional
    {"id": "500px-api", "name": "500px", "description": "Programmatic access to 500px functionality", "category": "Design", "auth": "OAuth", "https": True, "link": "https://github.com/500px/api-documentation", "pricing": "free", "keywords": ["photography", "portfolio", "social"]},
    {"id": "giphy-api", "name": "Giphy API", "description": "Largest GIF library in the world", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developers.giphy.com/docs/", "pricing": "freemium", "keywords": ["gifs", "animation", "media"]},
    {"id": "imgur-api", "name": "Imgur API", "description": "Do anything you can do on imgur.com", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://api.imgur.com/", "pricing": "free", "keywords": ["images", "hosting", "memes"]},
    {"id": "pixabay-api", "name": "Pixabay API", "description": "Search and retrieve free images and videos", "category": "Design", "auth": "apiKey", "https": True, "link": "https://pixabay.com/api/docs/", "pricing": "free", "keywords": ["images", "stock", "free"]},
    {"id": "unsplash-api", "name": "Unsplash API", "description": "Most powerful photo engine in the world", "category": "Design", "auth": "OAuth", "https": True, "link": "https://unsplash.com/documentation", "pricing": "freemium", "keywords": ["photos", "stock", "high-quality"]},

    # Places
    {"id": "yelp-api", "name": "Yelp API", "description": "Access to Yelp's business and review data", "category": "Places", "auth": "OAuth", "https": True, "link": "https://www.yelp.com/developers/documentation/v2/overview", "pricing": "freemium", "keywords": ["reviews", "restaurants", "business"]},
    {"id": "zomato-api", "name": "Zomato API", "description": "Restaurant information for 10,000 cities", "category": "Places", "auth": "apiKey", "https": True, "link": "https://developers.zomato.com/api", "pricing": "freemium", "keywords": ["restaurants", "food", "reviews"]},

    # Social
    {"id": "disqus-api", "name": "Disqus API", "description": "Social integration, networking, user profiles", "category": "Social", "auth": "OAuth", "https": True, "link": "https://disqus.com/api/docs/", "pricing": "freemium", "keywords": ["comments", "social", "engagement"]},
    {"id": "flickr-api", "name": "Flickr API", "description": "Best online photo management and sharing", "category": "Social", "auth": "OAuth", "https": True, "link": "https://www.flickr.com/services/api/", "pricing": "free", "keywords": ["photos", "sharing", "community"]},
    {"id": "foursquare-api", "name": "Foursquare API", "description": "World-class places database", "category": "Places", "auth": "OAuth", "https": True, "link": "https://developer.foursquare.com/", "pricing": "freemium", "keywords": ["places", "location", "recommendations"]},
    {"id": "instagram-api", "name": "Instagram API", "description": "Capture, edit and share photos and videos", "category": "Social", "auth": "OAuth", "https": True, "link": "https://www.instagram.com/developer/", "pricing": "freemium", "keywords": ["photos", "social", "sharing"]},
    {"id": "linkedin-api", "name": "LinkedIn API", "description": "World's largest professional network", "category": "Social", "auth": "OAuth", "https": True, "link": "https://developer.linkedin.com/", "pricing": "freemium", "keywords": ["professional", "networking", "jobs"]},
    {"id": "pinterest-api", "name": "Pinterest API", "description": "Access users' Pinterest data", "category": "Social", "auth": "OAuth", "https": True, "link": "https://developers.pinterest.com/", "pricing": "freemium", "keywords": ["images", "boards", "inspiration"]},
    {"id": "reddit-api", "name": "Reddit API", "description": "Social news aggregation and discussion", "category": "Social", "auth": "OAuth", "https": True, "link": "https://www.reddit.com/dev/api/", "pricing": "free", "keywords": ["news", "discussion", "community"]},
    {"id": "tumblr-api", "name": "Tumblr API", "description": "Express yourself, discover yourself", "category": "Social", "auth": "OAuth", "https": True, "link": "https://www.tumblr.com/docs/en/api/v2", "pricing": "free", "keywords": ["blogging", "social", "creative"]},
    {"id": "twitter-api", "name": "Twitter API", "description": "Access to Twitter's data", "category": "Social", "auth": "OAuth", "https": True, "link": "https://dev.twitter.com/", "pricing": "freemium", "keywords": ["social", "microblogging", "news"]},

    # Teamwork
    {"id": "asana-api", "name": "Asana API", "description": "Programmatically update and access platform data", "category": "Business", "auth": "OAuth", "https": True, "link": "https://asana.com/guide/help/api/api", "pricing": "freemium", "keywords": ["project", "tasks", "collaboration"]},
    {"id": "joinme-api", "name": "join.me API", "description": "Online meeting tool API", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://developer.join.me/", "pricing": "freemium", "keywords": ["meetings", "video", "collaboration"]},
    {"id": "teambition-api", "name": "Teambition API", "description": "Open Platform for project data", "category": "Business", "auth": "OAuth", "https": True, "link": "https://www.teambition.com/developer/open-platform", "pricing": "freemium", "keywords": ["project", "collaboration", "teams"]},
    {"id": "teamsnap-api", "name": "TeamSnap API", "description": "World's best team management solution", "category": "Business", "auth": "OAuth", "https": True, "link": "http://developer.teamsnap.com/", "pricing": "freemium", "keywords": ["sports", "teams", "scheduling"]},
    {"id": "trello-api", "name": "Trello API", "description": "Web-based project management application", "category": "Business", "auth": "OAuth", "https": True, "link": "https://developers.trello.com/", "pricing": "freemium", "keywords": ["project", "kanban", "collaboration"]},

    # Text Analysis
    {"id": "detectlanguage-api", "name": "Detect Language API", "description": "Automatic language identification", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://rapidapi.com/BigLobster/api/language-identification-prediction", "pricing": "freemium", "keywords": ["language", "detection", "nlp"]},
    {"id": "azure-text-analytics", "name": "Azure Text Analytics", "description": "Text analytics with machine learning", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/", "pricing": "paid", "keywords": ["nlp", "azure", "sentiment"]},
    {"id": "watson-nlu", "name": "Watson Natural Language Understanding", "description": "Natural language processing by Watson", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.ibm.com/watson/developercloud/natural-language-understanding/", "pricing": "freemium", "keywords": ["nlp", "watson", "ibm"]},

    # To-dos
    {"id": "beeminder-api", "name": "Beeminder API", "description": "Access to Beeminder's goal tracking APIs", "category": "Business", "auth": "OAuth", "https": True, "link": "https://www.beeminder.com/api", "pricing": "freemium", "keywords": ["goals", "tracking", "productivity"]},
    {"id": "followup-api", "name": "FollowUp.cc API", "description": "Email follow-up scheduling API", "category": "Business", "auth": "apiKey", "https": True, "link": "http://docs.followup.cc/", "pricing": "freemium", "keywords": ["email", "reminders", "productivity"]},
    {"id": "todoist-api", "name": "Todoist API", "description": "Sync API for todo management", "category": "Business", "auth": "OAuth", "https": True, "link": "https://developer.todoist.com/", "pricing": "freemium", "keywords": ["tasks", "todos", "productivity"]},
    {"id": "toodledo-api", "name": "Toodledo API", "description": "Access tasks, notes, outlines and lists", "category": "Business", "auth": "apiKey", "https": True, "link": "https://api.toodledo.com/3/", "pricing": "freemium", "keywords": ["tasks", "notes", "productivity"]},

    # Translation
    {"id": "google-translate-api", "name": "Google Translate API", "description": "Dynamically translate between languages", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://cloud.google.com/translate/docs/", "pricing": "paid", "keywords": ["translation", "google", "languages"]},
    {"id": "microsoft-translator", "name": "Microsoft Translator", "description": "Machine translation for multiple languages", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.microsoft.com/en-us/translator/translatorapi.aspx", "pricing": "freemium", "keywords": ["translation", "microsoft", "languages"]},
    {"id": "yandex-translate-api", "name": "Yandex Translate API", "description": "Translation for 70+ languages", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://tech.yandex.com/translate/", "pricing": "freemium", "keywords": ["translation", "yandex", "languages"]},

    # Video
    {"id": "dailymotion-api", "name": "Dailymotion API", "description": "Second largest video hosting platform", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developer.dailymotion.com/api", "pricing": "free", "keywords": ["video", "hosting", "streaming"]},
    {"id": "narrative-api", "name": "Narrative API", "description": "Customize your clip, get players, badges", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "http://open.getnarrative.com/", "pricing": "freemium", "keywords": ["video", "clips", "wearable"]},
    {"id": "rotten-tomatoes-api", "name": "Rotten Tomatoes API", "description": "Ratings and reviews for applications", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.fandango.com/Rotten_Tomatoes", "pricing": "freemium", "keywords": ["movies", "reviews", "ratings"]},
    {"id": "themoviedb-api", "name": "The Movie Database API", "description": "Top rated movies, TV shows, celebrities", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developers.themoviedb.org", "pricing": "free", "keywords": ["movies", "tv", "database"]},
    {"id": "tvmaze-api", "name": "TVmaze API", "description": "TV Show and web series database", "category": "Entertainment", "auth": "None", "https": True, "link": "https://www.tvmaze.com/api", "pricing": "free", "keywords": ["tv", "shows", "episodes"]},
    {"id": "vimeo-api", "name": "Vimeo API", "description": "High-quality hosting and sharing", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developer.vimeo.com/", "pricing": "freemium", "keywords": ["video", "hosting", "creative"]},
    {"id": "youtube-api", "name": "YouTube API", "description": "Embed YouTube functionality", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.google.com/youtube/documentation/", "pricing": "freemium", "keywords": ["video", "youtube", "google"]},

    # Voice Analysis
    {"id": "google-speech-api", "name": "Google Cloud Speech API", "description": "Convert audio to text with neural networks", "category": "AI & ML", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/speech/", "pricing": "paid", "keywords": ["speech", "transcription", "audio"]},

    # Vision Analysis
    {"id": "camscanner-api", "name": "CamScanner API", "description": "Digitalize paper documents with image processing", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://dev.camscanner.com/", "pricing": "freemium", "keywords": ["documents", "scanning", "ocr"]},
    {"id": "clarifai-api", "name": "Clarifai", "description": "Image and video recognition as a service", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://clarifai.com/developer/guide/", "pricing": "freemium", "keywords": ["vision", "recognition", "ai"]},
    {"id": "google-vision-api", "name": "Google Cloud Vision API", "description": "Understand image content with ML", "category": "AI & ML", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/vision/", "pricing": "paid", "keywords": ["vision", "ocr", "google"]},
    {"id": "azure-computer-vision", "name": "Azure Computer Vision", "description": "State-of-the-art image processing algorithms", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/", "pricing": "paid", "keywords": ["vision", "azure", "ai"]},
    {"id": "faceplusplus", "name": "Face++ API", "description": "Face detection and recognition", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://console.faceplusplus.com/documents/5678948", "pricing": "freemium", "keywords": ["face", "recognition", "ai"]},
    {"id": "watson-visual-recognition", "name": "Watson Visual Recognition", "description": "Identify scenes, objects, celebrity faces", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.ibm.com/watson/developercloud/visual-recognition/", "pricing": "freemium", "keywords": ["vision", "watson", "ibm"]},

    # Weather - additional
    {"id": "accuweather-api", "name": "AccuWeather API", "description": "Location based weather data", "category": "Environment", "auth": "apiKey", "https": True, "link": "http://apidev.accuweather.com/developers/", "pricing": "freemium", "keywords": ["weather", "forecast", "global"]},
    {"id": "aeris-weather", "name": "Aeris Weather", "description": "Advanced weather API for complex solutions", "category": "Environment", "auth": "apiKey", "https": True, "link": "http://www.aerisweather.com/develop/", "pricing": "paid", "keywords": ["weather", "maps", "alerts"]},
    {"id": "openweathermap-api", "name": "OpenWeatherMap API", "description": "Free weather data and forecast API", "category": "Environment", "auth": "apiKey", "https": True, "link": "https://openweathermap.org/api", "pricing": "freemium", "keywords": ["weather", "forecast", "free"]},
    {"id": "weather-underground-api", "name": "Weather Underground", "description": "Reliable data and forecast in 80 languages", "category": "Environment", "auth": "apiKey", "https": True, "link": "https://www.wunderground.com/weather/api/", "pricing": "freemium", "keywords": ["weather", "forecast", "global"]},
    {"id": "weather-unlocked", "name": "Weather Unlocked", "description": "Weather for advertising and eCommerce", "category": "Environment", "auth": "apiKey", "https": True, "link": "https://developer.weatherunlocked.com/documentation", "pricing": "freemium", "keywords": ["weather", "advertising", "ecommerce"]},
    {"id": "yandex-weather", "name": "Yandex.Weather", "description": "Meteum forecasts for Russia", "category": "Environment", "auth": "apiKey", "https": True, "link": "https://tech.yandex.com/weather/", "pricing": "freemium", "keywords": ["weather", "russia", "forecast"]},
    {"id": "yahoo-weather", "name": "Yahoo! Weather", "description": "5-day forecast for any location", "category": "Environment", "auth": "apiKey", "https": True, "link": "https://developer.yahoo.com/weather/", "pricing": "free", "keywords": ["weather", "forecast", "yahoo"]},

    # Games - additional
    {"id": "battlenet-api", "name": "Battle.net API", "description": "Blizzard Entertainment games data", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://dev.battle.net/", "pricing": "free", "keywords": ["gaming", "blizzard", "esports"]},
    {"id": "clash-of-clans-api", "name": "Clash of Clans API", "description": "Near real-time game data access", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.clashofclans.com/", "pricing": "free", "keywords": ["gaming", "mobile", "strategy"]},
    {"id": "eve-online-api", "name": "EVE Online API", "description": "MMORPG CREST and XML APIs", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.eveonline.com/", "pricing": "free", "keywords": ["gaming", "mmo", "scifi"]},
    {"id": "facebook-games-api", "name": "Facebook Games API", "description": "Achievements, Scores, Feed Gaming", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.facebook.com/docs/games", "pricing": "free", "keywords": ["gaming", "facebook", "social"]},
    {"id": "google-play-games", "name": "Google Play Games API", "description": "Achievements, leaderboards, player stats", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://developers.google.com/games/", "pricing": "free", "keywords": ["gaming", "android", "google"]},
    {"id": "riot-games-api", "name": "Riot Games API", "description": "League of Legends developer access", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.riotgames.com/", "pricing": "free", "keywords": ["gaming", "lol", "esports"]},
    {"id": "steam-api", "name": "Steam Web API", "description": "Access Steam for Team Fortress 2 and more", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://steamcommunity.com/dev", "pricing": "free", "keywords": ["gaming", "steam", "pc"]},
    {"id": "giant-bomb-api", "name": "Giant Bomb API", "description": "Game titles, ratings, videos, companies", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "http://www.giantbomb.com/api/", "pricing": "free", "keywords": ["gaming", "database", "reviews"]},
    {"id": "guildwars2-api", "name": "Guild Wars 2 API", "description": "Access game data programmatically", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://wiki.guildwars2.com/wiki/API:Main", "pricing": "free", "keywords": ["gaming", "mmo", "fantasy"]},

    # IoT - additional
    {"id": "automatic-api", "name": "Automatic API", "description": "REST API, Real-time Events, Streaming API", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://developer.automatic.com/", "pricing": "freemium", "keywords": ["car", "driving", "iot"]},
    {"id": "alexa-api", "name": "Amazon Alexa API", "description": "Voice-enable connected products", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://developer.amazon.com/public/solutions/alexa", "pricing": "free", "keywords": ["voice", "alexa", "smart-home"]},
    {"id": "google-assistant-action", "name": "Actions on Google", "description": "Build for the Google Assistant", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://developers.google.com/actions/", "pricing": "free", "keywords": ["voice", "assistant", "google"]},
    {"id": "home8-api", "name": "Home8 API", "description": "Wireless IoT System for Smart Alarm", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://developer.home8systems.com/", "pricing": "freemium", "keywords": ["security", "smart-home", "alarm"]},
    {"id": "homey-api", "name": "Homey API", "description": "Access to Homey's smart home API", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://developers.athom.com/api/", "pricing": "free", "keywords": ["smart-home", "automation", "hub"]},
    {"id": "hp-print-api", "name": "HP Print API", "description": "Access to HP Print's API", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://developers.hp.com/printos/printos", "pricing": "freemium", "keywords": ["printing", "hp", "cloud"]},
    {"id": "lifx-api", "name": "LIFX API", "description": "Control LIFX WiFi-enabled LED lightbulbs", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://api.developer.lifx.com/", "pricing": "free", "keywords": ["lights", "smart-home", "wifi"]},
    {"id": "lightwave-api", "name": "LightwaveRF API", "description": "Local command protocols for LightwaveRF", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://api.lightwaverf.com/", "pricing": "freemium", "keywords": ["smart-home", "lighting", "rf"]},
    {"id": "microbees-api", "name": "microBees API", "description": "REST APIs and real-time messaging", "category": "IoT", "auth": "apiKey", "https": True, "link": "http://developers.microbees.com/documentation/", "pricing": "freemium", "keywords": ["iot", "realtime", "messaging"]},
    {"id": "mojio-api", "name": "Mojio API", "description": "REST endpoints and PUSH API for car data", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://www.moj.io/developer/", "pricing": "freemium", "keywords": ["car", "connected", "driving"]},
    {"id": "mystrom-api", "name": "myStrom API", "description": "REST API for WiFi Energy Control Switch", "category": "IoT", "auth": "None", "https": True, "link": "https://mystrom.ch/de/mystrom-api", "pricing": "free", "keywords": ["energy", "smart-home", "switch"]},
    {"id": "neurio-api", "name": "Neurio API", "description": "Open platform with public API", "category": "IoT", "auth": "OAuth", "https": True, "link": "http://neur.io/developers/", "pricing": "free", "keywords": ["energy", "monitoring", "smart-home"]},
    {"id": "smappee-api", "name": "Smappee API", "description": "Measure electrical energy consumption", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://smappee.atlassian.net/wiki/display/DEVAPI/", "pricing": "freemium", "keywords": ["energy", "monitoring", "solar"]},
    {"id": "stack-lighting-api", "name": "Stack Lighting API", "description": "Control Stack's responsive lighting", "category": "IoT", "auth": "OAuth", "https": True, "link": "http://developers.stacklighting.com/", "pricing": "freemium", "keywords": ["lighting", "smart-home", "responsive"]},
    {"id": "vinli-api", "name": "Vinli API", "description": "Build connected car apps easily", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://dev.vin.li/", "pricing": "freemium", "keywords": ["car", "connected", "automotive"]},
    {"id": "yeelight-api", "name": "Yeelight API", "description": "Remote control via WiFi", "category": "IoT", "auth": "apiKey", "https": True, "link": "http://www.yeelight.com/en_US/developer", "pricing": "free", "keywords": ["lighting", "smart-home", "xiaomi"]},

    # Messaging
    {"id": "cisco-spark-api", "name": "Cisco Spark API", "description": "Create rooms, invite people, post messages", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://developer.ciscospark.com/", "pricing": "freemium", "keywords": ["messaging", "video", "cisco"]},
    {"id": "fleep-api", "name": "Fleep API", "description": "Messenger for teams and projects", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://fleep.io/fleepapi/", "pricing": "freemium", "keywords": ["messaging", "teams", "collaboration"]},
    {"id": "groupme-api", "name": "GroupMe API", "description": "Group messaging abilities", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://dev.groupme.com/docs/v3", "pricing": "free", "keywords": ["messaging", "groups", "social"]},
    {"id": "indoona-api", "name": "indoona API", "description": "Send messages to indoona users and groups", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://developer.indoona.com/", "pricing": "freemium", "keywords": ["messaging", "chat", "api"]},
    {"id": "line-api", "name": "LINE API", "description": "Instant communications on devices", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://developers.line.me/", "pricing": "freemium", "keywords": ["messaging", "japan", "asia"]},
    {"id": "messagebird-api", "name": "MessageBird API", "description": "Connect websites to operators worldwide", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://developers.messagebird.com/", "pricing": "paid", "keywords": ["sms", "voice", "omnichannel"]},
    {"id": "slack-api-full", "name": "Slack API", "description": "Cloud-based team collaboration tools", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://api.slack.com/", "pricing": "freemium", "keywords": ["messaging", "teams", "collaboration"]},
    {"id": "telegram-bot-api", "name": "Telegram Bot API", "description": "Build Telegram bots", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://core.telegram.org/api", "pricing": "free", "keywords": ["messaging", "bots", "telegram"]},
    {"id": "yo-api", "name": "Yo API", "description": "Simplest notification platform", "category": "Communication", "auth": "apiKey", "https": True, "link": "http://docs.justyo.co/", "pricing": "free", "keywords": ["notifications", "simple", "messaging"]},

    # Wearables
    {"id": "adidas-api", "name": "Adidas AG API", "description": "Access to Adidas AG's API", "category": "Health", "auth": "OAuth", "https": True, "link": "https://developers.adidas.com/services", "pricing": "freemium", "keywords": ["fitness", "sports", "wearables"]},
    {"id": "jawbone-api", "name": "Jawbone UP API", "description": "Step, activity, food, and sleep tracking", "category": "Health", "auth": "OAuth", "https": True, "link": "https://jawbone.com/up/developer", "pricing": "free", "keywords": ["fitness", "wearables", "health"]},
    {"id": "lifelog-api", "name": "Lifelog API", "description": "Sony's lifestyle, fitness and health data", "category": "Health", "auth": "OAuth", "https": True, "link": "https://developer.sony.com/develop/services/lifelog-api/", "pricing": "free", "keywords": ["fitness", "sony", "wearables"]},
    {"id": "misfit-api", "name": "Misfit API", "description": "Activity tracking, sleep tracking, wearable control", "category": "Health", "auth": "OAuth", "https": True, "link": "https://build.misfit.com/", "pricing": "free", "keywords": ["fitness", "wearables", "tracking"]},
    {"id": "nike-plus-api", "name": "Nike+ API", "description": "Activity data from Nike+ FuelBand", "category": "Health", "auth": "OAuth", "https": True, "link": "https://developer.nike.com/", "pricing": "free", "keywords": ["fitness", "nike", "running"]},
    {"id": "recon-api", "name": "Recon API", "description": "Recon instruments data API", "category": "Health", "auth": "OAuth", "https": True, "link": "http://www.reconinstruments.com/developers/", "pricing": "freemium", "keywords": ["sports", "wearables", "goggles"]},

    # Food
    {"id": "order-pizza-api", "name": "Order Pizza REST API", "description": "Pizza restaurant ordering system", "category": "Content", "auth": "None", "https": True, "link": "https://order-pizza-api.herokuapp.com/api/ui", "pricing": "free", "keywords": ["food", "pizza", "ordering"]},

    # Development tools
    {"id": "artik-cloud-api", "name": "ARTIK Cloud API", "description": "Access to ARTIK Cloud platform", "category": "IoT", "auth": "OAuth", "https": True, "link": "https://developer.artik.cloud/documentation/api-reference/", "pricing": "freemium", "keywords": ["iot", "samsung", "platform"]},
    {"id": "att-m2x", "name": "AT&T M2X API", "description": "RESTful API for time-series data analytics", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://m2x.att.com/developer/documentation/", "pricing": "freemium", "keywords": ["iot", "m2m", "analytics"]},
    {"id": "bitbucket-api", "name": "Bitbucket API", "description": "Source code hosting with Git and Mercurial", "category": "Development", "auth": "OAuth", "https": True, "link": "https://developer.atlassian.com/cloud/bitbucket/", "pricing": "freemium", "keywords": ["git", "code", "hosting"]},
    {"id": "bitly-api", "name": "Bitly API", "description": "Easiest way to save, share and discover links", "category": "Development", "auth": "OAuth", "https": True, "link": "https://dev.bitly.com/", "pricing": "freemium", "keywords": ["links", "shortener", "analytics"]},
    {"id": "buddy-api", "name": "Buddy API", "description": "CI service for GitHub, Bitbucket, GitLab", "category": "Development", "auth": "OAuth", "https": True, "link": "https://buddy.works/api/reference/getting-started/overview", "pricing": "freemium", "keywords": ["ci", "deployment", "devops"]},
    {"id": "circleci-api", "name": "CircleCI API", "description": "RESTful API for CI access", "category": "Development", "auth": "apiKey", "https": True, "link": "https://circleci.com/docs/api/v1-reference/", "pricing": "freemium", "keywords": ["ci", "testing", "devops"]},
    {"id": "dataflowkit", "name": "Dataflow Kit", "description": "Web Scraping framework for Gophers", "category": "Scraping", "auth": "apiKey", "https": True, "link": "https://github.com/slotix/dataflowkit", "pricing": "freemium", "keywords": ["scraping", "go", "extraction"]},
    {"id": "github-api", "name": "GitHub API", "description": "World's leading software development platform", "category": "Development", "auth": "OAuth", "https": True, "link": "https://developer.github.com/v3/", "pricing": "freemium", "keywords": ["git", "code", "collaboration"]},
    {"id": "gitter-api", "name": "Gitter API", "description": "Chat tools for GitHub", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://developer.gitter.im/docs/welcome", "pricing": "free", "keywords": ["chat", "github", "community"]},
    {"id": "gitlab-api", "name": "GitLab API", "description": "Automate GitLab via simple API", "category": "Development", "auth": "OAuth", "https": True, "link": "https://docs.gitlab.com/ee/api/README.html", "pricing": "freemium", "keywords": ["git", "devops", "cicd"]},
    {"id": "google-play-developer", "name": "Google Play Developer API", "description": "Perform publishing and app-management tasks", "category": "Development", "auth": "OAuth", "https": True, "link": "https://developers.google.com/android-publisher/", "pricing": "free", "keywords": ["android", "apps", "publishing"]},
    {"id": "ipinfo-api", "name": "IPInfo.io API", "description": "IP geolocation integration", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://ipinfo.io/developers", "pricing": "freemium", "keywords": ["ip", "geolocation", "data"]},
    {"id": "mac-vendor-api", "name": "MAC Address Vendor API", "description": "Retrieve vendor details for MAC addresses", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://macaddress.io/api-documentation", "pricing": "freemium", "keywords": ["mac", "vendor", "network"]},
    {"id": "openhab-api", "name": "openHAB API", "description": "REST API for smart home platform", "category": "IoT", "auth": "None", "https": True, "link": "https://github.com/openhab/openhab1-addons/wiki/REST-API", "pricing": "free", "keywords": ["smart-home", "automation", "open-source"]},
    {"id": "qr-server-api", "name": "QR Server API", "description": "Generate and decode QR code graphics", "category": "Utilities", "auth": "None", "https": True, "link": "http://goqr.me/api/", "pricing": "free", "keywords": ["qr", "generator", "barcode"]},
    {"id": "stackexchange-api", "name": "StackExchange API", "description": "Access to Stack Exchange Q&A sites", "category": "Development", "auth": "OAuth", "https": True, "link": "https://api.stackexchange.com/docs", "pricing": "free", "keywords": ["qa", "community", "knowledge"]},
    {"id": "svn-api", "name": "SVN API", "description": "Subversion libraries public APIs", "category": "Development", "auth": "None", "https": True, "link": "https://subversion.apache.org/docs/api/1.8/", "pricing": "free", "keywords": ["svn", "version-control", "code"]},
    {"id": "travis-api", "name": "Travis CI API", "description": "CI/CD platform API", "category": "Development", "auth": "OAuth", "https": True, "link": "https://docs.travis-ci.com/api/", "pricing": "freemium", "keywords": ["ci", "testing", "devops"]},
    {"id": "w3c-api", "name": "W3C API", "description": "Web API for W3C data", "category": "Development", "auth": "None", "https": True, "link": "https://github.com/w3c/w3c-api", "pricing": "free", "keywords": ["web", "standards", "w3c"]},
    {"id": "zenhub-api", "name": "ZenHub API", "description": "Project management integrated with GitHub", "category": "Development", "auth": "apiKey", "https": True, "link": "https://github.com/ZenHubIO/API", "pricing": "freemium", "keywords": ["project", "github", "agile"]},

    # Email
    {"id": "contextio-api", "name": "Context.IO API", "description": "Modern, scalable email API", "category": "Communication", "auth": "OAuth", "https": True, "link": "http://context.io/", "pricing": "freemium", "keywords": ["email", "api", "integration"]},
    {"id": "inbox-api", "name": "Inbox API", "description": "Modern RESTful APIs for mail providers", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://www.inboxapp.com/docs", "pricing": "freemium", "keywords": ["email", "api", "modern"]},
    {"id": "mandrill-api", "name": "Mandrill API", "description": "Transactional, triggered, personalized email", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://mandrillapp.com/api/docs/", "pricing": "paid", "keywords": ["email", "transactional", "mailchimp"]},
    {"id": "outlook-mail-api", "name": "Outlook Mail API", "description": "Read, create, send messages and attachments", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations", "pricing": "free", "keywords": ["email", "outlook", "microsoft"]},
]

def generate_id(name):
    """Generate an ID from name"""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def load_registry():
    """Load the current registry"""
    with open(REGISTRY_PATH, "r") as f:
        return json.load(f)

def save_registry(data):
    """Save the registry"""
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, separators=(',', ':'))

def main():
    print(f"🦞 APIClaw Night Expansion Batch 2 - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Load current registry
    registry = load_registry()
    current_apis = registry.get("apis", [])
    
    # Ensure all APIs have IDs
    for api in current_apis:
        if "id" not in api or not api["id"]:
            api["id"] = generate_id(api.get("name", "unknown"))
    
    current_ids = {api["id"] for api in current_apis}
    current_names = {api.get("name", "").lower() for api in current_apis}
    
    print(f"📊 Current APIs: {len(current_apis)}")
    
    # Add new APIs
    added = 0
    skipped = 0
    
    for api in BATCH2_APIS:
        # Skip if ID exists or name exists (case-insensitive)
        if api["id"] in current_ids or api["name"].lower() in current_names:
            skipped += 1
            continue
        
        # Add cors field if missing
        if "cors" not in api:
            api["cors"] = "unknown"
        current_apis.append(api)
        current_ids.add(api["id"])
        current_names.add(api["name"].lower())
        added += 1
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️ Skipped (duplicates): {skipped}")
    
    # Update registry
    registry["apis"] = current_apis
    registry["count"] = len(current_apis)
    registry["lastUpdated"] = datetime.now().isoformat()
    
    # Count categories
    categories = {}
    for api in current_apis:
        cat = api.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
    registry["categoryCount"] = len(categories)
    
    # Save
    save_registry(registry)
    
    print(f"\n📊 Final count: {len(current_apis)} APIs")
    print(f"📁 Categories: {len(categories)}")
    
    print(f"\n✅ Saved to {REGISTRY_PATH}")
    return added

if __name__ == "__main__":
    added = main()
    print(f"\n🎉 Batch 2 complete! +{added} APIs")
