import { create } from 'zustand';
import { TimelineEvent, Timeline } from '../types';

interface EventStore {
  // Event actions
  addEvent: (event: TimelineEvent) => void;
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  removeEvent: (eventId: string) => void;
  getEventsForTimeline: (timelineId: string) => TimelineEvent[];
  
  // Event creation helpers
  createPointEvent: (timelineId: string, time: number, color: string, label: string) => TimelineEvent;
  createDurationEvent: (timelineId: string, startTime: number, endTime: number, color: string, label: string) => TimelineEvent;
}

export const useEventStore = create<EventStore>((set, get) => ({
  // Event actions
  addEvent: (event) => {
    const { timelines, updateTimeline } = useVideoStore.getState();
    const timeline = timelines.find(t => t.id === event.timelineId);
    if (timeline) {
      updateTimeline(event.timelineId, {
        events: [...timeline.events, event]
      });
    }
  },

  updateEvent: (eventId, updates) => {
    const { timelines, updateTimeline } = useVideoStore.getState();
    const timeline = timelines.find(t => t.events.some(e => e.id === eventId));
    if (timeline) {
      const updatedEvents = timeline.events.map(e => 
        e.id === eventId ? { ...e, ...updates } : e
      );
      updateTimeline(timeline.id, { events: updatedEvents });
    }
  },

  removeEvent: (eventId) => {
    const { timelines, updateTimeline } = useVideoStore.getState();
    const timeline = timelines.find(t => t.events.some(e => e.id === eventId));
    if (timeline) {
      const updatedEvents = timeline.events.filter(e => e.id !== eventId);
      updateTimeline(timeline.id, { events: updatedEvents });
    }
  },

  getEventsForTimeline: (timelineId) => {
    const { timelines } = useVideoStore.getState();
    const timeline = timelines.find(t => t.id === timelineId);
    return timeline?.events || [];
  },

  // Event creation helpers
  createPointEvent: (timelineId, time, color, label) => ({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timelineId,
    type: 'point',
    startTime: time,
    color,
    label,
  }),

  createDurationEvent: (timelineId, startTime, endTime, color, label) => ({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timelineId,
    type: 'duration',
    startTime,
    endTime,
    color,
    label,
  }),
}));
