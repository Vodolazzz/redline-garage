// Assets for the drive-by hero, from two real photographs of the same black
// Dodge Challenger (Wikimedia Commons, Pitch Black SXT, 2024):
//  - front.webp  3/4 front, for the approach
//  - side.webp   further back and more side-on, for the slide past
// Both are cut out (see README), cleaned, number plates removed and graded to the
// monochrome look of the scene. meta.json holds the lamp and wheel points (0…1).
//   node scripts/make-hero-assets.mjs
import sharp from "sharp"
import fs from "node:fs"

const OUT = "public/media/hero"
fs.mkdirSync(OUT, { recursive: true })
for (const f of ["wheel-f.webp", "wheel-r.webp"]) fs.rmSync(`${OUT}/${f}`, { force: true })
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

function inQuad(x, y, q) {
  let inside = false
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i]
    const [xj, yj] = q[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Coordinates below are measured on 1400px-wide previews of the cut-outs.
const JOBS = [
  {
    name: "front",
    src: ".chal-src/cut-front.png",
    box: { x: 50, y: 360, w: 1300, h: 540 },
    erase: (x, y) => y < 368 || x > 1338 || (y < 386 && x < 560) || (y < 388 && x > 1012),
    plate: [
      [182, 725],
      [296, 733],
      [294, 800],
      [184, 792],
    ],
    lamps: [
      [100, 650, 24],
      [140, 652, 24],
      [470, 676, 26],
      [528, 681, 26],
    ],
    rearWheel: [1222, 690],
  },
  {
    name: "side",
    src: ".chal-src/cut-side.png",
    box: { x: 185, y: 425, w: 1020, h: 390 },
    erase: (x, y) => x > 1196 || (x > 1100 && y < 520),
    plate: [
      [266, 660],
      [342, 664],
      [341, 709],
      [266, 705],
    ],
    lamps: [
      [205, 616, 19],
      [237, 618, 19],
      [467, 626, 20],
      [500, 628, 20],
    ],
    rearWheel: [1095, 700],
  },
]

const meta = {}
for (const job of JOBS) {
  const { data, info } = await sharp(job.src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const k = info.width / 1400
  const bx = Math.round(job.box.x * k)
  const by = Math.round(job.box.y * k)
  const bw = Math.round(job.box.w * k)
  const bh = Math.round(job.box.h * k)
  const out = Buffer.alloc(bw * bh * 4)
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const s = ((by + y) * info.width + bx + x) * 4
      const o = (y * bw + x) * 4
      const px = (bx + x) / k
      const py = (by + y) / k
      let a = clamp((data[s + 3] / 255 - 0.3) / 0.6)
      if (job.erase(px, py)) a = 0
      let l = (0.3 * data[s] + 0.59 * data[s + 1] + 0.11 * data[s + 2]) / 255
      // plate → bumper black
      if (inQuad(px, py, job.plate)) l = 0.09
      // monochrome, deep blacks, keep the gloss highlights
      const v = clamp(Math.pow(l, 1.25) * 1.05)
      out[o] = Math.round(255 * v * 0.98)
      out[o + 1] = Math.round(255 * v * 0.99)
      out[o + 2] = Math.round(255 * v)
      out[o + 3] = Math.round(255 * a)
    }
  const W = 1600
  await sharp(out, { raw: { width: bw, height: bh, channels: 4 } })
    .blur(0.4)
    .resize(W)
    .webp({ quality: 88 })
    .toFile(`${OUT}/${job.name}.webp`)
  const norm = ([x, y]) => [+((x - job.box.x) / job.box.w).toFixed(4), +((y - job.box.y) / job.box.h).toFixed(4)]
  meta[job.name] = {
    aspect: +(bw / bh).toFixed(4),
    lamps: job.lamps.map(([x, y, r]) => [...norm([x, y]), +(r / job.box.w).toFixed(4)]),
    rearWheel: norm(job.rearWheel),
  }
}
fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 2))
console.log(JSON.stringify(meta))
