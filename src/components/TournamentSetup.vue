<template>
  <v-card class="g5-card pa-4">
    <v-card-title class="text-h5 bracket-title px-0">
      {{ existingSeasonId ? $t("Tournament.Manage") : $t("Tournament.Create") }}
    </v-card-title>
    <v-card-subtitle class="px-0 mb-4">
      {{ $t("Tournament.CreateHint") }}
    </v-card-subtitle>

    <v-form ref="form" v-model="valid">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.name"
            :label="$t('Tournament.Name')"
            :rules="[v => !!v || $t('misc.Required')]"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="form.startDate"
            type="date"
            :label="$t('Seasons.StartTitle')"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="form.endDate"
            type="date"
            :label="$t('Seasons.EndTitle')"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="form.teamIds"
            :items="teamItems"
            item-title="title"
            item-value="value"
            :label="$t('Tournament.Teams')"
            :hint="$t('Tournament.TeamsHint')"
            persistent-hint
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            :rules="[teamsRule]"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.serverIds"
            :items="serverItems"
            item-title="title"
            item-value="value"
            :label="$t('Tournament.Servers')"
            :hint="$t('Tournament.ServersHint')"
            persistent-hint
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            :rules="[v => (v && v.length > 0) || $t('Tournament.ServerRequired')]"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="form.mapsToWin"
            :items="[1, 2, 3]"
            :label="$t('CreateMatch.BestOf') + form.mapsToWin"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="form.playersPerTeam"
            type="number"
            :label="$t('CreateMatch.PlayersPerTeam')"
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="form.mapPool"
            :items="mapList"
            item-title="map_name"
            item-value="map_name"
            :label="$t('CreateMatch.FormMapPool')"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            :rules="[v => (v && v.length > 0) || $t('CreateMatch.MapChoiceError')]"
          />
        </v-col>
      </v-row>
    </v-form>

    <div class="d-flex flex-wrap ga-3 mt-2">
      <v-btn
        v-if="!existingSeasonId"
        color="primary"
        :loading="busy"
        :disabled="!valid"
        @click="createTournament"
      >
        {{ $t("Tournament.CreateAndStart") }}
      </v-btn>
      <v-btn
        v-else
        color="primary"
        :loading="busy"
        @click="syncAndAdvance"
      >
        {{ $t("Tournament.StartOrAdvance") }}
      </v-btn>
      <v-btn variant="text" :to="'/seasons'">{{ $t("misc.Cancel") }}</v-btn>
    </div>

    <v-alert v-if="message" class="mt-4" type="info" variant="tonal">
      {{ message }}
    </v-alert>
  </v-card>
</template>

<script>
import {
  TOURNAMENT_FLAG,
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
import { redwoodMapNames, resolveMapList } from "@/utils/maps.js";

export default {
  name: "TournamentSetup",
  props: {
    existingSeasonId: {
      type: [Number, String],
      default: null
    },
    user: {
      type: Object,
      required: true
    }
  },
  emits: ["created", "advanced"],
  data() {
    return {
      valid: false,
      busy: false,
      message: "",
      teams: [],
      servers: [],
      mapList: [],
      form: {
        name: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        teamIds: [],
        serverIds: [],
        mapsToWin: 1,
        playersPerTeam: 5,
        mapPool: []
      }
    };
  },
  computed: {
    teamItems() {
      return this.teams.map(t => ({
        title: `${t.name} [${t.tag || "-"}]`,
        value: t.id
      }));
    },
    serverItems() {
      return this.servers.map(s => ({
        title: `${s.display_name || s.ip_string} (${s.ip_string}:${s.port})`,
        value: s.id
      }));
    }
  },
  async mounted() {
    await this.loadOptions();
    if (this.existingSeasonId) await this.prefillFromSeason();
  },
  methods: {
    teamsRule(v) {
      if (!v || v.length < 2) return this.$t("Tournament.MinTeams");
      return true;
    },
    async loadOptions() {
      const [teams, servers, maps] = await Promise.all([
        this.GetMyTeams().catch(() => []),
        this.GetMyServers().catch(() => []),
        this.GetUserEnabledMapList(this.user.id).catch(() => [])
      ]);
      let allTeams = Array.isArray(teams) ? teams : [];
      if (!allTeams.length) {
        const publicTeams = await this.GetAllTeams().catch(() => []);
        allTeams = Array.isArray(publicTeams) ? publicTeams : [];
      }
      this.teams = allTeams;
      this.servers = Array.isArray(servers) ? servers : [];
      this.mapList = resolveMapList(maps);
      if (!this.form.mapPool.length) {
        this.form.mapPool = redwoodMapNames();
      }
    },
    async prefillFromSeason() {
      const season = await this.GetSeasonInfo(this.existingSeasonId);
      const cvars = parseCvarMap(await this.GetSeasonCVARs(this.existingSeasonId));
      this.form.name = season?.name || "";
      this.form.teamIds = parseIdList(cvars[TOURNAMENT_SEEDS]);
      this.form.serverIds = parseIdList(cvars[TOURNAMENT_SERVERS]);
      if (cvars.maps_to_win) this.form.mapsToWin = Number(cvars.maps_to_win) || 1;
      if (cvars.players_per_team) this.form.playersPerTeam = Number(cvars.players_per_team) || 5;
      if (cvars.map_pool) {
        this.form.mapPool = String(cvars.map_pool).split(/\s+/).filter(Boolean);
      }
    },
    buildSeasonCvars() {
      return {
        [TOURNAMENT_FLAG]: "1",
        [TOURNAMENT_SEEDS]: this.form.teamIds.join(","),
        [TOURNAMENT_SERVERS]: this.form.serverIds.join(","),
        maps_to_win: String(this.form.mapsToWin),
        players_per_team: String(this.form.playersPerTeam),
        min_players_to_ready: String(this.form.playersPerTeam),
        min_spectators_to_ready: "0",
        skip_veto: "0",
        side_type: "standard",
        wingman: "0",
        map_pool: this.form.mapPool.join(" "),
        spectators: "",
        map_sides: ""
      };
    },
    async createTournament() {
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;
      this.busy = true;
      this.message = "";
      try {
        const payload = [
          {
            name: this.form.name,
            start_date: this.form.startDate,
            end_date: this.form.endDate || null,
            season_cvar: this.buildSeasonCvars()
          }
        ];
        const res = await this.InsertSeason(payload);
        if (!res?.id) {
          this.message = res?.message || this.$t("Tournament.CreateError");
          return;
        }
        const started = await this.startReadyMatches(res.id);
        this.message = this.$t("Tournament.Started", { count: started });
        this.$emit("created", res.id);
        this.$router.push({ name: "Season", params: { id: res.id } });
      } catch (err) {
        this.message = err?.message || this.$t("Tournament.CreateError");
      } finally {
        this.busy = false;
      }
    },
    async syncAndAdvance() {
      this.busy = true;
      this.message = "";
      try {
        const started = await this.startReadyMatches(this.existingSeasonId);
        this.message = this.$t("Tournament.Advanced", { count: started });
        this.$emit("advanced", started);
      } catch (err) {
        this.message = err?.message || this.$t("Tournament.AdvanceError");
      } finally {
        this.busy = false;
      }
    },
    async startReadyMatches(seasonId) {
      const cvars = parseCvarMap(await this.GetSeasonCVARs(seasonId));
      const seeds = parseIdList(cvars[TOURNAMENT_SEEDS]);
      const serverIds = parseIdList(cvars[TOURNAMENT_SERVERS]);
      if (!seeds.length || !serverIds.length) return 0;

      const teamLookup = {};
      this.teams.forEach(t => {
        teamLookup[t.id] = t;
      });

      let rounds = buildEmptyBracket(seeds);
      const matches = await this.GetSeasonRecentMatches(seasonId);
      const matchList = Array.isArray(matches) ? matches : [];
      rounds = hydrateBracket(rounds, matchList, teamLookup);

      const ready = findReadySlots(rounds);
      let created = 0;
      let serverCursor = 0;

      for (const slot of ready) {
        if (slot.autoBye) continue;
        if (!slot.team1Id || !slot.team2Id) continue;
        // Skip if a match for this slot already exists
        if (slot.matchId) continue;

        const serverId = serverIds[serverCursor % serverIds.length];
        serverCursor += 1;

        const matchPayload = [
          {
            server_id: serverId,
            team1_id: slot.team1Id,
            team2_id: slot.team2Id,
            season_id: Number(seasonId),
            start_time: nowSql(),
            max_maps: Number(cvars.maps_to_win) || this.form.mapsToWin || 1,
            side_type: cvars.side_type || "standard",
            veto_mappool: cvars.map_pool || this.form.mapPool.join(" "),
            match_cvars: {
              [BRACKET_SLOT_CVAR]: slot.slotKey
            },
            veto_first: "team1",
            skip_veto: cvars.skip_veto == 1 || cvars.skip_veto === true,
            wingman: cvars.wingman == 1 || cvars.wingman === true,
            spectator_auths: [],
            min_players_to_ready: Number(cvars.min_players_to_ready) || Number(cvars.players_per_team) || 5,
            players_per_team: Number(cvars.players_per_team) || 5,
            min_spectators_to_ready: Number(cvars.min_spectators_to_ready) || 0,
            map_sides: cvars.map_sides || ""
          }
        ];

        const res = await this.InsertMatch(matchPayload);
        if (res?.id) created += 1;
      }
      return created;
    }
  }
};
</script>

<style scoped>
.bracket-title {
  font-family: "Rajdhani", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--g5-accent, #de9b35);
}
</style>
