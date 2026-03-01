/**
 * MCP Client Adapters - Main Export
 * 
 * Provides adapters for all supported MCP clients:
 * - Claude Desktop
 * - Cursor
 * - Windsurf
 * - Cline (VS Code extension)
 * - Continue (VS Code extension)
 * - Custom (user-specified paths)
 */

// Base types and classes
export {
  MCPClientAdapter,
  BaseAdapter,
  ConfigResult,
  VerifyResult,
  InstallInfo,
  ConfigureOptions,
} from './base.js';

// Individual adapters
export { ClaudeDesktopAdapter } from './claude-desktop.js';
export { CursorAdapter } from './cursor.js';
export { WindsurfAdapter } from './windsurf.js';
export { ClineAdapter } from './cline.js';
export { ContinueAdapter } from './continue.js';
export { CustomAdapter, createCustomAdapter, CustomAdapterOptions } from './custom.js';

// Detection utilities
export {
  getAllAdapters,
  getAdapter,
  detectInstalledClients,
  detectConfiguredClients,
  hasAnyClient,
  isClientInstalled,
  formatDetectionResult,
  getInstalledClientNames,
  configureAllDetected,
  DetectedClient,
  DetectionResult,
} from './detect.js';

// Re-export types from paths for convenience
export { MCPClient } from '../utils/paths.js';
