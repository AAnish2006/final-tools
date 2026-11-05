/**
 * DevToolBox - Color Converter & WCAG Contrast Checker (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.color-page');
  if (!page) return;

  const workspace = page.querySelector('.color-workspace');
  const tabs = page.querySelectorAll('.color-tabs .color-tab-btn');
  const heroGrid = page.querySelector('.color-hero-grid');
  const palettesSection = page.querySelector('.color-palettes-section');
  const contrastContainer = page.querySelector('.contrast-checker-container');

  // Converter elements
  const picker = page.querySelector('.color-native-picker');
  const preview = page.querySelector('.color-large-preview');
  const hexInput = page.querySelector('.color-value-row:nth-child(1) input');
  const rgbInput = page.querySelector('.color-value-row:nth-child(2) input');
  const hslInput = page.querySelector('.color-value-row:nth-child(3) input');
  const cssInput = page.querySelector('.color-value-row:nth-child(4) input');
  const copyBtns = page.querySelectorAll('.color-copy-btn');

  // Contrast Checker elements
  const fgColorPicker = contrastContainer ? contrastContainer.querySelector('.contrast-pickers-grid .contrast-picker-card:nth-child(1) input[type="color"]') : null;
  const fgTextInput = contrastContainer ? contrastContainer.querySelector('.contrast-pickers-grid .contrast-picker-card:nth-child(1) input[type="text"]') : null;
  const bgColorPicker = contrastContainer ? contrastContainer.querySelector('.contrast-pickers-grid .contrast-picker-card:nth-child(2) input[type="color"]') : null;
  const bgTextInput = contrastContainer ? contrastContainer.querySelector('.contrast-pickers-grid .contrast-picker-card:nth-child(2) input[type="text"]') : null;
  const ratioNumber = contrastContainer ? contrastContainer.querySelector('.contrast-ratio-number') : null;
  const contrastBadges = contrastContainer ? contrastContainer.querySelectorAll('.contrast-badge') : [];
  const livePreviewBox = contrastContainer ? contrastContainer.querySelector('.contrast-live-preview-box') : null;

  let activeTab = 'converter'; // 'converter' | 'contrast'
  let currentColor = '#2563EB';
  let textColor = '#FFFFFF';
  let bgColor = '#0F172A';

  // --- Color Conversion Helpers ---
  function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return null;
    const num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => {
      const h = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return h.length === 1 ? '0' + h : h;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    if (s === 0) {
      const val = Math.round(l * 255);
      return { r: val, g: val, b: val };
    }

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
  }

  // --- WCAG Relative Luminance & Contrast Ratio ---
  function getRelativeLuminance(r, g, b) {
    const sRGB = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function getContrastRatio(rgb1, rgb2) {
    const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // --- Palette Generation ---
  function renderPalettes(hex) {
    if (!palettesSection) return;
    const rgb = hexToRgb(hex) || { r: 37, g: 99, b: 235 };
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const tints = [];
    const shades = [];
    for (let i = 1; i <= 5; i++) {
      const lTint = Math.min(95, hsl.l + i * 8);
      const rgbTint = hslToRgb(hsl.h, hsl.s, lTint);
      tints.push(rgbToHex(rgbTint.r, rgbTint.g, rgbTint.b));

      const lShade = Math.max(5, hsl.l - i * 8);
      const rgbShade = hslToRgb(hsl.h, hsl.s, lShade);
      shades.push(rgbToHex(rgbShade.r, rgbShade.g, rgbShade.b));
    }

    const compHue = (hsl.h + 180) % 360;
    const compRgb = hslToRgb(compHue, hsl.s, hsl.l);
    const compHex = rgbToHex(compRgb.r, compRgb.g, compRgb.b);

    const ana1Hue = (hsl.h + 30) % 360;
    const ana1Rgb = hslToRgb(ana1Hue, hsl.s, hsl.l);
    const ana1Hex = rgbToHex(ana1Rgb.r, ana1Rgb.g, ana1Rgb.b);

    const ana2Hue = (hsl.h + 330) % 360;
    const ana2Rgb = hslToRgb(ana2Hue, hsl.s, hsl.l);
    const ana2Hex = rgbToHex(ana2Rgb.r, ana2Rgb.g, ana2Rgb.b);

    palettesSection.innerHTML = `
      <h3>Tints (Lighter)</h3>
      <div class="color-swatches-row">
        ${tints.map(c => `<div class="color-swatch-box" style="background-color:${c}" data-hex="${c}" title="Click to pick: ${c}"><span>${c}</span></div>`).join('')}
      </div>
      <h3>Shades (Darker)</h3>
      <div class="color-swatches-row">
        ${shades.map(c => `<div class="color-swatch-box" style="background-color:${c}" data-hex="${c}" title="Click to pick: ${c}"><span>${c}</span></div>`).join('')}
      </div>
      <h3>Harmonies & Accents</h3>
      <div class="color-swatches-row">
        <div class="color-swatch-box" style="background-color:${compHex}" data-hex="${compHex}" title="Complementary: ${compHex}"><span>Comp: ${compHex}</span></div>
        <div class="color-swatch-box" style="background-color:${ana1Hex}" data-hex="${ana1Hex}" title="Analogous: ${ana1Hex}"><span>Ana 1: ${ana1Hex}</span></div>
        <div class="color-swatch-box" style="background-color:${ana2Hex}" data-hex="${ana2Hex}" title="Analogous: ${ana2Hex}"><span>Ana 2: ${ana2Hex}</span></div>
      </div>
    `;

    palettesSection.querySelectorAll('.color-swatch-box').forEach(box => {
      box.addEventListener('click', () => {
        const h = box.getAttribute('data-hex');
        if (h) updateColor(h);
      });
    });
  }

  function updateColor(hex) {
    if (!hex.startsWith('#')) hex = '#' + hex;
    currentColor = hex.toUpperCase();

    if (preview) preview.style.backgroundColor = currentColor;
    if (picker) picker.value = currentColor.length === 7 ? currentColor : '#2563EB';
    if (hexInput) hexInput.value = currentColor;

    const rgb = hexToRgb(currentColor);
    if (rgb) {
      if (rgbInput) rgbInput.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      if (hslInput) hslInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
      if (cssInput) cssInput.value = `--color-primary: ${currentColor};`;
      renderPalettes(currentColor);
    }
  }

  // --- WCAG Contrast Update ---
  function updateContrast() {
    const fg = hexToRgb(textColor) || { r: 255, g: 255, b: 255 };
    const bg = hexToRgb(bgColor) || { r: 15, g: 23, b: 42 };

    const ratio = getContrastRatio(fg, bg);
    const formattedRatio = (Math.round(ratio * 100) / 100).toFixed(2);

    if (ratioNumber) {
      ratioNumber.textContent = `${formattedRatio} : 1`;
    }

    const aaNormal = ratio >= 4.5;
    const aaLarge = ratio >= 3.0;
    const aaaNormal = ratio >= 7.0;
    const aaaLarge = ratio >= 4.5;

    const results = [
      { label: 'WCAG AA (Normal)', pass: aaNormal },
      { label: 'WCAG AA (Large)', pass: aaLarge },
      { label: 'WCAG AAA (Normal)', pass: aaaNormal },
      { label: 'WCAG AAA (Large)', pass: aaaLarge }
    ];

    if (contrastBadges.length >= 4) {
      contrastBadges.forEach((badge, idx) => {
        const item = results[idx];
        if (item) {
          badge.className = `contrast-badge ${item.pass ? 'pass' : 'fail'}`;
          badge.innerHTML = `<span>${item.label}: ${item.pass ? '✓ PASS' : '✗ FAIL'}</span>`;
        }
      });
    }

    if (livePreviewBox) {
      livePreviewBox.style.backgroundColor = bgColor;
      livePreviewBox.style.color = textColor;
    }
  }

  function handleFgColorChange(val) {
    textColor = val.toUpperCase();
    if (fgTextInput) fgTextInput.value = textColor;
    if (fgColorPicker && textColor.startsWith('#') && textColor.length === 7) {
      fgColorPicker.value = textColor;
    }
    updateContrast();
  }

  function handleBgColorChange(val) {
    bgColor = val.toUpperCase();
    if (bgTextInput) bgTextInput.value = bgColor;
    if (bgColorPicker && bgColor.startsWith('#') && bgColor.length === 7) {
      bgColorPicker.value = bgColor;
    }
    updateContrast();
  }

  // --- Tab Switching ---
  if (tabs.length >= 2) {
    tabs[0].addEventListener('click', () => {
      activeTab = 'converter';
      tabs[0].classList.add('active');
      tabs[1].classList.remove('active');
      if (heroGrid) heroGrid.style.display = 'grid';
      if (palettesSection) palettesSection.style.display = 'block';
      if (contrastContainer) contrastContainer.style.display = 'none';
    });

    tabs[1].addEventListener('click', () => {
      activeTab = 'contrast';
      tabs[1].classList.add('active');
      tabs[0].classList.remove('active');
      if (heroGrid) heroGrid.style.display = 'none';
      if (palettesSection) palettesSection.style.display = 'none';
      if (contrastContainer) contrastContainer.style.display = 'flex';
      updateContrast();
    });
  }

  // --- Converter Inputs Event Handlers ---
  if (picker) {
    picker.addEventListener('input', (e) => updateColor(e.target.value));
  }

  if (hexInput) {
    hexInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
        const formatted = val.startsWith('#') ? val : `#${val}`;
        updateColor(formatted);
      }
    });
  }

  if (rgbInput) {
    rgbInput.addEventListener('change', (e) => {
      const parts = e.target.value.split(',').map(s => parseInt(s.trim(), 10));
      if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
        const hex = rgbToHex(parts[0], parts[1], parts[2]);
        updateColor(hex);
      }
    });
  }

  if (hslInput) {
    hslInput.addEventListener('change', (e) => {
      const parts = e.target.value.replace(/%/g, '').split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 3 && parts.every(n => !isNaN(n))) {
        const rgb = hslToRgb(parts[0], parts[1], parts[2]);
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        updateColor(hex);
      }
    });
  }

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.color-value-row');
      const inp = row ? row.querySelector('input') : null;
      if (inp) {
        try {
          await navigator.clipboard.writeText(inp.value);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = inp.value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.style.backgroundColor = '#10b981';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.backgroundColor = '';
        }, 1500);
      }
    });
  });

  // --- Contrast Inputs Event Handlers ---
  if (fgColorPicker) {
    fgColorPicker.addEventListener('input', (e) => handleFgColorChange(e.target.value));
  }
  if (fgTextInput) {
    fgTextInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
        const formatted = val.startsWith('#') ? val : `#${val}`;
        handleFgColorChange(formatted);
      } else {
        textColor = val;
        updateContrast();
      }
    });
  }

  if (bgColorPicker) {
    bgColorPicker.addEventListener('input', (e) => handleBgColorChange(e.target.value));
  }
  if (bgTextInput) {
    bgTextInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
        const formatted = val.startsWith('#') ? val : `#${val}`;
        handleBgColorChange(formatted);
      } else {
        bgColor = val;
        updateContrast();
      }
    });
  }

  // Initial runs
  updateColor('#2563EB');
  updateContrast();
})();
