/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { PanelScanner } from './Spinner';
import { GenerationRequest } from '../App';
import { VectorIcon, XIcon } from './icons';

interface VectorArtPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

const presetGroups = {
  "PROFESSIONAL": [
    { name: 'Logo & Flat Vector', description: 'Scalable, minimalist geometric design.', applyPrompt: 'Transform the MAIN SUBJECT into a professional flat vector logo: minimalist geometric shapes, clean crisp lines, solid flat colors, isolated on white. NO shadows, NO gradients, NO 3D.', genPrompt: 'Minimalist flat vector logo design of' },
    { name: 'Cleanline', description: 'Ultra-thin, pure black line art.', applyPrompt: 'Transform the MAIN SUBJECT into an ultra-minimalist, stroke-based, pure line-art vector. Use thin, perfect black outlines ONLY. Emphasize extreme negative space. NO fills, NO color, NO texture. The style should be elegant, with sharp mathematical contours, like a tattoo flash icon. Isolate on a plain white background.', genPrompt: 'Ultra-minimalist, stroke-based, pure line-art vector with thin perfect black outlines only, extreme negative space, no fills, no texture, tattoo flash icon style, isolated on a white background, of' },
    { name: 'Sticker Decal', description: 'Die-cut vinyl with white border.', applyPrompt: 'Transform the MAIN SUBJECT into a die-cut vinyl sticker: vibrant vector illustration, thick white contour border, subtle drop shadow, sticker aesthetic. Flat colors.', genPrompt: 'Die-cut vinyl sticker vector art with white border of' },
    { name: 'Architectural Digest', description: 'Elegant, precise architectural vector.', applyPrompt: 'Re-imagine the MAIN SUBJECT as a clean architectural vector illustration. Use sharp, precise lines and a palette of flat colors with very subtle gradients for depth. The style should be serene and elegant, reminiscent of a high-end travel poster or a feature in an architectural digest. Emphasize clean composition and a tranquil atmosphere. Isolate on a plain white background.', genPrompt: 'A clean architectural vector illustration with sharp precise lines, a palette of flat colors with subtle gradients for depth, serene and elegant, high-end travel poster style, tranquil atmosphere, isolated on a white background, of' },
    { name: 'Bauhausgeo', description: 'Constructivist geometric shapes.', applyPrompt: 'Reconstruct the MAIN SUBJECT as an abstract constructivist geometric portrait vector. The face must be built from overlapping circles, triangles, and rectangles. Use flat, bold, high-contrast colors. The style should be angular, mechanical, and cubist-inspired, a fusion of 1920s Russian avant-garde and modern flat design. Isolate on a plain white background.', genPrompt: 'An abstract constructivist geometric portrait vector, built from overlapping circles, triangles, and rectangles, using flat bold high-contrast colors, angular and mechanical, inspired by 1920s Russian avant-garde and modern flat design, isolated on a white background, of' },
    { name: 'Angularflat', description: 'Sharp, modern geometric planes.', applyPrompt: 'Create an angular, flat, modern geometric portrait vector of the MAIN SUBJECT. Use sharp, fragmented face planes, bright flat color blocks with subtle gradients, and stylized features. The style is contemporary, inspired by Instagram, NFT, and Memphis revival aesthetics. Isolate on a plain white background.', genPrompt: 'An angular flat modern geometric portrait vector with sharp fragmented face planes, bright flat color blocks with subtle gradients, and stylized features, in a contemporary Instagram/NFT/Memphis revival style, isolated on a white background, of' },
    { name: 'Geoduotone', description: 'Symmetrical two-tone silhouette.', applyPrompt: 'Transform the MAIN SUBJECT into an ultra-clean, minimalist, geometric duotone silhouette vector. The design must be a bold 2-color split-face outline with perfect symmetry and extreme negative space. The style is a modern icon, tattoo, or stencil. Isolate on a plain white background.', genPrompt: 'An ultra-clean minimalist geometric duotone silhouette vector, a bold 2-color split-face outline, with perfect symmetry and extreme negative space, modern icon/tattoo/stencil style, isolated on a white background, of' },
  ],
  "RETRO & POP": [
    { name: 'Pop Art Halftone', description: 'Comic dots, bold outlines.', applyPrompt: 'Transform the image into a Pop Art vector illustration. Use heavy black outlines, vibrant primary colors, and Ben-Day dot patterns for shading. The style should mimic Roy Lichtenstein or vintage comic books.', genPrompt: 'Pop Art vector illustration with heavy black outlines, vibrant primary colors, and Ben-Day dot patterns, vintage comic book style of' },
    { name: 'Memphis 90s', description: 'Squiggles, triangles, pastel neon.', applyPrompt: 'Recreate the subject in a Memphis Design vector style. Use scattered geometric shapes (squiggles, triangles, dots), a pastel and neon color palette, and flat composition. 1980s/90s energetic aesthetic.', genPrompt: 'Memphis Design vector art with scattered geometric shapes, squiggles, triangles, pastel and neon color palette, 1980s aesthetic of' },
    { name: 'Synthwave Vector', description: 'Neon grid, sunset gradients.', applyPrompt: 'Render as a Synthwave vector illustration. Use a dark background with a neon wireframe grid, a retro sun gradient, and a palette of cyan, magenta, and deep purple. 80s retro-futurist vibe.', genPrompt: 'Synthwave vector illustration, dark background, neon wireframe grid, retro sun gradient, cyan and magenta palette, 80s retro-futurist style of' },
    { name: 'Risograph Vector', description: 'Grainy, misaligned ink layers.', applyPrompt: 'Simulate a Risograph print in vector format. Use limited ink colors (pink, blue, yellow), visible grain texture, and slight misalignment (trapping) of color layers for a raw, printed look.', genPrompt: 'Risograph style vector illustration, limited ink colors, visible grain texture, slight misalignment of layers, raw printed look of' },
  ],
  "CRAFT & TACTILE": [
    { name: 'Papercut Layers', description: 'Deep depth, stacked paper.', applyPrompt: 'Transform the subject into a layered papercut vector illustration. Create depth using drop shadows between distinct layers of colored paper. Clean edges, no outlines, crafting aesthetic.', genPrompt: 'Layered papercut vector illustration, depth using drop shadows between distinct layers of colored paper, clean edges, crafting aesthetic of' },
    { name: 'Felt Patch', description: 'Fuzzy texture, stitched edges.', applyPrompt: 'Render the subject as a flat vector felt patch. Add a subtle fuzzy texture noise, bold stitching details around the edges, and simplified shapes.', genPrompt: 'Vector felt patch illustration, subtle fuzzy texture, bold stitching details around edges, simplified shapes of' },
    { name: 'Monoline Script', description: 'Continuous single-weight line.', applyPrompt: 'Redraw the subject using a single continuous line of consistent weight (monoline). Minimalist, fluid, and unbroken path. No fills, just the essential path.', genPrompt: 'Monoline vector art, single continuous line of consistent weight, minimalist fluid path, no fills, of' },
  ],
  "EXPRESSIVE": [
    { name: 'Graphic Novel Realism', description: 'High-fidelity comic book style.', applyPrompt: 'Transform the MAIN SUBJECT into a detailed graphic novel illustration. Use clean, bold black linework for definition and a cel-shaded color palette with limited gradients. The style should be reminiscent of a high-quality comic book, with a focus on realism and clear composition. Isolate on a plain white background.', genPrompt: 'A detailed graphic novel illustration with clean bold black linework and a cel-shaded color palette, high-quality comic book style, focused on realism and clear composition, isolated on a white background, of' },
    { name: 'Rage Vector', description: 'Chaotic, heavy impasto strokes.', applyPrompt: 'Transform the MAIN SUBJECT into a chaotic abstract expressionist portrait in a furious painterly vector style. Use explosive, thick, overlapping impasto brush strokes and wild, messy, layered aggression. The dominant palette must be deep black, burning fiery orange, electric cobalt blue, and creamy beige/off-white. Ensure visible bristle marks, splatters, drips, and heavy texture with high dramatic contrast and no clean lines, conveying brutal dynamic movement. Isolate on a plain white background.', genPrompt: 'A chaotic abstract expressionist portrait in a furious painterly vector style, with explosive thick overlapping impasto brush strokes, wild messy layered aggression, using a dominant palette of deep black, burning fiery orange, electric cobalt blue, and creamy beige/off-white, high dramatic contrast, no clean lines, isolated on a white background, of' },
    { name: 'Naive Hand-Drawn', description: 'Wobbly lines, imperfect charm.', applyPrompt: 'Transform the MAIN SUBJECT into naive hand-drawn vector illustration with wobbly lines and imperfect shapes.', genPrompt: 'Naive hand-drawn imperfect vector illustration of' },
    { name: 'Doodle Chaos Playful', description: 'Energetic, scattered scribbles.', applyPrompt: 'Transform the SUBJECT into a collage of playful, chaotic doodle vectors.', genPrompt: 'Playful doodle chaos vector art of' },
    { name: 'Imperfect Brush Stroke', description: 'Organic, tactile brush textures.', applyPrompt: 'Apply an imperfect, organic brush stroke vector style to the SUBJECT, showing texture and human touch.', genPrompt: 'Imperfect brush stroke tactile vector of' },
    { name: 'Organic Flow Nature', description: 'Fluid, nature-inspired curves.', applyPrompt: 'Render the MAIN SUBJECT in an organic flow, nature-inspired vector style with fluid, biophilic curves.', genPrompt: 'Organic flow nature-inspired vector art of' },
    { name: 'Wobbly Childlike Charm', description: 'Shaky, sincere, naive warmth.', applyPrompt: 'Render the SUBJECT with a wobbly, childlike charm vector style, using shaky lines and imperfect fills.', genPrompt: 'Wobbly childlike charm vector art of' },
  ],
  "GEOMETRIC": [
    { name: 'Chunkpixel', description: 'Retro 8-bit/16-bit pixel art.', applyPrompt: 'Re-render the MAIN SUBJECT as chunky, deliberate true vector pixel art. Use large, perfect square blocks and hard edges. Adhere to a limited 8-32 color retro palette. Curves must be stair-stepped. The aesthetic is nostalgic 8-bit/16-bit NES/SNES arcade vibe, but infinitely scalable with NO blur. Isolate on a plain white background.', genPrompt: 'Chunky deliberate true vector pixel art with large perfect square blocks, hard edges, a limited 8-32 color retro palette, and stair-step curves, in a nostalgic 8-bit 16-bit NES SNES arcade vibe, infinitely scalable with no blur, isolated on a white background, of' },
    { name: 'Isofold', description: 'Faux-3D layered origami.', applyPrompt: 'Re-imagine the MAIN SUBJECT as an isometric faux-3D layered paper geometric vector. It should have the illusion of folded origami, with clean sharp edges, subtle depth shadows, and a minimalist white, black, and limited color palette. The style is modern and premium, like a logo. Isolate on a plain white background.', genPrompt: 'Isometric faux-3D layered paper geometric vector with a folded origami illusion, clean sharp edges, subtle depth shadows, and a minimalist white/black limited palette, in a modern premium logo style, isolated on a white background, of' },
    { name: 'Chunkisometric', description: 'Bold, tech-inspired 3D emblem.', applyPrompt: 'Convert the MAIN SUBJECT into a bold, chunky, isometric 3D-shaded geometric letter emblem vector. Use bright contrasting colors, internal circuit-board patterns, and strong volume depth shading for a modern tech logo vibe. Isolate on a plain white background.', genPrompt: 'A bold, chunky, isometric 3D-shaded geometric letter emblem vector with bright contrasting colors, circuit-board internal patterns, and volume depth shading, in a modern tech logo vibe, isolated on a white background, of' },
    { name: 'Lo-Fi Low Poly Revival', description: 'Nostalgic, faceted low-poly.', applyPrompt: 'Reconstruct the MAIN SUBJECT in a lo-fi low poly vector style. The form should be defined by faceted, geometric triangles, but with added nostalgic grit, texture, and flattened, non-photorealistic lighting for a modern retro feel.', genPrompt: 'Lo-fi low poly revival vector illustration, faceted geometric triangles with nostalgic grit and texture, flattened lighting, of' },
    { name: 'Low Poly Grain Imperfect', description: 'Gritty, organic triangular mesh.', applyPrompt: 'Transform the MAIN SUBJECT into a low-poly vector illustration, defined by a triangular mesh. Introduce tactile grain, noise, and uneven, human-like shading to give it an imperfect, organic feel.', genPrompt: 'Imperfect grain low poly vector art with a triangular mesh, tactile grain, noise, and organic shading, of' },
    { name: 'Flat-3D Hybrid', description: '2D shapes with depth elements.', applyPrompt: 'Transform the MAIN SUBJECT into a flat-3D hybrid vector illustration. Blend clean, flat 2D shapes with subtle 3D depth elements like shadows, gradients, and extrusions for a modern, layered look.', genPrompt: 'Flat-3D hybrid depth vector illustration, blending clean 2D shapes with subtle 3D depth elements, of' },
  ],
  "TECHNICAL": [
    { name: 'Blueprint Schematic', description: 'White lines, blue grid.', applyPrompt: 'Render the subject as a technical blueprint vector. Use thin white lines on a classic blueprint blue background. Include measurement markings, grid lines, and technical annotations.', genPrompt: 'Technical blueprint vector illustration, white lines on blue background, measurement markings and grid lines, schematic style of' },
    { name: 'Infographic Flat', description: 'Clean data visualization style.', applyPrompt: 'Transform the subject into a clean infographic vector style. Use flat colors, simplified icons, rounded corners, and a corporate Memphis aesthetic. Very clean and readable.', genPrompt: 'Clean infographic vector style illustration, flat colors, simplified icons, rounded corners, corporate Memphis aesthetic of' },
  ],
  "VINTAGE": [
    { name: 'Engravevint', description: '1800s steel-etching style.', applyPrompt: 'Render the MAIN SUBJECT as a vintage engraved steel-etching vector portrait. Use ultra-fine parallel cross-hatching lines and high-density black linework for shading. The aesthetic should be 1800s newspaper, patent, or whiskey label retro. Isolate on a plain white background.', genPrompt: 'A vintage engraved steel-etching vector portrait with ultra-fine parallel cross-hatching lines, high-density black linework shading, in an 1800s newspaper/patent/whiskey label retro aesthetic, isolated on a white background, of' },
    { name: 'Vintagedist', description: 'Distressed, high-contrast poster.', applyPrompt: 'Design the MAIN SUBJECT as a vintage distressed negative-space vector poster. It must be a bold, solid black silhouette on a plain white background, with fake wear, tear, and grunge texture applied to the silhouette. Create dramatic high contrast for a retro propaganda or movie lobby card feel.', genPrompt: 'A vintage distressed negative-space vector poster, a bold solid black silhouette with fake wear, tear, and grunge texture, dramatic high contrast, retro propaganda/movie lobby card feel, isolated on a white background, of' },
    { name: 'Textured Grain Tactile', description: 'Scanned texture, emotional depth.', applyPrompt: 'Apply a tactile vector style to the MAIN SUBJECT, with subtle grit and scanned textures for emotional depth.', genPrompt: 'Textured grain tactile vector art with subtle imperfections of' },
    { name: 'Linocut Print Rough', description: 'Bold, carved block print.', applyPrompt: 'Simulate a rough, carved linocut print vector style on the SUBJECT, with bold high-contrast cuts.', genPrompt: 'Rough linocut print revival vector of' },
    { name: 'Mixed Media Collage', description: 'Layered paper and fabric.', applyPrompt: 'Render the MAIN SUBJECT as a mixed media collage vector illustration, using layered tactile paper and fabric elements. The subject MUST be isolated on a plain white background.', genPrompt: 'Mixed media collage vector illustration of a subject, using layered tactile paper and fabric elements, isolated on a plain white background:' },
  ],
  "PATTERN": [
    { name: 'Mandaline', description: 'Intricate, symmetrical mandala.', applyPrompt: 'Transform the MAIN SUBJECT into a highly detailed, ornamental, symmetrical mandala vector. The design must feature intricate concentric layered fine linework and nested geometric sacred patterns with ultra-precise intersecting paths. Render in classic black on a plain white background for an ancient-modern fusion.', genPrompt: 'A highly detailed ornamental symmetrical mandala vector with intricate concentric layered fine linework, nested geometric sacred patterns, ultra-precise intersecting paths, classic black on a plain white background, ancient-modern fusion, of' },
    { name: 'Bandana Paisley', description: 'Classic paisley line details.', applyPrompt: 'Transform the MAIN SUBJECT into a vector illustration with a classic Bandana Paisley pattern style. The subject MUST be isolated on a plain white background.', genPrompt: 'Vector art illustration of a subject with intricate bandana paisley details, isolated on a plain white background:' },
    { name: 'Maximal Minimal Bold', description: 'High contrast, negative space.', applyPrompt: 'Apply a maximal-minimal bold vector style to the SUBJECT, using high contrast and strategic negative space.', genPrompt: 'Maximum minimal bold vector illustration of' },
  ],
  "BOLD": [
    { name: 'Crimson Tear Propaganda', description: 'Fierce, stylized propaganda.', applyPrompt: 'Transform the MAIN SUBJECT into a bold vector portrait in a vintage propaganda poster style. The subject should look fierce, with heavy crimson red makeup that flows artistically down their face. Use a stark, dramatic contrast against a black background, with flat design, sharp edges, and minimal shading for high impact.', genPrompt: 'bold vector portrait of a fierce subject, heavy crimson red makeup that flows artistically down their face, stark black background, dramatic contrast, vintage propaganda poster style, flat design, sharp edges, minimal shading, high impact, cinematic lighting' },
    { name: 'X21 Rayauthe Directive', description: 'Retro-futurist dystopian sci-fi.', applyPrompt: 'Transform the MAIN SUBJECT into a retro-futurist propaganda poster with a 1970s sci-fi dystopian aesthetic. The subject should appear serious, rendered in black with glowing red-orange highlights. Use a flat vector art style with high contrast and a powerful, constructivist-influenced composition.', genPrompt: 'retro-futurist propaganda poster of a serious subject in black with glowing red-orange highlights, 1970s sci-fi dystopian aesthetic, flat vector art, high contrast, constructivist influence, powerful composition' },
  ]
};

const allPresets = Object.values(presetGroups).flat();

export const VectorArtPanel: React.FC<VectorArtPanelProps> = ({ onRequest, isLoading, hasImage, setViewerInstruction }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  const selectedPreset = useMemo(() => allPresets.find(p => p.name === selectedPresetName), [selectedPresetName]);

  const handleAction = (forceNew: boolean) => {
      let promptBuilder = '';
      
      if (selectedPreset) {
          // If creating new image, use genPrompt if available (optimized for creation)
          // otherwise fallback to applyPrompt (optimized for transformation)
          if (forceNew && (selectedPreset as any).genPrompt) {
              promptBuilder = (selectedPreset as any).genPrompt;
          } else {
              promptBuilder = selectedPreset.applyPrompt;
          }
      }
      
      if (userPrompt.trim()) {
          if (promptBuilder) {
             // Add space if the preset prompt doesn't end with a delimiter that implies separation is needed
             // Most genPrompts end with "of", so "of" + " " + "cat" is correct.
             promptBuilder = `${promptBuilder.trim()} ${userPrompt.trim()}`;
          } else {
             promptBuilder = userPrompt.trim();
          }
      }
      
      if (promptBuilder) {
          onRequest({ type: 'vector', prompt: promptBuilder, forceNew: forceNew && !hasImage, useOriginal: hasImage });
      }
  };

  const isActionDisabled = isLoading || (!selectedPreset && !userPrompt.trim());

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {isLoading && <PanelScanner theme="indigo" />}

      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-blue-900 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                 <VectorIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Vector Lab
                 </h3>
                 <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">
                   SVG Approximation
                 </p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Custom Input */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3 group focus-within:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Subject / Detail</label>
                  {userPrompt && <button onClick={() => setUserPrompt('')}><XIcon className="w-3 h-3 text-gray-600 hover:text-white" /></button>}
              </div>
              <textarea 
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={hasImage ? "Add details (e.g., 'Make it blue')..." : "Describe subject (e.g. 'A red fox')..."}
                  className="w-full bg-transparent text-gray-300 text-xs font-mono focus:outline-none resize-none h-16 placeholder-gray-700"
              />
          </div>

          <div className="space-y-4">
            {Object.entries(presetGroups).map(([groupName, presets]) => (
                <div key={groupName}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                        <h4 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{groupName}</h4>
                        <div className="h-[1px] bg-[#222] flex-1"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map(preset => (
                            <button 
                                key={preset.name} 
                                onClick={() => setSelectedPresetName(preset.name === selectedPresetName ? '' : preset.name)}
                                className={`p-3 text-left border rounded-sm transition-all duration-200 group relative ${selectedPresetName === preset.name ? 'bg-indigo-950/30 border-indigo-500' : 'bg-[#111] border-[#222] hover:border-indigo-900'}`}
                            >
                                <div className="text-xs font-bold uppercase tracking-wide mb-1 transition-colors group-hover:text-indigo-200 text-gray-300">{preset.name}</div>
                                <div className="text-[9px] text-gray-600 leading-tight">{preset.description}</div>
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
              onClick={() => handleAction(!hasImage)}
              disabled={isActionDisabled}
              className="w-full h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {!isActionDisabled && <div className="absolute inset-0 bg-indigo-900/20"></div>}
              
              <div className="relative z-10 flex items-center justify-center gap-2 h-full">
                  <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-indigo-400 group-hover:text-white'}`}>
                      {hasImage ? 'Vectorize Image' : 'Generate Vector'}
                  </span>
                  {!isActionDisabled && <VectorIcon className="w-4 h-4 text-indigo-400 group-hover:text-white skew-x-[-10deg]" />}
              </div>
          </button>
      </div>
    </div>
  );
};