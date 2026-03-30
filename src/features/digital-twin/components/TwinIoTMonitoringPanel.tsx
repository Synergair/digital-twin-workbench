import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';

const liveSignals = [
  { id: 'hvac', label: 'HVAC', value: 21.4, unit: 'C', status: 'stable' },
  { id: 'water', label: 'Eau', value: 1.2, unit: 'L/min', status: 'stable' },
  { id: 'energy', label: 'Energie', value: 86, unit: 'kW', status: 'alert' },
  { id: 'co2', label: 'CO2', value: 612, unit: 'ppm', status: 'stable' },
];

const sensorRows = [
  { id: 'sensor-01', name: 'Pompe chambre mecanique', lastSeen: '12:04', state: 'ok' },
  { id: 'sensor-02', name: 'Sous-sol detecteur fuite', lastSeen: '12:02', state: 'warning' },
  { id: 'sensor-03', name: 'Salle electrique armoire A', lastSeen: '12:01', state: 'ok' },
  { id: 'sensor-04', name: 'Escalier capteur fumee', lastSeen: '11:59', state: 'ok' },
];

export function TwinIoTMonitoringPanel() {
  return (
    <V2Surface title="IoT Monitoring" subtitle="Flux temps reel, seuils et alertes capteurs.">
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
            <p className="mt-2 text-xs text-[var(--semantic-text-subtle)]">Derniere mise a jour: 12:05</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Capteurs actifs</p>
        <div className="mt-3 space-y-2">
          {sensorRows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 text-xs text-[var(--semantic-text)]">
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="text-[var(--semantic-text-subtle)]">Ping {row.lastSeen}</p>
              </div>
              <V2StatusPill label={row.state === 'warning' ? 'Surveillance' : 'OK'} variant={row.state === 'warning' ? 'warning' : 'success'} />
            </div>
          ))}
        </div>
      </div>
    </V2Surface>
  );
}
