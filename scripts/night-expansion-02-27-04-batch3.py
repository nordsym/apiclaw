#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-27 04:00 - Batch 3
Even more APIs from various niches
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "night-expansion-02-27-04-batch3.json"

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
# Travel & Transportation APIs (50+)
# ============================================
travel_apis = [
    ("Amadeus", "Travel booking APIs", "Travel", "apiKey", "https://amadeus.com"),
    ("Skyscanner", "Flight search", "Travel", "apiKey", "https://skyscanner.com"),
    ("Kayak", "Travel search", "Travel", "apiKey", "https://kayak.com"),
    ("Expedia", "Travel booking", "Travel", "apiKey", "https://expedia.com"),
    ("Booking.com", "Hotel booking", "Travel", "apiKey", "https://booking.com"),
    ("Hotels.com", "Hotel booking", "Travel", "apiKey", "https://hotels.com"),
    ("Airbnb", "Vacation rentals", "Travel", "apiKey", "https://airbnb.com"),
    ("VRBO", "Vacation rentals", "Travel", "apiKey", "https://vrbo.com"),
    ("TripAdvisor", "Travel reviews", "Travel", "apiKey", "https://tripadvisor.com"),
    ("Yelp Fusion", "Local business reviews", "Travel", "apiKey", "https://yelp.com"),
    ("Google Flights", "Flight search", "Travel", "oauth", "https://google.com/flights"),
    ("Kiwi.com", "Flight booking", "Travel", "apiKey", "https://kiwi.com"),
    ("Rome2Rio", "Travel routing", "Travel", "apiKey", "https://rome2rio.com"),
    ("Sabre", "Travel distribution", "Travel", "apiKey", "https://sabre.com"),
    ("Travelport", "Travel commerce", "Travel", "apiKey", "https://travelport.com"),
    ("Uber", "Ride-hailing", "Travel", "oauth", "https://uber.com"),
    ("Lyft", "Ride-hailing", "Travel", "oauth", "https://lyft.com"),
    ("Grab", "Ride-hailing Asia", "Travel", "apiKey", "https://grab.com"),
    ("Bolt", "Ride-hailing Europe", "Travel", "apiKey", "https://bolt.eu"),
    ("Ola", "Ride-hailing India", "Travel", "apiKey", "https://olacabs.com"),
    ("DiDi", "Ride-hailing China", "Travel", "apiKey", "https://didiglobal.com"),
    ("Lime", "Electric scooters", "Travel", "apiKey", "https://lime.com"),
    ("Bird", "Electric scooters", "Travel", "apiKey", "https://bird.co"),
    ("Spin", "Micromobility", "Travel", "apiKey", "https://spin.app"),
    ("Voi", "Electric scooters", "Travel", "apiKey", "https://voiscooters.com"),
    ("Tier", "Micromobility", "Travel", "apiKey", "https://tier.app"),
    ("Nextbike", "Bike sharing", "Travel", "apiKey", "https://nextbike.de"),
    ("Citybikes", "Bike sharing API", "Travel", "none", "https://citybik.es"),
    ("FlightAware", "Flight tracking", "Travel", "apiKey", "https://flightaware.com"),
    ("FlightRadar24", "Flight tracking", "Travel", "apiKey", "https://flightradar24.com"),
    ("ADS-B Exchange", "Flight tracking", "Travel", "apiKey", "https://adsbexchange.com"),
    ("OpenSky", "Flight tracking", "Travel", "none", "https://opensky-network.org"),
    ("Aviation Edge", "Aviation data", "Travel", "apiKey", "https://aviationedge.com"),
    ("AeroDataBox", "Aviation data", "Travel", "apiKey", "https://aerodatabox.com"),
    ("Transitland", "Transit data", "Travel", "none", "https://transit.land"),
    ("OpenTripPlanner", "Trip planning", "Travel", "none", "https://opentripplanner.org"),
    ("Google Directions", "Route planning", "Travel", "apiKey", "https://maps.google.com"),
    ("OSRM", "Routing engine", "Travel", "none", "https://osrm.org"),
    ("Graphhopper", "Route optimization", "Travel", "apiKey", "https://graphhopper.com"),
    ("Mapbox Directions", "Navigation", "Travel", "apiKey", "https://mapbox.com"),
    ("Here Routing", "Navigation", "Travel", "apiKey", "https://here.com"),
    ("TomTom Routing", "Navigation", "Travel", "apiKey", "https://tomtom.com"),
    ("Waze", "Traffic data", "Travel", "apiKey", "https://waze.com"),
    ("Inrix", "Traffic data", "Travel", "apiKey", "https://inrix.com"),
    ("National Rail UK", "UK train data", "Travel", "apiKey", "https://nationalrail.co.uk"),
    ("Deutsche Bahn", "German trains", "Travel", "apiKey", "https://bahn.de"),
    ("SNCF", "French trains", "Travel", "apiKey", "https://sncf.com"),
    ("Amtrak", "US trains", "Travel", "apiKey", "https://amtrak.com"),
    ("Trainline", "Train booking", "Travel", "apiKey", "https://trainline.com"),
]

for api in travel_apis:
    add_api(*api)

# ============================================
# Food & Restaurant APIs (40+)
# ============================================
food_apis = [
    ("Yelp", "Restaurant reviews", "Food", "apiKey", "https://yelp.com"),
    ("Google Places", "Restaurant data", "Food", "apiKey", "https://maps.google.com"),
    ("Zomato", "Restaurant data", "Food", "apiKey", "https://zomato.com"),
    ("OpenTable", "Restaurant reservations", "Food", "apiKey", "https://opentable.com"),
    ("Resy", "Restaurant reservations", "Food", "apiKey", "https://resy.com"),
    ("Tock", "Restaurant reservations", "Food", "apiKey", "https://exploretock.com"),
    ("SevenRooms", "Restaurant management", "Food", "apiKey", "https://sevenrooms.com"),
    ("Toast", "Restaurant POS", "Food", "apiKey", "https://toasttab.com"),
    ("Square for Restaurants", "Restaurant POS", "Food", "apiKey", "https://squareup.com"),
    ("Lightspeed Restaurant", "Restaurant POS", "Food", "apiKey", "https://lightspeedhq.com"),
    ("Clover", "Restaurant POS", "Food", "apiKey", "https://clover.com"),
    ("DoorDash", "Food delivery", "Food", "apiKey", "https://doordash.com"),
    ("Uber Eats", "Food delivery", "Food", "oauth", "https://ubereats.com"),
    ("Grubhub", "Food delivery", "Food", "apiKey", "https://grubhub.com"),
    ("Postmates", "Delivery", "Food", "apiKey", "https://postmates.com"),
    ("Deliveroo", "Food delivery", "Food", "apiKey", "https://deliveroo.com"),
    ("Just Eat", "Food delivery", "Food", "apiKey", "https://justeat.com"),
    ("Glovo", "Delivery", "Food", "apiKey", "https://glovoapp.com"),
    ("Rappi", "Delivery Latin America", "Food", "apiKey", "https://rappi.com"),
    ("iFood", "Food delivery Brazil", "Food", "apiKey", "https://ifood.com.br"),
    ("Menulog", "Food delivery Australia", "Food", "apiKey", "https://menulog.com.au"),
    ("Swiggy", "Food delivery India", "Food", "apiKey", "https://swiggy.com"),
    ("Zomato Delivery", "Food delivery India", "Food", "apiKey", "https://zomato.com"),
    ("Meituan", "Food delivery China", "Food", "apiKey", "https://meituan.com"),
    ("Ele.me", "Food delivery China", "Food", "apiKey", "https://ele.me"),
    ("Instacart", "Grocery delivery", "Food", "apiKey", "https://instacart.com"),
    ("Shipt", "Grocery delivery", "Food", "apiKey", "https://shipt.com"),
    ("Gopuff", "Instant delivery", "Food", "apiKey", "https://gopuff.com"),
    ("Gorillas", "Grocery delivery", "Food", "apiKey", "https://gorillas.io"),
    ("Getir", "Quick delivery", "Food", "apiKey", "https://getir.com"),
    ("Flink", "Grocery delivery", "Food", "apiKey", "https://goflink.com"),
    ("Spoonacular", "Recipe and food API", "Food", "apiKey", "https://spoonacular.com"),
    ("Edamam", "Nutrition data", "Food", "apiKey", "https://edamam.com"),
    ("Nutritionix", "Nutrition database", "Food", "apiKey", "https://nutritionix.com"),
    ("FatSecret", "Nutrition data", "Food", "apiKey", "https://fatsecret.com"),
    ("USDA FoodData", "Food composition", "Food", "apiKey", "https://fdc.nal.usda.gov"),
    ("Open Food Facts", "Food products", "Food", "none", "https://openfoodfacts.org"),
    ("TheMealDB", "Meal recipes", "Food", "apiKey", "https://themealdb.com"),
    ("TheCocktailDB", "Cocktail recipes", "Food", "apiKey", "https://thecocktaildb.com"),
    ("PunkAPI", "Beer recipes", "Food", "none", "https://punkapi.com"),
]

for api in food_apis:
    add_api(*api)

# ============================================
# Automotive APIs (35+)
# ============================================
automotive_apis = [
    ("Tesla", "Tesla vehicle API", "Automotive", "oauth", "https://tesla.com"),
    ("Ford", "Ford vehicle services", "Automotive", "apiKey", "https://ford.com"),
    ("GM", "General Motors API", "Automotive", "apiKey", "https://gm.com"),
    ("BMW", "BMW Connected Drive", "Automotive", "apiKey", "https://bmw.com"),
    ("Mercedes-Benz", "Mercedes API", "Automotive", "apiKey", "https://mercedes-benz.com"),
    ("Audi", "Audi Connect", "Automotive", "apiKey", "https://audi.com"),
    ("Volkswagen", "VW API", "Automotive", "apiKey", "https://volkswagen.com"),
    ("Porsche", "Porsche Connect", "Automotive", "apiKey", "https://porsche.com"),
    ("Volvo", "Volvo On Call", "Automotive", "apiKey", "https://volvo.com"),
    ("Toyota", "Toyota Connected", "Automotive", "apiKey", "https://toyota.com"),
    ("Honda", "HondaLink", "Automotive", "apiKey", "https://honda.com"),
    ("Nissan", "NissanConnect", "Automotive", "apiKey", "https://nissan.com"),
    ("Hyundai", "Hyundai BlueLink", "Automotive", "apiKey", "https://hyundai.com"),
    ("Kia", "Kia Connect", "Automotive", "apiKey", "https://kia.com"),
    ("Rivian", "Rivian API", "Automotive", "apiKey", "https://rivian.com"),
    ("Lucid", "Lucid Motors API", "Automotive", "apiKey", "https://lucidmotors.com"),
    ("Polestar", "Polestar API", "Automotive", "apiKey", "https://polestar.com"),
    ("Smartcar", "Connected car API", "Automotive", "apiKey", "https://smartcar.com"),
    ("Otonomo", "Car data platform", "Automotive", "apiKey", "https://otonomo.io"),
    ("High Mobility", "Car data API", "Automotive", "apiKey", "https://high-mobility.com"),
    ("CARFAX", "Vehicle history", "Automotive", "apiKey", "https://carfax.com"),
    ("AutoCheck", "Vehicle history", "Automotive", "apiKey", "https://autocheck.com"),
    ("Edmunds", "Car data", "Automotive", "apiKey", "https://edmunds.com"),
    ("KBB", "Kelley Blue Book", "Automotive", "apiKey", "https://kbb.com"),
    ("NHTSA", "Vehicle safety", "Automotive", "none", "https://nhtsa.gov"),
    ("VinAudit", "VIN lookup", "Automotive", "apiKey", "https://vinaudit.com"),
    ("CarMD", "Vehicle diagnostics", "Automotive", "apiKey", "https://carmd.com"),
    ("Geotab", "Fleet telematics", "Automotive", "apiKey", "https://geotab.com"),
    ("Samsara", "Fleet management", "Automotive", "apiKey", "https://samsara.com"),
    ("Verizon Connect", "Fleet management", "Automotive", "apiKey", "https://verizonconnect.com"),
    ("KeepTruckin", "Fleet management", "Automotive", "apiKey", "https://keeptruckin.com"),
    ("ChargePoint", "EV charging", "Automotive", "apiKey", "https://chargepoint.com"),
    ("EVgo", "EV charging", "Automotive", "apiKey", "https://evgo.com"),
    ("Electrify America", "EV charging", "Automotive", "apiKey", "https://electrifyamerica.com"),
    ("IONITY", "EV charging Europe", "Automotive", "apiKey", "https://ionity.eu"),
]

for api in automotive_apis:
    add_api(*api)

# ============================================
# Insurance APIs (25+)
# ============================================
insurance_apis = [
    ("Lemonade", "Insurance platform", "Insurance", "apiKey", "https://lemonade.com"),
    ("Root", "Auto insurance", "Insurance", "apiKey", "https://root.com"),
    ("Hippo", "Home insurance", "Insurance", "apiKey", "https://hippo.com"),
    ("Metromile", "Pay-per-mile insurance", "Insurance", "apiKey", "https://metromile.com"),
    ("Next Insurance", "Small business insurance", "Insurance", "apiKey", "https://nextinsurance.com"),
    ("Bold Penguin", "Commercial insurance", "Insurance", "apiKey", "https://boldpenguin.com"),
    ("Newfront", "Insurance broker", "Insurance", "apiKey", "https://newfront.com"),
    ("Vouch", "Startup insurance", "Insurance", "apiKey", "https://vouch.us"),
    ("Embroker", "Business insurance", "Insurance", "apiKey", "https://embroker.com"),
    ("Pie Insurance", "Workers comp", "Insurance", "apiKey", "https://pieinsurance.com"),
    ("Coalition", "Cyber insurance", "Insurance", "apiKey", "https://coalitioninc.com"),
    ("At-Bay", "Cyber insurance", "Insurance", "apiKey", "https://at-bay.com"),
    ("Corvus", "Commercial insurance", "Insurance", "apiKey", "https://corvusinsurance.com"),
    ("Clearcover", "Car insurance", "Insurance", "apiKey", "https://clearcover.com"),
    ("Jerry", "Insurance comparison", "Insurance", "apiKey", "https://getjerry.com"),
    ("Policygenius", "Insurance marketplace", "Insurance", "apiKey", "https://policygenius.com"),
    ("Insurify", "Insurance comparison", "Insurance", "apiKey", "https://insurify.com"),
    ("Gabi", "Insurance comparison", "Insurance", "apiKey", "https://gabi.com"),
    ("Cover Genius", "Insurance infrastructure", "Insurance", "apiKey", "https://covergenius.com"),
    ("Sure", "Embedded insurance", "Insurance", "apiKey", "https://sureapp.com"),
    ("Boost", "Insurance infrastructure", "Insurance", "apiKey", "https://boostinsurance.com"),
    ("Socotra", "Insurance platform", "Insurance", "apiKey", "https://socotra.com"),
    ("Majesco", "Insurance software", "Insurance", "apiKey", "https://majesco.com"),
    ("Guidewire", "Insurance platform", "Insurance", "apiKey", "https://guidewire.com"),
    ("Duck Creek", "Insurance solutions", "Insurance", "apiKey", "https://duckcreek.com"),
]

for api in insurance_apis:
    add_api(*api)

# ============================================
# Construction & Property APIs (25+)
# ============================================
construction_apis = [
    ("Procore", "Construction management", "Construction", "apiKey", "https://procore.com"),
    ("PlanGrid", "Construction drawings", "Construction", "apiKey", "https://plangrid.com"),
    ("Buildertrend", "Construction software", "Construction", "apiKey", "https://buildertrend.com"),
    ("CoConstruct", "Construction management", "Construction", "apiKey", "https://coconstruct.com"),
    ("Houzz", "Home design", "Construction", "apiKey", "https://houzz.com"),
    ("BuildZoom", "Contractor data", "Construction", "apiKey", "https://buildzoom.com"),
    ("Autodesk BIM 360", "BIM platform", "Construction", "apiKey", "https://autodesk.com"),
    ("Trimble Connect", "Construction collaboration", "Construction", "apiKey", "https://trimble.com"),
    ("Bluebeam", "PDF markup", "Construction", "apiKey", "https://bluebeam.com"),
    ("eSUB", "Subcontractor management", "Construction", "apiKey", "https://esub.com"),
    ("Sage 300", "Construction accounting", "Construction", "apiKey", "https://sage.com"),
    ("Viewpoint", "Construction software", "Construction", "apiKey", "https://viewpoint.com"),
    ("Jonas Construction", "ERP for construction", "Construction", "apiKey", "https://jonas-construction.com"),
    ("Foundation Software", "Construction accounting", "Construction", "apiKey", "https://foundationsoft.com"),
    ("CMiC", "Construction ERP", "Construction", "apiKey", "https://cmic.ca"),
    ("Fieldwire", "Field management", "Construction", "apiKey", "https://fieldwire.com"),
    ("Raken", "Daily reporting", "Construction", "apiKey", "https://rakenapp.com"),
    ("busybusy", "Time tracking", "Construction", "apiKey", "https://busybusy.com"),
    ("Bridgit", "Workforce planning", "Construction", "apiKey", "https://gobridgit.com"),
    ("OpenSpace", "360 photo documentation", "Construction", "apiKey", "https://openspace.ai"),
    ("Matterport", "3D capture", "Construction", "apiKey", "https://matterport.com"),
    ("DroneDeploy", "Drone mapping", "Construction", "apiKey", "https://dronedeploy.com"),
    ("Skydio", "Autonomous drones", "Construction", "apiKey", "https://skydio.com"),
    ("StructionSite", "Construction documentation", "Construction", "apiKey", "https://structionsite.com"),
    ("Join.Build", "Construction coordination", "Construction", "apiKey", "https://join.build"),
]

for api in construction_apis:
    add_api(*api)

# ============================================
# Agriculture APIs (25+)
# ============================================
agriculture_apis = [
    ("Climate FieldView", "Digital farming", "Agriculture", "apiKey", "https://climate.com"),
    ("John Deere", "Agricultural equipment", "Agriculture", "apiKey", "https://deere.com"),
    ("Trimble Agriculture", "Precision ag", "Agriculture", "apiKey", "https://agriculture.trimble.com"),
    ("AGCO", "Farm equipment", "Agriculture", "apiKey", "https://agcocorp.com"),
    ("CNH Industrial", "Agricultural machinery", "Agriculture", "apiKey", "https://cnhindustrial.com"),
    ("Farmers Edge", "Digital farming", "Agriculture", "apiKey", "https://farmersedge.ca"),
    ("Granular", "Farm management", "Agriculture", "apiKey", "https://granular.ag"),
    ("FarmLogs", "Farm management", "Agriculture", "apiKey", "https://farmlogs.com"),
    ("Conservis", "Farm management", "Agriculture", "apiKey", "https://conservis.ag"),
    ("Agrivi", "Farm management", "Agriculture", "apiKey", "https://agrivi.com"),
    ("Cropio", "Satellite monitoring", "Agriculture", "apiKey", "https://cropio.com"),
    ("OneSoil", "Precision farming", "Agriculture", "apiKey", "https://onesoil.ai"),
    ("Arable", "Agricultural IoT", "Agriculture", "apiKey", "https://arable.com"),
    ("Davis Instruments", "Weather stations", "Agriculture", "apiKey", "https://davisinstruments.com"),
    ("Semios", "Pest management", "Agriculture", "apiKey", "https://semios.com"),
    ("Agworld", "Farm management", "Agriculture", "apiKey", "https://agworld.com"),
    ("AgriWebb", "Livestock management", "Agriculture", "apiKey", "https://agriwebb.com"),
    ("CattleMax", "Cattle management", "Agriculture", "apiKey", "https://cattlemax.com"),
    ("Feedlot Manager", "Feedlot management", "Agriculture", "apiKey", "https://feedlotmanager.com"),
    ("USDA NASS", "Agricultural statistics", "Agriculture", "apiKey", "https://nass.usda.gov"),
    ("FAO", "Food and agriculture data", "Agriculture", "none", "https://fao.org"),
    ("Open Ag Data", "Agricultural open data", "Agriculture", "none", "https://openag.io"),
    ("Gro Intelligence", "Agricultural data", "Agriculture", "apiKey", "https://gro-intelligence.com"),
    ("Agronod", "Agricultural API", "Agriculture", "apiKey", "https://agronod.com"),
    ("Sentera", "Drone analytics", "Agriculture", "apiKey", "https://sentera.com"),
]

for api in agriculture_apis:
    add_api(*api)

# ============================================
# Energy & Utilities APIs (30+)
# ============================================
energy_apis = [
    ("Utility API", "Utility data access", "Energy", "apiKey", "https://utilityapi.com"),
    ("Arcadia", "Utility data platform", "Energy", "apiKey", "https://arcadia.com"),
    ("Pelm", "Utility data access", "Energy", "apiKey", "https://pelm.com"),
    ("Urjanet", "Utility bill data", "Energy", "apiKey", "https://urjanet.com"),
    ("WattTime", "Electricity emissions", "Energy", "apiKey", "https://watttime.org"),
    ("Electricity Maps", "Carbon intensity", "Energy", "apiKey", "https://electricitymaps.com"),
    ("Open Power System Data", "Power system data", "Energy", "none", "https://open-power-system-data.org"),
    ("ENTSO-E", "European power data", "Energy", "apiKey", "https://entsoe.eu"),
    ("EIA", "US Energy Information", "Energy", "apiKey", "https://eia.gov"),
    ("IEA", "International Energy Agency", "Energy", "none", "https://iea.org"),
    ("IRENA", "Renewable energy", "Energy", "none", "https://irena.org"),
    ("NREL", "Renewable energy data", "Energy", "apiKey", "https://nrel.gov"),
    ("PVWatts", "Solar calculator", "Energy", "apiKey", "https://pvwatts.nrel.gov"),
    ("SolarEdge", "Solar monitoring", "Energy", "apiKey", "https://solaredge.com"),
    ("Enphase", "Solar systems", "Energy", "apiKey", "https://enphase.com"),
    ("SunPower", "Solar energy", "Energy", "apiKey", "https://sunpower.com"),
    ("Tesla Energy", "Energy products", "Energy", "oauth", "https://tesla.com"),
    ("Sense", "Home energy monitor", "Energy", "apiKey", "https://sense.com"),
    ("Emporia", "Energy monitoring", "Energy", "apiKey", "https://emporiaenergy.com"),
    ("Ecobee", "Smart thermostats", "Energy", "apiKey", "https://ecobee.com"),
    ("Nest", "Smart home", "Energy", "oauth", "https://nest.com"),
    ("Honeywell Home", "Smart thermostats", "Energy", "apiKey", "https://honeywellhome.com"),
    ("tado", "Smart climate", "Energy", "apiKey", "https://tado.com"),
    ("Netatmo", "Smart home devices", "Energy", "apiKey", "https://netatmo.com"),
    ("EnergyStar", "Energy efficiency", "Energy", "none", "https://energystar.gov"),
    ("GridX", "Smart grid platform", "Energy", "apiKey", "https://gridx.de"),
    ("AutoGrid", "Energy platform", "Energy", "apiKey", "https://auto-grid.com"),
    ("Stem", "Energy storage", "Energy", "apiKey", "https://stem.com"),
    ("Fluence", "Energy storage", "Energy", "apiKey", "https://fluenceenergy.com"),
    ("Form Energy", "Iron-air batteries", "Energy", "apiKey", "https://formenergy.com"),
]

for api in energy_apis:
    add_api(*api)

# ============================================
# Event & Venue APIs (25+)
# ============================================
event_apis = [
    ("Eventbrite", "Event management", "Events", "apiKey", "https://eventbrite.com"),
    ("Ticketmaster", "Ticketing", "Events", "apiKey", "https://ticketmaster.com"),
    ("StubHub", "Ticket resale", "Events", "apiKey", "https://stubhub.com"),
    ("SeatGeek", "Ticket marketplace", "Events", "apiKey", "https://seatgeek.com"),
    ("Vivid Seats", "Ticket marketplace", "Events", "apiKey", "https://vividseats.com"),
    ("AXS", "Event tickets", "Events", "apiKey", "https://axs.com"),
    ("Dice", "Event discovery", "Events", "apiKey", "https://dice.fm"),
    ("Resident Advisor", "Electronic music events", "Events", "apiKey", "https://ra.co"),
    ("Bandsintown", "Concert tracking", "Events", "apiKey", "https://bandsintown.com"),
    ("Songkick", "Concert discovery", "Events", "apiKey", "https://songkick.com"),
    ("Meetup", "Event platform", "Events", "apiKey", "https://meetup.com"),
    ("Luma", "Event platform", "Events", "apiKey", "https://lu.ma"),
    ("Splash", "Event marketing", "Events", "apiKey", "https://splashthat.com"),
    ("Bizzabo", "Event software", "Events", "apiKey", "https://bizzabo.com"),
    ("Cvent", "Event management", "Events", "apiKey", "https://cvent.com"),
    ("Hopin", "Virtual events", "Events", "apiKey", "https://hopin.com"),
    ("Airmeet", "Virtual events", "Events", "apiKey", "https://airmeet.com"),
    ("Run The World", "Virtual events", "Events", "apiKey", "https://runtheworld.today"),
    ("Whova", "Event app", "Events", "apiKey", "https://whova.com"),
    ("Swapcard", "Event app", "Events", "apiKey", "https://swapcard.com"),
    ("Grip", "Event networking", "Events", "apiKey", "https://grip.events"),
    ("Brella", "Event networking", "Events", "apiKey", "https://brella.io"),
    ("Sched", "Event scheduling", "Events", "apiKey", "https://sched.com"),
    ("Accelevents", "Event platform", "Events", "apiKey", "https://accelevents.com"),
    ("vFairs", "Virtual events", "Events", "apiKey", "https://vfairs.com"),
]

for api in event_apis:
    add_api(*api)

# ============================================
# Non-Profit & Charity APIs (20+)
# ============================================
nonprofit_apis = [
    ("Charity Navigator", "Charity ratings", "Non-Profit", "apiKey", "https://charitynavigator.org"),
    ("GuideStar", "Nonprofit data", "Non-Profit", "apiKey", "https://guidestar.org"),
    ("GlobalGiving", "Crowdfunding for nonprofits", "Non-Profit", "apiKey", "https://globalgiving.org"),
    ("GoFundMe Charity", "Charity fundraising", "Non-Profit", "apiKey", "https://gofundme.com"),
    ("Network for Good", "Donation processing", "Non-Profit", "apiKey", "https://networkforgood.com"),
    ("Bloomerang", "Donor management", "Non-Profit", "apiKey", "https://bloomerang.co"),
    ("Blackbaud", "Nonprofit software", "Non-Profit", "apiKey", "https://blackbaud.com"),
    ("Little Green Light", "Donor management", "Non-Profit", "apiKey", "https://littlegreenlight.com"),
    ("Salesforce Nonprofit", "Nonprofit CRM", "Non-Profit", "apiKey", "https://salesforce.org"),
    ("Kindful", "Donor management", "Non-Profit", "apiKey", "https://kindful.com"),
    ("NeonCRM", "Nonprofit CRM", "Non-Profit", "apiKey", "https://neonone.com"),
    ("Virtuous", "Nonprofit CRM", "Non-Profit", "apiKey", "https://virtuous.org"),
    ("Classy", "Fundraising platform", "Non-Profit", "apiKey", "https://classy.org"),
    ("OneCause", "Fundraising events", "Non-Profit", "apiKey", "https://onecause.com"),
    ("GiveWP", "WordPress donations", "Non-Profit", "apiKey", "https://givewp.com"),
    ("Donorbox", "Online donations", "Non-Profit", "apiKey", "https://donorbox.org"),
    ("Stripe for Nonprofits", "Payment processing", "Non-Profit", "apiKey", "https://stripe.com"),
    ("PayPal Giving Fund", "Donation processing", "Non-Profit", "apiKey", "https://paypal.com"),
    ("Benevity", "Corporate giving", "Non-Profit", "apiKey", "https://benevity.com"),
    ("YourCause", "Employee giving", "Non-Profit", "apiKey", "https://yourcause.com"),
]

for api in nonprofit_apis:
    add_api(*api)

# ============================================
# Science & Research APIs (30+)
# ============================================
science_apis = [
    ("NASA", "NASA open data", "Science", "apiKey", "https://api.nasa.gov"),
    ("SpaceX", "SpaceX data", "Science", "none", "https://spacexdata.com"),
    ("ESA", "European Space Agency", "Science", "none", "https://esa.int"),
    ("Astronomy API", "Astronomical data", "Science", "apiKey", "https://astronomyapi.com"),
    ("Sunrise Sunset", "Sun times", "Science", "none", "https://sunrise-sunset.org"),
    ("Open Notify", "ISS location", "Science", "none", "https://open-notify.org"),
    ("N2YO", "Satellite tracking", "Science", "apiKey", "https://n2yo.com"),
    ("Launch Library", "Space launches", "Science", "none", "https://thespacedevs.com"),
    ("GBIF", "Biodiversity data", "Science", "none", "https://gbif.org"),
    ("iNaturalist", "Biodiversity observations", "Science", "apiKey", "https://inaturalist.org"),
    ("eBird", "Bird observations", "Science", "apiKey", "https://ebird.org"),
    ("Ocean Biogeographic", "Marine biodiversity", "Science", "none", "https://obis.org"),
    ("World Flora Online", "Plant data", "Science", "none", "https://worldfloraonline.org"),
    ("NCBI", "Genomic data", "Science", "none", "https://ncbi.nlm.nih.gov"),
    ("Ensembl", "Genome browser", "Science", "none", "https://ensembl.org"),
    ("PDB", "Protein structures", "Science", "none", "https://rcsb.org"),
    ("ChEBI", "Chemical entities", "Science", "none", "https://ebi.ac.uk/chebi"),
    ("PubChem", "Chemical data", "Science", "none", "https://pubchem.ncbi.nlm.nih.gov"),
    ("arXiv", "Research preprints", "Science", "none", "https://arxiv.org"),
    ("Semantic Scholar", "Research papers", "Science", "apiKey", "https://semanticscholar.org"),
    ("CrossRef", "Research metadata", "Science", "none", "https://crossref.org"),
    ("OpenCitations", "Citation data", "Science", "none", "https://opencitations.net"),
    ("ORCID", "Researcher identifiers", "Science", "apiKey", "https://orcid.org"),
    ("Dimensions", "Research data", "Science", "apiKey", "https://dimensions.ai"),
    ("Altmetric", "Research impact", "Science", "apiKey", "https://altmetric.com"),
    ("USGS", "Geological data", "Science", "none", "https://usgs.gov"),
    ("NOAA Climate", "Climate data", "Science", "apiKey", "https://ncdc.noaa.gov"),
    ("Copernicus", "Earth observation", "Science", "apiKey", "https://copernicus.eu"),
    ("Sentinel Hub", "Satellite imagery", "Science", "apiKey", "https://sentinel-hub.com"),
    ("Planet Labs", "Earth imaging", "Science", "apiKey", "https://planet.com"),
]

for api in science_apis:
    add_api(*api)

# Save new APIs
with open(OUTPUT_FILE, "w") as f:
    json.dump(new_apis, f, indent=2)

print(f"\n✅ Added {len(new_apis)} new APIs to {OUTPUT_FILE}")
