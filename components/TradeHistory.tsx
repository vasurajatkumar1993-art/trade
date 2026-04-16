import { TradeRecord, COINS } from '@/lib/types'
import { formatUSD } from '@/lib/utils'
import styles from './TradeHistory.module.css'

interface Props {
  trades: TradeRecord[]
}

export default function TradeHistory({ trades }: Props) {
  const coin = (id: string) => COINS.find(c => c.id === id)

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Trade history</div>

      {trades.length === 0 ? (
        <div className={styles.empty}>
          No trades yet — place your first order.
        </div>
      ) : (
        <div className={styles.list}>
          <div className={styles.header}>
            <span>Time</span>
            <span>Pair</span>
            <span>Side</span>
            <span>Amount</span>
            <span>Price</span>
            <span>Total</span>
          </div>
          {[...trades].reverse().map(t => {
            const c = coin(t.coin)
            const d = new Date(t.timestamp)
            const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
            return (
              <div key={t.id} className={styles.row}>
                <span className={styles.time}>{time}</span>
                <span style={{ color: c?.color }}>{t.coin}/USD</span>
                <span className={t.mode === 'buy' ? styles.buy : styles.sell}>
                  {t.mode.toUpperCase()}
                </span>
                <span>{t.amount.toFixed(c?.decimals ?? 5)}</span>
                <span>{formatUSD(t.price)}</span>
                <span>{formatUSD(t.total)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
