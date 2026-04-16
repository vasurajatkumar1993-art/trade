import { Positions, MarketDataMap, COINS } from '@/lib/types'
import { formatUSD, formatCrypto } from '@/lib/utils'
import styles from './BalancePanel.module.css'

interface Props {
  usdBalance: number
  positions: Positions
  marketData: MarketDataMap
}

export default function BalancePanel({ usdBalance, positions, marketData }: Props) {
  const holdingsValue = COINS.reduce((sum, c) => {
    return sum + positions[c.id].held * marketData[c.id].price
  }, 0)
  const total = usdBalance + holdingsValue

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Portfolio balance</div>
      <div className={styles.amount}>{formatUSD(total)}</div>
      <div className={styles.sub}>
        <div className={styles.item}>
          USD <span>{formatUSD(usdBalance)}</span>
        </div>
        {COINS.map(c => {
          const held = positions[c.id].held
          if (held <= 0) return null
          return (
            <div key={c.id} className={styles.item}>
              {c.id} <span style={{ color: c.color }}>{formatCrypto(held, c.decimals)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
