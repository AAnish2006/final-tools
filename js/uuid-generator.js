/**
 * DevToolBox - UUID / GUID Generator & Unix Timestamp Converter (Vanilla JS Exact Replica)
 */
(function() {
  const page = document.querySelector('.uuid-page');
  if (!page) return;

  // Tabs
  const tabBtns = page.querySelectorAll('.uuid-tabs .uuid-tab-btn');
  const uuidControls = page.querySelector('.uuid-controls-panel');
  const uuidResults = page.querySelector('.uuid-results-panel');
  const uuidActions = page.querySelector('.uuid-actions-bar');
  const epochTools = page.querySelector('.epoch-tools-container');

  // UUID Controls
  const qtySelect = page.querySelector('#uuid-qty-select');
  const bracketsSelect = page.querySelector('#uuid-brackets-select');
  const formatSelect = page.querySelector('#uuid-format-select');
  const upperCheckbox = page.querySelector('.uuid-checkboxes-row label:nth-child(1) input');
  const hyphensCheckbox = page.querySelector('.uuid-checkboxes-row label:nth-child(2) input');
  const textarea = page.querySelector('.uuid-textarea');
  const countBadge = page.querySelector('.uuid-results-header span:first-child');

  const regenerateBtn = page.querySelector('.uuid-actions-bar .uuid-btn-primary');
  const copyBtn = page.querySelector('.uuid-actions-bar .uuid-btn-copy');
  const downloadBtn = page.querySelector('.uuid-actions-bar .uuid-btn-download');

  // Epoch Controls
  const epochLiveVal = page.querySelector('.epoch-live-value');
  const epochLiveCopyBtn = page.querySelector('.epoch-live-card .uuid-btn-small');
  const epochInput = page.querySelector('#epoch-input');
  const epochToDateBtn = page.querySelector('.btn-epoch-to-date');
  const epochResultBox = page.querySelector('#epoch-input') ? page.querySelector('#epoch-input').closest('.epoch-card').querySelector('.epoch-result-box') : null;

  const dateInput = page.querySelector('#date-input');
  const dateToEpochBtn = page.querySelector('.btn-date-to-epoch');
  const dateResultBox = page.querySelector('#date-input') ? page.querySelector('#date-input').closest('.epoch-card').querySelector('.epoch-result-box') : null;

  let currentUuids = [];
  let copyTimeout = null;

  // Tab switching
  function setActiveTab(tab) {
    if (tabBtns.length >= 2) {
      if (tab === 'uuid') {
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
        if (uuidControls) uuidControls.style.display = '';
        if (uuidResults) uuidResults.style.display = '';
        if (uuidActions) uuidActions.style.display = '';
        if (epochTools) epochTools.style.display = 'none';
      } else {
        tabBtns[0].classList.remove('active');
        tabBtns[1].classList.add('active');
        if (uuidControls) uuidControls.style.display = 'none';
        if (uuidResults) uuidResults.style.display = 'none';
        if (uuidActions) uuidActions.style.display = 'none';
        if (epochTools) epochTools.style.display = 'flex';

        // Initialize inputs on epoch tab open if empty
        const nowSec = Math.floor(Date.now() / 1000);
        if (epochInput && !epochInput.value) {
          epochInput.value = nowSec.toString();
        }
        if (dateInput && !dateInput.value) {
          dateInput.value = new Date().toISOString().slice(0, 16);
        }
      }
    }
  }

  if (tabBtns.length >= 2) {
    tabBtns[0].addEventListener('click', () => setActiveTab('uuid'));
    tabBtns[1].addEventListener('click', () => setActiveTab('timestamp'));
  }

  // Live Epoch Ticker
  function updateEpochTicker() {
    const nowSec = Math.floor(Date.now() / 1000);
    if (epochLiveVal) {
      epochLiveVal.textContent = nowSec.toString();
    }
  }
  updateEpochTicker();
  setInterval(updateEpochTicker, 1000);

  if (epochLiveCopyBtn) {
    epochLiveCopyBtn.addEventListener('click', async () => {
      const nowSec = Math.floor(Date.now() / 1000).toString();
      try {
        await navigator.clipboard.writeText(nowSec);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = nowSec;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const origText = epochLiveCopyBtn.textContent;
      epochLiveCopyBtn.textContent = 'Copied!';
      setTimeout(() => {
        epochLiveCopyBtn.textContent = origText;
      }, 1500);
      if (typeof showToast === 'function') {
        showToast('Timestamp copied to clipboard!');
      }
    });
  }

  // Epoch to Date Converter
  function handleConvertEpochToDate() {
    if (!epochInput || !epochResultBox) return;
    const val = epochInput.value.trim();
    if (!val) {
      epochResultBox.style.display = 'none';
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      epochResultBox.textContent = 'Invalid Unix Epoch timestamp';
      epochResultBox.style.display = 'block';
      return;
    }
    const ms = val.length > 11 ? num : num * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) {
      epochResultBox.textContent = 'Out of range timestamp';
      epochResultBox.style.display = 'block';
      return;
    }
    epochResultBox.textContent = `UTC: ${d.toUTCString()}\nLocal: ${d.toLocaleString()}\nISO 8601: ${d.toISOString()}`;
    epochResultBox.style.display = 'block';
  }

  if (epochToDateBtn) {
    epochToDateBtn.addEventListener('click', handleConvertEpochToDate);
  }
  if (epochInput) {
    epochInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConvertEpochToDate();
    });
  }

  // Date to Epoch Converter
  function handleConvertDateToEpoch() {
    if (!dateInput || !dateResultBox) return;
    if (!dateInput.value) {
      dateResultBox.style.display = 'none';
      return;
    }
    const d = new Date(dateInput.value);
    if (isNaN(d.getTime())) {
      dateResultBox.textContent = 'Invalid date string';
      dateResultBox.style.display = 'block';
      return;
    }
    const secs = Math.floor(d.getTime() / 1000);
    const ms = d.getTime();
    dateResultBox.textContent = `Unix Timestamp (Seconds): ${secs}\nUnix Timestamp (Milliseconds): ${ms}`;
    dateResultBox.style.display = 'block';
  }

  if (dateToEpochBtn) {
    dateToEpochBtn.addEventListener('click', handleConvertDateToEpoch);
  }
  if (dateInput) {
    dateInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConvertDateToEpoch();
    });
  }

  // Initialize input values
  if (epochInput && !epochInput.value) {
    epochInput.value = Math.floor(Date.now() / 1000).toString();
  }
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 16);
  }

  // Cryptographically secure UUID v4
  function generateSingleUuid(includeHyphens, uppercase, brackets) {
    let id;
    if (typeof window.crypto?.randomUUID === 'function') {
      id = window.crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
      id = [...bytes].map((b, i) => {
        const hex = b.toString(16).padStart(2, '0');
        return (i === 4 || i === 6 || i === 8 || i === 10) ? `-${hex}` : hex;
      }).join('');
    }

    if (!includeHyphens) {
      id = id.replace(/-/g, '');
    }
    if (uppercase) {
      id = id.toUpperCase();
    }
    if (brackets === 'braces') {
      id = `{${id}}`;
    } else if (brackets === 'quotes') {
      id = `"${id}"`;
    }

    return id;
  }

  function getFormattedOutput() {
    const fmt = formatSelect ? formatSelect.value : 'list';
    return fmt === 'json' ? JSON.stringify(currentUuids, null, 2) : currentUuids.join('\n');
  }

  function generate() {
    const qty = parseInt(qtySelect ? qtySelect.value : 5, 10) || 5;
    const isUpper = upperCheckbox ? upperCheckbox.checked : false;
    const hasHyphens = hyphensCheckbox ? hyphensCheckbox.checked : true;
    const brackets = bracketsSelect ? bracketsSelect.value : 'none';

    currentUuids = [];
    for (let i = 0; i < qty; i++) {
      currentUuids.push(generateSingleUuid(hasHyphens, isUpper, brackets));
    }

    const output = getFormattedOutput();
    if (textarea) {
      textarea.value = output;
      textarea.rows = Math.min(12, Math.max(5, currentUuids.length + 2));
    }

    if (countBadge) {
      countBadge.textContent = 'Generated Identifiers (' + qty + ')';
    }

    if (copyBtn) {
      copyBtn.classList.remove('copied');
      copyBtn.textContent = '📋 Copy All';
    }
  }

  if (regenerateBtn) regenerateBtn.addEventListener('click', generate);
  if (qtySelect) qtySelect.addEventListener('change', generate);
  if (bracketsSelect) bracketsSelect.addEventListener('change', generate);
  if (formatSelect) {
    formatSelect.addEventListener('change', () => {
      if (textarea) {
        textarea.value = getFormattedOutput();
      }
    });
  }
  if (upperCheckbox) upperCheckbox.addEventListener('change', generate);
  if (hyphensCheckbox) hyphensCheckbox.addEventListener('change', generate);

  // Copy All button
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const output = getFormattedOutput();
      if (!output) return;

      try {
        await navigator.clipboard.writeText(output);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = output;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      copyBtn.classList.add('copied');
      copyBtn.textContent = '✓ Copied All';
      if (typeof showToast === 'function') {
        showToast('UUIDs copied to clipboard!');
      }

      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.textContent = '📋 Copy All';
      }, 2000);
    });
  }

  // Download File button
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const output = getFormattedOutput();
      if (!output) return;

      const isJson = formatSelect && formatSelect.value === 'json';
      const ext = isJson ? 'json' : 'txt';
      const mime = isJson ? 'application/json' : 'text/plain';
      const blob = new Blob([output], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uuids-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Initial generation
  generate();
})();
