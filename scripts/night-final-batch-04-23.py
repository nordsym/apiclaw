#!/usr/bin/env python3
"""APIClaw Night Final Batch - 2026-02-23 04:00 - Push to 1000+ new"""

import json
import re
from datetime import datetime

# Load current registry
with open('/Users/gustavhemmingsson/Projects/apiclaw/src/registry/apis.json', 'r') as f:
    registry = json.load(f)

existing_ids = {api['id'] for api in registry['apis']}
initial_count = len(existing_ids)
new_apis = []

def add_api(name, desc, category, url, auth="unknown"):
    api_id = re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')
    api_id = re.sub(r'-+', '-', api_id)
    if api_id not in existing_ids and api_id and len(api_id) > 2:
        existing_ids.add(api_id)
        new_apis.append({
            "id": api_id,
            "name": name,
            "description": desc[:200] if len(desc) > 200 else desc,
            "category": category,
            "auth": auth,
            "https": True,
            "cors": "unknown",
            "link": url,
            "pricing": "unknown",
            "keywords": []
        })
        return True
    return False

# ===== MORE UNIQUE APIs =====

# Government & Public Data APIs (Global)
gov_apis = [
    ("Data.gov.uk", "UK government data", "Government", "https://data.gov.uk/"),
    ("Data.gouv.fr", "French government data", "Government", "https://doc.data.gouv.fr/api/"),
    ("OpenData Germany", "German government data", "Government", "https://www.govdata.de/"),
    ("Data.gov.au", "Australian government data", "Government", "https://data.gov.au/"),
    ("Data.gc.ca", "Canadian government data", "Government", "https://open.canada.ca/en/access-our-application-programming-interface-api"),
    ("Data.gov.in", "Indian government data", "Government", "https://data.gov.in/"),
    ("Data.gov.sg", "Singapore government data", "Government", "https://data.gov.sg/"),
    ("OpenData Japan", "Japanese government data", "Government", "https://www.data.go.jp/"),
    ("OpenData Korea", "Korean government data", "Government", "https://www.data.go.kr/"),
    ("OpenData Brazil", "Brazilian government data", "Government", "https://dados.gov.br/"),
    ("OpenData Mexico", "Mexican government data", "Government", "https://datos.gob.mx/"),
    ("OpenData Italy", "Italian government data", "Government", "https://dati.gov.it/"),
    ("OpenData Spain", "Spanish government data", "Government", "https://datos.gob.es/"),
    ("OpenData Netherlands", "Dutch government data", "Government", "https://data.overheid.nl/"),
    ("OpenData Belgium", "Belgian government data", "Government", "https://data.gov.be/"),
    ("OpenData Switzerland", "Swiss government data", "Government", "https://opendata.swiss/"),
    ("OpenData Austria", "Austrian government data", "Government", "https://www.data.gv.at/"),
    ("OpenData Ireland", "Irish government data", "Government", "https://data.gov.ie/"),
    ("OpenData New Zealand", "NZ government data", "Government", "https://data.govt.nz/"),
    ("UN Data", "United Nations data", "Government", "https://data.un.org/"),
    ("OECD Data", "OECD statistics", "Government", "https://data.oecd.org/"),
    ("IMF Data", "IMF economic data", "Government", "https://data.imf.org/"),
    ("World Bank Open Data", "Development data", "Government", "https://data.worldbank.org/"),
    ("Eurostat", "EU statistics", "Government", "https://ec.europa.eu/eurostat/web/main/data/database"),
    ("Federal Reserve FRED", "US economic data", "Government", "https://fred.stlouisfed.org/docs/api/"),
    ("Census Bureau", "US census data", "Government", "https://www.census.gov/data/developers.html"),
    ("BLS", "US labor statistics", "Government", "https://www.bls.gov/developers/"),
    ("SEC EDGAR", "Financial filings", "Government", "https://www.sec.gov/edgar/sec-api-documentation"),
    ("USPTO", "Patent data", "Government", "https://developer.uspto.gov/"),
    ("NASA Open APIs", "Space data", "Government", "https://api.nasa.gov/"),
    ("NOAA", "Weather climate data", "Government", "https://www.ncdc.noaa.gov/cdo-web/webservices/"),
    ("EPA", "Environmental data", "Government", "https://www.epa.gov/enviro/web-services"),
    ("USGS", "Geological data", "Government", "https://www.usgs.gov/products/data-and-tools/apis"),
    ("NIH", "Health research data", "Government", "https://ncbi.nlm.nih.gov/home/develop/api/"),
    ("CDC", "Disease data", "Government", "https://data.cdc.gov/"),
    ("FAA", "Aviation data", "Government", "https://www.faa.gov/data_research/"),
    ("DOT", "Transportation data", "Government", "https://www.bts.gov/"),
    ("DOE", "Energy data", "Government", "https://www.eia.gov/opendata/"),
    ("USDA", "Agriculture data", "Government", "https://quickstats.nass.usda.gov/api"),
]

for name, desc, cat, url in gov_apis:
    add_api(name, desc, cat, url)

# Niche & Specialized APIs
niche_apis = [
    ("OpenWeatherMap", "Weather data API", "Weather", "https://openweathermap.org/api"),
    ("WeatherAPI", "Weather forecasts", "Weather", "https://www.weatherapi.com/docs/"),
    ("Tomorrow.io", "Weather intelligence", "Weather", "https://docs.tomorrow.io/"),
    ("Climacell", "Weather data", "Weather", "https://www.tomorrow.io/"),
    ("AccuWeather", "Weather forecasts", "Weather", "https://developer.accuweather.com/"),
    ("Weather.gov", "US weather data", "Weather", "https://www.weather.gov/documentation/services-web-api"),
    ("AerisWeather", "Weather API", "Weather", "https://www.aerisweather.com/develop/"),
    ("Visual Crossing Weather", "Historical weather", "Weather", "https://www.visualcrossing.com/resources/documentation/"),
    ("Weatherbit", "Weather data", "Weather", "https://www.weatherbit.io/api"),
    ("OpenUV", "UV index API", "Weather", "https://www.openuv.io/"),
    ("AirVisual", "Air quality data", "Weather", "https://api-docs.iqair.com/"),
    ("Breezometer", "Air quality", "Weather", "https://docs.breezometer.com/"),
    ("PurpleAir", "Air quality sensors", "Weather", "https://api.purpleair.com/"),
    ("Pollen.com", "Pollen data", "Weather", "https://www.pollen.com/"),
    ("Sunrise Sunset", "Sun times API", "Weather", "https://sunrise-sunset.org/api"),
    ("WorldTides", "Tide predictions", "Weather", "https://www.worldtides.info/"),
    ("StormGlass", "Marine weather", "Weather", "https://stormglass.io/"),
    ("Windy", "Weather visualization", "Weather", "https://api.windy.com/"),
]

for name, desc, cat, url in niche_apis:
    add_api(name, desc, cat, url, "apiKey")

# Food & Beverage APIs
food_apis = [
    ("Spoonacular", "Food recipes", "Food", "https://spoonacular.com/food-api"),
    ("Edamam Nutrition", "Nutrition analysis", "Food", "https://developer.edamam.com/"),
    ("Edamam Recipe", "Recipe search", "Food", "https://developer.edamam.com/"),
    ("TheMealDB", "Meal recipes", "Food", "https://www.themealdb.com/api.php"),
    ("TheCocktailDB", "Cocktail recipes", "Food", "https://www.thecocktaildb.com/api.php"),
    ("Open Food Facts", "Food database", "Food", "https://world.openfoodfacts.org/data"),
    ("Open Beauty Facts", "Cosmetics database", "Food", "https://world.openbeautyfacts.org/data"),
    ("Open Pet Food Facts", "Pet food database", "Food", "https://world.openpetfoodfacts.org/data"),
    ("Nutritionix", "Nutrition data", "Food", "https://developer.nutritionix.com/"),
    ("USDA FoodData", "Food composition", "Food", "https://fdc.nal.usda.gov/api-guide.html"),
    ("Recipe Puppy", "Recipe search", "Food", "http://www.recipepuppy.com/about/api/"),
    ("BigOven", "Recipe API", "Food", "https://api2.bigoven.com/"),
    ("Yummly", "Recipe search", "Food", "https://developer.yummly.com/"),
    ("Tasty", "Recipe videos", "Food", "https://rapidapi.com/apidojo/api/tasty/"),
    ("Food2Fork", "Recipe search", "Food", "https://www.food2fork.com/about/api"),
    ("Zestful", "Ingredient parser", "Food", "https://zestfuldata.com/"),
    ("Chomp", "Food database", "Food", "https://chompthis.com/api/"),
    ("CalorieNinjas", "Nutrition API", "Food", "https://calorieninjas.com/api"),
    ("Open Brewery DB", "Brewery data", "Food", "https://www.openbrewerydb.org/"),
    ("PunkAPI", "Beer recipes", "Food", "https://punkapi.com/"),
    ("Wine.com", "Wine data", "Food", "https://api.wine.com/"),
    ("Vivino", "Wine ratings", "Food", "https://vivino.com/"),
    ("Untappd", "Beer social", "Food", "https://untappd.com/api/"),
    ("Coffee API", "Coffee data", "Food", "https://coffee.alexflipnote.dev/"),
]

for name, desc, cat, url in food_apis:
    add_api(name, desc, cat, url, "apiKey")

# Language & Translation APIs  
language_apis = [
    ("Google Translate", "Translation API", "Language", "https://cloud.google.com/translate/docs"),
    ("DeepL", "Translation API", "Language", "https://www.deepl.com/docs-api"),
    ("Microsoft Translator", "Translation API", "Language", "https://docs.microsoft.com/azure/cognitive-services/translator/"),
    ("Amazon Translate", "Translation API", "Language", "https://docs.aws.amazon.com/translate/"),
    ("LibreTranslate", "Open translation", "Language", "https://libretranslate.com/"),
    ("MyMemory", "Translation memory", "Language", "https://mymemory.translated.net/doc/"),
    ("Yandex Translate", "Translation API", "Language", "https://yandex.com/dev/translate/"),
    ("Papago", "Korean translation", "Language", "https://developers.naver.com/docs/papago/"),
    ("Lingvanex", "Translation API", "Language", "https://lingvanex.com/translationapi/"),
    ("Twinword", "Text analysis", "Language", "https://www.twinword.com/api/"),
    ("Text Razor", "Text analysis", "Language", "https://www.textrazor.com/docs"),
    ("Aylien", "Text analysis", "Language", "https://docs.aylien.com/textapi/"),
    ("MonkeyLearn", "Text analysis", "Language", "https://monkeylearn.com/api/"),
    ("MeaningCloud", "Text analytics", "Language", "https://www.meaningcloud.com/developer/"),
    ("Dandelion", "Text analytics", "Language", "https://dandelion.eu/docs/"),
    ("ParallelDots", "Text AI", "Language", "https://www.paralleldots.com/text-analysis-apis"),
    ("Appen", "Language data", "Language", "https://appen.com/"),
    ("Lexalytics", "Text analytics", "Language", "https://www.lexalytics.com/"),
    ("Rosette", "Text analytics", "Language", "https://developer.rosette.com/"),
    ("Expert.ai", "NLP platform", "Language", "https://developer.expert.ai/"),
    ("Symspell", "Spell checking", "Language", "https://github.com/wolfgarbe/SymSpell"),
    ("Grammarbot", "Grammar checking", "Language", "https://www.grammarbot.io/api"),
    ("LanguageTool", "Grammar checking", "Language", "https://languagetool.org/http-api/"),
    ("Sapling", "AI writing", "Language", "https://sapling.ai/docs"),
    ("Writer", "AI writing", "Language", "https://writer.com/api/"),
    ("ProWritingAid", "Writing assistant", "Language", "https://prowritingaid.com/en/"),
    ("Grammarly", "Writing assistant", "Language", "https://developer.grammarly.com/"),
    ("Hemingway", "Writing clarity", "Language", "https://hemingwayapp.com/"),
    ("Wordnik", "Dictionary API", "Language", "https://developer.wordnik.com/"),
    ("Merriam-Webster", "Dictionary API", "Language", "https://dictionaryapi.com/"),
    ("Oxford Dictionary", "Dictionary API", "Language", "https://developer.oxforddictionaries.com/"),
    ("Words API", "Dictionary API", "Language", "https://www.wordsapi.com/"),
    ("Datamuse", "Word API", "Language", "https://www.datamuse.com/api/"),
    ("Thesaurus API", "Synonyms API", "Language", "https://words.bighugelabs.com/api.php"),
    ("Sentiment140", "Sentiment analysis", "Language", "http://www.sentiment140.com/api"),
]

for name, desc, cat, url in language_apis:
    add_api(name, desc, cat, url, "apiKey")

# Image & Vision APIs
vision_apis = [
    ("Google Vision", "Image analysis", "Vision", "https://cloud.google.com/vision/docs"),
    ("AWS Rekognition", "Image video analysis", "Vision", "https://docs.aws.amazon.com/rekognition/"),
    ("Azure Computer Vision", "Image analysis", "Vision", "https://docs.microsoft.com/azure/cognitive-services/computer-vision/"),
    ("Clarifai", "Visual AI", "Vision", "https://docs.clarifai.com/"),
    ("Imagga", "Image recognition", "Vision", "https://docs.imagga.com/"),
    ("Sightengine", "Image moderation", "Vision", "https://sightengine.com/docs/"),
    ("Kairos", "Face recognition", "Vision", "https://www.kairos.com/docs/"),
    ("Face++", "Face detection", "Vision", "https://www.faceplusplus.com/"),
    ("Microsoft Face", "Face detection", "Vision", "https://docs.microsoft.com/azure/cognitive-services/face/"),
    ("Amazon Rekognition Face", "Face analysis", "Vision", "https://docs.aws.amazon.com/rekognition/latest/dg/faces.html"),
    ("DeepAI", "AI vision", "Vision", "https://deepai.org/machine-learning-model/"),
    ("Remove.bg", "Background removal", "Vision", "https://www.remove.bg/api"),
    ("Clipping Magic", "Background removal", "Vision", "https://clippingmagic.com/api"),
    ("Photoroom", "Photo editing AI", "Vision", "https://www.photoroom.com/api"),
    ("Picsart", "Photo editing", "Vision", "https://picsart.io/api-documentation"),
    ("Cutout.pro", "Image editing AI", "Vision", "https://www.cutout.pro/api"),
    ("Let's Enhance", "Image upscaling", "Vision", "https://letsenhance.io/api"),
    ("Upscale.media", "Image upscaling", "Vision", "https://www.upscale.media/"),
    ("BigJPG", "Image upscaling", "Vision", "https://bigjpg.com/api"),
    ("Waifu2x", "Image upscaling", "Vision", "https://waifu2x.udp.jp/"),
    ("TinyPNG", "Image compression", "Vision", "https://tinypng.com/developers"),
    ("Kraken.io", "Image optimization", "Vision", "https://kraken.io/docs/"),
    ("Cloudinary", "Media management", "Vision", "https://cloudinary.com/documentation/"),
    ("Imgix", "Image processing", "Vision", "https://docs.imgix.com/apis"),
    ("ImageKit", "Image CDN", "Vision", "https://docs.imagekit.io/"),
    ("Sirv", "Image CDN", "Vision", "https://sirv.com/help/articles/sirv-rest-api/"),
    ("Filestack", "File handling", "Vision", "https://www.filestack.com/docs/"),
    ("Uploadcare", "File uploading", "Vision", "https://uploadcare.com/docs/"),
    ("Transloadit", "File processing", "Vision", "https://transloadit.com/docs/"),
    ("OCR.space", "OCR API", "Vision", "https://ocr.space/ocrapi"),
    ("Google Cloud OCR", "OCR API", "Vision", "https://cloud.google.com/vision/docs/ocr"),
    ("AWS Textract", "Document OCR", "Vision", "https://docs.aws.amazon.com/textract/"),
    ("Azure Form Recognizer", "Document AI", "Vision", "https://docs.microsoft.com/azure/cognitive-services/form-recognizer/"),
    ("Nanonets OCR", "OCR API", "Vision", "https://nanonets.com/ocr-api/"),
    ("ABBYY", "OCR platform", "Vision", "https://www.abbyy.com/"),
    ("PlateRecognizer", "License plate OCR", "Vision", "https://platerecognizer.com/"),
    ("OpenALPR", "License plate recognition", "Vision", "https://www.openalpr.com/"),
    ("QR Code API", "QR code generation", "Vision", "https://goqr.me/api/"),
    ("Barcode Lookup", "Barcode database", "Vision", "https://www.barcodelookup.com/api"),
    ("UPC Database", "Product barcodes", "Vision", "https://upcdatabase.org/api"),
]

for name, desc, cat, url in vision_apis:
    add_api(name, desc, cat, url, "apiKey")

# Audio & Speech APIs
audio_apis = [
    ("Google Cloud Speech", "Speech to text", "Audio", "https://cloud.google.com/speech-to-text/docs"),
    ("AWS Transcribe", "Speech to text", "Audio", "https://docs.aws.amazon.com/transcribe/"),
    ("Azure Speech", "Speech services", "Audio", "https://docs.microsoft.com/azure/cognitive-services/speech-service/"),
    ("AssemblyAI", "Speech to text", "Audio", "https://www.assemblyai.com/docs/"),
    ("Deepgram", "Speech recognition", "Audio", "https://developers.deepgram.com/"),
    ("Rev AI", "Speech to text", "Audio", "https://www.rev.ai/docs"),
    ("Speechmatics", "Speech recognition", "Audio", "https://www.speechmatics.com/"),
    ("Vosk", "Speech recognition", "Audio", "https://alphacephei.com/vosk/"),
    ("Whisper API", "Speech to text", "Audio", "https://platform.openai.com/docs/guides/speech-to-text"),
    ("ElevenLabs", "Voice synthesis", "Audio", "https://elevenlabs.io/docs/api-reference"),
    ("Play.ht", "Voice synthesis", "Audio", "https://docs.play.ht/"),
    ("Resemble AI", "Voice cloning", "Audio", "https://www.resemble.ai/docs/"),
    ("Coqui", "Voice synthesis", "Audio", "https://coqui.ai/"),
    ("Murf", "AI voice over", "Audio", "https://murf.ai/resources/api"),
    ("WellSaid Labs", "Voice synthesis", "Audio", "https://wellsaidlabs.com/"),
    ("Replica Studios", "AI voices", "Audio", "https://replicastudios.com/"),
    ("Speechify", "Text to speech", "Audio", "https://speechify.com/api"),
    ("Amazon Polly", "Text to speech", "Audio", "https://docs.aws.amazon.com/polly/"),
    ("Google Cloud TTS", "Text to speech", "Audio", "https://cloud.google.com/text-to-speech/docs"),
    ("Azure TTS", "Text to speech", "Audio", "https://docs.microsoft.com/azure/cognitive-services/speech-service/text-to-speech"),
    ("iSpeech", "Speech API", "Audio", "https://www.ispeech.org/developers"),
    ("ReadSpeaker", "Text to speech", "Audio", "https://www.readspeaker.com/"),
    ("VoiceRSS", "Text to speech", "Audio", "https://www.voicerss.org/api/"),
    ("Suno AI", "Music generation", "Audio", "https://suno.ai/"),
    ("Udio", "Music generation", "Audio", "https://udio.com/"),
    ("Mubert", "AI music", "Audio", "https://mubert.com/api"),
    ("AIVA", "AI composition", "Audio", "https://www.aiva.ai/"),
    ("Amper Music", "AI music", "Audio", "https://www.shutterstock.com/music"),
    ("Soundraw", "AI music", "Audio", "https://soundraw.io/"),
    ("Beatoven", "AI music", "Audio", "https://www.beatoven.ai/"),
    ("Boomy", "AI music", "Audio", "https://boomy.com/"),
    ("Loudly", "AI music", "Audio", "https://www.loudly.com/"),
    ("AudioShake", "Stem separation", "Audio", "https://www.audioshake.ai/"),
    ("Lalal.ai", "Stem separation", "Audio", "https://www.lalal.ai/"),
    ("Splitter", "Stem separation", "Audio", "https://splitter.ai/"),
    ("Descript", "Audio editing", "Audio", "https://www.descript.com/"),
    ("Adobe Podcast", "Audio editing", "Audio", "https://podcast.adobe.com/"),
    ("Cleanvoice", "Audio cleaning", "Audio", "https://cleanvoice.ai/"),
    ("Auphonic", "Audio processing", "Audio", "https://auphonic.com/api"),
    ("Dolby.io", "Media APIs", "Audio", "https://docs.dolby.io/"),
]

for name, desc, cat, url in audio_apis:
    add_api(name, desc, cat, url, "apiKey")

# Document & PDF APIs
document_apis = [
    ("DocuSign", "E-signatures", "Documents", "https://developers.docusign.com/"),
    ("HelloSign", "E-signatures", "Documents", "https://developers.hellosign.com/"),
    ("SignNow", "E-signatures", "Documents", "https://signnow.com/api"),
    ("PandaDoc", "Document workflow", "Documents", "https://developers.pandadoc.com/"),
    ("Proposify", "Proposals", "Documents", "https://developers.proposify.com/"),
    ("Qwilr", "Proposals", "Documents", "https://qwilr.com/"),
    ("Better Proposals", "Proposals", "Documents", "https://betterproposals.io/"),
    ("PDF.co", "PDF processing", "Documents", "https://pdf.co/documentation/api"),
    ("PDFShift", "HTML to PDF", "Documents", "https://pdfshift.io/documentation"),
    ("CloudConvert", "File conversion", "Documents", "https://cloudconvert.com/api/"),
    ("Zamzar", "File conversion", "Documents", "https://developers.zamzar.com/"),
    ("ConvertAPI", "File conversion", "Documents", "https://www.convertapi.com/doc"),
    ("DocParser", "Document parsing", "Documents", "https://docparser.com/"),
    ("Parseur", "Email parsing", "Documents", "https://parseur.com/"),
    ("Mailparser", "Email parsing", "Documents", "https://mailparser.io/"),
    ("Docsumo", "Document AI", "Documents", "https://www.docsumo.com/"),
    ("Veryfi", "Receipt OCR", "Documents", "https://www.veryfi.com/"),
    ("Rossum", "Document AI", "Documents", "https://rossum.ai/"),
    ("Base64.ai", "Document AI", "Documents", "https://base64.ai/"),
    ("Hypatos", "Document AI", "Documents", "https://hypatos.ai/"),
    ("Instabase", "Document AI", "Documents", "https://www.instabase.com/"),
    ("Docugami", "Document AI", "Documents", "https://docugami.com/"),
    ("LlamaParse", "Document parsing", "Documents", "https://docs.llamaindex.ai/"),
    ("Unstructured", "Document parsing", "Documents", "https://unstructured.io/"),
    ("Textract", "Document analysis", "Documents", "https://docs.aws.amazon.com/textract/"),
    ("Form Recognizer", "Document AI", "Documents", "https://docs.microsoft.com/azure/cognitive-services/form-recognizer/"),
    ("Document AI", "Google document AI", "Documents", "https://cloud.google.com/document-ai/docs"),
    ("Mindee", "Document parsing", "Documents", "https://developers.mindee.com/"),
    ("Typless", "Document extraction", "Documents", "https://docs.typless.com/"),
    ("Affinda", "Document AI", "Documents", "https://docs.affinda.com/"),
]

for name, desc, cat, url in document_apis:
    add_api(name, desc, cat, url, "apiKey")

# Compliance & Legal APIs
legal_apis = [
    ("LexisNexis", "Legal research", "Legal", "https://developer.lexisnexis.com/"),
    ("Thomson Reuters", "Legal data", "Legal", "https://developers.thomsonreuters.com/"),
    ("Casetext", "Legal research", "Legal", "https://casetext.com/"),
    ("Westlaw", "Legal research", "Legal", "https://www.westlaw.com/"),
    ("Fastcase", "Legal research", "Legal", "https://www.fastcase.com/"),
    ("Ravel Law", "Legal analytics", "Legal", "https://www.ravellaw.com/"),
    ("Clio", "Legal practice", "Legal", "https://app.clio.com/api/"),
    ("MyCase", "Legal practice", "Legal", "https://www.mycase.com/"),
    ("PracticePanther", "Legal software", "Legal", "https://www.practicepanther.com/"),
    ("Rocket Lawyer", "Legal services", "Legal", "https://www.rocketlawyer.com/"),
    ("LegalZoom", "Legal services", "Legal", "https://www.legalzoom.com/"),
    ("Avvo", "Legal marketplace", "Legal", "https://www.avvo.com/"),
    ("Justia", "Legal information", "Legal", "https://law.justia.com/"),
    ("FindLaw", "Legal resources", "Legal", "https://www.findlaw.com/"),
    ("CourtListener", "Court data", "Legal", "https://www.courtlistener.com/api/"),
    ("Pacer", "Court records", "Legal", "https://pacer.uscourts.gov/"),
    ("OpenCorporates", "Company data", "Legal", "https://api.opencorporates.com/"),
    ("Enigma", "Business data", "Legal", "https://www.enigma.com/"),
    ("Dun & Bradstreet", "Business data", "Legal", "https://www.dnb.com/"),
    ("Experian", "Credit data", "Legal", "https://www.experian.com/"),
    ("Equifax", "Credit data", "Legal", "https://www.equifax.com/"),
    ("TransUnion", "Credit data", "Legal", "https://www.transunion.com/"),
    ("FICO", "Credit scoring", "Legal", "https://www.fico.com/"),
    ("Veriff", "Identity verification", "Legal", "https://developers.veriff.com/"),
    ("Onfido", "Identity verification", "Legal", "https://documentation.onfido.com/"),
    ("Jumio", "Identity verification", "Legal", "https://www.jumio.com/"),
    ("Persona", "Identity verification", "Legal", "https://docs.withpersona.com/"),
    ("Alloy", "Identity verification", "Legal", "https://docs.alloy.co/"),
    ("Socure", "Identity verification", "Legal", "https://developer.socure.com/"),
    ("Trulioo", "Identity verification", "Legal", "https://developer.trulioo.com/"),
]

for name, desc, cat, url in legal_apis:
    add_api(name, desc, cat, url, "apiKey")

# HR & Recruiting APIs
hr_apis = [
    ("LinkedIn Talent", "Recruiting platform", "HR", "https://developer.linkedin.com/"),
    ("Indeed", "Job search", "HR", "https://opensource.indeedeng.io/api-documentation/"),
    ("ZipRecruiter", "Job marketplace", "HR", "https://www.ziprecruiter.com/"),
    ("Greenhouse", "ATS platform", "HR", "https://developers.greenhouse.io/"),
    ("Lever", "ATS platform", "HR", "https://hire.lever.co/developer/"),
    ("Workday", "HR platform", "HR", "https://www.workday.com/"),
    ("BambooHR", "HR software", "HR", "https://documentation.bamboohr.com/"),
    ("Gusto", "Payroll HR", "HR", "https://docs.gusto.com/"),
    ("Rippling", "HR platform", "HR", "https://developers.rippling.com/"),
    ("Namely", "HR platform", "HR", "https://developers.namely.com/"),
    ("Paylocity", "Payroll HR", "HR", "https://www.paylocity.com/"),
    ("ADP", "Payroll HR", "HR", "https://developers.adp.com/"),
    ("Paychex", "Payroll HR", "HR", "https://developer.paychex.com/"),
    ("Ceridian", "HCM platform", "HR", "https://developers.ceridian.com/"),
    ("UKG", "HR platform", "HR", "https://www.ukg.com/"),
    ("Workable", "Recruiting", "HR", "https://workable.readme.io/"),
    ("JazzHR", "ATS platform", "HR", "https://www.jazzhr.com/"),
    ("Breezy", "Recruiting", "HR", "https://developer.breezy.hr/"),
    ("Recruitee", "ATS platform", "HR", "https://docs.recruitee.com/"),
    ("Ashby", "ATS platform", "HR", "https://developers.ashbyhq.com/"),
    ("Teamtailor", "ATS platform", "HR", "https://docs.teamtailor.com/"),
    ("Personio", "HR software", "HR", "https://developer.personio.de/"),
    ("HiBob", "HR platform", "HR", "https://apidocs.hibob.com/"),
    ("Remote", "Global HR", "HR", "https://remote.com/api"),
    ("Deel", "Global payroll", "HR", "https://developers.deel.com/"),
    ("Oyster", "Global employment", "HR", "https://www.oysterhr.com/"),
    ("Papaya Global", "Global payroll", "HR", "https://www.papayaglobal.com/"),
    ("Velocity Global", "Global employment", "HR", "https://velocityglobal.com/"),
    ("Multiplier", "Global employment", "HR", "https://www.usemultiplier.com/"),
    ("Lattice", "Performance management", "HR", "https://developers.lattice.com/"),
]

for name, desc, cat, url in hr_apis:
    add_api(name, desc, cat, url, "apiKey")

# Logistics & Supply Chain APIs
logistics_apis = [
    ("ShipStation", "Shipping software", "Logistics", "https://www.shipstation.com/docs/api/"),
    ("Shippo", "Shipping API", "Logistics", "https://goshippo.com/docs/"),
    ("EasyPost", "Shipping API", "Logistics", "https://www.easypost.com/docs/api"),
    ("ShipEngine", "Shipping API", "Logistics", "https://shipengine.github.io/shipengine-openapi/"),
    ("Shipbob", "Fulfillment", "Logistics", "https://developer.shipbob.com/"),
    ("Deliverr", "Fulfillment", "Logistics", "https://www.deliverr.com/"),
    ("ShipHero", "Fulfillment", "Logistics", "https://shiphero.com/"),
    ("Flexport", "Freight", "Logistics", "https://apidocs.flexport.com/"),
    ("Freightos", "Freight", "Logistics", "https://www.freightos.com/"),
    ("Project44", "Visibility", "Logistics", "https://www.project44.com/"),
    ("FourKites", "Visibility", "Logistics", "https://www.fourkites.com/"),
    ("Descartes", "Logistics", "Logistics", "https://www.descartes.com/"),
    ("Blue Yonder", "Supply chain", "Logistics", "https://blueyonder.com/"),
    ("Manhattan Associates", "Supply chain", "Logistics", "https://www.manh.com/"),
    ("Oracle SCM", "Supply chain", "Logistics", "https://www.oracle.com/scm/"),
    ("SAP SCM", "Supply chain", "Logistics", "https://www.sap.com/"),
    ("Coupa", "Procurement", "Logistics", "https://compass.coupa.com/"),
    ("Jaggaer", "Procurement", "Logistics", "https://www.jaggaer.com/"),
    ("Ariba", "Procurement", "Logistics", "https://www.ariba.com/"),
    ("UPS", "Shipping", "Logistics", "https://www.ups.com/upsdeveloperkit/"),
    ("FedEx", "Shipping", "Logistics", "https://www.fedex.com/en-us/developer.html"),
    ("DHL", "Shipping", "Logistics", "https://developer.dhl.com/"),
    ("USPS", "Shipping", "Logistics", "https://www.usps.com/business/web-tools-apis/"),
    ("Royal Mail", "Shipping UK", "Logistics", "https://developer.royalmail.net/"),
    ("Canada Post", "Shipping Canada", "Logistics", "https://www.canadapost-postescanada.ca/cpc/en/support/information-centre/developers.page"),
    ("Australia Post", "Shipping Australia", "Logistics", "https://developers.auspost.com.au/"),
    ("Deutsche Post", "Shipping Germany", "Logistics", "https://developer.dhl.com/"),
    ("La Poste", "Shipping France", "Logistics", "https://developer.laposte.fr/"),
    ("PostNord", "Shipping Nordics", "Logistics", "https://developer.postnord.com/"),
    ("Correos", "Shipping Spain", "Logistics", "https://www.correos.es/"),
]

for name, desc, cat, url in logistics_apis:
    add_api(name, desc, cat, url, "apiKey")

# Gaming & Entertainment APIs  
gaming_apis = [
    ("Steam Web API", "Steam platform", "Gaming", "https://steamcommunity.com/dev"),
    ("PlayStation Network", "PSN platform", "Gaming", "https://www.playstation.com/"),
    ("Xbox Live", "Xbox platform", "Gaming", "https://developer.microsoft.com/games/"),
    ("Nintendo", "Nintendo platform", "Gaming", "https://www.nintendo.com/"),
    ("Epic Games", "Epic platform", "Gaming", "https://dev.epicgames.com/"),
    ("EA Sports", "EA games", "Gaming", "https://www.ea.com/"),
    ("Ubisoft", "Ubisoft games", "Gaming", "https://www.ubisoft.com/"),
    ("Activision", "Activision games", "Gaming", "https://www.activision.com/"),
    ("Riot Games", "League of Legends", "Gaming", "https://developer.riotgames.com/"),
    ("Blizzard", "Blizzard games", "Gaming", "https://develop.battle.net/"),
    ("Supercell", "Mobile games", "Gaming", "https://developer.supercell.com/"),
    ("Niantic", "AR games", "Gaming", "https://nianticlabs.com/"),
    ("Unity", "Game engine", "Gaming", "https://docs.unity3d.com/"),
    ("Unreal Engine", "Game engine", "Gaming", "https://docs.unrealengine.com/"),
    ("Godot", "Game engine", "Gaming", "https://docs.godotengine.org/"),
    ("Roblox", "Gaming platform", "Gaming", "https://create.roblox.com/docs"),
    ("Minecraft", "Minecraft", "Gaming", "https://www.minecraft.net/"),
    ("Fortnite", "Fortnite", "Gaming", "https://www.epicgames.com/fortnite/"),
    ("PUBG", "Battle royale", "Gaming", "https://developer.pubg.com/"),
    ("Apex Legends", "Battle royale", "Gaming", "https://www.ea.com/games/apex-legends"),
    ("Valorant", "Tactical shooter", "Gaming", "https://developer.riotgames.com/"),
    ("Genshin Impact", "Action RPG", "Gaming", "https://genshin.hoyoverse.com/"),
    ("RAWG", "Game database", "Gaming", "https://rawg.io/apidocs"),
    ("IGDB", "Game database", "Gaming", "https://api-docs.igdb.com/"),
    ("Giant Bomb", "Game database", "Gaming", "https://www.giantbomb.com/api/"),
    ("MobyGames", "Game database", "Gaming", "https://www.mobygames.com/info/api/"),
    ("HLTB", "Game completion", "Gaming", "https://howlongtobeat.com/"),
    ("IsThereAnyDeal", "Game deals", "Gaming", "https://isthereanydeal.com/"),
    ("GG.deals", "Game deals", "Gaming", "https://gg.deals/"),
    ("Playfab", "Game backend", "Gaming", "https://docs.microsoft.com/gaming/playfab/"),
]

for name, desc, cat, url in gaming_apis:
    add_api(name, desc, cat, url, "apiKey")

# Science & Research APIs
science_apis = [
    ("NASA", "Space data", "Science", "https://api.nasa.gov/"),
    ("SpaceX", "Launch data", "Science", "https://github.com/r-spacex/SpaceX-API"),
    ("ESA", "European Space", "Science", "https://www.esa.int/"),
    ("JAXA", "Japan Space", "Science", "https://www.jaxa.jp/"),
    ("Roscosmos", "Russian Space", "Science", "https://www.roscosmos.ru/"),
    ("ISRO", "Indian Space", "Science", "https://www.isro.gov.in/"),
    ("CNSA", "Chinese Space", "Science", "http://www.cnsa.gov.cn/"),
    ("Open Notify", "ISS location", "Science", "http://open-notify.org/Open-Notify-API/"),
    ("N2YO", "Satellite tracking", "Science", "https://www.n2yo.com/api/"),
    ("Space-Track", "Satellite data", "Science", "https://www.space-track.org/"),
    ("NASA Exoplanet", "Exoplanet data", "Science", "https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html"),
    ("NASA APOD", "Astronomy photo", "Science", "https://api.nasa.gov/"),
    ("NASA Mars", "Mars data", "Science", "https://api.nasa.gov/"),
    ("NASA NEO", "Near Earth objects", "Science", "https://api.nasa.gov/"),
    ("Wolfram Alpha", "Computational knowledge", "Science", "https://products.wolframalpha.com/api/"),
    ("PubMed", "Medical literature", "Science", "https://www.ncbi.nlm.nih.gov/home/develop/api/"),
    ("Europe PMC", "Medical literature", "Science", "https://europepmc.org/RestfulWebService"),
    ("Semantic Scholar", "Research papers", "Science", "https://api.semanticscholar.org/"),
    ("OpenAlex", "Research data", "Science", "https://docs.openalex.org/"),
    ("Crossref", "Research metadata", "Science", "https://www.crossref.org/documentation/"),
    ("arXiv", "Scientific papers", "Science", "https://arxiv.org/help/api/"),
    ("bioRxiv", "Preprints", "Science", "https://www.biorxiv.org/"),
    ("medRxiv", "Medical preprints", "Science", "https://www.medrxiv.org/"),
    ("Zenodo", "Research repository", "Science", "https://developers.zenodo.org/"),
    ("Figshare", "Research data", "Science", "https://docs.figshare.com/"),
    ("ORCID", "Researcher IDs", "Science", "https://info.orcid.org/documentation/"),
    ("Dimensions", "Research data", "Science", "https://docs.dimensions.ai/"),
    ("Altmetric", "Research impact", "Science", "https://api.altmetric.com/"),
    ("CERN", "Particle physics", "Science", "http://opendata.cern.ch/"),
    ("NCBI", "Biotechnology", "Science", "https://www.ncbi.nlm.nih.gov/home/develop/api/"),
]

for name, desc, cat, url in science_apis:
    add_api(name, desc, cat, url, "apiKey")

# Miscellaneous Useful APIs
misc_apis = [
    ("IP-API", "IP geolocation", "Utilities", "https://ip-api.com/docs"),
    ("ipinfo", "IP intelligence", "Utilities", "https://ipinfo.io/developers"),
    ("ipdata", "IP geolocation", "Utilities", "https://docs.ipdata.co/"),
    ("IPGeolocation", "IP location", "Utilities", "https://ipgeolocation.io/documentation"),
    ("MaxMind", "IP intelligence", "Utilities", "https://www.maxmind.com/"),
    ("UserAgent Parser", "UA parsing", "Utilities", "https://useragent.io/"),
    ("What Is My Browser", "Browser detection", "Utilities", "https://www.whatismybrowser.com/developers/"),
    ("Browser Stack", "Testing platform", "Utilities", "https://www.browserstack.com/docs/"),
    ("Sauce Labs", "Testing platform", "Utilities", "https://docs.saucelabs.com/"),
    ("LambdaTest", "Testing platform", "Utilities", "https://www.lambdatest.com/support/docs/"),
    ("Mailosaur", "Email testing", "Utilities", "https://mailosaur.com/docs/api/"),
    ("Mailtrap", "Email testing", "Utilities", "https://mailtrap.io/api/"),
    ("MailSlurp", "Email testing", "Utilities", "https://www.mailslurp.com/docs/"),
    ("TempMail", "Temporary email", "Utilities", "https://temp-mail.org/"),
    ("Guerrilla Mail", "Temp email", "Utilities", "https://www.guerrillamail.com/"),
    ("SMS Receive", "Temp SMS", "Utilities", "https://receive-smss.com/"),
    ("Have I Been Pwned", "Breach check", "Utilities", "https://haveibeenpwned.com/API/v3"),
    ("VirusTotal", "Malware scan", "Utilities", "https://developers.virustotal.com/"),
    ("Shodan", "Device search", "Utilities", "https://developer.shodan.io/"),
    ("Censys", "Internet scan", "Utilities", "https://search.censys.io/api"),
    ("GreyNoise", "Threat intelligence", "Utilities", "https://docs.greynoise.io/"),
    ("AbuseIPDB", "IP reputation", "Utilities", "https://docs.abuseipdb.com/"),
    ("Cloudflare", "CDN security", "Utilities", "https://api.cloudflare.com/"),
    ("Fastly", "Edge cloud", "Utilities", "https://developer.fastly.com/"),
    ("Akamai", "CDN security", "Utilities", "https://techdocs.akamai.com/"),
    ("KeyCDN", "CDN", "Utilities", "https://www.keycdn.com/api"),
    ("BunnyCDN", "CDN", "Utilities", "https://docs.bunny.net/"),
    ("jsDelivr", "CDN", "Utilities", "https://www.jsdelivr.com/"),
    ("CDNJS", "Libraries CDN", "Utilities", "https://cdnjs.com/api"),
    ("Unpkg", "npm CDN", "Utilities", "https://unpkg.com/"),
]

for name, desc, cat, url in misc_apis:
    add_api(name, desc, cat, url, "apiKey")

# Add all new APIs to registry
registry['apis'].extend(new_apis)
registry['count'] = len(registry['apis'])
registry['lastUpdated'] = datetime.utcnow().isoformat()

# Save updated registry
with open('/Users/gustavhemmingsson/Projects/apiclaw/src/registry/apis.json', 'w') as f:
    json.dump(registry, f, indent=2)

added = len(new_apis)
print(f"✅ Added {added} new APIs")
print(f"📊 Total APIs: {registry['count']}")
print(f"📈 Growth this session: {initial_count} → {registry['count']} (+{registry['count'] - initial_count})")
