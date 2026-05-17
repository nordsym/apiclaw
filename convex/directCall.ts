/**
 * Backward-compat re-export shim. The implementation moved to
 * convex/managedRouting.ts on 2026-05-17 as part of the canon rename
 * away from the retired "Direct Call tier" label.
 *
 * Existing npm installs (~13.5k) still call Convex function paths under
 * the directCall:* namespace via dist/execute-dynamic.js. This file
 * keeps those paths resolvable so older clients don't break before
 * they upgrade. Remove once npm install metrics show negligible old-
 * version traffic.
 */
export {
  saveDirectCallConfig,
  saveConfig,
  saveAction,
  deleteAction,
  publishDirectCall,
  setStatus,
  getDirectCallConfig,
  getDirectCallConfigById,
  getDirectCallConfigByApiId,
  getActions,
  getActionByName,
  getActionById,
  getAllConfigs,
  getLiveConfigs,
  getConfig,
  getByApiSlug,
  testAction,
} from "./managedRouting";
