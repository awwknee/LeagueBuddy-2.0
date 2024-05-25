<script setup lang="ts">
import { ref } from "vue";
import Account from "../shared/Account";
const dialog = ref(false);

const username = ref('');
const password = ref('');
const displayName = ref('');
const displayTag = ref('');

const props = defineProps<{ accs: Account[] }>();


async function addAccount() {
    props.accs.push({ username: username.value, password: password.value, displayName: displayName.value, displayTag: displayTag.value });
    dialog.value = false
    username.value = '';
    password.value = '';
    displayName.value = '';
    displayTag.value = '';
    window.ipcRenderer.sendSync('save-account', JSON.stringify(props.accs));
}

</script>

<template>
  <v-dialog v-model="dialog" activator="parent" max-width="600">
    <template v-slot:default="{ isActive }">
      <v-card prepend-icon="mdi-account" title="New Account">
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field v-model="username" label="Username" required></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field v-model="password"
                label="Password"
                type="password"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field v-model="displayName"
                label="Summoner Name*"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field v-model="displayTag"
                label="Summoner Tag*"
              ></v-text-field>
            </v-col>

          </v-row>

          <small class="text-caption text-medium-emphasis"
            >* will be filled in the next time you login if left unfilled</small
          >
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn
            text="Close"
            variant="plain"
            @click="isActive.value = false"
          ></v-btn>

          <v-btn
            color="primary"
            text="Save"
            variant="tonal"
            @click="addAccount"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped></style>
