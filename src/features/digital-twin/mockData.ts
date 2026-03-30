import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';
import { getTwinUnitLayout } from './layout';
import type {
  CreateTwinPinInput,
  TwinAlert,
  TwinCapture,
  TwinManifest,
  TwinPassportLayer,
  TwinPin,
  TwinUnit,
} from './types';

const nowIso = () => new Date().toISOString();

const daysAgo = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString();
};

const daysAhead = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

const pinMemory = new Map<string, TwinPin[]>();
const captureMemory = new Map<string, TwinCapture[]>();
const DEFAULT_TWIN_MODEL_URL = '/listing-3d-mockup/models/modern-apartment-building.glb';

function getPropertyById(propertyId: string) {
  return useOwnerPropertiesStore.getState().getPropertyById(propertyId);
}

function getFloorFromUnitNumber(unitNumber: string): number {
  const normalized = unitNumber.trim().toUpperCase();
  if (normalized.startsWith('B')) {
    return -1;
  }

  const numericPrefix = normalized.match(/^\d+/)?.[0];
  if (!numericPrefix) {
    const trailing = normalized.match(/(\d+)/g)?.pop();
    if (trailing) {
      const parsed = Number(trailing);
      return Number.isNaN(parsed) ? 0 : Math.max(parsed - 1, 0);
    }
    return 0;
  }

  if (numericPrefix.length >= 3) {
    const floor = Number(numericPrefix.slice(0, numericPrefix.length - 2));
    return Number.isNaN(floor) ? 0 : floor;
  }

  return Math.max(Number(numericPrefix) - 1, 0);
}

function inferUnitType(bedrooms: number): string {
  if (bedrooms <= 0) return 'commercial';
  if (bedrooms <= 1) return 'studio_plus';
  if (bedrooms === 2) return 'family';
  return 'premium';
}

function buildBaseTwinUnits(propertyId: string): TwinUnit[] {
  const rawUnits = useOwnerPropertiesStore.getState().getUnitsByProperty(propertyId);

  return rawUnits.map((unit) => ({
    id: unit.id,
    property_id: propertyId,
    floor: getFloorFromUnitNumber(unit.unitNumber),
    unit_number: unit.unitNumber,
    unit_type: inferUnitType(unit.bedrooms),
    area_m2: Number((unit.sqft * 0.092903).toFixed(1)),
    current_rent: unit.rent,
    status: unit.status === 'available' ? 'vacant' : 'occupied',
    tenant_name: unit.tenantName ?? null,
    lease_expiry: unit.leaseEnd ?? null,
    has_digital_twin: true,
    last_capture_at: daysAgo(6),
    active_alerts: [],
  }));
}

function getPropertyName(propertyId: string) {
  return getPropertyById(propertyId)?.name ?? 'Bâtiment';
}

function seedPins(propertyId: string): TwinPin[] {
  const units = buildBaseTwinUnits(propertyId);
  const referenceUnits = units.slice(0, Math.min(6, units.length));

  return referenceUnits.map((unit, index) => {
    const point = getTwinUnitLayout(unit, units);
    return {
      id: `pin-${propertyId}-${index + 1}`,
      property_id: propertyId,
      unit_id: unit.id,
      created_by: index === 0 ? 'user-1' : 'user-2',
      coord_x: point.x + 0.25,
      coord_y: point.y + 0.8,
      coord_z: point.z,
      mesh_name: `unit-${unit.unit_number}`,
      wall_type: index === 0 ? 'mur_gypse_38' : 'mur_bloc_150',
      wall_config_snap: {
        thickness_mm: index === 0 ? 89 : 150,
        drf_minutes: index === 0 ? 45 : 90,
      },
      mep_proximity: [
        {
          type: index === 1 ? 'electricite' : 'plomberie',
          pipeType: index === 1 ? 'conduit' : 'cuivre',
          distanceCm: index === 1 ? 34 : 18,
          detail: index === 1 ? 'Circuit prise cuisine' : 'Montée cuisine nord',
        },
      ],
      severity: index === 0 ? 'urgent' : index === 1 ? 'standard' : 'planifie',
      description:
        index === 0
          ? 'Humidité détectée derrière le meuble bas.'
          : index === 1
          ? 'Prise murale chauffante à vérifier.'
          : 'Observation à confirmer lors de la prochaine inspection.',
      photo_urls: [],
      status: index === 2 ? 'assigned' : 'open',
      tooling_rec: index === 0 ? ['Caméra endoscopique', 'Détecteur humidité'] : ['Multimètre', 'Gaine de tirage'],
      duration_est: index === 0 ? '1-2h accès standard' : '45-60 min',
      maintenance_request_id: index === 0 ? 'maint-tenant-101' : null,
      created_at: daysAgo(index + 1),
      resolved_at: null,
    };
  });
}

export function buildTwinUnits(propertyId: string): TwinUnit[] {
  const baseUnits = buildBaseTwinUnits(propertyId);
  const maintenanceRequests = useMaintenanceStore
    .getState()
    .requests.filter((request) => request.propertyId === propertyId && request.status !== 'completed' && request.status !== 'closed');
  const pins = getTwinPinsMock(propertyId);

  return baseUnits.map((unit) => {
    const alerts: TwinAlert[] = [];
    const pinCount = pins.filter((pin) => pin.unit_id === unit.id && pin.status !== 'resolved' && pin.status !== 'dismissed');
    const maintenanceCount = maintenanceRequests.filter((request) => request.unitId === unit.id);

    pinCount.forEach((pin) => {
      alerts.push({
        id: `alert-${pin.id}`,
        alert_type: 'pin',
        severity: pin.severity,
        description: pin.description ?? 'Signalement depuis le digital twin',
        status: pin.status,
        created_at: pin.created_at,
      });
    });

    maintenanceCount.forEach((request, index) => {
      alerts.push({
        id: `maintenance-${request.id}-${index}`,
        alert_type: 'maintenance',
        severity: request.priority === 'emergency' || request.priority === 'high' ? 'urgent' : 'standard',
        description: request.title,
        status: request.status,
        created_at: request.submittedAt,
      });
    });

    return {
      ...unit,
      status:
        alerts.some((alert) => alert.severity === 'urgent')
          ? 'alert'
          : alerts.length > 0
          ? 'warn'
          : unit.status,
      active_alerts: alerts,
    };
  });
}

export function getTwinPinsMock(propertyId: string): TwinPin[] {
  if (!pinMemory.has(propertyId)) {
    pinMemory.set(propertyId, seedPins(propertyId));
  }

  return [...(pinMemory.get(propertyId) ?? [])];
}

export function createTwinPinMock(propertyId: string, payload: CreateTwinPinInput): TwinPin {
  const nextPin: TwinPin = {
    id: `pin-${Date.now()}`,
    property_id: propertyId,
    unit_id: payload.unit_id ?? null,
    created_by: 'user-1',
    coord_x: payload.coord_x,
    coord_y: payload.coord_y,
    coord_z: payload.coord_z,
    mesh_name: payload.mesh_name ?? null,
    wall_type: payload.wall_type ?? 'mur_gypse_38',
    wall_config_snap: {
      thickness_mm: 89,
      drf_minutes: 45,
    },
    mep_proximity: [
      {
        type: 'plomberie',
        pipeType: 'pex',
        distanceCm: 22,
        detail: 'Retour eau froide',
      },
    ],
    severity: payload.severity,
    description: payload.description ?? 'Signalement créé localement',
    photo_urls: [],
    status: 'open',
    tooling_rec: payload.severity === 'urgent' ? ['Détecteur humidité', 'Caméra endoscopique'] : ['Inspection visuelle'],
    duration_est: payload.severity === 'urgent' ? '1-2h' : '30-45 min',
    maintenance_request_id: null,
    created_at: nowIso(),
    resolved_at: null,
  };

  const currentPins = getTwinPinsMock(propertyId);
  pinMemory.set(propertyId, [nextPin, ...currentPins]);
  return nextPin;
}

export function getTwinCapturesMock(propertyId: string): TwinCapture[] {
  if (!captureMemory.has(propertyId)) {
    const property = getPropertyById(propertyId);
    const isProcessing =
      property?.archetypeId === 'industrial' ||
      property?.archetypeId === 'parking-structure' ||
      property?.archetypeId === 'data-center';
    captureMemory.set(propertyId, [
      {
        id: `capture-${propertyId}-1`,
        property_id: propertyId,
        unit_id: null,
        project_id: `odm-${propertyId}`,
        capture_type: 'photos',
        model_url: getPropertyById(propertyId)?.modelUrl ?? DEFAULT_TWIN_MODEL_URL,
        texture_url: null,
        point_count: isProcessing ? 0 : 2480000,
        precision_cm: isProcessing ? null : 2.4,
        status: isProcessing ? 'processing' : 'ready',
        nodeodm_task_id: `task-${propertyId}`,
        error_message: null,
        captured_by: 'user-2',
        created_at: daysAgo(6),
        completed_at: isProcessing ? null : daysAgo(5),
      },
    ]);
  }

  return [...(captureMemory.get(propertyId) ?? [])];
}

export async function createTwinCaptureMock(
  propertyId: string,
  files: File[],
  options: { unitId?: string; captureType: string },
  onProgress?: (pct: number) => void,
): Promise<TwinCapture> {
  for (const pct of [14, 37, 64, 88, 100]) {
    onProgress?.(pct);
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  const created: TwinCapture = {
    id: `capture-${Date.now()}`,
    property_id: propertyId,
    unit_id: options.unitId ?? null,
    project_id: `odm-${Date.now()}`,
    capture_type: options.captureType,
    model_url: files.length > 0 ? getPropertyById(propertyId)?.modelUrl ?? DEFAULT_TWIN_MODEL_URL : null,
    texture_url: null,
    point_count: 2564000,
    precision_cm: 2.1,
    status: 'ready',
    nodeodm_task_id: `task-${Date.now()}`,
    error_message: null,
    captured_by: 'user-2',
    created_at: nowIso(),
    completed_at: nowIso(),
  };

  const current = getTwinCapturesMock(propertyId);
  captureMemory.set(propertyId, [created, ...current]);
  return created;
}

export function getTwinPassportLayersMock(propertyId: string): TwinPassportLayer[] {
  const propertyName = getPropertyName(propertyId);
  const property = getPropertyById(propertyId);
  const lowCompleteness =
    property?.archetypeId === 'industrial' ||
    property?.archetypeId === 'parking-structure' ||
    property?.archetypeId === 'warehouse';

  return [
    {
      id: `passport-${propertyId}-cadastral`,
      property_id: propertyId,
      layer_type: 'cadastral',
      completeness_percent: 92,
      data_points: {
        cadastre: `${propertyName} / lot 2026-14`,
        surface: 'Conforme',
      },
      last_updated: daysAgo(20),
    },
    {
      id: `passport-${propertyId}-structural`,
      property_id: propertyId,
      layer_type: 'structural',
      completeness_percent: lowCompleteness ? 64 : 88,
      data_points: {
        envelope: 'Stable',
        facade: 'Relevé ODM disponible',
      },
      last_updated: daysAgo(7),
    },
    {
      id: `passport-${propertyId}-mep`,
      property_id: propertyId,
      layer_type: 'mep',
      completeness_percent: lowCompleteness ? 55 : 84,
      data_points: {
        plomberie: 'Tracés validés',
        electricite: '2 zones à confirmer',
      },
      last_updated: daysAgo(5),
    },
    {
      id: `passport-${propertyId}-operational`,
      property_id: propertyId,
      layer_type: 'operational',
      completeness_percent: 78,
      data_points: {
        cameras: 4,
        maintenance: 'Temps réel prêt',
      },
      last_updated: daysAgo(3),
    },
    {
      id: `passport-${propertyId}-valuation`,
      property_id: propertyId,
      layer_type: 'valuation',
      completeness_percent: 70,
      data_points: {
        resilience: 'Bon',
        valueSignal: 'Mise à jour Q2 2026',
      },
      last_updated: daysAgo(10),
    },
  ];
}

export function getTwinManifestMock(propertyId: string): TwinManifest {
  const property = getPropertyById(propertyId);
  const units = buildTwinUnits(propertyId);
  const captures = getTwinCapturesMock(propertyId);
  const passportLayers = getTwinPassportLayersMock(propertyId);
  const score = Math.round(
    passportLayers.reduce((acc, layer) => acc + layer.completeness_percent, 0) / passportLayers.length
  );

  return {
    property_id: propertyId,
    address: property
      ? `${property.address.street}, ${property.address.city}, ${property.address.province}`
      : 'Adresse inconnue',
    floors: Math.max(...units.map((unit) => unit.floor), 0) + 1,
    total_units: units.length,
    has_odm_model: captures.some((capture) => capture.status === 'ready' && Boolean(capture.model_url)),
    odm_model_url: captures.find((capture) => capture.model_url)?.model_url ?? property?.modelUrl ?? DEFAULT_TWIN_MODEL_URL,
    building_passport_score: score,
    updated_at: daysAgo(1),
  };
}

export function getTwinUnitsForUser(propertyId: string, unitId?: string | null): TwinUnit[] {
  const units = buildTwinUnits(propertyId);
  if (!unitId) {
    return units;
  }
  return units.filter((unit) => unit.id === unitId);
}

export function getNextCaptureEta(propertyId: string) {
  const captures = getTwinCapturesMock(propertyId);
  const latest = captures.find((capture) => capture.status === 'processing');
  return latest ? daysAhead(1) : null;
}
