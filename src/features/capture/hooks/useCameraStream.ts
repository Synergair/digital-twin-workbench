import { useEffect, useCallback, useRef } from 'react';
import { useCaptureStore } from '../store/captureStore';

interface UseCameraStreamOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  audio?: boolean;
}

interface UseCameraStreamReturn {
  stream: MediaStream | null;
  error: string | null;
  isActive: boolean;
  switchCamera: () => Promise<void>;
  stopCamera: () => void;
  takePhoto: () => Promise<Blob | null>;
}

/**
 * Hook for managing camera stream access
 */
export function useCameraStream(options: UseCameraStreamOptions = {}): UseCameraStreamReturn {
  const {
    facingMode: initialFacingMode = 'environment',
    width = 1920,
    height = 1080,
    audio = false,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFacingMode = useRef(initialFacingMode);

  const {
    cameraStream,
    cameraError,
    setCameraStream,
    setCameraError,
  } = useCaptureStore();

  // Initialize camera
  const initCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    try {
      // Stop existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio,
      });

      currentFacingMode.current = facingMode;
      setCameraStream(stream);

      // Connect to video element if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      const error = err as Error;
      setCameraError(error.message);
      throw error;
    }
  }, [cameraStream, width, height, audio, setCameraStream, setCameraError]);

  // Initialize on mount
  useEffect(() => {
    initCamera(initialFacingMode);

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode.current === 'environment' ? 'user' : 'environment';
    await initCamera(newFacingMode);
  }, [initCamera]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream, setCameraStream]);

  // Capture photo
  const takePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!cameraStream) return null;

    // Get video track settings
    const videoTrack = cameraStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const captureWidth = settings.width || width;
    const captureHeight = settings.height || height;

    // Create canvas if needed
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = captureWidth;
    canvas.height = captureHeight;

    // Draw frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Create video element to capture frame
    const video = document.createElement('video');
    video.srcObject = cameraStream;
    video.muted = true;
    await video.play();

    ctx.drawImage(video, 0, 0, captureWidth, captureHeight);
    video.pause();

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.9
      );
    });
  }, [cameraStream, width, height]);

  return {
    stream: cameraStream,
    error: cameraError,
    isActive: !!cameraStream,
    switchCamera,
    stopCamera,
    takePhoto,
  };
}

export default useCameraStream;
