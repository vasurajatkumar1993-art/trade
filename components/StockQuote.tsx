import { StockTicker } from '@/lib/types'
import { formatUSD, formatCompact } from '@/lib/utils'
import styles from './StockQuote.module.css'

interface Props {
  stock: StockTicker | null
}

export default function StockQuote({ stock }: Props) {
  if (!stock) {
    return (
      <div className={styles.panel}>
        <div className={styles.label}>Stock Quote</div>
        <div className={styles.empty}>Select a ticker to view details</div>
      </div>
    )
  }

  const isUp = stock.changePct >= 0

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Stock Quote</div>

      <div className={styles.tickerRow}>
        <span className={styles.sym}>{stock.symbol}</span>
        <span className={styles.price}>{formatUSD(stock.price)}</span>
        <span className={`${styles.badge} ${isUp ? styles.up : styles.down}`}>
          {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
        </span>
      </div>

      <div className={styles.name}>{stock.name} · NASDAQ</div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Prev Close</span>
          <span className={styles.statVal}>{formatUSD(stock.prevClose)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Volume</span>
          <span className={styles.statVal}>{formatCompact(stock.volume)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Avg Vol 30d</span>
          <span className={styles.statVal}>{formatCompact(stock.avgVolume30d)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Rel Vol</span>
          <span className={`${styles.statVal} ${stock.relativeVolume >= 3 ? styles.rvolHot : ''}`}>
            {stock.relativeVolume.toFixed(1)}x
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Float</span>
          <span className={styles.statVal}>{stock.float}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Mkt Cap</span>
          <span className={styles.statVal}>{stock.marketCap}</span>
        </div>
      </div>
    </div>
  )
}
