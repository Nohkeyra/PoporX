
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SparklesIcon, BoltIcon, ChevronIcon } from './icons';
import { refineImagePrompt, describeImageForPrompt } from '../services/geminiService';
import { GenerationRequest } from '../App';

interface FluxPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage?: boolean;
  currentImageFile?: File | null;
  fluxPrompt: string;
  setFluxPrompt: (prompt: string) => void;
  isFastAiEnabled: boolean;
}

const STYLE_PRESETS = {
  "default": { label: "Urban", suffix: "gritty street photography, raw texture, high contrast, masterpiece" },
  "vandal": { label: "Vandal", suffix: "spray paint mural, drip texture, graffiti wildstyle background, urban decay, vibrant aerosol colors" },
  "neon": { label: "Cyber", suffix: "vibrant neon, glitch accents, synthwave, blade runner aesthetic" },
  "riso": { label: "Riso", suffix: "risograph print style, grain texture, misaligned color registration, halftone dots, limited palette" },
  "sketch": { label: "Ink", suffix: "charcoal wildstyle sketch, raw ink bleed, graphite texture" },
  "monogram": { label: "Mono", suffix: "minimalist vector logo monogram, white background, geometric shapes, golden ratio, vector aesthetic" },
  "brutalist": { label: "Concrete", suffix: "brutalist geometry, massive scale, moody, raw concrete" },
  "editorial": { label: "Fashion", suffix: "high fashion editorial photography, studio lighting, vogue aesthetic, sharp focus, 85mm lens" },
  "biopunk": { label: "Biopunk", suffix: "organic technology, glowing bioluminescence, slimy texture, cronenberg aesthetic" },
  "polaroid": { label: "Polaroid", suffix: "vintage polaroid photo, flash photography, vignetting, soft focus, film grain, 1990s aesthetic" },
  "oil": { label: "Oil", suffix: "thick impasto oil painting, textured brushstrokes, expressive color palette" },
  "hyper": { label: "Hyper", suffix: "8k resolution, photorealistic, unreal engine 5 render, sharp focus" },
  "anime": { label: "Anime", suffix: "90s anime style, cel shaded, vibrant, akira aesthetic, high detail" },
  "iso": { label: "Iso", suffix: "3d isometric view, low poly, clean lines, blender render" },
  "cinematic": { label: "Film", suffix: "anamorphic lens flare, teal and orange grading, dramatic lighting" }
};

export const FluxPanel: React.FC<FluxPanelProps> = ({ 
    onRequest, isLoading, hasImage, currentImageFile,
    fluxPrompt, setFluxPrompt, isFastAiEnabled
}) => {
  const [isRefining, setIsRefining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [denoising, setDenoising] = useState(75);
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [deepLogic, setDeepLogic] = useState(false);

  const handleAction = async (forceNew: boolean) => {
    let effectivePrompt = fluxPrompt.trim();
    const style = STYLE_PRESETS[selectedStyle as keyof typeof STYLE_PRESETS];
    
    if (hasImage && !effectivePrompt && currentImageFile) {
        setIsAnalyzing(true);
        try { effectivePrompt = await describeImageForPrompt(currentImageFile); } 
        catch (e) { effectivePrompt = "urban transformation"; }
        finally { setIsAnalyzing(false); }
    }

    const finalPrompt = style.suffix ? `${effectivePrompt}, ${style.suffix}` : effectivePrompt;
    const denoisingInstruction = hasImage ? `Retain ${100 - denoising}% of source spatial map. Diverge aesthetic significantly.` : "";

    onRequest({ 
        type: 'flux', 
        prompt: finalPrompt, 
        forceNew, 
        aspectRatio, 
        denoisingInstruction 
    });
  };

  const handleRefine = async () => {
    if (!fluxPrompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineImagePrompt(fluxPrompt, isFastAiEnabled, deepLogic);
      setFluxPrompt(refined);
    } catch (e) {} 
    finally { setIsRefining(false); }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
        <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
                background: 'radial-gradient(circle at 50% -20%, rgba(255, 51, 0, 0.15) 0%, transparent 70%)' 
            }}
        />

        <div className="p-5 border-b border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-sm bg-flux/20 border border-flux/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,51,0,0.4)]">
                         <BoltIcon className="w-5 h-5 text-flux" />
                     </div>
                     <div>
                         <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none font-display">Flux Core</h3>
                         <p className="text-[8px] text-flux font-mono tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_5px_rgba(255,51,0,0.5)]">Gen.Engine.v9</p>
                     </div>
                </div>
                <button 
                    onClick={() => setDeepLogic(!deepLogic)}
                    className={`flex items-center gap-2 px-2 py-1 border rounded-sm transition-all ${deepLogic ? 'bg-flux/20 border-flux text-flux shadow-[0_0_10px_rgba(255,51,0,0.3)]' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${deepLogic ? 'bg-flux animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[8px] font-mono uppercase tracking-wider font-bold">Logic: {deepLogic ? 'Deep' : 'Fast'}</span>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar relative z-10">
            <div>
                <h4 className="panel-label border-flux/50 pl-2">Command Line</h4>
                <div className="group border border-zinc-800 bg-black/40 rounded-sm overflow-hidden focus-within:border-flux/60 focus-within:shadow-[0_0_15px_rgba(255,51,0,0.15)] transition-all relative shadow-inner">
                    <div className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-flux rounded-full animate-pulse shadow-[0_0_5px_rgba(255,51,0,0.8)]" />
                             <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black group-focus-within:text-flux transition-colors">INPUT_STREAM</span>
                        </div>
                        <button onClick={handleRefine} disabled={!fluxPrompt.trim() || isRefining} className={`text-zinc-500 hover:text-flux transition-colors ${isRefining ? 'animate-spin' : ''}`} title="Enhance Prompt">
                             <SparklesIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <textarea 
                        value={fluxPrompt}
                        onChange={(e) => setFluxPrompt(e.target.value)}
                        placeholder={hasImage ? "// Awaiting transformation directives..." : "// Initiate creative sequence..."}
                        className="w-full bg-transparent p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none h-24 leading-relaxed selection:bg-flux/30"
                    />
                    <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity duration-300">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 10L0 10L10 0V10Z" fill="var(--color-flux)" />
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                 <h4 className="panel-label border-flux/50 pl-2">Visual Style</h4>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.entries(STYLE_PRESETS).map(([key, style]) => (
                        <button 
                            key={key} 
                            onClick={() => setSelectedStyle(key)}
                            className={`preset-card min-h-[3.5rem] flex flex-col justify-center items-start ${
                              selectedStyle === key 
                                ? 'bg-flux/20 text-white border-flux shadow-[0_0_15px_rgba(255,51,0,0.25)] z-10' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedStyle === key ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{style.label}</span>
                            {selectedStyle === key && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-flux shadow-[0_0_10px_#FF3300]"></div>}
                        </button>
                    ))}
                 </div>
            </div>

            {hasImage && (
                <div className="accent-flux">
                    <div className="flex justify-between mb-2 items-center">
                        <h4 className="panel-label m-0 border-flux/50 pl-2">Hallucination Level</h4>
                        <span className="text-[8px] font-mono text-flux font-black drop-shadow-[0_0_5px_rgba(255,51,0,0.5)]">{denoising}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="5" max="95" 
                        value={denoising} 
                        onChange={(e) => setDenoising(Number(e.target.value))} 
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-flux [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,51,0,0.8)]"
                    />
                </div>
            )}

            <div>
                 <h4 className="panel-label border-flux/50 pl-2">Frame Ratio</h4>
                 <div className="flex bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden p-1 gap-1">
                    {['1:1', '16:9', '9:16'].map(ratio => (
                        <button 
                            key={ratio} 
                            onClick={() => setAspectRatio(ratio)}
                            className={`flex-1 py-1.5 text-[9px] font-black transition-all rounded-sm uppercase tracking-wider ${
                              aspectRatio === ratio 
                                ? 'bg-flux text-black shadow-sm' 
                                : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                 </div>
            </div>
        </div>

        <div className="p-5 border-t border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
            <button
                onClick={() => handleAction(true)}
                disabled={isLoading || isAnalyzing}
                className="execute-btn group border-zinc-800 hover:border-flux transition-colors"
            >
                <div className="execute-btn-glow" style={{ background: 'radial-gradient(circle, #FF3300 0%, transparent 70%)' }}></div>
                <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                    <span className="font-black italic uppercase tracking-[0.2em] text-xs text-zinc-500 group-hover:text-flux transition-colors skew-x-[-10deg]">
                        {isAnalyzing ? 'Scanning...' : (isLoading ? 'Processing...' : 'Execute Flux')}
                    </span>
                    <BoltIcon className={`w-4 h-4 text-zinc-600 group-hover:text-flux transition-colors ${isLoading ? 'animate-pulse' : ''}`} />
                </div>
            </button>
        </div>
    </div>
  );
};
