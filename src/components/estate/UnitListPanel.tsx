import { useState, useMemo } from 'react';
import { Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';
import type { TwinData } from '@/features/digital-twin/twinData';

type Property = { id: string; name: string; address: { street: string; city: string }; floors: number };
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

interface UnitListPanelProps {
  property: Property;
  units: Unit[];
  twinData: TwinData | null;
  isDark: boolean;
  selectedUnitId: string | null;
  onSelectUnit: (id: string) => void;
}

type SortField = 'unit_number' | 'area_m2' | 'floor' | 'status';

export function UnitListPanel({ property, units, twinData, isDark, selectedUnitId, onSelectUnit }: UnitListPanelProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [floorFilter, setFloorFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('unit_number');
  const [sortAsc, setSortAsc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const floors = useMemo(() => Array.from(new Set(units.map((u) => u.floor))).sort((a, b) => a - b), [units]);

  const filtered = useMemo(() => {
    let result = [...units];
    if (statusFilter !== 'All') result = result.filter((u) => u.status === statusFilter);
    if (floorFilter !== 'All') result = result.filter((u) => u.floor === Number(floorFilter));
    result.sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [units, statusFilter, floorFilter, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const cls = isDark
    ? { bg: 'bg-slate-900', border: 'border-white/10', text: 'text-white', muted: 'text-white/40', hover: 'hover:bg-white/5', active: 'bg-teal-600/20 border-teal-500/30' }
    : { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800', muted: 'text-gray-400', hover: 'hover:bg-gray-50', active: 'bg-teal-50 border-teal-300' };

  return (
    <div className="flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-sm font-bold ${cls.text}`}>{property.name || property.address.street}</h2>
          <p className={`text-xs ${cls.muted}`}>{filtered.length} units</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowFilters(!showFilters)} className={`rounded-lg border px-2 py-1 text-xs ${cls.border} ${cls.muted}`}>
            <Filter className="inline h-3 w-3 mr-1" />Filters
          </button>
          <button onClick={() => setViewMode('cards')} className={`rounded-md p-1.5 ${viewMode === 'cards' ? 'text-teal-400' : cls.muted}`}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode('table')} className={`rounded-md p-1.5 ${viewMode === 'table' ? 'text-teal-400' : cls.muted}`}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`mt-3 flex flex-wrap gap-2 rounded-lg border p-2 ${cls.border} ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${cls.muted}`}>Floor</span>
            <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}
              className={`rounded border px-2 py-1 text-xs ${cls.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`}>
              <option>All</option>
              {floors.map((f) => <option key={f} value={f}>{f === 0 ? 'G' : `F${f}`}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] ${cls.muted}`}>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded border px-2 py-1 text-xs ${cls.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`}>
              <option>All</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${cls.border}`}>
                {([['unit_number', 'ID'], ['area_m2', 'Area'], ['floor', 'Floor'], ['status', 'Status']] as [SortField, string][]).map(([field, label]) => (
                  <th key={field} className={`cursor-pointer px-2 py-2 text-left font-medium ${cls.muted}`} onClick={() => handleSort(field)}>
                    {label} {sortField === field ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                return (
                  <tr
                    key={unit.id}
                    onClick={() => onSelectUnit(unit.id)}
                    className={`cursor-pointer border-b transition-colors ${cls.border} ${
                      isSelected ? cls.active : cls.hover
                    }`}
                  >
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${unit.status === 'available' ? 'bg-teal-400' : unit.status === 'occupied' ? 'bg-slate-400' : 'bg-amber-400'}`} />
                        <span className="font-medium">{unit.unit_number}</span>
                      </div>
                    </td>
                    <td className={`px-2 py-2.5 ${cls.muted}`}>{unit.area_m2.toFixed(0)} m²</td>
                    <td className={`px-2 py-2.5 ${cls.muted}`}>{unit.floor === 0 ? 'G' : unit.floor}</td>
                    <td className="px-2 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        unit.status === 'available' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {unit.status === 'available' ? 'Available' : unit.status === 'occupied' ? 'Occupied' : unit.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards view */}
      {viewMode === 'cards' && (
        <div className="mt-3 space-y-2">
          {filtered.map((unit) => {
            const isSelected = unit.id === selectedUnitId;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelectUnit(unit.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected ? cls.active : `${cls.border} ${cls.hover}`
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold ${
                  isSelected ? 'bg-teal-600 text-white' : isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                }`}>
                  {unit.unit_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${cls.text}`}>{unit.area_m2.toFixed(0)} m²</p>
                  <p className={`text-[10px] ${cls.muted}`}>Floor {unit.floor} | {unit.status}</p>
                </div>
                {unit.current_rent && (
                  <span className={`text-xs font-medium ${cls.text}`}>${unit.current_rent}/mo</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
