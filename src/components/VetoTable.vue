<template>
  <v-container class="vetoInfo" fluid v-if="vetoInfo.length > 1">
    <v-data-table
      :headers="headers"
      :items="vetoInfo"
      class="elevation-1"
      :sort-by="[{ key: 'id', order: 'asc' }]"
      hide-default-footer
      :no-data-text="$t('Veto.NoData')"
      v-model:expanded="expanded"
      show-expand
    >
      <template v-slot:item.map="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          {{ item.map }}
        </b>
        <div v-else>
          {{ item.map }}
        </div>
      </template>
      <template v-slot:item.pick_or_veto="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          {{ $t("Veto.VetoPick") }}
        </b>
        <div
          v-else-if="
            item.pick_or_veto === 'ban' || item.pick_or_veto === 'veto'
          "
        >
          {{ $t("Veto.VetoBan") }}
        </div>
      </template>
      <template v-slot:item.team_name="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          <div v-if="item.team_name === 'Decider'">
            {{ $t("Veto.DeciderTeam") }}
          </div>
          <div v-else>
            {{ item.team_name }}
          </div>
        </b>
        <div v-else>
          {{ item.team_name }}
        </div>
      </template>

      <template
        v-slot:[`item.data-table-expand`]="{ item, internalItem, isExpanded, toggleExpand }"
      >
        <v-icon
          v-if="item.side"
          @click.stop="toggleExpand(internalItem)"
        >
          {{ isExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
        </v-icon>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-data-table
              item-value="id"
              class="elevation-1"
              :headers="additionalHeaders"
              hide-default-footer
              density="compact"
              :key="item.id"
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
let vetoInformation;
let vetoSideInformation;
export default {
  props: {
    match_id: Number
  },
  data() {
    return {
      vetoInfo: [
        {
          id: -1,
          match_id: -1,
          team_name: "",
          team_name_side: null,
          map: "",
          pick_or_veto: "",
          side: ""
        }
      ],
      expanded: []
    };
  },
  mounted() {
    this.useStreamOrStaticData();
  },
  methods: {
    async useStreamOrStaticData() {
      let matchData = await this.GetMatchData(this.match_id);
      if (matchData.end_time == null) this.getStreamedVetoInfo();
      else this.getVetoInfo();
    },
    async getStreamedVetoInfo() {
      try {
        vetoInformation = await this.GetStreamedVetoesOfMatch(this.match_id);
        vetoSideInformation = await this.GetStreamedVetoSidesOfMatch(
          this.match_id
        );
        this.vetoInfo.pop();
        await vetoInformation.on("vetodata", this.handleVetoInfo).connect();
        await vetoSideInformation
          .on("vetosidedata", this.handleLiveSideInfo)
          .connect();
      } catch (err) {
        console.error(`Error on SSE ${err}`);
      }
    },
    async handleVetoInfo(liveVetoInfo) {
      await liveVetoInfo.forEach(vetoData => {
        let isFound = this.vetoInfo.find(tmp => {
          return tmp["id"] === vetoData.id;
        });
        if (!isFound) {
          this.vetoInfo.push({
            id: vetoData.id,
            match_id: vetoData.match_id,
            team_name: vetoData.team_name,
            map: vetoData.map,
            pick_or_veto: vetoData.pick_or_veto
          });
        }
      });
      let mapStatRes = await this.GetMapStats(this.match_id);
      if (typeof mapStatRes != "string") this.mapStats = mapStatRes;
    },
    async handleLiveSideInfo(liveSideInfo) {
      await liveSideInfo.forEach(liveVetoData => {
        this.vetoInfo.forEach((vetoData, idx) => {
          if (liveVetoData["veto_id"] === vetoData["id"]) {
            this.vetoInfo.splice(idx, 1);
            this.vetoInfo.push({
              id: vetoData.id,
              match_id: vetoData.match_id,
              team_name: vetoData.team_name,
              map: vetoData.map,
              pick_or_veto: vetoData.pick_or_veto,
              team_name_side: liveVetoData.team_name,
              side: liveVetoData.side
            });
          }
        });
      });
    },
    async getVetoInfo() {
      try {
        let vetoRes = await this.GetVetoesOfMatch(this.match_id);
        if (typeof vetoRes != "string") this.vetoInfo = vetoRes;
      } catch (error) {
        console.log(error);
      }
    },
    expandAll: function() {
      this.expanded = this.people.filter(item => item.description);
    },
    collapseAll: function() {
      this.expanded = [];
    }
  },
  computed: {
    headers() {
      return [
        {
          title: this.$t("Veto.TeamHeader"),
          sortable: false,
          align: "start",
          key: "team_name"
        },
        {
          title: this.$t("Veto.MapHeader"),
          sortable: false,
          key: "map"
        },
        {
          title: this.$t("Veto.PickBan"),
          sortable: false,
          key: "pick_or_veto"
        },
        {
          title: "",
          key: "data-table-expand"
        }
      ];
    },
    additionalHeaders() {
      return [
        {
          title: this.$t("Veto.TeamHeader"),
          key: "team_name_side"
        },
        {
          title: this.$t("Veto.MapHeader"),
          sortable: false,
          key: "map"
        },
        {
          title: this.$t("Veto.SidePick"),
          sortable: false,
          key: "side"
        }
      ];
    }
  }
};
</script>
