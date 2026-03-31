import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapNavigationStore, type ViewHierarchyLevel, type TransitionState } from '../store/mapNavigationStore';

interface TransitionAnimatorProps {
  /** Current view being displayed */
  currentView: 'map' | '3dtiles' | 'streetview' | 'viewer';
  /** Callback when transition requests view change */
  onViewChange: (view: 'map' | '3dtiles' | 'streetview' | 'viewer') => void;
  /** Callback for camera animation during transitions */
  onCameraAnimate?: (params: CameraAnimationParams) => void;
  /** Children to render (map/viewer components) */
  children: React.ReactNode;
}

interface CameraAnimationParams {
  phase: TransitionState['phase'];
  progress: number;
  fromLevel: ViewHierarchyLevel['level'];
  toLevel: ViewHierarchyLevel['level'];
  targetPosition?: [number, number, number];
  targetZoom?: number;
}

interface TransitionPhaseConfig {
  duration: number;
  easing: (t: number) => number;
  onStart?: () => void;
  onComplete?: () => void;
}

// Easing functions
const easings = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

/**
 * TransitionAnimator - Orchestrates smooth view transitions between map levels
 *
 * Transition phases:
 * 1. Zoom (800ms) - Map zooms to property
 * 2. Crossfade (400ms) - Fade to Google 3D Tiles
 * 3. Descend (600ms) - Camera descends through exterior
 * 4. Enter (500ms) - Crossfade to interior viewer
 */
export function TransitionAnimator({
  currentView,
  onViewChange,
  onCameraAnimate,
  children,
}: TransitionAnimatorProps) {
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const {
    transitionState,
    updateTransitionProgress,
    completeTransition,
  } = useMapNavigationStore();

  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [viewA, setViewA] = useState<'map' | '3dtiles' | 'streetview' | 'viewer'>(currentView);
  const [viewB, setViewB] = useState<'map' | '3dtiles' | 'streetview' | 'viewer' | null>(null);
  const [crossfadeProgress, setCrossfadeProgress] = useState(0);

  // Phase configurations
  const getPhaseConfigs = useCallback(
    (from: ViewHierarchyLevel, to: ViewHierarchyLevel): Record<TransitionState['phase'], TransitionPhaseConfig> => {
      const isEnteringBuilding =
        (from.level === 'property' || from.level === 'streetview') &&
        (to.level === 'building' || to.level === 'unit');

      const isExitingBuilding =
        (from.level === 'building' || from.level === 'unit') &&
        (to.level === 'property' || to.level === 'portfolio');

      return {
        zoom: {
          duration: 800,
          easing: easings.easeOutCubic,
          onStart: () => {
            if (to.level === 'property' && from.level === 'portfolio') {
              // Zooming to property from portfolio
              setOverlayOpacity(0);
            }
          },
        },
        crossfade: {
          duration: 400,
          easing: easings.easeInOutCubic,
          onStart: () => {
            if (isEnteringBuilding) {
              setViewB('3dtiles');
            }
          },
          onComplete: () => {
            if (isEnteringBuilding) {
              setViewA('3dtiles');
              setViewB(null);
              setCrossfadeProgress(0);
            }
          },
        },
        descend: {
          duration: 600,
          easing: easings.easeOutExpo,
          onStart: () => {
            // Camera starts descending through the 3D tiles building
          },
        },
        enter: {
          duration: 500,
          easing: easings.easeInOutQuad,
          onStart: () => {
            if (isEnteringBuilding) {
              setViewB('viewer');
            } else if (isExitingBuilding) {
              setViewB(to.level === 'portfolio' ? 'map' : '3dtiles');
            }
          },
          onComplete: () => {
            if (isEnteringBuilding) {
              setViewA('viewer');
              onViewChange('viewer');
            } else if (isExitingBuilding) {
              setViewA(to.level === 'portfolio' ? 'map' : '3dtiles');
              onViewChange(to.level === 'portfolio' ? 'map' : '3dtiles');
            }
            setViewB(null);
            setCrossfadeProgress(0);
          },
        },
      };
    },
    [onViewChange]
  );

  // Run animation loop
  useEffect(() => {
    if (!transitionState) return;

    const phases: TransitionState['phase'][] = ['zoom', 'crossfade', 'descend', 'enter'];
    const phaseConfigs = getPhaseConfigs(transitionState.fromView, transitionState.toView);

    let currentPhaseIndex = phases.indexOf(transitionState.phase);
    let phaseStartTime: number | null = null;

    const animate = (timestamp: number) => {
      if (phaseStartTime === null) {
        phaseStartTime = timestamp;
        phaseConfigs[phases[currentPhaseIndex]].onStart?.();
      }

      const currentPhase = phases[currentPhaseIndex];
      const config = phaseConfigs[currentPhase];
      const elapsed = timestamp - phaseStartTime;
      const rawProgress = Math.min(1, elapsed / config.duration);
      const easedProgress = config.easing(rawProgress);

      // Update progress
      const totalProgress = (currentPhaseIndex + easedProgress) / phases.length;
      updateTransitionProgress(totalProgress, currentPhase);

      // Update crossfade for view transitions
      if (currentPhase === 'crossfade' || currentPhase === 'enter') {
        setCrossfadeProgress(easedProgress);
      }

      // Update overlay opacity
      if (currentPhase === 'descend') {
        setOverlayOpacity(easedProgress * 0.3);
      }

      // Notify camera animation handler
      onCameraAnimate?.({
        phase: currentPhase,
        progress: easedProgress,
        fromLevel: transitionState.fromView.level,
        toLevel: transitionState.toView.level,
      });

      // Check if phase complete
      if (rawProgress >= 1) {
        config.onComplete?.();

        // Move to next phase or complete
        if (currentPhaseIndex < phases.length - 1) {
          currentPhaseIndex++;
          phaseStartTime = null;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Transition complete
          completeTransition();
          setOverlayOpacity(0);
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [transitionState, getPhaseConfigs, updateTransitionProgress, completeTransition, onCameraAnimate]);

  // Sync current view when not transitioning
  useEffect(() => {
    if (!transitionState) {
      setViewA(currentView);
    }
  }, [currentView, transitionState]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Primary view */}
      <div
        className="absolute inset-0"
        style={{
          opacity: viewB ? 1 - crossfadeProgress : 1,
          zIndex: 10,
        }}
      >
        {children}
      </div>

      {/* Secondary view (during crossfade) */}
      {viewB && (
        <div
          className="absolute inset-0"
          style={{
            opacity: crossfadeProgress,
            zIndex: 20,
          }}
        >
          {/* This would render the appropriate view component */}
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <p className="text-white/40">Loading {viewB}...</p>
          </div>
        </div>
      )}

      {/* Transition overlay */}
      {overlayOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-slate-900"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Vignette effect during transitions */}
      {transitionState && (
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${
              transitionState.progress * 0.4
            }) 100%)`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Hook to get transition-aware camera parameters
 */
export function useTransitionCamera() {
  const { transitionState, viewHierarchy } = useMapNavigationStore();
  const [cameraParams, setCameraParams] = useState<CameraAnimationParams | null>(null);

  useEffect(() => {
    if (transitionState) {
      setCameraParams({
        phase: transitionState.phase,
        progress: transitionState.progress,
        fromLevel: transitionState.fromView.level,
        toLevel: transitionState.toView.level,
      });
    } else {
      setCameraParams(null);
    }
  }, [transitionState]);

  return {
    isTransitioning: !!transitionState,
    cameraParams,
    currentLevel: viewHierarchy.level,
  };
}

export default TransitionAnimator;
