import { AlertTriangle, Building2, MapPin, Layers3 } from '@/components/icons/basil-lucide';
import Badge from '@/components/ui/badge';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';

interface PropertyOverviewHeroProps {
  propertyId: string;
  address: string;
  totalUnits: number;
  floors: number;
  alertCount: number;
  urgentCount: number;
  openPinsCount: number;
  coveragePercent: number;
  passportScore: number;
  passportUpdatedAt: string;
  hasOdmModel: boolean;
  floorLabel: string;
}

export function PropertyOverviewHero({
  propertyId,
  address,
  totalUnits,
  floors,
  alertCount,
  urgentCount,
  openPinsCount,
  coveragePercent,
  passportScore,
  passportUpdatedAt,
  hasOdmModel,
  floorLabel,
}: PropertyOverviewHeroProps) {
  const property = useOwnerPropertiesStore((state) => state.getPropertyById(propertyId));

  return (
    <div className="surface-card-elevated p-6">
      {/* Top Row: Property Identity + Status Badges */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-[var(--semantic-text-muted)]">
            <MapPin className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">Digital Twin</span>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-[var(--semantic-text)]">
            {property?.name ?? address}
          </h1>
          <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">{address}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{floors} étages</Badge>
          <Badge variant="outline">{totalUnits} unités</Badge>
          <Badge variant={hasOdmModel ? 'success' : 'warning'}>
            {hasOdmModel ? 'Viewer actif' : 'En attente'}
          </Badge>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Alerts */}
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Alertes"
          value={alertCount}
          sublabel={urgentCount > 0 ? `${urgentCount} urgentes` : 'Aucune urgente'}
          variant={urgentCount > 0 ? 'danger' : 'neutral'}
        />

        {/* Open Pins */}
        <MetricCard
          icon={<Layers3 className="h-4 w-4" />}
          label="Pins ouverts"
          value={openPinsCount}
          sublabel={floorLabel}
          variant="info"
        />

        {/* Coverage */}
        <MetricCard
          icon={<Building2 className="h-4 w-4" />}
          label="Couverture"
          value={`${coveragePercent}%`}
          sublabel="Unités connectées"
          variant={coveragePercent >= 85 ? 'success' : coveragePercent >= 50 ? 'warning' : 'neutral'}
        />

        {/* Passport Score - Larger */}
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex h-full flex-col justify-between rounded-xl border border-[var(--semantic-border)] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
                  Building Passport
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-[var(--semantic-text)]">{passportScore}%</span>
                  <span className={`text-xs font-medium ${
                    passportScore >= 85 ? 'text-emerald-600' :
                    passportScore >= 70 ? 'text-amber-600' : 'text-[var(--semantic-text-subtle)]'
                  }`}>
                    {passportScore >= 85 ? 'Complet' : passportScore >= 70 ? 'En progression' : 'À enrichir'}
                  </span>
                </div>
              </div>
              <p className="text-right text-[10px] text-[var(--semantic-text-muted)]">
                Mise à jour<br />
                {new Date(passportUpdatedAt).toLocaleDateString('fr-CA', {
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--semantic-border)]">
              <div
                className="h-full rounded-full bg-[var(--semantic-primary)] transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(passportScore, 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  variant = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel: string;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const variantStyles = {
    info: 'border-[var(--accent-sky-soft)] bg-[var(--accent-sky-soft)]',
    success: 'border-[var(--accent-success-soft)] bg-[var(--accent-success-soft)]',
    warning: 'border-[var(--accent-warning-soft)] bg-[var(--accent-warning-soft)]',
    danger: 'border-[var(--accent-ember-soft)] bg-[var(--accent-ember-soft)]',
    neutral: 'border-[var(--semantic-border)] bg-white',
  };

  const iconStyles = {
    info: 'text-[var(--accent-sky)]',
    success: 'text-[var(--accent-success)]',
    warning: 'text-[var(--accent-warning)]',
    danger: 'text-[var(--accent-ember)]',
    neutral: 'text-[var(--semantic-text-subtle)]',
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${variantStyles[variant]}`}>
      <div className={`flex-shrink-0 ${iconStyles[variant]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-semibold text-[var(--semantic-text)]">{value}</p>
        <p className="truncate text-[10px] text-[var(--semantic-text-subtle)]">{sublabel}</p>
      </div>
    </div>
  );
}
