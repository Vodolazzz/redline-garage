// A synthesized flat-six: two detuned oscillators through a soft clipper and a
// low-pass filter. Pitch follows rpm (firing frequency of a six = rpm / 20).
// Only ever started by a click, so browsers allow the AudioContext.

export class EngineSound {
  private ctx: AudioContext
  private oscA: OscillatorNode
  private oscB: OscillatorNode
  private filter: BiquadFilterNode
  private gain: GainNode

  constructor() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    this.oscA = this.ctx.createOscillator()
    this.oscB = this.ctx.createOscillator()
    this.oscA.type = "sawtooth"
    this.oscB.type = "square"
    this.oscB.detune.value = -1200 + 7

    const shaper = this.ctx.createWaveShaper()
    const curve = new Float32Array(1024)
    for (let i = 0; i < curve.length; i++) {
      const x = (i / curve.length) * 2 - 1
      curve[i] = Math.tanh(x * 2.6)
    }
    shaper.curve = curve

    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = "lowpass"
    this.filter.Q.value = 6

    const mixB = this.ctx.createGain()
    mixB.gain.value = 0.5
    this.gain = this.ctx.createGain()
    this.gain.gain.value = 0

    this.oscA.connect(shaper)
    this.oscB.connect(mixB).connect(shaper)
    shaper.connect(this.filter).connect(this.gain).connect(this.ctx.destination)
    this.oscA.start()
    this.oscB.start()
    this.setRpm(900)
  }

  setRpm(rpm: number) {
    const t = this.ctx.currentTime
    const f = Math.max(30, rpm / 20)
    this.oscA.frequency.setTargetAtTime(f, t, 0.04)
    this.oscB.frequency.setTargetAtTime(f, t, 0.04)
    this.filter.frequency.setTargetAtTime(300 + rpm * 0.32, t, 0.05)
  }

  on() {
    this.ctx.resume()
    this.gain.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.15)
  }

  off() {
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1)
  }

  dispose() {
    this.off()
    setTimeout(() => this.ctx.close(), 400)
  }
}
