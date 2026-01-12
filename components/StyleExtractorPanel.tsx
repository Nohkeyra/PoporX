/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { StyleExtractorIcon, CopyIcon, SendIcon, AlertIcon, CheckIcon, SparklesIcon } from './icons';
import { extractStyleFromImage } from '../services/geminiService';
import { PanelScanner } from './Spinner';

interface StyleExtractorPanelProps {
  isLoading: boolean;
  hasImage: boolean;
  currentImageFile: File | null;
  onSendToFlux: (prompt: string) => void;
}

export const StyleExtractorPanel: React.FC<StyleExtractorPanelProps> = ({ 
  isLoading, 
  hasImage, 
  currentImageFile, 
  onSendToFlux 
}) => {
  const [extractedPrompt, setExtractedPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = useCallback(async () => {
    if (!currentImageFile || isExtracting) return;
    
    setIsExtracting(true);
    setError(null);
    setExtractedPrompt('');
    setCopySuccess(false);
    
    try {
      const result = await extractStyleFromImage(currentImageFile);
      if (result && result.trim().length > 0) {
        setExtractedPrompt(result);
      } else {
        setError("Unable to isolate visual DNA. Source image may be too ambiguous.");
      }
    } catch (e) {
      console.error('Style extraction failed:', e);
      setError("Extraction protocol failed. Neural link unstable.");
    } finally {
      setIsExtracting(false);
    }
  }, [currentImageFile, isExtracting]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!extractedPrompt.trim()) return;
    
    try {
      await navigator.clipboard.writeText(extractedPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError("Clipboard access denied.");
    }
  }, [extractedPrompt]);

  const handleSend = useCallback(() => {
    if (extractedPrompt.trim()) {
      onSendToFlux(extractedPrompt);
    }
  }, [extractedPrompt, onSendToFlux]);

  const canExtract = hasImage && currentImageFile && !isLoading && !isExtracting;
  const canCopyOrSend = extractedPrompt.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col h-full relative bg-[#030303] overflow-hidden">
      {/* Background Tech Elements */}
      <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
        <div className="flex gap-1">
             <div className="w-1 h-1 bg-white rounded-full"></div>
             <div className="w-1 h-1 bg-white rounded-full"></div>
             <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>
      
      {(isLoading || isExtracting) && <PanelScanner theme="purple" />}

      {/* Header Section */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-[#DB24E3] to-purple-900 flex items-center justify-center shadow-[0_0_10px_rgba(219,36,227,0.4)]">
                 <StyleExtractorIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Style DNA Engine
                 </h3>
                 <p className="text-[10px] text-[#DB24E3] font-mono tracking-widest uppercase">
                   Visual Analysis Protocol v2.0
                 </p>
             </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/30 border-l-2 border-red-500 p-3 m-4 mb-0 flex items-start gap-3 backdrop-blur-sm animate-fade-in">
           <AlertIcon className="w-4 h-4 text-red-500 mt-0.5" />
           <p className="text-xs text-red-200 font-mono leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 relative">
         {!extractedPrompt ? (
             <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-white/[0.02] p-8 text-center relative group transition-colors hover:border-white/10">
                 {/* Empty State Visual */}
                 <div className="relative mb-6">
                     <div className="absolute inset-0 bg-[#DB24E3] blur-[40px] opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                     <StyleExtractorIcon className="w-16 h-16 text-gray-700 relative z-10 group-hover:text-gray-500 transition-colors" />
                     
                     {/* Scanning Ring Animation */}
                     <div className="absolute inset-[-10px] border border-[#DB24E3]/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                     <div className="absolute inset-[-20px] border border-dashed border-[#DB24E3]/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                 </div>
                 
                 <h4 className="text-gray-300 font-bold uppercase tracking-wider text-sm mb-2">Awaiting Visual Input</h4>
                 <p className="text-gray-500 text-xs max-w-xs leading-relaxed font-mono">
                    {hasImage 
                      ? "Target Locked. Ready to extract style parameters." 
                      : "Upload source image to begin extraction sequence."}
                 </p>
             </div>
         ) : (
             <div className="animate-fade-in flex flex-col gap-4 h-full">
                 {/* Result Terminal */}
                 <div className="flex-1 bg-[#080808] border border-[#333] rounded-lg overflow-hidden flex flex-col shadow-2xl relative group">
                     {/* Terminal Header */}
                     <div className="bg-[#111] border-b border-[#222] px-3 py-2 flex justify-between items-center">
                         <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                         </div>
                         <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">OUTPUT_STREAM.json</div>
                     </div>
                     
                     {/* Terminal Body */}
                     <div className="flex-1 relative">
                        <textarea 
                           readOnly
                           value={extractedPrompt}
                           className="w-full h-full bg-transparent text-gray-300 p-4 text-xs font-mono resize-none focus:outline-none custom-scrollbar leading-relaxed"
                           style={{ fontFamily: '"Fira Code", "Consolas", monospace' }}
                        />
                        {/* Glow effect */}
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none"></div>
                     </div>
                     
                     {/* Copy Success Overlay */}
                     {copySuccess && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in z-20">
                             <div className="bg-[#111] border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                 <CheckIcon className="w-4 h-4 text-green-400" />
                                 <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Copied to Clipboard</span>
                             </div>
                         </div>
                     )}
                 </div>
                 
                 {/* Action Grid */}
                 <div className="grid grid-cols-2 gap-3">
                     <button
                         onClick={handleCopyToClipboard}
                         disabled={copySuccess}
                         className="h-12 bg-[#111] border border-[#333] rounded hover:bg-[#1a1a1a] hover:border-gray-500 transition-all text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-center gap-2 group active:scale-[0.98]"
                     >
                         <CopyIcon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                         Copy Data
                     </button>
                     <button
                         onClick={handleSend}
                         className="h-12 bg-[#DB24E3]/10 border border-[#DB24E3]/50 rounded hover:bg-[#DB24E3]/20 hover:border-[#DB24E3] transition-all text-xs font-bold text-[#DB24E3] uppercase tracking-wider flex items-center justify-center gap-2 group active:scale-[0.98] shadow-[0_0_15px_rgba(219,36,227,0.1)] hover:shadow-[0_0_20px_rgba(219,36,227,0.25)]"
                     >
                         <SendIcon className="w-4 h-4" />
                         Use Style
                     </button>
                 </div>
             </div>
         )}
      </div>

      {/* Main Trigger Footer */}
      <div className="p-4 sm:p-5 border-t border-[#1A1A1A] bg-[#050505]">
          <button
              onClick={handleExtract}
              disabled={!canExtract}
              className="w-full h-14 relative overflow-hidden group rounded-sm bg-[#111] disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <div className={`absolute inset-0 bg-gradient-to-r from-[#DB24E3] via-[#9D24E3] to-[#DB24E3] transition-all duration-300 ${isExtracting ? 'opacity-100' : 'opacity-100 group-hover:opacity-90'}`}></div>
              
              {/* Animated Shine */}
              {!isExtracting && !(!canExtract) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
              )}
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-2">
                      {isExtracting ? (
                          <>
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             <span className="text-white font-black italic uppercase tracking-widest text-sm">Deciphering...</span>
                          </>
                      ) : (
                          <>
                             <SparklesIcon className="w-4 h-4 text-white" />
                             <span className="text-white font-black italic uppercase tracking-widest text-sm">
                                {hasImage ? "Analyze Style" : "Load Image to Analyze"}
                             </span>
                          </>
                      )}
                  </div>
                  {hasImage && !isExtracting && (
                      <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/60 mt-0.5">
                          Extract Visual DNA
                      </span>
                  )}
              </div>
          </button>
      </div>
    </div>
  );
};