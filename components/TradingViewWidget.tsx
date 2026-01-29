
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewWidgetProps {
  symbol: string;
  category?: string;
  theme?: 'light' | 'dark';
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol, category = 'crypto', theme = 'dark' }) => {
  const containerId = useRef(`tv-widget-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (window.TradingView) {
        let tvSymbol = 'BINANCE:BTCUSDT';
        const s = symbol.toUpperCase();
        const cleanSymbol = s.replace('/', '');
        
        if (category === 'crypto') {
            tvSymbol = `BINANCE:${s}USDT`;
        } else if (category === 'forex') {
            tvSymbol = `FX:${cleanSymbol}`;
        } else if (category === 'indices') {
             const map: Record<string, string> = {
                'SPX': 'OANDA:SPX500USD',
                'NDX': 'OANDA:NAS100USD',
                'DJI': 'OANDA:US30USD',
                'DAX': 'TVC:DE40',
                'NI225': 'TVC:NI225',
                'FTSE': 'TVC:UKX'
              };
              tvSymbol = map[s] || `OANDA:${s}USD`;
        }

        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: containerId.current,
          hide_side_toolbar: false,
          toolbar_bg: theme === 'dark' ? '#0f172a' : '#ffffff',
          withdateranges: true,
          hide_volume: false,
          studies: []
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      // Small timeout to ensure container is ready if re-mounting
      setTimeout(initWidget, 100);
    }
  }, [symbol, category, theme]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
      <div id={containerId.current} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <div className="animate-pulse text-slate-700 text-xs font-bold uppercase tracking-widest">Initializing Feed...</div>
      </div>
    </div>
  );
};

export default TradingViewWidget;
