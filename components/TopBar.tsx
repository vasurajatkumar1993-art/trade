import styles from './TopBar.module.css'

export default function TopBar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.logo}>TradeX</div>
      <div className={styles.badge}>
        <div className={styles.dot} />
        Momentum Scanner
      </div>
    </div>
  )
}
