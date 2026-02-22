#!/usr/bin/env python3
"""
APIClaw Niche APIs Batch - Industry-specific and specialized APIs
"""

import json
import re
from pathlib import Path

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

NICHE_APIS = [
    # === Healthcare & Medical ===
    {"name": "FHIR API", "description": "Healthcare interoperability standard", "category": "Health", "link": "https://www.hl7.org/fhir/", "auth": "OAuth"},
    {"name": "OpenMRS", "description": "Open source medical records", "category": "Health", "link": "https://wiki.openmrs.org/display/docs/REST+Web+Services+API", "auth": "apiKey"},
    {"name": "DrChrono", "description": "EHR platform API", "category": "Health", "link": "https://www.drchrono.com/api/", "auth": "OAuth"},
    {"name": "Redox", "description": "Healthcare integration API", "category": "Health", "link": "https://developer.redoxengine.com/", "auth": "apiKey"},
    {"name": "Epic FHIR", "description": "Epic EHR API", "category": "Health", "link": "https://fhir.epic.com/", "auth": "OAuth"},
    {"name": "Cerner FHIR", "description": "Cerner EHR API", "category": "Health", "link": "https://fhir.cerner.com/", "auth": "OAuth"},
    {"name": "Allscripts", "description": "EHR integration API", "category": "Health", "link": "https://developer.allscripts.com/", "auth": "OAuth"},
    {"name": "Change Healthcare", "description": "Healthcare claims API", "category": "Health", "link": "https://developers.changehealthcare.com/", "auth": "apiKey"},
    {"name": "Eligible", "description": "Healthcare eligibility API", "category": "Health", "link": "https://eligible.com/rest/v1.1/", "auth": "apiKey"},
    {"name": "PokitDok", "description": "Healthcare claims and eligibility", "category": "Health", "link": "https://platform.pokitdok.com/", "auth": "OAuth"},
    {"name": "Validic", "description": "Health data integration", "category": "Health", "link": "https://docs.validic.com/", "auth": "apiKey"},
    {"name": "Human API", "description": "Health data platform", "category": "Health", "link": "https://docs.humanapi.co/", "auth": "OAuth"},
    {"name": "1upHealth", "description": "FHIR data platform", "category": "Health", "link": "https://1up.health/docs/", "auth": "OAuth"},
    {"name": "Flexpa", "description": "Health plan data API", "category": "Health", "link": "https://www.flexpa.com/docs/", "auth": "apiKey"},
    {"name": "Particle Health", "description": "Healthcare data network", "category": "Health", "link": "https://docs.particlehealth.com/", "auth": "apiKey"},
    
    # === Legal & Compliance ===
    {"name": "Clio", "description": "Legal practice management API", "category": "Legal", "link": "https://app.clio.com/api/v4/documentation", "auth": "OAuth"},
    {"name": "PracticePanther", "description": "Legal software API", "category": "Legal", "link": "https://www.practicepanther.com/api/", "auth": "apiKey"},
    {"name": "MyCase", "description": "Legal case management API", "category": "Legal", "link": "https://www.mycase.com/api-documentation/", "auth": "apiKey"},
    {"name": "LegalZoom", "description": "Legal services API", "category": "Legal", "link": "https://www.legalzoom.com/partner/api", "auth": "apiKey"},
    {"name": "Docusign", "description": "Electronic signature API", "category": "Legal", "link": "https://developers.docusign.com/", "auth": "OAuth"},
    {"name": "HelloSign", "description": "E-signature API", "category": "Legal", "link": "https://developers.hellosign.com/", "auth": "apiKey"},
    {"name": "PandaDoc", "description": "Document automation API", "category": "Legal", "link": "https://developers.pandadoc.com/", "auth": "apiKey"},
    {"name": "Ironclad", "description": "Contract lifecycle API", "category": "Legal", "link": "https://developer.ironcladapp.com/", "auth": "apiKey"},
    {"name": "Juro", "description": "Contract automation API", "category": "Legal", "link": "https://juro.com/api", "auth": "apiKey"},
    {"name": "OneTrust", "description": "Privacy compliance API", "category": "Legal", "link": "https://developer.onetrust.com/", "auth": "apiKey"},
    {"name": "TrustArc", "description": "Privacy management API", "category": "Legal", "link": "https://www.trustarc.com/products/platform/api/", "auth": "apiKey"},
    {"name": "ComplyAdvantage", "description": "AML and compliance API", "category": "Legal", "link": "https://docs.complyadvantage.com/", "auth": "apiKey"},
    {"name": "Persona", "description": "Identity verification API", "category": "Security", "link": "https://docs.withpersona.com/", "auth": "apiKey"},
    {"name": "Jumio", "description": "Identity verification API", "category": "Security", "link": "https://developer.jumio.com/", "auth": "apiKey"},
    {"name": "Onfido", "description": "Identity verification API", "category": "Security", "link": "https://documentation.onfido.com/", "auth": "apiKey"},
    
    # === Real Estate & Property ===
    {"name": "Zillow API", "description": "Real estate data API", "category": "Real Estate", "link": "https://www.zillow.com/howto/api/APIOverview.htm", "auth": "apiKey"},
    {"name": "Redfin", "description": "Real estate market data", "category": "Real Estate", "link": "https://www.redfin.com/stingray/api/", "auth": "apiKey"},
    {"name": "Realtor.com", "description": "Property listings API", "category": "Real Estate", "link": "https://www.realtor.com/api", "auth": "apiKey"},
    {"name": "ATTOM Data", "description": "Property and neighborhood data", "category": "Real Estate", "link": "https://api.developer.attomdata.com/", "auth": "apiKey"},
    {"name": "CoreLogic", "description": "Property data and analytics", "category": "Real Estate", "link": "https://www.corelogic.com/apis/", "auth": "apiKey"},
    {"name": "Estated", "description": "Property data API", "category": "Real Estate", "link": "https://estated.com/developers", "auth": "apiKey"},
    {"name": "Regrid", "description": "Parcel data API", "category": "Real Estate", "link": "https://regrid.com/api", "auth": "apiKey"},
    {"name": "Walk Score", "description": "Walkability scores API", "category": "Real Estate", "link": "https://www.walkscore.com/professional/api.php", "auth": "apiKey"},
    {"name": "GreatSchools", "description": "School ratings API", "category": "Education", "link": "https://www.greatschools.org/api/", "auth": "apiKey"},
    {"name": "Plaid Assets", "description": "Income and asset verification", "category": "Finance", "link": "https://plaid.com/docs/assets/", "auth": "apiKey"},
    {"name": "Yardi", "description": "Property management API", "category": "Real Estate", "link": "https://www.yardi.com/products/api/", "auth": "apiKey"},
    {"name": "AppFolio", "description": "Property management API", "category": "Real Estate", "link": "https://www.appfolio.com/partner-api", "auth": "apiKey"},
    {"name": "Buildium", "description": "Property management API", "category": "Real Estate", "link": "https://developer.buildium.com/", "auth": "apiKey"},
    {"name": "Propertybase", "description": "Real estate CRM API", "category": "Real Estate", "link": "https://developer.propertybase.com/", "auth": "apiKey"},
    
    # === Automotive ===
    {"name": "CARFAX", "description": "Vehicle history reports", "category": "Transportation", "link": "https://www.carfax.com/api", "auth": "apiKey"},
    {"name": "AutoCheck", "description": "Vehicle history data", "category": "Transportation", "link": "https://www.autocheck.com/api", "auth": "apiKey"},
    {"name": "KBB", "description": "Kelley Blue Book values", "category": "Transportation", "link": "https://www.kbb.com/api/", "auth": "apiKey"},
    {"name": "NHTSA", "description": "Vehicle safety data", "category": "Government", "link": "https://vpic.nhtsa.dot.gov/api/", "auth": "none"},
    {"name": "VIN Decoder API", "description": "Decode vehicle VINs", "category": "Transportation", "link": "https://vindecoder.eu/api", "auth": "apiKey"},
    {"name": "Auto.dev", "description": "Automotive data API", "category": "Transportation", "link": "https://auto.dev/", "auth": "apiKey"},
    {"name": "Smartcar", "description": "Connected car API", "category": "Transportation", "link": "https://smartcar.com/docs/", "auth": "OAuth"},
    {"name": "Otonomo", "description": "Vehicle data platform", "category": "Transportation", "link": "https://otonomo.io/docs/", "auth": "apiKey"},
    {"name": "TomTom", "description": "Maps and traffic API", "category": "Geocoding", "link": "https://developer.tomtom.com/", "auth": "apiKey"},
    {"name": "HERE Automotive", "description": "Automotive location services", "category": "Transportation", "link": "https://developer.here.com/automotive", "auth": "apiKey"},
    {"name": "Turo", "description": "Car sharing platform API", "category": "Transportation", "link": "https://turo.com/us/en/partner", "auth": "apiKey"},
    {"name": "Getaround", "description": "Car sharing API", "category": "Transportation", "link": "https://www.getaround.com/enterprise", "auth": "apiKey"},
    {"name": "Bouncie", "description": "Vehicle tracking API", "category": "Transportation", "link": "https://www.bouncie.com/api/", "auth": "apiKey"},
    
    # === Agriculture ===
    {"name": "USDA FoodData Central", "description": "Food and nutrient database", "category": "Food", "link": "https://fdc.nal.usda.gov/api-guide.html", "auth": "apiKey"},
    {"name": "Agworld", "description": "Farm management API", "category": "Agriculture", "link": "https://www.agworld.com/api/", "auth": "apiKey"},
    {"name": "Granular", "description": "Farm management software API", "category": "Agriculture", "link": "https://granular.ag/", "auth": "apiKey"},
    {"name": "Climate FieldView", "description": "Agricultural data platform", "category": "Agriculture", "link": "https://climate.com/partners", "auth": "apiKey"},
    {"name": "Agrian", "description": "Crop planning API", "category": "Agriculture", "link": "https://www.agrian.com/api/", "auth": "apiKey"},
    {"name": "AgriWebb", "description": "Livestock management API", "category": "Agriculture", "link": "https://www.agriwebb.com/api/", "auth": "apiKey"},
    {"name": "Spaceknow", "description": "Satellite imagery analytics", "category": "Agriculture", "link": "https://spaceknow.com/api/", "auth": "apiKey"},
    {"name": "OneSoil", "description": "Agricultural analytics API", "category": "Agriculture", "link": "https://onesoil.ai/api/", "auth": "apiKey"},
    
    # === Construction ===
    {"name": "Procore", "description": "Construction management API", "category": "Construction", "link": "https://developers.procore.com/", "auth": "OAuth"},
    {"name": "PlanGrid", "description": "Construction productivity API", "category": "Construction", "link": "https://developer.plangrid.com/", "auth": "OAuth"},
    {"name": "Autodesk BIM 360", "description": "Building information modeling", "category": "Construction", "link": "https://forge.autodesk.com/en/docs/bim360/", "auth": "OAuth"},
    {"name": "Bluebeam", "description": "PDF markup for construction", "category": "Construction", "link": "https://www.bluebeam.com/solutions/api/", "auth": "apiKey"},
    {"name": "ConstructConnect", "description": "Construction data API", "category": "Construction", "link": "https://www.constructconnect.com/api/", "auth": "apiKey"},
    {"name": "CoConstruct", "description": "Home builder software API", "category": "Construction", "link": "https://www.coconstruct.com/api/", "auth": "apiKey"},
    {"name": "Buildertrend", "description": "Construction management API", "category": "Construction", "link": "https://buildertrend.com/api/", "auth": "apiKey"},
    {"name": "Fieldwire", "description": "Field management API", "category": "Construction", "link": "https://developers.fieldwire.com/", "auth": "apiKey"},
    
    # === Logistics & Shipping ===
    {"name": "Shippo", "description": "Multi-carrier shipping API", "category": "Logistics", "link": "https://goshippo.com/docs/", "auth": "apiKey"},
    {"name": "EasyPost", "description": "Shipping API", "category": "Logistics", "link": "https://www.easypost.com/docs/api", "auth": "apiKey"},
    {"name": "ShipEngine", "description": "Multi-carrier shipping", "category": "Logistics", "link": "https://www.shipengine.com/docs/", "auth": "apiKey"},
    {"name": "ShipStation", "description": "Order fulfillment API", "category": "Logistics", "link": "https://www.shipstation.com/docs/api/", "auth": "apiKey"},
    {"name": "Flexport", "description": "Freight forwarding API", "category": "Logistics", "link": "https://developers.flexport.com/", "auth": "apiKey"},
    {"name": "Freightos", "description": "Freight rates API", "category": "Logistics", "link": "https://www.freightos.com/api/", "auth": "apiKey"},
    {"name": "project44", "description": "Supply chain visibility", "category": "Logistics", "link": "https://docs.project44.com/", "auth": "apiKey"},
    {"name": "FourKites", "description": "Real-time visibility", "category": "Logistics", "link": "https://www.fourkites.com/api/", "auth": "apiKey"},
    {"name": "Transporeon", "description": "Transport logistics API", "category": "Logistics", "link": "https://www.transporeon.com/api/", "auth": "apiKey"},
    {"name": "Samsara", "description": "Fleet management API", "category": "Logistics", "link": "https://developers.samsara.com/", "auth": "apiKey"},
    {"name": "KeepTruckin", "description": "Fleet management API", "category": "Logistics", "link": "https://developers.keeptruckin.com/", "auth": "apiKey"},
    {"name": "Onfleet", "description": "Last mile delivery API", "category": "Logistics", "link": "https://docs.onfleet.com/reference", "auth": "apiKey"},
    {"name": "Route4Me", "description": "Route optimization API", "category": "Logistics", "link": "https://route4me.io/docs/", "auth": "apiKey"},
    {"name": "Routific", "description": "Route optimization", "category": "Logistics", "link": "https://docs.routific.com/", "auth": "apiKey"},
    {"name": "OptimoRoute", "description": "Route planning API", "category": "Logistics", "link": "https://optimoroute.com/api/", "auth": "apiKey"},
    
    # === Insurance ===
    {"name": "Root Insurance", "description": "Insurance telematics API", "category": "Insurance", "link": "https://root.engineering/", "auth": "apiKey"},
    {"name": "Lemonade", "description": "Insurance API", "category": "Insurance", "link": "https://www.lemonade.com/api/", "auth": "apiKey"},
    {"name": "Metromile", "description": "Pay-per-mile insurance API", "category": "Insurance", "link": "https://www.metromile.com/api/", "auth": "apiKey"},
    {"name": "Hippo", "description": "Home insurance API", "category": "Insurance", "link": "https://www.hippo.com/api/", "auth": "apiKey"},
    {"name": "Clearcover", "description": "Auto insurance API", "category": "Insurance", "link": "https://www.clearcover.com/api/", "auth": "apiKey"},
    {"name": "Bold Penguin", "description": "Commercial insurance API", "category": "Insurance", "link": "https://www.boldpenguin.com/developers/", "auth": "apiKey"},
    {"name": "Snapsheet", "description": "Claims management API", "category": "Insurance", "link": "https://www.snapsheetclaims.com/api/", "auth": "apiKey"},
    {"name": "Tractable", "description": "AI for insurance claims", "category": "Insurance", "link": "https://tractable.ai/api/", "auth": "apiKey"},
    
    # === Education ===
    {"name": "Canvas LMS", "description": "Learning management system API", "category": "Education", "link": "https://canvas.instructure.com/doc/api/", "auth": "OAuth"},
    {"name": "Blackboard", "description": "LMS API", "category": "Education", "link": "https://developer.blackboard.com/", "auth": "OAuth"},
    {"name": "Moodle", "description": "Open source LMS API", "category": "Education", "link": "https://docs.moodle.org/dev/Web_service_API", "auth": "apiKey"},
    {"name": "Schoology", "description": "LMS API", "category": "Education", "link": "https://developers.schoology.com/", "auth": "OAuth"},
    {"name": "Clever", "description": "Education data API", "category": "Education", "link": "https://dev.clever.com/docs/", "auth": "OAuth"},
    {"name": "ClassLink", "description": "Education identity API", "category": "Education", "link": "https://developer.classlink.com/", "auth": "OAuth"},
    {"name": "Khan Academy", "description": "Educational content API", "category": "Education", "link": "https://github.com/Khan/khan-api", "auth": "OAuth"},
    {"name": "Coursera", "description": "Online courses API", "category": "Education", "link": "https://build.coursera.org/", "auth": "OAuth"},
    {"name": "Udemy", "description": "Online courses API", "category": "Education", "link": "https://www.udemy.com/developers/", "auth": "apiKey"},
    {"name": "edX", "description": "Online courses API", "category": "Education", "link": "https://github.com/edx/edx-platform/wiki/API", "auth": "OAuth"},
    {"name": "Duolingo", "description": "Language learning API", "category": "Education", "link": "https://www.duolingo.com/", "auth": "apiKey"},
    {"name": "Quizlet", "description": "Flashcard platform API", "category": "Education", "link": "https://quizlet.com/api/2.0/docs/", "auth": "OAuth"},
    {"name": "Photomath", "description": "Math problem solver API", "category": "Education", "link": "https://photomath.net/", "auth": "apiKey"},
    
    # === HR & Recruiting ===
    {"name": "Greenhouse", "description": "Recruiting software API", "category": "HR", "link": "https://developers.greenhouse.io/", "auth": "apiKey"},
    {"name": "Lever", "description": "Recruiting platform API", "category": "HR", "link": "https://hire.lever.co/developer/documentation", "auth": "apiKey"},
    {"name": "Workable", "description": "Recruiting software API", "category": "HR", "link": "https://workable.readme.io/", "auth": "apiKey"},
    {"name": "BambooHR", "description": "HR software API", "category": "HR", "link": "https://documentation.bamboohr.com/docs/getting-started", "auth": "apiKey"},
    {"name": "Gusto", "description": "Payroll and HR API", "category": "HR", "link": "https://docs.gusto.com/", "auth": "OAuth"},
    {"name": "Rippling", "description": "HR platform API", "category": "HR", "link": "https://developer.rippling.com/", "auth": "OAuth"},
    {"name": "Workday", "description": "Enterprise HR API", "category": "HR", "link": "https://developer.workday.com/", "auth": "OAuth"},
    {"name": "ADP", "description": "Payroll and HR API", "category": "HR", "link": "https://developers.adp.com/", "auth": "OAuth"},
    {"name": "Paychex", "description": "Payroll API", "category": "HR", "link": "https://developer.paychex.com/", "auth": "OAuth"},
    {"name": "Paylocity", "description": "HR and payroll API", "category": "HR", "link": "https://developer.paylocity.com/", "auth": "OAuth"},
    {"name": "JazzHR", "description": "Recruiting software API", "category": "HR", "link": "https://www.jazzhr.com/api/", "auth": "apiKey"},
    {"name": "Breezy HR", "description": "Recruiting software API", "category": "HR", "link": "https://developer.breezy.hr/", "auth": "apiKey"},
    {"name": "Pinpoint", "description": "Recruiting platform API", "category": "HR", "link": "https://www.pinpointhq.com/api/", "auth": "apiKey"},
    {"name": "HiBob", "description": "HR platform API", "category": "HR", "link": "https://apidocs.hibob.com/", "auth": "apiKey"},
    {"name": "Personio", "description": "HR software API", "category": "HR", "link": "https://developer.personio.de/", "auth": "apiKey"},
    {"name": "Namely", "description": "HR platform API", "category": "HR", "link": "https://developers.namely.com/", "auth": "OAuth"},
    
    # === Accounting & Finance ===
    {"name": "QuickBooks", "description": "Accounting software API", "category": "Finance", "link": "https://developer.intuit.com/", "auth": "OAuth"},
    {"name": "Xero", "description": "Accounting API", "category": "Finance", "link": "https://developer.xero.com/", "auth": "OAuth"},
    {"name": "FreshBooks", "description": "Accounting API", "category": "Finance", "link": "https://www.freshbooks.com/api/", "auth": "OAuth"},
    {"name": "Wave", "description": "Free accounting API", "category": "Finance", "link": "https://developer.waveapps.com/", "auth": "OAuth"},
    {"name": "Sage", "description": "Accounting software API", "category": "Finance", "link": "https://developer.sage.com/", "auth": "OAuth"},
    {"name": "Bench", "description": "Bookkeeping API", "category": "Finance", "link": "https://bench.co/", "auth": "apiKey"},
    {"name": "Pilot", "description": "Bookkeeping for startups API", "category": "Finance", "link": "https://pilot.com/", "auth": "apiKey"},
    {"name": "Ramp", "description": "Corporate card API", "category": "Finance", "link": "https://docs.ramp.com/", "auth": "apiKey"},
    {"name": "Brex", "description": "Corporate card API", "category": "Finance", "link": "https://developer.brex.com/", "auth": "apiKey"},
    {"name": "Mercury", "description": "Banking for startups API", "category": "Finance", "link": "https://mercury.com/api/", "auth": "apiKey"},
    {"name": "Novo", "description": "Business banking API", "category": "Finance", "link": "https://www.novo.co/api/", "auth": "apiKey"},
    {"name": "Bill.com", "description": "AP/AR automation API", "category": "Finance", "link": "https://developer.bill.com/", "auth": "OAuth"},
    {"name": "Tipalti", "description": "Payables automation API", "category": "Finance", "link": "https://support.tipalti.com/docs/", "auth": "apiKey"},
    {"name": "Coupa", "description": "Spend management API", "category": "Finance", "link": "https://developer.coupa.com/", "auth": "OAuth"},
    {"name": "SAP Ariba", "description": "Procurement API", "category": "Finance", "link": "https://developer.ariba.com/", "auth": "OAuth"},
    
    # === Government & Public Data ===
    {"name": "Data.gov", "description": "US government open data", "category": "Government", "link": "https://api.data.gov/docs/", "auth": "apiKey"},
    {"name": "Census Bureau", "description": "US census data API", "category": "Government", "link": "https://www.census.gov/data/developers/data-sets.html", "auth": "apiKey"},
    {"name": "USAspending", "description": "Federal spending data", "category": "Government", "link": "https://api.usaspending.gov/", "auth": "none"},
    {"name": "OpenFEC", "description": "Campaign finance data", "category": "Government", "link": "https://api.open.fec.gov/", "auth": "apiKey"},
    {"name": "ProPublica Congress", "description": "Congressional data API", "category": "Government", "link": "https://projects.propublica.org/api-docs/congress-api/", "auth": "apiKey"},
    {"name": "GovTrack", "description": "Congressional data", "category": "Government", "link": "https://www.govtrack.us/developers/api", "auth": "none"},
    {"name": "Open States", "description": "State legislature data", "category": "Government", "link": "https://docs.openstates.org/api-v3/", "auth": "apiKey"},
    {"name": "FDA", "description": "FDA data API", "category": "Government", "link": "https://open.fda.gov/apis/", "auth": "apiKey"},
    {"name": "EPA", "description": "Environmental data API", "category": "Government", "link": "https://www.epa.gov/developers", "auth": "apiKey"},
    {"name": "NOAA", "description": "Weather and climate data", "category": "Weather", "link": "https://www.ncdc.noaa.gov/cdo-web/webservices/v2", "auth": "apiKey"},
    {"name": "NASA EONET", "description": "Earth observatory events", "category": "Science", "link": "https://eonet.gsfc.nasa.gov/docs/v3", "auth": "none"},
    {"name": "USGS", "description": "Geological survey data", "category": "Science", "link": "https://earthquake.usgs.gov/fdsnws/event/1/", "auth": "none"},
    {"name": "World Bank", "description": "Global development data", "category": "Government", "link": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589", "auth": "none"},
    {"name": "UN Data", "description": "United Nations data", "category": "Government", "link": "https://data.un.org/Host.aspx?Content=API", "auth": "none"},
    {"name": "OECD", "description": "Economic data", "category": "Government", "link": "https://data.oecd.org/api/", "auth": "none"},
    {"name": "IMF", "description": "International monetary data", "category": "Government", "link": "https://datahelp.imf.org/knowledgebase/topics/125587", "auth": "none"},
    {"name": "European Union", "description": "EU open data", "category": "Government", "link": "https://data.europa.eu/api/", "auth": "none"},
    
    # === Hospitality & Travel ===
    {"name": "Amadeus", "description": "Travel and aviation API", "category": "Travel", "link": "https://developers.amadeus.com/", "auth": "apiKey"},
    {"name": "Sabre", "description": "Travel technology API", "category": "Travel", "link": "https://developer.sabre.com/", "auth": "apiKey"},
    {"name": "Travelport", "description": "Travel commerce API", "category": "Travel", "link": "https://developer.travelport.com/", "auth": "apiKey"},
    {"name": "Skyscanner", "description": "Flight search API", "category": "Travel", "link": "https://developers.skyscanner.net/", "auth": "apiKey"},
    {"name": "Kiwi.com", "description": "Flight search API", "category": "Travel", "link": "https://docs.kiwi.com/", "auth": "apiKey"},
    {"name": "Booking.com", "description": "Accommodation API", "category": "Travel", "link": "https://developers.booking.com/", "auth": "apiKey"},
    {"name": "Expedia", "description": "Travel booking API", "category": "Travel", "link": "https://developers.expediagroup.com/", "auth": "apiKey"},
    {"name": "TripAdvisor", "description": "Travel reviews API", "category": "Travel", "link": "https://developer-tripadvisor.com/", "auth": "apiKey"},
    {"name": "Airbnb", "description": "Accommodation API", "category": "Travel", "link": "https://www.airbnb.com/partner", "auth": "OAuth"},
    {"name": "Vrbo", "description": "Vacation rental API", "category": "Travel", "link": "https://www.vrbo.com/partner", "auth": "apiKey"},
    {"name": "Sonder", "description": "Hospitality API", "category": "Travel", "link": "https://www.sonder.com/api/", "auth": "apiKey"},
    {"name": "OpenTable", "description": "Restaurant reservations", "category": "Food", "link": "https://platform.opentable.com/", "auth": "apiKey"},
    {"name": "Resy", "description": "Restaurant reservations", "category": "Food", "link": "https://resy.com/", "auth": "apiKey"},
    {"name": "Toast", "description": "Restaurant POS API", "category": "Food", "link": "https://pos.toasttab.com/developers/", "auth": "OAuth"},
    {"name": "Square for Restaurants", "description": "Restaurant POS API", "category": "Food", "link": "https://developer.squareup.com/", "auth": "OAuth"},
    {"name": "Clover", "description": "POS system API", "category": "Business", "link": "https://docs.clover.com/", "auth": "OAuth"},
    {"name": "Lightspeed", "description": "POS and commerce API", "category": "Business", "link": "https://developers.lightspeedhq.com/", "auth": "OAuth"},
]

def main():
    print("🦞 APIClaw Niche Industry APIs Batch")
    print("=" * 50)
    
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    
    added = 0
    skipped = 0
    
    for api in NICHE_APIS:
        api_id = generate_id(api['name'])
        
        if api_id in existing_ids:
            skipped += 1
            continue
        
        registry['apis'].append({
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api['category'],
            "auth": api.get('auth', 'apiKey'),
            "https": True,
            "cors": "unknown",
            "link": api['link'],
            "pricing": "unknown",
            "keywords": [],
            "source": "niche-industries"
        })
        existing_ids.add(api_id)
        added += 1
    
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️  Skipped (duplicates): {skipped}")
    print(f"📊 Total APIs in registry: {len(registry['apis'])}")

if __name__ == "__main__":
    main()
