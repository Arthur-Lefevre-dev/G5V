/** Official Redwood CS2 map pool (display name + workshop/in-game id). */
export const REDWOOD_MAP_POOL = [
  { map_display_name: "Inferno", map_name: "de_inferno", enabled: true },
  { map_display_name: "Ancient", map_name: "de_ancient", enabled: true },
  { map_display_name: "Mirage", map_name: "de_mirage", enabled: true },
  { map_display_name: "Nuke", map_name: "de_nuke", enabled: true },
  { map_display_name: "Anubis", map_name: "de_anubis", enabled: true },
  { map_display_name: "Dust II", map_name: "de_dust2", enabled: true },
  { map_display_name: "Vertigo", map_name: "de_vertigo", enabled: true },
  { map_display_name: "Overpass", map_name: "de_overpass", enabled: true },
  { map_display_name: "Cache", map_name: "de_cache", enabled: true },
  { map_display_name: "Train", map_name: "de_train", enabled: true }
];

export function redwoodMapNames() {
  return REDWOOD_MAP_POOL.map(m => m.map_name);
}

/** Prefer API maps; fall back to the Redwood pool when empty. */
export function resolveMapList(apiMaps) {
  if (Array.isArray(apiMaps) && apiMaps.length > 0) return apiMaps;
  return REDWOOD_MAP_POOL.map((m, idx) => ({ ...m, id: `rw-${idx}` }));
}
