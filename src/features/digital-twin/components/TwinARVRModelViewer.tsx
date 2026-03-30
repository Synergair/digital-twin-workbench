import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';

// ============================================================================
// Types
// ============================================================================

type ViewPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso';
type RenderMode = 'solid' | 'wireframe' | 'xray' | 'normals';
type EnvironmentPreset = 'studio' | 'outdoor' | 'warehouse' | 'night';

interface ModelStats {
  vertices: number;
  triangles: number;
  meshes: number;
  materials: number;
  fileSize?: string;
}

interface ViewerState {
  autoRotate: boolean;
  rotationSpeed: number;
  explodeDistance: number;
  showGrid: boolean;
  showAxes: boolean;
  backgroundColor: string;
}

interface HotspotMarker {
  id: string;
  position: THREE.Vector3;
  label: string;
  description?: string;
  type: 'info' | 'warning' | 'link';
}

// ============================================================================
// Constants
// ============================================================================

const VIEW_PRESETS: Record<ViewPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0, 0, 5], target: [0, 0, 0] },
  back: { position: [0, 0, -5], target: [0, 0, 0] },
  left: { position: [-5, 0, 0], target: [0, 0, 0] },
  right: { position: [5, 0, 0], target: [0, 0, 0] },
  top: { position: [0, 5, 0.01], target: [0, 0, 0] },
  bottom: { position: [0, -5, 0.01], target: [0, 0, 0] },
  iso: { position: [3, 3, 3], target: [0, 0, 0] },
};

const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, { bg: number; ambient: number; directional: number }> = {
  studio: { bg: 0xf0f4f8, ambient: 0.6, directional: 0.8 },
  outdoor: { bg: 0x87ceeb, ambient: 0.8, directional: 1.2 },
  warehouse: { bg: 0x2c3e50, ambient: 0.3, directional: 0.5 },
  night: { bg: 0x0d1117, ambient: 0.15, directional: 0.25 },
};

const RENDER_MODES = {
  solid: { wireframe: false, opacity: 1, depthTest: true },
  wireframe: { wireframe: true, opacity: 1, depthTest: true },
  xray: { wireframe: false, opacity: 0.3, depthTest: true },
  normals: { wireframe: false, opacity: 1, depthTest: true },
};

// ============================================================================
// Utility Functions
// ============================================================================

function computeModelStats(model: THREE.Object3D): ModelStats {
  let vertices = 0;
  let triangles = 0;
  let meshes = 0;
  const materials = new Set<THREE.Material>();

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      meshes += 1;

      const geometry = mesh.geometry;
      if (geometry.index) {
        triangles += geometry.index.count / 3;
      } else if (geometry.attributes.position) {
        triangles += geometry.attributes.position.count / 3;
      }

      if (geometry.attributes.position) {
        vertices += geometry.attributes.position.count;
      }

      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => materials.add(m));
      } else {
        materials.add(mat);
      }
    }
  });

  return { vertices, triangles: Math.floor(triangles), meshes, materials: materials.size };
}

function centerModel(model: THREE.Object3D): { center: THREE.Vector3; size: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  return { center, size };
}

// ============================================================================
// Main Component
// ============================================================================

export function TwinARVRModelViewer({
  modelUrl,
  title = '3D Model Viewer',
  hotspots = [],
  onHotspotClick,
  enableAR = true,
  enableVR = true,
}: {
  modelUrl: string;
  title?: string;
  hotspots?: HotspotMarker[];
  onHotspotClick?: (hotspot: HotspotMarker) => void;
  enableAR?: boolean;
  enableVR?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  const [viewerState, setViewerState] = useState<ViewerState>({
    autoRotate: false,
    rotationSpeed: 0.5,
    explodeDistance: 0,
    showGrid: true,
    showAxes: false,
    backgroundColor: '#f0f4f8',
  });

  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [environment, setEnvironment] = useState<EnvironmentPreset>('studio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotMarker | null>(null);

  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    model: THREE.Object3D | null;
    modelSize: THREE.Vector3;
    originalPositions: Map<THREE.Mesh, THREE.Vector3>;
    gridHelper: THREE.GridHelper;
    axesHelper: THREE.AxesHelper;
    ambientLight: THREE.HemisphereLight;
    directionalLight: THREE.DirectionalLight;
    hotspotSprites: THREE.Sprite[];
    frame: number;
  } | null>(null);

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(ENVIRONMENT_PRESETS[environment].bg);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    camera.position.set(3, 3, 3);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 50;
    controls.autoRotate = viewerState.autoRotate;
    controls.autoRotateSpeed = viewerState.rotationSpeed * 2;

    // Lighting
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xdddddd, ENVIRONMENT_PRESETS[environment].ambient);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, ENVIRONMENT_PRESETS[environment].directional);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Grid & Axes
    const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xe8e8e8);
    gridHelper.visible = viewerState.showGrid;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.visible = viewerState.showAxes;
    scene.add(axesHelper);

    runtimeRef.current = {
      renderer,
      scene,
      camera,
      controls,
      model: null,
      modelSize: new THREE.Vector3(),
      originalPositions: new Map(),
      gridHelper,
      axesHelper,
      ambientLight,
      directionalLight,
      hotspotSprites: [],
      frame: 0,
    };

    // Load Model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        const { size } = centerModel(model);

        // Store original positions for explode
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            runtimeRef.current!.originalPositions.set(child as THREE.Mesh, child.position.clone());
          }
        });

        // Scale to fit
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 5) {
          const scale = 5 / maxDim;
          model.scale.setScalar(scale);
        }

        scene.add(model);
        runtimeRef.current!.model = model;
        runtimeRef.current!.modelSize = size;

        // Compute stats
        setModelStats(computeModelStats(model));

        // Auto-fit camera
        const fitCamera = () => {
          const box = new THREE.Box3().setFromObject(model);
          const boxSize = box.getSize(new THREE.Vector3());
          const boxCenter = box.getCenter(new THREE.Vector3());

          const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
          const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
          const fitWidthDistance = fitHeightDistance / camera.aspect;
          const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.5;

          camera.position.set(distance, distance * 0.5, distance);
          controls.target.copy(boxCenter);
          controls.update();
        };
        fitCamera();

        setIsLoaded(true);
        setLoadProgress(100);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (error) => {
        console.error('Model load error:', error);
        setLoadError('Failed to load 3D model');
        setLoadProgress(0);
      }
    );

    // Animation loop
    const animate = () => {
      runtimeRef.current!.frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(runtimeRef.current?.frame || 0);
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [modelUrl]);

  // Update environment
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const preset = ENVIRONMENT_PRESETS[environment];
    runtime.scene.background = new THREE.Color(preset.bg);
    runtime.ambientLight.intensity = preset.ambient;
    runtime.directionalLight.intensity = preset.directional;
  }, [environment]);

  // Update render mode
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.model) return;

    const config = RENDER_MODES[renderMode];

    runtime.model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (material.isMeshStandardMaterial) {
          material.wireframe = config.wireframe;
          material.opacity = config.opacity;
          material.transparent = config.opacity < 1;
          material.needsUpdate = true;
        }
      }
    });
  }, [renderMode]);

  // Update controls & grid
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    runtime.controls.autoRotate = viewerState.autoRotate;
    runtime.controls.autoRotateSpeed = viewerState.rotationSpeed * 2;
    runtime.gridHelper.visible = viewerState.showGrid;
    runtime.axesHelper.visible = viewerState.showAxes;
  }, [viewerState.autoRotate, viewerState.rotationSpeed, viewerState.showGrid, viewerState.showAxes]);

  // Explode effect
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime?.model) return;

    const distance = viewerState.explodeDistance;
    const center = new THREE.Vector3();
    runtime.model.getWorldPosition(center);

    runtime.originalPositions.forEach((originalPos, mesh) => {
      if (distance === 0) {
        mesh.position.copy(originalPos);
      } else {
        const direction = originalPos.clone().sub(center).normalize();
        mesh.position.copy(originalPos.clone().add(direction.multiplyScalar(distance)));
      }
    });
  }, [viewerState.explodeDistance]);

  // View preset handler
  const handleViewPreset = useCallback((preset: ViewPreset) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const config = VIEW_PRESETS[preset];
    const distance = runtime.modelSize.length() * 2 || 5;

    runtime.camera.position.set(
      config.position[0] * distance,
      config.position[1] * distance,
      config.position[2] * distance
    );
    runtime.controls.target.set(...config.target);
    runtime.controls.update();
  }, []);

  // Screenshot
  const handleScreenshot = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    runtime.renderer.render(runtime.scene, runtime.camera);
    const dataUrl = runtime.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'model-screenshot.png';
    link.href = dataUrl;
    link.click();
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <V2Surface
      title={title}
      subtitle="Interactive 3D model viewer with AR/VR support"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {enableAR && <Badge variant="info">AR Ready</Badge>}
          {enableVR && <Badge variant="info">VR Ready</Badge>}
          {modelStats && (
            <Badge variant="outline">
              {(modelStats.vertices / 1000).toFixed(1)}k verts
            </Badge>
          )}
        </div>
      }
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
        {/* View Presets */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">View</span>
          {(['front', 'top', 'iso'] as ViewPreset[]).map((preset) => (
            <Button key={preset} type="button" size="sm" variant="secondary" onClick={() => handleViewPreset(preset)}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--semantic-border)]" />

        {/* Render Mode */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">Render</span>
          {(['solid', 'wireframe', 'xray'] as RenderMode[]).map((mode) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={renderMode === mode ? 'primary' : 'secondary'}
              onClick={() => setRenderMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--semantic-border)]" />

        {/* Environment */}
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold text-[var(--semantic-text-subtle)]">Env</span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as EnvironmentPreset)}
            className="rounded-lg border border-[var(--semantic-border)] bg-white px-2 py-1 text-xs"
          >
            <option value="studio">Studio</option>
            <option value="outdoor">Outdoor</option>
            <option value="warehouse">Warehouse</option>
            <option value="night">Night</option>
          </select>
        </div>

        <div className="h-6 w-px bg-[var(--semantic-border)]" />

        {/* Controls */}
        <Button
          type="button"
          size="sm"
          variant={viewerState.autoRotate ? 'primary' : 'secondary'}
          onClick={() => setViewerState((s) => ({ ...s, autoRotate: !s.autoRotate }))}
        >
          Auto Rotate
        </Button>

        <Button
          type="button"
          size="sm"
          variant={viewerState.showGrid ? 'primary' : 'secondary'}
          onClick={() => setViewerState((s) => ({ ...s, showGrid: !s.showGrid }))}
        >
          Grid
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleScreenshot}>
            Screenshot
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      {/* Explode Slider */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--semantic-border)] bg-white/80 px-4 py-2">
        <span className="text-xs font-semibold text-[var(--semantic-text-subtle)]">Explode</span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={viewerState.explodeDistance}
          onChange={(e) => setViewerState((s) => ({ ...s, explodeDistance: parseFloat(e.target.value) }))}
          className="w-40 accent-[var(--semantic-primary)]"
        />
        <span className="text-xs text-[var(--semantic-text-subtle)]">
          {viewerState.explodeDistance.toFixed(1)}x
        </span>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-[500px] overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-gradient-to-br from-[#1a1a2e] to-[#16213e]"
      >
        <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

        {/* Loading Overlay */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-3 h-2 w-48 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[var(--semantic-primary)] transition-all"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="text-sm text-white/80">Loading 3D Model... {loadProgress}%</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center text-white">
              <V2StatusPill label="Error" variant="danger" />
              <p className="mt-2 text-sm">{loadError}</p>
            </div>
          </div>
        )}

        {/* Navigation Hint */}
        <div className="absolute bottom-4 right-4 rounded-lg border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
          Drag to rotate | Scroll to zoom | Shift+drag to pan
        </div>

        {/* Model Stats */}
        {modelStats && isLoaded && (
          <div className="absolute left-4 top-4 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs text-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>Vertices:</span>
              <span className="font-mono">{modelStats.vertices.toLocaleString()}</span>
              <span>Triangles:</span>
              <span className="font-mono">{modelStats.triangles.toLocaleString()}</span>
              <span>Meshes:</span>
              <span className="font-mono">{modelStats.meshes}</span>
              <span>Materials:</span>
              <span className="font-mono">{modelStats.materials}</span>
            </div>
          </div>
        )}
      </div>

      {/* AR/VR Actions */}
      {(enableAR || enableVR) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {enableAR && (
            <Button type="button" variant="secondary">
              View in AR
            </Button>
          )}
          {enableVR && (
            <Button type="button" variant="secondary">
              Enter VR Mode
            </Button>
          )}
          <p className="self-center text-xs text-[var(--semantic-text-subtle)]">
            Requires compatible device and browser
          </p>
        </div>
      )}
    </V2Surface>
  );
}
