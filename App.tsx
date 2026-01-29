
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import TokenList from './components/TokenList';
import MainChart from './components/MainChart';
import TradePanel from './components/TradePanel';
import AIAdvisor from './components/AIAdvisor';
import MarketNews from './components/MarketNews';
import WalletModal from './components/WalletModal';
import AccountSetup from './components/AccountSetup';
import OrderBook from './components/OrderBook';
import { INITIAL_TOKENS, FOREX_PAIRS, GLOBAL_INDICES } from './constants';
import { Token, PortfolioAsset, Trade, UserProfile, BrokerAccount, TransactionRecord, OrderMode, OrderSide, OrderStatus } from './types';

const App: React.FC = () => {
  const [cryptoTokens, setCryptoTokens] = useState<Token[]>(INITIAL_TOKENS);
  const [forexPairs, setForexPairs] = useState<Token[]>(FOREX_PAIRS);
  const [indices, setIndices] = useState<Token[]>(GLOBAL_INDICES);
  const [selectedToken, setSelectedToken] = useState<Token>(INITIAL_TOKENS[0]);
  
  const [balance, setBalance] = useState(100000); 
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [history, setHistory] = useState<Trade[]>([]);
  
  const [transfers, setTransfers] = useState<TransactionRecord[]>([
    { id: 'tx-init-1', type: 'deposit', amount: 100000, method: 'Institutional Wire', status: 'Completed', timestamp: Date.now() - 86400000 }
  ]);
  
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<'trades' | 'orders' | 'news' | 'transfers'>('news');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aura_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [broker, setBroker] = useState<BrokerAccount | null>(() => {
    const saved = localStorage.getItem('aura_broker');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const allTokens = [...cryptoTokens, ...forexPairs, ...indices];
      
      const updatedCrypto = cryptoTokens.map(t => ({ ...t, price: Math.max(0.01, t.price + (Math.random() - 0.5) * (t.price * 0.002)) }));
      const updatedForex = forexPairs.map(t => ({ ...t, price: Math.max(0.0001, t.price + (Math.random() - 0.5) * (t.price * 0.0003)) }));
      const updatedIndices = indices.map(t => ({ ...t, price: Math.max(1, t.price + (Math.random() - 0.45) * (t.price * 0.0008)) }));

      setCryptoTokens(updatedCrypto);
      setForexPairs(updatedForex);
      setIndices(updatedIndices);

      const latestTokens = [...updatedCrypto, ...updatedForex, ...updatedIndices];

      // Update selected token price in sync
      const currentSelected = latestTokens.find(t => t.id === selectedToken.id);
      if (currentSelected) setSelectedToken(currentSelected);

      setHistory(prev => {
        let changed = false;
        const newHistory = prev.map(order => {
          const token = latestTokens.find(t => t.id === order.tokenId);
          if (!token) return order;

          if (order.status === 'pending' && order.mode === 'limit') {
            const isBuyFill = order.type === 'buy' && token.price <= (order.limitPrice || 0);
            const isSellFill = order.type === 'sell' && token.price >= (order.limitPrice || 0);

            if (isBuyFill || isSellFill) {
              changed = true;
              executeOrderEffects(order.type, order.amount, token.price, order.tokenId);
              return { ...order, status: 'completed' as OrderStatus, price: token.price };
            }
          }

          if (order.status === 'completed') {
            const isBuy = order.type === 'buy';

            if (order.autoMoveToEntry) {
              const isInProfit = isBuy ? token.price > order.price : token.price < order.price;
              if (isInProfit) {
                changed = true;
                return { ...order, stopLoss: order.price, autoMoveToEntry: false };
              }
            }

            const slHit = isBuy 
              ? (order.stopLoss && token.price <= order.stopLoss)
              : (order.stopLoss && token.price >= order.stopLoss);
            
            const tpHit = isBuy
              ? (order.takeProfit && token.price >= order.takeProfit)
              : (order.takeProfit && token.price <= order.takeProfit);

            if (slHit || tpHit) {
              changed = true;
              const exitPrice = token.price;
              const pnl = isBuy ? (exitPrice - order.price) * order.amount : (order.price - exitPrice) * order.amount;
              
              setBalance(b => b + (order.amount * exitPrice));
              setPortfolio(p => p.map(asset => asset.tokenId === order.tokenId ? { ...asset, amount: asset.amount - order.amount } : asset).filter(a => a.amount > 0));
              
              return { ...order, status: 'closed' as OrderStatus, realizedPnl: pnl };
            }
          }

          return order;
        });
        return changed ? newHistory : prev;
      });

    }, 3000);
    return () => clearInterval(interval);
  }, [cryptoTokens, forexPairs, indices, selectedToken.id]);

  const executeOrderEffects = (type: OrderSide, amount: number, price: number, tokenId: string) => {
    setPortfolio(prev => {
      const existing = prev.find(p => p.tokenId === tokenId);
      if (type === 'buy') {
        return existing 
          ? prev.map(p => p.tokenId === tokenId ? { ...p, amount: p.amount + amount } : p)
          : [...prev, { tokenId, amount, averagePrice: price }];
      } else {
        if (!existing || existing.amount < amount) return prev;
        return prev.map(p => p.tokenId === tokenId ? { ...p, amount: p.amount - amount } : p).filter(p => p.amount > 0);
      }
    });
  };

  const handleTrade = useCallback((
    type: OrderSide, 
    mode: OrderMode, 
    amount: number, 
    limitPrice?: number, 
    stopLoss?: number, 
    takeProfit?: number,
    autoMoveToEntry?: boolean
  ) => {
    const executionPrice = mode === 'market' ? selectedToken.price : (limitPrice || selectedToken.price);
    const totalCost = amount * executionPrice;

    if (type === 'buy') {
      if (totalCost > balance) return alert("Insufficient balance!");
      setBalance(prev => prev - totalCost);
      if (mode === 'market') executeOrderEffects('buy', amount, executionPrice, selectedToken.id);
    } else {
      const existing = portfolio.find(p => p.tokenId === selectedToken.id);
      if (!existing || existing.amount < amount) return alert("Insufficient holdings!");
      if (mode === 'market') {
        setBalance(prev => prev + totalCost);
        executeOrderEffects('sell', amount, executionPrice, selectedToken.id);
      }
    }

    setHistory(prev => [{
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      tokenId: selectedToken.id,
      type,
      mode,
      amount,
      price: mode === 'market' ? executionPrice : 0,
      limitPrice,
      stopLoss,
      takeProfit,
      autoMoveToEntry,
      timestamp: Date.now(),
      status: mode === 'market' ? 'completed' : 'pending'
    }, ...prev]);
  }, [selectedToken, balance, portfolio]);

  const moveSLToEntry = (tradeId: string) => {
    setHistory(prev => prev.map(t => t.id === tradeId ? { ...t, stopLoss: t.price, autoMoveToEntry: false } : t));
  };

  const cancelOrder = (orderId: string) => {
    setHistory(prev => {
      const order = prev.find(o => o.id === orderId);
      if (order?.status === 'pending') {
        if (order.type === 'buy') setBalance(b => b + (order.amount * (order.limitPrice || 0)));
        return prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o);
      }
      return prev;
    });
  };

  const netLiquidity = useMemo(() => {
    const allAssets = [...cryptoTokens, ...forexPairs, ...indices];
    const portfolioValue = portfolio.reduce((sum, asset) => {
      const token = allAssets.find(t => t.id === asset.tokenId);
      return sum + (asset.amount * (token?.price || 0));
    }, 0);
    return balance + portfolioValue;
  }, [balance, portfolio, cryptoTokens, forexPairs, indices]);

  const currentHolding = portfolio.find(p => p.tokenId === selectedToken.id)?.amount || 0;

  if (!userProfile || !broker) return <AccountSetup onComplete={(p, b) => { setUserProfile(p); setBroker(b); }} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      <TokenList cryptoTokens={cryptoTokens} forexPairs={forexPairs} indices={indices} selectedId={selectedToken.id} onSelect={setSelectedToken} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gateway</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${broker.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="text-sm font-bold text-white">{broker.name}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global P&L</span>
              <span className="text-sm font-bold text-indigo-400 font-mono">${netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsWalletOpen(true)} className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 font-mono font-bold text-sm text-white hover:bg-slate-700 transition-colors">
               ${balance.toLocaleString()}
             </button>
             <div className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-indigo-500 shadow-lg shadow-indigo-600/20 overflow-hidden">
               <img src={userProfile.avatar} alt="User" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-6 flex gap-6">
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex-1 min-h-[400px]">
              <MainChart token={selectedToken} />
            </div>
            
            <div className="h-1/3 min-h-[280px] bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {['news', 'trades', 'orders', 'transfers'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActivityTab(tab as any)} 
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activityTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activityTab === 'news' ? (
                  <MarketNews category={selectedToken.category} />
                ) : activityTab === 'trades' ? (
                  <table className="w-full text-[11px] text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-2 pl-4">Asset</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2">Entry</th>
                        <th className="pb-2">Protection</th>
                        <th className="pb-2">Current P&L</th>
                        <th className="pb-2 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.filter(h => h.status === 'completed').map((t) => {
                        const asset = [...cryptoTokens, ...forexPairs, ...indices].find(tk => tk.id === t.tokenId);
                        const curPrice = asset?.price || 0;
                        const isBuy = t.type === 'buy';
                        const pnlPct = isBuy ? ((curPrice - t.price) / t.price) * 100 : ((t.price - curPrice) / t.price) * 100;
                        const isProfitable = pnlPct > 0;
                        
                        return (
                          <tr key={t.id} className="bg-slate-950/50 hover:bg-slate-800 transition-colors group">
                            <td className="py-3 pl-4 rounded-l-2xl font-bold text-slate-200">{asset?.symbol}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isBuy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {isBuy ? 'LONG' : 'SHORT'}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-400">{t.price.toFixed(asset?.category === 'forex' ? 4 : 2)}</td>
                            <td className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] text-rose-500 font-bold">SL: {t.stopLoss?.toFixed(asset?.category === 'forex' ? 4 : 2) || 'NONE'}</span>
                                <span className="text-[8px] text-emerald-500 font-bold">TP: {t.takeProfit?.toFixed(asset?.category === 'forex' ? 4 : 2) || 'NONE'}</span>
                                {t.autoMoveToEntry && (
                                  <span className="text-[7px] text-indigo-400 font-bold italic">AUTO-BE ACTIVE</span>
                                )}
                              </div>
                            </td>
                            <td className={`py-3 font-mono font-bold ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%
                            </td>
                            <td className="py-3 text-right pr-4 rounded-r-2xl">
                              {isProfitable && t.stopLoss !== t.price && (
                                <button 
                                  onClick={() => moveSLToEntry(t.id)}
                                  className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded-md hover:bg-indigo-500 hover:text-white transition-all"
                                  title="Protect Trade: Move SL to Entry"
                                >
                                  MOVE SL TO ENTRY
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : activityTab === 'orders' ? (
                  <table className="w-full text-[11px] text-left border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-2 pl-4">Instrument</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2">Limit Price</th>
                        <th className="pb-2 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.filter(h => h.status === 'pending').map((t) => (
                        <tr key={t.id} className="bg-slate-950/50 hover:bg-slate-800">
                          <td className="py-3 pl-4 rounded-l-2xl font-bold">{t.tokenId}</td>
                          <td className="py-3">{t.type} limit</td>
                          <td className="py-3 font-mono font-bold text-indigo-400">${t.limitPrice}</td>
                          <td className="py-3 text-right pr-4 rounded-r-2xl">
                            <button onClick={() => cancelOrder(t.id)} className="text-[10px] text-rose-500 font-bold uppercase hover:bg-rose-500/10 px-2 py-1 rounded">Cancel</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="w-96 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar">
            <TradePanel token={selectedToken} onTrade={handleTrade} balance={balance} holding={currentHolding} />
            <OrderBook token={selectedToken} />
            <AIAdvisor token={selectedToken} />
          </aside>
        </div>
      </main>

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} balance={balance} onDeposit={(a, m) => {setBalance(b => b + a); setTransfers(prev => [{id: Math.random().toString(), type: 'deposit', amount: a, method: m, status: 'Completed', timestamp: Date.now()}, ...prev])}} onWithdraw={(a, m) => {setBalance(b => b - a); setTransfers(prev => [{id: Math.random().toString(), type: 'withdrawal', amount: a, method: m, status: 'Completed', timestamp: Date.now()}, ...prev])}} />
    </div>
  );
};

export default App;
