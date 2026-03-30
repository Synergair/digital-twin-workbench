import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';

export function BuildingProfileCard({
  propertyId,
  coveragePercent,
  complexity,
  riskScore,
}: {
  propertyId: string;
  coveragePercent: number;
  complexity: number;
  riskScore: number;
}) {
  const property = useOwnerPropertiesStore((state) => state.getPropertyById(propertyId));

  if (!property) {
    return null;
  }

  return (
    <V2Surface title="Profil bâtiment" subtitle="Résumé du programme architectural et technique.">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Programme</p>
          <p className="mt-2 font-semibold text-[var(--semantic-text)]">{property.name}</p>
          <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">{property.occupancy}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <V2StatusPill label={`${property.floors} étages`} variant="info" />
            <V2StatusPill label={`${property.unitsPerFloor} unités / étage`} variant="neutral" />
            <V2StatusPill label={`Couverture ${coveragePercent}%`} variant={coveragePercent >= 85 ? 'success' : 'warning'} />
            <V2StatusPill label={`Complexité ${complexity}`} variant={complexity >= 70 ? 'warning' : 'neutral'} />
            <V2StatusPill label={`Risque ${riskScore}`} variant={riskScore >= 70 ? 'danger' : 'info'} />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Enveloppe & site</p>
          <ul className="mt-2 space-y-2 text-[var(--semantic-text)]">
            <li>Toiture: {property.roofType}</li>
            <li>Parking: {property.parkingType}</li>
            <li>Adresse: {property.address.street}</li>
          </ul>
        </div>
      </div>
    </V2Surface>
  );
}
