<template>
  <!--路徑的名字profile/cains/shwocase-->
  <!--profile未來會帶入使用者的名字 類似:id/cains/shwocase -->
  <div>
    <div class="pt-4">
      <header class="profile-header">
        <div class="pt-[110px] pb-[75px] text-center">這裡是名字</div>
      </header>
      <div
        class="min-h-14 bg-black relative flex items-center justify-between p-4"
      >
        <div class="grid grid-cols-3 gap-4">
          <a href="">連結1</a><a href="">連結2</a><a href="">連結3</a>
        </div>
        <div
          class="absolute left-1/2 -translate-x-1/2 bottom-0 w-[124px] h-[124px]"
        >
          <img src="#" alt="大頭貼" class="bg-white h-full w-full" />
        </div>
        <div class="flex justify-center items-center gap-4">
          <a href="/profile/following">following</a
          ><a href="/profile/followers">followers</a>
        </div>
      </div>
      <div class="text-center py-4">
        <div>location</div>
        <div class="mt-2">bio簡短介紹自己</div>
      </div>
      <div class="mx-auto max-w-7xl">
        <div class="text-gray-400 border-b-6">
          <button
            class="cursor-pointer hover:text-white p-2"
            @click="Cains"
            :class="route.path.startsWith('/profile/cains') ? 'text-white' : ''"
          >
            Cains
          </button>
          <button
            class="cursor-pointer hover:text-white p-2"
            @click="Following"
            :class="route.path === '/profile/following' ? 'text-white' : ''"
          >
            Following
          </button>
          <button
            class="cursor-pointer hover:text-white p-2"
            @click="Followers"
            :class="route.path === '/profile/followers' ? 'text-white' : ''"
          >
            Followers
          </button>
        </div>
        <div>
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
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
  background-image: url(https://cpwebassets.codepen.io/assets/packs/profile-bg-optimized-a5ca8f46aca292507f629c62b09630ad.svg);
  background-size: cover;
}
</style>
