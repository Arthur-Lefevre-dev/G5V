<template>
  <v-app>
    <Navbar :user="user" />
    <v-main>
      <router-view :key="$route.fullPath" />
    </v-main>
    <Footer />
  </v-app>
</template>

<script>
import Navbar from "@/components/Navbar.vue";
import Footer from "@/components/Footer.vue";

export default {
  name: "App",
  components: {
    Navbar,
    Footer
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
      }
    };
  },
  async mounted() {
    this.user = await this.IsLoggedIn();
  }
};
</script>
