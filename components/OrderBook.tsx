
import React, { useState, useEffect, useMemo } from 'react';
import { Token, OrderBookEntry } from '../types';

interface OrderBookProps {
  token: Token;
}

const OrderBook: React.FC<OrderBookProps> = ({ token }) => {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  
  const precision = token.category === 'forex' ? 4 : 2;
  const step = token.category === 'forex' ? 0.0001 : 0.01;

  const generateOrders = (basePrice: number) => {
    const newAsks: OrderBookEntry[] = [];
    const newBids: OrderBookEntry[] = [];
    
    let cumulativeAsk = 0;
    let cumulativeBid = 0;

    // Generate 12 levels for each side
    for (let i = 1; i <= 12; i++) {
      const askPrice = basePrice + (i * step * (Math.random() * 2 + 1));
      const askAmount = Math.random() * (token.category === 'forex' ? 100000 : 2);
      cumulativeAsk += askAmount;
      newAsks.unshift({ price: askPrice, amount: askAmount, total: cumulativeAsk, type: 'ask' });

      const bidPrice = basePrice - (i * step * (Math.random() * 2 + 1));
      const bidAmount = Math.random() * (token.category === 'forex' ? 100000 : 2);
      cumulativeBid += bidAmount;
      newBids.push({ price: bidPrice, amount: bidAmount, total: cumulativeBid, type: 'bid' });
    }

    setAsks(newAsks);
    setBids(newBids);
  };

  useEffect(() => {
    generateOrders(token.price);
    
    const interval = setInterval(() => {
      // Small chance to jitter existing orders
      if (Math.random() > 0.5) {
        generateOrders(token.price);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [token.id, token.price]);

  const maxTotal = useMemo(() => {
    const all = [...asks, ...bids];
    return Math.max(...all.map(o => o.total), 1);
  }, [asks, bids]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[480px] overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-list-ul text-indigo-500"></i>
          Order Book
        </h3>
        <div className="flex gap-2">
           <span className="text-[9px] font-bold text-slate-500 uppercase">Step: {step}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 px-4 py-2 bg-slate-900 border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-wider">
        <span>Price (USD)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden font-mono">
        {/* Asks (Sells) - Red Side */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden">
          {asks.map((order, i) => (
            <div key={i} className="relative group hover:bg-slate-800/50 transition-colors">
              <div 
                className="absolute inset-y-0 right-0 bg-rose-500/10 transition-all duration-500"
                style={{ width: `${(order.total / maxTotal) * 100}%` }}
              ></div>
              <div className="grid grid-cols-3 px-4 py-1.5 text-[10px] relative z-10 border-b border-slate-800/20">
                <span className="text-rose-500 font-bold">{order.price.toFixed(precision)}</span>
                <span className="text-slate-400 text-right">{order.amount.toFixed(precision === 4 ? 1 : 4)}</span>
                <span className="text-slate-500 text-right">{order.total.toFixed(precision === 4 ? 0 : 2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Current Price Mid-Section */}
        <div className="bg-slate-950 py-3 px-4 border-y border-slate-800 flex items-center justify-between shadow-inner">
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-black ${token.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {token.price.toFixed(precision)}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Mid Market</span>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-indigo-400 uppercase">Spread: {(asks[asks.length - 1]?.price - bids[0]?.price || 0).toFixed(precision)}</div>
            <div className="text-[8px] text-slate-600 font-bold uppercase">{(Math.abs(token.change24h)).toFixed(2)}% Mark Price</div>
          </div>
        </div>

        {/* Bids (Buys) - Green Side */}
        <div className="flex-1 overflow-hidden">
          {bids.map((order, i) => (
            <div key={i} className="relative group hover:bg-slate-800/50 transition-colors">
              <div 
                className="absolute inset-y-0 right-0 bg-emerald-500/10 transition-all duration-500"
                style={{ width: `${(order.total / maxTotal) * 100}%` }}
              ></div>
              <div className="grid grid-cols-3 px-4 py-1.5 text-[10px] relative z-10 border-b border-slate-800/20">
                <span className="text-emerald-500 font-bold">{order.price.toFixed(precision)}</span>
                <span className="text-slate-400 text-right">{order.amount.toFixed(precision === 4 ? 1 : 4)}</span>
                <span className="text-slate-500 text-right">{order.total.toFixed(precision === 4 ? 0 : 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Aggregated Depth</span>
        <div className="flex gap-2">
          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full" style={{ width: '45%' }}></div>
          </div>
          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: '55%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
