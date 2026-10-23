import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import gsap from 'gsap';
import './App.css';

// Redux
import {
  tickMarket,
  selectIsSimulationRunning,
} from './store/marketSlice';
import { selectActiveTab } from './store/uiSlice';

// Components
import Header from './components/Header';
import WatchlistSidebar from './components/WatchlistSidebar';
import TradingChart from './components/TradingChart';
import OrderBook from './components/OrderBook';
import OrderExecutionPanel from './components/OrderExecutionPanel';
import PortfolioView from './components/PortfolioView';
import MarketScreener from './components/MarketScreener';
import TradeHistory from './components/TradeHistory';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const dispatch = useDispatch();
  const isSimulationRunning = useSelector(selectIsSimulationRunning);
  const activeTab = useSelector(selectActiveTab);

  const [externalPrice, setExternalPrice] = useState(null);
  const mainRef = useRef(null);

  // Market simulation tick interval
  useEffect(() => {
    let interval = null;
    if (isSimulationRunning) {
      interval = setInterval(() => {
        dispatch(tickMarket());
      }, 2400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulationRunning, dispatch]);

  // Subtle GSAP stagger animation on tab change
  useEffect(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current.querySelectorAll('.glass-panel'),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  return (
    <div className="app-layout">
      {/* Top Header with live ticker tape & balance */}
      <Header />

      {/* Main Content Area */}
      <main className="main-content" ref={mainRef}>
        {activeTab === 'terminal' && (
          <div className="terminal-grid">
            {/* Left Watchlist Sidebar */}
            <WatchlistSidebar />

            {/* Middle: Trading Chart + Order Book */}
            <div className="chart-center-column">
              <TradingChart />
              <OrderBook onSelectPrice={(price) => setExternalPrice(price)} />
            </div>

            {/* Right: Order Execution Panel */}
            <div className="order-terminal-wrapper">
              <OrderExecutionPanel externalPrice={externalPrice} />
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && <PortfolioView />}

        {activeTab === 'screener' && <MarketScreener />}

        {activeTab === 'history' && <TradeHistory />}
      </main>

      {/* Toast Notification Queue */}
      <ToastContainer />
    </div>
  );
}
