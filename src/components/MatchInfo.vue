<template>
  <v-container class="match-info-panel" fluid>
    <!-- Admin actions -->
    <div class="d-flex justify-end mb-2" v-if="AdminToolsAvailable(matchInfo)">
      <AdminButton
        :matchInfo="matchInfo"
        :user="user"
        @force-the-reload="getMatchInfo()"
      />
    </div>

    <!-- Team names row -->
    <v-row align="center" justify="center" class="my-4" no-gutters>
      <!-- Team 1 -->
      <v-col cols="5" class="text-center">
        <component
          :is="matchInfo.team1.id != 0 ? 'router-link' : 'div'"
          v-bind="matchInfo.team1.id != 0 ? { to: '/teams/' + matchInfo.team1_id } : {}"
          class="match-team-link"
        >
          <div class="d-flex flex-column align-center ga-1">
            <img
              v-if="matchInfo.team1.logo"
              :src="apiUrl + '/static/img/logos/' + matchInfo.team1.logo + '.png'"
              class="match-team-logo"
              @error="imgUrlAlt"
            />
            <img
              v-else-if="matchInfo.team1.flag"
              :src="get_flag_link(matchInfo.team1)"
              class="match-team-flag"
            />
            <span class="text-h5 font-weight-bold text-primary">
              {{ matchInfo.team1_name }}
            </span>
          </div>
        </component>
      </v-col>

      <!-- VS -->
      <v-col cols="2" class="text-center">
        <span class="text-h6 text-medium-emphasis">{{ $t("Matches.Versus") }}</span>
      </v-col>

      <!-- Team 2 -->
      <v-col cols="5" class="text-center">
        <component
          :is="matchInfo.team2.id != 0 ? 'router-link' : 'div'"
          v-bind="matchInfo.team2.id != 0 ? { to: '/teams/' + matchInfo.team2_id } : {}"
          class="match-team-link"
        >
          <div class="d-flex flex-column align-center ga-1">
            <img
              v-if="matchInfo.team2.logo"
              :src="apiUrl + '/static/img/logos/' + matchInfo.team2.logo + '.png'"
              class="match-team-logo"
              @error="imgUrlAlt"
            />
            <img
              v-else-if="matchInfo.team2.flag"
              :src="get_flag_link(matchInfo.team2)"
              class="match-team-flag"
            />
            <span class="text-h5 font-weight-bold text-primary">
              {{ matchInfo.team2_name }}
            </span>
          </div>
        </component>
      </v-col>
    </v-row>

    <!-- Score -->
    <div class="match-score-block text-center my-4">
      <span class="text-h2 font-weight-bold text-primary">{{ matchInfo.team1_score }}</span>
      <span class="text-h3 mx-4 text-medium-emphasis">{{ matchInfo.symbol }}</span>
      <span class="text-h2 font-weight-bold text-primary">{{ matchInfo.team2_score }}</span>
    </div>

    <!-- Match details -->
    <div class="text-center text-subtitle-2 text-medium-emphasis mb-1">
      {{ $t("Match.StartTime") }} {{ matchInfo.start_time }}
    </div>
    <div
      v-if="matchInfo.end_time != null"
      class="text-center text-subtitle-2 text-medium-emphasis mb-1"
    >
      {{ $t("Match.EndTime") }} {{ matchInfo.end_time }}
    </div>
    <div v-if="matchInfo.forfeit == 1" class="text-center font-weight-bold text-error mt-2">
      {{ $t("Match.MatchForfeitedBy", { team: get_loser(matchInfo) }) }}
    </div>
    <div v-else-if="matchInfo.cancelled == 1" class="text-center font-weight-bold text-error mt-2">
      {{ $t("Match.MatchHasBeenCancelled") }}
    </div>

    <!-- Connect buttons -->
    <div
      v-if="user.id != null && serverInfo.ip_string != '' && matchInfo.end_time == null"
      class="d-flex justify-center ga-3 flex-wrap mt-4"
    >
      <v-btn
        color="primary"
        size="small"
        :href="connectUrl"
      >
        {{ $t("Match.Connect") }}
      </v-btn>
      <v-btn
        v-if="serverInfo.gotv_port != null"
        color="secondary"
        size="small"
        :href="gotvUrl"
      >
        {{ $t("Match.GOTVConnect") }}
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import AdminButton from "./MatchAdminButton.vue";
export default {
  components: {
    AdminButton
  },
  props: {
    match_id: Number,
    user: Object
  },
  computed: {
    connectUrl() {
      return `steam://rungame/730/${this.user.steam_id}/+connect%20${this.serverInfo.ip_string}:${this.serverInfo.port}`;
    },
    gotvUrl() {
      return `steam://rungame/730/${this.user.steam_id}/+connect%20${this.serverInfo.ip_string}:${this.serverInfo.gotv_port}`;
    }
  },
  data() {
    return {
      matchInfo: {
        team1_name: "",
        team2_name: "",
        match_title: "",
        start_time: "",
        end_time: "",
        team1_id: 0,
        team2_id: 0,
        team1_score: 0,
        team2_score: 0,
        team1: {
          id: 0,
          user_id: 0,
          name: "",
          tag: "",
          flag: "",
          logo: "",
          auth_name: {},
          public_team: false
        },
        team2: {
          id: 0,
          user_id: 0,
          name: "",
          tag: "",
          flag: "",
          logo: "",
          auth_name: {},
          public_team: false
        },
        symbol: "",
        cancelled: 0,
        forfeit: 0,
        id: -1,
        user_id: -1
      },
      serverInfo: {
        ip_string: "",
        port: 0,
        gotv_port: 0
      },
      apiUrl: process.env.VUE_APP_G5V_API_URL || "/api",
      imageLoaded: true
    };
  },
  created() {
    this.checkIfMatchLive();
  },
  methods: {
    async checkIfMatchLive() {
      let matchRes = await this.GetMatchData(this.match_id);
      if (matchRes.end_time == null) await this.getStreamedMatchInfo();
      else await this.getMatchInfo();
    },
    async getStreamedMatchInfo() {
      try {
        let sseClient = await this.GetEventMatchData(this.match_id);
        await sseClient.connect();
        await sseClient.on("matches", async message => {
          try {
            await this.retrieveMatchInfoHelper(message);
          } catch (error) {
            console.error(
              "Error retrieving information from matches event stream. ",
              error
            );
          }
        });
        return;
      } catch (ignored) {
        return;
      }
    },
    async getMatchInfo() {
      try {
        let matchRes = await this.GetMatchData(this.match_id);
        await this.retrieveMatchInfoHelper(matchRes);
      } catch (error) {
        console.log(error);
      }
    },
    async retrieveMatchInfoHelper(serverResponse) {
      try {
        let team1Res = await this.GetBasicTeamInfo(serverResponse.team1_id);
        let team2Res = await this.GetBasicTeamInfo(serverResponse.team2_id);
        let serveRes = await this.GetServerData(serverResponse.server_id);
        this.matchInfo.team1_name = serverResponse.team1_string;
        this.matchInfo.team2_name = serverResponse.team2_string;
        this.matchInfo.team1_id = serverResponse.team1_id;
        this.matchInfo.team2_id = serverResponse.team2_id;
        this.matchInfo.start_time = new Date(
          serverResponse.start_time
        ).toLocaleString();
        this.matchInfo.end_time =
          serverResponse.end_time == null
            ? null
            : new Date(serverResponse.end_time).toLocaleString();
        this.matchInfo.team1_score = serverResponse.team1_score;
        this.matchInfo.team2_score = serverResponse.team2_score;
        this.matchInfo.symbol = this.GetScoreSymbol(
          this.matchInfo.team1_score,
          this.matchInfo.team2_score
        );
        this.matchInfo.team1 = team1Res;
        this.matchInfo.team2 = team2Res;
        this.matchInfo.cancelled = serverResponse.cancelled;
        this.matchInfo.forfeit = serverResponse.forfeit;
        this.matchInfo.id = this.match_id;
        this.matchInfo.user_id = serverResponse.user_id;
        if (serveRes) {
          this.serverInfo.ip_string = serveRes.ip_string;
          this.serverInfo.port = serveRes.port;
          this.serverInfo.gotv_port = serveRes.gotv_port;
        }
      } catch (err) {
        console.log(`Error on match helper. The error is ${err.toString()}`);
      }
    },
    imgUrlAlt(event) {
      if (event.target.src.includes("svg")) this.imageLoaded = false;
      else event.target.src = event.target.src.replace("png", "svg");
    }
  }
};
</script>

<style scoped>
.match-info-panel {
  max-width: 800px;
  margin: 0 auto;
}

.match-team-link {
  text-decoration: none;
  color: inherit;
}

.match-team-logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: contain;
}

.match-team-flag {
  border-radius: 4px;
  height: 24px;
}

.match-score-block {
  padding: 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.08);
}
</style>
