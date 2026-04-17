'use client'

import { useState, useEffect } from 'react'
import {
  OrderMode, CoinId, COINS, Timeframe,
  Positions, MarketDataMap, TradeRecord, Candle,
  PriceAlert, Level2Map, TimeSalesMap,
} from '@/lib/types'
import {
  uid, generateCandles, generateLevel2, generateTimeSales,
  tickLevel2, addTimeSale, getInitialMarket, TF_INTERVALS,
} from '@/lib/utils'
import TopBar from '@/components/TopBar'
import CoinSelector from '@/components/CoinSelector'
import BalancePanel from '@/components/BalancePanel'
import PricePanel from '@/components/PricePanel'
import TradePanel from '@/components/TradePanel'
import CandlestickChart from '@/components/CandlestickChart'
import PositionSummary from '@/components/PositionSummary'
import TradeHistory from '@/components/TradeHistory'
import PriceAlerts from '@/components/PriceAlerts'
import AlertToast from '@/components/AlertToast'
import Level2Book from '@/components/Level2Book'
import TimeSales from '@/components/TimeSales'
import styles from './page.module.css'

const INITIAL_USD = 50000

const INITIAL_POSITIONS: Positions = {
  BTC:  { held: 0, avgBuyPrice: 0, realisedPnL: 0, totalQty: 0 },
  ETH:  { held: 0, avgBuyPrice: 0, realisedPnL: 0, totalQty: 0 },
  SOL:  { held: 0, avgBuyPrice: 0, realisedPnL: 0, totalQty: 0 },
  AVAX: { held: 0, avgBuyPrice: 0, realisedPnL: 0, totalQty: 0 },
}

export default function DashboardPage() {
  const [activeCoin, setActiveCoin] = useState<CoinId>('BTC')
  const [timeframe, setTimeframe]   = useState<Timeframe>('1H')
  const [marketData, setMarketData] = useState<MarketDataMap>(getInitialMarket())
  const [usdBalance, setUsdBalance] = useState(INITIAL_USD)
  const [positions, setPositions]   = useState<Positions>(INITIAL_POSITIONS)
  const [trades, setTrades]         = useState<TradeRecord[]>([])
  const [alerts, setAlerts]         = useState<PriceAlert[]>([])

  const coin     = COINS.find(c => c.id === activeCoin)!
  const market   = marketData[activeCoin]
  const position = positions[activeCoin]

  // Generate candle data per coin per timeframe
  const [candles, setCandles] = useState<Record<CoinId, Record<Timeframe, Candle[]>>>(() => {
    const initial = getInitialMarket()
    const map = {} as Record<CoinId, Record<Timeframe, Candle[]>>
    COINS.forEach(c => {
      map[c.id] = {
        '1m': generateCandles(initial[c.id].price, 120, '1m'),
        '1H': generateCandles(initial[c.id].price, 48, '1H'),
        '4H': generateCandles(initial[c.id].price, 30, '4H'),
        '1D': generateCandles(initial[c.id].price, 30, '1D'),
      }
    })
    return map
  })

  // Level 2 data per coin
  const [level2, setLevel2] = useState<Level2Map>(() => {
    const initial = getInitialMarket()
    const map = {} as Level2Map
    COINS.forEach(c => { map[c.id] = generateLevel2(initial[c.id].price) })
    return map
  })

  // Time & Sales data per coin
  const [timeSales, setTimeSales] = useState<TimeSalesMap>(() => {
    const initial = getInitialMarket()
    const map = {} as TimeSalesMap
    COINS.forEach(c => { map[c.id] = generateTimeSales(initial[c.id].price) })
    return map
  })

  // Simulate live ticks every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          const m = prev[c.id]
          const volatility = m.price * 0.002
          const delta = (Math.random() - 0.48) * volatility
          const newPrice = Math.round((m.price + delta) * 100) / 100
          const openPrice = candles[c.id]['1D'][0]?.open || m.price
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

      // Update candles for all timeframes
      setCandles(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          const coinCandles = { ...prev[c.id] }
          const currentPrice = marketData[c.id].price

          const tfs: Timeframe[] = ['1m', '1H', '4H', '1D']
          tfs.forEach(tf => {
            const arr = [...coinCandles[tf]]
            const last = arr[arr.length - 1]
            const now = Date.now()
            const tfInterval = TF_INTERVALS[tf]

            if (now - last.time > tfInterval) {
              arr.push({
                time: now,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice,
                volume: Math.round(Math.random() * 200 + 20),
              })
              const maxLen = tf === '1m' ? 180 : tf === '1H' ? 60 : 40
              if (arr.length > maxLen) arr.shift()
            } else {
              arr[arr.length - 1] = {
                ...last,
                high: Math.max(last.high, currentPrice),
                low: Math.min(last.low, currentPrice),
                close: currentPrice,
                volume: last.volume + Math.round(Math.random() * 10),
              }
            }
            coinCandles[tf] = arr
          })

          updated[c.id] = coinCandles
        })
        return updated
      })

      // Tick Level 2
      setLevel2(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          updated[c.id] = tickLevel2(prev[c.id], marketData[c.id].price)
        })
        return updated
      })

      // Add Time & Sale entries
      setTimeSales(prev => {
        const updated = { ...prev }
        COINS.forEach(c => {
          updated[c.id] = addTimeSale(prev[c.id], marketData[c.id].price)
        })
        return updated
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [candles, marketData])

  // Check price alerts
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
          [activeCoin]: {
            held: newHeld,
            avgBuyPrice: newAvg,
            realisedPnL: pos.realisedPnL,
            totalQty: pos.totalQty + amount,
          },
        }
      })
    } else {
      if (amount > position.held) return

      const proceeds = cost - fee
      const costOfSold = amount * position.avgBuyPrice
      const realisedGain = proceeds - costOfSold

      setUsdBalance(prev => prev + proceeds)
      setPositions(prev => {
        const pos = prev[activeCoin]
        return {
          ...prev,
          [activeCoin]: {
            held: pos.held - amount,
            avgBuyPrice: pos.avgBuyPrice,
            realisedPnL: pos.realisedPnL + realisedGain,
            totalQty: pos.totalQty + amount,
          },
        }
      })
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
        <div className={styles.infoRow}>
          <BalancePanel
            usdBalance={usdBalance}
            positions={positions}
            marketData={marketData}
          />
          <PricePanel market={market} coin={coin} />
        </div>

        <div className={styles.bodyGrid}>
          {/* Left: Level 2 + Time & Sales */}
          <div className={styles.leftCol}>
            <div className={styles.l2Area}>
              <Level2Book
                data={level2[activeCoin]}
                currentPrice={market.price}
                coin={coin}
                market={market}
              />
            </div>
            <div className={styles.tsArea}>
              <TimeSales entries={timeSales[activeCoin]} />
            </div>
          </div>

          {/* Center: Chart + Position Summary + Trade History */}
          <div className={styles.centerCol}>
            <div className={styles.chartArea}>
              <CandlestickChart
                candles={candles[activeCoin][timeframe]}
                coin={coin}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            </div>
            <div className={styles.bottomRow}>
              <PositionSummary
                positions={positions}
                marketData={marketData}
              />
              <TradeHistory trades={trades} />
            </div>
          </div>

          {/* Right: Order + Alerts */}
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
