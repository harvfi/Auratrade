
export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: string;
  volume24h: string;
  color: string;
  category?: 'crypto' | 'forex' | 'indices';
  spread?: number; // In pips or basis points
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'closed';
export type OrderSide = 'buy' | 'sell';
export type OrderMode = 'market' | 'limit';

export interface Trade {
  id: string;
  tokenId: string;
  type: OrderSide;
  mode: OrderMode;
  amount: number;
  price: number; // Execution price
  limitPrice?: number; // Target price for limit orders
  stopLoss?: number;
  takeProfit?: number;
  autoMoveToEntry?: boolean; // New: Flag to trigger SL move to entry on profit
  timestamp: number;
  status: OrderStatus;
  realizedPnl?: number;
}

export interface PortfolioAsset {
  tokenId: string;
  amount: number;
  averagePrice: number;
}

export interface MarketInsight {
  summary: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  sources: { title: string; uri: string }[];
  strategies: string[];
}

export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  time: string;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  type: 'bid' | 'ask';
}

export interface PricePoint {
  time: string;
  price: number;
  volume?: number;
  isUp?: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: 'Novice' | 'Intermediate' | 'Pro' | 'Whale';
  joinedAt: number;
}

export interface BrokerAccount {
  brokerId: string;
  name: string;
  status: 'Connected' | 'Disconnected' | 'Verifying';
  ping: number;
  serverLocation: string;
}

export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  status: 'Completed' | 'Pending';
  timestamp: number;
}

export type ChartTheme = 'default' | 'neon' | 'cyber' | 'minimal';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface FibDrawing {
  startPrice: number;
  endPrice: number;
}

export interface ChartLayout {
  id: string;
  name: string;
  indicators: {
    sma: boolean;
    ema: boolean;
    rsi: boolean;
    volume: boolean;
  };
  showFib: boolean;
  manualFib?: FibDrawing; // User-drawn levels
  theme: ChartTheme;
  timeFrame?: TimeFrame;
  emaPeriod?: number; // Configurable EMA period
  timestamp: number;
}
