'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [stocks, setStocks]                 = useState<StockTicker[]>(() => generateStocks())
  const [stocksIsLive, setStocksIsLive]     = useState(false)
  const [news, setNews]                     = useState<NewsItem[]>([])
  const [newsIsLive, setNewsIsLive]         = useState(false)
  const [newsLastUpdate, setNewsLastUpdate] = useState<number | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [chartData, setChartData]           = useState<Record<ChartTimeframe, Candle[]> | null>(null)
  const [chartsIsLive, setChartsIsLive]     = useState(false)
  const chartSymbolRef = useRef<string | null>(null)

  const selectedStock = selectedSymbol
    ? stocks.find(s => s.symbol === selectedSymbol) || null
    : null

  // ─── STOCKS: fetch from Alpaca or simulate ───
  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks')
      const data = await res.json()

      if (data.source === 'alpaca' && data.stocks.length > 0) {
        setStocks(data.stocks)
        setStocksIsLive(true)
        return
      }
    } catch {}

    // Fallback: tick simulated
    setStocks(prev => {
      if (prev.length === 0) return generateStocks()
      return tickStocks(prev)
    })
    setStocksIsLive(false)
  }, [])

  // Initial stocks fetch
  useEffect(() => { fetchStocks() }, [fetchStocks])

  // Refresh stocks: 5s live, 2s simulated
  useEffect(() => {
    const interval = setInterval(
      stocksIsLive ? fetchStocks : () => setStocks(prev => tickStocks(prev)),
      stocksIsLive ? 5000 : 2000
    )
    return () => clearInterval(interval)
  }, [fetchStocks, stocksIsLive])

  // ─── NEWS: fetch from Finnhub or simulate ───
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
    } catch {}

    setNews(generateNews(10))
    setNewsIsLive(false)
    setNewsLastUpdate(Date.now())
  }, [])

  useEffect(() => { fetchNews() }, [fetchNews])

  useEffect(() => {
    const interval = setInterval(fetchNews, newsIsLive ? 60000 : 30000)
    return () => clearInterval(interval)
  }, [fetchNews, newsIsLive])

  // ─── CHARTS: fetch from Alpaca or generate simulated ───
  const fetchChartData = useCallback(async (symbol: string, price: number) => {
    // Try live bars from Alpaca
    try {
      const [res1m, res5m, res1D] = await Promise.all([
        fetch(`/api/bars?symbol=${symbol}&timeframe=1m`),
        fetch(`/api/bars?symbol=${symbol}&timeframe=5m`),
        fetch(`/api/bars?symbol=${symbol}&timeframe=1D`),
      ])

      const [data1m, data5m, data1D] = await Promise.all([
        res1m.json(), res5m.json(), res1D.json(),
      ])

      if (
        data1m.source === 'alpaca' && data1m.bars.length > 5 &&
        data5m.source === 'alpaca' && data5m.bars.length > 5 &&
        data1D.source === 'alpaca' && data1D.bars.length > 5
      ) {
        setChartData({
          '1m': data1m.bars,
          '5m': data5m.bars,
          '1D': data1D.bars,
        })
        setChartsIsLive(true)
        return
      }
    } catch {}

    // Fallback: simulated candles
    setChartData({
      '1m': generateCandles(price, 120, '1m'),
      '5m': generateCandles(price, 60, '5m'),
      '1D': generateCandles(price, 30, '1D'),
    })
    setChartsIsLive(false)
  }, [])

  // When ticker is selected, fetch chart data
  function handleSelectTicker(symbol: string) {
    setSelectedSymbol(symbol)
    chartSymbolRef.current = symbol
    const stock = stocks.find(s => s.symbol === symbol)
    fetchChartData(symbol, stock?.price || 100)
  }

  // Refresh 1m chart every 30 seconds when live
  useEffect(() => {
    if (!chartsIsLive || !selectedSymbol) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bars?symbol=${selectedSymbol}&timeframe=1m`)
        const data = await res.json()
        if (data.source === 'alpaca' && data.bars.length > 0) {
          setChartData(prev => prev ? { ...prev, '1m': data.bars } : null)
        }
      } catch {}
    }, 30000)

    return () => clearInterval(interval)
  }, [chartsIsLive, selectedSymbol])

  // Update last candle with live price ticks (simulated mode)
  useEffect(() => {
    if (chartsIsLive || !selectedSymbol || !chartData) return

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
  }, [stocks, selectedSymbol, chartsIsLive])

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
