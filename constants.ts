
import { Token, BrokerAccount, ChartTheme } from './types';

export const INITIAL_TOKENS: Token[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 68432.12, change24h: 2.45, marketCap: '1.34T', volume24h: '32.1B', color: '#F7931A', category: 'crypto' },
  { id: '2', symbol: 'ETH', name: 'Ethereum', price: 3421.55, change24h: -1.2, marketCap: '410.2B', volume24h: '18.4B', color: '#627EEA', category: 'crypto' },
  { id: '3', symbol: 'SOL', name: 'Solana', price: 145.88, change24h: 5.67, marketCap: '65.3B', volume24h: '4.2B', color: '#14F195', category: 'crypto' },
  { id: '4', symbol: 'LINK', name: 'Chainlink', price: 18.22, change24h: 0.15, marketCap: '10.7B', volume24h: '850M', color: '#2A5ADA', category: 'crypto' },
  { id: '5', symbol: 'ARB', name: 'Arbitrum', price: 1.12, change24h: -4.3, marketCap: '2.9B', volume24h: '420M', color: '#28A0F0', category: 'crypto' },
  { id: '6', symbol: 'OP', name: 'Optimism', price: 2.45, change24h: 12.8, marketCap: '2.4B', volume24h: '560M', color: '#FF0420', category: 'crypto' },
];

export const FOREX_PAIRS: Token[] = [
  { id: 'fx-1', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0845, change24h: -0.12, marketCap: 'N/A', volume24h: '6.6T', color: '#003399', category: 'forex', spread: 0.8 },
  { id: 'fx-2', symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2633, change24h: 0.22, marketCap: 'N/A', volume24h: '2.4T', color: '#CF142B', category: 'forex', spread: 1.2 },
  { id: 'fx-3', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 151.42, change24h: 0.45, marketCap: 'N/A', volume24h: '1.8T', color: '#BC002D', category: 'forex', spread: 0.6 },
  { id: 'fx-4', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6542, change24h: -0.34, marketCap: 'N/A', volume24h: '900B', color: '#00008B', category: 'forex', spread: 1.5 },
  { id: 'fx-5', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3578, change24h: 0.08, marketCap: 'N/A', volume24h: '800B', color: '#FF0000', category: 'forex', spread: 1.8 },
  { id: 'fx-6', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.9021, change24h: -0.15, marketCap: 'N/A', volume24h: '700B', color: '#D52B1E', category: 'forex', spread: 1.4 },
];

export const GLOBAL_INDICES: Token[] = [
  { id: 'idx-1', symbol: 'SPX', name: 'S&P 500 Index', price: 5241.53, change24h: 0.82, marketCap: '43T', volume24h: '420B', color: '#4CAF50', category: 'indices' },
  { id: 'idx-2', symbol: 'NDX', name: 'Nasdaq 100', price: 18321.44, change24h: 1.24, marketCap: '22T', volume24h: '280B', color: '#03A9F4', category: 'indices' },
  { id: 'idx-3', symbol: 'DJI', name: 'Dow Jones Industrial', price: 39121.32, change24h: 0.45, marketCap: '12T', volume24h: '150B', color: '#FFC107', category: 'indices' },
  { id: 'idx-4', symbol: 'DAX', name: 'DAX 40 (Germany)', price: 18123.50, change24h: -0.21, marketCap: '2.1T', volume24h: '85B', color: '#000000', category: 'indices' },
  { id: 'idx-5', symbol: 'NI225', name: 'Nikkei 225 (Japan)', price: 40121.00, change24h: -1.15, marketCap: '6.4T', volume24h: '95B', color: '#FF5252', category: 'indices' },
  { id: 'idx-6', symbol: 'FTSE', name: 'FTSE 100 (UK)', price: 7931.25, change24h: 0.12, marketCap: '2.4T', volume24h: '42B', color: '#1A237E', category: 'indices' },
];

export const MOCK_BROKERS: Partial<BrokerAccount>[] = [
  { brokerId: 'brk-1', name: 'Nexus Prime', serverLocation: 'New York (AWS-US-1)' },
  { brokerId: 'brk-2', name: 'Apex Liquidity', serverLocation: 'London (LSE-Hub)' },
  { brokerId: 'brk-3', name: 'Zenith Exchange', serverLocation: 'Tokyo (TSE-Direct)' },
  { brokerId: 'brk-4', name: 'Iron Cloud Trading', serverLocation: 'Frankfurt (Equinix-FR2)' },
];

export const CHART_COLORS = {
  up: '#10b981',
  down: '#f43f5e',
  grid: '#1e293b',
  text: '#94a3b8'
};

export const THEME_CONFIGS: Record<ChartTheme, { up: string; down: string; main: string; glow: string }> = {
  default: { up: '#10b981', down: '#f43f5e', main: '#6366f1', glow: 'rgba(99, 102, 241, 0.2)' },
  neon: { up: '#00ffcc', down: '#ff0055', main: '#ff00ff', glow: 'rgba(255, 0, 255, 0.2)' },
  cyber: { up: '#39ff14', down: '#ff3131', main: '#00d9ff', glow: 'rgba(0, 217, 255, 0.2)' },
  minimal: { up: '#ffffff', down: '#4b5563', main: '#9ca3af', glow: 'rgba(156, 163, 175, 0.2)' }
};
