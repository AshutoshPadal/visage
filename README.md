# Webcam Tracking (Face, Eyes, Hands, Objects)

A lightweight web tool that:
- Accesses your webcam (with permission)
- Tracks eyes and face (MediaPipe Face Mesh)
- Tracks hands (MediaPipe Hands)
- Recognizes objects (TensorFlow.js COCO-SSD)
- Lets you save snapshots (video + overlays)

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
