// Dev helper: tiles every image in a folder into one JPEG for a quick look.
//   node scripts/contact-sheet.mjs <folder> <out.jpg> [tileWidth]
import sharp from "sharp"
import fs from "node:fs"
import path from "node:path"

const [dir, out, tw = "480"] = process.argv.slice(2)
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|webp|png)$/i.test(f)).sort()
const W = Number(tw)
const H = Math.round((W * 9) / 16)
const cols = 3
const rows = Math.ceil(files.length / cols)
const tiles = await Promise.all(
  files.map(async (f, i) => ({
    input: await sharp(path.join(dir, f)).resize(W, H, { fit: "cover" }).toBuffer(),
    left: (i % cols) * W,
    top: Math.floor(i / cols) * H,
  })),
)
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#fff" } })
  .composite(tiles)
  .jpeg()
  .toFile(out)
console.log(files.join("\n"))
