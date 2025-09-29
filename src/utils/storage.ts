import { Timeline, TimelineEvent, VideoFile } from '../types';

const DB_NAME = 'HockeyVideoAnalyzer';
const DB_VERSION = 1;

interface StoredData {
  timelines: Timeline[];
  videoFiles: VideoFile[];
  lastUpdated: number;
}

class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('timelines')) {
          db.createObjectStore('timelines', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('videoFiles')) {
          db.createObjectStore('videoFiles', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('appData')) {
          db.createObjectStore('appData', { keyPath: 'key' });
        }
      };
    });
  }

  async saveTimelines(timelines: Timeline[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['timelines', 'events'], 'readwrite');
    const timelineStore = transaction.objectStore('timelines');
    const eventStore = transaction.objectStore('events');

    // Clear existing data
    await this.clearStore(timelineStore);
    await this.clearStore(eventStore);

    // Save timelines and their events
    for (const timeline of timelines) {
      await this.putData(timelineStore, timeline);
      
      for (const event of timeline.events) {
        await this.putData(eventStore, event);
      }
    }

    // Update last saved timestamp
    await this.saveAppData('lastSaved', Date.now());
  }

  async loadTimelines(): Promise<Timeline[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['timelines', 'events'], 'readonly');
    const timelineStore = transaction.objectStore('timelines');
    const eventStore = transaction.objectStore('events');

    const timelines = await this.getAllData(timelineStore) as Timeline[];
    const events = await this.getAllData(eventStore) as TimelineEvent[];

    // Group events by timeline
    const eventsByTimeline = events.reduce((acc, event) => {
      if (!acc[event.timelineId]) {
        acc[event.timelineId] = [];
      }
      acc[event.timelineId].push(event);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);

    // Attach events to timelines
    return timelines.map(timeline => ({
      ...timeline,
      events: eventsByTimeline[timeline.id] || []
    }));
  }

  async saveVideoFile(videoFile: VideoFile): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['videoFiles'], 'readwrite');
    const store = transaction.objectStore('videoFiles');
    await this.putData(store, videoFile);
  }

  async loadVideoFiles(): Promise<VideoFile[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['videoFiles'], 'readonly');
    const store = transaction.objectStore('videoFiles');
    return await this.getAllData(store) as VideoFile[];
  }

  async saveAppData(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['appData'], 'readwrite');
    const store = transaction.objectStore('appData');
    await this.putData(store, { key, data });
  }

  async loadAppData(key: string): Promise<any> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['appData'], 'readonly');
    const store = transaction.objectStore('appData');
    const result = await this.getData(store, key);
    return result?.data;
  }

  async exportData(): Promise<string> {
    const timelines = await this.loadTimelines();
    const videoFiles = await this.loadVideoFiles();
    
    const exportData = {
      timelines,
      videoFiles,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.timelines) {
      await this.saveTimelines(data.timelines);
    }
    
    if (data.videoFiles) {
      for (const videoFile of data.videoFiles) {
        await this.saveVideoFile(videoFile);
      }
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['timelines', 'events', 'videoFiles', 'appData'], 'readwrite');
    
    await this.clearStore(transaction.objectStore('timelines'));
    await this.clearStore(transaction.objectStore('events'));
    await this.clearStore(transaction.objectStore('videoFiles'));
    await this.clearStore(transaction.objectStore('appData'));
  }

  private async putData(store: IDBObjectStore, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getData(store: IDBObjectStore, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllData(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageManager = new StorageManager();

