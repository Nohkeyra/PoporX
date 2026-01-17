

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../App';
import { 
  SparklesIcon, 
  ArrowRightIcon, 
  BoltIcon, 
  StyleExtractorIcon, 
  EraserIcon,
  VideoIcon
} from './icons';

interface StartScreenProps {
  onStart: (tab?: ActiveTab) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [bootSequence, setBootSequence] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Simulated boot text sequence
    const bootInterval = setInterval(() => {
        setBootSequence(prev => {
            if (prev < 100) return prev + Math.floor(Math.random() * 15);
            return 100;
        });
    }, 150);

    return () => {
        clearTimeout(timer);
        clearInterval(bootInterval);
    };
  }, []);

  const handleLaunch = (tab?: ActiveTab) => {
    setIsVisible(false);
    setTimeout(() => onStart(tab), 500);
  };

  const modules: { id: ActiveTab; title: string; sub: string; icon: React.FC<{className?: string}>; color: string; border: string }[] = [
    { 
      id: 'flux', 
      title: 'Flux Core', 
      sub: 'Generative Synthesis', 
      icon: BoltIcon, 
      color: 'text-flux',
      border: 'group-hover:border-flux'
    },
    { 
      id: 'style_extractor', 
      title: 'Visual DNA', 
      sub: 'Style Extraction', 
      icon: StyleExtractorIcon, 
      color: 'text-dna',
      border: 'group-hover:border-dna'
    },
    { 
      id: 'inpaint', 
      title: 'The Buff', 
      sub: 'Smart Reconstruction', 
      icon: EraserIcon, 
      color: 'text-buff',
      border: 'group-hover:border-buff'
    },
  ];

  return (
    <div className={`fixed inset-0 bg-black flex flex-col items-center justify-center transition-all duration-700 z-[9999] overflow-hidden ${isVisible ? 'opacity-100' : 'opacity-0 scale-95'}`}>
      <div className="absolute inset-0 asphalt-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_90%)] pointer-events-none" />
      
      {/* Decorative Scanner Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scanline opacity-30" />

      <div className="relative z-10 w-full max-w-5xl px-4 md:px-6 flex flex-col items-center justify-center min-h-[100dvh]">
        
        {/* LOGO AREA */}
        <div className="text-center mb-8 md:mb-12 space-y-2 relative">
           <div className="relative inline-block group cursor-default">
              <h1 className="text-7xl sm:text-8xl md:text-[9rem] leading-none wildstyle-logo select-none transition-transform group-hover:scale-[1.02] relative z-10">
                 PIXSH<span>O</span>P
              </h1>
              {/* Glitch Shadow */}
              <h1 className="text-7xl sm:text-8xl md:text-[9rem] leading-none wildstyle-logo select-none absolute top-0 left-0 opacity-0 group-hover:opacity-30 group-hover:translate-x-1 group-hover:text-cyan-500 transition-all duration-75 mix-blend-screen z-0">
                 PIXSH<span>O</span>P
              </h1>
              
              <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-zinc-900 border border-zinc-700 text-white font-black text-[7px] md:text-[9px] px-2 md:px-3 py-0.5 md:py-1 uppercase font-mono tracking-widest transform -rotate-2 shadow-lg">
                 V.9.0 // UNLEASHED
              </div>
           </div>
           <p className="text-[9px] md:text-[11px] text-zinc-500 font-mono tracking-[0.3em] md:tracking-[0.5em] uppercase font-bold opacity-60 mt-2 md:mt-4">
               Neural Synthesis Engine • <span className="text-primary">{bootSequence}% READY</span>
           </p>
        </div>

        {/* PRIMARY INITIALIZE */}
        <div className="w-full max-w-sm md:max-w-md relative mb-8 md:mb-16 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-orange-500 to-red-600 rounded-sm blur opacity-20 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
            <button
              onClick={() => handleLaunch()}
              className="relative w-full h-16 md:h-20 bg-zinc-950 text-white font-black uppercase italic tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm flex items-center justify-center gap-4 md:gap-6 transition-all hover:bg-zinc-900 active:scale-[0.99] border-y-2 border-zinc-800 hover:border-primary group-hover:text-primary shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite_linear] opacity-0 group-hover:opacity-100" />
              <SparklesIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>Initialize System</span>
              <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
            </button>
        </div>

        {/* MODULE CARDS (Data Cartridges) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full max-w-4xl">
          {modules.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => handleLaunch(m.id)}
              className={`preset-card group relative h-32 md:h-40 p-4 md:p-6 bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 transition-all flex flex-col justify-between text-left overflow-hidden ${m.border}`}
              style={{ transitionDelay: `${idx * 75}ms` }}
            >
              {/* Tech pattern background */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex justify-between items-start w-full">
                  <div className={`p-1.5 md:p-2 rounded-sm bg-zinc-950 border border-zinc-800 group-hover:border-current transition-colors ${m.color.replace('text-', 'border-')}`}>
                    <m.icon className={`w-4 h-4 md:w-5 md:h-5 ${m.color}`} />
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-current transition-colors ${m.color.replace('text-', 'text-')}`} />
              </div>
              
              <div className="relative z-10">
                  <h3 className="font-black italic text-zinc-300 group-hover:text-white text-base md:text-lg uppercase tracking-tight font-display transition-colors">{m.title}</h3>
                  <p className="text-[8px] md:text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono uppercase tracking-widest">{m.sub}</p>
              </div>
              
              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-current w-0 group-hover:w-full transition-all duration-500 ease-out ${m.color}`} />
            </button>
          ))}
        </div>
        
        <div className="mt-8 md:mt-16 text-[8px] md:text-[9px] text-zinc-700 font-mono text-center max-w-xs leading-relaxed">
            SYSTEM STATUS: ONLINE<br/>
            MEMORY INTEGRITY: 100%<br/>
            WAITING FOR NEURAL HANDSHAKE...
        </div>
      </div>
    </div>
  );
};