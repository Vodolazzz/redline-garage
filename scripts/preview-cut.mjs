import sharp from "sharp";
const [src, out] = process.argv.slice(2);
const m = await sharp(src).metadata();
const w = 1400, h = Math.round(m.height * w / m.width);
const fg = await sharp(src).resize(w).toBuffer();
await sharp({ create: { width: w, height: h, channels: 3, background: "#1a1d22" } }).composite([{ input: fg }]).jpeg().toFile(out);
