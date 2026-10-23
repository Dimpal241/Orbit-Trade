import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Star, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import {
  selectAllAssets,
  selectActiveSymbol,
  selectAsset,
} from '../store/marketSlice';
import {
  selectWatchlistSymbols,
  selectFilterCategory,
  selectSearchQuery,
  toggleWatchlist,
  setFilterCategory,
  setSearchQuery,
} from '../store/watchlistSlice';

export default function WatchlistSidebar() {
  const dispatch = useDispatch();
  const assets = useSelector(selectAllAssets);
  const activeSymbol = useSelector(selectActiveSymbol);
  const watchlistSymbols = useSelector(selectWatchlistSymbols);
  const filterCategory = useSelector(selectFilterCategory);
  const searchQuery = useSelector(selectSearchQuery);

  // Filter assets based on search query, category, or favorites
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'Starred') {
      return watchlistSymbols.includes(asset.symbol);
    }
    if (filterCategory !== 'All') {
      return asset.category === filterCategory;
    }
    return true;
  });

  const categories = ['All', 'Starred', 'Stocks', 'Crypto', 'ETFs'];

  return (
    <aside className="watchlist-sidebar glass-panel">
      {/* Search Header */}
      <div className="sidebar-header">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search markets (NVDA, BTC...)"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => dispatch(setSearchQuery(''))}
            >
              ×
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill-btn ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => dispatch(setFilterCategory(cat))}
            >
              {cat === 'Starred' && <Star size={12} className="mr-1" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Asset List */}
      <div className="asset-list-container">
        {filteredAssets.length === 0 ? (
          <div className="empty-assets">
            <Filter size={24} className="text-muted" />
            <p>No matching instruments found.</p>
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isSelected = asset.symbol === activeSymbol;
            const isFavorited = watchlistSymbols.includes(asset.symbol);
            const isPositive = asset.change >= 0;

            return (
              <div
                key={asset.symbol}
                className={`asset-row ${isSelected ? 'selected' : ''}`}
                onClick={() => dispatch(selectAsset(asset.symbol))}
              >
                {/* Favorite Star */}
                <button
                  className={`star-btn ${isFavorited ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(toggleWatchlist(asset.symbol));
                  }}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={14} fill={isFavorited ? 'currentColor' : 'none'} />
                </button>

                {/* Symbol & Name */}
                <div className="asset-info">
                  <div className="asset-symbol-row">
                    <span className="asset-symbol">{asset.symbol}</span>
                    <span className="asset-tag">{asset.category}</span>
                  </div>
                  <span className="asset-name">{asset.name}</span>
                </div>

                {/* Live Price & Change */}
                <div className="asset-price-box">
                  <span
                    className={`asset-price num-tabular ${
                      asset.lastTick === 'up' ? 'flash-up' : asset.lastTick === 'down' ? 'flash-down' : ''
                    }`}
                  >
                    ${asset.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <div className={`badge ${isPositive ? 'badge-green' : 'badge-red'} num-tabular`}>
                    {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span>{isPositive ? '+' : ''}{asset.changePercent}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="sidebar-footer">
        <span>Showing {filteredAssets.length} instruments</span>
        <span className="status-live-pill">⚡ Realtime ticks</span>
      </div>
    </aside>
  );
}
