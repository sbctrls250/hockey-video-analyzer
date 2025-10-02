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

// Google Drive proxy endpoint - serves videos through our server
app.get('/api/drive/proxy/:fileId', async (req, res) => {
  const fileId = req.params.fileId;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }
  
  try {
    // Try multiple Google Drive URL formats
    const urls = [
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://docs.google.com/uc?export=download&id=${fileId}`
    ];
    
    let response = null;
    let lastError = null;
    
    // Try each URL until one works
    for (const url of urls) {
      try {
        console.log(`Trying Google Drive URL: ${url}`);
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok && response.headers.get('content-type')?.includes('video')) {
          console.log(`Success with URL: ${url}`);
          break;
        } else if (response.ok) {
          console.log(`URL worked but wrong content type: ${response.headers.get('content-type')}`);
        }
      } catch (error) {
        console.log(`URL failed: ${url}`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`All Google Drive URLs failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
    
    // Set appropriate headers for video streaming
    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range'
    });
    
    // Handle range requests for video seeking
    const range = req.headers.range;
    if (range) {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : parseInt(contentLength) - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${contentLength}`,
          'Content-Length': chunksize
        });
      }
    }
    
    // Stream the video content
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Google Drive proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy Google Drive video',
      details: error.message,
      fileId: fileId
    });
  }
});

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
    
    // Return our proxy URL instead of direct Google Drive URL
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/drive/proxy/${fileId}`;
    
    res.json({
      success: true,
      fileId: fileId,
      proxyUrl: proxyUrl,
      message: 'Video will be served through our proxy to avoid CORS issues.'
    });
    
  } catch (error) {
    console.error('Google Drive URL processing error:', error);
    res.status(500).json({ error: 'Failed to process Google Drive URL' });
  }
});

// New endpoint for Google Drive API integration
app.get('/api/drive/stream/:fileId', async (req, res) => {
  const fileId = req.params.fileId;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }
  
  try {
    // Get the direct download URL from Google Drive
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Fetch the video from Google Drive
    const response = await fetch(directUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Drive: ${response.status}`);
    }
    
    // Set appropriate headers for video streaming
    res.set({
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Stream the video content
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Google Drive stream error:', error);
    res.status(500).json({ error: 'Failed to stream Google Drive video' });
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
