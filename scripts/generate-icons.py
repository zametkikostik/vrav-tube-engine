#!/usr/bin/env python3
"""Generate a source app icon if missing, then rely on `tauri icon` for the full set."""
from pathlib import Path
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "-q"])
    from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "src-tauri" / "icons"
ICONS.mkdir(parents=True, exist_ok=True)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    radius = max(2, size // 5)
    bg = (45, 30, 99, 255)
    accent = (124, 92, 255, 255)
    play = (255, 255, 255, 255)
    d.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill=bg,
    )
    inset = size // 6
    wline = max(1, size // 24)
    d.ellipse(
        [inset, inset, size - inset - 1, size - inset - 1],
        outline=accent,
        width=wline,
    )
    cx, cy = size // 2, size // 2
    w, h = size // 4, size // 3
    points = [
        (cx - w // 2 + size // 32, cy - h // 2),
        (cx - w // 2 + size // 32, cy + h // 2),
        (cx + w // 2 + size // 32, cy),
    ]
    d.polygon(points, fill=play)
    return img


def main() -> None:
    source = ICONS / "icon.png"
    if not source.exists() or source.stat().st_size < 100:
        make_icon(1024).save(source, format="PNG")
        print(f"created source {source}")
    else:
        print(f"using existing {source}")

    # Minimal set so builds don't fail even if `tauri icon` is skipped
    required = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
    }
    for name, size in required.items():
        path = ICONS / name
        if not path.exists() or path.stat().st_size < 50:
            make_icon(size).save(path, format="PNG")
            print(f"generated {name}")

    ico = ICONS / "icon.ico"
    if not ico.exists() or ico.stat().st_size < 500:
        sizes = [16, 32, 48, 64, 128, 256]
        imgs = [make_icon(s).convert("RGBA") for s in sizes]
        # Write ICO via largest image + sizes list
        imgs[-1].save(ico, format="ICO", sizes=[(s, s) for s in sizes])
        print(f"generated icon.ico ({ico.stat().st_size} bytes)")

    icns = ICONS / "icon.icns"
    if not icns.exists() or icns.stat().st_size < 500:
        try:
            make_icon(512).save(icns, format="ICNS")
            print(f"generated icon.icns ({icns.stat().st_size} bytes)")
        except Exception as e:
            print(f"icns generation skipped: {e}")


if __name__ == "__main__":
    main()
