import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Star,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { selectAllAssets, selectAsset } from '../store/marketSlice';
import { selectWatchlistSymbols, toggleWatchlist } from '../store/watchlistSlice';
import { setActiveTab } from '../store/uiSlice';

export default function MarketScreener() {
  const dispatch = useDispatch();
  const assets = useSelector(selectAllAssets);
  const watchlist = useSelector(selectWatchlistSymbols);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState('changePercent');
  const [sortAsc, setSortAsc] = useState(false);

  const categories = ['All', 'Stocks', 'Crypto', 'ETFs'];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleTrade = (symbol) => {
    dispatch(selectAsset(symbol));
    dispatch(setActiveTab('terminal'));
  };

  // Filter & Sort assets
  const processedAssets = assets
    .filter((asset) => {
      const matchesSearch =
        asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
        asset.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'All' || asset.category === selectedCategory;
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  return (
    <div className="screener-container glass-panel">
      {/* Screener Controls */}
      <div className="screener-header">
        <div className="header-titles">
          <h2>Market Screener & Analytics</h2>
          <p>Scan real-time market movements, momentum leaders, and volatile assets.</p>
        </div>

        <div className="screener-actions">
          {/* Search */}
          <div className="screener-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by symbol or asset name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="screener-search-input"
            />
          </div>

          {/* Categories */}
          <div className="category-toggle-group">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-toggle-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screener Table */}
      <div className="table-responsive">
        <table className="screener-table">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th onClick={() => handleSort('symbol')} className="sortable-th">
                <div className="th-content">
                  <span>Symbol & Name</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th>Category</th>
              <th onClick={() => handleSort('price')} className="sortable-th text-right">
                <div className="th-content justify-end">
                  <span>Price ($)</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th onClick={() => handleSort('changePercent')} className="sortable-th text-right">
                <div className="th-content justify-end">
                  <span>24h Change</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="text-right">24h Range</th>
              <th className="text-right">Volume</th>
              <th className="text-right">Market Cap</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {processedAssets.map((asset) => {
              const isPositive = asset.change >= 0;
              const isFav = watchlist.includes(asset.symbol);

              return (
                <tr key={asset.symbol} className="screener-row">
                  {/* Favorite star */}
                  <td>
                    <button
                      className={`star-btn ${isFav ? 'favorited' : ''}`}
                      onClick={() => dispatch(toggleWatchlist(asset.symbol))}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </td>

                  {/* Symbol & Name */}
                  <td>
                    <div className="screener-asset-cell" onClick={() => handleTrade(asset.symbol)}>
                      <span className="screener-symbol">{asset.symbol}</span>
                      <span className="screener-name">{asset.name}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="badge badge-neutral">{asset.category}</span>
                  </td>

                  {/* Price */}
                  <td className="text-right num-tabular font-semibold">
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* 24h Change */}
                  <td className="text-right num-tabular">
                    <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{isPositive ? '+' : ''}{asset.changePercent}%</span>
                    </span>
                  </td>

                  {/* 24h Range */}
                  <td className="text-right num-tabular text-muted">
                    ${asset.low24h.toFixed(1)} - ${asset.high24h.toFixed(1)}
                  </td>

                  {/* Volume */}
                  <td className="text-right num-tabular text-secondary">
                    {asset.volume}
                  </td>

                  {/* Market Cap */}
                  <td className="text-right num-tabular text-secondary">
                    {asset.marketCap}
                  </td>

                  {/* Trade Action */}
                  <td className="text-center">
                    <button
                      className="trade-cta-btn"
                      onClick={() => handleTrade(asset.symbol)}
                    >
                      <span>Trade</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
