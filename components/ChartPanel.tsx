'use client'

import { useRef, useEffect } from 'react'
import { Candle, ChartTimeframe } from '@/lib/types'
import styles from './ChartPanel.module.css'

interface ChartViewProps {
  candles: Candle[]
  label: string
  symbol: string
}

function ChartView({ candles, label, symbol }: ChartViewProps) {
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
    const PAD_TOP = 8
    const PAD_RIGHT = 48
    const VOL_H = Math.round(H * 0.18)
    const TIME_H = 16
    const CANDLE_BOT = H - VOL_H - 4 - TIME_H
    const chartH = CANDLE_BOT - PAD_TOP

    ctx.clearRect(0, 0, W, H)

    const prices = candles.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1
    const maxVol = Math.max(...candles.map(c => c.volume), 1)

    const chartW = W - PAD_RIGHT
    const candleW = Math.max(1.5, (chartW / candles.length) * 0.6)
    const gap = chartW / candles.length

    function yPos(price: number): number {
      return PAD_TOP + chartH - ((price - minP) / range) * chartH
    }

    const green = '#30d158'
    const red = '#ff453a'

    // Grid
    ctx.font = '10px DM Mono, monospace'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const price = minP + (range / 4) * i
      const y = yPos(price)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillText(price.toFixed(2), W - 2, y + 3)
    }

    // Candles
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const isUp = c.close >= c.open
      const color = isUp ? green : red

      ctx.strokeStyle = color; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, yPos(c.high)); ctx.lineTo(x, yPos(c.low)); ctx.stroke()

      const bodyTop = yPos(Math.max(c.open, c.close))
      const bodyBot = yPos(Math.min(c.open, c.close))
      ctx.fillStyle = color
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, Math.max(1, bodyBot - bodyTop))
    }

    // Volume
    const volTop = CANDLE_BOT + 4
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const x = i * gap + gap / 2
      const barH = Math.max(1, (c.volume / maxVol) * VOL_H)
      ctx.fillStyle = c.close >= c.open ? 'rgba(48,209,88,0.2)' : 'rgba(255,69,58,0.2)'
      ctx.fillRect(x - candleW / 2, volTop + VOL_H - barH, candleW, barH)
    }

    // Price line
    const last = candles[candles.length - 1].close
    const ly = yPos(last)
    ctx.setLineDash([2, 2])
    ctx.strokeStyle = 'rgba(41,151,255,0.4)'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(chartW, ly); ctx.stroke()
    ctx.setLineDash([])

  }, [candles])

  return (
    <div className={styles.chartView}>
      <div className={styles.chartLabel}>
        <span className={styles.chartSym}>{symbol}</span>
        <span className={styles.chartTf}>{label}</span>
      </div>
      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  )
}

interface Props {
  symbol: string | null
  candleData: Record<ChartTimeframe, Candle[]> | null
}

export default function ChartPanel({ symbol, candleData }: Props) {
  if (!symbol || !candleData) {
    return (
      <div className={styles.panel}>
        <div className={styles.placeholderGrid}>
          {['1 min', '5 min', 'Daily'].map(tf => (
            <div key={tf} className={styles.placeholder}>
              <div className={styles.phTf}>{tf}</div>
              <div className={styles.phText}>Click a ticker above to load chart details</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.chartGrid}>
        <ChartView candles={candleData['1m']} label="1 Min" symbol={symbol} />
        <ChartView candles={candleData['5m']} label="5 Min" symbol={symbol} />
        <ChartView candles={candleData['1D']} label="Daily" symbol={symbol} />
      </div>
    </div>
  )
}
