import { useMemo } from 'react';
import { Building2, CheckCircle, AlertTriangle, Camera, Loader2, Plus } from 'lucide-react';
import { getTwinData } from '@/features/digital-twin/twinData';

type Property = {
  id: string;
  name: string;
  address: { street: string; city: string };
  floors: number;
  unitsPerFloor: number;
};

interface PortfolioViewProps {
  properties: Property[];
  viewMode: 'map' | 'grid';
  isDark: boolean;
  onSelectProperty: (id: string) => void;
}

function getPropertyStatus(propertyId: string) {
  const hash = propertyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = ['has-twin', 'needs-capture', 'has-alerts', 'processing'] as const;
  return statuses[hash % statuses.length];
}

const statusConfig = {
  'has-twin': { label: 'Active Twin', color: 'bg-emerald-500', icon: CheckCircle, textColor: 'text-emerald-400' },
  'needs-capture': { label: 'Needs Capture', color: 'bg-amber-500', icon: Camera, textColor: 'text-amber-400' },
  'has-alerts': { label: 'Has Alerts', color: 'bg-red-500', icon: AlertTriangle, textColor: 'text-red-400' },
  processing: { label: 'Processing', color: 'bg-indigo-500', icon: Loader2, textColor: 'text-indigo-400' },
};

export function PortfolioView({ properties, viewMode, isDark, onSelectProperty }: PortfolioViewProps) {
  if (viewMode === 'map') {
    return <PortfolioMapView properties={properties} isDark={isDark} onSelectProperty={onSelectProperty} />;
  }
  return <PortfolioGridView properties={properties} isDark={isDark} onSelectProperty={onSelectProperty} />;
}

// ── Map View ─────────────────────────────────────────
function PortfolioMapView({ properties, isDark, onSelectProperty }: Omit<PortfolioViewProps, 'viewMode'>) {
  return (
    <div className="relative h-full w-full">
      {/* Google Maps placeholder - uses existing PortfolioMapView pattern */}
      <div className={`h-full w-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
        {/* Aerial 3D view placeholder */}
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10' : 'bg-gray-300'}`}>
              <Building2 className={`h-10 w-10 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Portfolio Map
            </p>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              {properties.length} buildings in your portfolio
            </p>
          </div>
        </div>

        {/* Property pins overlay */}
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-8">
          {properties.slice(0, 8).map((property, index) => {
            const status = getPropertyStatus(property.id);
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            // Position pins in a grid-like pattern
            const row = Math.floor(index / 4);
            const col = index % 4;
            const left = 15 + col * 22;
            const top = 30 + row * 25;

            return (
              <button
                key={property.id}
                type="button"
                onClick={() => onSelectProperty(property.id)}
                className="group absolute flex flex-col items-center gap-1 transition-transform hover:scale-110"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg ${
                  isDark ? 'border-white/30 bg-slate-800' : 'border-gray-300 bg-white'
                }`}>
                  <div className={`h-3 w-3 rounded-full ${cfg.color}`} />
                </div>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium shadow-md ${
                  isDark ? 'bg-slate-800 text-white/80' : 'bg-white text-gray-700'
                }`}>
                  {property.name || property.address.street}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Grid View (like 3DEstate's grid) ─────────────────
function PortfolioGridView({ properties, isDark, onSelectProperty }: Omit<PortfolioViewProps, 'viewMode'>) {
  const totalUnits = properties.reduce((sum, p) => sum + p.floors * p.unitsPerFloor, 0);
  const alertCount = properties.filter((p) => getPropertyStatus(p.id) === 'has-alerts').length;

  return (
    <div className={`h-full overflow-y-auto p-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Stats header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-lg font-bold">Portfolio</h1>
        <span className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          {properties.length} Properties
        </span>
        <span className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          {totalUnits} Units
        </span>
        {alertCount > 0 && (
          <span className="text-sm text-red-400">{alertCount * 5} Alerts</span>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => {
          const status = getPropertyStatus(property.id);
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const totalUnits = property.floors * property.unitsPerFloor;

          return (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelectProperty(property.id)}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all hover:scale-[1.02] hover:shadow-xl ${
                status === 'has-alerts'
                  ? isDark ? 'border-red-500/30' : 'border-red-200'
                  : isDark ? 'border-white/10' : 'border-gray-200'
              } ${isDark ? 'bg-slate-800/80' : 'bg-white'}`}
            >
              {/* Thumbnail placeholder */}
              <div className={`flex h-36 items-center justify-center ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <Building2 className={`h-12 w-12 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
              </div>

              {/* Status badge */}
              <div className="absolute right-3 top-3">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${cfg.color}/80 backdrop-blur-sm`}>
                  <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
                  {cfg.label}
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {property.address.street}, {property.address.city}
                </p>
                <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  {property.floors} floors &nbsp; {totalUnits} units
                </p>
                {status === 'has-alerts' && (
                  <p className="mt-1 text-xs text-red-400">
                    {Math.ceil(totalUnits * 0.15)} active alerts
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* Add Building card */}
        <button
          type="button"
          className={`flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
            isDark ? 'border-white/10 hover:border-teal-500/30' : 'border-gray-200 hover:border-teal-400'
          }`}
        >
          <Plus className={`h-8 w-8 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
          <span className={`mt-2 text-sm ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Add Building</span>
        </button>
      </div>
    </div>
  );
}
