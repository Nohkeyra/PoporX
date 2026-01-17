
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EraserIcon, SparklesIcon, XIcon } from './icons';

interface InpaintPanelProps {
  onApplyInpaint: (instruction: string) => void;
  onClearMask: () => void;
  isLoading: boolean;
  hasImage: boolean;
}

const QUICK_ACTIONS = [
    "Remove background", "Remove text", "Clean skin", "Remove people", "Fix lighting", "Remove object"
];

export const InpaintPanel: React.FC<InpaintPanelProps> = ({ 
    onApplyInpaint, 
    isLoading, 
    hasImage
}) => {
  const [instruction, setInstruction] = useState('');
  
  const handleApply = () => {
    if (instruction.trim()) {
        onApplyInpaint(instruction.trim());
    }
  };

  const isActionDisabled = isLoading || !instruction.trim() || !hasImage;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(41, 121, 255, 0.15) 0%, transparent 70%)' }} />

        <div className="p-5 border-b border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-sm bg-buff/20 border border-buff/50 flex items-center justify-center shadow-[0_0_20px_rgba(41,121,255,0.4)]">
                     <EraserIcon className="w-5 h-5 text-buff" />
                 </div>
                 <div>
                     <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none font-display">The Buff</h3>
                     <p className="text-[8px] text-buff font-mono tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_5px_rgba(41,121,255,0.5)]">Latent.Reconstruction</p>
                 </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar relative z-10">
            {!hasImage ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-zinc-800 bg-black/20 rounded-sm">
                    <EraserIcon className="w-10 h-10 text-zinc-700 mb-4" />
                    <p className="text-zinc-600 font-mono text-[9px] uppercase tracking-[0.2em] leading-relaxed max-w-[160px]">
                        Awaiting neural seed for reconstruction.
                    </p>
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div>
                        <h4 className="panel-label border-buff/50 pl-2">Target Directive</h4>
                        <div className="group border border-zinc-800 bg-black/40 rounded-sm overflow-hidden focus-within:border-buff/60 focus-within:shadow-[0_0_15px_rgba(41,121,255,0.15)] transition-all relative shadow-inner">
                            <div className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-b border-zinc-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-buff rounded-full animate-pulse shadow-[0_0_5px_rgba(41,121,255,0.8)]" />
                                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black group-focus-within:text-buff transition-colors">INSTRUCTION_PAYLOAD</span>
                                </div>
                                {instruction && <button onClick={() => setInstruction('')} className="text-zinc-600 hover:text-white transition-colors"><XIcon className="w-3.5 h-3.5" /></button>}
                            </div>
                            <textarea 
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                placeholder="// E.g. Remove the red car..."
                                className="w-full bg-transparent p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none h-32 leading-relaxed selection:bg-buff/30"
                            />
                            <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity duration-300">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 10L0 10L10 0V10Z" fill="var(--color-buff)" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="panel-label border-buff/50 pl-2">Quick Protocols</h4>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_ACTIONS.map(action => (
                                <button 
                                    key={action}
                                    onClick={() => setInstruction(action)}
                                    className="preset-card px-3 py-1.5 min-h-[auto] hover:border-buff/50 hover:text-buff text-[9px] font-mono uppercase tracking-tight text-zinc-500"
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
            <button onClick={handleApply} disabled={isActionDisabled} className="execute-btn group border-zinc-800 hover:border-buff transition-colors">
                <div className="execute-btn-glow" style={{ background: 'radial-gradient(circle, #2979FF 0%, transparent 70%)' }}></div>
                <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                    <span className={`font-black italic uppercase tracking-[0.2em] text-xs transition-colors skew-x-[-10deg] ${isActionDisabled ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-buff'}`}>
                        {isLoading ? 'Reconstructing...' : 'Execute Buff'}
                    </span>
                    <SparklesIcon className={`w-4 h-4 transition-colors ${isActionDisabled ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-buff'}`} />
                </div>
            </button>
        </div>
    </div>
  );
};
