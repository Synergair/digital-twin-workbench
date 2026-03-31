import { useState } from 'react';
import { MapPin, Search, Bell, User, ChevronDown } from 'lucide-react';

interface AddressSearchBarProps {
  address: string;
  floors: number;
  totalUnits: number;
  alertCount: number;
  urgentCount: number;
}

export function AddressSearchBar({
  address,
  floors,
  totalUnits,
  alertCount,
  urgentCount,
}: AddressSearchBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 backdrop-blur-sm">
      {/* Left: Logo + Address */}
      <div className="flex items-center gap-3">
        {/* Logo/Home */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>

        {/* Search Toggle */}
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Address */}
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-white/40" />
          <span className="max-w-[300px] truncate text-sm font-medium text-white">
            {address}
          </span>
        </div>
      </div>

      {/* Center: Quick Stats */}
      <div className="hidden items-center gap-4 text-xs text-white/60 md:flex">
        <span className="flex items-center gap-1.5">
          <span className="text-white/40">{floors}</span>
          <span>floors</span>
        </span>
        <span className="h-3 w-px bg-white/20" />
        <span className="flex items-center gap-1.5">
          <span className="text-white/40">{totalUnits}</span>
          <span>units</span>
        </span>
        {alertCount > 0 && (
          <>
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-1.5">
              <Bell className="h-3 w-3" />
              <span className={urgentCount > 0 ? 'text-amber-400' : ''}>
                {alertCount} alert{alertCount !== 1 ? 's' : ''}
                {urgentCount > 0 && ` (${urgentCount} urgent)`}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Share */}
        <button
          type="button"
          className="hidden rounded-lg px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          Share
        </button>

        {/* User Menu */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <User className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute left-0 right-0 top-12 z-50 border-b border-white/10 bg-slate-900/98 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search address, building, or unit..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50"
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-white/40">
              Type an address to find a building or search within current property
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="absolute right-4 top-4 text-white/40 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
