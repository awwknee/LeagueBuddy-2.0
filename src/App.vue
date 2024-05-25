<script setup lang="ts">
import { ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
import SkeletonCard from "./components/SkeletonCard.vue";
import AccountSwitcher from "./components/AccountSwitcher.vue";

window.ipcRenderer.on("update-available", () => {
  snackbar.value = true;
  text.value =
    "There is an update for LeagueBuddy available. Downloading in the background now.";
});

window.ipcRenderer.on("update-downloaded", () => {
  snackbar.value = true;
  text.value =
    "The latest update for Leaguebuddy has been downloaded. You may restart now to apply it.";
});

const accepted = ref(false);

window.ipcRenderer.on("lol-matchmaking-search", async (_, data) => {
  if (data === null) {
    accepted.value = false;
    return;
  }

  console.log(data.searchState);
  switch (data.searchState) {
    case "Searching":
      accepted.value = false;
      break;
    case "Found":
      if (accepted.value === false) {
        accepted.value = true;
        snackbar.value = true;
        text.value = "Match found! Accepting it now.";
        await window.ipcRenderer.invoke("lol-matchmaking-accept");
      }
  }
});

const snackbar = ref(false);
const text = ref("");
</script>

<template>
  <v-layout>
    <!--<v-navigation-drawer :width="300" :v-model="null" location="left">
      <template #prepend>
        <account-switcher />
      </template>

      <v-divider></v-divider>

      <v-list-item link title="Dashboard">
        
      </v-list-item>
      <v-list-item link title="Match History"></v-list-item>
      <v-list-item link title="Runes"></v-list-item>
      <v-list-item link title="Developer"></v-list-item>
    </v-navigation-drawer>-->
    <v-main>
      <KeepAlive>
        <suspense>
          <HelloWorld msg="Accounts" />
          <template #fallback>
            <SkeletonCard />
          </template>
        </suspense>
      </KeepAlive>
      <div class="text-center ma-2">
        <v-snackbar v-model="snackbar">
          {{ text }}

          <template v-slot:actions>
            <v-btn color="primary" variant="text" @click="snackbar = false">
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </div>
    </v-main>
  </v-layout>
</template>

<style></style>
