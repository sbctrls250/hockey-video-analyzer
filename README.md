# Hockey Video Analyzer

A modern web-based video analysis application designed specifically for hockey game analysis. Features advanced playback controls, multi-timeline event marking, and automatic timeline persistence. Now includes a full website with video management, individual video pages, and automatic saving.

## Features

### 🎥 Advanced Video Player
- **Speed Control**: Adjust playback from 0.25x to 4x speed
- **Scrubbing Wheel**: Mouse wheel control for frame-by-frame to 2x speed
- **Custom Controls**: Volume, mute, and progress bar with precise seeking

### 📊 Multi-Timeline System
- **Up to 5 Timelines**: Create multiple analysis tracks
- **Event Marking**: Mark point events (single timestamp) or duration events (start/end)
- **Color Coding**: Visual categorization with customizable colors
- **Real-time Updates**: Events sync with video playback

### 💾 Data Management
- **Automatic Saving**: Timeline changes are automatically saved to the server
- **Video Management**: Create, view, and delete videos through the web interface
- **Timeline Persistence**: Each video has its own timeline JSON file stored on the server
- **Export/Import**: Save and load analysis sessions

### 🌐 Website Features
- **Home Page**: View all your videos in a clean, organized list
- **Add Video Page**: Create new videos with name and location
- **Individual Video Pages**: Each video has its own dedicated analysis page
- **Automatic Timeline Creation**: Timeline JSON files are created automatically for each video
- **Real-time Saving**: Timeline changes are saved automatically as you work

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the full application** (both frontend and backend):
   ```bash
   # On Windows
   start.bat
   
   # On macOS/Linux
   ./start.sh
   
   # Or manually
   npm run dev:full
   ```

3. **Open your browser**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

### Building for Production

```bash
npm run build
```

## Usage

### Adding a Video
1. Go to the **Home Page** and click "Add Video"
2. Enter a name for your video (e.g., "Game 1 - Team A vs Team B")
3. Provide the video location:
   - For testing: Use a local file path (file:///path/to/video.mp4)
   - For production: Use a web URL (https://example.com/video.mp4)
4. Click "Create Video" - a timeline JSON file will be created automatically

### Managing Videos
1. **Home Page**: View all your videos in a grid layout
2. **Open Video**: Click "Open" on any video to start analysis
3. **Delete Video**: Click the trash icon to remove a video and its timeline data

### Video Analysis
1. **Video Player**: Use the advanced controls for playback, speed adjustment, and scrubbing
2. **Creating Timelines**: Click "Add Timeline" in the Timeline Manager
3. **Marking Events**: 
   - Select an active timeline
   - Click "Add Event" and choose event type (Point or Duration)
   - Select a color and add a label
   - Click on the timeline to place the event
4. **Automatic Saving**: All timeline changes are saved automatically to the server

### Scrubbing Control
- **Mouse Wheel**: Hover over video and scroll to scrub
- **Speed Range**: 0.1x (frame-by-frame) to 2x speed
- **Visual Feedback**: Color-coded speed indicators

## Technical Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript, React Router for navigation
- **Backend**: Express.js with TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tooling**: Vite
- **Video Playback**: HTML5 Video API
- **Data Storage**: JSON files on server (easily replaceable with database)

### Project Structure
```
├── src/
│   ├── components/          # React components
│   │   ├── VideoPlayer/    # Main video player
│   │   ├── TimelineManager/ # Timeline management
│   │   ├── ScrubbingWheel/ # Custom scrubbing control
│   │   └── FileLoader/     # File loading interface
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Video list and management
│   │   ├── AddVideoPage.tsx # Add new video form
│   │   └── VideoPage.tsx   # Individual video analysis
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript definitions
│   └── utils/              # Helper functions
├── server/                 # Backend API
│   ├── index.ts           # Express server
│   └── tsconfig.json      # Server TypeScript config
└── data/                  # Server data storage (auto-created)
    ├── videos.json        # Video metadata
    └── timelines/         # Timeline JSON files
```

### State Management
- **Video Store**: Video playback state and controls
- **Event Store**: Timeline events and management
- **Server Storage**: JSON files on server with automatic saving
- **React Router**: Client-side routing between pages

## Development

### Key Components

#### Pages
- **HomePage**: Video list with management capabilities
- **AddVideoPage**: Form to create new videos with timeline initialization
- **VideoPage**: Individual video analysis with existing player and timeline components

#### VideoPlayer
- Custom video controls with speed adjustment
- Scrubbing wheel integration
- Real-time state synchronization

#### TimelineManager
- Multi-timeline creation and management
- Event marking interface
- Visual timeline representation
- Automatic saving integration

#### Backend API
- **Express Server**: RESTful API for video and timeline management
- **File Storage**: JSON-based storage (easily replaceable with database)
- **Auto-save**: Timeline changes automatically persisted

### Adding New Features

1. **New Event Types**: Extend `TimelineEvent` type
2. **Cloud Storage**: Implement in `FileLoader` component
3. **Export Formats**: Add to data persistence layer
4. **Keyboard Shortcuts**: Add to video player controls

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## API Endpoints

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get specific video
- `POST /api/videos` - Create new video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video

### Timelines
- `GET /api/videos/:id/timelines` - Get timelines for video
- `PUT /api/videos/:id/timelines` - Save timelines for video

## Roadmap

- [x] Multi-page website with routing
- [x] Video management system
- [x] Automatic timeline saving
- [x] Backend API with Express
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication
- [ ] Google Drive API integration
- [ ] iCloud WebDAV support
- [ ] Keyboard shortcuts
- [ ] Export to JSON/CSV
- [ ] Video annotations overlay
- [ ] Collaborative analysis
- [ ] Mobile responsive design
- [ ] PWA support

