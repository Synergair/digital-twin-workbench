import { useEffect, useRef, useState } from 'react';
import { X, Layers, Ruler, Map, Zap, Droplets, Wind, Flame, Shield } from 'lucide-react';
import type { TwinLayer } from '../../types';

export interface SpatialQueryResult {
  position: {
    world: [number, number, number];
    screen: { x: number; y: number };
  };
  surfaceInfo: {
    type: 'wall' | 'floor' | 'ceiling' | 'door' | 'window' | 'furniture' | 'unknown';
    material?: string;
    thickness?: number;
    fireRating?: string;
    loadBearing?: boolean;
  };
  mepProximity: {
    system: TwinLayer;
    name: string;
    distance: number;
    material?: string;
    specifications?: Record<string, string>;
  }[];
  roomInfo?: {
    roomId: string;
    roomName: string;
    unitId: string;
    unitNumber: string;
    area: number;
  };
  measurements?: {
    toNearestWall: number;
    toNearestCorner: number;
    ceilingHeight: number;
  };
}

interface SpatialQueryPanelProps {
  result: SpatialQueryResult | null;
  visible: boolean;
  onClose: () => void;
  onSelectMEP: (system: TwinLayer) => void;
  onMeasureFrom: () => void;
}

const layerIcons: Partial<Record<TwinLayer, React.ReactNode>> = {
  structure: <Layers className="h-4 w-4" />,
  plomberie: <Droplets className="h-4 w-4" />,
  hvac: <Wind className="h-4 w-4" />,
  electricite: <Zap className="h-4 w-4" />,
  fire: <Flame className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  water: <Droplets className="h-4 w-4" />,
  gas: <Flame className="h-4 w-4" />,
  sprinklers: <Droplets className="h-4 w-4" />,
  lighting: <Zap className="h-4 w-4" />,
  electrical: <Zap className="h-4 w-4" />,
};

const layerColors: Partial<Record<TwinLayer, string>> = {
  structure: 'text-slate-400',
  plomberie: 'text-sky-400',
  hvac: 'text-emerald-400',
  electricite: 'text-amber-400',
  fire: 'text-rose-400',
  security: 'text-indigo-400',
  water: 'text-sky-400',
  gas: 'text-orange-400',
  sprinklers: 'text-cyan-400',
  lighting: 'text-yellow-400',
  electrical: 'text-amber-400',
};

const surfaceTypeLabels: Record<string, string> = {
  wall: 'Mur',
  floor: 'Plancher',
  ceiling: 'Plafond',
  door: 'Porte',
  window: 'Fenêtre',
  furniture: 'Mobilier',
  unknown: 'Surface',
};

/**
 * SpatialQueryPanel - Displays results from clicking anywhere in the 3D viewer
 *
 * Shows:
 * - Surface information (material, fire rating, load bearing)
 * - Nearby MEP systems with distances
 * - Room context
 * - Quick measurements
 */
export function SpatialQueryPanel({
  result,
  visible,
  onClose,
  onSelectMEP,
  onMeasureFrom,
}: SpatialQueryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  // Position panel near click point
  useEffect(() => {
    if (!result || !visible || !panelRef.current) return;

    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = result.position.screen.x + 24;
    let top = result.position.screen.y - rect.height / 2;

    // Flip if too close to edges
    if (left + rect.width > viewportWidth - 20) {
      left = result.position.screen.x - rect.width - 24;
    }

    top = Math.max(80, Math.min(top, viewportHeight - rect.height - 80));

    setPosition({ left, top });
  }, [result, visible]);

  if (!visible || !result) return null;

  const hasNearbyMEP = result.mepProximity.length > 0;

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-40 w-72 rounded-2xl border border-white/10 bg-slate-800/95 shadow-2xl backdrop-blur-md"
      style={{
        left: position.left,
        top: position.top,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 150ms, transform 150ms',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20">
            <Map className="h-3.5 w-3.5 text-teal-400" />
          </span>
          <span className="text-sm font-medium text-white">Requête spatiale</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        {/* Surface Info */}
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
            Surface
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {surfaceTypeLabels[result.surfaceInfo.type]}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {result.surfaceInfo.material && (
              <>
                <span className="text-white/50">Matériau</span>
                <span className="text-white">{result.surfaceInfo.material}</span>
              </>
            )}
            {result.surfaceInfo.thickness && (
              <>
                <span className="text-white/50">Épaisseur</span>
                <span className="text-white">{result.surfaceInfo.thickness} mm</span>
              </>
            )}
            {result.surfaceInfo.fireRating && (
              <>
                <span className="text-white/50">Résistance feu</span>
                <span className="text-white">{result.surfaceInfo.fireRating}</span>
              </>
            )}
            {result.surfaceInfo.loadBearing !== undefined && (
              <>
                <span className="text-white/50">Porteur</span>
                <span className={result.surfaceInfo.loadBearing ? 'text-amber-400' : 'text-white'}>
                  {result.surfaceInfo.loadBearing ? 'Oui' : 'Non'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Room Context */}
        {result.roomInfo && (
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Contexte
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {result.roomInfo.roomName}
            </p>
            <p className="text-xs text-white/60">
              Unité {result.roomInfo.unitNumber} • {result.roomInfo.area.toFixed(0)} m²
            </p>
          </div>
        )}

        {/* MEP Proximity */}
        {hasNearbyMEP && (
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Systèmes à proximité
            </p>
            <div className="mt-2 space-y-2">
              {result.mepProximity.slice(0, 4).map((mep, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectMEP(mep.system)}
                  className="flex w-full items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className={layerColors[mep.system]}>
                      {layerIcons[mep.system]}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white">{mep.name}</p>
                      {mep.material && (
                        <p className="text-[10px] text-white/50">{mep.material}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/60">
                    {mep.distance < 1
                      ? `${(mep.distance * 100).toFixed(0)} cm`
                      : `${mep.distance.toFixed(1)} m`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Measurements */}
        {result.measurements && (
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Mesures rapides
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {result.measurements.toNearestWall.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/50">m au mur</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {result.measurements.ceilingHeight.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/50">m hauteur</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onMeasureFrom}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            <Ruler className="h-3.5 w-3.5" />
            Mesurer depuis
          </button>
        </div>

        {/* Coordinates */}
        <p className="text-center text-[10px] text-white/30">
          xyz: [{result.position.world.map((v) => v.toFixed(2)).join(', ')}]
        </p>
      </div>
    </div>
  );
}

export default SpatialQueryPanel;
