/**
 * Single-elimination tournament helpers for G5V.
 * Bracket metadata is stored in season CVARs (g5v_* keys).
 */

export const TOURNAMENT_FLAG = "g5v_tournament";
export const TOURNAMENT_SEEDS = "g5v_seeds";
export const TOURNAMENT_SERVERS = "g5v_servers";
export const BRACKET_SLOT_CVAR = "g5v_bracket_slot";

export function nextPowerOfTwo(n) {
  const size = Math.max(2, n | 0);
  return 2 ** Math.ceil(Math.log2(size));
}

export function padSeeds(teamIds) {
  const ids = (teamIds || []).filter(id => id != null && id !== "" && Number(id) !== 0);
  const size = nextPowerOfTwo(ids.length);
  const seeds = ids.map(id => Number(id));
  while (seeds.length < size) seeds.push(null);
  return seeds;
}

/**
 * Build empty single-elim rounds from seeded team IDs (null = bye).
 * Round 0 is the first round; last round is the final.
 */
export function buildEmptyBracket(teamIds) {
  const seeds = padSeeds(teamIds);
  const rounds = [];
  let slots = seeds.map(teamId => ({ teamId }));

  while (slots.length > 1) {
    const matches = [];
    for (let i = 0; i < slots.length; i += 2) {
      const team1Id = slots[i]?.teamId ?? null;
      const team2Id = slots[i + 1]?.teamId ?? null;
      const isBye = (team1Id && !team2Id) || (!team1Id && team2Id);
      const winnerId = isBye ? team1Id || team2Id : null;
      matches.push({
        round: rounds.length,
        index: i / 2,
        slotKey: `${rounds.length}-${i / 2}`,
        team1Id,
        team2Id,
        matchId: null,
        winnerId,
        status: winnerId ? "bye" : "pending",
        team1Score: null,
        team2Score: null
      });
    }
    rounds.push(matches);
    slots = matches.map(m => ({ teamId: m.winnerId }));
  }
  return rounds;
}

export function parseCvarMap(cvars) {
  if (!cvars) return {};
  if (Array.isArray(cvars)) {
    const map = {};
    cvars.forEach(entry => {
      if (typeof entry === "string") {
        const parts = entry.trim().split(/\s+/);
        const key = parts.shift();
        if (key) map[key] = parts.join(" ");
      } else if (entry && typeof entry === "object") {
        Object.assign(map, entry);
      }
    });
    return map;
  }
  if (typeof cvars === "object") return { ...cvars };
  return {};
}

export function isTournamentSeason(cvars) {
  const map = parseCvarMap(cvars);
  return map[TOURNAMENT_FLAG] === "1" || map[TOURNAMENT_FLAG] === 1 || map[TOURNAMENT_FLAG] === true;
}

export function parseIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(n => !Number.isNaN(n));
  return String(value)
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => !Number.isNaN(n) && n !== 0);
}

export function getMatchWinnerId(match) {
  if (!match) return null;
  if (match.cancelled == 1) return null;
  if (match.winner != null && match.winner !== 0) return Number(match.winner);
  if (match.end_time == null) return null;
  const t1 = Number(match.team1_score ?? match.team1_mapscore ?? 0);
  const t2 = Number(match.team2_score ?? match.team2_mapscore ?? 0);
  if (t1 > t2) return Number(match.team1_id);
  if (t2 > t1) return Number(match.team2_id);
  return null;
}

export function getBracketSlotFromMatch(match) {
  const cvars = match?.match_cvars || match?.cvars || {};
  const map = parseCvarMap(cvars);
  return map[BRACKET_SLOT_CVAR] || null;
}

/**
 * Merge API matches into a bracket structure built from seeds.
 * Prefer g5v_bracket_slot cvar; fall back to team1/team2 pairing.
 */
export function hydrateBracket(rounds, matches, teamLookup = {}) {
  const list = matches || [];
  const bySlot = {};
  const usedIds = new Set();

  list.forEach(m => {
    const slot = getBracketSlotFromMatch(m);
    if (slot) {
      bySlot[slot] = m;
      usedIds.add(m.id);
    }
  });

  const findByTeams = (team1Id, team2Id) => {
    if (!team1Id || !team2Id) return null;
    return (
      list.find(m => {
        if (usedIds.has(m.id)) return false;
        const a = Number(m.team1_id);
        const b = Number(m.team2_id);
        return (
          (a === Number(team1Id) && b === Number(team2Id)) ||
          (a === Number(team2Id) && b === Number(team1Id))
        );
      }) || null
    );
  };

  const hydrated = rounds.map(round =>
    round.map(slot => {
      let apiMatch = bySlot[slot.slotKey];
      if (!apiMatch) {
        apiMatch = findByTeams(slot.team1Id, slot.team2Id);
        if (apiMatch) usedIds.add(apiMatch.id);
      }
      let next = { ...slot };
      if (apiMatch) {
        const winnerId = getMatchWinnerId(apiMatch);
        next.matchId = apiMatch.id;
        next.team1Id = apiMatch.team1_id ?? next.team1Id;
        next.team2Id = apiMatch.team2_id ?? next.team2Id;
        next.team1Score = apiMatch.team1_score ?? apiMatch.team1_mapscore ?? null;
        next.team2Score = apiMatch.team2_score ?? apiMatch.team2_mapscore ?? null;
        next.winnerId = winnerId || next.winnerId;
        if (apiMatch.cancelled == 1) next.status = "cancelled";
        else if (winnerId) next.status = "complete";
        else if (apiMatch.start_time && !apiMatch.end_time) next.status = "live";
        else next.status = "scheduled";
      }
      if (next.team1Id && teamLookup[next.team1Id]) {
        next.team1Name = teamLookup[next.team1Id].name || teamLookup[next.team1Id].tag;
      }
      if (next.team2Id && teamLookup[next.team2Id]) {
        next.team2Name = teamLookup[next.team2Id].name || teamLookup[next.team2Id].tag;
      }
      return next;
    })
  );

  // Propagate winners into later rounds when feeders are done
  for (let r = 0; r < hydrated.length - 1; r++) {
    hydrated[r].forEach((match, idx) => {
      if (!match.winnerId) return;
      const parent = hydrated[r + 1][Math.floor(idx / 2)];
      if (!parent) return;
      if (idx % 2 === 0) {
        if (!parent.matchId) parent.team1Id = match.winnerId;
        if (teamLookup[match.winnerId]) {
          parent.team1Name =
            teamLookup[match.winnerId].name || teamLookup[match.winnerId].tag;
        }
      } else {
        if (!parent.matchId) parent.team2Id = match.winnerId;
        if (teamLookup[match.winnerId]) {
          parent.team2Name =
            teamLookup[match.winnerId].name || teamLookup[match.winnerId].tag;
        }
      }
    });
  }

  // Second pass: attach later-round matches after winners propagated
  for (let r = 1; r < hydrated.length; r++) {
    hydrated[r] = hydrated[r].map(slot => {
      if (slot.matchId) return slot;
      const apiMatch = findByTeams(slot.team1Id, slot.team2Id);
      if (!apiMatch) return slot;
      usedIds.add(apiMatch.id);
      const winnerId = getMatchWinnerId(apiMatch);
      return {
        ...slot,
        matchId: apiMatch.id,
        team1Id: apiMatch.team1_id ?? slot.team1Id,
        team2Id: apiMatch.team2_id ?? slot.team2Id,
        team1Score: apiMatch.team1_score ?? apiMatch.team1_mapscore ?? null,
        team2Score: apiMatch.team2_score ?? apiMatch.team2_mapscore ?? null,
        winnerId: winnerId || slot.winnerId,
        status: apiMatch.cancelled == 1
          ? "cancelled"
          : winnerId
            ? "complete"
            : apiMatch.start_time && !apiMatch.end_time
              ? "live"
              : "scheduled",
        team1Name:
          (apiMatch.team1_id && teamLookup[apiMatch.team1_id]?.name) ||
          slot.team1Name,
        team2Name:
          (apiMatch.team2_id && teamLookup[apiMatch.team2_id]?.name) ||
          slot.team2Name
      };
    });
  }

  return hydrated;
}

/**
 * Find matches that can be created (both teams known, no match yet, not a bye).
 */
export function findReadySlots(rounds) {
  const ready = [];
  rounds.forEach(round => {
    round.forEach(slot => {
      if (slot.matchId) return;
      if (slot.status === "bye" && slot.winnerId) return;
      if (slot.team1Id && slot.team2Id) ready.push(slot);
      else if ((slot.team1Id && !slot.team2Id) || (!slot.team1Id && slot.team2Id)) {
        // unresolved bye that should auto-win
        ready.push({ ...slot, autoBye: true });
      }
    });
  });
  return ready;
}

export function roundLabel(roundIndex, totalRounds, t) {
  const fromFinal = totalRounds - roundIndex - 1;
  if (fromFinal === 0) return t ? t("Tournament.Final") : "Final";
  if (fromFinal === 1) return t ? t("Tournament.Semifinal") : "Semifinals";
  if (fromFinal === 2) return t ? t("Tournament.Quarterfinal") : "Quarterfinals";
  return t ? t("Tournament.Round", { n: roundIndex + 1 }) : `Round ${roundIndex + 1}`;
}

export function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
