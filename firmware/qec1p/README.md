# QEC-1P Pico 2 reference firmware

This CircuitPython firmware implements the reduced four-key, four-pixel QEC-1P panel controller and `qec-panel-link-0.1`.

Copy `boot.py` and `code.py` to a Raspberry Pi Pico 2 running a current compatible CircuitPython release. Copy the matching `neopixel.mpy` into `CIRCUITPY/lib/`. Reconnect the board after installing `boot.py`; it enables a separate USB data CDC port for bounded JSON Lines frames.

Fixed map:

- GP2: pixel data through a 74AHCT125 and 330–470 Ω resistor
- GP6: Aleph key to ground
- GP7: Vav key to ground
- GP8: Resh key to ground
- GP9: STEP key to ground
- Four pixels: NODE, PATH, REGISTER, LINK/FAULT

The pixel rail uses a separate fused 5 V supply. Join grounds at the level-shifter point; never join the Pico/USB and pixel positive rails.

The reference is deliberately fail-closed. It validates a complete state before changing pixels, caps brightness at 25%, rejects non-monotonic sequences, limits frames to 4,096 bytes, enters a visible fault after a 2-second host timeout, and requires a fresh `HELLO` after watchdog fault.

See `docs/QEC_1P_BENCH_BUILD.md` for the complete wiring, installation, and acceptance sequence.
