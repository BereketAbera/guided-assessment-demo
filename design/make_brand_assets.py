#!/usr/bin/env python3
"""Writes the icon and the link-preview picture as SVG, and packs favicon.ico.

    python3 design/make_brand_assets.py          writes app/icon.svg and design/out/og.svg
    python3 design/make_brand_assets.py --ico    packs design/out/icon-{16,32,48}.png into app/favicon.ico

design/build.sh runs both, with the Inkscape exports in between. Standard library only.
"""

import struct
import sys
import textwrap

from brand import CLAY, INK, MARK, OUT, PAPER, ROOT, RULE, STONE, escape, sales_page, settings

WIDTH, HEIGHT = 1200, 630
MARGIN = 80

# The opening of the key statement on the sample report (lib/report/sample.ts builds the full one).
KEY_STATEMENT = (
    "You do your best work when you can see the whole before you begin, "
    "and you have room to think before you speak."
)
SAMPLE_NOTE = "Working sample, fictional data"


def icon_svg() -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        f'<rect width="32" height="32" rx="6" fill="{PAPER}"/>{MARK}</svg>\n'
    )


def lines(x: float, y: float, step: float, rows: list[str], attrs: str) -> str:
    spans = "".join(
        f'<tspan x="{x}" y="{y + i * step:g}">{escape(row)}</tspan>' for i, row in enumerate(rows)
    )
    return f"<text {attrs}>{spans}</text>"


def og_svg() -> str:
    brand = settings()["assessment"]["brand"]
    sales = sales_page()
    # Source Serif 4 and Inter are the site's web fonts. design/render_og.mjs loads them from design/fonts
    # and refuses to draw the picture without them, so a fallback family can never ship.
    serif = "'Source Serif 4'"
    sans = "Inter"

    headline = textwrap.wrap(sales["headline"], width=17)
    statement = textwrap.wrap(KEY_STATEMENT, width=24)
    eyebrow = sales["eyebrow"].upper()

    mark_size = 60
    mark_scale = mark_size / 32
    head_size, head_step = 66, 76
    head_y = 300
    quote_x, quote_size, quote_step = 774, 32, 45
    quote_y = head_y - 34
    rule_top = quote_y - quote_size
    rule_bottom = quote_y + (len(statement) - 1) * quote_step + 12

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{PAPER}"/>',
        # The mark and the name, as in the site header.
        f'<g transform="translate({MARGIN - 3 * mark_scale:g} 58) scale({mark_scale:g})">{MARK}</g>',
        f'<text x="{MARGIN + mark_size + 8}" y="101" font-family="{serif}" font-weight="700" font-size="36" '
        f'fill="{INK}">{escape(brand)}</text>',
        # The eyebrow and the headline of the sales page.
        f'<text x="{MARGIN}" y="{head_y - 92}" font-family="{sans}" font-weight="700" font-size="19" '
        f'letter-spacing="2.6" fill="{STONE}">{escape(eyebrow)}</text>',
        lines(MARGIN, head_y, head_step, headline,
              f'font-family="{serif}" font-weight="600" font-size="{head_size}" letter-spacing="-1.2" fill="{INK}"'),
        # The key statement with its clay rule: the one place the report uses clay.
        f'<rect x="{quote_x - 30}" y="{rule_top:g}" width="6" height="{rule_bottom - rule_top:g}" fill="{CLAY}"/>',
        lines(quote_x, quote_y, quote_step, statement,
              f'font-family="{serif}" font-weight="400" font-size="{quote_size}" fill="{INK}"'),
        # A hairline and one small line saying what this is.
        f'<rect x="{MARGIN}" y="{HEIGHT - 92}" width="{WIDTH - 2 * MARGIN}" height="1.5" fill="{RULE}"/>',
        f'<text x="{MARGIN}" y="{HEIGHT - 50}" font-family="{sans}" font-weight="400" font-size="23" '
        f'fill="{STONE}">{escape(SAMPLE_NOTE)}</text>',
        "</svg>\n",
    ]
    return "".join(parts)


def pack_ico(sizes: list[int]) -> bytes:
    """An .ico file whose pictures are stored as PNG, one entry per size."""
    pngs = [(size, (OUT / f"icon-{size}.png").read_bytes()) for size in sizes]
    header = struct.pack("<HHH", 0, 1, len(pngs))
    offset = len(header) + 16 * len(pngs)
    entries, bodies = b"", b""
    for size, data in pngs:
        entries += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset)
        bodies += data
        offset += len(data)
    return header + entries + bodies


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if "--ico" in sys.argv:
        (ROOT / "app" / "favicon.ico").write_bytes(pack_ico([16, 32, 48]))
        print("wrote app/favicon.ico")
        return
    (ROOT / "app" / "icon.svg").write_text(icon_svg())
    (OUT / "og.svg").write_text(og_svg())
    print("wrote app/icon.svg and design/out/og.svg")


if __name__ == "__main__":
    main()
