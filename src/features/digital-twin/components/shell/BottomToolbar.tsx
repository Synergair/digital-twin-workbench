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
  isolatedFloor,
  floors,
  xrayMode,
  explodedMode,
  pinDropMode,
  readOnly,
  showUnitLabels = true,
  onViewChange,
  onFloorChange,
  onToggleXray,
  onToggleExploded,
  onTogglePinDrop,
  onToggleDrawer,
  onToggleSheet,
  onToggleUnitLabels,
  onOpenMap,
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
            className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white"
          >
            3D
          </button>
          <button
            type="button"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/50 hover:text-white"
          >
            2D
          </button>
        </div>

        <span className="mx-2 h-4 w-px bg-white/20" />

        {/* Camera Presets */}
        <div className="flex gap-0.5">
          {(['facade', 'dessus', 'cote', 'iso'] as TwinView[]).map((view) => (
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
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-white/10 bg-slate-800 p-2 shadow-xl">
              <p className="mb-2 px-2 text-xs text-white/40">Quick Layers</p>
              {(['plomberie', 'hvac', 'electricite', 'structure'] as TwinLayer[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span className="capitalize">{layer}</span>
                </button>
              ))}
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
