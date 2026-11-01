# DECO MINI

> **Combinational Logic Circuit Workbench & Learning Suite**  
> An educational platform for undergraduate engineering students exploring fundamental combinational digital logic circuits, authentic IC pinout configurations, active-low enable strobes, and interactive real-time simulations.

Live Demo: [https://switchd2.github.io/Deco--Mini-/](https://switchd2.github.io/Deco--Mini-/)

---

## 1. Project Overview

DECO MINI is structured specifically for second-year electrical and computer engineering students studying Digital Design, Computer Architecture, and Microprocessor Systems.

Each circuit module follows a consistent 9-step pedagogical layout:
1. **Circuit Title and IC Identification**
2. **Concise Introduction and Working Principle**
3. **Input, Output, Select Bus, and Active-Level Specifications**
4. **Interactive Logic & Signal Flow Diagram (SVG)**
5. **Truth Table with Dynamic Row Highlighting**
6. **Canonical Boolean Expressions & Logic Equations**
7. **Real-Time Interactive Simulation with 0/1 Tactile Controls and Reset**
8. **Real-World Practical Engineering Applications**
9. **Seamless Cross-Circuit and Directory Navigation**

---

## 2. Supported Circuits & IC Specifications

| Circuit | TTL IC | Function & Key Pin Characteristics |
| :--- | :--- | :--- |
| **4:1 Multiplexer** | **74153** | Selects 1 of 4 data inputs (D0–D3) using 2 select lines (S1, S0). Features active-low strobe ($\bar{G}$) clamping output $Y=0$ when inhibited. |
| **8:1 Multiplexer** | **74151** | Selects 1 of 8 data inputs (D0–D7) using 3 select lines (S2–S0). Provides dual complementary outputs (true $Y$ and inverted $\bar{W}$) with active-low strobe ($\bar{G}$). |
| **1:4 Demultiplexer** | **74139** | Dual 2-to-4 decoder/demux. Emulates one section routing data to 4 active-low outputs ($\bar{Y}_0$–$\bar{Y}_3$) controlled by address bits (S1, S0) and active-low enable ($1\bar{G}$). |
| **3:8 Inverting Decoder** | **74138** | 3-to-8 line inverting decoder with 3-line gating enable system ($G1=1, \bar{G}_{2A}=0, \bar{G}_{2B}=0$) asserting 1 of 8 active-low outputs ($\bar{Y}_0$–$\bar{Y}_7$). |
| **8:3 Priority Encoder** | **74148** | Prioritizes 8 active-low inputs ($\bar{I}_0$–$\bar{I}_7$, with $\bar{I}_7$ highest) into a 3-bit active-low binary code ($\bar{A}_2, \bar{A}_1, \bar{A}_0$), with status flags $\bar{G}S$ and cascade $\bar{E}O$. |

---

## 3. Project File Structure

```text
Deco Mini/
├── index.html              # Landing page & circuit directory
├── pages/
│   ├── mux-4-1.html        # 4:1 Multiplexer (IC 74153)
│   ├── mux-8-1.html        # 8:1 Multiplexer (IC 74151)
│   ├── demux-1-4.html      # 1:4 Demultiplexer (IC 74139)
│   ├── decoder-3-8.html    # 3:8 Decoder (IC 74138)
│   └── encoder-8-3.html    # 8:3 Priority Encoder (IC 74148)
├── css/
│   └── style.css           # Restrained dark navy/charcoal + cyan design system
├── js/
│   ├── main.js             # Global UI, mobile drawer, smooth navigation
│   ├── mux.js              # 74153 (4:1) & 74151 (8:1) simulation engine
│   ├── demux.js            # 74139 (1:4) demultiplexer simulation engine
│   ├── decoder.js          # 74138 (3:8) inverting decoder simulation engine
│   └── encoder.js          # 74148 (8:3) priority encoder simulation engine
├── assets/
│   └── logo.svg            # DECO MINI vector brand mark
└── README.md               # Project documentation & reference
```

---

## 4. Key Implementation Highlights

- **Pure Vanilla Web Standards**: Built entirely with HTML5, CSS3, SVG, and Vanilla JavaScript. Zero build steps, zero node dependencies, zero framework overhead.
- **Accurate Active-Low Logic**: Honors active-low conventions throughout diagrams, truth tables, and control buttons (e.g. $\bar{G}, \bar{G}_{2A}, \bar{G}_{2B}, \bar{E}I, \bar{G}S, \bar{E}O$).
- **Live Signal Path Highlighting**: SVG wire paths change color and state dynamically as inputs are toggled.
- **Dynamic Truth Table Matching**: Rows in truth tables highlight automatically when inputs match the corresponding state.
- **Documented Default Resets**: One-click reset controls restore each circuit to its canonical test state.
- **Responsive Layout**: Designed for mobile phones, tablets, and desktop workstations with accessible tap targets and horizontal scroll wrappers for data tables.
- **GitHub Pages Ready**: Uses relative linking paths throughout, ensuring flawless deployment on root domains or project subpaths.

---

## 5. Development & Local Testing

Simply open `index.html` in any modern web browser:

```bash
# Optional local test server
python -m http.server 8000
# Open http://localhost:8000
```

---

## 6. License & Credits

Developed as part of the DECO MINI Combinational Logic learning initiative.
Distributed under the MIT License.
