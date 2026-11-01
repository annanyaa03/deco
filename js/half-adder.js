/* ==========================================================================
   DECO MINI — Half Adder Simulator (IC 7486 XOR + IC 7408 AND)
   Inputs: A, B   |   Outputs: S (Sum), C (Carry)
   ========================================================================== */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────
const haState = { A: 0, B: 0 };

// ── Initialise ─────────────────────────────────────────────────────────────
function initHalfAdder() {
  buildInputSwitches();
  updateHalfAdder();
}

function buildInputSwitches() {
  const container = document.getElementById("ha-input-switches");
  if (!container) return;
  container.innerHTML = "";
  ["A", "B"].forEach(name => {
    const btn = document.createElement("button");
    btn.id = `ha-sw-${name}`;
    btn.className = "switch-btn";
    btn.setAttribute("aria-label", `Toggle input ${name}`);
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<span class="switch-name">${name}</span><span class="switch-val">0</span>`;
    btn.addEventListener("click", () => toggleInput(name));
    container.appendChild(btn);
  });
}

function toggleInput(name) {
  haState[name] = haState[name] ? 0 : 1;
  updateHalfAdder();
}

// ── Core Logic ─────────────────────────────────────────────────────────────
function updateHalfAdder() {
  const { A, B } = haState;
  const S = A ^ B;        // XOR — Sum
  const C = A & B;        // AND — Carry

  updateInputUI();
  updateOutputUI(S, C);
  updateSVG(A, B, S, C);
  highlightRow(A, B);
  updateEquationLabel(A, B, S, C);
}

function updateInputUI() {
  ["A", "B"].forEach(name => {
    const btn = document.getElementById(`ha-sw-${name}`);
    if (!btn) return;
    const val = haState[name];
    btn.classList.toggle("high", val === 1);
    btn.setAttribute("aria-pressed", String(val === 1));
    btn.querySelector(".switch-val").textContent = val;
  });
}

function updateOutputUI(S, C) {
  // Sum
  const pillS = document.getElementById("ha-out-pill-s");
  const ledS  = document.getElementById("ha-led-s");
  const valS  = document.getElementById("ha-val-s");
  if (pillS && ledS && valS) {
    pillS.classList.toggle("active", S === 1);
    ledS.classList.toggle("lit", S === 1);
    valS.textContent = S;
  }
  // Carry
  const pillC = document.getElementById("ha-out-pill-c");
  const ledC  = document.getElementById("ha-led-c");
  const valC  = document.getElementById("ha-val-c");
  if (pillC && ledC && valC) {
    pillC.classList.toggle("active", C === 1);
    ledC.classList.toggle("lit", C === 1);
    valC.textContent = C;
  }
}

function updateEquationLabel(A, B, S, C) {
  const el = document.getElementById("ha-eq-label");
  if (el) el.textContent = `S=${S}  C=${C}`;
}

// ── SVG Gate Diagram ────────────────────────────────────────────────────────
function updateSVG(A, B, S, C) {
  const wrap = document.getElementById("ha-schematic-svg");
  if (!wrap) return;

  const HIGH = "var(--logic-1)";
  const LOW  = "var(--logic-0)";
  const TEXT = "var(--text)";
  const MUTED = "var(--text-muted)";
  const SURF = "var(--surface)";
  const BSTR = "var(--border-strong)";

  const wA  = A  ? HIGH : LOW;
  const wB  = B  ? HIGH : LOW;
  const wS  = S  ? HIGH : LOW;
  const wC  = C  ? HIGH : LOW;
  const fS  = S  ? "rgba(8,145,178,.12)" : SURF;
  const fC  = C  ? "rgba(8,145,178,.12)" : SURF;
  const strS = S ? HIGH : BSTR;
  const strC = C ? HIGH : BSTR;

  wrap.innerHTML = `
  <svg viewBox="0 0 480 240" class="circuit-svg" role="img" aria-label="Half adder gate diagram">
    <!-- ── Background ── -->
    <rect width="480" height="240" fill="transparent"/>

    <!-- ── Input Labels ── -->
    <text x="18" y="82"  fill="${TEXT}"  font-family="JetBrains Mono,monospace" font-size="14" font-weight="700">A=${A}</text>
    <text x="18" y="152" fill="${TEXT}"  font-family="JetBrains Mono,monospace" font-size="14" font-weight="700">B=${B}</text>

    <!-- ── Input bus wires ── -->
    <!-- A → XOR -->
    <polyline points="60,75 100,75 100,95" stroke="${wA}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- B → XOR -->
    <polyline points="60,145 100,145 100,125" stroke="${wB}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- A fan-out → AND -->
    <polyline points="80,75 80,62 280,62 280,90" stroke="${wA}" stroke-width="1.8" fill="none" stroke-dasharray="4 3" stroke-linecap="round"/>
    <!-- B fan-out → AND -->
    <polyline points="80,145 80,158 280,158 280,130" stroke="${wB}" stroke-width="1.8" fill="none" stroke-dasharray="4 3" stroke-linecap="round"/>

    <!-- ── XOR Gate (IC 7486) body ── -->
    <!-- extra arc -->
    <path d="M100,88 Q115,110 100,132" fill="none" stroke="${strS}" stroke-width="2"/>
    <!-- outer body -->
    <path d="M105,88 Q165,88 185,110 Q165,132 105,132 Q120,110 105,88Z"
          fill="${fS}" stroke="${strS}" stroke-width="2.2"/>
    <!-- Gate label -->
    <text x="143" y="106" fill="${TEXT}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="800" text-anchor="middle">XOR</text>
    <text x="143" y="120" fill="${MUTED}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">IC 7486</text>

    <!-- ── Sum output wire ── -->
    <line x1="185" y1="110" x2="440" y2="110" stroke="${wS}" stroke-width="2.4" stroke-linecap="round"/>
    <text x="450" y="114" fill="${wS}" font-family="JetBrains Mono,monospace" font-size="13" font-weight="800">S=${S}</text>
    <!-- Sum LED node -->
    <circle cx="435" cy="110" r="7" fill="${S ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${S ? '#166534' : BSTR}" stroke-width="1.5"
            style="filter:${S ? 'drop-shadow(0 0 5px var(--led-on-glow))' : 'none'}"/>

    <!-- ── AND Gate (IC 7408) body ── -->
    <path d="M280,88 L280,132 L312,132 Q350,132 350,110 Q350,88 312,88 Z"
          fill="${fC}" stroke="${strC}" stroke-width="2.2"/>
    <!-- Gate label -->
    <text x="313" y="106" fill="${TEXT}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="800" text-anchor="middle">AND</text>
    <text x="313" y="120" fill="${MUTED}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">IC 7408</text>

    <!-- ── Carry output wire ── -->
    <polyline points="350,110 370,110 370,175 440,175" stroke="${wC}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <text x="450" y="179" fill="${wC}" font-family="JetBrains Mono,monospace" font-size="13" font-weight="800">C=${C}</text>
    <!-- Carry LED node -->
    <circle cx="435" cy="175" r="7" fill="${C ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${C ? '#166534' : BSTR}" stroke-width="1.5"
            style="filter:${C ? 'drop-shadow(0 0 5px var(--led-on-glow))' : 'none'}"/>
  </svg>`;
}

// ── Truth Table Highlight ───────────────────────────────────────────────────
function highlightRow(A, B) {
  const table = document.getElementById("ha-table");
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  const idx = (A << 1) | B;
  rows.forEach((row, i) => row.classList.toggle("active-row", i === idx));
}

// ── Reset ───────────────────────────────────────────────────────────────────
function resetHalfAdder() {
  haState.A = 0;
  haState.B = 0;
  updateHalfAdder();
}
