# QEC-1 Build Tracker and Acceptance Record

Duplicate this file for each serial-numbered machine. Do not erase failed results; append the corrective action and repeat measurement.

## Build identity

| Field             | Record                                                   |
| ----------------- | -------------------------------------------------------- |
| Machine serial    |                                                          |
| Builder           |                                                          |
| Start date        |                                                          |
| Hardware contract | `qec-hardware-0.1`                                       |
| Panel map         | `qec-panel-map-0.1`                                      |
| BOM snapshot      | `qec-bom-0.1` / 2026-09-13                               |
| Panel protocol    | `qec-panel-link-0.1`                                     |
| Run Passport      | `qec-run-passport-0.1` + `qec-machine-run-extension-0.1` |

## Gate 1 — Reduced QEC-1P proof

| Test                 | Required                                | Measured evidence | Pass / fail | Date / initials |
| -------------------- | --------------------------------------- | ----------------- | ----------- | --------------- |
| Separate 5 V domains | No shared positive rail                 |                   |             |                 |
| Protocol handshake   | Compatible READY                        |                   |             |                 |
| Active-run frames    | Every sequence APPLIED                  |                   |             |                 |
| Brightness rejection | 0.26 rejected                           |                   |             |                 |
| Watchdog             | Fault at 2,000 ms; fresh HELLO required |                   |             |                 |
| Evidence download    | Passport validates after evidence added |                   |             |                 |

**Stop gate:** Do not fabricate the final panel until every Gate 1 row passes physically.

## Gate 2 — Purchased-part and template verification

| Measurement               |                                 Required | Measured | Pass / fail | Date / initials |
| ------------------------- | ---------------------------------------: | -------: | ----------- | --------------- |
| Top-panel calibration bar |                         100.00 ± 0.25 mm |          |             |                 |
| Subplate calibration bar  |                          50.00 ± 0.13 mm |          |             |                 |
| Pixel sample hole         | Nominal 5.20 mm; retained without damage |          |             |                 |
| Da’at sample aperture     |                          Nominal 2.50 mm |          |             |                 |
| Switch sample cut         |         Nominal 14.00 mm; reliable latch |          |             |                 |
| Keycap clearance          |         No binding through top-panel bay |          |             |                 |
| M3 mounting holes         |                    Match actual hardware |          |             |                 |

Substitutions and dimensional changes:

| BOM ID | Preferred MPN | Installed MPN | Reason | Drawing impact reviewed by |
| ------ | ------------- | ------------- | ------ | -------------------------- |
|        |               |               |        |                            |

## Gate 3 — Harness records

| Harness | Addresses / signals | Nominal length | Actual length | Continuity | Polarity | Label | Initials |
| ------- | ------------------- | -------------: | ------------: | ---------- | -------- | ----- | -------- |
| J1      | 0–10                |       1,100 mm |               |            |          |       |          |
| J2      | 11–21               |         900 mm |               |            |          |       |          |
| J3      | 22–32               |         900 mm |               |            |          |       |          |
| J4      | 33–55               |         850 mm |               |            |          |       |          |
| KEY-R0  | א–ו                 |       as built |               |            | n/a      |       |          |
| KEY-R1  | ז–ל                 |       as built |               |            | n/a      |       |          |
| KEY-R2  | מ–צ                 |       as built |               |            | n/a      |       |          |
| KEY-R3  | ק–RUN               |       as built |               |            | n/a      |       |          |

## Gate 4 — Unpowered inspection

- [ ] No mains wiring or mains inlet inside enclosure.
- [ ] Pi and panel positive rails are not connected.
- [ ] Panel fuse is 5 A and immediately follows the DC entry.
- [ ] 1,000 µF capacitor polarity is correct.
- [ ] Level shifter orientation and unused inputs are controlled.
- [ ] Pixel pin order matches the installed manufacturer part.
- [ ] No loose Dupont wires, breadboards, or alligator clips remain.
- [ ] Every cable has strain relief and both-end labels.
- [ ] Aleph Olam address 55 has no corresponding key.
- [ ] Ventilation free area is at least 2,400 mm² after closure.

## Gate 5 — Power and address walk

| Test                       | Required                         | Measured | Pass / fail | Initials |
| -------------------------- | -------------------------------- | -------- | ----------- | -------- |
| Panel rail, no load        | 4.90–5.10 V DC                   |          |             |          |
| Panel rail at address walk | Within selected pixel rating     |          |             |          |
| Current, all pixels off    | Record baseline                  |          |             |          |
| Current, 25% test pattern  | Below 5 A fuse and wiring rating |          |             |          |
| Address walk               | 0 through 55 in exact order      |          |             |          |
| Da’at address              | 10, smaller aperture             |          |             |          |
| Power injection            | Pixel 0 and near address 33      |          |             |          |

Address exceptions or rework:

| Address | Expected field | Observed | Corrective action | Retest |
| ------: | -------------- | -------- | ----------------- | ------ |
|         |                |          |                   |        |

## Gate 6 — Key matrix

Record the observed key event for each position. Every cell must emit exactly one matching value after debounce.

| Row | C0  | C1  | C2  | C3  | C4   | C5  | Ghost test |
| --- | --- | --- | --- | --- | ---- | --- | ---------- |
| R0  | א   | ב   | ג   | ד   | ה    | ו   |            |
| R1  | ז   | ח   | ט   | י   | כ    | ל   |            |
| R2  | מ   | נ   | ס   | ע   | פ    | צ   |            |
| R3  | ק   | ר   | ש   | ת   | STEP | RUN |            |

## Gate 7 — Complete Console-to-machine run

| Field                                | Expected / record |
| ------------------------------------ | ----------------- |
| Source                               |                   |
| Seed                                 |                   |
| Run ID                               |                   |
| Canonical trace hash                 |                   |
| Manifestation checksum               |                   |
| Passport validation before panel     | PASS / FAIL       |
| `STATE` frame count                  |                   |
| `APPLIED` acknowledgement count      |                   |
| Sequence gaps or duplicates          | None / record     |
| Brightness rejection                 | PASS / FAIL       |
| Watchdog recovery                    | PASS / FAIL       |
| Evidence mode                        | `physical`        |
| Passport validation after evidence   | PASS / FAIL       |
| Evidence filename / archive location |                   |

## Gate 8 — Closed-enclosure run

| Test                   |   Duration | Required                                   | Measured | Pass / fail |
| ---------------------- | ---------: | ------------------------------------------ | -------- | ----------- |
| Idle thermal           |     30 min | No throttling; temperatures within ratings |          |             |
| Repeated canonical run |     60 min | No frame loss or reset                     |          |             |
| USB disconnect         |  one event | Visible fault; no synthesized state        |          |             |
| Panel-power cycle      |  one event | Safe restart; fresh handshake              |          |             |
| Vent obstruction check | inspection | At least 2,400 mm² remains clear           |          |             |

## Final disposition

| Decision                  | Record |
| ------------------------- | ------ |
| Accepted / rejected       |        |
| Open deviations           |        |
| As-built drawing revision |        |
| Passport evidence archive |        |
| Builder signature / date  |        |
| Independent review / date |        |
