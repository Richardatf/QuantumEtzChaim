# QEC-1 Fabrication Pack

**Release:** fabrication profile 0.1  
**Applies to:** QEC-1A tabletop demonstrator  
**Panel:** 600 × 420 × 3 mm  
**Switch subplate:** 150 × 108 × 1.5 mm  
**Electrical boundary:** two external 5 V domains; no mains inside the enclosure

This pack turns the physical model into a controlled fabrication job. It does not certify a finished machine. The four-key QEC-1P prototype must pass first, and every dimension tied to a purchased component must be verified against the actual part before cutting the final material.

## 1. Release contents

| Artifact                       | Authority                                                              |
| ------------------------------ | ---------------------------------------------------------------------- |
| `qec-1-panel-cut-template.svg` | Full-scale top-panel cut and engraving geometry                        |
| `qec-1-key-subplate.svg`       | Full-scale 24-key MX-compatible 1.5 mm subplate                        |
| `qec-panel-map-v0.1.json`      | Addresses 0–55, coordinates, connector groups, harness lengths, colors |
| `qec-bom-v0.1.json`            | Preferred manufacturer parts, substitutions, price snapshot            |
| `QEC_1_BUILD_TRACKER.md`       | Measured acceptance record and stop gates                              |
| `qec-hardware-v0.1.json`       | Machine, power, protocol, and scientific boundary                      |

Red vectors in the SVG templates are cuts; blue vectors are engraving or print marks. Never scale either SVG to fit a printer page.

## 2. Mandatory pre-fabrication gate

Do not order the full pixel quantity or cut the final panel until all of these are true:

- QEC-1P powers from separate USB and fused 5 V panel sources.
- `HELLO` receives a compatible `READY`.
- The Console creates a valid `qec-run-passport-0.1` file with the `qec-machine-run-extension-0.1` extension.
- The bench applies every passport `STATE` frame and records `APPLIED` acknowledgements.
- A 0.26 brightness request is rejected without changing the last valid display.
- A 2,000 ms heartbeat lapse produces a watchdog fault and requires a fresh handshake.
- One selected keyswitch and one selected pixel fit disposable samples of the 14.00 mm and 5.20 mm cuts.

Record evidence in the build tracker. A browser simulation is software evidence; it does not replace the physical QEC-1P gate.

## 3. Mechanical stack

1. **Top panel:** 600 × 420 × 3 mm opaque acrylic, aluminum composite, or sealed plywood.
2. **Key bay:** 134 × 92 mm aperture in the top panel.
3. **Key subplate:** 150 × 108 × 1.5 mm, fixed below the panel with four M3 fasteners. The chosen switch clips into this thinner plate; keycaps project through the larger opening.
4. **Indicator retention:** selected 5 mm pixels, light pipes, or holders installed only after a scrap-fit test. The nominal hole is 5.20 mm.
5. **Da’at boundary:** address 10 uses a deliberately smaller 2.50 mm aperture. It is present but not presented as an eleventh visible sefirah.
6. **Internal tray:** removable, grounded where required by the chosen material, with standoffs and strain relief.
7. **Ventilation:** at least 2,400 mm² unobstructed area after filters, guards, cables, and the bottom cover are installed.

The display and panel-power-switch areas are intentionally not finalized in the cut template. Their cutouts depend on the actual purchased display, inlet harness, and switch. Mark them from the component drawings and an actual sample.

## 4. Cut-file procedure

1. Open the SVG in software that preserves millimeter units.
2. Confirm the document reports 600 × 420 mm or 150 × 108 mm, as applicable.
3. Export or print at 100%; disable “fit,” “shrink,” and automatic margins.
4. Measure the 100 mm top-panel calibration bar and 50 mm subplate bar.
5. Reject output whose calibration error exceeds 0.25 mm over 100 mm.
6. Cut the indicator and switch samples in scrap from the final material lot.
7. Confirm actual retention, keycap clearance, light diffusion, and serviceability.
8. Cut a disposable full-size paper or hardboard panel and place every part.
9. Only then release the final panel and subplate to fabrication.

## 5. Indicator harness

The signal chain is always address 0 through 55. Power is injected at address 0 and near address 33; injection branches do not alter data order.

| Connector | Addresses | Field                               | Nominal harness | Label color |
| --------- | --------: | ----------------------------------- | --------------: | ----------- |
| J1        |      0–10 | Ten sefirot + distinct dimmed Da’at |        1,100 mm | Gold        |
| J2        |     11–21 | Paths Aleph through Kaf             |          900 mm | Teal        |
| J3        |     22–32 | Paths Lamed through Tav             |          900 mm | Blue        |
| J4        |     33–55 | Twenty-two registers + Aleph Olam   |          850 mm | Violet      |

Each removable indicator connector must be keyed and labeled at both ends. Use `5V / DATA / GND` order only if it matches the selected pixel. Manufacturer pin markings are authoritative. Provide a ground conductor alongside data between every section.

Recommended labels follow `Q1-J1-00`, where `Q1` is QEC-1, `J1` is the section, and `00` is the first address. Record actual harness length and continuity in the tracker.

## 6. Key matrix

The 24 switches are six columns by four rows in canonical order:

| Row | Column 0 | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
| --- | -------- | -------- | -------- | -------- | -------- | -------- |
| R0  | א        | ב        | ג        | ד        | ה        | ו        |
| R1  | ז        | ח        | ט        | י        | כ        | ל        |
| R2  | מ        | נ        | ס        | ע        | פ        | צ        |
| R3  | ק        | ר        | ש        | ת        | STEP     | RUN      |

Controller assignment:

| Signal     | Pico 2 GPIO |           Physical pin |
| ---------- | ----------: | ---------------------: |
| Pixel data |         GP2 |                      4 |
| R0–R3      |   GP10–GP13 |         14, 15, 16, 17 |
| C0–C5      |   GP14–GP19 | 19, 20, 21, 22, 24, 25 |

Fit one 1N4148-compatible diode per switch and keep diode orientation identical. Before controller connection, verify there is no short between any row and column with all keys released. Then verify each key closes exactly one row/column pair. The host remains the canonical state authority; a key event is input, never an independent state mutation.

## 7. Power-entry harness

The reference panel supply is an external certified 5 V / 5 A adapter. Its low-voltage output enters a strain-relieved, keyed harness selected as one assembly. Do not mix a 2.1 mm plug with a 2.0 or 2.5 mm jack.

Immediately after the entry point:

1. 5 A branch fuse.
2. DC-rated panel master switch.
3. Star distribution to the pixel rail and injection branch.
4. 1,000 µF / 10 V electrolytic at the first pixel, polarity verified.
5. 330–470 Ω series resistor at the first pixel data input.

The Pi positive rail and panel positive rail never meet. Pico ground, level-shifter ground, and panel ground meet at the controller distribution point. Size the panel supply and trunk for the 3.36 A historical worst-case assumption even when selected modern pixels specify a lower typical maximum. Firmware and host both enforce a 25% brightness ceiling.

## 8. Assembly order

1. Pass the physical QEC-1P prototype.
2. Buy one sample switch, pixel, connector, and light pipe; test scrap cuts.
3. Print and verify both calibration bars.
4. Build a disposable full-size placement panel.
5. Fabricate the key subplate and validate all 24 switches mechanically.
6. Fabricate the top panel and install passive hardware only.
7. Build J1–J4 off-panel; inspect polarity and continuity.
8. Perform a current-limited, low-brightness walking-one test on each section.
9. Install the harness, power injection, level shifter, Pico, Pi, and cooling.
10. Load the Console Run Passport, execute it through the bench workflow, and download physical evidence.
11. Compare the canonical trace hash, every `APPLIED` sequence, and manifestation checksum.
12. Complete closed-enclosure thermal and fault tests before the machine is accepted.

## 9. Acceptance limits

| Measurement                               | Acceptance                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Panel template scale                      | 100.00 mm bar within ±0.25 mm                                                             |
| Panel rail before load                    | 4.90–5.10 V DC, correct polarity                                                          |
| Controller/panel positive-rail continuity | Open circuit                                                                              |
| Address walk                              | Exactly one expected indicator at each address 0–55                                       |
| Da’at presentation                        | Address 10 works through the smaller aperture; no ordinary sefirah-size marker            |
| Key matrix                                | 24 unique events, no ghost event, debounce pass                                           |
| Brightness                                | Requests above 0.25 rejected; last valid state retained                                   |
| Watchdog                                  | Fault at 2,000 ms without heartbeat; fresh `HELLO` required                               |
| Run identity                              | Passport core, trace hash, panel frames, and evidence validate together                   |
| Thermal                                   | No throttling or wiring temperature rise beyond component rating during the recorded test |

## 10. Purchasing boundary

The machine-readable BOM is a dated reference, not a live quote. URLs, stock, prices, and lifecycle status can change. Verify all items on the purchase date, record substitutions, and preserve manufacturer datasheets with the as-built record. The reference total includes a provisional allowance for mechanical and wiring parts whose cost depends on fabrication method and display selection.

## 11. Scientific boundary

QEC-1A is a deterministic classical machine. The OpenQASM source stored in a Run Passport is an emit-only projection. A quantum claim begins only when a named laboratory backend independently accepts, transpiles, and executes that source on verified quantum hardware and returns backend-specific evidence.
