/**
 * DevToolBox - Online Notepad (Vanilla JS for Exact React DOM)
 */
(function() {
  const workspace = document.querySelector('.notepad-workspace');
  if (!workspace) return;

  const textarea = workspace.querySelector('.notepad-editor textarea');
  const fullpageBtn = workspace.querySelector('.toolbar-btn-fullpage');
  const copyBtn = workspace.querySelector('.toolbar-left button:nth-child(2)');
  const downloadBtn = workspace.querySelector('.toolbar-left button:nth-child(3)');
  const clearBtn = workspace.querySelector('.toolbar-btn-danger');
  const fontInput = workspace.querySelector('.font-size-control input');
  const fontLabel = workspace.querySelector('.font-size-control span:last-child');
  const themeBtn = workspace.querySelector('.theme-toggle-btn');
  const statusLeft = workspace.querySelector('.status-left');
  const statusWords = workspace.querySelector('.status-right span:nth-child(1) strong');
  const statusChars = workspace.querySelector('.status-right span:nth-child(2) strong');
  const statusLines = workspace.querySelector('.status-right span:nth-child(3) strong');

  const STORAGE_KEY = 'devtoolbox-notepad';
  const FONT_KEY = 'devtoolbox-notepad-font';
  const DARK_KEY = 'devtoolbox-notepad-dark';

  // Load preferences
  const savedText = localStorage.getItem(STORAGE_KEY) || '';
  if (textarea) textarea.value = savedText;

  const savedFont = localStorage.getItem(FONT_KEY) || '18';
  if (fontInput) {
    fontInput.value = savedFont;
    if (fontLabel) fontLabel.textContent = savedFont + 'px';
    if (textarea) textarea.style.fontSize = savedFont + 'px';
  }

  let darkMode = localStorage.getItem(DARK_KEY) !== 'false';
  updateTheme();

  function updateTheme() {
    if (darkMode) {
      workspace.classList.add('dark-theme');
      workspace.classList.remove('light-theme');
      if (themeBtn) {
        themeBtn.textContent = '☀️ Light Mode';
        themeBtn.title = 'Switch to light mode';
      }
      if (statusLeft && statusLeft.querySelector('.status-theme-label')) {
        statusLeft.querySelector('.status-theme-label').textContent = 'Theme: Dark';
      }
    } else {
      workspace.classList.remove('dark-theme');
      workspace.classList.add('light-theme');
      if (themeBtn) {
        themeBtn.textContent = '🌙 Dark Mode';
        themeBtn.title = 'Switch back to dark mode';
      }
      if (statusLeft && statusLeft.querySelector('.status-theme-label')) {
        statusLeft.querySelector('.status-theme-label').textContent = 'Theme: Light';
      }
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      darkMode = !darkMode;
      localStorage.setItem(DARK_KEY, darkMode.toString());
      updateTheme();
    });
  }

  if (fontInput) {
    fontInput.addEventListener('input', (e) => {
      const sz = e.target.value;
      if (fontLabel) fontLabel.textContent = sz + 'px';
      if (textarea) textarea.style.fontSize = sz + 'px';
      localStorage.setItem(FONT_KEY, sz);
    });
  }

  function updateCounts() {
    if (!textarea) return;
    const val = textarea.value;
    const trimmed = val.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = val.length;
    const lines = val ? val.split('\n').length : 0;

    if (statusWords) statusWords.textContent = words.toLocaleString();
    if (statusChars) statusChars.textContent = chars.toLocaleString();
    if (statusLines) statusLines.textContent = lines.toLocaleString();
  }
  updateCounts();

  let saveTimer = null;
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateCounts();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, textarea.value);
        if (statusLeft) {
          statusLeft.innerHTML = '<span class="save-indicator">✓ Saved to browser</span> <span class="status-theme-label">Theme: ' + (darkMode ? 'Dark' : 'Light') + '</span>';
          setTimeout(() => {
            statusLeft.innerHTML = '<span class="auto-save-label">Auto-save active</span> <span class="status-theme-label">Theme: ' + (darkMode ? 'Dark' : 'Light') + '</span>';
          }, 1500);
        }
      }, 500);
    });
  }

  let isFullPage = false;
  function toggleFullPage() {
    isFullPage = !isFullPage;
    if (isFullPage) {
      document.body.classList.add('notepad-fullpage-open');
      workspace.classList.add('fullpage-active');
      if (fullpageBtn) {
        fullpageBtn.textContent = '⤢ Exit Full Page';
        fullpageBtn.classList.add('active');
      }
      if (textarea) textarea.focus();
    } else {
      document.body.classList.remove('notepad-fullpage-open');
      workspace.classList.remove('fullpage-active');
      if (fullpageBtn) {
        fullpageBtn.textContent = '⛶ Full Page';
        fullpageBtn.classList.remove('active');
      }
    }
  }

  if (fullpageBtn) fullpageBtn.addEventListener('click', toggleFullPage);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullPage) toggleFullPage();
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!textarea) return;
      try {
        await navigator.clipboard.writeText(textarea.value);
        showToast('Notes copied to clipboard!');
      } catch {
        textarea.select();
        document.execCommand('copy');
        showToast('Notes copied to clipboard!');
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!textarea) return;
      const blob = new Blob([textarea.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notepad-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded notepad.txt');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all text?')) {
        if (textarea) textarea.value = '';
        localStorage.removeItem(STORAGE_KEY);
        updateCounts();
        showToast('Notepad cleared');
      }
    });
  }
})();
