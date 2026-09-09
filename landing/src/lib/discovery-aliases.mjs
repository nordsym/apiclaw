/** Case-variant and well-known aliases that must 308 to canonical doors. */
export const DISCOVERY_DOOR_ALIASES = [
  { source: "/AGENTS.md", destination: "/agents.md" },
  { source: "/skill.md", destination: "/SKILL.md" },
  { source: "/.well-known/llms.txt", destination: "/llms.txt" },
];

/** Exact pathname only — never fold case, so canonical doors stay put. */
export function canonicalDiscoveryPath(pathname) {
  const alias = DISCOVERY_DOOR_ALIASES.find((entry) => entry.source === pathname);
  return alias ? alias.destination : null;
}
