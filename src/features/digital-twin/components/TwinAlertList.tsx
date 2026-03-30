import { V2DataTable, V2StatusPill, V2Surface } from '@/components/dashboard/v2/primitives';
import type { TwinUnit } from '../types';

export function TwinAlertList({ units }: { units: TwinUnit[] }) {
  const alerts = units
    .flatMap((unit) => unit.active_alerts.map((alert) => ({ unit, alert })))
    .sort((a, b) => new Date(b.alert.created_at).getTime() - new Date(a.alert.created_at).getTime())
    .slice(0, 6);

  return (
    <V2Surface
      title="Alertes actives"
      subtitle="Pins, maintenance et signaux par unité"
      actions={
        <V2StatusPill
          label={`${alerts.length} active${alerts.length > 1 ? 's' : ''}`}
          variant={alerts.some((entry) => entry.alert.severity === 'urgent') ? 'danger' : 'info'}
        />
      }
    >
      <V2DataTable
        columns={[
          {
            key: 'unit',
            header: 'Unité',
            render: ({ unit }) => <span className="font-medium text-[var(--semantic-text)]">{unit.unit_number}</span>,
          },
          {
            key: 'desc',
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
        emptyLabel="Aucune alerte critique sur ce périmètre."
      />
    </V2Surface>
  );
}
