import { useEffect, useRef, useCallback, useState } from 'react';
import { useCaptureStore } from '../store/captureStore';

interface QualityMetrics {
  isBlurry: boolean;
  isDark: boolean;
  hasExcessiveMotion: boolean;
  lightLevel: number;
  overallScore: number;
  sharpness: number;
  motionLevel: number;
}

interface UseQualityAnalysisOptions {
  /** Enable analysis */
  enabled?: boolean;
  /** Analysis frequency (frames) */
  frameSkip?: number;
  /** Blur detection threshold */
  blurThreshold?: number;
  /** Darkness threshold (0-1) */
  darknessThreshold?: number;
  /** Motion detection threshold */
  motionThreshold?: number;
}

interface UseQualityAnalysisReturn {
  /** Current quality metrics */
  metrics: QualityMetrics;
  /** Whether analysis is running */
  isAnalyzing: boolean;
  /** Start analysis on a video element */
  analyzeStream: (video: HTMLVideoElement) => void;
  /** Stop analysis */
  stopAnalysis: () => void;
  /** Get quality issues as user-friendly messages */
  getQualityIssues: () => string[];
}

/**
 * Hook for real-time video quality analysis
 */
export function useQualityAnalysis(
  options: UseQualityAnalysisOptions = {}
): UseQualityAnalysisReturn {
  const {
    enabled = true,
    frameSkip = 5,
    blurThreshold = 500,
    darknessThreshold = 0.25,
    motionThreshold = 25,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastFrameRef = useRef<ImageData | null>(null);
  const frameCountRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<QualityMetrics>({
    isBlurry: false,
    isDark: false,
    hasExcessiveMotion: false,
    lightLevel: 1.0,
    overallScore: 100,
    sharpness: 1.0,
    motionLevel: 0,
  });

  const { updateQuality, addQualityIssue } = useCaptureStore();

  // Initialize canvas for image processing
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    ctxRef.current = canvasRef.current.getContext('2d', { willReadFrequently: true });
  }, []);

  // Analyze a single frame
  const analyzeFrame = useCallback(
    (video: HTMLVideoElement) => {
      if (!enabled || !ctxRef.current || !canvasRef.current) return;
      if (video.readyState < video.HAVE_ENOUGH_DATA) return;

      // Skip frames for performance
      frameCountRef.current++;
      if (frameCountRef.current % frameSkip !== 0) return;

      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      // Downsample for performance
      const scale = 0.25;
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frameData.data;

      // Calculate brightness (light level)
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // Perceived brightness formula
        totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);
      const lightLevel = avgBrightness / 255;
      const isDark = lightLevel < darknessThreshold;

      // Detect blur using Laplacian variance
      let laplacianSum = 0;
      let laplacianSqSum = 0;
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const center = pixels[idx];
          const top = pixels[idx - width * 4];
          const bottom = pixels[idx + width * 4];
          const left = pixels[idx - 4];
          const right = pixels[idx + 4];

          const laplacian = Math.abs(center * 4 - top - bottom - left - right);
          laplacianSum += laplacian;
          laplacianSqSum += laplacian * laplacian;
        }
      }

      const pixelCount = (width - 2) * (height - 2);
      const laplacianMean = laplacianSum / pixelCount;
      const laplacianVar = (laplacianSqSum / pixelCount) - (laplacianMean * laplacianMean);
      const sharpness = Math.min(1, laplacianVar / blurThreshold);
      const isBlurry = laplacianVar < blurThreshold;

      // Detect motion by comparing with previous frame
      let motionLevel = 0;
      if (lastFrameRef.current && lastFrameRef.current.data.length === pixels.length) {
        let diffSum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          diffSum += Math.abs(pixels[i] - lastFrameRef.current.data[i]);
        }
        motionLevel = diffSum / (pixels.length / 4);
      }
      lastFrameRef.current = frameData;
      const hasExcessiveMotion = motionLevel > motionThreshold;

      // Calculate overall quality score
      let score = 100;
      if (isBlurry) score -= 30;
      if (isDark) score -= 25;
      if (hasExcessiveMotion) score -= 20;
      score = Math.max(0, score);

      const newMetrics: QualityMetrics = {
        isBlurry,
        isDark,
        hasExcessiveMotion,
        lightLevel,
        overallScore: score,
        sharpness,
        motionLevel,
      };

      setMetrics(newMetrics);
      updateQuality({
        isBlurry,
        isDark,
        hasExcessiveMotion,
        lightLevel,
        overallScore: score,
      });

      // Add quality issues to store if severe
      if (score < 50 && frameCountRef.current % 30 === 0) {
        if (isBlurry) {
          addQualityIssue({
            type: 'blur',
            severity: score < 30 ? 'error' : 'warning',
            message: 'Image floue - essayez de stabiliser l\'appareil',
          });
        }
        if (isDark) {
          addQualityIssue({
            type: 'darkness',
            severity: score < 30 ? 'error' : 'warning',
            message: 'Éclairage insuffisant - cherchez plus de lumière',
          });
        }
        if (hasExcessiveMotion) {
          addQualityIssue({
            type: 'motion',
            severity: 'warning',
            message: 'Mouvement trop rapide - ralentissez',
          });
        }
      }
    },
    [enabled, frameSkip, blurThreshold, darknessThreshold, motionThreshold, updateQuality, addQualityIssue]
  );

  // Start analysis loop
  const analyzeStream = useCallback(
    (video: HTMLVideoElement) => {
      initCanvas();
      videoRef.current = video;
      setIsAnalyzing(true);
      frameCountRef.current = 0;
      lastFrameRef.current = null;

      const loop = () => {
        if (videoRef.current) {
          analyzeFrame(videoRef.current);
        }
        animationRef.current = requestAnimationFrame(loop);
      };

      animationRef.current = requestAnimationFrame(loop);
    },
    [initCanvas, analyzeFrame]
  );

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnalyzing(false);
    videoRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, [stopAnalysis]);

  // Get quality issues as messages
  const getQualityIssues = useCallback((): string[] => {
    const issues: string[] = [];
    if (metrics.isBlurry) issues.push('Image floue');
    if (metrics.isDark) issues.push('Éclairage insuffisant');
    if (metrics.hasExcessiveMotion) issues.push('Mouvement excessif');
    return issues;
  }, [metrics]);

  return {
    metrics,
    isAnalyzing,
    analyzeStream,
    stopAnalysis,
    getQualityIssues,
  };
}

export default useQualityAnalysis;
