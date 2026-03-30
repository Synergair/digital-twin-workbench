import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { bimPipelineHooks } from '@/lib/integrations/bimPipelines';

export function BimPipelineCard() {
  return (
    <V2Surface title="Pipelines BIM" subtitle="Hooks Revit / AutoCAD / LiDAR (stubs)">
      <div className="space-y-3 text-sm">
        {bimPipelineHooks.map((hook) => (
          <div key={hook.id} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
            <div>
              <p className="font-semibold text-[var(--semantic-text)]">{hook.label}</p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">{hook.description}</p>
            </div>
            <V2StatusPill label={hook.status === 'connected' ? 'Connecté' : 'Stub'} variant={hook.status === 'connected' ? 'success' : 'neutral'} />
          </div>
        ))}
      </div>
    </V2Surface>
  );
}
