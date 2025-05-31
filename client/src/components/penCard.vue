<template>
  <div class="min-h-screen bg-[#111] flex items-center justify-center p-8">
    <div
      class="group w-[360px] bg-[#1e1f26] text-white rounded-lg shadow-md
             transition-all duration-300 ease-in-out transform scale-95 translate-y-1
             hover:scale-100 hover:translate-y-0 hover:shadow-2xl relative"
    >
      <!-- 預覽圖片 -->
      <div class="relative">
        <img
          :src="imageUrl"
          @error="imageUrl = fallbackImage"
          alt="Card Preview"
          class="w-full h-auto"
        />
        <a
          :href="externalLink"
          target="_blank"
          class="absolute top-2 right-2 bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition"
        >
          <ExternalLinkIcon />
        </a>
      </div>

      <!-- 卡片內容 -->
      <div class="p-4">
        <div class="flex items-center justify-between w-full">
          <!-- 左：頭像與資訊 -->
          <div class="flex items-center gap-3">
            <a :href="authorLink" target="_blank">
              <img
                :src="authorAvatar"
                class="w-10 h-10 rounded-full shrink-0"
                :alt="author + ' 的頭像'"
              />
            </a>
            <div>
              <a :href="editorLink" target="_blank" class="block font-bold text-base text-white">
                {{ title }}
              </a>
              <a :href="authorLink" target="_blank" class="block text-sm text-gray-300 hover:underline">
                <span class="font-medium">{{ author }}</span>
                <span class="text-xs text-gray-400">{{ authorNote }}</span>
              </a>
            </div>
          </div>

          <!-- PRO 與操作選單 -->
          <div class="flex items-center gap-2">
            <a
              :href="proLink"
              target="_blank"
              class="inline-block bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-[1px] rounded hover:bg-yellow-300 transition"
            >
              PRO
            </a>
            <div class="relative">
              <button
                class="text-white text-xl font-bold hover:text-gray-300"
                @click="menuOpen = !menuOpen"
              >
                •••
              </button>
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-48 bg-[#2b2c36] text-sm rounded shadow-lg z-50 overflow-hidden border border-gray-700"
              >
                <a href="#" class="block px-4 py-2 hover-bg-card-hover flex items-center gap-2">
                  <FolderIcon />
                  Add to Collection
                </a>
                <a href="#" class="block px-4 py-2 hover-bg-card-hover flex items-center gap-2">
                  <BookmarkIcon />
                  Add to Bookmarks
                </a>
                <a href="#" class="block px-4 py-2 hover-bg-card-hover text-blue-400 flex items-center gap-2">
                  <CheckIcon />
                  Follow {{ authorHandle }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部統計按鈕 -->
        <div class="flex gap-2 mt-3">
          <button
            @click="liked = !liked"
            class="flex items-center gap-1 bg-card-muted text-white px-3 py-0.5 rounded-lg font-medium text-sm transition select-none"
          >
            <span :class="liked ? 'text-pink-400' : 'text-white'">
              <HeartFilledIcon v-if="liked" />
              <HeartIcon v-else />
            </span>
            <span>{{ liked ? likes + 1 : likes }}</span>
          </button>

          <button
            @click="goToDetailPage"
            class="flex items-center gap-1 bg-card-dark hover-bg-card-hover text-white px-3 py-0.5 rounded-lg font-medium text-sm"
          >
            <ChatBubbleIcon />
            <span>{{ comments }}</span>
          </button>

          <button
            @click="goToAnalyticsPage"
            class="flex items-center gap-1 bg-card-dark hover-bg-card-hover text-white px-3 py-0.5 rounded-lg font-medium text-sm"
          >
            <EyeIcon />
            <span>{{ views }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import FolderIcon from '@/components/icons/FolderIcon.vue'
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import ChatBubbleIcon from '@/components/icons/ChatBubbleIcon.vue'
import EyeIcon from '@/components/icons/EyeIcon.vue'
import HeartIcon from '@/components/icons/HeartIcon.vue'
import HeartFilledIcon from '@/components/icons/HeartFilledIcon.vue'

const fallbackImage = 'https://via.placeholder.com/600x400?text=No+Preview'
const imageUrl = ref('https://picsum.photos/600/400')
const externalLink = 'https://codepen.io/simeydotme/pen/gObXYZo'
const editorLink = 'https://codepen.io/simeydotme/pen/gObXYZo'
const authorLink = '#'
const authorAvatar = 'https://assets.codepen.io/123/internal/avatars/users/default.png'
const proLink = 'PRO 的購買頁面'
const title = 'RC_mob_5-21'
const author = 'Sophia'
const authorNote = '(fractal kitty) (she/her)'
const authorHandle = '@fractalkitty'
const likes = 2
const comments = 0
const views = '13'

const menuOpen = ref(false)
const liked = ref(false)

const goToDetailPage = () => {
  window.location.href = `/details/rc-mob-5-21`
}

const goToAnalyticsPage = () => {
  window.location.href = `/analytics/rc-mob-5-21`
}
</script>
