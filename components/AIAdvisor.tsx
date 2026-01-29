
import React, { useState, useEffect } from 'react';
import { Token, MarketInsight } from '../types';
import { gemini } from '../services/geminiService';

interface AIAdvisorProps {
  token: Token;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ token }) => {
  const [insight, setInsight] = useState<MarketInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await gemini.getTokenInsights(token.symbol, token.name);
        setInsight(data);
      } catch (err) {
        setError("Failed to load Gemini insights. Please check your network.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [token]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse">
            <i className="fas fa-magic text-[10px] text-white"></i>
          </div>
          <h3 className="font-bold text-slate-200">Gemini Alpha Insight</h3>
        </div>
        {loading && <div className="animate-spin text-indigo-500"><i className="fas fa-circle-notch"></i></div>}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="text-rose-500 text-sm p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        ) : insight ? (
          <>
            <div className="flex items-center gap-4">
              <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 flex-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Sentiment</div>
                <div className={`text-lg font-bold ${
                  insight.sentiment === 'Bullish' ? 'text-emerald-500' : 
                  insight.sentiment === 'Bearish' ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  {insight.sentiment}
                </div>
              </div>
              <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 flex-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Confidence</div>
                <div className="text-lg font-bold text-white font-mono">{insight.score}%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-2">Technical Analysis</h4>
              <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic">
                {insight.summary}
              </div>
            </div>

            {/* NEW: Strategy Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">AI Strategy Signals</h4>
                <div className="flex-1 h-[1px] bg-indigo-500/20"></div>
              </div>
              <div className="grid gap-2">
                {insight.strategies.map((strategy, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3 group hover:border-indigo-500/30 transition-all">
                    <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/20">
                      <i className={`fas ${idx === 0 ? 'fa-bullseye' : idx === 1 ? 'fa-flag-checkered' : 'fa-shield-halved'} text-[10px] text-indigo-400`}></i>
                    </div>
                    <span className="text-xs text-slate-300 font-medium leading-snug">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>

            {insight.sources.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grounding Sources</h4>
                <div className="space-y-2">
                  {insight.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 truncate max-w-[200px]">{source.title}</span>
                        <i className="fas fa-external-link-alt text-[10px] text-slate-600 group-hover:text-indigo-500"></i>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-600 text-center py-10 italic">
            Select a token to see AI insights...
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
        <p className="text-[10px] text-indigo-400 font-medium italic">
          AI strategies are signals, not automated commands. Verify levels before trade execution.
        </p>
      </div>
    </div>
  );
};

export default AIAdvisor;
