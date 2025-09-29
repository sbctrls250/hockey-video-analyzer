import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';
import { formatTime } from '../../utils/helpers';
import { PLAYBACK_RATES } from '../../utils/constants';
import { JogWheel } from '../JogWheel/JogWheel';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanX, setLastPanX] = useState(0);
  const [lastPanY, setLastPanY] = useState(0);
  
  const {
    currentVideo,
    playerState,
    updatePlayerState,
    setCurrentTime,
    setPlaybackRate,
    togglePlayPause,
    setScrubbing,
  } = useVideoStore();

  // Sync video element with store state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const handleTimeUpdate = () => {
      if (!playerState.isScrubbing) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      updatePlayerState({ duration: video.duration });
    };

    const handlePlay = () => updatePlayerState({ isPlaying: true });
    const handlePause = () => updatePlayerState({ isPlaying: false });
    const handleEnded = () => {
      updatePlayerState({ isPlaying: false });
      setCurrentTime(video.duration); // Ensure we're at the end
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideo, playerState.isScrubbing, updatePlayerState, setCurrentTime]);

  // Apply store state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - playerState.currentTime) > 0.1) {
      video.currentTime = playerState.currentTime;
    }

    video.playbackRate = playerState.playbackRate;
    video.volume = playerState.volume;
    video.muted = playerState.isMuted;

    if (playerState.isPlaying && video.paused && !video.ended) {
      video.play().catch(console.error);
    } else if (!playerState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [playerState]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (video && video.ended) {
      // If video has ended, restart from beginning
      setCurrentTime(0);
      updatePlayerState({ isPlaying: true });
    } else {
      togglePlayPause();
    }
  };

  const handleTimeChange = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (volume: number) => {
    updatePlayerState({ volume, isMuted: volume === 0 });
  };

  const handleMuteToggle = () => {
    updatePlayerState({ isMuted: !playerState.isMuted });
  };


  const handleFrameChange = (direction: 'prev' | 'next') => {
    const video = videoRef.current;
    if (!video) return;

    // Use a smaller step for more precise frame control
    // Most videos are 24-30fps, so 1/30th of a second (0.033s) should be close to one frame
    const frameStep = 1/30; // ~33ms step for 30fps videos
    
    if (direction === 'prev') {
      setCurrentTime(Math.max(0, playerState.currentTime - frameStep));
    } else {
      setCurrentTime(Math.min(playerState.duration, playerState.currentTime + frameStep));
    }
  };

  const handleFullscreenToggle = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!isFullscreen) {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if ((video as any).webkitRequestFullscreen) {
          await (video as any).webkitRequestFullscreen();
        } else if ((video as any).msRequestFullscreen) {
          await (video as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  const handleVideoMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setLastPanX(e.clientX);
      setLastPanY(e.clientY);
    }
  };

  const handleVideoMouseMove = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && isPanning && e.buttons === 1) {
      const deltaX = e.clientX - lastPanX;
      const deltaY = e.clientY - lastPanY;
      
      setPanX(prev => prev + deltaX * 0.5);
      setPanY(prev => prev + deltaY * 0.5);
      
      setLastPanX(e.clientX);
      setLastPanY(e.clientY);
    }
    
    // Show fullscreen controls on mouse movement
    if (isFullscreen) {
      setShowFullscreenControls(true);
      // Hide controls after 3 seconds of no movement
      clearTimeout(fullscreenControlsTimeout.current);
      fullscreenControlsTimeout.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000);
    }
  };

  const handleVideoMouseUp = () => {
    setIsPanning(false);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fullscreenControlsTimeout.current) {
        clearTimeout(fullscreenControlsTimeout.current);
      }
    };
  }, []);

  if (!currentVideo) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-black rounded-t-lg overflow-hidden">
        <div 
          className="relative"
          style={{
            transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center center',
            transition: zoomLevel === 1 ? 'transform 0.3s ease' : 'none'
          }}
        >
          <video
            ref={videoRef}
            src={currentVideo.url}
            className={`w-full h-auto max-h-[60vh] sm:max-h-[70vh] ${
              zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
            onTimeUpdate={() => {}} // Handled in useEffect
            onMouseDown={handleVideoMouseDown}
            onMouseMove={handleVideoMouseMove}
            onMouseUp={handleVideoMouseUp}
          />
        </div>
        
      </div>

      {/* Controls */}
      <div className="bg-gray-900 text-white p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">
                {formatTime(playerState.currentTime)}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-400 font-mono">
                {formatTime(playerState.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Jog Wheel */}
            <JogWheel
              onFrameChange={handleFrameChange}
              onTimeChange={handleTimeChange}
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              isPlaying={playerState.isPlaying}
            />

            {/* Volume Control */}
            <div className="relative">
              <button
                onClick={handleMuteToggle}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {playerState.isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
              
              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={playerState.volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${playerState.volume * 100}%, #374151 ${playerState.volume * 100}%, #374151 100%)`
                    }}
                  />
                </div>
              )}
            </div>

            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1 hover:bg-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-mono">{playerState.playbackRate}x</span>
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg py-2 min-w-[120px]">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                        rate === playerState.playbackRate ? 'text-blue-400' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <span className="text-xs font-mono px-2 py-1 bg-gray-700 rounded">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button
                onClick={handleResetZoom}
                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  zoomLevel !== 1 
                    ? 'hover:bg-gray-700' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title="Reset Zoom"
                disabled={zoomLevel === 1}
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreenToggle}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={playerState.duration || 0}
            step="0.1"
            value={playerState.currentTime}
            onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(playerState.currentTime / playerState.duration) * 100}%, #374151 ${(playerState.currentTime / playerState.duration) * 100}%, #374151 100%)`
            }}
          />
        </div>
      </div>

      {/* Fullscreen Controls Overlay */}
      {isFullscreen && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-50 ${
            showFullscreenControls ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseMove={handleVideoMouseMove}
        >
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              {/* Left side - Play/Pause and Time */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="p-3 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {playerState.isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8" />
                  )}
                </button>

                <div className="flex items-center space-x-2 text-white">
                  <span className="text-lg font-mono">
                    {formatTime(playerState.currentTime)}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-400 font-mono">
                    {formatTime(playerState.duration)}
                  </span>
                </div>
              </div>

              {/* Center - Jog Wheel */}
              <div className="flex-1 flex justify-center">
                <JogWheel
                  onFrameChange={handleFrameChange}
                  onTimeChange={handleTimeChange}
                  currentTime={playerState.currentTime}
                  duration={playerState.duration}
                  isPlaying={playerState.isPlaying}
                />
              </div>

              {/* Right side - Zoom and Fullscreen */}
              <div className="flex items-center space-x-2">
                {/* Zoom Controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-3 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-6 h-6" />
                  </button>
                  
                  <span className="text-sm font-mono px-3 py-2 bg-gray-700 rounded text-white">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  
                  <button
                    onClick={handleZoomIn}
                    className="p-3 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={handleResetZoom}
                    className={`p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      zoomLevel !== 1 
                        ? 'hover:bg-gray-700' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    title="Reset Zoom"
                    disabled={zoomLevel === 1}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>

                {/* Exit Fullscreen */}
                <button
                  onClick={handleFullscreenToggle}
                  className="p-3 hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                  title="Exit fullscreen"
                >
                  <Minimize className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
