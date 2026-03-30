import Button from '@/components/ui/button';
import { V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import type { TwinPin, TwinSeverity, TwinUnit } from '../types';

const severityOptions: TwinSeverity[] = ['urgent', 'standard', 'planifie'];

export function InspectionPanel({
  unit,
  pins,
  severity,
  pinDropMode,
  readOnly,
  onChangeSeverity,
  onTogglePinDrop,
  onStartDispatch,
}: {
  unit: TwinUnit | null;
  pins: TwinPin[];
  severity: TwinSeverity;
  pinDropMode: boolean;
  readOnly: boolean;
  onChangeSeverity: (severity: TwinSeverity) => void;
  onTogglePinDrop: () => void;
  onStartDispatch: () => void;
}) {
  return (
    <V2Surface
      title="Inspection"
      subtitle={unit ? `Briefing enrichi pour l'unité ${unit.unit_number}` : 'Sélectionnez une unité pour poser un pin'}
      actions={<V2StatusPill label={pinDropMode ? 'Pose active' : 'En veille'} variant={pinDropMode ? 'info' : 'neutral'} />}
    >

      <div className="mt-4 flex flex-wrap gap-2">
        {severityOptions.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={severity === option ? 'primary' : 'secondary'}
            onClick={() => onChangeSeverity(option)}
          >
            {option}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <Button type="button" variant="primary" onClick={onTogglePinDrop} disabled={readOnly || !unit}>
          {pinDropMode ? 'Annuler la pose du pin' : 'Épingler le problème'}
        </Button>
        <Button type="button" variant="secondary" onClick={onStartDispatch} disabled={!unit}>
          Ouvrir le briefing maintenance
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-black/5 bg-white/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Contexte proche</p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--semantic-text)]">
          <li>Mur cible: gypse 38 mm, résistance feu 45 min</li>
          <li>MEP proche: plomberie cuivre à 18-22 cm</li>
          <li>Pins actifs liés: {pins.length}</li>
        </ul>
      </div>
    </V2Surface>
  );
}
