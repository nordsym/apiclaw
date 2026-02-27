#!/usr/bin/env python3
"""
APIClaw Night Expansion 2026-02-26 06:00 - Batch 2
Target: 600+ more APIs to reach 1000+ for this run
"""

import json
import re
from pathlib import Path

# Load existing to avoid duplicates
combined_file = Path("/Users/gustavhemmingsson/Projects/apiclaw/data/combined-02-26.json")
existing_ids = set()
if combined_file.exists():
    with open(combined_file) as f:
        for api in json.load(f):
            existing_ids.add(api.get('id', ''))

print(f"Loaded {len(existing_ids)} existing API IDs")

def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug[:50]

# MASSIVE batch of additional APIs
batch2_apis = [
    # Healthcare & Medical (expanded)
    {"name": "OpenMRS", "desc": "Open source medical records", "cat": "Healthcare", "url": "https://wiki.openmrs.org/display/docs/REST+Web+Services+API+For+Clients", "auth": "apiKey"},
    {"name": "HAPI FHIR", "desc": "Healthcare interoperability", "cat": "Healthcare", "url": "https://hapifhir.io/", "auth": "None"},
    {"name": "DrugBank", "desc": "Drug information database", "cat": "Healthcare", "url": "https://docs.drugbank.com/v1/", "auth": "apiKey"},
    {"name": "RxNorm", "desc": "Drug naming standards", "cat": "Healthcare", "url": "https://lhncbc.nlm.nih.gov/RxNav/APIs/", "auth": "None"},
    {"name": "OpenFDA Drug", "desc": "FDA drug data", "cat": "Healthcare", "url": "https://open.fda.gov/apis/drug/", "auth": "None"},
    {"name": "ClinicalTrials.gov", "desc": "Clinical trial data", "cat": "Healthcare", "url": "https://clinicaltrials.gov/api/", "auth": "None"},
    {"name": "Healthcare.gov", "desc": "US healthcare data", "cat": "Healthcare", "url": "https://www.healthcare.gov/developers/", "auth": "None"},
    {"name": "BioDigital", "desc": "3D human anatomy", "cat": "Healthcare", "url": "https://developer.biodigital.com/", "auth": "apiKey"},
    {"name": "infermedica", "desc": "Medical diagnosis AI", "cat": "Healthcare", "url": "https://developer.infermedica.com/docs/", "auth": "apiKey"},
    {"name": "MedlinePlus", "desc": "Health information", "cat": "Healthcare", "url": "https://medlineplus.gov/webservices.html", "auth": "None"},
    
    # Logistics & Supply Chain
    {"name": "Shippo", "desc": "Multi-carrier shipping", "cat": "Shipping", "url": "https://goshippo.com/docs/", "auth": "apiKey"},
    {"name": "EasyPost", "desc": "Shipping API", "cat": "Shipping", "url": "https://www.easypost.com/docs/api", "auth": "apiKey"},
    {"name": "Shipstation", "desc": "Order management", "cat": "Shipping", "url": "https://www.shipstation.com/docs/api/", "auth": "apiKey"},
    {"name": "PostNord", "desc": "Nordic postal service", "cat": "Shipping", "url": "https://developer.postnord.com/", "auth": "apiKey"},
    {"name": "Deutsche Post", "desc": "German postal service", "cat": "Shipping", "url": "https://developer.dhl.com/", "auth": "apiKey"},
    {"name": "Royal Mail", "desc": "UK postal service", "cat": "Shipping", "url": "https://developer.royalmail.com/", "auth": "apiKey"},
    {"name": "Australia Post", "desc": "Australian postal", "cat": "Shipping", "url": "https://developers.auspost.com.au/", "auth": "apiKey"},
    {"name": "USPS", "desc": "US Postal Service", "cat": "Shipping", "url": "https://www.usps.com/business/web-tools-apis/", "auth": "apiKey"},
    {"name": "Pitney Bowes", "desc": "Shipping and mailing", "cat": "Shipping", "url": "https://shipping360.pitneybowes.com/api/", "auth": "apiKey"},
    {"name": "Freightos", "desc": "Freight rates", "cat": "Shipping", "url": "https://www.freightos.com/freight-api/", "auth": "apiKey"},
    
    # HR & Recruiting
    {"name": "Greenhouse", "desc": "Recruiting software", "cat": "HR", "url": "https://developers.greenhouse.io/", "auth": "apiKey"},
    {"name": "Lever", "desc": "Recruiting platform", "cat": "HR", "url": "https://hire.lever.co/developer/documentation", "auth": "apiKey"},
    {"name": "Workable", "desc": "Recruiting software", "cat": "HR", "url": "https://workable.readme.io/reference", "auth": "apiKey"},
    {"name": "BambooHR", "desc": "HR software", "cat": "HR", "url": "https://documentation.bamboohr.com/reference", "auth": "apiKey"},
    {"name": "Gusto", "desc": "Payroll and benefits", "cat": "HR", "url": "https://docs.gusto.com/", "auth": "OAuth"},
    {"name": "Rippling", "desc": "HR platform", "cat": "HR", "url": "https://developer.rippling.com/", "auth": "OAuth"},
    {"name": "Personio", "desc": "HR management", "cat": "HR", "url": "https://developer.personio.de/reference", "auth": "apiKey"},
    {"name": "HiBob", "desc": "HR platform", "cat": "HR", "url": "https://apidocs.hibob.com/", "auth": "apiKey"},
    {"name": "Namely", "desc": "HR software", "cat": "HR", "url": "https://developers.namely.com/", "auth": "OAuth"},
    {"name": "Zenefits", "desc": "HR platform", "cat": "HR", "url": "https://developers.zenefits.com/", "auth": "OAuth"},
    
    # Legal & Compliance
    {"name": "DocuSign", "desc": "Electronic signatures", "cat": "Legal", "url": "https://developers.docusign.com/", "auth": "OAuth"},
    {"name": "HelloSign", "desc": "E-signatures", "cat": "Legal", "url": "https://developers.hellosign.com/", "auth": "apiKey"},
    {"name": "PandaDoc", "desc": "Document automation", "cat": "Legal", "url": "https://developers.pandadoc.com/", "auth": "apiKey"},
    {"name": "Ironclad", "desc": "Contract management", "cat": "Legal", "url": "https://developer.ironcladapp.com/", "auth": "OAuth"},
    {"name": "ContractWorks", "desc": "Contract management", "cat": "Legal", "url": "https://www.contractworks.com/api", "auth": "apiKey"},
    {"name": "Clio", "desc": "Legal practice management", "cat": "Legal", "url": "https://developers.clio.com/", "auth": "OAuth"},
    {"name": "GDPR API", "desc": "GDPR compliance", "cat": "Legal", "url": "https://gdpr-info.eu/", "auth": "None"},
    {"name": "Vanta", "desc": "Compliance automation", "cat": "Security", "url": "https://www.vanta.com/api", "auth": "apiKey"},
    {"name": "Drata", "desc": "Compliance platform", "cat": "Security", "url": "https://drata.com/platform/api", "auth": "apiKey"},
    {"name": "OneTrust", "desc": "Privacy management", "cat": "Legal", "url": "https://developer.onetrust.com/", "auth": "OAuth"},
    
    # Customer Support
    {"name": "Zendesk", "desc": "Customer service", "cat": "Support", "url": "https://developer.zendesk.com/", "auth": "OAuth"},
    {"name": "Freshdesk", "desc": "Help desk software", "cat": "Support", "url": "https://developers.freshdesk.com/", "auth": "apiKey"},
    {"name": "Intercom", "desc": "Customer messaging", "cat": "Support", "url": "https://developers.intercom.com/", "auth": "OAuth"},
    {"name": "Helpscout", "desc": "Customer support", "cat": "Support", "url": "https://developer.helpscout.com/", "auth": "OAuth"},
    {"name": "Crisp", "desc": "Customer messaging", "cat": "Support", "url": "https://docs.crisp.chat/api/v1/", "auth": "apiKey"},
    {"name": "Drift", "desc": "Conversational marketing", "cat": "Marketing", "url": "https://devdocs.drift.com/", "auth": "OAuth"},
    {"name": "Tawk.to", "desc": "Live chat", "cat": "Support", "url": "https://developer.tawk.to/", "auth": "apiKey"},
    {"name": "LiveChat", "desc": "Live chat software", "cat": "Support", "url": "https://developers.livechat.com/", "auth": "OAuth"},
    {"name": "Kustomer", "desc": "Customer service", "cat": "Support", "url": "https://developer.kustomer.com/", "auth": "apiKey"},
    {"name": "Gorgias", "desc": "E-commerce support", "cat": "Support", "url": "https://developers.gorgias.com/", "auth": "apiKey"},
    
    # Marketing Automation
    {"name": "HubSpot", "desc": "Marketing platform", "cat": "Marketing", "url": "https://developers.hubspot.com/", "auth": "OAuth"},
    {"name": "Marketo", "desc": "Marketing automation", "cat": "Marketing", "url": "https://developers.marketo.com/", "auth": "OAuth"},
    {"name": "Pardot", "desc": "B2B marketing", "cat": "Marketing", "url": "https://developer.salesforce.com/docs/marketing/pardot/", "auth": "OAuth"},
    {"name": "ActiveCampaign", "desc": "Email marketing", "cat": "Marketing", "url": "https://developers.activecampaign.com/", "auth": "apiKey"},
    {"name": "Klaviyo", "desc": "E-commerce marketing", "cat": "Marketing", "url": "https://developers.klaviyo.com/", "auth": "apiKey"},
    {"name": "Braze", "desc": "Customer engagement", "cat": "Marketing", "url": "https://www.braze.com/docs/api/", "auth": "apiKey"},
    {"name": "Iterable", "desc": "Cross-channel marketing", "cat": "Marketing", "url": "https://api.iterable.com/api/docs", "auth": "apiKey"},
    {"name": "Customer.io", "desc": "Messaging automation", "cat": "Marketing", "url": "https://customer.io/docs/api/", "auth": "apiKey"},
    {"name": "Drip", "desc": "E-commerce CRM", "cat": "Marketing", "url": "https://developer.drip.com/", "auth": "OAuth"},
    {"name": "Omnisend", "desc": "E-commerce marketing", "cat": "Marketing", "url": "https://api-docs.omnisend.com/", "auth": "apiKey"},
    
    # Accounting & Invoicing
    {"name": "QuickBooks", "desc": "Accounting software", "cat": "Finance", "url": "https://developer.intuit.com/app/developer/qbo/docs/", "auth": "OAuth"},
    {"name": "Xero", "desc": "Accounting platform", "cat": "Finance", "url": "https://developer.xero.com/", "auth": "OAuth"},
    {"name": "FreshBooks", "desc": "Invoicing software", "cat": "Finance", "url": "https://www.freshbooks.com/api/", "auth": "OAuth"},
    {"name": "Wave", "desc": "Small business accounting", "cat": "Finance", "url": "https://developer.waveapps.com/", "auth": "OAuth"},
    {"name": "Sage", "desc": "Accounting software", "cat": "Finance", "url": "https://developer.sage.com/", "auth": "OAuth"},
    {"name": "Zoho Books", "desc": "Accounting software", "cat": "Finance", "url": "https://www.zoho.com/books/api/v3/", "auth": "OAuth"},
    {"name": "Invoice Ninja", "desc": "Invoicing platform", "cat": "Finance", "url": "https://invoice-ninja.readthedocs.io/", "auth": "apiKey"},
    {"name": "Harvest", "desc": "Time tracking", "cat": "Productivity", "url": "https://help.getharvest.com/api-v2/", "auth": "OAuth"},
    {"name": "Chargebee", "desc": "Subscription billing", "cat": "Finance", "url": "https://www.chargebee.com/docs/2.0/api_v2.html", "auth": "apiKey"},
    {"name": "Recurly", "desc": "Subscription management", "cat": "Finance", "url": "https://developers.recurly.com/", "auth": "apiKey"},
    
    # CRM
    {"name": "Salesforce API", "desc": "CRM platform", "cat": "Business", "url": "https://developer.salesforce.com/docs/apis", "auth": "OAuth"},
    {"name": "Pipedrive", "desc": "Sales CRM", "cat": "Business", "url": "https://developers.pipedrive.com/", "auth": "OAuth"},
    {"name": "Zoho CRM", "desc": "CRM platform", "cat": "Business", "url": "https://www.zoho.com/crm/developer/docs/api/", "auth": "OAuth"},
    {"name": "Close", "desc": "Sales CRM", "cat": "Business", "url": "https://developer.close.com/", "auth": "apiKey"},
    {"name": "Copper", "desc": "Google CRM", "cat": "Business", "url": "https://developer.copper.com/", "auth": "apiKey"},
    {"name": "Insightly", "desc": "CRM and project", "cat": "Business", "url": "https://api.insight.ly/v3.1/Help", "auth": "apiKey"},
    {"name": "Nimble", "desc": "Social CRM", "cat": "Business", "url": "https://nimble.com/api/", "auth": "apiKey"},
    {"name": "Freshsales", "desc": "Sales CRM", "cat": "Business", "url": "https://developers.freshsales.io/", "auth": "apiKey"},
    {"name": "Monday.com", "desc": "Work OS", "cat": "Productivity", "url": "https://developer.monday.com/", "auth": "apiKey"},
    {"name": "ClickUp", "desc": "Project management", "cat": "Productivity", "url": "https://clickup.com/api", "auth": "OAuth"},
    
    # Database & Backend
    {"name": "Supabase", "desc": "Open source Firebase", "cat": "Database", "url": "https://supabase.com/docs/reference/", "auth": "apiKey"},
    {"name": "Firebase", "desc": "App development platform", "cat": "Database", "url": "https://firebase.google.com/docs/reference", "auth": "apiKey"},
    {"name": "PlanetScale", "desc": "Serverless MySQL", "cat": "Database", "url": "https://planetscale.com/docs/api/", "auth": "apiKey"},
    {"name": "Fauna", "desc": "Serverless database", "cat": "Database", "url": "https://docs.fauna.com/fauna/current/api/", "auth": "apiKey"},
    {"name": "Hasura", "desc": "GraphQL engine", "cat": "Database", "url": "https://hasura.io/docs/latest/api-reference/", "auth": "apiKey"},
    {"name": "Neon", "desc": "Serverless Postgres", "cat": "Database", "url": "https://neon.tech/docs/introduction/", "auth": "apiKey"},
    {"name": "Cockroach Labs", "desc": "Distributed SQL", "cat": "Database", "url": "https://www.cockroachlabs.com/docs/api/", "auth": "apiKey"},
    {"name": "Upstash", "desc": "Serverless Redis", "cat": "Database", "url": "https://docs.upstash.com/", "auth": "apiKey"},
    {"name": "Astra DB", "desc": "Cloud Cassandra", "cat": "Database", "url": "https://docs.datastax.com/en/astra/docs/", "auth": "apiKey"},
    {"name": "SingleStore", "desc": "Real-time database", "cat": "Database", "url": "https://docs.singlestore.com/", "auth": "apiKey"},
    
    # Monitoring & Observability
    {"name": "Datadog", "desc": "Monitoring platform", "cat": "DevOps", "url": "https://docs.datadoghq.com/api/", "auth": "apiKey"},
    {"name": "New Relic", "desc": "Observability platform", "cat": "DevOps", "url": "https://docs.newrelic.com/docs/apis/", "auth": "apiKey"},
    {"name": "Sentry", "desc": "Error tracking", "cat": "DevOps", "url": "https://docs.sentry.io/api/", "auth": "apiKey"},
    {"name": "PagerDuty", "desc": "Incident response", "cat": "DevOps", "url": "https://developer.pagerduty.com/", "auth": "apiKey"},
    {"name": "Grafana Cloud", "desc": "Monitoring stack", "cat": "DevOps", "url": "https://grafana.com/docs/grafana-cloud/api/", "auth": "apiKey"},
    {"name": "Splunk", "desc": "Data platform", "cat": "DevOps", "url": "https://dev.splunk.com/", "auth": "apiKey"},
    {"name": "LogRocket", "desc": "Frontend monitoring", "cat": "DevOps", "url": "https://docs.logrocket.com/", "auth": "apiKey"},
    {"name": "Rollbar", "desc": "Error tracking", "cat": "DevOps", "url": "https://docs.rollbar.com/", "auth": "apiKey"},
    {"name": "Bugsnag", "desc": "Error monitoring", "cat": "DevOps", "url": "https://bugsnagapiv2.docs.apiary.io/", "auth": "apiKey"},
    {"name": "Airbrake", "desc": "Error monitoring", "cat": "DevOps", "url": "https://airbrake.io/docs/api/", "auth": "apiKey"},
    
    # Media & Video
    {"name": "Cloudflare Stream", "desc": "Video streaming", "cat": "Video", "url": "https://developers.cloudflare.com/stream/", "auth": "apiKey"},
    {"name": "Mux", "desc": "Video infrastructure", "cat": "Video", "url": "https://docs.mux.com/", "auth": "apiKey"},
    {"name": "Wistia", "desc": "Video hosting", "cat": "Video", "url": "https://wistia.com/support/developers", "auth": "apiKey"},
    {"name": "Vimeo API", "desc": "Video platform", "cat": "Video", "url": "https://developer.vimeo.com/api/reference", "auth": "OAuth"},
    {"name": "Brightcove", "desc": "Video technology", "cat": "Video", "url": "https://apis.support.brightcove.com/", "auth": "OAuth"},
    {"name": "JW Player", "desc": "Video player", "cat": "Video", "url": "https://developer.jwplayer.com/", "auth": "apiKey"},
    {"name": "Kaltura", "desc": "Video platform", "cat": "Video", "url": "https://developer.kaltura.com/", "auth": "apiKey"},
    {"name": "api.video", "desc": "Video API", "cat": "Video", "url": "https://docs.api.video/", "auth": "apiKey"},
    {"name": "Ziggeo", "desc": "Video recording", "cat": "Video", "url": "https://ziggeo.com/docs/", "auth": "apiKey"},
    {"name": "Agora", "desc": "Real-time engagement", "cat": "Video", "url": "https://docs.agora.io/", "auth": "apiKey"},
    
    # Forms & Surveys
    {"name": "Typeform", "desc": "Online forms", "cat": "Productivity", "url": "https://developer.typeform.com/", "auth": "OAuth"},
    {"name": "SurveyMonkey", "desc": "Survey platform", "cat": "Productivity", "url": "https://developer.surveymonkey.com/", "auth": "OAuth"},
    {"name": "Google Forms", "desc": "Forms builder", "cat": "Productivity", "url": "https://developers.google.com/forms/api", "auth": "OAuth"},
    {"name": "Tally", "desc": "Form builder", "cat": "Productivity", "url": "https://tally.so/help/webhooks", "auth": "apiKey"},
    {"name": "Paperform", "desc": "Online forms", "cat": "Productivity", "url": "https://paperform.co/help/articles/api-overview/", "auth": "apiKey"},
    {"name": "Formstack", "desc": "Form builder", "cat": "Productivity", "url": "https://developers.formstack.com/", "auth": "OAuth"},
    {"name": "Cognito Forms", "desc": "Form builder", "cat": "Productivity", "url": "https://www.cognitoforms.com/api", "auth": "apiKey"},
    {"name": "Wufoo", "desc": "Online forms", "cat": "Productivity", "url": "https://wufoo.github.io/docs/", "auth": "apiKey"},
    {"name": "Formbricks", "desc": "Open source surveys", "cat": "Productivity", "url": "https://formbricks.com/docs/api", "auth": "apiKey"},
    {"name": "Qualtrics", "desc": "Experience management", "cat": "Productivity", "url": "https://api.qualtrics.com/", "auth": "apiKey"},
    
    # Scheduling & Calendar
    {"name": "Calendly", "desc": "Scheduling automation", "cat": "Productivity", "url": "https://developer.calendly.com/", "auth": "OAuth"},
    {"name": "Cal.com", "desc": "Open source scheduling", "cat": "Productivity", "url": "https://cal.com/docs/api", "auth": "apiKey"},
    {"name": "Cronofy", "desc": "Calendar API", "cat": "Productivity", "url": "https://docs.cronofy.com/", "auth": "OAuth"},
    {"name": "Nylas", "desc": "Communications platform", "cat": "Productivity", "url": "https://developer.nylas.com/", "auth": "OAuth"},
    {"name": "Acuity Scheduling", "desc": "Appointment scheduling", "cat": "Productivity", "url": "https://developers.acuityscheduling.com/", "auth": "OAuth"},
    {"name": "Doodle", "desc": "Meeting scheduling", "cat": "Productivity", "url": "https://doodle.com/api", "auth": "OAuth"},
    {"name": "SimplyBook", "desc": "Booking system", "cat": "Productivity", "url": "https://simplybook.me/api/developer", "auth": "apiKey"},
    {"name": "YouCanBook.me", "desc": "Booking pages", "cat": "Productivity", "url": "https://api.youcanbook.me/", "auth": "apiKey"},
    {"name": "Appointlet", "desc": "Scheduling software", "cat": "Productivity", "url": "https://developers.appointlet.com/", "auth": "apiKey"},
    {"name": "Setmore", "desc": "Appointment scheduling", "cat": "Productivity", "url": "https://setmore.com/api", "auth": "apiKey"},
    
    # Social Media Management
    {"name": "Hootsuite", "desc": "Social media management", "cat": "Social", "url": "https://developer.hootsuite.com/", "auth": "OAuth"},
    {"name": "Sprout Social", "desc": "Social management", "cat": "Social", "url": "https://developers.sproutsocial.com/", "auth": "OAuth"},
    {"name": "Later", "desc": "Social scheduling", "cat": "Social", "url": "https://developers.later.com/", "auth": "OAuth"},
    {"name": "Sprinklr", "desc": "CXM platform", "cat": "Social", "url": "https://developer.sprinklr.com/", "auth": "OAuth"},
    {"name": "Agorapulse", "desc": "Social media tool", "cat": "Social", "url": "https://api.agorapulse.com/", "auth": "OAuth"},
    {"name": "SocialBee", "desc": "Social scheduling", "cat": "Social", "url": "https://socialbee.com/api/", "auth": "apiKey"},
    {"name": "Publer", "desc": "Social scheduling", "cat": "Social", "url": "https://publer.io/api/", "auth": "apiKey"},
    {"name": "Loomly", "desc": "Brand success platform", "cat": "Social", "url": "https://www.loomly.com/api", "auth": "apiKey"},
    {"name": "Sendible", "desc": "Social management", "cat": "Social", "url": "https://sendible.com/api", "auth": "OAuth"},
    {"name": "CoSchedule", "desc": "Marketing calendar", "cat": "Marketing", "url": "https://coschedule.com/api", "auth": "apiKey"},
    
    # E-commerce Tools
    {"name": "Shipbob", "desc": "Fulfillment platform", "cat": "E-commerce", "url": "https://developer.shipbob.com/", "auth": "OAuth"},
    {"name": "Printful", "desc": "Print on demand", "cat": "E-commerce", "url": "https://developers.printful.com/", "auth": "OAuth"},
    {"name": "Printify", "desc": "Print on demand", "cat": "E-commerce", "url": "https://developers.printify.com/", "auth": "OAuth"},
    {"name": "Gooten", "desc": "Print on demand", "cat": "E-commerce", "url": "https://www.gooten.com/api/", "auth": "apiKey"},
    {"name": "Oberlo", "desc": "Dropshipping", "cat": "E-commerce", "url": "https://www.oberlo.com/api", "auth": "OAuth"},
    {"name": "Spocket", "desc": "Dropshipping", "cat": "E-commerce", "url": "https://www.spocket.co/api", "auth": "apiKey"},
    {"name": "ShipEngine", "desc": "Shipping API", "cat": "Shipping", "url": "https://shipengine.github.io/shipengine-openapi/", "auth": "apiKey"},
    {"name": "Returnly", "desc": "Returns platform", "cat": "E-commerce", "url": "https://developers.returnly.com/", "auth": "apiKey"},
    {"name": "Loop Returns", "desc": "Returns management", "cat": "E-commerce", "url": "https://developers.loopreturns.com/", "auth": "apiKey"},
    {"name": "Recharge", "desc": "Subscriptions", "cat": "E-commerce", "url": "https://developer.rechargepayments.com/", "auth": "apiKey"},
    
    # Review & Feedback
    {"name": "Trustpilot", "desc": "Review platform", "cat": "Marketing", "url": "https://documentation-apidocumentation.trustpilot.com/", "auth": "OAuth"},
    {"name": "Yotpo", "desc": "E-commerce marketing", "cat": "Marketing", "url": "https://developers.yotpo.com/", "auth": "apiKey"},
    {"name": "Judge.me", "desc": "Product reviews", "cat": "E-commerce", "url": "https://judge.me/api", "auth": "apiKey"},
    {"name": "Bazaarvoice", "desc": "User content", "cat": "Marketing", "url": "https://developer.bazaarvoice.com/", "auth": "apiKey"},
    {"name": "PowerReviews", "desc": "Review software", "cat": "Marketing", "url": "https://www.powerreviews.com/api/", "auth": "apiKey"},
    {"name": "Stamped.io", "desc": "Reviews and loyalty", "cat": "Marketing", "url": "https://developers.stamped.io/", "auth": "apiKey"},
    {"name": "Loox", "desc": "Photo reviews", "cat": "E-commerce", "url": "https://loox.io/api", "auth": "apiKey"},
    {"name": "Reviews.io", "desc": "Review collection", "cat": "Marketing", "url": "https://developers.reviews.io/", "auth": "apiKey"},
    {"name": "G2", "desc": "Software reviews", "cat": "Marketing", "url": "https://documentation.g2.com/", "auth": "apiKey"},
    {"name": "Capterra", "desc": "Software reviews", "cat": "Marketing", "url": "https://www.capterra.com/api/", "auth": "apiKey"},
    
    # Workflow Automation
    {"name": "Zapier", "desc": "Workflow automation", "cat": "Automation", "url": "https://platform.zapier.com/", "auth": "OAuth"},
    {"name": "Make", "desc": "Automation platform", "cat": "Automation", "url": "https://www.make.com/en/api-documentation", "auth": "apiKey"},
    {"name": "n8n", "desc": "Workflow automation", "cat": "Automation", "url": "https://docs.n8n.io/api/", "auth": "apiKey"},
    {"name": "Tray.io", "desc": "Integration platform", "cat": "Automation", "url": "https://tray.io/documentation/", "auth": "OAuth"},
    {"name": "Workato", "desc": "Enterprise automation", "cat": "Automation", "url": "https://docs.workato.com/api-reference/", "auth": "OAuth"},
    {"name": "Pipedream", "desc": "Integration platform", "cat": "Automation", "url": "https://pipedream.com/docs/api/", "auth": "apiKey"},
    {"name": "IFTTT", "desc": "Applet automation", "cat": "Automation", "url": "https://ifttt.com/docs", "auth": "OAuth"},
    {"name": "Parabola", "desc": "Data automation", "cat": "Automation", "url": "https://parabola.io/api/", "auth": "apiKey"},
    {"name": "Bardeen", "desc": "Browser automation", "cat": "Automation", "url": "https://www.bardeen.ai/api", "auth": "apiKey"},
    {"name": "Activepieces", "desc": "Open source automation", "cat": "Automation", "url": "https://www.activepieces.com/docs/api", "auth": "apiKey"},
    
    # Document Processing
    {"name": "AWS Textract", "desc": "Document analysis", "cat": "AI", "url": "https://docs.aws.amazon.com/textract/", "auth": "apiKey"},
    {"name": "Google Document AI", "desc": "Document processing", "cat": "AI", "url": "https://cloud.google.com/document-ai/docs/", "auth": "OAuth"},
    {"name": "Azure Form Recognizer", "desc": "Form extraction", "cat": "AI", "url": "https://docs.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/", "auth": "apiKey"},
    {"name": "Docparser", "desc": "Document parsing", "cat": "Documents", "url": "https://dev.docparser.com/", "auth": "apiKey"},
    {"name": "Rossum", "desc": "Document AI", "cat": "AI", "url": "https://elis.rossum.ai/api/docs/", "auth": "apiKey"},
    {"name": "Hyperscience", "desc": "Document automation", "cat": "AI", "url": "https://www.hyperscience.com/api/", "auth": "apiKey"},
    {"name": "Klippa", "desc": "Document processing", "cat": "Documents", "url": "https://docs.klippa.com/", "auth": "apiKey"},
    {"name": "Mindee", "desc": "Document parsing", "cat": "AI", "url": "https://developers.mindee.com/", "auth": "apiKey"},
    {"name": "Nanonets", "desc": "OCR and AI", "cat": "AI", "url": "https://nanonets.com/documentation/", "auth": "apiKey"},
    {"name": "Veryfi", "desc": "Document intelligence", "cat": "AI", "url": "https://www.veryfi.com/api/", "auth": "apiKey"},
    
    # Voice & Telephony
    {"name": "Vonage", "desc": "Communications API", "cat": "Communication", "url": "https://developer.vonage.com/", "auth": "apiKey"},
    {"name": "Plivo", "desc": "Voice and SMS", "cat": "Communication", "url": "https://www.plivo.com/docs/", "auth": "apiKey"},
    {"name": "Bandwidth", "desc": "Communications API", "cat": "Communication", "url": "https://dev.bandwidth.com/", "auth": "apiKey"},
    {"name": "SignalWire", "desc": "Communications platform", "cat": "Communication", "url": "https://signalwire.com/docs", "auth": "apiKey"},
    {"name": "Sinch", "desc": "Messaging and voice", "cat": "Communication", "url": "https://developers.sinch.com/", "auth": "apiKey"},
    {"name": "Voximplant", "desc": "Cloud communications", "cat": "Communication", "url": "https://voximplant.com/docs/", "auth": "apiKey"},
    {"name": "Daily", "desc": "Video and audio", "cat": "Video", "url": "https://docs.daily.co/", "auth": "apiKey"},
    {"name": "Livekit", "desc": "Real-time video", "cat": "Video", "url": "https://docs.livekit.io/", "auth": "apiKey"},
    {"name": "Dyte", "desc": "Video SDK", "cat": "Video", "url": "https://docs.dyte.io/", "auth": "apiKey"},
    {"name": "Whereby", "desc": "Video meetings", "cat": "Video", "url": "https://whereby.dev/", "auth": "apiKey"},
    
    # Data Enrichment
    {"name": "Clearbit", "desc": "Business intelligence", "cat": "Business", "url": "https://clearbit.com/docs", "auth": "apiKey"},
    {"name": "ZoomInfo", "desc": "B2B data", "cat": "Business", "url": "https://developers.zoominfo.com/", "auth": "apiKey"},
    {"name": "FullContact", "desc": "Identity resolution", "cat": "Business", "url": "https://docs.fullcontact.com/", "auth": "apiKey"},
    {"name": "Pipl", "desc": "People search", "cat": "Business", "url": "https://pipl.com/api/", "auth": "apiKey"},
    {"name": "Apollo.io", "desc": "Sales intelligence", "cat": "Business", "url": "https://apolloio.github.io/apollo-api-docs/", "auth": "apiKey"},
    {"name": "LeadIQ", "desc": "Sales prospecting", "cat": "Business", "url": "https://docs.leadiq.com/", "auth": "apiKey"},
    {"name": "Lusha", "desc": "Contact data", "cat": "Business", "url": "https://www.lusha.com/api/", "auth": "apiKey"},
    {"name": "Snov.io", "desc": "Sales automation", "cat": "Marketing", "url": "https://snov.io/api", "auth": "apiKey"},
    {"name": "RocketReach", "desc": "Professional data", "cat": "Business", "url": "https://rocketreach.co/api/", "auth": "apiKey"},
    {"name": "People Data Labs", "desc": "People data", "cat": "Business", "url": "https://docs.peopledatalabs.com/", "auth": "apiKey"},
    
    # Banking & Fintech
    {"name": "Plaid", "desc": "Financial data", "cat": "Finance", "url": "https://plaid.com/docs/", "auth": "apiKey"},
    {"name": "Yodlee", "desc": "Financial aggregation", "cat": "Finance", "url": "https://developer.yodlee.com/", "auth": "OAuth"},
    {"name": "MX", "desc": "Financial data", "cat": "Finance", "url": "https://docs.mx.com/", "auth": "apiKey"},
    {"name": "Finicity", "desc": "Financial data", "cat": "Finance", "url": "https://docs.finicity.com/", "auth": "apiKey"},
    {"name": "Tink", "desc": "Open banking", "cat": "Finance", "url": "https://docs.tink.com/", "auth": "OAuth"},
    {"name": "TrueLayer", "desc": "Open banking", "cat": "Finance", "url": "https://docs.truelayer.com/", "auth": "OAuth"},
    {"name": "Yapily", "desc": "Open banking", "cat": "Finance", "url": "https://docs.yapily.com/", "auth": "apiKey"},
    {"name": "Salt Edge", "desc": "Financial data", "cat": "Finance", "url": "https://docs.saltedge.com/", "auth": "apiKey"},
    {"name": "Belvo", "desc": "Open finance", "cat": "Finance", "url": "https://developers.belvo.com/", "auth": "apiKey"},
    {"name": "Basiq", "desc": "Financial data", "cat": "Finance", "url": "https://basiq.io/api/", "auth": "apiKey"},
    
    # Payments (expanded)
    {"name": "Adyen", "desc": "Global payments", "cat": "Finance", "url": "https://docs.adyen.com/", "auth": "apiKey"},
    {"name": "Checkout.com", "desc": "Payment gateway", "cat": "Finance", "url": "https://www.checkout.com/docs/api-reference", "auth": "apiKey"},
    {"name": "Paddle", "desc": "SaaS payments", "cat": "Finance", "url": "https://developer.paddle.com/", "auth": "apiKey"},
    {"name": "Lemonsqueezy", "desc": "Digital product payments", "cat": "Finance", "url": "https://docs.lemonsqueezy.com/api", "auth": "apiKey"},
    {"name": "Gumroad", "desc": "Creator payments", "cat": "Finance", "url": "https://app.gumroad.com/api", "auth": "OAuth"},
    {"name": "Paystack", "desc": "African payments", "cat": "Finance", "url": "https://paystack.com/docs/api/", "auth": "apiKey"},
    {"name": "Flutterwave", "desc": "African payments", "cat": "Finance", "url": "https://developer.flutterwave.com/", "auth": "apiKey"},
    {"name": "Razorpay", "desc": "Indian payments", "cat": "Finance", "url": "https://razorpay.com/docs/api/", "auth": "apiKey"},
    {"name": "Mollie", "desc": "European payments", "cat": "Finance", "url": "https://docs.mollie.com/", "auth": "apiKey"},
    {"name": "GoCardless", "desc": "Direct debit", "cat": "Finance", "url": "https://developer.gocardless.com/", "auth": "OAuth"},
    
    # Cloud Infrastructure
    {"name": "AWS", "desc": "Cloud platform", "cat": "Cloud", "url": "https://docs.aws.amazon.com/", "auth": "apiKey"},
    {"name": "Azure", "desc": "Cloud platform", "cat": "Cloud", "url": "https://docs.microsoft.com/en-us/rest/api/azure/", "auth": "OAuth"},
    {"name": "Google Cloud", "desc": "Cloud platform", "cat": "Cloud", "url": "https://cloud.google.com/apis", "auth": "OAuth"},
    {"name": "DigitalOcean", "desc": "Cloud platform", "cat": "Cloud", "url": "https://docs.digitalocean.com/reference/api/", "auth": "apiKey"},
    {"name": "Linode", "desc": "Cloud hosting", "cat": "Cloud", "url": "https://www.linode.com/docs/api/", "auth": "apiKey"},
    {"name": "Vultr", "desc": "Cloud compute", "cat": "Cloud", "url": "https://www.vultr.com/api/", "auth": "apiKey"},
    {"name": "Hetzner", "desc": "Cloud hosting", "cat": "Cloud", "url": "https://docs.hetzner.cloud/", "auth": "apiKey"},
    {"name": "Fly.io", "desc": "App platform", "cat": "Cloud", "url": "https://fly.io/docs/reference/", "auth": "apiKey"},
    {"name": "Railway", "desc": "App platform", "cat": "Cloud", "url": "https://docs.railway.app/reference/", "auth": "apiKey"},
    {"name": "Render", "desc": "Cloud platform", "cat": "Cloud", "url": "https://render.com/docs/api", "auth": "apiKey"},
    
    # CDN & Edge
    {"name": "Cloudflare", "desc": "CDN and security", "cat": "Infrastructure", "url": "https://api.cloudflare.com/", "auth": "apiKey"},
    {"name": "Fastly", "desc": "Edge cloud", "cat": "Infrastructure", "url": "https://developer.fastly.com/", "auth": "apiKey"},
    {"name": "Akamai", "desc": "CDN platform", "cat": "Infrastructure", "url": "https://developer.akamai.com/", "auth": "OAuth"},
    {"name": "Bunny CDN", "desc": "CDN service", "cat": "Infrastructure", "url": "https://docs.bunny.net/", "auth": "apiKey"},
    {"name": "KeyCDN", "desc": "CDN service", "cat": "Infrastructure", "url": "https://www.keycdn.com/api", "auth": "apiKey"},
    {"name": "StackPath", "desc": "Edge platform", "cat": "Infrastructure", "url": "https://stackpath.dev/", "auth": "OAuth"},
    {"name": "Vercel", "desc": "Frontend platform", "cat": "Development", "url": "https://vercel.com/docs/api", "auth": "apiKey"},
    {"name": "Netlify", "desc": "Web platform", "cat": "Development", "url": "https://docs.netlify.com/api/get-started/", "auth": "apiKey"},
    {"name": "Deno Deploy", "desc": "Edge functions", "cat": "Development", "url": "https://deno.com/deploy/docs/", "auth": "apiKey"},
    {"name": "Lambda", "desc": "Serverless compute", "cat": "Cloud", "url": "https://docs.aws.amazon.com/lambda/", "auth": "apiKey"},
    
    # Random APIs
    {"name": "Advice Slip", "desc": "Random advice", "cat": "Entertainment", "url": "https://api.adviceslip.com/", "auth": "None"},
    {"name": "Affirmations", "desc": "Positive affirmations", "cat": "Entertainment", "url": "https://www.affirmations.dev/", "auth": "None"},
    {"name": "Agify", "desc": "Age prediction", "cat": "Tools", "url": "https://agify.io/", "auth": "None"},
    {"name": "Nationalize", "desc": "Nationality prediction", "cat": "Tools", "url": "https://nationalize.io/", "auth": "None"},
    {"name": "Genderize", "desc": "Gender prediction", "cat": "Tools", "url": "https://genderize.io/", "auth": "None"},
    {"name": "BoredAPI", "desc": "Random activities", "cat": "Entertainment", "url": "https://www.boredapi.com/", "auth": "None"},
    {"name": "Chuck Norris", "desc": "Chuck Norris jokes", "cat": "Entertainment", "url": "https://api.chucknorris.io/", "auth": "None"},
    {"name": "Dad Jokes", "desc": "Dad jokes", "cat": "Entertainment", "url": "https://icanhazdadjoke.com/api", "auth": "None"},
    {"name": "Corporate BS", "desc": "Corporate buzzwords", "cat": "Entertainment", "url": "https://corporatebs-generator.sameerkumar.website/", "auth": "None"},
    {"name": "Evil Insult", "desc": "Random insults", "cat": "Entertainment", "url": "https://evilinsult.com/api/", "auth": "None"},
]

# Convert and dedupe
new_apis = []
seen_ids = set()

for api in batch2_apis:
    api_id = make_id(api.get('name', ''))
    
    if api_id in existing_ids or api_id in seen_ids or not api_id:
        continue
    
    seen_ids.add(api_id)
    
    entry = {
        "id": api_id,
        "name": api.get('name', api_id),
        "description": api.get('desc', ''),
        "category": api.get('cat', 'Uncategorized'),
        "link": api.get('url', ''),
        "auth": api.get('auth', 'None')
    }
    new_apis.append(entry)

print(f"New unique APIs in batch 2: {len(new_apis)}")

# Save batch 2
output_file = Path("/Users/gustavhemmingsson/Projects/apiclaw/data/night-expansion-02-26-06-batch2.json")
with open(output_file, 'w') as f:
    json.dump(new_apis, f, indent=2)

print(f"Saved {len(new_apis)} APIs to {output_file}")

# Update combined file
with open(combined_file) as f:
    combined_apis = json.load(f)

combined_apis.extend(new_apis)

with open(combined_file, 'w') as f:
    json.dump(combined_apis, f, indent=2)

print(f"Updated combined file: {len(combined_apis)} total APIs")
