#!/usr/bin/env python3
"""
APIClaw Night Expansion - February 23, 2026 06:00
Target: +1000 APIs (16,607 → 17,607+)
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
    return name.lower().replace(' ', '-').replace('.', '-').replace('/', '-')[:50]

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
# NEW API CATEGORIES - FEBRUARY 23 BATCH
# =========================================

BATCH_1_DEVOPS = [
    {"name": "Datadog API", "description": "Monitoring, security, and analytics platform for cloud-scale applications", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.datadoghq.com/api/", "pricing": "paid"},
    {"name": "PagerDuty API", "description": "Incident management and response orchestration platform", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.pagerduty.com/api-reference/", "pricing": "paid"},
    {"name": "Splunk API", "description": "Search, monitor, and analyze machine-generated data", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://dev.splunk.com/enterprise/docs/devtools/restapidocs", "pricing": "paid"},
    {"name": "New Relic API", "description": "Full-stack observability platform for software analytics", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.newrelic.com/docs/apis/", "pricing": "freemium"},
    {"name": "Grafana API", "description": "Open-source analytics and monitoring solution", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://grafana.com/docs/grafana/latest/http_api/", "pricing": "freemium"},
    {"name": "Prometheus API", "description": "Open-source systems monitoring and alerting toolkit", "category": "DevOps", "auth": "None", "https": True, "cors": "yes", "link": "https://prometheus.io/docs/prometheus/latest/querying/api/", "pricing": "free"},
    {"name": "Sentry API", "description": "Application monitoring and error tracking platform", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.sentry.io/api/", "pricing": "freemium"},
    {"name": "LaunchDarkly API", "description": "Feature flag and toggle management platform", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://apidocs.launchdarkly.com/", "pricing": "paid"},
    {"name": "Rollbar API", "description": "Real-time error monitoring and debugging", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.rollbar.com/reference", "pricing": "freemium"},
    {"name": "Honeycomb API", "description": "Observability for distributed systems", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.honeycomb.io/api/", "pricing": "freemium"},
    {"name": "Opsgenie API", "description": "Incident management and alerting platform", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.opsgenie.com/docs/api-overview", "pricing": "paid"},
    {"name": "StatusPage API", "description": "Status page hosting for communicating service status", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.statuspage.io/", "pricing": "paid"},
    {"name": "Terraform Cloud API", "description": "Infrastructure automation and collaboration", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.hashicorp.com/terraform/cloud-docs/api-docs", "pricing": "freemium"},
    {"name": "Ansible Tower API", "description": "IT automation platform REST API", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.ansible.com/ansible-tower/latest/html/towerapi/", "pricing": "paid"},
    {"name": "Puppet API", "description": "Infrastructure automation and configuration management", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://puppet.com/docs/puppet/latest/http_api/", "pricing": "paid"},
    {"name": "Chef API", "description": "Infrastructure automation and configuration management", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.chef.io/api_chef_server/", "pricing": "paid"},
    {"name": "SaltStack API", "description": "Event-driven IT automation and orchestration", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.saltproject.io/en/latest/ref/netapi/all/salt.netapi.rest_cherrypy.html", "pricing": "paid"},
    {"name": "Consul API", "description": "Service mesh and service discovery", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.hashicorp.com/consul/api-docs", "pricing": "freemium"},
    {"name": "Vault API", "description": "Secrets management and data protection", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.hashicorp.com/vault/api-docs", "pricing": "freemium"},
    {"name": "Nomad API", "description": "Workload orchestration and scheduling", "category": "DevOps", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.hashicorp.com/nomad/api-docs", "pricing": "freemium"},
]

BATCH_2_CLOUD = [
    {"name": "AWS EC2 API", "description": "Elastic Compute Cloud - virtual servers in the cloud", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/ec2/", "pricing": "paid"},
    {"name": "AWS S3 API", "description": "Simple Storage Service - scalable object storage", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/s3/", "pricing": "paid"},
    {"name": "AWS Lambda API", "description": "Serverless compute service", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/lambda/", "pricing": "paid"},
    {"name": "AWS DynamoDB API", "description": "NoSQL database service", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/dynamodb/", "pricing": "paid"},
    {"name": "AWS SQS API", "description": "Simple Queue Service - message queuing", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/sqs/", "pricing": "paid"},
    {"name": "AWS SNS API", "description": "Simple Notification Service - pub/sub messaging", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/sns/", "pricing": "paid"},
    {"name": "AWS CloudWatch API", "description": "Monitoring and observability service", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/cloudwatch/", "pricing": "paid"},
    {"name": "AWS IAM API", "description": "Identity and access management", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/iam/", "pricing": "free"},
    {"name": "AWS Route53 API", "description": "Scalable DNS and domain name registration", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/route53/", "pricing": "paid"},
    {"name": "AWS CloudFormation API", "description": "Infrastructure as code - model and provision resources", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/cloudformation/", "pricing": "free"},
    {"name": "Azure Virtual Machines API", "description": "On-demand scalable computing resources", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines", "pricing": "paid"},
    {"name": "Azure Blob Storage API", "description": "Object storage for unstructured data", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/rest/api/storageservices/blob-service-rest-api", "pricing": "paid"},
    {"name": "Azure Functions API", "description": "Event-driven serverless compute", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference", "pricing": "paid"},
    {"name": "Azure Cosmos DB API", "description": "Globally distributed multi-model database", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/rest/api/cosmos-db/", "pricing": "paid"},
    {"name": "Azure Service Bus API", "description": "Reliable cloud messaging as a service", "category": "Cloud", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/rest/api/servicebus/", "pricing": "paid"},
    {"name": "Google Cloud Compute API", "description": "Virtual machines running in Google's data centers", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/compute/docs/reference/rest/v1", "pricing": "paid"},
    {"name": "Google Cloud Storage API", "description": "Object storage for companies of all sizes", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/storage/docs/json_api", "pricing": "paid"},
    {"name": "Google Cloud Functions API", "description": "Event-driven serverless compute platform", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/functions/docs/reference/rest", "pricing": "paid"},
    {"name": "Google Cloud Run API", "description": "Fully managed serverless containers", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/run/docs/reference/rest", "pricing": "paid"},
    {"name": "Google Cloud Pub/Sub API", "description": "Messaging and ingestion for streaming analytics", "category": "Cloud", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/pubsub/docs/reference/rest", "pricing": "paid"},
]

BATCH_3_FINTECH = [
    {"name": "Plaid API", "description": "Connect financial accounts and access transaction data", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://plaid.com/docs/api/", "pricing": "paid"},
    {"name": "Stripe Connect API", "description": "Platform payments for marketplaces", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://stripe.com/docs/connect", "pricing": "paid"},
    {"name": "Stripe Billing API", "description": "Subscription and recurring billing management", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://stripe.com/docs/billing", "pricing": "paid"},
    {"name": "Square API", "description": "Payments, point of sale, and commerce solutions", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.squareup.com/reference/square", "pricing": "freemium"},
    {"name": "Braintree API", "description": "Full-stack payments platform for online and mobile", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.paypal.com/braintree/docs/reference/overview", "pricing": "paid"},
    {"name": "Adyen API", "description": "Global payment platform for enterprise", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.adyen.com/api-explorer/", "pricing": "paid"},
    {"name": "Klarna API", "description": "Buy now pay later and payment solutions", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.klarna.com/", "pricing": "paid"},
    {"name": "Affirm API", "description": "Buy now, pay later financing platform", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.affirm.com/", "pricing": "paid"},
    {"name": "Checkout.com API", "description": "Digital payment processing for enterprise", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.checkout.com/docs/api-reference", "pricing": "paid"},
    {"name": "Wise API", "description": "International money transfers and multi-currency accounts", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api-docs.transferwise.com/", "pricing": "paid"},
    {"name": "Revolut Business API", "description": "Business banking and financial services", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.revolut.com/docs/business-api/", "pricing": "paid"},
    {"name": "Mercury Bank API", "description": "Banking built for startups", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.mercury.com/reference/introduction", "pricing": "paid"},
    {"name": "Ramp API", "description": "Corporate card and spend management", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.ramp.com/", "pricing": "paid"},
    {"name": "Brex API", "description": "Corporate credit cards and financial software", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.brex.com/", "pricing": "paid"},
    {"name": "Marqeta API", "description": "Modern card issuing platform", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.marqeta.com/docs/developer-guides/core-api-reference", "pricing": "paid"},
    {"name": "Lithic API", "description": "Card issuing and program management", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.lithic.com/", "pricing": "paid"},
    {"name": "Unit API", "description": "Embedded banking and payments infrastructure", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.unit.co/", "pricing": "paid"},
    {"name": "Increase API", "description": "Banking infrastructure for developers", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://increase.com/documentation", "pricing": "paid"},
    {"name": "Column API", "description": "Banking infrastructure built for developers", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.column.com/", "pricing": "paid"},
    {"name": "Modern Treasury API", "description": "Payment operations software", "category": "Finance", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.moderntreasury.com/", "pricing": "paid"},
]

BATCH_4_AI_ML = [
    {"name": "Hugging Face Inference API", "description": "Run ML models with simple HTTP requests", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://huggingface.co/docs/api-inference/", "pricing": "freemium"},
    {"name": "Hugging Face Hub API", "description": "Access and share ML models and datasets", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://huggingface.co/docs/hub/api", "pricing": "free"},
    {"name": "Cohere API", "description": "NLP platform for text generation and understanding", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.cohere.com/reference/about", "pricing": "freemium"},
    {"name": "AI21 Labs API", "description": "Advanced language models and NLP services", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.ai21.com/reference/", "pricing": "freemium"},
    {"name": "Anthropic Messages API", "description": "Claude AI assistant API for conversations", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.anthropic.com/en/api/messages", "pricing": "paid"},
    {"name": "Google Gemini API", "description": "Google's multimodal AI model", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://ai.google.dev/gemini-api/docs", "pricing": "freemium"},
    {"name": "Google Vertex AI API", "description": "Unified MLOps platform for building ML solutions", "category": "AI/ML", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://cloud.google.com/vertex-ai/docs/reference/rest", "pricing": "paid"},
    {"name": "Amazon Bedrock API", "description": "Foundation models as a service", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/bedrock/", "pricing": "paid"},
    {"name": "Amazon SageMaker API", "description": "Build, train, and deploy ML models at scale", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.aws.amazon.com/sagemaker/", "pricing": "paid"},
    {"name": "Azure OpenAI API", "description": "Access to OpenAI models through Azure", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/azure/cognitive-services/openai/", "pricing": "paid"},
    {"name": "Azure Cognitive Services API", "description": "AI services including vision, speech, language", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/azure/cognitive-services/", "pricing": "freemium"},
    {"name": "Stability AI API", "description": "Open AI models for image, video, audio, and language", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.stability.ai/docs/api-reference", "pricing": "freemium"},
    {"name": "Midjourney API", "description": "AI image generation through Discord", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.midjourney.com/", "pricing": "paid"},
    {"name": "DALL-E API", "description": "OpenAI's image generation model", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.openai.com/docs/api-reference/images", "pricing": "paid"},
    {"name": "Whisper API", "description": "OpenAI's speech recognition model", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://platform.openai.com/docs/api-reference/audio", "pricing": "paid"},
    {"name": "AssemblyAI API", "description": "Speech-to-text and audio intelligence API", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.assemblyai.com/docs", "pricing": "freemium"},
    {"name": "Deepgram API", "description": "AI speech recognition and understanding", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.deepgram.com/docs", "pricing": "freemium"},
    {"name": "Speechmatics API", "description": "Enterprise speech recognition technology", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.speechmatics.com/", "pricing": "paid"},
    {"name": "Rev.ai API", "description": "Speech-to-text transcription services", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.rev.ai/", "pricing": "paid"},
    {"name": "Otter.ai API", "description": "AI meeting assistant and transcription", "category": "AI/ML", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://otter.ai/", "pricing": "paid"},
]

BATCH_5_ECOMMERCE = [
    {"name": "Shopify Admin API", "description": "Build apps and integrations for Shopify stores", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://shopify.dev/docs/admin-api", "pricing": "freemium"},
    {"name": "Shopify Storefront API", "description": "Build custom storefronts with Shopify data", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://shopify.dev/docs/storefront-api", "pricing": "freemium"},
    {"name": "WooCommerce API", "description": "REST API for WordPress e-commerce", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "pricing": "free"},
    {"name": "BigCommerce API", "description": "Enterprise e-commerce platform API", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.bigcommerce.com/docs/rest-catalog", "pricing": "paid"},
    {"name": "Magento API", "description": "Adobe Commerce REST API", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.adobe.com/commerce/webapi/rest/", "pricing": "paid"},
    {"name": "Salesforce Commerce API", "description": "B2C Commerce platform API", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.salesforce.com/docs/commerce/b2c-commerce", "pricing": "paid"},
    {"name": "Commercetools API", "description": "Headless commerce platform", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://docs.commercetools.com/api/", "pricing": "paid"},
    {"name": "Medusa API", "description": "Open-source headless commerce engine", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.medusajs.com/api/admin", "pricing": "free"},
    {"name": "Saleor API", "description": "GraphQL-first headless commerce platform", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.saleor.io/docs/3.x/api-reference", "pricing": "freemium"},
    {"name": "Vendure API", "description": "Headless commerce framework", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.vendure.io/docs/graphql-api/", "pricing": "free"},
    {"name": "Amazon Product API", "description": "Access Amazon product data", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.amazon.com/docs/product-advertising-api/", "pricing": "free"},
    {"name": "eBay API", "description": "Access eBay marketplace data and features", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.ebay.com/develop/apis", "pricing": "free"},
    {"name": "Etsy API", "description": "Access Etsy marketplace functionality", "category": "E-commerce", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.etsy.com/documentation/", "pricing": "free"},
    {"name": "Walmart API", "description": "Walmart marketplace integration", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.walmart.com/", "pricing": "free"},
    {"name": "Best Buy API", "description": "Access Best Buy product catalog and data", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.bestbuy.com/", "pricing": "free"},
    {"name": "Printful API", "description": "Print-on-demand dropshipping platform", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.printful.com/docs/", "pricing": "freemium"},
    {"name": "Printify API", "description": "Print-on-demand e-commerce platform", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.printify.com/", "pricing": "freemium"},
    {"name": "ShipStation API", "description": "Shipping and fulfillment platform", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.shipstation.com/docs/api/", "pricing": "paid"},
    {"name": "ShipBob API", "description": "E-commerce fulfillment platform", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.shipbob.com/", "pricing": "paid"},
    {"name": "Shippo API", "description": "Shipping API for e-commerce", "category": "E-commerce", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://goshippo.com/docs/", "pricing": "freemium"},
]

BATCH_6_MARKETING = [
    {"name": "Mailchimp API", "description": "Email marketing and automation platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://mailchimp.com/developer/", "pricing": "freemium"},
    {"name": "SendGrid API", "description": "Email delivery and engagement platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.sendgrid.com/api-reference/", "pricing": "freemium"},
    {"name": "Mailgun API", "description": "Email automation made easy", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://documentation.mailgun.com/en/latest/api_reference.html", "pricing": "freemium"},
    {"name": "Postmark API", "description": "Fast, reliable email delivery", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://postmarkapp.com/developer", "pricing": "paid"},
    {"name": "Customer.io API", "description": "Marketing automation for digital businesses", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://customer.io/docs/api/", "pricing": "paid"},
    {"name": "Braze API", "description": "Customer engagement platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.braze.com/docs/api/", "pricing": "paid"},
    {"name": "Iterable API", "description": "Cross-channel marketing platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.iterable.com/api/docs", "pricing": "paid"},
    {"name": "Klaviyo API", "description": "E-commerce marketing automation", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.klaviyo.com/en", "pricing": "freemium"},
    {"name": "ActiveCampaign API", "description": "Customer experience automation platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.activecampaign.com/reference/overview", "pricing": "paid"},
    {"name": "Drip API", "description": "E-commerce CRM platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.drip.com/", "pricing": "paid"},
    {"name": "ConvertKit API", "description": "Email marketing for creators", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.convertkit.com/", "pricing": "freemium"},
    {"name": "Beehiiv API", "description": "Newsletter platform for growth", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.beehiiv.com/", "pricing": "freemium"},
    {"name": "Substack API", "description": "Newsletter publishing platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://substack.com/", "pricing": "freemium"},
    {"name": "Buffer API", "description": "Social media management platform", "category": "Marketing", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://buffer.com/developers/api", "pricing": "freemium"},
    {"name": "Hootsuite API", "description": "Social media management", "category": "Marketing", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.hootsuite.com/", "pricing": "paid"},
    {"name": "Sprout Social API", "description": "Social media management and analytics", "category": "Marketing", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.sproutsocial.com/", "pricing": "paid"},
    {"name": "Later API", "description": "Social media scheduling and management", "category": "Marketing", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.later.com/", "pricing": "paid"},
    {"name": "Amplitude API", "description": "Product analytics platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.amplitude.com/docs/apis", "pricing": "freemium"},
    {"name": "Mixpanel API", "description": "Product analytics for mobile and web", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.mixpanel.com/docs", "pricing": "freemium"},
    {"name": "Segment API", "description": "Customer data platform", "category": "Marketing", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/", "pricing": "freemium"},
]

BATCH_7_CRM = [
    {"name": "Salesforce API", "description": "World's #1 CRM platform", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/", "pricing": "paid"},
    {"name": "HubSpot CRM API", "description": "Free CRM with premium features", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.hubspot.com/docs/api/crm/", "pricing": "freemium"},
    {"name": "Pipedrive API", "description": "Sales CRM designed for small teams", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.pipedrive.com/docs/api/v1", "pricing": "paid"},
    {"name": "Zoho CRM API", "description": "Online CRM software for businesses", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.zoho.com/crm/developer/docs/api/v2/", "pricing": "freemium"},
    {"name": "Close API", "description": "Inside sales CRM built for growth teams", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.close.com/", "pricing": "paid"},
    {"name": "Freshsales API", "description": "Sales CRM with AI-based lead scoring", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.freshworks.com/crm/api/", "pricing": "paid"},
    {"name": "Copper API", "description": "CRM for Google Workspace", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.copper.com/", "pricing": "paid"},
    {"name": "Attio API", "description": "Modern CRM for relationship-driven teams", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://attio.com/docs/api", "pricing": "paid"},
    {"name": "Folk API", "description": "CRM for people-centric teams", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.folk.app/", "pricing": "paid"},
    {"name": "Monday CRM API", "description": "Work management platform CRM", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.monday.com/api-reference/", "pricing": "paid"},
    {"name": "Zendesk Sell API", "description": "Sales CRM for modern sales teams", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.zendesk.com/api-reference/sales-crm/", "pricing": "paid"},
    {"name": "Insightly API", "description": "CRM for small businesses", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://api.insightly.com/v3.1/Help", "pricing": "paid"},
    {"name": "Nimble API", "description": "Simple CRM for Office 365 & G Suite", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.nimble.com/", "pricing": "paid"},
    {"name": "Nutshell API", "description": "CRM designed for small businesses", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.nutshell.com/", "pricing": "paid"},
    {"name": "Agile CRM API", "description": "All-in-One CRM for SMBs", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.agilecrm.com/api", "pricing": "freemium"},
    {"name": "Highrise API", "description": "Simple CRM for small business", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://github.com/basecamp/highrise-api", "pricing": "paid"},
    {"name": "Capsule CRM API", "description": "Simple, smart CRM", "category": "CRM", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.capsulecrm.com/", "pricing": "paid"},
    {"name": "Keap API", "description": "All-in-one sales and marketing automation", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.keap.com/docs/rest/", "pricing": "paid"},
    {"name": "SugarCRM API", "description": "Award-winning CRM platform", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://support.sugarcrm.com/Documentation/Sugar_Developer/Sugar_Developer_Guide/", "pricing": "paid"},
    {"name": "Microsoft Dynamics 365 API", "description": "Enterprise CRM and ERP", "category": "CRM", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/dynamics365/customer-engagement/web-api/", "pricing": "paid"},
]

BATCH_8_COMMUNICATION = [
    {"name": "Twilio Messaging API", "description": "SMS, MMS, and WhatsApp messaging", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.twilio.com/docs/sms/api", "pricing": "paid"},
    {"name": "Twilio Voice API", "description": "Programmable voice calls", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.twilio.com/docs/voice/api", "pricing": "paid"},
    {"name": "Twilio Video API", "description": "Programmable video conferencing", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.twilio.com/docs/video/api", "pricing": "paid"},
    {"name": "Vonage Messages API", "description": "Multi-channel messaging platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.vonage.com/en/messages/overview", "pricing": "paid"},
    {"name": "MessageBird API", "description": "Omnichannel communication platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.messagebird.com/api/", "pricing": "paid"},
    {"name": "Plivo API", "description": "Cloud communications platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.plivo.com/docs/", "pricing": "paid"},
    {"name": "Bandwidth API", "description": "Communications platform as a service", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://dev.bandwidth.com/apis/", "pricing": "paid"},
    {"name": "Telnyx API", "description": "Voice, messaging, and connectivity", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.telnyx.com/docs/overview", "pricing": "paid"},
    {"name": "Sinch API", "description": "Customer engagement cloud platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.sinch.com/", "pricing": "paid"},
    {"name": "Discord API", "description": "Chat and voice communication for communities", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://discord.com/developers/docs/intro", "pricing": "free"},
    {"name": "Slack API", "description": "Business communication platform", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://api.slack.com/", "pricing": "freemium"},
    {"name": "Microsoft Teams API", "description": "Business collaboration platform", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://learn.microsoft.com/en-us/graph/teams-concept-overview", "pricing": "paid"},
    {"name": "Zoom API", "description": "Video conferencing platform", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.zoom.us/docs/api/", "pricing": "freemium"},
    {"name": "Google Meet API", "description": "Video conferencing solution", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.google.com/meet/api", "pricing": "freemium"},
    {"name": "Daily API", "description": "Video and audio call API", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.daily.co/reference", "pricing": "freemium"},
    {"name": "Agora API", "description": "Real-time engagement platform", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.agora.io/en/", "pricing": "freemium"},
    {"name": "LiveKit API", "description": "Open source WebRTC infrastructure", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.livekit.io/", "pricing": "freemium"},
    {"name": "Sendbird API", "description": "In-app chat and messaging", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://sendbird.com/docs/", "pricing": "freemium"},
    {"name": "Stream Chat API", "description": "In-app messaging infrastructure", "category": "Communication", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://getstream.io/chat/docs/", "pricing": "freemium"},
    {"name": "Intercom API", "description": "Business messaging platform", "category": "Communication", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis", "pricing": "paid"},
]

BATCH_9_DATA_SERVICES = [
    {"name": "Clearbit API", "description": "B2B data enrichment and prospecting", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://dashboard.clearbit.com/docs", "pricing": "paid"},
    {"name": "ZoomInfo API", "description": "B2B contact and company data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.zoominfo.com/", "pricing": "paid"},
    {"name": "Apollo API", "description": "Sales intelligence and engagement", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://apolloio.github.io/apollo-api-docs/", "pricing": "freemium"},
    {"name": "Hunter API", "description": "Email finder and verifier", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://hunter.io/api-documentation", "pricing": "freemium"},
    {"name": "Snov.io API", "description": "Email outreach and lead generation", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://snov.io/api", "pricing": "freemium"},
    {"name": "Lusha API", "description": "B2B contact and company data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.lusha.com/docs/", "pricing": "paid"},
    {"name": "FullContact API", "description": "Identity resolution and enrichment", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.fullcontact.com/", "pricing": "paid"},
    {"name": "People Data Labs API", "description": "B2B data API for developers", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.peopledatalabs.com/", "pricing": "freemium"},
    {"name": "Pipl API", "description": "Identity search and verification", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.pipl.com/", "pricing": "paid"},
    {"name": "Diffbot API", "description": "Web data extraction and AI knowledge graph", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.diffbot.com/", "pricing": "paid"},
    {"name": "Crunchbase API", "description": "Company and investor data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://data.crunchbase.com/docs", "pricing": "paid"},
    {"name": "PitchBook API", "description": "Private market data and research", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://pitchbook.com/data", "pricing": "paid"},
    {"name": "BuiltWith API", "description": "Website technology profiling", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://builtwith.com/api", "pricing": "paid"},
    {"name": "SimilarWeb API", "description": "Website traffic and engagement data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.similarweb.com/corp/developer/", "pricing": "paid"},
    {"name": "SEMrush API", "description": "SEO and marketing data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.semrush.com/", "pricing": "paid"},
    {"name": "Ahrefs API", "description": "SEO tools and backlink data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://ahrefs.com/api", "pricing": "paid"},
    {"name": "Moz API", "description": "SEO software and link data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://moz.com/products/api", "pricing": "paid"},
    {"name": "Majestic API", "description": "Link intelligence data", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer-support.majestic.com/", "pricing": "paid"},
    {"name": "SpyFu API", "description": "Competitor keyword research", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://www.spyfu.com/apis", "pricing": "paid"},
    {"name": "Dataforseo API", "description": "SEO data extraction APIs", "category": "Data", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://docs.dataforseo.com/", "pricing": "paid"},
]

BATCH_10_PRODUCTIVITY = [
    {"name": "Notion API", "description": "All-in-one workspace for notes, docs, and projects", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.notion.com/", "pricing": "freemium"},
    {"name": "Airtable API", "description": "Spreadsheet-database hybrid", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://airtable.com/developers/web/api/introduction", "pricing": "freemium"},
    {"name": "Asana API", "description": "Work management platform", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.asana.com/docs/", "pricing": "freemium"},
    {"name": "Trello API", "description": "Visual project management", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.atlassian.com/cloud/trello/", "pricing": "freemium"},
    {"name": "Monday.com API", "description": "Work OS for teams", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.monday.com/", "pricing": "paid"},
    {"name": "ClickUp API", "description": "All-in-one productivity platform", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://clickup.com/api", "pricing": "freemium"},
    {"name": "Todoist API", "description": "Task management app", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.todoist.com/rest/v2", "pricing": "freemium"},
    {"name": "Linear API", "description": "Issue tracking for software teams", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developers.linear.app/docs/graphql/", "pricing": "freemium"},
    {"name": "Jira API", "description": "Issue and project tracking", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/", "pricing": "freemium"},
    {"name": "Confluence API", "description": "Team collaboration and documentation", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.atlassian.com/cloud/confluence/rest/v2/", "pricing": "freemium"},
    {"name": "Coda API", "description": "All-in-one doc for teams", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://coda.io/developers/apis/v1", "pricing": "freemium"},
    {"name": "Basecamp API", "description": "Project management and team communication", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://github.com/basecamp/bc3-api", "pricing": "paid"},
    {"name": "Wrike API", "description": "Work management platform", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.wrike.com/", "pricing": "paid"},
    {"name": "Teamwork API", "description": "Project management and collaboration", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://developer.teamwork.com/", "pricing": "paid"},
    {"name": "Smartsheet API", "description": "Work management and automation", "category": "Productivity", "auth": "apiKey", "https": True, "cors": "yes", "link": "https://smartsheet.redoc.ly/", "pricing": "paid"},
    {"name": "Miro API", "description": "Online collaborative whiteboard", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developers.miro.com/", "pricing": "freemium"},
    {"name": "Figma API", "description": "Collaborative design platform", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.figma.com/developers/api", "pricing": "freemium"},
    {"name": "Canva API", "description": "Design platform for visual content", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.canva.dev/docs/", "pricing": "freemium"},
    {"name": "Loom API", "description": "Video messaging for work", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://www.loom.com/community/api", "pricing": "freemium"},
    {"name": "Calendly API", "description": "Scheduling automation platform", "category": "Productivity", "auth": "OAuth", "https": True, "cors": "yes", "link": "https://developer.calendly.com/api-docs", "pricing": "freemium"},
]

def main():
    print("🦞 APIClaw Night Expansion - February 23, 2026 06:00")
    print("=" * 50)
    
    registry = load_registry()
    initial_count = len(registry['apis'])
    print(f"Starting with {initial_count} APIs")
    
    all_batches = [
        ("DevOps & Monitoring", BATCH_1_DEVOPS),
        ("Cloud Providers", BATCH_2_CLOUD),
        ("Fintech & Banking", BATCH_3_FINTECH),
        ("AI/ML Services", BATCH_4_AI_ML),
        ("E-commerce", BATCH_5_ECOMMERCE),
        ("Marketing & Email", BATCH_6_MARKETING),
        ("CRM Platforms", BATCH_7_CRM),
        ("Communication", BATCH_8_COMMUNICATION),
        ("Data Services", BATCH_9_DATA_SERVICES),
        ("Productivity", BATCH_10_PRODUCTIVITY),
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
