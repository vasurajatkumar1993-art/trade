import styles from './TopBar.module.css'

export default function TopBar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.logo}>◈ TRADEX</div>
      <div className={styles.badge}>
        <div className={styles.dot} />
        SIMULATED · PAPER MODE
      </div>
    </div>
  )
}
