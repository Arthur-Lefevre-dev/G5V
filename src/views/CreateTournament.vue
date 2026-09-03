<template>
  <v-container class="create-tournament" fluid>
    <TournamentSetup :user="user" @created="onCreated" />
  </v-container>
</template>

<script>
import TournamentSetup from "@/components/TournamentSetup.vue";

export default {
  name: "CreateTournament",
  components: { TournamentSetup },
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
      }
    };
  },
  async created() {
    this.user = await this.IsLoggedIn();
    if (!this.user?.id) {
      this.$router.replace("/");
    }
  },
  methods: {
    onCreated() {
      // navigation handled in TournamentSetup
    }
  }
};
</script>
