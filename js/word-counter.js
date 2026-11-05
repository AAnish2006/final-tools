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
    'x-standard': { name: 'X: Free / Standard Tweet', limit: 280 },
    'x-premium': { name: 'X: Premium / Long Tweet', limit: 25000 },
    'x-dm': { name: 'X: Direct Messages (DMs)', limit: 10000 },
    'x-bio': { name: 'X: Profile Bio', limit: 160 },
    'x-name': { name: 'X: Profile Display Name', limit: 50 },
    'ig-caption': { name: 'Instagram: Post Caption', limit: 2200 },
    'ig-bio': { name: 'Instagram: Profile Bio', limit: 150 },
    'ig-comment': { name: 'Instagram: Comment', limit: 2200 },
    'li-post': { name: 'LinkedIn: Post / Status', limit: 3000 },
    'li-headline': { name: 'LinkedIn: Profile Headline', limit: 220 },
    'li-about': { name: 'LinkedIn: About / Summary', limit: 2600 },
    'fb-post': { name: 'Facebook: Post Status', limit: 63206 },
    'fb-comment': { name: 'Facebook: Comment', limit: 8000 },
    'yt-title': { name: 'YouTube: Video Title', limit: 100 },
    'yt-desc': { name: 'YouTube: Video Description', limit: 5000 },
    'yt-channel': { name: 'YouTube: Channel About', limit: 1000 },
    'tt-caption': { name: 'TikTok: Video Caption', limit: 2200 },
    'tt-bio': { name: 'TikTok: Profile Bio', limit: 80 },
    'pin-title': { name: 'Pinterest: Pin Title', limit: 100 },
    'pin-desc': { name: 'Pinterest: Pin Description', limit: 500 },
    'seo-title': { name: 'Google: SEO Meta Title', limit: 60 },
    'seo-desc': { name: 'Google: SEO Meta Description', limit: 160 },
    'sms-single': { name: 'SMS: Single Text Message', limit: 160 }
  };

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

  function handleTrim(limit) {
    if (textarea && textarea.value.length > limit) {
      textarea.value = textarea.value.slice(0, limit);
      update();
    }
  }

  function update() {
    if (!textarea) return;
    const text = textarea.value;
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpace = text.replace(/\s/g, '').length;
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
    const platform = PLATFORM_MAP[platformId] || { name: 'General', limit: 20000 };
    const limit = platform.limit;
    const isExceeded = characters > limit;
    const diff = Math.abs(limit - characters);
    const percent = Math.min(100, Math.round((characters / limit) * 100));

    // Update status badge
    if (statusBadge) {
      if (isExceeded) {
        statusBadge.className = 'platform-status-badge badge-exceeded';
        statusBadge.innerHTML = `⚠️ Exceeded by <strong>${diff.toLocaleString()}</strong> chars`;
      } else {
        statusBadge.className = 'platform-status-badge badge-safe';
        statusBadge.innerHTML = `✓ <strong>${diff.toLocaleString()}</strong> chars remaining`;
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
      progressText.innerHTML = `<strong>${characters.toLocaleString()}</strong> of <strong>${limit.toLocaleString()}</strong> characters used`;
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
        trimBtn.title = 'Trim extra characters exceeding the platform limit';
        trimBtn.textContent = '✂️ Trim Extra Characters';
        trimBtn.addEventListener('click', () => handleTrim(limit));
        if (clearBtn && clearBtn.parentNode === actionsContainer) {
          actionsContainer.insertBefore(trimBtn, clearBtn);
        } else {
          actionsContainer.appendChild(trimBtn);
        }
      }
    } else {
      if (trimBtn && trimBtn.parentNode) {
        trimBtn.parentNode.removeChild(trimBtn);
      }
    }

    // Update Overflow Highlighter Card
    if (isExceeded) {
      const validPart = text.slice(0, limit);
      const excessPart = text.slice(limit);

      overflowCard.style.display = 'block';
      overflowCard.innerHTML = `
        <div class="overflow-highlighter-header">
          <div class="overflow-title-group">
            <span class="overflow-alert-icon">🎉</span>
            <h3>Character Overflow Alert</h3>
            <span class="overflow-count-pill">+${diff.toLocaleString()} extra characters</span>
          </div>
          <button class="btn-trim-action">✂️ Trim to ${limit.toLocaleString()} chars</button>
        </div>
        <p class="overflow-instruction">
          The red highlighted characters below exceed the <strong>${platform.name}</strong> limit (${limit.toLocaleString()} characters) and will be rejected or truncated when posted:
        </p>
        <div class="overflow-visual-preview">
          <span class="text-valid">${escapeHtml(validPart)}</span><mark class="text-excess" title="These ${diff.toLocaleString()} characters exceed the allowed limit">${escapeHtml(excessPart)}</mark>
        </div>
      `;

      const cardTrimBtn = overflowCard.querySelector('.btn-trim-action');
      if (cardTrimBtn) {
        cardTrimBtn.addEventListener('click', () => handleTrim(limit));
      }
    } else {
      overflowCard.style.display = 'none';
      overflowCard.innerHTML = '';
    }

    // Keyword density analytics
    const wordList = trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const freq = {};
    wordList.forEach(w => {
      const clean = w.replace(/[^a-z0-9]/g, '');
      if (clean.length > 3) freq[clean] = (freq[clean] || 0) + 1;
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
