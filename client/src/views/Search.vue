<script setup>
import api from "../stores/api";
import { ref, computed, watchEffect, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import YourWorkIcon from "@/components/icons/YourWorkIcon.vue";
import PensIcon from "@/components/icons/PensIcon.vue";
import ProjectsIcon from "@/components/icons/ProjectsIcon.vue";
import CollectionIcon from "@/components/icons/CollectionIcon.vue";
import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";

const route = useRoute();
const router = useRouter();

// 搜尋狀態管理
const searchResults = ref([]);
const totalCount = ref(0);
const isLoading = ref(false);

const inputKeyword = ref("");
// 搜尋參數
const searchKeyword = ref("");
const itemsPerPage = 6;
const currentPage = ref(1);

const activeTab = computed(() => route.params.category || "pens");

const tabColors = {
  pens: "#0EBEFF",
  projects: "#FFDD40",
  collections: "#AE63E4",
};

// 初次載入時觸發搜尋
onMounted(() => {
  const q = route.query.q || "";
  searchKeyword.value = q;
});

// 監聽網址變化發送 API 請求
watchEffect(async () => {
  const category = route.params.category || "pens";
  const q = route.query.q?.toString() || "";
  const page = currentPage.value;

  // 若沒輸入關鍵字，則清空結果並跳出
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    totalCount.value = 0;
    return;
  }

  inputKeyword.value = q;
  searchKeyword.value = q.toLowerCase();
  isLoading.value = true;

  try {

    const res = await api.get(`/api/search/${category}`, {
      params: {
        q: searchKeyword.value,
        page,
      },
    });

    // 開發期間 debug 用
    console.log("送出搜尋", { category, q, page });

    searchResults.value = res.data.results || [];
    totalCount.value = res.data.total || 0;
  } catch (err) {
    console.error("搜尋失敗", err);
    searchResults.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;

    // 開發期間 debug 用
    console.log("searchResults:", searchResults.value);
    console.log("currentPageCards:", currentPageCards.value);
    console.log("isContent:", isContent.value);
  }
});

const onSearchSubmit = () => {
  console.log(inputKeyword.value);
  currentPage.value = 1;
  searchKeyword.value = inputKeyword.value.toLowerCase();

  router.push({
    path: `/search/${route.params.category || "pens"}`,
    query: { q: inputKeyword.value },
  });
};
// 目前頁面要顯示的卡片
const currentPageCards = computed(() => searchResults.value);

// 計算總頁數
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage));

// 有無搜尋結果
const isContent = computed(() => searchResults.value.length > 0);

const isEmptySearchResult = computed(() => {
  return searchKeyword.value.trim() !== "" && searchResults.value.length === 0;
});

// 換頁方法
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}
</script>
<template>
  <main class="bg-[#131417]">
    <div class="w-full max-w-[75rem] mx-auto px-8 pt-6 relative text-white">
      <div class="px-3 pb-6">
        <div class="mb-6">
          <div
            class="flex flex-wrap items-stretch justify-between ps-2 pt-2.5 border-t-4 bg-[#1E1F26] border-t-[#0EBEFF]"
            :style="{
              borderTopColor: tabColors[activeTab],
            }"
          >
            <div class="w-[300px] h-full mb-2">
              <form
                action=""
                class="bg-[#444857] focus-within:bg-[#5A5F73] rounded-md"
                @submit.prevent="onSearchSubmit"
              >
                <label for="#" class="relative group">
                  <i
                    class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-gray-200"
                  ></i>
                  <input
                    v-model="inputKeyword"
                    class="w-full h-full pl-10 pr-4 py-2 placeholder-gray-400 focus:outline-none group-focus-within:placeholder-gray-200"
                    autocomplete="off"
                    placeholder="Search Codecaine..."
                    type="text"
                    name="q"
                    value
                  />
                </label>
              </form>
            </div>

            <div class="flex space-x-2 pe-2 mb-2">
              <!-- 靜態按鈕 -->
              <a
                href="/your-work"
                class="px-3 py-1 h-full rounded bg-[#4F5465] text-white text-sm hover:bg-[#5A5F73] transition transform active:translate-y-0.5 flex items-center"
              >
                <YourWorkIcon class="fill-current w-3 mr-1.5" />
                Your Work
              </a>
              <a
                href="/search/pens?q="
                class="px-3 py-1 rounded bg-[#4F5465] text-white text-sm hover:bg-[#5A5F73] transition transform active:translate-y-0.5 flex items-center"
              >
                <PensIcon
                  class="fill-current w-3 mr-1.5"
                  :class="{ 'text-[#0EBEFF]': activeTab === 'pens' }"
                />
                Pens
              </a>
              <a
                href="/search/projects?q="
                class="px-3 py-1 rounded bg-[#4F5465] text-white text-sm hover:bg-[#5A5F73] transition transform active:translate-y-0.5 flex items-center"
              >
                <ProjectsIcon
                  class="fill-current w-3 mr-1.5"
                  :class="{ 'text-[#FFDD40]': activeTab === 'projects' }"
                />
                Projects
              </a>
              <a
                href="/search/collections?q="
                class="px-3 py-1 rounded bg-[#4F5465] text-white text-sm hover:bg-[#5A5F73] transition transform active:translate-y-0.5 flex items-center"
              >
                <CollectionIcon
                  class="fill-current w-3 mr-1.5"
                  :class="{ 'text-[#AE63E4]': activeTab === 'collections' }"
                />
                Collections
              </a>
            </div>
          </div>
        </div>

        <div class="SearchPage_content">
          <!-- 搜尋結果 -->
          <div v-if="isContent" class="SearchPage_result_container">
            <div
              class="SearchPage_result_grid grid [grid-template-columns:repeat(auto-fill,minmax(30%,1fr))] gap-12"
            >
              <!-- 作品卡 -->
              <div
                v-for="card in currentPageCards"
                :key="card.id"
                class="card bg-cyan-500 aspect-[4/3]"
              >
                <div>作品標題：{{ card.title }}</div>
                <div>作品描述：{{ card.description }}</div>
                <div>作者： {{ card.username }}</div>
              </div>
            </div>
            <nav class="flex justify-center align-center mt-20 mb-12 gap-3">
              <button
                v-if="currentPage > 1"
                @click="prevPage"
                class="px-4 py-3 bg-[#444857] hover:bg-[#5A5F73] rounded-sm flex gap-1"
              >
                <LeftArrowIcon class="fill-current w-2" />
                Prev
              </button>
              <button
                v-if="currentPage < totalPages"
                @click="nextPage"
                class="px-4 py-3 bg-[#444857] hover:bg-[#5A5F73] rounded-sm mr-2 flex gap-1"
              >
                Next
                <RightArrowIcon class="fill-current w-2" />
              </button>
            </nav>
          </div>
          <!-- 搜尋前提示 -->
          <div
            v-else-if="searchKeyword === ''"
            class="max-w-xl p-8 mb-5 mx-auto bg-[#2C303A] text-center rounded"
          >
            <h1 class="mb-2 leading-[1.1] font-archivo text-4xl">Search</h1>
            <p>
              Enter a search term above to find for Codecaines or Collections.
            </p>
          </div>
          <!-- 搜尋結果為空的提示 -->
          <div
            v-else-if="isEmptySearchResult"
            class="max-w-xl p-8 mb-5 mx-auto bg-[#2C303A] text-center rounded"
          >
            <h1 class="mb-2 leading-[1.1] font-archivo text-4xl">No Results</h1>
            <p>
              Sorry, we couldn’t find any results matching “{{
                searchKeyword
              }}”.
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped></style>

<!-- TODO: 準備載入中畫面 -->
<!-- TODO: 測試搜尋結果超過 6 筆的狀況-->
<!-- TODO: tailwind css refactor -->
<!-- TODO: 把切換 tab 的方式與顯示結果頁面的方式改成 RouterLink 跟 RouterView -->
<!-- TODO: 研究怎麼把分頁邏輯抽出 -->
<!-- TODO: 導入作品卡 -->
