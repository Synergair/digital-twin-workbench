import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload } from '@/components/icons/basil-lucide';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Loading from '@/components/ui/Loading';
import { cn } from '@/lib/utils';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { uploadCaptureXHR } from '@/lib/api/digitalTwin';
import { useCreateTwinPin, useTwinManifest, useTwinPassportLayers, useTwinPins, useTwinUnits } from '@/hooks/useTwinQueries';
import { BuildingViewer3D } from './components/BuildingViewer3D';
import { CaptureModal } from './components/CaptureModal';
import { DispatchModal } from './components/DispatchModal';
import { TwinFloorScrubber } from './components/TwinFloorScrubber';
import { TwinLayerControls } from './components/TwinLayerControls';
import { PropertyOverviewHero } from './components/deprecated/PropertyOverviewHero';
import { TwinSecondaryTabs } from './components/deprecated/TwinSecondaryTabs';
import { TwinContextSidebar } from './components/deprecated/TwinContextSidebar';
import { recommendSkills } from './algorithms';
import type { TwinLayer, TwinPin, TwinTab, TwinView } from './types';

const twinTabs: Array<{ id: TwinTab; label: string; description: string }> = [
  { id: 'mep', label: 'Systèmes MEP', description: 'Réseaux, proximité technique et maintenance.' },
  { id: 'unites', label: 'Unités', description: 'Occupation, couverture et contexte par logement.' },
  { id: 'parking', label: 'Parking', description: 'Socle, circulation et espaces communs techniques.' },
  { id: 'structure', label: 'Structure', description: 'Enveloppe, noyaux et lecture constructive.' },
];

const viewOptions: Array<{ id: TwinView; label: string }> = [
  { id: 'facade', label: 'Façade' },
  { id: 'dessus', label: 'Dessus' },
  { id: 'cote', label: 'Côté' },
  { id: 'iso', label: 'Iso' },
  { id: 'inside', label: 'Intérieur' },
];

export function DigitalTwinWorkspace({
  propertyId,
  unitId,
  readOnly = false,
  canViewOtherUnits = true,
  presetTab,
  presetLayers,
  className,
}: {
  propertyId: string;
  unitId?: string | null;
  readOnly?: boolean;
  canViewOtherUnits?: boolean;
  presetTab?: TwinTab;
  presetLayers?: TwinLayer[];
  className?: string;
}) {
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [latestPin, setLatestPin] = useState<TwinPin | null>(null);

  const manifestQuery = useTwinManifest(propertyId);
  const manifest = manifestQuery.data;
  const effectiveUnitId = canViewOtherUnits ? undefined : unitId ?? undefined;
  const unitsQuery = useTwinUnits(propertyId, effectiveUnitId);
  const pinsQuery = useTwinPins(propertyId, effectiveUnitId);
  const passportQuery = useTwinPassportLayers(propertyId);
  const createPinMutation = useCreateTwinPin(propertyId);

  const {
    activeView,
    activeTab,
    activeLayers,
    captureProgress,
    captureState,
    currentSeverity,
    dispatchOpen,
    explodedMode,
    explodedFactor,
    hoveredUnitId,
    init,
    inspectionMode,
    isolatedFloor,
    modelOverrideUrl,
    openDispatch,
    pinDropMode,
    selectUnit,
    selectedUnitId,
    setModelOverrideUrl,
    setCaptureState,
    clearDefaultModelForProperty,
    setFloor,
    setLayers,
    setPinDrop,
    setSeverity,
    setTab,
    setView,
    setXray,
    toggleExploded,
    setExplodedFactor,
    toggleLayer,
    hoverUnit,
    closeDispatch,
    xrayMode,
  } = useDigitalTwinStore();
  const presetAppliedRef = useRef(false);

  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);
  const selectedUnit = useMemo(() => {
    const targetId = selectedUnitId ?? unitId ?? units[0]?.id ?? null;
    return units.find((unit) => unit.id === targetId) ?? null;
  }, [selectedUnitId, unitId, units]);
  const selectedPins = useMemo(
    () => pins.filter((pin) => pin.unit_id === (selectedUnit?.id ?? null)),
    [pins, selectedUnit]
  );
  const floors = useMemo(
    () => Array.from(new Set(units.map((unit) => unit.floor))).sort((a, b) => a - b),
    [units]
  );
  const activeLayersList = useMemo(() => Array.from(activeLayers), [activeLayers]);

  // Model URL resolution - must be before any conditional returns to follow Rules of Hooks
  const isRenderableModel = (url: string | null) => {
    if (!url) return false;
    const normalized = url.toLowerCase();
    return normalized.endsWith('.glb') || normalized.endsWith('.gltf');
  };
  const fallbackModelUrl = '/listing-3d-mockup/models/modern-apartment-building.glb';
  const usingOverride = isRenderableModel(modelOverrideUrl);
  const candidateModelUrl = usingOverride
    ? modelOverrideUrl
    : isRenderableModel(manifest?.odm_model_url ?? null)
    ? manifest?.odm_model_url
    : fallbackModelUrl;
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string>(candidateModelUrl ?? fallbackModelUrl);

  useEffect(() => {
    let active = true;
    const resolveUrl = async () => {
      if (!candidateModelUrl) {
        if (active) setResolvedModelUrl(fallbackModelUrl);
        return;
      }
      if (!candidateModelUrl.startsWith('/')) {
        if (active) setResolvedModelUrl(candidateModelUrl);
        return;
      }
      try {
        const response = await fetch(candidateModelUrl, { method: 'HEAD' });
        if (!response.ok) throw new Error('missing model');
        if (active) setResolvedModelUrl(candidateModelUrl);
      } catch {
        if (!active) return;
        setResolvedModelUrl(fallbackModelUrl);
        if (usingOverride) {
          setModelOverrideUrl(null);
          clearDefaultModelForProperty(propertyId);
        }
      }
    };
    void resolveUrl();
    return () => { active = false; };
  }, [candidateModelUrl, clearDefaultModelForProperty, propertyId, setModelOverrideUrl, usingOverride]);

  useEffect(() => {
    if (!manifest) {
      return;
    }
    init(propertyId, manifest.address, manifest.odm_model_url);
    presetAppliedRef.current = false;
  }, [init, manifest, propertyId]);

  useEffect(() => {
    if (presetAppliedRef.current) {
      return;
    }
    if (presetTab) {
      setTab(presetTab);
    }
    if (presetLayers?.length) {
      setLayers(presetLayers);
    }
    if (presetTab || presetLayers?.length) {
      presetAppliedRef.current = true;
    }
  }, [presetLayers, presetTab, setLayers, setTab]);

  useEffect(() => {
    if (!selectedUnit && units[0]) {
      selectUnit(unitId ?? units[0].id);
    }
  }, [selectedUnit, selectUnit, unitId, units]);

  const handleCreatePin = async (point: { x: number; y: number; z: number }, targetUnitId: string) => {
    try {
      const created = await createPinMutation.mutateAsync({
        unit_id: targetUnitId,
        coord_x: point.x,
        coord_y: point.y,
        coord_z: point.z,
        mesh_name: `unit-${targetUnitId}`,
        severity: currentSeverity,
        description:
          currentSeverity === 'urgent'
            ? 'Signalement urgent créé depuis le viewer.'
            : 'Signalement contextualisé créé depuis le digital twin.',
      });
      setLatestPin(created);
      setPinDrop(false);
      toast.success('Pin créé avec briefing contextuel.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le pin.');
    }
  };

  const handleUploadCapture = async (files: File[], captureType: string) => {
    try {
      setCaptureState('uploading', 0);
      await uploadCaptureXHR(
        propertyId,
        files,
        { unitId: selectedUnit?.id ?? undefined, captureType },
        (progress) => setCaptureState('uploading', progress)
      );
      setCaptureState('ready', 100);
      setShowCaptureModal(false);
      toast.success('Capture intégrée au digital twin.');
    } catch (error) {
      setCaptureState('idle', 0);
      toast.error(error instanceof Error ? error.message : 'Échec de la capture.');
    }
  };

  if (manifestQuery.isLoading || unitsQuery.isLoading || pinsQuery.isLoading || passportQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-8">
        <Loading />
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-8">
        <p className="text-sm text-[var(--semantic-text-subtle)]">Aucune donnée Digital Twin disponible pour cette propriété.</p>
      </div>
    );
  }

  const alertCount = units.reduce((total, unit) => total + unit.active_alerts.length, 0);
  const urgentCount = units.reduce(
    (total, unit) => total + unit.active_alerts.filter((alert) => alert.severity === 'urgent').length,
    0
  );
  const openPinsCount = pins.filter((pin) => pin.status === 'open' || pin.status === 'assigned').length;
  const coveredUnits = units.filter((unit) => unit.has_digital_twin).length;
  const coveragePercent = manifest.total_units > 0 ? Math.round((coveredUnits / manifest.total_units) * 100) : 0;
  const floorLabel =
    isolatedFloor === null ? 'Tous les étages' : isolatedFloor === 0 ? 'Rez-de-chaussée' : `Étage ${isolatedFloor}`;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Property Overview Hero - Primary Focus */}
      <PropertyOverviewHero
        propertyId={propertyId}
        address={manifest.address}
        totalUnits={manifest.total_units}
        floors={manifest.floors}
        alertCount={alertCount}
        urgentCount={urgentCount}
        openPinsCount={openPinsCount}
        coveragePercent={coveragePercent}
        passportScore={manifest.building_passport_score}
        passportUpdatedAt={manifest.updated_at}
        hasOdmModel={manifest.has_odm_model}
        floorLabel={floorLabel}
      />

      {/* Main Content: 3D Viewer + Context Sidebar */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 3D Viewer - Elevated to Primary Position */}
        <div className="surface-card-elevated overflow-hidden">
          {/* Viewer Controls Bar */}
          <div className="border-b border-[var(--semantic-border)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {twinTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[var(--semantic-text)] text-white'
                        : 'bg-[var(--panel-soft)] text-[var(--semantic-text-subtle)] hover:bg-[var(--semantic-border)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => setShowCaptureModal(true)}>
                    <Upload className="h-4 w-4" />
                    Capture
                  </Button>
                )}
                <TwinFloorScrubber floors={floors} isolatedFloor={isolatedFloor} onChange={setFloor} />
              </div>
            </div>

            {/* Layer Controls & View Options */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <TwinLayerControls activeLayers={activeLayers} onToggle={toggleLayer} />
              <div className="flex flex-wrap gap-1.5">
                {viewOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setView(option.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      activeView === option.id
                        ? 'bg-[var(--semantic-primary)] text-white'
                        : 'bg-[var(--panel-soft)] text-[var(--semantic-text-subtle)] hover:text-[var(--semantic-text)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setXray(!xrayMode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    xrayMode
                      ? 'bg-[var(--semantic-primary)] text-white'
                      : 'bg-[var(--panel-soft)] text-[var(--semantic-text-subtle)] hover:text-[var(--semantic-text)]'
                  }`}
                >
                  X-Ray
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleExploded();
                    if (!explodedMode && explodedFactor <= 0) {
                      setExplodedFactor(0.4);
                    }
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    explodedMode
                      ? 'bg-[var(--semantic-primary)] text-white'
                      : 'bg-[var(--panel-soft)] text-[var(--semantic-text-subtle)] hover:text-[var(--semantic-text)]'
                  }`}
                >
                  Eclate
                </button>
              </div>
            </div>

            {/* Exploded Mode Slider */}
            {explodedMode && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-[var(--panel-soft)] px-3 py-2 text-xs">
                <span className="font-medium text-[var(--semantic-text)]">Écartement</span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={explodedFactor}
                  onChange={(event) => setExplodedFactor(Number(event.target.value))}
                  className="w-32 accent-[var(--semantic-primary)]"
                />
                <span className="text-[var(--semantic-text-subtle)]">{Math.round(explodedFactor * 100)}%</span>
              </div>
            )}
          </div>

          {/* 3D Viewer Canvas */}
          <div className="relative">
            <BuildingViewer3D
              modelUrl={resolvedModelUrl}
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
              onSelectUnit={selectUnit}
              onHoverUnit={hoverUnit}
              onCreatePin={handleCreatePin}
            />

            {/* Pin Created Overlay */}
            {latestPin && (
              <div className="absolute left-4 top-4 max-w-sm surface-card-minimal p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--semantic-text)]">Pin créé</p>
                    <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">
                      {latestPin.description ?? 'Signalement contextualisé'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-medium text-[var(--semantic-text-subtle)] hover:text-[var(--semantic-text)]"
                    onClick={() => setLatestPin(null)}
                  >
                    Fermer
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" variant="primary" onClick={() => openDispatch(selectedUnit?.id)}>
                    Ouvrir briefing
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setLatestPin(null)}>
                    Continuer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context Sidebar - Simplified */}
        <TwinContextSidebar
          unit={selectedUnit}
          units={units}
          pins={selectedPins}
          severity={currentSeverity}
          pinDropMode={pinDropMode}
          readOnly={readOnly}
          onChangeSeverity={setSeverity}
          onTogglePinDrop={() => setPinDrop(!pinDropMode)}
          onStartDispatch={() => openDispatch(selectedUnit?.id)}
        />
      </div>

      {/* Secondary Tabs - All Other Panels */}
      <TwinSecondaryTabs
        propertyId={propertyId}
        propertyName={manifest.address}
        units={units}
        selectedUnitId={selectedUnit?.id ?? null}
        onSelectUnit={selectUnit}
        onSetFloor={setFloor}
        onSetView={setView}
      />

      {/* Modals */}
      <CaptureModal
        isOpen={showCaptureModal}
        loading={captureState === 'uploading'}
        progress={captureProgress}
        onClose={() => setShowCaptureModal(false)}
        onSubmit={handleUploadCapture}
      />

      <DispatchModal
        isOpen={dispatchOpen}
        unit={selectedUnit}
        latestPin={latestPin ?? selectedPins[0] ?? null}
        onClose={closeDispatch}
      />
    </div>
  );
}

export function TwinUnitView({
  propertyId,
  unitId,
  readOnly = false,
}: {
  propertyId: string;
  unitId: string;
  readOnly?: boolean;
}) {
  return <DigitalTwinWorkspace propertyId={propertyId} unitId={unitId} readOnly={readOnly} canViewOtherUnits={false} />;
}

export function TwinTicketBriefing({
  propertyId,
  pinId,
}: {
  propertyId: string;
  pinId?: string | null;
}) {
  const pinsQuery = useTwinPins(propertyId);
  const pin = (pinsQuery.data ?? []).find((entry) => entry.id === pinId) ?? (pinsQuery.data ?? [])[0] ?? null;
  const skills = pin ? recommendSkills(pin) : ['Inspection générale'];

  return (
    <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--semantic-text)]">Briefing Digital Twin</p>
          <p className="text-xs text-[var(--semantic-text-subtle)]">Contextualisation issue / mur / MEP prête pour le fournisseur.</p>
        </div>
        <Badge variant={pin?.severity === 'urgent' ? 'error' : 'info'}>{pin?.severity ?? 'standard'}</Badge>
      </div>
      <p className="mt-3 text-sm text-[var(--semantic-text)]">{pin?.description ?? 'Aucun pin enrichi disponible pour ce ticket.'}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {skills.map((skill) => (
          <span key={skill} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 font-semibold">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
