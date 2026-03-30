import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { parseDtdlModels, parseOntologyEntities, parseSensorSamples } from '../overlaySources';

export function DataOverlayPanel() {
  const entities = parseOntologyEntities();
  const models = parseDtdlModels();
  const sensors = parseSensorSamples(40);
  const latest = sensors[0]?.timestamp ?? null;
  const classCount = entities.filter((entity) => entity.kind === 'class').length;
  const propertyCount = entities.filter((entity) => entity.kind === 'property').length;

  return (
    <V2Surface
      title="Données importées"
      subtitle="Échantillons Azure Digital Twins + flux capteurs."
      actions={<V2StatusPill label="Sources actives" variant="info" />}
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Ontologie (TTL)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
              {classCount} classes
            </span>
            <span className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
              {propertyCount} propriétés
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Modèles DTDL</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {models.map((model, index) => (
              <span key={`${model.id}-${index}`} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
                {model.displayName ?? model.id}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Capteurs (CSV)</p>
          <p className="mt-2 text-sm text-[var(--semantic-text)]">{sensors.length} points</p>
          <p className="text-xs text-[var(--semantic-text-subtle)]">Dernière trame: {latest ?? 'N/A'}</p>
        </div>
      </div>
    </V2Surface>
  );
}
