import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import type { TwinUnit } from '../types';

// Default GLTF model URL (3D Office from CodePen)
const DEFAULT_OFFICE_MODEL_URL = 'https://rawcdn.githack.com/ricardoolivaalonso/ThreeJS-Room01/98fd8d7909308ec03a596928a394bb25ed9239f1/THREEJS2.glb';
const DEFAULT_BAKED_TEXTURE_URL = 'https://rawcdn.githack.com/ricardoolivaalonso/ThreeJS-Room01/98fd8d7909308ec03a596928a394bb25ed9239f1/baked.jpg';

type ViewMode = 'orbit' | 'walkthrough' | 'floorplan' | 'vr';
type SystemOverlay = 'hvac' | 'plumbing' | 'electrical' | 'none';

interface InteriorRuntimeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  frame: number;
  model: THREE.Group | null;
  systemOverlays: THREE.Group;
  iotMarkers: THREE.Group;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
}

interface IoTSensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'motion' | 'air_quality' | 'light';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'alert';
  position: [number, number, number];
}

const mockSensors: IoTSensor[] = [
  { id: 'temp-1', name: 'Living Room Temp', type: 'temperature', value: 21.5, unit: '°C', status: 'normal', position: [-2, 1.5, 0] },
  { id: 'hum-1', name: 'Bedroom Humidity', type: 'humidity', value: 45, unit: '%', status: 'normal', position: [2, 1.5, 2] },
  { id: 'mot-1', name: 'Entry Motion', type: 'motion', value: 1, unit: '', status: 'warning', position: [0, 2, -3] },
  { id: 'air-1', name: 'Kitchen Air Quality', type: 'air_quality', value: 85, unit: 'AQI', status: 'normal', position: [3, 1.5, -1] },
  { id: 'light-1', name: 'Office Light', type: 'light', value: 450, unit: 'lux', status: 'normal', position: [-2, 2.5, 2] },
];

const sensorColors: Record<IoTSensor['type'], number> = {
  temperature: 0xff6b6b,
  humidity: 0x4dabf7,
  motion: 0xffd43b,
  air_quality: 0x69db7c,
  light: 0xffa94d,
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function createSensorMarker(sensor: IoTSensor): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.15, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: sensorColors[sensor.type],
    emissive: sensorColors[sensor.type],
    emissiveIntensity: sensor.status === 'alert' ? 0.8 : sensor.status === 'warning' ? 0.5 : 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...sensor.position);
  mesh.userData = { sensor };
  return mesh;
}

function createSystemPipe(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number,
  radius = 0.03
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(direction.multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  return mesh;
}

function buildHVACOverlay(group: THREE.Group, scale: number) {
  const ductColor = 0x4ade80;
  const routes: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(-3 * scale, 2.2, -2 * scale), new THREE.Vector3(3 * scale, 2.2, -2 * scale)],
    [new THREE.Vector3(0, 2.2, -2 * scale), new THREE.Vector3(0, 2.2, 3 * scale)],
    [new THREE.Vector3(-2 * scale, 2.2, 0), new THREE.Vector3(2 * scale, 2.2, 0)],
  ];
  routes.forEach(([s, e]) => group.add(createSystemPipe(s, e, ductColor, 0.08)));
}

function buildPlumbingOverlay(group: THREE.Group, scale: number) {
  const pipeColor = 0x38bdf8;
  const routes: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(-2 * scale, 0.1, 2 * scale), new THREE.Vector3(-2 * scale, 0.1, -2 * scale)],
    [new THREE.Vector3(-2 * scale, 0.1, -2 * scale), new THREE.Vector3(2 * scale, 0.1, -2 * scale)],
    [new THREE.Vector3(2 * scale, 0.1, -2 * scale), new THREE.Vector3(2 * scale, 1.2, -2 * scale)],
  ];
  routes.forEach(([s, e]) => group.add(createSystemPipe(s, e, pipeColor, 0.04)));
}

function buildElectricalOverlay(group: THREE.Group, scale: number) {
  const wireColor = 0xf59e0b;
  const routes: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(-3 * scale, 2.4, 0), new THREE.Vector3(3 * scale, 2.4, 0)],
    [new THREE.Vector3(0, 2.4, -3 * scale), new THREE.Vector3(0, 2.4, 3 * scale)],
    [new THREE.Vector3(-1 * scale, 2.4, 1 * scale), new THREE.Vector3(-1 * scale, 1, 1 * scale)],
    [new THREE.Vector3(1 * scale, 2.4, -1 * scale), new THREE.Vector3(1 * scale, 1, -1 * scale)],
  ];
  routes.forEach(([s, e]) => group.add(createSystemPipe(s, e, wireColor, 0.02)));
}

export function TwinUnitInteriorViewer({
  unit,
  modelUrl = DEFAULT_OFFICE_MODEL_URL,
  textureUrl = DEFAULT_BAKED_TEXTURE_URL,
  onSensorSelect,
}: {
  unit: TwinUnit | null;
  modelUrl?: string;
  textureUrl?: string;
  onSensorSelect?: (sensor: IoTSensor | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<InteriorRuntimeContext | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [systemOverlay, setSystemOverlay] = useState<SystemOverlay>('none');
  const [showSensors, setShowSensors] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dayNightMode, setDayNightMode] = useState<'day' | 'night'>('day');

  const scale = useMemo(() => {
    const area = unit?.area_m2 ?? 65;
    return clamp(Math.sqrt(area) / 8, 0.7, 1.5);
  }, [unit?.area_m2]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(dayNightMode === 'day' ? 0xf8fafb : 0x1a1a2e);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dayNightMode === 'day' ? 1.2 : 0.6;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(18 * scale, 10 * scale, 20 * scale);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.enablePan = viewMode !== 'walkthrough';
    controls.minDistance = 5 * scale;
    controls.maxDistance = 30 * scale;
    controls.minPolarAngle = Math.PI / 8;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);

    // Lighting
    const ambientIntensity = dayNightMode === 'day' ? 0.6 : 0.2;
    const directionalIntensity = dayNightMode === 'day' ? 0.8 : 0.3;

    const ambient = new THREE.HemisphereLight(0xffffff, 0xdfe7ec, ambientIntensity);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directional.position.set(10, 15, 8);
    directional.castShadow = true;
    scene.add(directional);

    if (dayNightMode === 'night') {
      const pointLight1 = new THREE.PointLight(0xffeaa7, 0.8, 15);
      pointLight1.position.set(-2, 2, 0);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0x74b9ff, 0.6, 12);
      pointLight2.position.set(2, 2, 2);
      scene.add(pointLight2);
    }

    // Groups for overlays
    const systemOverlays = new THREE.Group();
    scene.add(systemOverlays);

    const iotMarkers = new THREE.Group();
    scene.add(iotMarkers);

    // Load GLTF model
    const textureLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    const bakedTexture = textureLoader.load(textureUrl, () => {
      setLoadProgress(50);
    });
    bakedTexture.flipY = false;
    bakedTexture.colorSpace = THREE.SRGBColorSpace;

    const bakedMaterial = new THREE.MeshBasicMaterial({
      map: bakedTexture,
      side: THREE.DoubleSide,
    });

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = bakedMaterial;
          }
        });
        model.scale.setScalar(scale);
        model.position.set(0, -2 * scale, 0);
        scene.add(model);
        runtimeRef.current!.model = model;
        setLoadProgress(100);
        setIsLoaded(true);
      },
      (xhr) => {
        const progress = 50 + (xhr.loaded / xhr.total) * 50;
        setLoadProgress(Math.round(progress));
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
        setLoadProgress(0);
      }
    );

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const resize = () => {
      const { width, height } = wrapperRef.current!.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(wrapperRef.current);

    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      runtimeRef.current!.frame = window.requestAnimationFrame(tick);
    };

    runtimeRef.current = {
      renderer,
      scene,
      camera,
      controls,
      frame: window.requestAnimationFrame(tick),
      model: null,
      systemOverlays,
      iotMarkers,
      raycaster,
      mouse,
    };

    return () => {
      observer.disconnect();
      if (runtimeRef.current?.frame) {
        window.cancelAnimationFrame(runtimeRef.current.frame);
      }
      renderer.dispose();
      scene.clear();
      runtimeRef.current = null;
    };
  }, [modelUrl, textureUrl, scale, dayNightMode, viewMode]);

  // Update system overlays
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    runtime.systemOverlays.clear();

    if (systemOverlay === 'hvac') {
      buildHVACOverlay(runtime.systemOverlays, scale);
    } else if (systemOverlay === 'plumbing') {
      buildPlumbingOverlay(runtime.systemOverlays, scale);
    } else if (systemOverlay === 'electrical') {
      buildElectricalOverlay(runtime.systemOverlays, scale);
    }
  }, [systemOverlay, scale]);

  // Update IoT markers
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    runtime.iotMarkers.clear();

    if (showSensors) {
      mockSensors.forEach((sensor) => {
        const marker = createSensorMarker({
          ...sensor,
          position: [
            sensor.position[0] * scale,
            sensor.position[1] * scale,
            sensor.position[2] * scale,
          ],
        });
        runtime.iotMarkers.add(marker);
      });
    }
  }, [showSensors, scale]);

  // Handle view mode changes
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const { camera, controls } = runtime;

    if (viewMode === 'orbit') {
      camera.position.set(18 * scale, 10 * scale, 20 * scale);
      controls.enablePan = true;
      controls.minPolarAngle = Math.PI / 8;
      controls.maxPolarAngle = Math.PI / 2.1;
    } else if (viewMode === 'walkthrough') {
      camera.position.set(0, 1.6 * scale, 5 * scale);
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 1.8;
    } else if (viewMode === 'floorplan') {
      camera.position.set(0, 25 * scale, 0.1);
      controls.enablePan = true;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI / 16;
    }

    controls.update();
  }, [viewMode, scale]);

  // Mouse click handler for sensor selection
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const runtime = runtimeRef.current;
      if (!runtime || !showSensors) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      runtime.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      runtime.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      runtime.raycaster.setFromCamera(runtime.mouse, runtime.camera);
      const intersects = runtime.raycaster.intersectObjects(runtime.iotMarkers.children);

      if (intersects.length > 0) {
        const sensor = intersects[0].object.userData.sensor as IoTSensor;
        setSelectedSensor(sensor);
        onSensorSelect?.(sensor);
      } else {
        setSelectedSensor(null);
        onSensorSelect?.(null);
      }
    },
    [showSensors, onSensorSelect]
  );

  return (
    <V2Surface
      title="Unit Interior Viewer"
      subtitle={`3D walkthrough for ${unit?.unit_number ?? 'selected unit'} - ${unit?.area_m2 ?? 65}m²`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isLoaded ? 'success' : 'warning'}>
            {isLoaded ? 'Model Loaded' : `Loading ${loadProgress}%`}
          </Badge>
          <Badge variant="outline">AR/VR Ready</Badge>
        </div>
      }
    >
      {/* Control Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
        {/* View Mode */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">View</span>
          {(['orbit', 'walkthrough', 'floorplan'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={viewMode === mode ? 'primary' : 'secondary'}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'orbit' ? '3D Orbit' : mode === 'walkthrough' ? 'Walk' : 'Plan'}
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--semantic-border)]" />

        {/* System Overlays */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">Systems</span>
          {(['none', 'hvac', 'plumbing', 'electrical'] as SystemOverlay[]).map((sys) => (
            <Button
              key={sys}
              type="button"
              size="sm"
              variant={systemOverlay === sys ? 'primary' : 'secondary'}
              onClick={() => setSystemOverlay(sys)}
            >
              {sys === 'none' ? 'Off' : sys.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--semantic-border)]" />

        {/* IoT Sensors Toggle */}
        <Button
          type="button"
          size="sm"
          variant={showSensors ? 'primary' : 'secondary'}
          onClick={() => setShowSensors((prev) => !prev)}
        >
          IoT Sensors
        </Button>

        {/* Day/Night Toggle */}
        <Button
          type="button"
          size="sm"
          variant={dayNightMode === 'night' ? 'primary' : 'secondary'}
          onClick={() => setDayNightMode((prev) => (prev === 'day' ? 'night' : 'day'))}
        >
          {dayNightMode === 'day' ? 'Day' : 'Night'}
        </Button>
      </div>

      {/* 3D Canvas */}
      <div
        ref={wrapperRef}
        className="relative h-[420px] overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-gradient-to-br from-[#1a1a2e] to-[#16213e]"
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onClick={handleCanvasClick}
        />

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-3 h-2 w-48 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[var(--semantic-primary)] transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="text-sm text-white/80">Loading 3D Model... {loadProgress}%</p>
            </div>
          </div>
        )}

        {/* Selected Sensor Info */}
        {selectedSensor && (
          <div className="absolute left-4 top-4 rounded-xl border border-white/20 bg-black/70 p-3 text-white backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: `#${sensorColors[selectedSensor.type].toString(16)}` }}
              />
              <span className="font-semibold">{selectedSensor.name}</span>
            </div>
            <p className="mt-1 text-lg">
              {selectedSensor.value} {selectedSensor.unit}
            </p>
            <V2StatusPill
              label={selectedSensor.status}
              variant={
                selectedSensor.status === 'alert'
                  ? 'danger'
                  : selectedSensor.status === 'warning'
                  ? 'warning'
                  : 'success'
              }
            />
          </div>
        )}

        {/* View Mode Indicator */}
        <div className="absolute bottom-4 right-4 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
          {viewMode === 'orbit' && 'Drag to rotate • Scroll to zoom'}
          {viewMode === 'walkthrough' && 'First-person view • Drag to look around'}
          {viewMode === 'floorplan' && 'Top-down view • Scroll to zoom'}
        </div>
      </div>

      {/* Sensor Grid */}
      {showSensors && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {mockSensors.map((sensor) => (
            <button
              key={sensor.id}
              type="button"
              className={`rounded-xl border p-3 text-left transition ${
                selectedSensor?.id === sensor.id
                  ? 'border-[var(--semantic-primary)] bg-[var(--semantic-primary)]/10'
                  : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[var(--semantic-primary)]/50'
              }`}
              onClick={() => {
                setSelectedSensor(sensor);
                onSensorSelect?.(sensor);
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: `#${sensorColors[sensor.type].toString(16)}` }}
                />
                <span className="text-xs text-[var(--semantic-text-subtle)]">{sensor.type}</span>
              </div>
              <p className="mt-1 text-lg font-semibold text-[var(--semantic-text)]">
                {sensor.value}
                <span className="ml-1 text-sm font-normal text-[var(--semantic-text-subtle)]">
                  {sensor.unit}
                </span>
              </p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">{sensor.name}</p>
            </button>
          ))}
        </div>
      )}
    </V2Surface>
  );
}
