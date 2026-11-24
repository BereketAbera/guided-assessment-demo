#!/usr/bin/env python3
"""Draws the diagram on /how-it-works#job: the phone and the server on one timeline.

    python3 design/make_job_diagram.py

Writes two files from the same list of shapes:
  components/diagrams/report-job.tsx   the drawing as a component, placed inline in the page
  design/out/report-job.svg            the same drawing as a file, for checking with Inkscape

The drawing is tall and narrow so it reads on a phone: 350 units wide, one unit to a pixel at
that width, and no label smaller than 12. Standard library only.
"""

import json

from brand import CLAY, INK, OUT, PAPER, PINE, ROOT, RULE, STONE, escape, settings

WIDTH = 350
X_PHONE, X_SERVER, X_TEXT = 13, 41, 64
HEAD_SIZE, SUB_SIZE, LANE_SIZE = 14, 13, 12
TWO_LINES, ONE_LINE = 48, 30
RUNG = "#B4AEA3"  # the repeated "which stage?" lines, lighter than the lanes they join

# components/preparing.tsx asks the server every 2000 ms.
POLL_SECONDS = 2

# Each row: what it is, its bold line, and an optional second line.
# A stage row takes its name from settings/assessment.settings.json, by position.
ROWS = [
    ("send", "Last answer sent", "Saved, then the report job starts."),
    ("build", "The model writes the report", None),
    ("stage", 0, None),
    ("poll", "The page asks which stage", f"Every {POLL_SECONDS} seconds, and shows its name."),
    ("drop", "The phone drops out", "Screen locks, signal drops, tab closes."),
    ("stage", 1, None),
    ("stage", 2, None),
    ("build", "A stalled job is restarted", None),
    ("ready", "Report ready", None),
    ("build", "Sent by email as well", None),
    ("open", "The same code opens it", "On this phone or any other device."),
]
TITLE = "What happens to the report job when the phone drops out"


class Stage:
    """A stage name: the text from the settings file here, a lookup in the component."""

    def __init__(self, index: int, label: str):
        self.index, self.label = index, label


def shape(tag: str, text=None, **attrs) -> dict:
    return {"tag": tag, "text": text, "attrs": {k.replace("_", "-"): v for k, v in attrs.items()}}


def build(stages: list[str]) -> tuple[list[dict], int]:
    shapes: list[dict] = []
    add = shapes.append

    # Where each row sits.
    ys, y = [], 68
    for kind, _, sub in ROWS:
        if kind == "open":
            y += 6
        ys.append(y)
        y += TWO_LINES if sub else ONE_LINE
    y_of = {kind: ys[i] for i, (kind, _, _) in enumerate(ROWS) if kind in ("send", "poll", "drop", "open")}
    lane_end = ys[-1] + 28
    key_y = lane_end + 34
    height = key_y + 14

    # Lane names, each above its own line.
    add(shape("text", "CUSTOMER'S PHONE", x=1, y=12, font_size=LANE_SIZE, font_weight=600, letter_spacing=0.9, fill=STONE))
    add(shape("text", "SERVER", x=X_SERVER - 12, y=33, font_size=LANE_SIZE, font_weight=600, letter_spacing=0.9, fill=PINE))

    # The repeated question from the page, until the phone drops out.
    rung_y = y_of["send"] + 12
    while rung_y < y_of["drop"] - 6:
        if abs(rung_y - y_of["poll"]) > 5:
            add(shape("line", x1=X_PHONE, y1=rung_y, x2=X_SERVER, y2=rung_y, stroke=RUNG, stroke_width=1))
        rung_y += 12
    # The one the label points at is drawn darker.
    add(shape("line", x1=X_PHONE, y1=y_of["poll"], x2=X_SERVER, y2=y_of["poll"], stroke=STONE, stroke_width=1.5))

    # The phone's line stops at the drop and starts again before the code is entered. The server's line never stops.
    resume = y_of["open"] - 20
    add(shape("line", x1=X_PHONE, y1=20, x2=X_PHONE, y2=y_of["drop"], stroke=STONE, stroke_width=1.5))
    add(shape("line", x1=X_PHONE, y1=resume, x2=X_PHONE, y2=lane_end, stroke=STONE, stroke_width=1.5))
    add(shape("line", x1=X_SERVER, y1=41, x2=X_SERVER, y2=lane_end, stroke=PINE, stroke_width=2))
    for cap in (y_of["drop"], resume):
        add(shape("line", x1=X_PHONE - 6, y1=cap, x2=X_PHONE + 6, y2=cap, stroke=CLAY, stroke_width=2.5, stroke_linecap="round"))

    for (kind, head, sub), row_y in zip(ROWS, ys):
        in_sample = kind != "build"
        if kind in ("send", "open"):
            # The answer goes to the server; later the report comes back.
            tip, tail = (X_SERVER - 6, X_PHONE) if kind == "send" else (X_PHONE + 6, X_SERVER)
            back = tip - 7 if kind == "send" else tip + 7
            add(shape("line", x1=tail, y1=row_y, x2=back, y2=row_y, stroke=INK, stroke_width=1.5))
            add(shape("path", d=f"M{tip} {row_y}L{back} {row_y - 4}L{back} {row_y + 4}Z", fill=INK))
            add(shape("circle", cx=X_PHONE, cy=row_y, r=4.5, fill=STONE))
            add(shape("circle", cx=X_SERVER, cy=row_y, r=4.5, fill=PINE))
        elif kind == "stage":
            add(shape("line", x1=X_SERVER, y1=row_y, x2=X_SERVER + 10, y2=row_y, stroke=PINE, stroke_width=2))
        elif kind == "ready":
            add(shape("circle", cx=X_SERVER, cy=row_y, r=5.5, fill=PINE))
        elif kind == "build":
            add(shape("circle", cx=X_SERVER, cy=row_y, r=4.75, fill=PAPER, stroke=PINE, stroke_width=1.5, stroke_dasharray="2.6 2.2"))

        label = Stage(head, stages[head]) if kind == "stage" else head
        add(shape("text", label, x=X_TEXT, y=row_y + 5, font_size=HEAD_SIZE, font_weight=600, fill=INK if in_sample else STONE))
        if sub:
            add(shape("text", sub, x=X_TEXT, y=row_y + 24, font_size=SUB_SIZE, fill=STONE))

    # The key: what runs here, and what only the real build has.
    add(shape("line", x1=0, y1=key_y - 21, x2=WIDTH, y2=key_y - 21, stroke=RULE, stroke_width=1))
    add(shape("circle", cx=6, cy=key_y - 4.5, r=4.5, fill=PINE))
    add(shape("text", "Runs in this sample", x=18, y=key_y, font_size=SUB_SIZE, fill=STONE))
    add(shape("circle", cx=176, cy=key_y - 4.5, r=4.75, fill=PAPER, stroke=PINE, stroke_width=1.5, stroke_dasharray="2.6 2.2"))
    add(shape("text", "Real build only", x=188, y=key_y, font_size=SUB_SIZE, fill=STONE))
    return shapes, height


def description(names: list[str]) -> str:
    return (
        "Two lines run down the drawing: the customer's phone and the server. The last answer is sent and saved, "
        "and the report job starts on the server. "
        f"Every {POLL_SECONDS} seconds the page asks the server which stage the job has reached: "
        f"{names[0]}, then {names[1]}, then {names[2]}. "
        "Partway through, the phone drops out: the screen locks, the signal drops or the tab closes. "
        "The phone's line stops there. The server's line carries on through the remaining stages until the report is ready. "
        "Later the same code opens the report, on this phone or any other device. "
        "Three steps are marked as real build only: the model writes the report, a stalled job is restarted, "
        "and the report is also sent by email."
    )


def number(value) -> str:
    return f"{value:g}" if isinstance(value, (int, float)) else str(value)


def as_svg(shapes: list[dict], height: int, names: list[str]) -> str:
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" '
        'font-family="Inter, \'Helvetica Neue\', Helvetica, Arial, sans-serif" role="img" aria-labelledby="t d">',
        f'<title id="t">{escape(TITLE)}</title>',
        f'<desc id="d">{escape(description(names))}</desc>',
    ]
    for s in shapes:
        attrs = " ".join(f'{k}="{number(v)}"' for k, v in s["attrs"].items())
        if s["tag"] == "text":
            text = s["text"].label if isinstance(s["text"], Stage) else s["text"]
            out.append(f"<text {attrs}>{escape(text)}</text>")
        else:
            out.append(f'<{s["tag"]} {attrs}/>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


def camel(name: str) -> str:
    first, *rest = name.split("-")
    return first + "".join(part.capitalize() for part in rest)


def as_component(shapes: list[dict], height: int, names: list[str]) -> str:
    lookups = [f'${{stage({i}, {json.dumps(name)})}}' for i, name in enumerate(names)]
    desc = description(lookups).replace("`", "\\`")
    out = [
        "// Written by design/make_job_diagram.py. To change the drawing, change that script and run design/build.sh.",
        'import { settings } from "@/lib/settings";',
        "",
        "/** A stage name from the settings file, so the drawing follows the file as the waiting screen does. */",
        "const stage = (index: number, fallback: string) => settings.reportJob.stages[index]?.label ?? fallback;",
        "",
        "/**",
        " * The phone and the server on one timeline: the job lives on the server, the page only asks which",
        " * stage it has reached, so a phone that drops out loses nothing. Solid marks run in this sample;",
        " * dashed ones are the real build only.",
        " */",
        "export function ReportJobDiagram({ className }: { className?: string }) {",
        "  return (",
        "    <svg",
        f'      viewBox="0 0 {WIDTH} {height}"',
        '      role="img"',
        '      aria-labelledby="report-job-title report-job-desc"',
        "      className={className}",
        "    >",
        f'      <title id="report-job-title">{escape(TITLE)}</title>',
        f'      <desc id="report-job-desc">{{`{desc}`}}</desc>',
    ]
    for s in shapes:
        attrs = " ".join(
            f'{camel(k)}={{{number(v)}}}' if isinstance(v, (int, float)) else f'{camel(k)}="{v}"'
            for k, v in s["attrs"].items()
        )
        if s["tag"] == "text":
            text = s["text"]
            inner = f"stage({text.index}, {json.dumps(text.label)})" if isinstance(text, Stage) else json.dumps(text)
            out.append(f"      <text {attrs}>")
            out.append(f"        {{{inner}}}")
            out.append("      </text>")
        else:
            out.append(f'      <{s["tag"]} {attrs} />')
    out += ["    </svg>", "  );", "}", ""]
    return "\n".join(out)


def main() -> None:
    names = [s["label"] for s in settings()["reportJob"]["stages"]]
    shapes, height = build(names)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report-job.svg").write_text(as_svg(shapes, height, names))
    target = ROOT / "components" / "diagrams" / "report-job.tsx"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(as_component(shapes, height, names))
    print(f"wrote components/diagrams/report-job.tsx and design/out/report-job.svg ({WIDTH} x {height})")


if __name__ == "__main__":
    main()
