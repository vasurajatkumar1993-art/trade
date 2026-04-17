import { Level2Data, CoinConfig, MarketData } from '@/lib/types'
import { formatUSD } from '@/lib/utils'
import styles from './Level2Book.module.css'

interface Props {
  data: Level2Data
  currentPrice: number
  coin: CoinConfig
  market: MarketData
}

export default function Level2Book({ data, currentPrice, coin, market }: Props) {
  const maxBidTotal = data.bids.length > 0 ? data.bids[data.bids.length - 1].total : 1
  const maxAskTotal = data.asks.length > 0 ? data.asks[data.asks.length - 1].total : 1

  const totalBidShares = data.bids.reduce((s, b) => s + b.size, 0)
  const totalAskShares = data.asks.reduce((s, a) => s + a.size, 0)
  const totalShares = totalBidShares + totalAskShares
  const buyPct = totalShares > 0 ? Math.round((totalBidShares / totalShares) * 100) : 50

  const isUp = market.change24hPct >= 0

  return (
    <div className={styles.panel}>
      {/* Ticker header */}
      <div className={styles.tickerHeader}>
        <div className={styles.tickerLeft}>
          <span className={styles.tickerSymbol}>{coin.id}/USD</span>
          <span className={`${styles.tickerPct} ${isUp ? styles.up : styles.down}`}>
            {isUp ? '+' : ''}{market.change24hPct.toFixed(2)}%
          </span>
        </div>
        <span className={styles.tickerPrice}>{formatUSD(currentPrice)}</span>
      </div>

      <div className={styles.label}>Level II</div>

      {/* Ask header */}
      <div className={styles.header}>
        <span>Maker</span>
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className={styles.book}>
        {/* Asks */}
        <div className={styles.asks}>
          {[...data.asks].reverse().map((a, i) => (
            <div key={`a-${i}`} className={styles.row}>
              <div
                className={styles.depthBarAsk}
                style={{ width: `${(a.total / maxAskTotal) * 100}%` }}
              />
              <span className={styles.maker}>{a.maker}</span>
              <span className={styles.askPrice}>
                {currentPrice > 1000 ? a.price.toFixed(0) : a.price.toFixed(2)}
              </span>
              <span className={styles.size}>{a.size.toFixed(3)}</span>
              <span className={styles.total}>{a.total.toFixed(3)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className={styles.spread}>
          <span className={styles.spreadPrice}>
            {currentPrice > 1000 ? currentPrice.toFixed(0) : currentPrice.toFixed(2)}
          </span>
          <span className={styles.spreadLabel}>Spread</span>
        </div>

        {/* Bids */}
        <div className={styles.bids}>
          {data.bids.map((b, i) => (
            <div key={`b-${i}`} className={styles.row}>
              <div
                className={styles.depthBarBid}
                style={{ width: `${(b.total / maxBidTotal) * 100}%` }}
              />
              <span className={styles.maker}>{b.maker}</span>
              <span className={styles.bidPrice}>
                {currentPrice > 1000 ? b.price.toFixed(0) : b.price.toFixed(2)}
              </span>
              <span className={styles.size}>{b.size.toFixed(3)}</span>
              <span className={styles.total}>{b.total.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buy/Sell summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryRow}>
          <span className={styles.buyCount}>{totalBidShares.toFixed(2)} Buy</span>
          <span className={styles.shareTotal}>{totalShares.toFixed(2)} shares</span>
          <span className={styles.sellCount}>{totalAskShares.toFixed(2)} Sell</span>
        </div>
        <div className={styles.ratioBar}>
          <div className={styles.ratioFill} style={{ width: `${buyPct}%` }} />
        </div>
      </div>
    </div>
  )
}
