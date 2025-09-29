const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve local video files
app.use('/videos', express.static('videos'));

// Google Drive API endpoint to get direct download URLs
app.get('/api/drive/url', async (req, res) => {
  const driveUrl = req.query.url;
  
  if (!driveUrl) {
    return res.status(400).json({ error: 'Google Drive URL is required' });
  }
  
  try {
    // Extract file ID from Google Drive URL
    let fileId = null;
    
    // Handle different Google Drive URL formats
    if (driveUrl.includes('drive.google.com/file/d/')) {
      fileId = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    } else if (driveUrl.includes('drive.google.com/open')) {
      fileId = driveUrl.match(/id=([a-zA-Z0-9_-]+)/)?.[1];
    }
    
    if (!fileId) {
      return res.status(400).json({ 
        error: 'Invalid Google Drive URL format. Please use a shareable link.' 
      });
    }
    
    // For now, return the direct download URL
    // In production, you would use Google Drive API to get authenticated URLs
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    res.json({
      success: true,
      fileId: fileId,
      directUrl: directUrl,
      message: 'Use this URL in your video player. Note: File must be publicly accessible.'
    });
    
  } catch (error) {
    console.error('Google Drive URL processing error:', error);
    res.status(500).json({ error: 'Failed to process Google Drive URL' });
  }
});

// Enhanced video URL processing endpoint
app.post('/api/videos/process-url', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'Video URL is required' });
  }
  
  try {
    let processedUrl = url;
    let source = 'direct';
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || 
                     url.match(/id=([a-zA-Z0-9_-]+)/)?.[1];
      
      if (fileId) {
        processedUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        source = 'google-drive';
      }
    }
    
    // Handle YouTube URLs (placeholder for future implementation)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return res.status(400).json({ 
        error: 'YouTube integration coming soon. Please use Google Drive for now.',
        supportedSources: ['google-drive', 'direct-url', 'local-file']
      });
    }
    
    res.json({
      success: true,
      originalUrl: url,
      processedUrl: processedUrl,
      source: source,
      message: 'URL processed successfully'
    });
    
  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ error: 'Failed to process video URL' });
  }
});

// Data storage (in production, use a proper database)
const DATA_DIR = path.join(__dirname, 'data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const TIMELINES_DIR = path.join(DATA_DIR, 'timelines');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TIMELINES_DIR)) {
  fs.mkdirSync(TIMELINES_DIR, { recursive: true });
}

// Initialize videos.json if it doesn't exist
if (!fs.existsSync(VIDEOS_FILE)) {
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify([]));
}

// Helper functions
const readVideos = () => {
  try {
    const data = fs.readFileSync(VIDEOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading videos:', error);
    return [];
  }
};

const writeVideos = (videos) => {
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error('Error writing videos:', error);
  }
};

const readTimeline = (videoId) => {
  try {
    const timelineFile = path.join(TIMELINES_DIR, `${videoId}.json`);
    if (!fs.existsSync(timelineFile)) {
      return [];
    }
    const data = fs.readFileSync(timelineFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading timeline:', error);
    return [];
  }
};

const writeTimeline = (videoId, timelines) => {
  try {
    const timelineFile = path.join(TIMELINES_DIR, `${videoId}.json`);
    fs.writeFileSync(timelineFile, JSON.stringify(timelines, null, 2));
  } catch (error) {
    console.error('Error writing timeline:', error);
  }
};

// Routes

// Get all videos
app.get('/api/videos', (req, res) => {
  try {
    const videos = readVideos();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get a specific video
app.get('/api/videos/:id', (req, res) => {
  try {
    const videos = readVideos();
    const video = videos.find(v => v.id === req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Create a new video
app.post('/api/videos', (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }

    const videos = readVideos();
    const newVideo = {
      id: uuidv4(),
      name: name.trim(),
      url: url.trim(),
      duration: 0, // Will be updated when video is loaded
      source: url.startsWith('http') ? 'google-drive' : 'local'
    };

    videos.push(newVideo);
    writeVideos(videos);

    // Initialize empty timeline for this video
    writeTimeline(newVideo.id, []);

    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update a video
app.put('/api/videos/:id', (req, res) => {
  try {
    const { name, url, duration } = req.body;
    const videos = readVideos();
    const videoIndex = videos.findIndex(v => v.id === req.params.id);
    
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (name !== undefined) videos[videoIndex].name = name.trim();
    if (url !== undefined) videos[videoIndex].url = url.trim();
    if (duration !== undefined) videos[videoIndex].duration = duration;

    writeVideos(videos);
    res.json(videos[videoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete a video
app.delete('/api/videos/:id', (req, res) => {
  try {
    const videos = readVideos();
    const videoIndex = videos.findIndex(v => v.id === req.params.id);
    
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    videos.splice(videoIndex, 1);
    writeVideos(videos);

    // Delete timeline file
    const timelineFile = path.join(TIMELINES_DIR, `${req.params.id}.json`);
    if (fs.existsSync(timelineFile)) {
      fs.unlinkSync(timelineFile);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get timelines for a video
app.get('/api/videos/:id/timelines', (req, res) => {
  try {
    const timelines = readTimeline(req.params.id);
    res.json(timelines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timelines' });
  }
});

// Save timelines for a video
app.put('/api/videos/:id/timelines', (req, res) => {
  try {
    const timelines = req.body;
    writeTimeline(req.params.id, timelines);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save timelines' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
