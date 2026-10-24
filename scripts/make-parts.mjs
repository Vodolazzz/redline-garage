// Crops the part close-ups used by the "exploded" section from the same real photos.
//   node scripts/make-parts.mjs
import sharp from "sharp"
import fs from "node:fs"

const OUT = "public/media/parts"
fs.mkdirSync(OUT, { recursive: true })

const jobs = [
  { out: "engine.jpg", src: ".charger-src/c24682246.jpg", crop: [0.12, 0.12, 0.76, 0.6], size: [1200, 900] },
  { out: "hemi.jpg", src: ".charger-src2/d117911661.jpg", crop: [0, 0, 1, 1], size: [1200, 900] },
  { out: "brakes.jpg", src: ".charger-src2/d198514287.jpg", crop: [0.375, 0.545, 0.19, 0.37], size: [900, 900] },
  { out: "wheel-rear.jpg", src: ".charger-src2/d198514287.jpg", crop: [0.8, 0.43, 0.17, 0.33], size: [900, 900] },
  { out: "cabin.jpg", src: ".charger-src/c131980865.jpg", crop: [0, 0.12, 1, 0.88], size: [1200, 900] },
  { out: "body.jpg", src: ".charger-src2/d198514287.jpg", crop: [0, 0.05, 1, 0.9], size: [1600, 900] },
  { out: "scatpack.jpg", src: ".charger-src2/d130225432.jpg", crop: [0, 0.1, 0.62, 0.85], size: [1200, 900] },
  { out: "rear.jpg", src: ".charger-src2/d167583544.jpg", crop: [0, 0.25, 0.75, 0.7], size: [1200, 900] },
]

for (const j of jobs) {
  const m = await sharp(j.src).metadata()
  const [l, t, w, h] = j.crop
  const left = Math.round(m.width * l)
  const top = Math.round(m.height * t)
  const width = Math.min(Math.round(m.width * w), m.width - left)
  const height = Math.min(Math.round(m.height * h), m.height - top)
  await sharp(j.src)
    .extract({ left, top, width, height })
    .resize(j.size[0], j.size[1], { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}/${j.out}`)
  console.log(j.out)
}

// the cut-out car for the exploded scene (transparent background)
await sharp(".charger-src2/cut-daytona.png")
  .extract({ left: 0, top: 260, width: 3840, height: 1717 })
  .resize(1800)
  .webp({ quality: 82 })
  .toFile(`${OUT}/charger-cutout.webp`)
console.log("charger-cutout.webp")
