<template>
  <v-container class="TeamLeaderboard" fluid>
    <v-data-table
      item-value="index"
      class="elevation-1"
      :loading="isLoading"
      :loading-text="$t('misc.LoadText')"
      :headers="headers"
      :items="teams"
      :sort-by="[{ key: 'wins', order: 'desc' }]"
      ref="TeamLeaderboardTable"
    >
      <template v-slot:top>
        <v-toolbar flat class="g5-table-toolbar">
          {{ $t("Leaderboard.TTitle") }}
        </v-toolbar>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  name: "TeamLeaderboard",
  props: {
    seasonid: Number
  },
  data() {
    return {
      teams: [],
      isLoading: true
    };
  },
  created() {
    this.GetLeaderboard();
  },
  computed: {
    headers() {
      return [
        {
          title: this.$t("Leaderboard.TName"),
          align: "start",
          sortable: true,
          key: "name",
          groupable: false
        },
        {
          title: this.$t("Leaderboard.TWin"),
          sortable: true,
          key: "wins",
          groupable: false
        },
        {
          title: this.$t("Leaderboard.TLosses"),
          key: "losses",
          groupable: false
        },
        {
          title: this.$t("Leaderboard.TDiff"),
          key: "rounddiff",
          groupable: false
        }
      ];
    }
  },
  methods: {
    async GetLeaderboard() {
      try {
        let res;
        if (this.seasonid)
          res = await this.GetSeasonTeamLeaderboard(this.seasonid);
        else res = await this.GetTeamLeaderboard();
        if (typeof res == "string") return;
        this.teams = res;
      } catch (error) {
        console.log("Our error: " + error);
      } finally {
        this.isLoading = false;
      }
      return;
    }
  }
};
</script>
