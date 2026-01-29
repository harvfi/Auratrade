
import React from 'react';

interface ApplePayButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({ onClick, label = "Buy with", disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-black text-white rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all active:scale-[0.98] disabled:opacity-50"
    >
      <span className="text-sm font-medium">{label}</span>
      <i className="fab fa-apple text-xl mb-0.5"></i>
      <span className="text-lg font-bold -ml-1">Pay</span>
    </button>
  );
};

export default ApplePayButton;
