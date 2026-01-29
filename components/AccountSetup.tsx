
import React, { useState } from 'react';
import { UserProfile, BrokerAccount } from '../types';
import { MOCK_BROKERS } from '../constants';

interface AccountSetupProps {
  onComplete: (profile: UserProfile, broker: BrokerAccount) => void;
}

const AccountSetup: React.FC<AccountSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedBroker, setSelectedBroker] = useState<string>('brk-1');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNext = () => {
    if (step === 1 && name.trim()) setStep(2);
    else if (step === 2) {
      setIsVerifying(true);
      setTimeout(() => {
        const broker = MOCK_BROKERS.find(b => b.brokerId === selectedBroker)!;
        onComplete(
          {
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            level: 'Novice',
            joinedAt: Date.now()
          },
          {
            ...broker as BrokerAccount,
            status: 'Connected',
            ping: Math.floor(Math.random() * 20) + 5
          }
        );
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-xl w-full">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-600/40 rotate-3 hover:rotate-0 transition-transform">
            <i className="fas fa-sparkles text-white text-2xl"></i>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">AURA</h1>
          <p className="text-slate-500 uppercase text-xs font-bold tracking-[0.2em]">Enter the flow</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex bg-slate-950 p-2">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 flex items-center justify-center gap-2 py-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${step >= s ? 'text-indigo-400' : 'text-slate-600'}`}>
                  {s === 1 ? 'Profile' : 'Connectivity'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-10">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trader Identity</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter display name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                  />
                </div>
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`} alt="Preview" />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-100">{name || 'New Trader'}</h4>
                      <p className="text-xs text-indigo-400/60 leading-relaxed">Your profile will be used for execution logs and terminal performance tracking.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && !isVerifying && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Broker Gateway</label>
                  <div className="grid grid-cols-2 gap-3">
                    {MOCK_BROKERS.map(broker => (
                      <button
                        key={broker.brokerId}
                        onClick={() => setSelectedBroker(broker.brokerId!)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedBroker === broker.brokerId 
                            ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold mb-1">{broker.name}</div>
                        <div className="text-[10px] opacity-60 truncate">{broker.serverLocation}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">API Authentication (Mock)</label>
                  <input type="password" value="••••••••••••••••" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-500" />
                </div>
              </div>
            )}

            {isVerifying && (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-server text-indigo-600 text-xl"></i>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Establishing Secure Uplink</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Connecting to {MOCK_BROKERS.find(b => b.brokerId === selectedBroker)?.name} servers via WebSocket encryption...</p>
                
                <div className="w-full bg-slate-950 h-2 rounded-full mt-10 overflow-hidden max-w-xs mx-auto">
                  <div className="bg-indigo-600 h-full animate-[progress_2.5s_ease-in-out]"></div>
                </div>
              </div>
            )}

            {!isVerifying && (
              <button
                onClick={handleNext}
                disabled={step === 1 && !name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl mt-8 transition-all shadow-xl shadow-indigo-600/20"
              >
                {step === 1 ? 'Confirm Identity' : 'Securely Connect Broker'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default AccountSetup;