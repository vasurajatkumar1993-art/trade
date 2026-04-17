'use client'

import { StockTicker } from '@/lib/types'
import { formatCompact } from '@/lib/utils'
import styles from './GainersPlus10.module.css'

interface Props {
  stocks: StockTicker[]
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
}

export default function GainersPlus10({ stocks, selectedSymbol, onSelect }: Props) {
  const filtered = [...stocks]
    .filter(s => s.changePct >= 10)
    .sort((a, b) => b.changePct - a.changePct)

  return (
    <div className={styles.panel}>
      <div className={styles.labelRow}>
        <div className={styles.label}>10%+ Movers</div>
        <div className={styles.count}>{filtered.length} stocks</div>
      </div>

      <div className={styles.header}>
        <span>Symbol</span>
        <span>Price</span>
        <span>Change</span>
        <span>RVOL</span>
        <span>Float</span>
        <span>Avg Vol</span>
        <span>Volume</span>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No stocks above 10% currently</div>
        )}
        {filtered.map(s => (
          <div
            key={s.symbol}
            className={`${styles.row} ${selectedSymbol === s.symbol ? styles.selected : ''}`}
            onClick={() => onSelect(s.symbol)}
          >
            <span className={styles.sym}>{s.symbol}</span>
            <span className={styles.price}>${s.price.toFixed(2)}</span>
            <span className={styles.pct}>+{s.changePct.toFixed(1)}%</span>
            <span className={`${styles.rvol} ${s.relativeVolume >= 3 ? styles.rvolHot : ''}`}>
              {s.relativeVolume.toFixed(1)}x
            </span>
            <span className={styles.floatVal}>{s.float}</span>
            <span className={styles.avgVol}>{formatCompact(s.avgVolume30d)}</span>
            <span className={styles.vol}>{formatCompact(s.volume)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
