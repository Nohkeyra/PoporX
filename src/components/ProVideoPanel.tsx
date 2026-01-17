
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BoltIcon, VideoIcon, XIcon, AlertIcon } from './icons';
import { generateCinematicKeyframe } from '../services/geminiService';

interface ProVideoPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  hasImage: boolean;
  currentImageFile: File | null;
  onVideoGenerated: (videoUri: string) => void; // Keeps naming for compatibility, but passes image URI
}

export const ProVideoPanel: React.FC<ProVideoPanelProps> = ({ 
  isLoading, 
  setIsLoading, 
  hasImage, 
  currentImageFile,
  onVideoGenerated 
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Uses the Image Model to generate a "Fake Video Frame"
      const result = await generateCinematicKeyframe(
          prompt, 
          hasImage ? (currentImageFile || undefined) : undefined, 
          { aspectRatio }
      );
      
      onVideoGenerated(result); // Pass image as if it were the result
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Synthesis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-panel overflow-hidden">
      <div className="p-5 border-b border-white/5 bg-surface-panel shrink-0">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded bg-gradient-to-br from-green-400 to-emerald-900 flex items-center justify-center shadow-emerald-500/20 shadow-lg">
                 <VideoIcon className="w-6 h-6 text-white" />
             </div>
             <div>
                 <h3 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none font-display">Cinematic Frame</h3>
                 <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase leading-tight">Keyframe Generator (Safe Mode)</p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {error && (
            <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-sm flex items-start gap-3 animate-fade-in shrink-0">
                <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="flex-1 text-xs text-red-200 leading-tight font-mono">{error}</p>
                <button onClick={() => setError(null)} className="text-gray-500 hover:text-white"><XIcon className="w-4 h-4" /></button>
            </div>
          )}

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-center">
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wide leading-relaxed">
                  <span className="text-emerald-500 font-bold">COST SAFE:</span> Generates high-fidelity cinematic stills instead of video to prevent billing usage.
              </p>
          </div>

          <div>
              <h4 className="panel-label">Scene Description</h4>
              <div className="group border border-zinc-800 bg-black/40 rounded-sm overflow-hidden focus-within:border-emerald-500/50 transition-colors relative shadow-inner">
                  <div className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-b border-zinc-800/50">
                      <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">ACTION_PAYLOAD</span>
                      </div>
                      {prompt && <button onClick={() => setPrompt('')}><XIcon className="w-3.5 h-3.5 text-zinc-600 hover:text-white" /></button>}
                  </div>
                  <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the movie scene, lighting, and action..."
                      className="w-full bg-transparent p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none h-32 leading-relaxed selection:bg-emerald-500/30"
                  />
                  <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity duration-300">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 10L0 10L10 0V10Z" fill="#10b981" />
                        </svg>
                  </div>
              </div>
          </div>

          <div>
            <h4 className="panel-label">Frame Ratio</h4>
            <div className="grid grid-cols-2 gap-2">
                {['16:9', '9:16'].map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio as any)}
                        className={`py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${aspectRatio === ratio ? 'bg-emerald-900/30 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                    >
                        {ratio}
                    </button>
                ))}
            </div>
          </div>
      </div>

      <div className="p-5 border-t border-surface-hover bg-surface-panel shrink-0">
          <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="execute-btn group">
              <div className="execute-btn-glow" style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}></div>
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                  <span className="font-black italic uppercase tracking-[0.2em] text-sm skew-x-[-10deg] text-emerald-400 group-hover:text-white transition-colors">
                      {isLoading ? 'Rendering Frame...' : 'Generate Keyframe'}
                  </span>
                  <BoltIcon className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
              </div>
          </button>
      </div>
    </div>
  );
};
