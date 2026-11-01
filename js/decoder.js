/**
 * DECO MINI - 3:8 Line Inverting Decoder (IC 74138) Simulation Engine
 * Emulates the 3-to-8 line decoder with 3-line gating enable system:
 * G1 (Active-HIGH), Ḡ2A (Active-LOW), Ḡ2B (Active-LOW)
 * and 8 Active-Low Outputs (Ȳ0 through Ȳ7).
 */

const DecoderState = {
  a: [0, 0, 0],   // A2 (C, MSB), A1 (B), A0 (A, LSB)
  g1: 1,          // Active-High Enable
  g2a: 0,         // Active-Low Enable
  g2b: 0          // Active-Low Enable
};

const DEFAULT_DECODER = {
  a: [0, 0, 0],
  g1: 1,
  g2a: 0,
  g2b: 0
};

function initDecoder() {
  renderDecoderControls();
  updateDecoder();
}

function resetDecoder() {
  DecoderState.a = [...DEFAULT_DECODER.a];
  DecoderState.g1 = DEFAULT_DECODER.g1;
  DecoderState.g2a = DEFAULT_DECODER.g2a;
  DecoderState.g2b = DEFAULT_DECODER.g2b;
  renderDecoderControls();
  updateDecoder();
}

function toggleDecoderAddress(idx) {
  DecoderState.a[idx] = DecoderState.a[idx] ? 0 : 1;
  renderDecoderControls();
  updateDecoder();
}

function toggleDecoderG1() {
  DecoderState.g1 = DecoderState.g1 ? 0 : 1;
  renderDecoderControls();
  updateDecoder();
}

function toggleDecoderG2A() {
  DecoderState.g2a = DecoderState.g2a ? 0 : 1;
  renderDecoderControls();
  updateDecoder();
}

function toggleDecoderG2B() {
  DecoderState.g2b = DecoderState.g2b ? 0 : 1;
  renderDecoderControls();
  updateDecoder();
}

function renderDecoderControls() {
  // Address Switches (A2, A1, A0)
  const addrBank = document.getElementById("decoder-addr-switches");
  if (addrBank) {
    const labels = ["A2 (C)", "A1 (B)", "A0 (A)"];
    addrBank.innerHTML = DecoderState.a.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleDecoderAddress(${i})" title="Toggle Address ${labels[i]}">
        <span class="switch-name">${labels[i]}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // 3-Line Enable Switches: G1 (Active-High), Ḡ2A & Ḡ2B (Active-Low)
  const enBank = document.getElementById("decoder-enable-switches");
  if (enBank) {
    const isG1Active = DecoderState.g1 === 1;
    const isG2aActive = DecoderState.g2a === 0;
    const isG2bActive = DecoderState.g2b === 0;
    const isFullyEnabled = isG1Active && isG2aActive && isG2bActive;

    enBank.innerHTML = `
      <button type="button" class="switch-btn ${isG1Active ? 'high' : ''}" onclick="toggleDecoderG1()" title="G1 Active-HIGH Enable">
        <span class="switch-name">G1 (Active-H)</span>
        <span class="switch-val">${DecoderState.g1}</span>
      </button>
      <button type="button" class="switch-btn ${isG2aActive ? 'active-low-active' : ''}" onclick="toggleDecoderG2A()" title="Ḡ2A Active-LOW Enable">
        <span class="switch-name">Ḡ2A (Active-L)</span>
        <span class="switch-val">${DecoderState.g2a}</span>
      </button>
      <button type="button" class="switch-btn ${isG2bActive ? 'active-low-active' : ''}" onclick="toggleDecoderG2B()" title="Ḡ2B Active-LOW Enable">
        <span class="switch-name">Ḡ2B (Active-L)</span>
        <span class="switch-val">${DecoderState.g2b}</span>
      </button>
      <div style="flex-basis:100%; margin-top:4px;">
        <span style="font-size:0.75rem; color:${isFullyEnabled ? 'var(--sig-success)' : 'var(--sig-active-low)'}; font-family:var(--font-mono);">
          ${isFullyEnabled ? '✓ CHIP ENABLED: G1=1 & Ḡ2A=0 & Ḡ2B=0' : '✕ INHIBITED: Requires G1=1, Ḡ2A=0, Ḡ2B=0'}
        </span>
      </div>
    `;
  }
}

function updateDecoder() {
  const { a, g1, g2a, g2b } = DecoderState;
  const isEnabled = (g1 === 1) && (g2a === 0) && (g2b === 0);
  const selIndex = (a[0] << 2) | (a[1] << 1) | a[2];

  // 74138 Logic:
  // When Disabled: All outputs Ȳ0..Ȳ7 = 1 (HIGH)
  // When Enabled: Output Ȳ[sel] = 0 (LOW), all other outputs = 1 (HIGH)
  const outputs = [1, 1, 1, 1, 1, 1, 1, 1];
  if (isEnabled) {
    outputs[selIndex] = 0;
  }

  // 1. Update Output Pills
  for (let i = 0; i < 8; i++) {
    const pill = document.getElementById(`decoder-pill-y${i}`);
    const led = document.getElementById(`decoder-led-y${i}`);
    const val = document.getElementById(`decoder-val-y${i}`);

    if (pill && led && val) {
      val.textContent = outputs[i];
      const isAsserted = (outputs[i] === 0);
      if (isAsserted) {
        pill.classList.add("active-low-asserted");
        led.classList.add("lit-amber");
      } else {
        pill.classList.remove("active-low-asserted");
        led.classList.remove("lit-amber");
      }
    }
  }

  const selStatus = document.getElementById("decoder-sel-label");
  if (selStatus) {
    selStatus.textContent = isEnabled 
      ? `Minterm m${selIndex} Asserted (Ȳ${selIndex} = 0)`
      : "Disabled (All outputs HIGH)";
  }

  // 2. Truth Table Highlighting
  // Row 0: Inhibit (G1=0 or G2A=1 or G2B=1)
  // Rows 1..8: Address 0..7
  const rows = document.querySelectorAll("#decoder-table tbody tr");
  rows.forEach(r => r.classList.remove("active-row"));
  if (rows.length >= 9) {
    if (!isEnabled) {
      rows[0].classList.add("active-row");
    } else {
      rows[selIndex + 1].classList.add("active-row");
    }
  }

  // 3. Render Schematic SVG
  renderDecoderSchematic(a, g1, g2a, g2b, isEnabled, selIndex, outputs);
}

function renderDecoderSchematic(a, g1, g2a, g2b, isEnabled, sel, outs) {
  const container = document.getElementById("decoder-schematic-svg");
  if (!container) return;

  const outY = [35, 60, 85, 110, 135, 160, 185, 210];

  container.innerHTML = `
    <svg class="circuit-svg" viewBox="0 0 540 280" xmlns="http://www.w3.org/2000/svg">
      <!-- 3 Address Lines on Left -->
      <line x1="30" y1="50" x2="190" y2="50" class="wire ${a[0] ? 'high' : ''}" />
      <circle cx="30" cy="50" r="3" fill="${a[0] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="14" y="54" class="wire-label ${a[0] ? 'high' : ''}" text-anchor="end">C(A2)=${a[0]}</text>

      <line x1="30" y1="80" x2="190" y2="80" class="wire ${a[1] ? 'high' : ''}" />
      <circle cx="30" cy="80" r="3" fill="${a[1] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="14" y="84" class="wire-label ${a[1] ? 'high' : ''}" text-anchor="end">B(A1)=${a[1]}</text>

      <line x1="30" y1="110" x2="190" y2="110" class="wire ${a[2] ? 'high' : ''}" />
      <circle cx="30" cy="110" r="3" fill="${a[2] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="14" y="114" class="wire-label ${a[2] ? 'high' : ''}" text-anchor="end">A(A0)=${a[2]}</text>

      <!-- 3 Enable Lines on Left Bottom -->
      <line x1="30" y1="165" x2="190" y2="165" class="wire ${g1 ? 'high' : ''}" />
      <text x="14" y="169" class="wire-label ${g1 ? 'high' : ''}" text-anchor="end">G1=${g1}</text>

      <circle cx="186" cy="195" r="3.5" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="30" y1="195" x2="182" y2="195" class="wire ${g2a === 0 ? 'active-low' : ''}" />
      <text x="14" y="199" class="wire-label ${g2a === 0 ? 'active-low' : ''}" text-anchor="end">Ḡ2A=${g2a}</text>

      <circle cx="186" cy="225" r="3.5" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="30" y1="225" x2="182" y2="225" class="wire ${g2b === 0 ? 'active-low' : ''}" />
      <text x="14" y="229" class="wire-label ${g2b === 0 ? 'active-low' : ''}" text-anchor="end">Ḡ2B=${g2b}</text>

      <!-- Chip Rectangle -->
      <rect x="190" y="20" width="160" height="230" rx="8" class="gate-body ${isEnabled ? 'active-block' : ''}" />
      <text x="270" y="90" class="gate-title">3:8 DECODER</text>
      <text x="270" y="110" class="gate-sub">1-of-8 Inverting</text>
      <text x="270" y="128" class="gate-ic">IC 74138</text>
      <text x="270" y="148" font-size="10" fill="var(--text-muted)" text-anchor="middle">
        ${isEnabled ? `Selected: Ȳ${sel} LOW` : 'DISABLED (All HIGH)'}
      </text>

      <!-- 8 Active-Low Outputs on Right with Inversion Bubbles -->
      ${outY.map((yPos, i) => {
        const isAsserted = outs[i] === 0;
        return `
          <circle cx="356" cy="${yPos}" r="3.8" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
          <line x1="360" y1="${yPos}" x2="445" y2="${yPos}" class="wire ${isAsserted ? 'active-low' : ''}" />
          <circle cx="451" cy="${yPos}" class="led-node ${isAsserted ? 'lit-amber' : ''}" />
          <text x="466" y="${yPos + 4}" class="wire-label ${isAsserted ? 'active-low' : ''}" font-size="10">Ȳ${i} = ${outs[i]}</text>
        `;
      }).join("")}
    </svg>
  `;
}

