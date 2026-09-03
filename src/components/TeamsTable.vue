<template>
  <v-container fluid>
    <v-data-table
      item-value="id"
      class="elevation-1"
      :loading="isLoading"
      :loading-text="$t('misc.LoadText')"
      :headers="headers"
      :items="teams"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :items-length="totalTeams"
      ref="TeamsTable"
    >
      <template v-slot:top>
        <v-toolbar flat class="g5-table-toolbar">
          {{ $t("Teams.Title") }}
          <v-spacer />
          <v-btn
            color="secondary"
            @click="newImportDialog = true"
            v-if="user.id != null"
          >
            {{ $t("Seasons.ImportSeason") }}
          </v-btn>
        </v-toolbar>
      </template>
      <template v-slot:item.id="{ item }">
        <router-link :to="{ path: '/teams/' + item.id }">
          {{ item.id }}
        </router-link>
      </template>
      <template v-slot:item.owner="{ item }">
        <router-link :to="{ path: '/user/' + item.user_id }">
          {{ item.owner }}
        </router-link>
      </template>
      <template v-slot:item.flag="{ item }">
        <img :src="get_flag_link(item)" style="border-radius: 5px;" />
      </template>
    </v-data-table>
    <v-dialog
      v-model="newImportDialog"
      transition="dialog-bottom-transition"
      max-width="600px"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">
            {{ $t("Seasons.Import") }}
          </span>
        </v-card-title>
        <v-card-text v-html="$t('Seasons.ImportExplanation')" />
        <v-card-text>
          <v-form ref="newImportForm">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="challongeInfo.tournament_id"
                    ref="ChallongeUrl"
                    :label="$t('Seasons.ImportUrl')"
                    required
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red-darken-1" variant="text" @click="newImportDialog = false">
            {{ $t("misc.Cancel") }}
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="importChallongeTeams()">
            {{ $t("misc.Import") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-bottom-sheet v-model="responseSheet" inset persistent>
      <v-sheet class="text-center" height="200px">
        <v-btn
          class="mt-6"
          variant="text"
          color="success"
          @click="
            responseSheet = !responseSheet;
            response = '';
          "
        >
          {{ $t("misc.Close") }}
        </v-btn>
        <div class="my-3">
          {{ response }}
        </div>
      </v-sheet>
    </v-bottom-sheet>
  </v-container>
</template>

<script>
export default {
  props: {
    user: Object
  },
  data() {
    return {
      teams: [],
      isLoading: true,
      newImportDialog: false,
      challongeInfo: {
        tournament_id: ""
      },
      responseSheet: false,
      response: "",
      page: 1,
      itemsPerPage: 10,
      sortBy: [{ key: "id", order: "asc" }],
      totalTeams: -1
    };
  },
  watch: {
    newImportDialog(val) {
      if (!val) {
        this.$refs.newImportForm.resetValidation();
        this.challongeInfo = {
          tournament_id: ""
        };
      }
    },
    page: {
      handler() {
        this.GetTeams();
      }
    },
    itemsPerPage: {
      handler() {
        this.GetTeams();
      }
    },
    sortBy: {
      handler() {
        this.GetTeams();
      },
      deep: true
    }
  },
  computed: {
    headers() {
      return [
        {
          title: this.$t("Team.ID"),
          align: "start",
          sortable: true,
          key: "id"
        },
        {
          title: this.$t("Team.Name"),
          key: "name"
        },
        {
          title: this.$t("Team.TeamTag"),
          key: "tag",
          sortable: false
        },
        {
          title: this.$t("Team.Flag"),
          key: "flag"
        },
        {
          title: this.$t("Team.Owner"),
          key: "owner"
        }
      ];
    }
  },
  methods: {
    async GetTeams() {
      this.isLoading = true;
      this.teams = [];
      let count =
        this.$route.path == "/teams"
          ? await this.GetAllTeams()
          : await this.GetMyTeams();

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

      if (!this.user.id || !this.IsAnyAdmin(this.user)) {
        count = count.filter(
          team => team.public_team == 1 || team.user_id == this.user.id
        );
      }
      this.totalTeams = count.length;
      if (this.itemsPerPage > 0) {
        count = count.slice(
          (this.page - 1) * this.itemsPerPage,
          this.page * this.itemsPerPage
        );
      }
      this.teams = count;
      this.isLoading = false;
      return;
    },
    async importChallongeTeams() {
      let importData = [this.challongeInfo];
      let isImport = await this.ImportChallongeTeams(importData);
      if (isImport.message.includes("successfully")) {
        this.teams = [];
        this.GetTeams();
        this.response = isImport.message;
        this.responseSheet = true;
        this.newImportDialog = false;
      } else {
        this.response = this.$t("Seasons.ImportError");
        this.responseSheet = true;
        this.$nextTick(() => {
          this.challongeInfo = {
            tournament_id: ""
          };
        });
      }
      return;
    }
  },
  async mounted() {
    await this.GetTeams();
  }
};
</script>
