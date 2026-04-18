import React from 'react';

export const ActionButton = ({ label, onClick, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    outline: 'border border-slate-700 hover:bg-slate-800 text-slate-300'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-bold transition-all active:scale-95 uppercase tracking-wide text-sm ${styles[variant]}`}
    >
      {label}
    </button>
  );
};
