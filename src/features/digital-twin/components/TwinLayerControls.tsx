import type { TwinLayer } from '../types';

const layerGroups: Array<{ title: string; layers: Array<{ id: TwinLayer; label: string }> }> = [
  {
    title: 'Structure',
    layers: [
      { id: 'structure', label: 'Structure' },
      { id: 'envelope', label: 'Enveloppe' },
      { id: 'roof', label: 'Toiture' },
      { id: 'solar', label: 'Solaire' },
    ],
  },
  {
    title: 'MEP',
    layers: [
      { id: 'plomberie', label: 'Plomberie' },
      { id: 'hvac', label: 'HVAC' },
      { id: 'electricite', label: 'Électricité' },
      { id: 'lighting', label: 'Éclairage' },
      { id: 'sprinklers', label: 'Sprinklers' },
      { id: 'drainage', label: 'Drainage' },
      { id: 'water', label: 'Eau' },
      { id: 'gas', label: 'Gaz' },
    ],
  },
  {
    title: 'Sécurité & Accès',
    layers: [
      { id: 'fire', label: 'Incendie' },
      { id: 'security', label: 'Sécurité' },
      { id: 'access', label: 'Accès' },
      { id: 'cameras', label: 'Caméras' },
    ],
  },
  {
    title: 'Circulation',
    layers: [
      { id: 'elevators', label: 'Ascenseurs' },
      { id: 'stairs', label: 'Escaliers' },
      { id: 'parking', label: 'Parking' },
    ],
  },
  {
    title: 'Opérations',
    layers: [
      { id: 'zones', label: 'Zones' },
      { id: 'maintenance', label: 'Maintenance' },
      { id: 'sensors', label: 'Capteurs' },
      { id: 'it', label: 'IT & Réseau' },
    ],
  },
];

export function TwinLayerControls({
  activeLayers,
  onToggle,
}: {
  activeLayers: Set<TwinLayer>;
  onToggle: (layer: TwinLayer) => void;
}) {
  return (
    <div className="grid gap-3">
      {layerGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--semantic-text-subtle)]">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggle(layer.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] transition ${
                  activeLayers.has(layer.id)
                    ? 'border-[#0d7377] bg-[linear-gradient(180deg,_#157c80,_#0d7377)] text-white shadow-[0_12px_24px_rgba(13,115,119,0.16)]'
                    : 'border-[#d5dfdf] bg-[#f8fbfb] text-[var(--semantic-text-subtle)] hover:border-[#0d7377]/25 hover:bg-white hover:text-[var(--semantic-text)]'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
