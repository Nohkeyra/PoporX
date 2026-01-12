/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { CollapsibleSection } from './CollapsibleSection';
import { PaletteIcon, SparklesIcon, XIcon } from './icons';
import { refineImagePrompt } from '../services/geminiService';

interface FilterPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  setViewerInstruction: (text: string | null) => void;
}

const presetGroups = {
  "BIOMECHANICAL & SURREAL": [
    { name: 'Gigeresque Symbiote', description: 'Obsidian exoskeleton, biomechanical fusion.', prompt: 'Reconstruct the main subject as a Gigeresque biomechanical symbiote. Fuse flesh with a polished obsidian exoskeleton, pulsating bioluminescent tubing, and intricate, alien machinery. The aesthetic is dark, surreal, and hyper-detailed with a wet, glossy texture and cinematic lighting.' },
    { name: 'Mycelial Corruption', description: 'Bioluminescent fungal overgrowth.', prompt: 'Corrupt the entire image with a bioluminescent mycelial network. The subject\'s form should be partially overtaken by intricate, glowing fungal structures and cordyceps-like growths. The atmosphere is beautiful but unsettling, a fusion of organic decay and alien life, with visible spores floating in the air.' },
    { name: 'Glass Anatomy', description: 'Fragmented translucent glass sculpture.', prompt: 'Deconstruct the subject into an anatomical sculpture made of fragmented, translucent colored glass. Show the inner workings as a beautiful, abstract network of light and form, as if a medical diagram was designed by a master glassblower. The style is clean, sharp, and surreal, isolated against a dark, minimalist background.' },
  ],
  "TEMPORAL GLITCH": [
    { name: 'VHS Data-Bleed', description: '90s analog noise & tracking errors.', prompt: 'Degrade the image with severe VHS data-bleed artifacts. Introduce analog tracking errors, heavy chroma noise, a flickering 90s camcorder timestamp overlay, and mix it with corrupted futuristic data streams and glitched-out hexadecimal code. The aesthetic is a temporal paradox.' },
    { name: 'Baroque-Punk', description: 'Gilded ornamentation meets cybernetics.', prompt: 'Create a Baroque-Punk anomaly. Fuse the subject\'s modern form with ornate, gilded Baroque ornamentation, intricate gold-leaf filigree, and cracked marble textures. Simultaneously, integrate exposed cybernetic implants, glowing conduits, and polished chrome. The lighting is dramatic chiaroscuro.' },
  ],
  "ESOTERIC & ARCANE": [
    { name: 'Arcane Sigils', description: 'Glowing esoteric sigils & geometry.', prompt: 'Overload the image with an intricate network of glowing arcane sigils and occult geometric patterns. The symbols should appear to be projected onto the scene or emanating directly from the subject as raw energy. Use a vibrant, magical color palette like ethereal blues, purples, and golds against a dark, moody background.' },
    { name: 'Neo-Tarot Inlay', description: 'Futuristic tarot card aesthetic.', prompt: 'Re-frame the entire image as a hyper-detailed, futuristic tarot card. The subject is the central figure. Add an ornate, sci-fi inspired border with inlaid circuit patterns and holographic foil accents. Integrate esoteric symbols and give the card a title, such as "XIX: THE SUN" or "XV: THE DEVIL", rendered in a modern, sharp typeface.' },
  ],
  "CINEMATIC & MOODY": [
    { name: 'HDR Cinematic', description: 'Epic dynamic range, filmic grading.', prompt: 'Transform the image with an HDR cinematic style. Exaggerate the dynamic range with advanced tonemapping, apply intense filmic color grading (teal and orange), and create a dramatic, larger-than-life atmosphere. Enhance local contrast. Do not alter the subject.' },
    { name: 'Moody Grain', description: 'Dark tones, 35mm film grain.', prompt: 'Transform the image into an authentic, moody film photograph. Apply a visible 35mm film grain texture, desaturate the colors for a somber feel, and crush the blacks for an emotional, raw, and candid look. Add subtle light leaks.' },
    { name: 'Cyberpunk Noir', description: 'Rainy neon streets, high contrast.', prompt: 'Reconstruct the scene in a Cyberpunk Noir style. Use high contrast, deep shadows, and illuminate the subject with vibrant cyan and magenta neon reflections on rainy, futuristic city streets. Add atmospheric haze and chromatic aberration.' },
    { name: 'Candid Raw', description: 'Unfiltered 35mm lifestyle.', prompt: 'Re-process the image to look like a candid, raw, lifestyle photograph from a 35mm camera. Use natural lighting, emphasize authentic skin textures and pores, and create a feeling of an unposed, captured moment. No airbrushing, no perfect smiles.' },
    { name: 'Editorial Luxury', description: 'High-end fashion magazine look.', prompt: 'Re-grade the entire image with a high-end editorial luxury look from a fashion magazine. Use clean, refined color palettes with subtle gold and earthy tones. Ensure perfect, yet natural skin tones and balanced clarity. The final output should feel sophisticated and premium.' },
  ],
  "ARTISTIC TRANSFORMATION": [
    { name: 'Digital Painting', description: 'Expressive concept art brushwork.', prompt: 'Re-imagine the entire photograph as a digital painting in the style of professional concept art. Use expressive, visible brushstrokes and artistic, dramatic lighting. Focus on mood and composition.' },
    { name: 'Van Gogh Oil', description: 'Thick swirling impasto strokes.', prompt: 'Transform the entire image into an oil painting with the thick, swirling impasto brushstrokes and vibrant, emotional color palette of Vincent Van Gogh. The texture of the paint should be visible.' },
    { name: 'Blythe Doll', description: 'Big eyes, porcelain doll style.', prompt: 'Transform the main human subject into a Blythe doll. Exaggerate the eyes to be large, glossy, and soulful. Give the skin a smooth, perfect porcelain texture and apply soft, dreamy, vintage-style lighting.' },
    { name: 'Chibi Anime', description: 'Cute exaggerated anime character.', prompt: 'Transform the main subject into a cute Chibi anime character. Give them large, sparkling, expressive eyes, a small, compact body, and integrate them into a background with vibrant, dynamic energy and speed lines.' },
    { name: 'Ghibli Style', description: 'Lush hand-painted watercolor style.', prompt: 'Transform the image into a Ghibli-esque anime style. Use lush, hand-painted watercolor backgrounds, vibrant yet gentle colors, and a nostalgic, whimsical atmosphere with soft, warm lighting. The subject should be cel-shaded with clean lines.' },
    { name: 'Neo-Pop', description: 'Vibrant abstract ribbon blocks.', prompt: 'Transform the entire image into a vibrant, abstract neo-pop illustration. Use flowing, ribbon-like color blocks with a high-contrast, energetic palette (e.g., bold oranges, reds, blues, and greens). Eliminate traditional outlines, defining the form with the shapes of the color blocks themselves. The style should be modern, graphic, and reminiscent of a contemporary poster art.' },
  ],
  "SCI-FI & SURREAL": [
    { name: 'Neon Glow', description: 'Vibrant glowing cyan & magenta.', prompt: 'Render the image in a neon futuristic style. The subject should be illuminated by vibrant, glowing cyan and magenta lights, casting reflections and creating a cyberpunk atmosphere. Add holographic interface elements.' },
    { name: 'Retrofuturism', description: '80s synthwave chrome & grid.', prompt: 'Transform the image into an 80s retro-futuristic synthwave scene. Apply sunset gradients, neon grids, and chrome textures to the entire composition for a nostalgic sci-fi look. Add a lens flare.' },
    { name: 'Synthwave Pop', description: 'Neon halftone 80s pop art.', prompt: 'Transform the entire image into a high-contrast, retro-futuristic illustration in the style of 80s synthwave and pop art. Use a bold neon cyan and magenta color palette and incorporate visible halftone dot textures for a graphic, printed look. The lighting should be dramatic and graphic, creating a powerful and iconic composition.' },
    { name: 'Holographic', description: 'Iridescent metallic projection.', prompt: 'Apply a holographic effect to the entire image. The subject and background should have a shimmering, iridescent, rainbow-like metallic sheen, with scan lines, as if being projected as a futuristic hologram.' },
    { name: 'Glitchy Glam', description: 'Iridescent glam, digital artifacts.', prompt: 'Apply a "Glitchy Glam" aesthetic to the image. Introduce digital artifacts, chromatic aberration, pixel sorting, and iridescent neon sheens for a futuristic, corrupted, yet stylish look. Embrace intentional visual errors.' },
    { name: 'Solarized Infrared', description: 'Inverted tones, pink foliage.', prompt: 'Apply a surreal solarized infrared effect, emulating Aerochrome film. Invert tones, shift foliage and greens to white or pink, darken the sky, and create a dreamlike, otherworldly landscape.' },
    { name: 'Fantasy Glow', description: 'Magical ethereal light overlays.', prompt: 'Transform the image into a fantasy scene by adding a magical, ethereal glow. Ethereal light beams and sparkling, floating particles should illuminate the subject and their surroundings, creating a dreamlike, high-fantasy atmosphere.' }
  ],
  "ANALOG & VINTAGE": [
      { name: 'Retro Revival', description: 'Warm grain, nostalgic tones.', prompt: 'Transform the image to look like it was shot on retro 35mm film. Apply a warm color cast, visible film grain, subtle light leaks, and faded, milky highlights for a nostalgic, analog aesthetic. Soften focus slightly.' },
      { name: 'Chromatic Edge', description: 'Extreme chromatic aberration.', prompt: 'Apply an extreme chromatic aberration effect to the entire image, especially around the high-contrast edges of the subject. Create strong RGB color splitting for a vibrant, maximalist, pop-art feel. This should look like a cheap, flawed lens.' }
  ],
};

const allPresets = Object.values(presetGroups).flat();

export const FilterPanel: React.FC<FilterPanelProps> = ({ onRequest, isLoading, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');
  const [isRefining, setIsRefining] = useState(false);

  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  const handleApply = () => {
    const parts = [];
    if (selectedPreset) parts.push(selectedPreset.prompt);
    if (userPrompt.trim()) parts.push(userPrompt.trim());
    
    if (parts.length > 0) {
      onRequest({ type: 'filters', prompt: parts.join('. '), useOriginal: false });
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
      {isLoading && <PanelScanner theme="cyan" />}
      
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-600 to-blue-900 flex items-center justify-center shadow-[0_0_10px_rgba(8,145,178,0.4)]">
                 <PaletteIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Visual Filters
                 </h3>
                 <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">
                   Stylistic Overlay Matrix
                 </p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Custom Prompt Input */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3 group focus-within:border-cyan-500/50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Custom Directive</label>
                  <div className="flex gap-2">
                    {userPrompt && <button onClick={() => setUserPrompt('')}><XIcon className="w-3 h-3 text-gray-600 hover:text-white" /></button>}
                    <button onClick={handleRefine} disabled={!userPrompt.trim() || isRefining} className="text-cyan-500 disabled:opacity-30"><SparklesIcon className={`w-3 h-3 ${isRefining ? 'animate-spin' : ''}`} /></button>
                  </div>
              </div>
              <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Add extra details (e.g., 'Make it look old')..."
                  className="w-full bg-transparent text-gray-300 text-xs font-mono focus:outline-none resize-none h-16 placeholder-gray-700"
              />
          </div>

          {/* Presets Grid */}
          <div className="space-y-4">
            {Object.entries(presetGroups).map(([groupName, presets]) => (
                <div key={groupName}>
                    <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2 px-1">{groupName}</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map(preset => (
                            <button 
                                key={preset.name} 
                                onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                                className={`relative p-3 text-left border rounded-sm transition-all duration-200 group overflow-hidden ${selectedPresetName === preset.name ? 'bg-cyan-950/30 border-cyan-500' : 'bg-[#111] border-[#222] hover:border-gray-600'}`}
                            >
                                {selectedPresetName === preset.name && <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className={`text-xs font-bold uppercase tracking-wide ${selectedPresetName === preset.name ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{preset.name}</div>
                                        {selectedPresetName === preset.name && <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_5px_#06b6d4]"></div>}
                                    </div>
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
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505]">
          <button
              onClick={handleApply}
              disabled={isActionDisabled}
              className="w-full h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Active State Background */}
              {!isActionDisabled && <div className="absolute inset-0 bg-cyan-900/20"></div>}
              
              <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                  <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-cyan-400 group-hover:text-white'}`}>
                      Apply Filter
                  </span>
                  {!isActionDisabled && <PaletteIcon className="w-4 h-4 text-cyan-400 group-hover:text-white skew-x-[-10deg]" />}
              </div>
          </button>
      </div>
    </div>
  );
};