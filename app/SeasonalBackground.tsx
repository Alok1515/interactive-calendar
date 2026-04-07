'use client'

import { useEffect, useRef } from 'react'

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export function getSeason(month: number): Season {
  if (month === 11 || month === 0 || month === 1) return 'winter'
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  return 'autumn'
}

interface P {
  x: number; y: number; vx: number; vy: number
  size: number; alpha: number; rot: number; rotSpd: number
  r: number; g: number; b: number
  osc: number; oscSpd: number; oscAmp: number
}

const COLORS = {
  winter: [[255,255,255],[210,235,255],[180,215,255],[240,248,255]] as number[][],
  spring: [[255,160,185],[255,182,200],[255,140,165],[255,200,220],[240,120,160]] as number[][],
  summer: [[255,255,140],[255,245,100],[200,255,200],[150,255,255],[255,255,200]] as number[][],
  autumn: [[220,70,15],[200,45,5],[255,140,0],[165,35,0],[240,90,10],[180,60,0]] as number[][],
}

const BG = {
  winter: ['#04061a','#0a1238','#060d28'],
  spring: ['#0e0718','#1a1035','#081018'],
  summer: ['#01080f','#001220','#001828'],
  autumn: ['#0a0400','#1c0900','#120600'],
}

export default function SeasonalBackground({ month }: { month: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const season = getSeason(month)
    const palette = COLORS[season]
    const bg = BG[season]

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Particles ────────────────────────────────
    const N = season === 'winter' ? 140 : season === 'spring' ? 80 : season === 'summer' ? 60 : 100
    const particles: P[] = []
    const W = () => canvas.width, H = () => canvas.height

    for (let i = 0; i < N; i++) {
      const [r, g, b] = palette[Math.floor(Math.random() * palette.length)]
      const minS = season === 'winter' ? 3.5 : season === 'spring' ? 6 : season === 'summer' ? 4 : 9
      const maxS = season === 'winter' ? 9.5 : season === 'spring' ? 16 : season === 'summer' ? 12 : 20
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: season === 'summer' ? 0 : 0.4 + Math.random() * (season === 'autumn' ? 1.8 : season === 'winter' ? 1.3 : 0.9),
        size: minS + Math.random() * (maxS - minS),
        alpha: 0.55 + Math.random() * 0.45,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * (season === 'autumn' ? 0.075 : 0.025),
        r, g, b,
        osc: Math.random() * Math.PI * 2,
        oscSpd: 0.01 + Math.random() * 0.016,
        oscAmp: season === 'winter' ? 0.9 + Math.random() * 1.2 : 0.4 + Math.random() * 0.7,
      })
    }

    // Fixed star positions (deterministic)
    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: (Math.sin(i * 2.3999) + 1) / 2,
      y: (Math.sin(i * 7.234)  + 1) / 2 * 0.78,
      s: 0.6 + ((Math.sin(i * 4.12) + 1) / 2) * 1.4,
    }))

    let t = 0

    // ── Draw helpers ─────────────────────────────
    const drawSnowflake = (p: P) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = p.alpha
      ctx.strokeStyle = `rgb(${p.r},${p.g},${p.b})`
      ctx.lineWidth = p.size > 6 ? 1.8 : 1.2
      const r = p.size
      if (r < 2.5) {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.fillStyle = ctx.strokeStyle; ctx.fill()
      } else {
        for (let arm = 0; arm < 6; arm++) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 1.4); ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(0, -r * 0.45); ctx.lineTo( r * 0.32, -r * 0.75)
          ctx.moveTo(0, -r * 0.45); ctx.lineTo(-r * 0.32, -r * 0.75)
          ctx.stroke()
          ctx.rotate(Math.PI / 3)
        }
      }
      ctx.restore()
    }

    const drawPetal = (p: P) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * 0.38, p.size, 0, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(p.size * 0.07, -p.size * 0.33, p.size * 0.1, p.size * 0.27, -0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill()
      ctx.restore()
    }

    const drawFirefly = (p: P) => {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
      grd.addColorStop(0,   `rgba(${p.r},${p.g},${p.b},${p.alpha})`)
      grd.addColorStop(0.35,`rgba(${p.r},${p.g},${p.b},${p.alpha * 0.5})`)
      grd.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2); ctx.fill()
      // Bright core
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${Math.min(p.r+90,255)},${Math.min(p.g+70,255)},${Math.min(p.b+40,255)},1)`
      ctx.fill()
    }

    const drawLeaf = (p: P) => {
      ctx.save()
      ctx.translate(p.x, p.y); ctx.rotate(p.rot)
      ctx.globalAlpha = p.alpha
      const s = p.size
      ctx.beginPath()
      ctx.moveTo(0, -s)
      ctx.bezierCurveTo( s * 1.1, -s * 0.4,  s * 0.95, s * 0.6, 0, s * 0.85)
      ctx.bezierCurveTo(-s * 0.95, s * 0.6, -s * 1.1, -s * 0.4, 0, -s)
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`; ctx.fill()
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 0.85)
      ctx.strokeStyle = `rgba(${Math.max(p.r-50,0)},${Math.max(p.g-30,0)},0,0.55)`
      ctx.lineWidth = 0.7; ctx.stroke()
      ctx.restore()
    }

    // ── Main loop ────────────────────────────────
    const loop = () => {
      const W2 = canvas.width, H2 = canvas.height
      t += 0.014

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H2)
      grad.addColorStop(0,   bg[0])
      grad.addColorStop(0.5, bg[1])
      grad.addColorStop(1,   bg[2])
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W2, H2)

      // ── WINTER: Aurora borealis ──────────────
      if (season === 'winter') {
        const auroraHues = [130, 165, 190, 270]
        for (let i = 0; i < 4; i++) {
          const hue = auroraHues[i]
          const cx = W2 * (0.12 + i * 0.25 + 0.07 * Math.sin(t * 0.28 + i))
          const cy = H2 * (0.18 + 0.06 * Math.sin(t * 0.35 + i * 0.9))
          const a  = 0.03 + 0.022 * Math.sin(t * 0.55 + i * 1.3)
          const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, W2 * 0.32)
          grd.addColorStop(0,   `hsla(${hue},90%,60%,${a * 3.5})`)
          grd.addColorStop(0.5, `hsla(${hue},80%,50%,${a})`)
          grd.addColorStop(1,   'transparent')
          ctx.fillStyle = grd; ctx.fillRect(0, 0, W2, H2)
        }
        // Ground ice shimmer
        const iceG = ctx.createLinearGradient(0, H2 * 0.88, 0, H2)
        iceG.addColorStop(0, 'transparent')
        iceG.addColorStop(1, 'rgba(140,200,255,0.07)')
        ctx.fillStyle = iceG; ctx.fillRect(0, 0, W2, H2)
      }

      // ── SPRING: Moon + mist ──────────────────
      if (season === 'spring') {
        const mx = W2 * 0.78, my = H2 * 0.11
        // Moon
        ctx.beginPath(); ctx.arc(mx, my, 22, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(240,230,255,0.13)'; ctx.fill()
        const mGrd = ctx.createRadialGradient(mx, my, 0, mx, my, 160)
        mGrd.addColorStop(0,   'rgba(220,200,255,0.10)')
        mGrd.addColorStop(0.5, 'rgba(180,140,255,0.04)')
        mGrd.addColorStop(1,   'transparent')
        ctx.fillStyle = mGrd; ctx.fillRect(0, 0, W2, H2)
        // Ground mist
        const mistG = ctx.createLinearGradient(0, H2 * 0.75, 0, H2)
        mistG.addColorStop(0, 'transparent')
        mistG.addColorStop(1, 'rgba(100,50,160,0.10)')
        ctx.fillStyle = mistG; ctx.fillRect(0, 0, W2, H2)
        // Shooting star
        const phase = t % 9
        if (phase < 0.55) {
          const prog = phase / 0.55
          ctx.save(); ctx.globalAlpha = Math.sin(prog * Math.PI) * 0.85
          const sx = W2 * 0.65 - prog * 200, sy = H2 * 0.08 + prog * 70
          const sGrd = ctx.createLinearGradient(sx - 80, sy - 26, sx, sy)
          sGrd.addColorStop(0, 'transparent'); sGrd.addColorStop(1, 'rgba(255,255,255,0.95)')
          ctx.strokeStyle = sGrd; ctx.lineWidth = 1.6
          ctx.beginPath(); ctx.moveTo(sx - 80, sy - 26); ctx.lineTo(sx, sy); ctx.stroke()
          ctx.restore()
        }
      }

      // ── SUMMER: Moon glow + cloud wisps ──────
      if (season === 'summer') {
        const mx = W2 * 0.13, my = H2 * 0.10
        const mAlpha = 0.12 + 0.04 * Math.sin(t * 0.45)
        ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,210,${mAlpha * 1.8})`; ctx.fill()
        const mGrd = ctx.createRadialGradient(mx, my, 0, mx, my, 220)
        mGrd.addColorStop(0,   `rgba(255,255,200,${mAlpha * 2})`)
        mGrd.addColorStop(0.4, `rgba(255,255,150,${mAlpha})`)
        mGrd.addColorStop(1,   'transparent')
        ctx.fillStyle = mGrd; ctx.fillRect(0, 0, W2, H2)
        // Reflective water shimmer
        const refG = ctx.createLinearGradient(0, H2 * 0.82, 0, H2)
        refG.addColorStop(0, 'transparent')
        refG.addColorStop(1, 'rgba(255,255,100,0.04)')
        ctx.fillStyle = refG; ctx.fillRect(0, 0, W2, H2)
      }

      // ── AUTUMN: Harvest moon + ember glow ────
      if (season === 'autumn') {
        const mx = W2 * 0.84, my = H2 * 0.13
        const mA = 0.14 + 0.05 * Math.sin(t * 0.38)
        ctx.beginPath(); ctx.arc(mx, my, 34, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,160,40,${mA * 1.5})`; ctx.fill()
        const mGrd = ctx.createRadialGradient(mx, my, 0, mx, my, 160)
        mGrd.addColorStop(0,   `rgba(255,170,50,${mA * 2})`)
        mGrd.addColorStop(0.5, `rgba(255,110,20,${mA})`)
        mGrd.addColorStop(1,   'transparent')
        ctx.fillStyle = mGrd; ctx.fillRect(0, 0, W2, H2)
        // Ember glow from ground
        const eGrd = ctx.createRadialGradient(W2 / 2, H2, 0, W2 / 2, H2, H2 * 0.55)
        eGrd.addColorStop(0, 'rgba(200,55,8,0.09)')
        eGrd.addColorStop(1, 'transparent')
        ctx.fillStyle = eGrd; ctx.fillRect(0, 0, W2, H2)
      }

      // ── Stars ────────────────────────────────
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        const twinkle = 0.25 + 0.55 * ((Math.sin(t * 1.8 + i * 0.73) + 1) / 2)
        ctx.beginPath()
        ctx.arc(s.x * W2, s.y * H2, s.s * 0.75, 0, Math.PI * 2)
        ctx.fillStyle = season === 'autumn'
          ? `rgba(255,195,140,${twinkle * 0.55})`
          : season === 'summer'
          ? `rgba(255,255,220,${twinkle * 0.45})`
          : `rgba(255,255,255,${twinkle * 0.75})`
        ctx.fill()
      }

      // ── Update + draw particles ───────────────
      for (const p of particles) {
        p.osc += p.oscSpd
        p.rot += p.rotSpd

        if (season === 'summer') {
          p.vy = Math.sin(p.osc * 0.7) * 0.55
          p.vx = Math.cos(p.osc * 0.5) * 0.55
          p.x += p.vx; p.y += p.vy
          p.alpha = 0.4 + 0.55 * ((Math.sin(p.osc * 1.6) + 1) / 2)
          if (p.y < -20 || p.y > H2 + 20 || p.x < -20 || p.x > W2 + 20) {
            p.x = Math.random() * W2; p.y = H2 * 0.15 + Math.random() * H2 * 0.7
          }
        } else {
          p.x += p.vx + Math.sin(p.osc) * p.oscAmp
          p.y += p.vy
          if (p.y > H2 + 20) { p.y = -20; p.x = Math.random() * W2 }
          if (p.x >  W2 + 20) p.x = -20
          if (p.x < -20)      p.x =  W2 + 20
        }

        if (season === 'winter')  drawSnowflake(p)
        else if (season === 'spring') drawPetal(p)
        else if (season === 'summer') drawFirefly(p)
        else                          drawLeaf(p)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [month])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}
