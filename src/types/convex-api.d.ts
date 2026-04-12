/**
 * Type shim for Convex generated API.
 *
 * Replaces the direct import from `../convex/_generated/api.js` which
 * caused TypeScript to transitively process all convex/*.ts source files
 * under the main tsconfig (NodeNext strict), producing hundreds of
 * irrelevant errors. The convex/ directory has its own tsconfig
 * (Bundler moduleResolution) and is compiled separately via `npx convex deploy`.
 *
 * If you add new api.X.Y usages in the codebase, add the shape here.
 */

declare const api: {
  analytics: {
    log: any;
  };
  [key: string]: any; // forward-compatible: won't break on new api.* usage
};

export { api };
