import { Position, CoinConfig } from '@/lib/types'
import { formatUSD, formatCrypto } from '@/lib/utils'
import styles from './HoldingsPanel.module.css'

interface Props {
  position: Position
  coin: CoinConfig
  price: number
  totalTrades: number
}

export default function HoldingsPanel({ position, coin, price, totalTrades }: Props) {
  const currentValue  = position.held * price
  const costBasis     = position.held * position.avgBuyPrice
  const unrealisedPnL = currentValue - costBasis
  const pnlPct        = costBasis > 0 ? (unrealisedPnL / costBasis) * 100 : 0
  const isUp          = unrealisedPnL >= 0

  return (
    <div className={styles.panel}>
      <div className={styles.label}>{coin.id} Position</div>
      <div className={styles.grid}>
        <div className={styles.item}>
          <div className={styles.itemLabel}>Holding</div>
          <div className={styles.itemVal}>{formatCrypto(position.held, coin.decimals)} {coin.id}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.itemLabel}>Value</div>
          <div className={styles.itemVal}>{formatUSD(currentValue)}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.itemLabel}>P&amp;L</div>
          <div className={`${styles.itemVal} ${isUp ? styles.green : styles.red}`}>
            {position.held > 0
              ? `${isUp ? '+' : ''}${formatUSD(unrealisedPnL)} (${pnlPct.toFixed(1)}%)`
              : '—'}
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.itemLabel}>Trades</div>
          <div className={styles.itemVal}>{totalTrades}</div>
        </div>
      </div>
    </div>
  )
}
