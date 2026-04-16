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
import type * as adminActivate from "../adminActivate.js";
import type * as adminStats from "../adminStats.js";
import type * as agents from "../agents.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as backfillAnalytics from "../backfillAnalytics.js";
import type * as backfillSearchLogs from "../backfillSearchLogs.js";
import type * as billing from "../billing.js";
import type * as capabilities from "../capabilities.js";
import type * as chains from "../chains.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as debugFilestackLogs from "../debugFilestackLogs.js";
import type * as debugGetToken from "../debugGetToken.js";
import type * as directCall from "../directCall.js";
import type * as earnProgress from "../earnProgress.js";
import type * as email from "../email.js";
import type * as feedback from "../feedback.js";
import type * as funnel from "../funnel.js";
import type * as guards from "../guards.js";
import type * as http from "../http.js";
import type * as inbound from "../inbound.js";
import type * as logs from "../logs.js";
import type * as migrateFilestack from "../migrateFilestack.js";
import type * as migratePartnersProd from "../migratePartnersProd.js";
import type * as migratePratham from "../migratePratham.js";
import type * as migrateProviderWorkspaces from "../migrateProviderWorkspaces.js";
import type * as mou from "../mou.js";
import type * as nurture from "../nurture.js";
import type * as providerKeys from "../providerKeys.js";
import type * as providers from "../providers.js";
import type * as purchases from "../purchases.js";
import type * as ratelimit from "../ratelimit.js";
import type * as searchLogs from "../searchLogs.js";
import type * as seedAPILayerAPIs from "../seedAPILayerAPIs.js";
import type * as seedDirectCallConfigs from "../seedDirectCallConfigs.js";
import type * as seedPratham from "../seedPratham.js";
import type * as spendAlerts from "../spendAlerts.js";
import type * as stripeActions from "../stripeActions.js";
import type * as teams from "../teams.js";
import type * as telemetry from "../telemetry.js";
import type * as updateAPIStatus from "../updateAPIStatus.js";
import type * as usage from "../usage.js";
import type * as usageReports from "../usageReports.js";
import type * as waitlist from "../waitlist.js";
import type * as webhooks from "../webhooks.js";
import type * as workspaceSettings from "../workspaceSettings.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _listWorkspaces: typeof _listWorkspaces;
  adminActivate: typeof adminActivate;
  adminStats: typeof adminStats;
  agents: typeof agents;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  backfillAnalytics: typeof backfillAnalytics;
  backfillSearchLogs: typeof backfillSearchLogs;
  billing: typeof billing;
  capabilities: typeof capabilities;
  chains: typeof chains;
  credits: typeof credits;
  crons: typeof crons;
  debugFilestackLogs: typeof debugFilestackLogs;
  debugGetToken: typeof debugGetToken;
  directCall: typeof directCall;
  earnProgress: typeof earnProgress;
  email: typeof email;
  feedback: typeof feedback;
  funnel: typeof funnel;
  guards: typeof guards;
  http: typeof http;
  inbound: typeof inbound;
  logs: typeof logs;
  migrateFilestack: typeof migrateFilestack;
  migratePartnersProd: typeof migratePartnersProd;
  migratePratham: typeof migratePratham;
  migrateProviderWorkspaces: typeof migrateProviderWorkspaces;
  mou: typeof mou;
  nurture: typeof nurture;
  providerKeys: typeof providerKeys;
  providers: typeof providers;
  purchases: typeof purchases;
  ratelimit: typeof ratelimit;
  searchLogs: typeof searchLogs;
  seedAPILayerAPIs: typeof seedAPILayerAPIs;
  seedDirectCallConfigs: typeof seedDirectCallConfigs;
  seedPratham: typeof seedPratham;
  spendAlerts: typeof spendAlerts;
  stripeActions: typeof stripeActions;
  teams: typeof teams;
  telemetry: typeof telemetry;
  updateAPIStatus: typeof updateAPIStatus;
  usage: typeof usage;
  usageReports: typeof usageReports;
  waitlist: typeof waitlist;
  webhooks: typeof webhooks;
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
