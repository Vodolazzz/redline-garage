// Builds the full-screen scroll film for the hero from real photographs (Wikimedia Commons):
// a red 2021–22 Charger SRT Hellcat Widebody cut out and parked on a wet night street,
// a slow push-in, an x-ray scan that turns the body into a ghost and shows the real
// engine bay and cabin, then a dive into the supercharged HEMI.
//
//   node scripts/make-frames.mjs            all frames → public/frames/hellcat/0001.webp…
//   ONLY=0,60,100 node scripts/make-frames.mjs
//
// Sources live in .charger-src*/ and .street-src/ (not committed); see public/media/credits.json.

import sharp from "sharp"
import fs from "node:fs"
import path from "node:path"

const SW = 2400 // scene
const SH = 1350
const OW = 1600 // output frame
const OH = 900
const N = 150
const OUT = "public/frames/hellcat"

const CAR = ".charger-src3/cut-hellcat.png" // 2700×2160, cut-out
const STREET = ".street-src/commons-116741348.jpg" // wet 23rd Street at night
const BAY = ".charger-src/c24682246.jpg" // Charger engine bay
const CABIN = ".charger-src/c131980865.jpg" // Charger dashboard
const HEMI = ".charger-src2/d117911661.jpg" // supercharged HEMI close-up

// Car measured on a 1400px-wide preview of the cut-out; K maps preview px → scene px.
const K = 1.291
const X0 = 285
const Y0 = -164
const P = (x, y) => [X0 + x * K, Y0 + y * K]
const CAR_BOX = { x: 128, y: 410, w: 1162, h: 470 } // preview coords

const BAY_POLY = [P(700, 585), P(900, 540), P(1150, 562), P(1250, 612), P(1235, 652), P(1010, 668), P(760, 628)]
const CABIN_POLY = [P(610, 470), P(780, 474), P(955, 522), P(980, 548), P(700, 580), P(620, 572)]
const WHEELS = [
  { c: P(775, 772), r: 92 * K },
  { c: P(243, 738), r: 78 * K },
]
const FLOOR_Y = Y0 + 880 * K // tyre contact line

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const range = (t, a, b) => clamp((t - a) / (b - a))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

function pointInPoly(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
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

function polyMask(poly, feather) {
  const m = new Float32Array(SW * SH)
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) if (pointInPoly(x, y, poly)) m[y * SW + x] = 1
  return blur(m, feather)
}

function bbox(poly, pad) {
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }
}

const centroid = (poly) => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length]

async function placed(src, box, crop) {
  const m = await sharp(src).metadata()
  const left = Math.round(m.width * crop.left)
  const top = Math.round(m.height * crop.top)
  const img = await sharp(src)
    .extract({ left, top, width: Math.min(Math.round(m.width * crop.w), m.width - left), height: Math.min(Math.round(m.height * crop.h), m.height - top) })
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

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  // ── car: cut-out, graded from daylight to the street's night, wine red → racing red
  const cw = Math.round(1400 * K)
  const meta = await sharp(CAR).metadata()
  const ch = Math.round((meta.height * cw) / meta.width)
  const carRaw = await sharp(CAR).resize(cw, ch).modulate({ hue: 14, saturation: 1.35, brightness: 0.92 }).ensureAlpha().raw().toBuffer()
  const car = new Float32Array(SW * SH * 4)
  for (let y = 0; y < ch; y++) {
    const sy = y + Y0
    if (sy < 0 || sy >= SH) continue
    for (let x = 0; x < cw; x++) {
      const sx = x + X0
      if (sx < 0 || sx >= SW) continue
      const s = (y * cw + x) * 4
      const d = (sy * SW + sx) * 4
      let a = carRaw[s + 3] / 255
      // a stray dark blob (another car's mirror) kept by the cut-out above the right fender
      // tighten the matte so the daylight fringe of the cut-out disappears
      a = clamp((a - 0.3) / 0.6)
      // contrast curve for a night look
      for (let c = 0; c < 3; c++) {
        const v = carRaw[s + c] / 255
        // night grade plus a warm neon spill from the right
        const spill = [1.08, 0.94, 0.9][c] * (0.9 + 0.12 * (x / cw))
        car[d + c] = 255 * clamp(Math.pow(v, 1.15) * 0.98 * spill)
      }
      car[d + 3] = a
    }
  }

  // ── street: blurred, darkened, vignetted
  const streetRaw = await sharp(STREET)
    .extract({ left: 0, top: 560, width: 3840, height: 2160 })
    .resize(SW, SH)
    .blur(8)
    .modulate({ brightness: 0.55, saturation: 1.05 })
    .removeAlpha()
    .raw()
    .toBuffer()
  const bg = new Float32Array(SW * SH * 3)
  const xbg = new Float32Array(SW * SH * 3)
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 3
      const dx = (x - SW / 2) / (SW / 2)
      const dy = (y - SH * 0.55) / (SH / 2)
      const vig = clamp(1 - 0.55 * (dx * dx * 0.8 + dy * dy * 1.2))
      for (let c = 0; c < 3; c++) bg[i + c] = streetRaw[i + c] * vig
      // x-ray: the street goes cold and dark
      const l = (streetRaw[i] * 0.3 + streetRaw[i + 1] * 0.59 + streetRaw[i + 2] * 0.11) * vig
      xbg[i] = l * 0.12 + 4
      xbg[i + 1] = l * 0.32 + 10
      xbg[i + 2] = l * 0.45 + 16
      if (x % 80 === 0 || y % 80 === 0) {
        xbg[i] += 5
        xbg[i + 1] += 14
        xbg[i + 2] += 20
      }
    }

  // contact shadow under the car
  const shadow = new Float32Array(SW * SH)
  const [sx0, sx1] = [X0 + (CAR_BOX.x + 30) * K, X0 + (CAR_BOX.x + CAR_BOX.w - 20) * K]
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const nx = (x - (sx0 + sx1) / 2) / ((sx1 - sx0) / 2)
      const ny = (y - (FLOOR_Y - 10)) / 70
      shadow[y * SW + x] = clamp(1 - (nx * nx + ny * ny)) * 0.85
    }

  // ── ghost edges for the x-ray
  const lum = new Float32Array(SW * SH)
  for (let i = 0; i < SW * SH; i++) lum[i] = (car[i * 4] * 0.3 + car[i * 4 + 1] * 0.59 + car[i * 4 + 2] * 0.11) * car[i * 4 + 3]
  const edge = new Float32Array(SW * SH)
  for (let y = 1; y < SH - 1; y++)
    for (let x = 1; x < SW - 1; x++) {
      const i = y * SW + x
      const gx = lum[i + 1 - SW] + 2 * lum[i + 1] + lum[i + 1 + SW] - lum[i - 1 - SW] - 2 * lum[i - 1] - lum[i - 1 + SW]
      const gy = lum[i + SW - 1] + 2 * lum[i + SW] + lum[i + SW + 1] - lum[i - SW - 1] - 2 * lum[i - SW] - lum[i - SW + 1]
      edge[i] = clamp(Math.sqrt(gx * gx + gy * gy) / 220)
    }

  const bayMask = polyMask(BAY_POLY, 22)
  const cabinMask = polyMask(CABIN_POLY, 18)
  const bayImg = await placed(BAY, bbox(BAY_POLY, 50), { left: 0.05, top: 0.14, w: 0.95, h: 0.5 })
  const cabImg = await placed(CABIN, bbox(CABIN_POLY, 36), { left: 0, top: 0.08, w: 1, h: 0.75 })

  // ── the two states
  const base = new Float32Array(SW * SH * 3)
  const xray = new Float32Array(SW * SH * 3)
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const i = y * SW + x
      const a = car[i * 4 + 3]
      const sh = shadow[i] * (1 - a)
      // wet-asphalt reflection
      let ra = 0
      let rc = [0, 0, 0]
      if (y > FLOOR_Y) {
        const ry = Math.round(2 * FLOOR_Y - y)
        if (ry >= 0 && ry < SH) {
          const j = ry * SW + x
          ra = car[j * 4 + 3] * Math.exp(-(y - FLOOR_Y) / 120) * 0.38
          rc = [car[j * 4], car[j * 4 + 1], car[j * 4 + 2]]
        }
      }
      let xr = xbg[i * 3] + a * 0.16 * 60 + edge[i] * 150
      let xg = xbg[i * 3 + 1] + a * 0.16 * 150 + edge[i] * 225
      let xb = xbg[i * 3 + 2] + a * 0.16 * 190 + edge[i] * 255
      for (let c = 0; c < 3; c++) {
        let v = bg[i * 3 + c] * (1 - sh)
        v = v * (1 - ra) + rc[c] * ra
        base[i * 3 + c] = v * (1 - a) + car[i * 4 + c] * a
      }
      if (ra > 0) {
        xg += ra * 50
        xb += ra * 70
      }
      const mb = bayMask[i] * 0.95
      if (mb > 0) {
        xr = xr * (1 - mb) + bayImg[i * 3] * mb
        xg = xg * (1 - mb) + bayImg[i * 3 + 1] * mb
        xb = xb * (1 - mb) + bayImg[i * 3 + 2] * mb
      }
      const mc = cabinMask[i] * 0.8
      if (mc > 0) {
        xr = xr * (1 - mc) + cabImg[i * 3] * mc
        xg = xg * (1 - mc) + cabImg[i * 3 + 1] * mc
        xb = xb * (1 - mc) + cabImg[i * 3 + 2] * mc
      }
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

  // x-ray cut-out for the "teardown" section (car only, transparent)
  {
    const bx = Math.round(X0 + (CAR_BOX.x - 10) * K)
    const by = Math.round(Y0 + (CAR_BOX.y - 10) * K)
    const bw = Math.round((CAR_BOX.w + 20) * K)
    const bh = Math.round((CAR_BOX.h + 20) * K)
    const xo = Buffer.alloc(bw * bh * 4)
    const co = Buffer.alloc(bw * bh * 4)
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const i = (by + y) * SW + bx + x
        const o = (y * bw + x) * 4
        const a = car[i * 4 + 3]
        const inner = Math.max(bayMask[i], cabinMask[i] * 0.85)
        for (let c = 0; c < 3; c++) {
          xo[o + c] = clamp(xray[i * 3 + c], 0, 255)
          co[o + c] = clamp(car[i * 4 + c], 0, 255)
        }
        xo[o + 3] = Math.round(255 * clamp(Math.max(a * 0.55 + edge[i] * 0.8, inner * a)))
        co[o + 3] = Math.round(255 * a)
      }
    fs.mkdirSync("public/media/parts", { recursive: true })
    await sharp(xo, { raw: { width: bw, height: bh, channels: 4 } }).resize(1800).webp({ quality: 84 }).toFile("public/media/parts/hellcat-xray.webp")
    await sharp(co, { raw: { width: bw, height: bh, channels: 4 } }).resize(1800).webp({ quality: 84 }).toFile("public/media/parts/hellcat-cutout.webp")
    console.log(`cut-outs ${bw}×${bh}`)
    if (process.env.CUTOUTS_ONLY) return
  }

  const hemi = await sharp(HEMI).resize(SW, SH, { fit: "cover" }).removeAlpha().raw().toBuffer()
  const only = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null
  const frame = Buffer.alloc(SW * SH * 3)
  const [bcx, bcy] = centroid(BAY_POLY)
  const carCx = X0 + (CAR_BOX.x + CAR_BOX.w / 2) * K
  const carCy = Y0 + (CAR_BOX.y + CAR_BOX.h / 2) * K

  for (let f = 0; f < N; f++) {
    if (only && !only.includes(f)) continue
    const t = f / (N - 1)
    const scan = ease(range(t, 0.3, 0.6))
    const scanX = -200 + scan * (SW + 400)
    const toHemi = ease(range(t, 0.74, 0.92))

    for (let y = 0; y < SH; y++)
      for (let x = 0; x < SW; x++) {
        const i = y * SW + x
        const m = clamp((scanX - x) / 140)
        const band = scan > 0 && scan < 1 ? Math.exp(-Math.pow((x - scanX) / 18, 2)) : 0
        for (let c = 0; c < 3; c++) {
          let v = base[i * 3 + c] * (1 - m) + xray[i * 3 + c] * m
          v += band * [255, 90, 80][c]
          if (toHemi > 0) v = v * (1 - toHemi) + hemi[i * 3 + c] * toHemi
          frame[i * 3 + c] = clamp(v, 0, 255)
        }
      }

    // camera: wide street → closer on the car → dive into the engine bay
    const approach = easeOut(range(t, 0.04, 0.32))
    const dive = ease(range(t, 0.6, 0.92))
    const settle = range(t, 0.92, 1)
    let scale = 1 + 0.38 * approach + 1.2 * dive
    let cx = SW / 2 + (carCx - SW / 2) * approach
    let cy = SH / 2 + (carCy - SH / 2) * approach
    cx += (bcx - cx) * dive * (1 - toHemi * 0.6)
    cy += (bcy - cy) * dive * (1 - toHemi * 0.6)
    if (toHemi > 0) {
      cx += (SW / 2 - cx) * toHemi
      cy += (SH / 2 - cy) * toHemi
      scale = scale * (1 - toHemi) + (1.05 + 0.15 * settle) * toHemi
    }
    const w = SW / scale
    const h = SH / scale
    const left = Math.round(clamp(cx - w / 2, 0, SW - w))
    const top = Math.round(clamp(cy - h / 2, 0, SH - h))
    await sharp(frame, { raw: { width: SW, height: SH, channels: 3 } })
      .extract({ left, top, width: Math.round(w), height: Math.round(h) })
      .resize(OW, OH)
      .webp({ quality: 72, effort: 4 })
      .toFile(path.join(OUT, `${String(f + 1).padStart(4, "0")}.webp`))
    if (f % 15 === 0) console.log(`frame ${f + 1}/${N}`)
  }
  console.log("done")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
