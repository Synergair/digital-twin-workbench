import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, Layers } from 'lucide-react';
import type { TwinUnit } from '../types';

interface FloorPlan {
  id: string;
  label: string;
  level: string;
  file: string;
  updatedAt: string;
}

interface FloorPlanOverlayProps {
  floorPlans: FloorPlan[];
  units: TwinUnit[];
  selectedUnitId: string | null;
  isolatedFloor: number | null;
  visible: boolean;
  onClose: () => void;
  onSelectUnit: (unitId: string) => void;
}

export function FloorPlanOverlay({
  floorPlans,
  units,
  selectedUnitId,
  isolatedFloor,
  visible,
  onClose,
  onSelectUnit,
}: FloorPlanOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showUnitOverlay, setShowUnitOverlay] = useState(true);

  const activePlan = floorPlans[currentIndex];

  // Units on this floor level
  const floorUnits = useMemo(() => {
    if (isolatedFloor !== null) {
      return units.filter((u) => u.floor === isolatedFloor);
    }
    return units.filter((u) => u.floor === currentIndex);
  }, [units, isolatedFloor, currentIndex]);

  if (!visible || !floorPlans.length) return null;

  const planUrl = `/documents/floorplans/${activePlan.file}`;

  return (
    <div
      className={`pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        expanded
          ? 'inset-4'
          : 'bottom-20 left-4 h-[340px] w-[420px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-teal-400" />
          <span className="text-xs font-semibold text-white">{activePlan.label}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
            {activePlan.level}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowUnitOverlay(!showUnitOverlay)}
            className={`rounded p-1 text-xs transition-colors ${
              showUnitOverlay ? 'bg-teal-600 text-white' : 'text-white/40 hover:text-white'
            }`}
            title="Show unit markers"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-1 text-white/40 transition-colors hover:text-white"
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/40 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floor Plan Image */}
      <div className="relative flex-1 overflow-hidden bg-slate-950">
        <img
          src={planUrl}
          alt={activePlan.label}
          className="h-full w-full object-contain"
          draggable={false}
        />

        {/* Unit markers overlay on the floor plan */}
        {showUnitOverlay && (
          <div className="absolute inset-0 flex flex-wrap items-end justify-center gap-1 p-3">
            {floorUnits.map((unit, index) => {
              const isSelected = unit.id === selectedUnitId;
              const cols = Math.min(4, Math.ceil(Math.sqrt(floorUnits.length)));
              const row = Math.floor(index / cols);
              const col = index % cols;
              const left = 15 + (col / Math.max(cols - 1, 1)) * 70;
              const top = 20 + (row / Math.max(Math.ceil(floorUnits.length / cols) - 1, 1)) * 60;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => onSelectUnit(unit.id)}
                  className={`absolute rounded-lg border px-2 py-1 text-[10px] font-bold shadow-md transition-all ${
                    isSelected
                      ? 'border-teal-400 bg-teal-500/80 text-white scale-110 z-10'
                      : unit.status === 'vacant'
                      ? 'border-amber-400/50 bg-amber-500/40 text-white/90 hover:scale-105'
                      : unit.status === 'alert'
                      ? 'border-red-400/50 bg-red-500/40 text-white/90 hover:scale-105'
                      : 'border-white/30 bg-white/20 text-white/80 hover:scale-105 hover:bg-white/30'
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  {unit.unit_number}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floor Navigation */}
      {floorPlans.length > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="rounded p-1 text-white/40 transition-colors hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex gap-1">
            {floorPlans.map((plan, i) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                  i === currentIndex
                    ? 'bg-teal-600 text-white'
                    : 'text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {plan.level}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(floorPlans.length - 1, currentIndex + 1))}
            disabled={currentIndex === floorPlans.length - 1}
            className="rounded p-1 text-white/40 transition-colors hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
