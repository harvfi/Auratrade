
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Label, Line, LineChart, ComposedChart, Bar, BarChart } from 'recharts';
import { Token, PricePoint, ChartLayout, ChartTheme, FibDrawing, TimeFrame } from '../types';
import { CHART_COLORS, THEME_CONFIGS } from '../constants';
import TradingViewWidget from './TradingViewWidget';

interface MainChartProps {
  token: Token;
}

interface EnhancedPricePoint extends PricePoint {
  sma?: number;
  ema?: number;
  rsi?: number;
  isUp: boolean;
  volume: number;
}

const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const TIME_FRAMES: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

const MainChart: React.FC<MainChartProps> = ({ token }) => {
  const [chartData, setChartData] = useState<EnhancedPricePoint[]>([]);
  const [showFib, setShowFib] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ChartTheme>('default');
  const [currentTimeFrame, setCurrentTimeFrame] = useState<TimeFrame>('1m');
  const [emaPeriod, setEmaPeriod] = useState<number>(20);
  const [chartMode, setChartMode] = useState<'native' | 'tv'>('native');
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    volume: true
  });

  // Fibonacci Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [manualFib, setManualFib] = useState<FibDrawing | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ price: number } | null>(null);

  // Layout Management
  const [layouts, setLayouts] = useState<ChartLayout[]>(() => {
    const saved = localStorage.getItem('aura_chart_layouts');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');

  // Get interval in milliseconds based on timeframe
  const getIntervalMs = useCallback((tf: TimeFrame) => {
    switch (tf) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }, []);

  // Format time for X-Axis based on timeframe
  const formatTime = useCallback((date: Date, tf: TimeFrame) => {
    if (tf === '1d') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
  }, []);

  // Indicator Calculation
  const calculateIndicators = useCallback((data: EnhancedPricePoint[], period: number) => {
    const smaPeriod = 20;
    const rsiPeriod = 14;
    const emaMultiplier = 2 / (period + 1);

    return data.map((point, i) => {
      let sma: number | undefined;
      let ema: number | undefined;
      let rsi: number | undefined;

      if (i >= smaPeriod - 1) {
        const slice = data.slice(i - smaPeriod + 1, i + 1);
        sma = slice.reduce((a, b) => a + b.price, 0) / smaPeriod;
      }

      if (i === 0) {
        ema = point.price;
      } else {
        const prevEma = data[i - 1].ema || data[i - 1].price;
        ema = (point.price - prevEma) * emaMultiplier + prevEma;
      }

      if (i >= rsiPeriod) {
        let gains = 0;
        let losses = 0;
        for (let j = i - rsiPeriod + 1; j <= i; j++) {
          const diff = data[j].price - data[j - 1].price;
          if (diff >= 0) gains += diff;
          else losses -= diff;
        }
        const rs = losses === 0 ? 100 : gains / losses;
        rsi = 100 - (100 / (1 + rs));
      }

      return { ...point, sma, ema, rsi };
    });
  }, []);

  // Initial Data Generation (Seed)
  const generateInitialData = useCallback((targetToken: Token, tf: TimeFrame, period: number) => {
    const points: EnhancedPricePoint[] = [];
    let currentPrice = targetToken.price;
    const now = new Date();
    const interval = getIntervalMs(tf);
    
    // Generate 60 points of history
    for (let i = 60; i >= 0; i--) {
      const volatility = targetToken.category === 'forex' ? 0.0005 : 0.002;
      // Adjust volatility based on timeframe (approximate square root of time rule)
      const tfMultiplier = Math.sqrt(interval / 60000); 
      const drift = (Math.random() - 0.5) * (currentPrice * volatility * tfMultiplier);
      currentPrice = Math.max(0.0001, currentPrice + drift);
      
      const timeDate = new Date(now.getTime() - i * interval); 
      
      points.push({
        time: formatTime(timeDate, tf),
        price: currentPrice,
        volume: (Math.random() * 1000 * tfMultiplier) + 500,
        isUp: Math.random() > 0.5
      });
    }

    return calculateIndicators(points, period).slice(-48);
  }, [getIntervalMs, formatTime, calculateIndicators]);

  // Re-generate on token or timeframe change
  useEffect(() => {
    setChartData(generateInitialData(token, currentTimeFrame, emaPeriod));
  }, [token.id, currentTimeFrame, generateInitialData]); // Intentionally exclude emaPeriod to prevent regen

  // Re-calculate indicators when EMA period changes (preserving data)
  useEffect(() => {
    setChartData(prev => {
      if (prev.length === 0) return prev;
      return calculateIndicators(prev, emaPeriod);
    });
  }, [emaPeriod, calculateIndicators]);

  const lastPriceRef = useRef(token.price);
  
  useEffect(() => {
    if (token.price === lastPriceRef.current) return;
    lastPriceRef.current = token.price;

    setChartData(prev => {
      const lastPoint = prev[prev.length - 1];
      if (!lastPoint) return prev;

      // In this simulation, we're just updating the current price of the last candle
      // to provide a "live" feel across any timeframe.
      const updatedPoint: EnhancedPricePoint = {
        ...lastPoint,
        price: token.price,
        isUp: token.price >= (prev[prev.length - 2]?.price || lastPoint.price)
      };

      const updatedHistory = [...prev.slice(0, -1), updatedPoint];
      return calculateIndicators(updatedHistory, emaPeriod).slice(-48);
    });
  }, [token.price, emaPeriod, calculateIndicators]);

  // Derived Fibonacci Levels (Manual or Auto)
  const fibLevels = useMemo(() => {
    if (!showFib) return [];
    
    let high: number;
    let low: number;

    if (manualFib) {
      high = Math.max(manualFib.startPrice, manualFib.endPrice);
      low = Math.min(manualFib.startPrice, manualFib.endPrice);
    } else {
      if (chartData.length < 2) return [];
      const prices = chartData.map(d => d.price);
      high = Math.max(...prices);
      low = Math.min(...prices);
    }

    const diff = high - low;
    const isUptrend = manualFib ? manualFib.startPrice < manualFib.endPrice : true;

    return FIB_RATIOS.map(ratio => ({
      price: isUptrend ? high - (diff * ratio) : low + (diff * ratio),
      label: `${(ratio * 100).toFixed(1)}%`,
      ratio
    }));
  }, [chartData, manualFib, showFib]);

  // Drawing Handlers
  const handleMouseDown = (e: any) => {
    if (!isDrawingMode || !e?.activePayload) return;
    const price = e.activePayload[0].payload.price;
    setDrawingStart({ price });
    setIsDrawing(true);
    setShowFib(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !drawingStart || !e?.activePayload) return;
    const price = e.activePayload[0].payload.price;
    setManualFib({
      startPrice: drawingStart.price,
      endPrice: price
    });
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setIsDrawingMode(false);
    }
  };

  const clearFib = () => {
    setManualFib(null);
    setShowFib(false);
  };

  const saveCurrentLayout = () => {
    if (!newLayoutName.trim()) return;
    const layout: ChartLayout = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLayoutName,
      indicators: { ...indicators },
      showFib,
      manualFib: manualFib || undefined,
      theme: currentTheme,
      timeFrame: currentTimeFrame,
      emaPeriod,
      timestamp: Date.now()
    };
    const updatedLayouts = [layout, ...layouts];
    setLayouts(updatedLayouts);
    setNewLayoutName('');
    localStorage.setItem('aura_chart_layouts', JSON.stringify(updatedLayouts));
  };

  const loadLayout = (layout: ChartLayout) => {
    setIndicators(layout.indicators);
    setShowFib(layout.showFib);
    setManualFib(layout.manualFib || null);
    setCurrentTheme(layout.theme || 'default');
    if (layout.timeFrame) setCurrentTimeFrame(layout.timeFrame);
    if (layout.emaPeriod) setEmaPeriod(layout.emaPeriod);
    setIsLayoutMenuOpen(false);
  };

  const deleteLayout = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedLayouts = layouts.filter(l => l.id !== id);
    setLayouts(updatedLayouts);
    localStorage.setItem('aura_chart_layouts', JSON.stringify(updatedLayouts));
  };

  const isUp = token.change24h >= 0;
  const precision = token.category === 'forex' ? 4 : 2;
  const theme = THEME_CONFIGS[currentTheme];

  return (
    <div className="h-full w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col shadow-2xl relative overflow-hidden">
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] pointer-events-none transition-all duration-500"
        style={{ backgroundColor: theme.glow }}
      ></div>

      <div className="flex items-center justify-between mb-4 relative z-[60]">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white italic tracking-tighter">{token.name}</h2>
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  {token.symbol} / USD
                </span>
                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                  <i className="fas fa-circle text-[6px]"></i> Live
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-4">
              <span className="text-3xl font-mono tracking-tighter text-white font-medium">
                {token.category === 'forex' ? '' : '$'}
                {token.price.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })}
              </span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${isUp ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                <i className={`fas fa-arrow-${isUp ? 'up' : 'down'}`}></i>
                {Math.abs(token.change24h)}%
              </span>
            </div>
          </div>

          {/* Chart View Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-center">
            <button 
              onClick={() => setChartMode('native')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase ${chartMode === 'native' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Aura
            </button>
            <button 
              onClick={() => setChartMode('tv')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase ${chartMode === 'tv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TradingView
            </button>
          </div>

          {/* TimeFrame Selector (Native Only) */}
          {chartMode === 'native' && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-center animate-in fade-in">
              {TIME_FRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setCurrentTimeFrame(tf)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all uppercase ${currentTimeFrame === tf ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {chartMode === 'native' && (
          <div className="flex items-center gap-3 relative animate-in fade-in">
            <div className="relative group">
              <button 
                onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-bold uppercase tracking-widest transition-all ${isLayoutMenuOpen ? 'border-indigo-500 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fas fa-layer-group"></i>
                Layouts
              </button>
              {isLayoutMenuOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[100] animate-in slide-in-from-top-2 duration-200">
                  <div className="mb-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Themes</h4>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {(['default', 'neon', 'cyber', 'minimal'] as ChartTheme[]).map(t => (
                        <button 
                          key={t}
                          onClick={() => setCurrentTheme(t)}
                          className={`w-full aspect-square rounded-lg border-2 transition-all ${currentTheme === t ? 'border-indigo-500 scale-105 shadow-lg' : 'border-slate-800 opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: THEME_CONFIGS[t].main }}
                          title={t}
                        ></button>
                      ))}
                    </div>
                    
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Save Current</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Name..."
                        value={newLayoutName}
                        onChange={(e) => setNewLayoutName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                      />
                      <button onClick={saveCurrentLayout} disabled={!newLayoutName.trim()} className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50">
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                    {layouts.length === 0 ? (
                      <div className="text-center py-4 text-slate-600 text-[10px] uppercase font-bold tracking-widest">No layouts yet</div>
                    ) : (
                      layouts.map(layout => (
                        <div 
                          key={layout.id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-transparent hover:border-slate-800 transition-all text-left group/item cursor-pointer"
                          onClick={() => loadLayout(layout)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME_CONFIGS[layout.theme || 'default'].main }}></div>
                            <span className="text-xs font-medium text-slate-300">{layout.name}</span>
                            <span className="text-[8px] px-1 bg-slate-800 rounded text-slate-500 font-bold uppercase">{layout.timeFrame || '1m'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <i className="fas fa-external-link-alt text-[9px] text-slate-600 group-hover/item:text-indigo-500"></i>
                             <button 
                               onClick={(e) => deleteLayout(e, layout.id)}
                               className="text-slate-700 hover:text-rose-500 transition-colors p-1"
                             >
                               <i className="fas fa-trash-alt text-[9px]"></i>
                             </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mr-2 items-center">
              {['sma', 'ema', 'rsi', 'volume'].map((ind) => (
                <button 
                  key={ind}
                  onClick={() => setIndicators(prev => ({ ...prev, [ind]: !prev[ind as keyof typeof indicators] }))}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase ${indicators[ind as keyof typeof indicators] ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {ind}
                </button>
              ))}
              {indicators.ema && (
                <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 ml-1 overflow-hidden h-[26px]">
                    <div className="px-2 bg-slate-900 border-r border-slate-800 text-[8px] font-bold text-slate-500 uppercase flex items-center h-full">Len</div>
                    <input 
                        type="number" 
                        min="1"
                        max="200"
                        value={emaPeriod} 
                        onChange={(e) => setEmaPeriod(Math.max(1, parseInt(e.target.value) || 20))}
                        className="w-10 bg-transparent text-center text-[10px] font-mono text-white focus:outline-none h-full"
                    />
                </div>
              )}
            </div>

            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)} 
                title="Fibonacci Drawing Tool"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isDrawingMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fas fa-pencil-ruler text-xs"></i>
              </button>
              <button 
                onClick={() => setShowFib(!showFib)} 
                onDoubleClick={clearFib}
                title="Auto/Toggle Fibonacci"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${showFib ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="fas fa-compass"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col gap-4">
        {chartMode === 'tv' ? (
          <TradingViewWidget symbol={token.symbol} category={token.category} />
        ) : (
          <>
            <div className={indicators.rsi || indicators.volume ? "h-[55%]" : "h-full"}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ cursor: isDrawingMode ? 'crosshair' : 'default' }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.main} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={theme.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: CHART_COLORS.text, fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '11px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontFamily: 'JetBrains Mono' }}
                    cursor={isDrawingMode ? false : { stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  
                  {showFib && fibLevels.map((fib, idx) => (
                    <ReferenceLine 
                      key={idx} 
                      y={fib.price} 
                      stroke={theme.main} 
                      strokeDasharray="4 4" 
                      strokeOpacity={0.6}
                      strokeWidth={manualFib ? 1.5 : 1}
                    >
                      <Label 
                        value={`${fib.label}`} 
                        position="right" 
                        fill={theme.main} 
                        fontSize={10} 
                        fontWeight="bold"
                        offset={10} 
                      />
                    </ReferenceLine>
                  ))}

                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={theme.main} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={300} 
                  />
                  {indicators.sma && <Line type="monotone" dataKey="sma" stroke="#f97316" strokeWidth={2} dot={false} animationDuration={300} />}
                  {indicators.ema && <Line type="monotone" dataKey="ema" stroke="#a855f7" strokeWidth={2} dot={false} animationDuration={300} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {indicators.volume && (
              <div className={indicators.rsi ? "h-[20%]" : "h-[40%]"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="volume">
                      {chartData.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.isUp ? theme.up : theme.down} fillOpacity={0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {indicators.rsi && (
              <div className="h-[20%] border-t border-slate-800 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <YAxis domain={[0, 100]} hide />
                    <ReferenceLine y={70} stroke={theme.down} strokeDasharray="3 3" strokeOpacity={0.3} />
                    <ReferenceLine y={30} stroke={theme.up} strokeDasharray="3 3" strokeOpacity={0.3} />
                    <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1.5} dot={false} animationDuration={300} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-6 mt-4 pt-4 border-t border-slate-800 relative z-10">
        <div className="space-y-1">
          <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Market Status</div>
          <div className="text-white font-mono text-sm font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Open
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">24h Low</div>
          <div className="text-white font-mono text-sm font-bold">${(token.price * 0.985).toFixed(precision)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">24h High</div>
          <div className="text-white font-mono text-sm font-bold">${(token.price * 1.015).toFixed(precision)}</div>
        </div>
        <div className="space-y-1 flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Resolution</div>
            <div className="text-indigo-400 font-mono text-sm font-bold">
              {chartMode === 'tv' ? 'AUTO' : currentTimeFrame.toUpperCase()} / USD
            </div>
          </div>
          {isDrawingMode && chartMode === 'native' && (
             <div className="bg-indigo-600/20 text-indigo-400 text-[8px] font-bold px-2 py-1 rounded animate-pulse uppercase">
               Drawing Mode
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainChart;
