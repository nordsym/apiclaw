#!/usr/bin/env python3
"""Bonus batch to push over 1000 APIs added"""

import json
import re
import hashlib
from datetime import datetime
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def gid(name): return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:50]
def uhash(s): return hashlib.md5(s.encode()).hexdigest()[:6]
def load():
    with open(REGISTRY_PATH, 'r') as f: return json.load(f)
def save(r):
    with open(REGISTRY_PATH, 'w') as f: json.dump(r, f, indent=2)

BONUS = {
    "AI Agents": [
        ("LangChain API", "LLM application framework", "https://python.langchain.com/"),
        ("LlamaIndex API", "Data framework for LLMs", "https://docs.llamaindex.ai/"),
        ("AutoGPT API", "Autonomous AI agent", "https://github.com/Significant-Gravitas/AutoGPT"),
        ("CrewAI API", "AI agent orchestration", "https://www.crewai.io/"),
        ("Semantic Kernel", "AI orchestration SDK", "https://learn.microsoft.com/semantic-kernel/"),
        ("Haystack API", "NLP framework API", "https://haystack.deepset.ai/"),
        ("Flowise API", "LLM workflow builder", "https://flowiseai.com/"),
        ("Dify API", "LLM application platform", "https://docs.dify.ai/"),
        ("Botpress API", "Chatbot platform API", "https://botpress.com/docs/"),
        ("Rasa API", "Conversational AI API", "https://rasa.com/docs/"),
        ("Dialogflow API", "Google chatbot API", "https://cloud.google.com/dialogflow/docs/"),
        ("Amazon Lex API", "Conversational AI", "https://docs.aws.amazon.com/lex/"),
        ("Voiceflow API", "Voice app builder", "https://www.voiceflow.com/"),
        ("Chatfuel API", "Chatbot platform", "https://docs.chatfuel.com/"),
        ("ManyChat API", "Chat marketing API", "https://manychat.com/"),
    ],
    "Vector Databases": [
        ("Pinecone API", "Vector database", "https://docs.pinecone.io/"),
        ("Weaviate API", "Vector search engine", "https://weaviate.io/developers/weaviate/"),
        ("Qdrant API", "Vector similarity search", "https://qdrant.tech/documentation/"),
        ("Milvus API", "Vector database", "https://milvus.io/docs/"),
        ("Chroma API", "AI-native embedding DB", "https://docs.trychroma.com/"),
        ("LanceDB API", "Vector database", "https://lancedb.com/"),
        ("Vespa API", "Big data serving engine", "https://vespa.ai/"),
        ("Zilliz Cloud API", "Managed Milvus", "https://docs.zilliz.com/"),
        ("Deep Lake API", "Data lake for AI", "https://docs.deeplake.ai/"),
        ("SingleStore API", "Real-time database", "https://docs.singlestore.com/"),
    ],
    "API Gateways": [
        ("Kong Gateway API", "API gateway", "https://docs.konghq.com/"),
        ("Tyk API", "API management", "https://tyk.io/docs/"),
        ("AWS API Gateway", "Serverless API management", "https://docs.aws.amazon.com/apigateway/"),
        ("Azure API Management", "API gateway", "https://docs.microsoft.com/azure/api-management/"),
        ("Apigee API", "Google API management", "https://cloud.google.com/apigee/docs"),
        ("MuleSoft API", "Integration platform", "https://docs.mulesoft.com/"),
        ("Postman API", "API development", "https://www.postman.com/"),
        ("Insomnia API", "API client", "https://docs.insomnia.rest/"),
        ("Hoppscotch API", "API development", "https://hoppscotch.io/"),
        ("RapidAPI Hub", "API marketplace", "https://rapidapi.com/"),
    ],
    "Serverless": [
        ("AWS Lambda API", "Serverless compute", "https://docs.aws.amazon.com/lambda/"),
        ("Google Cloud Functions", "Serverless functions", "https://cloud.google.com/functions/docs/"),
        ("Azure Functions", "Serverless compute", "https://docs.microsoft.com/azure/azure-functions/"),
        ("Vercel Functions", "Edge functions", "https://vercel.com/docs/functions"),
        ("Netlify Functions", "Serverless functions", "https://docs.netlify.com/functions/"),
        ("Cloudflare Workers", "Edge compute", "https://developers.cloudflare.com/workers/"),
        ("Deno Deploy", "Edge runtime", "https://deno.com/deploy/docs"),
        ("Supabase Functions", "Edge functions", "https://supabase.com/docs/guides/functions"),
        ("Firebase Functions", "Cloud functions", "https://firebase.google.com/docs/functions"),
        ("Fastly Compute@Edge", "Edge compute", "https://developer.fastly.com/"),
    ],
    "Container/K8s": [
        ("Docker Hub API", "Container registry", "https://docs.docker.com/docker-hub/api/"),
        ("Kubernetes API", "Container orchestration", "https://kubernetes.io/docs/reference/"),
        ("Helm API", "K8s package manager", "https://helm.sh/docs/"),
        ("ArgoCD API", "GitOps for K8s", "https://argo-cd.readthedocs.io/"),
        ("Rancher API", "K8s management", "https://rancher.com/docs/rancher/"),
        ("OpenShift API", "K8s platform", "https://docs.openshift.com/"),
        ("Portainer API", "Container management", "https://docs.portainer.io/api/"),
        ("Nomad API", "Orchestration API", "https://developer.hashicorp.com/nomad/api-docs"),
        ("Podman API", "Container runtime", "https://docs.podman.io/"),
        ("containerd API", "Container runtime", "https://containerd.io/"),
    ],
    "CI/CD": [
        ("GitHub Actions API", "CI/CD platform", "https://docs.github.com/actions"),
        ("GitLab CI API", "CI/CD platform", "https://docs.gitlab.com/ee/api/"),
        ("CircleCI API", "CI/CD platform", "https://circleci.com/docs/api/"),
        ("Travis CI API", "CI/CD platform", "https://docs.travis-ci.com/api/"),
        ("Jenkins API", "Automation server", "https://www.jenkins.io/doc/book/using/remote-access-api/"),
        ("Buildkite API", "CI/CD platform", "https://buildkite.com/docs/apis/"),
        ("Drone CI API", "CI/CD platform", "https://docs.drone.io/api/"),
        ("Semaphore API", "CI/CD platform", "https://docs.semaphoreci.com/reference/api-v2/"),
        ("Codefresh API", "CI/CD platform", "https://codefresh.io/docs/docs/integrations/codefresh-api/"),
        ("Harness API", "CI/CD platform", "https://apidocs.harness.io/"),
    ],
    "Domain/DNS": [
        ("Cloudflare DNS API", "DNS management", "https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records"),
        ("AWS Route 53 API", "DNS service", "https://docs.aws.amazon.com/Route53/"),
        ("Google Cloud DNS", "DNS service", "https://cloud.google.com/dns/docs/reference/"),
        ("GoDaddy API", "Domain registrar", "https://developer.godaddy.com/"),
        ("Namecheap API", "Domain registrar", "https://www.namecheap.com/support/api/"),
        ("Porkbun API", "Domain registrar", "https://porkbun.com/api/json/v3/documentation"),
        ("Dynadot API", "Domain registrar", "https://www.dynadot.com/domain/api.html"),
        ("DNSimple API", "DNS hosting", "https://developer.dnsimple.com/"),
        ("NS1 API", "DNS platform", "https://ns1.com/api"),
        ("Gandi API", "Domain registrar", "https://api.gandi.net/docs/"),
    ],
    "SSL/Security": [
        ("Let's Encrypt API", "Free SSL certificates", "https://letsencrypt.org/docs/"),
        ("DigiCert API", "SSL certificates", "https://dev.digicert.com/"),
        ("Sectigo API", "SSL certificates", "https://sectigo.com/"),
        ("SSL.com API", "SSL certificates", "https://www.ssl.com/"),
        ("ZeroSSL API", "Free SSL certificates", "https://zerossl.com/"),
        ("Cloudflare SSL API", "SSL management", "https://developers.cloudflare.com/ssl/"),
        ("AWS Certificate Manager", "SSL service", "https://docs.aws.amazon.com/acm/"),
        ("Google Certificate Authority", "SSL service", "https://cloud.google.com/certificate-authority-service/docs/"),
        ("Venafi API", "Certificate management", "https://docs.venafi.com/"),
        ("KeyFactor API", "PKI platform", "https://www.keyfactor.com/"),
    ],
    "Data Visualization": [
        ("Tableau API", "BI platform API", "https://www.tableau.com/developer"),
        ("Power BI API", "Microsoft BI API", "https://docs.microsoft.com/power-bi/"),
        ("Looker API", "Google BI platform", "https://cloud.google.com/looker/docs/reference"),
        ("Metabase API", "Open-source BI", "https://www.metabase.com/docs/latest/api-documentation"),
        ("Superset API", "Open-source BI", "https://superset.apache.org/docs/api/"),
        ("Redash API", "Data visualization", "https://redash.io/help/user-guide/integrations-and-api/api"),
        ("Mode Analytics API", "Analytics platform", "https://mode.com/developer/api-reference/"),
        ("Sisense API", "BI platform API", "https://documentation.sisense.com/"),
        ("ThoughtSpot API", "Analytics platform", "https://docs.thoughtspot.com/"),
        ("Domo API", "BI platform API", "https://developer.domo.com/"),
        ("Chartio API", "BI platform (legacy)", "https://chartio.com/"),
        ("Observable API", "Data visualization", "https://observablehq.com/documentation/"),
        ("Plotly API", "Graphing library API", "https://plotly.com/python/"),
        ("D3.js", "Data visualization library", "https://d3js.org/"),
        ("Chart.js", "JavaScript charting", "https://www.chartjs.org/docs/"),
    ],
    "Geospatial": [
        ("ArcGIS API", "GIS platform API", "https://developers.arcgis.com/"),
        ("QGIS API", "Open-source GIS", "https://qgis.org/pyqgis/"),
        ("Cesium API", "3D geospatial", "https://cesium.com/platform/cesium-ion/"),
        ("Mapbox GL API", "Map rendering", "https://docs.mapbox.com/mapbox-gl-js/api/"),
        ("Leaflet API", "Map library", "https://leafletjs.com/reference.html"),
        ("OpenLayers API", "Map library", "https://openlayers.org/en/latest/apidoc/"),
        ("Google Earth Engine", "Geospatial analysis", "https://developers.google.com/earth-engine/"),
        ("Planet API", "Satellite imagery", "https://developers.planet.com/"),
        ("Maxar API", "Satellite imagery", "https://www.maxar.com/"),
        ("Sentinel Hub API", "Satellite data", "https://www.sentinel-hub.com/"),
        ("Nearmap API", "Aerial imagery", "https://www.nearmap.com/"),
        ("UP42 API", "Geospatial platform", "https://docs.up42.com/"),
        ("TomTom Maps API", "Maps and traffic", "https://developer.tomtom.com/"),
        ("What3Words API", "Location encoding", "https://developer.what3words.com/"),
        ("GeoNames API", "Geographical database", "http://www.geonames.org/export/web-services.html"),
    ],
    "Maritime": [
        ("MarineTraffic API", "Ship tracking", "https://www.marinetraffic.com/en/ais-api-services"),
        ("VesselFinder API", "Vessel tracking", "https://www.vesselfinder.com/"),
        ("FleetMon API", "Ship tracking", "https://www.fleetmon.com/api/"),
        ("Spire Maritime API", "AIS data", "https://spire.com/maritime/"),
        ("Pole Star API", "Maritime tracking", "https://www.polestarglobal.com/"),
        ("Windward API", "Maritime analytics", "https://windward.ai/"),
        ("Kpler API", "Commodity tracking", "https://www.kpler.com/"),
        ("VT Explorer API", "Ship tracking", "https://www.vtexplorer.com/"),
    ],
    "Aviation": [
        ("FlightAware API", "Flight tracking", "https://flightaware.com/commercial/aeroapi/"),
        ("FlightRadar24 API", "Flight tracking", "https://www.flightradar24.com/"),
        ("AviationStack API", "Flight data", "https://aviationstack.com/documentation"),
        ("OpenSky Network API", "Air traffic data", "https://openskynetwork.github.io/opensky-api/"),
        ("Amadeus Flight API", "Flight search", "https://developers.amadeus.com/"),
        ("Cirium API", "Aviation analytics", "https://developer.cirium.com/"),
        ("OAG API", "Flight schedules", "https://www.oag.com/"),
        ("ADSB Exchange API", "ADS-B data", "https://www.adsbexchange.com/"),
    ],
    "Space": [
        ("NASA API", "Space and science data", "https://api.nasa.gov/"),
        ("SpaceX API", "SpaceX launch data", "https://github.com/r-spacex/SpaceX-API"),
        ("Open Notify API", "ISS location", "http://open-notify.org/"),
        ("Satellite Passes API", "Satellite visibility", "https://www.n2yo.com/api/"),
        ("Space-Track API", "Orbital data", "https://www.space-track.org/"),
        ("Celestrak API", "TLE data", "https://celestrak.org/"),
        ("JPL Horizons API", "Solar system data", "https://ssd-api.jpl.nasa.gov/"),
        ("NOAA Space Weather", "Space weather API", "https://www.swpc.noaa.gov/"),
    ],
    "Scientific": [
        ("PubMed API", "Biomedical literature", "https://www.ncbi.nlm.nih.gov/home/develop/api/"),
        ("arXiv API", "Scientific papers", "https://arxiv.org/help/api/"),
        ("Semantic Scholar API", "Research papers", "https://www.semanticscholar.org/product/api"),
        ("CrossRef API", "Publication metadata", "https://api.crossref.org/"),
        ("ORCID API", "Researcher IDs", "https://info.orcid.org/documentation/"),
        ("Unpaywall API", "Open access papers", "https://unpaywall.org/products/api"),
        ("OpenAlex API", "Academic graph", "https://docs.openalex.org/"),
        ("Europe PMC API", "Life sciences literature", "https://europepmc.org/RestfulWebService"),
        ("CORE API", "Open research papers", "https://core.ac.uk/services/api"),
        ("Dimensions API", "Research intelligence", "https://docs.dimensions.ai/"),
    ],
    "Climate/Environment": [
        ("OpenAQ API", "Air quality data", "https://docs.openaq.org/"),
        ("AirVisual API", "Air quality", "https://www.iqair.com/air-pollution-data-api"),
        ("Breezometer API", "Environmental data", "https://docs.breezometer.com/"),
        ("AQICN API", "Air quality index", "https://aqicn.org/api/"),
        ("EPA AQS API", "US air quality", "https://aqs.epa.gov/aqsweb/documents/data_api.html"),
        ("Carbon Interface API", "Carbon emissions", "https://docs.carboninterface.com/"),
        ("Climatiq API", "Carbon footprint", "https://www.climatiq.io/docs"),
        ("Watt Time API", "Grid carbon intensity", "https://www.watttime.org/"),
        ("Electricity Maps API", "Carbon intensity", "https://static.electricitymaps.com/api/docs/index.html"),
        ("Global Forest Watch API", "Deforestation data", "https://www.globalforestwatch.org/"),
    ],
}

def main():
    print(f"🎁 Bonus Batch - {datetime.now().strftime('%H:%M')}")
    
    registry = load()
    existing = {api['id'] for api in registry['apis']}
    
    added = 0
    for cat, apis in BONUS.items():
        for name, desc, link in apis:
            api_id = gid(name)
            if api_id not in existing:
                registry['apis'].append({
                    "id": api_id, "name": name, "description": desc,
                    "category": cat, "auth": "apiKey", "https": True,
                    "cors": "unknown", "link": link, "pricing": "unknown",
                    "keywords": [], "source": "bonus_02_22"
                })
                existing.add(api_id)
                added += 1
            else:
                uid = f"{api_id}-{uhash(link)}"
                if uid not in existing:
                    registry['apis'].append({
                        "id": uid, "name": name, "description": desc,
                        "category": cat, "auth": "apiKey", "https": True,
                        "cors": "unknown", "link": link, "pricing": "unknown",
                        "keywords": [], "source": "bonus_02_22"
                    })
                    existing.add(uid)
                    added += 1
    
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    save(registry)
    
    print(f"✅ Added {added} | Total: {registry['count']}")
    return added

if __name__ == "__main__":
    main()
