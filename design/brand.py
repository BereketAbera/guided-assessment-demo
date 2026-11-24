"""Shared constants for the design scripts: the palette, the mark and the font choice.

Standard library only. The palette is the one in app/globals.css.
"""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "design" / "out"

PAPER = "#FAF7F2"
INK = "#1F2A37"
PINE = "#1F5C55"
CLAY = "#A8472B"
STONE = "#5B6470"
SAND = "#F0EAE0"
LINE = "#7A808A"
RULE = "#DDD5C7"

# The mark: a shape and its reflection across a thin line, on a 32 x 32 grid.
MARK = (
    f'<path d="M6 14.5a10 10 0 0 1 20 0Z" fill="{PINE}"/>'
    f'<path d="M26 18.5a10 10 0 0 1-20 0Z" fill="none" stroke="{PINE}" stroke-width="1.6"/>'
    f'<rect x="3" y="15.9" width="26" height="1.2" fill="{CLAY}"/>'
)


def settings() -> dict:
    return json.loads((ROOT / "settings" / "assessment.settings.json").read_text())


def sales_page() -> dict:
    return json.loads((ROOT / "settings" / "sales-page.json").read_text())


def installed_fonts() -> set[str]:
    """Family names known to fontconfig, lower case. Empty when fc-list is missing."""
    try:
        listing = subprocess.run(["fc-list", ":", "family"], capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return set()
    # One line per font file; a file may carry several family names, separated by commas.
    return {name.strip().lower() for line in listing.splitlines() for name in line.split(",") if name.strip()}


def pick(candidates: list[str], fallback: str) -> str:
    """The first installed family from the list. The pictures are drawn with fonts already on the machine."""
    known = installed_fonts()
    for name in candidates:
        if name.lower() in known:
            return name
    return fallback


def escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
