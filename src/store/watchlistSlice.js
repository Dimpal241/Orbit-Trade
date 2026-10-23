import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'orbit_trade_watchlist_v1';

const getInitialWatchlist = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return ['NVDA', 'BTC', 'AAPL', 'TSLA', 'ETH'];
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState: {
    symbols: getInitialWatchlist(),
    filterCategory: 'All', // 'All' | 'Stocks' | 'Crypto' | 'ETFs'
    searchQuery: '',
  },
  reducers: {
    toggleWatchlist: (state, action) => {
      const symbol = action.payload;
      if (state.symbols.includes(symbol)) {
        state.symbols = state.symbols.filter((s) => s !== symbol);
      } else {
        state.symbols.push(symbol);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.symbols));
      } catch (e) {
        console.error(e);
      }
    },
    setFilterCategory: (state, action) => {
      state.filterCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { toggleWatchlist, setFilterCategory, setSearchQuery } = watchlistSlice.actions;
export const selectWatchlistSymbols = (state) => state.watchlist.symbols;
export const selectFilterCategory = (state) => state.watchlist.filterCategory;
export const selectSearchQuery = (state) => state.watchlist.searchQuery;

export default watchlistSlice.reducer;
