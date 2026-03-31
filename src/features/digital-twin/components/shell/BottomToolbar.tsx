import { useState } from 'react';
import {
  Box,
  Layers,
  Sun,
  Moon,
  ChevronUp,
  List,
  Pin,
  Home,
  ArrowUp,
  MoveHorizontal,
  Maximize2,
  Map,
  Tag,
} from 'lucide-react';
import type { TwinLayer, TwinSeverity, TwinTab, TwinView } from '../../types';

const layerGroups: { label: string; layers: { id: TwinLayer; label: string; color: string }[] }[] = [
  {
    label: 'MEP Systems',
    layers: [
      { id: 'plomberie', label: 'Plomberie', color: '#38bdf8' },
      { id: 'hvac', label: 'HVAC', color: '#22c55e' },
      { id: 'electricite', label: 'Électricité', color: '#f59e0b' },
      { id: 'water', label: 'Eau', color: '#38bdf8' },
      { id: 'gas', label: 'Gaz', color: '#f59e0b' },
      { id: 'drainage', label: 'Drainage', color: '#334155' },
      { id: 'sprinklers', label: 'Gicleurs', color: '#fb7185' },
    ],
  },
  {
    label: 'Structure',
    layers: [
      { id: 'structure', label: 'Structure', color: '#94a3b8' },
      { id: 'envelope', label: 'Enveloppe', color: '#f97316' },
      { id: 'roof', label: 'Toiture', color: '#0f766e' },
      { id: 'solar', label: 'Solaire', color: '#eab308' },
      { id: 'parking', label: 'Stationnement', color: '#0ea5e9' },
    ],
  },
  {
    label: 'Circulation',
    layers: [
      { id: 'elevators', label: 'Ascenseurs', color: '#a855f7' },
      { id: 'stairs', label: 'Escaliers', color: '#c084fc' },
      { id: 'access', label: 'Accès', color: '#14b8a6' },
      { id: 'communs', label: 'Communs', color: '#64748b' },
    ],
  },
  {
    label: 'Sécurité',
    layers: [
      { id: 'fire', label: 'Incendie', color: '#ef4444' },
      { id: 'security', label: 'Sécurité', color: '#6366f1' },
      { id: 'cameras', label: 'Caméras', color: '#c084fc' },
      { id: 'lighting', label: 'Éclairage', color: '#fde047' },
    ],
  },
  {
    label: 'Technologie',
    layers: [
      { id: 'it', label: 'Réseau IT', color: '#22c55e' },
      { id: 'sensors', label: 'Capteurs', color: '#22d3ee' },
      { id: 'internet', label: 'Internet', color: '#3b82f6' },
    ],
  },
  {
    label: 'Zones',
    layers: [
      { id: 'zones', label: 'Zones', color: '#f8fafc' },
      { id: 'maintenance', label: 'Maintenance', color: '#fb7185' },
      { id: 'lockers', label: 'Casiers', color: '#a78bfa' },
      { id: 'pool', label: 'Piscine', color: '#06b6d4' },
      { id: 'farming', label: 'Agriculture', color: '#84cc16' },
      { id: 'rooftop3d', label: 'Rooftop', color: '#78716c' },
    ],
  },
];

interface BottomToolbarProps {
  activeView: TwinView;
  activeTab: TwinTab;
  activeLayers: Set<TwinLayer>;
  isolatedFloor: number | null;
  floors: number[];
  xrayMode: boolean;
  explodedMode: boolean;
  pinDropMode: boolean;
  currentSeverity: TwinSeverity;
  readOnly: boolean;
  showUnitLabels?: boolean;
  onViewChange: (view: TwinView) => void;
  onTabChange: (tab: TwinTab) => void;
  onFloorChange: (floor: number | null) => void;
  onToggleLayer: (layer: TwinLayer) => void;
  onToggleXray: () => void;
  onToggleExploded: () => void;
  onTogglePinDrop: () => void;
  onToggleDrawer: () => void;
  onToggleSheet: () => void;
  onToggleUnitLabels?: () => void;
  onOpenMap?: () => void;
  onToggle2D?: () => void;
  onToggleInsideView?: () => void;
  show2D?: boolean;
}

const viewIcons: Record<TwinView, React.ReactNode> = {
  facade: <Home className="h-4 w-4" />,
  dessus: <ArrowUp className="h-4 w-4" />,
  cote: <MoveHorizontal className="h-4 w-4" />,
  iso: <Box className="h-4 w-4" />,
  inside: <Maximize2 className="h-4 w-4" />,
};

const viewLabels: Record<TwinView, string> = {
  facade: 'Front',
  dessus: 'Top',
  cote: 'Side',
  iso: 'Iso',
  inside: 'Inside',
};

export function BottomToolbar({
  activeView,
  activeLayers,
  isolatedFloor,
  floors,
  xrayMode,
  explodedMode,
  pinDropMode,
  readOnly,
  showUnitLabels = true,
  onViewChange,
  onFloorChange,
  onToggleLayer,
  onToggleXray,
  onToggleExploded,
  onTogglePinDrop,
  onToggleDrawer,
  onToggleSheet,
  onToggleUnitLabels,
  onOpenMap,
  onToggle2D,
  onToggleInsideView,
  show2D = false,
}: BottomToolbarProps) {
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const maxFloor = Math.max(...floors, 0);
  const floorValue = isolatedFloor ?? maxFloor;
  const floorPercent = maxFloor > 0 ? (floorValue / maxFloor) * 100 : 100;

  return (
    <div className="flex h-14 flex-shrink-0 items-center justify-between border-t border-white/10 bg-slate-900/95 px-4 backdrop-blur-sm">
      {/* Left: View Mode + Camera Presets */}
      <div className="flex items-center gap-1">
        {/* View Mode Toggle */}
        <div className="flex rounded-lg bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => { if (show2D && onToggle2D) onToggle2D(); }}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !show2D ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => onToggle2D?.()}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              show2D ? 'bg-teal-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            2D
          </button>
        </div>

        <span className="mx-2 h-4 w-px bg-white/20" />

        {/* Camera Presets */}
        <div className="flex gap-0.5">
          {(['facade', 'dessus', 'cote', 'iso', 'inside'] as TwinView[]).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                activeView === view
                  ? 'bg-teal-600 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              }`}
              title={viewLabels[view]}
            >
              {viewIcons[view]}
              <span className="hidden sm:inline">{viewLabels[view]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Floor Scrubber */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40">Floor</span>
        <div className="relative w-24 sm:w-32">
          <div className="h-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${floorPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={maxFloor}
            value={floorValue}
            onChange={(e) => {
              const val = Number(e.target.value);
              onFloorChange(val === maxFloor ? null : val);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <span className="w-8 text-xs text-white/60">
          {isolatedFloor === null ? 'All' : isolatedFloor === 0 ? 'G' : `F${isolatedFloor}`}
        </span>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-1">
        {/* X-Ray Toggle */}
        <button
          type="button"
          onClick={onToggleXray}
          className={`rounded-md p-2 transition-colors ${
            xrayMode
              ? 'bg-teal-600 text-white'
              : 'text-white/50 hover:bg-white/10 hover:text-white'
          }`}
          title="X-Ray Mode"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
          </svg>
        </button>

        {/* Exploded Toggle */}
        <button
          type="button"
          onClick={onToggleExploded}
          className={`rounded-md p-2 transition-colors ${
            explodedMode
              ? 'bg-teal-600 text-white'
              : 'text-white/50 hover:bg-white/10 hover:text-white'
          }`}
          title="Exploded View"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            <rect x="8" y="8" width="8" height="8" rx="1" />
          </svg>
        </button>

        {/* Layers Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className={`flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors ${
              layerMenuOpen
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden text-xs sm:inline">Layers</span>
          </button>

          {layerMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 max-h-[60vh] w-56 overflow-y-auto rounded-lg border border-white/10 bg-slate-800 p-2 shadow-xl">
              {layerGroups.map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">{group.label}</p>
                  {group.layers.map((layer) => {
                    const isActive = activeLayers.has(layer.id);
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => onToggleLayer(layer.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: isActive ? layer.color : 'transparent' }}
                        />
                        <span className="flex-1 text-xs">{layer.label}</span>
                        {isActive && <span className="text-[10px] text-teal-400">ON</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    layerGroups.flatMap((g) => g.layers).forEach((l) => {
                      if (!activeLayers.has(l.id)) onToggleLayer(l.id);
                    });
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs text-teal-400 hover:bg-white/5"
                >
                  Tout activer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    layerGroups.flatMap((g) => g.layers).forEach((l) => {
                      if (activeLayers.has(l.id)) onToggleLayer(l.id);
                    });
                  }}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs text-white/40 hover:bg-white/5"
                >
                  Tout désactiver
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="mx-1 h-4 w-px bg-white/20" />

        {/* Day/Night Toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="rounded-md p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title={isDarkMode ? 'Switch to Day' : 'Switch to Night'}
        >
          {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Unit Labels Toggle */}
        {onToggleUnitLabels && (
          <button
            type="button"
            onClick={onToggleUnitLabels}
            className={`rounded-md p-2 transition-colors ${
              showUnitLabels
                ? 'bg-teal-600 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            }`}
            title="Unit Labels"
          >
            <Tag className="h-4 w-4" />
          </button>
        )}

        {/* Map View */}
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="rounded-md p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title="Portfolio Map"
          >
            <Map className="h-4 w-4" />
          </button>
        )}

        {/* Pin Drop (if not read-only) */}
        {!readOnly && (
          <button
            type="button"
            onClick={onTogglePinDrop}
            className={`rounded-md p-2 transition-colors ${
              pinDropMode
                ? 'bg-rose-600 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            }`}
            title="Pin Drop Mode"
          >
            <Pin className="h-4 w-4" />
          </button>
        )}

        <span className="mx-1 h-4 w-px bg-white/20" />

        {/* Unit List Toggle */}
        <button
          type="button"
          onClick={onToggleDrawer}
          className="rounded-md p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="Unit List"
        >
          <List className="h-4 w-4" />
        </button>

        {/* More/Sheet Toggle */}
        <button
          type="button"
          onClick={onToggleSheet}
          className="rounded-md p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="More Options"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
