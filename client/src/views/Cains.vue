<template>
  <h1>Cains</h1>
  <div>
    <button @click="showcase">Showcase</button>
    <button @click="publicProfile">Public</button>
    <button @click="loved">Loved</button>
    <button @click="privateProfile">Private</button>
  </div>
  <RouterView />
</template>

<script setup>
import { RouterView } from "vue-router";
import { useRouter } from "vue-router";

const router = useRouter();
const showcase = () => {
  router.push("/profile/cains/showcase");
};
const publicProfile = () => {
  router.push("/profile/cains/public");
};
const loved = () => {
  router.push("/profile/cains/loved");
};
const privateProfile = () => {
  router.push("/profile/cains/private");
};
</script>

<style scoped>
button {
  background-color: #05df72;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
}
</style>
