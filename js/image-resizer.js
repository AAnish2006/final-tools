/**
 * DevToolBox - Image Resizer (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.imageresizer-page');
  if (!page) return;

  const dropzone = page.querySelector('.ir-dropzone');
  const fileInput = dropzone ? dropzone.querySelector('input[type="file"]') : null;
  const editorGrid = page.querySelector('.ir-editor-grid');

  const widthIn = page.querySelector('#ir-width');
  const heightIn = page.querySelector('#ir-height');
  const lockAspectBtn = page.querySelector('.btn-lock-aspect');
  const lockCheckbox = page.querySelector('#ir-lock-checkbox');
  const presetBtns = page.querySelectorAll('.preset-btn');
  const formatRadios = page.querySelectorAll('input[name="format"]');
  const qualityRange = page.querySelector('#ir-quality-range');
  const qualityVal = page.querySelector('#ir-quality-val');
  const downloadBtn = page.querySelector('.btn-download-action');
  const changeImgBtn = page.querySelector('.btn-change-image');
  const canvas = page.querySelector('#ir-canvas');
  const origSizeEl = page.querySelector('#ir-orig-size');
  const newSizeEl = page.querySelector('#ir-new-size');
  const dimensionsBadge = page.querySelector('#ir-dimensions-badge');

  let currentImg = null;
  let origW = 0;
  let origH = 0;
  let lockAspect = true;
  let origFileSize = 0;

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image.');
      return;
    }
    origFileSize = file.size;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        origW = img.naturalWidth;
        origH = img.naturalHeight;
        if (widthIn) widthIn.value = origW;
        if (heightIn) heightIn.value = origH;
        if (origSizeEl) origSizeEl.textContent = formatBytes(origFileSize);

        if (dropzone) dropzone.style.display = 'none';
        if (editorGrid) editorGrid.style.display = 'grid';

        renderCanvas();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });
    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
  }

  function getFormat() {
    let f = 'image/jpeg';
    formatRadios.forEach(r => { if (r.checked) f = r.value; });
    return f;
  }

  function renderCanvas() {
    if (!currentImg || !canvas) return;
    const w = parseInt(widthIn ? widthIn.value : origW) || origW;
    const h = parseInt(heightIn ? heightIn.value : origH) || origH;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(currentImg, 0, 0, w, h);

    if (dimensionsBadge) dimensionsBadge.textContent = w + ' × ' + h + ' px';

    const fmt = getFormat();
    const q = parseInt(qualityRange ? qualityRange.value : 90) / 100;
    canvas.toBlob((blob) => {
      if (blob && newSizeEl) {
        newSizeEl.textContent = formatBytes(blob.size);
      }
    }, fmt, q);
  }

  if (widthIn) {
    widthIn.addEventListener('input', () => {
      const w = parseInt(widthIn.value) || 1;
      if (lockAspect && origW > 0) {
        const ratio = origH / origW;
        if (heightIn) heightIn.value = Math.round(w * ratio);
      }
      renderCanvas();
    });
  }

  if (heightIn) {
    heightIn.addEventListener('input', () => {
      const h = parseInt(heightIn.value) || 1;
      if (lockAspect && origH > 0) {
        const ratio = origW / origH;
        if (widthIn) widthIn.value = Math.round(h * ratio);
      }
      renderCanvas();
    });
  }

  function toggleLock() {
    lockAspect = !lockAspect;
    if (lockAspectBtn) {
      lockAspectBtn.textContent = lockAspect ? '🔒' : '🔓';
      lockAspectBtn.className = 'btn-lock-aspect ' + (lockAspect ? 'locked' : '');
    }
    if (lockCheckbox) lockCheckbox.checked = lockAspect;
  }

  if (lockAspectBtn) lockAspectBtn.addEventListener('click', toggleLock);
  if (lockCheckbox) lockCheckbox.addEventListener('change', (e) => {
    lockAspect = e.target.checked;
    if (lockAspectBtn) {
      lockAspectBtn.textContent = lockAspect ? '🔒' : '🔓';
      lockAspectBtn.className = 'btn-lock-aspect ' + (lockAspect ? 'locked' : '');
    }
  });

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = btn.getAttribute('data-scale');
      const w = btn.getAttribute('data-w');
      const h = btn.getAttribute('data-h');
      if (scale) {
        const sc = parseFloat(scale);
        if (widthIn) widthIn.value = Math.round(origW * sc);
        if (heightIn) heightIn.value = Math.round(origH * sc);
      } else if (w && h) {
        if (widthIn) widthIn.value = parseInt(w);
        if (heightIn) heightIn.value = parseInt(h);
      }
      renderCanvas();
    });
  });

  formatRadios.forEach(r => r.addEventListener('change', renderCanvas));

  if (qualityRange) {
    qualityRange.addEventListener('input', (e) => {
      if (qualityVal) qualityVal.textContent = e.target.value + '%';
      renderCanvas();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!canvas) return;
      const fmt = getFormat();
      const q = parseInt(qualityRange ? qualityRange.value : 90) / 100;
      const ext = fmt === 'image/png' ? 'png' : (fmt === 'image/webp' ? 'webp' : 'jpg');
      const url = canvas.toDataURL(fmt, q);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resized-image.' + ext;
      a.click();
      showToast('Image downloaded successfully!');
    });
  }

  if (changeImgBtn) {
    changeImgBtn.addEventListener('click', () => {
      if (dropzone) dropzone.style.display = 'block';
      if (editorGrid) editorGrid.style.display = 'none';
      if (fileInput) fileInput.value = '';
    });
  }
})();
