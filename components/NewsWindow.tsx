import { NewsItem } from '@/lib/types'
import styles from './NewsWindow.module.css'

interface Props {
  news: NewsItem[]
  isLive: boolean
  lastUpdate: number | null
}

export default function NewsWindow({ news, isLive, lastUpdate }: Props) {
  const updateTime = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={styles.panel}>
      <div className={styles.headerRow}>
        <div className={styles.label}>News</div>
        <div className={styles.statusRow}>
          {isLive ? (
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </span>
          ) : (
            <span className={styles.simBadge}>SIM</span>
          )}
          {updateTime && <span className={styles.updateTime}>{updateTime}</span>}
        </div>
      </div>

      <div className={styles.list}>
        {news.length === 0 && (
          <div className={styles.empty}>Loading news...</div>
        )}
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
              {n.url ? (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className={styles.headlineLink}>
                  {n.headline}
                </a>
              ) : (
                <div className={styles.headline}>{n.headline}</div>
              )}
              {n.symbols.length > 0 && (
                <div className={styles.symbols}>
                  {n.symbols.map(s => (
                    <span key={s} className={styles.sym}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
