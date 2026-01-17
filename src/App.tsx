
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect, useMemo, useContext } from 'react';
import { clearState, nukeDatabase, dataUrlToBlob } from './services/persistence';
import { AppContext } from './context/AppContext';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { FilterPanel } from './components/FilterPanel';
import { AdjustmentPanel } from './components/AdjustmentPanel';
import { TypographicPanel } from './components/TypographicPanel';
import { VectorArtPanel } from './components/VectorArtPanel';
import { FluxPanel } from './components/FluxPanel';
import { InpaintPanel } from './components/InpaintPanel';
import { StyleExtractorPanel } from './components/StyleExtractorPanel';
import { CompareSlider } from './components/CompareSlider';
import { ZoomPanViewer } from './components/ZoomPanViewer';
import { UndoIcon, RedoIcon, CompareIcon, XIcon, DownloadIcon, HistoryIcon, BoltIcon, PaletteIcon, SunIcon, EraserIcon, TypeIcon, VectorIcon, StyleExtractorIcon, TrashIcon, PlusIcon } from './components/icons';
import { SystemConfigWidget } from './components/SystemConfigWidget';
import { ImageUploadPlaceholder } from './components/ImageUploadPlaceholder';
import { StartScreen } from './components/StartScreen';
import * as geminiService from './services/geminiService';
import { PROTOCOLS, RoutedStyle } from './services/geminiService';
import { FastAiWidget } from './components/FastAiWidget';
import { HistoryGrid } from './components/HistoryGrid';
import { debugService } from './services/debugService';
import { DebugConsole } from './components/DebugConsole';
import { CameraCaptureModal } from './components/CameraCaptureModal';

export type ActiveTab = 'flux' | 'style_extractor' | 'filters' | 'adjust' | 'inpaint' | 'typography' | 'vector';

export interface HistoryItem {
    content: File | string;
    prompt?: string;
    type: 'upload' | 'generation' | 'edit' | 'transformation';
    timestamp: number;
}

export type GenerationRequest = {
    type: ActiveTab;
    prompt?: string;
    useOriginal?: boolean;
    forceNew?: boolean;
    aspectRatio?: string;
    isChaos?: boolean;
    batchSize?: number;
    batchIndex?: number;
    maskBase64?: string;
    systemInstructionOverride?: string;
    negativePrompt?: string; 
    denoisingInstruction?: string; 
};

export const App: React.FC = () => {
    const { isLoading, setIsLoading, isFastAiEnabled } = useContext(AppContext);
    const [appStarted, setAppStarted] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]); 
    const [historyIndex, setHistoryIndex] = useState(-1); 
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab | null>('flux');
    const [isComparing, setIsComparing] = useState(false);
    const [viewerInstruction, setViewerInstruction] = useState<string | null>(null);
    const [showHistoryGrid, setShowHistoryGrid] = useState(false);
    const [showDebugger, setShowDebugger] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
    const [fluxPrompt, setFluxPrompt] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        debugService.init();
        
        // Dynamic Viewport Height Fix for Mobile
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVh();
        window.addEventListener('resize', setVh);
        return () => window.removeEventListener('resize', setVh);
    }, []);

    const currentItem = useMemo(() => history[historyIndex], [history, historyIndex]);
    
    const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentItem) {
            const url = typeof currentItem.content === 'string' 
                ? currentItem.content 
                : URL.createObjectURL(currentItem.content);
            
            setCurrentMediaUrl(url);
            return () => { 
              if (typeof currentItem.content !== 'string' && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
              }
            };
        } else {
            setCurrentMediaUrl(null);
        }
    }, [currentItem]);

    const originalImageUrl = useMemo(() => {
        const item = history.find(h => h.type === 'upload');
        if (!item) return null;
        return typeof item.content === 'string' ? item.content : URL.createObjectURL(item.content);
    }, [history]);

    const handleImageUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const newItem: HistoryItem = { content: file, type: 'upload', timestamp: Date.now() };
            setHistory(prev => [...prev.slice(0, historyIndex + 1), newItem]);
            setHistoryIndex(prev => prev + 1);
            setAppStarted(true);
        } catch (e: any) {
            setError(`IO FAULT: ${e.message || 'Transmission aborted.'}`);
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, historyIndex]);

    const handleDownload = useCallback(async () => {
        if (!currentMediaUrl) return;
        setIsLoading(true);
        setViewerInstruction("COLLECTING PIXELS...");

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const ext = 'png';
            
            let blob: Blob;
            if (currentMediaUrl.startsWith('data:')) {
                blob = dataUrlToBlob(currentMediaUrl);
            } else {
                const response = await fetch(currentMediaUrl);
                blob = await response.blob();
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pixshop_${timestamp}.${ext}`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 1000);
            setViewerInstruction("EXPORT SUCCESS");
            setTimeout(() => setViewerInstruction(null), 2000);
        } catch (e: any) {
            setError(`EXPORT FAULT: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentMediaUrl, currentItem, setIsLoading]);

    const handleClearSession = useCallback(async () => { 
        setHistory([]);
        setHistoryIndex(-1);
        setIsComparing(false);
        await clearState().catch(console.error); 
    }, []);

    const handleTabSwitch = useCallback((tab: ActiveTab) => { 
        if (tab !== activeTab) {
            setPendingPrompt(null);
            setActiveTab(tab);
        }
    }, [activeTab]);

    const handleRouteStyle = useCallback((style: RoutedStyle) => {
        const panelMapping: Record<string, ActiveTab> = {
            'filter_panel': 'filters',
            'vector_art_panel': 'vector',
            'typographic_panel': 'typography',
            'flux': 'flux'
        };
        const targetTab = panelMapping[style.target_panel_id] || 'filters';
        setPendingPrompt(style.preset_data.prompt);
        setActiveTab(targetTab);
    }, []);

    const handleGenerationRequest = useCallback(async (req: GenerationRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            const source = (req.useOriginal ? history.find(h => h.type === 'upload')?.content : currentItem?.content) as File || (currentItem?.content as File);
            let result: string = '';

            switch(req.type) {
                case 'flux':
                    result = (req.forceNew || !source)
                        ? await geminiService.generateFluxTextToImage(req.prompt!, { aspectRatio: req.aspectRatio, isChaos: req.isChaos, systemInstructionOverride: req.systemInstructionOverride, negativePrompt: req.negativePrompt })
                        : await geminiService.generateFluxImage(source, req.prompt!, { aspectRatio: req.aspectRatio, isChaos: req.isChaos, systemInstructionOverride: req.systemInstructionOverride, negativePrompt: req.negativePrompt, denoisingInstruction: req.denoisingInstruction });
                    break;
                case 'filters':
                case 'adjust':
                    if (source) result = await geminiService.generateFilteredImage(source, req.prompt!, { aspectRatio: req.aspectRatio, systemInstructionOverride: req.systemInstructionOverride || PROTOCOLS.EDITOR, negativePrompt: req.negativePrompt, denoisingInstruction: req.denoisingInstruction });
                    break;
                case 'inpaint':
                    if (source) result = await geminiService.generateInpaintedImage(source, req.maskBase64 || '', req.prompt!, { systemInstructionOverride: req.systemInstructionOverride, negativePrompt: req.negativePrompt, denoisingInstruction: req.denoisingInstruction });
                    break;
                case 'typography':
                case 'vector':
                    result = (req.forceNew || !source) 
                        ? await geminiService.generateFluxTextToImage(req.prompt!, { aspectRatio: req.aspectRatio, systemInstructionOverride: req.systemInstructionOverride, negativePrompt: req.negativePrompt })
                        : await geminiService.generateFluxImage(source, req.prompt!, { aspectRatio: req.aspectRatio, systemInstructionOverride: req.systemInstructionOverride, negativePrompt: req.negativePrompt, denoisingInstruction: req.denoisingInstruction });
                    break;
            }

            if (result) {
                 const blob = dataUrlToBlob(result);
                 const file = new File([blob], `pix_${Date.now()}.png`, { type: 'image/png' });
                 const newItem: HistoryItem = { content: file, type: 'generation', timestamp: Date.now(), prompt: req.prompt };
                 setHistory(prev => [...prev.slice(0, historyIndex + 1), newItem]);
                 setHistoryIndex(prev => prev + 1);
            }
        } catch (e: any) {
            setError(e.message || "NEURAL PIPELINE CLOGGED.");
        } finally {
            setIsLoading(false);
        }
    }, [history, historyIndex, currentItem, setIsLoading]);

    const sidebarTabs = [
        { id: 'flux', icon: BoltIcon, label: 'FLUX' },
        { id: 'style_extractor', icon: StyleExtractorIcon, label: 'DNA' },
        { id: 'filters', icon: PaletteIcon, label: 'FX' },
        { id: 'adjust', icon: SunIcon, label: 'LIGHT' },
        { id: 'vector', icon: VectorIcon, label: 'SVG' },
        { id: 'typography', icon: TypeIcon, label: 'TYPE' },
        { id: 'inpaint', icon: EraserIcon, label: 'BUFF' },
    ];

    return (
        <div className="flex flex-col bg-black min-h-screen font-sans overflow-hidden items-center justify-center relative">
            {/* Global Grain/Noise */}
            <div className="grime-grain fixed inset-0 z-50 pointer-events-none"></div>
            
            {/* Main Application Container - Centers app on large screens */}
            <div className="w-full h-[100dvh] max-w-[1920px] bg-surface-deep text-zinc-100 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-zinc-900/50">
                {showDebugger && <DebugConsole onClose={() => setShowDebugger(false)} />}
                {showHistoryGrid && <HistoryGrid history={history} setHistoryIndex={(i) => { setHistoryIndex(i); setShowHistoryGrid(false); }} onClose={() => setShowHistoryGrid(false)} />}
                <CameraCaptureModal isOpen={showCamera} onClose={() => setShowCamera(false)} onCapture={handleImageUpload} />

                {!appStarted ? (
                    <StartScreen onStart={(tab) => { if (tab) setActiveTab(tab); setAppStarted(true); }} />
                ) : (
                    <>
                        <Header onGoHome={handleClearSession} isPlatinumTier={false} />
                        {/* LAYOUT CONTAINER */}
                        <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
                            
                            {/* TOOLBOX SIDECAR */}
                            <div className="w-full md:w-80 bg-surface-panel border-t md:border-t-0 md:border-r border-zinc-800 flex flex-col z-20 shrink-0 h-[40vh] md:h-auto shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden">
                                {/* Tab Bar */}
                                <div className="flex overflow-x-auto no-scrollbar border-b border-zinc-800/80 bg-surface-panel z-30 relative">
                                    {sidebarTabs.map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button 
                                                key={tab.id} 
                                                onClick={() => handleTabSwitch(tab.id as ActiveTab)} 
                                                className={`flex-1 min-w-[3.5rem] py-4 md:py-5 flex flex-col items-center border-b-2 transition-all duration-200 relative group ${
                                                    isActive 
                                                    ? 'border-white bg-zinc-800/50 text-white' 
                                                    : 'border-transparent hover:bg-zinc-800/30 text-zinc-500 hover:text-zinc-300'
                                                }`}
                                            >
                                                <div className="glow-pit"></div>
                                                <tab.icon className={`w-5 h-5 mb-1.5 transition-all duration-300 relative z-10 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]' : ''}`} />
                                                <span className={`text-[8px] font-black tracking-[0.2em] font-display relative z-10 transition-colors duration-300`}>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="flex-1 overflow-hidden relative bg-surface-panel">
                                    {activeTab === 'flux' && <FluxPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentMediaUrl} currentImageFile={currentItem?.content instanceof File ? currentItem.content : null} fluxPrompt={fluxPrompt} setFluxPrompt={setFluxPrompt} isFastAiEnabled={isFastAiEnabled} />}
                                    {activeTab === 'style_extractor' && <StyleExtractorPanel isLoading={isLoading} hasImage={!!currentMediaUrl} currentImageFile={currentItem?.content instanceof File ? currentItem.content : null} onRouteStyle={handleRouteStyle} isFastAiEnabled={isFastAiEnabled} />}
                                    {activeTab === 'filters' && <FilterPanel onRequest={handleGenerationRequest} isLoading={isLoading} setViewerInstruction={setViewerInstruction} isFastAiEnabled={isFastAiEnabled} hasImage={!!currentMediaUrl} currentImageFile={currentItem?.content instanceof File ? currentItem.content : null} initialPrompt={pendingPrompt || undefined} />}
                                    {activeTab === 'adjust' && <AdjustmentPanel onRequest={handleGenerationRequest} isLoading={isLoading} setViewerInstruction={setViewerInstruction} isFastAiEnabled={isFastAiEnabled} />}
                                    {activeTab === 'inpaint' && <InpaintPanel onApplyInpaint={(p) => handleGenerationRequest({ type: 'inpaint', prompt: p, useOriginal: false })} onClearMask={() => {}} isLoading={isLoading} hasImage={!!currentMediaUrl} />}
                                    {activeTab === 'vector' && <VectorArtPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentMediaUrl} currentImageFile={currentItem?.content instanceof File ? currentItem.content : null} setViewerInstruction={setViewerInstruction} initialPrompt={pendingPrompt || undefined} />}
                                    {activeTab === 'typography' && <TypographicPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentMediaUrl} setViewerInstruction={setViewerInstruction} initialPrompt={pendingPrompt || undefined} />}
                                </div>
                            </div>

                            {/* MAIN WORKSPACE */}
                            <div className="flex-1 relative bg-surface-deep overflow-hidden flex flex-col min-h-0">
                                {isLoading && (
                                    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl animate-fade-in transition-all duration-300 p-6">
                                        <Spinner />
                                        {viewerInstruction && (
                                            <div className="mt-8 text-white font-display text-xl animate-pulse tracking-[0.3em] uppercase font-black bg-black/50 px-6 py-2 border-l-4 border-primary backdrop-blur-md shadow-[0_0_20px_rgba(255,92,0,0.2)] text-center">
                                                {viewerInstruction}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {error && (
                                    <div className="absolute top-6 inset-x-6 z-40 bg-zinc-900 border border-red-500/50 text-white p-6 shadow-2xl flex justify-between items-center animate-fade-in skew-x-[-1deg]">
                                        <div className="flex items-center gap-5">
                                            <div className="w-4 h-4 bg-red-500 animate-pulse rounded-full"/> 
                                            <div>
                                                <p className="text-[11px] font-mono leading-tight uppercase tracking-widest text-red-500 font-black">System Fault</p>
                                                <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">{error}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setError(null)} className="p-2 hover:bg-red-500/20 text-zinc-500 hover:text-white transition-all"><XIcon className="w-5 h-5" /></button>
                                    </div>
                                )}
                                
                                {/* CANVAS */}
                                <div className="flex-1 relative overflow-hidden bg-black/40 w-full h-full shadow-inner">
                                    <div className="absolute inset-0 asphalt-grid opacity-30 pointer-events-none" />
                                    
                                    <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                                        {isComparing && originalImageUrl && currentMediaUrl ? (
                                            <CompareSlider originalImage={originalImageUrl} modifiedImage={currentMediaUrl} />
                                        ) : currentMediaUrl ? (
                                            <ZoomPanViewer src={currentMediaUrl} />
                                        ) : (
                                            <ImageUploadPlaceholder onImageUpload={handleImageUpload} />
                                        )}
                                    </div>
                                </div>
                                
                                {/* ACTION DOCK */}
                                <div className="bg-zinc-900/95 backdrop-blur-3xl border-t border-zinc-800 p-2 flex justify-between items-center shrink-0 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                                    <div className="flex gap-2">
                                        <button onClick={() => { if(window.confirm("Purge Latent Memory?")) handleClearSession(); }} className="p-3 text-zinc-400 hover:text-red-500 bg-black/20 border border-zinc-800 hover:border-red-500/40 transition-all group rounded-sm" title="Flush Memory">
                                            <TrashIcon className="w-5 h-5 group-hover:animate-bounce" />
                                        </button>
                                        <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-primary text-white font-black uppercase tracking-[0.1em] flex items-center gap-3 transition-all hover:bg-orange-600 skew-x-[-10deg] shadow-[2px_2px_0px_#27272a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                                            <PlusIcon className="w-5 h-5 transform skew-x-[10deg]" />
                                            <span className="text-[10px] hidden sm:inline transform skew-x-[10deg]">Inject Seed</span>
                                            <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ''; }} className="hidden" accept="image/*" />
                                        </button>
                                        <button onClick={() => setShowHistoryGrid(true)} className="p-3 text-zinc-400 hover:text-primary bg-black/20 border border-zinc-800 hover:border-primary/40 transition-all group rounded-sm" title="Open Evidence Locker">
                                            <HistoryIcon className="w-5 h-5 group-hover:rotate-12" />
                                        </button>
                                        <div className="w-[1px] h-8 bg-zinc-800 mx-1 self-center" />
                                        <button onClick={() => setHistoryIndex(Math.max(0, historyIndex - 1))} disabled={historyIndex <= 0} className="p-3 text-zinc-400 hover:text-white disabled:opacity-20 transition-all"><UndoIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setHistoryIndex(Math.min(history.length - 1, historyIndex + 1))} disabled={historyIndex >= history.length - 1} className="p-3 text-zinc-400 hover:text-white disabled:opacity-20 transition-all"><RedoIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex gap-2">
                                         {originalImageUrl && currentMediaUrl && (
                                             <button onClick={() => setIsComparing(!isComparing)} className={`p-3 border transition-all skew-x-[-10deg] ${isComparing ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(255,92,0,0.5)]' : 'bg-black/20 text-zinc-400 border-zinc-800 hover:text-primary'}`}>
                                                <CompareIcon className="w-5 h-5 transform skew-x-[10deg]" />
                                             </button>
                                         )}
                                         <button onClick={handleDownload} disabled={!currentMediaUrl} className="p-3 bg-black/20 text-zinc-400 hover:text-secondary border border-zinc-800 hover:border-secondary/40 transition-all" title="Export Asset">
                                            <DownloadIcon className="w-5 h-5" />
                                         </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                <SystemConfigWidget onSoftFix={() => window.location.reload()} onHardFix={() => { if(window.confirm("Buff System Cache?")) nukeDatabase().then(() => window.location.reload()); }} onOpenDebugger={() => setShowDebugger(true)} />
                <FastAiWidget />
            </div>
        </div>
    );
};
