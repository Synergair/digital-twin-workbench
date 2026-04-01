import { useMemo } from 'react';
import { useDigitalTwinStore } from '@/store/digitalTwinStore';
import { BuildingViewer3D } from '@/features/digital-twin/components/BuildingViewer3D';
import type { TwinData } from '@/features/digital-twin/twinData';

type Property = {
  id: string;
  name: string;
  modelUrl: string;
  address: { street: string; city: string };
  floors: number;
  unitsPerFloor: number;
};

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

interface BuildingViewProps {
  property: Property;
  units: Unit[];
  twinData: TwinData | null;
  isDark: boolean;
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
}

export function BuildingView({ property, units, twinData, isDark, selectedUnitId, onSelectUnit }: BuildingViewProps) {
  const store = useDigitalTwinStore();

  // Convert units to TwinUnit format for BuildingViewer3D
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

  const base = import.meta.env.BASE_URL ?? '/';
  const resolvedModelUrl = property.modelUrl.startsWith('http') || property.modelUrl.startsWith(base)
    ? property.modelUrl
    : `${base}${property.modelUrl.replace(/^\//, '')}`;

  return (
    <div className="h-full w-full">
      <BuildingViewer3D
        modelUrl={resolvedModelUrl}
        units={twinUnits}
        pins={[]}
        activeLayers={store.activeLayers}
        isolatedFloor={null}
        selectedUnitId={selectedUnitId}
        hoveredUnitId={store.hoveredUnitId}
        xrayMode={false}
        explodedMode={false}
        explodedFactor={0.5}
        activeView="iso"
        activeTab="mep"
        pinDropMode={false}
        readOnly={false}
        isDarkMode={isDark}
        onSelectUnit={(id) => { if (id) onSelectUnit(id); }}
        onHoverUnit={(id) => store.hoverUnit(id)}
        onCreatePin={() => {}}
      />
    </div>
  );
}
