import { TimeSaleEntry } from '@/lib/types'
import styles from './TimeSales.module.css'

interface Props {
  entries: TimeSaleEntry[]
}

export default function TimeSales({ entries }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.label}>Time &amp; Sales</div>

      <div className={styles.header}>
        <span>Time</span>
        <span>Price</span>
        <span>Size</span>
      </div>

      <div className={styles.list}>
        {entries.map(e => {
          const d = new Date(e.time)
          const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
          return (
            <div key={e.id} className={styles.row}>
              <span className={styles.time}>{time}</span>
              <span className={e.side === 'buy' ? styles.buy : styles.sell}>
                {e.price > 1000 ? e.price.toFixed(0) : e.price.toFixed(2)}
              </span>
              <span className={styles.size}>{e.size.toFixed(4)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
