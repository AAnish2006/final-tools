/**
 * DevToolBox - JSON Formatter & Validator (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.json-page');
  if (!page) return;

  const inputArea = page.querySelector('.json-panel:nth-child(1) textarea');
  const outputArea = page.querySelector('.json-panel:nth-child(2) textarea');
  const formatBtn = page.querySelector('.toolbar-btn-primary');
  const minifyBtn = page.querySelector('.toolbar-left button:nth-child(2)');
  const copyBtn = page.querySelector('.toolbar-left button:nth-child(3)');
  const downloadBtn = page.querySelector('.toolbar-left button:nth-child(4)');
  const sampleBtn = page.querySelector('.toolbar-left button:nth-child(5)');
  const clearBtn = page.querySelector('.toolbar-btn-danger');
  const indentSelect = page.querySelector('.indent-control select');

  function getIndent() {
    if (!indentSelect) return 2;
    const val = indentSelect.value;
    if (val === '1') return '\t';
    return parseInt(val) || 2;
  }

  function formatJSON() {
    if (!inputArea || !outputArea) return;
    const raw = inputArea.value.trim();
    if (!raw) {
      outputArea.value = '';
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      outputArea.value = JSON.stringify(parsed, null, getIndent());
      showToast('✓ Valid JSON formatted');
    } catch (err) {
      outputArea.value = 'Invalid JSON: ' + err.message;
      showToast('⚠️ Syntax Error in JSON', 'error');
    }
  }

  function minifyJSON() {
    if (!inputArea || !outputArea) return;
    const raw = inputArea.value.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      outputArea.value = JSON.stringify(parsed);
      showToast('✓ JSON minified');
    } catch (err) {
      outputArea.value = 'Invalid JSON: ' + err.message;
      showToast('⚠️ Syntax Error in JSON', 'error');
    }
  }

  if (formatBtn) formatBtn.addEventListener('click', formatJSON);
  if (minifyBtn) minifyBtn.addEventListener('click', minifyJSON);

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const txt = outputArea && outputArea.value ? outputArea.value : (inputArea ? inputArea.value : '');
      if (txt) {
        await navigator.clipboard.writeText(txt);
        showToast('JSON copied to clipboard!');
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const txt = outputArea && outputArea.value ? outputArea.value : (inputArea ? inputArea.value : '');
      if (txt) {
        const blob = new Blob([txt], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      if (inputArea) {
        inputArea.value = JSON.stringify({
          name: "DevToolBox Suite",
          version: "2.4.0",
          features: ["Stopwatch", "Notepad", "Word Counter", "JSON Formatter", "Image Resizer"],
          active: true,
          stats: { users: 50000, rating: 5.0 }
        }, null, 2);
        formatJSON();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (inputArea) inputArea.value = '';
      if (outputArea) outputArea.value = '';
    });
  }
})();
