'use client'

import { useRef, useEffect } from 'react'
import { Candle, CoinConfig, Timeframe } from '@/lib/types'
import styles from './CandlestickChart.module.css'

interface Props {
  candles: Candle[]
  coin: CoinConfig
  timeframe: Timeframe
  onTimeframeChange: (tf: Timeframe) => void
}

const TIMEFRAMES: Timeframe[] = ['1m', '1H', '4H', '1D']

export default function CandlestickChart({ candles, coin, timeframe, onTimeframeChange }: Props) {
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
    const PAD_RIGHT = 56

    ctx.clearRect(0, 0, W, H)

    const prices = candles.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1

    const chartW = W - PAD_RIGHT
    const chartH = H - PAD_TOP - PAD_BOT
    const candleW = Math.max(2, (chartW / candles.length) * 0.6)
    const gap = chartW / candles.length

    function yPos(price: number): number {
      return PAD_TOP + chartH - ((price - minP) / range) * chartH
    }

    // Grid
    const gridSteps = 5
    ctx.font = '12px DM Mono, SF Mono, monospace'
    ctx.textAlign = 'right'

    for (let i = 0; i <= gridSteps; i++) {
      const price = minP + (range / gridSteps) * i
      const y = yPos(price)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(chartW, y)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
      ctx.fillText(price >= 1000 ? price.toFixed(0) : price.toFixed(2), W - 4, y + 4)
    }

    // Time labels
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
    const labelInterval = Math.max(1, Math.floor(candles.length / 6))
    for (let i = 0; i < candles.length; i += labelInterval) {
      const x = i * gap + gap / 2
      const date = new Date(candles[i].time)
      let label: string
      if (timeframe === '1m' || timeframe === '1H') {
        label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else {
        label = `${date.getDate()}/${date.getMonth() + 1}`
      }
      ctx.fillText(label, x, H - 8)
    }

    // Candles
    const green = '#30d158'
    const red = '#ff453a'

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const isUp = c.close >= c.open
      const color = isUp ? green : red

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yPos(c.high))
      ctx.lineTo(x, yPos(c.low))
      ctx.stroke()

      const bodyTop = yPos(Math.max(c.open, c.close))
      const bodyBot = yPos(Math.min(c.open, c.close))
      const bodyH = Math.max(1, bodyBot - bodyTop)

      ctx.fillStyle = color
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH)
    }

    // Current price line
    const lastPrice = candles[candles.length - 1].close
    const lastY = yPos(lastPrice)

    ctx.setLineDash([3, 3])
    ctx.strokeStyle = 'rgba(41, 151, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, lastY)
    ctx.lineTo(chartW, lastY)
    ctx.stroke()
    ctx.setLineDash([])

    // Price badge
    const badgeW = 52
    const badgeH = 22
    const badgeX = chartW + 2
    const badgeY = lastY - badgeH / 2
    ctx.fillStyle = '#2997ff'
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.font = '500 12px DM Mono, SF Mono, monospace'
    ctx.fillText(
      lastPrice >= 1000 ? lastPrice.toFixed(0) : lastPrice.toFixed(2),
      badgeX + badgeW / 2,
      lastY + 4
    )

  }, [candles, coin, timeframe])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.label}>{coin.id}/USD</div>
        <div className={styles.timeframes}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              className={`${styles.tf} ${tf === timeframe ? styles.tfActive : ''}`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}
