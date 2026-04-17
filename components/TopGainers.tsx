import { StockTicker } from '@/lib/types'
import styles from './TopGainers.module.css'

interface Props {
  stocks: StockTicker[]
}

export default function TopGainers({ stocks }: Props) {
  const sorted = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 10)

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Top Gainers</div>

      <div className={styles.header}>
        <span>Symbol</span>
        <span>Price</span>
        <span>Change %</span>
        <span>AH %</span>
        <span>PM %</span>
        <span>Volume</span>
        <span>Float</span>
      </div>

      <div className={styles.list}>
        {sorted.map((s, i) => {
          const isUp = s.changePct >= 0
          const heatClass = s.changePct >= 20 ? styles.heat3 : s.changePct >= 10 ? styles.heat2 : s.changePct >= 5 ? styles.heat1 : ''

          return (
            <div key={s.symbol} className={`${styles.row} ${heatClass}`}>
              <span className={styles.sym}>{s.symbol}</span>
              <span className={styles.price}>${s.price.toFixed(2)}</span>
              <span className={`${styles.pct} ${isUp ? styles.green : styles.red}`}>
                {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
              </span>
              <span className={`${styles.smallPct} ${s.afterHoursPct >= 0 ? styles.green : styles.red}`}>
                {s.afterHoursPct >= 0 ? '+' : ''}{s.afterHoursPct.toFixed(1)}%
              </span>
              <span className={`${styles.smallPct} ${s.preMarketPct >= 0 ? styles.green : styles.red}`}>
                {s.preMarketPct >= 0 ? '+' : ''}{s.preMarketPct.toFixed(1)}%
              </span>
              <span className={styles.vol}>{(s.volume / 1e6).toFixed(1)}M</span>
              <span className={styles.floatVal}>{s.float}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
