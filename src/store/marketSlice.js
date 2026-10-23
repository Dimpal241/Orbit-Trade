import { createSlice } from '@reduxjs/toolkit';

// Helper to generate realistic historical data points with timestamps
function generateHistory(basePrice, volatility, trend = 0.0005) {
  const generatePoints = (count, variance, stepMinutes) => {
    const points = [];
    let current = basePrice * (1 - (count * trend * 0.5));
    const now = Date.now();

    for (let i = count; i >= 0; i--) {
      const time = new Date(now - i * stepMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const change = (Math.random() - 0.485) * variance * current;
      current = Math.max(current + change, basePrice * 0.5);
      points.push({
        time,
        price: Number(current.toFixed(2)),
        volume: Math.floor(Math.random() * 8500 + 1200),
      });
    }
    // ensure last point is close to current basePrice
    points[points.length - 1].price = basePrice;
    return points;
  };

  return {
    '1D': generatePoints(30, volatility * 0.015, 15),
    '1W': generatePoints(40, volatility * 0.03, 120),
    '1M': generatePoints(50, volatility * 0.06, 720),
    '1Y': generatePoints(60, volatility * 0.12, 4320),
  };
}

// Helper to generate an authentic dynamic order book
function generateOrderBook(price) {
  const bids = [];
  const asks = [];
  const spread = price > 1000 ? 5 : (price > 100 ? 0.2 : 0.05);

  let cumBidVol = 0;
  for (let i = 1; i <= 6; i++) {
    const bidPrice = Number((price - i * spread * (0.8 + Math.random() * 0.4)).toFixed(2));
    const size = Number((Math.random() * 45 + 5).toFixed(price > 1000 ? 3 : 1));
    cumBidVol += size;
    bids.push({ price: bidPrice, size, total: Number(cumBidVol.toFixed(2)) });
  }

  let cumAskVol = 0;
  for (let i = 1; i <= 6; i++) {
    const askPrice = Number((price + i * spread * (0.8 + Math.random() * 0.4)).toFixed(2));
    const size = Number((Math.random() * 45 + 5).toFixed(price > 1000 ? 3 : 1));
    cumAskVol += size;
    asks.push({ price: askPrice, size, total: Number(cumAskVol.toFixed(2)) });
  }

  return { bids, asks };
}

const initialAssets = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Stocks',
    price: 138.80,
    previousClose: 135.20,
    change: 3.60,
    changePercent: 2.66,
    high24h: 140.40,
    low24h: 134.90,
    volume: '54.2M',
    marketCap: '$3.41T',
    volatility: 0.035,
    lastTick: 'up',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Crypto',
    price: 68420.00,
    previousClose: 67100.00,
    change: 1320.00,
    changePercent: 1.97,
    high24h: 69150.00,
    low24h: 66800.00,
    volume: '$31.8B',
    marketCap: '$1.35T',
    volatility: 0.025,
    lastTick: 'up',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Stocks',
    price: 224.50,
    previousClose: 225.80,
    change: -1.30,
    changePercent: -0.58,
    high24h: 226.30,
    low24h: 223.10,
    volume: '42.1M',
    marketCap: '$3.43T',
    volatility: 0.015,
    lastTick: 'down',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'Crypto',
    price: 2645.50,
    previousClose: 2580.00,
    change: 65.50,
    changePercent: 2.54,
    high24h: 2680.00,
    low24h: 2560.00,
    volume: '$16.2B',
    marketCap: '$318B',
    volatility: 0.032,
    lastTick: 'up',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    category: 'Stocks',
    price: 218.40,
    previousClose: 223.90,
    change: -5.50,
    changePercent: -2.46,
    high24h: 225.00,
    low24h: 215.20,
    volume: '68.5M',
    marketCap: '$697B',
    volatility: 0.045,
    lastTick: 'down',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    category: 'Crypto',
    price: 165.25,
    previousClose: 156.40,
    change: 8.85,
    changePercent: 5.66,
    high24h: 168.90,
    low24h: 154.80,
    volume: '$4.1B',
    marketCap: '$77.2B',
    volatility: 0.05,
    lastTick: 'up',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    category: 'Stocks',
    price: 442.20,
    previousClose: 440.10,
    change: 2.10,
    changePercent: 0.48,
    high24h: 445.00,
    low24h: 439.50,
    volume: '18.9M',
    marketCap: '$3.28T',
    volatility: 0.012,
    lastTick: 'up',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    category: 'ETFs',
    price: 580.15,
    previousClose: 578.40,
    change: 1.75,
    changePercent: 0.30,
    high24h: 581.50,
    low24h: 577.80,
    volume: '41.0M',
    marketCap: '$585B',
    volatility: 0.008,
    lastTick: 'up',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    category: 'Stocks',
    price: 186.30,
    previousClose: 187.90,
    change: -1.60,
    changePercent: -0.85,
    high24h: 188.40,
    low24h: 185.10,
    volume: '33.2M',
    marketCap: '$1.94T',
    volatility: 0.02,
    lastTick: 'down',
  },
];

// Initialize assets with history and order books
const assetsWithDetails = initialAssets.map((asset) => ({
  ...asset,
  orderBook: generateOrderBook(asset.price),
  history: generateHistory(asset.price, asset.volatility),
}));

const initialState = {
  assets: assetsWithDetails,
  selectedSymbol: 'NVDA',
  activeTimeframe: '1D',
  activeChartMode: 'area', // 'area' | 'candle'
  isSimulationRunning: true,
  simulationSpeedMs: 2500,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    selectAsset: (state, action) => {
      state.selectedSymbol = action.payload;
    },
    setTimeframe: (state, action) => {
      state.activeTimeframe = action.payload;
    },
    setChartMode: (state, action) => {
      state.activeChartMode = action.payload;
    },
    toggleSimulation: (state) => {
      state.isSimulationRunning = !state.isSimulationRunning;
    },
    // Reducer called on every simulated market tick
    tickMarket: (state) => {
      if (!state.isSimulationRunning) return;

      state.assets.forEach((asset) => {
        // Random price fluctuation weighted slightly by volatility
        const randomFactor = (Math.random() - 0.495);
        const delta = Number((asset.price * randomFactor * 0.0035).toFixed(2));
        
        if (delta !== 0) {
          const oldPrice = asset.price;
          const newPrice = Math.max(0.01, Number((oldPrice + delta).toFixed(2)));
          asset.price = newPrice;
          asset.change = Number((newPrice - asset.previousClose).toFixed(2));
          asset.changePercent = Number(((asset.change / asset.previousClose) * 100).toFixed(2));
          asset.lastTick = newPrice >= oldPrice ? 'up' : 'down';

          if (newPrice > asset.high24h) asset.high24h = newPrice;
          if (newPrice < asset.low24h) asset.low24h = newPrice;

          // Update current order book based on new price
          asset.orderBook = generateOrderBook(newPrice);

          // Update latest 1D history point
          if (asset.history && asset.history['1D']) {
            const history1D = asset.history['1D'];
            if (history1D.length > 0) {
              const lastPoint = history1D[history1D.length - 1];
              lastPoint.price = newPrice;
            }
          }
        }
      });
    },
  },
});

export const {
  selectAsset,
  setTimeframe,
  setChartMode,
  toggleSimulation,
  tickMarket,
} = marketSlice.actions;

export const selectAllAssets = (state) => state.market.assets;
export const selectActiveSymbol = (state) => state.market.selectedSymbol;
export const selectActiveAsset = (state) =>
  state.market.assets.find((a) => a.symbol === state.market.selectedSymbol) || state.market.assets[0];
export const selectActiveTimeframe = (state) => state.market.activeTimeframe;
export const selectActiveChartMode = (state) => state.market.activeChartMode;
export const selectIsSimulationRunning = (state) => state.market.isSimulationRunning;

export default marketSlice.reducer;
