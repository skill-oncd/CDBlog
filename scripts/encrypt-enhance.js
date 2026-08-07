'use strict';

const STORAGE_KEY = 'hbeTimestamp';
const EXPIRE_DAYS = 7;

// CSS injected into pages with encrypted content
const CUSTOM_CSS = `
<style id="hbe-custom-style">
/* ============================================================
 * 毛玻璃密码门禁 — 覆盖 hexo-blog-encrypt default 主题
 * ============================================================ */

/* --- 容器：毛玻璃卡片 --- */
.hbe-container {
  position: relative;
  max-width: 420px;
  margin: 2.5rem auto 1.2rem auto;
  padding: 1.6rem 2rem 1.2rem 2rem;
  border-radius: 16px;
  background: rgba(255,255,255,0.30);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
}

/* --- 顶部标题 --- */
.hbe-container::before {
  content: "此内容访问受限";
  display: block;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.8rem;
  line-height: 1;
  letter-spacing: 0.03em;
}

/* --- 表单 --- */
.hbe-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  width: 100%;
}

/* ===== 彻底干掉 default 主题的动画 label ===== */
.hbe-input-default {
  overflow: visible !important;
  width: 100% !important;
  margin: 0 !important;
}
.hbe-input-label-default {
  display: none !important;
}
.hbe-input-label-default::before,
.hbe-input-label-default::after {
  display: none !important;
  content: none !important;
}

/* --- 提示文字：隐藏（placeholder 已说明） --- */
.hbe-input-label-content-default {
  display: none !important;
}

/* --- 输入框 --- */
.hbe-input-field-default {
  display: block !important;
  width: 100% !important;
  float: none !important;
  padding: 0.7rem 1rem !important;
  margin: 0 !important;
  background: rgba(245,245,245,0.85) !important;
  color: #333 !important;
  border: 1.5px solid rgba(0,0,0,0.10) !important;
  border-radius: 10px !important;
  font-size: 1rem !important;
  opacity: 1 !important;
  outline: none !important;
  z-index: auto !important;
  transition: border-color 0.25s, background 0.25s, box-shadow 0.25s !important;
}
.hbe-input-field-default::placeholder {
  color: #bbb;
  font-size: 0.95rem;
}
.hbe-input-field-default:focus {
  border-color: #4d8df0 !important;
  background: rgba(255,255,255,0.95) !important;
  box-shadow: 0 0 0 3px rgba(77,141,240,0.15) !important;
}
.hbe-input-field-default:focus::placeholder {
  color: #ccc;
}

/* --- 解密按钮 --- */
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
  border-radius: 10px !important;
  text-align: center !important;
  text-indent: 0 !important;
  text-shadow: none !important;
  box-shadow: 0 2px 8px rgba(42,122,226,0.30) !important;
  cursor: pointer !important;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s !important;
  margin: 0 auto !important;
}
.hbe-button:hover {
  background: #1c5db8 !important;
  box-shadow: 0 4px 14px rgba(42,122,226,0.40) !important;
}
.hbe-button:active {
  transform: scale(0.98);
}
.hbe-button::after {
  display: none !important;
  content: none !important;
}
.hbe-button-hidden {
  display: none !important;
}

/* --- 错误提示 --- */
.hbe-error {
  text-align: center;
  color: #d93025 !important;
  font-size: 0.88rem !important;
  min-height: 1.2em;
  margin-top: 0.2rem;
}

/* --- spinner --- */
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

/* ============================================================
 * 暗色模式 — 匹配 Butterfly [data-theme="dark"]
 * ============================================================ */
[data-theme="dark"] .hbe-container,
html[data-theme="dark"] .hbe-container {
  background: rgba(20,22,36,0.35);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.15);
}
[data-theme="dark"] .hbe-container::before,
html[data-theme="dark"] .hbe-container::before {
  color: #c8ccd4;
}
[data-theme="dark"] .hbe-input-label-content-default,
html[data-theme="dark"] .hbe-input-label-content-default {
  color: #c8ccd4 !important;
}
[data-theme="dark"] .hbe-input-field-default,
html[data-theme="dark"] .hbe-input-field-default {
  background: rgba(40,42,54,0.85) !important;
  color: #e6e6e6 !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .hbe-input-field-default:focus,
html[data-theme="dark"] .hbe-input-field-default:focus {
  border-color: #6ba1f5 !important;
  background: rgba(40,42,54,0.95) !important;
  box-shadow: 0 0 0 3px rgba(107,161,245,0.20) !important;
}
[data-theme="dark"] .hbe-button,
html[data-theme="dark"] .hbe-button {
  background: #4d8df0 !important;
  box-shadow: 0 2px 8px rgba(77,141,240,0.35) !important;
}
[data-theme="dark"] .hbe-button:hover,
html[data-theme="dark"] .hbe-button:hover {
  background: #6ba1f5 !important;
}
[data-theme="dark"] .hbe-error,
html[data-theme="dark"] .hbe-error {
  color: #ff7a7a !important;
}

/* ============================================================
 * 移动端
 * ============================================================ */
@media (max-width: 520px) {
  .hbe-container {
    margin: 1.2rem 0.6rem;
    padding: 2rem 1.2rem;
    border-radius: 14px;
  }
  .hbe-container::before {
    font-size: 2rem;
    margin-bottom: 0.7rem;
  }
  .hbe-input-label-content-default {
    font-size: 0.98rem !important;
  }
}
</style>`;

// Part A: expiry check — runs BEFORE the hbe bundle (synchronous, injected right before <script data-pjax>)
const EXPIRY_CHECK_JS = `
<script>
(function() {
  var TIMESTAMP_KEY = '${STORAGE_KEY}';
  var EXPIRE_MS = ${EXPIRE_DAYS} * 24 * 60 * 60 * 1000;
  var now = new Date().getTime();
  var saved = localStorage.getItem(TIMESTAMP_KEY);
  if (saved) {
    var age = now - parseInt(saved, 10);
    if (age > EXPIRE_MS) {
      // Clear expired hbe keys BEFORE the bundle loads
      var toRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('hbe') === 0) toRemove.push(k);
      }
      for (var r = 0; r < toRemove.length; r++) localStorage.removeItem(toRemove[r]);
      localStorage.removeItem(TIMESTAMP_KEY);
    }
  }
})();
</script>`;

// Part B: timestamp refresh — runs AFTER the hbe bundle (at </body>)
const REFRESH_JS = `
<script>
(function() {
  var TIMESTAMP_KEY = '${STORAGE_KEY}';

  function refresh() {
    localStorage.setItem(TIMESTAMP_KEY, String(new Date().getTime()));
  }

  function setup() {
    var container = document.getElementById('hexo-blog-encrypt');
    if (!container) return;

    // 0. Add placeholder to password input
    var passField = document.getElementById('hbePass');
    if (passField) { passField.placeholder = '请输入密码'; }

    // 1. On form submit, refresh timestamp immediately (before decrypt finishes)
    var form = document.getElementById('hbeForm');
    if (form) {
      form.addEventListener('submit', function() { refresh(); });
    }

    // 2. If already auto-decrypted on load (key was cached & valid), refresh timestamp
    var passField = document.getElementById('hbePass');
    if (passField && passField.style.display === 'none') {
      // Input hidden means already decrypted
      refresh();
    }

    // 3. Watch for container removal (successful decrypt)
    var observer = new MutationObserver(function(mutations) {
      for (var m = 0; m < mutations.length; m++) {
        for (var n = 0; n < mutations[m].removedNodes.length; n++) {
          if (mutations[m].removedNodes[n].id === 'hexo-blog-encrypt') {
            refresh();
            observer.disconnect();
            return;
          }
        }
      }
    });
    if (container.parentNode) {
      observer.observe(container.parentNode, { childList: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
</script>`;

// Hexo filter: inject CSS + JS only into pages that contain encrypted content
hexo.extend.filter.register('after_render:html', function(html, data) {
  if (!html.includes('hbe-container')) return html;

  // 1) CSS → <head>
  html = html.replace('</head>', CUSTOM_CSS + '\n</head>');

  // 2) Expiry check → BEFORE the plugin's bundle <script> tag, so stale keys
  //    are cleared synchronously before the bundle tries to auto-decrypt.
  html = html.replace(
    /(<script[^>]*data-pjax[^>]*src="[^"]*hbe\.[0-9a-f]{10}\.js"[^>]*><\/script>)/,
    EXPIRY_CHECK_JS + '\n$1'
  );

  // 3) Timestamp refresh hook → </body>
  html = html.replace('</body>', REFRESH_JS + '\n</body>');

  return html;
}, 10);
