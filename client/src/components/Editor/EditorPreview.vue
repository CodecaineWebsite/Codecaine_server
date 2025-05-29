<script setup>
  import { ref, watch, onMounted } from 'vue';
  import { useWorkStore } from '@/stores/workStore';
  const workStore = useWorkStore();
  const { currentWork, updatePreviewSrc }= workStore;

  // debounce
  function debounce(func, wait = 1000) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  const previewFrame = ref(null)

  // 更新 iframe 內容（加防抖處理）
  const updateIframe = debounce(() => {
    if (!previewFrame.value) return
    previewFrame.value.srcdoc = updatePreviewSrc()
  }, 1000)

  onMounted(() => {
   updateIframe()
  });

  // 監聽是否啟用自動預覽
  watch(
    () => [currentWork.html, currentWork.css, currentWork.javascript],
    () => {
      if (currentWork.isAutoPreview) updateIframe()
    }
  )

</script>
<template>
  <iframe ref="previewFrame" sandbox="allow-scripts" class="h-full w-full"></iframe>
</template>

