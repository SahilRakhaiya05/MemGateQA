"""Extract Overclocked operator character chunks from production bundle for porting."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "oc-extract"
OUT.mkdir(parents=True, exist_ok=True)

js = Path(r"C:\Users\Admin\AppData\Local\Temp\oc.js").read_text(encoding="utf-8", errors="ignore")


def slice_fn(name: str, next_names: list[str]) -> str:
    start = js.find(f"function {name}")
    if start < 0:
        return ""
    end = len(js)
    for n in next_names:
        i = js.find(f"function {n}", start + 10)
        if i > start:
            end = min(end, i)
    return js[start:end]


chunks = {
    "Ay_OperatorBooth": slice_fn("Ay", ["Oy", "Kl", "Df"]),
    "Oy_AnimalRouter": slice_fn("Oy", ["Kl", "Df", "Py"]),
    "Kl_SceneDefs": slice_fn("Kl", ["Df", "Py", "Iy"]),
    "Df_Face": slice_fn("Df", ["Py", "Iy", "My"]),
    "Py_Badger": slice_fn("Py", ["Iy", "My", "Ly"]),
    "Iy_Penguin": slice_fn("Iy", ["My", "Ly", "Ay"]),
    "My_Panda": slice_fn("My", ["Ly", "Ay", "Oy"]),
    "Ly_Extras": slice_fn("Ly", ["Ay", "Oy", "Kl"]),
}

for k, v in chunks.items():
    (OUT / f"{k}.js.txt").write_text(v, encoding="utf-8")
    print(k, len(v))

css_start = js.find(".op .feet-up")
css_end = js.find("@media (prefers-reduced-motion: reduce)", css_start)
(OUT / "op-css.txt").write_text(js[css_start : css_end + 250], encoding="utf-8")
print("css", css_end - css_start)