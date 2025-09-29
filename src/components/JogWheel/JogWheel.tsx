import React, { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JogWheelProps {
  onFrameChange: (direction: 'prev' | 'next') => void;
  onTimeChange: (time: number) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export const JogWheel: React.FC<JogWheelProps> = ({
  onFrameChange,
  onTimeChange,
  currentTime,
  duration,
  isPlaying,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Calculate frame number assuming 30fps (most common for web videos)
  const frameNumber = Math.floor(currentTime * 30);
  const totalFrames = Math.floor(duration * 30);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!wheelRef.current) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartTime(currentTime);
    
    // Prevent text selection while dragging
    e.preventDefault();
  }, [currentTime]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !wheelRef.current) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const wheelWidth = rect.width;
    const deltaX = e.clientX - dragStartX;
    
    // Calculate the time change based on drag distance
    // Scale factor: 1 second per 100 pixels of drag
    const timeDelta = (deltaX / 100) * 1; // 1 second per 100px
    const newTime = Math.max(0, Math.min(duration, dragStartTime + timeDelta));
    
    onTimeChange(newTime);
  }, [isDragging, dragStartX, dragStartTime, duration, onTimeChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Don't stop dragging when mouse leaves the wheel area
    // This allows continuous scrubbing even when mouse moves outside
  }, []);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!wheelRef.current) return;
        
        const rect = wheelRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartX;
        const timeDelta = (deltaX / 100) * 1; // 1 second per 100px
        const newTime = Math.max(0, Math.min(duration, dragStartTime + timeDelta));
        
        onTimeChange(newTime);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStartX, dragStartTime, duration, onTimeChange]);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onFrameChange('prev')}
        className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Previous frame"
        disabled={currentTime <= 0}
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      
      {/* Scrubbing Wheel */}
      <div
        ref={wheelRef}
        className={`flex flex-col items-center space-y-1 min-w-[120px] px-4 py-2 rounded-lg transition-colors ${
          isDragging 
            ? 'bg-blue-600 cursor-grabbing' 
            : 'bg-gray-700 hover:bg-gray-600 cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        title="Click and drag to scrub through video"
      >
        <div className="text-sm text-white font-medium">Jog Wheel</div>
        {isDragging && (
          <div className="text-xs text-blue-200 mt-1">
            Scrubbing...
          </div>
        )}
      </div>
      
      <button
        onClick={() => onFrameChange('next')}
        className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Next frame"
        disabled={currentTime >= duration}
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
};
