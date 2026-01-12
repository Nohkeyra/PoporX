/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SettingsIcon, XIcon } from './icons';

interface SystemConfigWidgetProps {
  onSoftFix: () => void;
  onHardFix: () => void;
}

interface Position {
  x: number;
  y: number;
}

export const SystemConfigWidget: React.FC<SystemConfigWidgetProps> = ({ 
  onSoftFix, 
  onHardFix 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('system-widget-position');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.x !== undefined && parsed.y !== undefined) {
            return parsed;
          }
        }
        return { 
          x: Math.min(16, window.innerWidth - 64), 
          y: window.innerHeight - 80 
        };
      }
    } catch (e) {
      console.warn('Failed to load widget position:', e);
    }
    return { x: 16, y: 500 };
  });

  // State
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false); // Visual state for pressing down before drag activates

  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 }); // Mouse/Touch start position on screen
  const widgetOffset = useRef({ x: 0, y: 0 }); // Offset of click relative to widget top-left
  const longPressTimer = useRef<number | null>(null);
  const touchIdentifierRef = useRef<number | null>(null);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('system-widget-position', JSON.stringify(position));
    } catch (e) { console.warn('Failed to save widget position:', e); }
  }, [position]);

  // Window Resize Handling
  useEffect(() => {
    const handleResize = () => {
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        const newX = Math.min(position.x, window.innerWidth - rect.width);
        const newY = Math.min(position.y, window.innerHeight - rect.height);
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // --- UNIFIED POINTER HANDLERS (Touch & Mouse) ---

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to stop text selection, but be careful with scrolling (handled in Move)
    if (e.type === 'mousedown') e.preventDefault(); 
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      touchIdentifierRef.current = touch.identifier;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Record start positions
    dragStartPos.current = { x: clientX, y: clientY };
    widgetOffset.current = { x: clientX - position.x, y: clientY - position.y };
    
    setIsHolding(true);

    // Start Hold Timer
    longPressTimer.current = window.setTimeout(() => {
      setIsDragging(true);
      setIsHolding(false); // Transition from hold to drag
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms hold to drag
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    let clientX: number;
    let clientY: number;

    if (window.TouchEvent && e instanceof TouchEvent) {
       const touch = Array.from(e.touches).find(t => t.identifier === touchIdentifierRef.current);
       if (!touch) return;
       clientX = touch.clientX;
       clientY = touch.clientY;
    } else {
       clientX = (e as MouseEvent).clientX;
       clientY = (e as MouseEvent).clientY;
    }

    if (isDragging) {
      // --- DRAGGING LOGIC ---
      e.preventDefault(); // Stop scrolling while dragging
      const widget = widgetRef.current;
      if (!widget) return;
      
      const rect = widget.getBoundingClientRect();
      // Calculate new top-left based on offset
      const newX = clientX - widgetOffset.current.x;
      const newY = clientY - widgetOffset.current.y;
      
      // Boundaries
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: boundedX, y: boundedY });
    } else {
      // --- MOVEMENT CHECK (Before Drag Activates) ---
      // If user moves finger significantly before timer fires, it's a SCROLL or SWIPE, not a hold.
      const dist = Math.hypot(clientX - dragStartPos.current.x, clientY - dragStartPos.current.y);
      if (dist > 10) {
        // Cancel the hold
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setIsHolding(false);
      }
    }
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    // Clear timer immediately
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging) {
      // Stop dragging
      setIsDragging(false);
    } else if (isHolding) {
      // If we were holding (and didn't move too much, thus timer wasn't cancelled by move),
      // but released BEFORE the drag timer fired... it's a CLICK.
      setIsOpen(true);
    }

    setIsHolding(false);
    touchIdentifierRef.current = null;
    
    // Reset body styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';
  }, [isDragging, isHolding]);

  // Global Event Listeners for Move/Up (to catch dragging outside widget)
  useEffect(() => {
    if (isHolding || isDragging) {
      window.addEventListener('mousemove', handlePointerMove, { passive: false });
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);
      
      // Lock body scrolling ONLY if we are actually dragging (not just holding to check)
      // We don't lock on simple hold to allow scrolling if the user meant to scroll
      if (isDragging) {
         document.body.style.touchAction = 'none';
         document.body.style.userSelect = 'none';
      }
    } else {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [isHolding, isDragging, handlePointerMove, handlePointerUp]);

  const handleButtonClick = (handler: () => void) => {
    setIsOpen(false);
    setTimeout(handler, 100);
  };

  // --- RENDER: CLOSED STATE (Floating Button) ---
  if (!isOpen) {
    return (
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 9999, // Ensure top
          touchAction: 'none' // Important for browser handling
        }}
        // Apply events here
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className={`transition-transform duration-200 cursor-pointer ${
          isDragging ? 'scale-110' : isHolding ? 'scale-90' : 'scale-100 hover:scale-105'
        }`}
        role="button"
        aria-label="System Config"
        title="Click to open, Hold to drag"
      >
        <div className={`
            w-12 h-12
            bg-black/80 backdrop-blur-xl rounded-full
            flex items-center justify-center
            border-2 
            transition-all duration-300
            shadow-lg
            ${isDragging 
              ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] bg-blue-900/30' 
              : isHolding
                ? 'border-red-500/50 bg-red-900/10'
                : 'border-gray-700 hover:border-gray-500'
            }
        `}>
          <SettingsIcon 
            className={`w-5 h-5 text-gray-200 transition-all duration-300 ${isDragging ? 'animate-spin-slow text-blue-400' : ''}`} 
          />
        </div>
        
        {/* Tooltip hint */}
        {isHolding && !isDragging && (
           <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 rounded text-[10px] text-gray-400 font-mono pointer-events-none opacity-80 animate-fade-in">
             Hold to drag
           </div>
        )}
      </div>
    );
  }

  // --- RENDER: OPEN STATE (Modal) ---
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={() => setIsOpen(false)} 
      />
      
      {/* Panel */}
      <div
        ref={widgetRef}
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          zIndex: 9999
        }}
        className="bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl w-72 animate-fade-in overflow-hidden"
      >
        {/* Header - We use the same Drag logic here, or simplified since it's a window */}
        <div
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          className={`flex justify-between items-center p-4 border-b border-gray-800 bg-[#111] cursor-grab active:cursor-grabbing select-none ${isDragging ? 'bg-blue-900/10' : ''}`}
        >
          <h3 className="text-sm font-black italic text-white uppercase tracking-wider" style={{ fontFamily: 'Koulen' }}>
            System Config
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-white p-1"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 space-y-3">
          <button
            onClick={() => handleButtonClick(onSoftFix)}
            className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-green-500/50 rounded-lg group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <div>
                <div className="text-xs font-bold text-gray-200">Soft Reset</div>
                <div className="text-[10px] text-gray-500">Reload app & clear session</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleButtonClick(onHardFix)}
            className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-500/50 rounded-lg group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <div>
                <div className="text-xs font-bold text-gray-200">Factory Reset</div>
                <div className="text-[10px] text-gray-500">Wipe all data & cache</div>
              </div>
            </div>
          </button>
        </div>
        
        <div className="p-2 bg-[#080808] border-t border-gray-800 text-center">
            <p className="text-[9px] text-gray-600 font-mono">
                {isDragging ? "RELOCATING..." : "HOLD HEADER TO MOVE"}
            </p>
        </div>
      </div>
    </>
  );
};
