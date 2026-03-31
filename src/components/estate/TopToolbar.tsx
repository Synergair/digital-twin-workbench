import { ArrowLeft, Building2, Compass, Download, Layers, Maximize2, MapPin, Grid3X3 } from 'lucide-react';
import type { EstateLevel, ViewMode, PortfolioViewMode } from './EstateShell';

type Property = { id: string; name: string; address: { street: string; city: string } };
type Unit = { id: string; unit_number: string };

interface TopToolbarProps {
  level: EstateLevel;
  viewMode: ViewMode;
  property: Property | null;
  unit: Unit | null;
  properties: Property[];
  selectedPropertyId: string | null;
  portfolioViewMode: PortfolioViewMode;
  isDark: boolean;
  embed: boolean;
  onBack: () => void;
  onSelectProperty: (id: string) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSetPortfolioViewMode: (mode: PortfolioViewMode) => void;
}

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'exterior', label: 'Exterior' },
  { id: 'model360', label: 'Model 360' },
  { id: 'floorplan3d', label: 'Floorplan 3D' },
  { id: 'tour', label: 'Tour' },
];

export function TopToolbar({
  level,
  viewMode,
  property,
  unit,
  properties,
  selectedPropertyId,
  portfolioViewMode,
  isDark,
  embed,
  onBack,
  onSelectProperty,
  onSetViewMode,
  onSetPortfolioViewMode,
}: TopToolbarProps) {
  const bg = isDark
    ? 'bg-slate-900/95 border-white/10 text-white'
    : 'bg-white/95 border-gray-200 text-slate-900';
  const pill = (active: boolean) =>
    active
      ? 'bg-teal-600 text-white shadow-md'
      : isDark
        ? 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700';

  return (
    <div className={`z-30 flex h-12 flex-shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md ${bg}`}>
      {/* Back button */}
      {(level !== 'portfolio' || embed) && (
        <button
          type="button"
          onClick={onBack}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      {/* Portfolio level: view mode toggle */}
      {level === 'portfolio' && (
        <>
          <span className="text-sm font-semibold">Portfolio</span>
          <div className="ml-3 flex rounded-lg bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => onSetPortfolioViewMode('map')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${pill(portfolioViewMode === 'map')}`}
            >
              <MapPin className="h-3.5 w-3.5" /> Map
            </button>
            <button
              type="button"
              onClick={() => onSetPortfolioViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${pill(portfolioViewMode === 'grid')}`}
            >
              <Grid3X3 className="h-3.5 w-3.5" /> Grid
            </button>
          </div>
        </>
      )}

      {/* Building level: building tabs */}
      {level === 'building' && (
        <>
          <Building2 className="h-4 w-4 text-teal-400" />
          <div className="flex items-center gap-1 overflow-x-auto">
            {properties.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProperty(p.id)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  p.id === selectedPropertyId ? pill(true) : pill(false)
                }`}
              >
                {p.name || p.address.street}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Unit level: building name + unit badge + view mode pills */}
      {level === 'unit' && (
        <>
          {property && (
            <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
              {property.name || property.address.street}
            </span>
          )}
          {unit && (
            <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white">
              {unit.unit_number}
            </span>
          )}
          <span className={`mx-1 h-4 w-px ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />

          {/* View mode pills */}
          <div className="flex items-center gap-1">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSetViewMode(mode.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${pill(viewMode === mode.id)}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-1">
        {level !== 'portfolio' && (
          <>
            <button type="button" className={`rounded-full p-2 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} title="Layers">
              <Layers className="h-4 w-4" />
            </button>
            <button type="button" className={`rounded-full p-2 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} title="Download">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" className={`rounded-full p-2 transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </button>
          </>
        )}
        <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${
          isDark ? 'border-white/20 text-white/60' : 'border-gray-300 text-gray-400'
        }`}>
          N
        </div>
      </div>
    </div>
  );
}
