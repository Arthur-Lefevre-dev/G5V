import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue")
  },
  {
    path: "/matches",
    name: "Matches",
    component: () => import("../views/Matches.vue")
  },
  {
    path: "/teams",
    name: "Teams",
    component: () => import("../views/Teams.vue"),
    children: [
      {
        path: "create",
        name: "Create Team",
        component: () => import("../views/Team.vue")
      }
    ]
  },
  {
    path: "/mymatches",
    name: "My Matches",
    component: () => import("../views/Matches.vue")
  },
  {
    path: "/myteams",
    name: "My Teams",
    component: () => import("../views/Teams.vue")
  },
  {
    path: "/myseasons",
    name: "My Seasons",
    component: () => import("../views/Seasons.vue")
  },
  {
    path: "/myservers",
    name: "My Servers",
    component: () => import("../views/Servers.vue")
  },
  {
    path: "/teams/:id",
    name: "Team",
    component: () => import("../views/Team.vue")
  },
  {
    path: "/match/create",
    name: "New Match",
    component: () => import("../views/CreateMatch.vue")
  },
  {
    path: "/match/:id",
    name: "Match",
    component: () => import("../views/Match.vue")
  },
  {
    path: "/user/:id",
    name: "User",
    component: () => import("../views/User.vue")
  },
  {
    path: "/user",
    name: "My User",
    component: () => import("../views/User.vue")
  },
  {
    path: "/seasons",
    name: "Seasons",
    component: () => import("../views/Seasons.vue")
  },
  {
    path: "/season/:id",
    name: "Season",
    component: () => import("../views/Season.vue")
  },
  {
    path: "/tournament/create",
    name: "CreateTournament",
    component: () => import("../views/CreateTournament.vue")
  },
  {
    path: "/servers",
    name: "Servers",
    component: () => import("../views/Servers.vue")
  },
  {
    path: "/metrics",
    name: "Metrics",
    component: () => import("../views/Metrics.vue")
  },
  {
    path: "/leaderboard",
    name: "Leaderboard",
    component: () => import("../views/PlayerLeaderboard.vue")
  },
  {
    path: "/leaderboard/teams",
    name: "TeamBoard",
    component: () => import("../views/TeamLeaderboard.vue")
  },
  {
    path: "/leaderboard/:seasonid",
    name: "SeasonPlayerBoard",
    component: () => import("../views/PlayerLeaderboard.vue")
  },
  {
    path: "/leaderboard/teams/:seasonid",
    name: "SeasonTeamBoard",
    component: () => import("../views/TeamLeaderboard.vue")
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
