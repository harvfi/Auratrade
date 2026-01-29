
import React, { useState, useMemo } from 'react';
import ApplePayButton from './ApplePayButton';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, method: string) => void;
  onWithdraw: (amount: number, method: string) => void;
  balance: number;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onDeposit, onWithdraw, balance }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [amount, setAmount] = useState('1000');
  const [method, setMethod] = useState('Apple Pay');

  if (!isOpen) return null;

  const handleAction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    
    if (activeTab === 'withdraw' && val > balance) {
      alert("Insufficient terminal balance for this withdrawal.");
      return;
    }

    setStep('processing');
    setTimeout(() => {
      if (activeTab === 'deposit') {
        onDeposit(val, method);
      } else {
        onWithdraw(val, method);
      }
      setStep('success');
    }, 2500);
  };

  const resetAndClose = () => {
    setStep('selection');
    setAmount('1000');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={resetAndClose}></div>
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Capital Gateway</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Institutional Liquidity Manager</p>
          </div>
          <button onClick={resetAndClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-10">
          {step === 'selection' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {/* Tab Switcher */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button 
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'deposit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className="fas fa-arrow-down-left mr-2"></i>Deposit
                </button>
                <button 
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'withdraw' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className="fas fa-arrow-up-right mr-2"></i>Withdraw
                </button>
              </div>

              {/* Balance Glance */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current Liquidity</div>
                  <div className="text-2xl font-mono font-bold text-white">${balance.toLocaleString()}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <i className="fas fa-wallet text-xl"></i>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Transfer Amount</label>
                  {activeTab === 'withdraw' && (
                    <button onClick={() => setAmount(balance.toString())} className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 uppercase tracking-wider">Use Max</button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-4xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold">USD</div>
                </div>
              </div>

              {/* Method Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Destination / Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setMethod('Apple Pay')}
                    className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${method === 'Apple Pay' ? 'bg-white text-black border-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <i className="fab fa-apple text-xl"></i>
                    <span className="font-bold">Apple Pay</span>
                  </button>
                  <button 
                    onClick={() => setMethod('Bank Transfer')}
                    className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${method === 'Bank Transfer' ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <i className="fas fa-university text-xl"></i>
                    <span className="font-bold">Wire</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              {activeTab === 'deposit' && method === 'Apple Pay' ? (
                <ApplePayButton onClick={handleAction} label="Fund with" />
              ) : (
                <button 
                  onClick={handleAction}
                  className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-[0.98] ${
                    activeTab === 'deposit' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {activeTab === 'deposit' ? 'Initiate Deposit' : 'Confirm Withdrawal'}
                </button>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative mb-10">
                <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className={`fas fa-${activeTab === 'deposit' ? 'arrow-down' : 'arrow-up'} text-2xl text-indigo-500 animate-bounce`}></i>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Syncing with Nodes</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Verifying {method} authentication and processing liquidity transfer across global broker gateways...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-10 text-emerald-500 text-5xl">
                <i className="fas fa-check-double"></i>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">Transmission Complete</h3>
              <p className="text-slate-400 text-sm mb-12 max-w-xs mx-auto">
                Successfully {activeTab === 'deposit' ? 'received' : 'dispatched'} <strong>${parseFloat(amount).toLocaleString()}</strong> via {method}. Your balance has been updated.
              </p>
              <button 
                onClick={resetAndClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 rounded-2xl transition-all border border-slate-700"
              >
                Back to Terminal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
