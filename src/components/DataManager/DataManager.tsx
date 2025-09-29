import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';

export const DataManager: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { timelines, setCurrentVideo } = useVideoStore();


  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get current data from the store
      const { timelines, currentVideo } = useVideoStore.getState();
      
      console.log('Exporting timelines:', timelines);
      console.log('Current video:', currentVideo);
      
      const exportData = {
        timelines: timelines,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      console.log('Export data structure:', exportData);
      
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log('JSON string to export:', jsonString);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      
      // Use video filename if available, otherwise use default
      const videoName = currentVideo?.name || 'hockey-analysis';
      const cleanVideoName = videoName.replace(/\.[^/.]+$/, ''); // Remove file extension
      const date = new Date().toISOString().split('T')[0];
      a.download = `${cleanVideoName}-${date}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Data exported successfully! ${timelines.length} timeline(s) exported.`);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      console.log('Imported file content:', text);
      
      const importedData = JSON.parse(text);
      console.log('Parsed import data:', importedData);
      
      // Check file version and provide helpful messages
      const fileVersion = importedData.version || 'unknown';
      console.log('File version:', fileVersion);
      
      // Validate the imported data structure
      if (!importedData.timelines || !Array.isArray(importedData.timelines)) {
        throw new Error('Invalid data format: missing timelines array');
      }
      
      console.log('Found timelines to import:', importedData.timelines.length);
      
      // Check for potential compatibility issues
      const hasOldFormat = importedData.timelines.some(timeline => !timeline.defaultEventType);
      if (hasOldFormat) {
        console.log('Detected older file format - applying backward compatibility fixes');
      }
      
      // Clear only timeline data, preserve current video
      const { clearTimelineData, addTimeline } = useVideoStore.getState();
      
      // Clear only timeline data (video stays loaded)
      clearTimelineData();
      console.log('Cleared existing timeline data');
      
      // Import each timeline with proper defaultEventType and backward compatibility
      for (const timeline of importedData.timelines) {
        console.log('Importing timeline:', timeline);
        
        // Ensure timeline has all required fields (for backward compatibility)
        const timelineWithDefaults = {
          ...timeline,
          // Add defaultEventType if missing (for older files)
          defaultEventType: timeline.defaultEventType || 'point',
          // Ensure events array exists
          events: timeline.events || [],
          // Ensure color exists
          color: timeline.color || '#3b82f6',
          // Ensure name exists
          name: timeline.name || 'Untitled Timeline'
        };
        
        // Also ensure each event has all required fields
        const eventsWithDefaults = timelineWithDefaults.events.map(event => ({
          ...event,
          // Ensure event has all required fields
          id: event.id || `event-${Date.now()}-${Math.random()}`,
          timelineId: event.timelineId || timelineWithDefaults.id,
          type: event.type || 'point',
          startTime: event.startTime || 0,
          endTime: event.endTime || (event.type === 'duration' ? event.startTime + 1 : undefined),
          color: event.color || '#ef4444',
          label: event.label || 'Untitled Event'
        }));
        
        const finalTimeline = {
          ...timelineWithDefaults,
          events: eventsWithDefaults
        };
        
        console.log('Timeline with defaults:', finalTimeline);
        addTimeline(finalTimeline);
      }
      
      // Verify import was successful
      const { timelines } = useVideoStore.getState();
      console.log('Final timeline count after import:', timelines.length);
      
      const totalEvents = timelines.reduce((sum, timeline) => sum + timeline.events.length, 0);
      const versionInfo = fileVersion !== 'unknown' ? ` (v${fileVersion})` : ' (legacy format)';
      
      alert(`Data imported successfully! ${importedData.timelines.length} timeline(s) with ${totalEvents} event(s) loaded${versionInfo}.`);
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportData(file);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await useVideoStore.getState().clearAllData();
        alert('All data cleared successfully!');
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  return (
    <div className="card p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Data */}
        <button
          onClick={handleExportData}
          disabled={isExporting || timelines.length === 0}
          className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-8 w-8 text-purple-500 mb-2" />
          <span className="font-medium text-gray-900">Export</span>
          <span className="text-sm text-gray-500">Download JSON</span>
        </button>

        {/* Import Data */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-8 w-8 text-orange-500 mb-2" />
            <span className="font-medium text-gray-900">Import</span>
            <span className="text-sm text-gray-500">Upload JSON</span>
          </button>
        </div>
      </div>

      {/* Clear Data */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={handleClearData}
          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="h-5 w-5" />
          <span>Clear All Data</span>
        </button>
        <p className="text-sm text-gray-500 mt-2">
          This will permanently delete all timelines, events, and video data.
        </p>
      </div>

      {/* Status Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Data</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Timelines: {timelines.length}</p>
          <p>Total Events: {timelines.reduce((sum, t) => sum + t.events.length, 0)}</p>
        </div>
      </div>
    </div>
  );
};
