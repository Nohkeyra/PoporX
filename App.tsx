/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect, useMemo, useContext } from 'react';
import { clearState } from './services/persistence';
import { AppContext } from './context/AppContext';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { FilterPanel } from './components/FilterPanel';
import { AdjustmentPanel } from './components/AdjustmentPanel';
import TypographicPanel from './components/TypographicPanel';
import { VectorArtPanel } from './components/VectorArtPanel';
import { FluxPanel } from './components/FluxPanel';
import { InpaintPanel } from './components/InpaintPanel';
import { StyleExtractorPanel } from './components/StyleExtractorPanel';
import { CompareSlider } from './components/CompareSlider';
import { ZoomPanViewer } from './components/ZoomPanViewer';
import { UndoIcon, RedoIcon, CompareIcon, XIcon, MagicWandIcon, PaletteIcon, SunIcon, EraserIcon, TypeIcon, VectorIcon, DownloadIcon, StyleExtractorIcon } from './components/icons';
import { SystemConfigWidget } from './components/SystemConfigWidget';
import { ImageUploadPlaceholder } from './components/ImageUploadPlaceholder';
import { StartScreen } from './components/StartScreen';
import * as geminiService from './services/geminiService';

export type ActiveTab = 'flux' | 'style_extractor' | 'filters' | 'adjust' | 'inpaint' | 'typography' | 'vector';

export type GenerationRequest = {
    type: ActiveTab;
    prompt?: string;
    useOriginal?: boolean;
    forceNew?: boolean;
    aspectRatio?: string;
    isChaos?: boolean;
    batchSize?: number;
    maskBase64?: string;
};

export const App: React.FC = () => {
    const { isLoading, setIsLoading } = useContext(AppContext);
    const [appStarted, setAppStarted] = useState(false);
    const [history, setHistory] = useState<(File | string)[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab | null>('flux');
    const [isComparing, setIsComparing] = useState(false);
    const [viewerInstruction, setViewerInstruction] = useState<string | null>(null);
    
    const [fluxPrompt, setFluxPrompt] = useState('');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);

    const currentImageFile = useMemo(() => {
        const item = history[historyIndex];
        return item instanceof File ? item : null;
    }, [history, historyIndex]);
    
    const currentMediaUrl = useMemo(() => {
        const item = history[historyIndex];
        if (!item) return null;
        if (typeof item === 'string') return item;
        return URL.createObjectURL(item);
    }, [history, historyIndex]);

    const originalImageUrl = useMemo(() => {
        const item = history[0];
        if (!item) return null;
        if (typeof item === 'string') return item;
        return URL.createObjectURL(item);
    }, [history]);

    // Removed useEffect for loadState() to ensure fresh start on reload

    const handleImageUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            setHistory([file]);
            setHistoryIndex(0);
            setAppStarted(true);
        } catch (e: any) {
            setError(`Upload error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading]);

    const handleDownload = useCallback(() => {
        if (!currentMediaUrl) return;
        
        const link = document.createElement('a');
        link.href = currentMediaUrl;
        
        // Determine extension
        let extension = 'png';
        if (currentImageFile?.type?.includes('video') || currentMediaUrl.startsWith('blob:') && currentImageFile?.name?.match(/\.(mp4|webm)$/i)) {
             extension = 'mp4'; 
        } else if (typeof history[historyIndex] === 'string' && (history[historyIndex] as string).startsWith('data:image/jpeg')) {
             extension = 'jpg';
        }

        link.download = `pixshop-edit-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [currentMediaUrl, currentImageFile, history, historyIndex]);

    const handleClearSession = useCallback(() => {
        setHistory([]);
        setHistoryIndex(-1);
        setPreviewImageUrl(null);
        setIsComparing(false);
        clearState().catch(console.error);
    }, []);

    const handleTabSwitch = useCallback((tab: ActiveTab) => {
        // Clear image in upload field when selecting other tools tab
        if (tab !== activeTab) {
            setHistory([]);
            setHistoryIndex(-1);
            setPreviewImageUrl(null);
            setIsComparing(false);
            clearState().catch(console.error);
            setActiveTab(tab);
        }
    }, [activeTab]);

    const handleGenerationRequest = async (req: GenerationRequest) => {
        // Ensure API Key is selected - Safe Check
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            try {
                if (typeof aistudio.hasSelectedApiKey === 'function' && typeof aistudio.openSelectKey === 'function') {
                    const hasKey = await aistudio.hasSelectedApiKey();
                    if (!hasKey) {
                        await aistudio.openSelectKey();
                    }
                }
            } catch (err) {
                console.warn("API Key check warning:", err);
            }
        }

        setIsLoading(true);
        setError(null);
        setPreviewImageUrl(null);
        try {
            const source = (req.useOriginal ? history[0] : currentImageFile) as File || currentImageFile;
            let result: string = '';

            switch(req.type) {
                case 'flux':
                    result = (req.forceNew || !source)
                        ? await geminiService.generateFluxTextToImage(req.prompt!, req.aspectRatio, req.isChaos)
                        : await geminiService.generateFluxImage(source, req.prompt!, req.aspectRatio, req.isChaos);
                    break;
                case 'filters':
                    if (source) result = await geminiService.generateFilteredImage(source, req.prompt!, req.aspectRatio);
                    break;
                case 'inpaint':
                    if (source && req.maskBase64) result = await geminiService.generateInpaintedImage(source, req.maskBase64, req.prompt!);
                    break;
                case 'typography':
                    result = (req.forceNew || !source) 
                        ? await geminiService.generateFluxTextToImage(req.prompt!, req.aspectRatio, false)
                        : await geminiService.generateFluxImage(source, req.prompt!, req.aspectRatio, false);
                    break;
                case 'vector':
                    result = (req.forceNew || !source) 
                        ? await geminiService.generateFluxTextToImage(req.prompt!, req.aspectRatio, false)
                        : await geminiService.generateFluxImage(source, req.prompt!, req.aspectRatio, false);
                    break;
                default:
                    if (source) {
                        result = await geminiService.generateFilteredImage(source, req.prompt!, req.aspectRatio);
                    }
            }

            if (result) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(result);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        } catch (e: any) {
            const errorMessage = e.message || String(e);
            console.error("Generation failed:", e);
            
            if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404") || errorMessage.includes("API key")) {
                setError("API Key Error: Please re-select your API key.");
                const aistudio = (window as any).aistudio;
                if (aistudio && typeof aistudio.openSelectKey === 'function') {
                    await aistudio.openSelectKey();
                }
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndo = () => setHistoryIndex(prev => Math.max(0, prev - 1));
    const handleRedo = () => setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));

    const handleGoHome = () => {
        if (window.confirm('Terminate current session? All unsaved visual DNA will be purged.')) {
            clearState();
            setHistory([]);
            setHistoryIndex(-1);
            setAppStarted(false);
            setPreviewImageUrl(null);
            setFluxPrompt('');
        }
    };

    const toolPanels = useMemo(() => [
        { id: 'flux', title: 'Flux', icon: MagicWandIcon, component: <FluxPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentImageFile} currentImageFile={currentImageFile} setViewerInstruction={setViewerInstruction} fluxPrompt={fluxPrompt} setFluxPrompt={setFluxPrompt} setPreviewImageUrl={setPreviewImageUrl} /> },
        { id: 'style_extractor', title: 'Style', icon: StyleExtractorIcon, component: <StyleExtractorPanel isLoading={isLoading} hasImage={!!currentImageFile} currentImageFile={currentImageFile} onSendToFlux={(p) => { setFluxPrompt(p); handleTabSwitch('flux'); }} /> },
        { id: 'filters', title: 'Filters', icon: PaletteIcon, component: <FilterPanel onRequest={handleGenerationRequest} isLoading={isLoading} setViewerInstruction={setViewerInstruction} /> },
        { id: 'adjust', title: 'Adjust', icon: SunIcon, component: <AdjustmentPanel onRequest={handleGenerationRequest} isLoading={isLoading} setViewerInstruction={setViewerInstruction} /> },
        { id: 'inpaint', title: 'Inpaint', icon: EraserIcon, component: <InpaintPanel onApplyInpaint={(p) => handleGenerationRequest({ type: 'inpaint', prompt: p, maskBase64: maskCanvasRef.current?.toDataURL() })} isLoading={isLoading} hasImage={!!currentImageFile} brushSize={brushSize} setBrushSize={setBrushSize} onClearMask={() => { const ctx = maskCanvasRef.current?.getContext('2d'); ctx?.clearRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height); }} /> },
        { id: 'typography', title: 'Typography', icon: TypeIcon, component: <TypographicPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentImageFile} setViewerInstruction={setViewerInstruction} /> },
        { id: 'vector', title: 'Vector', icon: VectorIcon, component: <VectorArtPanel onRequest={handleGenerationRequest} isLoading={isLoading} hasImage={!!currentImageFile} setViewerInstruction={setViewerInstruction} /> },
    ], [isLoading, currentImageFile, fluxPrompt, brushSize, handleGenerationRequest, handleTabSwitch]);

    return (
        <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden font-sans select-none">
            {!appStarted ? (
                <StartScreen onStart={(tab) => { 
                    setAppStarted(true); 
                    if (tab) setActiveTab(tab as ActiveTab); 
                }} />
            ) : (
                <>
                    <Header isPlatinumTier={true} onGoHome={handleGoHome} />
                    <main className="flex-1 flex flex-col relative overflow-hidden bg-[#030303]">
                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
                                <Spinner />
                            </div>
                        )}
                        
                        {/* Viewer Section */}
                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            {previewImageUrl && !isLoading ? (
                                <ZoomPanViewer src={previewImageUrl} />
                            ) : currentMediaUrl ? (
                                <>
                                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                                        <button 
                                            onClick={handleUndo} 
                                            disabled={historyIndex <= 0} 
                                            className="p-3 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl active:scale-90 disabled:opacity-20 transition-all hover:bg-black/80"
                                            aria-label="Undo"
                                        >
                                            <UndoIcon className="w-5 h-5"/>
                                        </button>
                                        <button 
                                            onClick={handleRedo} 
                                            disabled={historyIndex >= history.length - 1} 
                                            className="p-3 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl active:scale-90 disabled:opacity-20 transition-all hover:bg-black/80"
                                            aria-label="Redo"
                                        >
                                            <RedoIcon className="w-5 h-5"/>
                                        </button>
                                        <div className="w-[1px] h-10 bg-white/10 mx-1" />
                                        <button 
                                            onClick={() => setIsComparing(!isComparing)} 
                                            className={`p-3 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl active:scale-90 transition-all ${isComparing ? 'text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(248,19,13,0.3)]' : 'hover:bg-black/80'}`}
                                            aria-label="Compare original and current"
                                        >
                                            <CompareIcon className="w-5 h-5"/>
                                        </button>
                                        <div className="w-[1px] h-10 bg-white/10 mx-1" />
                                        <button 
                                            onClick={handleClearSession}
                                            className="p-3 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl active:scale-90 transition-all hover:bg-red-600/20 hover:border-red-500/50 text-gray-400 hover:text-red-500 shadow-xl"
                                            title="Clear Image"
                                            aria-label="Clear current image"
                                        >
                                            <XIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 relative">
                                        {isComparing && originalImageUrl ? (
                                            <CompareSlider originalImage={originalImageUrl} modifiedImage={currentMediaUrl} />
                                        ) : (
                                            <ZoomPanViewer src={currentMediaUrl} mimeType={currentImageFile?.type}>
                                                {activeTab === 'inpaint' && (
                                                    <canvas 
                                                        ref={maskCanvasRef} 
                                                        className="absolute inset-0 w-full h-full cursor-crosshair opacity-50 mix-blend-screen touch-none" 
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onTouchStart={(e) => e.stopPropagation()}
                                                    />
                                                )}
                                            </ZoomPanViewer>
                                        )}
                                    </div>

                                    {viewerInstruction && !isComparing && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-mono font-bold text-gray-300 whitespace-nowrap animate-fade-in shadow-2xl tracking-[0.2em] uppercase">
                                            {viewerInstruction}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <ImageUploadPlaceholder onImageUpload={handleImageUpload} />
                            )}
                        </div>

                        {/* Control Panel Section */}
                        {activeTab && (
                            <div className="h-[42%] md:h-[35%] border-t border-white/10 bg-[#060606] overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative">
                                {toolPanels.find(p => p.id === activeTab)?.component}
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <nav className="flex items-center gap-1.5 p-3 bg-black border-t border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                            <button
                                onClick={handleDownload}
                                disabled={!currentMediaUrl}
                                className="p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition-all flex-shrink-0 group shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download Result"
                            >
                                <DownloadIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                            </button>
                            
                            <div className="h-10 w-[2px] bg-white/5 mx-2 flex-shrink-0" />
                            
                            {toolPanels.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleTabSwitch(tool.id as ActiveTab)}
                                    className={`flex flex-col items-center justify-center p-3 min-w-[84px] rounded-xl transition-all active:scale-95 relative group ${activeTab === tool.id ? 'bg-red-600/10 text-red-500' : 'text-gray-500 hover:bg-white/5'}`}
                                >
                                    <tool.icon className={`w-6 h-6 mb-1.5 transition-all ${activeTab === tool.id ? 'text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(248,19,13,0.5)]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{tool.title}</span>
                                    {activeTab === tool.id && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full shadow-[0_0_10px_#F8130D]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </main>
                    
                    {error && (
                        <div className="fixed bottom-28 left-4 right-4 bg-red-950/90 backdrop-blur-2xl border-2 border-red-500/50 p-5 rounded-2xl text-red-100 text-xs font-mono shadow-[0_0_50px_rgba(248,19,13,0.3)] animate-fade-in z-[100] flex justify-between items-start">
                            <div className="flex-1 pr-4 leading-relaxed">
                                <span className="font-black text-red-400 block mb-1 uppercase tracking-widest">System Warning</span>
                                {error}
                            </div>
                            <button onClick={() => setError(null)} className="p-1 bg-red-500/20 rounded hover:bg-red-500/40 transition-colors">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    )}
                    
                    <SystemConfigWidget 
                        onSoftFix={() => window.location.reload()} 
                        onHardFix={async () => { await clearState(); window.location.reload(); }} 
                    />
                </>
            )}
        </div>
    );
};