import { useState, useMemo } from 'react';
import { FileCode, Box, ChevronDown, Check, Loader2 } from 'lucide-react';
import type { TwinData } from '../twinData';

interface ModelOption {
  id: string;
  name: string;
  type: 'glb' | 'ifc';
  url: string;
  size: string;
  buildingType?: string;
}

interface ModelSelectorProps {
  twinData: TwinData;
  currentModelUrl: string;
  onSelectModel: (url: string) => void;
  loading?: boolean;
}

export function ModelSelector({ twinData, currentModelUrl, onSelectModel, loading }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const models = useMemo(() => {
    const options: ModelOption[] = [];

    // Add IFC models
    twinData.ifcModels.forEach((m) => {
      options.push({
        id: m.id,
        name: m.name,
        type: 'ifc',
        url: `/documents/models/${m.file}`,
        size: `${m.sizeMb} MB`,
        buildingType: m.buildingType,
      });
      // If there's a preview GLB, add it too
      if (m.previewModelUrl) {
        options.push({
          id: `${m.id}-preview`,
          name: `${m.name} (GLB Preview)`,
          type: 'glb',
          url: m.previewModelUrl,
          size: 'Preview',
          buildingType: m.buildingType,
        });
      }
    });

    return options;
  }, [twinData]);

  const currentModel = models.find((m) => m.url === currentModelUrl);

  if (!models.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm transition-colors hover:bg-white/15"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileCode className="h-3.5 w-3.5 text-teal-400" />
        )}
        <span className="max-w-[120px] truncate">
          {currentModel?.name ?? 'Default Model'}
        </span>
        <ChevronDown className="h-3 w-3 text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-white/10 bg-slate-800/95 p-2 shadow-xl backdrop-blur-md">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Available Models ({models.length})
            </p>

            {/* Default model option */}
            <button
              type="button"
              onClick={() => { onSelectModel('/listing-3d-mockup/models/modern-apartment-building.glb'); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                !currentModel ? 'bg-teal-600/20 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Box className="h-4 w-4 text-teal-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Default Building (GLB)</p>
                <p className="text-[10px] text-white/40">modern-apartment-building.glb</p>
              </div>
              {!currentModel && <Check className="h-3.5 w-3.5 text-teal-400" />}
            </button>

            <div className="my-1 border-t border-white/10" />

            {models.map((model) => {
              const isActive = model.url === currentModelUrl;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => { onSelectModel(model.url); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                    isActive ? 'bg-teal-600/20 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileCode className={`h-4 w-4 ${model.type === 'ifc' ? 'text-sky-400' : 'text-teal-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{model.name}</p>
                    <p className="text-[10px] text-white/40">
                      {model.type.toUpperCase()} | {model.size}
                      {model.buildingType ? ` | ${model.buildingType}` : ''}
                    </p>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-teal-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
