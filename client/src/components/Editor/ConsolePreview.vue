<script setup>
  import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
  // 控制台輸出的狀態
  const logs = ref([])

  const handleMessage = (e) => {
    if (e.data?.type === 'log') {
      logs.value.push({
        level: e.data.level,
        message: e.data.message
      });
    }
  }

  const consoleClear = () => {
    logs.value = []
  }
  defineExpose({ consoleClear });
  // 監聽 message 事件
  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
  })

  const consoleContainer = ref(null)
  watch(
    () => logs.value.length,
    async () => {
      await nextTick(); // 等待 DOM 更新
      const el = consoleContainer.value;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  );

</script>

<template>
  <div class="output overflow-y-auto font-size-15 flex-1" ref="consoleContainer">
    <ul class="space-y-1" >
      <li
        v-for="(log, index) in logs"
        :key="index"
        class="border-b last:border-b-0 py-1.5 px-3 editor-resizer-border-color text-[#b5cea8] m-0 min-h-[35px]" 
        :class="{
          'bg-red-500/20 text-white': log.level === 'error',
          'bg-yellow-200/15 text-lime-300': log.level === 'warn',
          'bg-white/20 text-lime-300': log.level === 'info'
        }"
      >
        <div>
          {{ log.message }}
        </div>
      </li>
    </ul>
  </div>
  <!-- todo : input 可以自行輸入console並執行 -->
  <!-- <div class="flex items-center bg-gray-700">
    <span class="inline-block ml-3"> > </span>
    <textarea type="text" class="w-full h-8 px-3  outline-none" autofocus spellcheck="false">
    </textarea>
  </div> -->
</template>