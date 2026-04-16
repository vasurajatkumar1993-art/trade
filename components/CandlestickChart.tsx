'use client'

import { useRef, useEffect } from 'react'
import { Candle, CoinConfig } from '@/lib/types'
import styles from './CandlestickChart.module.css'

interface Props {
  candles: Candle[]
  coin: CoinConfig
}

export default function CandlestickChart({ candles, coin }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || candles.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const PAD_TOP = 16
    const PAD_BOT = 28
    const PAD_RIGHT = 60

    ctx.clearRect(0, 0, W, H)

    const prices = candles.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1

    const chartW = W - PAD_RIGHT
    const chartH = H - PAD_TOP - PAD_BOT
    const candleW = Math.max(2, (chartW / candles.length) * 0.65)
    const gap = chartW / candles.length

    function yPos(price: number): number {
      return PAD_TOP + chartH - ((price - minP) / range) * chartH
    }

    // Grid lines
    const gridSteps = 5
    ctx.strokeStyle = '#1e2130'
    ctx.lineWidth = 0.5
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillStyle = '#4a5068'
    ctx.textAlign = 'right'

    for (let i = 0; i <= gridSteps; i++) {
      const price = minP + (range / gridSteps) * i
      const y = yPos(price)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(chartW, y)
      ctx.stroke()
      ctx.fillText(price >= 1000 ? price.toFixed(0) : price.toFixed(2), W - 4, y + 3)
    }

    // Time labels
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4a5068'
    const labelInterval = Math.max(1, Math.floor(candles.length / 6))
    for (let i = 0; i < candles.length; i += labelInterval) {
      const x = i * gap + gap / 2
      const date = new Date(candles[i].time)
      const label = `${date.getHours().toString().padStart(2, '0')}:00`
      ctx.fillText(label, x, H - 6)
    }

    // Candles
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const isUp = c.close >= c.open

      const green = '#4caf7d'
      const red = '#e54848'
      const color = isUp ? green : red

      // Wick
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yPos(c.high))
      ctx.lineTo(x, yPos(c.low))
      ctx.stroke()

      // Body
      const bodyTop = yPos(Math.max(c.open, c.close))
      const bodyBot = yPos(Math.min(c.open, c.close))
      const bodyH = Math.max(1, bodyBot - bodyTop)

      ctx.fillStyle = color
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
    }

    // Current price line
    const lastPrice = candles[candles.length - 1].close
    const lastY = yPos(lastPrice)
    ctx.setLineDash([4, 3])
    ctx.strokeStyle = coin.color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, lastY)
    ctx.lineTo(chartW, lastY)
    ctx.stroke()
    ctx.setLineDash([])

    // Price badge
    ctx.fillStyle = coin.color
    const badgeW = 56
    ctx.fillRect(chartW + 2, lastY - 10, badgeW, 20)
    ctx.fillStyle = '#0d0f14'
    ctx.textAlign = 'center'
    ctx.font = 'bold 10px JetBrains Mono, monospace'
    ctx.fillText(
      lastPrice >= 1000 ? lastPrice.toFixed(0) : lastPrice.toFixed(2),
      chartW + 2 + badgeW / 2,
      lastY + 4
    )

  }, [candles, coin])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.label}>
          <span style={{ color: coin.color }}>●</span> {coin.id}/USD · 1H
        </div>
        <div className={styles.timeframes}>
          <span className={styles.tfActive}>1H</span>
          <span className={styles.tf}>4H</span>
          <span className={styles.tf}>1D</span>
        </div>
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}
