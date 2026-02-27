#!/usr/bin/env python3
"""
APIClaw Night Expansion - 05:00 batch 2
More comprehensive API coverage
"""

import json
import os

NEW_APIS = [
    # ===== BUSINESS & PRODUCTIVITY (60+) =====
    {"name": "Notion API", "description": "Workspace and wiki API", "category": "Productivity", "baseUrl": "https://developers.notion.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Airtable", "description": "Spreadsheet-database hybrid", "category": "Productivity", "baseUrl": "https://airtable.com/developers", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Monday.com", "description": "Work management platform", "category": "Productivity", "baseUrl": "https://developer.monday.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ClickUp", "description": "Project management platform", "category": "Productivity", "baseUrl": "https://clickup.com/api", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Asana", "description": "Work management platform", "category": "Productivity", "baseUrl": "https://developers.asana.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Jira", "description": "Issue tracking and agile PM", "category": "Productivity", "baseUrl": "https://developer.atlassian.com/cloud/jira/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Linear", "description": "Issue tracking for teams", "category": "Productivity", "baseUrl": "https://linear.app/developers", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Trello", "description": "Kanban board platform", "category": "Productivity", "baseUrl": "https://developer.atlassian.com/cloud/trello/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Todoist", "description": "Task management app", "category": "Productivity", "baseUrl": "https://developer.todoist.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Things", "description": "Personal task manager", "category": "Productivity", "baseUrl": "https://culturedcode.com/things/", "authType": "none", "pricing": "paid"},
    {"name": "Basecamp", "description": "Project management", "category": "Productivity", "baseUrl": "https://github.com/basecamp/bc3-api", "authType": "oauth", "pricing": "paid"},
    {"name": "Teamwork", "description": "Project management platform", "category": "Productivity", "baseUrl": "https://developer.teamwork.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Wrike", "description": "Work management platform", "category": "Productivity", "baseUrl": "https://developers.wrike.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Height", "description": "Project management for teams", "category": "Productivity", "baseUrl": "https://height.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Plane", "description": "Open source project management", "category": "Productivity", "baseUrl": "https://plane.so/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Coda", "description": "All-in-one doc", "category": "Productivity", "baseUrl": "https://coda.io/developers", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Craft", "description": "Document and note-taking", "category": "Productivity", "baseUrl": "https://www.craft.do/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Obsidian", "description": "Knowledge base app", "category": "Productivity", "baseUrl": "https://obsidian.md/", "authType": "none", "pricing": "freemium"},
    {"name": "Roam Research", "description": "Note-taking tool", "category": "Productivity", "baseUrl": "https://roamresearch.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Logseq", "description": "Privacy-first knowledge base", "category": "Productivity", "baseUrl": "https://logseq.com/", "authType": "none", "pricing": "free"},
    
    # ===== CRM & SALES (40+) =====
    {"name": "Salesforce", "description": "Enterprise CRM platform", "category": "CRM", "baseUrl": "https://developer.salesforce.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "HubSpot", "description": "CRM and marketing platform", "category": "CRM", "baseUrl": "https://developers.hubspot.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Pipedrive", "description": "Sales CRM", "category": "CRM", "baseUrl": "https://developers.pipedrive.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Close", "description": "Sales CRM for startups", "category": "CRM", "baseUrl": "https://developer.close.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Copper", "description": "CRM for Google Workspace", "category": "CRM", "baseUrl": "https://developer.copper.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Freshsales", "description": "Sales CRM software", "category": "CRM", "baseUrl": "https://developers.freshworks.com/crm/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Zoho CRM", "description": "CRM software", "category": "CRM", "baseUrl": "https://www.zoho.com/crm/developer/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Attio", "description": "Next-gen CRM", "category": "CRM", "baseUrl": "https://attio.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Folk", "description": "Collaborative CRM", "category": "CRM", "baseUrl": "https://www.folk.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Affinity", "description": "Relationship intelligence CRM", "category": "CRM", "baseUrl": "https://www.affinity.co/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Apollo.io", "description": "Sales intelligence platform", "category": "Sales", "baseUrl": "https://www.apollo.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ZoomInfo", "description": "B2B contact database", "category": "Sales", "baseUrl": "https://www.zoominfo.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Clearbit", "description": "Data enrichment API", "category": "Sales", "baseUrl": "https://clearbit.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Hunter.io", "description": "Email finder and verifier", "category": "Sales", "baseUrl": "https://hunter.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Lusha", "description": "B2B contact data", "category": "Sales", "baseUrl": "https://www.lusha.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Snov.io", "description": "Sales automation platform", "category": "Sales", "baseUrl": "https://snov.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Lemlist", "description": "Cold email outreach", "category": "Sales", "baseUrl": "https://www.lemlist.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Reply.io", "description": "Sales engagement platform", "category": "Sales", "baseUrl": "https://reply.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Outreach", "description": "Sales execution platform", "category": "Sales", "baseUrl": "https://www.outreach.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "SalesLoft", "description": "Revenue workflow platform", "category": "Sales", "baseUrl": "https://salesloft.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== MARKETING & ADVERTISING (40+) =====
    {"name": "Mailchimp", "description": "Email marketing platform", "category": "Marketing", "baseUrl": "https://mailchimp.com/developer/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ConvertKit", "description": "Creator marketing platform", "category": "Marketing", "baseUrl": "https://developers.convertkit.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Beehiiv", "description": "Newsletter platform", "category": "Marketing", "baseUrl": "https://www.beehiiv.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Substack", "description": "Newsletter publishing", "category": "Marketing", "baseUrl": "https://substack.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Buttondown", "description": "Newsletter platform", "category": "Marketing", "baseUrl": "https://buttondown.email/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ActiveCampaign", "description": "Marketing automation", "category": "Marketing", "baseUrl": "https://developers.activecampaign.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Klaviyo", "description": "E-commerce marketing", "category": "Marketing", "baseUrl": "https://developers.klaviyo.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Braze", "description": "Customer engagement platform", "category": "Marketing", "baseUrl": "https://www.braze.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Customer.io", "description": "Messaging automation", "category": "Marketing", "baseUrl": "https://customer.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Iterable", "description": "Cross-channel marketing", "category": "Marketing", "baseUrl": "https://iterable.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Google Ads", "description": "Online advertising platform", "category": "Advertising", "baseUrl": "https://developers.google.com/google-ads/api/", "authType": "oauth", "pricing": "paid"},
    {"name": "Meta Ads", "description": "Facebook/Instagram advertising", "category": "Advertising", "baseUrl": "https://developers.facebook.com/docs/marketing-apis", "authType": "oauth", "pricing": "paid"},
    {"name": "Microsoft Advertising", "description": "Bing ads platform", "category": "Advertising", "baseUrl": "https://docs.microsoft.com/advertising/", "authType": "oauth", "pricing": "paid"},
    {"name": "LinkedIn Ads", "description": "Professional advertising", "category": "Advertising", "baseUrl": "https://docs.microsoft.com/linkedin/marketing/", "authType": "oauth", "pricing": "paid"},
    {"name": "Twitter Ads", "description": "X advertising platform", "category": "Advertising", "baseUrl": "https://developer.twitter.com/en/docs/twitter-ads-api", "authType": "oauth", "pricing": "paid"},
    {"name": "TikTok Ads", "description": "TikTok for business", "category": "Advertising", "baseUrl": "https://ads.tiktok.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "Hotjar", "description": "Behavior analytics", "category": "Marketing", "baseUrl": "https://www.hotjar.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "FullStory", "description": "Digital experience analytics", "category": "Marketing", "baseUrl": "https://www.fullstory.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Crazy Egg", "description": "Heatmaps and recordings", "category": "Marketing", "baseUrl": "https://www.crazyegg.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Lucky Orange", "description": "Conversion optimization", "category": "Marketing", "baseUrl": "https://www.luckyorange.com/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== SUPPORT & HELPDESK (30+) =====
    {"name": "Zendesk", "description": "Customer service platform", "category": "Support", "baseUrl": "https://developer.zendesk.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Intercom", "description": "Customer messaging platform", "category": "Support", "baseUrl": "https://developers.intercom.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Freshdesk", "description": "Customer support software", "category": "Support", "baseUrl": "https://developers.freshdesk.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Help Scout", "description": "Customer support platform", "category": "Support", "baseUrl": "https://developer.helpscout.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Crisp", "description": "Customer messaging platform", "category": "Support", "baseUrl": "https://crisp.chat/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Drift", "description": "Conversational marketing", "category": "Support", "baseUrl": "https://devdocs.drift.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "LiveChat", "description": "Live chat software", "category": "Support", "baseUrl": "https://developers.livechat.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Tidio", "description": "Live chat and chatbots", "category": "Support", "baseUrl": "https://www.tidio.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Tawk.to", "description": "Free live chat", "category": "Support", "baseUrl": "https://www.tawk.to/", "authType": "apiKey", "pricing": "free"},
    {"name": "Chatwoot", "description": "Open source customer support", "category": "Support", "baseUrl": "https://www.chatwoot.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Front", "description": "Customer communication hub", "category": "Support", "baseUrl": "https://dev.frontapp.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Gorgias", "description": "E-commerce helpdesk", "category": "Support", "baseUrl": "https://developers.gorgias.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Kustomer", "description": "Customer service CRM", "category": "Support", "baseUrl": "https://developer.kustomer.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Gladly", "description": "Customer service platform", "category": "Support", "baseUrl": "https://www.gladly.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Dixa", "description": "Customer friendship platform", "category": "Support", "baseUrl": "https://www.dixa.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== HR & RECRUITING (30+) =====
    {"name": "Greenhouse", "description": "Recruiting software", "category": "HR", "baseUrl": "https://developers.greenhouse.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Lever", "description": "Recruiting platform", "category": "HR", "baseUrl": "https://hire.lever.co/developer/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Workday", "description": "HR management", "category": "HR", "baseUrl": "https://www.workday.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "BambooHR", "description": "HR software", "category": "HR", "baseUrl": "https://www.bamboohr.com/api/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Gusto", "description": "Payroll and HR", "category": "HR", "baseUrl": "https://docs.gusto.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Rippling", "description": "HR, IT, and finance", "category": "HR", "baseUrl": "https://www.rippling.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Deel", "description": "Global payroll and HR", "category": "HR", "baseUrl": "https://www.deel.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Remote", "description": "Global HR platform", "category": "HR", "baseUrl": "https://remote.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Oyster", "description": "Global employment platform", "category": "HR", "baseUrl": "https://www.oysterhr.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Personio", "description": "HR software for SMBs", "category": "HR", "baseUrl": "https://developer.personio.de/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Factorial", "description": "HR software", "category": "HR", "baseUrl": "https://factorialhr.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Charlie HR", "description": "HR platform for startups", "category": "HR", "baseUrl": "https://www.charliehr.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Hibob", "description": "HR platform", "category": "HR", "baseUrl": "https://www.hibob.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Lattice", "description": "People management", "category": "HR", "baseUrl": "https://lattice.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "15Five", "description": "Performance management", "category": "HR", "baseUrl": "https://www.15five.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== FINANCE & ACCOUNTING (30+) =====
    {"name": "QuickBooks", "description": "Accounting software", "category": "Accounting", "baseUrl": "https://developer.intuit.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "Xero", "description": "Cloud accounting", "category": "Accounting", "baseUrl": "https://developer.xero.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "FreshBooks", "description": "Invoicing and accounting", "category": "Accounting", "baseUrl": "https://www.freshbooks.com/api/", "authType": "oauth", "pricing": "paid"},
    {"name": "Wave", "description": "Free accounting software", "category": "Accounting", "baseUrl": "https://developer.waveapps.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Sage", "description": "Business software", "category": "Accounting", "baseUrl": "https://developer.sage.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "Zoho Books", "description": "Online accounting", "category": "Accounting", "baseUrl": "https://www.zoho.com/books/api/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Fortnox", "description": "Swedish business software", "category": "Accounting", "baseUrl": "https://developer.fortnox.se/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Visma", "description": "Nordic business software", "category": "Accounting", "baseUrl": "https://developer.visma.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "Fiken", "description": "Norwegian accounting", "category": "Accounting", "baseUrl": "https://fiken.no/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Dinero", "description": "Danish accounting", "category": "Accounting", "baseUrl": "https://dinero.dk/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Chargebee", "description": "Subscription billing", "category": "Billing", "baseUrl": "https://www.chargebee.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Recurly", "description": "Subscription management", "category": "Billing", "baseUrl": "https://developers.recurly.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Zuora", "description": "Subscription platform", "category": "Billing", "baseUrl": "https://www.zuora.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Stripe Billing", "description": "Subscription billing", "category": "Billing", "baseUrl": "https://stripe.com/billing", "authType": "apiKey", "pricing": "paid"},
    {"name": "Billwerk", "description": "Subscription management", "category": "Billing", "baseUrl": "https://www.billwerk.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== LOGISTICS & SHIPPING (30+) =====
    {"name": "Shippo", "description": "Shipping API", "category": "Shipping", "baseUrl": "https://goshippo.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "EasyPost", "description": "Shipping API", "category": "Shipping", "baseUrl": "https://www.easypost.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "ShipStation", "description": "Shipping software", "category": "Shipping", "baseUrl": "https://www.shipstation.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Shipbob", "description": "E-commerce fulfillment", "category": "Shipping", "baseUrl": "https://www.shipbob.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Flexport", "description": "Freight forwarding", "category": "Shipping", "baseUrl": "https://www.flexport.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "AfterShip", "description": "Shipment tracking", "category": "Shipping", "baseUrl": "https://www.aftership.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "17track", "description": "Package tracking", "category": "Shipping", "baseUrl": "https://api.17track.net/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Parcelsapp", "description": "Tracking API", "category": "Shipping", "baseUrl": "https://parcelsapp.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Sendcloud", "description": "European shipping", "category": "Shipping", "baseUrl": "https://www.sendcloud.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Bring", "description": "Nordic logistics", "category": "Shipping", "baseUrl": "https://developer.bring.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "PostNord", "description": "Nordic postal service", "category": "Shipping", "baseUrl": "https://developer.postnord.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "DHL", "description": "Global shipping", "category": "Shipping", "baseUrl": "https://developer.dhl.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "FedEx", "description": "Shipping and logistics", "category": "Shipping", "baseUrl": "https://developer.fedex.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "UPS", "description": "Shipping company", "category": "Shipping", "baseUrl": "https://developer.ups.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "USPS", "description": "US postal service", "category": "Shipping", "baseUrl": "https://www.usps.com/business/web-tools-apis/", "authType": "apiKey", "pricing": "free"},
    
    # ===== LEGAL & COMPLIANCE (25+) =====
    {"name": "DocuSign", "description": "E-signature platform", "category": "Legal", "baseUrl": "https://developers.docusign.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "HelloSign", "description": "E-signature API", "category": "Legal", "baseUrl": "https://www.hellosign.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "PandaDoc", "description": "Document automation", "category": "Legal", "baseUrl": "https://developers.pandadoc.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "SignNow", "description": "E-signature solution", "category": "Legal", "baseUrl": "https://www.signnow.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Signeasy", "description": "E-signature platform", "category": "Legal", "baseUrl": "https://signeasy.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "GetAccept", "description": "Digital sales room", "category": "Legal", "baseUrl": "https://www.getaccept.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Contractbook", "description": "Contract automation", "category": "Legal", "baseUrl": "https://contractbook.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Ironclad", "description": "Contract lifecycle", "category": "Legal", "baseUrl": "https://ironcladapp.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Precisely", "description": "Legal document automation", "category": "Legal", "baseUrl": "https://precisely.se/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Oneflow", "description": "Contract automation", "category": "Legal", "baseUrl": "https://oneflow.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Vanta", "description": "Security compliance", "category": "Compliance", "baseUrl": "https://www.vanta.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Drata", "description": "Compliance automation", "category": "Compliance", "baseUrl": "https://drata.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Secureframe", "description": "Security compliance", "category": "Compliance", "baseUrl": "https://secureframe.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Laika", "description": "Compliance platform", "category": "Compliance", "baseUrl": "https://heylaika.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "OneTrust", "description": "Privacy management", "category": "Compliance", "baseUrl": "https://www.onetrust.com/", "authType": "apiKey", "pricing": "paid"},
    
    # ===== DESIGN & CREATIVE (30+) =====
    {"name": "Figma", "description": "Collaborative design tool", "category": "Design", "baseUrl": "https://www.figma.com/developers", "authType": "oauth", "pricing": "freemium"},
    {"name": "Canva", "description": "Graphic design platform", "category": "Design", "baseUrl": "https://www.canva.com/developers/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Adobe Creative Cloud", "description": "Creative software suite", "category": "Design", "baseUrl": "https://developer.adobe.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "Sketch", "description": "Design toolkit", "category": "Design", "baseUrl": "https://developer.sketch.com/", "authType": "oauth", "pricing": "paid"},
    {"name": "InVision", "description": "Digital product design", "category": "Design", "baseUrl": "https://www.invisionapp.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Zeplin", "description": "Design to development", "category": "Design", "baseUrl": "https://zeplin.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Abstract", "description": "Design version control", "category": "Design", "baseUrl": "https://www.abstract.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Lottie", "description": "Animation library", "category": "Design", "baseUrl": "https://lottiefiles.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Rive", "description": "Animation tool", "category": "Design", "baseUrl": "https://rive.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Spline", "description": "3D design tool", "category": "Design", "baseUrl": "https://spline.design/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Miro", "description": "Visual collaboration", "category": "Design", "baseUrl": "https://developers.miro.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "FigJam", "description": "Online whiteboard", "category": "Design", "baseUrl": "https://www.figma.com/figjam/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Whimsical", "description": "Visual workspace", "category": "Design", "baseUrl": "https://whimsical.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Excalidraw", "description": "Hand-drawn diagrams", "category": "Design", "baseUrl": "https://excalidraw.com/", "authType": "none", "pricing": "free"},
    {"name": "tldraw", "description": "Collaborative drawing", "category": "Design", "baseUrl": "https://www.tldraw.com/", "authType": "none", "pricing": "free"},
    
    # ===== MEDIA & ENTERTAINMENT (25+) =====
    {"name": "Spotify", "description": "Music streaming API", "category": "Media", "baseUrl": "https://developer.spotify.com/", "authType": "oauth", "pricing": "free"},
    {"name": "Apple Music", "description": "Music streaming API", "category": "Media", "baseUrl": "https://developer.apple.com/musickit/", "authType": "apiKey", "pricing": "free"},
    {"name": "SoundCloud", "description": "Audio platform API", "category": "Media", "baseUrl": "https://developers.soundcloud.com/", "authType": "oauth", "pricing": "free"},
    {"name": "Deezer", "description": "Music streaming API", "category": "Media", "baseUrl": "https://developers.deezer.com/", "authType": "oauth", "pricing": "free"},
    {"name": "Last.fm", "description": "Music data API", "category": "Media", "baseUrl": "https://www.last.fm/api", "authType": "apiKey", "pricing": "free"},
    {"name": "MusicBrainz", "description": "Music metadata", "category": "Media", "baseUrl": "https://musicbrainz.org/doc/MusicBrainz_API", "authType": "none", "pricing": "free"},
    {"name": "Discogs", "description": "Music database", "category": "Media", "baseUrl": "https://www.discogs.com/developers/", "authType": "oauth", "pricing": "free"},
    {"name": "Twitch", "description": "Live streaming API", "category": "Media", "baseUrl": "https://dev.twitch.tv/", "authType": "oauth", "pricing": "free"},
    {"name": "Vimeo", "description": "Video platform API", "category": "Media", "baseUrl": "https://developer.vimeo.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Dailymotion", "description": "Video platform API", "category": "Media", "baseUrl": "https://developer.dailymotion.com/", "authType": "oauth", "pricing": "free"},
    {"name": "TMDb", "description": "Movie database API", "category": "Media", "baseUrl": "https://www.themoviedb.org/documentation/api", "authType": "apiKey", "pricing": "free"},
    {"name": "OMDb", "description": "Open movie database", "category": "Media", "baseUrl": "https://www.omdbapi.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "IGDB", "description": "Video game database", "category": "Media", "baseUrl": "https://www.igdb.com/api", "authType": "apiKey", "pricing": "free"},
    {"name": "RAWG", "description": "Video game database", "category": "Media", "baseUrl": "https://rawg.io/apidocs", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Giant Bomb", "description": "Video game wiki API", "category": "Media", "baseUrl": "https://www.giantbomb.com/api/", "authType": "apiKey", "pricing": "free"},
    
    # ===== DATA & OPEN DATA (30+) =====
    {"name": "OpenCorporates", "description": "Corporate data API", "category": "Data", "baseUrl": "https://api.opencorporates.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Crunchbase", "description": "Business data API", "category": "Data", "baseUrl": "https://data.crunchbase.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "PitchBook", "description": "Private market data", "category": "Data", "baseUrl": "https://pitchbook.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "CB Insights", "description": "Business analytics", "category": "Data", "baseUrl": "https://www.cbinsights.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Owler", "description": "Company intelligence", "category": "Data", "baseUrl": "https://www.owler.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Diffbot", "description": "Web data extraction", "category": "Data", "baseUrl": "https://www.diffbot.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Import.io", "description": "Web data extraction", "category": "Data", "baseUrl": "https://www.import.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "ScrapingHub", "description": "Web scraping cloud", "category": "Data", "baseUrl": "https://scrapinghub.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Bright Data", "description": "Web data platform", "category": "Data", "baseUrl": "https://brightdata.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Oxylabs", "description": "Web scraping solutions", "category": "Data", "baseUrl": "https://oxylabs.io/", "authType": "apiKey", "pricing": "paid"},
    {"name": "World Bank API", "description": "Development indicators", "category": "Open Data", "baseUrl": "https://data.worldbank.org/", "authType": "none", "pricing": "free"},
    {"name": "UN Data", "description": "United Nations data", "category": "Open Data", "baseUrl": "https://data.un.org/", "authType": "none", "pricing": "free"},
    {"name": "Eurostat", "description": "European statistics", "category": "Open Data", "baseUrl": "https://ec.europa.eu/eurostat/api/", "authType": "none", "pricing": "free"},
    {"name": "OECD", "description": "Economic data", "category": "Open Data", "baseUrl": "https://data.oecd.org/", "authType": "none", "pricing": "free"},
    {"name": "Data.gov", "description": "US government data", "category": "Open Data", "baseUrl": "https://data.gov/", "authType": "none", "pricing": "free"},
    
    # ===== SECURITY (25+) =====
    {"name": "Have I Been Pwned", "description": "Data breach checker", "category": "Security", "baseUrl": "https://haveibeenpwned.com/API/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Shodan", "description": "Internet device search", "category": "Security", "baseUrl": "https://developer.shodan.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "VirusTotal", "description": "File and URL scanner", "category": "Security", "baseUrl": "https://developers.virustotal.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "URLScan", "description": "URL analysis service", "category": "Security", "baseUrl": "https://urlscan.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "SecurityTrails", "description": "DNS and domain data", "category": "Security", "baseUrl": "https://securitytrails.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Censys", "description": "Internet asset discovery", "category": "Security", "baseUrl": "https://censys.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "BinaryEdge", "description": "Internet security data", "category": "Security", "baseUrl": "https://www.binaryedge.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "GreyNoise", "description": "Internet background noise", "category": "Security", "baseUrl": "https://www.greynoise.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "AlienVault OTX", "description": "Threat intelligence", "category": "Security", "baseUrl": "https://otx.alienvault.com/", "authType": "apiKey", "pricing": "free"},
    {"name": "AbuseIPDB", "description": "IP reputation database", "category": "Security", "baseUrl": "https://www.abuseipdb.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "1Password", "description": "Password manager API", "category": "Security", "baseUrl": "https://developer.1password.com/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Bitwarden", "description": "Password manager", "category": "Security", "baseUrl": "https://bitwarden.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "LastPass", "description": "Password manager", "category": "Security", "baseUrl": "https://www.lastpass.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Snyk", "description": "Security platform", "category": "Security", "baseUrl": "https://snyk.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Socket", "description": "Dependency security", "category": "Security", "baseUrl": "https://socket.dev/", "authType": "apiKey", "pricing": "freemium"},
    
    # ===== FORMS & SURVEYS (20+) =====
    {"name": "Typeform", "description": "Interactive forms", "category": "Forms", "baseUrl": "https://developer.typeform.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "JotForm", "description": "Form builder", "category": "Forms", "baseUrl": "https://api.jotform.com/docs/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Google Forms", "description": "Form creation tool", "category": "Forms", "baseUrl": "https://developers.google.com/apps-script/reference/forms", "authType": "oauth", "pricing": "free"},
    {"name": "SurveyMonkey", "description": "Survey platform", "category": "Forms", "baseUrl": "https://developer.surveymonkey.com/", "authType": "oauth", "pricing": "freemium"},
    {"name": "Tally", "description": "Free form builder", "category": "Forms", "baseUrl": "https://tally.so/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Formbricks", "description": "Open source survey", "category": "Forms", "baseUrl": "https://formbricks.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Fillout", "description": "Form builder", "category": "Forms", "baseUrl": "https://www.fillout.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Reform", "description": "Form builder for teams", "category": "Forms", "baseUrl": "https://www.reform.app/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Paperform", "description": "Powerful form builder", "category": "Forms", "baseUrl": "https://paperform.co/", "authType": "apiKey", "pricing": "paid"},
    {"name": "Formspree", "description": "Form backend", "category": "Forms", "baseUrl": "https://formspree.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Basin", "description": "Form backend", "category": "Forms", "baseUrl": "https://usebasin.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Getform", "description": "Form endpoint", "category": "Forms", "baseUrl": "https://getform.io/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Formcarry", "description": "Form endpoint", "category": "Forms", "baseUrl": "https://formcarry.com/", "authType": "apiKey", "pricing": "freemium"},
    {"name": "Web3Forms", "description": "Contact form API", "category": "Forms", "baseUrl": "https://web3forms.com/", "authType": "apiKey", "pricing": "free"},
    {"name": "Qualtrics", "description": "Experience management", "category": "Forms", "baseUrl": "https://api.qualtrics.com/", "authType": "apiKey", "pricing": "paid"},
]

def main():
    import os
    output_dir = os.path.expanduser("~/Projects/apiclaw/data")
    os.makedirs(output_dir, exist_ok=True)
    
    for i, api in enumerate(NEW_APIS):
        api["id"] = f"api-05-27-b2-{i+1:04d}"
        if "pricing" not in api:
            api["pricing"] = "unknown"
    
    output_file = os.path.join(output_dir, "night-expansion-02-27-05-batch2.json")
    with open(output_file, "w") as f:
        json.dump(NEW_APIS, f, indent=2)
    
    print(f"✅ Generated {len(NEW_APIS)} APIs")
    print(f"📁 Saved to: {output_file}")
    
    categories = {}
    for api in NEW_APIS:
        cat = api.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📊 Category breakdown:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    return len(NEW_APIS)

if __name__ == "__main__":
    main()
