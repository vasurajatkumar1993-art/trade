import { formatUSD } from '@/lib/utils'
import { MarketData, CoinConfig } from '@/lib/types'
import styles from './PricePanel.module.css'

interface Props {
  market: MarketData
  coin: CoinConfig
}

export default function PricePanel({ market, coin }: Props) {
  const isUp = market.change24hPct >= 0

  return (
    <div className={styles.panel}>
      <div className={styles.label}>{coin.name}</div>
      <div className={styles.row}>
        <div className={styles.price}>{formatUSD(market.price)}</div>
        <div className={`${styles.badge} ${isUp ? styles.up : styles.down}`}>
          {isUp ? '+' : ''}{market.change24hPct.toFixed(2)}%
        </div>
      </div>
      <div className={styles.stats}>
        <span>H {formatUSD(market.high24h)}</span>
        <span>L {formatUSD(market.low24h)}</span>
        <span>Vol {market.volume24h}</span>
      </div>
    </div>
  )
}
