
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WandIcon, SparklesIcon } from './icons';
import { GenerationRequest } from '../App';
import { PROTOCOLS } from '../services/geminiService';

interface RestorePanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
}

const RESTORE_PRESETS = [
    { name: 'Face Fix', description: 'Reconstruct facial features.', prompt: 'Fix distorted faces, enhance eyes, smooth skin texture, high fidelity facial reconstruction.' },
    { name: 'Upscale 2x', description: 'Enhance resolution & detail.', prompt: 'Upscale image, sharpen details, remove compression artifacts, high resolution upgrade.' },
    { name: 'Denoise', description: 'Remove grain & noise.', prompt: 'Remove digital noise, smooth grain, clear artifacts, clean signal processing.' },
    { name: 'Color Fix', description: 'Correct white balance & tone.', prompt: 'Correct white balance, neutralize color cast, natural tones, professional color grading.' },
    { name: 'Sharpen', description: 'Enhance edge clarity.', prompt: 'Sharpen edges, enhance texture details, crisp focus, de-blur.' },
    { name: 'Old Photo', description: 'Restore damaged vintage photos.', prompt: 'Restore old damaged photo, remove scratches, fix tears, colorize faded areas.' }
];

export const RestorePanel: React.FC<RestorePanelProps> = ({ onRequest, isLoading, hasImage }) => {
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  const handleApply = () => {
    const preset = RESTORE_PRESETS.find(p => p.name === selectedPresetName);
    if (preset) {
        onRequest({
            type: 'adjust', // Reusing adjust logic as it uses image-to-image with prompt
            prompt: `Restoration Task: ${preset.prompt}. Maintain original composition strictly.`,
            useOriginal: false,
            systemInstructionOverride: PROTOCOLS.EDITOR,
            denoisingInstruction: "Low denoising (30%) to preserve structure while enhancing quality."
        });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
        <div className="p-6 border-b border-zinc-900/60 bg-black/40 shrink-0">
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-none bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10 transform skew-x-[-12deg]">
                     <WandIcon className="w-7 h-7 text-purple-500" />
                 </div>
                 <div>
                     <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none font-display">Restoration</h3>
                     <p className="text-[9px] text-purple-500 font-mono tracking-[0.4em] uppercase leading-tight mt-1.5">Neural Enhancer</p>
                 </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {!hasImage ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-900 bg-black/20">
                    <WandIcon className="w-12 h-12 text-zinc-900 mb-6" />
                    <p className="text-zinc-700 font-mono text-[9px] uppercase tracking-[0.3em] leading-relaxed max-w-[160px]">
                        Awaiting source for enhancement protocols.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 pb-6">
                    {RESTORE_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                            className={`preset-card min-h-[5rem] ${selectedPresetName === preset.name ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'hover:border-zinc-700'}`}
                        >
                            <div className="glow-pit" style={{ color: 'var(--color-purple-500)' }}></div>
                            <div className={`text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${selectedPresetName === preset.name ? 'text-white' : 'text-zinc-600'}`}>{preset.name}</div>
                            <p className="text-[8px] text-zinc-800 leading-tight font-mono uppercase tracking-tighter truncate">{preset.description}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="p-6 border-t border-zinc-900 bg-black/60 shrink-0">
            <button onClick={handleApply} disabled={isLoading || !hasImage || !selectedPresetName} className="execute-btn group">
                <div className="relative z-10 flex items-center justify-center gap-4 h-full">
                    <span className={`font-black italic uppercase tracking-[0.3em] text-xs transition-colors skew-x-[-10deg] ${isLoading || !hasImage ? 'text-zinc-700' : 'text-purple-500 group-hover:text-white'}`}>
                        {isLoading ? 'Enhancing...' : 'Execute Restoration'}
                    </span>
                    <SparklesIcon className={`w-4 h-4 transition-colors ${isLoading || !hasImage ? 'text-zinc-700' : 'text-purple-500 group-hover:text-white'}`} />
                </div>
            </button>
        </div>
    </div>
  );
};
