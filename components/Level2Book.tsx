import { Level2Data } from '@/lib/types'
import styles from './Level2Book.module.css'

interface Props {
  data: Level2Data
  currentPrice: number
}

export default function Level2Book({ data, currentPrice }: Props) {
  const maxBidTotal = data.bids.length > 0 ? data.bids[data.bids.length - 1].total : 1
  const maxAskTotal = data.asks.length > 0 ? data.asks[data.asks.length - 1].total : 1

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Level II</div>

      <div className={styles.header}>
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className={styles.book}>
        {/* Asks (reversed so lowest ask is at bottom near spread) */}
        <div className={styles.asks}>
          {[...data.asks].reverse().map((a, i) => (
            <div key={`a-${i}`} className={styles.row}>
              <div
                className={styles.depthBarAsk}
                style={{ width: `${(a.total / maxAskTotal) * 100}%` }}
              />
              <span className={styles.askPrice}>
                {currentPrice > 1000 ? a.price.toFixed(0) : a.price.toFixed(2)}
              </span>
              <span className={styles.size}>{a.size.toFixed(3)}</span>
              <span className={styles.total}>{a.total.toFixed(3)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className={styles.spread}>
          <span className={styles.spreadPrice}>
            {currentPrice > 1000 ? currentPrice.toFixed(0) : currentPrice.toFixed(2)}
          </span>
          <span className={styles.spreadLabel}>Spread</span>
        </div>

        {/* Bids */}
        <div className={styles.bids}>
          {data.bids.map((b, i) => (
            <div key={`b-${i}`} className={styles.row}>
              <div
                className={styles.depthBarBid}
                style={{ width: `${(b.total / maxBidTotal) * 100}%` }}
              />
              <span className={styles.bidPrice}>
                {currentPrice > 1000 ? b.price.toFixed(0) : b.price.toFixed(2)}
              </span>
              <span className={styles.size}>{b.size.toFixed(3)}</span>
              <span className={styles.total}>{b.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
