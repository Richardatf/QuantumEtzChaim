# QEC-1P Reduced Bench Prototype

**Prototype:** QEC-1P  
**Parent machine:** QEC-1 Quantum Etz Chaim Tabletop Demonstrator  
**Protocol:** `qec-panel-link-0.1`  
**Purpose:** prove power, level shifting, key events, state application, brightness limiting, and fail-closed behavior before fabricating the full panel

## 1. Stop gate

Do not cut or drill the 600 × 420 mm QEC-1 panel until QEC-1P passes every acceptance check in section 10. The bench prototype exists to find electrical, firmware, and protocol errors while the machine is still easy to change.

QEC-1P is a classical low-voltage prototype. It contains no qubits and makes no claim of quantum behavior. Its mystical architecture gives names and meaning to observable machine roles; it does not replace electrical evidence.

## 2. What QEC-1P contains

- Raspberry Pi 5 host, or another computer capable of opening the QEC bench console
- Raspberry Pi Pico 2 running the published CircuitPython reference firmware
- Four normally-open momentary keys: `א`, `ו`, `ר`, and `STEP`
- Four 5 V addressable RGB pixels: `NODE`, `PATH`, `REGISTER`, and `LINK/FAULT`
- 74AHCT125 logic-level shifter
- 330–470 Ω series data resistor
- 1,000 µF electrolytic capacitor rated 6.3 V or higher
- Separate regulated 5 V pixel supply, fused at 1 A for this reduced harness
- USB data cable for the Pico
- Soldered prototyping board, terminal blocks, or another secure bench interconnect

Do not use loose alligator clips for powered testing. A solderless breadboard may be used for initial signal proof at low brightness, but secure and inspect every power connection before energizing it.

## 3. Fixed pin and indicator map

### Keys

Each key connects its GPIO to Pico ground when pressed. Firmware enables the Pico's internal pull-up resistor.

| Function  | Pico signal | Physical pin | Connection |
| --------- | ----------: | -----------: | ---------- |
| Aleph `א` |         GP6 |            9 | key to GND |
| Vav `ו`   |         GP7 |           10 | key to GND |
| Resh `ר`  |         GP8 |           11 | key to GND |
| STEP      |         GP9 |           12 | key to GND |

### Pixel data

| Function            | Pico signal |      Physical pin | Connection                                |
| ------------------- | ----------: | ----------------: | ----------------------------------------- |
| Pixel data          |         GP2 |                 4 | 74AHCT125 input `1A`, pin 2               |
| Shifter enable      |         GND |  3 or another GND | 74AHCT125 active-low `1OE`, pin 1         |
| Common logic ground |         GND | same ground point | 74AHCT125 pin 7 and panel-supply negative |

Tie `1OE` low. On the 74AHCT125, output-enable is active low. Connect pin 14 to panel `+5 V`; pin 7 to common ground; pin 2 (`1A`) to Pico GP2; and pin 3 (`1Y`) through the 330–470 Ω resistor to pixel 0 `DIN`. Tie each unused output-enable high to panel `+5 V`, tie its input to a defined logic level, and leave its output unconnected.

### Pixel addresses

| Address | Label      | What it exposes                          |
| ------: | ---------- | ---------------------------------------- |
|       0 | NODE       | source/destination sefirah activity      |
|       1 | PATH       | current Hebrew path/instruction          |
|       2 | REGISTER   | visible base-22 register projection      |
|       3 | LINK/FAULT | cyan when negotiated; amber/red on fault |

The four-pixel map is a bench diagnostic projection, not the final QEC-1 address map.

## 4. Power wiring

Use two separate low-voltage domains:

```text
Computer or Pi USB ───────────────► Pico 2

External regulated 5 V supply
        │
        └──► 1 A fuse ──► switch ──► four-pixel +5 V rail
                                      │
                                      └──► 1,000 µF capacitor to GND
```

The Pico and pixel grounds meet at the level-shifter/power-distribution point so the data signal has a reference. Never join the USB/Pico positive rail to the pixel positive rail. No mains voltage enters the prototype.

Before connecting the Pico or pixels:

1. Switch the pixel rail off.
2. Verify no short between panel `+5 V` and ground.
3. Energize the empty rail and measure its polarity and voltage.
4. Switch it off and discharge the rail.
5. Connect the capacitor with correct polarity, the level shifter, and pixels.
6. Recheck continuity and polarity.

## 5. Install the Pico firmware

The reference firmware is in `firmware/qec1p/`.

1. Install a current CircuitPython build that explicitly supports Raspberry Pi Pico 2.
2. Copy the matching `neopixel.mpy` from the corresponding Adafruit CircuitPython library bundle into `CIRCUITPY/lib/`.
3. Copy `firmware/qec1p/boot.py` to the root of `CIRCUITPY`.
4. Safely eject and reconnect the Pico. `boot.py` enables a separate USB data serial port.
5. Copy `firmware/qec1p/code.py` to the root of `CIRCUITPY`.
6. Connect the QEC browser bench console to the Pico data port, not the CircuitPython console port.

The firmware has not passed physical acceptance merely because it starts. Its configuration is intentionally explicit: GP2 pixel data, GP6–GP9 keys, four pixels, 25% absolute brightness ceiling, 35 ms key debounce, 4,096-byte frame ceiling, and 2,000 ms host watchdog.

## 6. First power-on without pixels

1. Leave the external pixel supply off.
2. Connect the Pico over USB.
3. Open `bench.html` from the published QEC site in a desktop Chromium browser.
4. Select **Connect Pico** and choose the Pico data serial port.
5. Select **Run live proof**.
6. Confirm the `HELLO` / `READY` handshake is recorded. Pixel checks will not yet be visually meaningful.
7. Press each key once and confirm one pressed event and one released event appear for the correct key.

If the serial stream includes the CircuitPython REPL prompt, the wrong USB port was selected.

## 7. First pixel power-on

1. Disconnect USB and switch the pixel supply off.
2. Connect the four-pixel chain exactly as shown on the wiring plate.
3. Recheck that 74AHCT125 pin 1 is grounded and pin 14 is connected only to panel `+5 V`.
4. Connect ground first, then pixel `+5 V`, then USB.
5. Switch the pixel supply on.
6. Confirm pixel 3 shows the local unnegotiated/fault state while the other pixels remain dark.
7. Run the live proof. Pixel 3 should become cyan after `READY`; pixels 0–2 should change for each accepted state.

Brightness is 8% during the proof. Do not increase it to compensate for a wiring fault.

## 8. Protocol truth table

| Direction        | Frame            | Required behavior                                           |
| ---------------- | ---------------- | ----------------------------------------------------------- |
| Host → panel     | `HELLO`          | exact protocol match required before state                  |
| Panel → host     | `READY`          | reports 4 keys and 4 pixels                                 |
| Host → panel     | `STATE`          | validates complete frame, then changes pixels atomically    |
| Panel → host     | `APPLIED`        | acknowledges the exact state sequence                       |
| Panel → host     | `KEY`            | one debounced transition with monotonic event sequence      |
| Host → panel     | `SET_BRIGHTNESS` | accepts 0.00–0.25; rejects higher values                    |
| Either direction | `HEARTBEAT`      | proves link liveness, not canonical-state authority         |
| Panel → host     | `FAULT`          | names bounded failure while preserving the last valid state |

The complete direction and validation profile is `specifications/qec-panel-link-v0.1.json`.

## 9. Live proof sequence

The browser bench console performs this order:

1. Verify the fixed map in the published contract.
2. Send `HELLO` and require compatible `READY` within 2 seconds.
3. Execute canonical `אור`, seed `09`, through the QEC engine.
4. Send three strictly increasing `STATE` frames and require matching `APPLIED` acknowledgements.
5. Send an intentionally invalid 26% brightness request and require `FAULT / BRIGHTNESS_LIMIT`.
6. Withhold heartbeat and require `FAULT / WATCHDOG` after the 2,000 ms deadline.

The last two tests are destructive only to the negotiated session. They must not alter canonical host state or invent a manifestation.

## 10. Acceptance record

- [ ] External pixel supply is regulated 5 V and fused at 1 A.
- [ ] No mains voltage enters the prototype.
- [ ] Pico and pixel positive rails are not joined.
- [ ] Common ground exists at the logic-shifter point.
- [ ] 74AHCT125 supply, ground, active-low output-enable, input, and output pins match the wiring plate.
- [ ] Capacitor polarity is correct.
- [ ] All four keys report the correct press and release exactly once.
- [ ] `HELLO` receives compatible `READY` with 4 keys and 4 pixels.
- [ ] Three canonical state frames receive sequences 1, 2, and 3 in order.
- [ ] 26% brightness is rejected and the last valid display remains unchanged.
- [ ] Missing heartbeat produces the visible watchdog fault.
- [ ] A fresh `HELLO` is required after watchdog fault.
- [ ] Measured supply voltage is recorded below.

| Measurement           | Before test | During three-pixel activity |
| --------------------- | ----------: | --------------------------: |
| Panel supply at inlet |      ____ V |                      ____ V |
| Pixel 0 +5 V to GND   |      ____ V |                      ____ V |
| Pixel 3 +5 V to GND   |      ____ V |                      ____ V |

Builder: ____________________ Date: ____________________ Firmware commit: ____________________

## 11. Promotion rule

After every box is checked and the as-built notes are committed, QEC-1P becomes the reference harness for the full panel controller. The full build may expand the key scanner to the 6 × 4 diode matrix and the indicator chain to 56 addresses, but it must preserve protocol direction, atomic state validation, the 25% ceiling, watchdog recovery, and the separation between host authority and panel display.
