/* 可选增强：核心文案与所有外部链接在禁用 JavaScript 时仍可正常使用。 */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const featureButton = document.querySelector('.features-toggle');
  const featureGrid = document.getElementById('feature-grid');
  const downloadModal = document.getElementById('download-modal');
  const downloadDialog = downloadModal ? downloadModal.querySelector('.download-dialog') : null;
  const downloadOpeners = document.querySelectorAll('[data-open-download]');
  const downloadClosers = downloadModal ? downloadModal.querySelectorAll('[data-close-download]') : [];
  let downloadDialogTrigger = null;
  let downloadDialogTimer;
  const copyButton = document.querySelector('.copy-button');
  const toast = document.getElementById('toast');
  let toastTimer;
  let manualTheme = null;
  try { manualTheme = localStorage.getItem('smart-storage-theme'); } catch (_) {}

  function setTheme(theme, remember = false) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    themeButton.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    if (remember) {
      manualTheme = theme;
      try { localStorage.setItem('smart-storage-theme', theme); } catch (_) {}
    }
  }
  setTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
  systemTheme.addEventListener('change', event => {
    if (manualTheme !== 'light' && manualTheme !== 'dark') setTheme(event.matches ? 'dark' : 'light');
  });

  function setMenu(open, returnFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    navigation.classList.toggle('is-open', open);
    if (returnFocus) menuButton.focus();
  }
  function setDownloadTriggerExpanded(expanded) {
    downloadOpeners.forEach(button => button.setAttribute('aria-expanded', String(expanded)));
  }

  function openDownloadDialog(trigger) {
    if (!downloadModal || !downloadDialog) return;
    window.clearTimeout(downloadDialogTimer);
    downloadDialogTrigger = trigger;
    setMenu(false);
    downloadModal.hidden = false;
    window.requestAnimationFrame(() => downloadModal.classList.add('is-open'));
    document.body.classList.add('has-download-open');
    setDownloadTriggerExpanded(true);
    downloadDialog.focus({ preventScroll: true });
  }

  function closeDownloadDialog() {
    if (!downloadModal || downloadModal.hidden) return;
    downloadModal.classList.remove('is-open');
    document.body.classList.remove('has-download-open');
    setDownloadTriggerExpanded(false);
    window.clearTimeout(downloadDialogTimer);
    downloadDialogTimer = window.setTimeout(() => {
      downloadModal.hidden = true;
      if (downloadDialogTrigger) downloadDialogTrigger.focus({ preventScroll: true });
      downloadDialogTrigger = null;
    }, 180);
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a, button[data-open-download]')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (downloadModal && !downloadModal.hidden && event.key === 'Escape') {
      event.preventDefault();
      closeDownloadDialog();
      return;
    }
    if (downloadModal && !downloadModal.hidden && event.key === 'Tab') {
      const focusable = Array.from(downloadDialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(item => item.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });

  function setFeatures(expanded) {
    featureGrid.classList.toggle('is-expanded', expanded);
    featureButton.setAttribute('aria-expanded', String(expanded));
    featureButton.querySelector('span').textContent = expanded ? '收起功能' : '查看全部';
  }
  featureButton.addEventListener('click', () => setFeatures(featureButton.getAttribute('aria-expanded') !== 'true'));
  mobileQuery.addEventListener('change', () => {
    setMenu(false);
    setFeatures(false);
  });

  function notify(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }

  // 保留此路径可让页面从本地磁盘直接打开时仍能复制链接。
  // 复制能力取决于浏览器；只有真正成功后才提示成功。
  function copyFallback(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    field.style.top = '0';
    document.body.appendChild(field);
    let copied = false;
    try {
      field.select();
      field.setSelectionRange(0, field.value.length);
      copied = typeof document.execCommand === 'function' && document.execCommand('copy');
    } catch (_) {
      copied = false;
    } finally {
      field.remove();
    }
    return copied;
  }
  downloadOpeners.forEach(button => button.addEventListener('click', () => openDownloadDialog(button)));
  downloadClosers.forEach(button => button.addEventListener('click', closeDownloadDialog));
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* 继续尝试兼容本地文件的复制方式。 */ }
    return copyFallback(text);
  }

  async function handleCopy(button, text, successMessage, failureMessage) {
    button.disabled = true;
    const copied = await copyText(text);
    button.disabled = false;
    button.focus({ preventScroll: true });
    notify(copied ? successMessage : failureMessage);
  }

  copyButton.addEventListener('click', () => handleCopy(
    copyButton,
    document.querySelector('.support-url').href,
    '爱发电链接已复制',
    '暂时无法自动复制，请长按或右键上方链接复制'
  ));

  document.querySelectorAll('[data-copy-text]').forEach(button => {
    button.addEventListener('click', () => handleCopy(
      button,
      button.dataset.copyText,
      '百度网盘提取码已复制',
      '暂时无法自动复制，请手动选择提取码'
    ));
  });
})();
