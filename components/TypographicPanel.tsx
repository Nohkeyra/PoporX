/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { TypeIcon, XIcon } from './icons';

interface TypographicPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

const presetGroups = {
  "STREET & URBAN": [
    { name: 'Wildstyle Tag', description: 'Complex interlocking vector.', applyPrompt: 'Render as a flat vector wildstyle graffiti tag. Complex interlocking letters, sharp arrows, bold black outlines, vibrant flat colors, no gradients, clean vector finish on white background.' },
    { name: 'Bubble Throwie', description: 'Inflated 2D letters.', applyPrompt: 'Render as a flat vector bubble graffiti throw-up. Rounded inflated letters, thick bold outline, solid single color fill, 2D flat design, sticker aesthetic.' },
    { name: 'Stencil Spray', description: 'High-contrast banksy style.', applyPrompt: 'Render as a flat vector stencil art piece. High contrast black and white, clean distinct cuts, minimalist street art style, isolated, no blur.' },
    { name: 'Skate Sticker', description: 'Die-cut vinyl decal.', applyPrompt: 'Render as a flat vector skate sticker design. Bold graphic illustration, thick white contour border, die-cut vinyl aesthetic, pop art colors, flat shading only.' },
  ],
  "BRANDING & SIGNAGE": [
    { name: 'Swiss Minimal', description: 'Clean corporate identity.', applyPrompt: 'Render as a high-end Swiss design minimalist logo. Helvetica-style bold sans-serif, perfect geometric balance, stark contrast, professional corporate identity, flat vector.' },
    { name: '3D Channel Letter', description: 'Physical store signage.', applyPrompt: 'Render as realistic 3D channel letter signage mounted on a building facade. Physical depth, dimensional shadows, architectural retail visualization.' },
    { name: 'Chrome Emblem', description: 'Automotive metallic badge.', applyPrompt: 'Render as a 3D chrome automotive badge. High polish metallic finish, beveled edges, reflective surface, heavy industrial feel.' },
    { name: 'Neon Sign', description: 'Glowing night tube.', applyPrompt: 'Render as a realistic glowing neon tube sign. Vibrant light emitting tubes, dark background, cinematic night lighting, electrical buzz aesthetic.' },
    { name: 'Retro Serif Logo', description: 'Classic engraved font.', applyPrompt: 'Render as a classic engraved serif logo. Detailed ornate edges, subtle metallic sheen, vintage typography.' },
    { name: 'Modern Sans Logo', description: 'Clean and geometric.', applyPrompt: 'Render as a modern geometric sans-serif logo. Minimalist structure, sharp edges, balanced negative space, flat vector.' },
    { name: 'Brush Script Logo', description: 'Hand-painted flow.', applyPrompt: 'Render as a stylish brush script logo. Dynamic fluid strokes, textured paint effect, casual yet elegant feel.' },
  ],
  "PREMIUM LUXURY": [
    { name: 'Art Deco', description: '1920s gold filigree.', applyPrompt: 'Transform into an Art Deco opulent monogram style. Gold leaf filigree, black and gold palette, flat vector style.' },
    { name: 'Diamond Crystal', description: 'Faceted gemstone refraction.', applyPrompt: 'Transform into a diamond-cut crystal monogram. Multi-faceted glass effect, brilliant refraction.' },
    { name: 'Marble Veined', description: 'Natural stone texture.', applyPrompt: 'Transform into a marble veined monogram. Carrara marble texture, natural stone veins.' },
  ],
  "MODERN TECH": [
    { name: 'Neo-Brutalist', description: 'Raw concrete architecture.', applyPrompt: 'Transform into a neo-brutalist concrete monogram. Raw textured surface, exposed aggregate.' },
    { name: 'Holographic', description: 'Iridescent liquid metal.', applyPrompt: 'Transform into a holographic chrome monogram. Rainbow metallic sheen, futuristic surface.' },
    { name: 'Neon Cyber', description: 'Glowing circuit nodes.', applyPrompt: 'Transform into a neural network monogram. Interconnected nodes, glowing lines, blue/orange.' },
  ],
  "ORGANIC & VINTAGE": [
    { name: 'Botanical', description: 'Pressed leaves & flowers.', applyPrompt: 'Transform into a pressed botanical monogram. Leaves and flowers forming letters.' },
    { name: 'Wax Seal', description: 'Stamped crimson wax.', applyPrompt: 'Transform into a wax seal monogram. Stamped wax texture, authentic seal impression.' },
    { name: 'Embroidery', description: 'Stitched fabric thread.', applyPrompt: 'Transform into an embroidered monogram patch. Realistic thread texture, fabric background.' },
  ],
  "PLAYFUL": [
    { name: 'Inflatable', description: '3D shiny plastic.', applyPrompt: 'Transform into an inflatable pool toy monogram. Shiny plastic surface, bright colors.' },
    { name: 'Bubble Gum', description: 'Pink sticky candy.', applyPrompt: 'Transform into a bubble gum monogram. Sticky shiny surface, bright pink color.' },
    { name: 'Slime Drip', description: 'Radioactive goo.', applyPrompt: 'Transform into a dripping radioactive slime font. Glowing green ooze, liquid texture.' },
  ]
};

const allPresets = Object.values(presetGroups).flat();

const TypographicPanel: React.FC<TypographicPanelProps> = ({ onRequest, isLoading, hasImage, setViewerInstruction }) => {
  const [userInput, setUserInput] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');
  
  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  const handleAction = (forceNew: boolean) => {
    if (!selectedPreset || !userInput.trim()) return;
    
    // Construct Prompt
    const base = forceNew ? `Typography art of "${userInput}": ${selectedPreset.applyPrompt}` : `${selectedPreset.applyPrompt} The final design must incorporate the text "${userInput}".`;
    const fullPrompt = `${base}, white background, high resolution, vector style.`;

    onRequest({ type: 'typography', prompt: fullPrompt, forceNew, aspectRatio: '1:1' });
  };

  const isActionDisabled = isLoading || !userInput.trim() || !selectedPresetName;

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {isLoading && <PanelScanner theme="pink" />}

      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-500 to-purple-900 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)]">
                 <TypeIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Type Foundry
                 </h3>
                 <p className="text-[10px] text-pink-500 font-mono tracking-widest uppercase">
                   Text-to-Art Engine
                 </p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {/* Text Input */}
         <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3 group focus-within:border-pink-500/50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Target Text</label>
                  {userInput && <button onClick={() => setUserInput('')}><XIcon className="w-3 h-3 text-gray-600 hover:text-white" /></button>}
              </div>
              <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.slice(0, 20))}
                  placeholder="ENTER TEXT (Max 20 chars)..."
                  className="w-full bg-transparent text-white text-xl font-black italic uppercase text-center focus:outline-none resize-none h-16 placeholder-gray-800 tracking-wider leading-[3.5rem]"
                  style={{ fontFamily: 'Koulen' }}
              />
          </div>

          <div className="space-y-4">
            {Object.entries(presetGroups).map(([groupName, presets]) => (
                <div key={groupName}>
                    <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 px-1">{groupName}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map(preset => (
                            <button 
                                key={preset.name} 
                                onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                                className={`p-3 text-left border rounded-sm transition-all duration-200 group overflow-hidden ${selectedPresetName === preset.name ? 'bg-pink-950/30 border-pink-500' : 'bg-[#111] border-[#222] hover:border-gray-600'}`}
                            >
                                <div className="relative z-10">
                                    <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{preset.name}</div>
                                    <p className="text-[9px] text-gray-600 leading-tight">{preset.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505] flex gap-2">
         {hasImage && (
             <button
               onClick={() => handleAction(false)}
               disabled={isActionDisabled}
               className="flex-1 h-12 border border-[#333] bg-[#111] hover:bg-[#161616] text-gray-300 font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50"
             >
               Style Img
             </button>
         )}
         <button
              onClick={() => handleAction(true)}
              disabled={isActionDisabled}
              className={`h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-pink-900/30 disabled:opacity-50 disabled:cursor-not-allowed ${hasImage ? 'flex-[2]' : 'w-full'}`}
          >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {!isActionDisabled && <div className="absolute inset-0 bg-pink-900/20"></div>}
              
              <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                  <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-pink-400 group-hover:text-white'}`}>
                      Generate Text Art
                  </span>
              </div>
          </button>
      </div>
    </div>
  );
};

export default TypographicPanel;