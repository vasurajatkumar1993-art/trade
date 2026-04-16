import { CoinId, CoinConfig, MarketDataMap } from '@/lib/types'
import { formatUSD } from '@/lib/utils'
import styles from './CoinSelector.module.css'

interface Props {
  coins: CoinConfig[]
  activeCoin: CoinId
  marketData: MarketDataMap
  onSelect: (id: CoinId) => void
}

export default function CoinSelector({ coins, activeCoin, marketData, onSelect }: Props) {
  return (
    <div className={styles.bar}>
      {coins.map(c => {
        const m = marketData[c.id]
        const active = c.id === activeCoin
        const isUp = m.change24hPct >= 0

        return (
          <button
            key={c.id}
            className={`${styles.coin} ${active ? styles.active : ''}`}
            onClick={() => onSelect(c.id)}
            style={active ? { borderColor: c.color } : undefined}
          >
            <div className={styles.top}>
              <span className={styles.symbol} style={{ color: c.color }}>●</span>
              <span className={styles.name}>{c.id}</span>
              <span className={`${styles.pct} ${isUp ? styles.up : styles.down}`}>
                {isUp ? '+' : ''}{m.change24hPct.toFixed(2)}%
              </span>
            </div>
            <div className={styles.price}>{formatUSD(m.price)}</div>
          </button>
        )
      })}
    </div>
  )
}
