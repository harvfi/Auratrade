
import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { gemini } from '../services/geminiService';

interface MarketNewsProps {
  category?: string;
}

const MarketNews: React.FC<MarketNewsProps> = ({ category = 'crypto' }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const data = await gemini.getMarketNews(category);
      setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, [category]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-slate-800/50 h-16 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-1 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2 px-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Pulse Feed</span>
      </div>
      
      {news.length === 0 ? (
        <div className="text-center py-10 text-slate-600 text-xs italic">
          Unable to synchronize with news nodes...
        </div>
      ) : (
        news.map((article, idx) => (
          <a 
            key={idx} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col p-4 bg-slate-950/50 hover:bg-slate-800 border border-slate-800/50 rounded-2xl transition-all"
          >
            <div className="flex justify-between items-start gap-4 mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-tighter">
                {article.source}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">{article.time}</span>
            </div>
            <h4 className="text-xs font-semibold text-slate-300 group-hover:text-white leading-relaxed line-clamp-2">
              {article.title}
            </h4>
            <div className="mt-2 flex items-center gap-1 text-[9px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Read Transmission <i className="fas fa-chevron-right text-[7px]"></i>
            </div>
          </a>
        ))
      )}
    </div>
  );
};

export default MarketNews;
