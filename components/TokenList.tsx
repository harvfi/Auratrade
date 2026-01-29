
import React, { useState, useEffect, useMemo } from 'react';
import { Token } from '../types';

interface TokenListProps {
  cryptoTokens: Token[];
  forexPairs: Token[];
  indices: Token[];
  selectedId: string;
  onSelect: (token: Token) => void;
}

type Category = 'crypto' | 'forex' | 'indices' | 'favorites';

const TokenList: React.FC<TokenListProps> = ({ cryptoTokens, forexPairs, indices, selectedId, onSelect }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('crypto');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('aura_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('aura_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(tokenId) 
        ? prev.filter(id => id !== tokenId) 
        : [...prev, tokenId]
    );
  };

  const allTokens = useMemo(() => [...cryptoTokens, ...forexPairs, ...indices], [cryptoTokens, forexPairs, indices]);

  const tokens = useMemo(() => {
    let filtered: Token[] = [];
    if (activeCategory === 'favorites') {
      filtered = allTokens.filter(t => favorites.includes(t.id));
    } else {
      filtered = activeCategory === 'crypto' 
        ? cryptoTokens 
        : activeCategory === 'forex' 
          ? forexPairs 
          : indices;
    }

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [activeCategory, cryptoTokens, forexPairs, indices, favorites, allTokens, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-80 shrink-0">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <i className="fas fa-sparkles text-white text-sm"></i>
          </div>
          <h1 className="font-bold text-lg tracking-[0.2em] uppercase italic bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AURA</h1>
        </div>

        {/* Category Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 overflow-hidden">
          {(['crypto', 'forex', 'indices', 'favorites'] as Category[]).map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap px-1 ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat === 'favorites' ? 'Favs' : cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory}...`} 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-2 py-3 flex flex-col gap-1">
          {tokens.length === 0 ? (
            <div className="py-20 text-center text-slate-600 text-xs italic">
              {activeCategory === 'favorites' ? 'No favorites pinned yet.' : 'No instruments found.'}
            </div>
          ) : (
            tokens.map((token) => (
              <button
                key={token.id}
                onClick={() => onSelect(token)}
                className={`flex flex-col p-3 rounded-xl transition-all group border relative ${
                  selectedId === token.id 
                    ? 'bg-slate-800 border-slate-700 shadow-lg shadow-black/20' 
                    : 'hover:bg-slate-800/50 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-inner transition-transform group-hover:scale-105"
                        style={{ backgroundColor: token.color }}
                      >
                        {token.symbol[0]}
                      </div>
                      <div 
                        onClick={(e) => toggleFavorite(e, token.id)}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[8px] transition-all hover:scale-110 z-10 ${
                          favorites.includes(token.id) ? 'text-yellow-500' : 'text-slate-600'
                        }`}
                      >
                        <i className={`${favorites.includes(token.id) ? 'fas' : 'far'} fa-star`}></i>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        {token.symbol}
                        {token.category === 'forex' && <span className="text-[7px] bg-slate-950 text-indigo-400 px-1 py-0.5 rounded font-black border border-indigo-500/20">FX</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate w-24">{token.name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-medium text-slate-200">
                      {token.category === 'forex' 
                        ? token.price.toFixed(4) 
                        : token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-medium ${token.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                    </div>
                  </div>
                </div>
                
                {activeCategory !== 'favorites' && (
                  <>
                    {token.category === 'forex' && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center w-full">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Current Spread</span>
                        <span className="text-[10px] font-mono text-indigo-400">{token.spread} pips</span>
                      </div>
                    )}

                    {token.category === 'indices' && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center w-full">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">24h Vol</span>
                        <span className="text-[10px] font-mono text-indigo-400">{token.volume24h}</span>
                      </div>
                    )}
                  </>
                )}

                {activeCategory === 'favorites' && (
                  <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center w-full">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Class</span>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{token.category}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenList;
