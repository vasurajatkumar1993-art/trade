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
      <div className={styles.label}>History</div>

      {trades.length === 0 ? (
        <div className={styles.empty}>No trades yet</div>
      ) : (
        <div className={styles.list}>
          {[...trades].reverse().map(t => {
            const c = coin(t.coin)
            const d = new Date(t.timestamp)
            const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            return (
              <div key={t.id} className={styles.row}>
                <div className={styles.rowLeft}>
                  <span className={t.mode === 'buy' ? styles.buy : styles.sell}>
                    {t.mode === 'buy' ? '+' : '-'}{t.amount.toFixed(c?.decimals ?? 5)} {t.coin}
                  </span>
                  <span className={styles.time}>{time}</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.total}>{formatUSD(t.total)}</span>
                  <span className={styles.price}>@ {formatUSD(t.price)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
