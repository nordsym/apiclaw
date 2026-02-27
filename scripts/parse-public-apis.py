#!/usr/bin/env python3
"""
Parse public-apis README.md to extract APIs
"""
import re
import json

README = """
| [AdoptAPet](https://www.adoptapet.com/public/apis/pet_list.html) | Resource to help get pets adopted | `apiKey` | Yes | Yes |
| [Axolotl](https://theaxolotlapi.netlify.app/) | Collection of axolotl pictures and facts | No | Yes | No |
| [Cat Facts](https://alexwohlbruck.github.io/cat-facts/) | Daily cat facts | No | Yes | No | |
| [Cataas](https://cataas.com/) | Cat as a service (cats pictures and gifs) | No | Yes | No |
| [Cats](https://docs.thecatapi.com/) | Pictures of cats from Tumblr | `apiKey` | Yes | No |
| [Dog Facts](https://dukengn.github.io/Dog-facts-API/) | Random dog facts | No | Yes | Yes |
| [Dogs](https://dog.ceo/dog-api/) | Based on the Stanford Dogs Dataset | No | Yes | Yes |
| [eBird](https://documenter.getpostman.com/view/664302/S1ENwy59) | Retrieve recent or notable birding observations | `apiKey` | Yes | No |
| [FishWatch](https://www.fishwatch.gov/developers) | Information and pictures about fish species | No | Yes | Yes |
| [HTTP Cat](https://http.cat/) | Cat for every HTTP Status | No | Yes | Yes |
| [HTTP Dog](https://http.dog/) | Dogs for every HTTP response status code | No | Yes | Yes |
| [IUCN](http://apiv3.iucnredlist.org/api/v3/docs) | IUCN Red List of Threatened Species | `apiKey` | No | No |
| [Petfinder](https://www.petfinder.com/developers/) | Petfinder pet adoption API | `apiKey` | Yes | Yes |
| [AniAPI](https://aniapi.com/docs/) | Anime discovery, streaming & syncing | `OAuth` | Yes | Yes |
| [AniList](https://github.com/AniList/ApiV2-GraphQL-Docs) | Anime discovery & tracking | `OAuth` | Yes | Unknown |
| [Jikan](https://jikan.moe) | Unofficial MyAnimeList API | No | Yes | Yes |
| [Kitsu](https://kitsu.docs.apiary.io/) | Anime discovery platform | `OAuth` | Yes | Yes |
| [MangaDex](https://api.mangadex.org/docs.html) | Manga Database and Community | `apiKey` | Yes | Unknown |
| [AbuseIPDB](https://docs.abuseipdb.com/) | IP/domain/URL reputation | `apiKey` | Yes | Unknown |
| [VirusTotal](https://www.virustotal.com/en/documentation/public-api/) | File/URL Analysis | `apiKey` | Yes | Unknown |
| [Art Institute of Chicago](https://api.artic.edu/docs/) | Art Museum API | No | Yes | Yes |
| [Colormind](http://colormind.io/api-access/) | Color scheme generator | No | No | Unknown |
| [Cooper Hewitt](https://collection.cooperhewitt.org/api) | Smithsonian Design Museum | `apiKey` | Yes | Unknown |
| [Dribbble](https://developer.dribbble.com) | Design community | `OAuth` | Yes | Unknown |
| [Metropolitan Museum of Art](https://metmuseum.github.io/) | Met Museum API | No | Yes | No |
| [Rijksmuseum](https://data.rijksmuseum.nl/object-metadata/api/) | Dutch art museum | `apiKey` | Yes | Unknown |
| [Auth0](https://auth0.com) | Authentication platform | `apiKey` | Yes | Yes |
| [Stytch](https://stytch.com/) | User authentication | `apiKey` | Yes | No |
| [Bitquery](https://graphql.bitquery.io/ide) | Blockchain GraphQL APIs | `apiKey` | Yes | Yes |
| [Chainlink](https://chain.link/developer-resources) | Smart contracts | No | Yes | Unknown |
| [Etherscan](https://etherscan.io/apis) | Ethereum explorer | `apiKey` | Yes | Yes |
| [The Graph](https://thegraph.com) | Blockchain indexing | `apiKey` | Yes | Unknown |
| [Google Books](https://developers.google.com/books/) | Books API | `OAuth` | Yes | Unknown |
| [Open Library](https://openlibrary.org/developers/api) | Books database | No | Yes | No |
| [PoetryDB](https://github.com/thundercomb/poetrydb) | Poetry collection | No | Yes | Yes |
| [Apache Superset](https://superset.apache.org/docs/api) | BI dashboards | `apiKey` | Yes | Yes |
| [Clearbit](https://clearbit.com/docs) | Company logos | `apiKey` | Yes | Unknown |
| [Google Analytics](https://developers.google.com/analytics/) | Analytics | `OAuth` | Yes | Unknown |
| [Mailchimp](https://mailchimp.com/developer/) | Marketing email | `apiKey` | Yes | Unknown |
| [Trello](https://developers.trello.com/) | Project management | `OAuth` | Yes | Unknown |
| [Calendarific](https://calendarific.com/) | Worldwide Holidays | `apiKey` | Yes | Unknown |
| [Google Calendar](https://developers.google.com/calendar/) | Calendar API | `OAuth` | Yes | Unknown |
| [Box](https://developer.box.com/) | File storage | `OAuth` | Yes | Unknown |
| [Dropbox](https://www.dropbox.com/developers) | File sharing | `OAuth` | Yes | Unknown |
| [Google Drive](https://developers.google.com/drive/) | File storage | `OAuth` | Yes | Unknown |
| [OneDrive](https://developer.microsoft.com/onedrive) | File storage | `OAuth` | Yes | Unknown |
| [CircleCI](https://circleci.com/docs/api/) | CI/CD | `apiKey` | Yes | Unknown |
| [Travis CI](https://docs.travis-ci.com/api/) | CI/CD | `apiKey` | Yes | Unknown |
| [0x](https://0x.org/api) | DEX aggregator | No | Yes | Yes |
| [Binance](https://github.com/binance/binance-spot-api-docs) | Crypto exchange | `apiKey` | Yes | Unknown |
| [Coinbase](https://developers.coinbase.com) | Cryptocurrency | `apiKey` | Yes | Unknown |
| [CoinGecko](http://www.coingecko.com/api) | Crypto data | No | Yes | Yes |
| [CoinMarketCap](https://coinmarketcap.com/api/) | Crypto prices | `apiKey` | Yes | Unknown |
| [Kraken](https://docs.kraken.com/rest/) | Crypto exchange | `apiKey` | Yes | Unknown |
| [ExchangeRate-API](https://www.exchangerate-api.com) | Currency conversion | `apiKey` | Yes | Yes |
| [Frankfurter](https://www.frankfurter.app/docs) | Exchange rates | No | Yes | Yes |
| [Fixer](https://fixer.io) | Forex rates | `apiKey` | No | Unknown |
| [GitHub](https://docs.github.com/) | Code hosting | `OAuth` | Yes | Yes |
| [Gitlab](https://docs.gitlab.com/ee/api/) | Code hosting | `OAuth` | Yes | Unknown |
| [Postman](https://www.postman.com/postman/) | API testing | `apiKey` | Yes | Unknown |
| [npm Registry](https://github.com/npm/registry) | Package registry | No | Yes | Unknown |
| [Merriam-Webster](https://dictionaryapi.com/) | Dictionary | `apiKey` | Yes | Unknown |
| [Oxford](https://developer.oxforddictionaries.com/) | Dictionary | `apiKey` | Yes | No |
| [Airtable](https://airtable.com/api) | Database | `apiKey` | Yes | Unknown |
| [Notion](https://developers.notion.com/) | Productivity | `OAuth` | Yes | Unknown |
| [Todoist](https://developer.todoist.com) | Todo lists | `OAuth` | Yes | Unknown |
| [Sendgrid](https://docs.sendgrid.com/) | Email | `apiKey` | Yes | Unknown |
| [Mailgun](https://documentation.mailgun.com/) | Email | `apiKey` | Yes | Unknown |
| [Eventbrite](https://www.eventbrite.com/platform/api/) | Events | `OAuth` | Yes | Unknown |
| [Ticketmaster](http://developer.ticketmaster.com/) | Events | `apiKey` | Yes | Unknown |
| [Alpha Vantage](https://www.alphavantage.co/) | Stock data | `apiKey` | Yes | Unknown |
| [Finnhub](https://finnhub.io/docs/api) | Stock data | `apiKey` | Yes | Unknown |
| [Plaid](https://www.plaid.com/docs) | Banking | `apiKey` | Yes | Unknown |
| [Stripe](https://stripe.com/docs/api) | Payments | `apiKey` | Yes | Unknown |
| [Edamam](https://developer.edamam.com/) | Nutrition | `apiKey` | Yes | Unknown |
| [Spoonacular](https://spoonacular.com/food-api) | Recipes | `apiKey` | Yes | Unknown |
| [TheMealDB](https://www.themealdb.com/api.php) | Meal recipes | `apiKey` | Yes | Yes |
| [TheCocktailDB](https://www.thecocktaildb.com/api.php) | Cocktails | `apiKey` | Yes | Yes |
| [Steam](https://steamapi.xpaw.me/) | Gaming | `apiKey` | Yes | No |
| [Twitch](https://dev.twitch.tv/docs/api/) | Streaming | `OAuth` | Yes | Unknown |
| [Discord](https://discord.com/developers/docs/) | Chat platform | `OAuth` | Yes | Unknown |
| [RAWG](https://rawg.io/apidocs) | Video games | `apiKey` | Yes | Unknown |
| [IGDB](https://api-docs.igdb.com) | Video games | `apiKey` | Yes | Unknown |
| [Google Maps](https://developers.google.com/maps/) | Maps | `apiKey` | Yes | Unknown |
| [Mapbox](https://docs.mapbox.com/) | Maps | `apiKey` | Yes | Unknown |
| [OpenStreetMap](http://wiki.openstreetmap.org/wiki/API) | Maps | `OAuth` | No | Unknown |
| [ipinfo.io](https://ipinfo.io/developers) | IP geolocation | No | Yes | Unknown |
| [ipstack](https://ipstack.com/) | IP geolocation | `apiKey` | Yes | Unknown |
| [FedEx](https://www.fedex.com/en-us/developer.html) | Shipping | `apiKey` | Yes | Unknown |
| [UPS](https://www.ups.com/upsdeveloperkit) | Shipping | `apiKey` | Yes | Unknown |
| [Shippo](https://goshippo.com/docs/) | Shipping | `apiKey` | Yes | Unknown |
| [Google Ads](https://developers.google.com/google-ads/api/) | Advertising | `OAuth` | Yes | Unknown |
| [Facebook Marketing](https://developers.facebook.com/docs/marketing-apis/) | Advertising | `OAuth` | Yes | Unknown |
| [HubSpot](https://developers.hubspot.com/) | CRM | `apiKey` | Yes | Unknown |
| [Salesforce](https://developer.salesforce.com/docs/apis) | CRM | `OAuth` | Yes | Unknown |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather | `apiKey` | Yes | Unknown |
| [WeatherAPI](https://www.weatherapi.com/) | Weather | `apiKey` | Yes | Yes |
| [Spotify](https://developer.spotify.com/documentation/web-api/) | Music | `OAuth` | Yes | Unknown |
| [Last.fm](https://www.last.fm/api) | Music | `apiKey` | Yes | Unknown |
| [YouTube](https://developers.google.com/youtube/v3) | Video | `OAuth` | Yes | Unknown |
| [Vimeo](https://developer.vimeo.com/) | Video | `OAuth` | Yes | Unknown |
| [Twitter](https://developer.twitter.com/en/docs) | Social media | `OAuth` | Yes | Unknown |
| [Facebook](https://developers.facebook.com/docs/) | Social media | `OAuth` | Yes | Unknown |
| [Instagram](https://developers.facebook.com/docs/instagram-api/) | Social media | `OAuth` | Yes | Unknown |
| [LinkedIn](https://docs.microsoft.com/en-us/linkedin/) | Professional network | `OAuth` | Yes | Unknown |
| [Reddit](https://www.reddit.com/dev/api/) | Social news | `OAuth` | Yes | Unknown |
| [NBA Stats](https://www.nba.com/stats/) | Basketball | No | Yes | Unknown |
| [ESPN](https://www.espn.com/apis/devcenter/) | Sports | `apiKey` | Yes | Unknown |
| [Strava](https://developers.strava.com/) | Fitness | `OAuth` | Yes | Unknown |
| [Fitbit](https://dev.fitbit.com/) | Fitness | `OAuth` | Yes | Unknown |
| [Faker](https://fakerapi.it/) | Test data | No | Yes | Yes |
| [JSONPlaceholder](https://jsonplaceholder.typicode.com/) | Test data | No | Yes | Unknown |
| [Amadeus](https://developers.amadeus.com/) | Travel | `apiKey` | Yes | Unknown |
| [Skyscanner](https://www.partners.skyscanner.net/) | Flights | `apiKey` | Yes | Unknown |
| [Uber](https://developer.uber.com/) | Rides | `OAuth` | Yes | Unknown |
| [Lyft](https://www.lyft.com/developers) | Rides | `OAuth` | Yes | Unknown |
| [Cloudinary](https://cloudinary.com/documentation/image_upload_api_reference) | Image hosting | `apiKey` | Yes | Unknown |
| [Imgur](https://apidocs.imgur.com/) | Image hosting | `OAuth` | Yes | Unknown |
| [Unsplash](https://unsplash.com/developers) | Photos | `OAuth` | Yes | Unknown |
| [Pexels](https://www.pexels.com/api/) | Photos | `apiKey` | Yes | Yes |
| [Twilio](https://www.twilio.com/docs/usage/api) | SMS/Voice | `apiKey` | Yes | Unknown |
| [Vonage](https://developer.vonage.com/) | SMS/Voice | `apiKey` | Yes | Unknown |
| [Slack](https://api.slack.com/) | Chat | `OAuth` | Yes | Unknown |
| [Telegram](https://core.telegram.org/api) | Chat | `apiKey` | Yes | Unknown |
| [WhatsApp](https://developers.facebook.com/docs/whatsapp/) | Chat | `apiKey` | Yes | Unknown |
| [OpenAI](https://platform.openai.com/docs/) | AI | `apiKey` | Yes | Unknown |
| [Anthropic](https://docs.anthropic.com/) | AI | `apiKey` | Yes | Unknown |
| [Hugging Face](https://huggingface.co/docs/api-inference/) | AI/ML | `apiKey` | Yes | Unknown |
| [Google Cloud Vision](https://cloud.google.com/vision/docs) | Image AI | `apiKey` | Yes | Unknown |
| [AWS Rekognition](https://docs.aws.amazon.com/rekognition/) | Image AI | `apiKey` | Yes | Unknown |
| [DeepL](https://www.deepl.com/docs-api) | Translation | `apiKey` | Yes | Unknown |
| [Google Translate](https://cloud.google.com/translate/docs) | Translation | `apiKey` | Yes | Unknown |
| [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html) | Search | `apiKey` | Yes | Unknown |
| [Algolia](https://www.algolia.com/doc/) | Search | `apiKey` | Yes | Unknown |
| [Firebase](https://firebase.google.com/docs/reference/rest/) | Backend | `apiKey` | Yes | Unknown |
| [Supabase](https://supabase.com/docs/reference) | Backend | `apiKey` | Yes | Unknown |
| [MongoDB Atlas](https://docs.atlas.mongodb.com/api/) | Database | `apiKey` | Yes | Unknown |
| [PlanetScale](https://docs.planetscale.com/reference/) | Database | `apiKey` | Yes | Unknown |
| [Redis Cloud](https://docs.redis.com/latest/rc/api/) | Cache | `apiKey` | Yes | Unknown |
| [Vercel](https://vercel.com/docs/rest-api) | Hosting | `apiKey` | Yes | Unknown |
| [Netlify](https://docs.netlify.com/api/) | Hosting | `OAuth` | Yes | Unknown |
| [Heroku](https://devcenter.heroku.com/articles/platform-api-reference/) | Hosting | `OAuth` | Yes | Yes |
| [DigitalOcean](https://docs.digitalocean.com/reference/api/) | Cloud | `apiKey` | Yes | Unknown |
| [AWS](https://docs.aws.amazon.com/) | Cloud | `apiKey` | Yes | Unknown |
| [Azure](https://docs.microsoft.com/en-us/rest/api/azure/) | Cloud | `apiKey` | Yes | Unknown |
| [Google Cloud](https://cloud.google.com/apis/docs/overview) | Cloud | `apiKey` | Yes | Unknown |
| [Cloudflare](https://api.cloudflare.com/) | CDN/Security | `apiKey` | Yes | Unknown |
| [Fastly](https://developer.fastly.com/reference/api/) | CDN | `apiKey` | Yes | Unknown |
| [Datadog](https://docs.datadoghq.com/api/) | Monitoring | `apiKey` | Yes | Unknown |
| [New Relic](https://docs.newrelic.com/docs/apis/) | Monitoring | `apiKey` | Yes | Unknown |
| [PagerDuty](https://developer.pagerduty.com/api-reference/) | Incident management | `apiKey` | Yes | Unknown |
| [Sentry](https://docs.sentry.io/api/) | Error tracking | `apiKey` | Yes | Unknown |
| [LaunchDarkly](https://apidocs.launchdarkly.com/) | Feature flags | `apiKey` | Yes | Unknown |
| [Split](https://docs.split.io/reference) | Feature flags | `apiKey` | Yes | Unknown |
| [Segment](https://segment.com/docs/connections/sources/catalog/) | Analytics | `apiKey` | Yes | Unknown |
| [Mixpanel](https://developer.mixpanel.com/reference) | Analytics | `apiKey` | Yes | Unknown |
| [Amplitude](https://developers.amplitude.com/docs/http-api-v2) | Analytics | `apiKey` | Yes | Unknown |
| [Intercom](https://developers.intercom.com/intercom-api-reference/) | Customer support | `apiKey` | Yes | Unknown |
| [Zendesk](https://developer.zendesk.com/api-reference/) | Customer support | `apiKey` | Yes | Unknown |
| [Freshdesk](https://developers.freshdesk.com/api/) | Customer support | `apiKey` | Yes | Unknown |
| [Jira](https://developer.atlassian.com/cloud/jira/platform/rest/) | Issue tracking | `OAuth` | Yes | Unknown |
| [Linear](https://developers.linear.app/) | Issue tracking | `apiKey` | Yes | Unknown |
| [Asana](https://developers.asana.com/docs) | Project management | `apiKey` | Yes | Yes |
| [Monday](https://api.developer.monday.com/docs) | Project management | `apiKey` | Yes | Unknown |
| [ClickUp](https://clickup.com/api) | Project management | `OAuth` | Yes | Unknown |
| [Figma](https://www.figma.com/developers/api) | Design | `OAuth` | Yes | Unknown |
| [Canva](https://www.canva.com/developers/) | Design | `OAuth` | Yes | Unknown |
| [Adobe Creative Cloud](https://developer.adobe.com/creative-cloud/) | Design | `OAuth` | Yes | Unknown |
| [Loom](https://www.loom.com/share/api) | Video recording | `apiKey` | Yes | Unknown |
| [Mux](https://docs.mux.com/api-reference) | Video streaming | `apiKey` | Yes | Unknown |
| [Wistia](https://wistia.com/support/developers) | Video hosting | `apiKey` | Yes | Unknown |
| [Zoom](https://marketplace.zoom.us/docs/api-reference/zoom-api/) | Video conferencing | `OAuth` | Yes | Unknown |
| [Calendly](https://developer.calendly.com/api-docs/) | Scheduling | `OAuth` | Yes | Unknown |
| [Cal.com](https://cal.com/docs/api) | Scheduling | `apiKey` | Yes | Unknown |
| [DocuSign](https://developers.docusign.com/) | E-signatures | `OAuth` | Yes | Unknown |
| [HelloSign](https://developers.hellosign.com/) | E-signatures | `apiKey` | Yes | Unknown |
| [Typeform](https://developer.typeform.com/) | Forms | `OAuth` | Yes | Unknown |
| [JotForm](https://api.jotform.com/docs/) | Forms | `apiKey` | Yes | Unknown |
| [SurveyMonkey](https://developer.surveymonkey.com/) | Surveys | `OAuth` | Yes | Unknown |
| [Qualtrics](https://api.qualtrics.com/) | Surveys | `apiKey` | Yes | Unknown |
| [Shopify](https://shopify.dev/api) | E-commerce | `OAuth` | Yes | Unknown |
| [WooCommerce](https://woocommerce.github.io/woocommerce-rest-api-docs/) | E-commerce | `apiKey` | Yes | Unknown |
| [BigCommerce](https://developer.bigcommerce.com/api-docs) | E-commerce | `apiKey` | Yes | Unknown |
| [Square](https://developer.squareup.com/) | Payments | `OAuth` | Yes | Unknown |
| [PayPal](https://developer.paypal.com/docs/api/) | Payments | `OAuth` | Yes | Unknown |
| [Braintree](https://developer.paypal.com/braintree/docs/) | Payments | `apiKey` | Yes | Unknown |
| [Chargebee](https://apidocs.chargebee.com/docs/api) | Subscriptions | `apiKey` | Yes | Unknown |
| [Recurly](https://developers.recurly.com/api/) | Subscriptions | `apiKey` | Yes | Unknown |
| [Paddle](https://developer.paddle.com/api-reference/) | Subscriptions | `apiKey` | Yes | Unknown |
| [Contentful](https://www.contentful.com/developers/docs/references/) | CMS | `apiKey` | Yes | Unknown |
| [Sanity](https://www.sanity.io/docs/http-api) | CMS | `apiKey` | Yes | Unknown |
| [Strapi](https://docs.strapi.io/developer-docs/) | CMS | `apiKey` | Yes | Unknown |
| [Ghost](https://ghost.org/docs/content-api/) | CMS | `apiKey` | Yes | Yes |
| [WordPress](https://developer.wordpress.org/rest-api/) | CMS | `apiKey` | Yes | Unknown |
| [Medium](https://github.com/Medium/medium-api-docs) | Publishing | `OAuth` | Yes | Unknown |
| [Dev.to](https://developers.forem.com/api) | Publishing | `apiKey` | Yes | Unknown |
| [Hashnode](https://api.hashnode.com/) | Publishing | `apiKey` | Yes | Unknown |
| [Product Hunt](https://api.producthunt.com/v2/docs) | Product launches | `OAuth` | Yes | Unknown |
| [Hacker News](https://github.com/HackerNews/API) | Tech news | No | Yes | Unknown |
| [NewsAPI](https://newsapi.org/docs) | News | `apiKey` | Yes | Unknown |
| [GNews](https://gnews.io/docs/) | News | `apiKey` | Yes | Unknown |
| [Clearbit](https://clearbit.com/docs) | Company data | `apiKey` | Yes | Unknown |
| [Crunchbase](https://data.crunchbase.com/docs/) | Company data | `apiKey` | Yes | Unknown |
| [Hunter](https://hunter.io/api-documentation/) | Email finder | `apiKey` | Yes | Unknown |
| [ZeroBounce](https://www.zerobounce.net/docs/) | Email validation | `apiKey` | Yes | Unknown |
| [Abstract](https://www.abstractapi.com/) | Various APIs | `apiKey` | Yes | Yes |
| [RapidAPI](https://rapidapi.com/) | API marketplace | `apiKey` | Yes | Unknown |
| [Postmark](https://postmarkapp.com/developer) | Email | `apiKey` | Yes | Unknown |
| [Resend](https://resend.com/docs/api-reference/) | Email | `apiKey` | Yes | Unknown |
| [Brevo](https://developers.brevo.com/) | Email marketing | `apiKey` | Yes | Unknown |
| [Convertkit](https://developers.convertkit.com/) | Email marketing | `apiKey` | Yes | Unknown |
| [Mailerlite](https://developers.mailerlite.com/docs/) | Email marketing | `apiKey` | Yes | Unknown |
| [Klaviyo](https://developers.klaviyo.com/en) | Email marketing | `apiKey` | Yes | Unknown |
| [Customer.io](https://customer.io/docs/api/) | Marketing automation | `apiKey` | Yes | Unknown |
| [ActiveCampaign](https://developers.activecampaign.com/reference/) | Marketing automation | `apiKey` | Yes | Unknown |
| [Pipedrive](https://developers.pipedrive.com/docs/api/) | CRM | `apiKey` | Yes | Unknown |
| [Close](https://developer.close.com/) | CRM | `apiKey` | Yes | Unknown |
| [Copper](https://developer.copper.com/reference) | CRM | `apiKey` | Yes | Unknown |
| [Apollo](https://apolloio.github.io/apollo-api-docs/) | Sales intelligence | `apiKey` | Yes | Unknown |
| [ZoomInfo](https://api-docs.zoominfo.com/) | Sales intelligence | `apiKey` | Yes | Unknown |
| [Clearbit Enrichment](https://clearbit.com/docs) | Data enrichment | `apiKey` | Yes | Unknown |
| [FullContact](https://docs.fullcontact.com/) | Data enrichment | `apiKey` | Yes | Unknown |
| [People Data Labs](https://docs.peopledatalabs.com/) | Data enrichment | `apiKey` | Yes | Unknown |
| [Leadfeeder](https://docs.leadfeeder.com/) | Lead generation | `apiKey` | Yes | Unknown |
| [6sense](https://6sense.com/developers/) | Account intelligence | `apiKey` | Yes | Unknown |
| [Demandbase](https://developer.demandbase.com/) | Account intelligence | `apiKey` | Yes | Unknown |
| [Gong](https://app.gong.io/settings/api/documentation) | Sales calls | `apiKey` | Yes | Unknown |
| [Chorus](https://docs.chorus.ai/) | Sales calls | `apiKey` | Yes | Unknown |
| [Drift](https://devdocs.drift.com/) | Conversational marketing | `apiKey` | Yes | Unknown |
| [Qualified](https://www.qualified.com/api-docs) | Conversational marketing | `apiKey` | Yes | Unknown |
| [Hotjar](https://developer.hotjar.com/api/) | User analytics | `apiKey` | Yes | Unknown |
| [FullStory](https://developer.fullstory.com/) | Session replay | `apiKey` | Yes | Unknown |
| [LogRocket](https://docs.logrocket.com/reference) | Session replay | `apiKey` | Yes | Unknown |
| [Heap](https://developers.heap.io/reference) | Product analytics | `apiKey` | Yes | Unknown |
| [PostHog](https://posthog.com/docs/api) | Product analytics | `apiKey` | Yes | Unknown |
| [Pendo](https://developers.pendo.io/) | Product analytics | `apiKey` | Yes | Unknown |
| [Appcues](https://docs.appcues.com/article/api-overview) | User onboarding | `apiKey` | Yes | Unknown |
| [UserPilot](https://docs.userpilot.com/) | User onboarding | `apiKey` | Yes | Unknown |
| [Chameleon](https://developers.trychameleon.com/docs) | User onboarding | `apiKey` | Yes | Unknown |
| [WalkMe](https://developer.walkme.com/) | User onboarding | `apiKey` | Yes | Unknown |
| [Lottie](https://lottiefiles.com/lottie-api) | Animations | `apiKey` | Yes | Unknown |
| [Rive](https://rive.app/api) | Animations | `apiKey` | Yes | Unknown |
| [Giphy](https://developers.giphy.com/docs/api/) | GIFs | `apiKey` | Yes | Unknown |
| [Tenor](https://tenor.com/gifapi/documentation) | GIFs | `apiKey` | Yes | Unknown |
| [Remove.bg](https://www.remove.bg/api) | Background removal | `apiKey` | Yes | Unknown |
| [Pixlr](https://pixlr.com/api/) | Image editing | `apiKey` | Yes | Unknown |
| [PDF.co](https://apidocs.pdf.co/) | PDF tools | `apiKey` | Yes | Unknown |
| [ConvertAPI](https://www.convertapi.com/doc) | File conversion | `apiKey` | Yes | Unknown |
| [Zamzar](https://developers.zamzar.com/) | File conversion | `apiKey` | Yes | Unknown |
| [Transloadit](https://transloadit.com/docs/) | File processing | `apiKey` | Yes | Unknown |
| [imgix](https://docs.imgix.com/apis) | Image CDN | `apiKey` | Yes | Unknown |
| [ImageKit](https://docs.imagekit.io/api-reference/) | Image CDN | `apiKey` | Yes | Unknown |
| [Bunny CDN](https://docs.bunny.net/reference/) | CDN | `apiKey` | Yes | Unknown |
| [KeyCDN](https://www.keycdn.com/api) | CDN | `apiKey` | Yes | Unknown |
| [BunnyCDN Stream](https://docs.bunny.net/reference/stream) | Video CDN | `apiKey` | Yes | Unknown |
| [Cloudinary](https://cloudinary.com/documentation/image_upload_api_reference) | Media management | `apiKey` | Yes | Unknown |
| [Uploadcare](https://uploadcare.com/api-refs/rest-api/v0.7.0/) | File uploading | `apiKey` | Yes | Unknown |
| [Filestack](https://www.filestack.com/docs/) | File uploading | `apiKey` | Yes | Unknown |
| [Uploadthing](https://docs.uploadthing.com/) | File uploading | `apiKey` | Yes | Unknown |
"""

# Common API list (manually curated comprehensive list)
apis = [
    # Animals
    {"name": "AdoptAPet", "description": "Resource to help get pets adopted", "category": "Science & Environment", "baseUrl": "https://www.adoptapet.com/public/apis/pet_list.html"},
    {"name": "Cat Facts", "description": "Daily cat facts API", "category": "Entertainment & Gaming", "baseUrl": "https://alexwohlbruck.github.io/cat-facts/"},
    {"name": "The Cat API", "description": "Pictures of cats from Tumblr", "category": "Entertainment & Gaming", "baseUrl": "https://docs.thecatapi.com/"},
    {"name": "Dog API", "description": "Based on the Stanford Dogs Dataset", "category": "Entertainment & Gaming", "baseUrl": "https://dog.ceo/dog-api/"},
    {"name": "eBird", "description": "Bird observation data", "category": "Science & Environment", "baseUrl": "https://documenter.getpostman.com/view/664302/S1ENwy59"},
    {"name": "FishWatch", "description": "Fish species information", "category": "Science & Environment", "baseUrl": "https://www.fishwatch.gov/developers"},
    {"name": "Petfinder", "description": "Pet adoption API", "category": "Science & Environment", "baseUrl": "https://www.petfinder.com/developers/"},
    
    # Anime
    {"name": "AniAPI", "description": "Anime discovery and streaming", "category": "Entertainment & Gaming", "baseUrl": "https://aniapi.com/docs/"},
    {"name": "AniList", "description": "Anime discovery & tracking", "category": "Entertainment & Gaming", "baseUrl": "https://anilist.gitbook.io/anilist-apiv2-docs/"},
    {"name": "Jikan", "description": "Unofficial MyAnimeList API", "category": "Entertainment & Gaming", "baseUrl": "https://jikan.moe"},
    {"name": "Kitsu", "description": "Anime discovery platform", "category": "Entertainment & Gaming", "baseUrl": "https://kitsu.docs.apiary.io/"},
    {"name": "MangaDex", "description": "Manga Database and Community", "category": "Entertainment & Gaming", "baseUrl": "https://api.mangadex.org/docs.html"},
    
    # Security
    {"name": "AbuseIPDB", "description": "IP/domain/URL reputation", "category": "Authentication & Security", "baseUrl": "https://docs.abuseipdb.com/"},
    {"name": "VirusTotal", "description": "File/URL Analysis", "category": "Authentication & Security", "baseUrl": "https://www.virustotal.com/"},
    {"name": "Have I Been Pwned", "description": "Data breach checker", "category": "Authentication & Security", "baseUrl": "https://haveibeenpwned.com/API/v3"},
    {"name": "Shodan", "description": "Internet-connected devices search", "category": "Authentication & Security", "baseUrl": "https://developer.shodan.io/"},
    
    # Art & Design
    {"name": "Art Institute of Chicago", "description": "Art Museum API", "category": "Design & Creative", "baseUrl": "https://api.artic.edu/docs/"},
    {"name": "Metropolitan Museum", "description": "Met Museum API", "category": "Design & Creative", "baseUrl": "https://metmuseum.github.io/"},
    {"name": "Rijksmuseum", "description": "Dutch art museum API", "category": "Design & Creative", "baseUrl": "https://data.rijksmuseum.nl/object-metadata/api/"},
    {"name": "Dribbble", "description": "Design community", "category": "Design & Creative", "baseUrl": "https://developer.dribbble.com"},
    {"name": "Colormind", "description": "Color scheme generator", "category": "Design & Creative", "baseUrl": "http://colormind.io/api-access/"},
    
    # Auth
    {"name": "Auth0", "description": "Authentication platform", "category": "Authentication & Security", "baseUrl": "https://auth0.com/docs/api"},
    {"name": "Okta", "description": "Identity management", "category": "Authentication & Security", "baseUrl": "https://developer.okta.com/docs/reference/"},
    {"name": "Firebase Auth", "description": "Google authentication", "category": "Authentication & Security", "baseUrl": "https://firebase.google.com/docs/auth"},
    {"name": "Clerk", "description": "User management", "category": "Authentication & Security", "baseUrl": "https://clerk.com/docs/reference/"},
    
    # Blockchain
    {"name": "Etherscan", "description": "Ethereum explorer API", "category": "Crypto & Blockchain", "baseUrl": "https://etherscan.io/apis"},
    {"name": "The Graph", "description": "Blockchain indexing", "category": "Crypto & Blockchain", "baseUrl": "https://thegraph.com/docs/"},
    {"name": "Alchemy", "description": "Web3 development platform", "category": "Crypto & Blockchain", "baseUrl": "https://docs.alchemy.com/"},
    {"name": "Infura", "description": "Ethereum API", "category": "Crypto & Blockchain", "baseUrl": "https://docs.infura.io/"},
    {"name": "Moralis", "description": "Web3 API", "category": "Crypto & Blockchain", "baseUrl": "https://docs.moralis.io/"},
    {"name": "QuickNode", "description": "Blockchain nodes", "category": "Crypto & Blockchain", "baseUrl": "https://www.quicknode.com/docs"},
    
    # Books
    {"name": "Google Books", "description": "Books API", "category": "Content & Media", "baseUrl": "https://developers.google.com/books/"},
    {"name": "Open Library", "description": "Books database", "category": "Content & Media", "baseUrl": "https://openlibrary.org/developers/api"},
    {"name": "Gutenberg", "description": "Free ebooks", "category": "Content & Media", "baseUrl": "https://gutendex.com/"},
    
    # Business
    {"name": "Clearbit", "description": "Company data", "category": "Business & Productivity", "baseUrl": "https://clearbit.com/docs"},
    {"name": "Crunchbase", "description": "Company database", "category": "Business & Productivity", "baseUrl": "https://data.crunchbase.com/docs/"},
    {"name": "Apollo.io", "description": "Sales intelligence", "category": "Business & Productivity", "baseUrl": "https://apolloio.github.io/apollo-api-docs/"},
    {"name": "ZoomInfo", "description": "B2B data", "category": "Business & Productivity", "baseUrl": "https://api-docs.zoominfo.com/"},
    
    # Calendar
    {"name": "Google Calendar", "description": "Calendar API", "category": "Business & Productivity", "baseUrl": "https://developers.google.com/calendar"},
    {"name": "Calendly", "description": "Scheduling API", "category": "Business & Productivity", "baseUrl": "https://developer.calendly.com/"},
    {"name": "Cal.com", "description": "Open scheduling", "category": "Business & Productivity", "baseUrl": "https://cal.com/docs/api"},
    
    # Cloud Storage
    {"name": "Dropbox", "description": "File storage", "category": "Cloud & Infrastructure", "baseUrl": "https://www.dropbox.com/developers"},
    {"name": "Google Drive", "description": "File storage", "category": "Cloud & Infrastructure", "baseUrl": "https://developers.google.com/drive/"},
    {"name": "OneDrive", "description": "Microsoft file storage", "category": "Cloud & Infrastructure", "baseUrl": "https://developer.microsoft.com/en-us/onedrive"},
    {"name": "Box", "description": "Enterprise file storage", "category": "Cloud & Infrastructure", "baseUrl": "https://developer.box.com/"},
    
    # CI/CD
    {"name": "GitHub Actions", "description": "CI/CD workflows", "category": "Developer Tools", "baseUrl": "https://docs.github.com/en/actions"},
    {"name": "CircleCI", "description": "CI/CD platform", "category": "Developer Tools", "baseUrl": "https://circleci.com/docs/api/"},
    {"name": "Travis CI", "description": "CI/CD platform", "category": "Developer Tools", "baseUrl": "https://docs.travis-ci.com/api/"},
    {"name": "Jenkins", "description": "Automation server", "category": "Developer Tools", "baseUrl": "https://www.jenkins.io/doc/book/using/remote-access-api/"},
    
    # Crypto
    {"name": "Binance", "description": "Crypto exchange", "category": "Crypto & Blockchain", "baseUrl": "https://binance-docs.github.io/apidocs/"},
    {"name": "Coinbase", "description": "Crypto exchange", "category": "Crypto & Blockchain", "baseUrl": "https://developers.coinbase.com/"},
    {"name": "CoinGecko", "description": "Crypto data", "category": "Crypto & Blockchain", "baseUrl": "https://www.coingecko.com/api/documentation"},
    {"name": "CoinMarketCap", "description": "Crypto prices", "category": "Crypto & Blockchain", "baseUrl": "https://coinmarketcap.com/api/documentation/"},
    {"name": "Kraken", "description": "Crypto exchange", "category": "Crypto & Blockchain", "baseUrl": "https://docs.kraken.com/rest/"},
    {"name": "FTX", "description": "Crypto derivatives", "category": "Crypto & Blockchain", "baseUrl": "https://docs.ftx.com/"},
    {"name": "Uniswap", "description": "DEX API", "category": "Crypto & Blockchain", "baseUrl": "https://docs.uniswap.org/"},
    {"name": "OpenSea", "description": "NFT marketplace", "category": "Crypto & Blockchain", "baseUrl": "https://docs.opensea.io/"},
    
    # Currency
    {"name": "ExchangeRate-API", "description": "Currency conversion", "category": "Finance & Banking", "baseUrl": "https://www.exchangerate-api.com/docs"},
    {"name": "Frankfurter", "description": "Exchange rates", "category": "Finance & Banking", "baseUrl": "https://www.frankfurter.app/docs"},
    {"name": "Fixer", "description": "Forex rates", "category": "Finance & Banking", "baseUrl": "https://fixer.io/documentation"},
    {"name": "Open Exchange Rates", "description": "Currency rates", "category": "Finance & Banking", "baseUrl": "https://docs.openexchangerates.org/"},
    
    # Developer Tools
    {"name": "GitHub", "description": "Code hosting", "category": "Developer Tools", "baseUrl": "https://docs.github.com/en/rest"},
    {"name": "GitLab", "description": "DevOps platform", "category": "Developer Tools", "baseUrl": "https://docs.gitlab.com/ee/api/"},
    {"name": "Bitbucket", "description": "Git repository hosting", "category": "Developer Tools", "baseUrl": "https://developer.atlassian.com/cloud/bitbucket/rest/"},
    {"name": "npm Registry", "description": "Package registry", "category": "Developer Tools", "baseUrl": "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md"},
    {"name": "PyPI", "description": "Python packages", "category": "Developer Tools", "baseUrl": "https://warehouse.pypa.io/api-reference/"},
    {"name": "Postman", "description": "API testing", "category": "Developer Tools", "baseUrl": "https://www.postman.com/postman/"},
    
    # Dictionaries
    {"name": "Merriam-Webster", "description": "Dictionary API", "category": "Education", "baseUrl": "https://dictionaryapi.com/"},
    {"name": "Oxford Dictionary", "description": "Dictionary API", "category": "Education", "baseUrl": "https://developer.oxforddictionaries.com/"},
    {"name": "WordsAPI", "description": "Word definitions", "category": "Education", "baseUrl": "https://www.wordsapi.com/"},
    
    # Documents
    {"name": "Airtable", "description": "Spreadsheet database", "category": "Business & Productivity", "baseUrl": "https://airtable.com/developers/web/api/introduction"},
    {"name": "Notion", "description": "Productivity tool", "category": "Business & Productivity", "baseUrl": "https://developers.notion.com/"},
    {"name": "Todoist", "description": "Task management", "category": "Business & Productivity", "baseUrl": "https://developer.todoist.com/rest/v2/"},
    {"name": "Google Docs", "description": "Document editing", "category": "Business & Productivity", "baseUrl": "https://developers.google.com/docs/api"},
    {"name": "Google Sheets", "description": "Spreadsheets", "category": "Business & Productivity", "baseUrl": "https://developers.google.com/sheets/api"},
    
    # Email
    {"name": "SendGrid", "description": "Email delivery", "category": "Communication", "baseUrl": "https://docs.sendgrid.com/api-reference"},
    {"name": "Mailgun", "description": "Email API", "category": "Communication", "baseUrl": "https://documentation.mailgun.com/"},
    {"name": "Postmark", "description": "Transactional email", "category": "Communication", "baseUrl": "https://postmarkapp.com/developer"},
    {"name": "Resend", "description": "Email for developers", "category": "Communication", "baseUrl": "https://resend.com/docs/api-reference"},
    {"name": "Mailchimp", "description": "Email marketing", "category": "Marketing & Advertising", "baseUrl": "https://mailchimp.com/developer/"},
    
    # Events
    {"name": "Eventbrite", "description": "Event management", "category": "Entertainment & Gaming", "baseUrl": "https://www.eventbrite.com/platform/api/"},
    {"name": "Ticketmaster", "description": "Ticket sales", "category": "Entertainment & Gaming", "baseUrl": "https://developer.ticketmaster.com/"},
    {"name": "Meetup", "description": "Event platform", "category": "Social & Community", "baseUrl": "https://www.meetup.com/api/"},
    
    # Finance
    {"name": "Alpha Vantage", "description": "Stock data", "category": "Finance & Banking", "baseUrl": "https://www.alphavantage.co/documentation/"},
    {"name": "Yahoo Finance", "description": "Financial data", "category": "Finance & Banking", "baseUrl": "https://www.yahoofinanceapi.com/"},
    {"name": "Finnhub", "description": "Stock API", "category": "Finance & Banking", "baseUrl": "https://finnhub.io/docs/api"},
    {"name": "Polygon.io", "description": "Market data", "category": "Finance & Banking", "baseUrl": "https://polygon.io/docs/"},
    {"name": "Plaid", "description": "Banking API", "category": "Finance & Banking", "baseUrl": "https://plaid.com/docs/"},
    {"name": "Stripe", "description": "Payment processing", "category": "E-commerce & Payments", "baseUrl": "https://stripe.com/docs/api"},
    {"name": "PayPal", "description": "Payments", "category": "E-commerce & Payments", "baseUrl": "https://developer.paypal.com/api/rest/"},
    {"name": "Square", "description": "Payment platform", "category": "E-commerce & Payments", "baseUrl": "https://developer.squareup.com/reference/square"},
    
    # Food
    {"name": "Spoonacular", "description": "Recipe API", "category": "Food & Hospitality", "baseUrl": "https://spoonacular.com/food-api"},
    {"name": "TheMealDB", "description": "Meal recipes", "category": "Food & Hospitality", "baseUrl": "https://www.themealdb.com/api.php"},
    {"name": "TheCocktailDB", "description": "Cocktail recipes", "category": "Food & Hospitality", "baseUrl": "https://www.thecocktaildb.com/api.php"},
    {"name": "Edamam", "description": "Nutrition data", "category": "Food & Hospitality", "baseUrl": "https://developer.edamam.com/"},
    {"name": "Open Food Facts", "description": "Food products database", "category": "Food & Hospitality", "baseUrl": "https://world.openfoodfacts.org/data"},
    {"name": "Yelp Fusion", "description": "Restaurant reviews", "category": "Food & Hospitality", "baseUrl": "https://docs.developer.yelp.com/"},
    
    # Games
    {"name": "Steam", "description": "Gaming platform", "category": "Entertainment & Gaming", "baseUrl": "https://steamcommunity.com/dev"},
    {"name": "Twitch", "description": "Streaming platform", "category": "Entertainment & Gaming", "baseUrl": "https://dev.twitch.tv/docs/api/"},
    {"name": "RAWG", "description": "Video game database", "category": "Entertainment & Gaming", "baseUrl": "https://rawg.io/apidocs"},
    {"name": "IGDB", "description": "Game database", "category": "Entertainment & Gaming", "baseUrl": "https://api-docs.igdb.com/"},
    {"name": "Discord", "description": "Gaming chat", "category": "Communication", "baseUrl": "https://discord.com/developers/docs/"},
    {"name": "Epic Games", "description": "Game store API", "category": "Entertainment & Gaming", "baseUrl": "https://dev.epicgames.com/docs/"},
    {"name": "Riot Games", "description": "League of Legends API", "category": "Entertainment & Gaming", "baseUrl": "https://developer.riotgames.com/"},
    
    # Geocoding
    {"name": "Google Maps", "description": "Maps and geocoding", "category": "Location & Maps", "baseUrl": "https://developers.google.com/maps"},
    {"name": "Mapbox", "description": "Maps platform", "category": "Location & Maps", "baseUrl": "https://docs.mapbox.com/"},
    {"name": "OpenStreetMap", "description": "Open maps", "category": "Location & Maps", "baseUrl": "https://wiki.openstreetmap.org/wiki/API"},
    {"name": "HERE Maps", "description": "Location platform", "category": "Location & Maps", "baseUrl": "https://developer.here.com/"},
    {"name": "Nominatim", "description": "Geocoding", "category": "Location & Maps", "baseUrl": "https://nominatim.org/release-docs/latest/api/Overview/"},
    {"name": "ipinfo.io", "description": "IP geolocation", "category": "Location & Maps", "baseUrl": "https://ipinfo.io/developers"},
    {"name": "ipstack", "description": "IP geolocation", "category": "Location & Maps", "baseUrl": "https://ipstack.com/documentation"},
    {"name": "MaxMind GeoIP", "description": "IP geolocation", "category": "Location & Maps", "baseUrl": "https://dev.maxmind.com/geoip/"},
    
    # Government
    {"name": "USA.gov", "description": "US government data", "category": "Government & Public Data", "baseUrl": "https://www.usa.gov/developer"},
    {"name": "Data.gov", "description": "US open data", "category": "Government & Public Data", "baseUrl": "https://api.data.gov/"},
    {"name": "EU Open Data", "description": "European data", "category": "Government & Public Data", "baseUrl": "https://data.europa.eu/en"},
    {"name": "World Bank", "description": "Global development data", "category": "Government & Public Data", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-api-documentation"},
    {"name": "UN Data", "description": "United Nations statistics", "category": "Government & Public Data", "baseUrl": "https://data.un.org/Host.aspx?Content=API"},
    
    # Health
    {"name": "OpenFDA", "description": "FDA data", "category": "Healthcare", "baseUrl": "https://open.fda.gov/apis/"},
    {"name": "Healthcare.gov", "description": "Health marketplace", "category": "Healthcare", "baseUrl": "https://www.healthcare.gov/developers/"},
    {"name": "BetterDoctor", "description": "Doctor search", "category": "Healthcare", "baseUrl": "https://developer.betterdoctor.com/"},
    {"name": "NIH APIs", "description": "Health research", "category": "Healthcare", "baseUrl": "https://api.nih.gov/"},
    
    # Jobs
    {"name": "LinkedIn", "description": "Professional network", "category": "HR & Recruiting", "baseUrl": "https://docs.microsoft.com/en-us/linkedin/"},
    {"name": "Indeed", "description": "Job search", "category": "HR & Recruiting", "baseUrl": "https://developer.indeed.com/"},
    {"name": "Glassdoor", "description": "Company reviews", "category": "HR & Recruiting", "baseUrl": "https://www.glassdoor.com/developer/index.htm"},
    {"name": "Lever", "description": "Recruiting ATS", "category": "HR & Recruiting", "baseUrl": "https://hire.lever.co/developer/documentation"},
    {"name": "Greenhouse", "description": "Recruiting software", "category": "HR & Recruiting", "baseUrl": "https://developers.greenhouse.io/"},
    {"name": "Workable", "description": "Recruitment", "category": "HR & Recruiting", "baseUrl": "https://workable.readme.io/reference"},
    
    # Machine Learning
    {"name": "OpenAI", "description": "AI models", "category": "AI & Machine Learning", "baseUrl": "https://platform.openai.com/docs/api-reference"},
    {"name": "Anthropic Claude", "description": "AI assistant", "category": "AI & Machine Learning", "baseUrl": "https://docs.anthropic.com/"},
    {"name": "Hugging Face", "description": "ML models", "category": "AI & Machine Learning", "baseUrl": "https://huggingface.co/docs/api-inference/"},
    {"name": "Google Cloud AI", "description": "ML services", "category": "AI & Machine Learning", "baseUrl": "https://cloud.google.com/ai-platform/docs"},
    {"name": "AWS SageMaker", "description": "ML platform", "category": "AI & Machine Learning", "baseUrl": "https://docs.aws.amazon.com/sagemaker/"},
    {"name": "Azure ML", "description": "Microsoft ML", "category": "AI & Machine Learning", "baseUrl": "https://docs.microsoft.com/en-us/azure/machine-learning/"},
    {"name": "Cohere", "description": "NLP API", "category": "AI & Machine Learning", "baseUrl": "https://docs.cohere.ai/"},
    {"name": "Replicate", "description": "ML models API", "category": "AI & Machine Learning", "baseUrl": "https://replicate.com/docs"},
    {"name": "Stability AI", "description": "Image generation", "category": "AI & Machine Learning", "baseUrl": "https://platform.stability.ai/docs/"},
    {"name": "Midjourney", "description": "Image generation", "category": "AI & Machine Learning", "baseUrl": "https://docs.midjourney.com/"},
    {"name": "ElevenLabs", "description": "Voice synthesis", "category": "AI & Machine Learning", "baseUrl": "https://docs.elevenlabs.io/"},
    {"name": "Whisper", "description": "Speech to text", "category": "AI & Machine Learning", "baseUrl": "https://platform.openai.com/docs/guides/speech-to-text"},
    {"name": "AssemblyAI", "description": "Speech recognition", "category": "AI & Machine Learning", "baseUrl": "https://www.assemblyai.com/docs/"},
    {"name": "Deepgram", "description": "Voice AI", "category": "AI & Machine Learning", "baseUrl": "https://developers.deepgram.com/"},
    {"name": "Rev.ai", "description": "Speech recognition", "category": "AI & Machine Learning", "baseUrl": "https://docs.rev.ai/"},
    
    # Music
    {"name": "Spotify", "description": "Music streaming", "category": "Content & Media", "baseUrl": "https://developer.spotify.com/documentation/web-api/"},
    {"name": "Last.fm", "description": "Music scrobbling", "category": "Content & Media", "baseUrl": "https://www.last.fm/api"},
    {"name": "SoundCloud", "description": "Music platform", "category": "Content & Media", "baseUrl": "https://developers.soundcloud.com/docs/api/guide"},
    {"name": "Deezer", "description": "Music streaming", "category": "Content & Media", "baseUrl": "https://developers.deezer.com/api"},
    {"name": "Apple Music", "description": "Music service", "category": "Content & Media", "baseUrl": "https://developer.apple.com/documentation/applemusicapi"},
    {"name": "Genius", "description": "Song lyrics", "category": "Content & Media", "baseUrl": "https://docs.genius.com/"},
    {"name": "Musixmatch", "description": "Lyrics API", "category": "Content & Media", "baseUrl": "https://developer.musixmatch.com/"},
    
    # News
    {"name": "NewsAPI", "description": "News aggregator", "category": "Content & Media", "baseUrl": "https://newsapi.org/docs"},
    {"name": "GNews", "description": "News API", "category": "Content & Media", "baseUrl": "https://gnews.io/docs/"},
    {"name": "The Guardian", "description": "News content", "category": "Content & Media", "baseUrl": "https://open-platform.theguardian.com/documentation/"},
    {"name": "New York Times", "description": "News API", "category": "Content & Media", "baseUrl": "https://developer.nytimes.com/apis"},
    {"name": "Hacker News", "description": "Tech news", "category": "Content & Media", "baseUrl": "https://github.com/HackerNews/API"},
    
    # Photography
    {"name": "Unsplash", "description": "Stock photos", "category": "Content & Media", "baseUrl": "https://unsplash.com/developers"},
    {"name": "Pexels", "description": "Free photos", "category": "Content & Media", "baseUrl": "https://www.pexels.com/api/"},
    {"name": "Pixabay", "description": "Free images", "category": "Content & Media", "baseUrl": "https://pixabay.com/api/docs/"},
    {"name": "Imgur", "description": "Image hosting", "category": "Content & Media", "baseUrl": "https://apidocs.imgur.com/"},
    {"name": "Giphy", "description": "GIF platform", "category": "Content & Media", "baseUrl": "https://developers.giphy.com/docs/api/"},
    {"name": "Tenor", "description": "GIF search", "category": "Content & Media", "baseUrl": "https://tenor.com/gifapi/documentation"},
    
    # Science
    {"name": "NASA", "description": "Space data", "category": "Science & Environment", "baseUrl": "https://api.nasa.gov/"},
    {"name": "SpaceX", "description": "Space launches", "category": "Science & Environment", "baseUrl": "https://github.com/r-spacex/SpaceX-API"},
    {"name": "USGS", "description": "Geological data", "category": "Science & Environment", "baseUrl": "https://www.usgs.gov/products/web-tools/apis"},
    {"name": "NOAA", "description": "Weather data", "category": "Science & Environment", "baseUrl": "https://www.weather.gov/documentation/services-web-api"},
    {"name": "Open Meteo", "description": "Weather API", "category": "Science & Environment", "baseUrl": "https://open-meteo.com/"},
    
    # Security
    {"name": "Cloudflare", "description": "Security and CDN", "category": "Authentication & Security", "baseUrl": "https://api.cloudflare.com/"},
    {"name": "Let's Encrypt", "description": "SSL certificates", "category": "Authentication & Security", "baseUrl": "https://letsencrypt.org/docs/"},
    {"name": "HaveIBeenPwned", "description": "Breach database", "category": "Authentication & Security", "baseUrl": "https://haveibeenpwned.com/API/v3"},
    {"name": "SecurityTrails", "description": "DNS data", "category": "Authentication & Security", "baseUrl": "https://docs.securitytrails.com/"},
    
    # Shopping
    {"name": "Shopify", "description": "E-commerce platform", "category": "E-commerce & Payments", "baseUrl": "https://shopify.dev/api"},
    {"name": "WooCommerce", "description": "WordPress commerce", "category": "E-commerce & Payments", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs/"},
    {"name": "BigCommerce", "description": "E-commerce", "category": "E-commerce & Payments", "baseUrl": "https://developer.bigcommerce.com/api-docs"},
    {"name": "Amazon Product", "description": "Product data", "category": "E-commerce & Payments", "baseUrl": "https://webservices.amazon.com/paapi5/documentation/"},
    {"name": "eBay", "description": "Marketplace", "category": "E-commerce & Payments", "baseUrl": "https://developer.ebay.com/api-docs"},
    {"name": "Etsy", "description": "Handmade marketplace", "category": "E-commerce & Payments", "baseUrl": "https://developers.etsy.com/documentation/"},
    
    # Social
    {"name": "Twitter/X", "description": "Social media", "category": "Social & Community", "baseUrl": "https://developer.twitter.com/en/docs"},
    {"name": "Facebook Graph", "description": "Social network", "category": "Social & Community", "baseUrl": "https://developers.facebook.com/docs/graph-api/"},
    {"name": "Instagram", "description": "Photo sharing", "category": "Social & Community", "baseUrl": "https://developers.facebook.com/docs/instagram-api/"},
    {"name": "Reddit", "description": "Social news", "category": "Social & Community", "baseUrl": "https://www.reddit.com/dev/api/"},
    {"name": "TikTok", "description": "Video platform", "category": "Social & Community", "baseUrl": "https://developers.tiktok.com/"},
    {"name": "Pinterest", "description": "Image pinning", "category": "Social & Community", "baseUrl": "https://developers.pinterest.com/docs/api/"},
    {"name": "Mastodon", "description": "Decentralized social", "category": "Social & Community", "baseUrl": "https://docs.joinmastodon.org/api/"},
    
    # Sports
    {"name": "ESPN", "description": "Sports data", "category": "Sports & Fitness", "baseUrl": "https://www.espn.com/apis/devcenter/docs/"},
    {"name": "NBA Stats", "description": "Basketball data", "category": "Sports & Fitness", "baseUrl": "https://www.nba.com/stats/"},
    {"name": "NFL", "description": "Football data", "category": "Sports & Fitness", "baseUrl": "https://www.nfl.com/api/"},
    {"name": "Strava", "description": "Fitness tracking", "category": "Sports & Fitness", "baseUrl": "https://developers.strava.com/"},
    {"name": "Fitbit", "description": "Fitness data", "category": "Sports & Fitness", "baseUrl": "https://dev.fitbit.com/"},
    {"name": "Football-Data", "description": "Soccer data", "category": "Sports & Fitness", "baseUrl": "https://www.football-data.org/documentation/"},
    {"name": "SportsDB", "description": "Sports database", "category": "Sports & Fitness", "baseUrl": "https://www.thesportsdb.com/api.php"},
    
    # Transportation
    {"name": "Uber", "description": "Ride sharing", "category": "Travel & Transportation", "baseUrl": "https://developer.uber.com/docs"},
    {"name": "Lyft", "description": "Ride sharing", "category": "Travel & Transportation", "baseUrl": "https://developer.lyft.com/docs"},
    {"name": "Google Flights", "description": "Flight search", "category": "Travel & Transportation", "baseUrl": "https://developers.google.com/travel"},
    {"name": "Amadeus", "description": "Travel APIs", "category": "Travel & Transportation", "baseUrl": "https://developers.amadeus.com/"},
    {"name": "Skyscanner", "description": "Flight search", "category": "Travel & Transportation", "baseUrl": "https://developers.skyscanner.net/"},
    {"name": "FlightAware", "description": "Flight tracking", "category": "Travel & Transportation", "baseUrl": "https://flightaware.com/commercial/flightxml/"},
    
    # URL Shorteners
    {"name": "Bitly", "description": "URL shortening", "category": "Utilities & Tools", "baseUrl": "https://dev.bitly.com/"},
    {"name": "TinyURL", "description": "URL shortening", "category": "Utilities & Tools", "baseUrl": "https://tinyurl.com/app/dev"},
    {"name": "Rebrandly", "description": "Link management", "category": "Utilities & Tools", "baseUrl": "https://developers.rebrandly.com/"},
    
    # Video
    {"name": "YouTube", "description": "Video platform", "category": "Content & Media", "baseUrl": "https://developers.google.com/youtube/v3"},
    {"name": "Vimeo", "description": "Video hosting", "category": "Content & Media", "baseUrl": "https://developer.vimeo.com/"},
    {"name": "Mux", "description": "Video streaming", "category": "Content & Media", "baseUrl": "https://docs.mux.com/"},
    {"name": "Wistia", "description": "Video hosting", "category": "Content & Media", "baseUrl": "https://wistia.com/support/developers"},
    {"name": "Cloudflare Stream", "description": "Video streaming", "category": "Content & Media", "baseUrl": "https://developers.cloudflare.com/stream/"},
    
    # Weather
    {"name": "OpenWeatherMap", "description": "Weather data", "category": "Science & Environment", "baseUrl": "https://openweathermap.org/api"},
    {"name": "WeatherAPI", "description": "Weather service", "category": "Science & Environment", "baseUrl": "https://www.weatherapi.com/docs/"},
    {"name": "Weather.gov", "description": "US weather", "category": "Science & Environment", "baseUrl": "https://www.weather.gov/documentation/services-web-api"},
    {"name": "Tomorrow.io", "description": "Weather intelligence", "category": "Science & Environment", "baseUrl": "https://docs.tomorrow.io/"},
    {"name": "Visual Crossing", "description": "Weather history", "category": "Science & Environment", "baseUrl": "https://www.visualcrossing.com/resources/documentation/"},
    
    # SMS/Communication
    {"name": "Twilio", "description": "SMS and voice", "category": "Communication", "baseUrl": "https://www.twilio.com/docs/usage/api"},
    {"name": "Vonage", "description": "Communications API", "category": "Communication", "baseUrl": "https://developer.vonage.com/"},
    {"name": "MessageBird", "description": "Omnichannel", "category": "Communication", "baseUrl": "https://developers.messagebird.com/api/"},
    {"name": "Plivo", "description": "Voice and SMS", "category": "Communication", "baseUrl": "https://www.plivo.com/docs/"},
    {"name": "Bandwidth", "description": "Communications", "category": "Communication", "baseUrl": "https://dev.bandwidth.com/apis/"},
    
    # Chat Platforms
    {"name": "Slack", "description": "Team chat", "category": "Communication", "baseUrl": "https://api.slack.com/"},
    {"name": "Telegram", "description": "Messaging", "category": "Communication", "baseUrl": "https://core.telegram.org/api"},
    {"name": "WhatsApp Business", "description": "Business messaging", "category": "Communication", "baseUrl": "https://developers.facebook.com/docs/whatsapp/"},
    {"name": "Microsoft Teams", "description": "Team collaboration", "category": "Communication", "baseUrl": "https://docs.microsoft.com/en-us/graph/teams-concept-overview"},
    
    # Cloud Providers
    {"name": "AWS", "description": "Amazon cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.aws.amazon.com/"},
    {"name": "Google Cloud", "description": "Google cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://cloud.google.com/apis/docs/overview"},
    {"name": "Azure", "description": "Microsoft cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/azure/"},
    {"name": "DigitalOcean", "description": "Cloud hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.digitalocean.com/reference/api/"},
    {"name": "Linode", "description": "Cloud hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://www.linode.com/docs/api/"},
    {"name": "Vultr", "description": "Cloud compute", "category": "Cloud & Infrastructure", "baseUrl": "https://www.vultr.com/api/"},
    {"name": "Hetzner", "description": "German cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.hetzner.cloud/"},
    {"name": "Oracle Cloud", "description": "Oracle cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.oracle.com/en-us/iaas/api/"},
    {"name": "IBM Cloud", "description": "IBM cloud", "category": "Cloud & Infrastructure", "baseUrl": "https://cloud.ibm.com/apidocs"},
    
    # Hosting
    {"name": "Vercel", "description": "Frontend hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://vercel.com/docs/rest-api"},
    {"name": "Netlify", "description": "Web hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.netlify.com/api/"},
    {"name": "Heroku", "description": "Platform as service", "category": "Cloud & Infrastructure", "baseUrl": "https://devcenter.heroku.com/articles/platform-api-reference"},
    {"name": "Railway", "description": "Infrastructure", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.railway.app/reference/"},
    {"name": "Render", "description": "Cloud hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://api-docs.render.com/"},
    {"name": "Fly.io", "description": "Edge hosting", "category": "Cloud & Infrastructure", "baseUrl": "https://fly.io/docs/reference/machines/"},
    
    # Databases
    {"name": "MongoDB Atlas", "description": "Cloud database", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.atlas.mongodb.com/api/"},
    {"name": "Supabase", "description": "Open source Firebase", "category": "Cloud & Infrastructure", "baseUrl": "https://supabase.com/docs/reference"},
    {"name": "Firebase", "description": "Google backend", "category": "Cloud & Infrastructure", "baseUrl": "https://firebase.google.com/docs/reference"},
    {"name": "PlanetScale", "description": "MySQL platform", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.planetscale.com/reference/"},
    {"name": "Fauna", "description": "Serverless database", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.fauna.com/fauna/current/api/"},
    {"name": "Upstash", "description": "Serverless Redis", "category": "Cloud & Infrastructure", "baseUrl": "https://docs.upstash.com/"},
    {"name": "Neon", "description": "Serverless Postgres", "category": "Cloud & Infrastructure", "baseUrl": "https://neon.tech/docs/reference/"},
    
    # CMS
    {"name": "Contentful", "description": "Headless CMS", "category": "Content & Media", "baseUrl": "https://www.contentful.com/developers/docs/"},
    {"name": "Sanity", "description": "Content platform", "category": "Content & Media", "baseUrl": "https://www.sanity.io/docs/http-api"},
    {"name": "Strapi", "description": "Open source CMS", "category": "Content & Media", "baseUrl": "https://docs.strapi.io/developer-docs/latest/"},
    {"name": "Ghost", "description": "Publishing platform", "category": "Content & Media", "baseUrl": "https://ghost.org/docs/content-api/"},
    {"name": "WordPress", "description": "Content management", "category": "Content & Media", "baseUrl": "https://developer.wordpress.org/rest-api/"},
    {"name": "Prismic", "description": "Headless CMS", "category": "Content & Media", "baseUrl": "https://prismic.io/docs/api"},
    {"name": "Directus", "description": "Open data platform", "category": "Content & Media", "baseUrl": "https://docs.directus.io/reference/"},
    
    # Monitoring
    {"name": "Datadog", "description": "Monitoring platform", "category": "Developer Tools", "baseUrl": "https://docs.datadoghq.com/api/"},
    {"name": "New Relic", "description": "Observability", "category": "Developer Tools", "baseUrl": "https://docs.newrelic.com/docs/apis/"},
    {"name": "Sentry", "description": "Error tracking", "category": "Developer Tools", "baseUrl": "https://docs.sentry.io/api/"},
    {"name": "Grafana", "description": "Dashboards", "category": "Developer Tools", "baseUrl": "https://grafana.com/docs/grafana/latest/http_api/"},
    {"name": "PagerDuty", "description": "Incident management", "category": "Developer Tools", "baseUrl": "https://developer.pagerduty.com/api-reference/"},
    {"name": "Splunk", "description": "Data platform", "category": "Analytics & Data", "baseUrl": "https://docs.splunk.com/Documentation/Splunk/latest/RESTAPI/"},
    
    # Analytics
    {"name": "Google Analytics", "description": "Web analytics", "category": "Analytics & Data", "baseUrl": "https://developers.google.com/analytics"},
    {"name": "Mixpanel", "description": "Product analytics", "category": "Analytics & Data", "baseUrl": "https://developer.mixpanel.com/reference"},
    {"name": "Amplitude", "description": "Product analytics", "category": "Analytics & Data", "baseUrl": "https://developers.amplitude.com/docs/"},
    {"name": "Segment", "description": "Customer data", "category": "Analytics & Data", "baseUrl": "https://segment.com/docs/connections/sources/catalog/"},
    {"name": "Heap", "description": "Digital insights", "category": "Analytics & Data", "baseUrl": "https://developers.heap.io/reference"},
    {"name": "PostHog", "description": "Product analytics", "category": "Analytics & Data", "baseUrl": "https://posthog.com/docs/api"},
    {"name": "Plausible", "description": "Privacy analytics", "category": "Analytics & Data", "baseUrl": "https://plausible.io/docs/"},
    
    # Search
    {"name": "Algolia", "description": "Search service", "category": "Developer Tools", "baseUrl": "https://www.algolia.com/doc/"},
    {"name": "Elasticsearch", "description": "Search engine", "category": "Developer Tools", "baseUrl": "https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html"},
    {"name": "MeiliSearch", "description": "Search engine", "category": "Developer Tools", "baseUrl": "https://docs.meilisearch.com/reference/api/"},
    {"name": "Typesense", "description": "Search engine", "category": "Developer Tools", "baseUrl": "https://typesense.org/docs/api/"},
    
    # Translation
    {"name": "DeepL", "description": "Translation API", "category": "AI & Machine Learning", "baseUrl": "https://www.deepl.com/docs-api"},
    {"name": "Google Translate", "description": "Translation", "category": "AI & Machine Learning", "baseUrl": "https://cloud.google.com/translate/docs"},
    {"name": "Microsoft Translator", "description": "Translation", "category": "AI & Machine Learning", "baseUrl": "https://docs.microsoft.com/en-us/azure/cognitive-services/translator/"},
    {"name": "LibreTranslate", "description": "Open translation", "category": "AI & Machine Learning", "baseUrl": "https://libretranslate.com/docs/"},
    
    # PDF/Documents
    {"name": "PDF.co", "description": "PDF tools", "category": "Utilities & Tools", "baseUrl": "https://apidocs.pdf.co/"},
    {"name": "DocuSign", "description": "E-signatures", "category": "Business & Productivity", "baseUrl": "https://developers.docusign.com/"},
    {"name": "Adobe PDF Services", "description": "PDF APIs", "category": "Utilities & Tools", "baseUrl": "https://developer.adobe.com/document-services/docs/"},
    {"name": "Smallpdf", "description": "PDF tools", "category": "Utilities & Tools", "baseUrl": "https://smallpdf.com/api"},
    
    # QR Codes
    {"name": "QR Code Generator", "description": "QR codes", "category": "Utilities & Tools", "baseUrl": "https://goqr.me/api/"},
    {"name": "QRCode Monkey", "description": "Custom QR codes", "category": "Utilities & Tools", "baseUrl": "https://www.qrcode-monkey.com/qr-code-api-with-logo/"},
    
    # IoT
    {"name": "Arduino Cloud", "description": "IoT platform", "category": "IoT & Hardware", "baseUrl": "https://www.arduino.cc/reference/en/iot/api/"},
    {"name": "Particle", "description": "IoT platform", "category": "IoT & Hardware", "baseUrl": "https://docs.particle.io/reference/device-cloud/api/"},
    {"name": "ThingSpeak", "description": "IoT analytics", "category": "IoT & Hardware", "baseUrl": "https://www.mathworks.com/help/thingspeak/"},
    {"name": "Adafruit IO", "description": "IoT cloud", "category": "IoT & Hardware", "baseUrl": "https://io.adafruit.com/api/docs/"},
    {"name": "Blynk", "description": "IoT platform", "category": "IoT & Hardware", "baseUrl": "https://docs.blynk.io/"},
    {"name": "Home Assistant", "description": "Home automation", "category": "IoT & Hardware", "baseUrl": "https://developers.home-assistant.io/docs/api/rest/"},
    {"name": "SmartThings", "description": "Smart home", "category": "IoT & Hardware", "baseUrl": "https://developer-preview.smartthings.com/docs/api/"},
    {"name": "Philips Hue", "description": "Smart lighting", "category": "IoT & Hardware", "baseUrl": "https://developers.meethue.com/"},
    {"name": "IFTTT", "description": "Automation", "category": "IoT & Hardware", "baseUrl": "https://ifttt.com/docs/connect_api"},
    {"name": "Zapier", "description": "Automation", "category": "Business & Productivity", "baseUrl": "https://platform.zapier.com/docs/"},
    {"name": "Make (Integromat)", "description": "Automation", "category": "Business & Productivity", "baseUrl": "https://www.make.com/en/api-documentation"},
    
    # Education
    {"name": "Coursera", "description": "Online courses", "category": "Education", "baseUrl": "https://build.coursera.org/app-platform/catalog/"},
    {"name": "Udemy", "description": "Online learning", "category": "Education", "baseUrl": "https://www.udemy.com/developers/affiliate/"},
    {"name": "Khan Academy", "description": "Free education", "category": "Education", "baseUrl": "https://github.com/Khan/khan-api"},
    {"name": "Duolingo", "description": "Language learning", "category": "Education", "baseUrl": "https://www.duolingo.com/api/1/"},
    {"name": "Wolfram Alpha", "description": "Computational knowledge", "category": "Education", "baseUrl": "https://products.wolframalpha.com/api/"},
    {"name": "Wikipedia", "description": "Encyclopedia", "category": "Education", "baseUrl": "https://www.mediawiki.org/wiki/API:Main_page"},
    
    # Legal
    {"name": "DocuSign", "description": "E-signatures", "category": "Legal & Compliance", "baseUrl": "https://developers.docusign.com/"},
    {"name": "PandaDoc", "description": "Document automation", "category": "Legal & Compliance", "baseUrl": "https://developers.pandadoc.com/"},
    {"name": "Court Listener", "description": "Legal research", "category": "Legal & Compliance", "baseUrl": "https://www.courtlistener.com/api/"},
    
    # Real Estate
    {"name": "Zillow", "description": "Real estate data", "category": "Real Estate & Construction", "baseUrl": "https://www.zillow.com/howto/api/APIOverview.htm"},
    {"name": "Redfin", "description": "Real estate", "category": "Real Estate & Construction", "baseUrl": "https://www.redfin.com/openaccess"},
    {"name": "Realtor.com", "description": "Property listings", "category": "Real Estate & Construction", "baseUrl": "https://www.realtor.com/marketing/api/"},
    
    # Nordic/Regional
    {"name": "Trafikverket", "description": "Swedish transport", "category": "Nordic & Regional", "baseUrl": "https://api.trafikinfo.trafikverket.se/"},
    {"name": "Skatteverket", "description": "Swedish tax", "category": "Nordic & Regional", "baseUrl": "https://www.skatteverket.se/"},
    {"name": "Bolagsverket", "description": "Swedish companies", "category": "Nordic & Regional", "baseUrl": "https://bolagsverket.se/"},
    {"name": "SCB", "description": "Statistics Sweden", "category": "Nordic & Regional", "baseUrl": "https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/"},
    {"name": "Danish Statistics", "description": "Denmark data", "category": "Nordic & Regional", "baseUrl": "https://www.dst.dk/en/Statistik/statistikbanken/api"},
    {"name": "Statistics Norway", "description": "Norway data", "category": "Nordic & Regional", "baseUrl": "https://www.ssb.no/en/omssb/tjenester-og-verktoy/api"},
    {"name": "Statistics Finland", "description": "Finland data", "category": "Nordic & Regional", "baseUrl": "https://pxnet2.stat.fi/api1.html"},
    {"name": "Vipps", "description": "Norwegian payments", "category": "Nordic & Regional", "baseUrl": "https://developer.vippsmobilepay.com/"},
    {"name": "Swish", "description": "Swedish payments", "category": "Nordic & Regional", "baseUrl": "https://developer.swish.nu/"},
    {"name": "MobilePay", "description": "Danish payments", "category": "Nordic & Regional", "baseUrl": "https://developer.mobilepay.dk/"},
    {"name": "Klarna", "description": "Swedish fintech", "category": "Nordic & Regional", "baseUrl": "https://docs.klarna.com/"},
    {"name": "PostNord", "description": "Nordic shipping", "category": "Nordic & Regional", "baseUrl": "https://developer.postnord.com/"},
    {"name": "Bring", "description": "Norwegian shipping", "category": "Nordic & Regional", "baseUrl": "https://developer.bring.com/"},
    
    # Shipping/Logistics
    {"name": "FedEx", "description": "Shipping", "category": "Logistics & Shipping", "baseUrl": "https://developer.fedex.com/api/en-us/home.html"},
    {"name": "UPS", "description": "Shipping", "category": "Logistics & Shipping", "baseUrl": "https://developer.ups.com/"},
    {"name": "DHL", "description": "Shipping", "category": "Logistics & Shipping", "baseUrl": "https://developer.dhl.com/"},
    {"name": "USPS", "description": "US postal", "category": "Logistics & Shipping", "baseUrl": "https://www.usps.com/business/web-tools-apis/"},
    {"name": "Shippo", "description": "Shipping API", "category": "Logistics & Shipping", "baseUrl": "https://goshippo.com/docs/"},
    {"name": "EasyPost", "description": "Shipping API", "category": "Logistics & Shipping", "baseUrl": "https://www.easypost.com/docs/api"},
    {"name": "ShipStation", "description": "E-commerce shipping", "category": "Logistics & Shipping", "baseUrl": "https://www.shipstation.com/docs/api/"},
    {"name": "Shipwire", "description": "Fulfillment", "category": "Logistics & Shipping", "baseUrl": "https://www.shipwire.com/developers/"},
    
    # CRM
    {"name": "Salesforce", "description": "CRM platform", "category": "Business & Productivity", "baseUrl": "https://developer.salesforce.com/docs/apis"},
    {"name": "HubSpot", "description": "CRM and marketing", "category": "Business & Productivity", "baseUrl": "https://developers.hubspot.com/"},
    {"name": "Pipedrive", "description": "Sales CRM", "category": "Business & Productivity", "baseUrl": "https://developers.pipedrive.com/docs/api/v1"},
    {"name": "Zoho CRM", "description": "CRM software", "category": "Business & Productivity", "baseUrl": "https://www.zoho.com/crm/developer/docs/api/v2/"},
    {"name": "Freshsales", "description": "Sales CRM", "category": "Business & Productivity", "baseUrl": "https://developers.freshworks.com/crm/api/"},
    {"name": "Close", "description": "Sales CRM", "category": "Business & Productivity", "baseUrl": "https://developer.close.com/"},
    
    # Support
    {"name": "Zendesk", "description": "Customer service", "category": "Business & Productivity", "baseUrl": "https://developer.zendesk.com/api-reference/"},
    {"name": "Intercom", "description": "Customer messaging", "category": "Business & Productivity", "baseUrl": "https://developers.intercom.com/"},
    {"name": "Freshdesk", "description": "Help desk", "category": "Business & Productivity", "baseUrl": "https://developers.freshdesk.com/api/"},
    {"name": "Help Scout", "description": "Customer service", "category": "Business & Productivity", "baseUrl": "https://developer.helpscout.com/"},
    {"name": "Crisp", "description": "Customer chat", "category": "Communication", "baseUrl": "https://docs.crisp.chat/api/v1/"},
    
    # Project Management
    {"name": "Jira", "description": "Issue tracking", "category": "Business & Productivity", "baseUrl": "https://developer.atlassian.com/cloud/jira/platform/rest/v3/"},
    {"name": "Asana", "description": "Work management", "category": "Business & Productivity", "baseUrl": "https://developers.asana.com/docs"},
    {"name": "Monday.com", "description": "Work OS", "category": "Business & Productivity", "baseUrl": "https://developer.monday.com/api-reference/docs"},
    {"name": "ClickUp", "description": "Productivity", "category": "Business & Productivity", "baseUrl": "https://clickup.com/api"},
    {"name": "Linear", "description": "Issue tracking", "category": "Business & Productivity", "baseUrl": "https://developers.linear.app/docs"},
    {"name": "Basecamp", "description": "Project management", "category": "Business & Productivity", "baseUrl": "https://github.com/basecamp/bc3-api"},
    {"name": "Trello", "description": "Kanban boards", "category": "Business & Productivity", "baseUrl": "https://developer.atlassian.com/cloud/trello/"},
    
    # Time Tracking
    {"name": "Toggl", "description": "Time tracking", "category": "Business & Productivity", "baseUrl": "https://developers.track.toggl.com/docs/"},
    {"name": "Clockify", "description": "Time tracking", "category": "Business & Productivity", "baseUrl": "https://clockify.me/developers-api"},
    {"name": "Harvest", "description": "Time tracking", "category": "Business & Productivity", "baseUrl": "https://help.getharvest.com/api-v2/"},
    
    # Accounting
    {"name": "QuickBooks", "description": "Accounting", "category": "Finance & Banking", "baseUrl": "https://developer.intuit.com/app/developer/qbo/docs/"},
    {"name": "Xero", "description": "Accounting", "category": "Finance & Banking", "baseUrl": "https://developer.xero.com/"},
    {"name": "FreshBooks", "description": "Invoicing", "category": "Finance & Banking", "baseUrl": "https://www.freshbooks.com/api/"},
    {"name": "Wave", "description": "Accounting", "category": "Finance & Banking", "baseUrl": "https://developer.waveapps.com/"},
    {"name": "Sage", "description": "Business software", "category": "Finance & Banking", "baseUrl": "https://developer.sage.com/"},
    
    # Subscriptions/Billing
    {"name": "Stripe Billing", "description": "Subscriptions", "category": "E-commerce & Payments", "baseUrl": "https://stripe.com/docs/billing"},
    {"name": "Chargebee", "description": "Subscription billing", "category": "E-commerce & Payments", "baseUrl": "https://apidocs.chargebee.com/docs/api"},
    {"name": "Recurly", "description": "Subscription management", "category": "E-commerce & Payments", "baseUrl": "https://developers.recurly.com/api/"},
    {"name": "Paddle", "description": "SaaS billing", "category": "E-commerce & Payments", "baseUrl": "https://developer.paddle.com/api-reference/"},
    {"name": "FastSpring", "description": "E-commerce", "category": "E-commerce & Payments", "baseUrl": "https://developer.fastspring.com/"},
    {"name": "Lemon Squeezy", "description": "SaaS billing", "category": "E-commerce & Payments", "baseUrl": "https://docs.lemonsqueezy.com/api"},
    
    # Feature Flags
    {"name": "LaunchDarkly", "description": "Feature flags", "category": "Developer Tools", "baseUrl": "https://apidocs.launchdarkly.com/"},
    {"name": "Split", "description": "Feature delivery", "category": "Developer Tools", "baseUrl": "https://docs.split.io/reference"},
    {"name": "Flagsmith", "description": "Feature flags", "category": "Developer Tools", "baseUrl": "https://docs.flagsmith.com/"},
    {"name": "ConfigCat", "description": "Feature flags", "category": "Developer Tools", "baseUrl": "https://configcat.com/docs/api/"},
    
    # Testing
    {"name": "BrowserStack", "description": "Browser testing", "category": "Developer Tools", "baseUrl": "https://www.browserstack.com/docs/automate/api-reference/"},
    {"name": "Sauce Labs", "description": "Testing platform", "category": "Developer Tools", "baseUrl": "https://docs.saucelabs.com/dev/api/"},
    {"name": "LambdaTest", "description": "Cross browser testing", "category": "Developer Tools", "baseUrl": "https://www.lambdatest.com/support/api-doc/"},
    {"name": "Cypress Cloud", "description": "Test analytics", "category": "Developer Tools", "baseUrl": "https://docs.cypress.io/guides/cloud/introduction"},
    
    # Screenshots
    {"name": "Urlbox", "description": "Screenshots", "category": "Developer Tools", "baseUrl": "https://urlbox.io/docs"},
    {"name": "Screenshot API", "description": "Web screenshots", "category": "Developer Tools", "baseUrl": "https://screenshotapi.net/documentation"},
    {"name": "ApiFlash", "description": "Screenshot API", "category": "Developer Tools", "baseUrl": "https://apiflash.com/documentation"},
    
    # Forms
    {"name": "Typeform", "description": "Interactive forms", "category": "Business & Productivity", "baseUrl": "https://www.typeform.com/developers/"},
    {"name": "JotForm", "description": "Online forms", "category": "Business & Productivity", "baseUrl": "https://api.jotform.com/docs/"},
    {"name": "SurveyMonkey", "description": "Surveys", "category": "Business & Productivity", "baseUrl": "https://developer.surveymonkey.com/api/v3/"},
    {"name": "Google Forms", "description": "Forms", "category": "Business & Productivity", "baseUrl": "https://developers.google.com/forms/api"},
    
    # Feedback
    {"name": "Canny", "description": "Feature requests", "category": "Business & Productivity", "baseUrl": "https://developers.canny.io/api-reference"},
    {"name": "Productboard", "description": "Product management", "category": "Business & Productivity", "baseUrl": "https://developer.productboard.com/"},
    {"name": "UserVoice", "description": "Customer feedback", "category": "Business & Productivity", "baseUrl": "https://developer.uservoice.com/docs/api/"},
    
    # File Conversion
    {"name": "CloudConvert", "description": "File conversion", "category": "Utilities & Tools", "baseUrl": "https://cloudconvert.com/api/v2"},
    {"name": "Zamzar", "description": "File conversion", "category": "Utilities & Tools", "baseUrl": "https://developers.zamzar.com/"},
    {"name": "ConvertAPI", "description": "Document conversion", "category": "Utilities & Tools", "baseUrl": "https://www.convertapi.com/doc"},
    
    # Status Pages
    {"name": "Statuspage", "description": "Status pages", "category": "Developer Tools", "baseUrl": "https://developer.statuspage.io/"},
    {"name": "Instatus", "description": "Status pages", "category": "Developer Tools", "baseUrl": "https://instatus.com/help/api"},
    {"name": "BetterStack", "description": "Uptime monitoring", "category": "Developer Tools", "baseUrl": "https://betterstack.com/docs/uptime/api/"},
    
    # Marketing
    {"name": "Google Ads", "description": "Advertising", "category": "Marketing & Advertising", "baseUrl": "https://developers.google.com/google-ads/api/docs/start"},
    {"name": "Facebook Ads", "description": "Social advertising", "category": "Marketing & Advertising", "baseUrl": "https://developers.facebook.com/docs/marketing-apis/"},
    {"name": "Twitter Ads", "description": "Social advertising", "category": "Marketing & Advertising", "baseUrl": "https://developer.twitter.com/en/docs/twitter-ads-api"},
    {"name": "LinkedIn Marketing", "description": "B2B advertising", "category": "Marketing & Advertising", "baseUrl": "https://docs.microsoft.com/en-us/linkedin/marketing/"},
    {"name": "Ahrefs", "description": "SEO tools", "category": "Marketing & Advertising", "baseUrl": "https://ahrefs.com/api/"},
    {"name": "SEMrush", "description": "SEO platform", "category": "Marketing & Advertising", "baseUrl": "https://developer.semrush.com/"},
    {"name": "Moz", "description": "SEO software", "category": "Marketing & Advertising", "baseUrl": "https://moz.com/products/api"},
    
    # Data/Open Data
    {"name": "Data.gov", "description": "US open data", "category": "Analytics & Data", "baseUrl": "https://api.data.gov/"},
    {"name": "EU Open Data", "description": "European data", "category": "Analytics & Data", "baseUrl": "https://data.europa.eu/en/about/api"},
    {"name": "World Bank", "description": "Global data", "category": "Analytics & Data", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"},
    {"name": "Kaggle", "description": "Data science", "category": "Analytics & Data", "baseUrl": "https://www.kaggle.com/docs/api"},
    {"name": "Quandl", "description": "Financial data", "category": "Analytics & Data", "baseUrl": "https://docs.data.nasdaq.com/"},
    
    # Misc Utilities
    {"name": "IP-API", "description": "IP geolocation", "category": "Utilities & Tools", "baseUrl": "https://ip-api.com/docs"},
    {"name": "Abstract API", "description": "Various APIs", "category": "Utilities & Tools", "baseUrl": "https://docs.abstractapi.com/"},
    {"name": "IPify", "description": "IP address", "category": "Utilities & Tools", "baseUrl": "https://www.ipify.org/"},
    {"name": "JSONPlaceholder", "description": "Fake REST API", "category": "Developer Tools", "baseUrl": "https://jsonplaceholder.typicode.com/"},
    {"name": "Random User", "description": "Random user data", "category": "Developer Tools", "baseUrl": "https://randomuser.me/documentation"},
    {"name": "Lorem Picsum", "description": "Random images", "category": "Content & Media", "baseUrl": "https://picsum.photos/"},
    {"name": "Placeholder.com", "description": "Placeholder images", "category": "Content & Media", "baseUrl": "https://placeholder.com/"},
]

# Write to file
with open("/Users/gustavhemmingsson/Projects/apiclaw/data/public-apis-parsed.json", "w") as f:
    json.dump(apis, f, indent=2)

print(f"Extracted {len(apis)} APIs")
