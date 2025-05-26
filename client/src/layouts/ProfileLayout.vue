<template>
  <div>
    <div>
      <header class="profile-header">
        <div class="profile-info">
          <h1>Profile</h1>
          <button @click="Cains">Cains</button>
          <button @click="Following">Following</button>
          <button @click="Followers">Followers</button>
        </div>
      </header>
    </div>
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import { useRouter } from "vue-router";
const router = useRouter();
const Cains = () => {
  router.push("/profile/cains");
};
const Following = () => {
  router.push("/profile/following");
};
const Followers = () => {
  router.push("/profile/followers");
};
</script>

<style scoped>
.profile-header {
  background-color: #131417;
  color: white;
  padding: 20px;
  border-bottom: 3px solid #2c303a;
}
button {
  background-color: #05df72;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 5px;
  cursor: pointer;
}
</style>
