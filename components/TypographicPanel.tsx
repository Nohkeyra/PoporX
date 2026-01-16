
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GenerationRequest } from '../App';
import { TypeIcon, XIcon, BoltIcon, SaveIcon, TrashIcon } from './icons';
import { PROTOCOLS } from '../services/geminiService';
import { loadUserPresets, addUserPreset, deleteUserPreset } from '../services/persistence';
import { PresetSaveModal } from './PresetSaveModal';

interface TypographicPreset {
  name: string;
  description: string;
  applyPrompt: string;
  id?: string;
  isCustom?: boolean;
}

interface TypographicPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
  initialPrompt?: string;
}

const basePresetGroups: Record<string, TypographicPreset[]> = {
  "STREET": [
    { name: 'Wildstyle', description: 'Interlocking 3D.', applyPrompt: `Wildstyle graffiti masterpiece. Sharp interwoven 3D letters, arrows, vibrant neon outlines.` },
    { name: 'Throwie', description: 'Bubble letters.', applyPrompt: `Bubble style graffiti throw-up. Round letters, simple fill, thick outline, drop shadow.` },
    { name: 'Cholo', description: 'East LA script.', applyPrompt: `Cholo style gothic script lettering. Sharp angles, old english influence, black and white.` },
    { name: 'Anti-Style', description: 'Raw chaos.', applyPrompt: `Anti-style graffiti typography. Ignorant style, raw scribbles, chaotic composition, dripping paint.` },
    { name: 'Drip', description: 'Melting ink.', applyPrompt: `Street marker tag with heavy ink drips. Gritty texture, wet paint look.` },
    { name: 'Stencil', description: 'Military spray.', applyPrompt: `Military stencil typography. Bridges in letters, overspray texture, industrial look.` }
  ],
  "MODERN": [
    { name: 'Swiss', description: 'Helvetica grid.', applyPrompt: `Swiss international typographic style. Helvetica, grid based, asymmetrical, clean sans-serif.` },
    { name: 'Luxury', description: 'High contrast.', applyPrompt: `Luxury fashion typography. High contrast didone serif, elegant, thin hairlines.` },
    { name: 'Kinetic', description: 'Motion blur.', applyPrompt: `Kinetic typography. Motion blur, speed lines, stretched text, dynamic movement.` }
  ],
  "DIGITAL": [
    { name: 'Chrome', description: 'Shiny metal.', applyPrompt: `Chrome metal typography. High reflection, bevelled edges, liquid silver look.` },
    { name: 'Glitch', description: 'Data corruption.', applyPrompt: `Glitch art typography. Pixel sorting, RGB shift, signal noise, distorted text.` },
    { name: 'Neon', description: 'Glowing tubes.', applyPrompt: `Neon sign typography. Glowing tubes, realistic light emission, dark background.` }
  ],
  "CLASSIC": [
    { name: 'Gothic', description: 'Blackletter.', applyPrompt: `Gothic blackletter calligraphy. Ornate, sharp strokes, medieval aesthetic.` },
    { name: 'Retro', description: '80s synthwave.', applyPrompt: `80s retro synthwave typography. Gradient fill, sun grid, laser effects.` }
  ]
};

export const TypographicPanel: React.FC<TypographicPanelProps> = ({ onRequest, isLoading, hasImage, initialPrompt }) => {
  const [userInput, setUserInput] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Wildstyle');
  const [routedApplyPrompt, setRoutedApplyPrompt] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const loadPresets = useCallback(async () => {
    try {
        const stored = await loadUserPresets();
        setCustomPresets(stored.filter((p: any) => p.recommendedPanel === 'typographic_panel'));
    } catch(e) {}
  }, []);

  useEffect(() => {
    loadPresets();
    window.addEventListener('stylePresetsUpdated', loadPresets);
    return () => window.removeEventListener('stylePresetsUpdated', loadPresets);
  }, [loadPresets]);

  useEffect(() => {
    if (initialPrompt) { setRoutedApplyPrompt(initialPrompt); setSelectedPresetName(''); }
  }, [initialPrompt]);

  const presetGroups = useMemo(() => {
    if (customPresets.length === 0) return basePresetGroups;
    return { "USER ARCHIVE": customPresets, ...basePresetGroups };
  }, [customPresets]);

  const allPresets = useMemo(() => Object.values(presetGroups).flat() as TypographicPreset[], [presetGroups]);
  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName, allPresets]);

  const handleAction = () => {
    const applyPrompt = selectedPreset ? selectedPreset.applyPrompt : routedApplyPrompt;
    if (!applyPrompt) return;
    
    let basePrompt = userInput.trim() || "PIX";
    const fullPrompt = `${applyPrompt} CONTENT: "${basePrompt.toUpperCase()}". Directives: Pure graphic asset, zero environmental noise, studio isolation.`;

    onRequest({ 
      type: 'typography', prompt: fullPrompt, forceNew: !hasImage, aspectRatio: '1:1', 
      systemInstructionOverride: hasImage ? PROTOCOLS.IMAGE_TRANSFORMER : PROTOCOLS.TYPOGRAPHER,
      denoisingInstruction: hasImage ? "Medium denoising (55%). Integrate glyphs into source geometry." : ""
    });
  };

  const handleSavePreset = async (name: string, desc: string) => {
      const promptToSave = selectedPreset ? selectedPreset.applyPrompt : routedApplyPrompt;
      if (!promptToSave) return;

      const newPreset = {
          id: `type_${Date.now()}`,
          name, description: desc,
          applyPrompt: promptToSave,
          recommendedPanel: 'typographic_panel',
          timestamp: Date.now(),
          isCustom: true
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
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at 50% -20%, rgba(255, 0, 255, 0.15) 0%, transparent 70%)' }} />

      <div className="p-5 border-b border-zinc-800 bg-surface-panel/90 shrink-0 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-sm bg-type/20 border border-type/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                 <TypeIcon className="w-5 h-5 text-type" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none font-display">Type Lab</h3>
                 <p className="text-[8px] text-type font-mono tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]">Glyph.Synthesis</p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar relative z-10">
           <div>
                <h4 className="panel-label border-type/50 pl-2">Input Sequence</h4>
                <div className="group border border-zinc-800 bg-black/40 rounded-sm overflow-hidden focus-within:border-type/60 focus-within:shadow-[0_0_15px_rgba(255,0,255,0.15)] transition-all relative shadow-inner">
                    <div className="flex justify-between items-center bg-zinc-900/50 px-3 py-2 border-b border-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-type rounded-full animate-pulse shadow-[0_0_5px_rgba(255,0,255,0.8)]" />
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black group-focus-within:text-type transition-colors">STRING_BUFFER</span>
                        </div>
                        <div className="flex gap-2">
                             {(selectedPreset || routedApplyPrompt) && (
                                <button onClick={() => setIsSaveModalOpen(true)} className="text-zinc-600 hover:text-type transition-colors">
                                    <SaveIcon className="w-3.5 h-3.5" />
                                </button>
                             )}
                            {userInput && <button onClick={() => setUserInput('')} className="text-zinc-600 hover:text-white transition-colors"><XIcon className="w-3.5 h-3.5" /></button>}
                        </div>
                    </div>
                    <input 
                        type="text" 
                        value={userInput} 
                        onChange={(e) => setUserInput(e.target.value.slice(0, 30))}
                        placeholder="ENTER TEXT..."
                        className="w-full bg-transparent p-4 text-lg font-mono text-white placeholder-zinc-800 tracking-[0.2em] uppercase font-black focus:outline-none selection:bg-type/30"
                    />
                    <div className="absolute bottom-0 right-0 p-1 opacity-20 pointer-events-none group-focus-within:opacity-100 transition-opacity duration-300">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 10L0 10L10 0V10Z" fill="var(--color-type)" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="space-y-6 pb-4">
              {Object.entries(presetGroups).map(([groupName, presets]) => (
                  <div key={groupName}>
                      <h4 className={`panel-label border-type/50 pl-2 ${groupName === 'USER ARCHIVE' ? 'text-type' : ''}`}>{groupName}</h4>
                      <div className="grid grid-cols-2 gap-2">
                          {(presets as TypographicPreset[]).map(preset => (
                              <button 
                                  key={preset.name} 
                                  onClick={() => { setSelectedPresetName(preset.name); setRoutedApplyPrompt(null); }}
                                  className={`preset-card min-h-[4rem] flex flex-col justify-between ${
                                      selectedPresetName === preset.name 
                                      ? 'bg-type/20 text-white border-type shadow-[0_0_15px_rgba(255,0,255,0.25)] z-10' 
                                      : 'text-zinc-600 hover:text-zinc-400'
                                  }`}
                              >
                                  <div className={`text-[9px] font-black uppercase tracking-wider transition-colors ${selectedPresetName === preset.name ? 'text-white' : 'text-zinc-400'}`}>{preset.name}</div>
                                  <p className={`text-[8px] leading-tight font-mono uppercase tracking-tight truncate ${selectedPresetName === preset.name ? 'text-type' : 'text-zinc-700'}`}>{preset.description}</p>
                                  
                                  {(preset.id || preset.isCustom) && (
                                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <div onClick={(e) => handleDelete(e, preset.id!)} className="p-1 text-zinc-500 hover:text-red-500 bg-black/80 rounded"><TrashIcon className="w-3 h-3" /></div>
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
         <button onClick={handleAction} disabled={isLoading || (!selectedPresetName && !routedApplyPrompt)} className="execute-btn group border-zinc-800 hover:border-type transition-colors">
              <div className="execute-btn-glow" style={{ background: 'radial-gradient(circle, #FF00FF 0%, transparent 70%)' }}></div>
              <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                  <span className={`font-black italic uppercase tracking-[0.2em] text-xs transition-colors skew-x-[-10deg] ${isLoading ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-type'}`}>
                      {isLoading ? 'Synthesizing...' : 'Execute Type'}
                  </span>
                  <BoltIcon className={`w-4 h-4 transition-colors ${isLoading ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-type'}`} />
              </div>
         </button>
      </div>
    </div>
  );
};
