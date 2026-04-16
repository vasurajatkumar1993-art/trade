'use client'

import { useEffect, useState } from 'react'
import { PriceAlert, COINS } from '@/lib/types'
import { formatUSD } from '@/lib/utils'
import styles from './AlertToast.module.css'

interface Props {
  alerts: PriceAlert[]
}

interface Toast {
  id: string
  message: string
  color: string
  timestamp: number
}

export default function AlertToast({ alerts }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [seen, setSeen]     = useState<Set<string>>(new Set())

  useEffect(() => {
    const newTriggered = alerts.filter(a => a.triggered && !seen.has(a.id))
    if (newTriggered.length === 0) return

    const newToasts = newTriggered.map(a => {
      const coin = COINS.find(c => c.id === a.coin)!
      const dir = a.condition === 'above' ? 'rose above' : 'dropped below'
      return {
        id: a.id,
        message: `${coin.id} ${dir} ${formatUSD(a.targetPrice)}`,
        color: coin.color,
        timestamp: Date.now(),
      }
    })

    setSeen(prev => {
      const next = new Set(prev)
      newTriggered.forEach(a => next.add(a.id))
      return next
    })

    setToasts(prev => [...prev, ...newToasts])

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t =>
        Date.now() - t.timestamp < 5000
      ))
    }, 5000)

    return () => clearTimeout(timer)
  }, [alerts, seen])

  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={styles.toast}
          style={{ borderLeftColor: t.color }}
        >
          <span className={styles.icon}>🔔</span>
          <span className={styles.message}>{t.message}</span>
          <button
            className={styles.dismiss}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
