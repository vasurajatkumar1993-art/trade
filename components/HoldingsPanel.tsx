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
      <div className={styles.label}>
        <span style={{ color: coin.color }}>●</span> {coin.id} Holdings
      </div>
      <div className={styles.grid}>
        <div>
          <div className={styles.portLabel}>{coin.id} held</div>
          <div className={styles.portVal} style={{ color: coin.color }}>
            {formatCrypto(position.held, coin.decimals)} {coin.id}
          </div>
        </div>
        <div>
          <div className={styles.portLabel}>Current value</div>
          <div className={styles.portVal}>{formatUSD(currentValue)}</div>
        </div>
        <div>
          <div className={styles.portLabel}>Unrealised P&amp;L</div>
          <div className={`${styles.portVal} ${isUp ? styles.green : styles.red}`}>
            {position.held > 0
              ? `${isUp ? '+' : ''}${formatUSD(unrealisedPnL)} (${isUp ? '+' : ''}${pnlPct.toFixed(2)}%)`
              : '—'
            }
          </div>
        </div>
        <div>
          <div className={styles.portLabel}>Total trades</div>
          <div className={styles.portVal}>{totalTrades}</div>
        </div>
      </div>
    </div>
  )
}
