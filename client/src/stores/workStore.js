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
    const jsCode = currentWork.value[0].javascript + '\n//# sourceURL=user-code.js';
    const cssCode = currentWork.value[0].css;
    const htmlCode = currentWork.value[0].html;
  
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>${cssCode}</style>
      <script defer>
        // Override console methods to send logs to parent
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
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' '),
              level: method
            }, '*');
            originalConsole[method](...args);
          };
        });
  
        // Global error handler
        window.onerror = function(message, source, lineno, colno, error) {
          const errorMsg = error
            ? \`\${error.name}: \${error.message}\`
            : message;
          window.parent.postMessage({
            type: 'log',
            message: \`\${errorMsg}\\nSource: \${source}\\nLine: \${lineno}, Column: \${colno}\`,
            level: 'error'
          }, '*');
          return true;
        };
  
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({
            type: 'log',
            message: 'Unhandled Promise rejection: ' + (event.reason?.stack || event.reason),
            level: 'error'
          }, '*');
        });
  
        // Inject user code via Blob script
        const code = ${JSON.stringify(jsCode)};
        const blob = new Blob([code], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
  
        const script = document.createElement('script');
        script.src = blobUrl;
  
        script.onload = () => {
          URL.revokeObjectURL(blobUrl);
        };
  
        script.onerror = () => {
          window.parent.postMessage({
            type: 'log',
            message: 'Script loading error',
            level: 'error'
          }, '*');
        };
  
        document.head.appendChild(script);
      <\/script>
    </head>
    <body>
      ${htmlCode}
    </body>
    </html>
    `;
  };


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
 