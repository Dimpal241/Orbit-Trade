import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { selectActiveAsset } from '../store/marketSlice';
import {
  selectCashBalance,
  selectHoldings,
  executeOrder,
} from '../store/portfolioSlice';
import { addToast } from '../store/uiSlice';

export default function OrderExecutionPanel({ externalPrice }) {
  const dispatch = useDispatch();
  const activeAsset = useSelector(selectActiveAsset);
  const cash = useSelector(selectCashBalance);
  const holdings = useSelector(selectHoldings);

  const [orderSide, setOrderSide] = useState('BUY'); // 'BUY' | 'SELL'
  const [orderType, setOrderType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [shares, setShares] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Sync external price click from order book if clicked
  useEffect(() => {
    if (externalPrice) {
      setLimitPrice(externalPrice.toString());
      setOrderType('LIMIT');
    }
  }, [externalPrice]);

  // Update limit price default when active asset changes
  useEffect(() => {
    if (activeAsset) {
      setLimitPrice(activeAsset.price.toFixed(2));
    }
  }, [activeAsset?.symbol]);

  const currentHolding = holdings[activeAsset.symbol] || { shares: 0, avgCost: 0 };
  const effectivePrice = orderType === 'MARKET' ? activeAsset.price : (parseFloat(limitPrice) || activeAsset.price);
  const numShares = parseFloat(shares) || 0;
  const orderTotal = Number((numShares * effectivePrice).toFixed(2));

  // Max affordable shares for BUY
  const maxBuyShares = effectivePrice > 0 ? (cash / effectivePrice) : 0;
  // Max shares available for SELL
  const maxSellShares = currentHolding.shares;

  // Validation
  let validationError = null;
  if (numShares < 0) {
    validationError = 'Quantity must be positive';
  } else if (orderSide === 'BUY' && orderTotal > cash) {
    validationError = `Insufficient funds. Needed $${orderTotal.toFixed(2)}, Available $${cash.toFixed(2)}`;
  } else if (orderSide === 'SELL' && numShares > currentHolding.shares) {
    validationError = `Cannot sell more than ${currentHolding.shares} owned shares.`;
  }

  // Quick preset fraction handler
  const handlePreset = (fraction) => {
    if (orderSide === 'BUY') {
      const targetSpend = cash * fraction;
      if (effectivePrice > 0) {
        const calculatedShares = activeAsset.category === 'Crypto'
          ? Number((targetSpend / effectivePrice).toFixed(4))
          : Math.floor(targetSpend / effectivePrice);
        setShares(calculatedShares > 0 ? calculatedShares.toString() : '');
      }
    } else {
      const calculatedShares = activeAsset.category === 'Crypto'
        ? Number((currentHolding.shares * fraction).toFixed(4))
        : Math.floor(currentHolding.shares * fraction);
      setShares(calculatedShares > 0 ? calculatedShares.toString() : '');
    }
  };

  // Submit order handler
  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (numShares <= 0 || validationError) return;

    setIsSubmitting(true);

    // Button pulse animation
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.95 },
        { scale: 1, duration: 0.25, ease: 'back.out(2)' }
      );
    }

    try {
      dispatch(
        executeOrder({
          type: orderSide,
          symbol: activeAsset.symbol,
          shares: numShares,
          price: effectivePrice,
        })
      );

      // Trigger celebratory confetti for simulated trade fill
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: orderSide === 'BUY' ? ['#10b981', '#34d399', '#059669'] : ['#f43f5e', '#fb7185', '#e11d48'],
      });

      dispatch(
        addToast({
          type: 'success',
          title: `Order Filled: ${orderSide} ${numShares} ${activeAsset.symbol}`,
          message: `Executed at $${effectivePrice.toFixed(2)} | Total: $${orderTotal.toFixed(2)}`,
        })
      );

      setShares('');
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Order Failed',
          message: err.message,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBuy = orderSide === 'BUY';

  return (
    <div className="order-execution-card glass-panel" ref={panelRef}>
      {/* Side Selector (BUY vs SELL) */}
      <div className="order-side-tabs">
        <button
          className={`side-tab buy-tab ${isBuy ? 'active' : ''}`}
          onClick={() => setOrderSide('BUY')}
        >
          <TrendingUp size={16} />
          <span>BUY {activeAsset.symbol}</span>
        </button>
        <button
          className={`side-tab sell-tab ${!isBuy ? 'active' : ''}`}
          onClick={() => setOrderSide('SELL')}
        >
          <TrendingDown size={16} />
          <span>SELL {activeAsset.symbol}</span>
        </button>
      </div>

      <form onSubmit={handleSubmitOrder} className="order-form">
        {/* Order Type Selector (Market vs Limit) */}
        <div className="order-type-row">
          <span className="field-label">Order Type:</span>
          <div className="type-toggle-group">
            <button
              type="button"
              className={`toggle-type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
              onClick={() => setOrderType('MARKET')}
            >
              Market
            </button>
            <button
              type="button"
              className={`toggle-type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
              onClick={() => setOrderType('LIMIT')}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Limit Price Input if Limit Order */}
        {orderType === 'LIMIT' && (
          <div className="form-group">
            <div className="field-header">
              <label>Limit Price</label>
              <span className="helper-label">Market: ${activeAsset.price.toFixed(2)}</span>
            </div>
            <div className="input-with-adornment">
              <span className="adornment">$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="trade-input"
                required
              />
            </div>
          </div>
        )}

        {/* Quantity / Shares Input */}
        <div className="form-group">
          <div className="field-header">
            <label>Quantity ({activeAsset.category === 'Crypto' ? 'Units' : 'Shares'})</label>
            <span className="helper-label">
              {isBuy
                ? `Max: ${activeAsset.category === 'Crypto' ? maxBuyShares.toFixed(4) : Math.floor(maxBuyShares)}`
                : `Owned: ${currentHolding.shares}`}
            </span>
          </div>
          <div className="input-with-adornment">
            <input
              type="number"
              step={activeAsset.category === 'Crypto' ? '0.001' : '1'}
              min="0.0001"
              placeholder="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="trade-input"
              required
            />
            <span className="adornment text-muted">{activeAsset.symbol}</span>
          </div>
        </div>

        {/* Quick Percent Presets */}
        <div className="preset-buttons">
          {[0.25, 0.5, 0.75, 1.0].map((pct) => (
            <button
              key={pct}
              type="button"
              className="preset-btn"
              onClick={() => handlePreset(pct)}
            >
              {pct * 100}%
            </button>
          ))}
        </div>

        {/* Real-time Order Summary Receipt */}
        <div className="order-receipt">
          <div className="receipt-row">
            <span>Execution Price</span>
            <span className="num-tabular">${effectivePrice.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Estimated Total</span>
            <span className="receipt-total num-tabular">${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="receipt-row">
            <span>Est. Trading Fee</span>
            <span className="text-green num-tabular">$0.00 (Free)</span>
          </div>
          <div className="receipt-divider" />
          <div className="receipt-row text-muted">
            <span>{isBuy ? 'Cash After Order' : 'Est. Proceeds'}</span>
            <span className="num-tabular">
              ${isBuy
                ? Math.max(0, cash - orderTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (orderTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="validation-banner">
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Execution Button */}
        <button
          ref={buttonRef}
          type="submit"
          disabled={isSubmitting || numShares <= 0 || Boolean(validationError)}
          className={`submit-order-btn ${isBuy ? 'btn-buy' : 'btn-sell'}`}
        >
          {isSubmitting ? (
            <span>Transacting...</span>
          ) : (
            <span>
              {isBuy ? 'Submit BUY Order' : 'Submit SELL Order'} • ${orderTotal.toFixed(2)}
            </span>
          )}
        </button>

        {/* Trust & Simulation note */}
        <div className="execution-footer-note">
          <ShieldCheck size={13} className="text-green" />
          <span>Simulated Paper Trade • Instant Redux Execution</span>
        </div>
      </form>
    </div>
  );
}
