import { formatUSD } from '@/lib/utils'
import { MarketData, CoinConfig } from '@/lib/types'
import styles from './PricePanel.module.css'

interface Props {
  market: MarketData
  coin: CoinConfig
}

export default function PricePanel({ market, coin }: Props) {
  const isUp = market.change24hPct >= 0
  const arrow = isUp ? '▲' : '▼'
  const sign  = isUp ? '+' : ''

  return (
    <div className={styles.panel}>
      <div className={styles.label}>{coin.id} / USD</div>
      <div className={styles.price} style={{ color: coin.color }}>
        {formatUSD(market.price)}
      </div>
      <div className={`${styles.change} ${isUp ? styles.up : styles.down}`}>
        {arrow} {sign}{market.change24hPct.toFixed(2)}% today
      </div>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          24h High <span>{formatUSD(market.high24h)}</span>
        </div>
        <div className={styles.stat}>
          24h Low <span>{formatUSD(market.low24h)}</span>
        </div>
        <div className={styles.stat}>
          Vol <span>{market.volume24h}</span>
        </div>
      </div>
    </div>
  )
}
