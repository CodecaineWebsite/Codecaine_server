<template>
  <div>
    <div class="text-gray-400 flex gap-4 bg-[#2C303A] p-4">
      <button
        class="cursor-pointer hover:text-white"
        @click="showcase"
        :class="route.path === '/profile/cains/showcase' ? 'text-white' : ''"
      >
        Showcase
      </button>
      <button
        class="cursor-pointer hover:text-white"
        @click="publicProfile"
        :class="route.path === '/profile/cains/public' ? 'text-white' : ''"
      >
        Public
      </button>
      <button
        class="cursor-pointer hover:text-white"
        @click="privateProfile"
        :class="route.path === '/profile/cains/private' ? 'text-white' : ''"
      >
        Private
      </button>
      <button
        class="cursor-pointer hover:text-white"
        @click="loved"
        :class="route.path === '/profile/cains/loved' ? 'text-white' : ''"
      >
        Loved
      </button>
    </div>
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
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

<style scoped></style>
