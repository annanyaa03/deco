/* ==========================================================================
   DECO MINI — Parity Generator/Checker Simulator (IC 74180)
   Inputs: A–H (data), EVEN, ODD (cascade)
   Outputs: ΣEVEN, ΣODD
   ========================================================================== */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────
const parState = {
  data: [0, 0, 0, 0, 0, 0, 0, 0], // A through H
  EVEN: 1,
  ODD:  0
};
const DATA_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ── Initialise ─────────────────────────────────────────────────────────────
function initParity() {
  buildDataSwitches();
  buildCascadeSwitches();
  updateParity();
}

function buildDataSwitches() {
  const container = document.getElementById("par-data-switches");
  if (!container) return;
  container.innerHTML = "";
  DATA_NAMES.forEach((name, i) => {
    const btn = document.createElement("button");
    btn.id = `par-sw-${name}`;
    btn.className = "switch-btn";
    btn.setAttribute("aria-label", `Toggle data input ${name}`);
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<span class="switch-name">${name}</span><span class="switch-val">0</span>`;
    btn.addEventListener("click", () => toggleDataBit(i));
    container.appendChild(btn);
  });
}

function buildCascadeSwitches() {
  const container = document.getElementById("par-cascade-switches");
  if (!container) return;
  container.innerHTML = "";
  ["EVEN", "ODD"].forEach(name => {
    const btn = document.createElement("button");
    btn.id = `par-sw-${name}`;
    btn.className = "switch-btn";
    btn.setAttribute("aria-label", `Toggle cascade input ${name}`);
    btn.setAttribute("aria-pressed", String(parState[name] === 1));
    const val = parState[name];
    btn.innerHTML = `<span class="switch-name">${name}</span><span class="switch-val">${val}</span>`;
    if (val) btn.classList.add("high");
    btn.addEventListener("click", () => toggleCascade(name));
    container.appendChild(btn);
  });
}

function toggleDataBit(i) {
  parState.data[i] = parState.data[i] ? 0 : 1;
  updateParity();
}

function toggleCascade(name) {
  parState[name] = parState[name] ? 0 : 1;
  updateParity();
}

// ── Core Logic (74180 function table) ──────────────────────────────────────
function computeParity() {
  const { data, EVEN, ODD } = parState;
  const count = data.reduce((a, b) => a + b, 0);
  const isDataEven = (count % 2 === 0); // true = even number of 1s

  let sEVEN, sODD;

  if (EVEN === 1 && ODD === 1) {
    // Both HIGH → ΣEVEN=L, ΣODD=L
    sEVEN = 0; sODD = 0;
  } else if (EVEN === 0 && ODD === 0) {
    // Both LOW → ΣEVEN=H, ΣODD=H
    sEVEN = 1; sODD = 1;
  } else {
    // Normal mode: XOR tree includes cascade
    // P = XOR of A..H (isDataEven=true → P=0, isDataEven=false → P=1)
    const P = isDataEven ? 0 : 1;
    // ΣEVEN = NOT(P XOR EVEN) equivalent to:
    //   EVEN=1,ODD=0: ΣEVEN = (isDataEven ? H : L)
    //   EVEN=0,ODD=1: ΣEVEN = (isDataEven ? L : H)
    if (EVEN === 1 && ODD === 0) {
      sEVEN = isDataEven ? 1 : 0;
      sODD  = isDataEven ? 0 : 1;
    } else { // EVEN=0, ODD=1
      sEVEN = isDataEven ? 0 : 1;
      sODD  = isDataEven ? 1 : 0;
    }
  }

  return { count, isDataEven, sEVEN, sODD };
}

function updateParity() {
  const { count, isDataEven, sEVEN, sODD } = computeParity();
  const { EVEN, ODD } = parState;

  updateDataUI();
  updateCascadeUI();

  // Count display
  const countEl = document.getElementById("par-count");
  if (countEl) {
    countEl.textContent = count;
    countEl.style.color = (count % 2 === 0) ? "var(--primary)" : "var(--logic-1)";
  }

  // Mode label
  const modeEl = document.getElementById("par-mode-label");
  if (modeEl) {
    if (EVEN === 1 && ODD === 1) {
      modeEl.textContent = "⚠ Both HIGH (Forced)";
    } else if (EVEN === 0 && ODD === 0) {
      modeEl.textContent = "⚠ Both LOW (Forced)";
    } else if (EVEN === 1) {
      modeEl.textContent = "Generator Mode (Even)";
    } else {
      modeEl.textContent = "Checker Mode (Odd)";
    }
  }

  // ΣEVEN output
  setParOutput("par-out-pill-even", "par-led-even", "par-val-even", sEVEN);
  // ΣODD output
  setParOutput("par-out-pill-odd", "par-led-odd",   "par-val-odd",  sODD);

  updateParSVG(count, isDataEven, sEVEN, sODD);
  highlightParRow(isDataEven, EVEN, ODD);
}

function setParOutput(pillId, ledId, valId, val) {
  const pill = document.getElementById(pillId);
  const led  = document.getElementById(ledId);
  const valEl = document.getElementById(valId);
  if (pill) pill.classList.toggle("active", val === 1);
  if (led)  led.classList.toggle("lit", val === 1);
  if (valEl) valEl.textContent = val ? "H" : "L";
}

function updateDataUI() {
  DATA_NAMES.forEach((name, i) => {
    const btn = document.getElementById(`par-sw-${name}`);
    if (!btn) return;
    const val = parState.data[i];
    btn.classList.toggle("high", val === 1);
    btn.setAttribute("aria-pressed", String(val === 1));
    btn.querySelector(".switch-val").textContent = val;
  });
}

function updateCascadeUI() {
  ["EVEN", "ODD"].forEach(name => {
    const btn = document.getElementById(`par-sw-${name}`);
    if (!btn) return;
    const val = parState[name];
    btn.classList.toggle("high", val === 1);
    btn.setAttribute("aria-pressed", String(val === 1));
    btn.querySelector(".switch-val").textContent = val;
  });
}

// ── SVG XOR-tree Diagram ────────────────────────────────────────────────────
function updateParSVG(count, isDataEven, sEVEN, sODD) {
  const wrap = document.getElementById("par-schematic-svg");
  if (!wrap) return;

  const H = "var(--logic-1)";
  const L = "var(--logic-0)";
  const T = "var(--text)";
  const M = "var(--text-muted)";
  const SURF = "var(--surface)";
  const BST  = "var(--border-strong)";
  const pColor = isDataEven ? H : L; // data parity node

  const wEVEN = parState.EVEN ? H : L;
  const wODD  = parState.ODD  ? H : L;
  const wSE   = sEVEN ? H : L;
  const wSO   = sODD  ? H : L;

  wrap.innerHTML = `
  <svg viewBox="0 0 500 230" class="circuit-svg" role="img" aria-label="XOR-tree parity diagram">

    <!-- ── Data inputs A-H ── -->
    ${DATA_NAMES.map((name, i) => {
      const y = 20 + i * 22;
      const v = parState.data[i];
      const wc = v ? H : L;
      return `<text x="4" y="${y+4}" fill="${T}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">${name}=${v}</text>
              <line x1="30" y1="${y}" x2="95" y2="${y}" stroke="${wc}" stroke-width="1.8" stroke-linecap="round"/>`;
    }).join("")}

    <!-- ── XOR Tree block ── -->
    <rect x="95" y="10" width="100" height="194" rx="8"
          fill="${isDataEven ? SURF : 'rgba(8,145,178,.10)'}"
          stroke="${isDataEven ? BST : H}" stroke-width="2.2"/>
    <text x="145" y="92" fill="${T}"  font-family="JetBrains Mono,monospace" font-size="13" font-weight="800" text-anchor="middle">XOR</text>
    <text x="145" y="110" fill="${M}" font-family="JetBrains Mono,monospace" font-size="10" text-anchor="middle">tree</text>
    <text x="145" y="125" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">A⊕B⊕…⊕H</text>
    <text x="145" y="140" fill="${pColor}" font-family="JetBrains Mono,monospace" font-size="10" text-anchor="middle" font-weight="700">P=${isDataEven ? 0 : 1} (${isDataEven ? "even" : "odd"})</text>

    <!-- ── XOR tree output wire (P) ── -->
    <line x1="195" y1="107" x2="255" y2="107" stroke="${pColor}" stroke-width="2" stroke-linecap="round"/>
    <text x="212" y="100" fill="${pColor}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">P=${isDataEven ? 0 : 1}</text>

    <!-- ── Cascade inputs ── -->
    <text x="230" y="165" fill="${T}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">EVEN=${parState.EVEN}</text>
    <line x1="230" y1="172" x2="255" y2="145" stroke="${wEVEN}" stroke-width="1.8" stroke-linecap="round"/>
    <text x="230" y="200" fill="${T}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="600">ODD=${parState.ODD}</text>
    <line x1="230" y1="195" x2="255" y2="168" stroke="${wODD}" stroke-width="1.8" stroke-linecap="round"/>

    <!-- ── Output logic block ── -->
    <rect x="255" y="80" width="90" height="115" rx="6"
          fill="${SURF}" stroke="${BST}" stroke-width="1.8"/>
    <text x="300" y="132" fill="${T}"  font-family="JetBrains Mono,monospace" font-size="11" font-weight="800" text-anchor="middle">Output</text>
    <text x="300" y="148" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">logic</text>

    <!-- ── ΣEVEN output ── -->
    <line x1="345" y1="108" x2="490" y2="108" stroke="${wSE}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="476" cy="108" r="7" fill="${sEVEN ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${sEVEN ? '#166534' : BST}" stroke-width="1.5"/>
    <text x="352" y="100" fill="${wSE}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="700">ΣEVEN</text>
    <text x="458" y="103" fill="${wSE}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="800">=${sEVEN ? "H" : "L"}</text>

    <!-- ── ΣODD output ── -->
    <line x1="345" y1="158" x2="490" y2="158" stroke="${wSO}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="476" cy="158" r="7" fill="${sODD ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${sODD ? '#166534' : BST}" stroke-width="1.5"/>
    <text x="352" y="150" fill="${wSO}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="700">ΣODD</text>
    <text x="458" y="153" fill="${wSO}" font-family="JetBrains Mono,monospace" font-size="11" font-weight="800">=${sODD ? "H" : "L"}</text>
  </svg>`;
}

// ── Function Table Highlight ────────────────────────────────────────────────
// Rows: 0=Even+EH,OL | 1=Odd+EH,OL | 2=Even+EL,OH | 3=Odd+EL,OH | 4=Both H | 5=Both L
function highlightParRow(isDataEven, EVEN, ODD) {
  const table = document.getElementById("par-table");
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");

  let idx = -1;
  if (EVEN === 1 && ODD === 1) {
    idx = 4;
  } else if (EVEN === 0 && ODD === 0) {
    idx = 5;
  } else if (EVEN === 1 && ODD === 0) {
    idx = isDataEven ? 0 : 1;
  } else { // EVEN=0, ODD=1
    idx = isDataEven ? 2 : 3;
  }

  rows.forEach((row, i) => row.classList.toggle("active-row", i === idx));
}

// ── Reset ───────────────────────────────────────────────────────────────────
function resetParity() {
  parState.data = [0, 0, 0, 0, 0, 0, 0, 0];
  parState.EVEN = 1;
  parState.ODD  = 0;
  updateParity();
}
