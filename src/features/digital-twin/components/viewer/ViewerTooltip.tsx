import type { TwinUnit } from '../../types';

export type TooltipContent = 
  | { type: 'unit'; unit: TwinUnit }
  | { type: 'pin'; pinId: string; description: string }
  | { type: 'layer'; layerName: string; info: string };

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

export function ViewerTooltip({ state, showFinancials = false }: ViewerTooltipProps) {
  if (!state?.visible) return null;

  const { screenX, screenY, content } = state;

  const offsetX = 12;
  const offsetY = 12;

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: screenX + offsetX,
        top: screenY + offsetY,
        transform: 'translate(0, 0)',
      }}
    >
      <div className="rounded-xl border border-white/20 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-md">
        {content.type === 'unit' && (
          <div className="min-w-[180px]">
            <p className="text-sm font-semibold text-white">
              Unit {content.unit.unit_number}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Floor {content.unit.floor} • {content.unit.area_m2}m²
            </p>
            {content.unit.tenant_name && (
              <p className="mt-1 text-xs text-teal-400">
                {content.unit.tenant_name}
              </p>
            )}
            {showFinancials && content.unit.current_rent && (
              <p className="mt-1 text-xs text-white/80">
                {content.unit.current_rent.toLocaleString()}/mo
              </p>
            )}
            {content.unit.active_alerts.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-400">
                  {content.unit.active_alerts.length} alert{content.unit.active_alerts.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {content.type === 'pin' && (
          <div className="min-w-[160px]">
            <p className="text-sm font-semibold text-white">Pin</p>
            <p className="mt-1 text-xs text-white/60">{content.description}</p>
          </div>
        )}

        {content.type === 'layer' && (
          <div className="min-w-[160px]">
            <p className="text-sm font-semibold text-white">{content.layerName}</p>
            <p className="mt-1 text-xs text-white/60">{content.info}</p>
          </div>
        )}
      </div>
    </div>
  );
}
