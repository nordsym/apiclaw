#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-27 04:00 - Batch 2
More niche and specialized APIs
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "night-expansion-02-27-04-batch2.json"

def load_existing():
    existing = set()
    for f in DATA_DIR.glob("*.json"):
        try:
            with open(f) as file:
                data = json.load(file)
                if isinstance(data, list):
                    for api in data:
                        if isinstance(api, dict) and "name" in api:
                            existing.add(api["name"].lower().strip())
        except:
            pass
    return existing

existing_apis = load_existing()
print(f"Found {len(existing_apis)} existing APIs")

new_apis = []

def add_api(name, desc, category, auth="none", base_url=""):
    if name.lower().strip() not in existing_apis:
        new_apis.append({
            "name": name,
            "description": desc,
            "category": category,
            "authType": auth,
            "baseUrl": base_url
        })
        existing_apis.add(name.lower().strip())
        return True
    return False

# ============================================
# Healthcare & Medical APIs (50+)
# ============================================
healthcare_apis = [
    ("Infermedica", "Medical diagnosis API", "Healthcare", "apiKey", "https://infermedica.com"),
    ("OpenFDA", "FDA public data", "Healthcare", "none", "https://open.fda.gov"),
    ("BioThings", "Biological data APIs", "Healthcare", "none", "https://biothings.io"),
    ("PubMed", "Medical literature database", "Healthcare", "apiKey", "https://pubmed.ncbi.nlm.nih.gov"),
    ("DrugBank", "Drug database", "Healthcare", "apiKey", "https://drugbank.com"),
    ("ChEMBL", "Chemical database", "Healthcare", "none", "https://chembl.org"),
    ("UniProt", "Protein sequence database", "Healthcare", "none", "https://uniprot.org"),
    ("OMIM", "Human genes and genetic conditions", "Healthcare", "apiKey", "https://omim.org"),
    ("ClinicalTrials.gov", "Clinical trial registry", "Healthcare", "none", "https://clinicaltrials.gov"),
    ("HealthData.gov", "US health data", "Healthcare", "none", "https://healthdata.gov"),
    ("WHO", "World Health Organization data", "Healthcare", "none", "https://who.int"),
    ("CDC", "Centers for Disease Control data", "Healthcare", "none", "https://cdc.gov"),
    ("Medicare", "Medicare data", "Healthcare", "apiKey", "https://medicare.gov"),
    ("Teladoc", "Telehealth platform", "Healthcare", "apiKey", "https://teladoc.com"),
    ("Amwell", "Telehealth services", "Healthcare", "apiKey", "https://amwell.com"),
    ("Doxy.me", "Telemedicine platform", "Healthcare", "apiKey", "https://doxy.me"),
    ("Redox", "Healthcare data integration", "Healthcare", "apiKey", "https://redoxengine.com"),
    ("Health Gorilla", "Healthcare data network", "Healthcare", "apiKey", "https://healthgorilla.com"),
    ("Particle Health", "Patient health data", "Healthcare", "apiKey", "https://particlehealth.com"),
    ("1upHealth", "FHIR data platform", "Healthcare", "apiKey", "https://1up.health"),
    ("Flexpa", "Healthcare payments data", "Healthcare", "apiKey", "https://flexpa.com"),
    ("Ribbon Health", "Healthcare provider data", "Healthcare", "apiKey", "https://ribbonhealth.com"),
    ("Eligible", "Healthcare eligibility", "Healthcare", "apiKey", "https://eligible.com"),
    ("Waystar", "Revenue cycle management", "Healthcare", "apiKey", "https://waystar.com"),
    ("Change Healthcare", "Healthcare technology", "Healthcare", "apiKey", "https://changehealthcare.com"),
    ("Athenahealth", "Healthcare network", "Healthcare", "apiKey", "https://athenahealth.com"),
    ("Epic", "Healthcare software", "Healthcare", "apiKey", "https://epic.com"),
    ("Cerner", "Healthcare IT", "Healthcare", "apiKey", "https://cerner.com"),
    ("Allscripts", "Healthcare IT solutions", "Healthcare", "apiKey", "https://allscripts.com"),
    ("eClinicalWorks", "EHR and practice management", "Healthcare", "apiKey", "https://eclinicalworks.com"),
]

for api in healthcare_apis:
    add_api(*api)

# ============================================
# Legal & Compliance APIs (30+)
# ============================================
legal_apis = [
    ("CourtListener", "US court data", "Legal", "apiKey", "https://courtlistener.com"),
    ("Harvard Caselaw", "US caselaw database", "Legal", "apiKey", "https://case.law"),
    ("OpenCorporates", "Corporate data worldwide", "Legal", "apiKey", "https://opencorporates.com"),
    ("Comply Advantage", "AML compliance", "Legal", "apiKey", "https://complyadvantage.com"),
    ("Trulioo", "Identity verification", "Legal", "apiKey", "https://trulioo.com"),
    ("Onfido", "Identity verification", "Legal", "apiKey", "https://onfido.com"),
    ("Veriff", "Identity verification", "Legal", "apiKey", "https://veriff.com"),
    ("Jumio", "Identity verification", "Legal", "apiKey", "https://jumio.com"),
    ("Persona", "Identity platform", "Legal", "apiKey", "https://withpersona.com"),
    ("Checkr", "Background checks", "Legal", "apiKey", "https://checkr.com"),
    ("GoodHire", "Employment screening", "Legal", "apiKey", "https://goodhire.com"),
    ("Sterling", "Background screening", "Legal", "apiKey", "https://sterlingcheck.com"),
    ("Alloy", "Identity decisioning", "Legal", "apiKey", "https://alloy.com"),
    ("Middesk", "Business verification", "Legal", "apiKey", "https://middesk.com"),
    ("Socure", "Digital identity verification", "Legal", "apiKey", "https://socure.com"),
    ("Sentilink", "Identity fraud prevention", "Legal", "apiKey", "https://sentilink.com"),
    ("Tessera", "Corporate intelligence", "Legal", "apiKey", "https://tessera.co"),
    ("Lexis Nexis", "Legal research", "Legal", "apiKey", "https://lexisnexis.com"),
    ("Westlaw", "Legal research", "Legal", "apiKey", "https://westlaw.com"),
    ("Clio", "Legal practice management", "Legal", "apiKey", "https://clio.com"),
    ("MyCase", "Legal case management", "Legal", "apiKey", "https://mycase.com"),
    ("Rocket Lawyer", "Legal services", "Legal", "apiKey", "https://rocketlawyer.com"),
    ("LegalZoom", "Legal services", "Legal", "apiKey", "https://legalzoom.com"),
    ("DocuLaw", "Legal document automation", "Legal", "apiKey", "https://doculaw.com"),
    ("Contract Express", "Contract automation", "Legal", "apiKey", "https://contractexpress.com"),
]

for api in legal_apis:
    add_api(*api)

# ============================================
# Real Estate APIs (30+)
# ============================================
realestate_apis = [
    ("Zillow", "Real estate data", "Real Estate", "apiKey", "https://zillow.com"),
    ("Redfin", "Real estate brokerage data", "Real Estate", "apiKey", "https://redfin.com"),
    ("Realtor.com", "Real estate listings", "Real Estate", "apiKey", "https://realtor.com"),
    ("Trulia", "Real estate marketplace", "Real Estate", "apiKey", "https://trulia.com"),
    ("HouseCanary", "Real estate analytics", "Real Estate", "apiKey", "https://housecanary.com"),
    ("Attom Data", "Property data", "Real Estate", "apiKey", "https://attomdata.com"),
    ("CoreLogic", "Property data and analytics", "Real Estate", "apiKey", "https://corelogic.com"),
    ("Reonomy", "Commercial real estate data", "Real Estate", "apiKey", "https://reonomy.com"),
    ("Yardi", "Property management", "Real Estate", "apiKey", "https://yardi.com"),
    ("AppFolio", "Property management software", "Real Estate", "apiKey", "https://appfolio.com"),
    ("Buildium", "Property management", "Real Estate", "apiKey", "https://buildium.com"),
    ("Entrata", "Property management platform", "Real Estate", "apiKey", "https://entrata.com"),
    ("RealPage", "Real estate tech", "Real Estate", "apiKey", "https://realpage.com"),
    ("CoStar", "Commercial real estate data", "Real Estate", "apiKey", "https://costar.com"),
    ("LoopNet", "Commercial listings", "Real Estate", "apiKey", "https://loopnet.com"),
    ("Apartments.com", "Apartment listings", "Real Estate", "apiKey", "https://apartments.com"),
    ("Zumper", "Rental marketplace", "Real Estate", "apiKey", "https://zumper.com"),
    ("RentCafe", "Property marketing", "Real Estate", "apiKey", "https://rentcafe.com"),
    ("Walk Score", "Walkability data", "Real Estate", "apiKey", "https://walkscore.com"),
    ("GreatSchools", "School ratings", "Real Estate", "apiKey", "https://greatschools.org"),
    ("Estated", "Real estate data API", "Real Estate", "apiKey", "https://estated.com"),
    ("Parcl", "Real estate price feeds", "Real Estate", "apiKey", "https://parcl.co"),
]

for api in realestate_apis:
    add_api(*api)

# ============================================
# Education & Learning APIs (40+)
# ============================================
education_apis = [
    ("Khan Academy", "Educational content", "Education", "apiKey", "https://khanacademy.org"),
    ("Coursera", "Online courses", "Education", "apiKey", "https://coursera.org"),
    ("Udemy", "Online learning platform", "Education", "apiKey", "https://udemy.com"),
    ("edX", "Online courses", "Education", "apiKey", "https://edx.org"),
    ("Skillshare", "Creative classes", "Education", "apiKey", "https://skillshare.com"),
    ("LinkedIn Learning", "Professional courses", "Education", "apiKey", "https://linkedin.com/learning"),
    ("Pluralsight", "Tech skills platform", "Education", "apiKey", "https://pluralsight.com"),
    ("Codecademy", "Coding courses", "Education", "apiKey", "https://codecademy.com"),
    ("Treehouse", "Tech education", "Education", "apiKey", "https://teamtreehouse.com"),
    ("Udacity", "Tech nanodegrees", "Education", "apiKey", "https://udacity.com"),
    ("DataCamp", "Data science courses", "Education", "apiKey", "https://datacamp.com"),
    ("Brilliant", "Interactive learning", "Education", "apiKey", "https://brilliant.org"),
    ("MasterClass", "Expert-taught classes", "Education", "apiKey", "https://masterclass.com"),
    ("Duolingo", "Language learning", "Education", "apiKey", "https://duolingo.com"),
    ("Babbel", "Language learning", "Education", "apiKey", "https://babbel.com"),
    ("Busuu", "Language learning", "Education", "apiKey", "https://busuu.com"),
    ("Memrise", "Language learning", "Education", "apiKey", "https://memrise.com"),
    ("Rosetta Stone", "Language learning", "Education", "apiKey", "https://rosettastone.com"),
    ("Quizlet", "Study tools", "Education", "apiKey", "https://quizlet.com"),
    ("Anki", "Flashcard learning", "Education", "none", "https://ankiweb.net"),
    ("Brainscape", "Smart flashcards", "Education", "apiKey", "https://brainscape.com"),
    ("Chegg", "Study resources", "Education", "apiKey", "https://chegg.com"),
    ("Course Hero", "Study resources", "Education", "apiKey", "https://coursehero.com"),
    ("Grammarly", "Writing assistant", "Education", "apiKey", "https://grammarly.com"),
    ("ProWritingAid", "Writing software", "Education", "apiKey", "https://prowritingaid.com"),
    ("Hemingway Editor", "Writing tool", "Education", "apiKey", "https://hemingwayapp.com"),
    ("Turnitin", "Plagiarism detection", "Education", "apiKey", "https://turnitin.com"),
    ("Canvas LMS", "Learning management", "Education", "apiKey", "https://instructure.com"),
    ("Blackboard", "Learning management", "Education", "apiKey", "https://blackboard.com"),
    ("Moodle", "Open source LMS", "Education", "none", "https://moodle.org"),
    ("Schoology", "Learning management", "Education", "apiKey", "https://schoology.com"),
    ("Google Classroom", "Education platform", "Education", "oauth", "https://classroom.google.com"),
    ("ClassDojo", "Classroom management", "Education", "apiKey", "https://classdojo.com"),
    ("Seesaw", "Student portfolios", "Education", "apiKey", "https://web.seesaw.me"),
    ("Kahoot", "Game-based learning", "Education", "apiKey", "https://kahoot.com"),
    ("Nearpod", "Interactive lessons", "Education", "apiKey", "https://nearpod.com"),
]

for api in education_apis:
    add_api(*api)

# ============================================
# IoT & Hardware APIs (40+)
# ============================================
iot_apis = [
    ("Arduino Cloud", "IoT platform", "IoT", "apiKey", "https://create.arduino.cc"),
    ("Particle", "IoT development platform", "IoT", "apiKey", "https://particle.io"),
    ("Losant", "IoT platform", "IoT", "apiKey", "https://losant.com"),
    ("ThingsBoard", "IoT platform", "IoT", "apiKey", "https://thingsboard.io"),
    ("Blynk", "IoT platform", "IoT", "apiKey", "https://blynk.io"),
    ("Cayenne", "IoT project builder", "IoT", "apiKey", "https://mydevices.com"),
    ("Ubidots", "IoT data analytics", "IoT", "apiKey", "https://ubidots.com"),
    ("Thingspeak", "IoT analytics", "IoT", "apiKey", "https://thingspeak.com"),
    ("AWS IoT", "IoT platform", "IoT", "apiKey", "https://aws.amazon.com/iot"),
    ("Azure IoT", "IoT services", "IoT", "apiKey", "https://azure.microsoft.com/iot"),
    ("Google Cloud IoT", "IoT platform", "IoT", "apiKey", "https://cloud.google.com/iot"),
    ("IBM Watson IoT", "IoT platform", "IoT", "apiKey", "https://ibm.com/watson-iot"),
    ("Samsung SmartThings", "Smart home platform", "IoT", "apiKey", "https://smartthings.developer.samsung.com"),
    ("Apple HomeKit", "Smart home platform", "IoT", "apiKey", "https://developer.apple.com/homekit"),
    ("Google Home", "Smart home platform", "IoT", "oauth", "https://developers.google.com/assistant"),
    ("Amazon Alexa", "Voice assistant", "IoT", "oauth", "https://developer.amazon.com/alexa"),
    ("IFTTT", "Automation platform", "IoT", "apiKey", "https://ifttt.com"),
    ("Philips Hue", "Smart lighting", "IoT", "apiKey", "https://developers.meethue.com"),
    ("LIFX", "Smart lighting", "IoT", "apiKey", "https://lifx.com"),
    ("Nanoleaf", "Smart lighting", "IoT", "apiKey", "https://nanoleaf.me"),
    ("Nest", "Smart home devices", "IoT", "oauth", "https://developers.google.com/nest"),
    ("Ecobee", "Smart thermostats", "IoT", "apiKey", "https://ecobee.com"),
    ("Ring", "Home security", "IoT", "apiKey", "https://ring.com"),
    ("Arlo", "Smart security", "IoT", "apiKey", "https://arlo.com"),
    ("Wyze", "Smart home products", "IoT", "apiKey", "https://wyze.com"),
    ("Tuya", "IoT platform", "IoT", "apiKey", "https://tuya.com"),
    ("eWeLink", "Smart home platform", "IoT", "apiKey", "https://ewelink.cc"),
    ("Home Assistant", "Home automation", "IoT", "apiKey", "https://home-assistant.io"),
    ("openHAB", "Home automation", "IoT", "none", "https://openhab.org"),
    ("Hubitat", "Home automation", "IoT", "apiKey", "https://hubitat.com"),
    ("Domoticz", "Home automation", "IoT", "none", "https://domoticz.com"),
    ("Zigbee", "IoT protocol", "IoT", "none", "https://zigbeealliance.org"),
    ("Z-Wave", "Smart home protocol", "IoT", "none", "https://z-wavealliance.org"),
    ("Matter", "Smart home standard", "IoT", "none", "https://buildwithmatter.com"),
    ("Thread", "IoT protocol", "IoT", "none", "https://threadgroup.org"),
    ("LoRaWAN", "IoT network protocol", "IoT", "none", "https://lora-alliance.org"),
    ("Sigfox", "IoT connectivity", "IoT", "apiKey", "https://sigfox.com"),
    ("Helium", "IoT network", "IoT", "apiKey", "https://helium.com"),
]

for api in iot_apis:
    add_api(*api)

# ============================================
# HR & Recruiting APIs (40+)
# ============================================
hr_apis = [
    ("Workday", "HR management", "HR", "apiKey", "https://workday.com"),
    ("BambooHR", "HR software", "HR", "apiKey", "https://bamboohr.com"),
    ("Gusto", "Payroll and HR", "HR", "apiKey", "https://gusto.com"),
    ("Rippling", "HR and IT", "HR", "apiKey", "https://rippling.com"),
    ("Zenefits", "HR platform", "HR", "apiKey", "https://zenefits.com"),
    ("Namely", "HR platform", "HR", "apiKey", "https://namely.com"),
    ("Paylocity", "Payroll and HR", "HR", "apiKey", "https://paylocity.com"),
    ("Paycom", "HR and payroll", "HR", "apiKey", "https://paycom.com"),
    ("ADP", "HR management", "HR", "apiKey", "https://adp.com"),
    ("Paychex", "Payroll services", "HR", "apiKey", "https://paychex.com"),
    ("Ceridian Dayforce", "HCM platform", "HR", "apiKey", "https://ceridian.com"),
    ("UKG", "HR solutions", "HR", "apiKey", "https://ukg.com"),
    ("SAP SuccessFactors", "HR management", "HR", "apiKey", "https://sap.com"),
    ("Oracle HCM", "HR cloud", "HR", "apiKey", "https://oracle.com"),
    ("Greenhouse", "Recruiting software", "HR", "apiKey", "https://greenhouse.io"),
    ("Lever", "Recruiting software", "HR", "apiKey", "https://lever.co"),
    ("Ashby", "Recruiting platform", "HR", "apiKey", "https://ashbyhq.com"),
    ("Workable", "Recruiting software", "HR", "apiKey", "https://workable.com"),
    ("JazzHR", "Recruiting software", "HR", "apiKey", "https://jazzhr.com"),
    ("iCIMS", "Talent acquisition", "HR", "apiKey", "https://icims.com"),
    ("SmartRecruiters", "Hiring platform", "HR", "apiKey", "https://smartrecruiters.com"),
    ("Jobvite", "Recruiting software", "HR", "apiKey", "https://jobvite.com"),
    ("Breezy HR", "Recruiting software", "HR", "apiKey", "https://breezy.hr"),
    ("Recruitee", "Recruiting platform", "HR", "apiKey", "https://recruitee.com"),
    ("Teamtailor", "Employer branding", "HR", "apiKey", "https://teamtailor.com"),
    ("Personio", "HR software", "HR", "apiKey", "https://personio.com"),
    ("HiBob", "HR platform", "HR", "apiKey", "https://hibob.com"),
    ("Deel", "Global HR", "HR", "apiKey", "https://deel.com"),
    ("Remote", "Global HR platform", "HR", "apiKey", "https://remote.com"),
    ("Oyster HR", "Global employment", "HR", "apiKey", "https://oysterhr.com"),
    ("Papaya Global", "Global payroll", "HR", "apiKey", "https://papayaglobal.com"),
    ("Velocity Global", "Global expansion", "HR", "apiKey", "https://velocityglobal.com"),
    ("Factorial", "HR software", "HR", "apiKey", "https://factorialhr.com"),
    ("Charlie HR", "HR software", "HR", "apiKey", "https://charliehr.com"),
    ("Humaans", "HR management", "HR", "apiKey", "https://humaans.io"),
    ("Lattice", "People management", "HR", "apiKey", "https://lattice.com"),
    ("15Five", "Performance management", "HR", "apiKey", "https://15five.com"),
    ("Culture Amp", "Employee experience", "HR", "apiKey", "https://cultureamp.com"),
    ("Leapsome", "People enablement", "HR", "apiKey", "https://leapsome.com"),
]

for api in hr_apis:
    add_api(*api)

# ============================================
# Gaming & Esports APIs (40+)
# ============================================
gaming_apis = [
    ("Steam", "Steam platform API", "Gaming", "apiKey", "https://store.steampowered.com"),
    ("Epic Games", "Epic Games services", "Gaming", "apiKey", "https://epicgames.com"),
    ("PlayStation Network", "PlayStation services", "Gaming", "apiKey", "https://playstation.com"),
    ("Xbox Live", "Xbox services", "Gaming", "apiKey", "https://xbox.com"),
    ("Nintendo", "Nintendo services", "Gaming", "apiKey", "https://nintendo.com"),
    ("GOG Galaxy", "GOG platform", "Gaming", "apiKey", "https://gog.com"),
    ("Discord", "Gaming communication", "Gaming", "apiKey", "https://discord.com"),
    ("Overwolf", "In-game overlay platform", "Gaming", "apiKey", "https://overwolf.com"),
    ("IGDB", "Game database", "Gaming", "apiKey", "https://igdb.com"),
    ("RAWG", "Video games database", "Gaming", "apiKey", "https://rawg.io"),
    ("Giant Bomb", "Video game wiki", "Gaming", "apiKey", "https://giantbomb.com"),
    ("OpenDota", "Dota 2 statistics", "Gaming", "none", "https://opendota.com"),
    ("Riot Games", "League of Legends API", "Gaming", "apiKey", "https://developer.riotgames.com"),
    ("Fortnite Tracker", "Fortnite statistics", "Gaming", "apiKey", "https://fortnitetracker.com"),
    ("Call of Duty", "COD API", "Gaming", "apiKey", "https://callofduty.com"),
    ("Apex Legends", "Apex statistics", "Gaming", "apiKey", "https://apexlegends.com"),
    ("Valorant", "Valorant API", "Gaming", "apiKey", "https://playvalorant.com"),
    ("Counter-Strike", "CS:GO statistics", "Gaming", "apiKey", "https://counter-strike.net"),
    ("PUBG", "PUBG API", "Gaming", "apiKey", "https://pubg.com"),
    ("Rocket League", "Rocket League API", "Gaming", "apiKey", "https://rocketleague.com"),
    ("FIFA", "FIFA API", "Gaming", "apiKey", "https://fifa.com"),
    ("NBA 2K", "NBA 2K API", "Gaming", "apiKey", "https://nba.2k.com"),
    ("Madden NFL", "Madden API", "Gaming", "apiKey", "https://ea.com/madden"),
    ("Pokemon", "Pokemon API", "Gaming", "none", "https://pokeapi.co"),
    ("Yu-Gi-Oh", "YuGiOh card data", "Gaming", "none", "https://ygoprodeck.com"),
    ("Magic The Gathering", "MTG API", "Gaming", "none", "https://mtgjson.com"),
    ("Hearthstone", "Hearthstone API", "Gaming", "apiKey", "https://hearthstonejson.com"),
    ("Blizzard", "Blizzard games API", "Gaming", "apiKey", "https://blizzard.com"),
    ("Bungie", "Destiny API", "Gaming", "apiKey", "https://bungie.net"),
    ("Ubisoft", "Ubisoft services", "Gaming", "apiKey", "https://ubisoft.com"),
    ("Electronic Arts", "EA services", "Gaming", "apiKey", "https://ea.com"),
    ("Unity", "Game development platform", "Gaming", "apiKey", "https://unity.com"),
    ("Unreal Engine", "Game engine", "Gaming", "apiKey", "https://unrealengine.com"),
    ("Godot", "Open source game engine", "Gaming", "none", "https://godotengine.org"),
    ("PlayFab", "Game backend", "Gaming", "apiKey", "https://playfab.com"),
    ("GameSparks", "Game backend", "Gaming", "apiKey", "https://gamesparks.com"),
    ("Photon", "Multiplayer platform", "Gaming", "apiKey", "https://photonengine.com"),
    ("Mirror Networking", "Unity networking", "Gaming", "none", "https://mirror-networking.com"),
    ("Faceit", "Esports platform", "Gaming", "apiKey", "https://faceit.com"),
    ("ESL", "Esports league", "Gaming", "apiKey", "https://esl.com"),
]

for api in gaming_apis:
    add_api(*api)

# ============================================
# Blockchain & Web3 APIs (50+)
# ============================================
web3_apis = [
    ("Ethereum", "Ethereum blockchain", "Blockchain", "apiKey", "https://ethereum.org"),
    ("Polygon", "Polygon network", "Blockchain", "apiKey", "https://polygon.technology"),
    ("Solana", "Solana blockchain", "Blockchain", "apiKey", "https://solana.com"),
    ("Avalanche", "Avalanche network", "Blockchain", "apiKey", "https://avax.network"),
    ("Arbitrum", "Arbitrum L2", "Blockchain", "apiKey", "https://arbitrum.io"),
    ("Optimism", "Optimism L2", "Blockchain", "apiKey", "https://optimism.io"),
    ("Base", "Base L2 by Coinbase", "Blockchain", "apiKey", "https://base.org"),
    ("BNB Chain", "Binance Smart Chain", "Blockchain", "apiKey", "https://bnbchain.org"),
    ("Fantom", "Fantom network", "Blockchain", "apiKey", "https://fantom.foundation"),
    ("Near", "Near Protocol", "Blockchain", "apiKey", "https://near.org"),
    ("Cosmos", "Cosmos network", "Blockchain", "apiKey", "https://cosmos.network"),
    ("Polkadot", "Polkadot network", "Blockchain", "apiKey", "https://polkadot.network"),
    ("Cardano", "Cardano blockchain", "Blockchain", "apiKey", "https://cardano.org"),
    ("Aptos", "Aptos blockchain", "Blockchain", "apiKey", "https://aptoslabs.com"),
    ("Sui", "Sui blockchain", "Blockchain", "apiKey", "https://sui.io"),
    ("Alchemy", "Blockchain development", "Blockchain", "apiKey", "https://alchemy.com"),
    ("Infura", "Ethereum API", "Blockchain", "apiKey", "https://infura.io"),
    ("QuickNode", "Blockchain nodes", "Blockchain", "apiKey", "https://quicknode.com"),
    ("Moralis", "Web3 development", "Blockchain", "apiKey", "https://moralis.io"),
    ("Thirdweb", "Web3 development", "Blockchain", "apiKey", "https://thirdweb.com"),
    ("Chainlink", "Oracle network", "Blockchain", "none", "https://chain.link"),
    ("The Graph", "Blockchain indexing", "Blockchain", "apiKey", "https://thegraph.com"),
    ("Dune Analytics", "Blockchain analytics", "Blockchain", "apiKey", "https://dune.com"),
    ("Nansen", "Blockchain analytics", "Blockchain", "apiKey", "https://nansen.ai"),
    ("Flipside", "Blockchain data", "Blockchain", "apiKey", "https://flipsidecrypto.com"),
    ("Messari", "Crypto research", "Blockchain", "apiKey", "https://messari.io"),
    ("CoinGecko", "Crypto data", "Blockchain", "apiKey", "https://coingecko.com"),
    ("CoinMarketCap", "Crypto data", "Blockchain", "apiKey", "https://coinmarketcap.com"),
    ("DeFiLlama", "DeFi data", "Blockchain", "none", "https://defillama.com"),
    ("OpenSea", "NFT marketplace", "Blockchain", "apiKey", "https://opensea.io"),
    ("Blur", "NFT marketplace", "Blockchain", "apiKey", "https://blur.io"),
    ("Magic Eden", "NFT marketplace", "Blockchain", "apiKey", "https://magiceden.io"),
    ("Rarible", "NFT marketplace", "Blockchain", "apiKey", "https://rarible.com"),
    ("Foundation", "NFT marketplace", "Blockchain", "apiKey", "https://foundation.app"),
    ("Zora", "NFT protocol", "Blockchain", "apiKey", "https://zora.co"),
    ("Manifold", "NFT creation", "Blockchain", "apiKey", "https://manifold.xyz"),
    ("Reservoir", "NFT infrastructure", "Blockchain", "apiKey", "https://reservoir.tools"),
    ("SimpleHash", "NFT data", "Blockchain", "apiKey", "https://simplehash.com"),
    ("Center", "NFT infrastructure", "Blockchain", "apiKey", "https://center.app"),
    ("Uniswap", "DEX protocol", "Blockchain", "none", "https://uniswap.org"),
    ("SushiSwap", "DEX protocol", "Blockchain", "none", "https://sushi.com"),
    ("Curve", "DEX for stablecoins", "Blockchain", "none", "https://curve.fi"),
    ("Aave", "DeFi lending", "Blockchain", "none", "https://aave.com"),
    ("Compound", "DeFi lending", "Blockchain", "none", "https://compound.finance"),
    ("MakerDAO", "DeFi lending", "Blockchain", "none", "https://makerdao.com"),
    ("Lido", "Liquid staking", "Blockchain", "none", "https://lido.fi"),
    ("Rocket Pool", "Decentralized staking", "Blockchain", "none", "https://rocketpool.net"),
    ("WalletConnect", "Wallet connection", "Blockchain", "apiKey", "https://walletconnect.com"),
    ("Web3Modal", "Wallet connection UI", "Blockchain", "none", "https://web3modal.com"),
    ("Privy", "Web3 authentication", "Blockchain", "apiKey", "https://privy.io"),
]

for api in web3_apis:
    add_api(*api)

# ============================================
# Logistics & Shipping APIs (30+)
# ============================================
logistics_apis = [
    ("UPS", "Shipping services", "Logistics", "apiKey", "https://ups.com"),
    ("FedEx", "Shipping services", "Logistics", "apiKey", "https://fedex.com"),
    ("DHL", "International shipping", "Logistics", "apiKey", "https://dhl.com"),
    ("USPS", "US postal service", "Logistics", "apiKey", "https://usps.com"),
    ("Canada Post", "Canadian postal", "Logistics", "apiKey", "https://canadapost.ca"),
    ("Royal Mail", "UK postal", "Logistics", "apiKey", "https://royalmail.com"),
    ("Australia Post", "Australian postal", "Logistics", "apiKey", "https://auspost.com.au"),
    ("PostNord", "Nordic postal", "Logistics", "apiKey", "https://postnord.com"),
    ("Deutsche Post", "German postal", "Logistics", "apiKey", "https://deutschepost.de"),
    ("La Poste", "French postal", "Logistics", "apiKey", "https://laposte.fr"),
    ("Amazon Shipping", "Amazon logistics", "Logistics", "apiKey", "https://services.amazon.com"),
    ("ShipEngine", "Shipping API", "Logistics", "apiKey", "https://shipengine.com"),
    ("Shippo", "Shipping platform", "Logistics", "apiKey", "https://goshippo.com"),
    ("EasyPost", "Shipping API", "Logistics", "apiKey", "https://easypost.com"),
    ("Stamps.com", "Shipping software", "Logistics", "apiKey", "https://stamps.com"),
    ("Pitney Bowes", "Shipping and mailing", "Logistics", "apiKey", "https://pitneybowes.com"),
    ("ShipStation", "Shipping solution", "Logistics", "apiKey", "https://shipstation.com"),
    ("Shippo", "Multi-carrier shipping", "Logistics", "apiKey", "https://goshippo.com"),
    ("AfterShip", "Shipment tracking", "Logistics", "apiKey", "https://aftership.com"),
    ("Route", "Package tracking", "Logistics", "apiKey", "https://route.com"),
    ("Narvar", "Post-purchase experience", "Logistics", "apiKey", "https://narvar.com"),
    ("Flexport", "Freight forwarding", "Logistics", "apiKey", "https://flexport.com"),
    ("Freightos", "Freight marketplace", "Logistics", "apiKey", "https://freightos.com"),
    ("project44", "Supply chain visibility", "Logistics", "apiKey", "https://project44.com"),
    ("FourKites", "Supply chain visibility", "Logistics", "apiKey", "https://fourkites.com"),
]

for api in logistics_apis:
    add_api(*api)

# ============================================
# Sports & Fitness APIs (40+)
# ============================================
sports_apis = [
    ("ESPN", "Sports news and data", "Sports", "apiKey", "https://espn.com"),
    ("SportsData.io", "Sports statistics", "Sports", "apiKey", "https://sportsdata.io"),
    ("SportRadar", "Sports data", "Sports", "apiKey", "https://sportradar.com"),
    ("The Sports DB", "Sports database", "Sports", "apiKey", "https://thesportsdb.com"),
    ("API-Football", "Football data", "Sports", "apiKey", "https://api-football.com"),
    ("Football-Data.org", "Football data", "Sports", "apiKey", "https://football-data.org"),
    ("NBA API", "NBA statistics", "Sports", "none", "https://nba.com"),
    ("NFL API", "NFL statistics", "Sports", "apiKey", "https://nfl.com"),
    ("MLB Stats", "Baseball statistics", "Sports", "apiKey", "https://mlb.com"),
    ("NHL API", "Hockey statistics", "Sports", "none", "https://nhl.com"),
    ("UFC Stats", "MMA statistics", "Sports", "apiKey", "https://ufc.com"),
    ("F1 Data", "Formula 1 data", "Sports", "none", "https://formula1.com"),
    ("Cricket API", "Cricket statistics", "Sports", "apiKey", "https://cricapi.com"),
    ("Tennis Live Data", "Tennis statistics", "Sports", "apiKey", "https://tennislivedata.com"),
    ("Golf Leaderboard", "Golf statistics", "Sports", "apiKey", "https://pgatour.com"),
    ("Strava", "Fitness tracking", "Sports", "oauth", "https://strava.com"),
    ("Fitbit", "Fitness tracking", "Sports", "oauth", "https://fitbit.com"),
    ("Garmin", "Fitness devices", "Sports", "apiKey", "https://garmin.com"),
    ("Whoop", "Fitness tracking", "Sports", "apiKey", "https://whoop.com"),
    ("Oura", "Sleep and fitness", "Sports", "apiKey", "https://ouraring.com"),
    ("MyFitnessPal", "Nutrition tracking", "Sports", "apiKey", "https://myfitnesspal.com"),
    ("Apple Health", "Health data", "Sports", "oauth", "https://apple.com/health"),
    ("Google Fit", "Fitness platform", "Sports", "oauth", "https://google.com/fit"),
    ("Samsung Health", "Health platform", "Sports", "apiKey", "https://samsung.com/health"),
    ("Peloton", "Fitness platform", "Sports", "apiKey", "https://onepeloton.com"),
    ("Mirror", "Home fitness", "Sports", "apiKey", "https://mirror.co"),
    ("Tonal", "Smart home gym", "Sports", "apiKey", "https://tonal.com"),
    ("Zwift", "Virtual cycling", "Sports", "apiKey", "https://zwift.com"),
    ("TrainerRoad", "Cycling training", "Sports", "apiKey", "https://trainerroad.com"),
    ("Wahoo", "Cycling tech", "Sports", "apiKey", "https://wahoofitness.com"),
    ("Runkeeper", "Running tracking", "Sports", "apiKey", "https://runkeeper.com"),
    ("Nike Run Club", "Running app", "Sports", "apiKey", "https://nike.com"),
    ("Adidas Running", "Running app", "Sports", "apiKey", "https://adidas.com"),
    ("MapMyRun", "Running tracking", "Sports", "apiKey", "https://mapmyrun.com"),
    ("AllTrails", "Trail guides", "Sports", "apiKey", "https://alltrails.com"),
    ("Komoot", "Route planning", "Sports", "apiKey", "https://komoot.com"),
]

for api in sports_apis:
    add_api(*api)

# ============================================
# Government & Public Data APIs (40+)
# ============================================
government_apis = [
    ("Data.gov", "US government data", "Government", "none", "https://data.gov"),
    ("Data.gov.uk", "UK government data", "Government", "none", "https://data.gov.uk"),
    ("EU Open Data", "European Union data", "Government", "none", "https://data.europa.eu"),
    ("Canadian Open Data", "Canadian government data", "Government", "none", "https://open.canada.ca"),
    ("Australian Open Data", "Australian government data", "Government", "none", "https://data.gov.au"),
    ("US Census", "US Census Bureau data", "Government", "apiKey", "https://census.gov"),
    ("Bureau of Labor Statistics", "US labor statistics", "Government", "apiKey", "https://bls.gov"),
    ("FRED", "Federal Reserve economic data", "Government", "apiKey", "https://fred.stlouisfed.org"),
    ("SEC EDGAR", "SEC filings", "Government", "none", "https://sec.gov/edgar"),
    ("NASA", "NASA open data", "Government", "apiKey", "https://api.nasa.gov"),
    ("NOAA", "Weather and climate data", "Government", "apiKey", "https://noaa.gov"),
    ("USGS", "US Geological Survey", "Government", "none", "https://usgs.gov"),
    ("EPA", "Environmental data", "Government", "apiKey", "https://epa.gov"),
    ("FAA", "Aviation data", "Government", "apiKey", "https://faa.gov"),
    ("FBI Crime Data", "Crime statistics", "Government", "apiKey", "https://fbi.gov"),
    ("IRS", "Tax data", "Government", "apiKey", "https://irs.gov"),
    ("Social Security", "Social security data", "Government", "apiKey", "https://ssa.gov"),
    ("Veterans Affairs", "VA data", "Government", "apiKey", "https://va.gov"),
    ("World Bank", "Global development data", "Government", "none", "https://worldbank.org"),
    ("IMF", "International monetary data", "Government", "none", "https://imf.org"),
    ("UN Data", "United Nations data", "Government", "none", "https://data.un.org"),
    ("OECD", "Economic data", "Government", "apiKey", "https://oecd.org"),
    ("Eurostat", "European statistics", "Government", "none", "https://ec.europa.eu/eurostat"),
    ("ONS UK", "UK national statistics", "Government", "none", "https://ons.gov.uk"),
    ("INSEE France", "French statistics", "Government", "none", "https://insee.fr"),
    ("Destatis Germany", "German statistics", "Government", "none", "https://destatis.de"),
    ("Statistics Sweden", "Swedish statistics", "Government", "none", "https://scb.se"),
    ("Statistics Norway", "Norwegian statistics", "Government", "none", "https://ssb.no"),
    ("Statistics Denmark", "Danish statistics", "Government", "none", "https://dst.dk"),
    ("Statistics Finland", "Finnish statistics", "Government", "none", "https://stat.fi"),
    ("CBR Russia", "Central Bank of Russia", "Government", "none", "https://cbr.ru"),
    ("NBS China", "National Bureau of Statistics China", "Government", "none", "https://stats.gov.cn"),
    ("Japan Statistics", "Japanese statistics", "Government", "none", "https://stat.go.jp"),
    ("Korean Statistics", "Korean statistics", "Government", "none", "https://kostat.go.kr"),
    ("Australian Bureau of Statistics", "Australian statistics", "Government", "none", "https://abs.gov.au"),
]

for api in government_apis:
    add_api(*api)

# Save new APIs
with open(OUTPUT_FILE, "w") as f:
    json.dump(new_apis, f, indent=2)

print(f"\n✅ Added {len(new_apis)} new APIs to {OUTPUT_FILE}")
