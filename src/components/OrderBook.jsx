import React from 'react';
import { useSelector } from 'react-redux';
import { selectActiveAsset } from '../store/marketSlice';
import { Layers } from 'lucide-react';

export default function OrderBook({ onSelectPrice }) {
  const activeAsset = useSelector(selectActiveAsset);

  if (!activeAsset || !activeAsset.orderBook) {
    return null;
  }

  const { bids, asks } = activeAsset.orderBook;

  // Calculate maximum depth volume for horizontal bar scaling
  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1].total : 100;
  const maxAskTotal = asks.length > 0 ? asks[asks.length - 1].total : 100;
  const maxDepth = Math.max(maxBidTotal, maxAskTotal, 1);

  const highestBid = bids.length > 0 ? bids[0].price : activeAsset.price;
  const lowestAsk = asks.length > 0 ? asks[0].price : activeAsset.price;
  const spread = Math.max(0, lowestAsk - highestBid);
  const spreadPercent = ((spread / activeAsset.price) * 100).toFixed(3);

  return (
    <div className="order-book-card glass-panel">
      <div className="order-book-header">
        <div className="title-wrap">
          <Layers size={15} className="text-muted" />
          <h3 className="section-title">Order Book (L2 Depth)</h3>
        </div>
        <span className="live-tag">● LIVE</span>
      </div>

      <div className="order-book-table-head">
        <span>Price ($)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sell Orders - descending so lowest ask is closest to spread) */}
      <div className="asks-container">
        {[...asks].reverse().map((ask, index) => {
          const depthPercent = Math.min(100, (ask.total / maxDepth) * 100);
          return (
            <div
              key={`ask-${index}`}
              className="order-book-row ask-row"
              onClick={() => onSelectPrice && onSelectPrice(ask.price)}
              title={`Click to set limit order price to $${ask.price}`}
            >
              <div
                className="depth-bar ask-depth-bar"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="price-cell text-red num-tabular">${ask.price.toFixed(2)}</span>
              <span className="size-cell num-tabular">{ask.size}</span>
              <span className="total-cell num-tabular">{ask.total}</span>
            </div>
          );
        })}
      </div>

      {/* Mid Spread Indicator */}
      <div className="order-book-spread">
        <div className="spread-price-row">
          <span className="mid-price num-tabular">${activeAsset.price.toFixed(2)}</span>
          <span className="spread-info num-tabular">
            Spread: ${spread.toFixed(2)} ({spreadPercent}%)
          </span>
        </div>
      </div>

      {/* Bids (Buy Orders - descending so highest bid is closest to spread) */}
      <div className="bids-container">
        {bids.map((bid, index) => {
          const depthPercent = Math.min(100, (bid.total / maxDepth) * 100);
          return (
            <div
              key={`bid-${index}`}
              className="order-book-row bid-row"
              onClick={() => onSelectPrice && onSelectPrice(bid.price)}
              title={`Click to set limit order price to $${bid.price}`}
            >
              <div
                className="depth-bar bid-depth-bar"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="price-cell text-green num-tabular">${bid.price.toFixed(2)}</span>
              <span className="size-cell num-tabular">{bid.size}</span>
              <span className="total-cell num-tabular">{bid.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
