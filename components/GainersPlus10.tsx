import { StockTicker } from '@/lib/types'
import { formatCompact } from '@/lib/utils'
import styles from './GainersPlus10.module.css'

interface Props {
  stocks: StockTicker[]
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
}

function isASetup(s: StockTicker): boolean {
  return (
    s.floatNum < 20e6 &&
    s.relativeVolume >= 5 &&
    s.price >= 2 && s.price <= 10 &&
    s.changePct >= 10
  )
}

export default function GainersPlus10({ stocks, selectedSymbol, onSelect }: Props) {
  const filtered = [...stocks]
    .filter(s => s.changePct >= 10)
    .sort((a, b) => {
      const aSetup = isASetup(a) ? 1 : 0
      const bSetup = isASetup(b) ? 1 : 0
      if (bSetup !== aSetup) return bSetup - aSetup
      return b.changePct - a.changePct
    })

  const setupCount = filtered.filter(isASetup).length

  return (
    <div className={styles.panel}>
      <div className={styles.labelRow}>
        <div className={styles.label}>10%+ Movers</div>
        <div className={styles.counts}>
          {setupCount > 0 && (
            <span className={styles.setupCount}>{setupCount} A+</span>
          )}
          <span className={styles.count}>{filtered.length} total</span>
        </div>
      </div>

      <div className={styles.header}>
        <span></span>
        <span>Symbol</span>
        <span>Price</span>
        <span>Chg%</span>
        <span>RVOL</span>
        <span>Float</span>
        <span>Avg Vol</span>
        <span>Volume</span>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No stocks above 10% currently</div>
        )}
        {filtered.map(s => {
          const setup = isASetup(s)

          return (
            <div
              key={s.symbol}
              className={`${styles.row} ${selectedSymbol === s.symbol ? styles.selected : ''} ${setup ? styles.setupRow : ''}`}
              onClick={() => onSelect(s.symbol)}
            >
              <span className={styles.badgeCol}>
                {setup && <span className={styles.setupBadge}>A+</span>}
              </span>
              <span className={styles.sym}>{s.symbol}</span>
              <span className={styles.price}>${s.price.toFixed(2)}</span>
              <span className={styles.pct}>+{s.changePct.toFixed(1)}%</span>
              <span className={`${styles.rvol} ${s.relativeVolume >= 5 ? styles.rvolHot : ''}`}>
                {s.relativeVolume.toFixed(1)}x
              </span>
              <span className={`${styles.floatVal} ${s.floatNum < 20e6 ? styles.floatLow : ''}`}>
                {s.float}
              </span>
              <span className={styles.avgVol}>{formatCompact(s.avgVolume30d)}</span>
              <span className={styles.vol}>{formatCompact(s.volume)}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendBadge}>A+</span>
        <span className={styles.legendText}>Float &lt;20M · RVOL 5x+ · $2–10 · Up 10%+</span>
      </div>
    </div>
  )
}
