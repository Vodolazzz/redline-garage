// Tyre smoke and sparks on a canvas. One pre-rendered puff sprite, drawn many
// times with varying scale and alpha — cheap enough for a full-screen hero.

interface Puff {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  grow: number
  life: number
  max: number
  rot: number
  spin: number
  shade: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export class SmokeField {
  private ctx: CanvasRenderingContext2D
  private sprite: HTMLCanvasElement
  private puffs: Puff[] = []
  private sparks: Spark[] = []
  private dpr = 1
  width = 0
  height = 0

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable")
    this.ctx = ctx
    this.sprite = SmokeField.makeSprite()
    this.resize()
  }

  static makeSprite() {
    const s = document.createElement("canvas")
    s.width = s.height = 128
    const g = s.getContext("2d")!
    // a lumpy puff: several offset radial blobs
    for (let i = 0; i < 7; i++) {
      const x = 64 + (Math.random() - 0.5) * 36
      const y = 64 + (Math.random() - 0.5) * 36
      const r = 30 + Math.random() * 26
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, "rgba(255,255,255,0.32)")
      grad.addColorStop(0.6, "rgba(255,255,255,0.12)")
      grad.addColorStop(1, "rgba(255,255,255,0)")
      g.fillStyle = grad
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
    return s
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /** Emit smoke at a point; `power` 0…1 scales size and speed; `drift` pushes it sideways. */
  emit(x: number, y: number, count: number, power = 1, drift = -1) {
    if (this.puffs.length > 420) return
    for (let i = 0; i < count; i++) {
      const max = 90 + Math.random() * 110 * (0.6 + power)
      this.puffs.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y - Math.random() * 10,
        vx: drift * (0.6 + Math.random() * 2.4) * (0.5 + power),
        vy: -(0.2 + Math.random() * 1.1) * (0.4 + power),
        r: 18 + Math.random() * 24,
        grow: 0.7 + Math.random() * 1.3 * (0.5 + power),
        life: 0,
        max,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        shade: 0.75 + Math.random() * 0.25,
      })
    }
  }

  sparksAt(x: number, y: number, count: number, dir = -1) {
    for (let i = 0; i < count; i++) {
      const a = (Math.random() - 0.5) * 1.2 + (dir < 0 ? Math.PI : 0)
      const s = 4 + Math.random() * 9
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3 - Math.random() * 3, life: 0 })
    }
  }

  get busy() {
    return this.puffs.length > 0 || this.sparks.length > 0
  }

  clear() {
    this.puffs = []
    this.sparks = []
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /** Advance and draw. `fade` 0…1 multiplies the overall opacity (used to clear the stage). */
  step(fade = 1) {
    const { ctx } = this
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = "source-over"
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]
      p.life++
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.985
      p.vy *= 0.992
      p.vy -= 0.006
      p.r += p.grow
      p.rot += p.spin
      const t = p.life / p.max
      if (t >= 1) {
        this.puffs.splice(i, 1)
        continue
      }
      const alpha = Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5) * (1 - t) * 0.9 * fade * p.shade
      ctx.globalAlpha = alpha
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.drawImage(this.sprite, -p.r, -p.r, p.r * 2, p.r * 2)
      ctx.restore()
    }
    ctx.globalCompositeOperation = "lighter"
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]
      s.life++
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.45
      s.vx *= 0.97
      if (s.life > 38 || s.y > this.height) {
        this.sparks.splice(i, 1)
        continue
      }
      const a = 1 - s.life / 38
      ctx.globalAlpha = a * fade
      ctx.strokeStyle = s.life < 10 ? "#fff3c4" : "#ff5a1f"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = "source-over"
  }
}
