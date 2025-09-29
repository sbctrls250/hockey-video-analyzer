# Local Video Files

Place your local video files in this directory to use them with the hockey video analyzer.

## How to Use Local Videos

1. **Copy your video file** to this `videos/` directory
2. **Add a video** in the web interface
3. **Use this URL format**: `http://localhost:3001/videos/your-video-file.mp4`

## Example

If you have a file called `hockey-game.mp4` in this directory:
- Use URL: `http://localhost:3001/videos/hockey-game.mp4`

## Supported Formats

- MP4
- WebM
- MOV
- AVI
- MKV

## Security Note

This setup only works for local development. In production, you would use a proper file storage solution.
