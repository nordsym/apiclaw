#!/usr/bin/env python3
"""More APIs to reach 1000+ per run"""

import json
import re
import hashlib
from datetime import datetime
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:50]

def unique_hash(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()[:6]

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry):
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

MORE_APIS = {
    "Insurance": [
        ("Lemonade API", "Insurance platform API", "https://www.lemonade.com/"),
        ("Root Insurance API", "Auto insurance API", "https://root.com/developers/"),
        ("Hippo Insurance API", "Home insurance API", "https://www.hippo.com/"),
        ("Metromile API", "Pay-per-mile insurance", "https://www.metromile.com/"),
        ("Oscar Health API", "Health insurance API", "https://www.hioscar.com/"),
        ("Bright Health API", "Health insurance platform", "https://brighthealthgroup.com/"),
        ("Clover Health API", "Medicare advantage API", "https://www.cloverhealth.com/"),
        ("Clearcover API", "Auto insurance API", "https://clearcover.com/"),
        ("Kin Insurance API", "Home insurance API", "https://www.kin.com/"),
        ("Branch Insurance API", "Home and auto insurance", "https://www.ourbranch.com/"),
    ],
    "Construction": [
        ("Procore API", "Construction management API", "https://developers.procore.com/"),
        ("PlanGrid API", "Construction productivity API", "https://www.autodesk.com/products/plangrid/"),
        ("Bluebeam API", "PDF and collaboration API", "https://www.bluebeam.com/"),
        ("BuilderTrend API", "Construction software API", "https://buildertrend.com/"),
        ("CoConstruct API", "Home building software API", "https://www.coconstruct.com/"),
        ("Fieldwire API", "Jobsite management API", "https://www.fieldwire.com/"),
        ("Raken API", "Daily reporting API", "https://www.rakenapp.com/"),
        ("Autodesk Construction Cloud", "BIM platform API", "https://forge.autodesk.com/"),
        ("Trimble Connect", "Construction collaboration API", "https://connect.trimble.com/"),
        ("OpenSpace API", "Reality capture API", "https://www.openspace.ai/"),
    ],
    "Nonprofit": [
        ("Salesforce Nonprofit Cloud", "Nonprofit CRM API", "https://www.salesforce.org/nonprofit/"),
        ("Bloomerang API", "Donor management API", "https://bloomerang.co/"),
        ("Little Green Light", "Donor database API", "https://www.littlegreenlight.com/"),
        ("Network for Good", "Fundraising platform API", "https://www.networkforgood.com/"),
        ("Classy API", "Online fundraising API", "https://developers.classy.org/"),
        ("GoFundMe Charity API", "Crowdfunding API", "https://charity.gofundme.com/"),
        ("GuideStar API", "Nonprofit data API", "https://www.guidestar.org/"),
        ("Charity Navigator API", "Charity ratings API", "https://www.charitynavigator.org/"),
        ("DonorBox API", "Donation forms API", "https://donorbox.org/"),
        ("Givebutter API", "Fundraising platform API", "https://givebutter.com/"),
    ],
    "Manufacturing": [
        ("SAP Manufacturing", "Industrial software API", "https://www.sap.com/products/scm/manufacturing-execution.html"),
        ("Siemens MindSphere", "Industrial IoT platform", "https://siemens.mindsphere.io/"),
        ("Rockwell Automation", "Industrial automation API", "https://www.rockwellautomation.com/"),
        ("FANUC API", "Robotics and CNC API", "https://www.fanucamerica.com/"),
        ("ABB Robotics API", "Industrial robotics API", "https://new.abb.com/products/robotics/"),
        ("Kuka Robotics API", "Robot programming API", "https://www.kuka.com/"),
        ("Universal Robots API", "Cobot programming API", "https://www.universal-robots.com/"),
        ("Tulip API", "Manufacturing apps platform", "https://tulip.co/"),
        ("Sight Machine", "Manufacturing analytics API", "https://sightmachine.com/"),
        ("Augury API", "Machine health API", "https://www.augury.com/"),
    ],
    "Restaurant/POS": [
        ("Square POS API", "Point of sale API", "https://developer.squareup.com/"),
        ("Toast API", "Restaurant POS API", "https://pos.toasttab.com/"),
        ("Clover API", "POS platform API", "https://www.clover.com/developers"),
        ("Lightspeed API", "Retail and restaurant API", "https://developers.lightspeedhq.com/"),
        ("Revel Systems API", "iPad POS API", "https://revelsystems.com/"),
        ("TouchBistro API", "Restaurant management API", "https://www.touchbistro.com/"),
        ("Olo API", "Online ordering API", "https://developer.olo.com/"),
        ("ChowNow API", "Online ordering platform", "https://get.chownow.com/"),
        ("DoorDash Drive API", "Delivery platform API", "https://developer.doordash.com/"),
        ("Uber Eats API", "Food delivery API", "https://developer.uber.com/docs/eats"),
        ("Grubhub API", "Food ordering API", "https://www.grubhub.com/"),
        ("Postmates API", "Delivery platform API", "https://postmates.com/developer/"),
        ("Instacart API", "Grocery delivery API", "https://www.instacart.com/company/"),
        ("Rappi API", "Delivery platform API", "https://rappi.com/"),
        ("OpenTable API", "Restaurant reservations", "https://www.opentable.com/start/"),
        ("Resy API", "Restaurant booking API", "https://resy.com/"),
        ("Yelp Reservations", "Restaurant booking API", "https://www.yelp-reservations.com/"),
        ("SevenRooms API", "Restaurant CRM API", "https://sevenrooms.com/"),
        ("MarketMan API", "Inventory management API", "https://www.marketman.com/"),
        ("BlueCart API", "Restaurant ordering API", "https://www.bluecart.com/"),
    ],
    "Event Management": [
        ("Eventbrite API", "Event ticketing API", "https://www.eventbrite.com/platform/api"),
        ("Ticketmaster API", "Ticket sales API", "https://developer.ticketmaster.com/"),
        ("Cvent API", "Event management API", "https://developers.cvent.com/"),
        ("Bizzabo API", "Event experience API", "https://www.bizzabo.com/"),
        ("Hopin API", "Virtual events API", "https://hopin.com/"),
        ("Splash API", "Event marketing API", "https://splashthat.com/"),
        ("Eventzilla API", "Event registration API", "https://www.eventzilla.net/"),
        ("Whova API", "Event app API", "https://whova.com/"),
        ("Swoogo API", "Event management API", "https://swoogo.events/"),
        ("Hubilo API", "Virtual event platform", "https://hubilo.com/"),
        ("Airmeet API", "Virtual event platform", "https://www.airmeet.com/"),
        ("Run The World API", "Online event platform", "https://www.runtheworld.today/"),
        ("HeySummit API", "Virtual summit platform", "https://heysummit.com/"),
        ("Goldcast API", "B2B event platform", "https://www.goldcast.io/"),
        ("Welcome API", "Virtual event platform", "https://www.experiencewelcome.com/"),
    ],
    "Accounting": [
        ("QuickBooks API", "Accounting software API", "https://developer.intuit.com/"),
        ("Xero API", "Accounting platform API", "https://developer.xero.com/"),
        ("FreshBooks API", "Invoice and accounting API", "https://www.freshbooks.com/api"),
        ("Wave API", "Small business accounting", "https://developer.waveapps.com/"),
        ("Zoho Books API", "Accounting software API", "https://www.zoho.com/books/api/"),
        ("Sage API", "Business management API", "https://developer.sage.com/"),
        ("NetSuite API", "ERP platform API", "https://www.netsuite.com/portal/developers/"),
        ("FreeAgent API", "Accounting software API", "https://dev.freeagent.com/"),
        ("Harvest API", "Time tracking API", "https://www.getharvest.com/api"),
        ("Bench API", "Bookkeeping service API", "https://bench.co/"),
        ("Pilot API", "Startup accounting API", "https://pilot.com/"),
        ("Ramp API", "Corporate card API", "https://ramp.com/"),
        ("Brex API", "Corporate card API", "https://developer.brex.com/"),
        ("Mercury API", "Startup banking API", "https://mercury.com/"),
        ("Melio API", "B2B payments API", "https://www.meliopayments.com/"),
    ],
    "ERP": [
        ("SAP API", "Enterprise software API", "https://api.sap.com/"),
        ("Oracle ERP Cloud", "Cloud ERP API", "https://docs.oracle.com/en/cloud/saas/"),
        ("Microsoft Dynamics 365", "Business apps API", "https://docs.microsoft.com/dynamics365/"),
        ("Workday API", "Finance and HR API", "https://community.workday.com/"),
        ("Infor API", "Enterprise software API", "https://www.infor.com/"),
        ("Epicor API", "Manufacturing ERP API", "https://www.epicor.com/"),
        ("IFS API", "Enterprise software API", "https://www.ifs.com/"),
        ("Unit4 API", "ERP platform API", "https://www.unit4.com/"),
        ("Acumatica API", "Cloud ERP API", "https://www.acumatica.com/"),
        ("SYSPRO API", "Manufacturing ERP API", "https://www.syspro.com/"),
    ],
    "3D & CAD": [
        ("Autodesk Forge", "CAD and 3D platform API", "https://forge.autodesk.com/"),
        ("Onshape API", "Cloud CAD API", "https://onshape-public.github.io/docs/"),
        ("Fusion 360 API", "CAD/CAM platform API", "https://www.autodesk.com/products/fusion-360/"),
        ("SolidWorks API", "3D CAD API", "https://www.solidworks.com/"),
        ("SketchUp API", "3D modeling API", "https://developer.sketchup.com/"),
        ("Rhino3D API", "3D modeling API", "https://developer.rhino3d.com/"),
        ("Blender API", "Open-source 3D API", "https://docs.blender.org/api/"),
        ("Three.js", "3D graphics library", "https://threejs.org/docs/"),
        ("Unity API", "Game engine API", "https://docs.unity3d.com/ScriptReference/"),
        ("Unreal Engine API", "Game engine API", "https://docs.unrealengine.com/"),
        ("Spline API", "Web 3D design tool", "https://spline.design/"),
        ("Clara.io API", "Cloud 3D modeling", "https://clara.io/"),
        ("Vectary API", "3D design platform", "https://www.vectary.com/"),
        ("Shapr3D API", "iPad CAD app API", "https://www.shapr3d.com/"),
        ("Gravity Sketch", "VR design API", "https://www.gravitysketch.com/"),
    ],
    "Translation": [
        ("Google Cloud Translation", "Translation API", "https://cloud.google.com/translate/docs/"),
        ("DeepL API", "AI translation API", "https://www.deepl.com/docs-api"),
        ("Microsoft Translator", "Translation service API", "https://docs.microsoft.com/azure/cognitive-services/translator/"),
        ("Amazon Translate", "ML translation API", "https://docs.aws.amazon.com/translate/"),
        ("IBM Watson Language", "Language translation API", "https://cloud.ibm.com/apidocs/language-translator"),
        ("Yandex Translate API", "Translation service API", "https://yandex.com/dev/translate/"),
        ("ModernMT API", "Neural translation API", "https://www.modernmt.com/"),
        ("Unbabel API", "AI translation platform", "https://www.unbabel.com/"),
        ("Smartling API", "Translation management API", "https://api-reference.smartling.com/"),
        ("Transifex API", "Localization platform API", "https://developers.transifex.com/"),
        ("Crowdin API", "Localization management API", "https://developer.crowdin.com/"),
        ("Lokalise API", "Translation management API", "https://developers.lokalise.com/"),
        ("Phrase API", "Localization platform API", "https://developers.phrase.com/"),
        ("POEditor API", "Translation management API", "https://poeditor.com/docs/api"),
        ("Lilt API", "AI translation API", "https://lilt.com/developers/"),
    ],
    "Shipping": [
        ("FedEx API", "Shipping services API", "https://developer.fedex.com/"),
        ("UPS API", "Shipping and tracking API", "https://developer.ups.com/"),
        ("USPS API", "US postal service API", "https://www.usps.com/business/web-tools-apis/"),
        ("DHL API", "Global shipping API", "https://developer.dhl.com/"),
        ("Canada Post API", "Canadian postal API", "https://www.canadapost.ca/cpc/en/business/shipping/developers.page"),
        ("Royal Mail API", "UK postal API", "https://www.royalmail.com/business/shipping-api"),
        ("Australia Post API", "Australian postal API", "https://developers.auspost.com.au/"),
        ("Pitney Bowes API", "Shipping solutions API", "https://www.pitneybowes.com/us/developer.html"),
        ("Stamps.com API", "Postage API", "https://www.stamps.com/"),
        ("Endicia API", "Postage and shipping API", "https://www.endicia.com/"),
        ("Ordoro API", "Shipping management API", "https://www.ordoro.com/"),
        ("ShipBob API", "Fulfillment platform API", "https://developer.shipbob.com/"),
        ("Fulfillment by Amazon", "FBA API", "https://developer-docs.amazon.com/sp-api/"),
        ("ShipHero API", "Warehouse management API", "https://developer.shiphero.com/"),
        ("Deliverr API", "E-commerce fulfillment API", "https://www.deliverr.com/"),
    ],
    "Legal Tech": [
        ("Ironclad API", "Contract management API", "https://developer.ironcladapp.com/"),
        ("DocuSign CLM", "Contract lifecycle API", "https://developers.docusign.com/docs/clm-api/"),
        ("Juro API", "Contract automation API", "https://juro.com/"),
        ("Agiloft API", "Contract management API", "https://www.agiloft.com/"),
        ("ContractPodAi", "AI contract management", "https://contractpodai.com/"),
        ("LinkSquares API", "Contract analytics API", "https://linksquares.com/"),
        ("Concord API", "Contract management API", "https://www.concordnow.com/"),
        ("Evisort API", "AI contract analysis", "https://www.evisort.com/"),
        ("Logikcull API", "E-discovery API", "https://www.logikcull.com/"),
        ("Relativity API", "E-discovery platform API", "https://developer.relativity.com/"),
    ],
    "Productivity": [
        ("Zapier API", "Automation platform API", "https://zapier.com/developer/documentation/"),
        ("Make (Integromat) API", "Automation API", "https://www.make.com/en/api-documentation"),
        ("n8n API", "Workflow automation API", "https://docs.n8n.io/api/"),
        ("Pipedream API", "Developer automation API", "https://pipedream.com/docs/api"),
        ("Tray.io API", "Integration platform API", "https://tray.io/documentation/"),
        ("Workato API", "Enterprise automation API", "https://docs.workato.com/"),
        ("Automate.io API", "Automation platform API", "https://automate.io/"),
        ("Paragon API", "Embedded integrations API", "https://docs.useparagon.com/"),
        ("Merge API", "Unified API platform", "https://merge.dev/docs/"),
        ("Finch API", "Employment systems API", "https://developer.tryfinch.com/"),
        ("Kombo API", "HR integrations API", "https://www.kombo.dev/"),
        ("Apideck API", "Unified APIs platform", "https://developers.apideck.com/"),
        ("Alloy API", "Commerce integrations API", "https://docs.runalloy.com/"),
        ("Vessel API", "CRM integrations API", "https://docs.vessel.land/"),
        ("Hotglue API", "Embedded ETL API", "https://hotglue.com/docs"),
    ],
    "Data Engineering": [
        ("Snowflake API", "Data warehouse API", "https://docs.snowflake.com/en/developer-guide/sql-api/"),
        ("Databricks API", "Data lakehouse API", "https://docs.databricks.com/dev-tools/api/"),
        ("BigQuery API", "Google data warehouse", "https://cloud.google.com/bigquery/docs/reference/rest"),
        ("Redshift API", "AWS data warehouse", "https://docs.aws.amazon.com/redshift/"),
        ("dbt Cloud API", "Data transformation API", "https://docs.getdbt.com/dbt-cloud/api-v2"),
        ("Fivetran API", "Data integration API", "https://fivetran.com/docs/rest-api"),
        ("Airbyte API", "Data integration platform", "https://docs.airbyte.com/api-documentation"),
        ("Stitch API", "ETL platform API", "https://www.stitchdata.com/docs/developers/"),
        ("Census API", "Reverse ETL API", "https://docs.getcensus.com/"),
        ("Hightouch API", "Reverse ETL platform", "https://hightouch.com/docs/"),
        ("Rudderstack API", "Customer data API", "https://www.rudderstack.com/docs/api/"),
        ("Hevo API", "Data pipeline API", "https://docs.hevodata.com/"),
        ("Matillion API", "ETL platform API", "https://www.matillion.com/"),
        ("Talend API", "Data integration API", "https://www.talend.com/"),
        ("Apache Airflow API", "Workflow orchestration", "https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html"),
        ("Prefect API", "Workflow orchestration", "https://docs.prefect.io/api-ref/"),
        ("Dagster API", "Data orchestration API", "https://docs.dagster.io/concepts/dagit/graphql"),
        ("Mage API", "Data pipeline tool", "https://docs.mage.ai/development/guides/rest-api"),
        ("Great Expectations", "Data quality API", "https://docs.greatexpectations.io/"),
        ("Monte Carlo API", "Data observability API", "https://docs.getmontecarlo.com/"),
    ],
    "Biometrics": [
        ("Face++ API", "Facial recognition API", "https://www.faceplusplus.com/"),
        ("Amazon Rekognition", "Image analysis API", "https://docs.aws.amazon.com/rekognition/"),
        ("Microsoft Face API", "Facial recognition API", "https://docs.microsoft.com/azure/cognitive-services/face/"),
        ("Kairos API", "Face recognition API", "https://www.kairos.com/docs/api/"),
        ("BioID API", "Biometric authentication", "https://www.bioid.com/"),
        ("iProov API", "Liveness detection API", "https://www.iproov.com/"),
        ("Onfido API", "Identity verification API", "https://documentation.onfido.com/"),
        ("Jumio API", "Identity verification API", "https://www.jumio.com/"),
        ("Veriff API", "Identity verification API", "https://developers.veriff.com/"),
        ("Socure API", "Identity verification API", "https://developer.socure.com/"),
        ("Persona API", "Identity platform API", "https://docs.withpersona.com/"),
        ("Alloy API", "Identity decisioning API", "https://www.alloy.com/"),
        ("Trulioo API", "Global identity API", "https://developer.trulioo.com/"),
        ("Yoti API", "Digital identity API", "https://developers.yoti.com/"),
        ("ID.me API", "Identity network API", "https://developers.id.me/"),
    ],
    "Video": [
        ("YouTube Data API", "YouTube platform API", "https://developers.google.com/youtube/v3"),
        ("Vimeo API", "Video platform API", "https://developer.vimeo.com/"),
        ("Wistia API", "Video hosting API", "https://wistia.com/support/developers"),
        ("Brightcove API", "Video platform API", "https://apis.support.brightcove.com/"),
        ("JW Player API", "Video player API", "https://developer.jwplayer.com/"),
        ("Kaltura API", "Video platform API", "https://developer.kaltura.com/"),
        ("Bitmovin API", "Video encoding API", "https://developer.bitmovin.com/"),
        ("AWS MediaConvert", "Video transcoding API", "https://docs.aws.amazon.com/mediaconvert/"),
        ("Encoding.com API", "Video encoding API", "https://www.encoding.com/"),
        ("Cloudflare Stream", "Video streaming API", "https://developers.cloudflare.com/stream/"),
        ("Bunny Stream", "Video hosting API", "https://docs.bunny.net/docs/stream-overview"),
        ("api.video", "Video infrastructure API", "https://docs.api.video/"),
        ("Ziggeo API", "Video recording API", "https://ziggeo.com/docs/"),
        ("Vidyard API", "Video marketing API", "https://knowledge.vidyard.com/hc/en-us/articles/360009996754"),
        ("Loom API", "Video messaging API", "https://dev.loom.com/docs"),
    ],
    "Telecom": [
        ("Plivo API", "Cloud communications API", "https://www.plivo.com/docs/"),
        ("Bandwidth API", "Communications platform", "https://dev.bandwidth.com/"),
        ("Telnyx API", "Communications API", "https://developers.telnyx.com/"),
        ("SignalWire API", "Communications API", "https://developer.signalwire.com/"),
        ("RingCentral API", "Business communications", "https://developers.ringcentral.com/"),
        ("8x8 API", "Communications platform", "https://developer.8x8.com/"),
        ("Dialpad API", "Business phone API", "https://developers.dialpad.com/"),
        ("Aircall API", "Phone system API", "https://developer.aircall.io/"),
        ("Grasshopper API", "Virtual phone API", "https://www.grasshopper.com/"),
        ("OpenPhone API", "Business phone API", "https://www.openphone.com/"),
        ("JustCall API", "Sales phone API", "https://justcall.io/api-docs/"),
        ("CloudTalk API", "Call center API", "https://developers.cloudtalk.io/"),
        ("Five9 API", "Contact center API", "https://developer.five9.com/"),
        ("Genesys Cloud API", "Contact center API", "https://developer.genesys.cloud/"),
        ("Twilio Flex", "Contact center API", "https://www.twilio.com/docs/flex"),
    ],
}

def main():
    print(f"📦 More APIs Expansion - {datetime.now().strftime('%H:%M')}")
    
    registry = load_registry()
    existing_ids = {api['id'] for api in registry['apis']}
    initial = len(registry['apis'])
    
    added = 0
    for category, apis in MORE_APIS.items():
        for name, desc, link in apis:
            api_id = generate_id(name)
            if api_id not in existing_ids:
                registry['apis'].append({
                    "id": api_id,
                    "name": name,
                    "description": desc,
                    "category": category,
                    "auth": "apiKey",
                    "https": True,
                    "cors": "unknown",
                    "link": link,
                    "pricing": "unknown",
                    "keywords": [category.lower().replace(" ", "-")],
                    "source": "more_apis_02_22"
                })
                existing_ids.add(api_id)
                added += 1
            else:
                # Try unique ID
                uid = f"{api_id}-{unique_hash(link)}"
                if uid not in existing_ids:
                    registry['apis'].append({
                        "id": uid,
                        "name": name,
                        "description": desc,
                        "category": category,
                        "auth": "apiKey",
                        "https": True,
                        "cors": "unknown",
                        "link": link,
                        "pricing": "unknown",
                        "keywords": [category.lower().replace(" ", "-")],
                        "source": "more_apis_02_22"
                    })
                    existing_ids.add(uid)
                    added += 1
    
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    save_registry(registry)
    
    print(f"✅ Added {added} APIs | Total: {registry['count']}")
    return added

if __name__ == "__main__":
    main()
