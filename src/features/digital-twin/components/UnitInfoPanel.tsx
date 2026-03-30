import { V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import type { TwinUnit } from '../types';

export function UnitInfoPanel({ unit }: { unit: TwinUnit | null }) {
  if (!unit) {
    return (
      <V2Surface title="Unité sélectionnée" subtitle="Choisissez une unité dans la section bâtiment pour afficher son contexte.">
        <p className="mt-2 text-sm text-[var(--semantic-text-subtle)]">
          Sélectionnez une unité dans le viewer pour afficher le contexte, le bail et les signaux actifs.
        </p>
      </V2Surface>
    );
  }

  return (
    <V2Surface
      title={`Unité ${unit.unit_number}`}
      subtitle={`${unit.unit_type} • ${unit.area_m2.toFixed(0)} m²`}
      actions={
        <V2StatusPill
          label={unit.status}
          variant={unit.status === 'alert' ? 'danger' : unit.status === 'warn' ? 'warning' : unit.status === 'vacant' ? 'neutral' : 'success'}
        />
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Locataire</p>
            <p className="mt-1 text-[var(--semantic-text)]">{unit.tenant_name ?? 'Vacant / non assigné'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Loyer courant</p>
            <p className="mt-1 text-[var(--semantic-text)]">{unit.current_rent ? `${unit.current_rent.toLocaleString('fr-CA')} $` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Échéance bail</p>
            <p className="mt-1 text-[var(--semantic-text)]">
              {unit.lease_expiry
                ? new Date(unit.lease_expiry).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Dernière capture</p>
            <p className="mt-1 text-[var(--semantic-text)]">
              {unit.last_capture_at
                ? new Date(unit.last_capture_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Aucune'}
            </p>
          </div>
        </div>
      </div>
    </V2Surface>
  );
}
