#!/usr/bin/env python3
"""
APIClaw Night Expansion - Batch 05b
More niche APIs to reach 15,000+ target
"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

# More niche and regional APIs
NICHE_APIS = [
    # Nordic APIs
    {"name": "Bankgirot API", "description": "Swedish bank transfer system", "category": "Payments", "baseUrl": "https://www.bankgirot.se", "authType": "apiKey"},
    {"name": "Swish API", "description": "Swedish mobile payments", "category": "Payments", "baseUrl": "https://developer.swish.nu", "authType": "certificate"},
    {"name": "BankID Sweden", "description": "Swedish electronic ID", "category": "Authentication", "baseUrl": "https://www.bankid.com/utvecklare/rp-info", "authType": "certificate"},
    {"name": "Freja eID", "description": "Scandinavian electronic ID", "category": "Authentication", "baseUrl": "https://frejaeid.com/developers", "authType": "certificate"},
    {"name": "Klarna Checkout", "description": "Swedish payment checkout", "category": "Payments", "baseUrl": "https://docs.klarna.com/klarna-checkout", "authType": "apiKey"},
    {"name": "Postnord API", "description": "Nordic postal services", "category": "Logistics", "baseUrl": "https://developer.postnord.com", "authType": "apiKey"},
    {"name": "SMHI Weather API", "description": "Swedish weather data", "category": "Weather", "baseUrl": "https://opendata.smhi.se/apidocs", "authType": "none"},
    {"name": "Trafikverket Open API", "description": "Swedish transport data", "category": "Transportation", "baseUrl": "https://api.trafikinfo.trafikverket.se", "authType": "apiKey"},
    {"name": "SCB Statistics Sweden", "description": "Swedish statistics", "category": "Government", "baseUrl": "https://www.scb.se/api", "authType": "none"},
    {"name": "Skatteverket API", "description": "Swedish tax authority", "category": "Government", "baseUrl": "https://www.skatteverket.se/foretagochorganisationer/etjansterochblanketter/ehandel", "authType": "certificate"},
    {"name": "Norwegian MET Weather", "description": "Norwegian weather API", "category": "Weather", "baseUrl": "https://api.met.no", "authType": "none"},
    {"name": "Vipps API", "description": "Norwegian mobile payments", "category": "Payments", "baseUrl": "https://developer.vipps.no", "authType": "oauth2"},
    {"name": "MobilePay API", "description": "Danish mobile payments", "category": "Payments", "baseUrl": "https://developer.mobilepay.dk", "authType": "oauth2"},
    {"name": "Nets Easy", "description": "Nordic payments gateway", "category": "Payments", "baseUrl": "https://developer.nexigroup.com", "authType": "apiKey"},
    {"name": "Bring Logistics", "description": "Nordic shipping API", "category": "Logistics", "baseUrl": "https://developer.bring.com", "authType": "apiKey"},
    {"name": "Finland Statistics API", "description": "Statistics Finland data", "category": "Government", "baseUrl": "https://pxdata.stat.fi/api", "authType": "none"},
    {"name": "Danish MitID", "description": "Danish electronic ID", "category": "Authentication", "baseUrl": "https://digst.dk/it-loesninger/mitid/loesning", "authType": "certificate"},
    {"name": "NemID Denmark", "description": "Danish digital signature", "category": "Authentication", "baseUrl": "https://www.nemid.nu/dk-da/erhverv", "authType": "certificate"},
    {"name": "Iceland Inspire API", "description": "Icelandic geodata", "category": "Maps", "baseUrl": "https://www.lmi.is/is/gagnaveita", "authType": "none"},
    {"name": "Icelandic Met Office", "description": "Iceland weather data", "category": "Weather", "baseUrl": "https://en.vedur.is/about-imo/apis", "authType": "none"},
    
    # German APIs
    {"name": "Deutsche Bahn API", "description": "German railway data", "category": "Transportation", "baseUrl": "https://developer.deutschebahn.com", "authType": "apiKey"},
    {"name": "Payone API", "description": "German payment services", "category": "Payments", "baseUrl": "https://docs.payone.com", "authType": "apiKey"},
    {"name": "DHL Express Germany", "description": "DHL services Germany", "category": "Logistics", "baseUrl": "https://developer.dhl.com/api-reference/dhl-express", "authType": "apiKey"},
    {"name": "Deutsche Post Delivery", "description": "German postal services", "category": "Logistics", "baseUrl": "https://developer.dhl.com", "authType": "apiKey"},
    {"name": "GLS Germany API", "description": "GLS parcel services", "category": "Logistics", "baseUrl": "https://gls-group.eu/DE/de/shipping-solutions", "authType": "apiKey"},
    {"name": "Bundesbank API", "description": "German central bank data", "category": "Finance", "baseUrl": "https://www.bundesbank.de/dynamic/action/de/statistiken/zeitreihen-datenbanken", "authType": "none"},
    {"name": "Destatis API", "description": "German federal statistics", "category": "Government", "baseUrl": "https://www-genesis.destatis.de/genesis/online", "authType": "none"},
    {"name": "Wetter.com API", "description": "German weather service", "category": "Weather", "baseUrl": "https://api.wetter.com", "authType": "apiKey"},
    {"name": "FinanzOnline AT", "description": "Austrian tax services", "category": "Government", "baseUrl": "https://www.bmf.gv.at/public/informationen/finanzamtsliste.html", "authType": "certificate"},
    {"name": "OeNB Austria", "description": "Austrian central bank data", "category": "Finance", "baseUrl": "https://www.oenb.at/Statistik/Standardisierte-Tabellen.html", "authType": "none"},
    
    # UK APIs
    {"name": "Companies House UK", "description": "UK company information", "category": "Business", "baseUrl": "https://developer.company-information.service.gov.uk", "authType": "apiKey"},
    {"name": "DVLA API", "description": "UK vehicle data", "category": "Government", "baseUrl": "https://developer-portal.driver-vehicle-licensing.api.gov.uk", "authType": "apiKey"},
    {"name": "HMRC API", "description": "UK tax authority", "category": "Government", "baseUrl": "https://developer.service.hmrc.gov.uk", "authType": "oauth2"},
    {"name": "UK Bank Holidays", "description": "UK public holidays", "category": "Calendar", "baseUrl": "https://www.gov.uk/bank-holidays.json", "authType": "none"},
    {"name": "ONS UK Statistics", "description": "UK national statistics", "category": "Government", "baseUrl": "https://api.ons.gov.uk", "authType": "none"},
    {"name": "NHS API", "description": "UK health services", "category": "Health", "baseUrl": "https://digital.nhs.uk/developer", "authType": "apiKey"},
    {"name": "Transport for London", "description": "TfL transport data", "category": "Transportation", "baseUrl": "https://api.tfl.gov.uk", "authType": "apiKey"},
    {"name": "Royal Mail API", "description": "UK postal services", "category": "Logistics", "baseUrl": "https://developer.royalmail.net", "authType": "apiKey"},
    {"name": "Ordnance Survey", "description": "UK mapping data", "category": "Maps", "baseUrl": "https://api.os.uk", "authType": "apiKey"},
    {"name": "UK Police API", "description": "UK crime data", "category": "Government", "baseUrl": "https://data.police.uk/docs", "authType": "none"},
    {"name": "Land Registry UK", "description": "UK property data", "category": "Real Estate", "baseUrl": "https://use-land-property-data.service.gov.uk", "authType": "apiKey"},
    {"name": "Met Office DataHub", "description": "UK weather data", "category": "Weather", "baseUrl": "https://datahub.metoffice.gov.uk", "authType": "apiKey"},
    {"name": "Environment Agency", "description": "UK flood data", "category": "Environment", "baseUrl": "https://environment.data.gov.uk", "authType": "none"},
    {"name": "Gov.uk Notify", "description": "UK government notifications", "category": "Communication", "baseUrl": "https://www.notifications.service.gov.uk/documentation", "authType": "apiKey"},
    {"name": "Open Banking UK", "description": "UK open banking standard", "category": "Finance", "baseUrl": "https://www.openbanking.org.uk/developer-resources", "authType": "oauth2"},
    
    # French APIs
    {"name": "API Gouv France", "description": "French government APIs", "category": "Government", "baseUrl": "https://api.gouv.fr", "authType": "varies"},
    {"name": "INSEE French Statistics", "description": "French national statistics", "category": "Government", "baseUrl": "https://api.insee.fr", "authType": "apiKey"},
    {"name": "SNCF Railway France", "description": "French railway data", "category": "Transportation", "baseUrl": "https://numerique.sncf.com/startup/api", "authType": "apiKey"},
    {"name": "La Poste France", "description": "French postal services", "category": "Logistics", "baseUrl": "https://developer.laposte.fr", "authType": "apiKey"},
    {"name": "Meteo France API", "description": "French weather data", "category": "Weather", "baseUrl": "https://portail-api.meteofrance.fr", "authType": "apiKey"},
    {"name": "Banque de France", "description": "French central bank data", "category": "Finance", "baseUrl": "https://webstat.banque-france.fr/ws", "authType": "none"},
    {"name": "SIRENE French Companies", "description": "French company registry", "category": "Business", "baseUrl": "https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/templates/api/documentation/download.jag?docName=Sirene", "authType": "apiKey"},
    {"name": "FranceConnect", "description": "French digital ID", "category": "Authentication", "baseUrl": "https://franceconnect.gouv.fr/partenaires", "authType": "oauth2"},
    {"name": "RATP Paris Transit", "description": "Paris public transport", "category": "Transportation", "baseUrl": "https://data.ratp.fr", "authType": "none"},
    {"name": "Navitia France", "description": "French public transport", "category": "Transportation", "baseUrl": "https://doc.navitia.io", "authType": "apiKey"},
    
    # Spanish APIs
    {"name": "Spain INE Statistics", "description": "Spanish national statistics", "category": "Government", "baseUrl": "https://www.ine.es/dyngs/DataLab", "authType": "none"},
    {"name": "AEMET Weather Spain", "description": "Spanish weather data", "category": "Weather", "baseUrl": "https://opendata.aemet.es", "authType": "apiKey"},
    {"name": "Renfe Railway Spain", "description": "Spanish railway data", "category": "Transportation", "baseUrl": "https://www.renfe.com/es/es/grupo-renfe/otras-webs/Open-data", "authType": "none"},
    {"name": "Correos Spain", "description": "Spanish postal services", "category": "Logistics", "baseUrl": "https://www.correos.es", "authType": "apiKey"},
    {"name": "Bizum Spain", "description": "Spanish instant payments", "category": "Payments", "baseUrl": "https://bizum.es", "authType": "apiKey"},
    {"name": "CNMV Spain", "description": "Spanish securities data", "category": "Finance", "baseUrl": "https://www.cnmv.es", "authType": "none"},
    {"name": "Catastro Spain", "description": "Spanish property registry", "category": "Real Estate", "baseUrl": "https://www.catastro.meh.es", "authType": "none"},
    
    # Italian APIs
    {"name": "ISTAT Italy", "description": "Italian national statistics", "category": "Government", "baseUrl": "https://www.istat.it/en/information-and-services/developers", "authType": "none"},
    {"name": "Trenitalia Italy", "description": "Italian railway data", "category": "Transportation", "baseUrl": "https://www.trenitalia.com", "authType": "apiKey"},
    {"name": "Poste Italiane", "description": "Italian postal services", "category": "Logistics", "baseUrl": "https://www.poste.it", "authType": "apiKey"},
    {"name": "Banca d'Italia", "description": "Italian central bank data", "category": "Finance", "baseUrl": "https://www.bancaditalia.it/statistiche", "authType": "none"},
    {"name": "SPID Italy", "description": "Italian digital ID", "category": "Authentication", "baseUrl": "https://www.spid.gov.it/en/spid-service-providers", "authType": "oauth2"},
    {"name": "PagoPA Italy", "description": "Italian digital payments", "category": "Payments", "baseUrl": "https://developer.pagopa.it", "authType": "apiKey"},
    {"name": "Meteoam Italy", "description": "Italian military weather", "category": "Weather", "baseUrl": "https://www.meteoam.it", "authType": "none"},
    
    # Dutch APIs
    {"name": "CBS Netherlands", "description": "Dutch statistics", "category": "Government", "baseUrl": "https://opendata.cbs.nl", "authType": "none"},
    {"name": "NS Dutch Railways", "description": "Dutch railway data", "category": "Transportation", "baseUrl": "https://apiportal.ns.nl", "authType": "apiKey"},
    {"name": "iDEAL Payments", "description": "Dutch online payments", "category": "Payments", "baseUrl": "https://www.ideal.nl/en/businesses/ideal-for-businesses/getting-started", "authType": "apiKey"},
    {"name": "PostNL API", "description": "Dutch postal services", "category": "Logistics", "baseUrl": "https://developer.postnl.nl", "authType": "apiKey"},
    {"name": "KNMI Weather NL", "description": "Dutch weather data", "category": "Weather", "baseUrl": "https://developer.dataplatform.knmi.nl", "authType": "apiKey"},
    {"name": "Kadaster Netherlands", "description": "Dutch land registry", "category": "Real Estate", "baseUrl": "https://www.pdok.nl", "authType": "none"},
    {"name": "DigiD Netherlands", "description": "Dutch digital ID", "category": "Authentication", "baseUrl": "https://www.digid.nl/en/businesses", "authType": "oauth2"},
    {"name": "Mollie Payments", "description": "Dutch payment gateway", "category": "Payments", "baseUrl": "https://docs.mollie.com", "authType": "apiKey"},
    {"name": "Buckaroo Payments", "description": "Dutch payment provider", "category": "Payments", "baseUrl": "https://www.buckaroo.eu/en/solutions/api-integration", "authType": "apiKey"},
    {"name": "OV-API Netherlands", "description": "Dutch public transport", "category": "Transportation", "baseUrl": "https://ovapi.nl", "authType": "none"},
    
    # Belgian APIs
    {"name": "NBB Belgium", "description": "Belgian central bank data", "category": "Finance", "baseUrl": "https://www.nbb.be/en/statistics", "authType": "none"},
    {"name": "StatBel Belgium", "description": "Belgian statistics", "category": "Government", "baseUrl": "https://statbel.fgov.be/en/open-data", "authType": "none"},
    {"name": "NMBS/SNCB Belgium", "description": "Belgian railway data", "category": "Transportation", "baseUrl": "https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data", "authType": "none"},
    {"name": "bPost Belgium", "description": "Belgian postal services", "category": "Logistics", "baseUrl": "https://www.bpost.be/site/en/business/apis", "authType": "apiKey"},
    {"name": "itsme Belgium", "description": "Belgian digital ID", "category": "Authentication", "baseUrl": "https://www.itsme.be/en/business-partners/integrate-itsme", "authType": "oauth2"},
    {"name": "Bancontact Belgium", "description": "Belgian payment method", "category": "Payments", "baseUrl": "https://www.bancontact.com/en/merchants", "authType": "apiKey"},
    
    # Swiss APIs
    {"name": "Swiss Post API", "description": "Swiss postal services", "category": "Logistics", "baseUrl": "https://developer.post.ch", "authType": "apiKey"},
    {"name": "SBB Swiss Railways", "description": "Swiss railway data", "category": "Transportation", "baseUrl": "https://opentransportdata.swiss", "authType": "apiKey"},
    {"name": "SNB Switzerland", "description": "Swiss central bank data", "category": "Finance", "baseUrl": "https://data.snb.ch", "authType": "none"},
    {"name": "Swiss Federal Stats", "description": "Swiss statistics", "category": "Government", "baseUrl": "https://www.pxweb.bfs.admin.ch", "authType": "none"},
    {"name": "MeteoSwiss API", "description": "Swiss weather data", "category": "Weather", "baseUrl": "https://www.meteoswiss.admin.ch/services-and-publications/service/open-government-data.html", "authType": "none"},
    {"name": "SwissSign eID", "description": "Swiss electronic ID", "category": "Authentication", "baseUrl": "https://www.swisssign.com", "authType": "certificate"},
    {"name": "TWINT Switzerland", "description": "Swiss mobile payments", "category": "Payments", "baseUrl": "https://www.twint.ch/en/twint-api", "authType": "apiKey"},
    {"name": "Swisstopo Geodata", "description": "Swiss mapping data", "category": "Maps", "baseUrl": "https://api3.geo.admin.ch", "authType": "none"},
    
    # Australian APIs
    {"name": "Australia Post API", "description": "Australian postal services", "category": "Logistics", "baseUrl": "https://developers.auspost.com.au", "authType": "apiKey"},
    {"name": "ABS Statistics", "description": "Australian statistics", "category": "Government", "baseUrl": "https://api.data.abs.gov.au", "authType": "none"},
    {"name": "RBA Australia", "description": "Reserve Bank of Australia data", "category": "Finance", "baseUrl": "https://www.rba.gov.au/statistics/tables", "authType": "none"},
    {"name": "BOM Australia Weather", "description": "Australian weather data", "category": "Weather", "baseUrl": "https://www.bom.gov.au/catalogue/data-feeds.shtml", "authType": "none"},
    {"name": "myGov Australia", "description": "Australian government services", "category": "Government", "baseUrl": "https://www.servicesaustralia.gov.au/organisations/business/services/digital-identity", "authType": "oauth2"},
    {"name": "Medicare Australia", "description": "Australian health services", "category": "Health", "baseUrl": "https://www.servicesaustralia.gov.au/organisations/health-professionals/services/medicare", "authType": "apiKey"},
    {"name": "TransLink Queensland", "description": "Queensland transit data", "category": "Transportation", "baseUrl": "https://translink.com.au/about-translink/open-data", "authType": "none"},
    {"name": "Transport NSW", "description": "NSW transit data", "category": "Transportation", "baseUrl": "https://opendata.transport.nsw.gov.au", "authType": "apiKey"},
    {"name": "PTV Melbourne", "description": "Melbourne transit data", "category": "Transportation", "baseUrl": "https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api", "authType": "apiKey"},
    {"name": "Afterpay Australia", "description": "Buy now pay later", "category": "Payments", "baseUrl": "https://developers.afterpay.com", "authType": "oauth2"},
    
    # Canadian APIs
    {"name": "Canada Post API", "description": "Canadian postal services", "category": "Logistics", "baseUrl": "https://www.canadapost-postescanada.ca/cpc/en/business/shipping/developingtools/services.page", "authType": "apiKey"},
    {"name": "StatCan Statistics", "description": "Statistics Canada", "category": "Government", "baseUrl": "https://www.statcan.gc.ca/eng/developers", "authType": "none"},
    {"name": "Bank of Canada", "description": "Canadian central bank data", "category": "Finance", "baseUrl": "https://www.bankofcanada.ca/rates/", "authType": "none"},
    {"name": "Environment Canada", "description": "Canadian weather data", "category": "Weather", "baseUrl": "https://climate.weather.gc.ca", "authType": "none"},
    {"name": "Transit App Canada", "description": "Canadian transit data", "category": "Transportation", "baseUrl": "https://transitapp.com/for-developers", "authType": "apiKey"},
    {"name": "Interac e-Transfer", "description": "Canadian money transfers", "category": "Payments", "baseUrl": "https://www.interac.ca/en/business/", "authType": "apiKey"},
    {"name": "Verified.me Canada", "description": "Canadian digital ID", "category": "Authentication", "baseUrl": "https://verified.me", "authType": "oauth2"},
    {"name": "CRA Canada Revenue", "description": "Canadian tax authority", "category": "Government", "baseUrl": "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-registration-online.html", "authType": "certificate"},
    
    # Asian APIs
    {"name": "WeChat Pay API", "description": "Chinese mobile payments", "category": "Payments", "baseUrl": "https://pay.weixin.qq.com/wiki/doc/api/index.html", "authType": "apiKey"},
    {"name": "Alipay API", "description": "Chinese mobile payments", "category": "Payments", "baseUrl": "https://global.alipay.com/docs/ac/home", "authType": "apiKey"},
    {"name": "Rakuten Japan API", "description": "Japanese e-commerce", "category": "E-Commerce", "baseUrl": "https://webservice.rakuten.co.jp", "authType": "apiKey"},
    {"name": "Japan Post API", "description": "Japanese postal services", "category": "Logistics", "baseUrl": "https://www.post.japanpost.jp/zipcode/download.html", "authType": "none"},
    {"name": "JMA Japan Weather", "description": "Japanese weather data", "category": "Weather", "baseUrl": "https://www.jma.go.jp/jma/en/Activities/apis.html", "authType": "none"},
    {"name": "Line Pay API", "description": "Japanese mobile payments", "category": "Payments", "baseUrl": "https://pay.line.me/documents/online_v2.html", "authType": "apiKey"},
    {"name": "Korea Post API", "description": "Korean postal services", "category": "Logistics", "baseUrl": "https://www.epost.go.kr", "authType": "apiKey"},
    {"name": "KMA Korea Weather", "description": "Korean weather data", "category": "Weather", "baseUrl": "https://www.weather.go.kr/w/index.do", "authType": "apiKey"},
    {"name": "Kakao Pay API", "description": "Korean mobile payments", "category": "Payments", "baseUrl": "https://developers.kakao.com/docs/latest/ko/kakaopay", "authType": "apiKey"},
    {"name": "Naver Pay API", "description": "Korean mobile payments", "category": "Payments", "baseUrl": "https://developer.pay.naver.com", "authType": "apiKey"},
    {"name": "GrabPay API", "description": "Southeast Asian payments", "category": "Payments", "baseUrl": "https://developer.grab.com/docs", "authType": "oauth2"},
    {"name": "SingPost API", "description": "Singapore postal services", "category": "Logistics", "baseUrl": "https://www.singpost.com/about-us/technology-innovation", "authType": "apiKey"},
    {"name": "PayNow Singapore", "description": "Singapore instant payments", "category": "Payments", "baseUrl": "https://abs.org.sg/consumer-banking/pay-now", "authType": "apiKey"},
    {"name": "SingPass API", "description": "Singapore digital ID", "category": "Authentication", "baseUrl": "https://api.singpass.gov.sg", "authType": "oauth2"},
    {"name": "Data.gov.sg", "description": "Singapore government data", "category": "Government", "baseUrl": "https://data.gov.sg/developer", "authType": "none"},
    {"name": "GCash Philippines", "description": "Philippine mobile wallet", "category": "Payments", "baseUrl": "https://developer.gcash.com", "authType": "apiKey"},
    {"name": "Paymaya Philippines", "description": "Philippine payments", "category": "Payments", "baseUrl": "https://developers.maya.ph", "authType": "apiKey"},
    {"name": "Gojek API", "description": "Indonesian super app", "category": "Transportation", "baseUrl": "https://www.gojek.com/en-id/partner", "authType": "apiKey"},
    {"name": "OVO Indonesia", "description": "Indonesian digital wallet", "category": "Payments", "baseUrl": "https://ovo.id", "authType": "apiKey"},
    {"name": "DANA Indonesia", "description": "Indonesian digital wallet", "category": "Payments", "baseUrl": "https://www.dana.id/business", "authType": "apiKey"},
    {"name": "PromptPay Thailand", "description": "Thai instant payments", "category": "Payments", "baseUrl": "https://www.bot.or.th/English/PaymentSystems/PromptPay/", "authType": "apiKey"},
    {"name": "Touch 'n Go Malaysia", "description": "Malaysian e-wallet", "category": "Payments", "baseUrl": "https://www.touchngo.com.my", "authType": "apiKey"},
    {"name": "Paytm India", "description": "Indian digital payments", "category": "Payments", "baseUrl": "https://developer.paytm.com", "authType": "apiKey"},
    {"name": "PhonePe India", "description": "Indian UPI payments", "category": "Payments", "baseUrl": "https://developer.phonepe.com", "authType": "apiKey"},
    {"name": "UPI India", "description": "Unified Payments Interface India", "category": "Payments", "baseUrl": "https://www.npci.org.in/what-we-do/upi/product-overview", "authType": "apiKey"},
    {"name": "Aadhaar India", "description": "Indian biometric ID", "category": "Authentication", "baseUrl": "https://uidai.gov.in/ecosystem/authentication-ecosystem", "authType": "apiKey"},
    {"name": "India Stack", "description": "Indian digital infrastructure", "category": "Government", "baseUrl": "https://indiastack.org", "authType": "varies"},
    {"name": "Data.gov.in", "description": "Indian government data", "category": "Government", "baseUrl": "https://data.gov.in/api", "authType": "apiKey"},
    {"name": "IMD India Weather", "description": "Indian weather data", "category": "Weather", "baseUrl": "https://mausam.imd.gov.in", "authType": "none"},
    
    # Latin American APIs
    {"name": "Mercado Pago", "description": "Latin American payments", "category": "Payments", "baseUrl": "https://www.mercadopago.com.br/developers", "authType": "oauth2"},
    {"name": "PagSeguro Brazil", "description": "Brazilian payments", "category": "Payments", "baseUrl": "https://dev.pagseguro.uol.com.br", "authType": "apiKey"},
    {"name": "Pix Brazil", "description": "Brazilian instant payments", "category": "Payments", "baseUrl": "https://www.bcb.gov.br/estabilidadefinanceira/pix", "authType": "certificate"},
    {"name": "Correios Brazil", "description": "Brazilian postal services", "category": "Logistics", "baseUrl": "http://www.correios.com.br/web-services", "authType": "apiKey"},
    {"name": "IBGE Brazil Stats", "description": "Brazilian statistics", "category": "Government", "baseUrl": "https://servicodados.ibge.gov.br/api", "authType": "none"},
    {"name": "Banco Central Brazil", "description": "Brazilian central bank data", "category": "Finance", "baseUrl": "https://dadosabertos.bcb.gov.br", "authType": "none"},
    {"name": "INPE Brazil Weather", "description": "Brazilian weather data", "category": "Weather", "baseUrl": "http://servicos.cptec.inpe.br/XML", "authType": "none"},
    {"name": "Rappi API", "description": "Latin American delivery", "category": "Logistics", "baseUrl": "https://developers.rappi.com", "authType": "oauth2"},
    {"name": "Mercado Libre", "description": "Latin American marketplace", "category": "E-Commerce", "baseUrl": "https://developers.mercadolibre.com", "authType": "oauth2"},
    {"name": "Nubank API", "description": "Brazilian digital bank", "category": "Finance", "baseUrl": "https://nubank.com.br", "authType": "oauth2"},
    {"name": "Chilexpress Chile", "description": "Chilean courier services", "category": "Logistics", "baseUrl": "https://www.chilexpress.cl/servicios/web-services", "authType": "apiKey"},
    {"name": "Transbank Chile", "description": "Chilean payment gateway", "category": "Payments", "baseUrl": "https://www.transbankdevelopers.cl", "authType": "apiKey"},
    {"name": "BCP Peru", "description": "Peruvian banking", "category": "Finance", "baseUrl": "https://www.viabcp.com", "authType": "apiKey"},
    {"name": "Yape Peru", "description": "Peruvian mobile wallet", "category": "Payments", "baseUrl": "https://www.yape.com.pe", "authType": "apiKey"},
    {"name": "PSE Colombia", "description": "Colombian online payments", "category": "Payments", "baseUrl": "https://www.pse.com.co", "authType": "apiKey"},
    {"name": "Nequi Colombia", "description": "Colombian digital wallet", "category": "Payments", "baseUrl": "https://www.nequi.com.co", "authType": "apiKey"},
    {"name": "SPEI Mexico", "description": "Mexican instant payments", "category": "Payments", "baseUrl": "https://www.banxico.org.mx/servicios/spei.html", "authType": "certificate"},
    {"name": "CoDi Mexico", "description": "Mexican QR payments", "category": "Payments", "baseUrl": "https://www.banxico.org.mx/servicios/codi.html", "authType": "apiKey"},
    {"name": "Correos Mexico", "description": "Mexican postal services", "category": "Logistics", "baseUrl": "https://www.correosdemexico.gob.mx", "authType": "apiKey"},
    {"name": "INEGI Mexico Stats", "description": "Mexican statistics", "category": "Government", "baseUrl": "https://www.inegi.org.mx/servicios/api_indicadores.html", "authType": "none"},
    
    # Middle Eastern APIs
    {"name": "Careem UAE", "description": "Middle East ride-hailing", "category": "Transportation", "baseUrl": "https://www.careem.com", "authType": "apiKey"},
    {"name": "Aramex API", "description": "Middle East logistics", "category": "Logistics", "baseUrl": "https://www.aramex.com/ae/en/shipping-resources/shipping-apis", "authType": "apiKey"},
    {"name": "Emirates Post", "description": "UAE postal services", "category": "Logistics", "baseUrl": "https://www.emiratespost.ae", "authType": "apiKey"},
    {"name": "Apple Pay MENA", "description": "Apple Pay Middle East", "category": "Payments", "baseUrl": "https://developer.apple.com/apple-pay", "authType": "certificate"},
    {"name": "Saudi Aramco Data", "description": "Saudi energy data", "category": "Energy", "baseUrl": "https://www.aramco.com/en/investors/data-and-insights", "authType": "none"},
    {"name": "SAMA Saudi Arabia", "description": "Saudi central bank data", "category": "Finance", "baseUrl": "https://www.sama.gov.sa", "authType": "none"},
    {"name": "STC Pay Saudi", "description": "Saudi mobile wallet", "category": "Payments", "baseUrl": "https://www.stcpay.com.sa", "authType": "apiKey"},
    {"name": "CBUAE UAE", "description": "UAE central bank data", "category": "Finance", "baseUrl": "https://www.centralbank.ae", "authType": "none"},
    {"name": "UAE PASS", "description": "UAE digital ID", "category": "Authentication", "baseUrl": "https://uaepass.ae", "authType": "oauth2"},
    {"name": "Israel Post", "description": "Israeli postal services", "category": "Logistics", "baseUrl": "https://www.israelpost.co.il", "authType": "apiKey"},
    {"name": "Bank of Israel", "description": "Israeli central bank data", "category": "Finance", "baseUrl": "https://www.boi.org.il/en/DataAndStatistics", "authType": "none"},
    {"name": "Bit Pay Israel", "description": "Israeli mobile payments", "category": "Payments", "baseUrl": "https://www.bitpay.co.il", "authType": "apiKey"},
    
    # African APIs
    {"name": "M-Pesa API", "description": "African mobile money", "category": "Payments", "baseUrl": "https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate", "authType": "oauth2"},
    {"name": "MTN MoMo API", "description": "African mobile money", "category": "Payments", "baseUrl": "https://momodeveloper.mtn.com", "authType": "oauth2"},
    {"name": "Flutterwave API", "description": "African payments", "category": "Payments", "baseUrl": "https://developer.flutterwave.com", "authType": "apiKey"},
    {"name": "Paystack API", "description": "African payments", "category": "Payments", "baseUrl": "https://paystack.com/docs/api", "authType": "apiKey"},
    {"name": "DHL Africa eShop", "description": "African e-commerce logistics", "category": "Logistics", "baseUrl": "https://www.dhlafricaeshop.com", "authType": "apiKey"},
    {"name": "Jumia API", "description": "African marketplace", "category": "E-Commerce", "baseUrl": "https://open-api.jumia.com", "authType": "oauth2"},
    {"name": "South African Reserve Bank", "description": "SA central bank data", "category": "Finance", "baseUrl": "https://www.resbank.co.za", "authType": "none"},
    {"name": "Stats SA", "description": "South African statistics", "category": "Government", "baseUrl": "http://www.statssa.gov.za/?cat=15", "authType": "none"},
    {"name": "SA Weather Service", "description": "South African weather", "category": "Weather", "baseUrl": "https://www.weathersa.co.za", "authType": "apiKey"},
    {"name": "CBN Nigeria", "description": "Nigerian central bank", "category": "Finance", "baseUrl": "https://www.cbn.gov.ng", "authType": "none"},
    {"name": "NBS Nigeria Stats", "description": "Nigerian statistics", "category": "Government", "baseUrl": "https://nigerianstat.gov.ng", "authType": "none"},
    {"name": "NIPOST Nigeria", "description": "Nigerian postal services", "category": "Logistics", "baseUrl": "https://nipost.gov.ng", "authType": "apiKey"},
    {"name": "CBK Kenya", "description": "Kenyan central bank", "category": "Finance", "baseUrl": "https://www.centralbank.go.ke", "authType": "none"},
    {"name": "KNBS Kenya Stats", "description": "Kenyan statistics", "category": "Government", "baseUrl": "https://www.knbs.or.ke", "authType": "none"},
    {"name": "Egypt Post", "description": "Egyptian postal services", "category": "Logistics", "baseUrl": "https://www.egyptpost.org", "authType": "apiKey"},
    {"name": "CBE Egypt", "description": "Egyptian central bank", "category": "Finance", "baseUrl": "https://www.cbe.org.eg", "authType": "none"},
    {"name": "Fawry Egypt", "description": "Egyptian digital payments", "category": "Payments", "baseUrl": "https://developer.fawry.io", "authType": "apiKey"},
    
    # Blockchain/Web3 APIs
    {"name": "Alchemy API", "description": "Blockchain development platform", "category": "Blockchain", "baseUrl": "https://docs.alchemy.com", "authType": "apiKey"},
    {"name": "Infura API", "description": "Ethereum infrastructure", "category": "Blockchain", "baseUrl": "https://docs.infura.io", "authType": "apiKey"},
    {"name": "QuickNode", "description": "Blockchain endpoints", "category": "Blockchain", "baseUrl": "https://www.quicknode.com/docs", "authType": "apiKey"},
    {"name": "Moralis API", "description": "Web3 development platform", "category": "Blockchain", "baseUrl": "https://docs.moralis.io", "authType": "apiKey"},
    {"name": "Etherscan API", "description": "Ethereum explorer API", "category": "Blockchain", "baseUrl": "https://docs.etherscan.io", "authType": "apiKey"},
    {"name": "Polygonscan API", "description": "Polygon explorer API", "category": "Blockchain", "baseUrl": "https://docs.polygonscan.com", "authType": "apiKey"},
    {"name": "BscScan API", "description": "BSC explorer API", "category": "Blockchain", "baseUrl": "https://docs.bscscan.com", "authType": "apiKey"},
    {"name": "Solana Web3.js", "description": "Solana blockchain API", "category": "Blockchain", "baseUrl": "https://solana-labs.github.io/solana-web3.js", "authType": "none"},
    {"name": "The Graph API", "description": "Blockchain indexing protocol", "category": "Blockchain", "baseUrl": "https://thegraph.com/docs/en", "authType": "apiKey"},
    {"name": "OpenSea API", "description": "NFT marketplace API", "category": "Blockchain", "baseUrl": "https://docs.opensea.io/reference", "authType": "apiKey"},
    {"name": "Rarible API", "description": "NFT protocol API", "category": "Blockchain", "baseUrl": "https://docs.rarible.org", "authType": "apiKey"},
    {"name": "Chainlink API", "description": "Oracle network API", "category": "Blockchain", "baseUrl": "https://docs.chain.link", "authType": "none"},
    {"name": "Uniswap API", "description": "DEX protocol API", "category": "Blockchain", "baseUrl": "https://docs.uniswap.org", "authType": "none"},
    {"name": "Aave API", "description": "DeFi lending protocol", "category": "Blockchain", "baseUrl": "https://docs.aave.com", "authType": "none"},
    {"name": "Compound API", "description": "DeFi protocol API", "category": "Blockchain", "baseUrl": "https://compound.finance/docs", "authType": "none"},
    {"name": "1inch API", "description": "DEX aggregator API", "category": "Blockchain", "baseUrl": "https://docs.1inch.io", "authType": "none"},
    {"name": "Zapper API", "description": "DeFi dashboard API", "category": "Blockchain", "baseUrl": "https://docs.zapper.fi", "authType": "apiKey"},
    {"name": "DeBank API", "description": "DeFi portfolio tracker", "category": "Blockchain", "baseUrl": "https://docs.debank.com", "authType": "apiKey"},
    {"name": "WalletConnect", "description": "Wallet connection protocol", "category": "Blockchain", "baseUrl": "https://docs.walletconnect.com", "authType": "none"},
    {"name": "MetaMask SDK", "description": "Ethereum wallet SDK", "category": "Blockchain", "baseUrl": "https://docs.metamask.io", "authType": "none"},
    
    # Gaming APIs
    {"name": "Steam Web API", "description": "Steam gaming platform", "category": "Gaming", "baseUrl": "https://developer.valvesoftware.com/wiki/Steam_Web_API", "authType": "apiKey"},
    {"name": "Epic Games Store API", "description": "Epic Games platform", "category": "Gaming", "baseUrl": "https://dev.epicgames.com/docs", "authType": "oauth2"},
    {"name": "Xbox Live API", "description": "Xbox gaming services", "category": "Gaming", "baseUrl": "https://docs.microsoft.com/en-us/gaming/xbox-live", "authType": "oauth2"},
    {"name": "PlayStation Network API", "description": "PlayStation services", "category": "Gaming", "baseUrl": "https://partners.playstation.net", "authType": "oauth2"},
    {"name": "Nintendo Account API", "description": "Nintendo services", "category": "Gaming", "baseUrl": "https://developer.nintendo.com", "authType": "oauth2"},
    {"name": "Riot Games API", "description": "League of Legends data", "category": "Gaming", "baseUrl": "https://developer.riotgames.com", "authType": "apiKey"},
    {"name": "Blizzard API", "description": "Blizzard game data", "category": "Gaming", "baseUrl": "https://develop.battle.net/documentation", "authType": "oauth2"},
    {"name": "Fortnite API", "description": "Fortnite game data", "category": "Gaming", "baseUrl": "https://fortnite-api.com", "authType": "none"},
    {"name": "RAWG Video Games API", "description": "Video games database", "category": "Gaming", "baseUrl": "https://rawg.io/apidocs", "authType": "apiKey"},
    {"name": "IGDB API", "description": "Internet Game Database", "category": "Gaming", "baseUrl": "https://api-docs.igdb.com", "authType": "oauth2"},
    {"name": "CheapShark API", "description": "Game deals aggregator", "category": "Gaming", "baseUrl": "https://apidocs.cheapshark.com", "authType": "none"},
    {"name": "IsThereAnyDeal API", "description": "Game price tracking", "category": "Gaming", "baseUrl": "https://docs.isthereanydeal.com", "authType": "apiKey"},
    {"name": "GiantBomb API", "description": "Video game database", "category": "Gaming", "baseUrl": "https://www.giantbomb.com/api", "authType": "apiKey"},
    {"name": "Twitch Drops API", "description": "Twitch rewards system", "category": "Gaming", "baseUrl": "https://dev.twitch.tv/docs/drops", "authType": "oauth2"},
    {"name": "Discord GameSDK", "description": "Discord game integration", "category": "Gaming", "baseUrl": "https://discord.com/developers/docs/game-sdk", "authType": "oauth2"},
    
    # Education APIs
    {"name": "Coursera API", "description": "Online learning platform", "category": "Education", "baseUrl": "https://www.coursera.org/developer", "authType": "oauth2"},
    {"name": "Udemy API", "description": "Online courses platform", "category": "Education", "baseUrl": "https://www.udemy.com/developers", "authType": "oauth2"},
    {"name": "Khan Academy API", "description": "Free education platform", "category": "Education", "baseUrl": "https://github.com/Khan/khan-api", "authType": "oauth2"},
    {"name": "Duolingo API", "description": "Language learning platform", "category": "Education", "baseUrl": "https://www.duolingo.com", "authType": "none"},
    {"name": "edX API", "description": "Online learning platform", "category": "Education", "baseUrl": "https://openedx.atlassian.net/wiki/spaces/DOC/pages", "authType": "oauth2"},
    {"name": "Canvas LMS API", "description": "Learning management system", "category": "Education", "baseUrl": "https://canvas.instructure.com/doc/api", "authType": "oauth2"},
    {"name": "Moodle Web Services", "description": "Open source LMS", "category": "Education", "baseUrl": "https://docs.moodle.org/dev/Web_service_API_functions", "authType": "apiKey"},
    {"name": "Blackboard API", "description": "LMS platform API", "category": "Education", "baseUrl": "https://developer.blackboard.com", "authType": "oauth2"},
    {"name": "Schoology API", "description": "Education management", "category": "Education", "baseUrl": "https://developers.schoology.com", "authType": "oauth2"},
    {"name": "ClassDojo API", "description": "Classroom management", "category": "Education", "baseUrl": "https://www.classdojo.com", "authType": "oauth2"},
    {"name": "Quizlet API", "description": "Study tools platform", "category": "Education", "baseUrl": "https://quizlet.com/api", "authType": "oauth2"},
    {"name": "Brainly API", "description": "Homework help platform", "category": "Education", "baseUrl": "https://brainly.com", "authType": "oauth2"},
    {"name": "Wolfram Alpha API", "description": "Computational knowledge", "category": "Education", "baseUrl": "https://products.wolframalpha.com/api", "authType": "apiKey"},
    {"name": "Symbolab API", "description": "Math solver API", "category": "Education", "baseUrl": "https://www.symbolab.com", "authType": "apiKey"},
    {"name": "Photomath API", "description": "Math learning AI", "category": "Education", "baseUrl": "https://photomath.com", "authType": "apiKey"},
    
    # Healthcare APIs
    {"name": "Epic FHIR API", "description": "Healthcare interoperability", "category": "Health", "baseUrl": "https://fhir.epic.com", "authType": "oauth2"},
    {"name": "Cerner FHIR API", "description": "Healthcare data platform", "category": "Health", "baseUrl": "https://fhir.cerner.com", "authType": "oauth2"},
    {"name": "Allscripts API", "description": "Healthcare IT platform", "category": "Health", "baseUrl": "https://developer.allscripts.com", "authType": "oauth2"},
    {"name": "athenahealth API", "description": "Healthcare network", "category": "Health", "baseUrl": "https://docs.athenahealth.com", "authType": "oauth2"},
    {"name": "DrChrono API", "description": "Medical practice management", "category": "Health", "baseUrl": "https://www.drchrono.com/api", "authType": "oauth2"},
    {"name": "Redox API", "description": "Healthcare data platform", "category": "Health", "baseUrl": "https://developer.redoxengine.com", "authType": "apiKey"},
    {"name": "1up Health API", "description": "Health data aggregation", "category": "Health", "baseUrl": "https://1up.health/dev", "authType": "oauth2"},
    {"name": "Human API", "description": "Health data platform", "category": "Health", "baseUrl": "https://docs.humanapi.co", "authType": "oauth2"},
    {"name": "Validic API", "description": "Health data integration", "category": "Health", "baseUrl": "https://docs.validic.com", "authType": "apiKey"},
    {"name": "Apple HealthKit", "description": "iOS health data", "category": "Health", "baseUrl": "https://developer.apple.com/documentation/healthkit", "authType": "none"},
    {"name": "Google Fit API", "description": "Android health data", "category": "Health", "baseUrl": "https://developers.google.com/fit", "authType": "oauth2"},
    {"name": "Samsung Health SDK", "description": "Samsung health data", "category": "Health", "baseUrl": "https://developer.samsung.com/health", "authType": "oauth2"},
    {"name": "Garmin Health API", "description": "Garmin fitness data", "category": "Health", "baseUrl": "https://developer.garmin.com/health-api", "authType": "oauth2"},
    {"name": "Oura Ring API", "description": "Sleep and fitness data", "category": "Health", "baseUrl": "https://cloud.ouraring.com/docs", "authType": "oauth2"},
    {"name": "Whoop API", "description": "Fitness recovery data", "category": "Health", "baseUrl": "https://developer.whoop.com", "authType": "oauth2"},
    
    # Real Estate APIs
    {"name": "Zillow API", "description": "US real estate data", "category": "Real Estate", "baseUrl": "https://www.zillow.com/howto/api/APIOverview.htm", "authType": "apiKey"},
    {"name": "Realtor.com API", "description": "US property listings", "category": "Real Estate", "baseUrl": "https://www.realtor.com/api", "authType": "apiKey"},
    {"name": "Redfin API", "description": "Real estate brokerage", "category": "Real Estate", "baseUrl": "https://www.redfin.com", "authType": "apiKey"},
    {"name": "Trulia API", "description": "Real estate marketplace", "category": "Real Estate", "baseUrl": "https://www.trulia.com/about/api", "authType": "apiKey"},
    {"name": "ATTOM Property API", "description": "Property data platform", "category": "Real Estate", "baseUrl": "https://api.gateway.attomdata.com/propertyapi/v1.0.0", "authType": "apiKey"},
    {"name": "CoreLogic API", "description": "Property analytics", "category": "Real Estate", "baseUrl": "https://www.corelogic.com/solutions/property-data", "authType": "apiKey"},
    {"name": "Estated API", "description": "Property data API", "category": "Real Estate", "baseUrl": "https://estated.com/developers", "authType": "apiKey"},
    {"name": "RentCast API", "description": "Rental property data", "category": "Real Estate", "baseUrl": "https://developers.rentcast.io", "authType": "apiKey"},
    {"name": "Mashvisor API", "description": "Real estate investment", "category": "Real Estate", "baseUrl": "https://www.mashvisor.com/api", "authType": "apiKey"},
    {"name": "Rightmove UK", "description": "UK property listings", "category": "Real Estate", "baseUrl": "https://www.rightmove.co.uk/developer", "authType": "apiKey"},
    {"name": "Zoopla UK", "description": "UK property data", "category": "Real Estate", "baseUrl": "https://developer.zoopla.co.uk", "authType": "apiKey"},
    {"name": "Domain Australia", "description": "Australian property", "category": "Real Estate", "baseUrl": "https://developer.domain.com.au", "authType": "oauth2"},
    {"name": "Hemnet Sweden", "description": "Swedish property listings", "category": "Real Estate", "baseUrl": "https://www.hemnet.se", "authType": "apiKey"},
    {"name": "Immobilienscout24", "description": "German property listings", "category": "Real Estate", "baseUrl": "https://api.immobilienscout24.de", "authType": "oauth2"},
    {"name": "SeLoger France", "description": "French property listings", "category": "Real Estate", "baseUrl": "https://www.seloger.com", "authType": "apiKey"},
    
    # Travel APIs
    {"name": "Amadeus API", "description": "Travel booking platform", "category": "Travel", "baseUrl": "https://developers.amadeus.com", "authType": "oauth2"},
    {"name": "Sabre API", "description": "Travel technology", "category": "Travel", "baseUrl": "https://developer.sabre.com", "authType": "oauth2"},
    {"name": "Travelport API", "description": "Travel commerce platform", "category": "Travel", "baseUrl": "https://developer.travelport.com", "authType": "oauth2"},
    {"name": "Skyscanner API", "description": "Flight comparison", "category": "Travel", "baseUrl": "https://partners.skyscanner.net", "authType": "apiKey"},
    {"name": "Kiwi.com API", "description": "Flight booking", "category": "Travel", "baseUrl": "https://docs.kiwi.com", "authType": "apiKey"},
    {"name": "Google Flights API", "description": "Flight search", "category": "Travel", "baseUrl": "https://developers.google.com/qpx-express", "authType": "apiKey"},
    {"name": "Booking.com API", "description": "Hotel booking", "category": "Travel", "baseUrl": "https://developers.booking.com", "authType": "oauth2"},
    {"name": "Expedia API", "description": "Travel booking", "category": "Travel", "baseUrl": "https://developers.expediagroup.com", "authType": "apiKey"},
    {"name": "Hotels.com API", "description": "Hotel booking", "category": "Travel", "baseUrl": "https://developer.hotels.com", "authType": "oauth2"},
    {"name": "Airbnb API", "description": "Vacation rentals", "category": "Travel", "baseUrl": "https://developer.airbnb.com", "authType": "oauth2"},
    {"name": "VRBO API", "description": "Vacation rentals", "category": "Travel", "baseUrl": "https://www.vrbo.com/platform/developer", "authType": "oauth2"},
    {"name": "TripAdvisor API", "description": "Travel reviews", "category": "Travel", "baseUrl": "https://www.tripadvisor.com/developers", "authType": "apiKey"},
    {"name": "Yelp Fusion API", "description": "Local business reviews", "category": "Travel", "baseUrl": "https://www.yelp.com/developers", "authType": "apiKey"},
    {"name": "Google Places API", "description": "Place information", "category": "Travel", "baseUrl": "https://developers.google.com/maps/documentation/places", "authType": "apiKey"},
    {"name": "Foursquare Places API", "description": "Location intelligence", "category": "Travel", "baseUrl": "https://developer.foursquare.com", "authType": "oauth2"},
    {"name": "Rome2Rio API", "description": "Multi-modal travel", "category": "Travel", "baseUrl": "https://www.rome2rio.com/documentation", "authType": "apiKey"},
    {"name": "Sygic Travel API", "description": "Travel content", "category": "Travel", "baseUrl": "https://travel.sygic.com/en/api", "authType": "apiKey"},
    {"name": "OpenTripMap API", "description": "Points of interest", "category": "Travel", "baseUrl": "https://opentripmap.io/docs", "authType": "apiKey"},
    {"name": "TourRadar API", "description": "Tour booking", "category": "Travel", "baseUrl": "https://www.tourradar.com/partner", "authType": "apiKey"},
    {"name": "Viator API", "description": "Tours and activities", "category": "Travel", "baseUrl": "https://viatorapi.viator.com", "authType": "apiKey"},
    {"name": "GetYourGuide API", "description": "Tours and activities", "category": "Travel", "baseUrl": "https://partner.getyourguide.com", "authType": "apiKey"},
    {"name": "Klook API", "description": "Asia activities", "category": "Travel", "baseUrl": "https://affiliate.klook.com", "authType": "apiKey"},
    {"name": "Trainline API", "description": "European rail booking", "category": "Travel", "baseUrl": "https://www.thetrainline.com/trains/europe/rail-apis", "authType": "apiKey"},
    {"name": "Omio API", "description": "European travel booking", "category": "Travel", "baseUrl": "https://www.omio.com", "authType": "apiKey"},
    {"name": "FlixBus API", "description": "European bus booking", "category": "Travel", "baseUrl": "https://global.flixbus.com", "authType": "apiKey"},
    
    # Food/Restaurant APIs
    {"name": "Yelp Fusion", "description": "Restaurant reviews", "category": "Food", "baseUrl": "https://www.yelp.com/developers", "authType": "apiKey"},
    {"name": "Zomato API", "description": "Restaurant search", "category": "Food", "baseUrl": "https://developers.zomato.com", "authType": "apiKey"},
    {"name": "OpenTable API", "description": "Restaurant reservations", "category": "Food", "baseUrl": "https://www.opentable.com/partner/partners", "authType": "apiKey"},
    {"name": "Resy API", "description": "Restaurant reservations", "category": "Food", "baseUrl": "https://resy.com", "authType": "apiKey"},
    {"name": "TheFork API", "description": "European reservations", "category": "Food", "baseUrl": "https://partner.thefork.com", "authType": "apiKey"},
    {"name": "DoorDash API", "description": "Food delivery", "category": "Food", "baseUrl": "https://developer.doordash.com", "authType": "oauth2"},
    {"name": "Uber Eats API", "description": "Food delivery", "category": "Food", "baseUrl": "https://developer.uber.com/docs/eats", "authType": "oauth2"},
    {"name": "Grubhub API", "description": "Food delivery", "category": "Food", "baseUrl": "https://about.grubhub.com/partner-with-us", "authType": "apiKey"},
    {"name": "Postmates API", "description": "Local delivery", "category": "Food", "baseUrl": "https://postmates.com/developer", "authType": "oauth2"},
    {"name": "Deliveroo API", "description": "UK food delivery", "category": "Food", "baseUrl": "https://restaurants.deliveroo.com", "authType": "apiKey"},
    {"name": "Just Eat API", "description": "European food delivery", "category": "Food", "baseUrl": "https://developers.just-eat.com", "authType": "apiKey"},
    {"name": "Seamless API", "description": "Food delivery NYC", "category": "Food", "baseUrl": "https://www.seamless.com", "authType": "apiKey"},
    {"name": "Chowbus API", "description": "Asian food delivery", "category": "Food", "baseUrl": "https://www.chowbus.com", "authType": "apiKey"},
    {"name": "Swiggy API", "description": "Indian food delivery", "category": "Food", "baseUrl": "https://www.swiggy.com", "authType": "apiKey"},
    {"name": "Foodpanda API", "description": "Asian food delivery", "category": "Food", "baseUrl": "https://www.foodpanda.com", "authType": "apiKey"},
    {"name": "iFood API", "description": "Brazilian food delivery", "category": "Food", "baseUrl": "https://portal.ifood.com.br", "authType": "apiKey"},
    {"name": "Spoonacular API", "description": "Recipe and nutrition", "category": "Food", "baseUrl": "https://spoonacular.com/food-api", "authType": "apiKey"},
    {"name": "Edamam API", "description": "Nutrition data", "category": "Food", "baseUrl": "https://developer.edamam.com", "authType": "apiKey"},
    {"name": "Nutritionix API", "description": "Nutrition database", "category": "Food", "baseUrl": "https://www.nutritionix.com/business/api", "authType": "apiKey"},
    {"name": "FatSecret API", "description": "Food and exercise", "category": "Food", "baseUrl": "https://platform.fatsecret.com", "authType": "oauth2"},
    {"name": "MealDB API", "description": "Recipe database", "category": "Food", "baseUrl": "https://www.themealdb.com/api.php", "authType": "none"},
    {"name": "CocktailDB API", "description": "Drink recipes", "category": "Food", "baseUrl": "https://www.thecocktaildb.com/api.php", "authType": "none"},
]

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry):
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

def normalize_name(name):
    return name.lower().replace(" ", "").replace("-", "").replace("_", "")

def main():
    print(f"🦞 APIClaw Night Expansion Batch B - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    registry = load_registry()
    existing_apis = registry.get('apis', [])
    existing_count = len(existing_apis)
    print(f"📊 Current registry: {existing_count} APIs")
    
    existing_names = set()
    for api in existing_apis:
        existing_names.add(normalize_name(api.get('name', '')))
    
    added = 0
    skipped = 0
    
    for api in NICHE_APIS:
        normalized = normalize_name(api['name'])
        if normalized not in existing_names:
            existing_apis.append(api)
            existing_names.add(normalized)
            added += 1
        else:
            skipped += 1
    
    registry['apis'] = existing_apis
    registry['count'] = len(existing_apis)
    registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    registry['version'] = '3.2.1'
    
    save_registry(registry)
    
    print(f"✅ Added: {added} new APIs")
    print(f"⏭️ Skipped (duplicates): {skipped}")
    print(f"📊 New total: {len(existing_apis)} APIs")
    
    return added

if __name__ == "__main__":
    added = main()
    print(f"\n🎯 Result: +{added} APIs")
