'use client'

import { useState } from 'react'
import { OrderMode, CoinConfig, Position } from '@/lib/types'
import { formatUSD, formatCrypto } from '@/lib/utils'
import styles from './TradePanel.module.css'

interface Props {
  coin: CoinConfig
  price: number
  usdBalance: number
  position: Position
  onTrade: (mode: OrderMode, amount: number) => void
}

export default function TradePanel({ coin, price, usdBalance, position, onTrade }: Props) {
  const [mode, setMode]     = useState<OrderMode>('buy')
  const [amount, setAmount] = useState<string>('0.01000')
  const [flash, setFlash]   = useState(false)

  const numAmount = parseFloat(amount) || 0
  const total     = numAmount * price
  const fee       = total * 0.001

  function handleSetPct(pct: number) {
    const max = mode === 'buy'
      ? usdBalance / price
      : position.held
    setAmount(((max * pct) / 100).toFixed(coin.decimals))
  }

  function handlePlaceOrder() {
    if (numAmount <= 0) return
    if (mode === 'buy'  && total + fee > usdBalance) return
    if (mode === 'sell' && numAmount > position.held) return

    onTrade(mode, numAmount)
    setAmount((0).toFixed(coin.decimals))
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }

  const canTrade = mode === 'buy'
    ? total + fee <= usdBalance && numAmount > 0
    : numAmount <= position.held && numAmount > 0

  return (
    <div className={styles.panel}>
      <div className={styles.label}>Place order · <span style={{ color: coin.color }}>{coin.id}</span></div>

      <div className={styles.tabRow}>
        <button
          className={`${styles.tab} ${mode === 'buy' ? styles.buyActive : ''}`}
          onClick={() => setMode('buy')}
        >
          Buy
        </button>
        <button
          className={`${styles.tab} ${mode === 'sell' ? styles.sellActive : ''}`}
          onClick={() => setMode('sell')}
        >
          Sell
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>
          Price <span className={styles.hint}>Market</span>
        </div>
        <div className={styles.inputWrap}>
          <input type="text" readOnly value={price.toLocaleString('en-US', { minimumFractionDigits: 2 })} className={styles.input} />
          <span className={styles.unit}>USD</span>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.fieldLabel}>Amount</div>
        <div className={styles.inputWrap}>
          <input
            type="number"
            step={Math.pow(10, -coin.decimals)}
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={styles.input}
          />
          <span className={styles.unit}>{coin.id}</span>
        </div>
      </div>

      <div className={styles.pctRow}>
        {[25, 50, 75, 100].map(p => (
          <button key={p} className={styles.pctBtn} onClick={() => handleSetPct(p)}>
            {p === 100 ? 'Max' : `${p}%`}
          </button>
        ))}
      </div>

      <button
        className={`${styles.orderBtn} ${mode === 'buy' ? styles.buyBtn : styles.sellBtn}`}
        onClick={handlePlaceOrder}
        disabled={!canTrade}
      >
        {flash
          ? (mode === 'buy' ? 'Order placed ✓' : 'Sold ✓')
          : (mode === 'buy' ? `Buy ${coin.id}` : `Sell ${coin.id}`)}
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Total</span>
          <span className={styles.val}>{formatUSD(total)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Fee (0.1%)</span>
          <span className={styles.val}>{formatUSD(fee)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Order type</span>
          <span className={styles.val}>Market</span>
        </div>
        {!canTrade && numAmount > 0 && (
          <div className={styles.warn}>
            {mode === 'buy' ? 'Insufficient USD balance' : `Insufficient ${coin.id} balance`}
          </div>
        )}
      </div>
    </div>
  )
}
