import React from 'react';

export const Scanlines: React.FC = () => {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden h-full w-full">
      <div className="scanlines absolute inset-0 opacity-30"></div>
      <div className="crt-flicker absolute inset-0 bg-white opacity-[0.02]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};