/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as capabilities from "../capabilities.js";
import type * as credits from "../credits.js";
import type * as directCall from "../directCall.js";
import type * as http from "../http.js";
import type * as providers from "../providers.js";
import type * as purchases from "../purchases.js";
import type * as ratelimit from "../ratelimit.js";
import type * as telemetry from "../telemetry.js";
import type * as usage from "../usage.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  capabilities: typeof capabilities;
  credits: typeof credits;
  directCall: typeof directCall;
  http: typeof http;
  providers: typeof providers;
  purchases: typeof purchases;
  ratelimit: typeof ratelimit;
  telemetry: typeof telemetry;
  usage: typeof usage;
  waitlist: typeof waitlist;
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
