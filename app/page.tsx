'use client'

import { useState, useEffect } from 'react'
import { StockTicker, NewsItem, Candle, ChartTimeframe } from '@/lib/types'
import { generateStocks, tickStocks, generateNews, generateCandles } from '@/lib/utils'
import TopBar from '@/components/TopBar'
import NewsWindow from '@/components/NewsWindow'
import TopGainers from '@/components/TopGainers'
import GainersPlus10 from '@/components/GainersPlus10'
import StockQuote from '@/components/StockQuote'
import ChartPanel from '@/components/ChartPanel'
import styles from './page.module.css'

export default function DashboardPage() {
  const [stocks, setStocks]               = useState<StockTicker[]>(() => generateStocks())
  const [news, setNews]                   = useState<NewsItem[]>(() => generateNews(10))
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [chartData, setChartData]         = useState<Record<ChartTimeframe, Candle[]> | null>(null)

  const selectedStock = selectedSymbol
    ? stocks.find(s => s.symbol === selectedSymbol) || null
    : null

  // Tick stock prices every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => tickStocks(prev))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Refresh news every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNews(generateNews(10))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Generate chart data when ticker is selected
  function handleSelectTicker(symbol: string) {
    setSelectedSymbol(symbol)
    const stock = stocks.find(s => s.symbol === symbol)
    if (!stock) return

    setChartData({
      '1m': generateCandles(stock.price, 120, '1m'),
      '5m': generateCandles(stock.price, 60, '5m'),
      '1D': generateCandles(stock.price, 30, '1D'),
    })
  }

  // Update chart candles live when selected
  useEffect(() => {
    if (!selectedSymbol || !chartData) return

    const stock = stocks.find(s => s.symbol === selectedSymbol)
    if (!stock) return

    const updated = { ...chartData }
    const tfs: ChartTimeframe[] = ['1m', '5m', '1D']

    tfs.forEach(tf => {
      const arr = [...updated[tf]]
      const last = arr[arr.length - 1]
      if (last) {
        arr[arr.length - 1] = {
          ...last,
          high: Math.max(last.high, stock.price),
          low: Math.min(last.low, stock.price),
          close: stock.price,
          volume: last.volume + Math.round(Math.random() * 500),
        }
        updated[tf] = arr
      }
    })

    setChartData(updated)
  }, [stocks, selectedSymbol])

  return (
    <main className={styles.main}>
      <div className={styles.dash}>
        <TopBar />

        <div className={styles.topRow}>
          <NewsWindow news={news} />
          <TopGainers stocks={stocks} />
          <GainersPlus10
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onSelect={handleSelectTicker}
          />
          <StockQuote stock={selectedStock} />
        </div>

        <div className={styles.bottomRow}>
          <ChartPanel
            symbol={selectedSymbol}
            candleData={chartData}
          />
        </div>
      </div>
    </main>
  )
}
