// Assets for the "drive-by" hero, from real photographs (Wikimedia Commons):
//  - front.webp   the red Charger SRT Hellcat Widebody, 3/4 front, cut out, night grade
//  - side.webp    a Charger SRT8 in profile, cut out, recoloured to the same dark red
//  - wheel-f.webp / wheel-r.webp   its two wheels as round crops, so they can spin
//  - meta.json    sizes and wheel centres in side.webp pixels
//   node scripts/make-hero-assets.mjs
import sharp from "sharp"
import fs from "node:fs"

const OUT = "public/media/hero"
fs.mkdirSync(OUT, { recursive: true })
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

async function raw(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

// ── front: Hellcat 3/4, preview box (1400px wide) x 128–1290, y 400–890
{
  const { data, w, h } = await raw(".charger-src3/cut-hellcat.png")
  const k = w / 1400
  const box = { x: Math.round(118 * k), y: Math.round(395 * k), w: Math.round(1185 * k), h: Math.round(500 * k) }
  const out = Buffer.alloc(box.w * box.h * 4)
  for (let y = 0; y < box.h; y++)
    for (let x = 0; x < box.w; x++) {
      const s = ((box.y + y) * w + box.x + x) * 4
      const o = (y * box.w + x) * 4
      const r = data[s] / 255, g = data[s + 1] / 255, b = data[s + 2] / 255
      const l = 0.3 * r + 0.59 * g + 0.11 * b
      // muted, darker, slightly cooler; keep some red
      const mix = 0.45
      out[o] = 255 * clamp(Math.pow(r * (1 - mix) + l * mix, 1.15) * 0.82)
      out[o + 1] = 255 * clamp(Math.pow(g * (1 - mix) + l * mix, 1.15) * 0.8)
      out[o + 2] = 255 * clamp(Math.pow(b * (1 - mix) + l * mix, 1.15) * 0.86)
      out[o + 3] = Math.round(255 * clamp((data[s + 3] / 255 - 0.3) / 0.6))
    }
  await sharp(out, { raw: { width: box.w, height: box.h, channels: 4 } }).resize(1400).webp({ quality: 86 }).toFile(`${OUT}/front.webp`)
  console.log("front", box)
}

// ── side: SRT8 profile, faces left. Preview (1400 wide) box x 50–1330, y 368–805
const meta = {}
{
  const { data, w, h } = await raw(".side-src/cut-side.png")
  const k = w / 1400
  const box = { x: Math.round(48 * k), y: Math.round(366 * k), w: Math.round(1285 * k), h: Math.round(442 * k) }
  const wheels = [
    { name: "f", cx: 205 * k - box.x, cy: 660 * k - box.y, r: 96 * k },
    { name: "r", cx: 1043 * k - box.x, cy: 693 * k - box.y, r: 108 * k },
  ]
  const body = Buffer.alloc(box.w * box.h * 4)
  for (let y = 0; y < box.h; y++)
    for (let x = 0; x < box.w; x++) {
      const s = ((box.y + y) * w + box.x + x) * 4
      const o = (y * box.w + x) * 4
      const r = data[s] / 255, g = data[s + 1] / 255, b = data[s + 2] / 255
      const l = 0.3 * r + 0.59 * g + 0.11 * b
      const inWheel = wheels.some((wh) => Math.hypot(x - wh.cx, y - wh.cy) < wh.r * 0.98)
      let R, G, B
      if (inWheel) {
        R = l * 0.85; G = l * 0.85; B = l * 0.88
      } else {
        // grey paint → the same dark wine red as the Hellcat; dark glass stays dark
        const paint = clamp((l - 0.12) / 0.35)
        R = l * (1 - paint) * 0.75 + paint * Math.pow(l, 1.2) * 0.92
        G = l * (1 - paint) * 0.75 + paint * Math.pow(l, 1.2) * 0.3
        B = l * (1 - paint) * 0.8 + paint * Math.pow(l, 1.2) * 0.38
      }
      body[o] = 255 * clamp(R * 0.8)
      body[o + 1] = 255 * clamp(G * 0.8)
      body[o + 2] = 255 * clamp(B * 0.84)
      body[o + 3] = Math.round(255 * clamp((data[s + 3] / 255 - 0.3) / 0.6))
    }
  const W = 1600
  const s = W / box.w
  await sharp(body, { raw: { width: box.w, height: box.h, channels: 4 } }).resize(W).webp({ quality: 86 }).toFile(`${OUT}/side.webp`)
  meta.side = { w: W, h: Math.round(box.h * s), wheels: [] }
  for (const wh of wheels) {
    const size = Math.round(wh.r * 2)
    const wb = Buffer.alloc(size * size * 4)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const bx = Math.round(wh.cx - wh.r + x)
        const by = Math.round(wh.cy - wh.r + y)
        const o = (y * size + x) * 4
        const d = Math.hypot(x - wh.r, y - wh.r)
        if (bx < 0 || by < 0 || bx >= box.w || by >= box.h) continue
        const i = (by * box.w + bx) * 4
        for (let c = 0; c < 3; c++) wb[o + c] = body[i + c]
        wb[o + 3] = Math.round(255 * clamp((wh.r - d) / 3)) * (body[i + 3] / 255)
      }
    const ws = Math.round(size * s)
    await sharp(wb, { raw: { width: size, height: size, channels: 4 } }).resize(ws, ws).webp({ quality: 88 }).toFile(`${OUT}/wheel-${wh.name}.webp`)
    meta.side.wheels.push({ name: wh.name, cx: Math.round(wh.cx * s), cy: Math.round(wh.cy * s), r: Math.round(wh.r * s) })
  }
}
fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 2))
console.log(JSON.stringify(meta))
