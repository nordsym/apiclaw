#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-24 03:00 Batch 3
More niche APIs to reach 1000+ additions
"""

import json
import os
from datetime import datetime

# More unique/niche APIs
NEW_APIS_BATCH3 = [
    # === GOVERNMENT & PUBLIC DATA ===
    {"name": "Data.gov", "description": "US government open data", "category": "Government", "authType": "apiKey", "baseUrl": "https://www.data.gov/developers/apis"},
    {"name": "Data.gov.uk", "description": "UK government open data", "category": "Government", "authType": "none", "baseUrl": "https://data.gov.uk/"},
    {"name": "EU Open Data Portal", "description": "European Union open data", "category": "Government", "authType": "none", "baseUrl": "https://data.europa.eu/euodp/en/developerscorner"},
    {"name": "OpenFDA", "description": "US FDA drug and device data", "category": "Government", "authType": "none", "baseUrl": "https://open.fda.gov/"},
    {"name": "Census Bureau", "description": "US census data", "category": "Government", "authType": "apiKey", "baseUrl": "https://www.census.gov/data/developers.html"},
    {"name": "USASpending.gov", "description": "US federal spending data", "category": "Government", "authType": "none", "baseUrl": "https://api.usaspending.gov/"},
    {"name": "NASA APIs", "description": "NASA space data", "category": "Government", "authType": "apiKey", "baseUrl": "https://api.nasa.gov/"},
    {"name": "NOAA Climate Data", "description": "Climate and weather data", "category": "Government", "authType": "apiKey", "baseUrl": "https://www.ncdc.noaa.gov/cdo-web/webservices/v2"},
    {"name": "OpenAQ", "description": "Global air quality data", "category": "Government", "authType": "none", "baseUrl": "https://openaq.org/#/api"},
    {"name": "USGS Earthquake", "description": "Earthquake data", "category": "Government", "authType": "none", "baseUrl": "https://earthquake.usgs.gov/fdsnws/event/1/"},
    {"name": "SEC EDGAR", "description": "US securities filings", "category": "Government", "authType": "none", "baseUrl": "https://www.sec.gov/edgar/searchedgar/companysearch.html"},
    {"name": "World Bank", "description": "Global development data", "category": "Government", "authType": "none", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589"},
    {"name": "IMF Data", "description": "International economic data", "category": "Government", "authType": "none", "baseUrl": "https://datahelp.imf.org/knowledgebase/articles/1968408"},
    {"name": "OECD Data", "description": "OECD statistics", "category": "Government", "authType": "none", "baseUrl": "https://data.oecd.org/"},
    {"name": "UN Data", "description": "United Nations statistics", "category": "Government", "authType": "none", "baseUrl": "http://data.un.org/"},

    # === HEALTHCARE ===
    {"name": "OpenMRS", "description": "Open source medical records", "category": "Healthcare", "authType": "apiKey", "baseUrl": "https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients"},
    {"name": "HealthData.gov", "description": "US health data", "category": "Healthcare", "authType": "none", "baseUrl": "https://healthdata.gov/"},
    {"name": "DrugBank", "description": "Drug database", "category": "Healthcare", "authType": "apiKey", "baseUrl": "https://go.drugbank.com/releases/latest#open-data"},
    {"name": "RxNorm", "description": "Drug normalization API", "category": "Healthcare", "authType": "none", "baseUrl": "https://rxnav.nlm.nih.gov/RxNormAPIs.html"},
    {"name": "PubMed", "description": "Medical research database", "category": "Healthcare", "authType": "apiKey", "baseUrl": "https://www.ncbi.nlm.nih.gov/home/develop/api/"},
    {"name": "ClinicalTrials.gov", "description": "Clinical trials data", "category": "Healthcare", "authType": "none", "baseUrl": "https://clinicaltrials.gov/api/gui"},
    {"name": "Disease.sh", "description": "Disease outbreak data", "category": "Healthcare", "authType": "none", "baseUrl": "https://disease.sh/"},
    {"name": "COVID19 API", "description": "Coronavirus statistics", "category": "Healthcare", "authType": "none", "baseUrl": "https://covid19api.com/"},
    {"name": "OpenFDA Drugs", "description": "FDA drug labels", "category": "Healthcare", "authType": "none", "baseUrl": "https://open.fda.gov/apis/drug/"},
    {"name": "Medicare", "description": "US Medicare data", "category": "Healthcare", "authType": "none", "baseUrl": "https://data.cms.gov/provider-data/api"},

    # === SCIENCE & RESEARCH ===
    {"name": "arXiv API", "description": "Scientific paper preprints", "category": "Science", "authType": "none", "baseUrl": "https://arxiv.org/help/api/"},
    {"name": "Crossref", "description": "Scholarly metadata", "category": "Science", "authType": "none", "baseUrl": "https://www.crossref.org/documentation/retrieve-metadata/"},
    {"name": "CORE", "description": "Open access research papers", "category": "Science", "authType": "apiKey", "baseUrl": "https://core.ac.uk/documentation/api"},
    {"name": "Semantic Scholar", "description": "AI-powered research tool", "category": "Science", "authType": "apiKey", "baseUrl": "https://api.semanticscholar.org/"},
    {"name": "GBIF", "description": "Global biodiversity data", "category": "Science", "authType": "none", "baseUrl": "https://www.gbif.org/developer/summary"},
    {"name": "iNaturalist", "description": "Nature observations", "category": "Science", "authType": "oauth", "baseUrl": "https://api.inaturalist.org/v1/docs/"},
    {"name": "PDB", "description": "Protein data bank", "category": "Science", "authType": "none", "baseUrl": "https://www.rcsb.org/docs/"},
    {"name": "UniProt", "description": "Protein sequences", "category": "Science", "authType": "none", "baseUrl": "https://www.uniprot.org/help/api"},
    {"name": "NCBI Entrez", "description": "Biological databases", "category": "Science", "authType": "apiKey", "baseUrl": "https://www.ncbi.nlm.nih.gov/books/NBK25501/"},
    {"name": "SpaceX API", "description": "SpaceX mission data", "category": "Science", "authType": "none", "baseUrl": "https://github.com/r-spacex/SpaceX-API"},
    {"name": "Astronomy Picture of the Day", "description": "NASA APOD", "category": "Science", "authType": "apiKey", "baseUrl": "https://api.nasa.gov/"},
    {"name": "Open Notify ISS", "description": "ISS location", "category": "Science", "authType": "none", "baseUrl": "http://open-notify.org/"},
    {"name": "Launch Library", "description": "Space launch data", "category": "Science", "authType": "none", "baseUrl": "https://thespacedevs.com/llapi"},

    # === SPORTS ===
    {"name": "ESPN API", "description": "Sports news and data", "category": "Sports", "authType": "apiKey", "baseUrl": "http://www.espn.com/apis/devcenter/docs/"},
    {"name": "TheSportsDB", "description": "Sports database", "category": "Sports", "authType": "apiKey", "baseUrl": "https://www.thesportsdb.com/api.php"},
    {"name": "Football-Data.org", "description": "Soccer data API", "category": "Sports", "authType": "apiKey", "baseUrl": "https://www.football-data.org/documentation/api"},
    {"name": "NBA API", "description": "NBA statistics", "category": "Sports", "authType": "none", "baseUrl": "https://www.balldontlie.io/"},
    {"name": "NHL API", "description": "Hockey statistics", "category": "Sports", "authType": "none", "baseUrl": "https://statsapi.web.nhl.com/api/v1/"},
    {"name": "MLB Stats API", "description": "Baseball statistics", "category": "Sports", "authType": "none", "baseUrl": "https://statsapi.mlb.com/"},
    {"name": "F1 API", "description": "Formula 1 data", "category": "Sports", "authType": "none", "baseUrl": "https://ergast.com/mrd/"},
    {"name": "UFC API", "description": "MMA fighter data", "category": "Sports", "authType": "apiKey", "baseUrl": "https://rapidapi.com/brianiswu/api/ufc-mma-statistics/"},
    {"name": "CricAPI", "description": "Cricket data", "category": "Sports", "authType": "apiKey", "baseUrl": "https://www.cricapi.com/"},
    {"name": "Odds API", "description": "Sports betting odds", "category": "Sports", "authType": "apiKey", "baseUrl": "https://the-odds-api.com/"},

    # === EDUCATION ===
    {"name": "Open Trivia DB", "description": "Trivia questions", "category": "Education", "authType": "none", "baseUrl": "https://opentdb.com/api_config.php"},
    {"name": "Numbers API", "description": "Number facts", "category": "Education", "authType": "none", "baseUrl": "http://numbersapi.com/"},
    {"name": "Fun Facts API", "description": "Random facts", "category": "Education", "authType": "none", "baseUrl": "https://fungenerators.com/api/facts/"},
    {"name": "Rest Countries", "description": "Country information", "category": "Education", "authType": "none", "baseUrl": "https://restcountries.com/"},
    {"name": "Universities List", "description": "Universities worldwide", "category": "Education", "authType": "none", "baseUrl": "http://universities.hipolabs.com/"},
    {"name": "Datamuse", "description": "Word finding API", "category": "Education", "authType": "none", "baseUrl": "https://www.datamuse.com/api/"},
    {"name": "Wiktionary API", "description": "Dictionary data", "category": "Education", "authType": "none", "baseUrl": "https://en.wiktionary.org/w/api.php"},
    {"name": "Wordnik", "description": "Word definitions", "category": "Education", "authType": "apiKey", "baseUrl": "https://developer.wordnik.com/"},
    {"name": "LibreTranslate", "description": "Open translation", "category": "Education", "authType": "none", "baseUrl": "https://libretranslate.com/"},
    {"name": "JokeAPI", "description": "Programming jokes", "category": "Education", "authType": "none", "baseUrl": "https://jokeapi.dev/"},

    # === ENVIRONMENT ===
    {"name": "Breezometer", "description": "Air quality data", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.breezometer.com/api-documentation/"},
    {"name": "Carbon Interface", "description": "Carbon emissions calc", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.carboninterface.com/"},
    {"name": "World Air Quality", "description": "Air pollution data", "category": "Environment", "authType": "apiKey", "baseUrl": "https://waqi.info/"},
    {"name": "EPA AirNow", "description": "US air quality", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.airnowapi.org/"},
    {"name": "Sunrise Sunset", "description": "Sun times API", "category": "Environment", "authType": "none", "baseUrl": "https://sunrise-sunset.org/api"},
    {"name": "Tides API", "description": "Tide predictions", "category": "Environment", "authType": "apiKey", "baseUrl": "https://tidesandcurrents.noaa.gov/api/"},
    {"name": "UV Index API", "description": "UV radiation data", "category": "Environment", "authType": "apiKey", "baseUrl": "https://www.openuv.io/"},
    {"name": "Pollen API", "description": "Pollen levels", "category": "Environment", "authType": "apiKey", "baseUrl": "https://ambeedata.com/pollen-api/"},

    # === UTILITIES ===
    {"name": "IP-API", "description": "IP geolocation", "category": "Utilities", "authType": "none", "baseUrl": "http://ip-api.com/"},
    {"name": "ipify", "description": "Public IP address", "category": "Utilities", "authType": "none", "baseUrl": "https://www.ipify.org/"},
    {"name": "ipapi.co", "description": "IP geolocation", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://ipapi.co/"},
    {"name": "Abstract IP", "description": "IP geolocation", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/ip-geolocation-api"},
    {"name": "User Agent Parser", "description": "User agent info", "category": "Utilities", "authType": "none", "baseUrl": "https://useragentstring.com/"},
    {"name": "ScreenshotAPI", "description": "Website screenshots", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://screenshotapi.net/"},
    {"name": "PDF.co", "description": "PDF generation", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://pdf.co/"},
    {"name": "Convertio", "description": "File conversion", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developers.convertio.co/"},
    {"name": "CloudConvert", "description": "File conversion", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://cloudconvert.com/api/v2"},
    {"name": "TinyURL", "description": "URL shortening", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://tinyurl.com/app/dev"},
    {"name": "Rebrandly", "description": "Branded short links", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developers.rebrandly.com/"},
    {"name": "Short.io", "description": "URL shortening", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developers.short.io/"},
    {"name": "Hashify", "description": "Hash generation", "category": "Utilities", "authType": "none", "baseUrl": "https://hashify.net/api"},
    {"name": "Random.org", "description": "True random numbers", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.random.org/clients/http/"},

    # === ECOMMERCE PLATFORMS ===
    {"name": "Shopify Admin API", "description": "Shopify store management", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://shopify.dev/api/admin"},
    {"name": "WooCommerce API", "description": "WordPress commerce", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs/"},
    {"name": "BigCommerce", "description": "E-commerce platform", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://developer.bigcommerce.com/"},
    {"name": "Magento", "description": "E-commerce platform", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html"},
    {"name": "PrestaShop API", "description": "E-commerce platform", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://devdocs.prestashop.com/"},
    {"name": "Etsy API", "description": "Handmade marketplace", "category": "E-commerce", "authType": "oauth", "baseUrl": "https://www.etsy.com/developers/documentation"},
    {"name": "Printful API", "description": "Print on demand", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.printful.com/docs"},
    {"name": "Shippo API", "description": "Shipping labels", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://goshippo.com/docs/"},
    {"name": "EasyPost API", "description": "Shipping API", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.easypost.com/docs/api"},
    {"name": "ShipStation API", "description": "Shipping management", "category": "E-commerce", "authType": "apiKey", "baseUrl": "https://www.shipstation.com/docs/api/"},

    # === CRM & SALES ===
    {"name": "Salesforce API", "description": "CRM platform", "category": "CRM", "authType": "oauth", "baseUrl": "https://developer.salesforce.com/docs/apis"},
    {"name": "HubSpot API", "description": "Marketing and CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.hubspot.com/"},
    {"name": "Pipedrive API", "description": "Sales CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.pipedrive.com/"},
    {"name": "Zoho CRM API", "description": "CRM platform", "category": "CRM", "authType": "oauth", "baseUrl": "https://www.zoho.com/crm/developer/docs/api/v2/"},
    {"name": "Freshsales API", "description": "Sales CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.freshworks.com/crm/api/"},
    {"name": "Close.io API", "description": "Sales CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developer.close.com/"},
    {"name": "Copper CRM", "description": "Google CRM", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developer.copper.com/"},
    {"name": "Intercom API", "description": "Customer messaging", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.intercom.com/"},
    {"name": "Zendesk API", "description": "Customer support", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developer.zendesk.com/api-reference/"},
    {"name": "Freshdesk API", "description": "Help desk software", "category": "CRM", "authType": "apiKey", "baseUrl": "https://developers.freshdesk.com/api/"},

    # === MARKETING ===
    {"name": "SendGrid API", "description": "Email marketing", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://docs.sendgrid.com/api-reference/"},
    {"name": "Mailgun API", "description": "Email API", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://documentation.mailgun.com/en/latest/api-intro.html"},
    {"name": "Postmark API", "description": "Transactional email", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://postmarkapp.com/developer"},
    {"name": "Sendinblue API", "description": "Email marketing", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.sendinblue.com/"},
    {"name": "ActiveCampaign", "description": "Marketing automation", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.activecampaign.com/"},
    {"name": "ConvertKit API", "description": "Creator marketing", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.convertkit.com/"},
    {"name": "Drip API", "description": "E-commerce CRM", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developer.drip.com/"},
    {"name": "Klaviyo API", "description": "E-commerce marketing", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://developers.klaviyo.com/"},
    {"name": "Customer.io API", "description": "Messaging automation", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://customer.io/docs/api/"},
    {"name": "Segment API", "description": "Customer data platform", "category": "Marketing", "authType": "apiKey", "baseUrl": "https://segment.com/docs/connections/sources/catalog/libraries/"},

    # === SEO & ANALYTICS ===
    {"name": "Google Search Console", "description": "Search analytics", "category": "SEO", "authType": "oauth", "baseUrl": "https://developers.google.com/webmaster-tools/"},
    {"name": "Ahrefs API", "description": "SEO tools", "category": "SEO", "authType": "apiKey", "baseUrl": "https://ahrefs.com/api"},
    {"name": "SEMrush API", "description": "SEO analytics", "category": "SEO", "authType": "apiKey", "baseUrl": "https://www.semrush.com/api-documentation/"},
    {"name": "Moz API", "description": "SEO metrics", "category": "SEO", "authType": "apiKey", "baseUrl": "https://moz.com/products/api"},
    {"name": "Serpstack", "description": "SERP tracking", "category": "SEO", "authType": "apiKey", "baseUrl": "https://serpstack.com/documentation"},
    {"name": "DataForSEO", "description": "SEO data", "category": "SEO", "authType": "apiKey", "baseUrl": "https://docs.dataforseo.com/"},
    {"name": "SimilarWeb API", "description": "Web analytics", "category": "SEO", "authType": "apiKey", "baseUrl": "https://api.similarweb.com/"},
    {"name": "PageSpeed Insights", "description": "Page speed analysis", "category": "SEO", "authType": "apiKey", "baseUrl": "https://developers.google.com/speed/docs/insights/v5/get-started"},
    {"name": "BuiltWith API", "description": "Technology lookup", "category": "SEO", "authType": "apiKey", "baseUrl": "https://api.builtwith.com/"},
    {"name": "Hunter.io API", "description": "Email finder", "category": "SEO", "authType": "apiKey", "baseUrl": "https://hunter.io/api-documentation/v2"},

    # === ACCOUNTING & FINANCE ===
    {"name": "QuickBooks API", "description": "Accounting software", "category": "Finance", "authType": "oauth", "baseUrl": "https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/"},
    {"name": "Xero API", "description": "Accounting platform", "category": "Finance", "authType": "oauth", "baseUrl": "https://developer.xero.com/"},
    {"name": "FreshBooks API", "description": "Invoicing software", "category": "Finance", "authType": "oauth", "baseUrl": "https://www.freshbooks.com/api/start"},
    {"name": "Wave API", "description": "Invoicing and accounting", "category": "Finance", "authType": "oauth", "baseUrl": "https://developer.waveapps.com/hc/en-us/categories/360001114072"},
    {"name": "Plaid API", "description": "Bank data aggregation", "category": "Finance", "authType": "apiKey", "baseUrl": "https://plaid.com/docs/"},
    {"name": "Yodlee API", "description": "Financial data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://developer.yodlee.com/"},
    {"name": "Finicity API", "description": "Financial data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://finicity.com/open-banking/"},
    {"name": "Open Banking UK", "description": "UK banking data", "category": "Finance", "authType": "oauth", "baseUrl": "https://standards.openbanking.org.uk/"},

    # === HUMAN RESOURCES ===
    {"name": "BambooHR API", "description": "HR software", "category": "HR", "authType": "apiKey", "baseUrl": "https://documentation.bamboohr.com/docs"},
    {"name": "Workday API", "description": "HR management", "category": "HR", "authType": "oauth", "baseUrl": "https://community.workday.com/articles/api"},
    {"name": "Gusto API", "description": "Payroll platform", "category": "HR", "authType": "oauth", "baseUrl": "https://docs.gusto.com/"},
    {"name": "Lever API", "description": "ATS recruiting", "category": "HR", "authType": "apiKey", "baseUrl": "https://hire.lever.co/developer/documentation"},
    {"name": "Greenhouse API", "description": "Recruiting software", "category": "HR", "authType": "apiKey", "baseUrl": "https://developers.greenhouse.io/"},
    {"name": "LinkedIn Talent", "description": "LinkedIn recruiting", "category": "HR", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/linkedin/talent/"},
    {"name": "Indeed API", "description": "Job listings", "category": "HR", "authType": "apiKey", "baseUrl": "https://developers.indeed.com/docs/"},
    {"name": "Glassdoor API", "description": "Company reviews", "category": "HR", "authType": "apiKey", "baseUrl": "https://www.glassdoor.com/developer/index.htm"},

    # === REAL ESTATE ===
    {"name": "Zillow API", "description": "Property data", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://www.zillow.com/howto/api/APIOverview.htm"},
    {"name": "Realtor.com API", "description": "Real estate listings", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://www.realtor.com/api/"},
    {"name": "Redfin API", "description": "Real estate data", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://www.redfin.com/"},
    {"name": "Estated API", "description": "Property data", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://estated.com/developers"},
    {"name": "ATTOM Data", "description": "Property information", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://api.developer.attomdata.com/"},
    {"name": "Mashvisor API", "description": "Investment property", "category": "Real Estate", "authType": "apiKey", "baseUrl": "https://mashvisor.com/"},

    # === LEGAL ===
    {"name": "Case.law API", "description": "US case law", "category": "Legal", "authType": "apiKey", "baseUrl": "https://case.law/api/"},
    {"name": "CourtListener API", "description": "Legal database", "category": "Legal", "authType": "none", "baseUrl": "https://www.courtlistener.com/api/rest-info/"},
    {"name": "OpenCorporates", "description": "Company data", "category": "Legal", "authType": "apiKey", "baseUrl": "https://api.opencorporates.com/"},
    {"name": "GLEIF API", "description": "Legal entity identifiers", "category": "Legal", "authType": "none", "baseUrl": "https://www.gleif.org/en/lei-data/gleif-api"},

    # === COMMUNICATION PLATFORMS ===
    {"name": "Discord API", "description": "Chat platform", "category": "Communication", "authType": "oauth", "baseUrl": "https://discord.com/developers/docs"},
    {"name": "Microsoft Teams", "description": "Team collaboration", "category": "Communication", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/graph/teams-concept-overview"},
    {"name": "Zoom API", "description": "Video conferencing", "category": "Communication", "authType": "oauth", "baseUrl": "https://marketplace.zoom.us/docs/api-reference/introduction"},
    {"name": "WebEx API", "description": "Video conferencing", "category": "Communication", "authType": "oauth", "baseUrl": "https://developer.webex.com/docs/api/getting-started"},
    {"name": "Google Meet", "description": "Video meetings", "category": "Communication", "authType": "oauth", "baseUrl": "https://developers.google.com/meet/api/overview"},
    {"name": "Vonage API", "description": "Communications API", "category": "Communication", "authType": "apiKey", "baseUrl": "https://developer.vonage.com/"},
    {"name": "Bandwidth API", "description": "Communications API", "category": "Communication", "authType": "apiKey", "baseUrl": "https://dev.bandwidth.com/"},
    {"name": "Plivo API", "description": "Voice and SMS", "category": "Communication", "authType": "apiKey", "baseUrl": "https://www.plivo.com/docs/"},
    {"name": "RingCentral API", "description": "Business phone", "category": "Communication", "authType": "oauth", "baseUrl": "https://developers.ringcentral.com/"},
    {"name": "8x8 API", "description": "Communications API", "category": "Communication", "authType": "apiKey", "baseUrl": "https://developer.8x8.com/"},

    # === PROJECT MANAGEMENT ===
    {"name": "Jira API", "description": "Project tracking", "category": "Project Management", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/"},
    {"name": "Monday.com API", "description": "Work OS", "category": "Project Management", "authType": "apiKey", "baseUrl": "https://monday.com/developers/v2"},
    {"name": "Notion API", "description": "All-in-one workspace", "category": "Project Management", "authType": "apiKey", "baseUrl": "https://developers.notion.com/"},
    {"name": "ClickUp API", "description": "Project management", "category": "Project Management", "authType": "apiKey", "baseUrl": "https://clickup.com/api"},
    {"name": "Basecamp API", "description": "Project management", "category": "Project Management", "authType": "oauth", "baseUrl": "https://github.com/basecamp/bc3-api"},
    {"name": "Wrike API", "description": "Work management", "category": "Project Management", "authType": "oauth", "baseUrl": "https://developers.wrike.com/"},
    {"name": "Linear API", "description": "Issue tracking", "category": "Project Management", "authType": "apiKey", "baseUrl": "https://developers.linear.app/docs/"},
    {"name": "Clubhouse API", "description": "Project management", "category": "Project Management", "authType": "apiKey", "baseUrl": "https://clubhouse.io/api/rest/v3/"},

    # === DOCUMENT MANAGEMENT ===
    {"name": "DocuSign API", "description": "E-signatures", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.docusign.com/"},
    {"name": "HelloSign API", "description": "E-signatures", "category": "Documents", "authType": "apiKey", "baseUrl": "https://app.hellosign.com/api/documentation"},
    {"name": "PandaDoc API", "description": "Document automation", "category": "Documents", "authType": "apiKey", "baseUrl": "https://developers.pandadoc.com/"},
    {"name": "Adobe Sign API", "description": "E-signatures", "category": "Documents", "authType": "oauth", "baseUrl": "https://www.adobe.io/apis/documentcloud/sign.html"},
    {"name": "SignNow API", "description": "E-signatures", "category": "Documents", "authType": "apiKey", "baseUrl": "https://docs.signnow.com/"},
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
    print(f"🦞 APIClaw Night Expansion - 2026-02-24 03:00 Batch 3")
    print(f"Before: {before} APIs")
    
    added, total = add_apis_to_registry(NEW_APIS_BATCH3)
    
    print(f"Added: {added} new APIs")
    print(f"Total: {total} APIs")
    print(f"✅ Done!")
