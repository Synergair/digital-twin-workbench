import { useMemo } from 'react';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { BuildingViewer3D } from '@/features/digital-twin/components/BuildingViewer3D';
import type { ViewMode } from './EstateShell';
import type { TwinData } from '@/features/digital-twin/twinData';

type Property = { id: string; name: string; modelUrl: string; address: { street: string; city: string }; floors: number };
type Unit = {
  id: string;
  unit_number: string;
  floor: number;
  area_m2: number;
  status: string;
  current_rent: number | null;
  tenant_name: string | null;
  active_alerts: any[];
};

interface UnitViewProps {
  property: Property;
  unit: Unit;
  units: Unit[];
  twinData: TwinData | null;
  viewMode: ViewMode;
  isDark: boolean;
}

export function UnitView({ property, unit, units, twinData, viewMode, isDark }: UnitViewProps) {
  const store = useDigitalTwinStore();

  const twinUnits = useMemo(() =>
    units.map((u) => ({
      ...u,
      property_id: property.id,
      unit_type: 'residential',
      current_rent: u.current_rent ?? 0,
      has_digital_twin: true,
      last_capture_at: null,
      lease_expiry: null,
      active_alerts: u.active_alerts ?? [],
      status: u.status as 'occupied' | 'vacant' | 'alert' | 'warn',
    })),
    [units, property.id],
  );

  // Exterior / Model360: use BuildingViewer3D with different views
  if (viewMode === 'exterior' || viewMode === 'model360') {
    return (
      <div className="h-full w-full">
        <BuildingViewer3D
          modelUrl={property.modelUrl}
          units={twinUnits}
          pins={[]}
          activeLayers={store.activeLayers}
          isolatedFloor={viewMode === 'exterior' ? null : unit.floor}
          selectedUnitId={unit.id}
          hoveredUnitId={null}
          xrayMode={viewMode === 'model360'}
          explodedMode={false}
          explodedFactor={0.5}
          activeView={viewMode === 'exterior' ? 'facade' : 'iso'}
          activeTab="mep"
          pinDropMode={false}
          readOnly={false}
          isDarkMode={isDark}
          onSelectUnit={() => {}}
          onHoverUnit={() => {}}
          onCreatePin={() => {}}
        />
      </div>
    );
  }

  // Floorplan 3D: top-down view with floor plan image
  if (viewMode === 'floorplan3d') {
    const floorPlan = twinData?.floorPlans?.[Math.min(unit.floor, (twinData?.floorPlans?.length ?? 1) - 1)];
    return (
      <div className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        {floorPlan ? (
          <div className="relative max-h-full max-w-full p-8">
            <img
              src={`/documents/floorplans/${floorPlan.file}`}
              alt={floorPlan.label}
              className="max-h-[70vh] rounded-2xl object-contain shadow-2xl"
            />
            {/* Hotspot pins overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {['Kitchen', 'Living', 'Bedroom', 'Bath'].map((room, i) => {
                const positions = [
                  { left: '35%', top: '30%' },
                  { left: '55%', top: '45%' },
                  { left: '70%', top: '30%' },
                  { left: '40%', top: '65%' },
                ];
                const pos = positions[i];
                return (
                  <button
                    key={room}
                    type="button"
                    className="absolute flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-600 shadow-lg transition-transform hover:scale-125"
                    style={pos}
                    title={room}
                  >
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </button>
                );
              })}
            </div>
            <p className={`mt-3 text-center text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              {floorPlan.label} — {unit.unit_number}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>No floor plan available</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-white/30' : 'text-gray-300'}`}>Upload a floor plan to enable this view</p>
          </div>
        )}
      </div>
    );
  }

  // Tour: interior walkthrough view
  if (viewMode === 'tour') {
    return (
      <div className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <div className="relative h-full w-full">
          {/* Placeholder for interior — would use TwinUnitInteriorViewer */}
          <div className={`flex h-full items-center justify-center ${isDark ? 'bg-gradient-to-b from-slate-800 to-slate-900' : 'bg-gradient-to-b from-gray-200 to-gray-300'}`}>
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-400/20'}`}>
                <svg className="h-8 w-8 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Interior Tour — {unit.unit_number}
              </p>
              <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {unit.area_m2} m² | Floor {unit.floor}
              </p>
            </div>
          </div>

          {/* Navigation arrows (3DEstate-style) */}
          <div className="absolute bottom-1/3 left-1/2 flex -translate-x-1/2 gap-8">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110">
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>

          {/* Mini-map in bottom right (3DEstate-style) */}
          <div className={`absolute bottom-4 right-4 h-28 w-28 overflow-hidden rounded-xl border-2 shadow-lg ${
            isDark ? 'border-white/20' : 'border-gray-300'
          }`}>
            {twinData?.floorPlans?.[0] && (
              <img
                src={`/documents/floorplans/${twinData.floorPlans[0].file}`}
                alt="Mini map"
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-teal-500 shadow" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
