/**
 * Runtime shim for Convex API references.
 * Provides the `api` object with the correct path structure
 * for use with ConvexHttpClient without importing generated code.
 */

export const api: any = new Proxy(
  {},
  {
    get(_, module: string) {
      return new Proxy(
        {},
        {
          get(_, fn: string) {
            return `${module}:${fn}`;
          },
        },
      );
    },
  },
);
