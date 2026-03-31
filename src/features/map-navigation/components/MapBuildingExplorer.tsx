import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Building2, Map, Eye, Navigation } from 'lucide-react';
import { useMapNavigationStore, type ViewHierarchyLevel } from '../store/mapNavigationStore';

interface MapBuildingExplorerProps {
  onEnterBuilding?: (propertyId: string) => void;
  onExitToPortfolio?: () => void;
  children?: React.ReactNode;
}

/**
 * MapBuildingExplorer - Main orchestrator for map → building navigation
 *
 * Handles the view hierarchy:
 * - Portfolio (all properties on map)
 * - Property (single building on satellite)
 * - Street View (Google Street View with building entry)
 * - Building (3D interior viewer)
 * - Unit (focused on single unit)
 */
export function MapBuildingExplorer({
  onEnterBuilding,
  onExitToPortfolio,
  children,
}: MapBuildingExplorerProps) {
  const {
    viewHierarchy,
    transitionState,
    selectedPropertyId,
    propertyMapType,
    navigateToPortfolio,
    navigateToProperty,
    enterBuilding,
    navigateBack,
    setPropertyMapType,
    completeTransition,
  } = useMapNavigationStore();

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle transition animations
  useEffect(() => {
    if (transitionState) {
      setIsTransitioning(true);

      // Auto-complete transition after animation duration
      const timer = setTimeout(() => {
        completeTransition();
        setIsTransitioning(false);
      }, 2300); // Total transition time: 800 + 400 + 600 + 500

      return () => clearTimeout(timer);
    }
  }, [transitionState, completeTransition]);

  const handleEnterBuilding = useCallback((propertyId: string) => {
    enterBuilding(propertyId);
    onEnterBuilding?.(propertyId);
  }, [enterBuilding, onEnterBuilding]);

  const handleBackToPortfolio = useCallback(() => {
    navigateToPortfolio();
    onExitToPortfolio?.();
  }, [navigateToPortfolio, onExitToPortfolio]);

  const getViewLabel = (view: ViewHierarchyLevel): string => {
    switch (view.level) {
      case 'portfolio':
        return 'Portfolio';
      case 'property':
        return 'Propriété';
      case 'streetview':
        return 'Street View';
      case 'building':
        return 'Bâtiment';
      case 'unit':
        return `Unité ${view.unitId}`;
      default:
        return '';
    }
  };

  const canGoBack = viewHierarchy.level !== 'portfolio';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Navigation Breadcrumb */}
      <div className="absolute left-4 top-4 z-30 flex items-center gap-2">
        {canGoBack && (
          <button
            type="button"
            onClick={navigateBack}
            disabled={isTransitioning}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-800/90 px-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-slate-700 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        )}

        {/* Breadcrumb trail */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/90 px-3 py-2 text-xs text-white/60 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={handleBackToPortfolio}
            disabled={isTransitioning || viewHierarchy.level === 'portfolio'}
            className="hover:text-white disabled:cursor-default"
          >
            <Map className="h-3.5 w-3.5" />
          </button>

          {viewHierarchy.level !== 'portfolio' && (
            <>
              <span className="text-white/30">/</span>
              <span className={viewHierarchy.level === 'property' ? 'text-white' : 'text-white/60'}>
                {selectedPropertyId?.slice(0, 8)}
              </span>
            </>
          )}

          {(viewHierarchy.level === 'building' || viewHierarchy.level === 'unit') && (
            <>
              <span className="text-white/30">/</span>
              <Building2 className="h-3.5 w-3.5 text-teal-400" />
            </>
          )}

          {viewHierarchy.level === 'unit' && 'unitId' in viewHierarchy && (
            <>
              <span className="text-white/30">/</span>
              <span className="text-white">{viewHierarchy.unitId}</span>
            </>
          )}
        </div>
      </div>

      {/* Map Type Toggle (for property level) */}
      {(viewHierarchy.level === 'property' || viewHierarchy.level === 'streetview') && (
        <div className="absolute right-4 top-4 z-30 flex gap-1 rounded-xl bg-slate-800/90 p-1 shadow-lg backdrop-blur-sm">
          {(['roadmap', 'satellite', 'hybrid', '3dtiles'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPropertyMapType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                propertyMapType === type
                  ? 'bg-teal-500 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {type === '3dtiles' ? '3D' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* "Dive Into Building" Button */}
      {viewHierarchy.level === 'property' && selectedPropertyId && (
        <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2">
          <button
            type="button"
            onClick={() => handleEnterBuilding(selectedPropertyId)}
            disabled={isTransitioning}
            className="group flex items-center gap-3 rounded-2xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-teal-400 hover:shadow-2xl disabled:opacity-50"
          >
            <Eye className="h-5 w-5 transition-transform group-hover:scale-110" />
            Plonger dans le bâtiment
            <Navigation className="h-4 w-4 rotate-90" />
          </button>
        </div>
      )}

      {/* Transition Overlay */}
      {transitionState && (
        <TransitionOverlay
          fromView={transitionState.fromView}
          toView={transitionState.toView}
          progress={transitionState.progress}
          phase={transitionState.phase}
        />
      )}

      {/* Content Area - renders children (map or viewer) */}
      <div className={`h-full w-full transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}

interface TransitionOverlayProps {
  fromView: ViewHierarchyLevel;
  toView: ViewHierarchyLevel;
  progress: number;
  phase: 'zoom' | 'crossfade' | 'descend' | 'enter';
}

function TransitionOverlay({ fromView, toView, progress, phase }: TransitionOverlayProps) {
  const phaseMessages = {
    zoom: 'Approche...',
    crossfade: 'Chargement 3D...',
    descend: 'Entrée dans le bâtiment...',
    enter: 'Initialisation...',
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Animated building icon */}
        <div className="relative">
          <Building2
            className="h-16 w-16 text-teal-400"
            style={{
              transform: `scale(${1 + progress * 0.3}) translateY(${phase === 'descend' ? progress * -20 : 0}px)`,
              opacity: phase === 'enter' ? 1 - progress : 1,
            }}
          />
          {phase === 'descend' && (
            <div
              className="absolute inset-0 rounded-full bg-teal-400/20"
              style={{
                transform: `scale(${1.5 + progress})`,
                opacity: 1 - progress,
              }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-teal-400 transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Phase message */}
        <p className="text-sm text-white/60">{phaseMessages[phase]}</p>
      </div>
    </div>
  );
}

export default MapBuildingExplorer;
