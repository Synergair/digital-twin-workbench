import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Video,
  Circle,
  Square,
  RefreshCw,
  Sun,
  SunDim,
  AlertTriangle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useCaptureStore } from '../store/captureStore';

interface CapturePreviewProps {
  mode: 'video' | 'photo';
  onCapture?: (blob: Blob) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  showGuides?: boolean;
  showQualityFeedback?: boolean;
}

interface QualityIndicators {
  isBlurry: boolean;
  isDark: boolean;
  hasExcessiveMotion: boolean;
  lightLevel: number;
  overallScore: number;
}

/**
 * CapturePreview - Camera preview with AR-style guides and quality feedback
 *
 * Features:
 * - Real-time camera access via MediaStream API
 * - AR overlay guides for capture positioning
 * - Quality feedback (blur, darkness, motion detection)
 * - Photo capture and video recording
 * - Device orientation tracking for coverage
 */
export function CapturePreview({
  mode,
  onCapture,
  onStartRecording,
  onStopRecording,
  showGuides = true,
  showQualityFeedback = true,
}: CapturePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [quality, setQuality] = useState<QualityIndicators>({
    isBlurry: false,
    isDark: false,
    hasExcessiveMotion: false,
    lightLevel: 1.0,
    overallScore: 100,
  });

  const {
    cameraStream,
    setCameraStream,
    setCameraError,
    updateQuality,
    updateDeviceOrientation,
    addVideoChunk,
    isRecording: storeIsRecording,
  } = useCaptureStore();

  // Initialize camera stream
  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: mode === 'video',
      });

      setCameraStream(stream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError((err as Error).message);
      setHasPermission(false);
    }
  }, [facingMode, mode, setCameraStream, setCameraError]);

  // Setup camera on mount
  useEffect(() => {
    initCamera();

    return () => {
      // Cleanup stream on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initCamera]);

  // Device orientation tracking
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        updateDeviceOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
      }
    };

    // Request permission on iOS
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        'requestPermission' in DeviceOrientationEvent) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [updateDeviceOrientation]);

  // Quality analysis loop
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastFrameData: ImageData | null = null;

    const analyzeFrame = () => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationId = requestAnimationFrame(analyzeFrame);
        return;
      }

      // Draw frame to canvas for analysis
      canvas.width = video.videoWidth / 4; // Downsample for performance
      canvas.height = video.videoHeight / 4;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frameData.data;

      // Calculate light level (average brightness)
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);
      const lightLevel = avgBrightness / 255;

      // Detect blur using Laplacian variance (simplified)
      let laplacianVar = 0;
      const width = canvas.width;
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const center = pixels[idx];
          const top = pixels[idx - width * 4];
          const bottom = pixels[idx + width * 4];
          const left = pixels[idx - 4];
          const right = pixels[idx + 4];
          const laplacian = center * 4 - top - bottom - left - right;
          laplacianVar += laplacian * laplacian;
        }
      }
      laplacianVar /= (canvas.width - 2) * (canvas.height - 2);
      const isBlurry = laplacianVar < 500;

      // Detect motion by comparing with last frame
      let hasExcessiveMotion = false;
      if (lastFrameData) {
        let diffSum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const diff = Math.abs(pixels[i] - lastFrameData.data[i]);
          diffSum += diff;
        }
        const avgDiff = diffSum / (pixels.length / 4);
        hasExcessiveMotion = avgDiff > 30;
      }
      lastFrameData = frameData;

      // Calculate overall quality score
      const isDark = lightLevel < 0.3;
      let score = 100;
      if (isBlurry) score -= 30;
      if (isDark) score -= 25;
      if (hasExcessiveMotion) score -= 20;

      const newQuality = {
        isBlurry,
        isDark,
        hasExcessiveMotion,
        lightLevel,
        overallScore: Math.max(0, score),
      };

      setQuality(newQuality);
      updateQuality(newQuality);

      animationId = requestAnimationFrame(analyzeFrame);
    };

    analyzeFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [hasPermission, updateQuality]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Switch camera
  const handleSwitchCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, [cameraStream]);

  // Capture photo
  const handleCapturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture?.(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  }, [onCapture]);

  // Start/stop video recording
  const handleToggleRecording = useCallback(() => {
    if (!cameraStream) return;

    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      onStopRecording?.();
    } else {
      // Start recording
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(cameraStream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          addVideoChunk(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        onCapture?.(blob);
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      onStartRecording?.();
    }
  }, [cameraStream, isRecording, onCapture, onStartRecording, onStopRecording, addVideoChunk]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Permission denied or loading
  if (hasPermission === null) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-400" />
          <p className="mt-3 text-sm text-white/60">Accès à la caméra...</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-white/20" />
          <p className="mt-3 font-medium text-white">Accès à la caméra refusé</p>
          <p className="mt-1 text-sm text-white/60">
            Veuillez autoriser l'accès à la caméra dans les paramètres
          </p>
          <button
            type="button"
            onClick={initCamera}
            className="mt-4 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={mode === 'photo'}
        className="h-full w-full object-cover"
      />

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* AR Guides overlay */}
      {showGuides && <CaptureGuides isRecording={isRecording} />}

      {/* Quality feedback */}
      {showQualityFeedback && (
        <QualityOverlay quality={quality} isRecording={isRecording} />
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="text-sm font-medium text-white">{formatDuration(recordingDuration)}</span>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
        {/* Switch camera */}
        <button
          type="button"
          onClick={handleSwitchCamera}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        {/* Capture/Record button */}
        {mode === 'photo' ? (
          <button
            type="button"
            onClick={handleCapturePhoto}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 active:scale-95"
          >
            <Circle className="h-14 w-14 text-slate-900" strokeWidth={3} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 ${
              isRecording ? 'bg-rose-500' : 'bg-white'
            }`}
          >
            {isRecording ? (
              <Square className="h-6 w-6 text-white" fill="white" />
            ) : (
              <Video className="h-6 w-6 text-slate-900" />
            )}
          </button>
        )}

        {/* Quality score indicator */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <span
            className={`text-sm font-bold ${
              quality.overallScore >= 70
                ? 'text-emerald-400'
                : quality.overallScore >= 40
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {quality.overallScore}
          </span>
        </div>
      </div>
    </div>
  );
}

function CaptureGuides({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Rule of thirds grid */}
      <div className="absolute inset-8 border border-white/20" />
      <div className="absolute inset-8">
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/10" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-white/10" />
        <div className="absolute left-0 top-1/3 h-px w-full bg-white/10" />
        <div className="absolute left-0 top-2/3 h-px w-full bg-white/10" />
      </div>

      {/* Corner markers */}
      {[
        'top-4 left-4',
        'top-4 right-4',
        'bottom-4 left-4',
        'bottom-4 right-4',
      ].map((position, i) => (
        <div
          key={i}
          className={`absolute ${position} h-8 w-8`}
        >
          <div className={`absolute ${i % 2 === 0 ? 'left-0' : 'right-0'} top-0 h-full w-0.5 bg-teal-400`} />
          <div className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} left-0 h-0.5 w-full bg-teal-400`} />
        </div>
      ))}

      {/* Level indicator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`h-px w-24 ${isRecording ? 'bg-rose-400' : 'bg-teal-400'}`} />
        <div className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isRecording ? 'bg-rose-400' : 'bg-teal-400'}`} />
      </div>
    </div>
  );
}

function QualityOverlay({
  quality,
  isRecording,
}: {
  quality: QualityIndicators;
  isRecording: boolean;
}) {
  const issues = [];
  if (quality.isBlurry) issues.push({ icon: AlertTriangle, text: 'Flou détecté', color: 'text-amber-400' });
  if (quality.isDark) issues.push({ icon: SunDim, text: 'Trop sombre', color: 'text-amber-400' });
  if (quality.hasExcessiveMotion) issues.push({ icon: AlertTriangle, text: 'Trop de mouvement', color: 'text-amber-400' });

  if (issues.length === 0 && !isRecording) {
    return (
      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 backdrop-blur-sm">
        <Check className="h-4 w-4 text-emerald-400" />
        <span className="text-sm text-emerald-400">Bon éclairage</span>
      </div>
    );
  }

  if (issues.length > 0) {
    return (
      <div className="absolute right-4 top-4 space-y-2">
        {issues.map((issue, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 backdrop-blur-sm"
          >
            <issue.icon className={`h-4 w-4 ${issue.color}`} />
            <span className={`text-sm ${issue.color}`}>{issue.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default CapturePreview;
