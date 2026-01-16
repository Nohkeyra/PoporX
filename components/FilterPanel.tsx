
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GenerationRequest } from '../App';
import { PaletteIcon, SparklesIcon, SaveIcon, TrashIcon } from './icons';
import { refineImagePrompt, describeImageForPrompt, PROTOCOLS } from '../services/geminiService';
import { loadUserPresets, addUserPreset, deleteUserPreset } from '../services/persistence';
import { PresetSaveModal } from './PresetSaveModal';

interface FilterPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  setViewerInstruction: (text: string | null) => void;
  isFastAiEnabled: boolean;
  hasImage: boolean;
  currentImageFile?: File | null;
  initialPrompt?: string; 
}

const basePresetGroups = {
  "HYPER REALITY": [
    { name: 'Unreal', description: 'Game engine.' },
    { name: 'Plastic', description: 'Glossy synthetic.' },
    { name: 'OLED', description: 'Deep blacks.' },
    { name: 'Raytrace', description: 'Light bounces.' },
    { name: 'Liquid', description: 'Fluid metal.' },
    { name: 'Glass', description: 'Refractive.' }
  ],
  "STREET FX": [
    { name: 'Banksy', description: 'Stencil cutout.' },
    { name: 'Subway', description: 'Drip marker.' },
    { name: 'Halftone', description: 'Dot pattern.' },
    { name: 'Xerox', description: 'Gritty copy.' },
    { name: 'Wheatpaste', description: 'Torn poster.' },
    { name: 'Thermal', description: 'Heatmap.' }
  ],
  "GRAPHIC DESIGN": [
    { name: 'Swiss', description: 'Grid system.' },
    { name: 'Bauhaus', description: 'Geometric colors.' },
    { name: 'Poster', description: 'Gig poster.' },
    { name: 'Blueprint', description: 'Cyan technical.' }
  ],
  "FINE ART": [
    { name: 'Gouache', description: 'Matte paint.' },
    { name: 'Charcoal', description: 'Burnt wood.' },
    { name: 'Impasto', description: 'Thick oil.' },
    { name: 'Ink Wash', description: 'Sumi-e.' }
  ],
  "CHROMATIC": [
    { name: 'Glitch', description: 'Signal noise.' },
    { name: 'Chrome', description: 'Liquid metal.' },
    { name: 'Acid', description: 'Trippy colors.' },
    { name: 'Vapor', description: 'Pink/Cyan.' }
  ]
};

export const FilterPanel: React.FC<FilterPanelProps> = ({ onRequest, isLoading, isFastAiEnabled, hasImage, currentImageFile, initialPrompt }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Unreal');
  const [isRefining, setIsRefining] = useState(false);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const loadPresets = useCallback(async () => {
    try {
        const stored = await loadUserPresets();
        setCustomPresets(stored.filter((p: any) => p.recommendedPanel === 'filter_panel'));
    } catch(e) {}
  }, []);

  useEffect(() => {
    loadPresets();
    window.addEventListener('stylePresetsUpdated', loadPresets);
    return () => window.removeEventListener('stylePresetsUpdated', loadPresets);
  }, [loadPresets]);

  useEffect(() => {
    if (initialPrompt) { setUserPrompt(initialPrompt); setSelectedPresetName(''); }
  }, [initialPrompt]);

  const presetGroups = useMemo(() => {
    if (customPresets.length === 0) return basePresetGroups;
    return { "USER DATA": customPresets, ...basePresetGroups };
  }, [customPresets]);

  const handleApply = async () => {
    let effectiveSubject = userPrompt.trim();
    if (!effectiveSubject && currentImageFile) {
        try { effectiveSubject = await describeImageForPrompt(currentImageFile); } 
        catch (err) { effectiveSubject = "the primary subject"; }
    } else if (!effectiveSubject) effectiveSubject = "the primary subject";

    const customPreset = customPresets.find(p => p.name === selectedPresetName);
    let prompt = customPreset 
        ? (customPreset.applyPrompt || customPreset.genPrompt)
        : `${effectiveSubject} in the style of ${selectedPresetName}`;

    onRequest({ 
        type: 'filters', prompt: prompt, 
        useOriginal: false, systemInstructionOverride: PROTOCOLS.IMAGE_TRANSFORMER 
    });
  };
  
  const handleRefine = async () => {
    if (!userPrompt.trim() || isRefining) return;
    setIsRefining(true);
    try { setUserPrompt(await refineImagePrompt(userPrompt, isFastAiEnabled)); } catch (e) {} 
    finally { setIsRefining(false); }
  };

  const handleSavePreset = async (name: string, desc: string) => {
      const newPreset = {
          id: `filter_${Date.now()}`,
          name, description: desc,
          applyPrompt: userPrompt.trim() || `Style of ${selectedPresetName}`,
          recommendedPanel: 'filter_panel',
          timestamp: Date.now()
      };
      await addUserPreset(newPreset);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm('Delete this preset?')) await deleteUserPreset(id);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <PresetSaveModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSavePreset} />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(0, 240, 255, 0.15) 0%, transparent 70%)' }} />
      
      <div className="p-5 border-b border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-sm bg-filter/20 border border-filter/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                 <PaletteIcon className="w-5 h-5 text-filter" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none font-display">FX Pipeline</h3>
                 <p className="text-[8px] text-filter font-mono tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">Signal.Processing</p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar relative z-10">
          <div>
              <h4 className="panel-label border-filter/50 pl-2">Target Override</h4>
              <div className="group border border-zinc-800 bg-black/40 rounded-sm overflow-hidden focus-within:border-filter/60 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all relative shadow-inner">
                  <div className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-b border-zinc-800/50">
                      <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-filter rounded-full animate-pulse shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black group-focus-within:text-filter transition-colors">SUBJECT_DNA</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setIsSaveModalOpen(true)} disabled={!userPrompt.trim()} className="text-zinc-600 hover:text-filter disabled:opacity-20 transition-colors" title="Save Preset">
                            <SaveIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={handleRefine} disabled={!userPrompt.trim() || isRefining} className="text-zinc-600 hover:text-filter transition-colors" title="Enhance">
                            <SparklesIcon className={`w-3.5 h-3.5 ${isRefining ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                  </div>
                  <textarea 
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder={hasImage ? "// Inherit from source..." : "// Describe target..."}
                      className="w-full bg-transparent p-4 text-xs font-mono text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none h-20 leading-relaxed selection:bg-filter/30"
                  />
                  <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity duration-300">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 10L0 10L10 0V10Z" fill="var(--color-filter)" />
                        </svg>
                  </div>
              </div>
          </div>

          <div className="space-y-6 pb-4">
            {Object.entries(presetGroups).map(([groupName, presets]) => (
                <div key={groupName}>
                    <h4 className={`panel-label border-filter/50 pl-2 ${groupName === 'USER DATA' ? 'text-filter' : ''}`}>{groupName}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(presets as any[]).map(preset => (
                            <button 
                                key={preset.name} onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                                className={`preset-card min-h-[4rem] flex flex-col justify-between ${
                                    selectedPresetName === preset.name 
                                    ? 'bg-filter/20 text-white border-filter shadow-[0_0_15px_rgba(0,240,255,0.25)] z-10' 
                                    : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                <div className={`text-[9px] font-black uppercase tracking-wider transition-colors ${selectedPresetName === preset.name ? 'text-white' : 'text-zinc-400'}`}>{preset.name}</div>
                                <p className={`text-[8px] leading-tight font-mono uppercase tracking-tight truncate ${selectedPresetName === preset.name ? 'text-filter' : 'text-zinc-700'}`}>{preset.description}</p>
                                
                                {selectedPresetName === preset.name && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-filter rounded-full shadow-[0_0_5px_#00F0FF]"></div>}
                                
                                {(preset.id || preset.isCustom) && (
                                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <div onClick={(e) => handleDelete(e, preset.id)} className="p-1 text-zinc-500 hover:text-red-500 bg-black/80 rounded"><TrashIcon className="w-3 h-3" /></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </div>
      </div>

      <div className="p-5 border-t border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
          <button onClick={handleApply} disabled={isLoading || (!selectedPresetName && !userPrompt.trim())} className="execute-btn group border-zinc-800 hover:border-filter transition-colors">
              <div className="execute-btn-glow" style={{ background: 'radial-gradient(circle, #00F0FF 0%, transparent 70%)' }}></div>
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                  <span className={`font-black italic uppercase tracking-[0.2em] text-xs transition-colors skew-x-[-10deg] ${isLoading ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-filter'}`}>
                      {isLoading ? 'Processing...' : 'Apply Filter'}
                  </span>
                  <PaletteIcon className={`w-4 h-4 transition-colors ${isLoading ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-filter'}`} />
              </div>
          </button>
      </div>
    </div>
  );
};
