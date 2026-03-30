import { getTwinUnitLayout } from '../layout';
import type { TwinLayer, TwinPin, TwinTab, TwinUnit, TwinView } from '../types';

const statusAccent: Record<TwinUnit['status'], string> = {
  occupied: '#0D7377',
  vacant: '#9CA3AF',
  warn: '#D97706',
  alert: '#DC2626',
};

const layerAccent: Record<TwinLayer, string> = {
  plomberie: '#0EA5E9',
  hvac: '#10B981',
  electricite: '#F59E0B',
  zones: '#9CA3AF',
  cameras: '#6366F1',
  parking: '#6B7280',
  communs: '#64748B',
  lockers: '#94A3B8',
  rooftop3d: '#0F766E',
  farming: '#16A34A',
  pool: '#06B6D4',
  maintenance: '#DC2626',
  electrical: '#F59E0B',
  internet: '#7C3AED',
};

const tabAccent: Record<TwinTab, string> = {
  mep: '#0D7377',
  unites: '#1D4ED8',
  parking: '#D97706',
  structure: '#475569',
};

export function BuildingSvgFallback({
  units,
  pins,
  isolatedFloor,
  selectedUnitId,
  hoveredUnitId,
  activeLayers,
  activeTab,
  activeView,
  xrayMode,
  explodedMode,
  onSelectUnit,
  onHoverUnit,
  onCreatePin,
  pinDropMode,
  readOnly,
}: {
  units: TwinUnit[];
  pins: TwinPin[];
  isolatedFloor: number | null;
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  activeLayers: Set<TwinLayer>;
  activeTab: TwinTab;
  activeView: TwinView;
  xrayMode: boolean;
  explodedMode: boolean;
  onSelectUnit: (unitId: string) => void;
  onHoverUnit: (unitId: string | null) => void;
  onCreatePin: (point: { x: number; y: number; z: number }, unitId: string) => void;
  pinDropMode: boolean;
  readOnly: boolean;
}) {
  const visibleUnits = isolatedFloor === null ? units : units.filter((unit) => unit.floor === isolatedFloor);
  const floors = Array.from(new Set(visibleUnits.map((unit) => unit.floor))).sort((a, b) => b - a);
  const lanes = ['plomberie', 'hvac', 'electricite'].filter((layer): layer is TwinLayer => activeLayers.has(layer));
  const svgHeight = Math.max(420, floors.length * (explodedMode ? 122 : 94) + 170);
  const floorGap = explodedMode ? 118 : 90;
  const plateWidth = activeView === 'inside' ? 560 : 500;
  const plateDepth = activeView === 'dessus' ? 54 : activeView === 'facade' ? 18 : 32;
  const skew = activeView === 'facade' ? 12 : activeView === 'cote' ? 22 : 34;
  const unitInsetX = 46;
  const unitInsetY = 18;
  const unitWidth = activeView === 'cote' ? 68 : 80;
  const unitHeight = activeView === 'inside' ? 34 : 30;

  if (visibleUnits.length === 0) {
    return (
      <div className="flex h-[460px] items-center justify-center rounded-[28px] border border-[var(--semantic-border)] bg-[linear-gradient(180deg,_#f7f9fb,_#edf2f4)]">
        <p className="text-sm text-[var(--semantic-text-subtle)]">Aucune unité à afficher pour ce filtre.</p>
      </div>
    );
  }

  const renderTabOverlay = (baseX: number, baseY: number, width: number, floorUnits: TwinUnit[]) => {
    if (activeTab === 'mep') {
      return lanes.map((layer, laneIndex) => (
        <path
          key={`${baseY}-${layer}`}
          d={`M ${baseX + 24} ${baseY + 24 + laneIndex * 11} C ${baseX + 180} ${baseY + 12 + laneIndex * 10}, ${baseX + 320} ${baseY + 42 + laneIndex * 12}, ${baseX + width - 20} ${baseY + 22 + laneIndex * 10}`}
          fill="none"
          stroke={layerAccent[layer]}
          strokeDasharray={layer === 'electricite' ? '5 5' : undefined}
          strokeLinecap="round"
          strokeOpacity={xrayMode ? 0.95 : 0.65}
          strokeWidth={2.5}
        />
      ));
    }

    if (activeTab === 'structure') {
      return [0.18, 0.42, 0.68, 0.86].map((ratio, index) => {
        const x = baseX + width * ratio;
        return (
          <line
            key={`${baseY}-core-${index}`}
            x1={x}
            y1={baseY + 8}
            x2={x}
            y2={baseY + plateDepth + 48}
            stroke={tabAccent.structure}
            strokeOpacity={xrayMode ? 0.7 : 0.26}
            strokeWidth={index === 1 ? 7 : 4}
          />
        );
      });
    }

    if (activeTab === 'parking') {
      return floorUnits.slice(0, 4).map((unit, index) => (
        <rect
          key={`${unit.id}-stall`}
          x={baseX + 34 + index * 92}
          y={baseY + 22}
          width="60"
          height="18"
          rx="5"
          fill="none"
          stroke={tabAccent.parking}
          strokeDasharray="6 4"
          strokeOpacity={0.55}
        />
      ));
    }

    return null;
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--semantic-border)] bg-[linear-gradient(180deg,_#0f1721,_#16232d_38%,_#edf3f5_38%,_#edf3f5_100%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Pilot IFC viewer</p>
          <h3 className="mt-1 text-base font-semibold">Section spatiale</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lanes.map((layer) => (
            <span
              key={layer}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-2.5 py-1 font-semibold text-white/90"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layerAccent[layer] }} />
              {layer}
            </span>
          ))}
          {lanes.length === 0 ? (
            <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-2.5 py-1 font-semibold text-white/70">
              Aucune couche réseau active
            </span>
          ) : null}
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto px-4 py-4">
        <svg viewBox={`0 0 940 ${svgHeight}`} className="w-full min-w-[760px]">
          <defs>
            <linearGradient id="plateTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={xrayMode ? '#ffffff' : '#f8fbfc'} stopOpacity={xrayMode ? 0.12 : 0.98} />
              <stop offset="100%" stopColor={xrayMode ? '#9ad3d6' : '#dfe8ec'} stopOpacity={xrayMode ? 0.28 : 0.98} />
            </linearGradient>
            <linearGradient id="plateSide" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#98a9b2" stopOpacity={xrayMode ? 0.18 : 0.52} />
              <stop offset="100%" stopColor="#40515d" stopOpacity={xrayMode ? 0.1 : 0.38} />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="940" height={svgHeight} fill="transparent" />

          {[120, 210, 300, 390, 480].map((lineY) => (
            <line key={lineY} x1="0" x2="940" y1={lineY} y2={lineY} stroke="rgba(255,255,255,0.06)" />
          ))}

          {floors.map((floor, floorIndex) => {
            const floorUnits = visibleUnits
              .filter((unit) => unit.floor === floor)
              .sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'fr-CA', { numeric: true, sensitivity: 'base' }));
            const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(floorUnits.length || 1))));
            const rows = Math.max(1, Math.ceil(floorUnits.length / columns));
            const baseX = activeView === 'cote' ? 220 : activeView === 'facade' ? 210 : 188;
            const topY = 70 + floorIndex * floorGap;
            const plateTop = `${baseX},${topY} ${baseX + plateWidth},${topY} ${baseX + plateWidth + skew},${topY + plateDepth} ${baseX + skew},${topY + plateDepth}`;
            const plateSide = `${baseX + plateWidth},${topY} ${baseX + plateWidth + skew},${topY + plateDepth} ${baseX + plateWidth + skew},${topY + plateDepth + 42} ${baseX + plateWidth},${topY + 42}`;
            const plateFront = `${baseX + skew},${topY + plateDepth} ${baseX + plateWidth + skew},${topY + plateDepth} ${baseX + plateWidth + skew},${topY + plateDepth + 42} ${baseX + skew},${topY + plateDepth + 42}`;
            const rowShiftX = activeView === 'facade' ? 0 : activeView === 'cote' ? 20 : 14;
            const rowShiftY = activeView === 'inside' ? 18 : 14;
            const pinEntries = pins.filter((pin) => pin.status !== 'resolved' && pin.status !== 'dismissed');

            return (
              <g key={`floor-${floor}`}>
                <ellipse cx={baseX + plateWidth / 2 + skew / 2} cy={topY + plateDepth + 52} rx="250" ry="24" fill="rgba(15,23,33,0.12)" />
                <polygon points={plateTop} fill="url(#plateTop)" stroke="rgba(255,255,255,0.45)" strokeOpacity={0.2} />
                <polygon points={plateSide} fill="url(#plateSide)" />
                <polygon points={plateFront} fill="rgba(85,108,122,0.18)" />

                {renderTabOverlay(baseX + 8, topY + 4, plateWidth, floorUnits)}

                <text x={baseX - 110} y={topY + 18} fontSize="12" fontWeight="700" fill="#F8FAFC">
                  {floor === 0 ? 'Rez-de-chaussée' : `Étage ${floor}`}
                </text>
                <text x={baseX - 110} y={topY + 36} fontSize="11" fill="rgba(248,250,252,0.72)">
                  {floorUnits.length} unité{floorUnits.length > 1 ? 's' : ''}
                </text>

                {floorUnits.map((unit, unitIndex) => {
                  const row = Math.floor(unitIndex / columns);
                  const column = unitIndex % columns;
                  const selected = selectedUnitId === unit.id;
                  const hovered = hoveredUnitId === unit.id;
                  const x = baseX + unitInsetX + column * (unitWidth + 16) + row * rowShiftX;
                  const y = topY + unitInsetY + row * rowShiftY;
                  const pinCount = pinEntries.filter((pin) => pin.unit_id === unit.id).length;

                  return (
                    <g
                      key={unit.id}
                      transform={`translate(${x}, ${y})`}
                      onMouseEnter={() => onHoverUnit(unit.id)}
                      onMouseLeave={() => onHoverUnit(null)}
                      onClick={() => {
                        if (pinDropMode && !readOnly) {
                          onCreatePin(getTwinUnitLayout(unit, units), unit.id);
                          return;
                        }
                        onSelectUnit(unit.id);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="0"
                        y="0"
                        width={unitWidth}
                        height={unitHeight}
                        rx="10"
                        fill={xrayMode ? 'rgba(255,255,255,0.1)' : '#FFFFFF'}
                        stroke={selected ? tabAccent[activeTab] : hovered ? statusAccent[unit.status] : 'rgba(19,26,34,0.16)'}
                        strokeWidth={selected ? 2.4 : 1.2}
                      />
                      <rect x="0" y="0" width={unitWidth} height="6" rx="10" fill={statusAccent[unit.status]} fillOpacity={0.9} />
                      <text x="10" y="18" fontSize="11" fontWeight="700" fill={xrayMode ? '#F8FAFC' : '#111827'}>
                        {unit.unit_number}
                      </text>
                      <text x="10" y="30" fontSize="8.5" fill={xrayMode ? 'rgba(248,250,252,0.68)' : '#6B7280'}>
                        {unit.unit_type}
                      </text>

                      {pinCount > 0 ? (
                        <>
                          <circle cx={unitWidth - 12} cy="15" r="10" fill={`${statusAccent[unit.status]}22`} />
                          <text x={unitWidth - 12} y="18" textAnchor="middle" fontSize="9" fontWeight="700" fill={statusAccent[unit.status]}>
                            {pinCount}
                          </text>
                        </>
                      ) : null}
                    </g>
                  );
                })}

                {activeView === 'inside' ? (
                  <rect
                    x={baseX + 26}
                    y={topY + 10}
                    width={Math.max(160, plateWidth - 54)}
                    height={Math.max(58, rows * 18 + 24)}
                    rx="18"
                    fill="rgba(255,255,255,0.04)"
                    stroke={tabAccent[activeTab]}
                    strokeOpacity={0.22}
                    strokeDasharray="6 4"
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-[var(--semantic-border)] bg-white px-5 py-3 text-xs text-[var(--semantic-text-subtle)]">
        {pinDropMode
          ? 'Mode pin actif: cliquez sur une unité pour créer un signalement contextualisé.'
          : 'Cliquez sur une unité pour afficher son contexte, son briefing d’intervention et les couches techniques associées.'}
      </div>
    </div>
  );
}
