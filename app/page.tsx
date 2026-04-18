'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [news, setNews]                   = useState<NewsItem[]>([])
  const [newsIsLive, setNewsIsLive]       = useState(false)
  const [newsLastUpdate, setNewsLastUpdate] = useState<number | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [chartData, setChartData]         = useState<Record<ChartTimeframe, Candle[]> | null>(null)

  const selectedStock = selectedSymbol
    ? stocks.find(s => s.symbol === selectedSymbol) || null
    : null

  // ─── Fetch news from API (live) or fall back to simulated ───
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()

      if (data.source === 'finnhub' && data.news.length > 0) {
        setNews(data.news)
        setNewsIsLive(true)
        setNewsLastUpdate(Date.now())
        return
      }
    } catch (e) {
      // API unavailable — fall through to simulated
    }

    // Fallback: simulated news
    setNews(generateNews(10))
    setNewsIsLive(false)
    setNewsLastUpdate(Date.now())
  }, [])

  // Initial news fetch
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Refresh news every 60 seconds (live) or 30 seconds (simulated)
  useEffect(() => {
    const interval = setInterval(fetchNews, newsIsLive ? 60000 : 30000)
    return () => clearInterval(interval)
  }, [fetchNews, newsIsLive])

  // Tick stock prices every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => tickStocks(prev))
    }, 2000)
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
          <NewsWindow
            news={news}
            isLive={newsIsLive}
            lastUpdate={newsLastUpdate}
          />
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
