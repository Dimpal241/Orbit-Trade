import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  History,
  Download,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from 'lucide-react';
import { selectTransactions, resetPortfolio } from '../store/portfolioSlice';
import { addToast } from '../store/uiSlice';

export default function TradeHistory() {
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'BUY' | 'SELL'

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  const exportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['ID,Type,Symbol,Shares,Price,Total,Timestamp'];
    const rows = transactions.map(
      (tx) => `${tx.id},${tx.type},${tx.symbol},${tx.shares},${tx.price},${tx.total},"${tx.timestamp}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orbit_trade_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dispatch(
      addToast({
        type: 'success',
        title: 'CSV Exported',
        message: 'Trading journal successfully downloaded.',
      })
    );
  };

  return (
    <div className="trade-history-container glass-panel">
      {/* Ledger Header */}
      <div className="history-header">
        <div className="title-group">
          <div className="title-icon-wrap">
            <History size={18} className="text-cyan" />
          </div>
          <div>
            <h2>Trading Execution Journal</h2>
            <p>Immutable order execution audit trail and trade ledger.</p>
          </div>
        </div>

        <div className="history-actions">
          {/* Filter Pills */}
          <div className="filter-pill-group">
            {['ALL', 'BUY', 'SELL'].map((type) => (
              <button
                key={type}
                className={`history-filter-btn ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            className="btn-secondary-sm"
            onClick={exportCSV}
            disabled={transactions.length === 0}
            title="Download CSV Trading Log"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredTx.length === 0 ? (
        <div className="empty-history-state">
          <Filter size={32} className="text-muted" />
          <h4>No Transactions Found</h4>
          <p>Orders executed in the terminal will be logged here with timestamps and execution prices.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Time</th>
                <th>Side</th>
                <th>Asset</th>
                <th className="text-right">Price</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Total Value</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx) => {
                const isBuy = tx.type === 'BUY';
                const formattedDate = new Date(tx.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={tx.id} className="history-row">
                    {/* Order ID */}
                    <td className="num-tabular text-muted font-mono text-xs">
                      {tx.id.replace('tx_', '')}
                    </td>

                    {/* Timestamp */}
                    <td className="num-tabular text-secondary">
                      {formattedDate}
                    </td>

                    {/* Side */}
                    <td>
                      <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`}>
                        {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>{tx.type}</span>
                      </span>
                    </td>

                    {/* Symbol */}
                    <td>
                      <strong className="symbol-cell">{tx.symbol}</strong>
                    </td>

                    {/* Executed Price */}
                    <td className="text-right num-tabular font-medium">
                      ${tx.price.toFixed(2)}
                    </td>

                    {/* Executed Shares */}
                    <td className="text-right num-tabular font-medium">
                      {tx.shares}
                    </td>

                    {/* Total Value */}
                    <td className="text-right num-tabular font-semibold">
                      ${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status Filled */}
                    <td className="text-center">
                      <span className="badge badge-green">
                        <CheckCircle2 size={11} />
                        <span>Filled</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
