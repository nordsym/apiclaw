#!/usr/bin/env python3
"""Batch 2: More APIs from public-apis and other sources"""
import json
import os

# Load existing
existing_file = os.path.expanduser("~/Projects/apiclaw/data/combined-02-27.json")
with open(existing_file) as f:
    existing = json.load(f)
    
existing_names = {api["name"].lower() for api in existing}
existing_urls = {api.get("baseUrl", "").lower() for api in existing}

batch2_apis = [
    # Development tools
    {"name": "24 Pull Requests", "description": "Promote open source collaboration", "category": "Development", "authType": "none", "baseUrl": "https://24pullrequests.com/api"},
    {"name": "Abstract Screenshot", "description": "Take programmatic screenshots of websites", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/website-screenshot-api"},
    {"name": "Agify.io", "description": "Estimates age from first name", "category": "Utilities", "authType": "none", "baseUrl": "https://agify.io"},
    {"name": "API Grátis", "description": "Multiples services and public APIs", "category": "Development", "authType": "none", "baseUrl": "https://apigratis.com.br/"},
    {"name": "ApicAgent", "description": "Extract device details from user-agent", "category": "Utilities", "authType": "none", "baseUrl": "https://www.apicagent.com"},
    {"name": "ApiFlash", "description": "Chrome based screenshot API", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://apiflash.com/"},
    {"name": "APIs.guru", "description": "Wikipedia for Web APIs", "category": "Development", "authType": "none", "baseUrl": "https://apis.guru/"},
    {"name": "Azure DevOps", "description": "Azure DevOps REST API", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/azure/devops"},
    {"name": "Base API", "description": "Building quick backends", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.base-api.io/"},
    {"name": "Beeceptor", "description": "Build mock REST API endpoints", "category": "Testing", "authType": "none", "baseUrl": "https://beeceptor.com/"},
    {"name": "Bitbucket API", "description": "Bitbucket API", "category": "Development", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/bitbucket/"},
    {"name": "Blague.xyz", "description": "Biggest FR jokes API", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://blague.xyz/"},
    {"name": "Blitapp", "description": "Schedule screenshots to cloud", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://blitapp.com/api/"},
    {"name": "Blynk-Cloud", "description": "Control IoT Devices from Blynk", "category": "IoT", "authType": "apiKey", "baseUrl": "https://blynk.io/"},
    {"name": "Bored API", "description": "Find random activities", "category": "Entertainment", "authType": "none", "baseUrl": "https://www.boredapi.com/"},
    {"name": "Brainshop.ai", "description": "Make A Free AI Brain", "category": "AI", "authType": "apiKey", "baseUrl": "https://brainshop.ai/"},
    {"name": "Browshot", "description": "Screenshots of web pages", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://browshot.com/"},
    {"name": "CDNJS", "description": "Library info on CDNJS", "category": "Development", "authType": "none", "baseUrl": "https://api.cdnjs.com/"},
    {"name": "Changelogs.md", "description": "Changelog metadata from open source", "category": "Development", "authType": "none", "baseUrl": "https://changelogs.md"},
    {"name": "Ciprand", "description": "Secure random string generator", "category": "Utilities", "authType": "none", "baseUrl": "https://github.com/polarspetroll/ciprand"},
    {"name": "Cloudflare Trace", "description": "Get IP Address and metadata", "category": "Utilities", "authType": "none", "baseUrl": "https://cloudflare.com/"},
    {"name": "CodeX Compiler", "description": "Online Compiler for Various Languages", "category": "Development", "authType": "none", "baseUrl": "https://github.com/Jaagrav/CodeX"},
    {"name": "Contentful Images", "description": "Retrieve and transform images", "category": "Images", "authType": "apiKey", "baseUrl": "https://www.contentful.com/"},
    {"name": "CORS Proxy", "description": "Get around CORS errors", "category": "Development", "authType": "none", "baseUrl": "https://github.com/burhanuday/cors-proxy"},
    {"name": "CountAPI", "description": "Free counting service", "category": "Utilities", "authType": "none", "baseUrl": "https://countapi.xyz"},
    {"name": "Databricks API", "description": "Manage Databricks resources", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.databricks.com/"},
    {"name": "DigitalOcean Status", "description": "Status of DigitalOcean services", "category": "Development", "authType": "none", "baseUrl": "https://status.digitalocean.com/"},
    {"name": "Docker Hub API", "description": "Interact with Docker Hub", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.docker.com/docker-hub/api/"},
    {"name": "DomainDb Info", "description": "Domain name search", "category": "Business", "authType": "none", "baseUrl": "https://api.domainsdb.info/"},
    {"name": "ExtendsClass JSON Storage", "description": "Simple JSON store API", "category": "Storage", "authType": "none", "baseUrl": "https://extendsclass.com/"},
    {"name": "GeekFlare", "description": "Website testing and monitoring", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://apidocs.geekflare.com/"},
    {"name": "Genderize.io", "description": "Estimates gender from first name", "category": "Utilities", "authType": "none", "baseUrl": "https://genderize.io"},
    {"name": "GETPing", "description": "Email notification with GET request", "category": "Communication", "authType": "apiKey", "baseUrl": "https://www.getping.info"},
    {"name": "Ghost CMS", "description": "Get Published content", "category": "Content", "authType": "apiKey", "baseUrl": "https://ghost.org/"},
    {"name": "Gitter", "description": "Chat for Developers", "category": "Communication", "authType": "oauth", "baseUrl": "https://developer.gitter.im/"},
    {"name": "Glitterly", "description": "Image generation API", "category": "Images", "authType": "apiKey", "baseUrl": "https://developers.glitterly.app"},
    {"name": "Google Docs API", "description": "Read, write, format Docs", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.google.com/docs/api/"},
    {"name": "Google Keep", "description": "Read, write Google Keep notes", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.google.com/keep/"},
    {"name": "Google Sheets API", "description": "Read, write Google Sheets", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.google.com/sheets/api/"},
    {"name": "Google Slides API", "description": "Read, write Google Slides", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.google.com/slides/api/"},
    {"name": "Gorest", "description": "Online REST API for Testing", "category": "Testing", "authType": "oauth", "baseUrl": "https://gorest.co.in/"},
    {"name": "Hasura", "description": "GraphQL and REST API Engine", "category": "Development", "authType": "apiKey", "baseUrl": "https://hasura.io/"},
    {"name": "Heroku API", "description": "REST API for Heroku platform", "category": "Development", "authType": "oauth", "baseUrl": "https://devcenter.heroku.com/"},
    {"name": "host-t.com", "description": "Basic DNS query via HTTP GET", "category": "Development", "authType": "none", "baseUrl": "https://host-t.com"},
    {"name": "Host.io", "description": "Domains Data API", "category": "Development", "authType": "apiKey", "baseUrl": "https://host.io"},
    {"name": "HTTP2.Pro", "description": "Test HTTP/2 protocol support", "category": "Testing", "authType": "none", "baseUrl": "https://http2.pro/"},
    {"name": "Httpbin", "description": "HTTP Request & Response Service", "category": "Testing", "authType": "none", "baseUrl": "https://httpbin.org/"},
    {"name": "Hunter Email", "description": "Domain search and email finder", "category": "Business", "authType": "apiKey", "baseUrl": "https://hunter.io/api"},
    {"name": "IBM Text to Speech", "description": "Convert text to speech", "category": "AI", "authType": "apiKey", "baseUrl": "https://cloud.ibm.com/"},
    {"name": "Icanhazepoch", "description": "Get Epoch time", "category": "Utilities", "authType": "none", "baseUrl": "https://icanhazepoch.com"},
    {"name": "Icanhazip", "description": "IP Address API", "category": "Utilities", "authType": "none", "baseUrl": "https://icanhazip.com/"},
    {"name": "IFTTT", "description": "IFTTT Connect API", "category": "Automation", "authType": "none", "baseUrl": "https://platform.ifttt.com/"},
    {"name": "Image-Charts", "description": "Generate charts and QR codes", "category": "Images", "authType": "none", "baseUrl": "https://image-charts.com/"},
    {"name": "import.io", "description": "Retrieve structured data from websites", "category": "Data", "authType": "apiKey", "baseUrl": "https://www.import.io/"},
    {"name": "ip-fast.com", "description": "IP address, country and city", "category": "Utilities", "authType": "none", "baseUrl": "https://ip-fast.com/"},
    {"name": "IP2WHOIS", "description": "WHOIS domain lookup", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.ip2whois.com/"},
    {"name": "ipfind.io", "description": "Geographic location of IP", "category": "Geolocation", "authType": "apiKey", "baseUrl": "https://ipfind.io"},
    {"name": "IPify", "description": "Simple IP Address API", "category": "Utilities", "authType": "none", "baseUrl": "https://www.ipify.org/"},
    {"name": "IPinfo", "description": "Simple IP Address API", "category": "Utilities", "authType": "none", "baseUrl": "https://ipinfo.io/"},
    {"name": "jsDelivr", "description": "Package info on jsDelivr CDN", "category": "Development", "authType": "none", "baseUrl": "https://jsdelivr.com/"},
    {"name": "JSON 2 JSONP", "description": "Convert JSON to JSONP", "category": "Utilities", "authType": "none", "baseUrl": "https://json2jsonp.com/"},
    {"name": "JSONbin.io", "description": "Free JSON storage service", "category": "Storage", "authType": "apiKey", "baseUrl": "https://jsonbin.io"},
    {"name": "Kroki", "description": "Creates diagrams from text", "category": "Design", "authType": "none", "baseUrl": "https://kroki.io"},
    {"name": "License-API", "description": "REST API for choosealicense.com", "category": "Development", "authType": "none", "baseUrl": "https://github.com/cmccandless/license-api"},
    {"name": "Logs.to", "description": "Generate logs", "category": "Development", "authType": "apiKey", "baseUrl": "https://logs.to/"},
    {"name": "Lua Decompiler", "description": "Online Lua 5.1 Decompiler", "category": "Development", "authType": "none", "baseUrl": "https://lua-decompiler.ferib.dev/"},
    {"name": "MAC address lookup", "description": "Retrieve vendor from MAC", "category": "Development", "authType": "apiKey", "baseUrl": "https://macaddress.io/"},
    {"name": "Micro DB", "description": "Simple database service", "category": "Storage", "authType": "apiKey", "baseUrl": "https://m3o.com/db"},
    {"name": "MicroENV", "description": "Fake REST API for developers", "category": "Testing", "authType": "none", "baseUrl": "https://microenv.com/"},
    {"name": "Mocky", "description": "Mock JSON for REST API endpoints", "category": "Testing", "authType": "none", "baseUrl": "https://designer.mocky.io/"},
    {"name": "MY IP API", "description": "Get IP address information", "category": "Utilities", "authType": "none", "baseUrl": "https://www.myip.com/api-docs/"},
    {"name": "Nationalize.io", "description": "Estimate nationality from name", "category": "Utilities", "authType": "none", "baseUrl": "https://nationalize.io"},
    {"name": "Netlify API", "description": "Netlify hosting service API", "category": "Development", "authType": "oauth", "baseUrl": "https://docs.netlify.com/api/"},
    {"name": "NetworkCalc", "description": "Network calculators API", "category": "Utilities", "authType": "none", "baseUrl": "https://networkcalc.com/"},
    {"name": "npm Registry", "description": "Query npm packages", "category": "Development", "authType": "none", "baseUrl": "https://www.npmjs.com/"},
    {"name": "OneSignal", "description": "Push Notifications, Email, SMS", "category": "Communication", "authType": "apiKey", "baseUrl": "https://onesignal.com/"},
    {"name": "Open Page Rank", "description": "Page Rank algorithm metrics", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://www.domcop.com/openpagerank/"},
    {"name": "OpenAPIHub", "description": "All-in-one API Platform", "category": "Development", "authType": "apiKey", "baseUrl": "https://hub.openapihub.com/"},
    {"name": "OpenGraphr", "description": "Retrieve Open Graph data", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://opengraphr.com/"},
    {"name": "oyyi", "description": "Fake Data and conversion APIs", "category": "Utilities", "authType": "none", "baseUrl": "https://oyyi.xyz/"},
    {"name": "PageCDN", "description": "Public API for js/css/font libraries", "category": "Development", "authType": "apiKey", "baseUrl": "https://pagecdn.com/"},
    {"name": "Postman API", "description": "Tool for testing APIs", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.postman.com/"},
    {"name": "ProxyKingdom", "description": "Rotating Proxy API", "category": "Development", "authType": "apiKey", "baseUrl": "https://proxykingdom.com"},
    {"name": "Pusher Beams", "description": "Push notifications for Android/iOS", "category": "Communication", "authType": "apiKey", "baseUrl": "https://pusher.com/beams"},
    {"name": "QR code qrtag", "description": "Create QR code and URL shortener", "category": "Utilities", "authType": "none", "baseUrl": "https://www.qrtag.net/api/"},
    {"name": "QR code goqr", "description": "Generate and decode QR codes", "category": "Utilities", "authType": "none", "baseUrl": "http://goqr.me/api/"},
    {"name": "Qrcode Monkey", "description": "Custom QR codes", "category": "Utilities", "authType": "none", "baseUrl": "https://www.qrcode-monkey.com/"},
    {"name": "QuickChart", "description": "Generate chart and graph images", "category": "Images", "authType": "none", "baseUrl": "https://quickchart.io/"},
    {"name": "Random Stuff API", "description": "AI Response, jokes, memes", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://api-docs.pgamerx.com/"},
    {"name": "Rejax", "description": "Reverse AJAX service", "category": "Development", "authType": "apiKey", "baseUrl": "https://rejax.io/"},
    {"name": "ReqRes", "description": "Hosted REST-API for AJAX requests", "category": "Testing", "authType": "none", "baseUrl": "https://reqres.in/"},
    {"name": "RSS feed to JSON", "description": "Returns RSS feed in JSON", "category": "Utilities", "authType": "none", "baseUrl": "https://rss-to-json-serverless-api.vercel.app"},
    {"name": "SavePage.io", "description": "Screenshot any website", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.savepage.io"},
    {"name": "ScrapeNinja", "description": "Scraping API with proxies", "category": "Development", "authType": "apiKey", "baseUrl": "https://scrapeninja.net"},
    {"name": "ScraperApi", "description": "Build scalable web scrapers", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.scraperapi.com"},
    {"name": "scraperBox", "description": "Undetectable web scraping", "category": "Development", "authType": "apiKey", "baseUrl": "https://scraperbox.com/"},
    {"name": "scrapestack", "description": "Web Scraping REST API", "category": "Development", "authType": "apiKey", "baseUrl": "https://scrapestack.com/"},
    {"name": "ScrapingAnt", "description": "Headless Chrome scraping", "category": "Development", "authType": "apiKey", "baseUrl": "https://scrapingant.com"},
    {"name": "ScrapingDog", "description": "Proxy API for Web scraping", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.scrapingdog.com/"},
    {"name": "ScreenshotAPI.net", "description": "Create website screenshots", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://screenshotapi.net/"},
    {"name": "Serialif Color", "description": "Color conversion and contrast", "category": "Design", "authType": "none", "baseUrl": "https://color.serialif.com/"},
    {"name": "serpstack", "description": "Google Search Results API", "category": "Search", "authType": "apiKey", "baseUrl": "https://serpstack.com/"},
    {"name": "Sheetsu", "description": "Google sheets integration", "category": "Documents", "authType": "apiKey", "baseUrl": "https://sheetsu.com/"},
    {"name": "SHOUTCLOUD", "description": "ALL-CAPS AS A SERVICE", "category": "Entertainment", "authType": "none", "baseUrl": "http://shoutcloud.io/"},
    {"name": "Sonar", "description": "DNS Enumeration API", "category": "Security", "authType": "none", "baseUrl": "https://github.com/Cgboal/SonarSearch"},
    {"name": "SonarQube", "description": "Detect bugs and vulnerabilities", "category": "Development", "authType": "oauth", "baseUrl": "https://sonarcloud.io/"},
    {"name": "StackExchange", "description": "Q&A forum for developers", "category": "Development", "authType": "oauth", "baseUrl": "https://api.stackexchange.com/"},
    {"name": "Statically", "description": "Free CDN for developers", "category": "Development", "authType": "none", "baseUrl": "https://statically.io/"},
    {"name": "Supportivekoala", "description": "Autogenerate images", "category": "Images", "authType": "apiKey", "baseUrl": "https://developers.supportivekoala.com/"},
    {"name": "Tyk", "description": "API management platform", "category": "Development", "authType": "apiKey", "baseUrl": "https://tyk.io/"},
    {"name": "Wandbox", "description": "Code compiler for 35+ languages", "category": "Development", "authType": "none", "baseUrl": "https://wandbox.org/"},
    {"name": "WebScraping.AI", "description": "Web Scraping with proxies", "category": "Development", "authType": "apiKey", "baseUrl": "https://webscraping.ai/"},
    {"name": "ZenRows", "description": "Web Scraping API", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.zenrows.com/"},
    
    # Dictionaries
    {"name": "Chinese Character Web", "description": "Chinese character definitions", "category": "Reference", "authType": "none", "baseUrl": "http://ccdb.hemiola.com/"},
    {"name": "Chinese Text Project", "description": "Pre-modern Chinese texts library", "category": "Reference", "authType": "none", "baseUrl": "https://ctext.org/"},
    {"name": "Collins Dictionary", "description": "Bilingual Dictionary and Thesaurus", "category": "Reference", "authType": "apiKey", "baseUrl": "https://api.collinsdictionary.com/"},
    {"name": "Indonesia Dictionary", "description": "Indonesia dictionary", "category": "Reference", "authType": "none", "baseUrl": "https://new-kbbi-api.herokuapp.com/"},
    {"name": "OwlBot", "description": "Definitions with example sentence", "category": "Reference", "authType": "apiKey", "baseUrl": "https://owlbot.info/"},
    {"name": "Synonyms API", "description": "Synonyms and antonyms", "category": "Reference", "authType": "apiKey", "baseUrl": "https://www.synonyms.com/"},
    
    # Documents & Productivity
    {"name": "Airtable API", "description": "Integrate with Airtable", "category": "Documents", "authType": "apiKey", "baseUrl": "https://airtable.com/api"},
    {"name": "Api2Convert", "description": "Online File Conversion", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.api2convert.com/"},
    {"name": "apilayer pdflayer", "description": "HTML/URL to PDF", "category": "Documents", "authType": "apiKey", "baseUrl": "https://pdflayer.com"},
    {"name": "Asana API", "description": "Access Asana data", "category": "Documents", "authType": "apiKey", "baseUrl": "https://developers.asana.com/"},
    {"name": "ClickUp API", "description": "ClickUp project management", "category": "Documents", "authType": "oauth", "baseUrl": "https://clickup.com/api"},
    {"name": "Clockify API", "description": "Clockify time tracking", "category": "Documents", "authType": "apiKey", "baseUrl": "https://clockify.me/developers-api"},
    {"name": "CloudConvert", "description": "Online file converter", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://cloudconvert.com/api/"},
    {"name": "Cloudmersive Convert", "description": "Document conversion", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://cloudmersive.com/"},
    {"name": "Code::Stats", "description": "Automatic time tracking for programmers", "category": "Development", "authType": "apiKey", "baseUrl": "https://codestats.net/"},
    {"name": "CraftMyPDF", "description": "Generate PDF from templates", "category": "Documents", "authType": "apiKey", "baseUrl": "https://craftmypdf.com"},
    {"name": "Flowdash", "description": "Automate business workflows", "category": "Automation", "authType": "apiKey", "baseUrl": "https://docs.flowdash.com/"},
    {"name": "Html2PDF", "description": "HTML/URL to PDF", "category": "Documents", "authType": "apiKey", "baseUrl": "https://html2pdf.app/"},
    {"name": "iLovePDF", "description": "Convert, merge, split PDFs", "category": "Documents", "authType": "apiKey", "baseUrl": "https://developer.ilovepdf.com/"},
    {"name": "JIRA API", "description": "JIRA issue tracking", "category": "Documents", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/"},
    {"name": "Mattermost API", "description": "Open source collaboration", "category": "Communication", "authType": "oauth", "baseUrl": "https://api.mattermost.com/"},
    {"name": "Mercury Parser", "description": "Web parser", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://mercury.postlight.com/"},
    {"name": "Monday API", "description": "monday.com data access", "category": "Documents", "authType": "apiKey", "baseUrl": "https://api.developer.monday.com/"},
    {"name": "Notion API", "description": "Integrate with Notion", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.notion.com/"},
    {"name": "PandaDoc", "description": "DocGen and eSignatures", "category": "Documents", "authType": "apiKey", "baseUrl": "https://developers.pandadoc.com"},
    {"name": "Pocket API", "description": "Bookmarking service", "category": "Documents", "authType": "oauth", "baseUrl": "https://getpocket.com/developer/"},
    {"name": "Podio API", "description": "File sharing and productivity", "category": "Documents", "authType": "oauth", "baseUrl": "https://developers.podio.com"},
    {"name": "PrexView", "description": "Data to PDF, HTML or Image", "category": "Documents", "authType": "apiKey", "baseUrl": "https://prexview.com"},
    {"name": "Restpack", "description": "Screenshot and PDF APIs", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://restpack.io/"},
    {"name": "Todoist API", "description": "Todo Lists", "category": "Documents", "authType": "oauth", "baseUrl": "https://developer.todoist.com"},
    {"name": "Smart Image Enhancement", "description": "Image upscaling API", "category": "Images", "authType": "apiKey", "baseUrl": "https://apilayer.com/"},
    {"name": "WakaTime", "description": "Automated time tracking", "category": "Development", "authType": "none", "baseUrl": "https://wakatime.com/"},
    {"name": "Zube API", "description": "Project management", "category": "Documents", "authType": "oauth", "baseUrl": "https://zube.io/docs/api"},
    
    # Email
    {"name": "apilayer mailboxlayer", "description": "Email address validation", "category": "Email", "authType": "apiKey", "baseUrl": "https://mailboxlayer.com"},
    {"name": "Abstract Email Validation", "description": "Validate email deliverability", "category": "Email", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/email-verification-validation-api"},
    {"name": "Cloudmersive Validate", "description": "Validate emails and phones", "category": "Validation", "authType": "apiKey", "baseUrl": "https://cloudmersive.com/validate-api"},
    {"name": "Disify", "description": "Detect disposable emails", "category": "Email", "authType": "none", "baseUrl": "https://www.disify.com/"},
    {"name": "DropMail", "description": "GraphQL for ephemeral inboxes", "category": "Email", "authType": "none", "baseUrl": "https://dropmail.me/"},
    {"name": "EVA", "description": "Validate email addresses", "category": "Email", "authType": "none", "baseUrl": "https://eva.pingutil.com/"},
    {"name": "Guerrilla Mail", "description": "Disposable temporary Email", "category": "Email", "authType": "none", "baseUrl": "https://www.guerrillamail.com/"},
    {"name": "ImprovMX", "description": "Free email forwarding", "category": "Email", "authType": "apiKey", "baseUrl": "https://improvmx.com/api"},
    {"name": "Kickbox", "description": "Email verification API", "category": "Email", "authType": "none", "baseUrl": "https://open.kickbox.com/"},
    {"name": "mail.gw", "description": "10 Minute Mail", "category": "Email", "authType": "none", "baseUrl": "https://docs.mail.gw"},
    {"name": "mail.tm", "description": "Temporary Email Service", "category": "Email", "authType": "none", "baseUrl": "https://docs.mail.tm"},
    {"name": "MailboxValidator", "description": "Validate email to improve delivery", "category": "Email", "authType": "apiKey", "baseUrl": "https://www.mailboxvalidator.com/"},
    {"name": "MailCheck.ai", "description": "Prevent temp email signups", "category": "Email", "authType": "none", "baseUrl": "https://www.mailcheck.ai/"},
    {"name": "Mailtrap", "description": "Safe testing of emails", "category": "Email", "authType": "apiKey", "baseUrl": "https://mailtrap.io/"},
    {"name": "SendGrid", "description": "Cloud-based SMTP provider", "category": "Email", "authType": "apiKey", "baseUrl": "https://docs.sendgrid.com/"},
    {"name": "Sendinblue API", "description": "Marketing and transactional email", "category": "Email", "authType": "apiKey", "baseUrl": "https://developers.sendinblue.com/"},
    {"name": "Verifier", "description": "Verify emails are real", "category": "Email", "authType": "apiKey", "baseUrl": "https://verifier.meetchopra.com/"},
    
    # Entertainment extras
    {"name": "chucknorris.io", "description": "Chuck Norris jokes", "category": "Entertainment", "authType": "none", "baseUrl": "https://api.chucknorris.io"},
    {"name": "Corporate Buzz Words", "description": "Corporate BS generator", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/sameerkumar18/corporate-bs-generator-api"},
    {"name": "Excuser", "description": "Get random excuses", "category": "Entertainment", "authType": "none", "baseUrl": "https://excuser.herokuapp.com/"},
    {"name": "Fun Fact API", "description": "Random facts from FFA database", "category": "Entertainment", "authType": "none", "baseUrl": "https://api.aakhilv.me"},
    {"name": "Imgflip", "description": "Array of popular memes", "category": "Entertainment", "authType": "none", "baseUrl": "https://imgflip.com/api"},
    {"name": "Meme Maker", "description": "REST API for memes", "category": "Entertainment", "authType": "none", "baseUrl": "https://mememaker.github.io/"},
    {"name": "NaMoMemes", "description": "Memes on Narendra Modi", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/theIYD/NaMoMemes"},
    {"name": "Random Useless Facts", "description": "Get useless but true facts", "category": "Entertainment", "authType": "none", "baseUrl": "https://uselessfacts.jsph.pl/"},
    {"name": "Techy API", "description": "Tech-savvy sounding phrases", "category": "Entertainment", "authType": "none", "baseUrl": "https://techy-api.vercel.app/"},
    {"name": "Yo Momma Jokes", "description": "REST API for Yo Momma Jokes", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/beanboi7/yomomma-apiv2"},
    
    # Environment
    {"name": "BreezoMeter Pollen", "description": "Daily Forecast pollen conditions", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.breezometer.com/"},
    {"name": "Carbon Interface", "description": "Calculate carbon emissions", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.carboninterface.com/"},
    {"name": "Climatiq", "description": "Calculate environmental footprint", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.climatiq.io"},
    {"name": "Cloverly", "description": "API calculates carbon impact", "category": "Environment", "authType": "apiKey", "baseUrl": "https://www.cloverly.com/"},
    {"name": "CO2 Offset", "description": "Calculate carbon footprint", "category": "Environment", "authType": "none", "baseUrl": "https://co2offset.io/"},
    {"name": "Danish Energi Data", "description": "Open energy data from Denmark", "category": "Environment", "authType": "none", "baseUrl": "https://www.energidataservice.dk/"},
    {"name": "GrünstromIndex", "description": "Green Power Index for Germany", "category": "Environment", "authType": "none", "baseUrl": "https://gruenstromindex.de/"},
    {"name": "IQAir", "description": "Air quality and weather data", "category": "Environment", "authType": "apiKey", "baseUrl": "https://www.iqair.com/"},
    {"name": "Luchtmeetnet", "description": "Air quality for Netherlands", "category": "Environment", "authType": "none", "baseUrl": "https://api-docs.luchtmeetnet.nl/"},
    {"name": "National Grid ESO", "description": "GB Electricity System data", "category": "Environment", "authType": "none", "baseUrl": "https://data.nationalgrideso.com/"},
    {"name": "OpenAQ", "description": "Open air quality data", "category": "Environment", "authType": "apiKey", "baseUrl": "https://docs.openaq.org/"},
    {"name": "PM2.5 Portal", "description": "Low-cost PM2.5 sensor data", "category": "Environment", "authType": "none", "baseUrl": "https://pm25.lass-net.org/"},
    {"name": "PM25.in", "description": "Air quality of China", "category": "Environment", "authType": "apiKey", "baseUrl": "http://www.pm25.in/"},
    {"name": "PVWatts", "description": "Photovoltaic energy production", "category": "Environment", "authType": "apiKey", "baseUrl": "https://developer.nrel.gov/"},
    {"name": "Srp Energy", "description": "Hourly energy usage report", "category": "Environment", "authType": "apiKey", "baseUrl": "https://srpenergy-api-client-python.readthedocs.io/"},
    {"name": "UK Carbon Intensity", "description": "Carbon Intensity API for GB", "category": "Environment", "authType": "none", "baseUrl": "https://carbon-intensity.github.io/"},
    {"name": "Website Carbon", "description": "Estimate carbon footprint of websites", "category": "Environment", "authType": "none", "baseUrl": "https://api.websitecarbon.com/"},
    
    # Events
    {"name": "Eventbrite API", "description": "Find events", "category": "Events", "authType": "oauth", "baseUrl": "https://www.eventbrite.com/platform/api/"},
    {"name": "SeatGeek", "description": "Search events and venues", "category": "Events", "authType": "apiKey", "baseUrl": "https://platform.seatgeek.com/"},
    {"name": "Ticketmaster", "description": "Search events and attractions", "category": "Events", "authType": "apiKey", "baseUrl": "https://developer.ticketmaster.com/"},
    
    # Finance extras
    {"name": "Abstract VAT Validation", "description": "Validate VAT numbers", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/vat-validation-rates-api"},
    {"name": "Aletheia", "description": "Insider trading data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://aletheiaapi.com/"},
    {"name": "Alpaca", "description": "Realtime stock data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://alpaca.markets/"},
    {"name": "apilayer marketstack", "description": "Real-Time Market Data API", "category": "Finance", "authType": "apiKey", "baseUrl": "https://marketstack.com/"},
    {"name": "Banco do Brasil", "description": "All BB financial APIs", "category": "Finance", "authType": "oauth", "baseUrl": "https://developers.bb.com.br/"},
    {"name": "Bank Data API", "description": "IBAN and SWIFT validation", "category": "Finance", "authType": "apiKey", "baseUrl": "https://apilayer.com/"},
    {"name": "Billplz", "description": "Payment platform", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.billplz.com/api"},
    {"name": "Binlist", "description": "IIN/BIN information database", "category": "Finance", "authType": "none", "baseUrl": "https://binlist.net/"},
    {"name": "Boleto.Cloud", "description": "Generate boletos in Brazil", "category": "Finance", "authType": "apiKey", "baseUrl": "https://boleto.cloud/"},
    {"name": "Citi API", "description": "Citigroup account and statement data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://sandbox.developerhub.citi.com/"},
    {"name": "Econdb", "description": "Global macroeconomic data", "category": "Finance", "authType": "none", "baseUrl": "https://www.econdb.com/api/"},
    {"name": "Fed Treasury", "description": "US Treasury Department Data", "category": "Finance", "authType": "none", "baseUrl": "https://fiscaldata.treasury.gov/"},
    {"name": "Finage", "description": "Real-time financial data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://finage.co.uk"},
    {"name": "Financial Modeling Prep", "description": "Realtime stock data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://site.financialmodelingprep.com/"},
    {"name": "Finnhub", "description": "Real-Time APIs for Stocks", "category": "Finance", "authType": "apiKey", "baseUrl": "https://finnhub.io/"},
    {"name": "FRED API", "description": "Federal Reserve economic data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://fred.stlouisfed.org/"},
    {"name": "Front Accounting APIs", "description": "Multilingual accounting software", "category": "Finance", "authType": "oauth", "baseUrl": "https://frontaccounting.com/"},
    {"name": "Hotstoks", "description": "Stock market data powered by SQL", "category": "Finance", "authType": "apiKey", "baseUrl": "https://hotstoks.com"},
    {"name": "IG API", "description": "Spreadbetting and CFD Market Data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://labs.ig.com/"},
    {"name": "Indian Mutual Fund", "description": "India Mutual Funds Data", "category": "Finance", "authType": "none", "baseUrl": "https://www.mfapi.in/"},
    {"name": "Intrinio", "description": "Financial data feeds", "category": "Finance", "authType": "apiKey", "baseUrl": "https://intrinio.com/"},
    {"name": "Klarna API", "description": "Klarna payment service", "category": "Finance", "authType": "apiKey", "baseUrl": "https://docs.klarna.com/"},
    {"name": "MercadoPago", "description": "Mercado Pago API reference", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.mercadopago.com.br/"},
    {"name": "Mono API", "description": "Connect bank accounts in Africa", "category": "Finance", "authType": "apiKey", "baseUrl": "https://mono.co/"},
    {"name": "Moov API", "description": "Send, receive, store money", "category": "Finance", "authType": "apiKey", "baseUrl": "https://docs.moov.io/"},
    {"name": "Nordigen", "description": "Connect to bank accounts", "category": "Finance", "authType": "apiKey", "baseUrl": "https://nordigen.com/"},
    {"name": "OpenFIGI", "description": "Bloomberg LP symbology", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.openfigi.com/api"},
    {"name": "Plaid API", "description": "Connect bank accounts", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.plaid.com/docs"},
    {"name": "Polygon", "description": "Historical stock market data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://polygon.io/"},
    {"name": "Razorpay IFSC", "description": "Indian Bank Branch Codes", "category": "Finance", "authType": "none", "baseUrl": "https://razorpay.com/docs/"},
    {"name": "Real Time Finance", "description": "Websocket for stock data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://github.com/Real-time-finance/"},
    {"name": "SEC EDGAR Data", "description": "Annual reports of US companies", "category": "Finance", "authType": "none", "baseUrl": "https://www.sec.gov/edgar/"},
    {"name": "SmartAPI", "description": "SmartAPI for broking services", "category": "Finance", "authType": "apiKey", "baseUrl": "https://smartapi.angelbroking.com/"},
    {"name": "StockData", "description": "Real-Time Market Data API", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.stockdata.org"},
    {"name": "Styvio", "description": "Realtime stock data and sentiment", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.styvio.com"},
    {"name": "Tax Data API", "description": "VAT number validation", "category": "Finance", "authType": "apiKey", "baseUrl": "https://apilayer.com/"},
    {"name": "Tradier", "description": "US equity/option market data", "category": "Finance", "authType": "oauth", "baseUrl": "https://developer.tradier.com"},
    {"name": "WallstreetBets", "description": "Stock Comments Sentiment Analysis", "category": "Finance", "authType": "none", "baseUrl": "https://dashboard.nbshare.io/"},
    {"name": "Yahoo Finance API", "description": "Real time stock market data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.yahoofinanceapi.com/"},
    {"name": "YNAB API", "description": "Budgeting and Planning", "category": "Finance", "authType": "oauth", "baseUrl": "https://api.youneedabudget.com/"},
    {"name": "Zoho Books", "description": "Online accounting software", "category": "Finance", "authType": "oauth", "baseUrl": "https://www.zoho.com/books/"},
]

new_apis = []
for api in batch2_apis:
    name_lower = api["name"].lower()
    url_lower = api.get("baseUrl", "").lower()
    
    if name_lower in existing_names:
        continue
    if url_lower and url_lower in existing_urls:
        continue
    
    new_apis.append(api)
    existing_names.add(name_lower)
    existing_urls.add(url_lower)

# Save batch 2
batch2_file = os.path.expanduser("~/Projects/apiclaw/data/night-expansion-02-27-batch2.json")
with open(batch2_file, "w") as f:
    json.dump(new_apis, f, indent=2)

print(f"Batch 2 new APIs: {len(new_apis)}")

# Update combined
combined = existing + new_apis
combined_file = os.path.expanduser("~/Projects/apiclaw/data/combined-02-27.json")
with open(combined_file, "w") as f:
    json.dump(combined, f, indent=2)

print(f"Total APIs in combined: {len(combined)}")
