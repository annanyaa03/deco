/**
 * DECO MINI - Multiplexer Simulation Engine
 * Covers:
 *  - 4:1 Multiplexer (IC 74153)
 *  - 8:1 Multiplexer (IC 74151)
 */

// ============================================================================
// 1. 4:1 MULTIPLEXER (IC 74153)
// ============================================================================

const Mux41State = {
  d: [1, 0, 0, 0],   // D0, D1, D2, D3
  s: [0, 0],         // S1 (MSB), S0 (LSB)
  enableG: 0         // Active-low strobe (0 = Enabled, 1 = Disabled)
};

const DEFAULT_MUX41 = {
  d: [1, 0, 0, 0],
  s: [0, 0],
  enableG: 0
};

function initMux41() {
  renderMux41Controls();
  updateMux41();
}

function resetMux41() {
  Mux41State.d = [...DEFAULT_MUX41.d];
  Mux41State.s = [...DEFAULT_MUX41.s];
  Mux41State.enableG = DEFAULT_MUX41.enableG;
  renderMux41Controls();
  updateMux41();
}

function toggleMux41Data(idx) {
  Mux41State.d[idx] = Mux41State.d[idx] ? 0 : 1;
  renderMux41Controls();
  updateMux41();
}

function toggleMux41Select(idx) {
  Mux41State.s[idx] = Mux41State.s[idx] ? 0 : 1;
  renderMux41Controls();
  updateMux41();
}

function toggleMux41Enable() {
  Mux41State.enableG = Mux41State.enableG ? 0 : 1;
  renderMux41Controls();
  updateMux41();
}

function renderMux41Controls() {
  // Data Inputs
  const dataBank = document.getElementById("mux41-data-switches");
  if (dataBank) {
    dataBank.innerHTML = Mux41State.d.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleMux41Data(${i})" title="Toggle Data Input D${i}">
        <span class="switch-name">D${i}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // Select Inputs
  const selectBank = document.getElementById("mux41-select-switches");
  if (selectBank) {
    const selLabels = ["S1 (MSB)", "S0 (LSB)"];
    selectBank.innerHTML = Mux41State.s.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleMux41Select(${i})" title="Toggle Address ${selLabels[i]}">
        <span class="switch-name">${i === 0 ? 'S1' : 'S0'}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // Enable Strobe
  const enableBank = document.getElementById("mux41-enable-switch");
  if (enableBank) {
    const isAsserted = Mux41State.enableG === 0;
    enableBank.innerHTML = `
      <button type="button" class="switch-btn ${isAsserted ? 'active-low-active' : ''}" onclick="toggleMux41Enable()" title="Active-low Strobe Ḡ (0=Enable, 1=Inhibit)">
        <span class="switch-name">Ḡ</span>
        <span class="switch-val">${Mux41State.enableG}</span>
      </button>
      <span style="font-size:0.75rem; color:${isAsserted ? 'var(--sig-success)' : 'var(--sig-active-low)'}; font-family:var(--font-mono);">
        ${isAsserted ? '✓ ENABLED (0)' : '✕ INHIBITED (1)'}
      </span>
    `;
  }
}

function updateMux41() {
  const { d, s, enableG } = Mux41State;
  const isEnabled = enableG === 0;
  const selIndex = (s[0] << 1) | s[1];
  const outY = isEnabled ? d[selIndex] : 0;

  // 1. Update Output Indicators
  const pillY = document.getElementById("mux41-out-pill");
  const ledY = document.getElementById("mux41-led-y");
  const valY = document.getElementById("mux41-val-y");
  const selLabel = document.getElementById("mux41-sel-label");

  if (pillY && ledY && valY) {
    if (outY === 1) {
      pillY.classList.add("active");
      ledY.classList.add("lit");
    } else {
      pillY.classList.remove("active");
      ledY.classList.remove("lit");
    }
    valY.textContent = outY;
  }
  if (selLabel) {
    selLabel.textContent = isEnabled ? `D${selIndex} (${d[selIndex]})` : "Disabled (Ḡ=1)";
  }

  // 2. Update Truth Table Active Row
  // Row 0: Disabled (G=1)
  // Rows 1..4: S1S0 = 00, 01, 10, 11
  const rows = document.querySelectorAll("#mux41-table tbody tr");
  rows.forEach(r => r.classList.remove("active-row"));
  if (rows.length >= 5) {
    if (!isEnabled) {
      rows[0].classList.add("active-row");
    } else {
      rows[selIndex + 1].classList.add("active-row");
    }
  }

  // 3. Render Schematic SVG
  renderMux41Schematic(d, s, enableG, isEnabled, selIndex, outY);
}

function renderMux41Schematic(d, s, enableG, isEnabled, sel, y) {
  const container = document.getElementById("mux41-schematic-svg");
  if (!container) return;

  const gActive = enableG === 0;
  const dY = [55, 95, 135, 175];

  container.innerHTML = `
    <svg class="circuit-svg" viewBox="0 0 540 260" xmlns="http://www.w3.org/2000/svg">
      <!-- Data Inputs -->
      ${dY.map((yPos, i) => `
        <line x1="30" y1="${yPos}" x2="190" y2="${yPos}" class="wire ${d[i] ? 'high' : ''}" />
        <circle cx="30" cy="${yPos}" r="3" fill="${d[i] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
        <text x="14" y="${yPos + 4}" class="wire-label ${d[i] ? 'high' : ''}" text-anchor="end">D${i}=${d[i]}</text>
      `).join("")}

      <!-- Enable Line (Active-Low Strobe Ḡ) -->
      <line x1="190" y1="230" x2="250" y2="230" class="wire ${gActive ? 'active-low' : ''}" />
      <circle cx="250" cy="230" r="3" fill="${gActive ? 'var(--sig-active-low)' : 'var(--sig-low)'}" />
      <text x="180" y="234" class="wire-label ${gActive ? 'active-low' : ''}" text-anchor="end">Ḡ=${enableG}</text>

      <!-- Select Lines S1, S0 entering bottom -->
      <line x1="280" y1="250" x2="280" y2="200" class="wire ${s[0] ? 'high' : ''}" />
      <circle cx="280" cy="200" r="3" fill="${s[0] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="280" y="258" class="wire-label ${s[0] ? 'high' : ''}" text-anchor="middle">S1=${s[0]}</text>

      <line x1="320" y1="250" x2="320" y2="190" class="wire ${s[1] ? 'high' : ''}" />
      <circle cx="320" cy="190" r="3" fill="${s[1] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="320" y="258" class="wire-label ${s[1] ? 'high' : ''}" text-anchor="middle">S0=${s[1]}</text>

      <!-- Trapezoid Body of 4:1 Mux -->
      <polygon points="190,30 350,70 350,190 190,230" class="gate-body ${isEnabled ? 'active-block' : ''}" />
      <text x="265" y="105" class="gate-title">4:1 MUX</text>
      <text x="265" y="125" class="gate-sub">Data Selector</text>
      <text x="265" y="142" class="gate-ic">IC 74153</text>
      <text x="265" y="160" font-size="10" fill="var(--text-muted)" text-anchor="middle">
        ${isEnabled ? `CH D${sel} → Y` : 'DISABLED'}
      </text>

      <!-- Routed Internal Path -->
      ${isEnabled ? `
        <line x1="190" y1="${dY[sel]}" x2="350" y2="130" stroke="${d[sel] ? 'var(--sig-high)' : 'var(--sig-low)'}" stroke-width="2.8" stroke-dasharray="5,4" />
      ` : ''}

      <!-- Output Line -->
      <line x1="350" y1="130" x2="450" y2="130" class="wire ${y ? 'high' : ''}" />
      <circle cx="456" cy="130" class="led-node ${y ? 'lit' : ''}" />
      <text x="474" y="134" class="wire-label ${y ? 'high' : ''}">Y = ${y}</text>
    </svg>
  `;
}


// ============================================================================
// 2. 8:1 MULTIPLEXER (IC 74151)
// ============================================================================

const Mux81State = {
  d: [1, 0, 0, 0, 0, 0, 0, 0], // D0 to D7
  s: [0, 0, 0],                // S2, S1, S0
  enableG: 0                   // Active-low strobe Ḡ (0 = Enabled, 1 = Disabled)
};

const DEFAULT_MUX81 = {
  d: [1, 0, 0, 0, 0, 0, 0, 0],
  s: [0, 0, 0],
  enableG: 0
};

function initMux81() {
  renderMux81Controls();
  updateMux81();
}

function resetMux81() {
  Mux81State.d = [...DEFAULT_MUX81.d];
  Mux81State.s = [...DEFAULT_MUX81.s];
  Mux81State.enableG = DEFAULT_MUX81.enableG;
  renderMux81Controls();
  updateMux81();
}

function toggleMux81Data(idx) {
  Mux81State.d[idx] = Mux81State.d[idx] ? 0 : 1;
  renderMux81Controls();
  updateMux81();
}

function toggleMux81Select(idx) {
  Mux81State.s[idx] = Mux81State.s[idx] ? 0 : 1;
  renderMux81Controls();
  updateMux81();
}

function toggleMux81Enable() {
  Mux81State.enableG = Mux81State.enableG ? 0 : 1;
  renderMux81Controls();
  updateMux81();
}

function renderMux81Controls() {
  // Data Inputs
  const dataBank = document.getElementById("mux81-data-switches");
  if (dataBank) {
    dataBank.innerHTML = Mux81State.d.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleMux81Data(${i})" title="Toggle Data Input D${i}">
        <span class="switch-name">D${i}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // Select Inputs
  const selectBank = document.getElementById("mux81-select-switches");
  if (selectBank) {
    const selLabels = ["S2 (MSB)", "S1", "S0 (LSB)"];
    selectBank.innerHTML = Mux81State.s.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleMux81Select(${i})" title="Toggle Address ${selLabels[i]}">
        <span class="switch-name">S${2 - i}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // Enable Strobe
  const enableBank = document.getElementById("mux81-enable-switch");
  if (enableBank) {
    const isAsserted = Mux81State.enableG === 0;
    enableBank.innerHTML = `
      <button type="button" class="switch-btn ${isAsserted ? 'active-low-active' : ''}" onclick="toggleMux81Enable()" title="Active-low Strobe Ḡ (0=Enable, 1=Inhibit)">
        <span class="switch-name">Ḡ</span>
        <span class="switch-val">${Mux81State.enableG}</span>
      </button>
      <span style="font-size:0.75rem; color:${isAsserted ? 'var(--sig-success)' : 'var(--sig-active-low)'}; font-family:var(--font-mono);">
        ${isAsserted ? '✓ ENABLED (0)' : '✕ INHIBITED (1)'}
      </span>
    `;
  }
}

function updateMux81() {
  const { d, s, enableG } = Mux81State;
  const isEnabled = enableG === 0;
  const selIndex = (s[0] << 2) | (s[1] << 1) | s[2];
  
  // 74151 Output Specification:
  // When Ḡ = 1: Y = 0, W̄ = 1
  // When Ḡ = 0: Y = D[sel], W̄ = NOT(D[sel])
  const outY = isEnabled ? d[selIndex] : 0;
  const outW = isEnabled ? (d[selIndex] ^ 1) : 1;

  // 1. Indicators
  const pillY = document.getElementById("mux81-out-pill-y");
  const ledY = document.getElementById("mux81-led-y");
  const valY = document.getElementById("mux81-val-y");

  const pillW = document.getElementById("mux81-out-pill-w");
  const ledW = document.getElementById("mux81-led-w");
  const valW = document.getElementById("mux81-val-w");

  const selLabel = document.getElementById("mux81-sel-label");

  if (pillY && ledY && valY) {
    if (outY === 1) {
      pillY.classList.add("active");
      ledY.classList.add("lit");
    } else {
      pillY.classList.remove("active");
      ledY.classList.remove("lit");
    }
    valY.textContent = outY;
  }

  if (pillW && ledW && valW) {
    if (outW === 1) {
      pillW.classList.add("active");
      ledW.classList.add("lit");
    } else {
      pillW.classList.remove("active");
      ledW.classList.remove("lit");
    }
    valW.textContent = outW;
  }

  if (selLabel) {
    selLabel.textContent = isEnabled ? `D${selIndex} (${d[selIndex]})` : "Disabled (Ḡ=1)";
  }

  // 2. Truth Table Active Row
  // Row 0: G=1 Disabled
  // Rows 1..8: Sel 0..7
  const rows = document.querySelectorAll("#mux81-table tbody tr");
  rows.forEach(r => r.classList.remove("active-row"));
  if (rows.length >= 9) {
    if (!isEnabled) {
      rows[0].classList.add("active-row");
    } else {
      rows[selIndex + 1].classList.add("active-row");
    }
  }

  // 3. Render Schematic
  renderMux81Schematic(d, s, enableG, isEnabled, selIndex, outY, outW);
}

function renderMux81Schematic(d, s, enableG, isEnabled, sel, y, w) {
  const container = document.getElementById("mux81-schematic-svg");
  if (!container) return;

  const gActive = enableG === 0;
  const dY = [35, 60, 85, 110, 135, 160, 185, 210];

  container.innerHTML = `
    <svg class="circuit-svg" viewBox="0 0 540 280" xmlns="http://www.w3.org/2000/svg">
      <!-- 8 Data Inputs -->
      ${dY.map((yPos, i) => `
        <line x1="30" y1="${yPos}" x2="190" y2="${yPos}" class="wire ${d[i] ? 'high' : ''}" />
        <circle cx="30" cy="${yPos}" r="2.5" fill="${d[i] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
        <text x="14" y="${yPos + 3.5}" class="wire-label ${d[i] ? 'high' : ''}" font-size="10" text-anchor="end">D${i}=${d[i]}</text>
      `).join("")}

      <!-- Enable Line (Active-Low Strobe Ḡ) -->
      <line x1="190" y1="240" x2="250" y2="240" class="wire ${gActive ? 'active-low' : ''}" />
      <circle cx="250" cy="240" r="3" fill="${gActive ? 'var(--sig-active-low)' : 'var(--sig-low)'}" />
      <text x="180" y="244" class="wire-label ${gActive ? 'active-low' : ''}" text-anchor="end">Ḡ=${enableG}</text>

      <!-- Select Lines S2, S1, S0 entering bottom -->
      <line x1="265" y1="265" x2="265" y2="225" class="wire ${s[0] ? 'high' : ''}" />
      <text x="265" y="275" class="wire-label ${s[0] ? 'high' : ''}" font-size="10" text-anchor="middle">S2=${s[0]}</text>

      <line x1="295" y1="265" x2="295" y2="215" class="wire ${s[1] ? 'high' : ''}" />
      <text x="295" y="275" class="wire-label ${s[1] ? 'high' : ''}" font-size="10" text-anchor="middle">S1=${s[1]}</text>

      <line x1="325" y1="265" x2="325" y2="205" class="wire ${s[2] ? 'high' : ''}" />
      <text x="325" y="275" class="wire-label ${s[2] ? 'high' : ''}" font-size="10" text-anchor="middle">S0=${s[2]}</text>

      <!-- Trapezoid Body -->
      <polygon points="190,20 350,60 350,210 190,250" class="gate-body ${isEnabled ? 'active-block' : ''}" />
      <text x="265" y="95" class="gate-title">8:1 MUX</text>
      <text x="265" y="115" class="gate-sub">Data Selector</text>
      <text x="265" y="132" class="gate-ic">IC 74151</text>
      <text x="265" y="152" font-size="10" fill="var(--text-muted)" text-anchor="middle">
        ${isEnabled ? `CH D${sel} Active` : 'DISABLED (Ḡ=1)'}
      </text>

      <!-- Internal Routing -->
      ${isEnabled ? `
        <line x1="190" y1="${dY[sel]}" x2="350" y2="105" stroke="${d[sel] ? 'var(--sig-high)' : 'var(--sig-low)'}" stroke-width="2.6" stroke-dasharray="4,3" />
      ` : ''}

      <!-- Output Line Y (True) -->
      <line x1="350" y1="105" x2="440" y2="105" class="wire ${y ? 'high' : ''}" />
      <circle cx="446" cy="105" class="led-node ${y ? 'lit' : ''}" />
      <text x="464" y="109" class="wire-label ${y ? 'high' : ''}">Y = ${y}</text>

      <!-- Output Line W̄ (Complementary) -->
      <line x1="350" y1="165" x2="440" y2="165" class="wire ${w ? 'high' : ''}" />
      <circle cx="446" cy="165" class="led-node ${w ? 'lit' : ''}" />
      <text x="464" y="169" class="wire-label ${w ? 'high' : ''}">W̄ = ${w}</text>
    </svg>
  `;
}

