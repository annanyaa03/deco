/* ==========================================================================
   DECO MINI — Phase 3 Shared Interactivity Engine
   Features: Auto-cycle, Timing Diagram, Tooltips, Keyboard Shortcuts,
             Live Number Display, Live Boolean Evaluation, Sound Toggle
   ========================================================================== */

"use strict";

window.DecoInteractivity = (() => {
  /* ── Private State ────────────────────────────────────────────────────── */
  let _adapter = null;          // Circuit-specific adapter
  let _cycleTimer = null;       // setInterval handle
  let _cycleIndex = 0;          // Current truth-table row index
  let _cyclePlaying = false;
  let _cycleSpeed = 1000;       // ms between steps
  let _cyclePaused = false;     // Timing diagram paused
  let _timingHistory = [];      // Array of {labels, values} snapshots
  const TIMING_HISTORY_LEN = 16;

  // Sound
  let _audioCtx = null;
  let _soundEnabled = false;
  let _prevOutputs = null;

  // Tooltip
  let _tooltipEl = null;

  // Theme
  let _darkMode = false;

  /* ── Bootstrap ────────────────────────────────────────────────────────── */
  function init(adapter) {
    _adapter = adapter;
    _buildControlBar();
    _buildNumberDisplay();
    _buildTimingDiagram();
    _buildTooltip();
    _buildShortcutsPopover();
    _attachKeyboard();
    _attachTruthTableClicks();
    _recordTimingSnapshot();
    _renderTimingDiagram();
    _updateNumberDisplay();
    _updateLiveBooleanEval();
    _applyTimingPauseState();
  }

  /* ── Adapter Interface ────────────────────────────────────────────────── */
  /*
    adapter = {
      getInputs()       → array of {key, label, value}
      getOutputs()      → array of {key, label, value}
      getAllCombinations() → array of objects that can be passed to applyInputs
      applyInputs(combo)  → set state & call circuit update
      resetFn()           → call circuit's native reset
      getLiveBoolHTML()   → returns HTML string for live boolean eval
      getSignalLabels()   → returns [{label, getValue}] for timing diagram
      id                  → unique prefix string ('ha', 'fa', 'enc', etc.)
    }
  */

  /* ── Notify: called by circuit JS after every state update ────────────── */
  function onUpdate() {
    if (!_adapter) return;
    _updateNumberDisplay();
    _updateLiveBooleanEval();
    if (!_cyclePaused) {
      _recordTimingSnapshot();
      _renderTimingDiagram();
    }
    _checkOutputChange();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     1. AUTO-CYCLE CONTROL BAR
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildControlBar() {
    const ws = document.querySelector(".sim-workspace");
    if (!ws || document.getElementById("deco-controlbar")) return;

    const bar = document.createElement("div");
    bar.id = "deco-controlbar";
    bar.className = "deco-controlbar";
    bar.innerHTML = `
      <div class="deco-cb-group">
        <button id="deco-btn-prev" class="deco-cb-btn" title="Step Back (←)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button id="deco-btn-play" class="deco-cb-btn deco-cb-primary" title="Play/Pause (Space)">
          <svg id="deco-play-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          <svg id="deco-pause-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <span id="deco-play-label">Play</span>
        </button>
        <button id="deco-btn-next" class="deco-cb-btn" title="Step Forward (→)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div class="deco-cb-group deco-cb-speed">
        <span class="deco-cb-label">Speed</span>
        <input type="range" id="deco-speed-slider" min="0" max="100" value="50"
               title="Cycle speed (0.5s – 3s)" class="deco-speed-range" />
        <span id="deco-speed-val" class="deco-cb-label">1.0s</span>
      </div>
      <div class="deco-cb-sep"></div>
      <div class="deco-cb-group">
        <button id="deco-btn-sound" class="deco-cb-btn deco-cb-icon" title="Toggle Sound (off by default)">
          <svg id="deco-snd-off" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          <svg id="deco-snd-on"  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </button>
        <button id="deco-btn-theme" class="deco-cb-btn deco-cb-icon" title="Toggle Theme (T)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
        <button id="deco-btn-kbd" class="deco-cb-btn deco-cb-icon" title="Keyboard Shortcuts (?)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
        </button>
      </div>
    `;

    // Insert before the sim-header's first child
    const simHeader = ws.querySelector(".sim-header");
    if (simHeader) {
      ws.insertBefore(bar, simHeader);
    } else {
      ws.prepend(bar);
    }

    // Wire events
    document.getElementById("deco-btn-play").addEventListener("click", togglePlay);
    document.getElementById("deco-btn-next").addEventListener("click", stepForward);
    document.getElementById("deco-btn-prev").addEventListener("click", stepBack);
    document.getElementById("deco-btn-sound").addEventListener("click", toggleSound);
    document.getElementById("deco-btn-theme").addEventListener("click", toggleTheme);
    document.getElementById("deco-btn-kbd").addEventListener("click", toggleShortcutsPopover);

    const slider = document.getElementById("deco-speed-slider");
    slider.addEventListener("input", () => {
      const v = parseInt(slider.value); // 0-100
      // Map 0→3000ms, 50→1000ms, 100→500ms (exponential)
      _cycleSpeed = Math.round(3000 * Math.pow(0.5 / 3, v / 100));
      document.getElementById("deco-speed-val").textContent = (_cycleSpeed / 1000).toFixed(1) + "s";
      if (_cyclePlaying) {
        clearInterval(_cycleTimer);
        _cycleTimer = setInterval(_doCycleStep, _cycleSpeed);
      }
    });
  }

  function togglePlay() {
    if (_cyclePlaying) {
      _stopCycle();
    } else {
      _startCycle();
    }
  }

  function stepForward() {
    if (!_adapter) return;
    const combos = _adapter.getAllCombinations();
    _cycleIndex = (_cycleIndex + 1) % combos.length;
    _adapter.applyInputs(combos[_cycleIndex]);
    _playClickSound();
  }

  function stepBack() {
    if (!_adapter) return;
    const combos = _adapter.getAllCombinations();
    _cycleIndex = (_cycleIndex - 1 + combos.length) % combos.length;
    _adapter.applyInputs(combos[_cycleIndex]);
    _playClickSound();
  }

  function _startCycle() {
    if (!_adapter) return;
    _cyclePlaying = true;
    _updatePlayUI();
    _cycleTimer = setInterval(_doCycleStep, _cycleSpeed);
  }

  function _stopCycle() {
    _cyclePlaying = false;
    clearInterval(_cycleTimer);
    _cycleTimer = null;
    _updatePlayUI();
  }

  function _doCycleStep() {
    if (!_adapter) return;
    const combos = _adapter.getAllCombinations();
    _cycleIndex = (_cycleIndex + 1) % combos.length;
    _adapter.applyInputs(combos[_cycleIndex]);
    _playClickSound();
  }

  function _updatePlayUI() {
    const playIcon = document.getElementById("deco-play-icon");
    const pauseIcon = document.getElementById("deco-pause-icon");
    const label = document.getElementById("deco-play-label");
    if (!playIcon) return;
    playIcon.style.display = _cyclePlaying ? "none" : "";
    pauseIcon.style.display = _cyclePlaying ? "" : "none";
    if (label) label.textContent = _cyclePlaying ? "Pause" : "Play";
  }

  /* ═══════════════════════════════════════════════════════════════════════
     5. LIVE NUMBER DISPLAY
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildNumberDisplay() {
    const panel = document.querySelector(".sim-controls-panel");
    if (!panel || document.getElementById("deco-numdisp")) return;

    const el = document.createElement("div");
    el.id = "deco-numdisp";
    el.className = "deco-numdisp";
    el.innerHTML = `
      <div class="control-group-title">
        Live Number Formats
        <span style="font-size:0.68rem;color:var(--text-muted)">inputs &amp; outputs</span>
      </div>
      <div id="deco-numdisp-content" class="deco-numdisp-grid"></div>
    `;
    panel.appendChild(el);
  }

  function _updateNumberDisplay() {
    const el = document.getElementById("deco-numdisp-content");
    if (!el || !_adapter) return;
    const inputs = _adapter.getInputs();
    const outputs = _adapter.getOutputs();

    const makeRow = (label, vals) => {
      const bits = vals.map(v => v.value);
      const bStr = bits.join("");
      const dec = parseInt(bStr, 2);
      const hex = dec.toString(16).toUpperCase().padStart(Math.ceil(bits.length / 4), "0");
      return `<div class="deco-nd-row">
        <span class="deco-nd-label">${label}</span>
        <span class="deco-nd-cell deco-nd-bin" title="Binary">${bStr}</span>
        <span class="deco-nd-cell deco-nd-dec" title="Decimal">${dec}</span>
        <span class="deco-nd-cell deco-nd-hex" title="Hex">0x${hex}</span>
      </div>`;
    };

    let html = `<div class="deco-nd-header"><span></span><span class="deco-nd-tag">BIN</span><span class="deco-nd-tag">DEC</span><span class="deco-nd-tag">HEX</span></div>`;
    if (inputs.length > 0) html += makeRow("IN", inputs);
    if (outputs.length > 0) html += makeRow("OUT", outputs);
    el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     6. TIMING DIAGRAM (LOGIC ANALYZER)
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildTimingDiagram() {
    // Insert after sim-workspace
    const ws = document.querySelector(".sim-workspace");
    if (!ws || document.getElementById("deco-timing-section")) return;

    const section = document.createElement("section");
    section.id = "deco-timing-section";
    section.className = "deco-timing-section";
    section.innerHTML = `
      <div class="deco-timing-header">
        <div class="deco-timing-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Logic Analyzer — Timing Diagram
          <span class="deco-timing-hint">Last ${TIMING_HISTORY_LEN} states</span>
        </div>
        <div class="deco-timing-actions">
          <button id="deco-timing-pause" class="deco-cb-btn" title="Pause recording">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pause
          </button>
          <button id="deco-timing-clear" class="deco-cb-btn" title="Clear diagram">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Clear
          </button>
        </div>
      </div>
      <div class="deco-timing-wrap">
        <canvas id="deco-timing-canvas" class="deco-timing-canvas"></canvas>
        <div id="deco-timing-tooltip" class="deco-timing-tip" style="display:none"></div>
      </div>
    `;

    ws.insertAdjacentElement("afterend", section);

    document.getElementById("deco-timing-pause").addEventListener("click", _toggleTimingPause);
    document.getElementById("deco-timing-clear").addEventListener("click", _clearTiming);

    const canvas = document.getElementById("deco-timing-canvas");
    canvas.addEventListener("mousemove", _onTimingHover);
    canvas.addEventListener("mouseleave", () => {
      document.getElementById("deco-timing-tooltip").style.display = "none";
    });
  }

  function _recordTimingSnapshot() {
    if (!_adapter) return;
    const signals = _adapter.getSignalLabels();
    _timingHistory.push(signals.map(s => ({ label: s.label, value: s.getValue() })));
    if (_timingHistory.length > TIMING_HISTORY_LEN) _timingHistory.shift();
  }

  function _renderTimingDiagram() {
    const canvas = document.getElementById("deco-timing-canvas");
    if (!canvas || _timingHistory.length === 0) return;

    const signals = _timingHistory[0].map(s => s.label);
    const nSig = signals.length;
    const ROW_H = 36;
    const LABEL_W = 80;
    const CELL_W = 36;
    const PAD_TOP = 8;
    const PAD_BOT = 8;
    const totalW = LABEL_W + CELL_W * TIMING_HISTORY_LEN;
    const totalH = PAD_TOP + nSig * ROW_H + PAD_BOT;

    canvas.width = totalW;
    canvas.height = totalH;
    canvas.style.width = "100%";

    const ctx = canvas.getContext("2d");
    const isDark = document.documentElement.classList.contains("dark-mode");
    const BG = isDark ? "#1a2236" : "#f7f9fc";
    const GRID = isDark ? "#2a3555" : "#e2e8f0";
    const TEXT_COLOR = isDark ? "#94a3b8" : "#64748b";
    const SIG_HIGH = "#0891b2";
    const SIG_LOW = "#94a3b8";
    const HIGH_LINE = "#0891b2";
    const LOW_LINE = "#64748b";

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw grid lines
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= TIMING_HISTORY_LEN; col++) {
      ctx.beginPath();
      ctx.moveTo(LABEL_W + col * CELL_W, 0);
      ctx.lineTo(LABEL_W + col * CELL_W, totalH);
      ctx.stroke();
    }

    // Draw signal labels and waveforms
    signals.forEach((label, si) => {
      const yMid = PAD_TOP + si * ROW_H + ROW_H / 2;
      const yHigh = PAD_TOP + si * ROW_H + 6;
      const yLow  = PAD_TOP + si * ROW_H + ROW_H - 6;

      // Label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(label, LABEL_W - 6, yMid);

      // Waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = HIGH_LINE;
      ctx.beginPath();

      let prevVal = null;
      _timingHistory.forEach((snapshot, ti) => {
        const sig = snapshot[si];
        const val = sig ? sig.value : 0;
        const x = LABEL_W + ti * CELL_W;
        const xNext = x + CELL_W;
        const y = val ? yHigh : yLow;

        if (prevVal === null) {
          ctx.moveTo(x, y);
        } else {
          if (val !== prevVal) {
            // Vertical transition
            ctx.lineTo(x, val ? yHigh : yLow);
          }
        }
        ctx.lineTo(xNext, y);

        // Fill area
        ctx.save();
        ctx.fillStyle = val ? "rgba(8,145,178,0.12)" : "rgba(148,163,184,0.06)";
        ctx.fillRect(x, yHigh, CELL_W, yLow - yHigh);
        ctx.restore();

        prevVal = val;
      });
      ctx.stroke();

      // Draw row separator
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, PAD_TOP + (si + 1) * ROW_H);
      ctx.lineTo(totalW, PAD_TOP + (si + 1) * ROW_H);
      ctx.stroke();
    });

    // Column index labels at bottom
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    _timingHistory.forEach((_, ti) => {
      const x = LABEL_W + ti * CELL_W + CELL_W / 2;
      ctx.fillText(String(ti), x, totalH - 2);
    });
  }

  function _onTimingHover(e) {
    const canvas = document.getElementById("deco-timing-canvas");
    const tip = document.getElementById("deco-timing-tooltip");
    if (!canvas || !tip || _timingHistory.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const LABEL_W = 80;
    const CELL_W = 36;
    const col = Math.floor((mx - LABEL_W) / CELL_W);

    if (col < 0 || col >= _timingHistory.length) {
      tip.style.display = "none";
      return;
    }

    const snapshot = _timingHistory[col];
    const html = snapshot.map(s => `<div><b>${s.label}</b>: ${s.value}</div>`).join("");
    tip.innerHTML = `<div class="deco-timing-tip-idx">t=${col}</div>${html}`;
    tip.style.display = "block";
    tip.style.left = (e.clientX - rect.left + 12) + "px";
    tip.style.top = (e.clientY - rect.top - 10) + "px";
  }

  function _toggleTimingPause() {
    _cyclePaused = !_cyclePaused;
    _applyTimingPauseState();
  }

  function _applyTimingPauseState() {
    const btn = document.getElementById("deco-timing-pause");
    if (!btn) return;
    if (_cyclePaused) {
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Resume`;
      btn.style.color = "var(--primary)";
    } else {
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
      btn.style.color = "";
    }
  }

  function _clearTiming() {
    _timingHistory = [];
    _recordTimingSnapshot();
    _renderTimingDiagram();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     4. HOVER INSPECTION TOOLTIP
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildTooltip() {
    if (document.getElementById("deco-tooltip")) return;
    const tip = document.createElement("div");
    tip.id = "deco-tooltip";
    tip.className = "deco-tooltip";
    tip.style.display = "none";
    document.body.appendChild(tip);

    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-deco-tip]");
      if (el) {
        _tooltipEl = tip;
        tip.innerHTML = el.getAttribute("data-deco-tip");
        tip.style.display = "block";
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (tip.style.display === "block") {
        tip.style.left = (e.clientX + 14) + "px";
        tip.style.top  = (e.clientY - 8) + "px";
      }
    });

    document.addEventListener("mouseout", (e) => {
      const el = e.target.closest("[data-deco-tip]");
      if (el) tip.style.display = "none";
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     8. LIVE BOOLEAN EVALUATION
  ═══════════════════════════════════════════════════════════════════════ */
  function _updateLiveBooleanEval() {
    const el = document.getElementById("deco-live-bool");
    if (!el || !_adapter || !_adapter.getLiveBoolHTML) return;
    el.innerHTML = _adapter.getLiveBoolHTML();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     7. KEYBOARD SHORTCUTS
  ═══════════════════════════════════════════════════════════════════════ */
  function _attachKeyboard() {
    document.addEventListener("keydown", (e) => {
      // Ignore if typing in an input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const key = e.key;

      if (key === " " || key === "Spacebar") {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (key === "ArrowRight") { e.preventDefault(); stepForward(); return; }
      if (key === "ArrowLeft")  { e.preventDefault(); stepBack();    return; }
      if (key === "r" || key === "R") {
        if (_adapter && _adapter.resetFn) _adapter.resetFn();
        _stopCycle();
        _cycleIndex = 0;
        return;
      }
      if (key === "t" || key === "T") { toggleTheme(); return; }
      if (key === "?" || key === "/") { toggleShortcutsPopover(); return; }
      if (key === "s" || key === "S") { toggleSound(); return; }

      // 0-9 toggle inputs by index
      const num = parseInt(key);
      if (!isNaN(num) && _adapter && _adapter.toggleInputByIndex) {
        _adapter.toggleInputByIndex(num);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     2. BIDIRECTIONAL TRUTH TABLE (click-to-set)
  ═══════════════════════════════════════════════════════════════════════ */
  function _attachTruthTableClicks() {
    // Use event delegation — works even for dynamically-rendered tables
    document.addEventListener("click", (e) => {
      const row = e.target.closest("table.truth-table tbody tr");
      if (!row || !_adapter) return;
      const table = row.closest("table.truth-table");
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const idx = rows.indexOf(row);
      if (idx < 0) return;
      const combos = _adapter.getAllCombinations();
      if (combos[idx]) {
        _adapter.applyInputs(combos[idx]);
        _cycleIndex = idx;
        _playClickSound();
      }
    });

    // Add pointer cursor via attribute on tables
    const observer = new MutationObserver(() => {
      document.querySelectorAll("table.truth-table tbody tr").forEach(r => {
        r.style.cursor = "pointer";
        r.setAttribute("title", "Click to set inputs to this row");
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial pass
    setTimeout(() => {
      document.querySelectorAll("table.truth-table tbody tr").forEach(r => {
        r.style.cursor = "pointer";
        r.setAttribute("title", "Click to set inputs to this row");
      });
    }, 300);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     9. SOUND TOGGLE (Web Audio API)
  ═══════════════════════════════════════════════════════════════════════ */
  function _ensureAudio() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) {}
    }
    if (_audioCtx && _audioCtx.state === "suspended") _audioCtx.resume();
  }

  function toggleSound() {
    _soundEnabled = !_soundEnabled;
    const offIcon = document.getElementById("deco-snd-off");
    const onIcon  = document.getElementById("deco-snd-on");
    if (offIcon) offIcon.style.display = _soundEnabled ? "none" : "";
    if (onIcon)  onIcon.style.display  = _soundEnabled ? "" : "none";
    if (_soundEnabled) _ensureAudio();
  }

  function _playClickSound() {
    if (!_soundEnabled || !_audioCtx) return;
    try {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.setValueAtTime(880, _audioCtx.currentTime);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.05);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.05);
    } catch(_) {}
  }

  function _checkOutputChange() {
    if (!_soundEnabled || !_audioCtx || !_adapter) return;
    const outputs = _adapter.getOutputs().map(o => o.value);
    const prev = _prevOutputs;
    _prevOutputs = outputs;
    if (!prev) return;
    const changed = outputs.some((v, i) => v !== prev[i]);
    if (changed) _playOutputTone();
  }

  function _playOutputTone() {
    if (!_soundEnabled || !_audioCtx) return;
    try {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.setValueAtTime(440, _audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, _audioCtx.currentTime + 0.15);
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.10, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.2);
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + 0.2);
    } catch(_) {}
  }

  /* ═══════════════════════════════════════════════════════════════════════
     THEME TOGGLE
  ═══════════════════════════════════════════════════════════════════════ */
  function toggleTheme() {
    _darkMode = !_darkMode;
    document.documentElement.classList.toggle("dark-mode", _darkMode);
    // Re-render timing diagram with new colors
    _renderTimingDiagram();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     KEYBOARD SHORTCUTS POPOVER
  ═══════════════════════════════════════════════════════════════════════ */
  function _buildShortcutsPopover() {
    if (document.getElementById("deco-kbd-popover")) return;
    const pop = document.createElement("div");
    pop.id = "deco-kbd-popover";
    pop.className = "deco-kbd-popover";
    pop.style.display = "none";
    pop.innerHTML = `
      <div class="deco-kbd-header">
        <span>Keyboard Shortcuts</span>
        <button onclick="document.getElementById('deco-kbd-popover').style.display='none'" class="deco-kbd-close">✕</button>
      </div>
      <div class="deco-kbd-grid">
        <kbd>Space</kbd><span>Play / Pause auto-cycle</span>
        <kbd>→</kbd><span>Step forward one state</span>
        <kbd>←</kbd><span>Step back one state</span>
        <kbd>R</kbd><span>Reset to default inputs</span>
        <kbd>0–9</kbd><span>Toggle input #N</span>
        <kbd>T</kbd><span>Toggle dark/light theme</span>
        <kbd>S</kbd><span>Toggle sound on/off</span>
        <kbd>?</kbd><span>Show/hide this popover</span>
      </div>
    `;
    document.body.appendChild(pop);

    // Close on outside click
    document.addEventListener("click", (e) => {
      const btn = document.getElementById("deco-btn-kbd");
      if (!pop.contains(e.target) && e.target !== btn) {
        pop.style.display = "none";
      }
    });
  }

  function toggleShortcutsPopover() {
    const pop = document.getElementById("deco-kbd-popover");
    if (!pop) return;
    const btn = document.getElementById("deco-btn-kbd");
    if (pop.style.display === "none") {
      pop.style.display = "block";
      if (btn) {
        const r = btn.getBoundingClientRect();
        pop.style.right = (window.innerWidth - r.right) + "px";
        pop.style.top = (r.bottom + 8) + "px";
      }
    } else {
      pop.style.display = "none";
    }
  }

  /* ── Public API ──────────────────────────────────────────────────────── */
  return {
    init,
    onUpdate,
    togglePlay,
    stepForward,
    stepBack,
    toggleSound,
    toggleTheme,
  };
})();
