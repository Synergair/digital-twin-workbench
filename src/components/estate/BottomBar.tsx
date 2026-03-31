import { Camera, Share2, Glasses, BarChart3, Sun, Moon, RotateCw } from 'lucide-react';
import type { EstateLevel, ViewMode } from './EstateShell';

interface BottomBarProps {
  level: EstateLevel;
  viewMode: ViewMode;
  isDark: boolean;
  onToggleDark: () => void;
}

export function BottomBar({ level, viewMode, isDark, onToggleDark }: BottomBarProps) {
  const bg = isDark
    ? 'bg-slate-900/95 border-white/10'
    : 'bg-white/95 border-gray-200';
  const btnCls = isDark
    ? 'text-white/40 hover:text-white hover:bg-white/10'
    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100';

  return (
    <div className={`z-30 flex h-11 flex-shrink-0 items-center justify-between border-t px-4 backdrop-blur-md ${bg}`}>
      {/* Left actions */}
      <div className="flex items-center gap-1">
        <button type="button" className={`rounded-full p-2 transition-colors ${btnCls}`} title="Capture">
          <Camera className="h-4 w-4" />
        </button>
        <button type="button" className={`rounded-full p-2 transition-colors ${btnCls}`} title="Share">
          <Share2 className="h-4 w-4" />
        </button>
        <button type="button" className={`rounded-full p-2 transition-colors ${btnCls}`} title="VR Mode">
          <Glasses className="h-4 w-4" />
        </button>
        <button type="button" className={`rounded-full p-2 transition-colors ${btnCls}`} title="Compare">
          <BarChart3 className="h-4 w-4" />
        </button>
      </div>

      {/* Center: 360° control */}
      {level !== 'portfolio' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
              isDark ? 'border-white/20 text-white/60 hover:text-white' : 'border-gray-300 text-gray-500 hover:text-gray-700'
            }`}
          >
            <RotateCw className="h-3 w-3" />
            360°
          </button>
        </div>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <span className={`mr-2 text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
          Set day or night
        </span>
        <button
          type="button"
          onClick={onToggleDark}
          className={`flex items-center gap-1 rounded-full p-2 transition-colors ${
            isDark ? 'text-amber-400 hover:bg-white/10' : 'text-indigo-500 hover:bg-gray-100'
          }`}
          title={isDark ? 'Switch to Day' : 'Switch to Night'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Branding */}
        <div className={`ml-2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          isDark ? 'border-teal-500/30 text-teal-400' : 'border-teal-200 text-teal-600'
        }`}>
          <span className="text-xs">OK</span>
          <span className={isDark ? 'text-white/40' : 'text-gray-400'}>ey</span>
        </div>
      </div>
    </div>
  );
}
