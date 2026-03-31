import { useEffect, useCallback, useRef } from 'react';
import { useCaptureStore } from '../store/captureStore';

interface UseCoverageTrackingOptions {
  /** Enable tracking */
  enabled?: boolean;
  /** Minimum angle change to register (degrees) */
  minAngleChange?: number;
  /** Smoothing factor for orientation data (0-1) */
  smoothing?: number;
}

interface UseCoverageTrackingReturn {
  /** Current device orientation */
  orientation: { alpha: number; beta: number; gamma: number } | null;
  /** Overall coverage percentage (0-100) */
  coverage: number;
  /** Whether orientation permission is granted */
  hasPermission: boolean;
  /** Request orientation permission (iOS) */
  requestPermission: () => Promise<boolean>;
  /** Reset coverage tracking */
  resetCoverage: () => void;
  /** Get coverage for specific angle ranges */
  getCoverageInRange: (startAngle: number, endAngle: number) => number;
}

/**
 * Hook for tracking device orientation and calculating spatial coverage
 */
export function useCoverageTracking(
  options: UseCoverageTrackingOptions = {}
): UseCoverageTrackingReturn {
  const {
    enabled = true,
    minAngleChange = 2,
    smoothing = 0.3,
  } = options;

  const lastAlpha = useRef<number | null>(null);
  const hasPermissionRef = useRef<boolean>(false);

  const {
    deviceOrientation,
    coverageAngles,
    updateDeviceOrientation,
    updateCoverage,
    resetCoverage,
    getOverallCoverage,
  } = useCaptureStore();

  // Smooth orientation values
  const smoothOrientation = useCallback(
    (
      current: { alpha: number; beta: number; gamma: number },
      previous: { alpha: number; beta: number; gamma: number } | null
    ) => {
      if (!previous) return current;

      return {
        alpha: previous.alpha + (current.alpha - previous.alpha) * smoothing,
        beta: previous.beta + (current.beta - previous.beta) * smoothing,
        gamma: previous.gamma + (current.gamma - previous.gamma) * smoothing,
      };
    },
    [smoothing]
  );

  // Handle orientation events
  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (!enabled) return;
      if (event.alpha === null || event.beta === null || event.gamma === null) return;

      const raw = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };

      const smoothed = smoothOrientation(raw, deviceOrientation);
      updateDeviceOrientation(smoothed);

      // Update coverage if angle changed enough
      if (lastAlpha.current === null) {
        lastAlpha.current = smoothed.alpha;
        updateCoverage(smoothed.alpha);
      } else {
        const angleDiff = Math.abs(smoothed.alpha - lastAlpha.current);
        if (angleDiff >= minAngleChange || angleDiff >= 358) {
          updateCoverage(smoothed.alpha);
          lastAlpha.current = smoothed.alpha;
        }
      }
    },
    [enabled, deviceOrientation, smoothOrientation, updateDeviceOrientation, updateCoverage, minAngleChange]
  );

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      return false;
    }

    // Check if permission API exists (iOS)
    if ('requestPermission' in DeviceOrientationEvent) {
      try {
        const permission = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        hasPermissionRef.current = permission === 'granted';
        return hasPermissionRef.current;
      } catch {
        hasPermissionRef.current = false;
        return false;
      }
    }

    // Non-iOS devices don't need permission
    hasPermissionRef.current = true;
    return true;
  }, []);

  // Setup orientation listener
  useEffect(() => {
    if (!enabled) return;

    const setup = async () => {
      const permitted = await requestPermission();
      if (permitted) {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    setup();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, handleOrientation, requestPermission]);

  // Calculate coverage in specific angle range
  const getCoverageInRange = useCallback(
    (startAngle: number, endAngle: number): number => {
      const start = ((startAngle % 360) + 360) % 360;
      const end = ((endAngle % 360) + 360) % 360;

      let covered = 0;
      let total = 0;

      if (start <= end) {
        for (let i = start; i <= end; i++) {
          total++;
          if (coverageAngles[i] > 0) covered++;
        }
      } else {
        // Handle wrap-around
        for (let i = start; i < 360; i++) {
          total++;
          if (coverageAngles[i] > 0) covered++;
        }
        for (let i = 0; i <= end; i++) {
          total++;
          if (coverageAngles[i] > 0) covered++;
        }
      }

      return total > 0 ? Math.round((covered / total) * 100) : 0;
    },
    [coverageAngles]
  );

  return {
    orientation: deviceOrientation,
    coverage: getOverallCoverage(),
    hasPermission: hasPermissionRef.current,
    requestPermission,
    resetCoverage,
    getCoverageInRange,
  };
}

export default useCoverageTracking;
