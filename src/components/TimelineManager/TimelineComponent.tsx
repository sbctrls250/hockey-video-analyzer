import React, { useRef, useState } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { Timeline, TimelineEvent } from '../../types';
import { useVideoStore } from '../../stores/videoStore';
import { generateId } from '../../utils/helpers';
import { EVENT_COLORS } from '../../utils/constants';

interface TimelineComponentProps {
  timeline: Timeline;
}

export const TimelineComponent: React.FC<TimelineComponentProps> = ({ timeline }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [eventStartTime, setEventStartTime] = useState<number | null>(null);
  const [eventEndTime, setEventEndTime] = useState<number | null>(null);
  const [eventType, setEventType] = useState<'point' | 'duration'>(timeline.defaultEventType);
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const [eventLabel, setEventLabel] = useState('');
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editStartMinutes, setEditStartMinutes] = useState(0);
  const [editStartSeconds, setEditStartSeconds] = useState(0);
  const [editEndMinutes, setEditEndMinutes] = useState(0);
  const [editEndSeconds, setEditEndSeconds] = useState(0);

  const { playerState, updateTimeline } = useVideoStore();

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickTime = (clickX / timelineWidth) * playerState.duration;


    if (isCreatingEvent) {
      if (eventType === 'point') {
        // Create point event
        const event = {
          id: generateId(),
          timelineId: timeline.id,
          type: 'point' as const,
          startTime: clickTime,
          color: eventColor,
          label: eventLabel || `Event at ${formatTime(clickTime)}`,
        };
        // Add event directly to timeline
        updateTimeline(timeline.id, {
          events: [...timeline.events, event]
        });
        resetEventCreation();
      } else if (eventType === 'duration') {
        if (eventStartTime === null) {
          setEventStartTime(clickTime);
        } else {
          setEventEndTime(clickTime);
          // Create duration event
          const startTime = Math.min(eventStartTime, clickTime);
          const endTime = Math.max(eventStartTime, clickTime);
          const event = {
            id: generateId(),
            timelineId: timeline.id,
            type: 'duration' as const,
            startTime,
            endTime,
            color: eventColor,
            label: eventLabel || `Event ${formatTime(startTime)}-${formatTime(endTime)}`,
          };
          // Add event directly to timeline
          updateTimeline(timeline.id, {
            events: [...timeline.events, event]
          });
          resetEventCreation();
        }
      }
    }
  };

  const resetEventCreation = () => {
    setEventStartTime(null);
    setEventEndTime(null);
    setEventLabel('');
    setEventType(timeline.defaultEventType);
  };

  const handleEventClick = (event: TimelineEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    // Jump to event time
    useVideoStore.getState().setCurrentTime(event.startTime);
  };

  const handleEventDelete = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this event?')) {
      // Remove event directly from timeline
      updateTimeline(timeline.id, {
        events: timeline.events.filter(event => event.id !== eventId)
      });
    }
  };

  const handleEventEdit = (event: TimelineEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event.id);
    setEventLabel(event.label);
    setEventColor(event.color);
    setEventType(event.type);
    
    // Convert start time to minutes:seconds
    const startMinSec = secondsToMinSec(event.startTime);
    setEditStartMinutes(startMinSec.minutes);
    setEditStartSeconds(startMinSec.seconds);
    
    if (event.type === 'duration' && event.endTime) {
      // Convert end time to minutes:seconds
      const endMinSec = secondsToMinSec(event.endTime);
      setEditEndMinutes(endMinSec.minutes);
      setEditEndSeconds(endMinSec.seconds);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert total seconds to minutes:seconds format for input
  const secondsToMinSec = (totalSeconds: number): { minutes: number; seconds: number } => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return { minutes, seconds };
  };

  // Convert minutes:seconds format to total seconds
  const minSecToSeconds = (minutes: number, seconds: number): number => {
    return minutes * 60 + seconds;
  };

  const getEventPosition = (event: TimelineEvent) => {
    // Prevent division by zero
    if (!playerState.duration || playerState.duration === 0) {
      return {
        left: '0%',
        width: '1%',
      };
    }
    
    const startPercent = (event.startTime / playerState.duration) * 100;
    const endPercent = event.endTime 
      ? (event.endTime / playerState.duration) * 100 
      : startPercent + 0.5; // Small width for point events
    
    return {
      left: `${startPercent}%`,
      width: `${endPercent - startPercent}%`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Event Creation Controls - Always Visible */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {/* Color selector */}
          <div className="flex space-x-1">
            {EVENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setEventColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  eventColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {/* Label input */}
          <input
            type="text"
            value={eventLabel}
            onChange={(e) => setEventLabel(e.target.value)}
            placeholder="Event description..."
            className="input-field flex-1"
          />
          
          {/* Action buttons */}
          {eventType === 'point' ? (
            <button
              onClick={() => {
                const event = {
                  id: generateId(),
                  timelineId: timeline.id,
                  type: 'point' as const,
                  startTime: playerState.currentTime,
                  color: eventColor,
                  label: eventLabel || `Event at ${formatTime(playerState.currentTime)}`,
                };
                updateTimeline(timeline.id, {
                  events: [...timeline.events, event]
                });
                resetEventCreation();
              }}
              className="btn-primary text-sm"
            >
              Add at {formatTime(playerState.currentTime)}
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setEventStartTime(playerState.currentTime);
                }}
                className="btn-primary text-sm"
                disabled={eventStartTime !== null}
              >
                Start {eventStartTime !== null ? formatTime(eventStartTime) : formatTime(playerState.currentTime)}
              </button>
              
              <button
                onClick={() => {
                  if (eventStartTime !== null) {
                    const startTime = Math.min(eventStartTime, playerState.currentTime);
                    const endTime = Math.max(eventStartTime, playerState.currentTime);
                    const event = {
                      id: generateId(),
                      timelineId: timeline.id,
                      type: 'duration' as const,
                      startTime,
                      endTime,
                      color: eventColor,
                      label: eventLabel || `Event ${formatTime(startTime)}-${formatTime(endTime)}`,
                    };
                    updateTimeline(timeline.id, {
                      events: [...timeline.events, event]
                    });
                    resetEventCreation();
                  }
                }}
                className="btn-primary text-sm"
                disabled={eventStartTime === null}
              >
                End {formatTime(playerState.currentTime)}
              </button>
            </>
          )}
          
          <button
            onClick={resetEventCreation}
            className="btn-secondary text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Event Edit Dialog */}
      {editingEvent && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {/* Color selector */}
            <div className="flex space-x-1">
              {EVENT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setEventColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    eventColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            {/* Label input */}
            <input
              type="text"
              value={eventLabel}
              onChange={(e) => setEventLabel(e.target.value)}
              placeholder="Event description..."
              className="input-field flex-1"
            />
            
            {/* Time inputs */}
            {eventType === 'point' ? (
              <div className="flex space-x-1">
                <input
                  type="number"
                  value={editStartMinutes}
                  onChange={(e) => setEditStartMinutes(parseInt(e.target.value) || 0)}
                  min="0"
                  className="input-field w-16"
                  placeholder="Min"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="number"
                  value={editStartSeconds}
                  onChange={(e) => setEditStartSeconds(parseInt(e.target.value) || 0)}
                  min="0"
                  max="59"
                  className="input-field w-16"
                  placeholder="Sec"
                />
              </div>
            ) : (
              <div className="flex space-x-2">
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={editStartMinutes}
                    onChange={(e) => setEditStartMinutes(parseInt(e.target.value) || 0)}
                    min="0"
                    className="input-field w-16"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number"
                    value={editStartSeconds}
                    onChange={(e) => setEditStartSeconds(parseInt(e.target.value) || 0)}
                    min="0"
                    max="59"
                    className="input-field w-16"
                    placeholder="Sec"
                  />
                </div>
                <div className="flex space-x-1">
                  <input
                    type="number"
                    value={editEndMinutes}
                    onChange={(e) => setEditEndMinutes(parseInt(e.target.value) || 0)}
                    min="0"
                    className="input-field w-16"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number"
                    value={editEndSeconds}
                    onChange={(e) => setEditEndSeconds(parseInt(e.target.value) || 0)}
                    min="0"
                    max="59"
                    className="input-field w-16"
                    placeholder="Sec"
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <button
              onClick={() => {
                const eventToUpdate = timeline.events.find(e => e.id === editingEvent);
                if (eventToUpdate) {
                  const startTime = minSecToSeconds(editStartMinutes, editStartSeconds);
                  const updatedEvent = {
                    ...eventToUpdate,
                    label: eventLabel,
                    color: eventColor,
                    startTime: startTime,
                    ...(eventType === 'duration' && { 
                      endTime: minSecToSeconds(editEndMinutes, editEndSeconds)
                    })
                  };
                  
                  const updatedEvents = timeline.events.map(e => 
                    e.id === editingEvent ? updatedEvent : e
                  );
                  
                  updateTimeline(timeline.id, { events: updatedEvents });
                }
                setEditingEvent(null);
                resetEventCreation();
              }}
              className="btn-primary text-sm"
            >
              Save
            </button>
            
            <button
              onClick={() => {
                if (editingEvent && confirm('Are you sure you want to delete this event?')) {
                  updateTimeline(timeline.id, {
                    events: timeline.events.filter(event => event.id !== editingEvent)
                  });
                }
                setEditingEvent(null);
                resetEventCreation();
              }}
              className="btn-secondary text-sm bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </button>
            
            <button
              onClick={() => {
                setEditingEvent(null);
                resetEventCreation();
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="space-y-2">
        
        <div
          ref={timelineRef}
          className="relative h-12 bg-gray-200 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${(playerState.currentTime / playerState.duration) * 100}%` }}
          />
          
          {/* Events */}
          {timeline.events.map((event) => (
            <div
              key={event.id}
              className="timeline-event group"
              style={{
                ...getEventPosition(event),
                backgroundColor: event.color,
              }}
              onClick={(e) => handleEventClick(event, e)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white truncate px-1">
                  {event.label}
                </span>
              </div>
              
              {/* Event controls */}
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleEventEdit(event, e)}
                  className="p-1 bg-blue-500 text-white rounded-bl text-xs hover:bg-blue-600"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 w-px h-full bg-gray-400"
                style={{ left: `${(i * 10)}%` }}
              />
            ))}
          </div>
        </div>
        
        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0:00</span>
          <span>{formatTime(playerState.duration)}</span>
        </div>
        
      </div>
    </div>
  );
};
