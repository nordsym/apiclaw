export const DISCOVERY_DOOR_ALIASES: readonly {
  readonly source: string;
  readonly destination: string;
}[];

export const NEXT_CONFIG_DISCOVERY_REDIRECTS: readonly {
  readonly source: string;
  readonly destination: string;
}[];

export function canonicalDiscoveryPath(pathname: string): string | null;
