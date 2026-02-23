#!/usr/bin/env python3
"""
APIClaw Night Expansion - Batch 4 - Industry-Specific APIs
February 23, 2026 06:00
"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(data):
    data['lastUpdated'] = datetime.utcnow().isoformat()
    data['count'] = len(data['apis'])
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(data, f, indent=2)

def generate_id(name):
    return name.lower().replace(' ', '-').replace('.', '-').replace('/', '-').replace('(', '').replace(')', '').replace("'", '')[:50]

def add_apis(registry, new_apis):
    existing_ids = {api['id'] for api in registry['apis']}
    added = 0
    for api in new_apis:
        api_id = generate_id(api['name'])
        if api_id not in existing_ids:
            api['id'] = api_id
            registry['apis'].append(api)
            existing_ids.add(api_id)
            added += 1
    return added

# =========================================
# INDUSTRY-SPECIFIC APIs
# =========================================

REAL_ESTATE = [
    {"name": "Zillow API", "description": "Real estate and home data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.zillow.com/howto/api/APIOverview.htm", "pricing": "free"},
    {"name": "Redfin API", "description": "Real estate market data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.redfin.com/about/developers", "pricing": "paid"},
    {"name": "Realtor.com API", "description": "Real estate listings data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.realtor.com/", "pricing": "paid"},
    {"name": "Attom Data API", "description": "Property data and analytics", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.attomdata.com/solutions/property-api/", "pricing": "paid"},
    {"name": "CoreLogic API", "description": "Property and mortgage data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.corelogic.com/", "pricing": "paid"},
    {"name": "Estated API", "description": "Property data platform", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://estated.com/developers", "pricing": "freemium"},
    {"name": "Rentometer API", "description": "Rent comparison data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.rentometer.com/api", "pricing": "paid"},
    {"name": "Walk Score API", "description": "Walkability and transit scores", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.walkscore.com/professional/api.php", "pricing": "freemium"},
    {"name": "Regrid API", "description": "US parcel data API", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://regrid.com/api", "pricing": "paid"},
    {"name": "Reonomy API", "description": "Commercial real estate data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.reonomy.com/", "pricing": "paid"},
    {"name": "CoStar API", "description": "Commercial real estate analytics", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.costar.com/", "pricing": "paid"},
    {"name": "Yardi API", "description": "Property management software", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.yardi.com/", "pricing": "paid"},
    {"name": "AppFolio API", "description": "Property management platform", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.appfolio.com/", "pricing": "paid"},
    {"name": "Buildium API", "description": "Property management software", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.buildium.com/", "pricing": "paid"},
    {"name": "RentRedi API", "description": "Landlord software platform", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://rentredi.com/", "pricing": "freemium"},
    {"name": "Rightmove API", "description": "UK property portal", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.rightmove.co.uk/", "pricing": "paid"},
    {"name": "Zoopla API", "description": "UK property data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.zoopla.co.uk/", "pricing": "paid"},
    {"name": "Hemnet API", "description": "Swedish property portal", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.hemnet.se/", "pricing": "paid"},
    {"name": "Idealista API", "description": "Spanish property portal", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.idealista.com/", "pricing": "paid"},
    {"name": "Domain API", "description": "Australian property data", "category": "Real Estate", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.domain.com.au/", "pricing": "freemium"},
]

TRAVEL_HOSPITALITY = [
    {"name": "Amadeus API", "description": "Travel technology solutions", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.amadeus.com/", "pricing": "freemium"},
    {"name": "Sabre API", "description": "Travel technology platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.sabre.com/", "pricing": "paid"},
    {"name": "Travelport API", "description": "Travel commerce platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.travelport.com/", "pricing": "paid"},
    {"name": "Skyscanner API", "description": "Flight search engine", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.skyscanner.net/", "pricing": "freemium"},
    {"name": "Kiwi.com API", "description": "Flight search and booking", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.kiwi.com/", "pricing": "freemium"},
    {"name": "Duffel API", "description": "Flight booking API", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://duffel.com/docs/api", "pricing": "paid"},
    {"name": "AeroDataBox API", "description": "Aviation data API", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.aerodatabox.com/", "pricing": "freemium"},
    {"name": "FlightAware API", "description": "Flight tracking data", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://flightaware.com/commercial/flightxml/", "pricing": "paid"},
    {"name": "FlightRadar24 API", "description": "Global flight tracking", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.flightradar24.com/", "pricing": "paid"},
    {"name": "Booking.com API", "description": "Hotel booking platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.booking.com/", "pricing": "paid"},
    {"name": "Expedia API", "description": "Travel booking platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.expediagroup.com/", "pricing": "paid"},
    {"name": "Tripadvisor API", "description": "Travel reviews and data", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.tripadvisor.com/", "pricing": "freemium"},
    {"name": "Airbnb API", "description": "Vacation rental platform", "category": "Travel", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.airbnb.com/partner", "pricing": "paid"},
    {"name": "Vrbo API", "description": "Vacation rental marketplace", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.vrbo.com/platform/documentation", "pricing": "paid"},
    {"name": "Hostelworld API", "description": "Hostel booking platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.hostelworld.com/", "pricing": "paid"},
    {"name": "Seatgeek API", "description": "Event tickets marketplace", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.seatgeek.com/", "pricing": "free"},
    {"name": "Ticketmaster API", "description": "Event tickets platform", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.ticketmaster.com/", "pricing": "freemium"},
    {"name": "Eventbrite API", "description": "Event management platform", "category": "Travel", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.eventbrite.com/platform/api/", "pricing": "freemium"},
    {"name": "Viator API", "description": "Tours and activities", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.viatorcom/developer", "pricing": "paid"},
    {"name": "GetYourGuide API", "description": "Tours and experiences", "category": "Travel", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://partner.getyourguide.com/", "pricing": "paid"},
]

SPORTS_FITNESS = [
    {"name": "Sportradar API", "description": "Sports data and content", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://sportradar.com/", "pricing": "paid"},
    {"name": "ESPN API", "description": "Sports news and data", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.espn.com/apis/devcenter/", "pricing": "free"},
    {"name": "Football-Data API", "description": "Football/soccer data", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.football-data.org/", "pricing": "freemium"},
    {"name": "API-Football", "description": "Football data and statistics", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.api-football.com/", "pricing": "freemium"},
    {"name": "TheSportsDB API", "description": "Sports database", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.thesportsdb.com/api.php", "pricing": "freemium"},
    {"name": "Odds API", "description": "Sports betting odds", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://the-odds-api.com/", "pricing": "freemium"},
    {"name": "Strava API", "description": "Athletes and activities", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.strava.com/", "pricing": "free"},
    {"name": "Fitbit API", "description": "Fitness and health data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://dev.fitbit.com/", "pricing": "free"},
    {"name": "Garmin Connect API", "description": "Fitness device data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.garmin.com/", "pricing": "free"},
    {"name": "Polar API", "description": "Sports and fitness data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.polar.com/accesslink-api/", "pricing": "free"},
    {"name": "Whoop API", "description": "Performance and recovery data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.whoop.com/", "pricing": "free"},
    {"name": "Oura Ring API", "description": "Sleep and readiness data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.ouraring.com/docs/", "pricing": "free"},
    {"name": "Apple HealthKit API", "description": "Health and fitness data", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.apple.com/documentation/healthkit", "pricing": "free"},
    {"name": "Google Fit API", "description": "Health and fitness platform", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.google.com/fit", "pricing": "free"},
    {"name": "Samsung Health API", "description": "Health data platform", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.samsung.com/health", "pricing": "free"},
    {"name": "MyFitnessPal API", "description": "Nutrition and fitness tracking", "category": "Sports", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.myfitnesspal.com/api", "pricing": "paid"},
    {"name": "Nutritionix API", "description": "Nutrition data API", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.nutritionix.com/", "pricing": "freemium"},
    {"name": "USDA FoodData API", "description": "Food and nutrition data", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://fdc.nal.usda.gov/api-guide.html", "pricing": "free"},
    {"name": "Edamam API", "description": "Nutrition and recipe data", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.edamam.com/", "pricing": "freemium"},
    {"name": "Spoonacular API", "description": "Food and recipe API", "category": "Sports", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://spoonacular.com/food-api", "pricing": "freemium"},
]

HR_RECRUITING = [
    {"name": "LinkedIn API", "description": "Professional network platform", "category": "HR", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.linkedin.com/", "pricing": "freemium"},
    {"name": "Indeed API", "description": "Job search platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.indeed.com/", "pricing": "freemium"},
    {"name": "Glassdoor API", "description": "Company reviews and salaries", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.glassdoor.com/developer/", "pricing": "paid"},
    {"name": "ZipRecruiter API", "description": "Job posting and search", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ziprecruiter.com/", "pricing": "paid"},
    {"name": "Monster API", "description": "Job search and recruitment", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.monster.com/", "pricing": "paid"},
    {"name": "CareerBuilder API", "description": "Employment screening and HR", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.careerbuilder.com/", "pricing": "paid"},
    {"name": "Lever API", "description": "Applicant tracking system", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://hire.lever.co/developer/documentation", "pricing": "paid"},
    {"name": "Greenhouse API", "description": "Recruiting software", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.greenhouse.io/", "pricing": "paid"},
    {"name": "Workable API", "description": "Recruitment software", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://workable.readme.io/", "pricing": "paid"},
    {"name": "BambooHR API", "description": "HR software for SMBs", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://documentation.bamboohr.com/docs", "pricing": "paid"},
    {"name": "Workday API", "description": "Enterprise HR management", "category": "HR", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.workday.com/", "pricing": "paid"},
    {"name": "ADP API", "description": "HR and payroll services", "category": "HR", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.adp.com/", "pricing": "paid"},
    {"name": "Gusto API", "description": "Payroll and HR platform", "category": "HR", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://docs.gusto.com/", "pricing": "paid"},
    {"name": "Rippling API", "description": "HR, IT, and Finance platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.rippling.com/", "pricing": "paid"},
    {"name": "Deel API", "description": "Global payroll and compliance", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.deel.com/", "pricing": "paid"},
    {"name": "Remote API", "description": "Global employment platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://remote.com/api", "pricing": "paid"},
    {"name": "Oyster API", "description": "Global employment platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.oysterhr.com/", "pricing": "paid"},
    {"name": "Lattice API", "description": "People management platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.lattice.com/", "pricing": "paid"},
    {"name": "Culture Amp API", "description": "Employee engagement platform", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.cultureamp.com/", "pricing": "paid"},
    {"name": "15Five API", "description": "Performance management", "category": "HR", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.15five.com/", "pricing": "paid"},
]

EDUCATION = [
    {"name": "Canvas LMS API", "description": "Learning management system", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://canvas.instructure.com/doc/api/", "pricing": "paid"},
    {"name": "Blackboard API", "description": "Education technology platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.blackboard.com/", "pricing": "paid"},
    {"name": "Moodle API", "description": "Open source LMS", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.moodle.org/dev/Web_service_API_functions", "pricing": "free"},
    {"name": "Schoology API", "description": "K-12 learning management", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.schoology.com/", "pricing": "paid"},
    {"name": "Google Classroom API", "description": "Education collaboration platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.google.com/classroom", "pricing": "free"},
    {"name": "Microsoft Teams Education API", "description": "Education collaboration", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/graph/education-concept-overview", "pricing": "paid"},
    {"name": "Clever API", "description": "Education data platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://dev.clever.com/", "pricing": "freemium"},
    {"name": "ClassLink API", "description": "Education identity management", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.classlink.com/", "pricing": "paid"},
    {"name": "PowerSchool API", "description": "K-12 education technology", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.powerschool.com/", "pricing": "paid"},
    {"name": "Infinite Campus API", "description": "K-12 student information", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.infinitecampus.com/", "pricing": "paid"},
    {"name": "Coursera API", "description": "Online learning platform", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://building.coursera.org/app-platform/", "pricing": "paid"},
    {"name": "Udemy API", "description": "Online course marketplace", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.udemy.com/developers/affiliate/", "pricing": "freemium"},
    {"name": "edX API", "description": "Online learning platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://open.edx.org/", "pricing": "freemium"},
    {"name": "Khan Academy API", "description": "Free online education", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://api.khanacademy.org/", "pricing": "free"},
    {"name": "Duolingo API", "description": "Language learning platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.duolingo.com/", "pricing": "freemium"},
    {"name": "Quizlet API", "description": "Study tools platform", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://quizlet.com/api-dashboard/", "pricing": "freemium"},
    {"name": "Chegg API", "description": "Education services", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.chegg.com/", "pricing": "paid"},
    {"name": "Turnitin API", "description": "Academic integrity", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.turnitin.com/", "pricing": "paid"},
    {"name": "Grammarly API", "description": "Writing assistant", "category": "Education", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.grammarly.com/", "pricing": "paid"},
    {"name": "Notion API for Education", "description": "Workspace for education", "category": "Education", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.notion.com/", "pricing": "freemium"},
]

INSURANCE = [
    {"name": "Lemonade API", "description": "AI-powered insurance", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.lemonade.com/", "pricing": "paid"},
    {"name": "Root Insurance API", "description": "Car insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://root.com/", "pricing": "paid"},
    {"name": "Hippo Insurance API", "description": "Home insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.hippo.com/", "pricing": "paid"},
    {"name": "Next Insurance API", "description": "Small business insurance", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.nextinsurance.com/", "pricing": "paid"},
    {"name": "Pie Insurance API", "description": "Workers compensation", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://pieinsurance.com/", "pricing": "paid"},
    {"name": "Bold Penguin API", "description": "Commercial insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.boldpenguin.com/", "pricing": "paid"},
    {"name": "Coterie Insurance API", "description": "Small business insurance", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://coterieinsurance.com/", "pricing": "paid"},
    {"name": "Clearcover API", "description": "Car insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://clearcover.com/", "pricing": "paid"},
    {"name": "Trov API", "description": "On-demand insurance", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.trov.com/", "pricing": "paid"},
    {"name": "Ladder Life API", "description": "Life insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ladderlife.com/", "pricing": "paid"},
    {"name": "Ethos Life API", "description": "Life insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.ethoslife.com/", "pricing": "paid"},
    {"name": "Haven Life API", "description": "Life insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://havenlife.com/", "pricing": "paid"},
    {"name": "Bestow API", "description": "Life insurance technology", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.bestow.com/", "pricing": "paid"},
    {"name": "Policygenius API", "description": "Insurance marketplace", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.policygenius.com/", "pricing": "paid"},
    {"name": "The Zebra API", "description": "Insurance comparison", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.thezebra.com/", "pricing": "paid"},
    {"name": "Gabi API", "description": "Insurance optimization", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.gabi.com/", "pricing": "paid"},
    {"name": "Duck Creek API", "description": "Insurance software", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.duckcreek.com/", "pricing": "paid"},
    {"name": "Guidewire API", "description": "Insurance platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.guidewire.com/", "pricing": "paid"},
    {"name": "Socotra API", "description": "Insurance core platform", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.socotra.com/", "pricing": "paid"},
    {"name": "EIS API", "description": "Insurance core system", "category": "Insurance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.eisgroup.com/", "pricing": "paid"},
]

AUTOMOTIVE = [
    {"name": "Tesla API", "description": "Tesla vehicle control", "category": "Automotive", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://tesla-api.timdorr.com/", "pricing": "free"},
    {"name": "Smartcar API", "description": "Connected car API", "category": "Automotive", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://smartcar.com/docs/", "pricing": "freemium"},
    {"name": "Carmd API", "description": "Vehicle diagnostics data", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.carmd.com/api/", "pricing": "paid"},
    {"name": "NHTSA API", "description": "Vehicle safety data", "category": "Automotive", "auth": "None", "https": True, "cors": "yes", "link": "https://vpic.nhtsa.dot.gov/api/", "pricing": "free"},
    {"name": "Edmunds API", "description": "Automotive data", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.edmunds.com/", "pricing": "freemium"},
    {"name": "Kelley Blue Book API", "description": "Vehicle valuations", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.kbb.com/", "pricing": "paid"},
    {"name": "Black Book API", "description": "Vehicle valuations", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.blackbook.com/", "pricing": "paid"},
    {"name": "Autocheck API", "description": "Vehicle history reports", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.autocheck.com/", "pricing": "paid"},
    {"name": "Carfax API", "description": "Vehicle history data", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.carfax.com/", "pricing": "paid"},
    {"name": "VinAudit API", "description": "VIN decoder and history", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.vinaudit.com/", "pricing": "freemium"},
    {"name": "CarQuery API", "description": "Vehicle database", "category": "Automotive", "auth": "None", "https": True, "cors": "yes", "link": "https://www.carqueryapi.com/", "pricing": "free"},
    {"name": "Fueleconomy API", "description": "EPA fuel economy data", "category": "Automotive", "auth": "None", "https": True, "cors": "yes", "link": "https://www.fueleconomy.gov/feg/ws/", "pricing": "free"},
    {"name": "Geotab API", "description": "Fleet management platform", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.geotab.com/", "pricing": "paid"},
    {"name": "Samsara API", "description": "Fleet management", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.samsara.com/", "pricing": "paid"},
    {"name": "KeepTruckin API", "description": "Fleet management", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.keeptruckin.com/", "pricing": "paid"},
    {"name": "Verizon Connect API", "description": "Fleet tracking", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.verizonconnect.com/", "pricing": "paid"},
    {"name": "Turo API", "description": "Car sharing platform", "category": "Automotive", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://turo.com/", "pricing": "paid"},
    {"name": "Getaround API", "description": "Car sharing platform", "category": "Automotive", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.getaround.com/", "pricing": "paid"},
    {"name": "Uber Freight API", "description": "Freight logistics", "category": "Automotive", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.uber.com/us/en/freight/api/", "pricing": "paid"},
    {"name": "Convoy API", "description": "Freight platform", "category": "Automotive", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://convoy.com/", "pricing": "paid"},
]

AGRICULTURE = [
    {"name": "aWhere API", "description": "Agricultural weather data", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.awhere.com/", "pricing": "freemium"},
    {"name": "Climate Corporation API", "description": "Digital agriculture platform", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://climate.com/", "pricing": "paid"},
    {"name": "John Deere API", "description": "Farm equipment and data", "category": "Agriculture", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.deere.com/", "pricing": "paid"},
    {"name": "Trimble Ag API", "description": "Precision agriculture", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.trimble.com/", "pricing": "paid"},
    {"name": "FarmLogs API", "description": "Farm management software", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://farmlogs.com/", "pricing": "paid"},
    {"name": "Granular API", "description": "Farm management platform", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://granular.ag/", "pricing": "paid"},
    {"name": "AgriWebb API", "description": "Livestock management", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agriwebb.com/", "pricing": "paid"},
    {"name": "Farmers Edge API", "description": "Digital agriculture platform", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.farmersedge.ca/", "pricing": "paid"},
    {"name": "USDA NASS API", "description": "Agricultural statistics", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://quickstats.nass.usda.gov/api", "pricing": "free"},
    {"name": "FAO API", "description": "Food and agriculture data", "category": "Agriculture", "auth": "None", "https": True, "cors": "yes", "link": "https://www.fao.org/faostat/en/", "pricing": "free"},
    {"name": "Agworld API", "description": "Farm data management", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agworld.com/", "pricing": "paid"},
    {"name": "AgLeader API", "description": "Precision farming", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agleader.com/", "pricing": "paid"},
    {"name": "CLAAS API", "description": "Agricultural machinery data", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.claas.com/", "pricing": "paid"},
    {"name": "CNH Industrial API", "description": "Farm equipment platform", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.cnhindustrial.com/", "pricing": "paid"},
    {"name": "AGCO API", "description": "Agricultural equipment", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agcocorp.com/", "pricing": "paid"},
    {"name": "Cropwise API", "description": "Digital farming platform", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.cropwise.com/", "pricing": "paid"},
    {"name": "Taranis API", "description": "Agricultural intelligence", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.taranis.com/", "pricing": "paid"},
    {"name": "Descartes Labs API", "description": "Geospatial intelligence", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.descarteslabs.com/", "pricing": "paid"},
    {"name": "Planet API", "description": "Earth imaging data", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.planet.com/", "pricing": "freemium"},
    {"name": "Sentera API", "description": "Precision agriculture", "category": "Agriculture", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://sentera.com/", "pricing": "paid"},
]

def main():
    print("🦞 APIClaw Night Expansion - Batch 4 (Industry-Specific)")
    print("=" * 50)
    
    registry = load_registry()
    initial_count = len(registry['apis'])
    print(f"Starting with {initial_count} APIs")
    
    all_batches = [
        ("Real Estate", REAL_ESTATE),
        ("Travel & Hospitality", TRAVEL_HOSPITALITY),
        ("Sports & Fitness", SPORTS_FITNESS),
        ("HR & Recruiting", HR_RECRUITING),
        ("Education", EDUCATION),
        ("Insurance", INSURANCE),
        ("Automotive", AUTOMOTIVE),
        ("Agriculture", AGRICULTURE),
    ]
    
    total_added = 0
    for name, batch in all_batches:
        added = add_apis(registry, batch)
        total_added += added
        print(f"  {name}: +{added} APIs")
    
    save_registry(registry)
    final_count = len(registry['apis'])
    
    print("=" * 50)
    print(f"✅ Added {total_added} new APIs")
    print(f"📊 Total: {initial_count} → {final_count}")
    
    return total_added

if __name__ == "__main__":
    main()
