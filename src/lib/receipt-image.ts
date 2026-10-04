// Merender subtree DOM menjadi PNG (tanpa dependency eksternal).
// Teknik: clone node → inline computed style per element → rakit
// <svg><foreignObject> via DOM + XMLSerializer (escaping XML benar) →
// decode via Image → gambar ke canvas → PNG.
//
// ponytail: cukup untuk struk (teks + <img> data-URL). Pseudo-element dan
// background-image kompleks tidak ikut tergambar; kalau butuh fidelity penuh,
// ganti ke html-to-image atau print-to-PDF headless Chromium.

function collectFontFaceRules(): string {
  let out = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        // @font-face dikenali dari prefiks cssText (tanpa menyentuh CSSRule global).
        if (rule.cssText.startsWith("@font-face")) out += rule.cssText + "\n";
      }
    } catch {
      // stylesheet lintas-origin tanpa CORS: lewati
    }
  }
  return out;
}

function inlineComputedStyle(src: Element, dst: Element): void {
  const cs = window.getComputedStyle(src);
  let css = "";
  for (let i = 0; i < cs.length; i++) {
    const p = cs.item(i);
    if (!p) continue;
    const v = cs.getPropertyValue(p);
    if (v !== "" && v !== "auto") css += `${p}:${v};`;
  }
  dst.setAttribute("style", css);
  const s = src.children;
  const d = dst.children;
  for (let i = 0; i < s.length; i++) inlineComputedStyle(s[i], d[i]);
}

export async function nodeToPngDataUrl(node: HTMLElement, scale = 2): Promise<string> {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  if (!width || !height) throw new Error("Struk belum ter-render");

  // Rakit via DOM + XMLSerializer, bukan string-concat: & dan < pada CSS/konten
  // akan di-escape otomatis (sumber kegagalan decode SVG → onerror sebelumnya).
  const clone = node.cloneNode(true) as HTMLElement; // Node→HTMLElement: node HTML well-known
  inlineComputedStyle(node, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = collectFontFaceRules();
  foreignObject.appendChild(style);
  foreignObject.appendChild(clone);
  svg.appendChild(foreignObject);

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Gagal merender struk ke gambar"));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
