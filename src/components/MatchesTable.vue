<template>
  <v-data-table
    item-value="name"
    class="elevation-1"
    :loading="isLoading"
    :loading-text="$t('misc.LoadText')"
    :headers="headers"
    :items="matches"
    v-model:page="page"
    v-model:items-per-page="itemsPerPage"
    v-model:sort-by="sortBy"
    :items-length="totalMatches"
    ref="MatchesTable"
  >
    <template v-slot:item.id="{ item }">
      <router-link
        :to="{ path: '/match/' + item.id }"
        v-if="item.match_status != 'Cancelled'"
      >
        {{ item.id }}
      </router-link>
      <div v-else>
        {{ item.id }}
      </div>
    </template>
    <template v-slot:item.owner="{ item }">
      <router-link :to="{ path: '/user/' + item.user_id }">
        {{ item.owner }}
      </router-link>
    </template>
    <template v-slot:item.team1_string="{ item }">
      <router-link
        :to="{ path: '/teams/' + item.team1_id }"
        v-if="item.team1_id !== null"
      >
        {{ item.team1_string }}
      </router-link>
      <div v-else>
        {{ item.team1_string }}
      </div>
    </template>
    <template v-slot:item.team2_string="{ item }">
      <router-link
        :to="{ path: '/teams/' + item.team2_id }"
        v-if="item.team2_id !== null"
      >
        {{ item.team2_string }}
      </router-link>
      <div v-else>
        {{ item.team2_string }}
      </div>
    </template>
    <template v-slot:top>
      <div v-if="isMyMatches && isThereCancelledMatches">
        <v-toolbar flat class="g5-table-toolbar">
          <v-toolbar-title>
            <v-btn color="primary" @click="deleteCancelled" :loading="deletePending">
              {{ $t("Matches.DeleteButton") }}
            </v-btn>
          </v-toolbar-title>
        </v-toolbar>
      </div>
      <div v-else />
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    user: Object
  },
  data() {
    return {
      matches: [],
      isLoading: true,
      isThereCancelledMatches: false,
      totalMatches: -1,
      page: 1,
      itemsPerPage: 10,
      sortBy: [{ key: "id", order: "asc" }],
      deletePending: false
    };
  },
  computed: {
    headers() {
      return [
        {
          title: this.$t("Matches.MatchID"),
          align: "start",
          sortable: true,
          key: "id"
        },
        {
          title: this.$t("Matches.Team1"),
          key: "team1_string"
        },
        {
          title: this.$t("Matches.Team2"),
          key: "team2_string"
        },
        {
          title: this.$t("Matches.Status"),
          key: "match_status",
          sortable: false
        },
        {
          title: this.$t("Matches.Owner"),
          key: "owner"
        }
      ];
    },
    isMyMatches() {
      return this.$route.path == "/mymatches";
    }
  },
  watch: {
    page: {
      async handler() {
        await this.pageUpdate();
      }
    },
    itemsPerPage: {
      async handler() {
        await this.pageUpdate();
      }
    },
    sortBy: {
      async handler() {
        await this.pageUpdate();
      },
      deep: true
    }
  },
  methods: {
    async pushMatchData(resultArray) {
      this.isLoading = true;
      let matches = [];
      let matchString;
      let team1Score,
        team2Score = 0;
      resultArray.forEach(async match => {
        if (match.max_maps == 1) {
          team1Score =
            match.team1_mapscore == undefined ? 0 : match.team1_mapscore;
          team2Score =
            match.team2_mapscore == undefined ? 0 : match.team2_mapscore;
        } else {
          team1Score = match.team1_score == undefined ? 0 : match.team1_score;
          team2Score = match.team2_score == undefined ? 0 : match.team2_score;
        }
        if (
          match.end_time == null &&
          (match.cancelled == 0 || match.cancelled == null) &&
          match.start_time != null
        ) {
          matchString = `Live, ${team1Score}:${team2Score} vs ${match.team2_string}`;
        } else if (team1Score < team2Score) {
          matchString = `Lost, ${team1Score}:${team2Score} vs ${match.team2_string}`;
        } else if (team1Score > team2Score) {
          matchString = `Won, ${team1Score}:${team2Score} vs ${match.team2_string}`;
        } else if (match.cancelled == 1) {
          matchString = "Cancelled";
        } else if (team1Score == team2Score && match.forfeit != 1) {
          matchString = `Tied, ${team1Score}:${team2Score} vs ${match.team2_string}`;
        } else if (match.winner == match.team1_id) {
          matchString = `Forfeit win vs ${match.team2_string}`;
        } else if (match.winner == match.team2_id) {
          matchString = `Forfeit loss vs ${match.team2_string}`;
        }
        match.match_status = matchString;
        if (match.cancelled == 1) this.isThereCancelledMatches = true;
        await matches.push(match);
      });
      this.isLoading = false;
      return matches;
    },
    async pageUpdate() {
      let count =
        this.$route.path == "/mymatches"
          ? await this.GetMyMatches()
          : await this.GetAllMatches();
      const sortItem = this.sortBy?.[0];
      if (typeof count == "string") count = [];
      if (sortItem?.key) {
        const sortKey = sortItem.key;
        const sortDesc = sortItem.order === "desc";
        count = count.sort((a, b) => {
          const sortA = a[sortKey];
          const sortB = b[sortKey];
          if (sortDesc) {
            if (sortA < sortB) return 1;
            if (sortA > sortB) return -1;
            return 0;
          } else {
            if (sortA < sortB) return -1;
            if (sortA > sortB) return 1;
            return 0;
          }
        });
      }
      this.totalMatches = count.length;
      if (this.itemsPerPage > 0) {
        count = count.slice(
          (this.page - 1) * this.itemsPerPage,
          this.page * this.itemsPerPage
        );
      }
      this.matches = await this.pushMatchData(count);
      return;
    },
    async deleteCancelled() {
      this.deletePending = true;
      await this.DeleteMyCancelledMatches();
      this.deletePending = false;
      this.matches = [];
      this.isLoading = true;
      this.isThereCancelledMatches = false;
      await this.pageUpdate();
    }
  },
  async mounted() {
    await this.pageUpdate();
  }
};
</script>
