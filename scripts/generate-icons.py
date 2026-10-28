#!/usr/bin/env python3
"""Generate Tauri icons under src-tauri/icons/ (PNG + ICO + ICNS)."""
from __future__ import annotations

import io
import struct
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "src-tauri" / "icons"
ICONS.mkdir(parents=True, exist_ok=True)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    d.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=max(2, size // 5),
        fill=(20, 16, 40, 255),
    )
    pad = size // 5
    d.ellipse([pad, pad, size - pad - 1, size - pad - 1], fill=(168, 85, 247, 255))
    cx, cy = size // 2, size // 2
    s = max(2, size // 5)
    d.polygon(
        [(cx - s // 2, cy - s), (cx - s // 2, cy + s), (cx + s, cy)],
        fill=(255, 255, 255, 255),
    )
    return img


def png_bytes(size: int) -> bytes:
    buf = io.BytesIO()
    make_icon(size).save(buf, format="PNG")
    return buf.getvalue()


def write_icns(path: Path) -> None:
    icon_types = {
        16: b"icp4",
        32: b"icp5",
        64: b"icp6",
        128: b"ic07",
        256: b"ic08",
        512: b"ic09",
    }
    chunks: list[bytes] = []
    for size, ostype in icon_types.items():
        data = png_bytes(size)
        length = 8 + len(data)
        chunks.append(ostype + struct.pack(">I", length) + data)
    body = b"".join(chunks)
    path.write_bytes(b"icns" + struct.pack(">I", 8 + len(body)) + body)


def main() -> None:
    master = make_icon(512)
    master.save(ICONS / "icon.png")
    for name, size in [
        ("32x32.png", 32),
        ("128x128.png", 128),
        ("128x128@2x.png", 256),
    ]:
        make_icon(size).save(ICONS / name)

    sizes = [16, 32, 48, 64, 128, 256]
    imgs = [make_icon(s) for s in sizes]
    imgs[-1].save(ICONS / "icon.ico", format="ICO", sizes=[(s, s) for s in sizes])

    write_icns(ICONS / "icon.icns")

    required = ["32x32.png", "128x128.png", "icon.png", "icon.ico", "icon.icns"]
    for f in required:
        p = ICONS / f
        if not p.exists() or p.stat().st_size < 50:
            raise SystemExit(f"failed to write {p}")
        print(f"OK {p.relative_to(ROOT)} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
