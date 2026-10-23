import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'orbit_trade_portfolio_v1';

// Load from localStorage if present
const loadSavedState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (err) {
    console.error('Failed to load portfolio from localStorage:', err);
  }
  return null;
};

const defaultInitialState = {
  cash: 50000.00,
  startingCash: 50000.00,
  realizedPnL: 0,
  holdings: {
    NVDA: {
      symbol: 'NVDA',
      shares: 25,
      avgCost: 132.50,
      totalInvested: 3312.50,
    },
    BTC: {
      symbol: 'BTC',
      shares: 0.15,
      avgCost: 64200.00,
      totalInvested: 9630.00,
    },
  },
  transactions: [
    {
      id: 'tx_init_1',
      type: 'BUY',
      symbol: 'NVDA',
      shares: 25,
      price: 132.50,
      total: 3312.50,
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'tx_init_2',
      type: 'BUY',
      symbol: 'BTC',
      shares: 0.15,
      price: 64200.00,
      total: 9630.00,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

const initialState = loadSavedState() || defaultInitialState;

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    executeOrder: (state, action) => {
      const { type, symbol, shares, price } = action.payload;
      const orderTotal = Number((shares * price).toFixed(2));
      const now = new Date().toISOString();
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (type === 'BUY') {
        if (state.cash < orderTotal) {
          throw new Error('Insufficient cash balance to complete order.');
        }

        state.cash = Number((state.cash - orderTotal).toFixed(2));

        if (state.holdings[symbol]) {
          const current = state.holdings[symbol];
          const newShares = current.shares + shares;
          const newTotalInvested = current.totalInvested + orderTotal;
          const newAvgCost = Number((newTotalInvested / newShares).toFixed(2));

          state.holdings[symbol] = {
            symbol,
            shares: Number(newShares.toFixed(4)),
            avgCost: newAvgCost,
            totalInvested: Number(newTotalInvested.toFixed(2)),
          };
        } else {
          state.holdings[symbol] = {
            symbol,
            shares: Number(shares.toFixed(4)),
            avgCost: price,
            totalInvested: orderTotal,
          };
        }

        state.transactions.unshift({
          id: txId,
          type: 'BUY',
          symbol,
          shares,
          price,
          total: orderTotal,
          timestamp: now,
        });
      } else if (type === 'SELL') {
        const current = state.holdings[symbol];
        if (!current || current.shares < shares) {
          throw new Error('Cannot sell more shares than currently owned.');
        }

        const saleProceeds = orderTotal;
        const costBasisOfSoldShares = current.avgCost * shares;
        const profitOrLoss = saleProceeds - costBasisOfSoldShares;

        state.cash = Number((state.cash + saleProceeds).toFixed(2));
        state.realizedPnL = Number((state.realizedPnL + profitOrLoss).toFixed(2));

        const remainingShares = Number((current.shares - shares).toFixed(4));
        if (remainingShares <= 0.0001) {
          delete state.holdings[symbol];
        } else {
          const remainingInvested = Number((remainingShares * current.avgCost).toFixed(2));
          state.holdings[symbol] = {
            ...current,
            shares: remainingShares,
            totalInvested: remainingInvested,
          };
        }

        state.transactions.unshift({
          id: txId,
          type: 'SELL',
          symbol,
          shares,
          price,
          total: orderTotal,
          realizedGain: Number(profitOrLoss.toFixed(2)),
          timestamp: now,
        });
      }

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Error persisting portfolio to localStorage:', e);
      }
    },

    depositFunds: (state, action) => {
      const amount = action.payload || 10000;
      state.cash = Number((state.cash + amount).toFixed(2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },

    resetPortfolio: (state) => {
      state.cash = defaultInitialState.cash;
      state.startingCash = defaultInitialState.startingCash;
      state.realizedPnL = 0;
      state.holdings = { ...defaultInitialState.holdings };
      state.transactions = [...defaultInitialState.transactions];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
    },
  },
});

export const { executeOrder, depositFunds, resetPortfolio } = portfolioSlice.actions;

export const selectCashBalance = (state) => state.portfolio.cash;
export const selectHoldings = (state) => state.portfolio.holdings;
export const selectTransactions = (state) => state.portfolio.transactions;
export const selectRealizedPnL = (state) => state.portfolio.realizedPnL;

// Complex Redux Selector: Computes live metrics across portfolio & market slices
export const selectPortfolioMetrics = (state) => {
  const cash = state.portfolio.cash;
  const holdings = state.portfolio.holdings;
  const assets = state.market.assets;

  let totalStockValue = 0;
  let totalCostBasis = 0;

  const holdingsList = Object.values(holdings).map((item) => {
    const marketAsset = assets.find((a) => a.symbol === item.symbol);
    const currentPrice = marketAsset ? marketAsset.price : item.avgCost;
    const currentVal = Number((item.shares * currentPrice).toFixed(2));
    const costBasis = Number((item.shares * item.avgCost).toFixed(2));
    const pnl = Number((currentVal - costBasis).toFixed(2));
    const pnlPercent = costBasis > 0 ? Number(((pnl / costBasis) * 100).toFixed(2)) : 0;

    totalStockValue += currentVal;
    totalCostBasis += costBasis;

    return {
      ...item,
      currentPrice,
      marketValue: currentVal,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPercent,
      assetName: marketAsset ? marketAsset.name : item.symbol,
      category: marketAsset ? marketAsset.category : 'Asset',
    };
  });

  const totalEquity = Number((cash + totalStockValue).toFixed(2));
  const unrealizedPnL = Number((totalStockValue - totalCostBasis).toFixed(2));
  const totalReturn = Number((unrealizedPnL + state.portfolio.realizedPnL).toFixed(2));
  const totalReturnPercent = state.portfolio.startingCash > 0
    ? Number(((totalReturn / state.portfolio.startingCash) * 100).toFixed(2))
    : 0;

  // Compute allocation percentages
  const holdingsWithAllocation = holdingsList.map((h) => ({
    ...h,
    allocationPercent: totalEquity > 0 ? Number(((h.marketValue / totalEquity) * 100).toFixed(1)) : 0,
  }));

  return {
    cash,
    totalStockValue: Number(totalStockValue.toFixed(2)),
    totalEquity,
    unrealizedPnL,
    realizedPnL: state.portfolio.realizedPnL,
    totalReturn,
    totalReturnPercent,
    holdings: holdingsWithAllocation,
  };
};

export default portfolioSlice.reducer;
