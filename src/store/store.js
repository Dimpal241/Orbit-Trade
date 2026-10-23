import { configureStore } from '@reduxjs/toolkit';
import marketReducer from './marketSlice';
import portfolioReducer from './portfolioSlice';
import watchlistReducer from './watchlistSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    market: marketReducer,
    portfolio: portfolioReducer,
    watchlist: watchlistReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
