/**
 * DECO MINI - 8:3 Priority Encoder (IC 74148) Simulation Engine
 * Emulates the 8-line to 3-line priority encoder with active-low inputs/outputs,
 * Enable Input (ĒI), Enable Output (ĒO), and Group Select (ḠS).
 */

const EncoderState = {
  inputs: [1, 1, 1, 1, 1, 1, 1, 0], // Ī0..Ī7 (Active-low: 0=active, 1=inactive). Default Ī7=0 active
  ei: 0                             // Active-low Enable Input ĒI (0=enabled, 1=disabled)
};

const DEFAULT_ENCODER = {
  inputs: [1, 1, 1, 1, 1, 1, 1, 0],
  ei: 0
};

function initEncoder() {
  renderEncoderControls();
  updateEncoder();
}

function resetEncoder() {
  EncoderState.inputs = [...DEFAULT_ENCODER.inputs];
  EncoderState.ei = DEFAULT_ENCODER.ei;
  renderEncoderControls();
  updateEncoder();
}

function toggleEncoderInput(idx) {
  EncoderState.inputs[idx] = EncoderState.inputs[idx] ? 0 : 1;
  renderEncoderControls();
  updateEncoder();
}

function toggleEncoderEI() {
  EncoderState.ei = EncoderState.ei ? 0 : 1;
  renderEncoderControls();
  updateEncoder();
}

function renderEncoderControls() {
  // Inputs Ī0 to Ī7 (Active-low: 0 is asserted/active!)
  const inBank = document.getElementById("encoder-input-switches");
  if (inBank) {
    inBank.innerHTML = EncoderState.inputs.map((val, i) => {
      const isAsserted = (val === 0);
      return `
        <button type="button" class="switch-btn ${isAsserted ? 'active-low-active' : ''}" onclick="toggleEncoderInput(${i})" title="Input Ī${i} (0=Active, 1=Inactive)">
          <span class="switch-name">Ī${i}</span>
          <span class="switch-val">${val}</span>
        </button>
      `;
    }).join("");
  }

  // Enable Input ĒI
  const eiBank = document.getElementById("encoder-ei-switch");
  if (eiBank) {
    const isEiAsserted = (EncoderState.ei === 0);
    eiBank.innerHTML = `
      <button type="button" class="switch-btn ${isEiAsserted ? 'active-low-active' : ''}" onclick="toggleEncoderEI()" title="Enable Input ĒI (0=Enabled, 1=Inhibited)">
        <span class="switch-name">ĒI</span>
        <span class="switch-val">${EncoderState.ei}</span>
      </button>
      <span style="font-size:0.75rem; color:${isEiAsserted ? 'var(--sig-success)' : 'var(--sig-active-low)'}; font-family:var(--font-mono);">
        ${isEiAsserted ? '✓ ENABLED (0)' : '✕ INHIBITED (1)'}
      </span>
    `;
  }
}

function updateEncoder() {
  const { inputs, ei } = EncoderState;
  const isEnabled = (ei === 0);

  let winningIndex = -1;
  let a2 = 1, a1 = 1, a0 = 1; // Active-low outputs default 1
  let gs = 1, eo = 1;

  if (!isEnabled) {
    // Disabled state
    a2 = 1; a1 = 1; a0 = 1;
    gs = 1; eo = 1;
  } else {
    // Find highest active input (0) from 7 down to 0
    for (let i = 7; i >= 0; i--) {
      if (inputs[i] === 0) {
        winningIndex = i;
        break;
      }
    }

    if (winningIndex !== -1) {
      // Input active
      // Invert binary value for active-low outputs
      a2 = ((winningIndex >> 2) & 1) ? 0 : 1;
      a1 = ((winningIndex >> 1) & 1) ? 0 : 1;
      a0 = (winningIndex & 1) ? 0 : 1;
      gs = 0; // Active group signal
      eo = 1; // Cascading inhibited
    } else {
      // Enabled, but all inputs 1 (inactive)
      a2 = 1; a1 = 1; a0 = 1;
      gs = 1; // No group active
      eo = 0; // Active enable output (cascades to next stage)
    }
  }

  // 1. Update Output Indicators
  const updateOutPill = (idPrefix, val, isAsserted) => {
    const pill = document.getElementById(`${idPrefix}-pill`);
    const led = document.getElementById(`${idPrefix}-led`);
    const txt = document.getElementById(`${idPrefix}-val`);
    if (pill && led && txt) {
      txt.textContent = val;
      if (isAsserted) {
        pill.classList.add("active-low-asserted");
        led.classList.add("lit-amber");
      } else {
        pill.classList.remove("active-low-asserted");
        led.classList.remove("lit-amber");
      }
    }
  };

  updateOutPill("encoder-a2", a2, a2 === 0);
  updateOutPill("encoder-a1", a1, a1 === 0);
  updateOutPill("encoder-a0", a0, a0 === 0);
  updateOutPill("encoder-gs", gs, gs === 0);
  updateOutPill("encoder-eo", eo, eo === 0);

  const statusLabel = document.getElementById("encoder-sel-label");
  if (statusLabel) {
    if (!isEnabled) {
      statusLabel.textContent = "Disabled (ĒI = 1, all outputs HIGH)";
    } else if (winningIndex !== -1) {
      statusLabel.textContent = `Priority Winner: Input Ī${winningIndex} (Binary: ${winningIndex}, Active-Low Code: ${a2}${a1}${a0})`;
    } else {
      statusLabel.textContent = "No Active Inputs (ĒO=0 enabled for cascading)";
    }
  }

  // 2. Truth Table Highlighting
  // Row 0: Disabled (ĒI=1)
  // Row 1: ĒI=0, all inputs 1 -> None active
  // Rows 2..9: Input 7 active, Input 6 active, ..., Input 0 active
  const rows = document.querySelectorAll("#encoder-table tbody tr");
  rows.forEach(r => r.classList.remove("active-row"));
  if (rows.length >= 10) {
    if (!isEnabled) {
      rows[0].classList.add("active-row");
    } else if (winningIndex === -1) {
      rows[1].classList.add("active-row");
    } else {
      // winningIndex 7 is row 2, 6 is row 3, etc. -> row = 2 + (7 - winningIndex)
      const rIdx = 2 + (7 - winningIndex);
      if (rows[rIdx]) rows[rIdx].classList.add("active-row");
    }
  }

  // 3. Render Schematic
  renderEncoderSchematic(inputs, ei, isEnabled, winningIndex, a2, a1, a0, gs, eo);
}

function renderEncoderSchematic(inputs, ei, isEnabled, winner, a2, a1, a0, gs, eo) {
  const container = document.getElementById("encoder-schematic-svg");
  if (!container) return;

  const inY = [35, 58, 81, 104, 127, 150, 173, 196];
  const outY = [55, 95, 135, 180, 215];

  container.innerHTML = `
    <svg class="circuit-svg" viewBox="0 0 540 280" xmlns="http://www.w3.org/2000/svg">
      <!-- 8 Active-Low Inputs on Left with Inversion Bubbles -->
      ${inY.map((yPos, i) => {
        const isAsserted = (inputs[i] === 0);
        const isWinner = (winner === i);
        return `
          <line x1="30" y1="${yPos}" x2="182" y2="${yPos}" class="wire ${isAsserted ? 'active-low' : ''}" />
          <circle cx="186" cy="${yPos}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
          <text x="14" y="${yPos + 4}" class="wire-label ${isWinner ? 'active-low' : (isAsserted ? 'active-low' : '')}" font-size="10" text-anchor="end">
            ${isWinner ? '★ ' : ''}Ī${i}=${inputs[i]}
          </text>
        `;
      }).join("")}

      <!-- Enable Input ĒI on Left Bottom -->
      <line x1="30" y1="235" x2="182" y2="235" class="wire ${ei === 0 ? 'active-low' : ''}" />
      <circle cx="186" cy="235" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <text x="14" y="239" class="wire-label ${ei === 0 ? 'active-low' : ''}" font-size="10" text-anchor="end">ĒI=${ei}</text>

      <!-- Main Chip Block -->
      <rect x="190" y="20" width="160" height="235" rx="8" class="gate-body ${isEnabled ? 'active-block' : ''}" />
      <text x="270" y="85" class="gate-title">8:3 ENCODER</text>
      <text x="270" y="105" class="gate-sub">Priority Resolver</text>
      <text x="270" y="122" class="gate-ic">IC 74148</text>
      <text x="270" y="142" font-size="10" fill="var(--text-muted)" text-anchor="middle">
        ${isEnabled && winner !== -1 ? `Active: Ī${winner}` : (isEnabled ? 'Idle (No Input)' : 'DISABLED')}
      </text>

      <!-- Active-Low Outputs on Right: Ā2, Ā1, Ā0, ḠS, ĒO -->
      <!-- Ā2 -->
      <circle cx="356" cy="${outY[0]}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="360" y1="${outY[0]}" x2="445" y2="${outY[0]}" class="wire ${a2 === 0 ? 'active-low' : ''}" />
      <circle cx="451" cy="${outY[0]}" class="led-node ${a2 === 0 ? 'lit-amber' : ''}" />
      <text x="466" y="${outY[0] + 4}" class="wire-label ${a2 === 0 ? 'active-low' : ''}" font-size="10">Ā2 = ${a2}</text>

      <!-- Ā1 -->
      <circle cx="356" cy="${outY[1]}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="360" y1="${outY[1]}" x2="445" y2="${outY[1]}" class="wire ${a1 === 0 ? 'active-low' : ''}" />
      <circle cx="451" cy="${outY[1]}" class="led-node ${a1 === 0 ? 'lit-amber' : ''}" />
      <text x="466" y="${outY[1] + 4}" class="wire-label ${a1 === 0 ? 'active-low' : ''}" font-size="10">Ā1 = ${a1}</text>

      <!-- Ā0 -->
      <circle cx="356" cy="${outY[2]}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="360" y1="${outY[2]}" x2="445" y2="${outY[2]}" class="wire ${a0 === 0 ? 'active-low' : ''}" />
      <circle cx="451" cy="${outY[2]}" class="led-node ${a0 === 0 ? 'lit-amber' : ''}" />
      <text x="466" y="${outY[2] + 4}" class="wire-label ${a0 === 0 ? 'active-low' : ''}" font-size="10">Ā0 = ${a0}</text>

      <!-- ḠS -->
      <circle cx="356" cy="${outY[3]}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="360" y1="${outY[3]}" x2="445" y2="${outY[3]}" class="wire ${gs === 0 ? 'active-low' : ''}" />
      <circle cx="451" cy="${outY[3]}" class="led-node ${gs === 0 ? 'lit-amber' : ''}" />
      <text x="466" y="${outY[3] + 4}" class="wire-label ${gs === 0 ? 'active-low' : ''}" font-size="10">ḠS = ${gs}</text>

      <!-- ĒO -->
      <circle cx="356" cy="${outY[4]}" r="3.6" fill="none" stroke="var(--border-strong)" stroke-width="1.6" />
      <line x1="360" y1="${outY[4]}" x2="445" y2="${outY[4]}" class="wire ${eo === 0 ? 'active-low' : ''}" />
      <circle cx="451" cy="${outY[4]}" class="led-node ${eo === 0 ? 'lit-amber' : ''}" />
      <text x="466" y="${outY[4] + 4}" class="wire-label ${eo === 0 ? 'active-low' : ''}" font-size="10">ĒO = ${eo}</text>
    </svg>
  `;
}

