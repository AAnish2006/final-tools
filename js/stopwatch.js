/**
 * DevToolBox - Stopwatch & Countdown Timer (Vanilla JS Exact React Replica)
 */
(function() {
  const workspace = document.querySelector('.sw-workspace');
  if (!workspace) return;

  const stopwatchTab = workspace.querySelector('.sw-mode-tabs button:nth-child(1)');
  const timerTab = workspace.querySelector('.sw-mode-tabs button:nth-child(2)');
  const fullscreenToggle = workspace.querySelector('.sw-fullscreen-toggle');

  const swContainer = workspace.querySelector('.sw-stopwatch-container');
  const timerContainer = workspace.querySelector('.sw-timer-container');

  let currentMode = 'stopwatch';

  // Mode switching
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'stopwatch') {
      if (stopwatchTab) stopwatchTab.classList.add('active');
      if (timerTab) timerTab.classList.remove('active');
      if (swContainer) swContainer.style.display = 'block';
      if (timerContainer) timerContainer.style.display = 'none';
    } else {
      if (stopwatchTab) stopwatchTab.classList.remove('active');
      if (timerTab) timerTab.classList.add('active');
      if (swContainer) swContainer.style.display = 'none';
      if (timerContainer) timerContainer.style.display = 'block';
    }
  }

  if (stopwatchTab) stopwatchTab.addEventListener('click', () => setMode('stopwatch'));
  if (timerTab) timerTab.addEventListener('click', () => setMode('timer'));

  // Fullscreen
  let isFullscreen = false;
  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
      document.body.classList.add('sw-fullscreen-open');
      workspace.classList.add('fullscreen-active');
      fullscreenToggle.textContent = '🗗 Exit Fullscreen';
      fullscreenToggle.classList.add('active');
    } else {
      document.body.classList.remove('sw-fullscreen-open');
      workspace.classList.remove('fullscreen-active');
      fullscreenToggle.textContent = '⛶ Fullscreen';
      fullscreenToggle.classList.remove('active');
    }
  }

  if (fullscreenToggle) fullscreenToggle.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
  });

  // --- STOPWATCH LOGIC ---
  let swRunning = false;
  let swStart = 0;
  let swAccum = 0;
  let swAnimId = null;
  let laps = [];

  const timeUnits = swContainer ? swContainer.querySelectorAll('.sw-time-unit') : [];
  const msUnit = swContainer ? swContainer.querySelector('.sw-ms-unit') : null;
  const swStartBtn = swContainer ? swContainer.querySelector('.sw-controls-row .btn-start') : null;
  const swLapBtn = swContainer ? swContainer.querySelector('.sw-controls-row .btn-lap') : null;
  const swResetBtn = swContainer ? swContainer.querySelector('.sw-controls-row .btn-reset') : null;
  const lapsWrapper = swContainer ? swContainer.querySelector('.sw-laps-wrapper') : null;
  const lapsTbody = swContainer ? swContainer.querySelector('.sw-laps-table tbody') : null;
  const copyLapsBtn = swContainer ? swContainer.querySelector('.sw-copy-laps-btn') : null;

  function pad(n, len = 2) {
    return n.toString().padStart(len, '0');
  }

  function formatTime(ms) {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSecs = Math.floor(ms / 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hrs = Math.floor(totalSecs / 3600);
    return { hrs: pad(hrs), mins: pad(mins), secs: pad(secs), centis: pad(centis) };
  }

  function updateStopwatchDisplay(elapsed) {
    const t = formatTime(elapsed);
    if (timeUnits.length >= 3) {
      timeUnits[0].textContent = t.hrs;
      timeUnits[1].textContent = t.mins;
      timeUnits[2].textContent = t.secs;
    }
    if (msUnit) msUnit.textContent = '.' + t.centis;
  }

  function getStopwatchElapsed() {
    return swRunning ? swAccum + (performance.now() - swStart) : swAccum;
  }

  function tickStopwatch() {
    if (swRunning) {
      const current = swAccum + (performance.now() - swStart);
      updateStopwatchDisplay(current);
      swAnimId = requestAnimationFrame(tickStopwatch);
    }
  }

  function startPauseStopwatch() {
    if (swRunning) {
      // Pause
      swRunning = false;
      swAccum += performance.now() - swStart;
      cancelAnimationFrame(swAnimId);
      if (swStartBtn) {
        swStartBtn.textContent = '▶ Start';
        swStartBtn.classList.remove('btn-pause');
        swStartBtn.classList.add('btn-start');
      }
      // In React: Reset is enabled when paused and elapsed > 0
      if (swResetBtn) {
        swResetBtn.disabled = false;
        swResetBtn.removeAttribute('disabled');
      }
      // In React: Lap is enabled as long as elapsed > 0, even when paused!
      if (swLapBtn) {
        swLapBtn.disabled = false;
        swLapBtn.removeAttribute('disabled');
      }
    } else {
      // Start / Resume
      swRunning = true;
      swStart = performance.now();
      swAnimId = requestAnimationFrame(tickStopwatch);
      if (swStartBtn) {
        swStartBtn.textContent = '⏸ Pause';
        swStartBtn.classList.remove('btn-start');
        swStartBtn.classList.add('btn-pause');
      }
      // Reset is disabled while running
      if (swResetBtn) {
        swResetBtn.disabled = true;
        swResetBtn.setAttribute('disabled', 'true');
      }
      // Lap is enabled while running
      if (swLapBtn) {
        swLapBtn.disabled = false;
        swLapBtn.removeAttribute('disabled');
      }
    }
  }

  function recordLap() {
    const elapsed = getStopwatchElapsed();

    if (elapsed === 0) {
      if (typeof showToast === 'function') {
        showToast('Start the stopwatch first to record split laps!', 'error');
      }
      return;
    }

    const currentLapTime = laps.length === 0
      ? elapsed
      : elapsed - laps[0].overallTime;

    const newLap = {
      id: laps.length + 1,
      lapTime: currentLapTime,
      overallTime: elapsed
    };

    laps.unshift(newLap);
    renderLaps();
  }

  function renderLaps() {
    if (!lapsWrapper || !lapsTbody) return;

    if (laps.length === 0) {
      lapsWrapper.style.display = 'none';
      lapsTbody.innerHTML = '';
      return;
    }

    lapsWrapper.style.display = 'block';
    const headerTitle = lapsWrapper.querySelector('.sw-laps-header h3');
    if (headerTitle) {
      headerTitle.textContent = 'Recorded Laps (' + laps.length + ')';
    }

    // Identify fastest and slowest laps
    let fastestLapId = null;
    let slowestLapId = null;
    if (laps.length > 1) {
      const sorted = [...laps].sort((a, b) => a.lapTime - b.lapTime);
      fastestLapId = sorted[0].id;
      slowestLapId = sorted[sorted.length - 1].id;
      if (fastestLapId === slowestLapId) {
        fastestLapId = null;
        slowestLapId = null;
      }
    }

    lapsTbody.innerHTML = laps.map((lap) => {
      const split = formatTime(lap.lapTime);
      const total = formatTime(lap.overallTime);
      const isFastest = lap.id === fastestLapId;
      const isSlowest = lap.id === slowestLapId;

      let cls = '';
      if (isFastest) cls += 'lap-fastest ';
      if (isSlowest) cls += 'lap-slowest';

      const fastBadge = isFastest ? '<span class="lap-tag tag-fast">Fastest</span>' : '';
      const slowBadge = isSlowest ? '<span class="lap-tag tag-slow">Slowest</span>' : '';

      return '<tr class="' + cls.trim() + '">' +
        '<td>Lap ' + lap.id + ' ' + fastBadge + slowBadge + '</td>' +
        '<td>' + split.mins + ':' + split.secs + '.' + split.centis + '</td>' +
        '<td>' + total.mins + ':' + total.secs + '.' + total.centis + '</td>' +
      '</tr>';
    }).join('');
  }

  function resetStopwatch() {
    swRunning = false;
    cancelAnimationFrame(swAnimId);
    swAccum = 0;
    laps = [];
    updateStopwatchDisplay(0);

    if (swStartBtn) {
      swStartBtn.textContent = '▶ Start';
      swStartBtn.classList.remove('btn-pause');
      swStartBtn.classList.add('btn-start');
    }
    if (swLapBtn) {
      swLapBtn.disabled = true;
      swLapBtn.setAttribute('disabled', 'true');
    }
    if (swResetBtn) {
      swResetBtn.disabled = true;
      swResetBtn.setAttribute('disabled', 'true');
    }
    renderLaps();
  }

  if (swStartBtn) swStartBtn.addEventListener('click', startPauseStopwatch);
  if (swLapBtn) swLapBtn.addEventListener('click', recordLap);
  if (swResetBtn) swResetBtn.addEventListener('click', resetStopwatch);

  if (copyLapsBtn) {
    copyLapsBtn.addEventListener('click', async () => {
      if (laps.length === 0) return;
      const text = laps.map(l => {
        const split = formatTime(l.lapTime);
        const total = formatTime(l.overallTime);
        return 'Lap ' + l.id + ': ' + split.mins + ':' + split.secs + '.' + split.centis + ' (Total: ' + total.mins + ':' + total.secs + '.' + total.centis + ')';
      }).join('\n');

      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      if (typeof showToast === 'function') {
        showToast('Laps copied to clipboard!');
      } else {
        alert('Laps copied to clipboard!');
      }
    });
  }

  // --- COUNTDOWN TIMER LOGIC ---
  let startPauseTimerFn = null;
  let resetTimerFn = null;

  if (timerContainer) {
    let timerTotal = 300; // 5 mins
    let timerRemaining = 300;
    let timerRunning = false;
    let timerInterval = null;

    const timerDisplay = timerContainer.querySelector('.sw-timer-display');
    const timerProgress = timerContainer.querySelector('.sw-progress-fill');
    const timerStartBtn = timerContainer.querySelector('.sw-controls-row .btn-start');
    const timerPlusBtn = timerContainer.querySelector('.sw-controls-row .btn-plus');
    const timerResetBtn = timerContainer.querySelector('.sw-controls-row .btn-reset');
    const presetBtns = timerContainer.querySelectorAll('.sw-preset-btn');
    const setTimeBtn = timerContainer.querySelector('.sw-set-time-btn');
    const hoursIn = timerContainer.querySelector('#sw-hours-input');
    const minsIn = timerContainer.querySelector('#sw-mins-input');
    const secsIn = timerContainer.querySelector('#sw-secs-input');

    function playChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.2);
        gain2.gain.setValueAtTime(0.35, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.8);
      } catch (e) {}
    }

    function renderTimer() {
      const s = timerRemaining % 60;
      const m = Math.floor(timerRemaining / 60) % 60;
      const h = Math.floor(timerRemaining / 3600);
      let str = pad(m) + ':' + pad(s);
      if (h > 0) str = pad(h) + ':' + str;

      if (timerDisplay) timerDisplay.textContent = str;
      if (timerProgress) {
        const pct = timerTotal > 0 ? ((timerTotal - timerRemaining) / timerTotal) * 100 : 0;
        timerProgress.style.width = pct + '%';
      }
    }

    function startPauseTimer() {
      if (timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);
        if (timerStartBtn) timerStartBtn.textContent = '▶ Start';
      } else {
        if (timerRemaining === 0) timerRemaining = timerTotal;
        timerRunning = true;
        if (timerStartBtn) timerStartBtn.textContent = '⏸ Pause';
        timerInterval = setInterval(() => {
          if (timerRemaining > 0) {
            timerRemaining--;
            renderTimer();
            if (timerRemaining === 0) {
              clearInterval(timerInterval);
              timerRunning = false;
              if (timerStartBtn) timerStartBtn.textContent = '▶ Start';
              playChime();
              if (typeof showToast === 'function') {
                showToast('🔔 Time is up! Great job.');
              }
            }
          }
        }, 1000);
      }
    }

    function resetTimer() {
      timerRunning = false;
      clearInterval(timerInterval);
      timerRemaining = timerTotal;
      if (timerStartBtn) timerStartBtn.textContent = '▶ Start';
      renderTimer();
    }

    startPauseTimerFn = startPauseTimer;
    resetTimerFn = resetTimer;

    if (timerStartBtn) timerStartBtn.addEventListener('click', startPauseTimer);

    if (timerPlusBtn) {
      timerPlusBtn.addEventListener('click', () => {
        timerRemaining += 60;
        timerTotal += 60;
        renderTimer();
      });
    }

    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', resetTimer);
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const secs = parseInt(btn.getAttribute('data-secs')) || 300;
        timerRunning = false;
        clearInterval(timerInterval);
        timerTotal = secs;
        timerRemaining = secs;
        if (timerStartBtn) timerStartBtn.textContent = '▶ Start';
        renderTimer();
      });
    });

    if (setTimeBtn) {
      setTimeBtn.addEventListener('click', () => {
        const h = parseInt(hoursIn.value) || 0;
        const m = parseInt(minsIn.value) || 0;
        const s = parseInt(secsIn.value) || 0;
        const total = h * 3600 + m * 60 + s;
        if (total > 0) {
          timerRunning = false;
          clearInterval(timerInterval);
          timerTotal = total;
          timerRemaining = total;
          if (timerStartBtn) timerStartBtn.textContent = '▶ Start';
          renderTimer();
        }
      });
    }

    renderTimer();
  }

  // Hotkeys (Space = Start/Pause, L = Lap, R = Reset)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (currentMode === 'stopwatch') {
        startPauseStopwatch();
      } else if (startPauseTimerFn) {
        startPauseTimerFn();
      }
    } else if (e.key === 'l' || e.key === 'L') {
      if (currentMode === 'stopwatch') {
        recordLap();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      if (currentMode === 'stopwatch') {
        resetStopwatch();
      } else if (resetTimerFn) {
        resetTimerFn();
      }
    }
  });
})();
