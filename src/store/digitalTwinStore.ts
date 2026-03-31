import { create } from 'zustand';
import type { TwinLayer, TwinTab, TwinView, TwinSeverity, TwinUnit } from '@/features/digital-twin/types';
import type { TooltipState } from '@/features/digital-twin/components/viewer/ViewerTooltip';
import type { FloatingActionState } from '@/features/digital-twin/components/viewer/FloatingActionSystem';
import type { SpatialQueryResult } from '@/features/digital-twin/components/viewer/SpatialQueryPanel';

const DEFAULT_MODEL_STORAGE_KEY = 'digital-twin-default-models-v1';

const isRenderableModelUrl = (url: string | null) => {
  if (!url) {
    return false;
  }
  const normalized = url.toLowerCase();
  return normalized.endsWith('.glb') || normalized.endsWith('.gltf');
};

const loadDefaultModelMap = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }
  try {
    const raw = window.localStorage.getItem(DEFAULT_MODEL_STORAGE_KEY);
    if (!raw) {
      return {} as Record<string, string>;
    }
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
};

const saveDefaultModelMap = (map: Record<string, string>) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DEFAULT_MODEL_STORAGE_KEY, JSON.stringify(map));
};

interface DigitalTwinState {
  propertyId: string | null;
  propertyAddress: string | null;
  hasOdmModel: boolean;
  odmModelUrl: string | null;
  modelOverrideUrl: string | null;
  defaultModelUrl: string | null;
  activeTab: TwinTab;
  activeView: TwinView;
  isolatedFloor: number | null;
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  activeLayers: Set<TwinLayer>;
  xrayMode: boolean;
  explodedMode: boolean;
  explodedFactor: number;
  holoMode: boolean;
  inspectionMode: boolean;
  inspectUnitId: string | null;
  pinDropMode: boolean;
  showWallTypes: boolean;
  showMepRoutes: boolean;
  currentSeverity: TwinSeverity;
  captureState: 'idle' | 'uploading' | 'processing' | 'ready';
  captureProgress: number;
  captureTaskId: string | null;
  odmLoaded: boolean;
  dispatchOpen: boolean;
  dispatchUnitId: string | null;
  lidarOpen: boolean;
  lidarUnitId: string | null;

  // In-viewer UI state
  tooltipState: TooltipState | null;
  floatingActionState: FloatingActionState | null;
  spatialQueryResult: SpatialQueryResult | null;
  spatialQueryVisible: boolean;
  showUnitLabels: boolean;
  showAlertBadges: boolean;
  captureWizardOpen: boolean;
  init: (propertyId: string, address: string, odmUrl?: string | null) => void;
  setTab: (tab: TwinTab) => void;
  setView: (view: TwinView) => void;
  setFloor: (floor: number | null) => void;
  selectUnit: (id: string | null) => void;
  hoverUnit: (id: string | null) => void;
  toggleLayer: (layer: TwinLayer) => void;
  setLayers: (layers: TwinLayer[]) => void;
  setXray: (on: boolean) => void;
  toggleExploded: () => void;
  setExplodedFactor: (factor: number) => void;
  toggleHolo: () => void;
  activateInspection: (unitId: string) => void;
  deactivateInspection: () => void;
  setPinDrop: (on: boolean) => void;
  setSeverity: (severity: TwinSeverity) => void;
  setCaptureState: (state: DigitalTwinState['captureState'], progress?: number, taskId?: string | null) => void;
  setOdmLoaded: (url: string) => void;
  setModelOverrideUrl: (url: string | null) => void;
  setDefaultModelForProperty: (propertyId: string, url: string) => void;
  clearDefaultModelForProperty: (propertyId: string) => void;
  openDispatch: (unitId?: string) => void;
  closeDispatch: () => void;
  openLidar: (unitId?: string) => void;
  closeLidar: () => void;
  setShowWallTypes: (on: boolean) => void;
  setShowMepRoutes: (on: boolean) => void;
  reset: () => void;

  // In-viewer UI actions
  setTooltipState: (state: TooltipState | null) => void;
  setFloatingActionState: (state: FloatingActionState | null) => void;
  setSpatialQueryResult: (result: SpatialQueryResult | null) => void;
  setSpatialQueryVisible: (visible: boolean) => void;
  setShowUnitLabels: (show: boolean) => void;
  setShowAlertBadges: (show: boolean) => void;
  openCaptureWizard: () => void;
  closeCaptureWizard: () => void;
}

const defaultLayerSet = () =>
  new Set<TwinLayer>([
    'structure',
    'envelope',
    'plomberie',
    'hvac',
    'electricite',
    'water',
    'gas',
    'drainage',
    'sprinklers',
    'fire',
    'security',
    'it',
    'elevators',
    'stairs',
    'parking',
    'roof',
    'solar',
    'lighting',
    'access',
    'zones',
    'cameras',
    'maintenance',
    'sensors',
  ]);

const createInitialState = () => ({
  propertyId: null,
  propertyAddress: null,
  hasOdmModel: false,
  odmModelUrl: null,
  modelOverrideUrl: null,
  defaultModelUrl: null,
  activeTab: 'mep' as TwinTab,
  activeView: 'iso' as TwinView,
  isolatedFloor: null,
  selectedUnitId: null,
  hoveredUnitId: null,
  activeLayers: defaultLayerSet(),
  xrayMode: false,
  explodedMode: false,
  explodedFactor: 0.4,
  holoMode: false,
  inspectionMode: false,
  inspectUnitId: null,
  pinDropMode: false,
  showWallTypes: true,
  showMepRoutes: true,
  currentSeverity: 'standard' as TwinSeverity,
  captureState: 'idle' as const,
  captureProgress: 0,
  captureTaskId: null,
  odmLoaded: false,
  dispatchOpen: false,
  dispatchUnitId: null,
  lidarOpen: false,
  lidarUnitId: null,

  // In-viewer UI initial state
  tooltipState: null,
  floatingActionState: null,
  spatialQueryResult: null,
  spatialQueryVisible: false,
  showUnitLabels: true,
  showAlertBadges: true,
  captureWizardOpen: false,
});

export const useDigitalTwinStore = create<DigitalTwinState>((set) => ({
  ...createInitialState(),

  init: (propertyId, address, odmUrl) =>
    set(() => {
      const defaults = loadDefaultModelMap();
      let defaultModelUrl: string | null = null;
      const storedUrl = defaults[propertyId] ?? null;
      if (isRenderableModelUrl(storedUrl)) {
        defaultModelUrl = storedUrl;
      } else if (storedUrl) {
        delete defaults[propertyId];
        saveDefaultModelMap(defaults);
      }
      return {
      ...createInitialState(),
      propertyId,
      propertyAddress: address,
      hasOdmModel: Boolean(odmUrl),
      odmModelUrl: odmUrl ?? null,
      modelOverrideUrl: defaultModelUrl,
      defaultModelUrl,
      odmLoaded: Boolean(odmUrl),
      };
    }),

  setTab: (activeTab) => set({ activeTab }),
  setView: (activeView) => set({ activeView }),
  setFloor: (isolatedFloor) => set({ isolatedFloor }),
  selectUnit: (selectedUnitId) => set({ selectedUnitId }),
  hoverUnit: (hoveredUnitId) => set({ hoveredUnitId }),
  toggleLayer: (layer) =>
    set((state) => {
      const activeLayers = new Set(state.activeLayers);
      if (activeLayers.has(layer)) {
        activeLayers.delete(layer);
      } else {
        activeLayers.add(layer);
      }
      return { activeLayers };
    }),
  setLayers: (layers) => set({ activeLayers: new Set(layers) }),
  setXray: (xrayMode) => set({ xrayMode }),
  toggleExploded: () => set((state) => ({ explodedMode: !state.explodedMode })),
  setExplodedFactor: (explodedFactor) => set({ explodedFactor }),
  toggleHolo: () => set((state) => ({ holoMode: !state.holoMode })),
  activateInspection: (inspectUnitId) =>
    set({
      inspectionMode: true,
      inspectUnitId,
      selectedUnitId: inspectUnitId,
      activeTab: 'structure',
    }),
  deactivateInspection: () =>
    set({
      inspectionMode: false,
      inspectUnitId: null,
      pinDropMode: false,
    }),
  setPinDrop: (pinDropMode) => set({ pinDropMode }),
  setSeverity: (currentSeverity) => set({ currentSeverity }),
  setCaptureState: (captureState, captureProgress = 0, captureTaskId = null) =>
    set({
      captureState,
      captureProgress,
      captureTaskId,
    }),
  setOdmLoaded: (url) =>
    set({
      odmLoaded: true,
      hasOdmModel: true,
      odmModelUrl: url,
      modelOverrideUrl: url,
      defaultModelUrl: url,
      captureState: 'ready',
      captureProgress: 100,
    }),
  setModelOverrideUrl: (modelOverrideUrl) =>
    set({
      modelOverrideUrl,
    }),
  setDefaultModelForProperty: (propertyId, url) =>
    set(() => {
      const defaults = loadDefaultModelMap();
      const next = { ...defaults, [propertyId]: url };
      saveDefaultModelMap(next);
      return {
        defaultModelUrl: url,
        modelOverrideUrl: url,
      };
    }),
  clearDefaultModelForProperty: (propertyId) =>
    set((state) => {
      const defaults = loadDefaultModelMap();
      if (defaults[propertyId]) {
        delete defaults[propertyId];
        saveDefaultModelMap(defaults);
      }
      return {
        defaultModelUrl: null,
        modelOverrideUrl: state.modelOverrideUrl === state.defaultModelUrl ? null : state.modelOverrideUrl,
      };
    }),
  openDispatch: (dispatchUnitId) => set({ dispatchOpen: true, dispatchUnitId: dispatchUnitId ?? null }),
  closeDispatch: () => set({ dispatchOpen: false, dispatchUnitId: null }),
  openLidar: (lidarUnitId) => set({ lidarOpen: true, lidarUnitId: lidarUnitId ?? null }),
  closeLidar: () => set({ lidarOpen: false, lidarUnitId: null }),
  setShowWallTypes: (showWallTypes) => set({ showWallTypes }),
  setShowMepRoutes: (showMepRoutes) => set({ showMepRoutes }),
  reset: () => set(createInitialState()),

  // In-viewer UI actions
  setTooltipState: (tooltipState) => set({ tooltipState }),
  setFloatingActionState: (floatingActionState) => set({ floatingActionState }),
  setSpatialQueryResult: (spatialQueryResult) => set({ spatialQueryResult, spatialQueryVisible: !!spatialQueryResult }),
  setSpatialQueryVisible: (spatialQueryVisible) => set({ spatialQueryVisible }),
  setShowUnitLabels: (showUnitLabels) => set({ showUnitLabels }),
  setShowAlertBadges: (showAlertBadges) => set({ showAlertBadges }),
  openCaptureWizard: () => set({ captureWizardOpen: true }),
  closeCaptureWizard: () => set({ captureWizardOpen: false }),
}));
