<script setup lang="ts">
import { ref } from "vue";
import Account from "../shared/Account";

const accs = window.ipcRenderer.sendSync("get-accounts");
const accounts = ref<Account[]>(
  typeof accs == "string" ? JSON.parse(accs) : accs
);
</script>

<template>
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="auto" v-for="(acc, index) in accounts" :key="index">
            <v-skeleton-loader
              class="mx-auto"
              width="278"
              type="card, actions"
              boilerplate
            >
            </v-skeleton-loader>
          </v-col>
        </v-row>
      </v-container>
</template>

<style scoped></style>
