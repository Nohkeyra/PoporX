/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoltIcon, PlayIcon, InfinityIcon, ShieldOffIcon, ZapIcon, SparklesIcon } from './icons';
import { GenerationRequest } from '../App';
import { refineImagePrompt } from '../services/geminiService';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const loadingMessages = [
  "Connecting to rendering farm...",
  "Allocating GPU resources...",
  "Parsing motion vectors...",
  "Initializing neural sequence...",
  "Synthesizing frames...",
  "Encoding final stream..."
];

interface VideoPanelProps {
  onRequest: (request: GenerationRequest) => void;
  isLoading: boolean;
  hasImage: boolean;
  setViewerInstruction: (text: string | null) => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ 
  onRequest, 
  isLoading,
  hasImage,
  setViewerInstruction
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoFps, setVideoFps] = useState(30);
  const [motionStrength, setMotionStrength] = useState(0.8);
  const [isRefining, setIsRefining] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const timerRef = useRef<number>();
  const messageIntervalRef = useRef<number>();
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setViewerInstruction("DESCRIBE THE MOTION SEQUENCE");
    return () => setViewerInstruction(null);
  }, [setViewerInstruction]);

  useEffect(() => {
    if (isLoading) {
      setElapsedTime(0);
      let messageIndex = 0;
      timerRef.current = window.setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      messageIntervalRef.current = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[messageIndex]);
      }, 4000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [isLoading]);

  const handleRefine = useCallback(async () => {
    if (!prompt.trim() || isRefining) return;
    setIsRefining(true);
    try {
      const refined = await refineImagePrompt(prompt);
      setPrompt(refined);
      promptTextareaRef.current?.focus();
    } catch (e) {
      console.error("Refinement failed", e);
    } finally {
      setIsRefining(false);
    }
  }, [prompt, isRefining]);

  const handleGenerateVideo = useCallback(() => {
    if (hasImage && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    if (prompt.trim()) {
      onRequest({
        type: 'video_animation',
        prompt: prompt.trim(),
        forceNew: !hasImage,
        aspectRatio: aspectRatio
      });
      setShowConfirmation(false);
    }
  }, [prompt, hasImage, showConfirmation, onRequest, aspectRatio]);

  const isActionDisabled = isLoading || !prompt.trim();

  return (
    <div className="flex flex-col h-full relative bg-[#050505] overflow-hidden">
      {showConfirmation && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111] border border-red-500/30 p-6 max-w-md w-full rounded shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <h3 className="text-xl font-bold text-white mb-3 font-display italic uppercase">Animate Image?</h3>
            <p className="text-gray-400 mb-6 text-sm font-mono">
              Use your current visual as the seed for this animation sequence.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmation(false)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded font-mono text-xs uppercase hover:bg-gray-700">Cancel</button>
              <button onClick={handleGenerateVideo} className="flex-1 py-3 bg-red-600 text-white rounded font-mono text-xs uppercase hover:bg-red-500">Animate</button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4"></div>
          <p className="text-red-500 font-bold uppercase tracking-widest text-sm" style={{fontFamily: 'Koulen'}}>Neural Motion Synthesis</p>
          <p className="text-gray-500 text-[10px] mt-2 font-mono h-4">{currentLoadingMessage}</p>
          <p className="text-xl font-mono text-white mt-4">{formatTime(elapsedTime)}</p>
        </div>
      )}

      {/* Header */}
       <div className="p-5 border-b border-white/5 bg-[#050505] relative z-10">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-rose-900 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                 <PlayIcon className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none" style={{fontFamily: 'Koulen'}}>
                   Neural Motion
                 </h3>
                 <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase">
                   VEO Synthesis Engine
                 </p>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {/* Terminal Input */}
         <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-[#0A0A0A] border border-[#222] rounded-lg overflow-hidden group-focus-within:border-red-500/50 transition-colors">
                 <div className="bg-[#111] px-3 py-1.5 border-b border-[#222] flex justify-between items-center">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Motion_Script</span>
                     <button 
                        onClick={handleRefine} 
                        disabled={isLoading || isRefining || !prompt.trim()} 
                        className="text-[9px] text-gray-400 hover:text-white font-mono uppercase flex items-center gap-1 transition-colors"
                     >
                        {isRefining ? 'Refining...' : 'AI Refine'}
                     </button>
                 </div>
                 <textarea
                    ref={promptTextareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={2000}
                    placeholder="Describe the action sequence (e.g., 'Camera pans right as subject smiles')..."
                    className="w-full bg-transparent text-gray-200 p-3 focus:outline-none text-sm font-mono leading-relaxed resize-none h-32 custom-scrollbar placeholder-gray-700"
                 />
            </div>
         </div>

         {/* Controls */}
         <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Dimensions</span>
            </div>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#111] border border-[#333] text-white text-xs font-mono p-2 rounded focus:border-red-500 outline-none"
            >
              <option value="16:9">16:9 (Cinematic)</option>
              <option value="9:16">9:16 (Vertical)</option>
            </select>
         </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1A1A1A] bg-[#050505]">
         <button
          onClick={handleGenerateVideo}
          disabled={isActionDisabled}
          className="w-full h-12 relative overflow-hidden group rounded-sm bg-[#111] border border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {!isActionDisabled && <div className="absolute inset-0 bg-red-900/20"></div>}
          
          <div className="relative z-10 flex items-center justify-center gap-2 h-full">
              <span className={`font-black italic uppercase tracking-widest text-sm skew-x-[-10deg] ${isActionDisabled ? 'text-gray-500' : 'text-red-400 group-hover:text-white'}`}>
                  {hasImage ? 'Animate Visual' : 'Generate Motion'}
              </span>
              {!isActionDisabled && <PlayIcon className="w-4 h-4 text-red-400 group-hover:text-white skew-x-[-10deg]" />}
          </div>
        </button>
      </div>
    </div>
  );
};