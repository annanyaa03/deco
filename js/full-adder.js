/* ==========================================================================
   DECO MINI — Full Adder Simulator (HA1 → HA2 → OR)
   Inputs: A, B, Cin   |   Outputs: S (Sum), Cout (Carry-out)
   ========================================================================== */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────
const faState = { A: 0, B: 0, Cin: 0 };

// ── Initialise ─────────────────────────────────────────────────────────────
function initFullAdder() {
  buildInputSwitches();
  updateFullAdder();
  if (window.DecoInteractivity) DecoInteractivity.init(_faAdapter);
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
  const AxB  = A ^ B;
  const AB   = A & B;
  const S          = AxB ^ Cin;
  const CinXAxB    = Cin & AxB;
  const Cout = AB | CinXAxB;

  updateInputUI();
  updateIntermediates(AxB, AB, CinXAxB);
  updateOutputUI(S, Cout);
  updateSVG(A, B, Cin, AxB, AB, CinXAxB, S, Cout);
  highlightFARow(A, B, Cin);
  updateFALabel(S, Cout);

  if (window.DecoInteractivity) DecoInteractivity.onUpdate();
}

function updateInputUI() {
  ["A", "B", "Cin"].forEach(name => {
    const btn = document.getElementById(`fa-sw-${name}`);
    if (!btn) return;
    const val = faState[name];
    btn.classList.toggle("high", val === 1);
    btn.setAttribute("aria-pressed", String(val === 1));
    btn.querySelector(".switch-val").textContent = val;
    btn.setAttribute("data-deco-tip", `<b>${name}</b> | Value: ${val} | ${val ? "HIGH" : "LOW"}`);
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

  const gf = (on) => on ? "rgba(8,145,178,.10)" : SURF;
  const gs = (on) => on ? H : BST;

  wrap.innerHTML = `
  <svg viewBox="0 0 560 220" class="circuit-svg" role="img" aria-label="Full adder block diagram">
    <text x="4" y="48"  fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">A=${A}</text>
    <text x="4" y="90"  fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">B=${B}</text>
    <text x="4" y="168" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="700">Cin=${Cin}</text>

    <rect x="80" y="28" width="90" height="80" rx="6"
          fill="${gf(AxB || AB)}" stroke="${gs(AxB || AB)}" stroke-width="2.2"
          data-deco-tip="Half Adder 1 | A XOR B=${AxB} | A AND B=${AB}"/>
    <text x="125" y="66" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800" text-anchor="middle">HA 1</text>
    <text x="125" y="82" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">XOR+AND</text>
    <text x="125" y="98" fill="${M}" font-family="JetBrains Mono,monospace" font-size="8"  text-anchor="middle">7486+7408</text>

    <line x1="38" y1="44" x2="80" y2="52" stroke="${wA}" stroke-width="2" stroke-linecap="round"
      data-deco-tip="Wire A | ${A}"/>
    <line x1="38" y1="86" x2="80" y2="76" stroke="${wB}" stroke-width="2" stroke-linecap="round"
      data-deco-tip="Wire B | ${B}"/>
    <line x1="170" y1="54" x2="300" y2="54" stroke="${wAxB}" stroke-width="2" stroke-linecap="round"
      data-deco-tip="Wire A XOR B | ${AxB}"/>
    <text x="218" y="49" fill="${wAxB}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">A&#x2295;B=${AxB}</text>
    <polyline points="170,84 240,84 240,175 360,175" stroke="${wAB}" stroke-width="2" fill="none" stroke-linecap="round"
      data-deco-tip="Wire A AND B (carry HA1) | ${AB}"/>
    <text x="202" y="96" fill="${wAB}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">AB=${AB}</text>
    <polyline points="38,164 60,164 60,130 300,130" stroke="${wCin}" stroke-width="2" fill="none" stroke-linecap="round"
      data-deco-tip="Wire Cin | ${Cin}"/>

    <rect x="300" y="36" width="90" height="110" rx="6"
          fill="${gf(S || CinXAxB)}" stroke="${gs(S || CinXAxB)}" stroke-width="2.2"
          data-deco-tip="Half Adder 2 | Sum=${S} | Carry=${CinXAxB}"/>
    <text x="345" y="86" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800" text-anchor="middle">HA 2</text>
    <text x="345" y="102" fill="${M}" font-family="JetBrains Mono,monospace" font-size="9"  text-anchor="middle">XOR+AND</text>
    <text x="345" y="118" fill="${M}" font-family="JetBrains Mono,monospace" font-size="8"  text-anchor="middle">gate-level</text>

    <line x1="390" y1="64" x2="540" y2="64" stroke="${wS}" stroke-width="2.4" stroke-linecap="round"
      data-deco-tip="Output S (Sum) | S=${S} | ${S ? 'HIGH' : 'LOW'}"/>
    <circle cx="526" cy="64" r="7" fill="${S ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${S ? '#166534' : BST}" stroke-width="1.5"
            data-deco-tip="LED Sum S=${S}"/>
    <text x="542" y="68" fill="${T}" font-family="JetBrains Mono,monospace" font-size="12" font-weight="800">S=${S}</text>
    <polyline points="390,118 420,118 420,175 360,175" stroke="${wCxA}" stroke-width="2" fill="none" stroke-linecap="round"
      data-deco-tip="Wire Cin AND (A XOR B) | ${CinXAxB}"/>
    <text x="416" y="140" fill="${wCxA}" font-family="JetBrains Mono,monospace" font-size="9" font-weight="600">Cin·(A&#x2295;B)=${CinXAxB}</text>

    <path d="M360,155 Q420,155 440,175 Q420,195 360,195 Q375,175 360,155Z"
          fill="${gf(Cout)}" stroke="${gs(Cout)}" stroke-width="2.2"
          data-deco-tip="OR Gate | Cout = AB OR Cin(A XOR B) = ${Cout}"/>
    <text x="398" y="178" fill="${T}" font-family="JetBrains Mono,monospace" font-size="10" font-weight="800" text-anchor="middle">OR</text>

    <line x1="440" y1="175" x2="540" y2="175" stroke="${wCout}" stroke-width="2.4" stroke-linecap="round"
      data-deco-tip="Output Cout (Carry-out) | Cout=${Cout} | ${Cout ? 'HIGH' : 'LOW'}"/>
    <circle cx="526" cy="175" r="7" fill="${Cout ? 'var(--led-on)' : 'var(--led-off)'}"
            stroke="${Cout ? '#166534' : BST}" stroke-width="1.5"
            data-deco-tip="LED Cout=${Cout}"/>
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

// ── Phase 3 Adapter ─────────────────────────────────────────────────────────
const _faAdapter = {
  id: "fa",

  getInputs() {
    return [
      { key: "A",   label: "A",   value: faState.A },
      { key: "B",   label: "B",   value: faState.B },
      { key: "Cin", label: "Cin", value: faState.Cin },
    ];
  },

  getOutputs() {
    const { A, B, Cin } = faState;
    const S    = (A ^ B) ^ Cin;
    const Cout = (A & B) | (Cin & (A ^ B));
    return [
      { key: "S",    label: "S",    value: S },
      { key: "Cout", label: "Cout", value: Cout },
    ];
  },

  getAllCombinations() {
    const c = [];
    for (let A = 0; A <= 1; A++)
      for (let B = 0; B <= 1; B++)
        for (let Cin = 0; Cin <= 1; Cin++)
          c.push({ A, B, Cin });
    return c;
  },

  applyInputs(combo) {
    faState.A = combo.A;
    faState.B = combo.B;
    faState.Cin = combo.Cin;
    updateFullAdder();
  },

  resetFn() { resetFullAdder(); },

  toggleInputByIndex(idx) {
    const keys = ["A", "B", "Cin"];
    if (idx < keys.length) toggleFAInput(keys[idx]);
  },

  getSignalLabels() {
    return [
      { label: "A",    getValue: () => faState.A },
      { label: "B",    getValue: () => faState.B },
      { label: "Cin",  getValue: () => faState.Cin },
      { label: "S",    getValue: () => (faState.A ^ faState.B) ^ faState.Cin },
      { label: "Cout", getValue: () => (faState.A & faState.B) | (faState.Cin & (faState.A ^ faState.B)) },
    ];
  },

  getLiveBoolHTML() {
    const { A, B, Cin } = faState;
    const AxB  = A ^ B;
    const AB   = A & B;
    const S    = AxB ^ Cin;
    const CinAxB = Cin & AxB;
    const Cout = AB | CinAxB;
    const hi = (v) => v ? "eq-term-active" : "eq-term-inactive";
    const res = (v) => `<span class="eq-result ${v ? 'eq-high' : 'eq-low'}">${v}</span>`;
    return `
      <div><span class="eq-name">S = (A⊕B)⊕Cin</span>
        = <span class="${hi(AxB)}">${AxB}</span> ⊕ ${Cin} = ${res(S)}
      </div>
      <div><span class="eq-name">Cout = A·B + Cin·(A⊕B)</span>
        = <span class="${hi(AB)}">${AB}</span>
        + <span class="${hi(CinAxB)}">${Cin}·${AxB}</span>
        = ${res(Cout)}
      </div>`;
  },
};
