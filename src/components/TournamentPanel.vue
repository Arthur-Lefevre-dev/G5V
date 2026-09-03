<template>
  <div class="tournament-panel">
    <TournamentBracket :rounds="rounds" />

    <div
      v-if="canManage"
      class="d-flex flex-wrap align-center ga-3 mt-4"
    >
      <v-btn color="primary" :loading="advancing" @click="advance">
        {{ $t("Tournament.StartOrAdvance") }}
      </v-btn>
      <v-chip size="small" variant="outlined">
        {{ autoStart ? $t("Tournament.AutoOn") : $t("Tournament.AutoOff") }}
      </v-chip>
      <v-switch
        v-model="autoStart"
        color="primary"
        hide-details
        density="compact"
        :label="$t('Tournament.AutoStart')"
      />
      <span v-if="statusMsg" class="text-medium-emphasis text-caption">
        {{ statusMsg }}
      </span>
    </div>
  </div>
</template>

<script>
import TournamentBracket from "@/components/TournamentBracket.vue";
import {
  TOURNAMENT_SEEDS,
  TOURNAMENT_SERVERS,
  BRACKET_SLOT_CVAR,
  buildEmptyBracket,
  hydrateBracket,
  findReadySlots,
  parseCvarMap,
  parseIdList,
  nowSql
} from "@/utils/tournament.js";

export default {
  name: "TournamentPanel",
  components: { TournamentBracket },
  props: {
    seasonId: { type: [Number, String], required: true },
    seasonOwnerId: { type: [Number, String], default: null },
    user: { type: Object, required: true },
    cvars: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      rounds: [],
      teamLookup: {},
      advancing: false,
      autoStart: true,
      statusMsg: "",
      pollTimer: null
    };
  },
  computed: {
    canManage() {
      if (!this.user?.id) return false;
      if (this.user.admin || this.user.super_admin) return true;
      return Number(this.user.id) === Number(this.seasonOwnerId);
    },
    seeds() {
      return parseIdList(this.cvars[TOURNAMENT_SEEDS]);
    },
    serverIds() {
      return parseIdList(this.cvars[TOURNAMENT_SERVERS]);
    }
  },
  watch: {
    cvars: {
      deep: true,
      handler() {
        this.refresh();
      }
    }
  },
  async mounted() {
    await this.refresh();
    this.pollTimer = setInterval(() => this.onPoll(), 15000);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  },
  methods: {
    async refresh() {
      if (!this.seeds.length) {
        this.rounds = [];
        return;
      }
      await this.ensureTeams();
      let rounds = buildEmptyBracket(this.seeds);
      const matches = await this.GetSeasonRecentMatches(this.seasonId);
      const list = Array.isArray(matches) ? matches : [];
      this.rounds = hydrateBracket(rounds, list, this.teamLookup);
    },
    async ensureTeams() {
      const missing = this.seeds.filter(id => !this.teamLookup[id]);
      if (!missing.length) return;
      const all = await this.GetAllTeams().catch(() => []);
      (Array.isArray(all) ? all : []).forEach(t => {
        this.teamLookup[t.id] = t;
      });
    },
    async onPoll() {
      await this.refresh();
      if (this.canManage && this.autoStart) {
        await this.advance(true);
      }
    },
    async advance(silent = false) {
      if (!this.canManage || this.advancing) return;
      if (!this.serverIds.length) {
        if (!silent) this.statusMsg = this.$t("Tournament.ServerRequired");
        return;
      }
      this.advancing = true;
      try {
        const ready = findReadySlots(this.rounds).filter(
          s => s.team1Id && s.team2Id && !s.matchId && !s.autoBye
        );
        let created = 0;
        let cursor = 0;
        for (const slot of ready) {
          const serverId = this.serverIds[cursor % this.serverIds.length];
          cursor += 1;
          const payload = [
            {
              server_id: serverId,
              team1_id: slot.team1Id,
              team2_id: slot.team2Id,
              season_id: Number(this.seasonId),
              start_time: nowSql(),
              max_maps: Number(this.cvars.maps_to_win) || 1,
              side_type: this.cvars.side_type || "standard",
              veto_mappool: this.cvars.map_pool || "",
              match_cvars: { [BRACKET_SLOT_CVAR]: slot.slotKey },
              veto_first: "team1",
              skip_veto: this.cvars.skip_veto == 1 || this.cvars.skip_veto === true,
              wingman: this.cvars.wingman == 1 || this.cvars.wingman === true,
              spectator_auths: [],
              min_players_to_ready:
                Number(this.cvars.min_players_to_ready) ||
                Number(this.cvars.players_per_team) ||
                5,
              players_per_team: Number(this.cvars.players_per_team) || 5,
              min_spectators_to_ready: Number(this.cvars.min_spectators_to_ready) || 0,
              map_sides: this.cvars.map_sides || ""
            }
          ];
          const res = await this.InsertMatch(payload);
          if (res?.id) created += 1;
        }
        if (created > 0) {
          this.statusMsg = this.$t("Tournament.Advanced", { count: created });
          await this.refresh();
        } else if (!silent) {
          this.statusMsg = this.$t("Tournament.NothingToAdvance");
        }
      } finally {
        this.advancing = false;
      }
    }
  }
};
</script>
