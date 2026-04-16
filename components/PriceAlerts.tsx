'use client'

import { useState } from 'react'
import { PriceAlert, AlertCondition, CoinId, COINS } from '@/lib/types'
import { formatUSD, uid } from '@/lib/utils'
import styles from './PriceAlerts.module.css'

interface Props {
  alerts: PriceAlert[]
  activeCoin: CoinId
  currentPrice: number
  onAddAlert: (alert: PriceAlert) => void
  onRemoveAlert: (id: string) => void
}

export default function PriceAlerts({ alerts, activeCoin, currentPrice, onAddAlert, onRemoveAlert }: Props) {
  const [targetPrice, setTargetPrice] = useState('')
  const [condition, setCondition]     = useState<AlertCondition>('above')
  const [showForm, setShowForm]       = useState(false)

  const coinAlerts = alerts.filter(a => a.coin === activeCoin)
  const coin = COINS.find(c => c.id === activeCoin)!

  function handleAdd() {
    const price = parseFloat(targetPrice)
    if (!price || price <= 0) return

    onAddAlert({
      id: uid(),
      coin: activeCoin,
      condition,
      targetPrice: price,
      triggered: false,
      createdAt: Date.now(),
    })
    setTargetPrice('')
    setShowForm(false)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.label}>Alerts</div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.condRow}>
            <button
              className={`${styles.condBtn} ${condition === 'above' ? styles.condActive : ''}`}
              onClick={() => setCondition('above')}
            >
              Above
            </button>
            <button
              className={`${styles.condBtn} ${condition === 'below' ? styles.condActive : ''}`}
              onClick={() => setCondition('below')}
            >
              Below
            </button>
          </div>
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <input
                type="number"
                placeholder={currentPrice.toFixed(0)}
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className={styles.input}
              />
              <span className={styles.unit}>USD</span>
            </div>
            <button className={styles.setBtn} onClick={handleAdd}>Set</button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {coinAlerts.length === 0 && !showForm && (
          <div className={styles.empty}>No alerts for {activeCoin}</div>
        )}
        {coinAlerts.map(a => (
          <div
            key={a.id}
            className={`${styles.alertItem} ${a.triggered ? styles.triggered : ''}`}
          >
            <div className={styles.alertInfo}>
              <span className={a.triggered ? styles.bellActive : styles.bell}>
                {a.triggered ? '🔔' : '○'}
              </span>
              <span className={styles.alertText}>
                {a.condition === 'above' ? '↑' : '↓'} {formatUSD(a.targetPrice)}
              </span>
            </div>
            <button className={styles.removeBtn} onClick={() => onRemoveAlert(a.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
