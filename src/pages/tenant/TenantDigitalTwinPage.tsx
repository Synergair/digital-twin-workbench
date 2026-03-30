import { Building2, Lock, Radar } from '@/components/icons/basil-lucide';
import Badge from '@/components/ui/badge';
import { TwinUnitView } from '@/features/digital-twin';
import { useAuthStore } from '@/store/authStore';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';

export default function TenantDigitalTwinPage() {
  const { user } = useAuthStore();
  const currentUnit = useOwnerPropertiesStore.getState().units.find((unit) => unit.tenantId === user?.id) ?? null;

  if (!currentUnit) {
    return (
      <div className="rounded-3xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-8">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--semantic-text)]">Digital Twin</h1>
        <p className="mt-2 text-sm text-[var(--semantic-text-subtle)]">
          Aucun bail actif associé à votre compte, donc aucun jumeau numérique à afficher pour l’instant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--semantic-border)] bg-[linear-gradient(135deg,_rgba(13,115,119,0.14),_rgba(255,255,255,0.96))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">
                <Radar className="h-3.5 w-3.5" />
                Vue locataire
              </Badge>
              <Badge variant="outline">
                <Lock className="h-3.5 w-3.5" />
                Unité isolée
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">Signaler précisément depuis votre unité</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--semantic-text-subtle)]">
              Cliquez sur la bonne zone, créez un pin et transmettez un contexte spatial clair à la maintenance, sans voir les autres logements.
            </p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/70 p-4 text-sm text-[var(--semantic-text)]">
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4 text-[var(--semantic-primary)]" />
              {currentUnit.unitNumber}
            </div>
            <p className="mt-1 text-[var(--semantic-text-subtle)]">Propriété liée à votre bail actuel</p>
          </div>
        </div>
      </section>

      <TwinUnitView propertyId={currentUnit.propertyId} unitId={currentUnit.id} />
    </div>
  );
}
