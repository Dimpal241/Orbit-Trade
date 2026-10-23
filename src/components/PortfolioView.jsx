import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  Briefcase,
  DollarSign,
  PlusCircle,
} from 'lucide-react';
import {
  selectPortfolioMetrics,
  depositFunds,
} from '../store/portfolioSlice';
import { selectAsset } from '../store/marketSlice';
import { setActiveTab, addToast } from '../store/uiSlice';

export default function PortfolioView() {
  const dispatch = useDispatch();
  const metrics = useSelector(selectPortfolioMetrics);

  const handleTradeAsset = (symbol) => {
    dispatch(selectAsset(symbol));
    dispatch(setActiveTab('terminal'));
  };

  const handleDepositMore = () => {
    dispatch(depositFunds(10000));
    dispatch(
      addToast({
        type: 'success',
        title: 'Capital Added',
        message: '+$10,000.00 virtual cash added to buying power.',
      })
    );
  };

  const isNetPositive = metrics.totalReturn >= 0;
  const isUnrealizedPositive = metrics.unrealizedPnL >= 0;

  // Compute breakdown for allocation bar
  const cashPct = metrics.totalEquity > 0 ? (metrics.cash / metrics.totalEquity) * 100 : 100;
  const investedPct = 100 - cashPct;

  return (
    <div className="portfolio-view-container">
      {/* KPI Cards Grid */}
      <div className="portfolio-kpi-grid">
        {/* Net Worth */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Total Portfolio Equity</span>
            <Wallet size={18} className="text-cyan" />
          </div>
          <div className="kpi-value num-tabular">
            ${metrics.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <span>Liquid Cash: </span>
            <strong className="num-tabular">${metrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Total Return */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Total Cumulative Return</span>
            {isNetPositive ? <TrendingUp size={18} className="text-green" /> : <TrendingDown size={18} className="text-red" />}
          </div>
          <div className={`kpi-value num-tabular ${isNetPositive ? 'text-green' : 'text-red'}`}>
            {isNetPositive ? '+' : ''}${metrics.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <span className={`badge ${isNetPositive ? 'badge-green' : 'badge-red'} num-tabular`}>
              {isNetPositive ? '+' : ''}{metrics.totalReturnPercent}% Overall ROI
            </span>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Unrealized Open P&L</span>
            {isUnrealizedPositive ? <TrendingUp size={18} className="text-green" /> : <TrendingDown size={18} className="text-red" />}
          </div>
          <div className={`kpi-value num-tabular ${isUnrealizedPositive ? 'text-green' : 'text-red'}`}>
            {isUnrealizedPositive ? '+' : ''}${metrics.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <span>Market value vs original cost basis</span>
          </div>
        </div>

        {/* Realized P&L */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-title">Realized Closed Gains</span>
            <DollarSign size={18} className="text-muted" />
          </div>
          <div className={`kpi-value num-tabular ${metrics.realizedPnL >= 0 ? 'text-green' : 'text-red'}`}>
            {metrics.realizedPnL >= 0 ? '+' : ''}${metrics.realizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-subtext">
            <span>From closed and sold positions</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      <div className="allocation-card glass-panel">
        <div className="allocation-header">
          <div className="allocation-title-wrap">
            <PieChart size={16} className="text-cyan" />
            <h3>Portfolio Asset Allocation</h3>
          </div>
          <button className="btn-secondary-sm" onClick={handleDepositMore}>
            <PlusCircle size={14} />
            <span>Deposit +$10k Cash</span>
          </button>
        </div>

        <div className="allocation-progress-bar">
          <div
            className="bar-segment cash-segment"
            style={{ width: `${cashPct}%` }}
            title={`Cash: ${cashPct.toFixed(1)}%`}
          />
          <div
            className="bar-segment invested-segment"
            style={{ width: `${investedPct}%` }}
            title={`Invested Equities: ${investedPct.toFixed(1)}%`}
          />
        </div>

        <div className="allocation-legend">
          <div className="legend-item">
            <span className="legend-dot cash-dot" />
            <span>Cash Reserve: <strong className="num-tabular">${metrics.cash.toLocaleString()} ({cashPct.toFixed(1)}%)</strong></span>
          </div>
          <div className="legend-item">
            <span className="legend-dot invested-dot" />
            <span>Active Positions: <strong className="num-tabular">${metrics.totalStockValue.toLocaleString()} ({investedPct.toFixed(1)}%)</strong></span>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="holdings-card glass-panel">
        <div className="holdings-header">
          <div className="title-wrap">
            <Briefcase size={17} className="text-muted" />
            <h3>Active Open Positions ({metrics.holdings.length})</h3>
          </div>
          <span className="helper-hint">Click "Trade" to adjust or liquidate position in terminal</span>
        </div>

        {metrics.holdings.length === 0 ? (
          <div className="empty-holdings-state">
            <ShieldAlert size={36} className="text-muted" />
            <h4>No Active Positions</h4>
            <p>You currently hold 100% cash. Head to the Terminal or Screener to execute your first paper trade!</p>
            <button
              className="btn-primary-action"
              onClick={() => dispatch(setActiveTab('terminal'))}
            >
              Go to Trading Terminal
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Allocation</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Avg Cost</th>
                  <th className="text-right">Market Price</th>
                  <th className="text-right">Total Value</th>
                  <th className="text-right">Unrealized P&L</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {metrics.holdings.map((pos) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  return (
                    <tr key={pos.symbol} className="holding-row">
                      {/* Asset & Name */}
                      <td>
                        <div className="holding-asset-cell">
                          <span className="holding-symbol">{pos.symbol}</span>
                          <span className="holding-name">{pos.assetName}</span>
                        </div>
                      </td>

                      {/* Allocation % */}
                      <td>
                        <div className="allocation-badge num-tabular">
                          <div className="mini-bar-wrap">
                            <div className="mini-bar" style={{ width: `${pos.allocationPercent}%` }} />
                          </div>
                          <span>{pos.allocationPercent}%</span>
                        </div>
                      </td>

                      {/* Shares */}
                      <td className="text-right num-tabular font-medium">
                        {pos.shares}
                      </td>

                      {/* Avg Cost */}
                      <td className="text-right num-tabular text-muted">
                        ${pos.avgCost.toFixed(2)}
                      </td>

                      {/* Market Price */}
                      <td className="text-right num-tabular font-medium">
                        ${pos.currentPrice.toFixed(2)}
                      </td>

                      {/* Total Value */}
                      <td className="text-right num-tabular font-semibold">
                        ${pos.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* P&L */}
                      <td className="text-right num-tabular">
                        <div className={`holding-pnl-cell ${isProfit ? 'text-green' : 'text-red'}`}>
                          <span>{isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}</span>
                          <span className="sub-pnl-percent">({isProfit ? '+' : ''}{pos.unrealizedPnLPercent}%)</span>
                        </div>
                      </td>

                      {/* Quick Trade CTA */}
                      <td className="text-center">
                        <button
                          className="trade-cta-btn"
                          onClick={() => handleTradeAsset(pos.symbol)}
                          title={`Open ${pos.symbol} in terminal`}
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
        )}
      </div>
    </div>
  );
}
