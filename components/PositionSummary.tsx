import { Positions, MarketDataMap, COINS } from '@/lib/types'
import { formatUSD, formatCrypto } from '@/lib/utils'
import styles from './PositionSummary.module.css'

interface Props {
  positions: Positions
  marketData: MarketDataMap
}

export default function PositionSummary({ positions, marketData }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.label}>Positions</div>

      <div className={styles.header}>
        <span>Symbol</span>
        <span>Position</span>
        <span>Avg Price</span>
        <span>Unreal P&amp;L</span>
        <span>Real P&amp;L</span>
        <span>Total Qty</span>
      </div>

      <div className={styles.list}>
        {COINS.map(c => {
          const pos = positions[c.id]
          const price = marketData[c.id].price
          const value = pos.held * price
          const cost = pos.held * pos.avgBuyPrice
          const unrealPnL = value - cost
          const unrealPct = cost > 0 ? (unrealPnL / cost) * 100 : 0
          const isUpUnreal = unrealPnL >= 0
          const isUpReal = pos.realisedPnL >= 0

          return (
            <div key={c.id} className={styles.row}>
              <span className={styles.symbol}>{c.id}</span>
              <span className={styles.val}>
                {pos.held > 0 ? formatCrypto(pos.held, c.decimals) : '—'}
              </span>
              <span className={styles.val}>
                {pos.avgBuyPrice > 0 ? formatUSD(pos.avgBuyPrice) : '—'}
              </span>
              <span className={`${styles.val} ${pos.held > 0 ? (isUpUnreal ? styles.green : styles.red) : ''}`}>
                {pos.held > 0
                  ? `${isUpUnreal ? '+' : ''}${formatUSD(unrealPnL)}`
                  : '—'}
              </span>
              <span className={`${styles.val} ${pos.realisedPnL !== 0 ? (isUpReal ? styles.green : styles.red) : ''}`}>
                {pos.realisedPnL !== 0
                  ? `${isUpReal ? '+' : ''}${formatUSD(pos.realisedPnL)}`
                  : '—'}
              </span>
              <span className={styles.val}>
                {pos.totalQty > 0 ? pos.totalQty.toFixed(c.decimals) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
