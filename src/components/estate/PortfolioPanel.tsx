import { Building2, Search } from 'lucide-react';
import { useState } from 'react';

type Property = {
  id: string;
  name: string;
  address: { street: string; city: string };
  floors: number;
  unitsPerFloor: number;
};

interface PortfolioPanelProps {
  properties: Property[];
  isDark: boolean;
  onSelectProperty: (id: string) => void;
}

export function PortfolioPanel({ properties, isDark, onSelectProperty }: PortfolioPanelProps) {
  const [search, setSearch] = useState('');
  const filtered = properties.filter((p) =>
    `${p.name} ${p.address.street} ${p.address.city}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col p-4">
      <h2 className="text-sm font-bold">Properties</h2>
      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{properties.length} buildings</p>

      <div className="relative mt-3">
        <Search className={`absolute left-3 top-2.5 h-3.5 w-3.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30'
              : 'border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-400'
          }`}
        />
      </div>

      <div className="mt-3 space-y-2">
        {filtered.map((property) => {
          const totalUnits = property.floors * property.unitsPerFloor;
          return (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelectProperty(property.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                isDark
                  ? 'border-white/10 hover:border-teal-500/30 hover:bg-white/5'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isDark ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <Building2 className="h-5 w-5 text-teal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{property.name || property.address.street}</p>
                <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  {property.address.city} | {property.floors}F | {totalUnits} units
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
