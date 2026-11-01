/**
 * DECO MINI - 1:4 Demultiplexer (IC 74139) Simulation Engine
 * Emulates one section of the Dual 2-to-4 Line Decoder / Demultiplexer
 * Active-low outputs (Ȳ0..Ȳ3) and Active-low Enable Strobe (Ḡ)
 */

const DemuxState = {
  din: 1,      // Data Input to route (0 or 1)
  s: [0, 0],   // S1 (Address B), S0 (Address A)
  enableG: 0   // Active-low Strobe 1Ḡ (0 = Enabled, 1 = Disabled)
};

const DEFAULT_DEMUX = {
  din: 1,
  s: [0, 0],
  enableG: 0
};

function initDemux() {
  renderDemuxControls();
  updateDemux();
}

function resetDemux() {
  DemuxState.din = DEFAULT_DEMUX.din;
  DemuxState.s = [...DEFAULT_DEMUX.s];
  DemuxState.enableG = DEFAULT_DEMUX.enableG;
  renderDemuxControls();
  updateDemux();
}

function toggleDemuxData() {
  DemuxState.din = DemuxState.din ? 0 : 1;
  renderDemuxControls();
  updateDemux();
}

function toggleDemuxSelect(idx) {
  DemuxState.s[idx] = DemuxState.s[idx] ? 0 : 1;
  renderDemuxControls();
  updateDemux();
}

function toggleDemuxEnable() {
  DemuxState.enableG = DemuxState.enableG ? 0 : 1;
  renderDemuxControls();
  updateDemux();
}

function renderDemuxControls() {
  // Data Input Switch
  const dataBank = document.getElementById("demux-data-switch");
  if (dataBank) {
    dataBank.innerHTML = `
      <button type="button" class="switch-btn ${DemuxState.din ? 'high' : ''}" onclick="toggleDemuxData()" title="Toggle Data Input Din">
        <span class="switch-name">Din</span>
        <span class="switch-val">${DemuxState.din}</span>
      </button>
    `;
  }

  // Address Select Switches (S1, S0)
  const selBank = document.getElementById("demux-select-switches");
  if (selBank) {
    const labels = ["S1 (B)", "S0 (A)"];
    selBank.innerHTML = DemuxState.s.map((val, i) => `
      <button type="button" class="switch-btn ${val ? 'high' : ''}" onclick="toggleDemuxSelect(${i})" title="Toggle ${labels[i]}">
        <span class="switch-name">${i === 0 ? 'S1 (B)' : 'S0 (A)'}</span>
        <span class="switch-val">${val}</span>
      </button>
    `).join("");
  }

  // Active-Low Enable Strobe (1Ḡ)
  const enBank = document.getElementById("demux-enable-switch");
  if (enBank) {
    const isAsserted = DemuxState.enableG === 0;
    enBank.innerHTML = `
      <button type="button" class="switch-btn ${isAsserted ? 'active-low-active' : ''}" onclick="toggleDemuxEnable()" title="Active-Low Enable 1Ḡ (0=Enable, 1=Inhibit)">
        <span class="switch-name">1Ḡ</span>
        <span class="switch-val">${DemuxState.enableG}</span>
      </button>
      <span style="font-size:0.75rem; color:${isAsserted ? 'var(--sig-success)' : 'var(--sig-active-low)'}; font-family:var(--font-mono);">
        ${isAsserted ? '✓ ENABLED (0)' : '✕ INHIBITED (1)'}
      </span>
    `;
  }
}

function updateDemux() {
  const { din, s, enableG } = DemuxState;
  const isEnabled = enableG === 0;
  const selIndex = (s[0] << 1) | s[1];

  // 74139 Active-Low Outputs:
  // When Disabled (Ḡ = 1): all outputs are 1 (HIGH / Inactive)
  // When Enabled (Ḡ = 0):
  //   Unselected channels remain 1 (HIGH)
  //   Selected channel is inverted Din (i.e. if Din=1 -> Output is 0 / Active-Low LOW; if Din=0 -> Output is 1)
  const outputs = [1, 1, 1, 1];
  if (isEnabled) {
    outputs[selIndex] = din ? 0 : 1;
  }

  // 1. Update Output Pills
  for (let i = 0; i < 4; i++) {
    const pill = document.getElementById(`demux-pill-y${i}`);
    const led = document.getElementById(`demux-led-y${i}`);
    const val = document.getElementById(`demux-val-y${i}`);

    if (pill && led && val) {
      val.textContent = outputs[i];
      // Note: active-low output is ACTIVE when value is 0!
      const isActiveLowAsserted = (outputs[i] === 0);
      if (isActiveLowAsserted) {
        pill.classList.add("active-low-asserted");
        led.classList.add("lit-amber");
      } else {
        pill.classList.remove("active-low-asserted");
        led.classList.remove("lit-amber");
      }
    }
  }

  const selStatus = document.getElementById("demux-sel-label");
  if (selStatus) {
    selStatus.textContent = isEnabled 
      ? `Channel Ȳ${selIndex} Selected (routes ${din ? 'Active Low 0' : 'High 1'})`
      : "Disabled (All outputs HIGH)";
  }

  // 2. Truth Table Highlighting
  // Row 0: Disabled (Ḡ=1)
  // Rows 1..8: Ḡ=0 with Din=0/1 and S1,S0
  // Or standard 5-row table (Disabled + 4 channels)
  const rows = document.querySelectorAll("#demux-table tbody tr");
  rows.forEach(r => r.classList.remove("active-row"));
  if (rows.length >= 5) {
    if (!isEnabled) {
      rows[0].classList.add("active-row");
    } else {
      rows[selIndex + 1].classList.add("active-row");
    }
  }

  // 3. Render Schematic
  renderDemuxSchematic(din, s, enableG, isEnabled, selIndex, outputs);
}

function renderDemuxSchematic(din, s, enableG, isEnabled, sel, outs) {
  const container = document.getElementById("demux-schematic-svg");
  if (!container) return;

  const gActive = enableG === 0;
  const outY = [60, 105, 150, 195];

  container.innerHTML = `
    <svg class="circuit-svg" viewBox="0 0 540 260" xmlns="http://www.w3.org/2000/svg">
      <!-- Data Input Wire -->
      <line x1="30" y1="125" x2="190" y2="125" class="wire ${din ? 'high' : ''}" />
      <circle cx="30" cy="125" r="3" fill="${din ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="14" y="129" class="wire-label ${din ? 'high' : ''}" text-anchor="end">Din=${din}</text>

      <!-- Active-Low Enable Ḡ -->
      <line x1="190" y1="230" x2="250" y2="230" class="wire ${gActive ? 'active-low' : ''}" />
      <circle cx="250" cy="230" r="3" fill="${gActive ? 'var(--sig-active-low)' : 'var(--sig-low)'}" />
      <text x="180" y="234" class="wire-label ${gActive ? 'active-low' : ''}" text-anchor="end">1Ḡ=${enableG}</text>

      <!-- Address Select Inputs S1(B), S0(A) -->
      <line x1="280" y1="250" x2="280" y2="190" class="wire ${s[0] ? 'high' : ''}" />
      <circle cx="280" cy="190" r="3" fill="${s[0] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="280" y="258" class="wire-label ${s[0] ? 'high' : ''}" text-anchor="middle">S1(B)=${s[0]}</text>

      <line x1="320" y1="250" x2="320" y2="200" class="wire ${s[1] ? 'high' : ''}" />
      <circle cx="320" cy="200" r="3" fill="${s[1] ? 'var(--sig-high)' : 'var(--sig-low)'}" />
      <text x="320" y="258" class="wire-label ${s[1] ? 'high' : ''}" text-anchor="middle">S0(A)=${s[1]}</text>

      <!-- Demultiplexer Trapezoid (Inverted expansion) -->
      <polygon points="190,70 350,30 350,230 190,190" class="gate-body ${isEnabled ? 'active-block' : ''}" />
      <text x="265" y="105" class="gate-title">1:4 DEMUX</text>
      <text x="265" y="125" class="gate-sub">Data Distributor</text>
      <text x="265" y="142" class="gate-ic">IC 74139</text>
      <text x="265" y="160" font-size="10" fill="var(--text-muted)" text-anchor="middle">
        ${isEnabled ? `Active-Low Outputs` : 'DISABLED (Ḡ=1)'}
      </text>

      <!-- Internal Routing Path -->
      ${isEnabled ? `
        <line x1="190" y1="125" x2="350" y2="${outY[sel]}" stroke="${outs[sel] === 0 ? 'var(--sig-active-low)' : 'var(--sig-low)'}" stroke-width="2.8" stroke-dasharray="5,4" />
      ` : ''}

      <!-- 4 Active-Low Inverting Outputs (bubbles indicate active-low) -->
      ${outY.map((yPos, i) => {
        const isAsserted = outs[i] === 0;
        return `
          <!-- Inversion bubble -->
          <circle cx="356" cy="${yPos}" r="4" fill="none" stroke="var(--border-strong)" stroke-width="1.8" />
          <line x1="360" y1="${yPos}" x2="450" y2="${yPos}" class="wire ${isAsserted ? 'active-low' : ''}" />
          <circle cx="456" cy="${yPos}" class="led-node ${isAsserted ? 'lit-amber' : ''}" />
          <text x="472" y="${yPos + 4}" class="wire-label ${isAsserted ? 'active-low' : ''}">1Ȳ${i} = ${outs[i]}</text>
        `;
      }).join("")}
    </svg>
  `;
}

