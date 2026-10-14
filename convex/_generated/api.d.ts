/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _listWorkspaces from "../_listWorkspaces.js";
import type * as activation from "../activation.js";
import type * as activationWatchdog from "../activationWatchdog.js";
import type * as adminActivate from "../adminActivate.js";
import type * as adminStats from "../adminStats.js";
import type * as adminWhitelist from "../adminWhitelist.js";
import type * as agentDisplay from "../agentDisplay.js";
import type * as agents from "../agents.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as backfillAnalytics from "../backfillAnalytics.js";
import type * as backfillSearchLogs from "../backfillSearchLogs.js";
import type * as billing from "../billing.js";
import type * as capabilities from "../capabilities.js";
import type * as catalogSweep from "../catalogSweep.js";
import type * as chains from "../chains.js";
import type * as cliAuth from "../cliAuth.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as dailyScorecard from "../dailyScorecard.js";
import type * as debugFilestackLogs from "../debugFilestackLogs.js";
import type * as debugGetToken from "../debugGetToken.js";
import type * as deviceAuth from "../deviceAuth.js";
import type * as directCall from "../directCall.js";
import type * as discoveryListings from "../discoveryListings.js";
import type * as earnProgress from "../earnProgress.js";
import type * as email from "../email.js";
import type * as emailGuards from "../emailGuards.js";
import type * as feedback from "../feedback.js";
import type * as founderSignupMail from "../founderSignupMail.js";
import type * as funnel from "../funnel.js";
import type * as guards from "../guards.js";
import type * as hotPathRefresh from "../hotPathRefresh.js";
import type * as http from "../http.js";
import type * as httpTrust from "../httpTrust.js";
import type * as idempotencyBinding from "../idempotencyBinding.js";
import type * as inbound from "../inbound.js";
import type * as listingNotifications from "../listingNotifications.js";
import type * as listingPolicy from "../listingPolicy.js";
import type * as logs from "../logs.js";
import type * as managedCostPolicy from "../managedCostPolicy.js";
import type * as managedCredentials from "../managedCredentials.js";
import type * as managedMetering from "../managedMetering.js";
import type * as managedRouting from "../managedRouting.js";
import type * as managedUsage from "../managedUsage.js";
import type * as managedUsagePolicy from "../managedUsagePolicy.js";
import type * as managedUserExperience from "../managedUserExperience.js";
import type * as mcpOAuth from "../mcpOAuth.js";
import type * as migrateFilestack from "../migrateFilestack.js";
import type * as migratePartnersProd from "../migratePartnersProd.js";
import type * as migratePratham from "../migratePratham.js";
import type * as migrateProviderWorkspaces from "../migrateProviderWorkspaces.js";
import type * as missionPrimitives from "../missionPrimitives.js";
import type * as missionRunner from "../missionRunner.js";
import type * as missions from "../missions.js";
import type * as modelCatalog from "../modelCatalog.js";
import type * as modelPricing from "../modelPricing.js";
import type * as modelRouting from "../modelRouting.js";
import type * as mou from "../mou.js";
import type * as nurture from "../nurture.js";
import type * as nurtureDeliveryKeys from "../nurtureDeliveryKeys.js";
import type * as oauthPassthrough from "../oauthPassthrough.js";
import type * as onboarding from "../onboarding.js";
import type * as openRouterAttribution from "../openRouterAttribution.js";
import type * as openRouterReconciliation from "../openRouterReconciliation.js";
import type * as pipelineAlign from "../pipelineAlign.js";
import type * as postVerifyNudge from "../postVerifyNudge.js";
import type * as providerAudit from "../providerAudit.js";
import type * as providerBoundaries from "../providerBoundaries.js";
import type * as providerCallerAnalytics from "../providerCallerAnalytics.js";
import type * as providerDiscovery from "../providerDiscovery.js";
import type * as providerHealth from "../providerHealth.js";
import type * as providerKeys from "../providerKeys.js";
import type * as providers from "../providers.js";
import type * as purchases from "../purchases.js";
import type * as quota from "../quota.js";
import type * as ratelimit from "../ratelimit.js";
import type * as scorecardEmail from "../scorecardEmail.js";
import type * as searchLogs from "../searchLogs.js";
import type * as seedAPILayerAPIs from "../seedAPILayerAPIs.js";
import type * as seedGenPRD from "../seedGenPRD.js";
import type * as seedIndexedRegistry from "../seedIndexedRegistry.js";
import type * as seedManagedRouting from "../seedManagedRouting.js";
import type * as seedPratham from "../seedPratham.js";
import type * as sessionSecurity from "../sessionSecurity.js";
import type * as spendAlerts from "../spendAlerts.js";
import type * as stripeActions from "../stripeActions.js";
import type * as stripePaymentSnapshot from "../stripePaymentSnapshot.js";
import type * as stripeWebhookEvents from "../stripeWebhookEvents.js";
import type * as teams from "../teams.js";
import type * as telemetry from "../telemetry.js";
import type * as updateAPIStatus from "../updateAPIStatus.js";
import type * as usage from "../usage.js";
import type * as usageReports from "../usageReports.js";
import type * as waitlist from "../waitlist.js";
import type * as webhooks from "../webhooks.js";
import type * as websiteServicePolicy from "../websiteServicePolicy.js";
import type * as workspaceSettings from "../workspaceSettings.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _listWorkspaces: typeof _listWorkspaces;
  activation: typeof activation;
  activationWatchdog: typeof activationWatchdog;
  adminActivate: typeof adminActivate;
  adminStats: typeof adminStats;
  adminWhitelist: typeof adminWhitelist;
  agentDisplay: typeof agentDisplay;
  agents: typeof agents;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  backfillAnalytics: typeof backfillAnalytics;
  backfillSearchLogs: typeof backfillSearchLogs;
  billing: typeof billing;
  capabilities: typeof capabilities;
  catalogSweep: typeof catalogSweep;
  chains: typeof chains;
  cliAuth: typeof cliAuth;
  credits: typeof credits;
  crons: typeof crons;
  dailyScorecard: typeof dailyScorecard;
  debugFilestackLogs: typeof debugFilestackLogs;
  debugGetToken: typeof debugGetToken;
  deviceAuth: typeof deviceAuth;
  directCall: typeof directCall;
  discoveryListings: typeof discoveryListings;
  earnProgress: typeof earnProgress;
  email: typeof email;
  emailGuards: typeof emailGuards;
  feedback: typeof feedback;
  founderSignupMail: typeof founderSignupMail;
  funnel: typeof funnel;
  guards: typeof guards;
  hotPathRefresh: typeof hotPathRefresh;
  http: typeof http;
  httpTrust: typeof httpTrust;
  idempotencyBinding: typeof idempotencyBinding;
  inbound: typeof inbound;
  listingNotifications: typeof listingNotifications;
  listingPolicy: typeof listingPolicy;
  logs: typeof logs;
  managedCostPolicy: typeof managedCostPolicy;
  managedCredentials: typeof managedCredentials;
  managedMetering: typeof managedMetering;
  managedRouting: typeof managedRouting;
  managedUsage: typeof managedUsage;
  managedUsagePolicy: typeof managedUsagePolicy;
  managedUserExperience: typeof managedUserExperience;
  mcpOAuth: typeof mcpOAuth;
  migrateFilestack: typeof migrateFilestack;
  migratePartnersProd: typeof migratePartnersProd;
  migratePratham: typeof migratePratham;
  migrateProviderWorkspaces: typeof migrateProviderWorkspaces;
  missionPrimitives: typeof missionPrimitives;
  missionRunner: typeof missionRunner;
  missions: typeof missions;
  modelCatalog: typeof modelCatalog;
  modelPricing: typeof modelPricing;
  modelRouting: typeof modelRouting;
  mou: typeof mou;
  nurture: typeof nurture;
  nurtureDeliveryKeys: typeof nurtureDeliveryKeys;
  oauthPassthrough: typeof oauthPassthrough;
  onboarding: typeof onboarding;
  openRouterAttribution: typeof openRouterAttribution;
  openRouterReconciliation: typeof openRouterReconciliation;
  pipelineAlign: typeof pipelineAlign;
  postVerifyNudge: typeof postVerifyNudge;
  providerAudit: typeof providerAudit;
  providerBoundaries: typeof providerBoundaries;
  providerCallerAnalytics: typeof providerCallerAnalytics;
  providerDiscovery: typeof providerDiscovery;
  providerHealth: typeof providerHealth;
  providerKeys: typeof providerKeys;
  providers: typeof providers;
  purchases: typeof purchases;
  quota: typeof quota;
  ratelimit: typeof ratelimit;
  scorecardEmail: typeof scorecardEmail;
  searchLogs: typeof searchLogs;
  seedAPILayerAPIs: typeof seedAPILayerAPIs;
  seedGenPRD: typeof seedGenPRD;
  seedIndexedRegistry: typeof seedIndexedRegistry;
  seedManagedRouting: typeof seedManagedRouting;
  seedPratham: typeof seedPratham;
  sessionSecurity: typeof sessionSecurity;
  spendAlerts: typeof spendAlerts;
  stripeActions: typeof stripeActions;
  stripePaymentSnapshot: typeof stripePaymentSnapshot;
  stripeWebhookEvents: typeof stripeWebhookEvents;
  teams: typeof teams;
  telemetry: typeof telemetry;
  updateAPIStatus: typeof updateAPIStatus;
  usage: typeof usage;
  usageReports: typeof usageReports;
  waitlist: typeof waitlist;
  webhooks: typeof webhooks;
  websiteServicePolicy: typeof websiteServicePolicy;
  workspaceSettings: typeof workspaceSettings;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
