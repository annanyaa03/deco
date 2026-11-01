/* ==========================================================================
   DECO MINI — Full Adder Simulator (HA1 → HA2 → OR)
   Inputs: A, B, Cin   |   Outputs: S (Sum), Cout (Carry-out)
   Intermediate: A⊕B, A·B, Cin·(A⊕B)
   ========================================================================== */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────
const faState = { A: 0, B: 0, Cin: 0 };

// ── Initialise ─────────────────────────────────────────────────────────────
function initFullAdder() {
  buildInputSwitches();
  updateFullAdder();
}

function buildInputSwitches() {
  const container = document.getElementById("fa-input-switches");
  if (!container) return;
  container.innerHTML = "";
  ["A", "B", "Cin"].forEach(name => {
    const btn = document.createElement("button");
    btn.id = `fa-sw-${name}`;
    btn.className = "switch-btn";
    btn.setAttribute("aria-label", `Toggle input ${name}`);
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `<span class="switch-name">${name}</span><span class="switch-val">0</span>`;
    btn.addEventListener("click", () => toggleFAInput(name));
    container.appendChild(btn);
  });
}

function toggleFAInput(name) {
  faState[name] = faState[name] ? 0 : 1;
  updateFullAdder();
}

// ── Core Logic ─────────────────────────────────────────────────────────────
function updateFullAdder() {
  const { A, B, Cin } = faState;

  // HA1
  const AxB  = A ^ B;          // A XOR B
  const AB   = A & B;          // A AND B (carry of HA1)

  // HA2
  const S          = AxB ^ Cin;     // Sum
  const CinXAxB    = Cin & AxB;     // Carry of HA2

  // OR
  const Cout = AB | CinXAxB;

  updateInputUI();
  updateIntermediates(AxB, AB, CinXAxB);
  updateOutputUI(S, Cout);
  updateSVG(A, B, Cin, AxB, AB, CinXAxB, S, Cout);
  highlightFARow(A, B, Cin);
  updateFALabel(S, Cout);
}

function updateInputUI() {
  ["A", "B", "Cin"].forEach(name => {
    const btn = document.getElementById(`fa-sw-${name}`);
    if (!btn) return;
    const val = faState[name];
    btn.classList.toggle("high", val === 1);
    btn.setAttribute("aria-pressed", String(val === 1));
    btn.querySelector(".switch-val").textContent = val;
  });
}

function updateIntermediates(AxB, AB, CinXAxB) {
  setOutput("fa-pill-axb",    null, "fa-val-axb",     AxB);
  setOutput("fa-pill-ab",     null, "fa-val-ab",      AB);
  setOutput("fa-pill-cin-axb",null, "fa-val-cin-axb", CinXAxB);
  ["fa-pill-axb","fa-pill-ab","fa-pill-cin-axb"].forEach((id, i) => {
    const pill = document.getElementById(id);
    if (!pill) return;
    pill.classList.toggle("active", [AxB, AB, CinXAxB][i] === 1);
  });
}

function setOutput(pillId, ledId, valId, val) {
  const pill = document.getElementById(pillId);
  const led  = ledId ? document.getElementById(ledId) : null;
  const valEl = document.getElementById(valId);
  if (pill) pill.classList.toggle("active", val === 1);
  if (led)  led.classList.toggle("lit", val === 1);
  if (valEl) valEl.textContent = val;
}

function updateOutputUI(S, Cout) {
  setOutput("fa-out-pill-s",    "fa-led-s",    "fa-val-s",    S);
  setOutput("fa-out-pill-cout", "fa-led-cout", "fa-val-cout", Cout);
}

function updateFALabel(S, Cout) {
  const el = document.getElementById("fa-eq-label");
  if (el) el.textContent = `S=${S}  Cout=${Cout}`;
}

// ── SVG Diagram ─────────────────────────────────────────────────────────────
function updateSVG(A, B, Cin, AxB, AB, CinXAxB, S, Cout) {
  const wrap = document.getElementById("fa-schematic-svg");
  if (!wrap) return;

  const H = "var(--logic-1)";
  const L = "var(--logic-0)";
  const T = "var(--text)";
  const M = "var(--text-muted)";
  const SURF = "var(--surface)";
  const BST  = "var(--border-strong)";

  const wA   = A   ? H : L;
  const wB   = B   ? H : L;
  const wCin = Cin ? H : L;
  const wAxB = AxB ? H : L;
  const wAB  = AB  ? H : L;
  const wCxA = CinXAxB ? H : L;
  const wS   = S    ? H : L;
  const wCout= Cout ? H : L;

  // gate fill helpers
  const gf = (on) => on ? "rgba(8,145,178,.10)" : SURF;
  const gs = (on) => on ? H : BST;

  wrap.innerHTML = `
  <svg viewBox="0 0 560 220" class="circuit-svg" role="img" aria-label="Full adder block diagram">

    <!-- ── Input labels ── -->
    <text x="4" y="48"  fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">A=${A}</text>
    <text x="4" y="90"  fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">B=${B}</text>
    <text x="4" y="168" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">Cin=${Cin}</text>

    <!-- ── HA1 block ── -->
    <rect x="80" y="28" width="90" height="80" rx="6"
          fill="${gf(AxB || AB)}" stroke="${gs(AxB || AB)}" stroke-width="2.2"/>
    <text x="125" y="66" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800" text-anchor="middle">HA 1</text>
    <text x="125" y="82" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">XOR+AND</text>
    <text x="125" y="98" fill="${M}" font-family="JetBrains Mono,monospace" font-size="8"  text-anchor="middle">7486+7408</text>

    <!-- A, B → HA1 -->
    <line x1="38" y1="44" x2="80" y2="52" stroke="${wA}" stroke-width="2" stroke-linecap="round"/>
    <line x1="38" y1="86" x2="80" y2="76" stroke="${wB}" stroke-width="2" stroke-linecap="round"/>

    <!-- HA1 → A⊕B (Sum of HA1) → HA2 -->
    <line x1="170" y1="54" x2="300" y2="54" stroke="${wAxB}" stroke-width="2" stroke-linecap="round"/>
    <!-- Intermediate label -->
    <text x="218" y="49" fill="${wAxB}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">A⊕B=${AxB}</text>

    <!-- HA1 Carry (A·B) → OR -->
    <polyline points="170,84 240,84 240,175 360,175" stroke="${wAB}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="202" y="96" fill="${wAB}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">AB=${AB}</text>

    <!-- Cin → HA2 -->
    <polyline points="38,164 60,164 60,130 300,130" stroke="${wCin}" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- ── HA2 block ── -->
    <rect x="300" y="36" width="90" height="110" rx="6"
          fill="${gf(S || CinXAxB)}" stroke="${gs(S || CinXAxB)}" stroke-width="2.2"/>
    <text x="345" y="86" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800" text-anchor="middle">HA 2</text>
    <text x="345" y="102" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">XOR+AND</text>
    <text x="345" y="118" fill="${M}" font-family="JetBrains Mono,monospace" font-size="8"  text-anchor="middle">gate-level</text>

    <!-- HA2 Sum (S) output -->
    <line x1="390" y1="64" x2="540" y2="64" stroke="${wS}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="526" cy="64" r="7" fill="${S ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${S ? '#166534' : BST}" stroke-width="1.5"/>
    <text x="542" y="68" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800">S=${S}</text>

    <!-- HA2 Carry (Cin·(A⊕B)) → OR -->
    <polyline points="390,118 420,118 420,175 360,175" stroke="${wCxA}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="416" y="140" fill="${wCxA}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">Cin·(A⊕B)=${CinXAxB}</text>

    <!-- ── OR Gate block ── -->
    <path d="M360,155 Q420,155 440,175 Q420,195 360,195 Q375,175 360,155Z"
          fill="${gf(Cout)}" stroke="${gs(Cout)}" stroke-width="2.2"/>
    <text x="398" y="178" fill="${T}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="800" text-anchor="middle">OR</text>

    <!-- Cout output -->
    <line x1="440" y1="175" x2="540" y2="175" stroke="${wCout}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="526" cy="175" r="7" fill="${Cout ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${Cout ? '#166534' : BST}" stroke-width="1.5"/>
    <text x="542" y="179" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800">Cout=${Cout}</text>
  </svg>`;
}

// ── Truth Table Highlight ───────────────────────────────────────────────────
function highlightFARow(A, B, Cin) {
  const table = document.getElementById("fa-table");
  if (!table) return;
  const rows = table.querySelectorAll("tbody tr");
  const idx = (A << 2) | (B << 1) | Cin;
  rows.forEach((row, i) => row.classList.toggle("active-row", i === idx));
}

// ── Reset ───────────────────────────────────────────────────────────────────
function resetFullAdder() {
  faState.A = 0; faState.B = 0; faState.Cin = 0;
  updateFullAdder();
}
