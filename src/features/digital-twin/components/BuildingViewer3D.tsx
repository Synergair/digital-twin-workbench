import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TwinLayer, TwinPin, TwinTab, TwinUnit, TwinView } from '../types';
import { parseOntologyEntities, parseSensorSamples } from '../overlaySources';

type XeokitModule = typeof import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js');

type XeokitRuntime = {
  viewer: any;
  navCube: any;
  model: any;
  sectionPlanes: any;
  decorations: any[];
  objectIds: string[];
  floorObjectIds: Map<number, string[]>;
  layerObjectIds: Record<'plomberie' | 'hvac' | 'electricite', string[]>;
  modelAabb: number[] | null;
  focusAabb: number[] | null;
  markers: Map<string, any>;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  overlaySeed: number;
};

const markerPalette = {
  urgent: '#dc2626',
  standard: '#0284c7',
  planifie: '#f59e0b',
};

const layerPalette = {
  plomberie: { color: '#38bdf8', rgb: [0.22, 0.74, 0.95] as number[] },
  hvac: { color: '#22c55e', rgb: [0.13, 0.77, 0.37] as number[] },
  electricite: { color: '#f59e0b', rgb: [0.96, 0.62, 0.04] as number[] },
  zones: { color: '#f8fafc', rgb: [0.97, 0.98, 1] as number[] },
  cameras: { color: '#c084fc', rgb: [0.75, 0.52, 0.99] as number[] },
  maintenance: { color: '#fb7185', rgb: [0.98, 0.44, 0.52] as number[] },
};

const systemLayers: Array<'plomberie' | 'hvac' | 'electricite'> = ['plomberie', 'hvac', 'electricite'];

const overlayPalette: Record<string, { color: string; rgb: number[]; icon: 'dot' | 'camera' | 'bolt' | 'fan' | 'drop' | 'zone' }> = {
  structure: { color: '#94a3b8', rgb: [0.58, 0.64, 0.72], icon: 'zone' },
  envelope: { color: '#f97316', rgb: [0.98, 0.45, 0.09], icon: 'dot' },
  fire: { color: '#ef4444', rgb: [0.94, 0.27, 0.27], icon: 'bolt' },
  security: { color: '#6366f1', rgb: [0.39, 0.4, 0.94], icon: 'camera' },
  it: { color: '#22c55e', rgb: [0.13, 0.77, 0.37], icon: 'bolt' },
  elevators: { color: '#a855f7', rgb: [0.66, 0.33, 0.97], icon: 'zone' },
  stairs: { color: '#c084fc', rgb: [0.75, 0.52, 0.99], icon: 'zone' },
  parking: { color: '#0ea5e9', rgb: [0.05, 0.65, 0.91], icon: 'zone' },
  roof: { color: '#0f766e', rgb: [0.06, 0.46, 0.43], icon: 'zone' },
  solar: { color: '#eab308', rgb: [0.92, 0.7, 0.03], icon: 'bolt' },
  water: { color: '#38bdf8', rgb: [0.22, 0.74, 0.95], icon: 'drop' },
  gas: { color: '#f59e0b', rgb: [0.96, 0.62, 0.04], icon: 'dot' },
  drainage: { color: '#334155', rgb: [0.2, 0.25, 0.33], icon: 'dot' },
  sprinklers: { color: '#fb7185', rgb: [0.98, 0.44, 0.52], icon: 'drop' },
  lighting: { color: '#fde047', rgb: [0.99, 0.88, 0.28], icon: 'dot' },
  access: { color: '#14b8a6', rgb: [0.08, 0.72, 0.65], icon: 'zone' },
  sensors: { color: '#22d3ee', rgb: [0.13, 0.83, 0.93], icon: 'dot' },
  communs: { color: '#64748b', rgb: [0.39, 0.45, 0.55], icon: 'zone' },
  lockers: { color: '#a78bfa', rgb: [0.65, 0.55, 0.98], icon: 'zone' },
  pool: { color: '#06b6d4', rgb: [0.02, 0.71, 0.83], icon: 'drop' },
  farming: { color: '#84cc16', rgb: [0.52, 0.8, 0.09], icon: 'dot' },
  rooftop3d: { color: '#78716c', rgb: [0.47, 0.44, 0.42], icon: 'zone' },
  internet: { color: '#3b82f6', rgb: [0.23, 0.51, 0.96], icon: 'bolt' },
  electrical: { color: '#f59e0b', rgb: [0.96, 0.62, 0.04], icon: 'bolt' },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const centerOfAabb = (aabb: number[]) => [
  (aabb[0] + aabb[3]) / 2,
  (aabb[1] + aabb[4]) / 2,
  (aabb[2] + aabb[5]) / 2,
];

const sizeOfAabb = (aabb: number[]) => [
  Math.max(aabb[3] - aabb[0], 0.001),
  Math.max(aabb[4] - aabb[1], 0.001),
  Math.max(aabb[5] - aabb[2], 0.001),
];

const makeMarkerDataUrl = (color: string, kind: 'dot' | 'camera' | 'bolt' | 'fan' | 'drop' | 'zone' = 'dot') => {
  const icon =
    kind === 'camera'
      ? `<path d="M18 24h10l4-5h8l4 5h2c3.3 0 6 2.7 6 6v14c0 3.3-2.7 6-6 6H18c-3.3 0-6-2.7-6-6V30c0-3.3 2.7-6 6-6z" fill="${color}"/><circle cx="32" cy="37" r="8" fill="#fff"/><circle cx="32" cy="37" r="4" fill="${color}"/>`
      : kind === 'bolt'
      ? `<path d="M31 8 17 34h11l-5 22 24-31H36l5-17z" fill="${color}"/>`
      : kind === 'fan'
      ? `<circle cx="32" cy="32" r="5" fill="#fff"/><path d="M32 13c7 0 12 5 12 12-7 1-12-4-12-12Zm19 19c0 7-5 12-12 12-1-7 4-12 12-12ZM32 51c-7 0-12-5-12-12 7-1 12 4 12 12ZM13 32c0-7 5-12 12-12 1 7-4 12-12 12Z" fill="${color}"/>`
      : kind === 'drop'
      ? `<path d="M32 10c7 10 14 17 14 26a14 14 0 1 1-28 0c0-9 7-16 14-26Z" fill="${color}"/><path d="M38 37a7 7 0 0 1-7 7" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`
      : kind === 'zone'
      ? `<circle cx="32" cy="32" r="17" fill="none" stroke="${color}" stroke-width="6"/><circle cx="32" cy="32" r="6" fill="${color}"/>`
      : `<circle cx="32" cy="32" r="18" fill="${color}" fill-opacity="0.92"/><circle cx="32" cy="32" r="29" fill="${color}" fill-opacity="0.18"/><circle cx="32" cy="32" r="9" fill="#ffffff"/>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${icon}</svg>`,
  )}`;
};

function getFloors(units: TwinUnit[]) {
  return Array.from(new Set(units.map((unit) => unit.floor))).sort((a, b) => a - b);
}

function resolveFloorFromHeight(y: number, floors: number[], aabb: number[]) {
  if (!floors.length) {
    return 0;
  }

  const [, minY] = aabb;
  const [, height] = [0, sizeOfAabb(aabb)[1]];
  const relative = clamp((y - minY) / height, 0, 0.9999);
  const index = clamp(Math.floor(relative * floors.length), 0, floors.length - 1);
  return floors[index];
}

function getUnitAnchor(unit: TwinUnit, units: TwinUnit[], aabb: number[]) {
  const floors = getFloors(units);
  const sameFloorUnits = units
    .filter((entry) => entry.floor === unit.floor)
    .sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'fr-CA', { numeric: true, sensitivity: 'base' }));
  const index = Math.max(
    0,
    sameFloorUnits.findIndex((entry) => entry.id === unit.id),
  );
  const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(sameFloorUnits.length || 1))));
  const rows = Math.max(1, Math.ceil(sameFloorUnits.length / columns));
  const column = index % columns;
  const row = Math.floor(index / columns);
  const [minX, minY, minZ, maxX, maxY, maxZ] = aabb;
  const [width, height, depth] = sizeOfAabb(aabb);
  const floorIndex = Math.max(0, floors.indexOf(unit.floor));
  const bandHeight = height / Math.max(floors.length, 1);
  const xRatio = columns === 1 ? 0.5 : column / (columns - 1);
  const zRatio = rows === 1 ? 0.45 : row / Math.max(rows - 1, 1);

  return [
    minX + width * (0.18 + xRatio * 0.64),
    minY + floorIndex * bandHeight + bandHeight * 0.5,
    maxZ - depth * (0.18 + zRatio * 0.22),
  ];
}

function getClosestUnit(worldPos: number[], units: TwinUnit[], aabb: number[]) {
  if (!units.length) {
    return null;
  }

  const targetFloor = resolveFloorFromHeight(worldPos[1], getFloors(units), aabb);
  const candidateUnits = units.filter((unit) => unit.floor === targetFloor);
  const sourceUnits = candidateUnits.length ? candidateUnits : units;

  return sourceUnits.reduce<{ unit: TwinUnit; distance: number } | null>((best, unit) => {
    const anchor = getUnitAnchor(unit, units, aabb);
    const distance = Math.hypot(worldPos[0] - anchor[0], worldPos[1] - anchor[1], worldPos[2] - anchor[2]);
    if (!best || distance < best.distance) {
      return { unit, distance };
    }
    return best;
  }, null)?.unit ?? null;
}

function isPointInsideAabb(point: number[], aabb: number[]) {
  return (
    point[0] >= aabb[0] &&
    point[0] <= aabb[3] &&
    point[1] >= aabb[1] &&
    point[1] <= aabb[4] &&
    point[2] >= aabb[2] &&
    point[2] <= aabb[5]
  );
}

function getPinWorldPos(pin: TwinPin, units: TwinUnit[], aabb: number[]) {
  const explicitPoint = [pin.coord_x, pin.coord_y, pin.coord_z];
  if (isPointInsideAabb(explicitPoint, aabb)) {
    return explicitPoint;
  }

  const unit = units.find((entry) => entry.id === pin.unit_id);
  if (unit) {
    const anchor = getUnitAnchor(unit, units, aabb);
    return [anchor[0], anchor[1] + 0.32, anchor[2]];
  }

  const center = centerOfAabb(aabb);
  return [center[0], center[1], aabb[5] - sizeOfAabb(aabb)[2] * 0.18];
}

function getViewTarget(view: TwinView, aabb: number[]) {
  const center = centerOfAabb(aabb);
  const [width, height, depth] = sizeOfAabb(aabb);
  const distance = Math.max(width, height, depth) * 1.45;

  if (view === 'facade') {
    return {
      eye: [center[0], center[1] + height * 0.15, aabb[5] + distance],
      look: center,
      up: [0, 1, 0],
      projection: 'perspective' as const,
    };
  }

  if (view === 'dessus') {
    return {
      eye: [center[0], aabb[4] + distance, center[2]],
      look: center,
      up: [0, 0, -1],
      projection: 'ortho' as const,
    };
  }

  if (view === 'cote') {
    return {
      eye: [aabb[3] + distance, center[1] + height * 0.08, center[2]],
      look: center,
      up: [0, 1, 0],
      projection: 'perspective' as const,
    };
  }

  if (view === 'inside') {
    return {
      eye: [center[0] + width * 0.12, center[1] + height * 0.04, center[2] + depth * 0.52],
      look: [center[0], center[1], center[2] - depth * 0.12],
      up: [0, 1, 0],
      projection: 'perspective' as const,
    };
  }

  return {
    eye: [aabb[3] + distance * 0.7, aabb[4] + distance * 0.35, aabb[5] + distance * 0.7],
    look: center,
    up: [0, 1, 0],
    projection: 'perspective' as const,
  };
}

function getTabColor(tab: TwinTab) {
  if (tab === 'structure') return [0.55, 0.65, 0.76];
  if (tab === 'parking') return [0.87, 0.65, 0.32];
  if (tab === 'unites') return [0.36, 0.68, 0.92];
  return [0.15, 0.58, 0.57];
}

function getWorkingAabb(runtime: Pick<XeokitRuntime, 'focusAabb' | 'modelAabb'>) {
  return runtime.focusAabb ?? runtime.modelAabb;
}

function buildLayerObjectIds(floors: number[], floorObjectIds: Map<number, string[]>) {
  const layerObjectIds: XeokitRuntime['layerObjectIds'] = {
    plomberie: [],
    hvac: [],
    electricite: [],
  };

  floors.forEach((floor, floorIndex) => {
    const ids = floorObjectIds.get(floor) ?? [];
    ids.forEach((objectId) => {
      const bucket = (hashString(objectId) + floorIndex) % 9;
      if (bucket <= 1) {
        layerObjectIds.plomberie.push(objectId);
      } else if (bucket <= 3) {
        layerObjectIds.hvac.push(objectId);
      } else if (bucket <= 5) {
        layerObjectIds.electricite.push(objectId);
      }
    });
  });

  return layerObjectIds;
}

function getCameraWorldPositions(units: TwinUnit[], aabb: number[]) {
  const floors = getFloors(units);
  const [minX, , minZ, maxX, , maxZ] = aabb;
  const [width, height, depth] = sizeOfAabb(aabb);
  const floorHeight = height / Math.max(floors.length, 1);

  return floors.map((floor, index) => [
    minX + width * (index % 2 === 0 ? 0.14 : 0.84),
    aabb[1] + floorHeight * (index + 0.74),
    minZ + depth * (index % 2 === 0 ? 0.18 : 0.82),
  ]);
}

function getSystemMarkerPositions(layer: 'plomberie' | 'hvac' | 'electricite', units: TwinUnit[], aabb: number[]) {
  const visibleUnits = units
    .slice()
    .sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'fr-CA', { numeric: true, sensitivity: 'base' }));

  return visibleUnits
    .filter((_, index) =>
      layer === 'plomberie'
        ? index % 3 === 0
        : layer === 'hvac'
        ? index % 3 === 1
        : index % 3 === 2,
    )
    .slice(0, 8)
    .map((unit) => {
      const anchor = getUnitAnchor(unit, units, aabb);
      return [
        anchor[0] + (layer === 'electricite' ? 0.55 : layer === 'plomberie' ? -0.35 : 0),
        anchor[1] + (layer === 'hvac' ? 0.75 : 0.4),
        anchor[2] + (layer === 'plomberie' ? -0.4 : 0.2),
      ];
    });
}

function getLayerMarkerPositions(layer: string, units: TwinUnit[], aabb: number[]) {
  const anchors = units.slice(0, 8).map((unit) => getUnitAnchor(unit, units, aabb));
  const center = centerOfAabb(aabb);
  const [width, height, depth] = sizeOfAabb(aabb);

  if (layer === 'roof' || layer === 'solar') {
    return [[center[0], aabb[4] - height * 0.02, center[2]]];
  }

  if (layer === 'parking') {
    return [[center[0], aabb[1] + height * 0.05, center[2] + depth * 0.15]];
  }

  if (layer === 'elevators') {
    return [[center[0] - width * 0.08, center[1], center[2] - depth * 0.08]];
  }

  if (layer === 'stairs') {
    return [[center[0] + width * 0.1, center[1], center[2] - depth * 0.08]];
  }

  if (layer === 'fire' || layer === 'security' || layer === 'access') {
    return anchors.map((anchor, index) => [
      anchor[0] + (index % 2 === 0 ? -0.45 : 0.45),
      anchor[1] + 0.5,
      anchor[2] + (index % 3 === 0 ? 0.4 : -0.3),
    ]);
  }

  return anchors.map((anchor, index) => [
    anchor[0] + (index % 2 === 0 ? 0.3 : -0.3),
    anchor[1] + 0.4,
    anchor[2] + (index % 3 === 0 ? 0.2 : -0.2),
  ]);
}

function createLineMesh(
  xeokit: XeokitModule,
  scene: any,
  id: string,
  startPoint: number[],
  endPoint: number[],
  color: number[],
  pattern?: number[],
) {
  return new xeokit.Mesh(scene, {
    id,
    isObject: false,
    pickable: false,
    collidable: false,
    geometry: new xeokit.ReadableGeometry(
      scene,
      xeokit.buildLineGeometry({
        startPoint,
        endPoint,
        ...(pattern ? { pattern, extendToEnd: true } : {}),
      }),
    ),
    material: new xeokit.PhongMaterial(scene, {
      emissive: color,
      diffuse: color,
      lineWidth: 2,
    }),
  });
}

function createBoxMesh(
  xeokit: XeokitModule,
  scene: any,
  id: string,
  position: number[],
  scale: number[],
  color: number[],
  alpha = 0.35,
) {
  return new xeokit.Mesh(scene, {
    id,
    isObject: false,
    pickable: false,
    collidable: false,
    position,
    scale,
    geometry: new xeokit.ReadableGeometry(
      scene,
      xeokit.buildBoxGeometry({
        xSize: 1,
        ySize: 1,
        zSize: 1,
      }),
    ),
    material: new xeokit.PhongMaterial(scene, {
      diffuse: color,
      emissive: color.map((channel) => Math.min(channel * 0.35, 1)),
      alpha,
      alphaMode: 'blend',
      shininess: 80,
      backfaces: true,
    }),
  });
}

export function BuildingViewer3D({
  modelUrl,
  units,
  pins,
  activeLayers,
  isolatedFloor,
  selectedUnitId,
  hoveredUnitId,
  xrayMode,
  explodedMode,
  explodedFactor,
  activeView,
  activeTab,
  pinDropMode,
  readOnly,
  isDarkMode = true,
  onSelectUnit,
  onHoverUnit,
  onCreatePin,
}: {
  modelUrl: string;
  units: TwinUnit[];
  pins: TwinPin[];
  activeLayers: Set<TwinLayer>;
  isolatedFloor: number | null;
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  xrayMode: boolean;
  explodedMode: boolean;
  explodedFactor: number;
  activeView: TwinView;
  activeTab: TwinTab;
  pinDropMode: boolean;
  readOnly: boolean;
  isDarkMode?: boolean;
  onSelectUnit: (unitId: string | null, screenX?: number, screenY?: number) => void;
  onHoverUnit: (unitId: string | null, screenX?: number, screenY?: number) => void;
  onCreatePin: (point: { x: number; y: number; z: number }, unitId: string) => void;
}) {
  const canvasId = useId().replace(/:/g, '-');
  const navCubeId = useId().replace(/:/g, '-');
  const floors = useMemo(() => getFloors(units), [units]);
  const sensorSamples = useMemo(() => parseSensorSamples(), []);
  const ontologyEntities = useMemo(() => parseOntologyEntities(), []);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navCubeRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<XeokitRuntime | null>(null);
  const unitsRef = useRef(units);
  const floorsRef = useRef(floors);
  const pinDropModeRef = useRef(pinDropMode);
  const readOnlyRef = useRef(readOnly);
  const onSelectUnitRef = useRef(onSelectUnit);
  const onHoverUnitRef = useRef(onHoverUnit);
  const onCreatePinRef = useRef(onCreatePin);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const visibleUnits = useMemo(
    () => (isolatedFloor === null ? units : units.filter((unit) => unit.floor === isolatedFloor)),
    [isolatedFloor, units],
  );

  useEffect(() => {
    unitsRef.current = units;
    floorsRef.current = floors;
    pinDropModeRef.current = pinDropMode;
    readOnlyRef.current = readOnly;
    onSelectUnitRef.current = onSelectUnit;
    onHoverUnitRef.current = onHoverUnit;
    onCreatePinRef.current = onCreatePin;
  }, [floors, onCreatePin, onHoverUnit, onSelectUnit, pinDropMode, readOnly, units]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return;
    }

    const lockViewportScroll = (event: WheelEvent | TouchEvent) => {
      event.preventDefault();
    };

    element.addEventListener('wheel', lockViewportScroll, { passive: false });
    element.addEventListener('touchmove', lockViewportScroll, { passive: false });

    return () => {
      element.removeEventListener('wheel', lockViewportScroll);
      element.removeEventListener('touchmove', lockViewportScroll);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanupHoverOff: string | null = null;
    let cleanupHoverEnter: string | null = null;
    let cleanupPickedSurface: string | null = null;

    const start = async () => {
      if (!canvasRef.current || !navCubeRef.current) {
        return;
      }

      setStatus('loading');
      setErrorMessage(null);

      try {
        const xeokit = (await import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js')) as XeokitModule;

        if (disposed || !canvasRef.current || !navCubeRef.current) {
          return;
        }

        const viewer = new xeokit.Viewer({
          canvasElement: canvasRef.current,
          transparent: true,
          antialias: true,
          saoEnabled: true,
          readableGeometryEnabled: true,
          entityOffsetsEnabled: true,
          numCachedSectionPlanes: 2,
        });

        viewer.scene.canvas.canvas.style.width = '100%';
        viewer.scene.canvas.canvas.style.height = '100%';
        viewer.cameraControl.navMode = 'orbit';
        viewer.cameraControl.followPointer = false;
        viewer.cameraControl.smartPivot = false;
        viewer.cameraControl.doublePickFlyTo = false;
        viewer.cameraControl.keyboardEnabledOnlyIfMouseover = true;
        viewer.cameraControl.rotationInertia = 0.12;

        // 3dtwin-style green selection (like their unit highlighting)
        viewer.scene.selectedMaterial.fillColor = [0.13, 0.77, 0.37]; // Emerald green
        viewer.scene.selectedMaterial.fillAlpha = 0.45;
        viewer.scene.selectedMaterial.edgeColor = [0.13, 0.77, 0.37];
        viewer.scene.selectedMaterial.edgeAlpha = 1.0;

        // Hover highlight - subtle teal
        viewer.scene.highlightMaterial.fillColor = [0.05, 0.58, 0.52]; // Teal
        viewer.scene.highlightMaterial.fillAlpha = 0.25;
        viewer.scene.highlightMaterial.edgeColor = [0.05, 0.8, 0.7];
        viewer.scene.highlightMaterial.edgeAlpha = 0.95;

        const navCube = new xeokit.NavCubePlugin(viewer, {
          canvasElement: navCubeRef.current,
          visible: true,
          cameraFly: true,
          cameraFitFOV: 38,
          cameraFlyDuration: 0.45,
          frontColor: '#0d7377',
          topColor: '#d6eceb',
          rightColor: '#9ed4d1',
          leftColor: '#77b6b2',
          textColor: '#17393a',
        });

        const sectionPlanes = new xeokit.SectionPlanesPlugin(viewer, { overviewVisible: false });
        const isIfc = modelUrl.toLowerCase().endsWith('.ifc');
        let model: any;

        if (isIfc && xeokit.WebIFCLoaderPlugin) {
          const ifcLoader = new xeokit.WebIFCLoaderPlugin(viewer, {
            wasmPath: 'https://cdn.jsdelivr.net/npm/web-ifc@0.0.51/',
          });
          model = ifcLoader.load({
            id: 'digitalTwinModel',
            src: modelUrl,
            edges: true,
            loadMetadata: true,
          });
        } else {
          const gltfLoader = new xeokit.GLTFLoaderPlugin(viewer);
          model = gltfLoader.load({
            id: 'digitalTwinModel',
            src: modelUrl,
            edges: true,
            autoMetaModel: true,
            performance: false,
          });
        }

        const runtime: XeokitRuntime = {
          viewer,
          navCube,
          model,
          sectionPlanes,
          decorations: [],
          objectIds: [],
          floorObjectIds: new Map<number, string[]>(),
          layerObjectIds: {
            plomberie: [],
            hvac: [],
            electricite: [],
          },
          modelAabb: null,
          focusAabb: null,
          markers: new Map<string, any>(),
          selectedObjectId: null,
          hoveredObjectId: null,
          overlaySeed: 0,
        };

        runtimeRef.current = runtime;

        cleanupHoverOff = viewer.cameraControl.on('hoverOff', () => {
          if (runtime.hoveredObjectId) {
            viewer.scene.setObjectsHighlighted([runtime.hoveredObjectId], false);
            runtime.hoveredObjectId = null;
          }
          onHoverUnitRef.current(null, undefined, undefined);
        });

        cleanupHoverEnter = viewer.cameraControl.on('hoverEnter', (pickResult: any) => {
          if (!runtime.modelAabb) {
            return;
          }

          if (runtime.hoveredObjectId && runtime.hoveredObjectId !== pickResult.entity?.id) {
            viewer.scene.setObjectsHighlighted([runtime.hoveredObjectId], false);
          }

          if (pickResult.entity?.id) {
            runtime.hoveredObjectId = String(pickResult.entity.id);
            viewer.scene.setObjectsHighlighted([runtime.hoveredObjectId], true);
          }

          if (pickResult.worldPos) {
            const closest = getClosestUnit(Array.from(pickResult.worldPos), unitsRef.current, runtime.modelAabb);
            // Get screen coordinates from canvas position
            const canvasPos = pickResult.canvasPos;
            const screenX = canvasPos ? canvasPos[0] : undefined;
            const screenY = canvasPos ? canvasPos[1] : undefined;
            onHoverUnitRef.current(closest?.id ?? null, screenX, screenY);
          }
        });

        cleanupPickedSurface = viewer.cameraControl.on('pickedSurface', (pickResult: any) => {
          if (!runtime.modelAabb || !pickResult.worldPos) {
            return;
          }

          const point = Array.from(pickResult.worldPos) as number[];
          const closestUnit = getClosestUnit(point, unitsRef.current, runtime.modelAabb) ?? unitsRef.current[0] ?? null;

          if (pinDropModeRef.current && !readOnlyRef.current && closestUnit) {
            onCreatePinRef.current({ x: point[0], y: point[1], z: point[2] }, closestUnit.id);
            return;
          }

          // Get screen coordinates from canvas position
          const canvasPos = pickResult.canvasPos;
          const screenX = canvasPos ? canvasPos[0] : undefined;
          const screenY = canvasPos ? canvasPos[1] : undefined;

          if (closestUnit) {
            onSelectUnitRef.current(closestUnit.id, screenX, screenY);
          }

          if (runtime.selectedObjectId) {
            viewer.scene.setObjectsSelected([runtime.selectedObjectId], false);
          }

          if (pickResult.entity?.id) {
            runtime.selectedObjectId = String(pickResult.entity.id);
            viewer.scene.setObjectsSelected([runtime.selectedObjectId], true);
          }
        });

        const onLoaded = () => {
          if (disposed || !runtimeRef.current) {
            return;
          }

          const objectIds = Object.keys(viewer.scene.objects);
          runtime.objectIds = objectIds;
          runtime.modelAabb = objectIds.length ? viewer.scene.getAABB(objectIds) : model.aabb ?? null;

          if (!runtime.modelAabb) {
            setStatus('error');
            setErrorMessage('Le modèle 3D a été chargé, mais ses limites n’ont pas pu être calculées.');
            return;
          }

          const grouped = new Map<number, string[]>();
          const fullHeight = sizeOfAabb(runtime.modelAabb)[1];
          const focusIds: string[] = [];
          objectIds.forEach((objectId) => {
            const entity = viewer.scene.objects[objectId];
            const objectAabb = entity?.aabb;
            if (!objectAabb) {
              return;
            }
            if ((objectAabb[1] + objectAabb[4]) / 2 > runtime.modelAabb![1] + fullHeight * 0.08) {
              focusIds.push(objectId);
            }
            const floor = resolveFloorFromHeight((objectAabb[1] + objectAabb[4]) / 2, floorsRef.current, runtime.modelAabb!);
            const current = grouped.get(floor) ?? [];
            current.push(objectId);
            grouped.set(floor, current);
          });
          runtime.floorObjectIds = grouped;
          runtime.layerObjectIds = buildLayerObjectIds(floorsRef.current, grouped);
          runtime.focusAabb = focusIds.length ? viewer.scene.getAABB(focusIds) : runtime.modelAabb;

          const workingAabb = getWorkingAabb(runtime)!;
          const initialView = getViewTarget('iso', workingAabb);
          viewer.cameraFlight.jumpTo({
            eye: initialView.eye,
            look: initialView.look,
            up: initialView.up,
            projection: initialView.projection,
            fit: false,
          });
          viewer.camera.look = initialView.look;
          viewer.cameraControl.pivotPos = initialView.look;

          setStatus('ready');
        };

        model.on?.('loaded', onLoaded);
        model.on?.('error', (message: string) => {
          if (!disposed) {
            setStatus('error');
            setErrorMessage(message || 'Le modèle BIM n’a pas pu être chargé.');
          }
        });
      } catch (error) {
        if (!disposed) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Impossible d’initialiser xeokit.');
        }
      }
    };

    void start();

    return () => {
      disposed = true;
      const runtime = runtimeRef.current;
      if (runtime?.viewer) {
        if (cleanupHoverOff) runtime.viewer.cameraControl.off?.(cleanupHoverOff);
        if (cleanupHoverEnter) runtime.viewer.cameraControl.off?.(cleanupHoverEnter);
        if (cleanupPickedSurface) runtime.viewer.cameraControl.off?.(cleanupPickedSurface);
        runtime.markers.forEach((marker) => marker.destroy?.());
        runtime.decorations.forEach((decoration) => decoration.destroy?.());
        runtime.viewer.destroy?.();
      }
      runtimeRef.current = null;
    };
  }, [modelUrl]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.viewer || !runtime.modelAabb) {
      return;
    }

    const { viewer, objectIds, floorObjectIds, modelAabb, layerObjectIds } = runtime;

    if (objectIds.length) {
      viewer.scene.setObjectsVisible(objectIds, true);
      viewer.scene.setObjectsXRayed(objectIds, false);
      viewer.scene.setObjectsOpacity(objectIds, 1);
      viewer.scene.setObjectsColorized(objectIds, [1, 1, 1]);
      viewer.scene.setObjectsOffset(objectIds, [0, 0, 0]);
    }

    if (isolatedFloor !== null) {
      const visibleIds = floorObjectIds.get(isolatedFloor) ?? [];
      const hiddenIds = objectIds.filter((id) => !visibleIds.includes(id));
      if (hiddenIds.length) {
        viewer.scene.setObjectsVisible(hiddenIds, false);
      }
    }

    if (xrayMode && objectIds.length) {
      viewer.scene.setObjectsXRayed(objectIds, true);
      viewer.scene.setObjectsOpacity(objectIds, 0.42);
    }

    const tabColor = getTabColor(activeTab);
    if (objectIds.length) {
      viewer.scene.setObjectsColorized(objectIds, tabColor);
    }

    const activeSystemLayers = systemLayers.filter((layer) => activeLayers.has(layer));
    if (activeSystemLayers.length) {
      viewer.scene.setObjectsOpacity(objectIds, xrayMode ? 0.16 : 0.24);
      viewer.scene.setObjectsXRayed(objectIds, true);
      activeSystemLayers.forEach((layer) => {
        const ids = layerObjectIds[layer];
        if (!ids.length) {
          return;
        }
        viewer.scene.setObjectsXRayed(ids, false);
        viewer.scene.setObjectsOpacity(ids, xrayMode ? 0.72 : 0.92);
        viewer.scene.setObjectsColorized(ids, layerPalette[layer].rgb);
        viewer.scene.setObjectsEdges(ids, true);
      });
    }

    if (explodedMode) {
      const factor = clamp(explodedFactor, 0.05, 1.2);
      const step = sizeOfAabb(modelAabb)[1] / Math.max(floors.length, 1) * 0.24 * factor;
      floors.forEach((floor, index) => {
        const ids = floorObjectIds.get(floor) ?? [];
        if (ids.length) {
          viewer.scene.setObjectsOffset(ids, [0, index * step, 0]);
        }
      });
    }
  }, [activeLayers, activeTab, explodedMode, explodedFactor, floors, isolatedFloor, xrayMode]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.viewer || !runtime.modelAabb || status !== 'ready') {
      return;
    }

    const workingAabb = getWorkingAabb(runtime);
    if (!workingAabb) {
      return;
    }

    runtime.sectionPlanes?.clear?.();
    if (activeView === 'inside') {
      const center = centerOfAabb(workingAabb);
      const [, , depth] = sizeOfAabb(workingAabb);
      runtime.sectionPlanes?.createSectionPlane?.({
        id: 'inside-cut',
        pos: [center[0], center[1], center[2] + depth * 0.08],
        dir: [0, 0, -1],
        active: true,
      });
    }

    const nextView = getViewTarget(activeView, workingAabb);
    runtime.viewer.cameraFlight.flyTo({
      eye: nextView.eye,
      look: nextView.look,
      up: nextView.up,
      projection: nextView.projection,
      fit: false,
      duration: 0.45,
    });
    runtime.viewer.camera.look = nextView.look;
    runtime.viewer.cameraControl.pivotPos = nextView.look;
  }, [activeView, status]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.viewer || !runtime.modelAabb || status !== 'ready') {
      return;
    }

    if (selectedUnitId) {
      const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
      if (selectedUnit && activeView === 'inside') {
        const anchor = getUnitAnchor(selectedUnit, units, getWorkingAabb(runtime) ?? runtime.modelAabb);
        runtime.viewer.cameraFlight.flyTo({
          eye: [anchor[0] + 4.2, anchor[1] + 2.1, anchor[2] + 7.5],
          look: anchor,
          up: [0, 1, 0],
          fit: false,
          duration: 0.55,
        });
        runtime.viewer.camera.look = anchor;
        runtime.viewer.cameraControl.pivotPos = anchor;
        return;
      }
    }

    const workingAabb = getWorkingAabb(runtime) ?? runtime.modelAabb;
    const center = centerOfAabb(workingAabb);
    runtime.viewer.camera.look = center;
    runtime.viewer.cameraControl.pivotPos = center;
  }, [activeView, selectedUnitId, status, units]);

  // Day/Night lighting effect
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.viewer || status !== 'ready') {
      return;
    }

    const { scene } = runtime.viewer;
    const lights = scene.lights;

    // Find or create ambient and directional lights
    let ambientLight = Object.values(lights).find((l: any) => l.type === 'ambient');
    let dirLight = Object.values(lights).find((l: any) => l.type === 'dir');

    if (isDarkMode) {
      // Night mode - darker ambient, cooler tones, subtle moonlight
      if (ambientLight) {
        ambientLight.color = [0.15, 0.18, 0.25];
        ambientLight.intensity = 0.5;
      }
      if (dirLight) {
        dirLight.color = [0.6, 0.65, 0.8];
        dirLight.intensity = 0.7;
      }
      scene.canvas.backgroundColor = [0.06, 0.09, 0.14];
    } else {
      // Day mode - bright ambient, warm tones, strong sunlight
      if (ambientLight) {
        ambientLight.color = [1.0, 0.98, 0.95];
        ambientLight.intensity = 0.9;
      }
      if (dirLight) {
        dirLight.color = [1.0, 0.95, 0.85];
        dirLight.intensity = 1.2;
      }
      scene.canvas.backgroundColor = [0.92, 0.95, 0.98];
    }
  }, [isDarkMode, status]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.viewer || !runtime.modelAabb || status !== 'ready') {
      return;
    }

    runtime.markers.forEach((marker) => marker.destroy?.());
    runtime.markers.clear();
    runtime.decorations.forEach((decoration) => decoration.destroy?.());
    runtime.decorations = [];
    runtime.overlaySeed += 1;
    const overlayPrefix = `overlay-${runtime.overlaySeed}`;
    const withPrefix = (id: string) => `${overlayPrefix}-${id}`;

    void import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js').then((xeokit: XeokitModule) => {
      if (!runtimeRef.current?.viewer || !runtime.modelAabb) {
        return;
      }

      const workingAabb = getWorkingAabb(runtime) ?? runtime.modelAabb;
      const workingCenter = centerOfAabb(workingAabb);
      const [width, height, depth] = sizeOfAabb(workingAabb);
      const visibleFloors = isolatedFloor === null ? floors : floors.filter((floor) => floor === isolatedFloor);
      const floorBand = height / Math.max(floors.length, 1);
      const ontologyDensity = Math.max(3, Math.min(ontologyEntities.length, 8));

      const pushDecoration = (decoration: any) => {
        if (decoration) {
          runtime.decorations.push(decoration);
        }
      };

      const makePipeLine = (
        idPrefix: string,
        color: number[],
        pattern: number[] | undefined,
        getBranchPoint: (unit: TwinUnit, anchor: number[]) => [number[], number[]],
      ) => {
        visibleUnits.slice(0, 8).forEach((unit, index) => {
          const anchor = getUnitAnchor(unit, units, workingAabb);
          const [branchStart, branchEnd] = getBranchPoint(unit, anchor);
          pushDecoration(
            createLineMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`${idPrefix}-branch-${index}`),
              branchStart,
              branchEnd,
              color,
              pattern
            )
          );
        });
      };

      if (activeView === 'inside') {
        visibleFloors.forEach((floor) => {
          const floorIndex = Math.max(0, floors.indexOf(floor));
          const slabY = workingAabb[1] + floorBand * floorIndex + floorBand * 0.44;
          pushDecoration(
            createBoxMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`inside-slab-${floor}`),
              [workingCenter[0], slabY - floorBand * 0.08, workingCenter[2] - depth * 0.05],
              [width * 0.7, 0.05, depth * 0.26],
              [0.95, 0.97, 0.99],
              0.16,
            ),
          );

          pushDecoration(
            createBoxMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`inside-corridor-${floor}`),
              [workingCenter[0], slabY + floorBand * 0.02, workingCenter[2] + depth * 0.02],
              [width * 0.14, floorBand * 0.34, depth * 0.22],
              [0.84, 0.9, 0.92],
              0.18,
            ),
          );

          [-0.19, 0, 0.19].forEach((offset, partitionIndex) => {
            pushDecoration(
              createBoxMesh(
                xeokit,
                runtime.viewer.scene,
                withPrefix(`inside-wall-${floor}-${partitionIndex}`),
                [workingCenter[0] + width * offset, slabY + floorBand * 0.1, workingCenter[2] - depth * 0.05],
                [width * 0.012, floorBand * 0.36, depth * 0.24],
                [0.78, 0.86, 0.9],
                0.22,
              ),
            );
          });
        });

        if (selectedUnitId) {
          const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
          if (selectedUnit) {
            const anchor = getUnitAnchor(selectedUnit, units, workingAabb);
            const unitW = width * 0.13;
            const unitD = depth * 0.13;
            const unitH = floorBand * 0.28;

            // Unit floor
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-floor-${selectedUnit.id}`),
                [anchor[0], anchor[1] - unitH * 0.48, anchor[2]],
                [unitW, 0.02, unitD],
                [0.85, 0.88, 0.9], 0.5),
            );

            // Unit walls (4 sides)
            const wallThickness = 0.015;
            // Front wall
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-wall-front-${selectedUnit.id}`),
                [anchor[0], anchor[1], anchor[2] + unitD * 0.5],
                [unitW, unitH * 0.5, wallThickness],
                [0.75, 0.82, 0.88], 0.35),
            );
            // Back wall
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-wall-back-${selectedUnit.id}`),
                [anchor[0], anchor[1], anchor[2] - unitD * 0.5],
                [unitW, unitH * 0.5, wallThickness],
                [0.75, 0.82, 0.88], 0.35),
            );
            // Left wall
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-wall-left-${selectedUnit.id}`),
                [anchor[0] - unitW * 0.5, anchor[1], anchor[2]],
                [wallThickness, unitH * 0.5, unitD],
                [0.75, 0.82, 0.88], 0.35),
            );
            // Right wall (partial - door opening)
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-wall-right-${selectedUnit.id}`),
                [anchor[0] + unitW * 0.5, anchor[1] + unitH * 0.15, anchor[2] + unitD * 0.2],
                [wallThickness, unitH * 0.35, unitD * 0.5],
                [0.75, 0.82, 0.88], 0.35),
            );

            // Interior partition wall (bedroom divider)
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-partition-${selectedUnit.id}`),
                [anchor[0] + unitW * 0.12, anchor[1], anchor[2]],
                [wallThickness, unitH * 0.42, unitD * 0.8],
                [0.7, 0.78, 0.84], 0.28),
            );

            // Unit highlight glow
            pushDecoration(
              createBoxMesh(xeokit, runtime.viewer.scene,
                withPrefix(`selected-glow-${selectedUnit.id}`),
                [anchor[0], anchor[1], anchor[2]],
                [unitW * 1.02, unitH * 0.01, unitD * 1.02],
                [0.13, 0.77, 0.37], 0.35),
            );

            // MEP traces inside unit
            if (activeLayers.has('plomberie')) {
              pushDecoration(
                createLineMesh(xeokit, runtime.viewer.scene,
                  withPrefix(`inside-plumbing-${selectedUnit.id}`),
                  [anchor[0] - unitW * 0.4, anchor[1] - unitH * 0.3, anchor[2] - unitD * 0.3],
                  [anchor[0] - unitW * 0.4, anchor[1] + unitH * 0.1, anchor[2] + unitD * 0.3],
                  layerPalette.plomberie.rgb, [0.06, 0.03]),
              );
            }
            if (activeLayers.has('hvac')) {
              pushDecoration(
                createLineMesh(xeokit, runtime.viewer.scene,
                  withPrefix(`inside-hvac-${selectedUnit.id}`),
                  [anchor[0] - unitW * 0.3, anchor[1] + unitH * 0.4, anchor[2] - unitD * 0.4],
                  [anchor[0] + unitW * 0.3, anchor[1] + unitH * 0.4, anchor[2] + unitD * 0.2],
                  layerPalette.hvac.rgb, [0.04, 0.02]),
              );
            }
            if (activeLayers.has('electricite')) {
              pushDecoration(
                createLineMesh(xeokit, runtime.viewer.scene,
                  withPrefix(`inside-elec-${selectedUnit.id}`),
                  [anchor[0] + unitW * 0.45, anchor[1] + unitH * 0.35, anchor[2]],
                  [anchor[0] - unitW * 0.3, anchor[1] + unitH * 0.35, anchor[2]],
                  layerPalette.electricite.rgb, [0.03, 0.02]),
              );
            }

            // Procedural furniture inside unit
            const fy = anchor[1] - unitH * 0.42; // floor level

            // Bed (bedroom side - right of partition)
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-bed-${selectedUnit.id}`),
              [anchor[0] + unitW * 0.28, fy + floorBand * 0.04, anchor[2] - unitD * 0.15],
              [unitW * 0.15, floorBand * 0.03, unitD * 0.2],
              [0.6, 0.5, 0.45], 0.7));
            // Bed headboard
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-headboard-${selectedUnit.id}`),
              [anchor[0] + unitW * 0.28, fy + floorBand * 0.07, anchor[2] - unitD * 0.26],
              [unitW * 0.15, floorBand * 0.04, unitD * 0.01],
              [0.55, 0.45, 0.4], 0.8));

            // Sofa (living side - left of partition)
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-sofa-${selectedUnit.id}`),
              [anchor[0] - unitW * 0.25, fy + floorBand * 0.03, anchor[2] + unitD * 0.2],
              [unitW * 0.18, floorBand * 0.025, unitD * 0.08],
              [0.45, 0.52, 0.58], 0.7));
            // Sofa back
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-sofaback-${selectedUnit.id}`),
              [anchor[0] - unitW * 0.25, fy + floorBand * 0.055, anchor[2] + unitD * 0.25],
              [unitW * 0.18, floorBand * 0.03, unitD * 0.015],
              [0.42, 0.5, 0.55], 0.7));

            // Coffee table
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-table-${selectedUnit.id}`),
              [anchor[0] - unitW * 0.25, fy + floorBand * 0.02, anchor[2] + unitD * 0.05],
              [unitW * 0.08, floorBand * 0.012, unitD * 0.05],
              [0.7, 0.6, 0.5], 0.65));

            // Kitchen counter (near front wall)
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-kitchen-${selectedUnit.id}`),
              [anchor[0] - unitW * 0.35, fy + floorBand * 0.04, anchor[2] - unitD * 0.3],
              [unitW * 0.08, floorBand * 0.035, unitD * 0.12],
              [0.82, 0.82, 0.8], 0.75));

            // Bathroom fixture (small box near right wall)
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-bath-${selectedUnit.id}`),
              [anchor[0] + unitW * 0.38, fy + floorBand * 0.02, anchor[2] + unitD * 0.25],
              [unitW * 0.06, floorBand * 0.025, unitD * 0.06],
              [0.9, 0.92, 0.95], 0.8));

            // Desk/Bureau
            pushDecoration(createBoxMesh(xeokit, runtime.viewer.scene,
              withPrefix(`furniture-desk-${selectedUnit.id}`),
              [anchor[0] + unitW * 0.15, fy + floorBand * 0.03, anchor[2] + unitD * 0.15],
              [unitW * 0.1, floorBand * 0.025, unitD * 0.05],
              [0.65, 0.55, 0.4], 0.7));
          }
        }
      }

      if (activeLayers.has('plomberie')) {
        const riserX = workingAabb[0] + width * 0.24;
        const riserZ = workingAabb[5] - depth * 0.21;
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('plomberie-riser'),
            [riserX, workingAabb[1] + floorBand * 0.2, riserZ],
            [riserX, workingAabb[4] - floorBand * 0.1, riserZ],
            layerPalette.plomberie.rgb,
          ),
        );
        makePipeLine('plomberie', layerPalette.plomberie.rgb, [0.18, 0.05], (_, anchor) => [
          [riserX, anchor[1], riserZ],
          [anchor[0] - width * 0.02, anchor[1], anchor[2]],
        ]);
      }

      if (activeLayers.has('hvac')) {
        const shaftX = workingCenter[0];
        const shaftZ = workingCenter[2] - depth * 0.02;
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('hvac-shaft'),
            [shaftX, workingAabb[1] + floorBand * 0.24, shaftZ],
            [shaftX, workingAabb[4] - floorBand * 0.08, shaftZ],
            layerPalette.hvac.rgb,
          ),
        );
        visibleFloors.forEach((floor) => {
          const floorIndex = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * floorIndex + floorBand * 0.72;
          pushDecoration(
            createLineMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`hvac-trunk-${floor}`),
              [workingAabb[0] + width * 0.18, y, shaftZ],
              [workingAabb[3] - width * 0.18, y, shaftZ],
              layerPalette.hvac.rgb,
            ),
          );
        });
        makePipeLine('hvac', layerPalette.hvac.rgb, [0.12, 0.04], (_, anchor) => [
          [shaftX, anchor[1] + floorBand * 0.18, shaftZ],
          [anchor[0], anchor[1] + floorBand * 0.18, anchor[2] - depth * 0.02],
        ]);
      }

      if (activeLayers.has('electricite')) {
        const riserX = workingAabb[3] - width * 0.18;
        const riserZ = workingAabb[2] + depth * 0.2;
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('electricite-riser'),
            [riserX, workingAabb[1] + floorBand * 0.18, riserZ],
            [riserX, workingAabb[4] - floorBand * 0.08, riserZ],
            layerPalette.electricite.rgb,
          ),
        );
        makePipeLine('electricite', layerPalette.electricite.rgb, [0.05, 0.03], (_, anchor) => [
          [riserX, anchor[1] + floorBand * 0.1, riserZ],
          [anchor[0] + width * 0.01, anchor[1] + floorBand * 0.1, anchor[2]],
        ]);
      }

      if (activeLayers.has('structure')) {
        const gridColor = overlayPalette.structure.rgb;
        const gridCols = 5;
        const gridRows = 4;
        const minX = workingAabb[0] + width * 0.12;
        const maxX = workingAabb[3] - width * 0.12;
        const minZ = workingAabb[2] + depth * 0.15;
        const maxZ = workingAabb[5] - depth * 0.18;
        for (let i = 0; i < gridCols; i += 1) {
          const x = minX + ((maxX - minX) / (gridCols - 1)) * i;
          pushDecoration(
            createLineMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`grid-x-${i}`),
              [x, workingAabb[1] + floorBand * 0.08, minZ],
              [x, workingAabb[4] - floorBand * 0.1, maxZ],
              gridColor,
              [0.09, 0.05],
            ),
          );
        }
        for (let j = 0; j < gridRows; j += 1) {
          const z = minZ + ((maxZ - minZ) / (gridRows - 1)) * j;
          pushDecoration(
            createLineMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`grid-z-${j}`),
              [minX, workingAabb[1] + floorBand * 0.08, z],
              [maxX, workingAabb[4] - floorBand * 0.1, z],
              gridColor,
              [0.09, 0.05],
            ),
          );
        }
      }

      if (activeLayers.has('envelope')) {
        const envelopeColor = overlayPalette.envelope.rgb;
        const minX = workingAabb[0] + width * 0.1;
        const maxX = workingAabb[3] - width * 0.1;
        const minZ = workingAabb[2] + depth * 0.12;
        const maxZ = workingAabb[5] - depth * 0.12;
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('envelope-north'),
            [minX, workingAabb[1], minZ],
            [maxX, workingAabb[1], minZ],
            envelopeColor
          )
        );
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('envelope-south'),
            [minX, workingAabb[1], maxZ],
            [maxX, workingAabb[1], maxZ],
            envelopeColor
          )
        );
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('envelope-east'),
            [maxX, workingAabb[1], minZ],
            [maxX, workingAabb[1], maxZ],
            envelopeColor
          )
        );
        pushDecoration(
          createLineMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('envelope-west'),
            [minX, workingAabb[1], minZ],
            [minX, workingAabb[1], maxZ],
            envelopeColor
          )
        );
      }

      if (activeLayers.has('elevators')) {
        pushDecoration(
          createBoxMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('elevator-core'),
            [workingCenter[0] - width * 0.08, workingCenter[1], workingCenter[2] - depth * 0.08],
            [width * 0.08, height * 0.78, depth * 0.08],
            overlayPalette.elevators.rgb,
            0.2,
          ),
        );
      }

      if (activeLayers.has('stairs')) {
        pushDecoration(
          createBoxMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('stairs-core'),
            [workingCenter[0] + width * 0.1, workingCenter[1], workingCenter[2] - depth * 0.08],
            [width * 0.08, height * 0.7, depth * 0.08],
            overlayPalette.stairs.rgb,
            0.2,
          ),
        );
      }

      if (activeLayers.has('parking')) {
        pushDecoration(
          createBoxMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('parking-deck'),
            [workingCenter[0], workingAabb[1] + floorBand * 0.14, workingCenter[2] + depth * 0.12],
            [width * 0.78, floorBand * 0.14, depth * 0.42],
            overlayPalette.parking.rgb,
            0.2,
          ),
        );
      }

      if (activeLayers.has('roof') || activeLayers.has('solar')) {
        pushDecoration(
          createBoxMesh(
            xeokit,
            runtime.viewer.scene,
            withPrefix('roof-plate'),
            [workingCenter[0], workingAabb[4] - floorBand * 0.12, workingCenter[2]],
            [width * 0.8, floorBand * 0.12, depth * 0.42],
            overlayPalette.roof.rgb,
            0.22,
          ),
        );
      }

      if (activeLayers.has('sensors') && sensorSamples.length) {
        const grouped = new Map<string, typeof sensorSamples>();
        sensorSamples.forEach((sample) => {
          const bucket = grouped.get(sample.lineId) ?? [];
          bucket.push(sample);
          grouped.set(sample.lineId, bucket);
        });
        Array.from(grouped.entries())
          .slice(0, 3)
          .forEach(([lineId, samples], index) => {
            for (let i = 0; i < samples.length - 1; i += 1) {
              const current = samples[i];
              const next = samples[i + 1];
              const normalize = (value: number) => Math.min(Math.max((value + 5) / 10, 0), 1);
              const x1 = workingAabb[0] + width * (0.15 + normalize(current.flow) * 0.7);
              const y1 = workingAabb[1] + height * (0.15 + normalize(current.temperature) * 0.6);
              const z1 = workingAabb[2] + depth * (0.15 + normalize(current.vibration) * 0.7);
              const x2 = workingAabb[0] + width * (0.15 + normalize(next.flow) * 0.7);
              const y2 = workingAabb[1] + height * (0.15 + normalize(next.temperature) * 0.6);
              const z2 = workingAabb[2] + depth * (0.15 + normalize(next.vibration) * 0.7);
              pushDecoration(
                createLineMesh(
                  xeokit,
                  runtime.viewer.scene,
                  withPrefix(`sensor-${lineId}-${index}-${i}`),
                  [x1, y1, z1],
                  [x2, y2, z2],
                  overlayPalette.sensors.rgb,
                  [0.04, 0.02],
                ),
              );
            }
          });
      }

      // Water supply - vertical riser + horizontal branches per floor
      if (activeLayers.has('water')) {
        const riserX = workingAabb[0] + width * 0.32;
        const riserZ = workingAabb[5] - depth * 0.28;
        pushDecoration(
          createLineMesh(xeokit, runtime.viewer.scene, withPrefix('water-riser'),
            [riserX, workingAabb[1] + floorBand * 0.1, riserZ],
            [riserX, workingAabb[4] - floorBand * 0.05, riserZ],
            overlayPalette.water.rgb),
        );
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.35;
          pushDecoration(
            createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`water-branch-${floor}`),
              [riserX, y, riserZ],
              [workingAabb[3] - width * 0.2, y, riserZ + depth * 0.15],
              overlayPalette.water.rgb, [0.12, 0.04]),
          );
        });
      }

      // Gas supply - riser from basement + branches
      if (activeLayers.has('gas')) {
        const riserX = workingAabb[3] - width * 0.28;
        const riserZ = workingAabb[5] - depth * 0.32;
        pushDecoration(
          createLineMesh(xeokit, runtime.viewer.scene, withPrefix('gas-riser'),
            [riserX, workingAabb[1], riserZ],
            [riserX, workingAabb[4] - floorBand * 0.2, riserZ],
            overlayPalette.gas.rgb),
        );
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.28;
          pushDecoration(
            createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`gas-branch-${floor}`),
              [riserX, y, riserZ],
              [workingCenter[0], y, riserZ],
              overlayPalette.gas.rgb, [0.06, 0.04]),
          );
        });
      }

      // Drainage - large pipe running down the building
      if (activeLayers.has('drainage')) {
        const drainX = workingAabb[0] + width * 0.2;
        const drainZ = workingCenter[2] + depth * 0.18;
        pushDecoration(
          createLineMesh(xeokit, runtime.viewer.scene, withPrefix('drainage-main'),
            [drainX, workingAabb[1], drainZ],
            [drainX, workingAabb[4] - floorBand * 0.15, drainZ],
            overlayPalette.drainage.rgb),
        );
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('drainage-trap'),
            [drainX, workingAabb[1] + floorBand * 0.08, drainZ],
            [width * 0.12, floorBand * 0.06, depth * 0.12],
            overlayPalette.drainage.rgb, 0.3),
        );
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.15;
          pushDecoration(
            createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`drainage-floor-${floor}`),
              [drainX, y, drainZ],
              [drainX + width * 0.35, y, drainZ + depth * 0.06],
              overlayPalette.drainage.rgb, [0.1, 0.06]),
          );
        });
      }

      // Sprinklers - ceiling-mounted grid per floor
      if (activeLayers.has('sprinklers')) {
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * (fi + 1) - floorBand * 0.08;
          // Main trunk
          pushDecoration(
            createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`sprinkler-trunk-${floor}`),
              [workingAabb[0] + width * 0.15, y, workingCenter[2]],
              [workingAabb[3] - width * 0.15, y, workingCenter[2]],
              overlayPalette.sprinklers.rgb, [0.08, 0.03]),
          );
          // Cross branches
          for (let i = 0; i < 3; i++) {
            const x = workingAabb[0] + width * (0.25 + i * 0.25);
            pushDecoration(
              createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`sprinkler-cross-${floor}-${i}`),
                [x, y, workingAabb[2] + depth * 0.2],
                [x, y, workingAabb[5] - depth * 0.2],
                overlayPalette.sprinklers.rgb, [0.06, 0.03]),
            );
          }
        });
      }

      // Fire - fire hose cabinets + alarm pull stations per floor
      if (activeLayers.has('fire')) {
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.5;
          // Fire hose cabinet
          pushDecoration(
            createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`fire-cabinet-${floor}`),
              [workingCenter[0] - width * 0.15, y, workingAabb[5] - depth * 0.05],
              [width * 0.04, floorBand * 0.18, depth * 0.02],
              overlayPalette.fire.rgb, 0.65),
          );
          // Alarm pull station
          pushDecoration(
            createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`fire-alarm-${floor}`),
              [workingCenter[0] + width * 0.2, y, workingAabb[5] - depth * 0.05],
              [width * 0.02, floorBand * 0.08, depth * 0.015],
              overlayPalette.fire.rgb, 0.8),
          );
        });
      }

      // Security - access control points at entries
      if (activeLayers.has('security')) {
        // Main entrance
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('security-entrance'),
            [workingCenter[0], workingAabb[1] + floorBand * 0.5, workingAabb[5] - depth * 0.02],
            [width * 0.12, floorBand * 0.42, depth * 0.02],
            overlayPalette.security.rgb, 0.25),
        );
        // Parking gate
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('security-parking-gate'),
            [workingAabb[0] + width * 0.3, workingAabb[1] + floorBand * 0.18, workingAabb[5] - depth * 0.01],
            [width * 0.08, floorBand * 0.16, depth * 0.015],
            overlayPalette.security.rgb, 0.35),
        );
      }

      // Lighting - ceiling fixtures per floor
      if (activeLayers.has('lighting')) {
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * (fi + 1) - floorBand * 0.06;
          for (let r = 0; r < 2; r++) {
            const z = workingCenter[2] + depth * (r === 0 ? -0.08 : 0.08);
            for (let c = 0; c < 4; c++) {
              const x = workingAabb[0] + width * (0.2 + c * 0.2);
              pushDecoration(
                createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`light-${floor}-${r}-${c}`),
                  [x, y, z],
                  [width * 0.06, 0.02, depth * 0.015],
                  overlayPalette.lighting.rgb, 0.6),
              );
            }
          }
        });
      }

      // Access control - badge readers at core entries per floor
      if (activeLayers.has('access')) {
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.45;
          pushDecoration(
            createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`access-reader-${floor}`),
              [workingCenter[0] - width * 0.06, y, workingCenter[2] - depth * 0.12],
              [width * 0.015, floorBand * 0.06, depth * 0.01],
              overlayPalette.access.rgb, 0.75),
          );
        });
      }

      // Common areas - lobby, corridors highlighted
      if (activeLayers.has('communs')) {
        // Ground floor lobby
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('communs-lobby'),
            [workingCenter[0], workingAabb[1] + floorBand * 0.4, workingCenter[2] + depth * 0.08],
            [width * 0.3, floorBand * 0.35, depth * 0.18],
            overlayPalette.communs.rgb, 0.15),
        );
        // Corridors per floor
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.42;
          pushDecoration(
            createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`communs-corridor-${floor}`),
              [workingCenter[0], y, workingCenter[2]],
              [width * 0.08, floorBand * 0.3, depth * 0.35],
              overlayPalette.communs.rgb, 0.1),
          );
        });
      }

      // Lockers - storage room in basement
      if (activeLayers.has('lockers')) {
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('lockers-room'),
            [workingCenter[0] + width * 0.2, workingAabb[1] + floorBand * 0.3, workingCenter[2] - depth * 0.12],
            [width * 0.18, floorBand * 0.28, depth * 0.14],
            overlayPalette.lockers.rgb, 0.2),
        );
      }

      // Pool - at ground level or rooftop
      if (activeLayers.has('pool')) {
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('pool-basin'),
            [workingCenter[0] - width * 0.1, workingAabb[1] + floorBand * 0.2, workingCenter[2] + depth * 0.2],
            [width * 0.22, floorBand * 0.06, depth * 0.14],
            overlayPalette.pool.rgb, 0.35),
        );
      }

      // Urban farming - rooftop garden beds
      if (activeLayers.has('farming')) {
        for (let i = 0; i < 3; i++) {
          pushDecoration(
            createBoxMesh(xeokit, runtime.viewer.scene, withPrefix(`farming-bed-${i}`),
              [workingAabb[0] + width * (0.25 + i * 0.22), workingAabb[4] - floorBand * 0.04, workingCenter[2]],
              [width * 0.08, floorBand * 0.04, depth * 0.16],
              overlayPalette.farming.rgb, 0.4),
          );
        }
      }

      // Rooftop 3D - terrace / mechanical penthouse
      if (activeLayers.has('rooftop3d')) {
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('rooftop-terrace'),
            [workingCenter[0], workingAabb[4] - floorBand * 0.02, workingCenter[2] + depth * 0.08],
            [width * 0.5, floorBand * 0.04, depth * 0.25],
            overlayPalette.rooftop3d.rgb, 0.18),
        );
        pushDecoration(
          createBoxMesh(xeokit, runtime.viewer.scene, withPrefix('rooftop-mech'),
            [workingCenter[0] - width * 0.15, workingAabb[4] + floorBand * 0.06, workingCenter[2] - depth * 0.1],
            [width * 0.1, floorBand * 0.12, depth * 0.1],
            overlayPalette.rooftop3d.rgb, 0.3),
        );
      }

      // Internet / IT cabling - vertical backbone + horizontal runs
      if (activeLayers.has('internet') || activeLayers.has('electrical')) {
        const layerKey = activeLayers.has('internet') ? 'internet' : 'electrical';
        const palette = overlayPalette[layerKey] ?? overlayPalette.it;
        const riserX = workingCenter[0] + width * 0.12;
        const riserZ = workingCenter[2] - depth * 0.15;
        pushDecoration(
          createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`${layerKey}-backbone`),
            [riserX, workingAabb[1] + floorBand * 0.1, riserZ],
            [riserX, workingAabb[4] - floorBand * 0.05, riserZ],
            palette.rgb, [0.03, 0.02]),
        );
        visibleFloors.forEach((floor) => {
          const fi = Math.max(0, floors.indexOf(floor));
          const y = workingAabb[1] + floorBand * fi + floorBand * 0.62;
          pushDecoration(
            createLineMesh(xeokit, runtime.viewer.scene, withPrefix(`${layerKey}-run-${floor}`),
              [riserX, y, riserZ],
              [workingAabb[3] - width * 0.18, y, riserZ + depth * 0.08],
              palette.rgb, [0.04, 0.02]),
          );
        });
      }

      if (activeLayers.has('maintenance')) {
        pins.forEach((pin) => {
          const marker = new xeokit.SpriteMarker(runtime.viewer.scene, {
            worldPos: getPinWorldPos(pin, units, workingAabb),
            src: makeMarkerDataUrl(markerPalette[pin.severity]),
            occludable: false,
          });
          marker.size = 0.95;
          marker.collidable = false;
          marker.pickable = false;
          runtime.markers.set(pin.id, marker);
        });
      }

      const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
      if (selectedUnit) {
        const selectedMarker = new xeokit.SpriteMarker(runtime.viewer.scene, {
          worldPos: getUnitAnchor(selectedUnit, units, workingAabb),
          src: makeMarkerDataUrl('#0d7377', 'zone'),
          occludable: false,
        });
        selectedMarker.size = 1.1;
        selectedMarker.collidable = false;
        selectedMarker.pickable = false;
        runtime.markers.set(`selected-${selectedUnit.id}`, selectedMarker);
      }

      if (activeLayers.has('zones')) {
        visibleUnits.slice(0, 8).forEach((unit) => {
          const zoneMarker = new xeokit.SpriteMarker(runtime.viewer.scene, {
            worldPos: getUnitAnchor(unit, units, workingAabb),
            src: makeMarkerDataUrl(unit.id === selectedUnitId ? '#0d7377' : layerPalette.zones.color, 'zone'),
            occludable: false,
          });
          zoneMarker.size = unit.id === selectedUnitId ? 0.9 : 0.7;
          zoneMarker.collidable = false;
          zoneMarker.pickable = false;
          runtime.markers.set(`zone-${unit.id}`, zoneMarker);
        });
      }

      if (activeLayers.has('cameras')) {
        getCameraWorldPositions(units, workingAabb).forEach((position, index) => {
          const frustumTarget = [workingCenter[0], position[1] - floorBand * 0.12, workingCenter[2]];
          const cameraMarker = new xeokit.SpriteMarker(runtime.viewer.scene, {
            worldPos: position,
            src: makeMarkerDataUrl(layerPalette.cameras.color, 'camera'),
            occludable: false,
          });
          cameraMarker.size = 0.72;
          cameraMarker.collidable = false;
          cameraMarker.pickable = false;
          runtime.markers.set(`camera-${index}`, cameraMarker);

          pushDecoration(
            createBoxMesh(
              xeokit,
              runtime.viewer.scene,
              withPrefix(`camera-body-${index}`),
              position,
              [0.22, 0.16, 0.16],
              [0.78, 0.72, 0.95],
              0.82,
            ),
          );
          [
            [-0.8, -0.35, -1.2],
            [0.8, -0.35, -1.2],
            [-0.8, -0.35, 1.2],
            [0.8, -0.35, 1.2],
          ].forEach((offset, rayIndex) => {
            pushDecoration(
              createLineMesh(
                xeokit,
                runtime.viewer.scene,
                withPrefix(`camera-frustum-${index}-${rayIndex}`),
                position,
                [frustumTarget[0] + offset[0], frustumTarget[1] + offset[1], frustumTarget[2] + offset[2]],
                [0.79, 0.69, 0.98],
                [0.08, 0.03],
              ),
            );
          });
        });
      }

      systemLayers.forEach((layer) => {
        if (!activeLayers.has(layer)) {
          return;
        }
        const kind = layer === 'plomberie' ? 'drop' : layer === 'hvac' ? 'fan' : 'bolt';
        getSystemMarkerPositions(layer, units, workingAabb).forEach((position, index) => {
          const layerMarker = new xeokit.SpriteMarker(runtime.viewer.scene, {
            worldPos: position,
            src: makeMarkerDataUrl(layerPalette[layer].color, kind),
            occludable: false,
          });
          layerMarker.size = 0.62;
          layerMarker.collidable = false;
          layerMarker.pickable = false;
          runtime.markers.set(`${layer}-${index}`, layerMarker);
        });
      });

      Object.keys(overlayPalette).forEach((layer) => {
        if (!activeLayers.has(layer as TwinLayer) || systemLayers.includes(layer as TwinLayer)) {
          return;
        }
        const palette = overlayPalette[layer];
        const positions = getLayerMarkerPositions(layer, units, workingAabb);
        const trimmed = layer === 'it' ? positions.slice(0, ontologyDensity) : positions;
        trimmed.forEach((position, index) => {
          const overlayMarker = new xeokit.SpriteMarker(runtime.viewer.scene, {
            worldPos: position,
            src: makeMarkerDataUrl(palette.color, palette.icon),
            occludable: false,
          });
          overlayMarker.size = layer === 'roof' || layer === 'solar' ? 0.78 : 0.6;
          overlayMarker.collidable = false;
          overlayMarker.pickable = false;
          runtime.markers.set(`${layer}-overlay-${index}`, overlayMarker);
        });
      });
    });
  }, [
    activeLayers,
    activeView,
    floors,
    isolatedFloor,
    ontologyEntities,
    pins,
    selectedUnitId,
    sensorSamples,
    status,
    units,
    visibleUnits,
  ]);

  return (
    <div
      ref={wrapperRef}
      className="engineering-grid relative overflow-hidden rounded-[28px] border border-[#d7e4e4] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_28%),linear-gradient(180deg,_#102028_0%,_#1b3139_100%)] shadow-[0_28px_70px_rgba(16,32,40,0.18)] [overscroll-behavior:contain]"
    >
      <div className="absolute right-4 top-4 z-20 rounded-2xl border border-white/30 bg-white/14 p-2 backdrop-blur-md">
        <canvas
          ref={navCubeRef}
          id={navCubeId}
          className="h-24 w-24 rounded-xl"
          aria-label="Navigation cube"
        />
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[min(92%,38rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-[22px] border border-white/40 bg-[rgba(245,249,250,0.86)] px-3 py-2.5 text-[var(--semantic-text)] shadow-[0_18px_40px_rgba(11,24,31,0.2)] backdrop-blur-md">
        {visibleUnits.slice(0, 6).map((unit) => {
          const isSelected = unit.id === selectedUnitId;
          const isHovered = unit.id === hoveredUnitId;
          return (
            <button
              key={unit.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                isSelected
                  ? 'border-[#0d7377] bg-[#0d7377] text-white shadow-[0_10px_22px_rgba(13,115,119,0.22)]'
                  : isHovered
                  ? 'border-[#0d7377]/35 bg-[#eaf6f5] text-[var(--semantic-text)]'
                  : 'border-[#d5dfdf] bg-white/92 text-[var(--semantic-text-subtle)]'
              }`}
              onMouseEnter={() => onHoverUnit(unit.id)}
              onMouseLeave={() => onHoverUnit(null)}
              onClick={() => onSelectUnit(unit.id)}
            >
              {unit.unit_number}
            </button>
          );
        })}
      </div>

      <canvas
        ref={canvasRef}
        id={canvasId}
        className="block h-[72vh] min-h-[580px] w-full"
        aria-label="Digital twin 3D viewer"
      />

      {status !== 'ready' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1820]/82 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/20 bg-[rgba(248,252,252,0.14)] px-6 py-5 text-center text-sm text-white/90 shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
            <p className="font-semibold text-white">{status === 'loading' ? 'Chargement du viewer BIM' : 'Viewer indisponible'}</p>
            <p className="mt-2 max-w-sm text-white/70">
              {status === 'loading'
                ? 'Initialisation du moteur 3D, du modèle bâtiment et des contrôles de navigation.'
                : errorMessage ?? 'Impossible d’initialiser le digital twin.'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
