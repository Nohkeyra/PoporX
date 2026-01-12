/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { SunIcon, SlidersIcon, XIcon, SparklesIcon } from './icons';
import { refineImagePrompt } from '../services/geminiService';

interface AdjustmentPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  setViewerInstruction: (text: string | null) => void;
}

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onRequest, isLoading, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');
  const [isRefining, setIsRefining] = useState(false);
  
  const presets = [
    { name: 'Auto Enhance', description: 'Balanced exposure & color.', prompt: 'Perform a professional-grade automatic adjustment of exposure, contrast, and color saturation.' },
    { name: 'Golden Hour', description: 'Warm sunset lighting.', prompt: 'Re-light the image with the warm, soft, low-angle light of the golden hour.' },
    { name: 'Dramatic B&W', description: 'High-contrast monochrome.', prompt: 'Convert the image to a high-contrast black and white. Deepen the blacks, brighten the whites.' },
    { name: 'Cinematic', description: 'Teal & Orange grading.', prompt: 'Apply a professional cinematic color grade with teal in the shadows and orange in the highlights.' },
    { name: 'Blur BG', description: 'Depth-of-field bokeh.', prompt: 'Apply a photorealistic depth-of-field blur (bokeh) to the background, keeping subject sharp.' },
    { name: 'HDR Pop', description: 'Vibrant dynamic range.', prompt: 'Apply a high-dynamic-range (HDR) effect to recover details in shadows and highlights.' },
    { name: 'Matte Finish', description: 'Faded blacks, editorial.', prompt: 'Apply a matte photo finish by lifting the black levels to a faded grey.' },
    { name: 'Cold Winter', description: 'Cool blue temperature.', prompt: 'Shift the color temperature of the image to be colder, with subtle blue tones.' },
  ];

  const selectedPreset = useMemo(() => presets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  const handleApply = () => {
    const parts = [];
    if (selectedPreset) parts.push(selectedPreset.prompt);
    if (userPrompt.trim()) parts.push(userPrompt.trim());
    
    if (parts.length > 0) {
      onRequest({ type: 'adjust', prompt: parts.join('. '), useOriginal: false });
    }
  };

  const handleRefine = async () => {
      if (!userPrompt.trim() || isRefining) return;
      setIsRefining(true);
      try {
        const refined = await refineImagePrompt(userPrompt);
        setUserPrompt(refined);
      } catch (e) { console.error(e); } 
      finally { setIsRefining(false); }
  };

  const isActionDisabled = isLoading || (!selectedPreset && !userPrompt.trim());

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {isLoading && <PanelScanner theme="orange" />}

      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-900 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                 <SunIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Adjustments
                 </h3>
                 <p className="text-[10px] text-orange-500 font-mono tracking-widest uppercase">
                   Signal Processing
                 </p>
             </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Custom Input */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3 group focus-within:border-orange-500/50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Manual Override</label>
                  <div className="flex gap-2">
                    {userPrompt && <button onClick={() => setUserPrompt('')}><XIcon className="w-3 h-3 text-gray-600 hover:text-white" /></button>}
                    <button onClick={handleRefine} disabled={!userPrompt.trim() || isRefining} className="text-orange-500 disabled:opacity-30"><SparklesIcon className={`w-3 h-3 ${isRefining ? 'animate-spin' : ''}`} /></button>
                  </div>
              </div>
              <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Describe specific adjustments..."
                  className="w-full bg-transparent text-gray-300 text-xs font-mono focus:outline-none resize-none h-16 placeholder-gray-700"
              />
          </div>

          {/* Control Grid */}
          <div>
            <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 px-1">Global Presets</h4>
            <div className="grid grid-cols-2 gap-2">
                {presets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                        className={`h-14 border rounded-sm flex items-center px-3 gap-3 transition-all ${selectedPresetName === preset.name ? 'bg-orange-950/20 border-orange-500' : 'bg-[#111] border-[#222] hover:border-gray-600'}`}
                    >
                        {/* Status Light */}
                        <div className={`w-1.5 h-1.5 rounded-full shadow-sm flex-shrink-0 ${selectedPresetName === preset.name ? 'bg-orange-500 shadow-[0_0_5px_#f97316]' : 'bg-gray-800'}`}></div>
                        
                        <div className="text-left overflow-hidden">
                            <div className={`text-xs font-bold uppercase truncate ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400'}`}>{preset.name}</div>
                            <div className="text-[8px] text-gray-600 truncate">{preset.description}</div>
                        </div>
                    </button>
                ))}
            </div>
          </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505]">
          <button
              onClick={handleApply}
              disabled={isActionDisabled}
              className="w-full h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {!isActionDisabled && <div className="absolute inset-0 bg-orange-900/20"></div>}
              
              <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                  <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-orange-400 group-hover:text-white'}`}>
                      Execute Adjustment
                  </span>
                  {!isActionDisabled && <SlidersIcon className="w-4 h-4 text-orange-400 group-hover:text-white skew-x-[-10deg]" />}
              </div>
          </button>
      </div>
    </div>
  );
};