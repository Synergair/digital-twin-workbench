import { V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import Badge from '@/components/ui/badge';
import type { TwinPin, TwinUnit } from '../types';
import { estimateDispatchDuration, recommendSkills } from '../algorithms';

export function VendorBriefingPanel({
  unit,
  pin,
}: {
  unit: TwinUnit | null;
  pin: TwinPin | null;
}) {
  const skills = recommendSkills(pin);
  const duration = estimateDispatchDuration(pin);

  return (
    <V2Surface
      title="Briefing fournisseur"
      subtitle="Synthèse opérationnelle prête à transmettre."
      actions={<V2StatusPill label={pin?.status ?? 'préparation'} variant={pin?.status === 'open' ? 'warning' : 'info'} />}
    >
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-[var(--semantic-text)]">{unit ? `Unité ${unit.unit_number}` : 'Unité non sélectionnée'}</p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">{pin?.description ?? 'Sélectionnez un pin pour enrichir le briefing.'}</p>
          </div>
          <Badge variant={pin?.severity === 'urgent' ? 'error' : pin?.severity === 'planifie' ? 'warning' : 'info'}>
            {pin?.severity ?? 'standard'}
          </Badge>
        </div>

        <div className="grid gap-2 rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">MEP + contexte</p>
          <div className="flex flex-wrap gap-2">
            {(pin?.mep_proximity ?? []).slice(0, 3).map((entry, index) => (
              <span key={`${pin?.id ?? 'pin'}-${index}`} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
                {String(entry.type ?? 'MEP')} {entry.distanceCm ? `~${entry.distanceCm} cm` : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="rounded-xl border border-[var(--semantic-border)] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Durée estimée</p>
            <p className="mt-1 text-sm font-semibold text-[var(--semantic-text)]">{duration}</p>
          </div>
          <div className="rounded-xl border border-[var(--semantic-border)] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Compétences</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </V2Surface>
  );
}
