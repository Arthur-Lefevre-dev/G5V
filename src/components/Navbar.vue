<template>
  <div>
    <v-app-bar app color="surface" elevation="0" class="g5-navbar">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title class="g5-brand-title text-h5">
        {{ $t("Navbar.title") }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn rounded :href="apiUrl + '/auth/steam'" v-if="user.id == null">
        <img src="/img/login_small.png" v-if="user.id == null" />
      </v-btn>
      <v-tooltip v-if="user.id !== null" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="small"
            color="grey-darken-2"
            :href="apiUrl + '/logout'"
            v-if="user.id !== null"
          >
            <v-icon>mdi-logout-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Navbar.Logout") }}</span>
      </v-tooltip>
      <v-tooltip v-else location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="small"
            color="grey-darken-2"
            @click="loginDialog = true"
            v-if="user.id === null"
          >
            <v-icon>mdi-login-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Login.title") }}</span>
      </v-tooltip>
      <v-btn :to="'/user/' + user.id" v-if="user.id !== null" icon size="small">
        <img :src="user.small_image" style="border-radius: 15px;" />
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" temporary app color="surface">
      <v-list nav density="compact">
        <v-list-item :to="'/'" @click="drawer = false">
          <v-list-item-title>{{ $t("Navbar.Home") }}</v-list-item-title>
        </v-list-item>

        <v-list-item :to="'/matches'" @click="drawer = false">
          <v-list-item-title>{{ $t("Navbar.AllMatches") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/mymatches'"
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.MyMatches") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/match/create'"
          @click="drawer = false"
        >
          <v-list-item-title>{{
            $t("Navbar.CreateMatch")
          }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/myteams'"
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.MyTeams") }}</v-list-item-title>
        </v-list-item>

        <v-list-item :to="'/teams'" exact @click="drawer = false">
          <v-list-item-title>{{ $t("Navbar.AllTeams") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/teams/create'"
          exact
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.CreateTeam") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/myservers'"
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.MyServers") }}</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="user.id != null" @click="newDialog = true">
          <v-list-item-title>{{ $t("Navbar.AddServer") }}</v-list-item-title>
        </v-list-item>

        <v-list-item :to="'/seasons'" @click="drawer = false">
          <v-list-item-title>{{ $t("Navbar.AllSeasons") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/myseasons'"
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.MySeasons") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-if="user.id != null"
          :to="'/tournament/create'"
          @click="drawer = false"
        >
          <v-list-item-title>{{ $t("Navbar.CreateTournament") }}</v-list-item-title>
        </v-list-item>

        <v-list-item :to="'/leaderboard'" @click="drawer = false">
          <v-list-item-title>
            {{ $t("Navbar.PlayerLeader") }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <ServerDialog
      v-model="newDialog"
      :serverInfo="{}"
      :title="$t('MyServers.New')"
    />
    <LoginDialog v-model="loginDialog" :title="$t('Login.title')" />
  </div>
</template>
<script>
import ServerDialog from "./ServerDialog.vue";
import LoginDialog from "./LoginDialog.vue";
export default {
  name: "Navbar",
  props: {
    user: Object
  },
  components: {
    ServerDialog,
    LoginDialog
  },
  data() {
    return {
      drawer: false,
      newDialog: false,
      loginDialog: false,
      apiUrl: process.env.VUE_APP_G5V_API_URL || "/api"
    };
  }
};
</script>
