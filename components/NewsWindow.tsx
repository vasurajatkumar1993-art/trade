import { NewsItem } from '@/lib/types'
import styles from './NewsWindow.module.css'

interface Props {
  news: NewsItem[]
}

export default function NewsWindow({ news }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.label}>News</div>
      <div className={styles.list}>
        {news.map(n => {
          const d = new Date(n.time)
          const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
          return (
            <div key={n.id} className={styles.item}>
              <div className={styles.meta}>
                <span className={styles.time}>{time}</span>
                <span className={styles.source}>{n.source}</span>
                {n.isHot && <span className={styles.hot}>HOT</span>}
              </div>
              <div className={styles.headline}>{n.headline}</div>
              <div className={styles.symbols}>
                {n.symbols.map(s => (
                  <span key={s} className={styles.sym}>{s}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
