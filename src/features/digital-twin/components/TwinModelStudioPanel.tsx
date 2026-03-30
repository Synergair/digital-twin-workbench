import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import { cn } from '@/lib/utils';
import { getTwinData } from '../twinData';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { useAuthStore } from '@/store/authStore';
import type { ConversionJob, ConversionLog, ConversionStatus } from '@/lib/api/conversion';
import { createModelConversion, fetchConversionJob, fetchConversionJobs, fetchConversionLogs } from '@/lib/api/conversion';

type XeokitModule = typeof import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js');
type ThreeModule = typeof import('three');
type PLYLoaderModule = typeof import('three/examples/jsm/loaders/PLYLoader.js');

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

type LocalConversionStatus = ConversionStatus | 'idle';

const conversionTone = (status: LocalConversionStatus) => {
  if (status === 'ready') return 'success';
  if (status === 'processing') return 'info';
  if (status === 'failed') return 'danger';
  return 'neutral';
};

function IfcPreviewViewer({ modelUrl }: { modelUrl?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navCubeRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<{ viewer: any; model: any; navCube: any } | null>(null);
  const [status, setStatus] = useState<ViewerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const cleanup = () => {
      if (runtimeRef.current) {
        runtimeRef.current.viewer.destroy();
        runtimeRef.current = null;
      }
    };

    if (!modelUrl || !canvasRef.current || !navCubeRef.current) {
      cleanup();
      setStatus('idle');
      return undefined;
    }

    const start = async () => {
      setStatus('loading');
      setError(null);

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
        });

        viewer.scene.canvas.canvas.style.width = '100%';
        viewer.scene.canvas.canvas.style.height = '100%';
        viewer.cameraControl.navMode = 'orbit';
        viewer.cameraControl.followPointer = false;
        viewer.cameraControl.smartPivot = false;
        viewer.cameraControl.rotationInertia = 0.12;

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

        const gltfLoader = new xeokit.GLTFLoaderPlugin(viewer);
        const model = gltfLoader.load({
          id: 'ifc-preview-model',
          src: modelUrl,
          edges: true,
          autoMetaModel: true,
          performance: false,
        });

        runtimeRef.current = { viewer, model, navCube };

        model.on('loaded', () => {
          if (disposed) {
            return;
          }
          viewer.cameraFlight.flyTo(model.aabb, { duration: 0.6 });
          setStatus('ready');
        });
        model.on?.('error', (message: string) => {
          if (disposed) {
            return;
          }
          setStatus('error');
          setError(message || 'Erreur de chargement du preview IFC.');
        });
      } catch (caught) {
        setStatus('error');
        setError(caught instanceof Error ? caught.message : 'Erreur de chargement viewer');
      }
    };

    cleanup();
    void start();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [modelUrl]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)]">
      <div className="relative aspect-[16/9] w-full bg-[linear-gradient(135deg,_rgba(15,45,45,0.08),_rgba(255,255,255,0.86))]">
        <canvas ref={canvasRef} className="h-full w-full" />
        <canvas ref={navCubeRef} className="absolute right-4 top-4 h-20 w-20 rounded-xl border border-white/70 bg-white/80" />
        {status !== 'ready' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-sm text-[var(--semantic-text-subtle)]">
            <span>{status === 'loading' ? 'Chargement du preview...' : 'Preview IFC indisponible.'}</span>
            {error ? <span className="max-w-xs text-center text-xs text-rose-600">{error}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IfcWebViewer({ ifcUrl }: { ifcUrl?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navCubeRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<{ viewer: any; model: any; navCube: any } | null>(null);
  const [status, setStatus] = useState<ViewerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const cleanup = () => {
      if (runtimeRef.current) {
        runtimeRef.current.viewer.destroy();
        runtimeRef.current = null;
      }
    };

    if (!ifcUrl || !canvasRef.current || !navCubeRef.current) {
      cleanup();
      setStatus('idle');
      return undefined;
    }

    const start = async () => {
      setStatus('loading');
      setError(null);

      try {
        const xeokit = (await import('@xeokit/xeokit-sdk/dist/xeokit-sdk.es.js')) as XeokitModule;
        const WebIFC = await import('web-ifc');

        if (disposed || !canvasRef.current || !navCubeRef.current) {
          return;
        }

        const ifcAPI = new WebIFC.IfcAPI();
        if (typeof ifcAPI.SetWasmPath === 'function') {
          ifcAPI.SetWasmPath('/web-ifc/', true);
        }
        await ifcAPI.Init();

        const viewer = new xeokit.Viewer({
          canvasElement: canvasRef.current,
          transparent: true,
          antialias: true,
          saoEnabled: true,
        });

        viewer.scene.canvas.canvas.style.width = '100%';
        viewer.scene.canvas.canvas.style.height = '100%';
        viewer.cameraControl.navMode = 'orbit';
        viewer.cameraControl.followPointer = false;
        viewer.cameraControl.smartPivot = false;
        viewer.cameraControl.rotationInertia = 0.12;

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

        const ifcLoader = new xeokit.WebIFCLoaderPlugin(viewer, {
          WebIFC,
          IfcAPI: ifcAPI,
        });

        const model = ifcLoader.load({
          id: 'ifc-web-model',
          src: ifcUrl,
          edges: true,
          autoMetaModel: true,
          performance: false,
        });

        runtimeRef.current = { viewer, model, navCube };

        model.on('loaded', () => {
          if (disposed) {
            return;
          }
          viewer.cameraFlight.flyTo(model.aabb, { duration: 0.6 });
          setStatus('ready');
        });
        model.on?.('error', (message: string) => {
          if (disposed) {
            return;
          }
          setStatus('error');
          setError(message || 'Erreur de chargement IFC.');
        });
      } catch (caught) {
        setStatus('error');
        setError(caught instanceof Error ? caught.message : 'Erreur de chargement IFC');
      }
    };

    cleanup();
    void start();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [ifcUrl]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)]">
      <div className="relative aspect-[16/9] w-full bg-[linear-gradient(135deg,_rgba(15,45,45,0.08),_rgba(255,255,255,0.86))]">
        <canvas ref={canvasRef} className="h-full w-full" />
        <canvas ref={navCubeRef} className="absolute right-4 top-4 h-20 w-20 rounded-xl border border-white/70 bg-white/80" />
        {status !== 'ready' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-sm text-[var(--semantic-text-subtle)]">
            <span>{status === 'loading' ? 'Chargement IFC...' : 'IFC viewer indisponible.'}</span>
            {error ? <span className="max-w-xs text-center text-xs text-rose-600">{error}</span> : null}
            <span className="text-xs text-[var(--semantic-text-subtle)]">Verifiez que /public/web-ifc/web-ifc.wasm est present.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PointCloudViewer({
  plyUrl,
  pointSize,
  opacity,
  colorByHeight,
}: {
  plyUrl?: string | null;
  pointSize: number;
  opacity: number;
  colorByHeight: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [status, setStatus] = useState<ViewerStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let points: any;
    let removeResize: (() => void) | null = null;

    const cleanup = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (renderer) {
        renderer.dispose?.();
        renderer.domElement?.remove();
      }
    };

    if (!plyUrl || !containerRef.current) {
      cleanup();
      setStatus('idle');
      return undefined;
    }

    const start = async () => {
      setStatus('loading');
      setError(null);

      try {
        const THREE = (await import('three')) as ThreeModule;
        const loaderModule = (await import('three/examples/jsm/loaders/PLYLoader.js')) as PLYLoaderModule;
        const { PLYLoader } = loaderModule;

        if (disposed || !containerRef.current) {
          return;
        }

        scene = new THREE.Scene();
        scene.background = new THREE.Color('#f5f8f8');

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 0.9);
        light.position.set(4, 6, 8);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        const loader = new PLYLoader();
        loader.load(
          plyUrl,
          (geometry: any) => {
            if (disposed) {
              return;
            }
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            if (box) {
              box.getSize(size);
              box.getCenter(center);
            }
            const positionAttr = geometry.getAttribute('position');
            const vertexCount = positionAttr?.count ?? 0;
            const hasColor = geometry.hasAttribute('color');

            if (colorByHeight && vertexCount > 0) {
              const colors = new Float32Array(vertexCount * 3);
              let minY = Infinity;
              let maxY = -Infinity;
              for (let i = 0; i < vertexCount; i += 1) {
                const y = positionAttr.getY(i);
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
              const range = maxY - minY || 1;
              for (let i = 0; i < vertexCount; i += 1) {
                const y = positionAttr.getY(i);
                const t = (y - minY) / range;
                colors[i * 3] = 0.2 + t * 0.6;
                colors[i * 3 + 1] = 0.35 + (1 - t) * 0.45;
                colors[i * 3 + 2] = 0.7 + (1 - t) * 0.25;
              }
              geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            }
            const material = new THREE.PointsMaterial({
              size: Math.max(0.01, Math.min(0.05, size.length() * pointSize)),
              vertexColors: colorByHeight || hasColor,
              color: colorByHeight || hasColor ? undefined : new THREE.Color('#0d7377'),
              opacity,
              transparent: opacity < 1,
            });
            points = new THREE.Points(geometry, material);
            points.position.sub(center);
            scene.add(points);
            camera.position.set(0, 0, size.length() * 1.5 || 3);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            setStatus('ready');

            const animate = () => {
              if (disposed) {
                return;
              }
              if (points) {
                points.rotation.y += 0.002;
              }
              renderer.render(scene, camera);
              frameRef.current = requestAnimationFrame(animate);
            };

            animate();
          },
          undefined,
          (err) => {
            if (disposed) {
              return;
            }
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Erreur de chargement PLY');
          }
        );

        const handleResize = () => {
          if (!renderer || !camera || !containerRef.current) {
            return;
          }
          const nextWidth = containerRef.current.clientWidth;
          const nextHeight = containerRef.current.clientHeight;
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(nextWidth, nextHeight);
        };

        window.addEventListener('resize', handleResize);
        removeResize = () => window.removeEventListener('resize', handleResize);
      } catch (caught) {
        setStatus('error');
        setError(caught instanceof Error ? caught.message : 'Erreur de chargement point cloud');
      }
    };

    cleanup();
    void start();

    return () => {
      disposed = true;
      cleanup();
      if (removeResize) {
        removeResize();
      }
    };
  }, [plyUrl, pointSize, opacity, colorByHeight]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-white">
      <div ref={containerRef} className="absolute inset-0" />
      {status !== 'ready' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 text-sm text-[var(--semantic-text-subtle)]">
          <span>{status === 'loading' ? 'Chargement PLY...' : 'Viewer point cloud indisponible.'}</span>
          {error ? <span className="max-w-xs text-center text-xs text-rose-600">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function TwinModelStudioPanel({ propertyId }: { propertyId: string }) {
  const data = useMemo(() => getTwinData(propertyId), [propertyId]);
  const {
    modelOverrideUrl,
    setModelOverrideUrl,
    defaultModelUrl,
    setDefaultModelForProperty,
    clearDefaultModelForProperty,
    explodedMode,
    explodedFactor,
    toggleExploded,
    setExplodedFactor,
  } = useDigitalTwinStore();
  const userId = useAuthStore((state) => state.user?.id ?? 'anonymous');
  const [activeTab, setActiveTab] = useState<'ifc' | 'pointcloud'>('ifc');
  const [selectedIfcId, setSelectedIfcId] = useState(data.ifcModels[0]?.id ?? '');
  const [selectedScanId, setSelectedScanId] = useState(data.pointCloudScans[0]?.id ?? '');
  const [ifcMode, setIfcMode] = useState<'webifc' | 'preview' | 'converted'>('preview');
  const [pointCloudMode, setPointCloudMode] = useState<'viewer' | 'preview'>('viewer');
  const [pointSize, setPointSize] = useState(0.03);
  const [pointOpacity, setPointOpacity] = useState(0.9);
  const [colorByHeight, setColorByHeight] = useState(true);
  const [conversionJobs, setConversionJobs] = useState<Record<string, ConversionJob | null>>({});
  const [conversionLogs, setConversionLogs] = useState<Record<string, ConversionLog[]>>({});
  const [pointCloudFiles, setPointCloudFiles] = useState<Array<{ file: string; label?: string; points?: string }>>([]);
  const [selectedPly, setSelectedPly] = useState<string>('');

  const selectedIfc = data.ifcModels.find((model) => model.id === selectedIfcId) ?? data.ifcModels[0];
  const selectedScan = data.pointCloudScans.find((scan) => scan.id === selectedScanId) ?? data.pointCloudScans[0];
  const activeJob = selectedIfc ? conversionJobs[selectedIfc.id] ?? null : null;
  const ifcStatus = activeJob?.status ?? 'idle';
  const ifcLogs = activeJob ? conversionLogs[activeJob.id] ?? [] : [];
  const convertedUrl = activeJob?.output?.glbUrl ?? null;
  const previewUrl = selectedIfc?.previewModelUrl ?? null;
  const selectedDefaultMatch = defaultModelUrl && (defaultModelUrl === convertedUrl || defaultModelUrl === previewUrl);
  const settingsLoadedRef = useRef(false);

  const settingsKey = useMemo(() => `digital-twin-pointcloud-settings-v1:${propertyId}:${userId}`, [propertyId, userId]);

  const availablePlyFiles = useMemo(() => {
    if (pointCloudFiles.length) {
      return pointCloudFiles;
    }
    if (selectedScan?.plyFiles?.length) {
      return selectedScan.plyFiles.map((file) => ({ file, label: file }));
    }
    if (selectedScan?.plyFile) {
      return [{ file: selectedScan.plyFile, label: selectedScan.plyFile }];
    }
    return [];
  }, [pointCloudFiles, selectedScan]);

  useEffect(() => {
    let mounted = true;
    const hydrateConversions = async () => {
      try {
        const jobs = await fetchConversionJobs(propertyId);
        if (!mounted) {
          return;
        }
        const byIfc: Record<string, ConversionJob | null> = {};
        data.ifcModels.forEach((model) => {
          byIfc[model.id] = jobs.find((job) => job.sourceFile === model.file) ?? null;
        });
        setConversionJobs(byIfc);
      } catch {
        // ignore hydration errors
      }
    };

    void hydrateConversions();
    return () => {
      mounted = false;
    };
  }, [data.ifcModels, propertyId]);

  useEffect(() => {
    if (!availablePlyFiles.length) {
      return;
    }
    if (selectedPly && availablePlyFiles.some((entry) => entry.file === selectedPly)) {
      return;
    }
    setSelectedPly(availablePlyFiles[0].file);
  }, [availablePlyFiles, selectedPly]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(settingsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          pointSize?: number;
          pointOpacity?: number;
          colorByHeight?: boolean;
          pointCloudMode?: 'viewer' | 'preview';
          selectedPly?: string;
        };
        if (typeof parsed.pointSize === 'number') {
          setPointSize(parsed.pointSize);
        }
        if (typeof parsed.pointOpacity === 'number') {
          setPointOpacity(parsed.pointOpacity);
        }
        if (typeof parsed.colorByHeight === 'boolean') {
          setColorByHeight(parsed.colorByHeight);
        }
        if (parsed.pointCloudMode === 'viewer' || parsed.pointCloudMode === 'preview') {
          setPointCloudMode(parsed.pointCloudMode);
        }
        if (typeof parsed.selectedPly === 'string') {
          setSelectedPly(parsed.selectedPly);
        }
      }
    } catch {
      // ignore malformed settings
    } finally {
      settingsLoadedRef.current = true;
    }
  }, [settingsKey]);

  useEffect(() => {
    if (!settingsLoadedRef.current || typeof window === 'undefined') {
      return;
    }
    const payload = {
      pointSize,
      pointOpacity,
      colorByHeight,
      pointCloudMode,
      selectedPly,
    };
    window.localStorage.setItem(settingsKey, JSON.stringify(payload));
  }, [colorByHeight, pointCloudMode, pointOpacity, pointSize, selectedPly, settingsKey]);

  useEffect(() => {
    let mounted = true;
    const loadManifest = async () => {
      try {
        const response = await fetch('/documents/scans/pointclouds.json');
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { files?: Array<{ file: string; label?: string; points?: string }> };
        if (mounted && payload?.files?.length) {
          setPointCloudFiles(payload.files);
        }
      } catch {
        // ignore missing manifest
      }
    };

    void loadManifest();
    return () => {
      mounted = false;
    };
  }, []);

  const handleQueueConversion = async () => {
    if (!selectedIfc) {
      return;
    }
    const job = await createModelConversion({
      propertyId,
      sourceFile: selectedIfc.file,
      previewModelUrl: selectedIfc.previewModelUrl,
    });
    setConversionJobs((prev) => ({ ...prev, [selectedIfc.id]: job }));
    setConversionLogs((prev) => ({ ...prev, [job.id]: [] }));
  };

  const handleApplyModel = (url?: string | null) => {
    if (!url) {
      return;
    }
    setModelOverrideUrl(url);
  };

  const handleResetModel = () => {
    setModelOverrideUrl(null);
  };

  const handleSetDefaultModel = (url?: string | null) => {
    if (!selectedIfc || !url) {
      return;
    }
    setDefaultModelForProperty(propertyId, url);
  };

  const handleClearDefaultModel = () => {
    if (!selectedIfc) {
      return;
    }
    clearDefaultModelForProperty(propertyId);
  };

  const handleResetPointCloudSettings = () => {
    setPointSize(0.03);
    setPointOpacity(0.9);
    setColorByHeight(true);
  };

  const handleRefreshLogs = async () => {
    if (!activeJob || !selectedIfc) {
      return;
    }
    try {
      const job = await fetchConversionJob(activeJob.id);
      setConversionJobs((prev) => ({ ...prev, [selectedIfc.id]: job }));
      const entries = await fetchConversionLogs(activeJob.id);
      setConversionLogs((prev) => ({ ...prev, [activeJob.id]: entries }));
    } catch {
      // ignore refresh errors in mock mode
    }
  };

  useEffect(() => {
    if (!activeJob) {
      return undefined;
    }

    const ifcId = selectedIfc?.id;
    let alive = true;
    let intervalId: number | null = null;

    const poll = async () => {
      if (!alive) {
        return;
      }
      try {
        const job = await fetchConversionJob(activeJob.id);
        if (ifcId) {
          setConversionJobs((prev) => ({ ...prev, [ifcId]: job }));
        }
        const entries = await fetchConversionLogs(activeJob.id);
        setConversionLogs((prev) => ({ ...prev, [activeJob.id]: entries }));
        if (job.status === 'ready' || job.status === 'failed') {
          if (intervalId) {
            window.clearInterval(intervalId);
          }
        }
      } catch {
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      }
    };

    void poll();
    intervalId = window.setInterval(poll, 1500);

    return () => {
      alive = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [activeJob?.id, selectedIfc?.id]);

  return (
    <V2Surface
      title="Model Studio"
      subtitle="IFC viewer (beta) + point cloud stage 2. Choisissez le mode de lecture avant integration finale."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={activeTab === 'ifc' ? 'primary' : 'secondary'} onClick={() => setActiveTab('ifc')}>
            IFC
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'pointcloud' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('pointcloud')}
          >
            Point Cloud
          </Button>
        </div>
      }
    >
      {activeTab === 'ifc' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="space-y-3">
            {data.ifcModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedIfcId(model.id)}
                className={cn(
                  'w-full rounded-2xl border px-3 py-2 text-left text-sm transition',
                  selectedIfc?.id === model.id
                    ? 'border-[var(--semantic-primary)] bg-white shadow-sm'
                    : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[var(--semantic-primary)]'
                )}
              >
                <p className="font-semibold text-[var(--semantic-text)]">{model.name}</p>
                <p className="text-xs text-[var(--semantic-text-subtle)]">
                  {model.buildingType} • {model.sizeMb}MB
                </p>
                <p className="text-[11px] text-[var(--semantic-text-subtle)]">{model.file}</p>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--semantic-text)]">{selectedIfc?.name ?? 'IFC'}</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">Derniere mise a jour {selectedIfc?.updatedAt}</p>
                </div>
                <V2StatusPill
                  label={ifcMode === 'webifc' ? 'WebIFC' : ifcMode === 'converted' ? 'GLB converti' : 'Preview'}
                  variant="info"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
                <Badge variant="outline">{selectedIfc?.buildingType ?? 'BIM'}</Badge>
                <Badge variant="outline">{selectedIfc?.file ?? 'IFC'}</Badge>
                <Badge variant="outline">{selectedIfc?.sizeMb ?? 0}MB</Badge>
                {modelOverrideUrl ? <Badge variant="success">Modele actif</Badge> : null}
                {selectedDefaultMatch ? <Badge variant="info">Modele par defaut</Badge> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedIfc?.file ? (
                  <a href={`/documents/models/${selectedIfc.file}`} target="_blank" rel="noreferrer">
                    <Button type="button" size="sm" variant="secondary">
                      Ouvrir IFC
                    </Button>
                  </a>
                ) : null}
                <Button type="button" size="sm" variant={ifcMode === 'webifc' ? 'primary' : 'secondary'} onClick={() => setIfcMode('webifc')}>
                  Viewer IFC
                </Button>
                <Button type="button" size="sm" variant={ifcMode === 'preview' ? 'primary' : 'secondary'} onClick={() => setIfcMode('preview')}>
                  Preview GLB
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={ifcMode === 'converted' ? 'primary' : 'secondary'}
                  onClick={() => setIfcMode('converted')}
                >
                  GLB converti
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--semantic-text)]">Pipeline conversion</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">IFC → XKT/GLB (server). Stubs operationnels.</p>
                </div>
                <V2StatusPill label={`${ifcStatus}${activeJob ? ` • ${activeJob.progress}%` : ''}`} variant={conversionTone(ifcStatus)} />
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-[var(--semantic-text-subtle)]">
                <li>Upload IFC + metadata</li>
                <li>Conversion XKT/GLB</li>
                <li>Validation geometrie + MEP</li>
                <li>Publication dans le twin</li>
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={handleQueueConversion}>
                  Lancer conversion
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={handleRefreshLogs}>
                  Rafraichir logs
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => handleApplyModel(convertedUrl ?? previewUrl)}
                  disabled={!convertedUrl && !previewUrl}
                >
                  Utiliser comme modele actif
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={handleResetModel}>
                  Revenir au modele original
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleSetDefaultModel(convertedUrl ?? previewUrl)}
                  disabled={!convertedUrl && !previewUrl}
                >
                  Definir par defaut
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={handleClearDefaultModel} disabled={!defaultModelUrl}>
                  Retirer par defaut
                </Button>
              </div>
              {activeJob?.output ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
                  {activeJob.output.xktUrl ? <Badge variant="outline">XKT</Badge> : null}
                  {activeJob.output.glbUrl ? <Badge variant="outline">GLB</Badge> : null}
                  {activeJob.output.xktUrl ? (
                    <a href={activeJob.output.xktUrl} target="_blank" rel="noreferrer" className="underline">
                      Telecharger XKT
                    </a>
                  ) : null}
                  {activeJob.output.glbUrl ? (
                    <a href={activeJob.output.glbUrl} target="_blank" rel="noreferrer" className="underline">
                      Telecharger GLB
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3 rounded-xl border border-[var(--semantic-border)] bg-white/80 p-2 text-xs text-[var(--semantic-text-subtle)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">Logs pipeline</p>
                <div className="mt-2 max-h-32 space-y-1 overflow-auto">
                  {ifcLogs.length ? (
                    ifcLogs.map((entry, index) => (
                      <div key={`${entry.timestamp}-${index}`} className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-[var(--semantic-text-subtle)]">{entry.timestamp.slice(11, 19)}</span>
                        <span className="flex-1">{entry.message}</span>
                      </div>
                    ))
                  ) : (
                    <span>Aucun log disponible.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--semantic-text)]">Exploded Assembly</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">
                    Mode eclate pour sequence technique (AR/VR ready).
                  </p>
                </div>
                <Button type="button" size="sm" variant={explodedMode ? 'primary' : 'secondary'} onClick={toggleExploded}>
                  {explodedMode ? 'Actif' : 'Activer'}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={explodedFactor}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setExplodedFactor(next);
                    if (!explodedMode) {
                      toggleExploded();
                    }
                  }}
                  className="w-40 accent-[var(--semantic-primary)]"
                />
                <span>{Math.round(explodedFactor * 100)}%</span>
                <Badge variant="outline">Pieces 8</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                {['Tete pompe', 'Rotor', 'Anneau', 'Garniture', 'Joint', 'Corps'].map((label, index) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl border border-[var(--semantic-border)] bg-white/70 px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--semantic-primary)] text-[10px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-[var(--semantic-text)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {ifcMode === 'webifc' ? (
              <IfcWebViewer ifcUrl={selectedIfc?.file ? `/documents/models/${selectedIfc.file}` : null} />
            ) : ifcMode === 'converted' ? (
              <IfcPreviewViewer modelUrl={convertedUrl} />
            ) : (
              <IfcPreviewViewer modelUrl={previewUrl} />
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <div className="space-y-3">
            {data.pointCloudScans.map((scan) => (
              <button
                key={scan.id}
                type="button"
                onClick={() => setSelectedScanId(scan.id)}
                className={cn(
                  'w-full rounded-2xl border px-3 py-2 text-left text-sm transition',
                  selectedScan?.id === scan.id
                    ? 'border-[var(--semantic-primary)] bg-white shadow-sm'
                    : 'border-[var(--semantic-border)] bg-[var(--panel-soft)] hover:border-[var(--semantic-primary)]'
                )}
              >
                <p className="font-semibold text-[var(--semantic-text)]">{scan.name}</p>
                <p className="text-xs text-[var(--semantic-text-subtle)]">{scan.points}</p>
                <p className="text-[11px] text-[var(--semantic-text-subtle)]">{scan.archive}</p>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--semantic-text)]">{selectedScan?.name ?? 'Point cloud'}</p>
                  <p className="text-xs text-[var(--semantic-text-subtle)]">Capture {selectedScan?.capturedAt}</p>
                </div>
                <V2StatusPill label={pointCloudMode === 'viewer' ? 'Viewer' : 'Preview'} variant="warning" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
                <Badge variant="outline">{selectedScan?.points ?? 'Point cloud'}</Badge>
                <Badge variant="outline">{selectedScan?.archive ?? 'Archive'}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedScan?.archive ? (
                  <a href={`/documents/scans/${selectedScan.archive}`} target="_blank" rel="noreferrer">
                    <Button type="button" size="sm" variant="secondary">
                      Telecharger scans
                    </Button>
                  </a>
                ) : null}
                <Button type="button" size="sm" variant={pointCloudMode === 'viewer' ? 'primary' : 'secondary'} onClick={() => setPointCloudMode('viewer')}>
                  Viewer PLY
                </Button>
                <Button type="button" size="sm" variant={pointCloudMode === 'preview' ? 'primary' : 'secondary'} onClick={() => setPointCloudMode('preview')}>
                  Preview image
                </Button>
              </div>
            </div>
            {pointCloudMode === 'viewer' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availablePlyFiles.map((entry) => (
                    <Button
                      key={entry.file}
                      type="button"
                      size="sm"
                      variant={selectedPly === entry.file ? 'primary' : 'secondary'}
                      onClick={() => setSelectedPly(entry.file)}
                    >
                      {entry.label ?? entry.file}
                    </Button>
                  ))}
                </div>
                <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3 text-xs text-[var(--semantic-text-subtle)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span>Taille</span>
                      <input
                        type="range"
                        min="0.01"
                        max="0.08"
                        step="0.005"
                        value={pointSize}
                        onChange={(event) => setPointSize(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span>Opacite</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={pointOpacity}
                        onChange={(event) => setPointOpacity(Number(event.target.value))}
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={colorByHeight} onChange={(event) => setColorByHeight(event.target.checked)} />
                      <span>Couleur par hauteur</span>
                    </label>
                    <Button type="button" size="sm" variant="secondary" onClick={handleResetPointCloudSettings}>
                      Reinitialiser
                    </Button>
                  </div>
                </div>
                <PointCloudViewer
                  plyUrl={selectedPly ? `/documents/scans/${selectedPly}` : null}
                  pointSize={pointSize}
                  opacity={pointOpacity}
                  colorByHeight={colorByHeight}
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[var(--semantic-border)] bg-white">
                {selectedScan?.preview ? (
                  <img src={`/documents/scans/${selectedScan.preview}`} alt={selectedScan.name} className="h-[360px] w-full object-cover" />
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-[var(--semantic-text-subtle)]">
                    Aucun preview disponible.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </V2Surface>
  );
}
