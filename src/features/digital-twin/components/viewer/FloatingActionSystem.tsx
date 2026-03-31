import { Pin, Wrench, Camera, Ruler, StickyNote } from 'lucide-react';
import type { TwinSeverity, TwinUnit } from '../../types';

export interface FloatingAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface FloatingActionState {
  visible: boolean;
  screenX: number;
  screenY: number;
  selectedUnit: TwinUnit;
  actions: FloatingAction[];
}

interface FloatingActionSystemProps {
  state: FloatingActionState | null;
  severity: TwinSeverity;
  readOnly?: boolean;
  onDropPin: (unit: TwinUnit, severity: TwinSeverity) => void;
  onDispatch: (unit: TwinUnit) => void;
  onCapture: (unit: TwinUnit) => void;
  onMeasure: () => void;
  onAnnotate: (unit: TwinUnit) => void;
  onDismiss: () => void;
}

export function FloatingActionSystem({
  state,
  severity,
  readOnly = false,
  onDropPin,
  onDispatch,
  onCapture,
  onMeasure,
  onAnnotate,
  onDismiss,
}: FloatingActionSystemProps) {
  if (!state?.visible || !state.selectedUnit) return null;

  const { screenX, screenY, selectedUnit } = state;

  // Position FABs in a radial pattern around selection point
  const actions = [
    {
      id: 'pin',
      icon: <Pin className="h-4 w-4" />,
      label: 'Drop Pin',
      onClick: () => onDropPin(selectedUnit, severity),
      hidden: readOnly,
    },
    {
      id: 'dispatch',
      icon: <Wrench className="h-4 w-4" />,
      label: 'Dispatch',
      onClick: () => onDispatch(selectedUnit),
      hidden: readOnly,
    },
    {
      id: 'capture',
      icon: <Camera className="h-4 w-4" />,
      label: 'Capture',
      onClick: () => onCapture(selectedUnit),
      hidden: readOnly,
    },
    {
      id: 'measure',
      icon: <Ruler className="h-4 w-4" />,
      label: 'Measure',
      onClick: onMeasure,
      hidden: false,
    },
    {
      id: 'annotate',
      icon: <StickyNote className="h-4 w-4" />,
      label: 'Annotate',
      onClick: () => onAnnotate(selectedUnit),
      hidden: readOnly,
    },
  ].filter(action => !action.hidden);

  const radius = 60;
  const startAngle = -Math.PI / 2;
  const angleStep = Math.PI / (actions.length - 1 || 1);

  return (
    <div className="pointer-events-auto fixed z-40">
      {/* Selection indicator */}
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-400 bg-teal-400/30"
        style={{ left: screenX, top: screenY }}
      />

      {/* Action buttons in radial layout */}
      {actions.map((action, index) => {
        const angle = startAngle + angleStep * index;
        const x = screenX + Math.cos(angle) * radius;
        const y = screenY + Math.sin(angle) * radius;

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-800/95 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:border-teal-400 hover:bg-slate-700"
            style={{ left: x, top: y }}
            title={action.label}
          >
            {action.icon}
          </button>
        );
      })}

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-700/80 text-white/60 hover:bg-slate-600 hover:text-white"
        style={{ left: screenX, top: screenY + radius + 30 }}
      >
        ×
      </button>
    </div>
  );
}
