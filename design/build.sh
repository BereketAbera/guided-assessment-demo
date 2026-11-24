#!/bin/sh
# Rebuilds every drawn asset from the scripts in this folder: sh design/build.sh
# Needs Python 3, Inkscape 1.x and the project's own Chromium (pnpm exec playwright install chromium).
# Nothing is downloaded: the two web fonts are kept in design/fonts.
set -eu
cd "$(dirname "$0")/.."
INKSCAPE="${INKSCAPE:-/opt/homebrew/bin/inkscape}"

# 1. The SVG sources: app/icon.svg, design/out/og.svg, design/out/report-job.svg,
#    and the diagram as a component in components/diagrams/report-job.tsx.
python3 design/make_brand_assets.py
python3 design/make_job_diagram.py

# 2. The link preview, 1200 x 630, used for both Open Graph and Twitter cards. It is drawn by a browser with
#    the site's own two web fonts, and the script stops the build if either font is missing or does not load.
node design/render_og.mjs design/out/og.svg app/opengraph-image.png 1200

# 3. The home-screen icon. The paper background fills the corners, which iOS would otherwise show as black.
"$INKSCAPE" app/icon.svg --export-type=png --export-width=180 --export-background='#FAF7F2' --export-filename=app/apple-icon.png

# 4. favicon.ico for browsers that do not take an SVG icon: three sizes, packed by the script.
for size in 16 32 48; do
  "$INKSCAPE" app/icon.svg --export-type=png --export-width="$size" --export-filename="design/out/icon-$size.png"
done
python3 design/make_brand_assets.py --ico

# 5. Check pictures, to look at before publishing: the preview at the width a phone shows it,
#    and the diagram at phone and desktop size.
node design/render_og.mjs design/out/og.svg design/out/og-check-600.png 600
"$INKSCAPE" design/out/report-job.svg --export-type=png --export-width=700 --export-background='#FAF7F2' --export-filename=design/out/report-job-check-700.png
"$INKSCAPE" design/out/report-job.svg --export-type=png --export-width=1050 --export-background='#FAF7F2' --export-filename=design/out/report-job-check-1050.png

echo "Done. Look at the pictures in design/out before publishing."
