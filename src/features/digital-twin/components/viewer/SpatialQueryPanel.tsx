import { X, Layers, Ruler, MapPin } from 'lucide-react';
import type { TwinLayer } from '../../types';

export interface SpatialQueryResult {
  position: { x: number; y: number; z: number };
  screenX: number;
  screenY: number;
  wallType: string | null;
  wallThickness: number | null;
  nearbyMEP: Array<{
    type: TwinLayer;
    distance: number;
    description: string;
  }>;
  floorLevel: number;
}

interface SpatialQueryPanelProps {
  result: SpatialQueryResult | null;
  visible: boolean;
  onClose: () => void;
  onSelectMEP: (layer: TwinLayer) => void;
  onMeasureFrom: () => void;
}

export function SpatialQueryPanel({
  result,
  visible,
  onClose,
  onSelectMEP,
  onMeasureFrom,
}: SpatialQueryPanelProps) {
  if (!visible || !result) return null;

  const { screenX, screenY, wallType, wallThickness, nearbyMEP, floorLevel } = result;

  return (
    <div
      className="pointer-events-auto fixed z-40"
      style={{
        left: Math.min(screenX + 20, window.innerWidth - 280),
        top: Math.min(screenY + 20, window.innerHeight - 300),
      }}
    >
      <div className="w-64 rounded-xl border border-white/20 bg-slate-900/95 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-semibold text-white">Query Result</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          {/* Location */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              Location
            </p>
            <p className="mt-1 text-sm text-white">Floor {floorLevel}</p>
          </div>

          {/* Wall Info */}
          {wallType && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Wall Type
              </p>
              <p className="mt-1 text-sm text-white">{wallType}</p>
              {wallThickness && (
                <p className="text-xs text-white/60">{wallThickness}mm thickness</p>
              )}
            </div>
          )}

          {/* Nearby MEP */}
          {nearbyMEP.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Nearby Systems
              </p>
              <div className="mt-2 space-y-1.5">
                {nearbyMEP.map((mep, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onSelectMEP(mep.type)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:border-teal-500/50"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-teal-400" />
                      <span className="text-xs text-white">{mep.description}</span>
                    </div>
                    <span className="text-xs text-white/50">{mep.distance}cm</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onMeasureFrom}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 py-2 text-xs font-medium text-white/80 hover:bg-white/5"
            >
              <Ruler className="h-3.5 w-3.5" />
              Measure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
