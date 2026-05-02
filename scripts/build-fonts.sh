#!/usr/bin/env bash
# Subset bundled web fonts to keep PWA install size small.
# Reads source TTFs from fonts-src/ (gitignored), writes WOFF2 to
# public/fonts/ (committed). Variable wght axis is preserved where present.
#
# Requires: fonttools (brew install fonttools) — provides pyftsubset and ttx.
#
# Sources (download manually into fonts-src/ before running):
#   NotoSansTC[wght].ttf            github.com/google/fonts/raw/main/ofl/notosanstc/...
#   NotoSerifTC[wght].ttf           github.com/google/fonts/raw/main/ofl/notoseriftc/...
#   AtkinsonHyperlegibleNext[wght].ttf
#                                    github.com/googlefonts/atkinson-hyperlegible-next/...
#   LXGWWenKaiTC-{Light,Regular,Medium}.ttf
#                                    github.com/lxgw/LxgwWenKaiTC/releases/latest

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$ROOT/fonts-src"
OUT="$ROOT/public/fonts"

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset not found. Install with: brew install fonttools" >&2
  exit 1
fi

mkdir -p "$OUT"

# Big5 Level 1 (常用字, 5401 chars) — covers 99% of practical Traditional
# Chinese text including signage, slogans, names. Level 2 (次常用字) is
# excluded to keep file sizes manageable; uncommon names fall back to the
# system stack.
BIG5_LIST="$SRC/big5-l1.txt"
if [ ! -f "$BIG5_LIST" ]; then
  echo "Generating Big5 Level 1 codepoint list..."
  /opt/homebrew/Cellar/fonttools/*/libexec/bin/python3 - <<'PY'
import os
out = os.path.join(os.environ['SRC'], 'big5-l1.txt')
codepoints = set()
for high in range(0xA4, 0xC7):
    for low in list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF)):
        try:
            ch = bytes([high, low]).decode('big5')
            if 0x4E00 <= ord(ch) <= 0x9FFF:
                codepoints.add(ord(ch))
        except (UnicodeDecodeError, ValueError):
            pass
with open(out, 'w') as f:
    for cp in sorted(codepoints):
        f.write(f'U+{cp:04X}\n')
print(f'Wrote {out} ({len(codepoints)} chars)')
PY
fi
export SRC

# Shared subset range for CJK fonts: Latin + general punct + CJK punct +
# Hiragana + Katakana + Bopomofo + Halfwidth/Fullwidth, plus Big5 Level 1
# CJK Unified Ideographs.
CJK_RANGES="U+0020-024F,U+2000-206F,U+3000-303F,U+3040-30FF,U+3100-312F,U+31F0-31FF,U+FF00-FFEF"
CJK_FLAGS=(
  --layout-features='*'
  --no-hinting
  --desubroutinize
  --notdef-outline
  --recommended-glyphs
  --flavor=woff2
)

subset_cjk() {
  local input="$1"
  local output="$2"
  echo "Subsetting $(basename "$input") -> $(basename "$output")..."
  pyftsubset "$input" \
    --unicodes="$CJK_RANGES" \
    --unicodes-file="$BIG5_LIST" \
    "${CJK_FLAGS[@]}" \
    --output-file="$output"
}

subset_cjk "$SRC/NotoSansTC[wght].ttf"            "$OUT/NotoSansTC.woff2"
subset_cjk "$SRC/NotoSerifTC[wght].ttf"           "$OUT/NotoSerifTC.woff2"
subset_cjk "$SRC/LXGWWenKaiTC-Light.ttf"          "$OUT/LXGWWenKaiTC-Light.woff2"
subset_cjk "$SRC/LXGWWenKaiTC-Regular.ttf"        "$OUT/LXGWWenKaiTC-Regular.woff2"
subset_cjk "$SRC/LXGWWenKaiTC-Medium.ttf"         "$OUT/LXGWWenKaiTC-Medium.woff2"

# Atkinson Hyperlegible Next: Latin Basic + Extended-A + diacritics + general
# punctuation. No CJK; Atkinson is a Latin-only family.
echo "Subsetting AtkinsonHyperlegibleNext[wght].ttf -> AtkinsonHyperlegibleNext.woff2..."
pyftsubset "$SRC/AtkinsonHyperlegibleNext[wght].ttf" \
  --unicodes="U+0020-024F,U+0300-036F,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F" \
  "${CJK_FLAGS[@]}" \
  --output-file="$OUT/AtkinsonHyperlegibleNext.woff2"

echo
echo "Done. Output sizes:"
ls -lh "$OUT"/*.woff2
