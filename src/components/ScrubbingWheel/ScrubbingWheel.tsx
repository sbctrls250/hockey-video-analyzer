import React, { useRef, useEffect, useState } from 'react';
import { useVideoStore } from '../../stores/videoStore';
import { calculateScrubbingSpeed } from '../../utils/helpers';
import { SCRUBBING_SPEED_RANGE } from '../../utils/constants';

interface ScrubbingWheelProps {
  onScrubbingStart: () => void;
  onScrubbingEnd: () => void;
  onTimeChange: (time: number) => void;
  currentTime: number;
  duration: number;
}

export const ScrubbingWheel: React.FC<ScrubbingWheelProps> = ({
  onScrubbingStart,
  onScrubbingEnd,
  onTimeChange,
  currentTime,
  duration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [scrubbingSpeed, setScrubbingSpeed] = useState(1);
  const [lastWheelTime, setLastWheelTime] = useState(0);
  const animationRef = useRef<number>();

  const { setPlaybackRate } = useVideoStore();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (!isActive) {
        setIsActive(true);
        onScrubbingStart();
        setLastWheelTime(Date.now());
      }

      const newSpeed = calculateScrubbingSpeed(e.deltaY, scrubbingSpeed);
      setScrubbingSpeed(newSpeed);
      setPlaybackRate(newSpeed);
      setLastWheelTime(Date.now());
    };

    const handleMouseLeave = () => {
      if (isActive) {
        setIsActive(false);
        onScrubbingEnd();
        setScrubbingSpeed(1);
        setPlaybackRate(1);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isActive, scrubbingSpeed, onScrubbingStart, onScrubbingEnd, setPlaybackRate]);

  // Auto-reset scrubbing after inactivity
  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => {
        setIsActive(false);
        onScrubbingEnd();
        setScrubbingSpeed(1);
        setPlaybackRate(1);
      }, 1000); // Reset after 1 second of inactivity

      return () => clearTimeout(timeout);
    }
  }, [lastWheelTime, isActive, onScrubbingEnd, setPlaybackRate]);

  // Visual feedback for scrubbing speed
  useEffect(() => {
    if (isActive) {
      const updateVisual = () => {
        if (containerRef.current) {
          const speed = scrubbingSpeed;
          const isSlow = speed < 0.5;
          const isFast = speed > 1.5;
          
          containerRef.current.style.background = isSlow 
            ? 'rgba(59, 130, 246, 0.3)' // Blue for slow
            : isFast 
            ? 'rgba(239, 68, 68, 0.3)' // Red for fast
            : 'rgba(16, 185, 129, 0.3)'; // Green for normal
        }
        animationRef.current = requestAnimationFrame(updateVisual);
      };
      
      animationRef.current = requestAnimationFrame(updateVisual);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current) {
        containerRef.current.style.background = 'transparent';
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, scrubbingSpeed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto cursor-pointer transition-all duration-200"
      style={{
        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
    >
      {isActive && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              scrubbingSpeed < 0.5 ? 'bg-blue-400' :
              scrubbingSpeed > 1.5 ? 'bg-red-400' : 'bg-green-400'
            }`} />
            <span>
              {scrubbingSpeed < 0.5 ? 'Slow' : 
               scrubbingSpeed > 1.5 ? 'Fast' : 'Normal'} 
              ({scrubbingSpeed.toFixed(1)}x)
            </span>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
          <div className="text-center">
            <div className="text-xs text-gray-300 mb-1">Scrubbing Active</div>
            <div className="text-lg font-bold">
              {scrubbingSpeed.toFixed(1)}x
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
