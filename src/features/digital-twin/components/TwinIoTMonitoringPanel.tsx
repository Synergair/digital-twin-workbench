import { useMemo } from 'react';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { getTwinData } from '../twinData';

export function TwinIoTMonitoringPanel({ propertyId }: { propertyId?: string }) {
  const twinData = useMemo(() => getTwinData(propertyId ?? 'prop-midrise-condo'), [propertyId]);

  // Derive live signals from asset registry and carbon data
  const liveSignals = useMemo(() => [
    {
      id: 'hvac',
      label: 'HVAC',
      value: twinData.assetRegistry.find((a) => a.system === 'HVAC')?.status === 'online' ? 21.4 : 18.2,
      unit: '°C',
      status: twinData.assetRegistry.find((a) => a.system === 'HVAC')?.status === 'online' ? 'stable' : 'alert',
    },
    {
      id: 'water',
      label: 'Eau',
      value: twinData.incidentReports.some((r) => r.category === 'Plomberie' && r.status === 'open') ? 3.8 : 1.2,
      unit: 'L/min',
      status: twinData.incidentReports.some((r) => r.category === 'Plomberie' && r.status === 'open') ? 'alert' : 'stable',
    },
    {
      id: 'energy',
      label: 'Énergie',
      value: Math.round(twinData.carbon.energyKwhAnnual / 8760),
      unit: 'kW',
      status: twinData.incidentReports.some((r) => r.category === 'Electricite' && r.status === 'open') ? 'alert' : 'stable',
    },
    {
      id: 'co2',
      label: 'CO₂',
      value: Math.round(twinData.carbon.emissionsTons * 12),
      unit: 'ppm',
      status: twinData.carbon.emissionsTons > 200 ? 'alert' : 'stable',
    },
  ], [twinData]);

  // Derive sensor rows from asset registry
  const sensorRows = useMemo(() =>
    twinData.assetRegistry.map((asset) => ({
      id: asset.assetId,
      name: asset.name,
      location: asset.location,
      lastSeen: new Date(asset.lastService).toLocaleDateString('fr-CA'),
      state: asset.status === 'online' ? 'ok' : asset.status === 'degraded' ? 'warning' : asset.status === 'inspection' ? 'warning' : 'critical',
      system: asset.system,
      nextService: asset.nextService,
    })),
  [twinData]);

  return (
    <V2Surface title="IoT Monitoring" subtitle="Flux temps réel, seuils et alertes capteurs.">
      <div className="grid gap-3 md:grid-cols-2">
        {liveSignals.map((signal) => (
          <div key={signal.id} className="surface-card p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">{signal.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--semantic-text)]">
                  {signal.value} {signal.unit}
                </p>
              </div>
              <V2StatusPill label={signal.status === 'alert' ? 'Alerte' : 'Stable'} variant={signal.status === 'alert' ? 'warning' : 'success'} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">
          Actifs bâtiment ({sensorRows.length})
        </p>
        <div className="mt-3 space-y-2">
          {sensorRows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 text-xs text-[var(--semantic-text)]">
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="text-[var(--semantic-text-subtle)]">{row.system} | {row.location} | Service: {row.lastSeen}</p>
              </div>
              <V2StatusPill
                label={row.state === 'critical' ? 'Hors ligne' : row.state === 'warning' ? 'Surveillance' : 'OK'}
                variant={row.state === 'critical' ? 'error' : row.state === 'warning' ? 'warning' : 'success'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Incident Reports */}
      {twinData.incidentReports.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">
            Incidents actifs ({twinData.incidentReports.filter((r) => r.status !== 'resolved').length})
          </p>
          <div className="mt-3 space-y-2">
            {twinData.incidentReports.map((report, i) => {
              const severityColors: Record<string, 'error' | 'warning' | 'success' | 'info'> = {
                critical: 'error', high: 'warning', medium: 'info', low: 'success',
              };
              return (
                <div key={i} className="flex items-center justify-between gap-3 text-xs text-[var(--semantic-text)]">
                  <div>
                    <p className="font-semibold">{report.category}</p>
                    <p className="text-[var(--semantic-text-subtle)]">{report.description}</p>
                    <p className="text-[10px] text-[var(--semantic-text-subtle)]">{report.date}</p>
                  </div>
                  <V2StatusPill label={report.severity} variant={severityColors[report.severity] ?? 'info'} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </V2Surface>
  );
}
