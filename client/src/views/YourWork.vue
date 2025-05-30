<template>
  <div class="bg-gray-900 text-white min-h-screen flex flex-col relative">
    <div class="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

      <!-- Tabs Header -->
      <div class="flex items-center space-x-6 text-sm font-semibold pt-4 pb-1 text-[16.5px]">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          :class="[activeTab === tab ? 'text-white font-semibold' : 'text-gray-400 hover:text-white']"
        >
          {{ tab }}
        </button>

        <!-- New Button -->
        <div class="ml-auto">
          <button
            v-if="activeTab === 'Pens' || activeTab === 'Collections'"
            class="bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600 rounded-md"
          >
            🗓 {{ activeTab === 'Collections' ? 'New Collection' : 'New Pen' }}
          </button>
        </div>
      </div>

      <!-- Search + Filter Bar -->
      <div>
        <div v-if="activeTab === 'Deleted'" class="border-t-2 border-red-600 mt-1 mb-4"></div>

        <div v-else class="border-t-2 border-[#2d2e36] bg-[#1E1F26] px-3 py-2 flex justify-between items-center text-sm mb-4">
          <!-- Left Controls -->
          <div class="flex items-center space-x-2 relative">
            <div class="flex rounded-md overflow-hidden">
              <input
                type="text"
                placeholder="Search for..."
                class="bg-[#2f2f3a] text-white text-sm px-3 py-1 border border-[#444654] placeholder-gray-400 focus:outline-none rounded-l-md"
              />
              <button class="bg-[#3c3f4a] text-white text-sm px-4 py-1 border border-l-0 border-[#444654] hover:bg-[#4a4e5c] rounded-r-md">
                Search
              </button>
            </div>

            <!-- Filters -->
            <div class="relative">
              <button
                @click="toggleFilters"
                class="flex items-center space-x-1 bg-[#3c3f4a] text-white text-sm px-3 py-1 border border-[#444654] hover:bg-[#4a4e5c] rounded-md"
              >
                <span>⚙️</span><span>Filters</span>
              </button>

              <div
                v-if="showFilters"
                class="absolute top-full left-0 mt-2 bg-[#1e1f26] border border-gray-700 rounded-md shadow-lg p-4 w-56 z-50"
              >
                <h3 class="text-sm font-semibold text-white mb-3">Filters</h3>
                <div class="mb-3">
                  <label class="block text-sm mb-1">Privacy</label>
                  <select v-model="filters.privacy" class="w-full px-2 py-1 bg-[#2f2f3a] text-white border border-[#444654] rounded-md">
                    <option>All</option>
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="block text-sm mb-1">Template</label>
                  <select v-model="filters.template" class="w-full px-2 py-1 bg-[#2f2f3a] text-white border border-[#444654] rounded-md">
                    <option>All</option>
                    <option>Template</option>
                    <option>Not Template</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm mb-1">Fork</label>
                  <select v-model="filters.fork" class="w-full px-2 py-1 bg-[#2f2f3a] text-white border border-[#444654] rounded-md">
                    <option>All</option>
                    <option>Forked</option>
                    <option>Not Forked</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tags only for Pens -->
            <button
              v-if="activeTab === 'Pens'"
              class="flex items-center space-x-1 bg-[#3c3f4a] text-white text-sm px-3 py-1 border border-[#444654] hover:bg-[#4a4e5c] rounded-md"
            >
              <span>➕</span><span>Tags</span>
            </button>
          </div>

          <!-- Right Controls -->
          <div class="flex items-center space-x-2">
            <!-- View Mode Buttons -->
            <div class="inline-flex rounded-md overflow-hidden border border-[#444654]">
              <button
                :class="[
                  'px-3 py-2',
                  viewMode === 'grid' ? 'bg-[#71738a]' : 'bg-[#3c3f4a] hover:bg-[#4A4B55]'
                ]"
                @click="viewMode = 'grid'"
              >
                🔲
              </button>
              <button
                :class="[
                  'px-3 py-2 border-l border-[#444654]',
                  viewMode === 'list' ? 'bg-[#71738a]' : 'bg-[#3c3f4a] hover:bg-[#4A4B55]'
                ]"
                @click="viewMode = 'list'"
              >
                📋
              </button>
            </div>

            <!-- Sort Dropdown -->
            <select
              v-model="sortOption"
              class="bg-[#2A2B32] text-white px-3 py-1 border border-white rounded-md focus:outline-none"
            >
              <option class="text-black" value="created">Date Created</option>
              <option class="text-black" value="updated">Date Updated</option>
              <option class="text-black" value="popularity">Popularity</option>
            </select>

            <div class="inline-flex rounded-md overflow-hidden border border-[#444654]">
              <button
                :class="[
                  'px-3 py-2',
                  sortDirection === 'desc' ? 'bg-[#71738a]' : 'bg-[#3c3f4a] hover:bg-[#4A4B55]'
                ]"
                @click="sortDirection = 'desc'"
              >
                ⬇️
              </button>
              <button
                :class="[
                  'px-3 py-2 border-l border-[#444654]',
                  sortDirection === 'asc' ? 'bg-[#71738a]' : 'bg-[#3c3f4a] hover:bg-[#4A4B55]'
                ]"
                @click="sortDirection = 'asc'"
              >
                ⬆️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex items-center justify-center mt-6">
        <div v-if="activeTab === 'Deleted'" class="flex w-full gap-4">
          <div class="flex-1 bg-[#2a2b32] text-white p-6 rounded-md">
            <h2 class="text-lg font-semibold mb-4">You don't have any Deleted Items.</h2>
            <p class="text-sm leading-relaxed text-gray-300">
              If you want to save our world, you must hurry. We don't know how much longer we can withstand the nothing.
            </p>
            <p class="mt-3 italic text-gray-400 text-sm">— Southern Oracle, The Neverending Story</p>
          </div>
          <div class="w-64 bg-[#2a2b32] text-white p-6 rounded-md flex flex-col items-start">
            <div class="flex items-center text-lg font-bold mb-2">
              <span class="mr-2">🕒</span> 3 Days
            </div>
            <p class="text-sm text-gray-300">
              You’ll be able to restore a Deleted Item for 3 days after you delete it. After that, it’s gone forever.
            </p>
          </div>
        </div>

        <!-- Other Tabs Empty State -->
        <div v-else class="border border-dashed border-gray-700 px-10 py-10 text-center rounded-md">
          <p class="text-lg font-semibold mb-4">{{ emptyStateMessage }}</p>
          <button
            @click="createPen"
            class="bg-green-500 text-black font-medium px-4 py-2 hover:bg-green-400 rounded-md"
          >
            Go make one!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tabs: ['Pens', 'Collections', 'Deleted'],
      activeTab: 'Pens',
      showFilters: false,
      sortOption: 'created',
      sortDirection: 'desc',
      viewMode: 'grid',
      filters: {
        privacy: 'All',
        template: 'All',
        fork: 'All'
      }
    };
  },
  computed: {
    emptyStateMessage() {
      switch (this.activeTab) {
        case 'Pens': return 'No Pens.';
        case 'Collections': return 'No Collections.';
        default: return 'Nothing here.';
      }
    }
  },
  methods: {
    createPen() {
      alert(`Create new item in "${this.activeTab}"`);
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    }
  }
};
</script>