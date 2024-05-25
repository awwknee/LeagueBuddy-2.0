<script setup lang="ts">
import { ref } from "vue";
import AddAccountDialog from "./AddAccountDialog.vue";
import Account from "../shared/Account";

defineProps<{ msg: string }>();
const accs = window.ipcRenderer.sendSync("get-accounts");

const champs = await window.ipcRenderer.invoke("get-champions");

const champions = new Map();
for (const champion in champs.data) {
  champions.set(champs.data[champion].key, champs.data[champion]);
}

const accounts = ref<Account[]>(
typeof accs == "string" ? JSON.parse(accs) : accs
);

const activeAccount = ref<number>(-1);
const loggedInAccount = ref<number>(-1);

window.ipcRenderer.on('lol-client-open', async () => {
  let accs: Account[] = accounts.value.filter(a => a.id != null);
  if (accs.length == 0) return;

  for (const acc of accs) {
    const profile = await window.ipcRenderer.invoke('lol-summoner-profile', acc.id);
    const account = accounts.value.find(a => a.id == acc.id);
    if (!account) return;

    if (profile) {
      account.id = profile.summonerId;
      account.displayName = profile.displayName;
      account.profile_image_url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${profile.profileIconId}.jpg`;
      account.level = profile.summonerLevel;
      account.puuid = profile.puuid;
    }

    const ranked = await window.ipcRenderer.invoke('lol-summoner-ranked', acc.puuid);

    if (ranked) {
      const solo_queue = ranked.queueMap.RANKED_SOLO_5x5;
      account.solo_queue = {
        division: solo_queue.division,
        lp: solo_queue.leaguePoints,
        tier: solo_queue.tier || "Unranked",
        tier_image_url: solo_queue.tier ? `https://opgg-static.akamaized.net/images/medals_new/${solo_queue.tier.toLowerCase()}.png` : 'https://static.wikia.nocookie.net/leagueoflegends/images/1/13/Season_2023_-_Unranked.png'
      }
    }
  }

  window.ipcRenderer.sendSync("save-account", JSON.stringify(accounts.value));
});


function getBackdropUrl(account: Account) {
  if (!account.backdrop) return;
  const key = account.backdrop.split(".")[0].slice(0, -3);
  const url = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${key}/${account.backdrop}`;
  return url;
}

function remove(account: Account) {
  const index = accounts.value.indexOf(account);
  accounts.value.splice(index, 1);
  window.ipcRenderer.sendSync("save-account", JSON.stringify(accounts.value));
}

async function login(account: Account, index: number) {
  activeAccount.value = index;
  await window.ipcRenderer.invoke("login-account", JSON.stringify(account));
  activeAccount.value = -1;
}

window.ipcRenderer.on("lol-login-session", (_, data, event) => {
  if (data == null) return;
  const account = accounts.value.findIndex(
  (a) => a.username.toLowerCase() === data.username.toLowerCase()
  );
  if (account > -1) {
    loggedInAccount.value = account;
  }
});

window.ipcRenderer.on("lol-current-summoner", async (_, data, event) => {
  if (data == null) return;
  if (loggedInAccount.value > -1) {
    const account = accounts.value[loggedInAccount.value];
    
    account.displayName = data.displayName;
    account.displayTag = data.tagLine;
    account.id = data.summonerId;
    
    window.ipcRenderer.sendSync("save-account", JSON.stringify(accounts.value));
  }
});

window.ipcRenderer.on("lol-store-wallet", async (_, data) => {
  if (data && loggedInAccount.value > -1) {
    const wallet = await window.ipcRenderer.invoke("lol-wallet");
    const account = accounts.value[loggedInAccount.value];
    
    account.wallet = {
      blue_essence: wallet.lol_blue_essence,
      riot_points: wallet.RP,
    };
    
    window.ipcRenderer.sendSync("save-account", JSON.stringify(accounts.value));
  }
});

window.ipcRenderer.on("lol-current-summoner-profile", (_, data) => {
  if (data && loggedInAccount.value > -1) {
    const account = accounts.value[loggedInAccount.value];
    if (data.backgroundSkinId) {
      account.backdrop = data.backgroundSkinId + ".jpg";
    }
    window.ipcRenderer.sendSync("save-account", JSON.stringify(accounts.value));
  }
});
</script>

<template>
  <v-container fluid>
    <v-row align="center" justify="center">
      <h1>{{ msg }}</h1>
    </v-row>
    <v-row align="center" justify="center">
      <v-btn variant="outlined">
        Add Account
        <AddAccountDialog v-bind:accs="accounts" />
      </v-btn>
    </v-row>
    <v-row align="center" justify="center">
      <v-col cols="auto" v-for="(acc, index) in accounts" :key="index">
        <v-progress-linear
        v-show="activeAccount === index"
        height="4"
        color="primary"
        indeterminate
        ></v-progress-linear>
        <v-card class="mx-auto" width="340">
          <template v-slot:prepend>
            <v-avatar>
              <v-img
              :src="
              acc.profile_image_url ||
              `https://ddragon.leagueoflegends.com/cdn/14.6.1/img/profileicon/685.png`
              "
              ></v-img>
            </v-avatar>
          </template>
          <template v-slot:append>
            <v-avatar>
              <v-img
              :src="
              acc.solo_queue?.tier_image_url ||
              'https://static.wikia.nocookie.net/leagueoflegends/images/1/13/Season_2023_-_Unranked.png'
              "
              >
            </v-img>
          </v-avatar>
        </template>
        <template v-slot:image>
          <v-img class="backdrop" cover :src="getBackdropUrl(acc)"></v-img>
        </template>
        
        <template v-slot:title>
          {{ `${acc.displayName}#${acc.displayTag}` }}
        </template>
        <!--<template v-slot:subtitle>
          {{ acc.username }}
        </template>-->
        <template v-slot:subtitle v-if="acc.solo_queue">
          {{ acc.solo_queue?.tier }} {{ acc.solo_queue?.division }} -
          {{ acc.solo_queue?.lp }} lp
        </template>
        <template v-slot:subtitle v-else>Unranked</template>
        <div class="d-flex py-3 justify-space-between">
          <v-list-item density="compact">
            <template v-slot:prepend>
              <v-avatar size="24">
                <v-img
                src="https://static.wikia.nocookie.net/leagueoflegends/images/a/ac/BE_icon.png"
                ></v-img>
              </v-avatar>
            </template>
            <v-list-item-subtitle
            >{{ acc.wallet?.blue_essence }}
          </v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item density="compact" prepend-icon="mdi-weather-pouring">
          <template v-slot:prepend>
            <v-avatar size="24">
              <v-img
              src="https://static.wikia.nocookie.net/leagueoflegends/images/0/00/RP_icon.png"
              ></v-img>
            </v-avatar>
          </template>
          <v-list-item-subtitle>{{
            acc.wallet?.riot_points
          }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <template v-slot:actions>
        <v-btn color="primary" variant="tonal" @click="login(acc, index)"
        >Login</v-btn
        >
        <v-spacer></v-spacer>
        
        <v-btn color="error" variant="tonal" @click="remove(acc)"
        >Delete</v-btn
        >
      </template>
    </v-card>
  </v-col>
</v-row>
</v-container>
</template>

<style scoped>
.backdrop {
  mask-image: radial-gradient(circle at center, transparent, black 200%);
}
</style>
