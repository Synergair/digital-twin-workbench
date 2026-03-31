import { useEffect, useRef, useState, useCallback } from 'react';
import { Pin, Wrench, Camera, MessageSquare, Ruler, MoreHorizontal, X } from 'lucide-react';
import type { TwinUnit, TwinSeverity } from '../../types';

export interface FloatingAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface FloatingActionState {
  visible: boolean;
  screenX: number;
  screenY: number;
  selectedUnit: TwinUnit | null;
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

const severityColors = {
  urgent: 'bg-rose-500 hover:bg-rose-600',
  standard: 'bg-sky-500 hover:bg-sky-600',
  planifie: 'bg-amber-500 hover:bg-amber-600',
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [expanded, setExpanded] = useState(false);

  // Calculate optimal position with viewport boundaries
  useEffect(() => {
    if (!state?.visible || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position FAB cluster to the right of selection point
    let left = state.screenX + 24;
    let top = state.screenY - rect.height / 2;

    // Flip horizontally if too close to right edge
    if (left + rect.width > viewportWidth - 20) {
      left = state.screenX - rect.width - 24;
    }

    // Clamp vertically
    top = Math.max(80, Math.min(top, viewportHeight - rect.height - 80));

    setPosition({ left, top });
  }, [state]);

  // Close expanded menu on outside click
  useEffect(() => {
    if (!expanded) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  const handleDropPin = useCallback(() => {
    if (state?.selectedUnit) {
      onDropPin(state.selectedUnit, severity);
    }
  }, [state?.selectedUnit, severity, onDropPin]);

  const handleDispatch = useCallback(() => {
    if (state?.selectedUnit) {
      onDispatch(state.selectedUnit);
    }
  }, [state?.selectedUnit, onDispatch]);

  const handleCapture = useCallback(() => {
    if (state?.selectedUnit) {
      onCapture(state.selectedUnit);
    }
  }, [state?.selectedUnit, onCapture]);

  const handleAnnotate = useCallback(() => {
    if (state?.selectedUnit) {
      onAnnotate(state.selectedUnit);
    }
  }, [state?.selectedUnit, onAnnotate]);

  if (!state?.visible || !state.selectedUnit) return null;

  const primaryActions: FloatingAction[] = [
    {
      id: 'pin',
      icon: <Pin className="h-4 w-4" />,
      label: 'Épingler',
      onClick: handleDropPin,
      variant: 'primary',
      disabled: readOnly,
    },
    {
      id: 'dispatch',
      icon: <Wrench className="h-4 w-4" />,
      label: 'Dispatch',
      onClick: handleDispatch,
    },
  ];

  const secondaryActions: FloatingAction[] = [
    {
      id: 'capture',
      icon: <Camera className="h-4 w-4" />,
      label: 'Capturer',
      onClick: handleCapture,
    },
    {
      id: 'annotate',
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Annoter',
      onClick: handleAnnotate,
      disabled: readOnly,
    },
    {
      id: 'measure',
      icon: <Ruler className="h-4 w-4" />,
      label: 'Mesurer',
      onClick: onMeasure,
    },
  ];

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute z-40"
      style={{
        left: position.left,
        top: position.top,
        opacity: state.visible ? 1 : 0,
        transform: state.visible ? 'scale(1)' : 'scale(0.9)',
        transition: 'opacity 150ms, transform 150ms',
      }}
    >
      {/* Unit label chip */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {state.selectedUnit.unit_number}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/90 text-white/60 backdrop-blur-sm transition-colors hover:bg-slate-700 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Primary action row */}
      <div className="flex gap-2">
        {primaryActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              action.id === 'pin'
                ? severityColors[severity] + ' text-white'
                : 'bg-slate-800/90 text-white backdrop-blur-sm hover:bg-slate-700'
            }`}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}

        {/* Expand/collapse button */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-all ${
            expanded
              ? 'bg-teal-500 text-white'
              : 'bg-slate-800/90 text-white backdrop-blur-sm hover:bg-slate-700'
          }`}
          title={expanded ? 'Moins' : 'Plus'}
        >
          <MoreHorizontal className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Secondary actions (expandable) */}
      {expanded && (
        <div className="mt-2 flex flex-col gap-1 rounded-xl bg-slate-800/95 p-2 shadow-xl backdrop-blur-sm">
          {secondaryActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                action.onClick();
                setExpanded(false);
              }}
              disabled={action.disabled}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-white/60">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Severity indicator line */}
      <div className="mt-2 flex justify-center">
        <div className={`h-0.5 w-8 rounded-full ${severityColors[severity].split(' ')[0]}`} />
      </div>
    </div>
  );
}

export default FloatingActionSystem;
