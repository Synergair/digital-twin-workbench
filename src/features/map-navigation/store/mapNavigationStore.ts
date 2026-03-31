import { create } from 'zustand';

export type ViewHierarchyLevel =
  | { level: 'portfolio' }
  | { level: 'property'; propertyId: string }
  | { level: 'streetview'; propertyId: string; location: LatLng }
  | { level: 'building'; propertyId: string }
  | { level: 'unit'; propertyId: string; unitId: string };

export interface LatLng {
  lat: number;
  lng: number;
}

export interface StreetViewPov {
  heading: number;
  pitch: number;
  zoom: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov?: number;
}

export interface TransitionState {
  fromView: ViewHierarchyLevel;
  toView: ViewHierarchyLevel;
  progress: number; // 0-1
  phase: 'zoom' | 'crossfade' | 'descend' | 'enter';
}

export interface FootprintVisibility {
  showAll: boolean;
  showHasTwin: boolean;
  showNeedsCapture: boolean;
  showAlerts: boolean;
  portfolioOwnerId?: string;
}

export interface BuildingFootprint {
  propertyId: string;
  geometry: GeoJSON.Polygon;
  centroid: LatLng;
  status: 'has-twin' | 'needs-capture' | 'has-alerts' | 'processing' | 'default';
  metadata: {
    floors: number;
    totalUnits: number;
    alertCount: number;
    urgentAlertCount: number;
    coveragePercent: number;
    address: string;
  };
}

interface MapNavigationState {
  // Current navigation context
  viewHierarchy: ViewHierarchyLevel;
  transitionState: TransitionState | null;

  // Portfolio view state
  portfolioCenter: LatLng;
  portfolioZoom: number;
  selectedPropertyId: string | null;
  hoveredPropertyId: string | null;
  clusteringEnabled: boolean;
  footprintVisibility: FootprintVisibility;

  // Property view state
  propertyMapType: 'roadmap' | 'satellite' | 'hybrid' | '3dtiles';
  streetViewActive: boolean;
  streetViewPov: StreetViewPov | null;
  streetViewLocation: LatLng | null;

  // 3D Tiles state
  cesiumViewerReady: boolean;
  customModelLoaded: boolean;
  show3DContext: boolean;
  shadowStudyEnabled: boolean;
  shadowStudyTime: Date | null;

  // Actions - Navigation
  navigateToPortfolio: () => void;
  navigateToProperty: (propertyId: string) => void;
  enterStreetView: (location: LatLng) => void;
  exitStreetView: () => void;
  enterBuilding: (propertyId: string) => void;
  enterUnit: (propertyId: string, unitId: string) => void;
  navigateBack: () => void;

  // Actions - Map state
  setPortfolioCenter: (center: LatLng) => void;
  setPortfolioZoom: (zoom: number) => void;
  setSelectedProperty: (propertyId: string | null) => void;
  setHoveredProperty: (propertyId: string | null) => void;
  setClusteringEnabled: (enabled: boolean) => void;
  setFootprintVisibility: (visibility: Partial<FootprintVisibility>) => void;
  setPropertyMapType: (type: 'roadmap' | 'satellite' | 'hybrid' | '3dtiles') => void;

  // Actions - Transitions
  startTransition: (from: ViewHierarchyLevel, to: ViewHierarchyLevel) => void;
  updateTransitionProgress: (progress: number, phase: TransitionState['phase']) => void;
  completeTransition: () => void;

  // Actions - 3D Tiles
  setCesiumViewerReady: (ready: boolean) => void;
  setCustomModelLoaded: (loaded: boolean) => void;
  setShow3DContext: (show: boolean) => void;
  setShadowStudyEnabled: (enabled: boolean) => void;
  setShadowStudyTime: (time: Date | null) => void;
}

export const useMapNavigationStore = create<MapNavigationState>((set, get) => ({
  // Initial state
  viewHierarchy: { level: 'portfolio' },
  transitionState: null,

  portfolioCenter: { lat: 45.5017, lng: -73.5673 }, // Montreal default
  portfolioZoom: 12,
  selectedPropertyId: null,
  hoveredPropertyId: null,
  clusteringEnabled: true,
  footprintVisibility: {
    showAll: true,
    showHasTwin: true,
    showNeedsCapture: true,
    showAlerts: true,
  },

  propertyMapType: 'satellite',
  streetViewActive: false,
  streetViewPov: null,
  streetViewLocation: null,

  cesiumViewerReady: false,
  customModelLoaded: false,
  show3DContext: true,
  shadowStudyEnabled: false,
  shadowStudyTime: null,

  // Navigation actions
  navigateToPortfolio: () => {
    const current = get().viewHierarchy;
    set({
      viewHierarchy: { level: 'portfolio' },
      selectedPropertyId: null,
      streetViewActive: false,
    });
    get().startTransition(current, { level: 'portfolio' });
  },

  navigateToProperty: (propertyId) => {
    const current = get().viewHierarchy;
    set({
      viewHierarchy: { level: 'property', propertyId },
      selectedPropertyId: propertyId,
      streetViewActive: false,
    });
    get().startTransition(current, { level: 'property', propertyId });
  },

  enterStreetView: (location) => {
    const current = get().viewHierarchy;
    const propertyId = get().selectedPropertyId;
    if (!propertyId) return;

    set({
      viewHierarchy: { level: 'streetview', propertyId, location },
      streetViewActive: true,
      streetViewLocation: location,
    });
    get().startTransition(current, { level: 'streetview', propertyId, location });
  },

  exitStreetView: () => {
    const current = get().viewHierarchy;
    const propertyId = get().selectedPropertyId;
    if (!propertyId) return;

    set({
      viewHierarchy: { level: 'property', propertyId },
      streetViewActive: false,
    });
    get().startTransition(current, { level: 'property', propertyId });
  },

  enterBuilding: (propertyId) => {
    const current = get().viewHierarchy;
    set({
      viewHierarchy: { level: 'building', propertyId },
      selectedPropertyId: propertyId,
      streetViewActive: false,
    });
    get().startTransition(current, { level: 'building', propertyId });
  },

  enterUnit: (propertyId, unitId) => {
    const current = get().viewHierarchy;
    set({
      viewHierarchy: { level: 'unit', propertyId, unitId },
      selectedPropertyId: propertyId,
    });
    get().startTransition(current, { level: 'unit', propertyId, unitId });
  },

  navigateBack: () => {
    const current = get().viewHierarchy;
    let target: ViewHierarchyLevel;

    switch (current.level) {
      case 'unit':
        target = { level: 'building', propertyId: current.propertyId };
        break;
      case 'building':
        target = { level: 'property', propertyId: current.propertyId };
        break;
      case 'streetview':
        target = { level: 'property', propertyId: current.propertyId };
        break;
      case 'property':
        target = { level: 'portfolio' };
        break;
      default:
        return;
    }

    if (target.level === 'portfolio') {
      get().navigateToPortfolio();
    } else if (target.level === 'property') {
      get().navigateToProperty(target.propertyId);
    } else if (target.level === 'building') {
      get().enterBuilding(target.propertyId);
    }
  },

  // Map state actions
  setPortfolioCenter: (center) => set({ portfolioCenter: center }),
  setPortfolioZoom: (zoom) => set({ portfolioZoom: zoom }),
  setSelectedProperty: (propertyId) => set({ selectedPropertyId: propertyId }),
  setHoveredProperty: (propertyId) => set({ hoveredPropertyId: propertyId }),
  setClusteringEnabled: (enabled) => set({ clusteringEnabled: enabled }),
  setFootprintVisibility: (visibility) =>
    set((state) => ({
      footprintVisibility: { ...state.footprintVisibility, ...visibility },
    })),
  setPropertyMapType: (type) => set({ propertyMapType: type }),

  // Transition actions
  startTransition: (fromView, toView) => {
    set({
      transitionState: {
        fromView,
        toView,
        progress: 0,
        phase: 'zoom',
      },
    });
  },

  updateTransitionProgress: (progress, phase) => {
    set((state) => ({
      transitionState: state.transitionState
        ? { ...state.transitionState, progress, phase }
        : null,
    }));
  },

  completeTransition: () => {
    set({ transitionState: null });
  },

  // 3D Tiles actions
  setCesiumViewerReady: (ready) => set({ cesiumViewerReady: ready }),
  setCustomModelLoaded: (loaded) => set({ customModelLoaded: loaded }),
  setShow3DContext: (show) => set({ show3DContext: show }),
  setShadowStudyEnabled: (enabled) => set({ shadowStudyEnabled: enabled }),
  setShadowStudyTime: (time) => set({ shadowStudyTime: time }),
}));

export default useMapNavigationStore;
