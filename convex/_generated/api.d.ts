/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminActivate from "../adminActivate.js";
import type * as adminStats from "../adminStats.js";
import type * as agents from "../agents.js";
import type * as analytics from "../analytics.js";
import type * as billing from "../billing.js";
import type * as capabilities from "../capabilities.js";
import type * as chains from "../chains.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as directCall from "../directCall.js";
import type * as earnProgress from "../earnProgress.js";
import type * as email from "../email.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as logs from "../logs.js";
import type * as mou from "../mou.js";
import type * as providerKeys from "../providerKeys.js";
import type * as providers from "../providers.js";
import type * as purchases from "../purchases.js";
import type * as ratelimit from "../ratelimit.js";
import type * as searchLogs from "../searchLogs.js";
import type * as seedPratham from "../seedPratham.js";
import type * as spendAlerts from "../spendAlerts.js";
import type * as stripeActions from "../stripeActions.js";
import type * as teams from "../teams.js";
import type * as telemetry from "../telemetry.js";
import type * as usage from "../usage.js";
import type * as waitlist from "../waitlist.js";
import type * as webhooks from "../webhooks.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminActivate: typeof adminActivate;
  adminStats: typeof adminStats;
  agents: typeof agents;
  analytics: typeof analytics;
  billing: typeof billing;
  capabilities: typeof capabilities;
  chains: typeof chains;
  credits: typeof credits;
  crons: typeof crons;
  directCall: typeof directCall;
  earnProgress: typeof earnProgress;
  email: typeof email;
  feedback: typeof feedback;
  http: typeof http;
  logs: typeof logs;
  mou: typeof mou;
  providerKeys: typeof providerKeys;
  providers: typeof providers;
  purchases: typeof purchases;
  ratelimit: typeof ratelimit;
  searchLogs: typeof searchLogs;
  seedPratham: typeof seedPratham;
  spendAlerts: typeof spendAlerts;
  stripeActions: typeof stripeActions;
  teams: typeof teams;
  telemetry: typeof telemetry;
  usage: typeof usage;
  waitlist: typeof waitlist;
  webhooks: typeof webhooks;
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
