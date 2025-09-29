import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { TimelineManager } from '../components/TimelineManager/TimelineManager';
import { DataManager } from '../components/DataManager/DataManager';
import { useVideoStore } from '../stores/videoStore';
import { VideoFile, Timeline } from '../types';

const API_BASE = 'http://localhost:3001/api';

export const VideoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentVideo, setCurrentVideo, timelines, setTimelines } = useVideoStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadVideo(id);
    }
  }, [id]);

  const loadVideo = async (videoId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load video data
      const videoResponse = await fetch(`${API_BASE}/videos/${videoId}`);
      if (!videoResponse.ok) {
        throw new Error('Video not found');
      }
      const video: VideoFile = await videoResponse.json();

      // Load timelines
      const timelinesResponse = await fetch(`${API_BASE}/videos/${videoId}/timelines`);
      if (!timelinesResponse.ok) {
        throw new Error('Failed to load timelines');
      }
      const timelines: Timeline[] = await timelinesResponse.json();

      // Set video and timelines in store
      setCurrentVideo(video);
      setTimelines(timelines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimelines = async (timelinesToSave: Timeline[]) => {
    if (!id) return;

    try {
      const response = await fetch(`${API_BASE}/videos/${id}/timelines`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timelinesToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save timelines');
      }
    } catch (err) {
      console.error('Failed to save timelines:', err);
      // In a real app, you might want to show a toast notification here
    }
  };

  // Auto-save timelines when they change
  useEffect(() => {
    if (timelines.length > 0 && id) {
      const timeoutId = setTimeout(() => {
        handleSaveTimelines(timelines);
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [timelines, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading video...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Video</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => id && loadVideo(id)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No video loaded</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Videos</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{currentVideo.name}</h1>
        <p className="text-gray-600 mt-2">
          Analyze and create timelines for this video
        </p>
      </div>

      <div className="space-y-8">
        <VideoPlayer />
        <TimelineManager />
        <DataManager />
      </div>
    </div>
  );
};
