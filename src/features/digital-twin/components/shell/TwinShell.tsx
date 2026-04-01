import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { useTwinManifest, useTwinUnits, useTwinPins } from '@/hooks/useTwinQueries';
import { getTwinData } from '../../twinData';
import { BuildingViewer3D } from '../BuildingViewer3D';
import { FloorPlanOverlay } from '../FloorPlanOverlay';
import { ModelSelector } from '../ModelSelector';
import { AddressSearchBar } from './AddressSearchBar';
import { BottomToolbar } from './BottomToolbar';
import { RightDrawer } from './RightDrawer';
import { BottomSheet } from './BottomSheet';

// In-viewer UI components
import { ViewerTooltip, type TooltipContent } from '../viewer/ViewerTooltip';
import { FloatingActionSystem } from '../viewer/FloatingActionSystem';
import { UnitLabels3D } from '../viewer/UnitLabels3D';
import { SpatialQueryPanel } from '../viewer/SpatialQueryPanel';

// Dispatch components
import { DispatchModal } from '@/features/dispatch/components/DispatchModal';
import { DispatchPanel } from '@/features/dispatch/components/DispatchPanel';

import type { TwinLayer, TwinUnit } from '../../types';

interface TwinShellProps {
  propertyId: string;
  unitId?: string | null;
  readOnly?: boolean;
}

export function TwinShell({ propertyId, unitId, readOnly = false }: TwinShellProps) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetTab, setSheetTab] = useState<'intelligence' | 'history' | 'capture' | 'settings'>('intelligence');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);
  const [dispatchCoordinates, setDispatchCoordinates] = useState<{ x: number; y: number; z: number } | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [modelOverride, setModelOverride] = useState<string | null>(null);

  // Data queries
  const manifestQuery = useTwinManifest(propertyId);
  const unitsQuery = useTwinUnits(propertyId);
  const pinsQuery = useTwinPins(propertyId);

  const manifest = manifestQuery.data;
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);
  const twinData = useMemo(() => getTwinData(propertyId), [propertyId]);

  // Store state
  const {
    activeView,
    activeTab,
    activeLayers,
    isolatedFloor,
    selectedUnitId,
    hoveredUnitId,
    xrayMode,
    explodedMode,
    explodedFactor,
    pinDropMode,
    currentSeverity,
    // In-viewer UI state
    tooltipState,
    floatingActionState,
    spatialQueryResult,
    spatialQueryVisible,
    showUnitLabels,
    showAlertBadges,
    captureWizardOpen,
    // Actions
    selectUnit,
    hoverUnit,
    setView,
    setTab,
    setFloor,
    toggleLayer,
    setXray,
    toggleExploded,
    setExplodedFactor,
    setPinDrop,
    setSeverity,
    // In-viewer UI actions
    setTooltipState,
    setFloatingActionState,
    setSpatialQueryResult,
    setSpatialQueryVisible,
    setShowUnitLabels,
    openCaptureWizard,
    closeCaptureWizard,
    dispatchOpen,
    dispatchUnitId,
    openDispatch,
    closeDispatch,
  } = useDigitalTwinStore();

  // Selected unit and pins
  const selectedUnit = useMemo(() => {
    const targetId = selectedUnitId ?? unitId ?? units[0]?.id ?? null;
    return units.find((unit) => unit.id === targetId) ?? null;
  }, [selectedUnitId, unitId, units]);

  const selectedPins = useMemo(
    () => pins.filter((pin) => pin.unit_id === (selectedUnit?.id ?? null)),
    [pins, selectedUnit]
  );

  // Computed stats
  const floors = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.floor))).sort((a, b) => a - b),
    [units]
  );

  const alertCount = units.reduce((total, unit) => total + unit.active_alerts.length, 0);
  const urgentCount = units.reduce(
    (total, unit) => total + unit.active_alerts.filter((alert) => alert.severity === 'urgent').length,
    0
  );

  // Model URL resolution — prefix with Vite base path for production
  const base = import.meta.env.BASE_URL ?? '/';
  const prefixBase = (url: string) => url.startsWith('http') || url.startsWith(base) ? url : `${base}${url.replace(/^\//, '')}`;
  const fallbackModelUrl = `${base}listing-3d-mockup/models/modern-apartment-building.glb`;
  const rawModelUrl = modelOverride ?? manifest?.odm_model_url ?? fallbackModelUrl;
  const modelUrl = prefixBase(rawModelUrl);

  // Track unit positions for 3D labels (mock positions for now)
  const unitPositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    units.forEach((unit, index) => {
      // Generate mock 3D positions based on unit floor and index
      const floor = unit.floor;
      const angle = (index % 8) * (Math.PI / 4);
      const radius = 5;
      positions.set(unit.id, [
        Math.cos(angle) * radius,
        floor * 3 + 1.5,
        Math.sin(angle) * radius,
      ]);
    });
    return positions;
  }, [units]);

  // In-viewer UI handlers
  const handleUnitHover = useCallback((unitId: string | null, screenX?: number, screenY?: number) => {
    hoverUnit(unitId);
    if (unitId && screenX !== undefined && screenY !== undefined) {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        setTooltipState({
          visible: true,
          screenX,
          screenY,
          content: { type: 'unit', unit },
        });
      }
    } else {
      setTooltipState(null);
    }
  }, [hoverUnit, units, setTooltipState]);

  const handleUnitSelect = useCallback((unitId: string | null, screenX?: number, screenY?: number) => {
    selectUnit(unitId);
    if (unitId && screenX !== undefined && screenY !== undefined) {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        setFloatingActionState({
          visible: true,
          screenX,
          screenY,
          selectedUnit: unit,
          actions: [],
        });
      }
    } else {
      setFloatingActionState(null);
    }
  }, [selectUnit, units, setFloatingActionState]);

  const handleDropPin = useCallback((unit: TwinUnit, severity: typeof currentSeverity) => {
    setPinDrop(true);
    setSeverity(severity);
    // Pin creation is handled by the viewer
  }, [setPinDrop, setSeverity]);

  const handleDispatch = useCallback((unit: TwinUnit) => {
    openDispatch(unit.id);
    setShowDispatchModal(true);
  }, [openDispatch]);

  const handleOpenMap = useCallback(() => {
    navigate('/map');
  }, [navigate]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const handleCapture = useCallback((unit: TwinUnit) => {
    openCaptureWizard();
  }, [openCaptureWizard]);

  const handleMeasure = useCallback(() => {
    // TODO: Activate measurement mode in viewer
  }, []);

  const handleAnnotate = useCallback((unit: TwinUnit) => {
    // TODO: Open annotation panel
  }, []);

  const handleDismissFloatingAction = useCallback(() => {
    setFloatingActionState(null);
  }, [setFloatingActionState]);

  const handleCloseSpatialQuery = useCallback(() => {
    setSpatialQueryVisible(false);
  }, [setSpatialQueryVisible]);

  const handleSelectMEP = useCallback((layer: TwinLayer) => {
    toggleLayer(layer);
  }, [toggleLayer]);

  // Loading state
  if (manifestQuery.isLoading || unitsQuery.isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="text-white/60">No data available</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900">
      {/* Minimal Top Bar - 48px */}
      <AddressSearchBar
        address={manifest.address}
        floors={manifest.floors}
        totalUnits={manifest.total_units}
        alertCount={alertCount}
        urgentCount={urgentCount}
      />

      {/* Viewer Stage - fills remaining space */}
      <div className="relative flex-1 overflow-hidden">
        {/* Model Selector - top left overlay */}
        <div className="absolute left-4 top-4 z-30">
          <ModelSelector
            twinData={twinData}
            currentModelUrl={modelUrl}
            onSelectModel={(url) => setModelOverride(url)}
          />
        </div>

        <div className="absolute inset-0">
          <BuildingViewer3D
            modelUrl={modelUrl}
            units={units}
            pins={pins}
            activeLayers={activeLayers}
            isolatedFloor={isolatedFloor}
            selectedUnitId={selectedUnit?.id ?? null}
            hoveredUnitId={hoveredUnitId}
            xrayMode={xrayMode}
            explodedMode={explodedMode}
            explodedFactor={explodedFactor}
            activeView={activeView}
            activeTab={activeTab}
            pinDropMode={pinDropMode}
            readOnly={readOnly}
            isDarkMode={isDarkMode}
            onSelectUnit={handleUnitSelect}
            onHoverUnit={handleUnitHover}
            onCreatePin={() => {}}
          />
        </div>

        {/* In-Viewer UI Overlays */}
        <div className="pointer-events-none absolute inset-0">
          {/* Hover Tooltip */}
          <ViewerTooltip
            state={tooltipState}
            showFinancials={!readOnly}
          />

          {/* Floating Action Buttons (near selection) */}
          <FloatingActionSystem
            state={floatingActionState}
            severity={currentSeverity}
            readOnly={readOnly}
            onDropPin={handleDropPin}
            onDispatch={handleDispatch}
            onCapture={handleCapture}
            onMeasure={handleMeasure}
            onAnnotate={handleAnnotate}
            onDismiss={handleDismissFloatingAction}
          />

          {/* Spatial Query Panel */}
          <SpatialQueryPanel
            result={spatialQueryResult}
            visible={spatialQueryVisible}
            onClose={handleCloseSpatialQuery}
            onSelectMEP={handleSelectMEP}
            onMeasureFrom={handleMeasure}
          />

          {/* Floor Plan Overlay */}
          <FloorPlanOverlay
            floorPlans={twinData.floorPlans}
            units={units}
            selectedUnitId={selectedUnit?.id ?? null}
            isolatedFloor={isolatedFloor}
            visible={showFloorPlan}
            onClose={() => setShowFloorPlan(false)}
            onSelectUnit={selectUnit}
          />

          {/* 3D Unit Labels */}
          <UnitLabels3D
            units={units}
            unitPositions={unitPositions}
            selectedUnitId={selectedUnit?.id ?? null}
            hoveredUnitId={hoveredUnitId}
            showLabels={showUnitLabels}
            showAlertBadges={showAlertBadges}
            cameraState={null}
            viewerCanvas={null}
            onUnitClick={(id) => handleUnitSelect(id, window.innerWidth / 2, window.innerHeight / 2)}
            onUnitHover={(id) => handleUnitHover(id)}
          />
        </div>

        {/* Right Drawer Toggle Button */}
        {!drawerOpen && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white/10 p-2 text-white/60 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Right Drawer */}
        <RightDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          units={units}
          selectedUnit={selectedUnit}
          selectedPins={selectedPins}
          onSelectUnit={selectUnit}
          onSetFloor={setFloor}
        />
      </div>

      {/* Bottom Toolbar - 56px */}
      <BottomToolbar
        activeView={activeView}
        activeTab={activeTab}
        activeLayers={activeLayers}
        isolatedFloor={isolatedFloor}
        floors={floors}
        xrayMode={xrayMode}
        explodedMode={explodedMode}
        pinDropMode={pinDropMode}
        currentSeverity={currentSeverity}
        readOnly={readOnly}
        showUnitLabels={showUnitLabels}
        onViewChange={setView}
        onTabChange={setTab}
        onFloorChange={setFloor}
        onToggleLayer={toggleLayer}
        onToggleXray={() => setXray(!xrayMode)}
        onToggleExploded={toggleExploded}
        onTogglePinDrop={() => setPinDrop(!pinDropMode)}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        onToggleSheet={() => setSheetExpanded(!sheetExpanded)}
        onToggleUnitLabels={() => setShowUnitLabels(!showUnitLabels)}
        onOpenMap={handleOpenMap}
        onToggle2D={() => setShowFloorPlan(!showFloorPlan)}
        onToggleInsideView={() => setView(activeView === 'inside' ? 'iso' : 'inside')}
        show2D={showFloorPlan}
      />

      {/* Bottom Sheet - slides up */}
      <BottomSheet
        expanded={sheetExpanded}
        activeTab={sheetTab}
        propertyId={propertyId}
        unitId={unitId ?? null}
        captureWizardOpen={captureWizardOpen}
        onTabChange={setSheetTab}
        onCollapse={() => setSheetExpanded(false)}
        onOpenCaptureWizard={openCaptureWizard}
        onCloseCaptureWizard={closeCaptureWizard}
      />

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <DispatchModal
          propertyId={propertyId}
          unit={dispatchUnitId ? units.find((u) => u.id === dispatchUnitId) : selectedUnit}
          coordinates={dispatchCoordinates}
          onClose={() => {
            setShowDispatchModal(false);
            closeDispatch();
            setDispatchCoordinates(null);
          }}
          onSuccess={(dispatchId) => {
            setShowDispatchPanel(true);
          }}
        />
      )}

      {/* Dispatch Panel (slide-in) */}
      {showDispatchPanel && (
        <div className="fixed bottom-14 right-0 top-12 z-40 w-96 border-l border-white/10 bg-slate-900/95 backdrop-blur-sm">
          <DispatchPanel
            propertyId={propertyId}
            unitId={selectedUnit?.id}
            onClose={() => setShowDispatchPanel(false)}
          />
        </div>
      )}
    </div>
  );
}
