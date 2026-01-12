
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, Move } from 'lucide-react';

interface ZoomPanViewerProps {
    src: string;
    mimeType?: string;
    className?: string;
    children?: React.ReactNode; 
}

export const ZoomPanViewer: React.FC<ZoomPanViewerProps> = ({ src, mimeType, className, children }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef(scale);

    const isVideo = mimeType?.startsWith('video/') || src?.toLowerCase().endsWith('.mp4');

    // Sync ref with state
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    const resetView = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Reset view when the image source changes
    useEffect(() => {
        resetView();
    }, [src, resetView]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale === 1) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && scale > 1) {
            setIsDragging(true);
            const touch = e.touches[0];
            dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.current.x,
            y: touch.clientY - dragStart.current.y
        });
    };

    // Robust wheel listener using refs to avoid stale state
    useEffect(() => {
        const container = containerRef.current;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            const currentScale = scaleRef.current;
            const newScale = Math.min(Math.max(1, currentScale + delta), 10);
            setScale(newScale);
            if (newScale === 1) setPosition({ x: 0, y: 0 });
        };

        if (container) {
            container.addEventListener('wheel', onWheel, { passive: false });
        }
        return () => {
            if (container) container.removeEventListener('wheel', onWheel);
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-full overflow-hidden bg-black flex items-center justify-center touch-none ${className}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
        >
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <button 
                    onClick={resetView}
                    className="p-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors"
                    title="Reset View"
                >
                    <Maximize2 size={18} />
                </button>
            </div>

            <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
            >
                {isVideo ? (
                    <video 
                        src={src} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-w-full max-h-full object-contain pointer-events-auto"
                    />
                ) : (
                    <img 
                        src={src} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        draggable={false}
                    />
                )}
                {children && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                            {children}
                        </div>
                    </div>
                )}
            </div>

            {scale > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-mono flex items-center gap-2 pointer-events-none border border-white/10">
                    <Move size={14} className="text-red-500" />
                    <span>DRAG TO PAN • PINCH TO ZOOM</span>
                </div>
            )}
        </div>
    );
};
