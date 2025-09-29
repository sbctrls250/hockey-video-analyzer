import React, { useRef, useState } from 'react';
import { Upload, FileVideo, Cloud, HardDrive } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';
import { generateId } from '../../utils/helpers';
import { VideoFile } from '../../types';

export const FileLoader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setCurrentVideo } = useVideoStore();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    setIsLoading(true);
    
    const videoUrl = URL.createObjectURL(file);
    const videoFile: VideoFile = {
      id: generateId(),
      name: file.name,
      url: videoUrl,
      duration: 0, // Will be set when video loads
      source: 'local',
    };

    setCurrentVideo(videoFile);
    setIsLoading(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleGoogleDriveClick = () => {
    // TODO: Implement Google Drive integration
    alert('Google Drive integration coming soon!');
  };

  const handleiCloudClick = () => {
    // TODO: Implement iCloud integration
    alert('iCloud integration coming soon!');
  };

  return (
    <div className="space-y-4">
      {/* Local File Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Loading...' : 'Choose Video File'}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              or drag and drop a video file here
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Storage Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleGoogleDriveClick}
          className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Cloud className="h-6 w-6 text-blue-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Google Drive</div>
            <div className="text-sm text-gray-500">Load from Google Drive</div>
          </div>
        </button>

        <button
          onClick={handleiCloudClick}
          className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <HardDrive className="h-6 w-6 text-gray-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900">iCloud</div>
            <div className="text-sm text-gray-500">Load from iCloud</div>
          </div>
        </button>
      </div>

      {/* Supported Formats */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Supported formats: MP4, WebM, MOV, AVI, MKV
        </p>
      </div>
    </div>
  );
};
