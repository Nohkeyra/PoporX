/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PanelScanner } from './Spinner';
import { EraserIcon, SparklesIcon, XIcon } from './icons';

interface InpaintPanelProps {
  onApplyInpaint: (instruction: string) => void;
  onClearMask: () => void;
  isLoading: boolean;
  brushSize: number;
  setBrushSize: (size: number) => void;
  hasImage: boolean;
}

export const InpaintPanel: React.FC<InpaintPanelProps> = ({ 
    onApplyInpaint, 
    onClearMask, 
    isLoading, 
    brushSize, 
    setBrushSize,
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
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
        {isLoading && <PanelScanner theme="fuchsia" />}

        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-fuchsia-600 to-purple-900 flex items-center justify-center shadow-[0_0_10px_rgba(192,38,211,0.4)]">
                    <EraserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                    Neural Inpaint
                    </h3>
                    <p className="text-[10px] text-fuchsia-500 font-mono tracking-widest uppercase">
                    Reality Reconstruction
                    </p>
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Brush Control Module */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Brush Radius</span>
                    <span className="text-xs font-mono text-fuchsia-500">{brushSize}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
            </div>

            {/* Instruction Terminal */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-[#0A0A0A] border border-[#222] rounded-lg overflow-hidden group-focus-within:border-fuchsia-500/50 transition-colors">
                    <div className="bg-[#111] px-3 py-1.5 border-b border-[#222] flex justify-between items-center">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Mask_Directive</span>
                        {instruction && (
                            <button onClick={() => setInstruction('')} className="text-gray-500 hover:text-white">
                                <XIcon className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <textarea
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        maxLength={500}
                        placeholder="Describe what to generate in the masked area..."
                        className="w-full bg-transparent text-gray-200 p-3 focus:outline-none text-sm font-mono leading-relaxed resize-none h-32 custom-scrollbar placeholder-gray-700"
                        disabled={isLoading || !hasImage}
                    />
                </div>
            </div>

             <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider px-1">
                <span className="text-fuchsia-500">Tip:</span> Paint over the area you want to change in the viewer above.
             </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1A1A1A] bg-[#050505] flex gap-2">
            <button 
                onClick={onClearMask}
                className="flex-1 h-12 border border-[#333] bg-[#111] hover:bg-[#161616] hover:border-gray-500 text-gray-300 font-bold uppercase text-xs tracking-wider transition-all active:scale-[0.98] rounded-sm disabled:opacity-50"
                disabled={isLoading || !hasImage}
            >
                Clear Mask
            </button>
            <button
                onClick={handleApply}
                className="flex-[2] h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-fuchsia-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isActionDisabled}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {!isActionDisabled && <div className="absolute inset-0 bg-fuchsia-900/20"></div>}
                
                <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                    <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-fuchsia-400 group-hover:text-white'}`}>
                        Execute Fill
                    </span>
                    {!isActionDisabled && <SparklesIcon className="w-4 h-4 text-fuchsia-400 group-hover:text-white skew-x-[-10deg]" />}
                </div>
            </button>
        </div>
    </div>
  );
};