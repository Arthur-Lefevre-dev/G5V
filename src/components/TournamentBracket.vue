<template>
  <div class="tournament-bracket">
    <div class="bracket-header d-flex align-center flex-wrap ga-3 mb-4">
      <h2 class="text-h4 bracket-title mb-0">{{ $t("Tournament.Bracket") }}</h2>
      <v-chip v-if="championName" color="primary" variant="flat" class="champion-chip">
        {{ $t("Tournament.Champion") }}: {{ championName }}
      </v-chip>
      <v-spacer />
      <v-chip size="small" variant="outlined" color="primary">
        {{ $t("Tournament.SingleElim") }}
      </v-chip>
    </div>

    <div v-if="!rounds.length" class="text-medium-emphasis pa-6 text-center">
      {{ $t("Tournament.NoBracket") }}
    </div>

    <div v-else class="bracket-scroll">
      <div class="bracket-grid" :style="gridStyle">
        <div
          v-for="(round, rIdx) in rounds"
          :key="'r-' + rIdx"
          class="bracket-round"
        >
          <div class="round-label">{{ labelFor(rIdx) }}</div>
          <div
            class="round-matches"
            :style="{ gap: matchGap(rIdx) }"
          >
            <component
              :is="slot.matchId ? 'router-link' : 'div'"
              v-for="slot in round"
              :key="slot.slotKey"
              class="match-node g5-card"
              :class="statusClass(slot)"
              :to="slot.matchId ? '/match/' + slot.matchId : undefined"
            >
              <div class="team-row" :class="{ winner: slot.winnerId === slot.team1Id }">
                <span class="team-name">{{ displayTeam(slot.team1Id, slot.team1Name) }}</span>
                <span class="team-score">{{ scoreOrDash(slot.team1Score, slot) }}</span>
              </div>
              <div class="team-row" :class="{ winner: slot.winnerId === slot.team2Id }">
                <span class="team-name">{{ displayTeam(slot.team2Id, slot.team2Name) }}</span>
                <span class="team-score">{{ scoreOrDash(slot.team2Score, slot) }}</span>
              </div>
              <div class="slot-meta">
                <span v-if="slot.status === 'live'" class="live-dot">{{ $t("Tournament.Live") }}</span>
                <span v-else-if="slot.status === 'bye'">{{ $t("Tournament.Bye") }}</span>
                <span v-else-if="slot.matchId">#{{ slot.matchId }}</span>
                <span v-else>{{ $t("Tournament.Pending") }}</span>
              </div>
            </component>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { roundLabel } from "@/utils/tournament.js";

export default {
  name: "TournamentBracket",
  props: {
    rounds: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    gridStyle() {
      return {
        gridTemplateColumns: `repeat(${Math.max(this.rounds.length, 1)}, minmax(200px, 240px))`
      };
    },
    championName() {
      const last = this.rounds[this.rounds.length - 1];
      if (!last || !last[0]?.winnerId) return null;
      const slot = last[0];
      if (slot.winnerId === slot.team1Id) return slot.team1Name || `#${slot.team1Id}`;
      if (slot.winnerId === slot.team2Id) return slot.team2Name || `#${slot.team2Id}`;
      return `#${slot.winnerId}`;
    }
  },
  methods: {
    labelFor(rIdx) {
      return roundLabel(rIdx, this.rounds.length, this.$t.bind(this));
    },
    matchGap(rIdx) {
      const base = 16;
      return `${base * 2 ** rIdx}px`;
    },
    displayTeam(id, name) {
      if (!id) return this.$t("Tournament.TBD");
      return name || `#${id}`;
    },
    scoreOrDash(score, slot) {
      if (slot.status === "bye" || slot.status === "pending") return "—";
      if (score == null) return "—";
      return score;
    },
    statusClass(slot) {
      return {
        "is-live": slot.status === "live",
        "is-complete": slot.status === "complete",
        "is-bye": slot.status === "bye",
        "is-clickable": !!slot.matchId
      };
    }
  }
};
</script>

<style scoped>
.tournament-bracket {
  width: 100%;
}

.bracket-title {
  font-family: "Rajdhani", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g5-accent, #de9b35);
}

.bracket-scroll {
  overflow-x: auto;
  padding-bottom: 1rem;
}

.bracket-grid {
  display: grid;
  gap: 2rem;
  align-items: stretch;
  min-width: min-content;
  padding: 0.5rem;
}

.bracket-round {
  display: flex;
  flex-direction: column;
}

.round-label {
  font-family: "Rajdhani", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--g5-muted, #8b9bb0);
  margin-bottom: 1rem;
  font-weight: 600;
}

.round-matches {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
}

.match-node {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--g5-border, rgba(255, 255, 255, 0.08));
  background: var(--g5-surface, #1a222d);
  border-radius: 4px;
  transition: border-color 0.2s ease, transform 0.2s ease;
  cursor: default;
}

.match-node.is-clickable {
  cursor: pointer;
}

.match-node.is-clickable:hover {
  border-color: var(--g5-accent, #de9b35);
  transform: translateY(-2px);
}

.match-node.is-live {
  border-color: #e25555;
  box-shadow: 0 0 0 1px rgba(226, 85, 85, 0.35);
}

.match-node.is-complete {
  border-color: rgba(222, 155, 53, 0.45);
}

.team-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.95rem;
  padding: 0.2rem 0;
  opacity: 0.85;
}

.team-row.winner {
  opacity: 1;
  color: var(--g5-accent, #de9b35);
  font-weight: 600;
}

.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-score {
  font-family: "Rajdhani", sans-serif;
  font-weight: 700;
  min-width: 1.5rem;
  text-align: right;
}

.slot-meta {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--g5-muted, #8b9bb0);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.live-dot {
  color: #e25555;
  font-weight: 700;
}

.champion-chip {
  font-family: "Rajdhani", sans-serif;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
