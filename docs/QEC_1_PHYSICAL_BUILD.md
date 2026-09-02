# QEC-1 Physical Machine Build Guide

**Hardware contract:** `qec-hardware-0.1`  
**Machine:** QEC-1 Quantum Etz Chaim Tabletop Demonstrator  
**Status:** Buildable classical demonstrator  
**Supply boundary:** Two external 5 V DC supplies; no mains voltage inside the enclosure

## 1. What we are building

QEC-1 is a physical control and display machine for the canonical Quantum Etz Chaim runtime. It accepts Hebrew-letter programs, shows their mapped paths and register changes, allows stepwise execution, and presents the same trace, observation, and manifestation produced by the software engine.

It is deliberately a **classical deterministic machine**. It does not contain qubits or claim superposition, entanglement, quantum error correction, or quantum speedup. The physical panel is an auditable human interface to the QEC runtime.

The first build has three separable parts:

1. **Host plane:** Raspberry Pi 5 runs the QEC engine, local web interface, trace storage, and display.
2. **Panel plane:** Raspberry Pi Pico 2 scans the Hebrew key matrix, drives 56 indicators, and enforces a local watchdog.
3. **Physical field:** ten sefirah indicators, one Da’at boundary indicator, twenty-two path indicators, and twenty-three register indicators make machine state visible.

The [Raspberry Pi 5 specification](https://www.raspberrypi.com/products/raspberry-pi-5/) provides the required 64-bit host, USB, HDMI, storage, and 5 V / 5 A power profile. The [Raspberry Pi Pico 2 specification](https://www.raspberrypi.com/products/raspberry-pi-pico-2/) provides documented GPIO, USB, PIO, PWM, SPI, I²C, and sufficient local memory for deterministic panel control.

## 2. Build tiers

| Tier    | Name                    | What it contains                                                                                    | Boundary                       |
| ------- | ----------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------ |
| QEC-1A  | Tabletop demonstrator   | Pi host, Pico panel controller, Hebrew keys, Tree/path/register indicators, local display           | Build now                      |
| QEC-1B  | Hardware-in-the-loop    | QEC-1A plus an isolated FPGA or RFSoC loopback target for timing experiments                        | Optional engineering extension |
| QEC-LAB | Quantum backend adapter | Versioned job/trace exchange with independently operated RF and cryogenic quantum-control equipment | Laboratory only                |

QEC-1B remains a classical timing and protocol test apparatus. The open-source [QICK project](https://github.com/openquantumhardware/qick) is a useful reference for a future RFSoC control boundary, but an RFSoC board alone is not a quantum computer and is not part of the QEC-1A bill of materials.

## 3. Fixed physical model

### Enclosure

- Outside width: **600 mm**
- Outside depth: **420 mm**
- Maximum base height: **90 mm**
- Panel: **3 mm** opaque acrylic, aluminum composite, or sealed plywood
- Minimum unobstructed ventilation area: **2,400 mm²**
- Electronics mounting: M2.5/M3 standoffs on a removable internal tray
- Feet: four non-slip feet, minimum 8 mm high

The panel drawing is a placement model, not a CNC-ready tolerance drawing. Measure the chosen switches, pixels, connectors, and fasteners before cutting a final panel.

### Indicator count

| Field          | Quantity | Function                                                             |
| -------------- | -------: | -------------------------------------------------------------------- |
| Sefirot        |       10 | Keter through Malchut                                                |
| Da’at boundary |        1 | Verification/provenance crossing; not an eleventh sefirah            |
| Hebrew paths   |       22 | One versioned opcode/path channel per canonical letter               |
| Registers      |       23 | Twenty-two visible base-22 registers plus locked Aleph Olam metadata |
| **Total**      |   **56** | One addressable 5 V RGB pixel per indicator                          |

### Controls

- 22 Hebrew-letter keys in canonical order
- `STEP` key
- `RUN` key
- LED power switch
- Pi power remains controlled by its own supported power path
- Aleph Olam has **no user key**; its indicator is display-only and firmware-locked

## 4. Bill of materials

### Required electronics

| Qty | Item                                              | Minimum requirement                       | Notes                                             |
| --: | ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
|   1 | Raspberry Pi 5                                    | 8 GB recommended                          | Host runtime; use active cooling                  |
|   1 | Raspberry Pi 5 active cooler or official fan case | Pi 5 compatible                           | Do not seal the Pi in an unventilated box         |
|   1 | USB-C host supply                                 | Certified 5 V / 5 A, 27 W class           | Dedicated to Pi; do not share with pixels in v0.1 |
|   1 | Raspberry Pi Pico 2                               | Standard or W model                       | USB panel controller                              |
|   1 | Regulated panel supply                            | Certified 5 V / 5 A                       | External supply only                              |
|   1 | Panel DC inlet                                    | Rated at least 5 V / 5 A                  | Use a keyed connector with strain relief          |
|   1 | Inline fuse holder                                | 5 A fuse                                  | Installed immediately after panel inlet           |
|   1 | Illuminated or labeled DC switch                  | 5 V / 5 A minimum                         | Switches only the panel rail                      |
|  56 | Addressable RGB indicators                        | 5 V WS2812/NeoPixel-compatible modules    | Prefer modules with local decoupling              |
|   1 | Logic level shifter                               | 74AHCT125 or 74HCT245                     | Converts Pico 3.3 V data to 5 V pixel logic       |
|   1 | Electrolytic capacitor                            | 1,000 µF, 6.3 V or higher                 | Across panel 5 V/GND near first pixel             |
|   1 | Data resistor                                     | 330–470 Ω                                 | At the first pixel data input                     |
|  24 | Momentary key switches                            | Normally open                             | 22 letters + STEP + RUN                           |
|  24 | Signal diodes                                     | 1N4148 or equivalent                      | One per key for 6×4 matrix isolation              |
|   1 | USB data cable                                    | Pi to Pico                                | Data plus Pico power                              |
|   1 | HDMI display                                      | Any supported monitor; 7–10 inch optional | Keep display choice mechanically separate         |
|   1 | microSD card                                      | 32 GB or larger, high endurance           | NVMe is optional                                  |

### Fabrication and wiring

- 3 mm panel material, 600 × 420 mm
- Base walls and removable bottom/tray
- M2.5/M3 standoffs, screws, washers, and threaded inserts
- 22–24 AWG stranded wire for panel power trunk
- 26–28 AWG stranded wire for signals and key matrix
- Keyed 3-pin connectors for indicator sections
- Heat-shrink tubing, ferrules where appropriate, cable clamps, labels, and braided sleeve
- Diffusers or light pipes for 56 indicators
- Vent grilles with finger guards

Do not use solderless breadboards, loose Dupont jumpers, or alligator clips in the final enclosure.

## 5. Power design

QEC-1 uses two separate external supply paths with a shared signal reference:

```text
Certified USB-C supply ─────────────► Raspberry Pi 5 ──USB──► Pico 2

Certified regulated 5 V / 5 A supply
        │
        └──► 5 A fuse ──► PANEL POWER switch ──► 5 V indicator rail
                                              └──► 1,000 µF capacitor
```

The theoretical worst-case indicator current is:

```text
56 indicators × 0.060 A = 3.36 A at full white
```

Size the panel supply and conductors for that full theoretical load even though firmware limits global brightness to 25 percent. Do not power the 56 indicators from a Pi or Pico 5 V pin.

Follow the manufacturer’s indicator markings rather than assuming wire order. Adafruit’s [NeoPixel best-practices guide](https://learn.adafruit.com/adafruit-neopixel-uberguide/best-practices) recommends a 500–1,000 µF supply capacitor, a 300–500 Ω resistor at the first pixel, a common ground, and a 5 V logic-level shifter such as the 74AHCT125 when driving 5 V pixels from 3.3 V logic.

### Non-negotiable electrical rules

1. No AC mains conductors, receptacles, or open-frame mains supplies inside QEC-1.
2. Verify panel-supply polarity and voltage before connecting the controller or pixels.
3. Install the fuse immediately after the DC inlet.
4. Join Pico logic ground and panel ground at the level-shifter/power distribution point.
5. Never join the two positive 5 V rails.
6. Inject panel power at the beginning and near the midpoint of the indicator chain.
7. Connect ground first and disconnect it last.
8. Keep the level shifter and first-pixel data resistor close to the first indicator.

## 6. Panel mapping

The canonical pixel address map is fixed:

| Address range | Physical field                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| `0–9`         | Keter, Chokhmah, Binah, Chesed, Gevurah, Tiferet, Netzach, Hod, Yesod, Malchut |
| `10`          | Da’at boundary                                                                 |
| `11–32`       | Paths Aleph through Tav, canonical Hebrew order                                |
| `33–54`       | Visible registers Aleph through Tav                                            |
| `55`          | Aleph Olam metadata indicator                                                  |

The 6×4 key matrix uses twenty-four positions. Read rows with Pico GPIO outputs and columns with pulled-up GPIO inputs. Install one diode per key with a consistent orientation. The firmware maps positions `0–21` to Aleph through Tav, `22` to `STEP`, and `23` to `RUN`.

## 7. Host-to-panel protocol

QEC-1 uses USB CDC serial at 115,200 baud with one UTF-8 JSON object per line. The host remains authoritative for programs, register state, paths, traces, observation, and manifestation. The panel owns only key scanning, indicators, watchdog state, and local electrical faults.

Minimum handshake:

```json
{"type":"HELLO","protocol":"qec-panel-link-0.1","machine":"QEC-1"}
{"type":"READY","protocol":"qec-panel-link-0.1","pixels":56,"keys":24}
```

Example state frame:

```json
{
  "type": "STATE",
  "sequence": 3,
  "activePath": "ו",
  "sourceNode": "Hod",
  "destinationNode": "Yesod",
  "registers": [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 9
  ],
  "traceHash": "…",
  "brightness": 0.25
}
```

Panel firmware must reject an incompatible protocol, a register list other than length 23, a register value outside `0–21`, a brightness above `0.25`, a non-monotonic sequence, or an unknown command. Rejection must leave the last valid displayed state unchanged.

## 8. Assembly sequence

### Phase A — Open-bench proof

1. Prepare the Pi 5 with current Raspberry Pi OS, active cooling, and the QEC repository.
2. Confirm the QEC production build and all tests pass locally.
3. Connect Pico 2 to the Pi using USB only.
4. Build the fixed QEC-1P four-key, four-pixel harness from `QEC_1P_BENCH_BUILD.md` and `qec-1p-bench-wiring.svg`.
5. Add the 74AHCT125, capacitor, data resistor, and separate fused 5 V pixel supply.
6. Use `bench.html` to verify handshake, key events, atomic state application, brightness limiting, and watchdog behavior.
7. Do not fabricate the final panel until this reduced harness passes.

### Phase B — Full electrical harness

1. Divide the 56 indicators into four keyed harness sections: nodes, Da’at/paths A, paths B, and registers.
2. Build and continuity-test the complete 6×4 diode key matrix.
3. Assemble the fused panel-power distribution board.
4. Connect the 56 indicators with the address order specified above.
5. Inject 5 V and ground at addresses `0` and `33`; keep the data chain continuous.
6. Perform a walking-one test at 5 percent brightness before any full-panel pattern.
7. Measure voltage at the first, midpoint, and last indicator while active. Correct wiring or conductor size if the far end is unstable or visibly discolored.

### Phase C — Enclosure

1. Print the panel drawing at 1:1 scale and verify all physical components against it.
2. Cut only a disposable template first.
3. Transfer corrected dimensions to the final panel.
4. Mount diffusers, indicators, and keys before installing electronics.
5. Mount Pi and Pico on a removable tray with accessible USB, HDMI, microSD, power, and ventilation.
6. Install strain relief on both external power leads.
7. Route power and signal bundles separately where practical.
8. Label both 5 V inputs so they cannot be interchanged.
9. Close the enclosure only after the complete verification checklist passes.

### Phase D — Runtime integration

1. Start the QEC host bridge in local-only mode.
2. Confirm panel and host protocol versions match.
3. Load canonical `אור`, seed `09`, without executing it.
4. Press `STEP` three times and compare each physical path and register display to the Living Tree Console.
5. Reset, press `RUN`, and confirm the same final trace hash and manifestation checksum.
6. Disconnect USB during a run and confirm the panel enters its visible fault state without inventing a result.
7. Restore the link and require a fresh handshake before accepting another state frame.

## 9. Acceptance checklist

- [ ] Both external supplies are certified, labeled, and strain-relieved.
- [ ] No mains voltage enters the enclosure.
- [ ] No continuity exists between either positive rail and chassis.
- [ ] PANEL_5V reads 5.0 V with correct polarity before load connection.
- [ ] The panel branch contains a 5 A fuse and working master switch.
- [ ] All 56 indicator addresses pass a low-brightness walking test.
- [ ] Every key produces exactly one debounced event.
- [ ] Aleph Olam has no physical input path.
- [ ] Invalid protocol frames fail closed.
- [ ] Loss of USB or panel power produces a visible fault.
- [ ] `אור` seed `09` reproduces the software trace hash and checksum.
- [ ] Ventilation remains unobstructed after the bottom cover is installed.

## 10. QEC-1B and QEC-LAB boundary

An FPGA or RFSoC may be added only behind an isolated, versioned adapter. In QEC-1B it receives synthetic timing jobs and returns loopback traces; no qubit is implied. QEC-LAB begins only when a qualified laboratory supplies the RF front end, cryogenic chain, device calibration, interlocks, and independent evidence that a real quantum device is being controlled.

QEC never silently converts symbolic letters, sefirot, Gates, or coherence values into physical pulse parameters. Every backend job must identify its backend, calibration record, units, limits, source trace, and returned evidence.

## 11. Repository artifacts

- Machine model: `specifications/qec-hardware-v0.1.json`
- Panel-link direction and validation profile: `specifications/qec-panel-link-v0.1.json`
- Reduced prototype guide: `docs/QEC_1P_BENCH_BUILD.md`
- Reduced prototype firmware: `firmware/qec1p/`
- Reduced prototype wiring: `schematics/qec-1p-bench-wiring.svg`
- Validation schema: `specifications/schemas/qec-hardware-v0.1.schema.json`
- System plate: `schematics/qec-1-system.svg`
- Low-voltage wiring: `schematics/qec-1-wiring.svg`
- Panel placement: `schematics/qec-1-panel.svg`
- Public engineering page: `machine.html`
