export interface VideoFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  source: 'local' | 'google-drive' | 'icloud';
}

export interface TimelineEvent {
  id: string;
  timelineId: string;
  type: 'point' | 'duration';
  startTime: number;
  endTime?: number; // Only for duration events
  color: string;
  label: string;
  description?: string;
}

export interface Timeline {
  id: string;
  name: string;
  events: TimelineEvent[];
  color: string;
  defaultEventType?: 'point' | 'duration';
}

export interface VideoPlayerState {
  currentTime: number;
  duration: number;
  playbackRate: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
}

export interface AppState {
  currentVideo: VideoFile | null;
  timelines: Timeline[];
  activeTimelineId: string | null;
  playerState: VideoPlayerState;
  isScrubbing: boolean;
}
