<script setup lang="ts">
import { ref } from "vue";
import Account from "../shared/Account";

const show = ref(false);

const accs = window.ipcRenderer.sendSync("get-accounts");

const accounts = ref<Account[]>(
  typeof accs == "string" ? JSON.parse(accs) : accs
);
</script>

<template>
  <v-card variant="flat" class="mx-auto" max-width="344">
    <template #image>
      <v-img
        class="backdrop"
        height="128"
        cover
        src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/9/9006.jpg"
      ></v-img>
    </template>
    <template #prepend>
      <v-avatar>
        <v-img
          src="https://ddragon.leagueoflegends.com/cdn/14.6.1/img/profileicon/685.png"
        ></v-img>
      </v-avatar>
    </template>
    <template #title> Bloby Blob#breed </template>
    <template #subtitle> Bloby Blob </template>
    <template #actions>
      <v-spacer></v-spacer>
      <v-menu location="end">
        <template v-slot:activator="{ props }">
          <v-btn
            size="24"
            icon="mdi-chevron-right"
            v-bind="props"
          ></v-btn>
        </template>

        <v-list>
          <v-list-item
            v-for="(item, index) in accounts"
            :key="index"
          >
            <v-list-item-title>{{
              `${item.displayName}#${item.displayTag}`
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-card>
</template>

<style>
.backdrop {
  mask-image: radial-gradient(circle at center, transparent, black 200%);
}
</style>
