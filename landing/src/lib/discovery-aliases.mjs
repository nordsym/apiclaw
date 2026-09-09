/** Case-variant and well-known aliases that must 308 to canonical doors. */
export const DISCOVERY_DOOR_ALIASES = [
  { source: "/AGENTS.md", destination: "/agents.md" },
  { source: "/skill.md", destination: "/SKILL.md" },
  { source: "/.well-known/llms.txt", destination: "/llms.txt" },
];

/**
 * next.config redirects match case-insensitively. Putting /AGENTS.md → /agents.md
 * there also matches the canonical /agents.md and 308-loops. Only emit config
 * redirects when source and destination differ ignoring case.
 */
export const NEXT_CONFIG_DISCOVERY_REDIRECTS = DISCOVERY_DOOR_ALIASES.filter(
  ({ source, destination }) => source.toLowerCase() !== destination.toLowerCase(),
);

/** Exact pathname only — never fold case, so canonical doors stay put. */
export function canonicalDiscoveryPath(pathname) {
  const alias = DISCOVERY_DOOR_ALIASES.find((entry) => entry.source === pathname);
  return alias ? alias.destination : null;
}
