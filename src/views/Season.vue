<template>
  <v-container class="season" fluid>
    <v-card class="g5-card pa-4 mb-4" flat>
      <v-row>
        <v-col cols="12">
          <div class="d-flex flex-wrap align-center ga-3">
            <h1 class="text-h4 season-title mb-0">{{ seasonData.name }}</h1>
            <v-chip v-if="isTournament" color="primary" variant="flat" size="small">
              {{ $t("Tournament.Badge") }}
            </v-chip>
            <v-spacer />
            <div class="text-medium-emphasis text-body-2" v-if="seasonData.start_date">
              {{ isStarted }}:
              {{ new Date(seasonData.start_date).toLocaleDateString("en-CA") }}
              <template v-if="seasonData.end_date">
                — {{ isEnding }}:
                {{ new Date(seasonData.end_date).toLocaleDateString("en-CA") }}
              </template>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-3">
            <v-btn variant="outlined" color="primary" :to="`/leaderboard/${seasonData.id}`">
              {{ $t("misc.PLeader") }}
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              :to="`/leaderboard/teams/${seasonData.id}`"
            >
              {{ $t("Leaderboard.TTitle") }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-card v-if="isTournament" class="g5-card pa-4 mb-4" flat>
      <TournamentPanel
        :season-id="seasonData.id"
        :season-owner-id="seasonData.user_id"
        :user="user"
        :cvars="seasonCvars"
      />
    </v-card>

    <v-card class="g5-card pa-2" flat>
      <MatchesTable :user="user" />
    </v-card>
  </v-container>
</template>

<script>
import MatchesTable from "@/components/MatchesTableNoLimits.vue";
import TournamentPanel from "@/components/TournamentPanel.vue";
import { isTournamentSeason, parseCvarMap } from "@/utils/tournament.js";

export default {
  name: "Season",
  components: {
    MatchesTable,
    TournamentPanel
  },
  data() {
    return {
      user: {
        admin: false,
        steam_id: "",
        id: null,
        super_admin: false,
        name: "",
        small_image: "",
        medium_image: "",
        large_image: ""
      },
      seasonData: {
        name: "",
        id: -1,
        user_id: -1,
        start_date: null,
        end_date: null
      },
      seasonCvars: {}
    };
  },
  computed: {
    isTournament() {
      return isTournamentSeason(this.seasonCvars);
    },
    isStarted() {
      if (
        this.seasonData.start_date >=
        new Date().toISOString().slice(0, 19).replace("T", " ")
      )
        return "Starting";
      return "Started";
    },
    isEnding() {
      if (
        this.seasonData.end_date != null &&
        this.seasonData.end_date <
          new Date().toISOString().slice(0, 19).replace("T", " ")
      )
        return "Ended";
      return "Ends";
    }
  },
  async created() {
    this.user = await this.IsLoggedIn();
    this.seasonData = await this.GetSeasonInfo(this.$route.params.id);
    this.seasonData.start_date = new Date(this.seasonData.start_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    if (this.seasonData.end_date != null) {
      this.seasonData.end_date = new Date(this.seasonData.end_date)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    }
    const raw = await this.GetSeasonCVARs(this.$route.params.id);
    this.seasonCvars = parseCvarMap(typeof raw === "string" ? {} : raw);
  }
};
</script>

<style scoped>
.season-title {
  font-family: "Rajdhani", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
</style>
