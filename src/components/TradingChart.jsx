import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import gsap from 'gsap';
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  LineChart,
  Clock,
  Maximize2,
} from 'lucide-react';
import {
  selectActiveAsset,
  selectActiveTimeframe,
  selectActiveChartMode,
  setTimeframe,
  setChartMode,
} from '../store/marketSlice';

export default function TradingChart() {
  const dispatch = useDispatch();
  const activeAsset = useSelector(selectActiveAsset);
  const activeTimeframe = useSelector(selectActiveTimeframe);
  const activeChartMode = useSelector(selectActiveChartMode);

  const [hoverData, setHoverData] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const chartSvgRef = useRef(null);
  const pathRef = useRef(null);

  const timeframes = ['1D', '1W', '1M', '1Y'];

  // Current data points
  const points = useMemo(() => {
    if (!activeAsset || !activeAsset.history || !activeAsset.history[activeTimeframe]) {
      return [];
    }
    return activeAsset.history[activeTimeframe];
  }, [activeAsset, activeTimeframe]);

  // Determine if trend is positive or negative
  const firstPrice = points.length > 0 ? points[0].price : activeAsset.price;
  const currentPrice = activeAsset.price;
  const isPositive = currentPrice >= firstPrice;

  const chartTheme = {
    color: isPositive ? '#10b981' : '#f43f5e',
    glow: isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
    gradientStart: isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
    gradientEnd: 'rgba(11, 14, 20, 0.0)',
  };

  // Dimensions
  const width = 800;
  const height = 360;
  const padding = { top: 25, right: 70, bottom: 35, left: 20 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  // Min and Max price bounds with buffer
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (points.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const buffer = (max - min) * 0.1 || (min * 0.05);
    return {
      minPrice: Math.max(0, min - buffer),
      maxPrice: max + buffer,
      priceRange: (max + buffer) - Math.max(0, min - buffer) || 1,
    };
  }, [points]);

  // Coordinate mapper
  const getCoordinates = (p, index) => {
    const x = padding.left + (index / (points.length - 1 || 1)) * usableWidth;
    const y = padding.top + usableHeight - ((p.price - minPrice) / priceRange) * usableHeight;
    return { x, y };
  };

  // Generate SVG Path
  const { pathString, areaString } = useMemo(() => {
    if (points.length < 2) return { pathString: '', areaString: '' };

    const coords = points.map((p, i) => getCoordinates(p, i));

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      // Catmull-Rom / Bezier smoothing
      const midX = (prev.x + curr.x) / 2;
      path += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const firstCoord = coords[0];
    const lastCoord = coords[coords.length - 1];
    const bottomY = padding.top + usableHeight;
    const area = `${path} L ${lastCoord.x} ${bottomY} L ${firstCoord.x} ${bottomY} Z`;

    return { pathString: path, areaString: area };
  }, [points, minPrice, priceRange]);

  // GSAP animation when asset or timeframe changes
  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength ? pathRef.current.getTotalLength() : 1000;
      gsap.fromTo(
        pathRef.current,
        { strokeDasharray: length, strokeDashoffset: length, opacity: 0.6 },
        { strokeDashoffset: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, [activeAsset.symbol, activeTimeframe]);

  // Mouse move handler for interactive crosshair
  const handleMouseMove = (e) => {
    if (!chartSvgRef.current || points.length === 0) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * width;

    if (relativeX < padding.left || relativeX > width - padding.right) {
      setHoverData(null);
      return;
    }

    const progress = Math.max(0, Math.min(1, (relativeX - padding.left) / usableWidth));
    const pointIndex = Math.min(
      points.length - 1,
      Math.max(0, Math.round(progress * (points.length - 1)))
    );

    const point = points[pointIndex];
    const coords = getCoordinates(point, pointIndex);

    setHoverData(point);
    setMousePos(coords);
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Generate price labels for Y-axis
  const yAxisTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const priceVal = minPrice + pct * priceRange;
    const yPos = padding.top + usableHeight - pct * usableHeight;
    return { priceVal, yPos };
  });

  // Generate Candlestick items for candle view mode
  const candles = useMemo(() => {
    if (activeChartMode !== 'candle') return [];
    return points.map((p, idx) => {
      const coord = getCoordinates(p, idx);
      const isUp = idx % 2 === 0;
      const spread = p.price * 0.004;
      const high = coord.y - spread * 8;
      const low = coord.y + spread * 8;
      const open = isUp ? coord.y + spread * 3 : coord.y - spread * 3;
      const close = isUp ? coord.y - spread * 3 : coord.y + spread * 3;
      return {
        x: coord.x,
        open,
        close,
        high,
        low,
        isUp,
      };
    });
  }, [points, activeChartMode, minPrice, priceRange]);

  const activeDisplayPrice = hoverData ? hoverData.price : activeAsset.price;
  const activeDisplayTime = hoverData ? hoverData.time : 'Current Session';

  return (
    <div className="trading-chart-card glass-panel">
      {/* Chart Top Bar Header */}
      <div className="chart-header">
        <div className="asset-headline">
          <div className="title-row">
            <h2 className="asset-title">{activeAsset.symbol}</h2>
            <span className="asset-subtitle">{activeAsset.name}</span>
            <span className="asset-badge-category">{activeAsset.category}</span>
          </div>

          <div className="price-display-row">
            <span className="live-big-price num-tabular">
              ${activeDisplayPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>

            <div className={`badge ${activeAsset.change >= 0 ? 'badge-green' : 'badge-red'} num-tabular`}>
              {activeAsset.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{activeAsset.change >= 0 ? '+' : ''}${Math.abs(activeAsset.change).toFixed(2)} ({activeAsset.changePercent}%)</span>
            </div>

            <span className="time-context num-tabular">
              <Clock size={12} className="mr-1" />
              {activeDisplayTime}
            </span>
          </div>
        </div>

        {/* Right Controls: Timeframe & Chart Style Toggle */}
        <div className="chart-controls">
          {/* Mode Switcher */}
          <div className="control-group">
            <button
              className={`ctrl-btn ${activeChartMode === 'area' ? 'active' : ''}`}
              onClick={() => dispatch(setChartMode('area'))}
              title="Smooth Area Chart"
            >
              <LineChart size={15} />
            </button>
            <button
              className={`ctrl-btn ${activeChartMode === 'candle' ? 'active' : ''}`}
              onClick={() => dispatch(setChartMode('candle'))}
              title="Candlestick Chart"
            >
              <BarChart size={15} />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="timeframe-group">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${activeTimeframe === tf ? 'active' : ''}`}
                onClick={() => dispatch(setTimeframe(tf))}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="svg-chart-container">
        <svg
          ref={chartSvgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTheme.gradientStart} />
              <stop offset="100%" stopColor={chartTheme.gradientEnd} />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Price Ticks */}
          {yAxisTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.yPos}
                x2={width - padding.right}
                y2={tick.yPos}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={width - padding.right + 10}
                y={tick.yPos + 4}
                fill="#64748b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="start"
              >
                ${tick.priceVal.toFixed(tick.priceVal > 1000 ? 0 : 2)}
              </text>
            </g>
          ))}

          {/* Area Chart Mode */}
          {activeChartMode === 'area' && (
            <>
              {/* Gradient Fill */}
              <path d={areaString} fill="url(#chartGradient)" />

              {/* Stroke Line */}
              <path
                ref={pathRef}
                d={pathString}
                fill="none"
                stroke={chartTheme.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowEffect)"
              />
            </>
          )}

          {/* Candlestick Chart Mode */}
          {activeChartMode === 'candle' && (
            <g>
              {candles.map((c, i) => (
                <g key={i}>
                  {/* High/Low wick */}
                  <line
                    x1={c.x}
                    y1={c.high}
                    x2={c.x}
                    y2={c.low}
                    stroke={c.isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.5"
                  />
                  {/* Candle Body */}
                  <rect
                    x={c.x - 3}
                    y={Math.min(c.open, c.close)}
                    width="6"
                    height={Math.max(3, Math.abs(c.open - c.close))}
                    fill={c.isUp ? '#10b981' : '#f43f5e'}
                    rx="1"
                  />
                </g>
              ))}
            </g>
          )}

          {/* Interactive Crosshair & Cursor */}
          {hoverData && (
            <g className="crosshair-group">
              {/* Vertical Dashed Line */}
              <line
                x1={mousePos.x}
                y1={padding.top}
                x2={mousePos.x}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />

              {/* Horizontal Dashed Line */}
              <line
                x1={padding.left}
                y1={mousePos.y}
                x2={width - padding.right}
                y2={mousePos.y}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />

              {/* Glowing Indicator Dot */}
              <circle
                cx={mousePos.x}
                cy={mousePos.y}
                r="6"
                fill={chartTheme.color}
                stroke="#fff"
                strokeWidth="2"
                filter="url(#glowEffect)"
              />
            </g>
          )}

          {/* Time axis markers */}
          {points.length > 0 && (
            <g className="time-labels">
              <text
                x={padding.left}
                y={height - 10}
                fill="#64748b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
              >
                {points[0].time}
              </text>
              <text
                x={width - padding.right}
                y={height - 10}
                fill="#64748b"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {points[points.length - 1].time}
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverData && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${(mousePos.x / width) * 100}%`,
              top: `${Math.max(10, (mousePos.y / height) * 100 - 18)}%`,
            }}
          >
            <div className="tooltip-price num-tabular">${hoverData.price.toFixed(2)}</div>
            <div className="tooltip-meta">
              <span>{hoverData.time}</span>
              <span className="dot">•</span>
              <span>Vol: {hoverData.volume.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Stats */}
      <div className="chart-stats-grid">
        <div className="stat-box">
          <span className="stat-label">24h High</span>
          <span className="stat-val num-tabular">${activeAsset.high24h.toLocaleString()}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">24h Low</span>
          <span className="stat-val num-tabular">${activeAsset.low24h.toLocaleString()}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">24h Volume</span>
          <span className="stat-val num-tabular">{activeAsset.volume}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Market Cap</span>
          <span className="stat-val num-tabular">{activeAsset.marketCap}</span>
        </div>
      </div>
    </div>
  );
}
