// // Webcam Tracking: Face/Eyes, Hands, Objects

// const video = document.getElementById("video");
// const overlay = document.getElementById("overlay");
// const ctx = overlay.getContext("2d");

// const startBtn = document.getElementById("startBtn");
// const pauseBtn = document.getElementById("pauseBtn");
// const snapshotVideoBtn = document.getElementById("snapshotVideoBtn");
// const fpsEl = document.getElementById("fps");

// const toggleFace = document.getElementById("toggleFace");
// const toggleHands = document.getElementById("toggleHands");
// const toggleObjects = document.getElementById("toggleObjects");

// let running = false;
// let stream = null;
// let lastFpsTick = performance.now();
// let frameCount = 0;
// let fps = 0;

// let cocoModel = null;
// let hands = null;
// let faceMesh = null;

// const INFER_EVERY_N_FRAMES = 3;
// let inferFrameCounter = 0;

// let resizeObserver = new ResizeObserver(() => fitCanvases());
// resizeObserver.observe(overlay);
// window.addEventListener("resize", fitCanvases);

// function fitCanvases() {
//   const rect = video.getBoundingClientRect();
//   overlay.width = rect.width;
//   overlay.height = rect.height;
// }

// async function initCamera() {
//   stream = await navigator.mediaDevices.getUserMedia({
//     video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
//     audio: false
//   });
//   video.srcObject = stream;
//   await video.play();
//   fitCanvases();
// }

// async function initModels() {
//   cocoModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });

//   hands = new Hands({
//     locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
//   });
//   hands.setOptions({
//     selfieMode: true,
//     maxNumHands: 2,
//     modelComplexity: 1,
//     minDetectionConfidence: 0.6,
//     minTrackingConfidence: 0.6
//   });

//   faceMesh = new FaceMesh({
//     locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
//   });
//   faceMesh.setOptions({
//     selfieMode: true,
//     maxNumFaces: 1,
//     refineLandmarks: true,
//     minDetectionConfidence: 0.5,
//     minTrackingConfidence: 0.5
//   });
// }

// function stop() {
//   running = false;
//   pauseBtn.disabled = true;
//   startBtn.disabled = false;
// }

// function start() {
//   running = true;
//   startBtn.disabled = true;
//   pauseBtn.disabled = false;
//   snapshotVideoBtn.disabled = false;
//   requestAnimationFrame(loop);
// }

// function drawOverlays(predictions, faceResults, handsResults) {
//   const w = overlay.width;
//   const h = overlay.height;
//   ctx.clearRect(0, 0, w, h);
//   ctx.lineWidth = Math.max(2, w / 400);
//   ctx.font = `${Math.max(10, w / 40)}px ui-sans-serif`;
//   ctx.textBaseline = "top";

//   if (toggleObjects.checked && predictions) {
//     predictions.forEach(p => {
//       const [x, y, width, height] = p.bbox;
//       ctx.strokeStyle = "rgba(56,189,248,0.9)";
//       ctx.strokeRect(x, y, width, height);
//       const label = `${p.class} ${(p.score * 100).toFixed(0)}%`;
//       ctx.fillStyle = "rgba(56,189,248,0.9)";
//       ctx.fillText(label, x + 4, y + 4);
//     });
//   }

//   if (toggleFace.checked && faceResults?.multiFaceLandmarks) {
//     ctx.strokeStyle = "rgba(16,185,129,0.9)";
//     ctx.fillStyle = "rgba(16,185,129,0.9)";
//     const LMs = faceResults.multiFaceLandmarks[0];
//     if (LMs) {
//       const leftEyeIdx = [33, 7, 163, 144, 145, 153, 154, 155, 133];
//       const rightEyeIdx = [263, 249, 390, 373, 374, 380, 381, 382, 362];
//       function drawEye(indices, irisIdx) {
//         ctx.beginPath();
//         indices.forEach((i, k) => {
//           const pt = LMs[i];
//           const x = pt.x * w, y = pt.y * h;
//           if (k === 0) ctx.moveTo(x, y);
//           else ctx.lineTo(x, y);
//         });
//         ctx.closePath();
//         ctx.stroke();
//         const iris = LMs[irisIdx];
//         if (iris) {
//           ctx.beginPath();
//           ctx.arc(iris.x * w, iris.y * h, Math.max(2, w/200), 0, Math.PI*2);
//           ctx.fill();
//         }
//       }
//       drawEye(leftEyeIdx, 468);
//       drawEye(rightEyeIdx, 473);
//     }
//   }

//   if (toggleHands.checked && handsResults?.multiHandLandmarks) {
//     ctx.strokeStyle = "rgba(244,114,182,0.9)";
//     ctx.fillStyle = "rgba(244,114,182,0.9)";
//     handsResults.multiHandLandmarks.forEach(landmarks => {
//       const CONNECTIONS = [
//         [0,1],[1,2],[2,3],[3,4],
//         [0,5],[5,6],[6,7],[7,8],
//         [5,9],[9,10],[10,11],[11,12],
//         [9,13],[13,14],[14,15],[15,16],
//         [13,17],[0,17],[17,18],[18,19],[19,20]
//       ];
//       ctx.beginPath();
//       CONNECTIONS.forEach(([a,b]) => {
//         const pa = landmarks[a], pb = landmarks[b];
//         ctx.moveTo(pa.x * w, pa.y * h);
//         ctx.lineTo(pb.x * w, pb.y * h);
//       });
//       ctx.stroke();
//       landmarks.forEach(p => {
//         ctx.beginPath();
//         ctx.arc(p.x * w, p.y * h, Math.max(2, w/250), 0, Math.PI*2);
//         ctx.fill();
//       });
//     });
//   }
// }

// async function loop() {
//   if (!running) return;
//   frameCount++;
//   const now = performance.now();

//   if (now - lastFpsTick > 500) {
//     fps = Math.round((frameCount * 1000) / (now - lastFpsTick));
//     fpsEl.textContent = `FPS: ${fps}`;
//     lastFpsTick = now;
//     frameCount = 0;
//   }

//   let predictions = null, faceResults = null, handsResults = null;
//   inferFrameCounter = (inferFrameCounter + 1) % INFER_EVERY_N_FRAMES;
//   if (inferFrameCounter === 0) {
//     fitCanvases();

//     if (toggleObjects.checked && cocoModel) {
//       try { predictions = await cocoModel.detect(video); } catch {}
//     }

//     const facePromise = (toggleFace.checked && faceMesh)
//       ? faceMesh.send({ image: video }).then(r => r).catch(() => null)
//       : Promise.resolve(null);

//     const handsPromise = (toggleHands.checked && hands)
//       ? hands.send({ image: video }).then(r => r).catch(() => null)
//       : Promise.resolve(null);

//     [faceResults, handsResults] = await Promise.all([facePromise, handsPromise]);
//   }

//   drawOverlays(predictions, faceResults, handsResults);

//   requestAnimationFrame(loop);
// }

// // UI
// startBtn.addEventListener("click", async () => {
//   if (!stream) {
//     await initCamera();
//     await initModels();
//   }
//   start();
// });
// pauseBtn.addEventListener("click", () => stop());

// snapshotVideoBtn.addEventListener("click", () => {
//   const rect = video.getBoundingClientRect();
//   const canvas = document.createElement("canvas");
//   canvas.width = rect.width; canvas.height = rect.height;
//   const c = canvas.getContext("2d");
//   c.drawImage(video, 0, 0, rect.width, rect.height);
//   c.drawImage(overlay, 0, 0);
//   const url = canvas.toDataURL("image/png");
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = "snapshot.png";
//   a.click();
// });

// if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//   startBtn.disabled = true;
//   startBtn.textContent = "Webcam not supported";
// }

// static/main.js
// Minimal realtime tracking: MediaPipe FaceMesh + Hands + TFJS coco-ssd

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const snapshotVideoBtn = document.getElementById("snapshotVideoBtn");
const fpsEl = document.getElementById("fps");

const toggleFace = document.getElementById("toggleFace");
const toggleHands = document.getElementById("toggleHands");
const toggleObjects = document.getElementById("toggleObjects");

let running = false;
let stream = null;
let lastFpsTick = performance.now();
let frameCount = 0;
let fps = 0;

let cocoModel = null;
let hands = null;
let faceMesh = null;

let latestHandsResults = null;
let latestFaceResults = null;

const INFER_EVERY_N_FRAMES = 3;
let inferFrameCounter = 0;

// Keep overlay size in sync
function fitCanvases() {
  const rect = video.getBoundingClientRect();
  overlay.width = Math.max(1, rect.width);
  overlay.height = Math.max(1, rect.height);
}
new ResizeObserver(fitCanvases).observe(document.body);
window.addEventListener("resize", fitCanvases);

async function initCamera() {
  // Request the camera
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
  await video.play();
  fitCanvases();
}

async function initModels() {
  // Load coco-ssd
  cocoModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });

  // Setup MediaPipe Hands
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
  hands.onResults((results) => {
    latestHandsResults = results;
  });

  // Setup MediaPipe FaceMesh
  faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({
    selfieMode: true,
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  faceMesh.onResults((results) => {
    latestFaceResults = results;
  });
}

function stop() {
  running = false;
  pauseBtn.disabled = true;
  startBtn.disabled = false;
  snapshotVideoBtn.disabled = true;
}

function start() {
  running = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  snapshotVideoBtn.disabled = false;
  requestAnimationFrame(loop);
}

function drawOverlays(predictions) {
  const w = overlay.width;
  const h = overlay.height;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = Math.max(2, w / 400);
  ctx.textBaseline = "top";

  // Draw object boxes
  if (toggleObjects.checked && predictions) {
    ctx.font = `${Math.max(12, w / 40)}px ui-sans-serif`;
    ctx.fillStyle = "rgba(56,189,248,0.9)";
    ctx.strokeStyle = "rgba(56,189,248,0.9)";
    predictions.forEach(p => {
      const [x, y, width, height] = p.bbox;
      ctx.strokeRect(x, y, width, height);
      const label = `${p.class} ${(p.score * 100).toFixed(0)}%`;
      ctx.fillText(label, x + 4, y + 4);
    });
  }

  // Face (eyes)
  if (toggleFace.checked && latestFaceResults?.multiFaceLandmarks?.length) {
    ctx.strokeStyle = "rgba(16,185,129,0.9)";
    ctx.fillStyle = "rgba(16,185,129,0.9)";
    const LMs = latestFaceResults.multiFaceLandmarks[0];

    const leftEyeIdx = [33, 7, 163, 144, 145, 153, 154, 155, 133];
    const rightEyeIdx = [263, 249, 390, 373, 374, 380, 381, 382, 362];

    function drawEye(indices, irisIndex) {
      ctx.beginPath();
      indices.forEach((i, k) => {
        const pt = LMs[i];
        const x = pt.x * w;
        const y = pt.y * h;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
      const iris = LMs[irisIndex];
      if (iris) {
        ctx.beginPath();
        ctx.arc(iris.x * w, iris.y * h, Math.max(2, w / 200), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawEye(leftEyeIdx, 468);
    drawEye(rightEyeIdx, 473);
  }

  // Hands
  if (toggleHands.checked && latestHandsResults?.multiHandLandmarks?.length) {
    ctx.strokeStyle = "rgba(244,114,182,0.95)";
    ctx.fillStyle = "rgba(244,114,182,0.95)";

    latestHandsResults.multiHandLandmarks.forEach(landmarks => {
      const CONNECTIONS = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[0,17],[17,18],[18,19],[19,20]
      ];
      ctx.beginPath();
      CONNECTIONS.forEach(([a,b]) => {
        const pa = landmarks[a], pb = landmarks[b];
        ctx.moveTo(pa.x * w, pa.y * h);
        ctx.lineTo(pb.x * w, pb.y * h);
      });
      ctx.stroke();

      landmarks.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, Math.max(2, w / 250), 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
}

async function loop() {
  if (!running) return;
  frameCount++;
  const now = performance.now();

  if (now - lastFpsTick > 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsTick));
    fpsEl.textContent = `FPS: ${fps}`;
    lastFpsTick = now;
    frameCount = 0;
  }

  let predictions = null;
  // Throttle heavy inference
  inferFrameCounter = (inferFrameCounter + 1) % INFER_EVERY_N_FRAMES;
  if (inferFrameCounter === 0) {
    // Objects (coco)
    if (toggleObjects.checked && cocoModel) {
      try {
        predictions = await cocoModel.detect(video);
      } catch (err) {
        // ignore detection errors (network or decode)
        predictions = null;
      }
    }

    // Send frames to MediaPipe. We do not *await* because onResults sets latest results.
    if (toggleFace.checked && faceMesh) {
      try { await faceMesh.send({ image: video }); } catch {}
    }
    if (toggleHands.checked && hands) {
      try { await hands.send({ image: video }); } catch {}
    }
  }

  drawOverlays(predictions);

  requestAnimationFrame(loop);
}

// UI handlers
startBtn.addEventListener("click", async () => {
  try {
    if (!stream) {
      await initCamera();
      await initModels();
    }
    start();
  } catch (err) {
    console.error("Failed to start camera/models:", err);
    alert("Failed to access camera. Check console for details and ensure you allowed camera permissions and are running on http://localhost:8000");
  }
});

pauseBtn.addEventListener("click", () => {
  stop();
});

snapshotVideoBtn.addEventListener("click", () => {
  const rect = video.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const c = canvas.getContext("2d");
  c.drawImage(video, 0, 0, rect.width, rect.height);
  c.drawImage(overlay, 0, 0);
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snapshot.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
});

// Feature detection
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  startBtn.disabled = true;
  startBtn.textContent = "Webcam not supported in this browser";
}

