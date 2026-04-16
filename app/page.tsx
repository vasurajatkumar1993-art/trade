'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  OrderMode, CoinId, COINS,
  Positions, MarketDataMap, TradeRecord, Candle, PriceAlert,
} from '@/lib/types'
import { uid, generateCandles, getInitialMarket } from '@/lib/utils'
import TopBar from '@/components/TopBar'
import CoinSelector from '@/components/CoinSelector'
import BalancePanel from '@/components/BalancePanel'
import PricePanel from '@/components/PricePanel'
import TradePanel from '@/components/TradePanel'
import CandlestickChart from '@/components/CandlestickChart'
import HoldingsPanel from '@/components/HoldingsPanel'
import TradeHistory from '@/components/TradeHistory'
import PriceAlerts from '@/components/PriceAlerts'
import AlertToast from '@/components/AlertToast'
import styles from './page.module.css'

const INITIAL_USD = 50000

const INITIAL_POSITIONS: Positions = {
  BTC:  { held: 0, avgBuyPrice: 0 },
  ETH:  { held: 0, avgBuyPrice: 0 },
  SOL:  { held: 0, avgBuyPrice: 0 },
  AVAX: { held: 0, avgBuyPrice: 0 },
}

export default function DashboardPage() {
  const [activeCoin, setActiveCoin] = useState<CoinId>('BTC')
  const [marketData, setMarketData] = useState<MarketDataMap>(getInitialMarket())
  const [usdBalance, setUsdBalance] = useState(INITIAL_USD)
  const [positions, setPositions]   = useState<Positions>(INITIAL_POSITIONS)
  const [trades, setTrades]         = useState<TradeRecord[]>([])
  const [alerts, setAlerts]         = useState<PriceAlert[]>([])

  const coin       = COINS.find(c => c.id === activeCoin)!
  const market     = marketData[activeCoin]
  const position   = positions[activeCoin]
  const totalTrades = trades.length

  // Generate candle data per coin (memoized)
  const candleMap = useMemo(() => {
    const map: Record<CoinId, Candle[]> = {} as Record<CoinId, Candle[]>
    const initial = getInitialMarket()
    COINS.forEach(c => {
      map[c.id] = generateCandles(initial[c.id].price, 48)
    })
    return map
  }, [])

  const [candles, setCandles] = useState(candleMap)

  // Simulate live price ticks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          const m = prev[c.id]
          const volatility = m.price * 0.002
          const delta = (Math.random() - 0.48) * volatility
          const newPrice = Math.round((m.price + delta) * 100) / 100
          const openPrice = candles[c.id][0]?.open || m.price
          const change = ((newPrice - openPrice) / openPrice) * 100

          updated[c.id] = {
            ...m,
            price: newPrice,
            change24hPct: Math.round(change * 100) / 100,
            high24h: Math.max(m.high24h, newPrice),
            low24h: Math.min(m.low24h, newPrice),
          }
        })
        return updated
      })

      // Update candles
      setCandles(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          const arr = [...prev[c.id]]
          const last = arr[arr.length - 1]
          const now = Date.now()

          if (now - last.time > 3600000) {
            const currentPrice = marketData[c.id].price
            arr.push({
              time: now,
              open: currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
            })
            if (arr.length > 60) arr.shift()
          } else {
            const currentPrice = marketData[c.id].price
            arr[arr.length - 1] = {
              ...last,
              high: Math.max(last.high, currentPrice),
              low: Math.min(last.low, currentPrice),
              close: currentPrice,
            }
          }

          updated[c.id] = arr
        })
        return updated
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [candles, marketData])

  // Check price alerts on every market update
  useEffect(() => {
    setAlerts(prev => {
      let changed = false
      const updated = prev.map(a => {
        if (a.triggered) return a
        const price = marketData[a.coin].price
        const hit =
          (a.condition === 'above' && price >= a.targetPrice) ||
          (a.condition === 'below' && price <= a.targetPrice)
        if (hit) {
          changed = true
          return { ...a, triggered: true }
        }
        return a
      })
      return changed ? updated : prev
    })
  }, [marketData])

  function handleTrade(mode: OrderMode, amount: number) {
    const price = marketData[activeCoin].price
    const cost  = amount * price
    const fee   = cost * 0.001

    if (mode === 'buy') {
      const totalCost = cost + fee
      if (totalCost > usdBalance) return

      setUsdBalance(prev => prev - totalCost)
      setPositions(prev => {
        const pos = prev[activeCoin]
        const newHeld = pos.held + amount
        const newAvg  = pos.held > 0
          ? (pos.held * pos.avgBuyPrice + cost) / newHeld
          : price
        return {
          ...prev,
          [activeCoin]: { held: newHeld, avgBuyPrice: newAvg },
        }
      })
    } else {
      if (amount > position.held) return

      const proceeds = cost - fee
      setUsdBalance(prev => prev + proceeds)
      setPositions(prev => ({
        ...prev,
        [activeCoin]: {
          ...prev[activeCoin],
          held: prev[activeCoin].held - amount,
        },
      }))
    }

    setTrades(prev => [
      ...prev,
      {
        id: uid(),
        timestamp: Date.now(),
        coin: activeCoin,
        mode,
        amount,
        price,
        total: cost,
        fee,
      },
    ])
  }

  function handleAddAlert(alert: PriceAlert) {
    setAlerts(prev => [...prev, alert])
  }

  function handleRemoveAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <main className={styles.main}>
      <div className={styles.dash}>
        <TopBar />
        <CoinSelector
          coins={COINS}
          activeCoin={activeCoin}
          marketData={marketData}
          onSelect={setActiveCoin}
        />

        <div className={styles.bodyGrid}>
          {/* Left column: info row + chart + bottom row */}
          <div className={styles.leftCol}>
            <div className={styles.infoRow}>
              <BalancePanel
                usdBalance={usdBalance}
                positions={positions}
                marketData={marketData}
              />
              <PricePanel market={market} coin={coin} />
            </div>

            <div className={styles.chartArea}>
              <CandlestickChart candles={candles[activeCoin]} coin={coin} />
            </div>

            <div className={styles.bottomRow}>
              <TradeHistory trades={trades} />
              <HoldingsPanel
                position={position}
                coin={coin}
                price={market.price}
                totalTrades={totalTrades}
              />
            </div>
          </div>

          {/* Right column: trade panel + alerts */}
          <div className={styles.rightCol}>
            <TradePanel
              coin={coin}
              price={market.price}
              usdBalance={usdBalance}
              position={position}
              onTrade={handleTrade}
            />
            <PriceAlerts
              alerts={alerts}
              activeCoin={activeCoin}
              currentPrice={market.price}
              onAddAlert={handleAddAlert}
              onRemoveAlert={handleRemoveAlert}
            />
          </div>
        </div>
      </div>

      <AlertToast alerts={alerts} />
    </main>
  )
}
