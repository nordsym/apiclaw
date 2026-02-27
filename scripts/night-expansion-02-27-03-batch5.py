#!/usr/bin/env python3
"""APIClaw Night Expansion - 2026-02-27 03:00 batch 5 - Final push"""

import json

# Science & Research APIs
SCIENCE_APIS = [
    {"name": "NASA Open APIs", "description": "Space and Earth data", "category": "Science", "authType": "apiKey", "baseUrl": "https://api.nasa.gov/"},
    {"name": "SpaceX API", "description": "SpaceX launch data", "category": "Science", "authType": "none", "baseUrl": "https://github.com/r-spacex/SpaceX-API"},
    {"name": "Launch Library 2", "description": "Space launch data", "category": "Science", "authType": "none", "baseUrl": "https://thespacedevs.com/llapi"},
    {"name": "Astronomy API", "description": "Celestial data", "category": "Science", "authType": "apiKey", "baseUrl": "https://astronomyapi.com/"},
    {"name": "Wolfram Alpha API", "description": "Computational knowledge", "category": "Science", "authType": "apiKey", "baseUrl": "https://products.wolframalpha.com/api/"},
    {"name": "arXiv API", "description": "Scientific papers", "category": "Science", "authType": "none", "baseUrl": "https://arxiv.org/help/api/"},
    {"name": "Semantic Scholar API", "description": "Academic research", "category": "Science", "authType": "apiKey", "baseUrl": "https://api.semanticscholar.org/"},
    {"name": "Crossref API", "description": "Scholarly metadata", "category": "Science", "authType": "none", "baseUrl": "https://www.crossref.org/documentation/retrieve-metadata/rest-api/"},
    {"name": "OpenAlex API", "description": "Scholarly works catalog", "category": "Science", "authType": "none", "baseUrl": "https://docs.openalex.org/"},
    {"name": "Europe PMC API", "description": "Biomedical literature", "category": "Science", "authType": "none", "baseUrl": "https://europepmc.org/RestfulWebService"},
    {"name": "ChEMBL API", "description": "Drug discovery database", "category": "Science", "authType": "none", "baseUrl": "https://www.ebi.ac.uk/chembl/api/data/docs"},
    {"name": "PubChem API", "description": "Chemical information", "category": "Science", "authType": "none", "baseUrl": "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest"},
    {"name": "UniProt API", "description": "Protein database", "category": "Science", "authType": "none", "baseUrl": "https://www.uniprot.org/help/api"},
    {"name": "Ensembl API", "description": "Genome database", "category": "Science", "authType": "none", "baseUrl": "https://rest.ensembl.org/"},
    {"name": "NCBI E-utilities", "description": "Biomedical databases", "category": "Science", "authType": "apiKey", "baseUrl": "https://www.ncbi.nlm.nih.gov/books/NBK25501/"},
    {"name": "Gene Ontology API", "description": "Gene annotation", "category": "Science", "authType": "none", "baseUrl": "http://api.geneontology.org/"},
    {"name": "Materials Project API", "description": "Materials science", "category": "Science", "authType": "apiKey", "baseUrl": "https://materialsproject.org/api"},
    {"name": "NIST Chemistry WebBook", "description": "Chemical data", "category": "Science", "authType": "none", "baseUrl": "https://webbook.nist.gov/"},
    {"name": "Mineral Database API", "description": "Mineralogy data", "category": "Science", "authType": "none", "baseUrl": "https://www.mindat.org/api.php"},
    {"name": "Open Science Framework API", "description": "Research workflow", "category": "Science", "authType": "apiKey", "baseUrl": "https://developer.osf.io/"},
]

# Government & Open Data APIs
GOVERNMENT_APIS = [
    {"name": "USAspending API", "description": "US federal spending", "category": "Government", "authType": "none", "baseUrl": "https://api.usaspending.gov/"},
    {"name": "OpenFEC API", "description": "US campaign finance", "category": "Government", "authType": "apiKey", "baseUrl": "https://api.open.fec.gov/developers/"},
    {"name": "UK Government API", "description": "UK gov data", "category": "Government", "authType": "none", "baseUrl": "https://www.api.gov.uk/"},
    {"name": "Data.gov.uk", "description": "UK open data", "category": "Government", "authType": "none", "baseUrl": "https://guidance.data.gov.uk/"},
    {"name": "Australia Government API", "description": "Australian data", "category": "Government", "authType": "none", "baseUrl": "https://data.gov.au/data/api/"},
    {"name": "Canada Government API", "description": "Canadian data", "category": "Government", "authType": "none", "baseUrl": "https://open.canada.ca/en/access-our-application-programming-interface-api"},
    {"name": "EU Data Portal API", "description": "European data", "category": "Government", "authType": "none", "baseUrl": "https://data.europa.eu/api/hub/repo/"},
    {"name": "NYC Open Data API", "description": "New York City data", "category": "Government", "authType": "none", "baseUrl": "https://opendata.cityofnewyork.us/"},
    {"name": "LA Open Data API", "description": "Los Angeles data", "category": "Government", "authType": "none", "baseUrl": "https://data.lacity.org/"},
    {"name": "Chicago Data Portal API", "description": "Chicago data", "category": "Government", "authType": "none", "baseUrl": "https://data.cityofchicago.org/"},
    {"name": "Singapore Data API", "description": "Singapore data", "category": "Government", "authType": "none", "baseUrl": "https://data.gov.sg/"},
    {"name": "Hong Kong Open Data API", "description": "HK data", "category": "Government", "authType": "none", "baseUrl": "https://data.gov.hk/en/"},
    {"name": "Japan e-Stat API", "description": "Japanese statistics", "category": "Government", "authType": "apiKey", "baseUrl": "https://www.e-stat.go.jp/en/api/"},
    {"name": "Korea Open Data API", "description": "Korean data", "category": "Government", "authType": "apiKey", "baseUrl": "https://www.data.go.kr/"},
    {"name": "India Data Gov API", "description": "Indian data", "category": "Government", "authType": "apiKey", "baseUrl": "https://data.gov.in/"},
    {"name": "Brazil Data API", "description": "Brazilian data", "category": "Government", "authType": "none", "baseUrl": "https://dados.gov.br/"},
    {"name": "France Data API", "description": "French data", "category": "Government", "authType": "none", "baseUrl": "https://www.data.gouv.fr/en/"},
    {"name": "Germany Data API", "description": "German data", "category": "Government", "authType": "none", "baseUrl": "https://www.govdata.de/"},
    {"name": "Netherlands Data API", "description": "Dutch data", "category": "Government", "authType": "none", "baseUrl": "https://data.overheid.nl/"},
    {"name": "Sweden Data API", "description": "Swedish data", "category": "Government", "authType": "none", "baseUrl": "https://www.dataportal.se/"},
]

# Printing & Manufacturing APIs
MANUFACTURING_APIS = [
    {"name": "3D Hubs API", "description": "3D printing service", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.hubs.com/"},
    {"name": "Shapeways API", "description": "3D printing marketplace", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://developers.shapeways.com/"},
    {"name": "i.materialise API", "description": "3D printing service", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://i.materialise.com/api"},
    {"name": "Sculpteo API", "description": "3D printing on demand", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.sculpteo.com/en/developers/"},
    {"name": "Ponoko API", "description": "Laser cutting service", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.ponoko.com/"},
    {"name": "Prusa Connect API", "description": "3D printer management", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://connect.prusa3d.com/"},
    {"name": "OctoPrint API", "description": "3D printer control", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://docs.octoprint.org/en/master/api/"},
    {"name": "Formlabs API", "description": "SLA 3D printers", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://formlabs.com/"},
    {"name": "Ultimaker Cloud API", "description": "3D printing cloud", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://ultimaker.com/software/ultimaker-cura/"},
    {"name": "Xometry API", "description": "On-demand manufacturing", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.xometry.com/"},
    {"name": "Protolabs API", "description": "Rapid prototyping", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.protolabs.com/"},
    {"name": "Fictiv API", "description": "Manufacturing platform", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.fictiv.com/"},
    {"name": "Mfg.com API", "description": "Manufacturing marketplace", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.mfg.com/"},
    {"name": "SendCutSend API", "description": "Laser cutting service", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://sendcutsend.com/"},
    {"name": "OSHCut API", "description": "Custom metal cutting", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.oshcut.com/"},
    {"name": "Big Blue Saw API", "description": "Water jet cutting", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.bigbluesaw.com/"},
    {"name": "PCBWay API", "description": "PCB manufacturing", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://www.pcbway.com/"},
    {"name": "JLCPCB API", "description": "PCB fabrication", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://jlcpcb.com/"},
    {"name": "OSH Park API", "description": "PCB service", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://oshpark.com/"},
    {"name": "MacroFab API", "description": "Electronics manufacturing", "category": "Manufacturing", "authType": "apiKey", "baseUrl": "https://macrofab.com/"},
]

# Ad Tech & Advertising APIs
ADTECH_APIS = [
    {"name": "Google Ads API", "description": "Google advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.google.com/google-ads/api/docs/start"},
    {"name": "Facebook Ads API", "description": "Meta advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/marketing-apis/"},
    {"name": "TikTok Ads API", "description": "TikTok advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://ads.tiktok.com/marketing_api/docs"},
    {"name": "LinkedIn Marketing API", "description": "LinkedIn ads", "category": "Advertising", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/linkedin/marketing/"},
    {"name": "Twitter Ads API", "description": "Twitter advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developer.twitter.com/en/docs/twitter-ads-api"},
    {"name": "Pinterest Ads API", "description": "Pinterest advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.pinterest.com/docs/api/v5/"},
    {"name": "Snapchat Ads API", "description": "Snapchat advertising", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.snap.com/docs/marketing-api/"},
    {"name": "Amazon Advertising API", "description": "Amazon ads", "category": "Advertising", "authType": "oauth", "baseUrl": "https://advertising.amazon.com/API/docs/en-us"},
    {"name": "Microsoft Advertising API", "description": "Bing ads", "category": "Advertising", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/advertising/guides/"},
    {"name": "Criteo API", "description": "Retargeting platform", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.criteo.com/"},
    {"name": "The Trade Desk API", "description": "Programmatic advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://www.thetradedesk.com/"},
    {"name": "AdRoll API", "description": "Retargeting platform", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developers.adroll.com/"},
    {"name": "Taboola API", "description": "Native advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developers.taboola.com/"},
    {"name": "Outbrain API", "description": "Content discovery", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://www.outbrain.com/developers/"},
    {"name": "SpotX API", "description": "Video advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developer.spotxchange.com/"},
    {"name": "AppLovin API", "description": "Mobile advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://dash.applovin.com/documentation/"},
    {"name": "Unity Ads API", "description": "Game advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://docs.unity.com/ads/"},
    {"name": "IronSource API", "description": "App monetization", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developers.is.com/"},
    {"name": "Vungle API", "description": "Mobile video ads", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://support.vungle.com/hc/en-us/categories/360002682814-API"},
    {"name": "AdColony API", "description": "Mobile advertising", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://support.adcolony.com/"},
]

# Domain & Hosting APIs
HOSTING_APIS = [
    {"name": "GoDaddy API", "description": "Domain registration", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://developer.godaddy.com/"},
    {"name": "Namecheap API", "description": "Domain services", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://www.namecheap.com/support/api/intro/"},
    {"name": "Cloudflare Registrar API", "description": "Domain management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://developers.cloudflare.com/registrar/"},
    {"name": "Name.com API", "description": "Domain services", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://www.name.com/api-docs"},
    {"name": "Gandi API", "description": "Domain registration", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://api.gandi.net/docs/"},
    {"name": "Hover API", "description": "Domain management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://www.hover.com/"},
    {"name": "DNSimple API", "description": "DNS management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://developer.dnsimple.com/"},
    {"name": "DNS Made Easy API", "description": "DNS hosting", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://api-docs.dnsmadeeasy.com/"},
    {"name": "NS1 API", "description": "DNS platform", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://ns1.com/api"},
    {"name": "Route 53 API", "description": "AWS DNS service", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/Route53/latest/APIReference/"},
    {"name": "cPanel API", "description": "Hosting control panel", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://api.docs.cpanel.net/"},
    {"name": "Plesk API", "description": "Hosting platform", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://docs.plesk.com/en-US/obsidian/api-rpc/"},
    {"name": "RunCloud API", "description": "Server management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://runcloud.io/docs/api"},
    {"name": "ServerPilot API", "description": "Server management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://serverpilot.io/docs/api"},
    {"name": "Forge API", "description": "Laravel server management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://forge.laravel.com/docs/1.0/api.html"},
    {"name": "Ploi API", "description": "Server management", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://ploi.io/documentation"},
    {"name": "Kinsta API", "description": "WordPress hosting", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://kinsta.com/knowledgebase/kinsta-api/"},
    {"name": "WP Engine API", "description": "WordPress hosting", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://wpengineapi.com/"},
    {"name": "Flywheel API", "description": "WordPress hosting", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://getflywheel.com/"},
    {"name": "Pantheon API", "description": "Drupal/WordPress hosting", "category": "Hosting", "authType": "apiKey", "baseUrl": "https://pantheon.io/docs/machine-tokens"},
]

# Identity & Access APIs
IDENTITY_APIS = [
    {"name": "Keycloak API", "description": "Identity management", "category": "Identity", "authType": "oauth", "baseUrl": "https://www.keycloak.org/docs-api/21.0.1/rest-api/"},
    {"name": "FusionAuth API", "description": "Auth platform", "category": "Identity", "authType": "apiKey", "baseUrl": "https://fusionauth.io/docs/v1/tech/apis/"},
    {"name": "Ory API", "description": "Identity infrastructure", "category": "Identity", "authType": "apiKey", "baseUrl": "https://www.ory.sh/docs/reference/api"},
    {"name": "Ping Identity API", "description": "Enterprise identity", "category": "Identity", "authType": "oauth", "baseUrl": "https://apidocs.pingidentity.com/"},
    {"name": "ForgeRock API", "description": "Digital identity", "category": "Identity", "authType": "oauth", "baseUrl": "https://backstage.forgerock.com/docs/"},
    {"name": "OneLogin API", "description": "Identity management", "category": "Identity", "authType": "apiKey", "baseUrl": "https://developers.onelogin.com/"},
    {"name": "JumpCloud API", "description": "Directory platform", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.jumpcloud.com/api/"},
    {"name": "Azure AD API", "description": "Microsoft identity", "category": "Identity", "authType": "oauth", "baseUrl": "https://docs.microsoft.com/en-us/azure/active-directory/develop/"},
    {"name": "Google Cloud Identity API", "description": "Google identity", "category": "Identity", "authType": "oauth", "baseUrl": "https://cloud.google.com/identity/docs/reference/rest"},
    {"name": "AWS Cognito API", "description": "Amazon identity", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-reference.html"},
    {"name": "Descope API", "description": "Auth and user mgmt", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.descope.com/api/"},
    {"name": "Frontegg API", "description": "User management", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.frontegg.com/"},
    {"name": "PropelAuth API", "description": "B2B auth", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.propelauth.com/"},
    {"name": "Stack Auth API", "description": "Authentication platform", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.stack-auth.com/"},
    {"name": "Hanko API", "description": "Passkey authentication", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.hanko.io/"},
    {"name": "Authgear API", "description": "Identity service", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.authgear.com/"},
    {"name": "LoginRadius API", "description": "CIAM platform", "category": "Identity", "authType": "apiKey", "baseUrl": "https://www.loginradius.com/docs/api/"},
    {"name": "Kinde API", "description": "Auth for startups", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.kinde.com/developer-tools/kinde-api/"},
    {"name": "Userfront API", "description": "User authentication", "category": "Identity", "authType": "apiKey", "baseUrl": "https://userfront.com/docs/api"},
    {"name": "Corbado API", "description": "Passkey platform", "category": "Identity", "authType": "apiKey", "baseUrl": "https://docs.corbado.com/"},
]

# Combine all batches
ALL_APIS = (
    SCIENCE_APIS +
    GOVERNMENT_APIS +
    MANUFACTURING_APIS +
    ADTECH_APIS +
    HOSTING_APIS +
    IDENTITY_APIS
)

def main():
    print(f"📦 Night Expansion 02-27 03:00 Batch 5 (Final)")
    print(f"   Total new APIs: {len(ALL_APIS)}")
    
    output_file = f"/Users/gustavhemmingsson/Projects/apiclaw/data/night-expansion-02-27-03-batch5.json"
    with open(output_file, 'w') as f:
        json.dump(ALL_APIS, f, indent=2)
    
    print(f"   Saved to: {output_file}")
    
    categories = {}
    for api in ALL_APIS:
        cat = api.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📊 By category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:15]:
        print(f"   {cat}: {count}")
    
    return len(ALL_APIS)

if __name__ == "__main__":
    main()
