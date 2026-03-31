import { useState } from 'react';
import { X, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import type { TwinPin, TwinUnit } from '../../types';

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  units: TwinUnit[];
  selectedUnit: TwinUnit | null;
  selectedPins: TwinPin[];
  onSelectUnit: (unitId: string) => void;
  onSetFloor: (floor: number | null) => void;
}

type SortBy = 'unit' | 'floor' | 'area' | 'status';

export function RightDrawer({
  open,
  onClose,
  units,
  selectedUnit,
  selectedPins,
  onSelectUnit,
  onSetFloor,
}: RightDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('unit');
  const [filterFloor, setFilterFloor] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Get unique floors
  const floors = Array.from(new Set(units.map((u) => u.floor))).sort((a, b) => a - b);

  // Filter and sort units
  const filteredUnits = units
    .filter((unit) => {
      if (searchQuery && !unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterFloor !== null && unit.floor !== filterFloor) {
        return false;
      }
      if (filterStatus && unit.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'floor':
          return a.floor - b.floor;
        case 'area':
          return b.area_m2 - a.area_m2;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return a.unit_number.localeCompare(b.unit_number);
      }
    });

  return (
    <div
      className={`absolute right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Units</h2>
          <p className="text-xs text-white/50">{filteredUnits.length} of {units.length}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 border-b border-white/10 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search units..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Filter Row */}
        <div className="flex gap-2">
          {/* Floor Filter */}
          <div className="relative flex-1">
            <select
              value={filterFloor ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setFilterFloor(val === '' ? null : Number(val));
              }}
              className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-1.5 pl-3 pr-8 text-xs text-white outline-none focus:border-teal-500/50"
            >
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor === 0 ? 'Ground' : `Floor ${floor}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1">
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-1.5 pl-3 pr-8 text-xs text-white outline-none focus:border-teal-500/50"
            >
              <option value="">All Status</option>
              <option value="ok">OK</option>
              <option value="warn">Warning</option>
              <option value="alert">Alert</option>
              <option value="vacant">Vacant</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40">Sort:</span>
          {(['unit', 'floor', 'area'] as SortBy[]).map((sort) => (
            <button
              key={sort}
              type="button"
              onClick={() => setSortBy(sort)}
              className={`rounded px-2 py-0.5 capitalize transition-colors ${
                sortBy === sort
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {/* Unit List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredUnits.map((unit) => {
          const isSelected = selectedUnit?.id === unit.id;
          const hasAlerts = unit.active_alerts.length > 0;
          const urgentAlerts = unit.active_alerts.filter((a) => a.severity === 'urgent').length;

          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => {
                onSelectUnit(unit.id);
                onSetFloor(unit.floor);
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                isSelected
                  ? 'bg-teal-600/20 ring-1 ring-teal-500/50'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Status Indicator */}
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  unit.status === 'alert'
                    ? 'bg-rose-500'
                    : unit.status === 'warn'
                    ? 'bg-amber-500'
                    : unit.status === 'vacant'
                    ? 'bg-slate-500'
                    : 'bg-emerald-500'
                }`}
              />

              {/* Unit Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {unit.unit_number}
                  </span>
                  <span className="text-xs text-white/40">
                    F{unit.floor}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span>{unit.area_m2.toFixed(0)} m²</span>
                  <span>•</span>
                  <span className="capitalize">{unit.unit_type}</span>
                </div>
              </div>

              {/* Alert Badge */}
              {hasAlerts && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    urgentAlerts > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {unit.active_alerts.length}
                </span>
              )}
            </button>
          );
        })}

        {filteredUnits.length === 0 && (
          <div className="py-8 text-center text-sm text-white/40">
            No units match your filters
          </div>
        )}
      </div>

      {/* Selected Unit Context */}
      {selectedUnit && (
        <div className="border-t border-white/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
              Selected
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                selectedUnit.status === 'alert'
                  ? 'bg-rose-500/20 text-rose-400'
                  : selectedUnit.status === 'warn'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {selectedUnit.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{selectedUnit.unit_number}</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/40">Tenant</span>
              <p className="text-white">{selectedUnit.tenant_name ?? 'Vacant'}</p>
            </div>
            <div>
              <span className="text-white/40">Rent</span>
              <p className="text-white">
                {selectedUnit.current_rent
                  ? `$${selectedUnit.current_rent.toLocaleString()}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-white/40">Area</span>
              <p className="text-white">{selectedUnit.area_m2.toFixed(0)} m²</p>
            </div>
            <div>
              <span className="text-white/40">Pins</span>
              <p className="text-white">{selectedPins.length} active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
