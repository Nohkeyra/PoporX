
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BoltIcon } from './icons';

interface HeaderProps {
    isPlatinumTier: boolean;
    onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isPlatinumTier, onGoHome }) => {
  return (
    <header className="w-full pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 px-6 border-b border-zinc-800/80 bg-surface-panel/90 backdrop-blur-lg relative overflow-hidden flex items-center justify-between shrink-0 shadow-md z-30">
      <div className="absolute inset-0 opacity-5 pointer-events-none asphalt-grid" />
      
      <div 
        onClick={onGoHome} 
        className="flex items-center gap-3 group cursor-pointer relative z-10"
        title="Session Home"
      >
        <div className="w-9 h-9 rounded-none bg-primary flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,0.3)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all border border-white/10">
            <BoltIcon className="w-5 h-5 text-white" />
        </div>
        <div className="relative flex flex-col justify-center">
          <h1 className="text-2xl wildstyle-logo select-none transition-all leading-none pr-2 text-white">
            PIXSH<span>O</span>P
          </h1>
          <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Synthesis Engine</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-black/40 border border-zinc-800/50 rounded-none shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(255,92,0,0.5)]" />
              <span className="text-[9px] font-black font-mono text-zinc-500 uppercase tracking-widest">System_Ready</span>
          </div>
      </div>
    </header>
  );
};
