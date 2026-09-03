<template>
  <v-container class="PlayerLeaderboard" fluid>
    <v-data-table
      item-value="steamId"
      class="elevation-1"
      :loading="isLoading"
      :loading-text="$t('misc.LoadText')"
      :headers="headers"
      :items="players"
      :sort-by="[
        { key: 'wins', order: 'desc' },
        { key: 'kills', order: 'desc' }
      ]"
      ref="PlayerLeaderboardTable"
      :expanded="[]"
      show-expand
    >
      <template v-slot:top>
        <v-toolbar flat class="g5-table-toolbar">
          {{ $t("misc.PLeader") }}
        </v-toolbar>
      </template>
      <template v-slot:item.name="{ item }">
        <router-link :to="{ path: '/user/' + item.steamId }">
          {{ item.name }}
        </router-link>
      </template>
      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-data-table
              item-value="steamId"
              class="elevation-1"
              :headers="additionalHeaders"
              hide-default-footer
              density="compact"
              :key="item.steamId"
              :items="[item]"
              disable-sort
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  name: "PlayerLeaderboard",
  props: {
    seasonId: Number
  },
  data() {
    return {
      players: [],
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
          title: this.$t("PlayerStats.User"),
          align: "start",
          sortable: true,
          key: "name",
          groupable: false
        },
        {
          title: this.$t("misc.TWins"),
          sortable: true,
          key: "wins",
          groupable: false
        },
        {
          title: this.$t("PlayerStats.Kills"),
          key: "kills",
          groupable: false
        },
        {
          title: this.$t("PlayerStats.Deaths"),
          key: "deaths",
          groupable: false
        },
        {
          title: this.$t("PlayerStats.Assists"),
          key: "assists",
          groupable: false
        },
        {
          title: this.$t("PlayerStats.FlashbangAssists"),
          key: "fba",
          groupable: false
        },
        {
          title: this.$t("PlayerStats.TotalRoundsPlayed"),
          key: "trp"
        },
        {
          title: this.$t("PlayerStats.Rating"),
          key: "average_rating",
          groupable: false
        },
        {
          title: "",
          key: "data-table-expand",
          groupable: false,
          align: "end"
        }
      ];
    },
    additionalHeaders() {
      return [
        {
          title: this.$t("PlayerStats.ADR"),
          key: "adr"
        },
        {
          title: this.$t("PlayerStats.Headshot") + "%",
          key: "hsp"
        },
        {
          title: this.$t("PlayerStats.5kill"),
          key: "k5"
        },
        {
          title: this.$t("PlayerStats.4kill"),
          key: "k4"
        },
        {
          title: this.$t("PlayerStats.3kill"),
          key: "k3"
        },
        {
          title: this.$t("PlayerStats.2kill"),
          key: "k2"
        },
        {
          title: this.$t("PlayerStats.1kill"),
          key: "k1"
        },
        {
          title: this.$t("PlayerStats.v5"),
          key: "v5"
        },
        {
          title: this.$t("PlayerStats.v4"),
          key: "v4"
        }
      ];
    }
  },
  methods: {
    async GetLeaderboard() {
      try {
        let res;
        if (this.seasonId)
          res = await this.GetSeasonPlayerLeaderboard(this.seasonId);
        else res = await this.GetTotalPlayerLeaderboard();
        if (typeof res == "string") return;
        res.forEach(player => {
          player.adr =
            player.roundsplayed === 0
              ? 0.0
              : (player.total_damage / player.trp).toFixed(2);
          this.players.push(player);
        });
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
