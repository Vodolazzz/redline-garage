// Builds the scroll-scrubbed hero film from real photographs (Wikimedia Commons):
// a cut-out red Charger Daytona in a studio, a slow camera push-in, an x-ray scan
// that turns the body into a ghost and shows the real engine bay and cabin inside,
// then a dive into the supercharged HEMI. Output: public/frames/charger/0001.webp…
//
//   node scripts/make-frames.mjs
//
// Sources live in .charger-src*/ (not committed); see public/media/credits.json.

import sharp from "sharp"
import fs from "node:fs"
import path from "node:path"

const SW = 2400 // scene width
const SH = 1350
const OW = 1440 // output frame
const OH = 810
const N = 144
const OUT = "public/frames/charger"

const CAR = ".charger-src2/cut-daytona.png"
const BAY = ".charger-src/c24682246.jpg" // Charger engine bay, red
const CABIN = ".charger-src/c131980865.jpg" // Charger dashboard
const HEMI = ".charger-src2/d117911661.jpg" // supercharged HEMI close-up

// Car placement inside the scene; preview coordinates were measured on a 1400px-wide render.
const CAR_W = 2000
const CAR_X = 200
const CAR_Y = 250
const K = CAR_W / 1400
const P = (x, y) => [CAR_X + x * K, CAR_Y + y * K]

const BAY_POLY = [P(110, 338), P(300, 272), P(560, 268), P(770, 306), P(720, 392), P(150, 398)]
const CABIN_POLY = [P(440, 248), P(560, 150), P(830, 140), P(1020, 142), P(1165, 215), P(1170, 245), P(800, 268)]
const WHEELS = [
  { c: P(655, 520), r: 98 * K },
  { c: P(1250, 430), r: 88 * K },
]

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const range = (t, a, b) => clamp((t - a) / (b - a))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

async function rgba(input, w, h, fit = "fill") {
  const { data } = await sharp(input).resize(w, h, { fit }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return data
}

function pointInPoly(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Soft polygon mask (0…1) via a box blur of the hard mask. */
function polyMask(poly, feather) {
  const m = new Float32Array(SW * SH)
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs))
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys))
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (pointInPoly(x, y, poly)) m[y * SW + x] = 1
  return blur(m, feather)
}

function blur(src, r) {
  const tmp = new Float32Array(SW * SH)
  const out = new Float32Array(SW * SH)
  const d = 2 * r + 1
  for (let y = 0; y < SH; y++) {
    let acc = 0
    for (let x = -r; x <= r; x++) acc += src[y * SW + clamp(x, 0, SW - 1)]
    for (let x = 0; x < SW; x++) {
      tmp[y * SW + x] = acc / d
      acc += src[y * SW + Math.min(SW - 1, x + r + 1)] - src[y * SW + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < SW; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, SH - 1) * SW + x]
    for (let y = 0; y < SH; y++) {
      out[y * SW + x] = acc / d
      acc += tmp[Math.min(SH - 1, y + r + 1) * SW + x] - tmp[Math.max(0, y - r) * SW + x]
    }
  }
  return out
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  // ── car layer in scene coordinates (RGBA float)
  const meta = await sharp(CAR).metadata()
  const carH = Math.round((meta.height * CAR_W) / meta.width)
  const carRaw = await rgba(CAR, CAR_W, carH)
  const car = new Float32Array(SW * SH * 4)
  for (let y = 0; y < carH; y++) {
    const sy = y + CAR_Y
    if (sy < 0 || sy >= SH) continue
    for (let x = 0; x < CAR_W; x++) {
      const sx = x + CAR_X
      const s = (y * CAR_W + x) * 4
      const d = (sy * SW + sx) * 4
      let a = carRaw[s + 3] / 255
      // erase the street pole the cut-out kept above the roof
      if (y < 100 * K * 0.98 && (x > 600 * K && x < 1050 * K)) a = 0
      car[d] = carRaw[s]
      car[d + 1] = carRaw[s + 1]
      car[d + 2] = carRaw[s + 2]
      car[d + 3] = a
    }
  }
  // number plate → REDLINE plate
  const plateSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(84 * K)}" height="${Math.round(60 * K)}"><rect width="100%" height="100%" rx="6" fill="#0c0c0d"/><text x="50%" y="62%" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${Math.round(19 * K)}" fill="#e10600">REDLINE</text></svg>`,
  )
  const plate = await rgba(plateSvg, Math.round(84 * K), Math.round(60 * K))
  const [plx, ply] = P(111, 447)
  for (let y = 0; y < Math.round(60 * K); y++)
    for (let x = 0; x < Math.round(84 * K); x++) {
      const s = (y * Math.round(84 * K) + x) * 4
      const d = ((Math.round(ply) + y) * SW + Math.round(plx) + x) * 4
      const a = plate[s + 3] / 255
      for (let c = 0; c < 3; c++) car[d + c] = car[d + c] * (1 - a) + plate[s + c] * a
    }

  // ── studio background
  const bg = new Float32Array(SW * SH * 3)
  const xbg = new Float32Array(SW * SH * 3)
  const floorY = CAR_Y + carH * 0.885
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 3
      const dx = (x - SW * 0.5) / SW
      const dy = (y - SH * 0.42) / SH
      const glow = Math.exp(-(dx * dx * 3.2 + dy * dy * 5.5))
      const floor = y > floorY ? 0.55 + 0.45 * Math.exp(-((y - floorY) / 260)) : 1
      // warm red studio
      bg[i] = (14 + 120 * glow) * floor
      bg[i + 1] = (12 + 14 * glow) * floor
      bg[i + 2] = (14 + 14 * glow) * floor
      // x-ray: cold blueprint dark
      xbg[i] = (6 + 10 * glow) * floor
      xbg[i + 1] = (12 + 34 * glow) * floor
      xbg[i + 2] = (18 + 52 * glow) * floor
    }
  // faint grid on the x-ray background
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      if (x % 80 === 0 || y % 80 === 0) {
        const i = (y * SW + x) * 3
        xbg[i] += 6
        xbg[i + 1] += 16
        xbg[i + 2] += 22
      }
    }

  // ── ghost (edges of the real car) for the x-ray
  const lum = new Float32Array(SW * SH)
  for (let i = 0; i < SW * SH; i++) lum[i] = (car[i * 4] * 0.3 + car[i * 4 + 1] * 0.59 + car[i * 4 + 2] * 0.11) * car[i * 4 + 3]
  const edge = new Float32Array(SW * SH)
  for (let y = 1; y < SH - 1; y++)
    for (let x = 1; x < SW - 1; x++) {
      const i = y * SW + x
      const gx = lum[i + 1 - SW] + 2 * lum[i + 1] + lum[i + 1 + SW] - lum[i - 1 - SW] - 2 * lum[i - 1] - lum[i - 1 + SW]
      const gy = lum[i + SW - 1] + 2 * lum[i + SW] + lum[i + SW + 1] - lum[i - SW - 1] - 2 * lum[i - SW] - lum[i - SW + 1]
      edge[i] = clamp(Math.sqrt(gx * gx + gy * gy) / 260)
    }

  // ── inner photos masked into the body
  const bayMask = polyMask(BAY_POLY, 26)
  const cabinMask = polyMask(CABIN_POLY, 22)
  const bayBox = bbox(BAY_POLY, 60)
  const cabBox = bbox(CABIN_POLY, 40)
  const bayImg = await placed(BAY, bayBox, { left: 0.05, top: 0.14, w: 0.95, h: 0.5 })
  const cabImg = await placed(CABIN, cabBox, { left: 0.0, top: 0.08, w: 1, h: 0.75 })

  // ── composite the two full states once
  const base = new Float32Array(SW * SH * 3)
  const xray = new Float32Array(SW * SH * 3)
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x
      const a = car[i * 4 + 3]
      // floor reflection: mirror the car about the floor line
      const ry = Math.round(2 * floorY - y)
      let ra = 0
      let rr = 0, rg = 0, rb = 0
      if (y > floorY && ry >= 0 && ry < SH) {
        const j = ry * SW + x
        const fade = Math.exp(-(y - floorY) / 140) * 0.32
        ra = car[j * 4 + 3] * fade
        rr = car[j * 4]
        rg = car[j * 4 + 1]
        rb = car[j * 4 + 2]
      }
      for (let c = 0; c < 3; c++) {
        const b = bg[i * 3 + c]
        const refl = b * (1 - ra) + [rr, rg, rb][c] * ra
        base[i * 3 + c] = refl * (1 - a) + car[i * 4 + c] * a
      }
      // x-ray state
      const e = edge[i]
      const fill = a * 0.16
      let xr = xbg[i * 3] + fill * 60 + e * 150
      let xg = xbg[i * 3 + 1] + fill * 150 + e * 225
      let xb = xbg[i * 3 + 2] + fill * 190 + e * 255
      // reflection ghost
      if (ra > 0) {
        xg += ra * 40
        xb += ra * 60
      }
      const mb = bayMask[i]
      if (mb > 0) {
        const k = mb * 0.95
        xr = xr * (1 - k) + bayImg[i * 3] * k
        xg = xg * (1 - k) + bayImg[i * 3 + 1] * k
        xb = xb * (1 - k) + bayImg[i * 3 + 2] * k
      }
      const mc = cabinMask[i]
      if (mc > 0) {
        const k = mc * 0.8
        xr = xr * (1 - k) + cabImg[i * 3] * k
        xg = xg * (1 - k) + cabImg[i * 3 + 1] * k
        xb = xb * (1 - k) + cabImg[i * 3 + 2] * k
      }
      // red rings on the brakes
      for (const w of WHEELS) {
        const d = Math.hypot(x - w.c[0], y - w.c[1])
        const ring = Math.exp(-Math.pow((d - w.r * 0.55) / 4, 2)) + 0.5 * Math.exp(-Math.pow((d - w.r * 0.95) / 3, 2))
        xr += ring * 230
        xg += ring * 30
        xb += ring * 20
      }
      xray[i * 3] = xr
      xray[i * 3 + 1] = xg
      xray[i * 3 + 2] = xb
    }

  // x-ray cut-out for the "exploded" section: same crop as public/media/parts/charger-cutout.webp
  {
    const top = CAR_Y + Math.round((260 / meta.height) * carH)
    const h = CAR_Y + carH - top
    const out = Buffer.alloc(CAR_W * h * 4)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < CAR_W; x++) {
        const i = (top + y) * SW + CAR_X + x
        const o = (y * CAR_W + x) * 4
        const a = car[i * 4 + 3]
        const inner = Math.max(bayMask[i], cabinMask[i] * 0.85)
        out[o] = clamp(xray[i * 3], 0, 255)
        out[o + 1] = clamp(xray[i * 3 + 1], 0, 255)
        out[o + 2] = clamp(xray[i * 3 + 2], 0, 255)
        out[o + 3] = Math.round(255 * clamp(Math.max(a * 0.55 + edge[i] * 0.8, inner * a)))
      }
    await sharp(out, { raw: { width: CAR_W, height: h, channels: 4 } }).resize(1800).webp({ quality: 84 }).toFile("public/media/parts/charger-xray.webp")
    if (process.env.XRAY_ONLY) return
  }

  const hemi = await sharp(HEMI).resize(SW, SH, { fit: "cover" }).removeAlpha().raw().toBuffer()

  // ── frames
  const frame = Buffer.alloc(SW * SH * 3)
  const only = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null
  for (let f = 0; f < N; f++) {
    if (only && !only.includes(f)) continue
    const t = f / (N - 1)
    const scan = ease(range(t, 0.28, 0.6))
    const scanX = -200 + scan * (SW + 400)
    const toHemi = ease(range(t, 0.7, 0.9))

    for (let y = 0; y < SH; y++)
      for (let x = 0; x < SW; x++) {
        const i = y * SW + x
        // soft scan edge: left of the band is x-ray
        const m = clamp((scanX - x) / 140)
        const band = Math.exp(-Math.pow((x - scanX) / 18, 2)) * (scan > 0 && scan < 1 ? 1 : 0)
        for (let c = 0; c < 3; c++) {
          let v = base[i * 3 + c] * (1 - m) + xray[i * 3 + c] * m
          v += band * [255, 90, 80][c]
          if (toHemi > 0) v = v * (1 - toHemi) + hemi[i * 3 + c] * toHemi
          frame[i * 3 + c] = clamp(v, 0, 255)
        }
      }

    // camera: approach → hold for the scan → dive into the engine bay
    const approach = easeOut(range(t, 0, 0.3))
    const dive = ease(range(t, 0.58, 0.9))
    const settle = range(t, 0.9, 1)
    let scale = 1 + 0.32 * approach + 1.1 * dive + 0.12 * settle
    const [bcx, bcy] = centroid(BAY_POLY)
    const carCx = CAR_X + CAR_W * 0.5
    const carCy = CAR_Y + carH * 0.55
    let cx = carCx + (CAR_X + CAR_W * 0.42 - carCx) * approach
    let cy = carCy
    cx = cx + (bcx - cx) * dive * (1 - toHemi * 0.6)
    cy = cy + (bcy - cy) * dive * (1 - toHemi * 0.6)
    if (toHemi > 0) {
      // the HEMI photo is full frame; re-centre on it
      cx = cx + (SW / 2 - cx) * toHemi
      cy = cy + (SH / 2 - cy) * toHemi
      scale = scale * (1 - toHemi) + (1.05 + 0.15 * settle) * toHemi
    }
    const cw = SW / scale
    const ch = SH / scale
    const left = Math.round(clamp(cx - cw / 2, 0, SW - cw))
    const top = Math.round(clamp(cy - ch / 2, 0, SH - ch))

    const name = path.join(OUT, `${String(f + 1).padStart(4, "0")}.webp`)
    await sharp(frame, { raw: { width: SW, height: SH, channels: 3 } })
      .extract({ left, top, width: Math.round(cw), height: Math.round(ch) })
      .resize(OW, OH)
      .webp({ quality: 74, effort: 4 })
      .toFile(name)
    if (f % 12 === 0) console.log(`frame ${f + 1}/${N}`)
  }
  console.log("done")
}

function bbox(poly, pad) {
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }
}

function centroid(poly) {
  return [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length]
}

/** A crop of a photo (fractions of its size) resized into a scene box; returns full-scene RGB. */
async function placed(src, box, crop) {
  const m = await sharp(src).metadata()
  const img = await sharp(src)
    .extract({
      left: Math.round(m.width * crop.left),
      top: Math.round(m.height * crop.top),
      width: Math.round(m.width * crop.w) - Math.round(m.width * crop.left) > 0 ? Math.min(Math.round(m.width * crop.w), m.width - Math.round(m.width * crop.left)) : m.width,
      height: Math.min(Math.round(m.height * crop.h), m.height - Math.round(m.height * crop.top)),
    })
    .resize(Math.round(box.w), Math.round(box.h), { fit: "cover" })
    .modulate({ brightness: 1.15, saturation: 1.1 })
    .removeAlpha()
    .raw()
    .toBuffer()
  const out = new Float32Array(SW * SH * 3)
  const bw = Math.round(box.w)
  for (let y = 0; y < Math.round(box.h); y++)
    for (let x = 0; x < bw; x++) {
      const sx = Math.round(box.x) + x
      const sy = Math.round(box.y) + y
      if (sx < 0 || sy < 0 || sx >= SW || sy >= SH) continue
      const s = (y * bw + x) * 3
      const d = (sy * SW + sx) * 3
      out[d] = img[s]
      out[d + 1] = img[s + 1]
      out[d + 2] = img[s + 2]
    }
  return out
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
