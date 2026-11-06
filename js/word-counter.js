/**
 * DevToolBox - Word Counter & Platform Limit Checker (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.wordcounter-page');
  if (!page) return;

  const textarea = page.querySelector('.wc-textarea');
  const statCards = page.querySelectorAll('.wc-stats-grid .wc-stat-card');
  const platformSelect = page.querySelector('#platform-select');
  const statusBadge = page.querySelector('.platform-status-badge');
  const progressFill = page.querySelector('.platform-progress-fill');
  const progressText = page.querySelector('.progress-text-label');
  const progressPercent = page.querySelector('.progress-percent-label');
  const actionsContainer = page.querySelector('.wc-actions');
  const pasteBtn = actionsContainer ? actionsContainer.querySelector('button:nth-child(1)') : null;
  const clearBtn = actionsContainer ? actionsContainer.querySelector('.toolbar-btn-danger') : null;

  const PLATFORM_MAP = {
    'general': { name: 'General', limit: 20000 },
    'x-standard': { name: 'X: Standard post', limit: 280, xWeighted: true },
    'x-premium': { name: 'X: Longer post', limit: 25000, xWeighted: true },
    'x-bio': { name: 'X: Profile Bio', limit: 160 },
    'x-name': { name: 'X: Profile Display Name', limit: 50 },
    'li-post': { name: 'LinkedIn: Post / Status', limit: 3000 },
    'li-headline': { name: 'LinkedIn: Profile Headline', limit: 220 },
    'yt-title': { name: 'YouTube: Video Title', limit: 100 },
    'yt-desc': { name: 'YouTube: Video Description', limit: 5000 },
    'pin-title': { name: 'Pinterest: Pin Title', limit: 100 },
    'pin-desc': { name: 'Pinterest: Pin Description', limit: 800 }
  };

  // X uses twitter-text v3 weighted length: most code points weigh 2, selected
  // Latin ranges weigh 1, emoji sequences weigh 2, and recognized URLs weigh 23.
  // https://github.com/twitter/twitter-text/blob/master/config/v3.json
  const graphemeSegmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;
  const wordSegmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null;

  function graphemes(value) {
    if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(value), part => part.segment);
    const points = Array.from(value);
    const result = [];
    for (let i = 0; i < points.length; i++) {
      let cluster = points[i];
      if (/\p{Regional_Indicator}/u.test(cluster) && i + 1 < points.length && /\p{Regional_Indicator}/u.test(points[i + 1])) cluster += points[++i];
      while (i + 1 < points.length && /[\p{Mark}\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]/u.test(points[i + 1])) cluster += points[++i];
      while (points[i + 1] === '\u200d' && i + 2 < points.length) {
        cluster += points[++i] + points[++i];
        while (i + 1 < points.length && /[\p{Mark}\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]/u.test(points[i + 1])) cluster += points[++i];
      }
      result.push(cluster);
    }
    return result;
  }

  function isXLightCodePoint(codePoint) {
    return codePoint <= 0x10ff ||
      (codePoint >= 0x2000 && codePoint <= 0x200d) ||
      (codePoint >= 0x2010 && codePoint <= 0x201f) ||
      (codePoint >= 0x2032 && codePoint <= 0x2037);
  }

  function xTokens(value) {
    const urlPattern = /https?:\/\/[^\s]+/giu;
    let cursor = 0;
    const tokens = [];
    for (const match of value.matchAll(urlPattern)) {
      let url = match[0];
      while (/[),.!?;:'"\]}]$/u.test(url)) url = url.slice(0, -1);
      if (!url || match.index < cursor) continue;
      if (match.index > cursor) tokens.push({ text: value.slice(cursor, match.index) });
      tokens.push({ text: url, weight: 23 });
      cursor = match.index + url.length;
    }
    if (cursor < value.length) tokens.push({ text: value.slice(cursor) });
    return tokens;
  }

  function xWeightedLength(value) {
    return xTokens(value).reduce((total, token) => total + (token.weight ||
      graphemes(token.text).reduce((n, g) => n + xGraphemeWeight(g), 0)), 0);
  }

  function xGraphemeWeight(grapheme) {
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(grapheme)) return 2;
    let weight = 0;
    for (const char of grapheme) weight += isXLightCodePoint(char.codePointAt(0)) ? 1 : 2;
    return weight;
  }

  function countForPlatform(value, platform) {
    return platform.xWeighted ? xWeightedLength(value) : graphemes(value).length;
  }

  function trimForPlatform(value, limit, platform) {
    let result = '';
    let used = 0;
    const tokens = platform.xWeighted ? xTokens(value) : [{ text: value }];
    for (const token of tokens) {
      if (token.weight) {
        if (used + token.weight > limit) break;
        result += token.text;
        used += token.weight;
        continue;
      }
      for (const part of graphemes(token.text)) {
        const weight = platform.xWeighted ? xGraphemeWeight(part) : 1;
        if (used + weight > limit) return result;
        result += part;
        used += weight;
      }
    }
    return result;
  }

  // Create or reference the overflow highlighter card container right after textarea
  let overflowCard = page.querySelector('.overflow-highlighter-card');
  if (!overflowCard && textarea) {
    overflowCard = document.createElement('div');
    overflowCard.className = 'overflow-highlighter-card';
    overflowCard.setAttribute('role', 'alert');
    overflowCard.style.display = 'none';
    textarea.parentNode.insertBefore(overflowCard, textarea.nextSibling);
  }

  // Create or reference the keyword density container before the seo content
  const adBanner = page.querySelector('.ad-banner');
  let keywordsCard = page.querySelector('.wc-keywords');
  if (!keywordsCard) {
    keywordsCard = document.createElement('div');
    keywordsCard.className = 'wc-keywords';
    keywordsCard.style.display = 'none';
    if (adBanner) {
      adBanner.parentNode.insertBefore(keywordsCard, adBanner.nextSibling);
    } else if (textarea) {
      textarea.parentNode.appendChild(keywordsCard);
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function handleTrim(limit, platform) {
    if (textarea && countForPlatform(textarea.value, platform) > limit) {
      textarea.value = trimForPlatform(textarea.value, limit, platform);
      update();
    }
  }

  function update() {
    if (!textarea) return;
    const text = textarea.value;
    const trimmed = text.trim();
    const words = wordSegmenter
      ? Array.from(wordSegmenter.segment(trimmed)).filter(part => part.isWordLike).length
      : (trimmed ? trimmed.split(/\s+/u).length : 0);
    const characters = graphemes(text).length;
    const charactersNoSpace = graphemes(text.replace(/\s/gu, '')).length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+/g) || []).length || (trimmed.length > 0 ? 1 : 0) : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const readingTime = Math.ceil(words / 200);

    // Update 6 stat cards
    if (statCards.length >= 6) {
      const numbers = [
        words.toLocaleString(),
        characters.toLocaleString(),
        charactersNoSpace.toLocaleString(),
        sentences.toLocaleString(),
        paragraphs.toLocaleString(),
        `${readingTime} min`
      ];
      statCards.forEach((card, idx) => {
        if (numbers[idx] !== undefined) {
          const numEl = card.querySelector('.wc-stat-number');
          if (numEl) numEl.textContent = numbers[idx];
        }
      });
    }

    // Platform limit logic
    const platformId = platformSelect ? platformSelect.value : 'general';
    const platform = PLATFORM_MAP[platformId] || PLATFORM_MAP.general;
    const limit = platform.limit;
    const limitUnit = platform.xWeighted ? 'weighted units' : 'characters';
    const platformCount = countForPlatform(text, platform);
    const isExceeded = platformCount > limit;
    const diff = Math.abs(limit - platformCount);
    const percent = Math.min(100, Math.round((platformCount / limit) * 100));

    // Update status badge
    if (statusBadge) {
      if (isExceeded) {
        statusBadge.className = 'platform-status-badge badge-exceeded';
        statusBadge.innerHTML = `⚠️ Exceeded by <strong>${diff.toLocaleString()}</strong> ${platform.xWeighted ? 'weighted units' : 'chars'}`;
      } else {
        statusBadge.className = 'platform-status-badge badge-safe';
        statusBadge.innerHTML = `✓ <strong>${diff.toLocaleString()}</strong> ${platform.xWeighted ? 'weighted units' : 'chars'} remaining`;
      }
    }

    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
      if (isExceeded) {
        progressFill.className = 'platform-progress-fill fill-exceeded';
      } else if (percent > 85) {
        progressFill.className = 'platform-progress-fill fill-warning';
      } else {
        progressFill.className = 'platform-progress-fill fill-normal';
      }
    }

    if (progressText) {
      const countLabel = platform.xWeighted ? 'weighted units' : 'characters';
      progressText.innerHTML = `<strong>${platformCount.toLocaleString()}</strong> of <strong>${limit.toLocaleString()}</strong> ${countLabel} used`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${percent}%`;
    }

    // Update textarea exceeded border
    textarea.classList.toggle('wc-textarea-exceeded', isExceeded);

    // Update "Trim Extra Characters" button in .wc-actions
    let trimBtn = actionsContainer ? actionsContainer.querySelector('.toolbar-btn-trim') : null;
    if (isExceeded) {
      if (!trimBtn && actionsContainer) {
        trimBtn = document.createElement('button');
        trimBtn.className = 'toolbar-btn toolbar-btn-trim';
        trimBtn.addEventListener('click', () => {
          const selectedPlatform = PLATFORM_MAP[platformSelect ? platformSelect.value : 'general'] || PLATFORM_MAP.general;
          handleTrim(selectedPlatform.limit, selectedPlatform);
        });
        if (clearBtn && clearBtn.parentNode === actionsContainer) {
          actionsContainer.insertBefore(trimBtn, clearBtn);
        } else {
          actionsContainer.appendChild(trimBtn);
        }
      }
      if (trimBtn) {
        trimBtn.title = `Trim extra ${platform.xWeighted ? 'weighted units' : 'characters'} exceeding the platform limit`;
        trimBtn.textContent = `✂️ Trim Extra ${platform.xWeighted ? 'Units' : 'Characters'}`;
      }
    } else {
      if (trimBtn && trimBtn.parentNode) {
        trimBtn.parentNode.removeChild(trimBtn);
      }
    }

    // Update Overflow Highlighter Card
    if (isExceeded) {
      const validPart = trimForPlatform(text, limit, platform);
      const excessPart = text.slice(validPart.length);

      overflowCard.style.display = 'block';
      overflowCard.innerHTML = `
        <div class="overflow-highlighter-header">
          <div class="overflow-title-group">
            <span class="overflow-alert-icon">🎉</span>
            <h3>Character Overflow Alert</h3>
            <span class="overflow-count-pill">+${diff.toLocaleString()} extra ${limitUnit}</span>
          </div>
          <button class="btn-trim-action">✂️ Trim to ${limit.toLocaleString()} ${platform.xWeighted ? 'units' : 'chars'}</button>
        </div>
        <p class="overflow-instruction">
          The red highlighted text below exceeds the <strong>${platform.name}</strong> limit (${limit.toLocaleString()} ${limitUnit}) and may be rejected or truncated when posted:
        </p>
        <div class="overflow-visual-preview">
          <span class="text-valid">${escapeHtml(validPart)}</span><mark class="text-excess" title="This text exceeds the allowed limit by ${diff.toLocaleString()} ${limitUnit}">${escapeHtml(excessPart)}</mark>
        </div>
      `;

      const cardTrimBtn = overflowCard.querySelector('.btn-trim-action');
      if (cardTrimBtn) {
        cardTrimBtn.addEventListener('click', () => handleTrim(limit, platform));
      }
    } else {
      overflowCard.style.display = 'none';
      overflowCard.innerHTML = '';
    }

    // Keyword density analytics
    const wordList = trimmed.toLocaleLowerCase().split(/\s+/u).filter(w => graphemes(w).length > 3);
    const freq = {};
    wordList.forEach(w => {
      const clean = w.replace(/[^\p{L}\p{N}]/gu, '');
      if (graphemes(clean).length > 3) freq[clean] = (freq[clean] || 0) + 1;
    });

    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([wrd, count]) => ({
        word: wrd,
        count: count,
        density: words > 0 ? ((count / words) * 100).toFixed(1) : 0
      }));

    if (topKeywords.length > 0) {
      keywordsCard.style.display = 'block';
      keywordsCard.innerHTML = `
        <h2>Keyword Density & Term Frequency</h2>
        <div class="keywords-table">
          <div class="keywords-header">
            <span>Keyword</span>
            <span>Count</span>
            <span>Density</span>
          </div>
          ${topKeywords.map(kw => `
            <div class="keyword-row">
              <span class="keyword-word">${escapeHtml(kw.word)}</span>
              <span class="keyword-count">${kw.count}</span>
              <span class="keyword-density">${kw.density}%</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      keywordsCard.style.display = 'none';
      keywordsCard.innerHTML = '';
    }
  }

  if (textarea) textarea.addEventListener('input', update);
  if (platformSelect) platformSelect.addEventListener('change', update);

  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const clip = await navigator.clipboard.readText();
        if (textarea) {
          textarea.value = clip;
          update();
        }
      } catch (e) {
        textarea.focus();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (textarea) {
        textarea.value = '';
        update();
        textarea.focus();
      }
    });
  }

  // Initial update
  update();
})();
