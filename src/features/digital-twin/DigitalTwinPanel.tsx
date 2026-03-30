import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Building2, ClipboardList, Upload } from '@/components/icons/basil-lucide';
import { V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Loading from '@/components/ui/Loading';
import { cn } from '@/lib/utils';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { uploadCaptureXHR } from '@/lib/api/digitalTwin';
import { useCreateTwinPin, useTwinCaptures, useTwinManifest, useTwinPassportLayers, useTwinPins, useTwinUnits } from '@/hooks/useTwinQueries';
import { BuildingPassportBar } from './components/BuildingPassportBar';
import { BuildingProfileCard } from './components/BuildingProfileCard';
import { BimPipelineCard } from './components/BimPipelineCard';
import { BuildingViewer3D } from './components/BuildingViewer3D';
import { CaptureModal } from './components/CaptureModal';
import { DispatchModal } from './components/DispatchModal';
import { TwinDataUniversePanel } from './components/TwinDataUniversePanel';
import { TwinFloorScrubber } from './components/TwinFloorScrubber';
import { TwinLayerControls } from './components/TwinLayerControls';
import { TwinModelStudioPanel } from './components/TwinModelStudioPanel';
import { TwinPropertyIntelligencePanel } from './components/TwinPropertyIntelligencePanel';
import { TwinEstateExplorerPanel } from './components/TwinEstateExplorerPanel';
import { TwinIoTDashboard } from './components/TwinIoTDashboard';
import { TwinPanelRight } from './components/TwinPanelRight';
import { calculateComplexity, calculateRiskScore, recommendSkills } from './algorithms';
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
  const capturesQuery = useTwinCaptures(propertyId);
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
  const complexityScore = useMemo(
    () => calculateComplexity(units, floors.length, activeLayersList),
    [activeLayersList, floors.length, units],
  );
  const riskScore = useMemo(() => calculateRiskScore(pins), [pins]);

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
  const [resolvedModelUrl, setResolvedModelUrl] = useState(candidateModelUrl);

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
  const latestCapture = capturesQuery.data?.[0] ?? null;
  const coveredUnits = units.filter((unit) => unit.has_digital_twin).length;
  const coveragePercent = manifest.total_units > 0 ? Math.round((coveredUnits / manifest.total_units) * 100) : 0;
  const floorLabel =
    isolatedFloor === null ? 'Tous les étages' : isolatedFloor === 0 ? 'Rez-de-chaussée' : `Étage ${isolatedFloor}`;

  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-[28px] border border-[var(--semantic-border)] bg-[linear-gradient(135deg,_rgba(13,115,119,0.08),_rgba(255,255,255,0.98))] p-6">
        <div className="flex flex-col gap-4">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Pilot IFC/BIM</Badge>
              <Badge variant="outline">{manifest.floors} étages</Badge>
              <Badge variant={manifest.has_odm_model ? 'success' : 'warning'}>
                {manifest.has_odm_model ? 'Viewer actif' : 'Capture en attente'}
              </Badge>
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">Digital Twin</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--semantic-text-subtle)]">
              Lecture bâtiment, systèmes et maintenance dans une seule surface intégrée, avec une hiérarchie plus calme et centrée sur le viewer.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/70 bg-white/88 px-4 py-2 text-sm text-[var(--semantic-text)]">
              <span className="text-[var(--semantic-text-subtle)]">Adresse</span>
              <span className="ml-2 font-medium">{manifest.address}</span>
            </div>
            <div className="rounded-full border border-white/70 bg-white/88 px-4 py-2 text-sm text-[var(--semantic-text)]">
              <span className="text-[var(--semantic-text-subtle)]">Périmètre</span>
              <span className="ml-2 font-medium">{canViewOtherUnits ? `${manifest.total_units} unités` : `Unité ${selectedUnit?.unit_number ?? unitId ?? 'isolée'}`}</span>
            </div>
            <div className="rounded-full border border-white/70 bg-white/88 px-4 py-2 text-sm text-[var(--semantic-text)]">
              <span className="text-[var(--semantic-text-subtle)]">Vue</span>
              <span className="ml-2 font-medium">{floorLabel}</span>
            </div>
            <div className="rounded-full border border-white/70 bg-white/88 px-4 py-2 text-sm text-[var(--semantic-text)]">
              <span className="text-[var(--semantic-text-subtle)]">Pins ouverts</span>
              <span className="ml-2 font-medium">{openPinsCount}</span>
            </div>
          </div>
        </div>
      </div>

      <BuildingPassportBar score={manifest.building_passport_score} updatedAt={manifest.updated_at} />
      <BuildingProfileCard
        propertyId={propertyId}
        coveragePercent={coveragePercent}
        complexity={complexityScore}
        riskScore={riskScore}
      />
      <TwinPropertyIntelligencePanel propertyId={propertyId} />
      <TwinEstateExplorerPanel
        propertyName={manifest.address}
        units={units}
        selectedUnitId={selectedUnit?.id ?? null}
        onSelectUnit={selectUnit}
        onSetFloor={setFloor}
        onSetView={setView}
      />
      <BimPipelineCard />
      <TwinModelStudioPanel propertyId={propertyId} />
      <TwinIoTDashboard propertyId={propertyId} />
      <TwinDataUniversePanel propertyId={propertyId} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.618fr)_minmax(320px,0.78fr)]">
        <div className="space-y-4">
          <V2Surface
            title="Digital Twin"
            subtitle="Lecture bâtiment, systèmes et contexte unité dans une seule surface."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {!readOnly ? (
                  <Button type="button" size="sm" variant="secondary" onClick={() => setShowCaptureModal(true)}>
                    <Upload className="h-4 w-4" />
                    Ajouter une capture
                  </Button>
                ) : null}
                <TwinFloorScrubber floors={floors} isolatedFloor={isolatedFloor} onChange={setFloor} />
              </div>
            }
          >
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--semantic-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(247,250,250,0.96))] p-3">
                <div className="flex flex-wrap gap-2">
                  {twinTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      type="button"
                      size="sm"
                      variant={activeTab === tab.id ? 'primary' : 'secondary'}
                      onClick={() => setTab(tab.id)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                <p className="text-sm text-[var(--semantic-text-subtle)]">
                  {twinTabs.find((tab) => tab.id === activeTab)?.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TwinLayerControls activeLayers={activeLayers} onToggle={toggleLayer} />
                  <div className="flex flex-wrap gap-2">
                    {viewOptions.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant={activeView === option.id ? 'primary' : 'secondary'}
                        onClick={() => setView(option.id)}
                      >
                        {option.label}
                      </Button>
                    ))}
                    <Button type="button" size="sm" variant={xrayMode ? 'primary' : 'secondary'} onClick={() => setXray(!xrayMode)}>
                      X-Ray
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={explodedMode ? 'primary' : 'secondary'}
                      onClick={() => {
                        toggleExploded();
                        if (!explodedMode && explodedFactor <= 0) {
                          setExplodedFactor(0.4);
                        }
                      }}
                    >
                      Eclate
                    </Button>
                  </div>
                </div>
                {explodedMode ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--semantic-border)] bg-white/80 px-3 py-2 text-xs text-[var(--semantic-text-subtle)]">
                    <span className="font-semibold text-[var(--semantic-text)]">Ecartement</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={explodedFactor}
                      onChange={(event) => setExplodedFactor(Number(event.target.value))}
                      className="w-40 accent-[var(--semantic-primary)]"
                    />
                    <span>{Math.round(explodedFactor * 100)}%</span>
                  </div>
                ) : null}
              </div>
            </div>

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

              {latestPin ? (
                <div className="absolute left-4 top-4 max-w-sm rounded-2xl border border-[var(--semantic-border)] bg-white/92 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--semantic-text)]">Pin créé</p>
                      <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">{latestPin.description ?? 'Signalement contextualisé'}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--semantic-text-subtle)]"
                      onClick={() => setLatestPin(null)}
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" size="sm" variant="primary" onClick={() => openDispatch(selectedUnit?.id)}>
                      Ouvrir le briefing
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setLatestPin(null)}>
                      Continuer
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </V2Surface>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--semantic-border)] bg-white/86 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--semantic-text)]">Passport</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">Complétude documentaire et technique</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--semantic-text-subtle)]">
                  <Building2 className="h-4 w-4" />
                  <span>{coveragePercent}% couvert</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {passportQuery.data?.map((layer) => (
                  <div key={layer.id} className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium capitalize text-[var(--semantic-text)]">{layer.layer_type}</p>
                        <p className="text-xs text-[var(--semantic-text-subtle)]">
                          Mise à jour {new Date(layer.last_updated).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <V2StatusPill
                        label={`${layer.completeness_percent}%`}
                        variant={layer.completeness_percent >= 85 ? 'success' : layer.completeness_percent >= 70 ? 'warning' : 'neutral'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--semantic-border)] bg-white/86 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--semantic-text)]">Capture et alertes</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">
                    {latestCapture?.status === 'processing' ? 'Un traitement ODM est en cours.' : 'État opérationnel du twin.'}
                  </p>
                </div>
                <V2StatusPill label={captureState} variant={captureState === 'ready' ? 'success' : captureState === 'uploading' ? 'info' : 'neutral'} />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--semantic-text)]">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{alertCount} alertes actives</span>
                    </div>
                    <V2StatusPill label={`${urgentCount} urgentes`} variant={urgentCount > 0 ? 'danger' : 'neutral'} />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--semantic-text)]">
                      <Upload className="h-4 w-4" />
                      <span>
                        {latestCapture
                          ? `${latestCapture.capture_type} • ${new Date(latestCapture.created_at).toLocaleDateString('fr-CA', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}`
                          : 'Aucune capture enregistrée'}
                      </span>
                    </div>
                    <V2StatusPill label={`${openPinsCount} pins`} variant="info" />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--semantic-text)]">
                    <ClipboardList className="h-4 w-4" />
                    <span>IFC/BIM comme source de vérité, avec captures terrain comme enrichissement progressif.</span>
                  </div>
                </div>
                {captureState === 'uploading' ? (
                  <div className="h-2 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full rounded-full bg-[var(--semantic-primary)]" style={{ width: `${captureProgress}%` }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <TwinPanelRight
          units={units}
          selectedUnit={selectedUnit}
          selectedPins={selectedPins}
          inspectionMode={inspectionMode}
          readOnly={readOnly}
          currentSeverity={currentSeverity}
          pinDropMode={pinDropMode}
          onChangeSeverity={setSeverity}
          onTogglePinDrop={() => setPinDrop(!pinDropMode)}
          onStartDispatch={() => openDispatch(selectedUnit?.id)}
        />
      </div>

      {!readOnly && selectedUnit ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={() => setPinDrop(!pinDropMode)}>
            {pinDropMode ? 'Annuler le pin' : `Signaler un problème dans ${selectedUnit.unit_number}`}
          </Button>
          <Button type="button" variant="secondary" onClick={() => openDispatch(selectedUnit.id)}>
            Ouvrir le briefing
          </Button>
        </div>
      ) : null}

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
