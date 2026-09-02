"""QEC-1P four-key, four-pixel fail-closed panel controller."""

import json
import time

import board
import digitalio
import neopixel
import supervisor
import usb_cdc


PROTOCOL = "qec-panel-link-0.1"
MAX_FRAME_BYTES = 4096
MAX_BRIGHTNESS = 0.25
WATCHDOG_MS = 2000
DEBOUNCE_MS = 35
KEY_NAMES = ("א", "ו", "ר", "STEP")
KEY_PINS = (board.GP6, board.GP7, board.GP8, board.GP9)
SEFIROT = (
    "Keter",
    "Chokhmah",
    "Binah",
    "Chesed",
    "Gevurah",
    "Tiferet",
    "Netzach",
    "Hod",
    "Yesod",
    "Malchut",
    "Daat",
)
HEBREW_LETTERS = tuple("אבגדהוזחטיכלמנסעפצקרשת")

serial = usb_cdc.data
pixels = neopixel.NeoPixel(
    board.GP2,
    4,
    brightness=1.0,
    auto_write=False,
    pixel_order=neopixel.GRB,
)

keys = []
for pin in KEY_PINS:
    key = digitalio.DigitalInOut(pin)
    key.direction = digitalio.Direction.INPUT
    key.pull = digitalio.Pull.UP
    keys.append(key)

brightness = 0.08
negotiated = False
last_sequence = -1
event_sequence = 0
last_contact_ms = supervisor.ticks_ms()
line_buffer = bytearray()
stable_key_state = [True] * len(keys)
sampled_key_state = [True] * len(keys)
last_key_change_ms = [supervisor.ticks_ms()] * len(keys)

TICKS_PERIOD = 1 << 29
TICKS_MAX = TICKS_PERIOD - 1
TICKS_HALF_PERIOD = TICKS_PERIOD // 2


def ticks_elapsed(now, then):
    difference = (now - then) & TICKS_MAX
    return ((difference + TICKS_HALF_PERIOD) & TICKS_MAX) - TICKS_HALF_PERIOD


def emit(frame):
    if serial is None or not serial.connected:
        return
    serial.write((json.dumps(frame) + "\n").encode("utf-8"))


def scaled(color):
    return tuple(int(channel * brightness) for channel in color)


def show_unnegotiated():
    pixels.fill((0, 0, 0))
    pixels[3] = scaled((255, 72, 0))
    pixels.show()


def show_ready():
    pixels.fill((0, 0, 0))
    pixels[3] = scaled((0, 255, 210))
    pixels.show()


def show_fault(severity="amber"):
    prior = tuple(pixels[index] for index in range(3))
    pixels.fill((0, 0, 0))
    for index, color in enumerate(prior):
        pixels[index] = color
    pixels[3] = scaled((255, 0, 0) if severity == "red" else (255, 72, 0))
    pixels.show()


def fault(code, detail, severity="amber"):
    show_fault(severity)
    emit({"type": "FAULT", "code": code, "detail": detail})


def valid_integer(value, minimum=0, maximum=None):
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum:
        return False
    return maximum is None or value <= maximum


def validate_state(frame):
    required = (
        "sequence",
        "activePath",
        "sourceNode",
        "destinationNode",
        "registers",
        "traceHash",
        "brightness",
    )
    if any(name not in frame for name in required):
        return "STATE_FIELDS"
    if not valid_integer(frame["sequence"]) or frame["sequence"] <= last_sequence:
        return "STATE_SEQUENCE"
    if frame["activePath"] not in HEBREW_LETTERS:
        return "STATE_PATH"
    if frame["sourceNode"] not in SEFIROT or frame["destinationNode"] not in SEFIROT:
        return "STATE_NODE"
    registers = frame["registers"]
    if not isinstance(registers, list) or len(registers) != 23:
        return "STATE_REGISTERS"
    if any(not valid_integer(value, 0, 21) for value in registers):
        return "STATE_REGISTER_VALUE"
    level = frame["brightness"]
    if isinstance(level, bool) or not isinstance(level, (int, float)) or level < 0 or level > MAX_BRIGHTNESS:
        return "BRIGHTNESS_LIMIT"
    if not isinstance(frame["traceHash"], str) or len(frame["traceHash"]) < 8:
        return "STATE_TRACE_HASH"
    return None


def path_color(letter):
    index = HEBREW_LETTERS.index(letter)
    return (40 + ((index * 47) % 215), 160, 255 - ((index * 31) % 180))


def apply_state(frame):
    global brightness, last_sequence
    brightness = float(frame["brightness"])
    node_index = SEFIROT.index(frame["destinationNode"])
    register_value = frame["registers"][0]
    next_pixels = (
        scaled((45 + node_index * 18, 170, 210)),
        scaled(path_color(frame["activePath"])),
        scaled((45 + register_value * 9, 210 - register_value * 5, 110)),
        scaled((0, 255, 210)),
    )
    for index, color in enumerate(next_pixels):
        pixels[index] = color
    pixels.show()
    last_sequence = frame["sequence"]
    emit({"type": "APPLIED", "sequence": last_sequence})


def handle_frame(frame):
    global brightness, last_contact_ms, last_sequence, negotiated
    if not isinstance(frame, dict) or not isinstance(frame.get("type"), str):
        fault("FRAME_SHAPE", "frame must be an object with a type")
        return

    frame_type = frame["type"]
    if frame_type == "HELLO":
        if frame.get("protocol") != PROTOCOL or frame.get("machine") not in ("QEC-1", "QEC-1P"):
            negotiated = False
            fault("PROTOCOL", "incompatible protocol or machine", "red")
            return
        negotiated = True
        last_sequence = -1
        last_contact_ms = supervisor.ticks_ms()
        show_ready()
        emit({"type": "READY", "protocol": PROTOCOL, "pixels": 4, "keys": 4})
        return

    if not negotiated:
        fault("NEGOTIATION_REQUIRED", "send a compatible HELLO first")
        return

    last_contact_ms = supervisor.ticks_ms()
    if frame_type == "STATE":
        error = validate_state(frame)
        if error:
            fault(error, "state rejected; last valid display preserved")
            return
        apply_state(frame)
    elif frame_type == "SET_BRIGHTNESS":
        level = frame.get("brightness")
        if isinstance(level, bool) or not isinstance(level, (int, float)) or level < 0 or level > MAX_BRIGHTNESS:
            fault("BRIGHTNESS_LIMIT", "brightness must be between 0.00 and 0.25")
            return
        brightness = float(level)
        show_ready()
    elif frame_type == "RESET":
        last_sequence = -1
        show_ready()
    elif frame_type == "HEARTBEAT" and valid_integer(frame.get("sequence")):
        emit({"type": "HEARTBEAT", "sequence": frame["sequence"]})
    else:
        fault("UNKNOWN_COMMAND", "unknown or invalid host frame")


def poll_serial():
    if serial is None or not serial.connected:
        return
    while serial.in_waiting:
        byte = serial.read(1)
        if not byte:
            return
        if byte == b"\n":
            if not line_buffer:
                continue
            try:
                frame = json.loads(bytes(line_buffer).decode("utf-8"))
                handle_frame(frame)
            except (ValueError, UnicodeError):
                fault("FRAME_JSON", "invalid UTF-8 JSON line")
            line_buffer.clear()
        elif len(line_buffer) >= MAX_FRAME_BYTES:
            line_buffer.clear()
            fault("FRAME_TOO_LARGE", "frame exceeded 4096 bytes")
        else:
            line_buffer.extend(byte)


def poll_keys(now):
    global event_sequence
    for index, key in enumerate(keys):
        sample = key.value
        if sample != sampled_key_state[index]:
            sampled_key_state[index] = sample
            last_key_change_ms[index] = now
        if sample == stable_key_state[index] or ticks_elapsed(now, last_key_change_ms[index]) < DEBOUNCE_MS:
            continue
        stable_key_state[index] = sample
        event_sequence += 1
        emit(
            {
                "type": "KEY",
                "key": KEY_NAMES[index],
                "pressed": not sample,
                "sequence": event_sequence,
            }
        )


show_unnegotiated()

while True:
    now_ms = supervisor.ticks_ms()
    poll_serial()
    poll_keys(now_ms)
    if negotiated and ticks_elapsed(now_ms, last_contact_ms) > WATCHDOG_MS:
        negotiated = False
        fault("WATCHDOG", "host heartbeat expired; fresh HELLO required", "red")
    time.sleep(0.005)
