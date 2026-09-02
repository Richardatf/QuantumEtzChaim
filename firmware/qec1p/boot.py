"""Enable the dedicated QEC-1P USB CDC data port before CircuitPython starts."""

import usb_cdc

usb_cdc.enable(console=True, data=True)
