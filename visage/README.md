# Webcam → Emoji ASCII + Eye/Hand Tracking + Object Recognition

A lightweight web tool that:
- Accesses your webcam (with permission)
- Converts each video frame to emoji-based ASCII art (rendered in a monospace grid)
- Tracks eyes and hands (MediaPipe Face Mesh + Hands)
- Recognizes objects (TensorFlow.js COCO-SSD)
- Lets you save snapshots (ASCII rendering or live preview with overlays)
- Adapts to window size and keeps aspect ratio

### Tech
- HTML + Tailwind (via CDN)
- JavaScript in the browser (no server-side video processing for performance)
- MediaPipe (Face Mesh + Hands)
- TensorFlow.js COCO-SSD (object detection)
- Python (Flask) just to serve the page

> Tip: This is designed for local/offline model hosting via public CDNs. For production, consider pinning exact versions and hosting the model assets yourself.

## Run locally (Python/Flask)
```bash
pip install -r requirements.txt
python app.py
# open http://localhost:8000/
```
Allow webcam permission in the browser. Use Chrome or Edge for best performance.

## Notes on performance
- Frames are downsampled before ASCII conversion.
- ML inference is throttled (every Nth frame).
- Buffers/canvases are reused and layout is minimized.
- Disable some overlays or reduce the "Resolution scale" if FPS drops.
