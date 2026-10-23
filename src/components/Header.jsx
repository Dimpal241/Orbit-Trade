import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import gsap from 'gsap';
import {
  Activity,
  Wallet,
  DollarSign,
  BarChart2,
  Layers,
  History,
  Play,
  Pause,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  selectAllAssets,
  selectIsSimulationRunning,
  toggleSimulation,
  selectAsset,
} from '../store/marketSlice';
import {
  selectPortfolioMetrics,
  depositFunds,
  resetPortfolio,
} from '../store/portfolioSlice';
import {
  selectActiveTab,
  setActiveTab,
  addToast,
} from '../store/uiSlice';

export default function Header() {
  const dispatch = useDispatch();
  const assets = useSelector(selectAllAssets);
  const isSimulationRunning = useSelector(selectIsSimulationRunning);
  const activeTab = useSelector(selectActiveTab);
  const metrics = useSelector(selectPortfolioMetrics);

  const marqueeTrackRef = useRef(null);
  const totalEquityRef = useRef(null);

  // GSAP continuous ticker marquee
  useEffect(() => {
    if (!marqueeTrackRef.current) return;
    const track = marqueeTrackRef.current;
    
    // Smooth infinite scroll animation
    const tween = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 35,
      repeat: -1,
    });

    const handleMouseEnter = () => tween.pause();
    const handleMouseLeave = () => tween.play();

    track.addEventListener('mouseenter', handleMouseEnter);
    track.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      tween.kill();
      track.removeEventListener('mouseenter', handleMouseEnter);
      track.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP pulse on equity change
  useEffect(() => {
    if (totalEquityRef.current) {
      gsap.fromTo(
        totalEquityRef.current,
        { scale: 1.04 },
        { scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [metrics.totalEquity]);

  const handleDeposit = () => {
    dispatch(depositFunds(10000));
    dispatch(
      addToast({
        type: 'success',
        title: 'Funds Deposited',
        message: '+$10,000.00 virtual cash added to your balance.',
      })
    );
  };

  const handleReset = () => {
    if (window.confirm('Reset portfolio back to initial $50,000 test balance?')) {
      dispatch(resetPortfolio());
      dispatch(
        addToast({
          type: 'info',
          title: 'Portfolio Reset',
          message: 'Reset to $50,000 baseline with default sample holdings.',
        })
      );
    }
  };

  return (
    <header className="header-wrapper">
      {/* Top Ticker Bar */}
      <div className="ticker-tape-container">
        <div className="ticker-label">
          <span className={`status-dot ${isSimulationRunning ? 'active' : ''}`} />
          <span>{isSimulationRunning ? 'LIVE FEED' : 'PAUSED'}</span>
        </div>
        <div className="ticker-overflow">
          <div className="ticker-track" ref={marqueeTrackRef}>
            {[...assets, ...assets].map((item, index) => {
              const isPositive = item.change >= 0;
              return (
                <div
                  key={`${item.symbol}-${index}`}
                  className="ticker-item"
                  onClick={() => {
                    dispatch(selectAsset(item.symbol));
                    dispatch(setActiveTab('terminal'));
                  }}
                  title={`Click to trade ${item.symbol}`}
                >
                  <span className="ticker-symbol">{item.symbol}</span>
                  <span className="ticker-price num-tabular">
                    ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`ticker-change num-tabular ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{item.changePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="nav-container">
        {/* Brand */}
        <div className="brand-group">
          <div className="brand-logo" onClick={() => dispatch(setActiveTab('terminal'))}>
            <div className="logo-icon-wrap">
              <Activity size={22} className="logo-svg" />
            </div>
            <div className="logo-text">
              <span className="brand-title">ORBIT<span className="highlight">TRADE</span></span>
              <span className="brand-subtitle">PRO PAPER TERMINAL</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button
              className={`nav-btn ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('terminal'))}
            >
              <BarChart2 size={16} />
              <span>Terminal</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('portfolio'))}
            >
              <Wallet size={16} />
              <span>Portfolio</span>
              {Object.keys(metrics.holdings).length > 0 && (
                <span className="tab-counter">{Object.keys(metrics.holdings).length}</span>
              )}
            </button>

            <button
              className={`nav-btn ${activeTab === 'screener' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('screener'))}
            >
              <Search size={16} />
              <span>Screener</span>
            </button>

            <button
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('history'))}
            >
              <History size={16} />
              <span>Ledger</span>
            </button>
          </nav>
        </div>

        {/* Portfolio Quick Stats & Actions */}
        <div className="header-actions">
          {/* Quick Metrics */}
          <div className="quick-metric-card" ref={totalEquityRef}>
            <span className="metric-label">Net Worth</span>
            <span className="metric-val num-tabular">
              ${metrics.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="quick-metric-card">
            <span className="metric-label">Buying Power</span>
            <span className="metric-val text-cyan num-tabular">
              ${metrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="quick-metric-card hidden-mobile">
            <span className="metric-label">Total P&L</span>
            <span className={`metric-val num-tabular ${metrics.totalReturn >= 0 ? 'text-green' : 'text-red'}`}>
              {metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="sub-pnl"> ({metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}%)</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="utility-buttons">
            <button
              className="icon-action-btn"
              onClick={() => dispatch(toggleSimulation())}
              title={isSimulationRunning ? 'Pause Market Simulator' : 'Start Market Simulator'}
            >
              {isSimulationRunning ? <Pause size={16} /> : <Play size={16} className="text-green" />}
            </button>

            <button
              className="btn-deposit"
              onClick={handleDeposit}
              title="Add $10,000 Paper Funds"
            >
              <DollarSign size={14} />
              <span>+$10k</span>
            </button>

            <button
              className="icon-action-btn"
              onClick={handleReset}
              title="Reset Portfolio to $50,000"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
