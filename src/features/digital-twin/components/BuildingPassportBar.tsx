import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { cn } from '@/lib/utils';

export function BuildingPassportBar({
  score,
  updatedAt,
  className,
}: {
  score: number;
  updatedAt: string;
  className?: string;
}) {
  return (
    <V2Surface className={cn(className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Building Passport</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">{score}%</span>
            <V2StatusPill
              variant={score >= 85 ? 'success' : score >= 70 ? 'warning' : 'neutral'}
              label={score >= 85 ? 'Très complet' : score >= 70 ? 'En progression' : 'À enrichir'}
            />
          </div>
        </div>
        <p className="text-right text-xs text-[var(--semantic-text-subtle)]">
          Dernière consolidation
          <br />
          {new Date(updatedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-[var(--semantic-primary)] transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
        />
      </div>
    </V2Surface>
  );
}
