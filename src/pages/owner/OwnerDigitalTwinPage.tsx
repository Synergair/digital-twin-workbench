import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Layers3, MapPin } from '@/components/icons/basil-lucide';
import Breadcrumbs from '@/components/molecules/Breadcrumbs';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { DigitalTwinWorkspace } from '@/features/digital-twin';
import { useOwnerAccessStore } from '@/store/ownerAccessStore';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';

export default function OwnerDigitalTwinPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getPropertyById } = useOwnerPropertiesStore();
  const { getCompanyById } = useOwnerAccessStore();
  const property = getPropertyById(id ?? '');
  const company = property?.companyId ? getCompanyById(property.companyId) : undefined;
  const propertyAddress = property
    ? `${property.address.street}, ${property.address.city}, ${property.address.province} ${property.address.postalCode}`
    : '';

  if (!property) {
    return <Navigate to="/owner/properties" replace />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumbs
        items={[
          { label: 'Propriétés', href: '/owner/properties' },
          ...(company ? [{ label: company.name }] : []),
          { label: property.name, href: `/owner/properties/${property.id}` },
          { label: 'Digital Twin' },
        ]}
      />

      <section className="rounded-[28px] border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={() => navigate(`/owner/properties/${property.id}`)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--semantic-text-subtle)] transition-colors hover:text-[var(--semantic-text)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la propriété
            </button>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="info">
                <Layers3 className="h-3.5 w-3.5" />
                Workspace pilote
              </Badge>
              <Badge variant="outline">
                <Building2 className="h-3.5 w-3.5" />
                Shell OKey + viewport immersif
              </Badge>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--semantic-text)]">{property.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--semantic-text-subtle)]">
              <MapPin className="h-4 w-4" />
              {propertyAddress}
            </p>
            <p className="mt-3 text-sm text-[var(--semantic-text-subtle)]">
              Poste de pilotage spatial pour isoler les étages, lire les unités et lancer des interventions contextualisées à partir du twin.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(`/owner/properties/${property.id}`)}>
              Aperçu propriété
            </Button>
            <Button type="button" variant="primary" onClick={() => navigate('/owner/maintenance')}>
              Ouvrir l’entretien
            </Button>
          </div>
        </div>
      </section>

      <DigitalTwinWorkspace propertyId={property.id} />
    </div>
  );
}
