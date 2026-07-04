from pathlib import Path

js = Path(r"C:\Users\Admin\AppData\Local\Temp\oc.js").read_text(encoding="utf-8", errors="ignore")
i = js.find("function Ly")
j = js.find("function Ny", i)
css_block = js[i:j]
marker = "children:`"
start = css_block.find(marker) + len(marker)
end = css_block.rfind("`})")
content = css_block[start:end].strip()
out = Path(__file__).resolve().parents[1] / "src/components/arcade/overclocked/operator.css"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(content, encoding="utf-8")
print("wrote", out, len(content))