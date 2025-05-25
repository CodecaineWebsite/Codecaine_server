import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useWorkStore = defineStore('work', () => {
  const workTemplate = ref([
    {
      title: "",
      html: "",
      css: "",
      javascript: "",
      isAutoSave: true,
      isAutoPreview: true,
      viewMode: "center",
      createAt: new Date(),
      lastSavedTime: null,
    }
  ])
  const currentId = ref('123123123123');
  const works = ref([
    {
      id: "123123123123",
      title: "這是測試檔案1",
      html: "<h1>456</h1>",
      css: "h1 {color: blue}",
      javascript: "console.log(456)",
      isAutoSave: true,
      isAutoPreview: true,
      viewMode: "center",
      createAt: new Date(),
      lastSavedTime: null,
      user_id: "0098837589"
    },
    {
      id: "12312398i06o83",
      title: "這是測試檔案2",
      html:"<h1>123</h1>",
      css: "h1 {color: red}",
      javascript:"console.log(123)",
      isAutoSave: true,
      isAutoPreview: true,
      viewMode: "center",
      createAt: new Date(),
      lastSavedTime: null,
      user_id: "0098837589"
    }
  ])

  // 回傳特定(指定id)作品
  const currentWork = computed(() => {
    if(currentId.value.length) {
      return works.value.filter((work) => {
        return work.id === currentId.value
      })
    } else {
      return workTemplate.value
    }
  })


  // 改變currentId function
  const handleCurrentIdChange = (id) => {
    currentId.value = id
  }
  
  // 更新CurrentCode
  const updateCurrentCode = (language, newCode) => {
    currentWork.value[0][language] = newCode
  }

  // 開關自動更新狀態
  const toggleAutoPreview = () => {
    console.log(currentWork.value[0].isAutoPreview);
    currentWork.value[0].isAutoPreview = !currentWork.value[0].isAutoPreview
  }

  // 更新作品Preview function
  const updatePreviewSrc = () => {
    console.log()
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <script defer>
        // Console 覆寫
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info
        };

        ['log', 'error', 'warn', 'info'].forEach(method => {
          console[method] = (...args) => {
            window.parent.postMessage({
              type: 'log',
              message: args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' '),
              level: method
            }, '*');
            originalConsole[method](...args);
          };
        });

        // 創建一個帶有正確文件名的 script 元素
        const script = document.createElement('script');
        script.textContent = '\\n//# sourceURL=user-code.js\\n' + ${JSON.stringify(currentWork.value[0].javascript)};
        
        // 錯誤處理
        window.onerror = function(message, source, lineno, colno, error) {
          let displayLine = lineno;
          // 如果來源是我們的用戶代碼文件
          if (source && source.includes('user-code.js')) {
            displayLine = lineno - 2; // 減去 sourceURL 註釋行數
          }
          
          window.parent.postMessage({
            type: 'log',
            message: '第 ' + displayLine + ' 行錯誤: ' + message,
            level: 'error'
          }, '*');
          return true;
        };

        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({
            type: 'log',
            message: '未處理的 Promise 錯誤: ' + event.reason,
            level: 'error'
          }, '*');
        });

        // 執行用戶代碼
        try {
          document.head.appendChild(script);
        } catch (err) {
          console.error(err.message);
        }
      <\/script>
      <style>${currentWork.value[0].css}</style>
    </head>
    <body>
      ${currentWork.value[0].html}
    </body>
    </html>
    `
  }

  return { 
    currentWork,
    currentId,
    handleCurrentIdChange,
    updateCurrentCode,
    toggleAutoPreview,
    updatePreviewSrc
  }
})
  
  
  // todo:
  // fetch取得作品function 未來的works資料取得
  // 儲存作品function
  // 執行作品function
  // 刪除作品function
 