import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, ClipboardList, Upload } from '@/components/icons/basil-lucide';
import { V2DataTable, V2MetricGrid, V2MetricTile, V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import Button from '@/components/ui/button';
import Loading from '@/components/ui/Loading';
import { useTwinCaptures, useTwinManifest, useTwinPassportLayers, useTwinPins, useTwinUnits } from '@/hooks/useTwinQueries';

const summaryTabs = ['Systèmes MEP', 'Unités', 'Parking', 'Structure'];

export function DigitalTwinOverview({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const manifestQuery = useTwinManifest(propertyId);
  const unitsQuery = useTwinUnits(propertyId);
  const pinsQuery = useTwinPins(propertyId);
  const passportQuery = useTwinPassportLayers(propertyId);
  const capturesQuery = useTwinCaptures(propertyId);

  const manifest = manifestQuery.data;
  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);
  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);
  const recentCapture = capturesQuery.data?.[0] ?? null;

  if (manifestQuery.isLoading || unitsQuery.isLoading || pinsQuery.isLoading || passportQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-8">
        <Loading />
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-8">
        <p className="text-sm text-[var(--semantic-text-subtle)]">Aucune donnée Digital Twin disponible pour cette propriété.</p>
      </div>
    );
  }

  const coverageCount = units.filter((unit) => unit.has_digital_twin).length;
  const coveragePercent = manifest.total_units > 0 ? Math.round((coverageCount / manifest.total_units) * 100) : 0;
  const alerts = units
    .flatMap((unit) => unit.active_alerts.map((alert) => ({ unit, alert })))
    .sort((a, b) => new Date(b.alert.created_at).getTime() - new Date(a.alert.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <V2MetricGrid>
        <V2MetricTile label="Couverture twin" value={`${coveragePercent}%`} hint={`${coverageCount}/${manifest.total_units} unités`} icon={<Building2 className="h-4 w-4" />} tone="accent" />
        <V2MetricTile label="Pins ouverts" value={pins.filter((pin) => pin.status !== 'resolved' && pin.status !== 'dismissed').length} hint="Signalements spatialisés" icon={<ClipboardList className="h-4 w-4" />} tone="warning" />
        <V2MetricTile label="Passport bâtiment" value={`${manifest.building_passport_score}%`} hint="Consolidation BIM opérationnelle" icon={<AlertTriangle className="h-4 w-4" />} tone={manifest.building_passport_score >= 85 ? 'success' : 'warning'} />
        <V2MetricTile
          label="Dernière capture"
          value={recentCapture ? new Date(recentCapture.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : 'Aucune'}
          hint={recentCapture?.status === 'processing' ? 'Traitement en cours' : recentCapture?.capture_type ?? 'Import requis'}
          icon={<Upload className="h-4 w-4" />}
          tone={recentCapture?.status === 'processing' ? 'warning' : 'neutral'}
        />
      </V2MetricGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <V2Surface
          title="Workspace Digital Twin"
          subtitle="Le tab sert d’aperçu. Le vrai poste de pilotage s’ouvre dans un workspace dédié aligné sur le shell OKey."
          actions={<V2StatusPill label="Pilote IFC/BIM" variant="info" />}
        >
          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[linear-gradient(135deg,_rgba(13,115,119,0.12),_rgba(255,255,255,0.96))] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Vue d’ensemble</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">{manifest.address}</h3>
                <p className="mt-2 text-sm text-[var(--semantic-text-subtle)]">
                  Isolation par étage, lecture par unité, superposition des systèmes et dispatch contextualisé à partir d’un modèle BIM exploitable.
                </p>
              </div>

              <Button type="button" variant="primary" onClick={() => navigate(`/owner/properties/${propertyId}/digital-twin`)}>
                Ouvrir le workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {summaryTabs.map((tab) => (
                <span
                  key={tab}
                  className="inline-flex items-center rounded-full border border-[var(--semantic-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--semantic-text)]"
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </V2Surface>

        <V2Surface title="Couches consolidées" subtitle="Ce qui est déjà exploitable côté bâtiment.">
          <div className="space-y-3">
            {(passportQuery.data ?? []).map((layer) => (
              <div key={layer.id} className="rounded-xl border border-[var(--semantic-border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium capitalize text-[var(--semantic-text)]">{layer.layer_type}</p>
                    <p className="text-xs text-[var(--semantic-text-subtle)]">
                      Mise à jour {new Date(layer.last_updated).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <V2StatusPill
                    label={`${layer.completeness_percent}%`}
                    variant={layer.completeness_percent >= 85 ? 'success' : layer.completeness_percent >= 70 ? 'warning' : 'neutral'}
                  />
                </div>
              </div>
            ))}
          </div>
        </V2Surface>
      </div>

      <V2Surface title="Signaux récents" subtitle="Alerte et maintenance visibles depuis le twin.">
        <V2DataTable
          columns={[
            {
              key: 'unit',
              header: 'Unité',
              render: ({ unit }) => <span className="font-medium text-[var(--semantic-text)]">{unit.unit_number}</span>,
            },
            {
              key: 'signal',
              header: 'Signal',
              render: ({ alert }) => <span className="text-[var(--semantic-text-subtle)]">{alert.description}</span>,
            },
            {
              key: 'severity',
              header: 'Priorité',
              render: ({ alert }) => (
                <V2StatusPill
                  label={alert.severity}
                  variant={alert.severity === 'urgent' ? 'danger' : alert.severity === 'planifie' ? 'warning' : 'info'}
                />
              ),
            },
          ]}
          rows={alerts}
          getRowKey={(row) => row.alert.id}
          emptyLabel="Aucun signal actif pour cette propriété."
        />
      </V2Surface>
    </div>
  );
}
