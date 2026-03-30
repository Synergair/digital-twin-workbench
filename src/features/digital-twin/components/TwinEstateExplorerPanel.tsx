import { useMemo, useState } from 'react';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import type { TwinUnit, TwinView } from '../types';

const toRooms = (unit: TwinUnit) => {
  if (unit.unit_type === 'studio_plus') return 1;
  if (unit.unit_type === 'family') return 3;
  if (unit.unit_type === 'premium') return 4;
  if (unit.unit_type === 'commercial') return 0;
  return 2;
};

const statusTone = (status: TwinUnit['status']) => {
  if (status === 'alert') return 'danger';
  if (status === 'warn') return 'warning';
  if (status === 'vacant') return 'neutral';
  return 'success';
};

export function TwinEstateExplorerPanel({
  propertyName,
  units,
  selectedUnitId,
  onSelectUnit,
  onSetFloor,
  onSetView,
}: {
  propertyName: string;
  units: TwinUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
  onSetFloor: (floor: number | null) => void;
  onSetView: (view: TwinView) => void;
}) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [nightMode, setNightMode] = useState(false);
  const [areaMax, setAreaMax] = useState(140);
  const [floorMax, setFloorMax] = useState(20);
  const [roomsMax, setRoomsMax] = useState(4);

  const metrics = useMemo(() => {
    const floors = units.map((unit) => unit.floor);
    const areas = units.map((unit) => unit.area_m2);
    return {
      floorMax: floors.length ? Math.max(...floors) : 0,
      areaMax: areas.length ? Math.ceil(Math.max(...areas)) : 0,
    };
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      if (unit.area_m2 > areaMax) return false;
      if (unit.floor > floorMax) return false;
      if (toRooms(unit) > roomsMax) return false;
      return true;
    });
  }, [units, areaMax, floorMax, roomsMax]);

  const buildingTags = [
    { id: 'bldg-1', name: propertyName, count: units.length },
    { id: 'bldg-2', name: 'Annexe 29', count: Math.max(6, Math.floor(units.length * 0.42)) },
    { id: 'bldg-3', name: 'Bloc Riverside', count: Math.max(4, Math.floor(units.length * 0.28)) },
  ];

  return (
    <V2Surface title="Estate Explorer" subtitle="Selection batiment, plan 3D et filtrage unites (style 3dtwin).">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <div className="space-y-3">
          <div
            className="relative overflow-hidden rounded-3xl border border-[var(--semantic-border)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.9),_rgba(15,23,42,0.08))] p-4"
            style={{
              background: nightMode
                ? 'linear-gradient(135deg, rgba(14,18,24,0.92), rgba(35,61,70,0.88))'
                : 'linear-gradient(135deg, rgba(248,252,252,0.95), rgba(173,214,228,0.55))',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {buildingTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onSetFloor(null)}
                    className="rounded-full border border-white/60 bg-white/85 px-3 py-1 text-xs font-semibold text-[var(--semantic-text)] shadow-sm"
                  >
                    {tag.name} ({tag.count})
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Button type="button" size="sm" variant="secondary" onClick={() => onSetView('iso')}>
                  Mode 360
                </Button>
                <Button type="button" size="sm" variant={nightMode ? 'primary' : 'secondary'} onClick={() => setNightMode(!nightMode)}>
                  {nightMode ? 'Nuit' : 'Jour'}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.4fr)]">
              <div className="relative h-[280px] rounded-2xl border border-white/50 bg-white/70">
                <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,_rgba(255,255,255,0.75),_rgba(16,24,32,0.05))]" />
                <div className="absolute left-6 top-8 flex flex-col gap-3">
                  <div className="h-16 w-24 rounded-xl bg-[rgba(19,137,134,0.28)] shadow-sm" />
                  <div className="h-14 w-20 rounded-xl bg-[rgba(45,146,196,0.28)] shadow-sm" />
                  <div className="h-12 w-16 rounded-xl bg-[rgba(224,82,63,0.28)] shadow-sm" />
                </div>
                <div className="absolute bottom-6 right-6 rounded-2xl bg-white/85 px-3 py-2 text-xs text-[var(--semantic-text)] shadow-sm">
                  <p className="font-semibold">{propertyName}</p>
                  <p className="text-[var(--semantic-text-subtle)]">{units.length} units</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/70 p-3 text-xs text-[var(--semantic-text-subtle)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">Walk around</p>
                <div className="mt-2 h-32 rounded-xl border border-white/70 bg-[linear-gradient(180deg,_rgba(12,22,30,0.06),_rgba(255,255,255,0.9))]" />
                <div className="mt-3 flex items-center justify-between">
                  <span>Street view ready</span>
                  <Button type="button" size="sm" variant="secondary">
                    Ouvrir
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
              <Badge variant="outline">Buildings</Badge>
              <Badge variant="outline">Units</Badge>
              <Badge variant="outline">360</Badge>
              <Badge variant="outline">AR/VR ready</Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Unit preview</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => onSetView('inside')}>
                Ouvrir interieur
              </Button>
            </div>
            <div className="mt-3 h-40 rounded-2xl border border-[var(--semantic-border)] bg-[url('/documents/floorplans/residential_floorplan_1.jpg')] bg-cover bg-center" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--semantic-text)]">{propertyName}</p>
                <p className="text-xs text-[var(--semantic-text-subtle)]">{filteredUnits.length} units</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary">
                  Filters
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === 'cards' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                >
                  {viewMode === 'table' ? 'Cards' : 'Table'}
                </Button>
              </div>
            </div>

            <div className="mt-3 space-y-3 text-xs text-[var(--semantic-text-subtle)]">
              <div>
                <div className="flex items-center justify-between">
                  <span>Area</span>
                  <span>1 - {areaMax} m2</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={Math.max(metrics.areaMax, 60)}
                  value={areaMax}
                  onChange={(event) => setAreaMax(Number(event.target.value))}
                  className="w-full accent-[var(--semantic-primary)]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span>Floor</span>
                  <span>0 - {floorMax}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(metrics.floorMax, 6)}
                  value={floorMax}
                  onChange={(event) => setFloorMax(Number(event.target.value))}
                  className="w-full accent-[var(--semantic-primary)]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span>Rooms</span>
                  <span>1 - {roomsMax}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={roomsMax}
                  onChange={(event) => setRoomsMax(Number(event.target.value))}
                  className="w-full accent-[var(--semantic-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-white/90 p-3 text-sm">
            {viewMode === 'table' ? (
              <div className="space-y-2">
                {filteredUnits.slice(0, 8).map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => {
                      onSelectUnit(unit.id);
                      onSetFloor(unit.floor);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                      unit.id === selectedUnitId
                        ? 'border-[var(--semantic-primary)] bg-[var(--semantic-primary-soft)]'
                        : 'border-[var(--semantic-border)] bg-white hover:border-[var(--semantic-primary)]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[var(--semantic-text)]">{unit.unit_number}</p>
                      <p className="text-[var(--semantic-text-subtle)]">{unit.area_m2} m2</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <V2StatusPill label={`Floor ${unit.floor}`} variant="info" />
                      <V2StatusPill label={`${toRooms(unit)} rooms`} variant="neutral" />
                      <V2StatusPill label={unit.status} variant={statusTone(unit.status)} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredUnits.slice(0, 6).map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => {
                      onSelectUnit(unit.id);
                      onSetFloor(unit.floor);
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs transition ${
                      unit.id === selectedUnitId
                        ? 'border-[var(--semantic-primary)] bg-[var(--semantic-primary-soft)]'
                        : 'border-[var(--semantic-border)] bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--semantic-text)]">{unit.unit_number}</p>
                    <p className="text-[var(--semantic-text-subtle)]">{unit.area_m2} m2</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">Floor {unit.floor}</Badge>
                      <Badge variant="outline">{toRooms(unit)} rooms</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </V2Surface>
  );
}
