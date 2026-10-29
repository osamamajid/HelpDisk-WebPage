"""Application constants."""

# File type groups used to build the default category tree.
CATEGORY_TREES = {
    "Computer Drivers": [
        "Chipset", "LAN", "WiFi", "Bluetooth", "Audio",
        "VGA / Graphics", "Touchpad", "Keyboard", "Card Reader", "USB",
    ],
    "Printer Drivers": [
        "HP", "Canon", "Epson", "Brother", "Xerox", "Samsung", "Other",
    ],
    "Network Drivers": [],
    "Audio Drivers": [],
    "Graphics Drivers": [],
    "WiFi / Bluetooth": [],
    "Software": [
        "Browsers", "Office", "PDF", "Compression", "Multimedia",
        "Remote Support", "Utilities", "Security",
    ],
    "Utilities": [
        "Hardware Information", "Disk Tools", "Network Tools",
        "Windows Tools", "Diagnostic Tools",
    ],
    "Documents": [],
    "Other": [],
}

# Default brands commonly used in IT support.
DEFAULT_BRANDS = [
    "HP", "Dell", "Lenovo", "Acer", "Asus", "Intel", "AMD", "NVIDIA",
    "Realtek", "Qualcomm", "Broadcom", "Canon", "Epson", "Brother", "Xerox",
    "Samsung", "Microsoft", "Google", "Apple", "Logitech", "Corsair",
    "Kingston", "Crucial", "Western Digital", "Seagate", "TP-Link",
]

# Default operating systems.
DEFAULT_OPERATING_SYSTEMS = [
    "Windows 10", "Windows 11", "Windows 8.1", "Windows 8", "Windows 7",
    "Windows Server 2019", "Windows Server 2016",
    "macOS 14", "macOS 13", "Ubuntu 22.04", "Ubuntu 20.04",
]

DEFAULT_TAGS = [
    "driver", "utility", "offline", "install", "runtime", "firmware",
]

DEFAULT_ARCHITECTURES = ["32-bit", "64-bit", "ARM64"]
