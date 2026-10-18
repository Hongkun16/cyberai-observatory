#!/usr/bin/env python3
"""Normalize user-supplied vendor logos to equally padded transparent PNGs."""
from collections import deque
from io import BytesIO
import hashlib
import json
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "assets/logos/original"
OUTPUT = ROOT / "web/public/logos"
SIZE, PADDING = 128, 12
SOURCES = {
    "openai": "OAI.svg",
    "anthropic": "claude.png",
    "google": "gemini-color.svg",
    "tencent": "hunyuan.svg",
    "zhipu": "zhipu-ai-seeklogo.svg",
    "deepseek": "deepseek-com-logo.png",
    "xai": "Grok_Symbol_1.png",
}


def remove_border_background(image):
    """Remove near-white pixels connected to the edge; keep enclosed white detail."""
    pixels = image.load()
    width, height = image.size
    queue = deque([(x, 0) for x in range(width)] + [(x, height - 1) for x in range(width)]
                  + [(0, y) for y in range(height)] + [(width - 1, y) for y in range(height)])
    visited = set()
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < width and 0 <= y < height):
            continue
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        if a and min(r, g, b) >= 245:
            pixels[x, y] = (r, g, b, 0)
            queue.extend([(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)])
    return image


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for name, filename in SOURCES.items():
        source = ORIGINALS / filename
        if source.suffix == ".svg":
            raw = cairosvg.svg2png(url=str(source), output_width=1024, output_height=1024)
            artwork = Image.open(BytesIO(raw)).convert("RGBA")
        else:
            artwork = Image.open(source).convert("RGBA")
        if name == "deepseek":
            artwork = remove_border_background(artwork)
        bounds = artwork.getchannel("A").getbbox()
        if not bounds:
            raise ValueError(f"Logo has no visible artwork: {filename}")
        artwork = artwork.crop(bounds)
        artwork.thumbnail((SIZE - 2 * PADDING, SIZE - 2 * PADDING), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.alpha_composite(artwork, ((SIZE - artwork.width) // 2, (SIZE - artwork.height) // 2))
        destination = OUTPUT / f"{name}.png"
        canvas.save(destination, optimize=True)
        manifest.append({
            "provider": name, "source": str(source.relative_to(ROOT)),
            "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "output": str(destination.relative_to(ROOT)),
            "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
            "width": SIZE, "height": SIZE, "format": "PNG", "mode": "RGBA",
            "padding": PADDING, "removedWhiteBorder": name == "deepseek",
        })
    (ROOT / "assets/logos/manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(manifest)} logos: {SIZE}×{SIZE} RGBA PNG, {PADDING}px padding.")


if __name__ == "__main__":
    prepare()
