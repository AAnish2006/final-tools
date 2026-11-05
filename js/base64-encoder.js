/**
 * DevToolBox - Base64 & URL Encoder (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.base64-page');
  if (!page) return;

  const tabs = page.querySelectorAll('.b64-tabs .b64-tab-btn');
  const dropzone = page.querySelector('.b64-file-dropzone');
  const fileInput = dropzone ? dropzone.querySelector('input[type="file"]') : null;
  const inputArea = page.querySelector('.b64-panel:nth-child(1) textarea');
  const outputArea = page.querySelector('.b64-panel:nth-child(2) textarea');
  const inputChars = page.querySelector('.b64-panel:nth-child(1) .b64-char-count');
  const outputChars = page.querySelector('.b64-panel:nth-child(2) .b64-char-count');

  const encodeBtn = page.querySelector('.b64-btn-primary');
  const decodeBtn = page.querySelector('.b64-btn-secondary');
  const swapBtn = page.querySelector('.b64-btn-swap');
  const copyBtn = page.querySelector('.b64-btn-copy');
  const downloadBtn = page.querySelector('.b64-btn-download');
  const clearBtn = page.querySelector('.b64-btn-clear');

  let mode = 'base64'; // 'base64' | 'url'

  function utf8ToBase64(str) {
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }

  function base64ToUtf8(str) {
    return decodeURIComponent(Array.prototype.map.call(window.atob(str), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  function updateCounts() {
    if (inputChars && inputArea) inputChars.textContent = inputArea.value.length + ' chars';
    if (outputChars && outputArea) outputChars.textContent = outputArea.value.length + ' chars';
    if (copyBtn) {
      if (outputArea && outputArea.value) copyBtn.removeAttribute('disabled');
      else copyBtn.setAttribute('disabled', 'true');
    }
  }

  function doEncode() {
    if (!inputArea || !outputArea) return;
    const txt = inputArea.value;
    try {
      if (mode === 'base64') {
        outputArea.value = utf8ToBase64(txt);
      } else {
        outputArea.value = encodeURIComponent(txt);
      }
      updateCounts();
      showToast('Encoded successfully');
    } catch (e) {
      outputArea.value = 'Encoding error: ' + e.message;
    }
  }

  function doDecode() {
    if (!inputArea || !outputArea) return;
    const txt = inputArea.value.trim();
    try {
      if (mode === 'base64') {
        outputArea.value = base64ToUtf8(txt);
      } else {
        outputArea.value = decodeURIComponent(txt);
      }
      updateCounts();
      showToast('Decoded successfully');
    } catch (e) {
      outputArea.value = 'Decoding error: ' + e.message;
    }
  }

  if (inputArea) inputArea.addEventListener('input', updateCounts);
  if (encodeBtn) encodeBtn.addEventListener('click', doEncode);
  if (decodeBtn) decodeBtn.addEventListener('click', doDecode);

  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      if (inputArea && outputArea) {
        const temp = inputArea.value;
        inputArea.value = outputArea.value;
        outputArea.value = temp;
        updateCounts();
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (outputArea && outputArea.value) {
        await navigator.clipboard.writeText(outputArea.value);
        showToast('Output copied to clipboard!');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (inputArea) inputArea.value = '';
      if (outputArea) outputArea.value = '';
      updateCounts();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (outputArea) {
            outputArea.value = ev.target.result;
            updateCounts();
            showToast('File encoded to Data URI!');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (tabs.length >= 2) {
    tabs[0].addEventListener('click', () => {
      mode = 'base64';
      tabs[0].classList.add('active');
      tabs[1].classList.remove('active');
    });
    tabs[1].addEventListener('click', () => {
      mode = 'url';
      tabs[1].classList.add('active');
      tabs[0].classList.remove('active');
    });
  }
})();
