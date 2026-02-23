#!/usr/bin/env python3
"""
APIClaw Night Expansion - 05:00 Feb 23, 2026 - Final Batch
Niche and specialized APIs
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
    # Event & Ticketing (30)
    {"name": "Eventbrite", "desc": "Event management", "category": "Events", "url": "https://eventbrite.com"},
    {"name": "Ticketmaster", "desc": "Ticket sales", "category": "Events", "url": "https://ticketmaster.com"},
    {"name": "StubHub", "desc": "Ticket resale", "category": "Events", "url": "https://stubhub.com"},
    {"name": "SeatGeek", "desc": "Ticket search", "category": "Events", "url": "https://seatgeek.com"},
    {"name": "Vivid Seats", "desc": "Ticket marketplace", "category": "Events", "url": "https://vividseats.com"},
    {"name": "Dice", "desc": "Music events", "category": "Events", "url": "https://dice.fm"},
    {"name": "Resident Advisor", "desc": "Electronic music", "category": "Events", "url": "https://ra.co"},
    {"name": "Bandsintown", "desc": "Concert discovery", "category": "Events", "url": "https://bandsintown.com"},
    {"name": "Songkick", "desc": "Concert tracking", "category": "Events", "url": "https://songkick.com"},
    {"name": "Meetup", "desc": "Community events", "category": "Events", "url": "https://meetup.com"},
    {"name": "Luma", "desc": "Event hosting", "category": "Events", "url": "https://lu.ma"},
    {"name": "Partiful", "desc": "Party invites", "category": "Events", "url": "https://partiful.com"},
    {"name": "Splash", "desc": "Event marketing", "category": "Events", "url": "https://splashthat.com"},
    {"name": "Hopin", "desc": "Virtual events", "category": "Events", "url": "https://hopin.com"},
    {"name": "Airmeet", "desc": "Virtual events", "category": "Events", "url": "https://airmeet.com"},
    {"name": "Run The World", "desc": "Virtual events", "category": "Events", "url": "https://runtheworld.today"},
    {"name": "Swapcard", "desc": "Event platform", "category": "Events", "url": "https://swapcard.com"},
    {"name": "Bizzabo", "desc": "Event software", "category": "Events", "url": "https://bizzabo.com"},
    {"name": "Cvent", "desc": "Event management", "category": "Events", "url": "https://cvent.com"},
    {"name": "Whova", "desc": "Event management", "category": "Events", "url": "https://whova.com"},
    {"name": "Accelevents", "desc": "Virtual events", "category": "Events", "url": "https://accelevents.com"},
    {"name": "vFairs", "desc": "Virtual events", "category": "Events", "url": "https://vfairs.com"},
    {"name": "BigMarker", "desc": "Webinar platform", "category": "Events", "url": "https://bigmarker.com"},
    {"name": "Livestorm", "desc": "Video engagement", "category": "Events", "url": "https://livestorm.co"},
    {"name": "Demio", "desc": "Webinar platform", "category": "Events", "url": "https://demio.com"},
    {"name": "WebinarJam", "desc": "Webinar software", "category": "Events", "url": "https://webinarjam.com"},
    {"name": "EverWebinar", "desc": "Automated webinars", "category": "Events", "url": "https://everwebinar.com"},
    {"name": "GoTo Webinar", "desc": "Webinar platform", "category": "Events", "url": "https://goto.com/webinar"},
    {"name": "Zoom Events", "desc": "Event platform", "category": "Events", "url": "https://zoom.us/events"},
    {"name": "Microsoft Teams Live", "desc": "Live events", "category": "Events", "url": "https://teams.microsoft.com"},

    # Food & Restaurant (30)
    {"name": "DoorDash", "desc": "Food delivery", "category": "Food", "url": "https://doordash.com"},
    {"name": "Uber Eats", "desc": "Food delivery", "category": "Food", "url": "https://ubereats.com"},
    {"name": "Grubhub", "desc": "Food delivery", "category": "Food", "url": "https://grubhub.com"},
    {"name": "Postmates", "desc": "On-demand delivery", "category": "Food", "url": "https://postmates.com"},
    {"name": "Caviar", "desc": "Restaurant delivery", "category": "Food", "url": "https://trycaviar.com"},
    {"name": "Instacart", "desc": "Grocery delivery", "category": "Food", "url": "https://instacart.com"},
    {"name": "Shipt", "desc": "Same-day delivery", "category": "Food", "url": "https://shipt.com"},
    {"name": "Gopuff", "desc": "Instant delivery", "category": "Food", "url": "https://gopuff.com"},
    {"name": "Getir", "desc": "Quick delivery", "category": "Food", "url": "https://getir.com"},
    {"name": "Gorillas", "desc": "Grocery delivery", "category": "Food", "url": "https://gorillas.io"},
    {"name": "Flink", "desc": "Grocery delivery", "category": "Food", "url": "https://goflink.com"},
    {"name": "OpenTable", "desc": "Restaurant reservations", "category": "Food", "url": "https://opentable.com"},
    {"name": "Resy", "desc": "Restaurant reservations", "category": "Food", "url": "https://resy.com"},
    {"name": "Yelp Reservations", "desc": "Restaurant booking", "category": "Food", "url": "https://yelp.com"},
    {"name": "Toast", "desc": "Restaurant POS", "category": "Food", "url": "https://toasttab.com"},
    {"name": "Square for Restaurants", "desc": "Restaurant POS", "category": "Food", "url": "https://squareup.com/restaurants"},
    {"name": "Clover", "desc": "POS system", "category": "Food", "url": "https://clover.com"},
    {"name": "Lightspeed Restaurant", "desc": "Restaurant POS", "category": "Food", "url": "https://lightspeedhq.com"},
    {"name": "TouchBistro", "desc": "Restaurant POS", "category": "Food", "url": "https://touchbistro.com"},
    {"name": "Upserve", "desc": "Restaurant analytics", "category": "Food", "url": "https://upserve.com"},
    {"name": "7shifts", "desc": "Restaurant scheduling", "category": "Food", "url": "https://7shifts.com"},
    {"name": "Homebase", "desc": "Staff scheduling", "category": "Food", "url": "https://joinhomebase.com"},
    {"name": "MarketMan", "desc": "Inventory management", "category": "Food", "url": "https://marketman.com"},
    {"name": "BlueCart", "desc": "Restaurant ordering", "category": "Food", "url": "https://bluecart.com"},
    {"name": "ChowNow", "desc": "Online ordering", "category": "Food", "url": "https://chownow.com"},
    {"name": "Olo", "desc": "Digital ordering", "category": "Food", "url": "https://olo.com"},
    {"name": "Lunchbox", "desc": "Restaurant tech", "category": "Food", "url": "https://lunchbox.io"},
    {"name": "BentoBox", "desc": "Restaurant websites", "category": "Food", "url": "https://getbento.com"},
    {"name": "Popmenu", "desc": "Restaurant tech", "category": "Food", "url": "https://popmenu.com"},
    {"name": "Owner.com", "desc": "Restaurant marketing", "category": "Food", "url": "https://owner.com"},

    # Science & Research (30)
    {"name": "Crossref", "desc": "Scholarly metadata", "category": "Science", "url": "https://crossref.org"},
    {"name": "Semantic Scholar", "desc": "AI research", "category": "Science", "url": "https://semanticscholar.org"},
    {"name": "arXiv", "desc": "Preprint server", "category": "Science", "url": "https://arxiv.org"},
    {"name": "bioRxiv", "desc": "Biology preprints", "category": "Science", "url": "https://biorxiv.org"},
    {"name": "medRxiv", "desc": "Medical preprints", "category": "Science", "url": "https://medrxiv.org"},
    {"name": "ORCID", "desc": "Researcher IDs", "category": "Science", "url": "https://orcid.org"},
    {"name": "Altmetric", "desc": "Research metrics", "category": "Science", "url": "https://altmetric.com"},
    {"name": "Dimensions", "desc": "Research database", "category": "Science", "url": "https://dimensions.ai"},
    {"name": "Scopus", "desc": "Citation database", "category": "Science", "url": "https://scopus.com"},
    {"name": "Web of Science", "desc": "Research platform", "category": "Science", "url": "https://webofscience.com"},
    {"name": "Google Scholar", "desc": "Academic search", "category": "Science", "url": "https://scholar.google.com"},
    {"name": "ResearchGate", "desc": "Research network", "category": "Science", "url": "https://researchgate.net"},
    {"name": "Academia.edu", "desc": "Academic network", "category": "Science", "url": "https://academia.edu"},
    {"name": "Zotero", "desc": "Reference manager", "category": "Science", "url": "https://zotero.org"},
    {"name": "Mendeley", "desc": "Reference manager", "category": "Science", "url": "https://mendeley.com"},
    {"name": "Papers", "desc": "Reference manager", "category": "Science", "url": "https://papersapp.com"},
    {"name": "EndNote", "desc": "Reference manager", "category": "Science", "url": "https://endnote.com"},
    {"name": "Overleaf", "desc": "LaTeX editor", "category": "Science", "url": "https://overleaf.com"},
    {"name": "Authorea", "desc": "Scientific writing", "category": "Science", "url": "https://authorea.com"},
    {"name": "Protocols.io", "desc": "Research protocols", "category": "Science", "url": "https://protocols.io"},
    {"name": "Benchling", "desc": "Life science R&D", "category": "Science", "url": "https://benchling.com"},
    {"name": "Dotmatics", "desc": "Scientific software", "category": "Science", "url": "https://dotmatics.com"},
    {"name": "LabArchives", "desc": "Electronic lab notebook", "category": "Science", "url": "https://labarchives.com"},
    {"name": "SciNote", "desc": "Lab notebook", "category": "Science", "url": "https://scinote.net"},
    {"name": "NCBI", "desc": "Biotech databases", "category": "Science", "url": "https://ncbi.nlm.nih.gov"},
    {"name": "UniProt", "desc": "Protein database", "category": "Science", "url": "https://uniprot.org"},
    {"name": "RCSB PDB", "desc": "Protein structures", "category": "Science", "url": "https://rcsb.org"},
    {"name": "ChEMBL", "desc": "Drug discovery", "category": "Science", "url": "https://ebi.ac.uk/chembl"},
    {"name": "PubChem", "desc": "Chemistry database", "category": "Science", "url": "https://pubchem.ncbi.nlm.nih.gov"},
    {"name": "ChemSpider", "desc": "Chemical database", "category": "Science", "url": "https://chemspider.com"},

    # Language & Translation (20)
    {"name": "DeepL", "desc": "AI translation", "category": "Language", "url": "https://deepl.com"},
    {"name": "Google Translate", "desc": "Translation service", "category": "Language", "url": "https://translate.google.com"},
    {"name": "Microsoft Translator", "desc": "Translation API", "category": "Language", "url": "https://translator.microsoft.com"},
    {"name": "Amazon Translate", "desc": "Neural translation", "category": "Language", "url": "https://aws.amazon.com/translate"},
    {"name": "ModernMT", "desc": "Adaptive translation", "category": "Language", "url": "https://modernmt.com"},
    {"name": "Unbabel", "desc": "Translation platform", "category": "Language", "url": "https://unbabel.com"},
    {"name": "Smartling", "desc": "Translation management", "category": "Language", "url": "https://smartling.com"},
    {"name": "Phrase", "desc": "Localization platform", "category": "Language", "url": "https://phrase.com"},
    {"name": "Lokalise", "desc": "Localization", "category": "Language", "url": "https://lokalise.com"},
    {"name": "Crowdin", "desc": "Localization platform", "category": "Language", "url": "https://crowdin.com"},
    {"name": "Transifex", "desc": "Localization", "category": "Language", "url": "https://transifex.com"},
    {"name": "POEditor", "desc": "Localization", "category": "Language", "url": "https://poeditor.com"},
    {"name": "Weglot", "desc": "Website translation", "category": "Language", "url": "https://weglot.com"},
    {"name": "Bablic", "desc": "Website localization", "category": "Language", "url": "https://bablic.com"},
    {"name": "LanguageTool", "desc": "Grammar checker", "category": "Language", "url": "https://languagetool.org"},
    {"name": "Grammarly", "desc": "Writing assistant", "category": "Language", "url": "https://grammarly.com"},
    {"name": "ProWritingAid", "desc": "Writing assistant", "category": "Language", "url": "https://prowritingaid.com"},
    {"name": "Hemingway", "desc": "Writing editor", "category": "Language", "url": "https://hemingwayapp.com"},
    {"name": "Linguee", "desc": "Translation dictionary", "category": "Language", "url": "https://linguee.com"},
    {"name": "Reverso", "desc": "Translation tools", "category": "Language", "url": "https://reverso.net"},

    # Automotive (30)
    {"name": "Carfax", "desc": "Vehicle history", "category": "Automotive", "url": "https://carfax.com"},
    {"name": "AutoCheck", "desc": "Vehicle reports", "category": "Automotive", "url": "https://autocheck.com"},
    {"name": "Kelley Blue Book", "desc": "Car values", "category": "Automotive", "url": "https://kbb.com"},
    {"name": "Edmunds", "desc": "Car research", "category": "Automotive", "url": "https://edmunds.com"},
    {"name": "TrueCar", "desc": "Car pricing", "category": "Automotive", "url": "https://truecar.com"},
    {"name": "Cars.com", "desc": "Car marketplace", "category": "Automotive", "url": "https://cars.com"},
    {"name": "AutoTrader", "desc": "Car marketplace", "category": "Automotive", "url": "https://autotrader.com"},
    {"name": "CarGurus", "desc": "Car shopping", "category": "Automotive", "url": "https://cargurus.com"},
    {"name": "Vroom", "desc": "Online car buying", "category": "Automotive", "url": "https://vroom.com"},
    {"name": "Carvana", "desc": "Online car buying", "category": "Automotive", "url": "https://carvana.com"},
    {"name": "Shift", "desc": "Used car marketplace", "category": "Automotive", "url": "https://shift.com"},
    {"name": "Turo", "desc": "Car sharing", "category": "Automotive", "url": "https://turo.com"},
    {"name": "Getaround", "desc": "Car sharing", "category": "Automotive", "url": "https://getaround.com"},
    {"name": "Zipcar", "desc": "Car sharing", "category": "Automotive", "url": "https://zipcar.com"},
    {"name": "Tesla", "desc": "Electric vehicles", "category": "Automotive", "url": "https://tesla.com"},
    {"name": "ChargePoint", "desc": "EV charging", "category": "Automotive", "url": "https://chargepoint.com"},
    {"name": "EVgo", "desc": "EV charging", "category": "Automotive", "url": "https://evgo.com"},
    {"name": "Electrify America", "desc": "EV charging", "category": "Automotive", "url": "https://electrifyamerica.com"},
    {"name": "PlugShare", "desc": "EV charging map", "category": "Automotive", "url": "https://plugshare.com"},
    {"name": "Open Charge Map", "desc": "EV charging data", "category": "Automotive", "url": "https://openchargemap.org"},
    {"name": "Smartcar", "desc": "Connected car API", "category": "Automotive", "url": "https://smartcar.com"},
    {"name": "Bluelink", "desc": "Hyundai connected", "category": "Automotive", "url": "https://bluelinkservice.com"},
    {"name": "FordPass", "desc": "Ford connected", "category": "Automotive", "url": "https://fordpass.com"},
    {"name": "OnStar", "desc": "GM connected", "category": "Automotive", "url": "https://onstar.com"},
    {"name": "BMW Connected", "desc": "BMW connected", "category": "Automotive", "url": "https://bmw.com"},
    {"name": "Mercedes me", "desc": "Mercedes connected", "category": "Automotive", "url": "https://mercedes-benz.com"},
    {"name": "Audi Connect", "desc": "Audi connected", "category": "Automotive", "url": "https://audi.com"},
    {"name": "Geotab", "desc": "Fleet telematics", "category": "Automotive", "url": "https://geotab.com"},
    {"name": "Samsara", "desc": "Fleet management", "category": "Automotive", "url": "https://samsara.com"},
    {"name": "Verizon Connect", "desc": "Fleet tracking", "category": "Automotive", "url": "https://verizonconnect.com"},

    # More Developer Tools (30)
    {"name": "Vercel", "desc": "Frontend cloud", "category": "DevTools", "url": "https://vercel.com"},
    {"name": "Cloudflare Workers", "desc": "Edge computing", "category": "DevTools", "url": "https://workers.cloudflare.com"},
    {"name": "AWS Lambda", "desc": "Serverless compute", "category": "DevTools", "url": "https://aws.amazon.com/lambda"},
    {"name": "Azure Functions", "desc": "Serverless compute", "category": "DevTools", "url": "https://azure.microsoft.com/functions"},
    {"name": "Google Cloud Functions", "desc": "Serverless compute", "category": "DevTools", "url": "https://cloud.google.com/functions"},
    {"name": "Docker Hub", "desc": "Container registry", "category": "DevTools", "url": "https://hub.docker.com"},
    {"name": "GitHub Container", "desc": "Container registry", "category": "DevTools", "url": "https://ghcr.io"},
    {"name": "Kubernetes", "desc": "Container orchestration", "category": "DevTools", "url": "https://kubernetes.io"},
    {"name": "Helm", "desc": "Kubernetes package manager", "category": "DevTools", "url": "https://helm.sh"},
    {"name": "ArgoCD", "desc": "GitOps for K8s", "category": "DevTools", "url": "https://argoproj.github.io/argo-cd"},
    {"name": "Flux", "desc": "GitOps toolkit", "category": "DevTools", "url": "https://fluxcd.io"},
    {"name": "Terraform", "desc": "Infrastructure as code", "category": "DevTools", "url": "https://terraform.io"},
    {"name": "Pulumi", "desc": "Infrastructure as code", "category": "DevTools", "url": "https://pulumi.com"},
    {"name": "Ansible", "desc": "Automation platform", "category": "DevTools", "url": "https://ansible.com"},
    {"name": "Chef", "desc": "Configuration management", "category": "DevTools", "url": "https://chef.io"},
    {"name": "Puppet", "desc": "Infrastructure automation", "category": "DevTools", "url": "https://puppet.com"},
    {"name": "Salt", "desc": "Infrastructure automation", "category": "DevTools", "url": "https://saltstack.com"},
    {"name": "Jenkins", "desc": "CI/CD server", "category": "DevTools", "url": "https://jenkins.io"},
    {"name": "GitHub Actions", "desc": "CI/CD workflows", "category": "DevTools", "url": "https://github.com/features/actions"},
    {"name": "GitLab CI", "desc": "CI/CD platform", "category": "DevTools", "url": "https://gitlab.com/ci"},
    {"name": "CircleCI", "desc": "CI/CD platform", "category": "DevTools", "url": "https://circleci.com"},
    {"name": "Travis CI", "desc": "CI/CD service", "category": "DevTools", "url": "https://travis-ci.com"},
    {"name": "Buildkite", "desc": "CI/CD platform", "category": "DevTools", "url": "https://buildkite.com"},
    {"name": "Semaphore", "desc": "CI/CD platform", "category": "DevTools", "url": "https://semaphoreci.com"},
    {"name": "Drone", "desc": "Container-native CI", "category": "DevTools", "url": "https://drone.io"},
    {"name": "CodeFresh", "desc": "GitOps CI/CD", "category": "DevTools", "url": "https://codefresh.io"},
    {"name": "Octopus Deploy", "desc": "Deployment automation", "category": "DevTools", "url": "https://octopus.com"},
    {"name": "Spinnaker", "desc": "Multi-cloud CD", "category": "DevTools", "url": "https://spinnaker.io"},
    {"name": "Harness", "desc": "Software delivery", "category": "DevTools", "url": "https://harness.io"},
    {"name": "LaunchDarkly", "desc": "Feature flags", "category": "DevTools", "url": "https://launchdarkly.com"},

    # More unique APIs (30)
    {"name": "Abstract API", "desc": "Web APIs", "category": "Utility", "url": "https://abstractapi.com"},
    {"name": "IPinfo", "desc": "IP geolocation", "category": "Utility", "url": "https://ipinfo.io"},
    {"name": "IPstack", "desc": "IP geolocation", "category": "Utility", "url": "https://ipstack.com"},
    {"name": "IPdata", "desc": "IP geolocation", "category": "Utility", "url": "https://ipdata.co"},
    {"name": "DB-IP", "desc": "IP geolocation", "category": "Utility", "url": "https://db-ip.com"},
    {"name": "MaxMind", "desc": "IP intelligence", "category": "Utility", "url": "https://maxmind.com"},
    {"name": "Numverify", "desc": "Phone validation", "category": "Utility", "url": "https://numverify.com"},
    {"name": "Abstract Phone", "desc": "Phone validation", "category": "Utility", "url": "https://abstractapi.com/phone"},
    {"name": "Mailboxlayer", "desc": "Email validation", "category": "Utility", "url": "https://mailboxlayer.com"},
    {"name": "ZeroBounce", "desc": "Email validation", "category": "Utility", "url": "https://zerobounce.net"},
    {"name": "Kickbox", "desc": "Email verification", "category": "Utility", "url": "https://kickbox.com"},
    {"name": "NeverBounce", "desc": "Email verification", "category": "Utility", "url": "https://neverbounce.com"},
    {"name": "Currencylayer", "desc": "Exchange rates", "category": "Utility", "url": "https://currencylayer.com"},
    {"name": "Fixer", "desc": "Exchange rates", "category": "Utility", "url": "https://fixer.io"},
    {"name": "Open Exchange Rates", "desc": "Currency data", "category": "Utility", "url": "https://openexchangerates.org"},
    {"name": "ExchangeRate-API", "desc": "Exchange rates", "category": "Utility", "url": "https://exchangerate-api.com"},
    {"name": "Screenshotapi", "desc": "Screenshot API", "category": "Utility", "url": "https://screenshotapi.net"},
    {"name": "URL2PNG", "desc": "Screenshot API", "category": "Utility", "url": "https://url2png.com"},
    {"name": "ApiFlash", "desc": "Screenshot API", "category": "Utility", "url": "https://apiflash.com"},
    {"name": "Browshot", "desc": "Screenshot API", "category": "Utility", "url": "https://browshot.com"},
    {"name": "PDFShift", "desc": "HTML to PDF", "category": "Utility", "url": "https://pdfshift.io"},
    {"name": "DocRaptor", "desc": "HTML to PDF", "category": "Utility", "url": "https://docraptor.com"},
    {"name": "HTML2PDF", "desc": "PDF generation", "category": "Utility", "url": "https://html2pdf.app"},
    {"name": "Prince", "desc": "HTML to PDF", "category": "Utility", "url": "https://princexml.com"},
    {"name": "Cloudmersive", "desc": "Document APIs", "category": "Utility", "url": "https://cloudmersive.com"},
    {"name": "Aspose", "desc": "Document APIs", "category": "Utility", "url": "https://aspose.cloud"},
    {"name": "PDF.co", "desc": "PDF APIs", "category": "Utility", "url": "https://pdf.co"},
    {"name": "Anvil", "desc": "PDF automation", "category": "Utility", "url": "https://useanvil.com"},
    {"name": "Docparser", "desc": "Document extraction", "category": "Utility", "url": "https://docparser.com"},
    {"name": "Veryfi", "desc": "Receipt OCR", "category": "Utility", "url": "https://veryfi.com"},

    # Fun & Random (30)
    {"name": "Cat Facts", "desc": "Random cat facts", "category": "Fun", "url": "https://catfact.ninja"},
    {"name": "Dog API", "desc": "Random dog images", "category": "Fun", "url": "https://dog.ceo"},
    {"name": "RandomFox", "desc": "Random fox images", "category": "Fun", "url": "https://randomfox.ca"},
    {"name": "PlaceKitten", "desc": "Placeholder kittens", "category": "Fun", "url": "https://placekitten.com"},
    {"name": "PlaceDog", "desc": "Placeholder dogs", "category": "Fun", "url": "https://placedog.net"},
    {"name": "Lorem Picsum", "desc": "Random images", "category": "Fun", "url": "https://picsum.photos"},
    {"name": "Placeholder", "desc": "Placeholder images", "category": "Fun", "url": "https://placeholder.com"},
    {"name": "DiceBear", "desc": "Avatar generation", "category": "Fun", "url": "https://dicebear.com"},
    {"name": "Robohash", "desc": "Robot avatars", "category": "Fun", "url": "https://robohash.org"},
    {"name": "UI Avatars", "desc": "Initial avatars", "category": "Fun", "url": "https://ui-avatars.com"},
    {"name": "Adorable Avatars", "desc": "Cute avatars", "category": "Fun", "url": "https://api.adorable.io"},
    {"name": "Faker API", "desc": "Fake data", "category": "Fun", "url": "https://fakerapi.it"},
    {"name": "Random User", "desc": "Random user data", "category": "Fun", "url": "https://randomuser.me"},
    {"name": "JSONPlaceholder", "desc": "Fake REST API", "category": "Fun", "url": "https://jsonplaceholder.typicode.com"},
    {"name": "ReqRes", "desc": "Fake API", "category": "Fun", "url": "https://reqres.in"},
    {"name": "DummyJSON", "desc": "Fake REST API", "category": "Fun", "url": "https://dummyjson.com"},
    {"name": "Bored API", "desc": "Activity suggestions", "category": "Fun", "url": "https://boredapi.com"},
    {"name": "Advice Slip", "desc": "Random advice", "category": "Fun", "url": "https://adviceslip.com"},
    {"name": "Zen Quotes", "desc": "Inspirational quotes", "category": "Fun", "url": "https://zenquotes.io"},
    {"name": "Quotable", "desc": "Random quotes", "category": "Fun", "url": "https://quotable.io"},
    {"name": "Affirmations", "desc": "Daily affirmations", "category": "Fun", "url": "https://affirmations.dev"},
    {"name": "Kanye REST", "desc": "Kanye quotes", "category": "Fun", "url": "https://kanye.rest"},
    {"name": "Chuck Norris", "desc": "Chuck Norris jokes", "category": "Fun", "url": "https://api.chucknorris.io"},
    {"name": "Dad Jokes", "desc": "Dad jokes API", "category": "Fun", "url": "https://icanhazdadjoke.com"},
    {"name": "JokeAPI", "desc": "Programming jokes", "category": "Fun", "url": "https://jokeapi.dev"},
    {"name": "Official Joke", "desc": "Random jokes", "category": "Fun", "url": "https://official-joke-api.appspot.com"},
    {"name": "Techy", "desc": "Tech-themed words", "category": "Fun", "url": "https://techy-api.vercel.app"},
    {"name": "Evil Insult", "desc": "Insult generator", "category": "Fun", "url": "https://evilinsult.com"},
    {"name": "Complimentr", "desc": "Compliments API", "category": "Fun", "url": "https://complimentr.com"},
    {"name": "Numbers API", "desc": "Number facts", "category": "Fun", "url": "https://numbersapi.com"},

    # More AI/ML specialized (30)
    {"name": "Hugging Face", "desc": "AI model hub", "category": "AI", "url": "https://huggingface.co"},
    {"name": "Roboflow", "desc": "Computer vision", "category": "AI", "url": "https://roboflow.com"},
    {"name": "Labelbox", "desc": "Data labeling", "category": "AI", "url": "https://labelbox.com"},
    {"name": "Scale AI", "desc": "Data annotation", "category": "AI", "url": "https://scale.com"},
    {"name": "Snorkel AI", "desc": "Data-centric AI", "category": "AI", "url": "https://snorkel.ai"},
    {"name": "Weights & Biases", "desc": "ML experiment tracking", "category": "AI", "url": "https://wandb.ai"},
    {"name": "MLflow", "desc": "ML lifecycle", "category": "AI", "url": "https://mlflow.org"},
    {"name": "Neptune", "desc": "ML metadata store", "category": "AI", "url": "https://neptune.ai"},
    {"name": "Comet ML", "desc": "ML experiment platform", "category": "AI", "url": "https://comet.com"},
    {"name": "DVC", "desc": "Data version control", "category": "AI", "url": "https://dvc.org"},
    {"name": "ClearML", "desc": "MLOps platform", "category": "AI", "url": "https://clear.ml"},
    {"name": "SageMaker", "desc": "AWS ML platform", "category": "AI", "url": "https://aws.amazon.com/sagemaker"},
    {"name": "Vertex AI", "desc": "Google ML platform", "category": "AI", "url": "https://cloud.google.com/vertex-ai"},
    {"name": "Azure ML", "desc": "Microsoft ML platform", "category": "AI", "url": "https://azure.microsoft.com/ml"},
    {"name": "Databricks", "desc": "Unified analytics", "category": "AI", "url": "https://databricks.com"},
    {"name": "Snowflake ML", "desc": "Data cloud ML", "category": "AI", "url": "https://snowflake.com"},
    {"name": "Pinecone", "desc": "Vector database", "category": "AI", "url": "https://pinecone.io"},
    {"name": "Weaviate", "desc": "Vector search", "category": "AI", "url": "https://weaviate.io"},
    {"name": "Qdrant", "desc": "Vector database", "category": "AI", "url": "https://qdrant.tech"},
    {"name": "Milvus", "desc": "Vector database", "category": "AI", "url": "https://milvus.io"},
    {"name": "Chroma", "desc": "Vector database", "category": "AI", "url": "https://trychroma.com"},
    {"name": "LanceDB", "desc": "Vector database", "category": "AI", "url": "https://lancedb.com"},
    {"name": "Vectara", "desc": "Semantic search", "category": "AI", "url": "https://vectara.com"},
    {"name": "LangChain", "desc": "LLM framework", "category": "AI", "url": "https://langchain.com"},
    {"name": "LlamaIndex", "desc": "LLM data framework", "category": "AI", "url": "https://llamaindex.ai"},
    {"name": "Haystack", "desc": "LLM framework", "category": "AI", "url": "https://haystack.deepset.ai"},
    {"name": "Guardrails", "desc": "LLM output validation", "category": "AI", "url": "https://guardrailsai.com"},
    {"name": "Guidance", "desc": "LLM programming", "category": "AI", "url": "https://github.com/guidance-ai/guidance"},
    {"name": "LMQL", "desc": "LLM query language", "category": "AI", "url": "https://lmql.ai"},
    {"name": "Marvin", "desc": "AI engineering", "category": "AI", "url": "https://askmarvin.ai"},
]

def main():
    print("🦞 APIClaw Night Expansion - Final Batch")
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
    print(f"\n✅ Session complete!")
    
    return added

if __name__ == "__main__":
    main()
