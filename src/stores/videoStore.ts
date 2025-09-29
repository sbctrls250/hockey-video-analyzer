import { create } from 'zustand';
import { AppState, VideoFile, Timeline, VideoPlayerState } from '../types';

interface VideoStore extends AppState {
  // Video actions
  setCurrentVideo: (video: VideoFile | null) => void;
  
  // Player actions
  updatePlayerState: (updates: Partial<VideoPlayerState>) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  togglePlayPause: () => void;
  setScrubbing: (isScrubbing: boolean) => void;
  
  // Timeline actions
  addTimeline: (timeline: Timeline) => void;
  removeTimeline: (timelineId: string) => void;
  setActiveTimeline: (timelineId: string | null) => void;
  updateTimeline: (timelineId: string, updates: Partial<Timeline>) => void;
  setTimelines: (timelines: Timeline[]) => void;
  
  // Auto-save functionality
  autoSave: () => void;
}

const initialPlayerState: VideoPlayerState = {
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  isPlaying: false,
  isMuted: false,
  volume: 1,
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  // Initial state
  currentVideo: null,
  timelines: [],
  activeTimelineId: null,
  playerState: initialPlayerState,
  isScrubbing: false,

  // Video actions
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // Player actions
  updatePlayerState: (updates) =>
    set((state) => ({
      playerState: { ...state.playerState, ...updates },
    })),

  setCurrentTime: (time) =>
    set((state) => ({
      playerState: { ...state.playerState, currentTime: time },
    })),

  setPlaybackRate: (rate) =>
    set((state) => ({
      playerState: { ...state.playerState, playbackRate: rate },
    })),

  togglePlayPause: () =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        isPlaying: !state.playerState.isPlaying,
      },
    })),

  setScrubbing: (isScrubbing) => set({ isScrubbing }),

  // Timeline actions
  addTimeline: (timeline) =>
    set((state) => {
      // Ensure timeline has defaultEventType
      const timelineWithDefaults = {
        ...timeline,
        defaultEventType: timeline.defaultEventType || 'point'
      };
      
      return {
        timelines: [...state.timelines, timelineWithDefaults],
        activeTimelineId: state.activeTimelineId || timelineWithDefaults.id,
      };
    }),

  removeTimeline: (timelineId) =>
    set((state) => ({
      timelines: state.timelines.filter((t) => t.id !== timelineId),
      activeTimelineId:
        state.activeTimelineId === timelineId
          ? state.timelines.find((t) => t.id !== timelineId)?.id || null
          : state.activeTimelineId,
    })),

  setActiveTimeline: (timelineId) => set({ activeTimelineId: timelineId }),

  updateTimeline: (timelineId, updates) =>
    set((state) => ({
      timelines: state.timelines.map((t) =>
        t.id === timelineId ? { ...t, ...updates } : t
      ),
    })),

  setTimelines: (timelines) => set({ timelines }),

  // Auto-save functionality (placeholder - will be implemented in VideoPage)
  autoSave: () => {
    // This will be called by the VideoPage component
    // The actual saving logic is handled there
  },

  // Clear all data
  clearAllData: () => {
    set({
      currentVideo: null,
      timelines: [],
      activeTimelineId: null,
      playerState: initialPlayerState,
      isScrubbing: false,
    });
  },

  // Clear only timeline data (preserve video)
  clearTimelineData: () => {
    set((state) => ({
      timelines: [],
      activeTimelineId: null,
    }));
  },

}));
