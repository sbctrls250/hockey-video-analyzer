import React, { useState } from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';
import { useEventStore } from '../../stores/eventStore';
import { Timeline } from '../../types';
import { generateId } from '../../utils/helpers';
import { TIMELINE_COLORS, MAX_TIMELINES } from '../../utils/constants';
import { TimelineComponent } from './TimelineComponent';

export const TimelineManager: React.FC = () => {
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');
  const [newTimelineEventType, setNewTimelineEventType] = useState<'point' | 'duration'>('point');
  const [editingTimeline, setEditingTimeline] = useState<string | null>(null);
  
  const { timelines, activeTimelineId, addTimeline, removeTimeline, setActiveTimeline, updateTimeline } = useVideoStore();

  const handleAddTimeline = () => {
    if (newTimelineName.trim() && timelines.length < MAX_TIMELINES) {
      const newTimeline: Timeline = {
        id: generateId(),
        name: newTimelineName.trim(),
        events: [],
        color: TIMELINE_COLORS[timelines.length % TIMELINE_COLORS.length],
        defaultEventType: newTimelineEventType,
      };
      
      addTimeline(newTimeline);
      setNewTimelineName('');
      setNewTimelineEventType('point');
      setShowAddTimeline(false);
    }
  };

  const handleRemoveTimeline = (timelineId: string) => {
    if (confirm('Are you sure you want to delete this timeline? All events will be lost.')) {
      removeTimeline(timelineId);
    }
  };

  const handleEditTimeline = (timelineId: string, newName: string) => {
    updateTimeline(timelineId, { name: newName });
    setEditingTimeline(null);
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-900">Timelines</h2>
        {timelines.length < MAX_TIMELINES && (
          <button
            onClick={() => setShowAddTimeline(true)}
            className="btn-primary flex items-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Timeline</span>
          </button>
        )}
      </div>

      {/* Add Timeline Form */}
      {showAddTimeline && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={newTimelineName}
                onChange={(e) => setNewTimelineName(e.target.value)}
                placeholder="Timeline name..."
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTimeline()}
                autoFocus
              />
              <select
                value={newTimelineEventType}
                onChange={(e) => setNewTimelineEventType(e.target.value as 'point' | 'duration')}
                className="input-field flex-1 sm:flex-none sm:w-40"
              >
                <option value="point">Point Events</option>
                <option value="duration">Duration Events</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddTimeline}
                className="btn-primary flex-1 sm:flex-none"
                disabled={!newTimelineName.trim()}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddTimeline(false);
                  setNewTimelineName('');
                  setNewTimelineEventType('point');
                }}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline List */}
      {timelines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No timelines created yet.</p>
          <p className="text-sm">Add a timeline to start marking events.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timelines.map((timeline) => (
            <div
              key={timeline.id}
              className={`border rounded-lg p-4 transition-colors ${
                activeTimelineId === timeline.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: timeline.color }}
                  />
                  {editingTimeline === timeline.id ? (
                    <input
                      type="text"
                      defaultValue={timeline.name}
                      onBlur={(e) => handleEditTimeline(timeline.id, e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditTimeline(timeline.id, e.currentTarget.value);
                        }
                      }}
                      className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-medium text-gray-900">{timeline.name}</h3>
                  )}
                  <span className="text-sm text-gray-500">
                    ({timeline.events.length} events)
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTimeline(
                      activeTimelineId === timeline.id ? null : timeline.id
                    )}
                    className={`px-3 py-1 text-sm rounded ${
                      activeTimelineId === timeline.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {activeTimelineId === timeline.id ? 'Active' : 'Select'}
                  </button>
                  
                  <button
                    onClick={() => setEditingTimeline(timeline.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleRemoveTimeline(timeline.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <TimelineComponent timeline={timeline} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
