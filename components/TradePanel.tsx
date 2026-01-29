
import React, { useState, useEffect } from 'react';
import { Token, OrderMode, OrderSide } from '../types';

interface TradePanelProps {
  token: Token;
  onTrade: (type: OrderSide, mode: OrderMode, amount: number, limitPrice?: number, stopLoss?: number, takeProfit?: number, autoMoveToEntry?: boolean) => void;
  balance: number;
  holding: number;
}

const TradePanel: React.FC<TradePanelProps> = ({ token, onTrade, balance, holding }) => {
  const [amount, setAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [autoMoveToEntry, setAutoMoveToEntry] = useState(false);
  const [useProtection, setUseProtection] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderSide>('buy');
  const [orderMode, setOrderMode] = useState<OrderMode>('market');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (orderMode === 'limit' && !limitPrice) {
      setLimitPrice(token.price.toString());
    }
  }, [orderMode, token.price]);

  const handleOpenConfirm = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      setShowConfirm(true);
    }
  };

  const handleExecute = () => {
    const val = parseFloat(amount);
    const lp = orderMode === 'limit' ? parseFloat(limitPrice) : undefined;
    const sl = useProtection && stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = useProtection && takeProfit ? parseFloat(takeProfit) : undefined;
    const am = useProtection && autoMoveToEntry;
    
    onTrade(activeTab, orderMode, val, lp, sl, tp, am);
    setAmount('');
    setStopLoss('');
    setTakeProfit('');
    setAutoMoveToEntry(false);
    setShowConfirm(false);
  };

  const currentPrice = token.price;
  const precision = token.category === 'forex' ? 4 : 2;
  const total = parseFloat(amount) * (orderMode === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice) || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col shadow-2xl relative">
      {/* Side Selector */}
      <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
        <button 
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === 'buy' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {token.category === 'forex' ? 'Long' : 'Buy'}
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === 'sell' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {token.category === 'forex' ? 'Short' : 'Sell'}
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-4 mb-6 px-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Type</span>
        <div className="flex-1 h-[1px] bg-slate-800"></div>
        <div className="flex gap-2">
          {['market', 'limit'].map((mode) => (
            <button
              key={mode}
              onClick={() => setOrderMode(mode as OrderMode)}
              className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border transition-all ${
                orderMode === mode 
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                : 'border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* Target Price (Conditional) */}
        {orderMode === 'limit' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-slate-500 uppercase font-bold tracking-tighter">Target Entry Price</span>
            </div>
            <div className="relative">
              <input 
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                step={token.category === 'forex' ? "0.0001" : "0.01"}
                className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-4 text-xl font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-700"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold opacity-50 uppercase text-xs tracking-widest">USD</span>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="flex justify-between text-xs font-medium mb-2">
            <span className="text-slate-500 uppercase font-bold tracking-tighter">Trade Quantity</span>
            <span className="text-slate-300 font-mono">Avail: ${balance.toLocaleString()}</span>
          </div>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xl font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder:text-slate-700"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">{token.symbol}</span>
          </div>
        </div>

        {/* Protection Toggle */}
        <div className="pt-2">
          <button 
            onClick={() => setUseProtection(!useProtection)}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 transition-colors ${useProtection ? 'text-indigo-400' : 'text-slate-500'}`}
          >
            <i className={`fas ${useProtection ? 'fa-check-square' : 'fa-square'}`}></i>
            Risk Management (SL/TP)
          </button>
          
          {useProtection && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-rose-500 uppercase">Stop Loss</label>
                  <input 
                    type="number" 
                    value={stopLoss} 
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Price"
                    className="w-full bg-slate-950 border border-rose-500/20 rounded-lg p-2 text-xs text-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-emerald-500 uppercase">Take Profit</label>
                  <input 
                    type="number" 
                    value={takeProfit} 
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="Price"
                    className="w-full bg-slate-950 border border-emerald-500/20 rounded-lg p-2 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* New: Auto-BE Toggle */}
              <div 
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${autoMoveToEntry ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}
                onClick={() => setAutoMoveToEntry(!autoMoveToEntry)}
              >
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${autoMoveToEntry ? 'text-indigo-400' : 'text-slate-500'}`}>Auto Break-Even</span>
                  <span className="text-[8px] text-slate-600 font-medium">Move SL to Entry on Profit</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${autoMoveToEntry ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoMoveToEntry ? 'left-[18px]' : 'left-0.5'}`}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trade Summary */}
        <div className="bg-slate-950/50 p-4 rounded-xl space-y-2 text-sm border border-slate-800/50">
          <div className="flex justify-between">
            <span className="text-slate-500">Execution Rate</span>
            <span className="text-slate-300 font-mono">
              {orderMode === 'market' ? currentPrice.toFixed(precision) : 'Limit Trigger'}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-200 font-bold">Estimated Cost</span>
            <span className="text-white font-mono font-bold">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Execution Button */}
      <button 
        onClick={handleOpenConfirm}
        disabled={!amount || parseFloat(amount) <= 0}
        className={`w-full py-5 rounded-xl font-bold text-lg mt-6 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
          activeTab === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
        }`}
      >
        {orderMode === 'market' 
          ? (activeTab === 'buy' ? `MARKET BUY` : `MARKET SELL`)
          : (activeTab === 'buy' ? `PLACE BUY LIMIT` : `PLACE SELL LIMIT`)}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowConfirm(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <i className={`fas fa-shield-alt ${activeTab === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}></i>
              Confirm Transaction
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-xs font-bold uppercase">Instrument</span>
                <span className="text-white font-bold">{token.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-500 text-xs font-bold uppercase">Quantity</span>
                <span className="text-white font-mono font-bold">{amount} {token.symbol}</span>
              </div>
              {useProtection && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-rose-500 font-bold uppercase">Safety Stop</span>
                    <span className="text-white font-mono">{stopLoss || 'NOT SET'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-emerald-500 font-bold uppercase">Target Exit</span>
                    <span className="text-white font-mono">{takeProfit || 'NOT SET'}</span>
                  </div>
                  {autoMoveToEntry && (
                    <div className="flex items-center gap-2 text-indigo-400">
                      <i className="fas fa-magic text-[8px]"></i>
                      <span className="text-[9px] font-bold uppercase">Auto Break-Even Enabled</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm">Abort</button>
              <button onClick={handleExecute} className={`flex-1 py-4 rounded-xl font-black text-white text-sm ${activeTab === 'buy' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradePanel;
