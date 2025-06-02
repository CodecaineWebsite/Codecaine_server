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

        <div class="ml-auto">
          <button
            v-if="activeTab === 'Collections'"
            class="bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600 rounded-md flex items-center space-x-2"
          >
            <CollectionIcon
              class="fill-current w-3 h-3"
              :class="{ 'text-white': activeTab === 'Collections', 'text-gray-400': activeTab !== 'Collections' }"
            />
            <span>New Collection</span> 
          </button>
          <button
            v-else-if="activeTab === 'Pens' || activeTab === 'Deleted'"
            class="bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600 rounded-md flex items-center space-x-2"
          >
            <PensIcon 
              class="fill-current w-4 h-4"
              :class="{ 'text-white': activeTab === 'Pens' || activeTab === 'Deleted', 'text-gray-400': activeTab !== 'Pens' && activeTab !== 'Deleted' }"
            />
            <span>New Pen</span>
          </button>
        </div>
      </div>

      <!-- Search + Filter Bar -->
      <div>
        <div v-if="activeTab === 'Deleted'" class="border-t-2 border-danger mt-1 mb-4"></div>

        <div v-else class="border-t-2 border-panel bg-panel px-3 py-2 flex justify-between items-center text-sm mb-4">
          <!-- Left Controls -->
          <div class="flex items-center space-x-2 relative">
            <!-- Search -->
            <div class="flex rounded-md overflow-hidden">
              <input
                type="text"
                placeholder="Search for..."
                class="bg-input text-white text-sm px-3 py-1 border border-default placeholder-gray-400 focus:outline-none rounded-l-md"
              />
              <button class="bg-button text-white text-sm px-4 py-1 border border-l-0 border-default bg-button-hover rounded-r-md">
                Search
              </button>
            </div>

            <!-- Filters -->
            <div class="relative">
              <button
                @click="toggleFilters"
                class="flex items-center space-x-2 bg-button text-white text-sm px-3 py-1 border border-default bg-button-hover rounded-md"
              >
                <FiltersIcon class="fill-current w-4 h-4 text-white" />
                <span>Filters</span>
              </button>

              <div v-if="showFilters" class="absolute top-full left-0 mt-2 bg-panel border border-gray-700 rounded-md shadow-lg p-4 w-56 z-50">
                <h3 class="text-sm font-semibold text-white mb-3">Filters</h3>
                <div class="mb-3">
                  <label class="block text-sm mb-1">Privacy</label>
                  <select v-model="filters.privacy" class="w-full px-2 py-1 bg-input text-white border border-default rounded-md">
                    <option>All</option>
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="block text-sm mb-1">Template</label>
                  <select v-model="filters.template" class="w-full px-2 py-1 bg-input text-white border border-default rounded-md">
                    <option>All</option>
                    <option>Template</option>
                    <option>Not Template</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm mb-1">Fork</label>
                  <select v-model="filters.fork" class="w-full px-2 py-1 bg-input text-white border border-default rounded-md">
                    <option>All</option>
                    <option>Forked</option>
                    <option>Not Forked</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <button
              v-if="activeTab === 'Pens'"
              class="flex items-center space-x-1 bg-button text-white text-sm px-3 py-1 border border-default bg-button-hover rounded-md"
            >
              <TagsIcon class="fill-current w-4 h-4 text-white" />
              <span>Tags</span>
            </button>
          </div>

          <!-- Right Controls -->
          <div class="flex items-center space-x-2">
            <!-- View Mode Buttons -->
            <div class="inline-flex rounded-md overflow-hidden border border-default">
              <button
                :class="['px-3 py-2', viewMode === 'grid' ? 'bg-grid-active' : 'bg-button bg-list-hover']"
                @click="viewMode = 'grid'"
              >
                <GridIcon
                  class="fill-current w-4 h-4"
                  :class="{ 'text-white': viewMode === 'grid', 'text-gray-400': viewMode !== 'grid' }"
                />
              </button>
              <button
                :class="['px-3 py-2 border-l border-default', viewMode === 'list' ? 'bg-grid-active' : 'bg-button bg-list-hover']"
                @click="viewMode = 'list'"
              >
                <ListIcon
                  class="fill-current w-4 h-4"
                  :class="{ 'text-white': viewMode === 'list', 'text-gray-400': viewMode !== 'list' }"
                />
              </button>
            </div>

            <!-- Sort Dropdown -->
            <select
              v-model="sortOption"
              class="bg-dropdown text-white px-3 py-1 border border-white rounded-md focus:outline-none"
            >
              <option class="text-black" value="created">Date Created</option>
              <option class="text-black" value="updated">Date Updated</option>
              <option class="text-black" value="popularity">Popularity</option>
            </select>

            <!-- Sort Direction -->
            <div class="inline-flex rounded-md overflow-hidden border border-default">
              <button
                :class="['px-3 py-2', sortDirection === 'desc' ? 'bg-grid-active' : 'bg-button bg-list-hover']"
                @click="sortDirection = 'desc'"
              >
                <DescIcon
                  class="fill-current w-4 h-4"
                  :class="{ 'text-white': sortDirection === 'desc', 'text-gray-400': sortDirection !== 'desc' }"
                />
              </button>
              <button
                :class="['px-3 py-2 border-l border-default', sortDirection === 'asc' ? 'bg-grid-active' : 'bg-button bg-list-hover']"
                @click="sortDirection = 'asc'"
              >
                <AscIcon
                  class="fill-current w-4 h-4"
                  :class="{ 'text-white': sortDirection === 'asc', 'text-gray-400': sortDirection !== 'asc' }"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex items-center justify-center mt-6">
        <div v-if="activeTab === 'Deleted'" class="flex w-full gap-4">
          <div class="flex-1 bg-page text-white p-6 rounded-md">
            <h2 class="text-lg font-semibold mb-4">You don't have any Deleted Items.</h2>
            <p class="text-sm leading-relaxed text-gray-300">
              If you want to save our world, you must hurry. We don't know how much longer we can withstand the nothing.
            </p>
            <p class="mt-3 italic text-gray-400 text-sm">— Southern Oracle, The Neverending Story</p>
          </div>
          <div class="w-64 bg-page text-white p-6 rounded-md flex flex-col items-start">
            <div class="flex items-center text-lg font-bold mb-2">
              <span class="mr-2">🕒 3 Days</span>
            </div>
            <p class="text-sm text-gray-300">
              You’ll be able to restore a Deleted Item for 3 days after you delete it. After that, it’s gone forever.
            </p>
          </div>
        </div>

        <!-- Empty State -->
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

<script setup>
import { ref, computed } from 'vue'

import PensIcon from '@/components/icons/PensIcon.vue'
import FiltersIcon from '@/components/icons/FiltersIcon.vue'
import TagsIcon from '@/components/icons/TagsIcon.vue'
import GridIcon from '@/components/icons/GridIcon.vue'
import ListIcon from '@/components/icons/ListIcon.vue'
import DescIcon from '@/components/icons/DescIcon.vue'
import AscIcon from '@/components/icons/AscIcon.vue'
import CollectionIcon from '@/components/icons/CollectionIcon.vue'

// Tabs
const tabs = ['Pens', 'Collections', 'Deleted']
const activeTab = ref('Pens')

// Filter state
const showFilters = ref(false)
const filters = ref({
  privacy: 'All',
  template: 'All',
  fork: 'All'
})

// View/sort state
const sortOption = ref('created')
const sortDirection = ref('desc')
const viewMode = ref('grid')

// Methods
function createPen() {
  alert(`Create new item in "${activeTab.value}"`)
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}

// Computed empty state message
const emptyStateMessage = computed(() => {
  switch (activeTab.value) {
    case 'Pens': return 'No Pens.'
    case 'Collections': return 'No Collections.'
    default: return 'Nothing here.'
  }
})
</script>
