/**
 * DevToolBox - Strong Password & Passphrase Generator (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.password-gen-page');
  if (!page) return;

  const passwordText = page.querySelector('.pg-password-text');
  const copyBtn = page.querySelector('.pg-copy-btn');
  const refreshBtn = page.querySelector('.pg-refresh-btn');
  const tabs = page.querySelectorAll('.pg-tabs .pg-tab-btn');
  const controlsCard = page.querySelector('.pg-controls-card');
  const optionsGrid = page.querySelector('.pg-options-grid');
  const batchSelect = page.querySelector('#pg-batch-select');
  const barFill = page.querySelector('.pg-bar-fill');

  // Robust selector for the 3 metrics in .pg-strength-info
  const strengthInfoSpans = page.querySelectorAll('.pg-strength-info span');
  const strengthEl = strengthInfoSpans[0] ? strengthInfoSpans[0].querySelector('strong') : null;
  const entropyEl = strengthInfoSpans[1] ? strengthInfoSpans[1].querySelector('strong') : null;
  const crackTimeEl = strengthInfoSpans[2] ? strengthInfoSpans[2].querySelector('strong') : null;

  const workspace = page.querySelector('.pg-workspace');
  let batchResultsContainer = page.querySelector('.pg-batch-results');
  if (!batchResultsContainer && workspace) {
    batchResultsContainer = document.createElement('div');
    batchResultsContainer.className = 'pg-batch-results';
    batchResultsContainer.style.display = 'none';
    workspace.appendChild(batchResultsContainer);
  }

  // State matching React PasswordGenerator.jsx
  let mode = 'password'; // 'password' | 'passphrase'
  let length = 16;
  let includeUpper = true;
  let includeLower = true;
  let includeNumbers = true;
  let includeSymbols = true;
  let excludeAmbiguous = false;
  let wordCount = 4;
  let separator = '-';
  let capitalizeWords = true;
  let includeNumberInPassphrase = true;
  let batchCount = 1;
  let currentPassword = '';
  let batchPasswords = [];

  // Exact 64-word list from React component
  const WORD_LIST = [
    'apple', 'beach', 'cloud', 'delta', 'eagle', 'forest', 'galaxy', 'harbor',
    'island', 'jungle', 'knight', 'lemon', 'meteor', 'nebula', 'ocean', 'planet',
    'quartz', 'river', 'shadow', 'thunder', 'valley', 'winter', 'zenith', 'anchor',
    'beacon', 'canyon', 'falcon', 'glacier', 'horizon', 'lagoon', 'meadow', 'oasis',
    'phoenix', 'rocket', 'safari', 'tiger', 'voyage', 'wizard', 'aurora', 'breeze',
    'crystal', 'dolphin', 'ember', 'feather', 'granite', 'haven', 'infinity', 'jasper',
    'kinetic', 'lotus', 'mirage', 'nova', 'orbit', 'pulse', 'quiver', 'radiant',
    'summit', 'titan', 'uranium', 'vortex', 'whisper', 'zephyr', 'blaze', 'cascade'
  ];

  function getCryptoRandomInt(max) {
    const range = 0x100000000;
    const ceiling = Math.floor(range / max) * max;
    const array = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(array);
    } while (array[0] >= ceiling);
    return array[0] % max;
  }

  function generateSinglePassword() {
    if (mode === 'passphrase') {
      const selectedWords = [];
      for (let i = 0; i < wordCount; i++) {
        let w = WORD_LIST[getCryptoRandomInt(WORD_LIST.length)];
        if (capitalizeWords) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        selectedWords.push(w);
      }
      let result = selectedWords.join(separator);
      if (includeNumberInPassphrase) {
        const num = getCryptoRandomInt(100);
        result += `${separator}${num}`;
      }
      return result;
    }

    // Random Password Mode
    let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    let numberChars = '0123456789';
    let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      upperChars = upperChars.replace(/[IO]/g, '');
      lowerChars = lowerChars.replace(/[lo]/g, '');
      numberChars = numberChars.replace(/[01]/g, '');
      symbolChars = symbolChars.replace(/[|]/g, '');
    }

    let charPool = '';
    const guaranteed = [];

    if (includeUpper) {
      charPool += upperChars;
      guaranteed.push(upperChars[getCryptoRandomInt(upperChars.length)]);
    }
    if (includeLower) {
      charPool += lowerChars;
      guaranteed.push(lowerChars[getCryptoRandomInt(lowerChars.length)]);
    }
    if (includeNumbers) {
      charPool += numberChars;
      guaranteed.push(numberChars[getCryptoRandomInt(numberChars.length)]);
    }
    if (includeSymbols) {
      charPool += symbolChars;
      guaranteed.push(symbolChars[getCryptoRandomInt(symbolChars.length)]);
    }

    if (!charPool) {
      charPool = lowerChars;
      guaranteed.push(lowerChars[getCryptoRandomInt(lowerChars.length)]);
    }

    const generated = [...guaranteed];
    for (let i = guaranteed.length; i < length; i++) {
      generated.push(charPool[getCryptoRandomInt(charPool.length)]);
    }

    // Fisher-Yates shuffle
    for (let i = generated.length - 1; i > 0; i--) {
      const j = getCryptoRandomInt(i + 1);
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    return generated.join('');
  }

  function getStrengthLevel(bits) {
    if (bits < 40) return { bits, label: 'Weak', color: '#ef4444', percent: 25, time: 'Low estimate' };
    if (bits < 60) return { bits, label: 'Fair', color: '#f59e0b', percent: 50, time: 'Moderate estimate' };
    if (bits < 80) return { bits, label: 'Strong', color: '#3b82f6', percent: 75, time: 'High estimate' };
    return { bits, label: 'Very Strong', color: '#10b981', percent: 100, time: 'Very high estimate' };
  }

  function calculateEntropy(pwd) {
    if (!pwd) return { bits: 0, label: 'None', color: '#64748b', percent: 0, time: 'Instant' };

    let poolSize = 0;
    if (mode === 'passphrase') {
      poolSize = WORD_LIST.length;
      const bits = Math.round(wordCount * Math.log2(poolSize) + (includeNumberInPassphrase ? Math.log2(100) : 0));
      return getStrengthLevel(bits);
    }

    const enabledPools = [];
    if (includeUpper) enabledPools.push(excludeAmbiguous ? 24 : 26);
    if (includeLower) enabledPools.push(excludeAmbiguous ? 24 : 26);
    if (includeNumbers) enabledPools.push(excludeAmbiguous ? 8 : 10);
    if (includeSymbols) enabledPools.push(excludeAmbiguous ? 25 : 26);
    if (!enabledPools.length) enabledPools.push(26);
    poolSize = enabledPools.reduce((sum, size) => sum + size, 0);
    // Each enabled set contributes one guaranteed character; remaining slots
    // are selected from the combined pool. This estimate does not model the
    // additional entropy of the final shuffle and is intentionally approximate.
    const guaranteedBits = enabledPools.reduce((sum, size) => sum + Math.log2(size), 0);
    const randomSlots = Math.max(0, pwd.length - enabledPools.length);
    const bits = Math.round(guaranteedBits + randomSlots * Math.log2(poolSize));
    return getStrengthLevel(bits);
  }

  /**
   * Safe DOM-based rendering for batch results.
   * NEVER uses innerHTML with raw password strings, preventing HTML parser injection from <, >, & characters.
   */
  function renderBatchList() {
    if (!batchResultsContainer) return;

    if (batchCount > 1 && batchPasswords.length > 0) {
      batchResultsContainer.style.display = 'block';
      batchResultsContainer.innerHTML = '';

      const h3 = document.createElement('h3');
      h3.textContent = `Batch Results (${batchPasswords.length})`;
      batchResultsContainer.appendChild(h3);

      const list = document.createElement('div');
      list.className = 'pg-batch-list';

      batchPasswords.forEach((pwd) => {
        const item = document.createElement('div');
        item.className = 'pg-batch-item';

        const textSpan = document.createElement('span');
        textSpan.className = 'pg-batch-text';
        textSpan.textContent = pwd; // Safe plain text!

        const btn = document.createElement('button');
        btn.className = 'pg-btn pg-batch-copy-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy password');

        btn.addEventListener('click', async () => {
          await copyToClipboard(pwd);
          btn.textContent = 'Copied!';
          btn.style.backgroundColor = '#10b981';
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.style.backgroundColor = '';
          }, 1500);
        });

        item.appendChild(textSpan);
        item.appendChild(btn);
        list.appendChild(item);
      });

      batchResultsContainer.appendChild(list);
    } else {
      batchResultsContainer.style.display = 'none';
      batchResultsContainer.innerHTML = '';
    }
  }

  function updateControlsUI() {
    if (!optionsGrid) return;

    if (mode === 'password') {
      optionsGrid.innerHTML = `
        <div class="pg-slider-group">
          <div class="pg-slider-header">
            <label for="pg-length-slider">Password Length:</label>
            <span class="pg-slider-value">${length} characters</span>
          </div>
          <input
            id="pg-length-slider"
            type="range"
            min="6"
            max="64"
            value="${length}"
            class="pg-range-input"
          />
        </div>
        <div class="pg-checkboxes-grid">
          <label class="pg-checkbox-item">
            <input type="checkbox" id="chk-upper" ${includeUpper ? 'checked' : ''} />
            <span>Uppercase (A-Z)</span>
          </label>
          <label class="pg-checkbox-item">
            <input type="checkbox" id="chk-lower" ${includeLower ? 'checked' : ''} />
            <span>Lowercase (a-z)</span>
          </label>
          <label class="pg-checkbox-item">
            <input type="checkbox" id="chk-numbers" ${includeNumbers ? 'checked' : ''} />
            <span>Numbers (0-9)</span>
          </label>
          <label class="pg-checkbox-item">
            <input type="checkbox" id="chk-symbols" ${includeSymbols ? 'checked' : ''} />
            <span>Symbols (!@#$%)</span>
          </label>
          <label class="pg-checkbox-item">
            <input type="checkbox" id="chk-ambiguous" ${excludeAmbiguous ? 'checked' : ''} />
            <span>Exclude Ambiguous (1, l, I, 0, O)</span>
          </label>
        </div>
      `;

      const slider = optionsGrid.querySelector('#pg-length-slider');
      const sliderVal = optionsGrid.querySelector('.pg-slider-value');
      if (slider) {
        slider.addEventListener('input', (e) => {
          length = parseInt(e.target.value) || 16;
          if (sliderVal) sliderVal.textContent = `${length} characters`;
          handleGenerate();
        });
      }

      optionsGrid.querySelector('#chk-upper')?.addEventListener('change', (e) => { includeUpper = e.target.checked; handleGenerate(); });
      optionsGrid.querySelector('#chk-lower')?.addEventListener('change', (e) => { includeLower = e.target.checked; handleGenerate(); });
      optionsGrid.querySelector('#chk-numbers')?.addEventListener('change', (e) => { includeNumbers = e.target.checked; handleGenerate(); });
      optionsGrid.querySelector('#chk-symbols')?.addEventListener('change', (e) => { includeSymbols = e.target.checked; handleGenerate(); });
      optionsGrid.querySelector('#chk-ambiguous')?.addEventListener('change', (e) => { excludeAmbiguous = e.target.checked; handleGenerate(); });

    } else {
      optionsGrid.innerHTML = `
        <div class="pg-slider-group">
          <div class="pg-slider-header">
            <label for="pg-words-slider">Number of Words:</label>
            <span class="pg-slider-value">${wordCount} words</span>
          </div>
          <input
            id="pg-words-slider"
            type="range"
            min="3"
            max="8"
            value="${wordCount}"
            class="pg-range-input"
          />
        </div>
        <div class="pg-passphrase-options">
          <div class="pg-select-group">
            <label for="pg-separator-select">Word Separator:</label>
            <select id="pg-separator-select" class="pg-select-input">
              <option value="-" ${separator === '-' ? 'selected' : ''}>Hyphen (-)</option>
              <option value="_" ${separator === '_' ? 'selected' : ''}>Underscore (_)</option>
              <option value="." ${separator === '.' ? 'selected' : ''}>Period (.)</option>
              <option value=" " ${separator === ' ' ? 'selected' : ''}>Space ( )</option>
              <option value="#" ${separator === '#' ? 'selected' : ''}>Hash (#)</option>
            </select>
          </div>
          <div class="pg-checkboxes-grid">
            <label class="pg-checkbox-item">
              <input type="checkbox" id="chk-cap" ${capitalizeWords ? 'checked' : ''} />
              <span>Capitalize Each Word</span>
            </label>
            <label class="pg-checkbox-item">
              <input type="checkbox" id="chk-num" ${includeNumberInPassphrase ? 'checked' : ''} />
              <span>Append Random Number</span>
            </label>
          </div>
        </div>
      `;

      const wordsSlider = optionsGrid.querySelector('#pg-words-slider');
      const wordsVal = optionsGrid.querySelector('.pg-slider-value');
      if (wordsSlider) {
        wordsSlider.addEventListener('input', (e) => {
          wordCount = parseInt(e.target.value) || 4;
          if (wordsVal) wordsVal.textContent = `${wordCount} words`;
          handleGenerate();
        });
      }

      optionsGrid.querySelector('#pg-separator-select')?.addEventListener('change', (e) => {
        separator = e.target.value;
        handleGenerate();
      });
      optionsGrid.querySelector('#chk-cap')?.addEventListener('change', (e) => {
        capitalizeWords = e.target.checked;
        handleGenerate();
      });
      optionsGrid.querySelector('#chk-num')?.addEventListener('change', (e) => {
        includeNumberInPassphrase = e.target.checked;
        handleGenerate();
      });
    }
  }

  function handleGenerate() {
    currentPassword = generateSinglePassword();
    if (passwordText) {
      passwordText.textContent = currentPassword;
    }

    if (batchCount > 1) {
      batchPasswords = [];
      for (let i = 0; i < batchCount; i++) {
        batchPasswords.push(generateSinglePassword());
      }
    } else {
      batchPasswords = [];
    }

    const st = calculateEntropy(currentPassword);
    if (strengthEl) {
      strengthEl.textContent = st.label;
      strengthEl.style.color = st.color;
    }
    if (entropyEl) {
      entropyEl.textContent = `${st.bits} bits`;
    }
    if (crackTimeEl) {
      crackTimeEl.textContent = `~${st.time}`;
    }
    if (barFill) {
      barFill.style.width = `${st.percent}%`;
      barFill.style.backgroundColor = st.color;
    }

    renderBatchList();
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  // Setup tabs
  if (tabs.length >= 2) {
    tabs[0].addEventListener('click', () => {
      if (mode !== 'password') {
        mode = 'password';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        updateControlsUI();
        handleGenerate();
      }
    });

    tabs[1].addEventListener('click', () => {
      if (mode !== 'passphrase') {
        mode = 'passphrase';
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        updateControlsUI();
        handleGenerate();
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleGenerate);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!currentPassword) return;
      await copyToClipboard(currentPassword);
      copyBtn.classList.add('copied');
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.textContent = orig;
      }, 1500);
    });
  }

  if (batchSelect) {
    batchSelect.addEventListener('change', (e) => {
      batchCount = parseInt(e.target.value) || 1;
      handleGenerate();
    });
  }

  // Initial render
  updateControlsUI();
  handleGenerate();
})();
