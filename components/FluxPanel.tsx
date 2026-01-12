/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, MagicWandIcon, BoltIcon } from './icons';
import { refineImagePrompt, describeImageForPrompt, generateRealtimePreview } from '../services/geminiService';
import { GenerationRequest } from '../App';
import { PanelScanner } from './Spinner';

interface FluxPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage?: boolean;
  currentImageFile?: File | null;
  setViewerInstruction: (text: string | null) => void;
  fluxPrompt: string;
  setFluxPrompt: (prompt: string) => void;
  setPreviewImageUrl: (url: string | null) => void;
}

export const FluxPanel: React.FC<FluxPanelProps> = ({ 
    onRequest, 
    isLoading, 
    hasImage, 
    currentImageFile, 
    setViewerInstruction,
    fluxPrompt,
    setFluxPrompt,
    setPreviewImageUrl
}) => {
  const [isRefining, setIsRefining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stackEffect, setStackEffect] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [chaosMode, setChaosMode] = useState<boolean>(false);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [livePreview, setLivePreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const debounceTimeout = useRef<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  useEffect(() => {
    if (batchSize > 1) {
      setViewerInstruction(`NEURAL GRID: GENERATING ${batchSize} VARIATIONS...`);
    } else {
      setViewerInstruction(null);
    }
    return () => setViewerInstruction(null);
  }, [batchSize, setViewerInstruction]);

  useEffect(() => {
    if (livePreview && fluxPrompt.trim() && !isLoading) {
      setIsPreviewLoading(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = window.setTimeout(async () => {
        try {
          const url = await generateRealtimePreview(fluxPrompt);
          if (url) setPreviewImageUrl(url);
        } catch (error) {
          console.error('Preview generation failed:', error);
          setPreviewImageUrl(null);
        } finally {
          setIsPreviewLoading(false);
        }
      }, isTouchDevice ? 1000 : 750);
    } else {
      setPreviewImageUrl(null);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [fluxPrompt, livePreview, isLoading, setPreviewImageUrl, isTouchDevice]);

  const handleAction = (forceNew: boolean) => {
    if (forceNew && hasImage) {
      if (!window.confirm("This will start a new session. Current visual data will be overwritten. Proceed?")) return;
    }
    if (!fluxPrompt.trim()) return;
    
    onRequest({ 
      type: 'flux', 
      prompt: fluxPrompt.trim(), 
      useOriginal: !stackEffect, 
      forceNew, 
      aspectRatio, 
      isChaos: chaosMode, 
      batchSize 
    });
  }

  const handleRefine = async () => {
    if (!fluxPrompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refinedPrompt = await refineImagePrompt(fluxPrompt);
      setFluxPrompt(refinedPrompt);
    } catch (error) { console.error("Refinement failed", error); } 
    finally { setIsRefining(false); }
  };

  const handleAnalyze = async () => {
    if (!currentImageFile || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const analysis = await describeImageForPrompt(currentImageFile);
      setFluxPrompt(prev => prev ? `${prev}, ${analysis}` : analysis);
    } catch (error) { console.error("Analysis failed", error); } 
    finally { setIsAnalyzing(false); }
  };

  const isActionDisabled = isLoading || !fluxPrompt.trim();

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {isLoading && <PanelScanner theme="red" />}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <div className="flex gap-1">
             <div className="w-16 h-[2px] bg-red-500"></div>
             <div className="w-4 h-[2px] bg-red-500"></div>
        </div>
      </div>

      {/* Tech Header */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                 <BoltIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Flux Synthesis
                 </h3>
                 <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase">
                   Neural Generation Core
                 </p>
             </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt Terminal */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative bg-[#0A0A0A] border border-[#222] rounded-lg overflow-hidden group-focus-within:border-red-500/50 transition-colors">
             <div className="bg-[#111] px-3 py-1.5 border-b border-[#222] flex justify-between items-center">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Input_Stream</span>
                <div className="flex gap-2">
                   {hasImage && currentImageFile && (
                      <button 
                        onClick={handleAnalyze} 
                        disabled={isLoading || isAnalyzing} 
                        className="text-[9px] text-gray-400 hover:text-green-400 font-mono uppercase flex items-center gap-1 transition-colors"
                      >
                         <MagicWandIcon className={`w-3 h-3 ${isAnalyzing ? 'animate-pulse text-green-400' : ''}`} />
                         {isAnalyzing ? 'Analyzing...' : 'Analyze Img'}
                      </button>
                   )}
                   <button 
                      onClick={handleRefine} 
                      disabled={isLoading || isRefining || !fluxPrompt.trim()} 
                      className="text-[9px] text-gray-400 hover:text-cyan-400 font-mono uppercase flex items-center gap-1 transition-colors"
                   >
                      <SparklesIcon className={`w-3 h-3 ${isRefining ? 'animate-spin text-cyan-400' : ''}`} />
                      {isRefining ? 'Enhancing...' : 'Enhance'}
                   </button>
                </div>
             </div>
             <textarea 
                value={fluxPrompt} 
                onChange={(e) => setFluxPrompt(e.target.value)} 
                maxLength={2000} 
                placeholder="Describe the target visual output..." 
                className="w-full bg-transparent text-gray-200 p-3 focus:outline-none text-sm font-mono leading-relaxed resize-none h-32 custom-scrollbar placeholder-gray-700"
                disabled={isLoading}
             />
          </div>
        </div>

        {/* Control Grid */}
        <div className="grid grid-cols-2 gap-2">
            {/* Live Preview Toggle */}
            <button 
              onClick={() => setLivePreview(!livePreview)} 
              disabled={isLoading || hasImage} 
              className={`h-12 border border-[#222] rounded flex flex-col items-center justify-center relative overflow-hidden group transition-all ${livePreview ? 'bg-green-950/20 border-green-500/50' : 'bg-[#0A0A0A] hover:bg-[#111]'}`}
            >
               <span className={`text-[9px] font-mono uppercase tracking-widest z-10 ${livePreview ? 'text-green-400' : 'text-gray-500'}`}>
                  {isPreviewLoading ? 'Rendering...' : livePreview ? 'Preview: ON' : 'Preview: OFF'}
               </span>
               <div className={`w-1 h-1 rounded-full mt-1 z-10 ${livePreview ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-700'}`}></div>
            </button>
            
            {/* Chaos Mode */}
            <button 
              onClick={() => setChaosMode(!chaosMode)} 
              className={`h-12 border border-[#222] rounded flex flex-col items-center justify-center relative overflow-hidden transition-all ${chaosMode ? 'bg-red-950/20 border-red-500/50' : 'bg-[#0A0A0A] hover:bg-[#111]'}`}
            >
               <span className={`text-[9px] font-mono uppercase tracking-widest z-10 ${chaosMode ? 'text-red-400' : 'text-gray-500'}`}>
                  Chaos Mode
               </span>
               <BoltIcon className={`w-3 h-3 mt-1 z-10 ${chaosMode ? 'text-red-500' : 'text-gray-700'}`} />
            </button>
            
            {/* Aspect Ratio */}
            <div className="col-span-2 relative bg-[#0A0A0A] border border-[#222] rounded flex items-center px-3 h-12">
               <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mr-3">Aspect Ratio</span>
               <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value)} 
                  className="bg-transparent border-none text-white text-xs font-bold uppercase focus:ring-0 w-full p-0 cursor-pointer"
               >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3 (Classic)</option>
               </select>
            </div>
            
             {/* Stack Mode */}
             {hasImage && (
              <button 
                onClick={() => setStackEffect(!stackEffect)} 
                className={`col-span-2 h-10 border border-[#222] rounded flex items-center justify-between px-4 transition-all ${stackEffect ? 'bg-orange-950/20 border-orange-500/50' : 'bg-[#0A0A0A] hover:bg-[#111]'}`}
              >
                 <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">Operation Mode</span>
                 <span className={`text-xs font-bold uppercase ${stackEffect ? 'text-orange-400' : 'text-gray-400'}`}>
                    {stackEffect ? 'Stack Effect' : 'Replace'}
                 </span>
              </button>
            )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505] flex gap-2">
         {hasImage && (
           <button 
             onClick={() => handleAction(false)} 
             className="flex-1 h-12 border border-[#333] bg-[#111] hover:bg-[#161616] hover:border-gray-500 text-gray-300 font-bold uppercase text-xs tracking-wider transition-all active:scale-[0.98] rounded-sm disabled:opacity-50"
             disabled={isActionDisabled}
           >
             Modify
           </button>
         )}
         <button 
           onClick={() => handleAction(true)} 
           className="flex-[2] h-12 relative overflow-hidden group rounded-sm bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
           disabled={isActionDisabled}
         >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 group-hover:opacity-90 transition-opacity"></div>
            <div className="relative z-10 flex items-center justify-center gap-2">
               <span className="text-white font-black italic uppercase tracking-widest text-sm skew-x-[-10deg]">
                 {hasImage ? 'New Generation' : 'Generate'}
               </span>
               <BoltIcon className="w-4 h-4 text-white skew-x-[-10deg]" />
            </div>
         </button>
      </div>
    </div>
  );
};