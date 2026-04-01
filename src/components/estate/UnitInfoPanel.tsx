import { ChevronLeft, Heart, MapPin } from 'lucide-react';
import type { TwinData } from '@/features/digital-twin/twinData';

type Property = { id: string; name: string; address: { street: string; city: string } };
type Unit = {
  id: string;
  unit_number: string;
  floor: number;
  area_m2: number;
  status: string;
  current_rent: number | null;
  bedrooms?: number;
  sqft?: number;
};

interface UnitInfoPanelProps {
  property: Property;
  unit: Unit;
  units: Unit[];
  twinData: TwinData | null;
  isDark: boolean;
  onBack: () => void;
  onSelectUnit: (id: string) => void;
}

export function UnitInfoPanel({ property, unit, units, twinData, isDark, onBack, onSelectUnit }: UnitInfoPanelProps) {
  const cls = isDark
    ? { text: 'text-white', muted: 'text-white/40', border: 'border-white/10', card: 'bg-white/5', hover: 'hover:bg-white/10' }
    : { text: 'text-gray-800', muted: 'text-gray-400', border: 'border-gray-200', card: 'bg-gray-50', hover: 'hover:bg-gray-100' };

  const bedrooms = unit.bedrooms ?? Math.max(1, Math.floor(unit.area_m2 / 30));
  const floorPlan = twinData?.floorPlans?.[Math.min(unit.floor, (twinData?.floorPlans?.length ?? 1) - 1)];

  // Similar units on same floor
  const similarUnits = units
    .filter((u) => u.id !== unit.id && Math.abs(u.area_m2 - unit.area_m2) < 20)
    .slice(0, 4);

  return (
    <div className="flex flex-col p-4">
      {/* Back breadcrumb */}
      <button
        type="button"
        onClick={onBack}
        className={`mb-3 flex items-center gap-1 rounded-full self-start px-3 py-1 text-xs font-medium transition-colors ${
          isDark ? 'bg-teal-600/20 text-teal-400 hover:bg-teal-600/30' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
        }`}
      >
        <ChevronLeft className="h-3 w-3" />
        {property.name || property.address.street}
      </button>

      {/* Unit header */}
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-bold ${cls.text}`}>
            Investment apartment {unit.unit_number}
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            unit.status === 'available'
              ? 'bg-teal-500/20 text-teal-400'
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {unit.status === 'available' ? 'Available' : 'Occupied'}
          </span>
        </div>
        <button className={`rounded-full p-2 ${cls.hover}`}>
          <Heart className={`h-4 w-4 ${cls.muted}`} />
        </button>
      </div>

      {/* Stats row (like 3DEstate) */}
      <div className={`mt-4 grid grid-cols-4 gap-2 rounded-xl border p-3 ${cls.border} ${cls.card}`}>
        <div className="text-center">
          <p className={`text-[10px] ${cls.muted}`}>Area</p>
          <p className={`text-sm font-bold ${cls.text}`}>{unit.area_m2.toFixed(0)} m²</p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] ${cls.muted}`}>Rooms</p>
          <p className={`text-sm font-bold ${cls.text}`}>{bedrooms}</p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] ${cls.muted}`}>Floor</p>
          <p className={`text-sm font-bold ${cls.text}`}>{unit.floor}</p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] ${cls.muted}`}>Building</p>
          <p className={`text-sm font-bold ${cls.text}`}>{(property.name || 'A')[0]}</p>
        </div>
      </div>

      {/* Interactive floor plan thumbnail (like 3DEstate) */}
      {floorPlan && (
        <div className={`mt-4 overflow-hidden rounded-xl border ${cls.border}`}>
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}documents/floorplans/${floorPlan.file}`}
              alt={floorPlan.label}
              className="w-full object-contain"
              style={{ maxHeight: '200px' }}
            />
            {/* Hotspot pins on floor plan */}
            {['Kitchen', 'Living', 'Bedroom', 'Bath'].map((room, i) => {
              const positions = [
                { left: '30%', top: '25%' },
                { left: '55%', top: '40%' },
                { left: '72%', top: '25%' },
                { left: '35%', top: '60%' },
              ];
              return (
                <button
                  key={room}
                  className="absolute flex h-5 w-5 items-center justify-center rounded-full border border-white bg-teal-600/80 shadow transition-transform hover:scale-125"
                  style={positions[i]}
                  title={room}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rent / Price */}
      {unit.current_rent && (
        <div className={`mt-4 rounded-xl border p-3 ${cls.border} ${cls.card}`}>
          <p className={`text-[10px] ${cls.muted}`}>Monthly Rent</p>
          <p className={`text-lg font-bold ${cls.text}`}>
            ${unit.current_rent.toLocaleString('fr-CA')}<span className={`text-xs font-normal ${cls.muted}`}>/mo</span>
          </p>
        </div>
      )}

      {/* Similar properties (like 3DEstate) */}
      {similarUnits.length > 0 && (
        <div className="mt-4">
          <p className={`mb-2 text-xs font-semibold ${cls.text}`}>Similar properties</p>
          <div className="space-y-2">
            {similarUnits.map((su) => (
              <button
                key={su.id}
                type="button"
                onClick={() => onSelectUnit(su.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${cls.border} ${cls.hover}`}
              >
                <div className={`flex h-12 w-16 items-center justify-center rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <MapPin className={`h-4 w-4 ${cls.muted}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${cls.text}`}>{su.unit_number}</p>
                  <p className={`text-[10px] ${cls.muted}`}>
                    {su.area_m2.toFixed(0)} m² | floor {su.floor} | rooms {Math.max(1, Math.floor(su.area_m2 / 30))}
                  </p>
                </div>
                <span className={`h-2 w-2 rounded-full ${su.status === 'available' ? 'bg-teal-400' : 'bg-slate-400'}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
