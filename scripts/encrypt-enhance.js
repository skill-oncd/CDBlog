'use strict';

const STORAGE_KEY = 'hbeTimestamp';
const EXPIRE_DAYS = 7;

// CSS injected into pages with encrypted content
const CUSTOM_CSS = `
<style id="hbe-custom-style">
/* === 密码提示容器 === */
.hbe-container {
  max-width: 460px;
  margin: 3rem auto;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  background: var(--card-bg, #fff);
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  border: 1px solid var(--border-color, #e8e8e8);
}

/* === 表单布局 === */
.hbe-form {
  gap: 1.2rem;
}

/* === 提示文字 === */
.hbe-input-label-content-default {
  color: var(--text-color, #555) !important;
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  text-align: center;
  padding: 0 !important;
}

/* === 输入框 === */
.hbe-input-field-default {
  width: 100% !important;
  padding: 0.75rem 1rem !important;
  margin-bottom: 0 !important;
  background: var(--input-bg, #f5f5f5) !important;
  color: var(--text-color, #333) !important;
  border: 2px solid transparent !important;
  border-radius: 8px !important;
  font-size: 1rem !important;
  opacity: 1 !important;
  outline: none !important;
  transition: border-color 0.2s, background 0.2s !important;
}
.hbe-input-field-default:focus {
  border-color: #4d8df0 !important;
  background: var(--card-bg, #fff) !important;
}

/* === 解密按钮 === */
.hbe-button {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  padding: 0.75rem 1.5rem !important;
  background: #2a7ae2 !important;
  color: #fff !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  border: none !important;
  border-radius: 8px !important;
  text-align: center !important;
  text-indent: 0 !important;
  text-shadow: none !important;
  box-shadow: none !important;
  cursor: pointer !important;
  transition: background 0.2s, transform 0.1s !important;
  margin: 0 auto !important;
}
.hbe-button:hover {
  background: #1c5db8 !important;
}
.hbe-button:active {
  transform: scale(0.98);
}
.hbe-button::after {
  display: none !important;
}

/* === 错误提示 === */
.hbe-error {
  text-align: center;
  color: #e05555 !important;
  font-size: 0.9rem !important;
  min-height: 1.2em;
}

/* === 加载动画 === */
.hbe-button[aria-busy="true"]::after {
  content: "";
  display: inline-block;
  margin-left: 0.5em;
  width: 0.9em;
  height: 0.9em;
  vertical-align: -0.15em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: hbe-spin 0.7s linear infinite;
}
@keyframes hbe-spin {
  to { transform: rotate(360deg); }
}

/* === 暗色模式 === */
[data-theme="dark"] .hbe-container,
.dark-mode .hbe-container,
html[data-theme="dark"] .hbe-container {
  --card-bg: #1e2030;
  --border-color: #2e3040;
  --text-color: #c8ccd4;
  --input-bg: #282a36;
}

/* === 移动端 === */
@media (max-width: 520px) {
  .hbe-container {
    margin: 1.5rem 0.5rem;
    padding: 1.8rem 1.2rem;
  }
}
</style>`;

// JS injected for 7-day localStorage expiry
const CUSTOM_JS = `
<script>
(function() {
  var TIMESTAMP_KEY = '${STORAGE_KEY}';
  var EXPIRE_MS = ${EXPIRE_DAYS} * 24 * 60 * 60 * 1000;

  function now() { return new Date().getTime(); }

  // Check if saved password is still within 7-day window
  function checkExpiry() {
    var saved = localStorage.getItem(TIMESTAMP_KEY);
    if (saved) {
      var age = now() - parseInt(saved, 10);
      if (age > EXPIRE_MS) {
        // Expired — clear all hbe-related localStorage entries
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          keys.push(localStorage.key(i));
        }
        for (var j = 0; j < keys.length; j++) {
          if (keys[j] && keys[j].indexOf('hbe') === 0) {
            localStorage.removeItem(keys[j]);
          }
        }
        localStorage.removeItem(TIMESTAMP_KEY);
      }
    }
  }

  // Refresh timestamp after successful decrypt
  function refreshTimestamp() {
    localStorage.setItem(TIMESTAMP_KEY, String(now()));
  }

  // Hook into the decrypt button click and Enter key
  function setupHook() {
    var form = document.getElementById('hbeForm');
    if (!form) return;

    form.addEventListener('submit', function() {
      // Wait a moment for autoSave to store the key, then refresh timestamp
      setTimeout(refreshTimestamp, 500);
    });
  }

  // Run on load
  checkExpiry();

  // Setup hook after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHook);
  } else {
    setupHook();
  }

  // Also expose manual refresh in case auto-detection misses
  window.__hbeRefreshTimestamp = refreshTimestamp;
  window.__hbeCheckExpiry = checkExpiry;
})();
</script>`;

// Hexo filter: inject CSS + JS only into pages that contain encrypted content
hexo.extend.filter.register('after_render:html', function(html, data) {
  // Only inject on pages with encryption container
  if (!html.includes('hbe-container')) return html;

  // Inject CSS before </head>
  html = html.replace('</head>', CUSTOM_CSS + '\n</head>');

  // Inject JS before </body>
  html = html.replace('</body>', CUSTOM_JS + '\n</body>');

  return html;
}, 10);
