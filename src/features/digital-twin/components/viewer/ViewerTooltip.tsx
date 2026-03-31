import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Building2, User, DollarSign } from 'lucide-react';
import type { TwinUnit, TwinPin, TwinLayer } from '../../types';

export type TooltipContent =
  | { type: 'unit'; unit: TwinUnit }
  | { type: 'pin'; pin: TwinPin }
  | { type: 'mep'; layer: TwinLayer; info: MEPInfo }
  | { type: 'custom'; title: string; content: React.ReactNode };

interface MEPInfo {
  systemName: string;
  materialType?: string;
  distanceToRiser?: number;
  specifications?: Record<string, string>;
}

export interface TooltipState {
  visible: boolean;
  screenX: number;
  screenY: number;
  content: TooltipContent;
}

interface ViewerTooltipProps {
  state: TooltipState | null;
  showFinancials?: boolean;
}

const statusColors: Record<TwinUnit['status'], string> = {
  occupied: 'bg-emerald-500',
  warn: 'bg-amber-500',
  alert: 'bg-rose-500',
  vacant: 'bg-slate-500',
};

export function ViewerTooltip({ state, showFinancials = false }: ViewerTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!state?.visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position with viewport boundary checks
    let left = state.screenX + 16;
    let top = state.screenY + 16;

    // Flip horizontally if too close to right edge
    if (left + rect.width > viewportWidth - 20) {
      left = state.screenX - rect.width - 16;
    }

    // Flip vertically if too close to bottom edge
    if (top + rect.height > viewportHeight - 20) {
      top = state.screenY - rect.height - 16;
    }

    // Ensure minimum margins
    left = Math.max(20, left);
    top = Math.max(20, top);

    setPosition({ left, top });
  }, [state]);

  if (!state?.visible) return null;

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-none absolute z-50 max-w-[280px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur-sm transition-all duration-150"
      style={{
        left: position.left,
        top: position.top,
        opacity: state.visible ? 1 : 0,
        transform: state.visible ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {state.content.type === 'unit' && (
        <UnitTooltipContent unit={state.content.unit} showFinancials={showFinancials} />
      )}
      {state.content.type === 'pin' && <PinTooltipContent pin={state.content.pin} />}
      {state.content.type === 'mep' && (
        <MEPTooltipContent layer={state.content.layer} info={state.content.info} />
      )}
      {state.content.type === 'custom' && (
        <div>
          <p className="text-sm font-medium text-white">{state.content.title}</p>
          <div className="mt-1 text-xs text-white/60">{state.content.content}</div>
        </div>
      )}
    </div>
  );
}

function UnitTooltipContent({
  unit,
  showFinancials,
}: {
  unit: TwinUnit;
  showFinancials: boolean;
}) {
  const alertCount = unit.active_alerts.length;
  const urgentCount = unit.active_alerts.filter((a) => a.severity === 'urgent').length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-semibold text-white">{unit.unit_number}</span>
        </div>
        <span
          className={`h-2 w-2 rounded-full ${statusColors[unit.status] || statusColors.occupied}`}
        />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-white/50">Floor</div>
        <div className="text-white">{unit.floor === 0 ? 'Ground' : `F${unit.floor}`}</div>

        <div className="text-white/50">Type</div>
        <div className="capitalize text-white">{unit.unit_type.replace('_', ' ')}</div>

        <div className="text-white/50">Area</div>
        <div className="text-white">{unit.area_m2.toFixed(0)} m²</div>

        {unit.tenant_name && (
          <>
            <div className="flex items-center gap-1 text-white/50">
              <User className="h-3 w-3" />
              Tenant
            </div>
            <div className="truncate text-white">{unit.tenant_name}</div>
          </>
        )}

        {showFinancials && unit.current_rent && (
          <>
            <div className="flex items-center gap-1 text-white/50">
              <DollarSign className="h-3 w-3" />
              Rent
            </div>
            <div className="text-white">${unit.current_rent.toLocaleString()}</div>
          </>
        )}
      </div>

      {/* Alerts */}
      {alertCount > 0 && (
        <div
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
            urgentCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {alertCount} alert{alertCount !== 1 ? 's' : ''}
            {urgentCount > 0 && ` (${urgentCount} urgent)`}
          </span>
        </div>
      )}
    </div>
  );
}

function PinTooltipContent({ pin }: { pin: TwinPin }) {
  const severityColors = {
    urgent: 'text-rose-400',
    standard: 'text-sky-400',
    planifie: 'text-amber-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-semibold ${severityColors[pin.severity]}`}>
          {pin.severity.charAt(0).toUpperCase() + pin.severity.slice(1)} Pin
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
          {pin.status}
        </span>
      </div>

      {pin.description && (
        <p className="text-xs text-white/70">{pin.description}</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {pin.wall_type && (
          <>
            <div className="text-white/50">Wall</div>
            <div className="text-white">{pin.wall_type}</div>
          </>
        )}

        {pin.mep_proximity && pin.mep_proximity.length > 0 && (
          <>
            <div className="text-white/50">Near MEP</div>
            <div className="text-white">{pin.mep_proximity.length} systems</div>
          </>
        )}

        {pin.tooling_rec && pin.tooling_rec.length > 0 && (
          <>
            <div className="text-white/50">Tools</div>
            <div className="truncate text-white">{pin.tooling_rec.join(', ')}</div>
          </>
        )}
      </div>
    </div>
  );
}

function MEPTooltipContent({ layer, info }: { layer: TwinLayer; info: MEPInfo }) {
  const layerColors: Record<string, string> = {
    plomberie: 'text-sky-400',
    hvac: 'text-emerald-400',
    electricite: 'text-amber-400',
    fire: 'text-rose-400',
    security: 'text-indigo-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            layerColors[layer] ? layerColors[layer].replace('text-', 'bg-') : 'bg-white/50'
          }`}
        />
        <span className={`text-sm font-semibold ${layerColors[layer] || 'text-white'}`}>
          {info.systemName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {info.materialType && (
          <>
            <div className="text-white/50">Material</div>
            <div className="text-white">{info.materialType}</div>
          </>
        )}

        {info.distanceToRiser !== undefined && (
          <>
            <div className="text-white/50">To Riser</div>
            <div className="text-white">{info.distanceToRiser.toFixed(1)}m</div>
          </>
        )}

        {info.specifications &&
          Object.entries(info.specifications).map(([key, value]) => (
            <div key={key} className="contents">
              <div className="text-white/50">{key}</div>
              <div className="text-white">{value}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default ViewerTooltip;
