import Badge from '@/components/ui/badge';
import { V2Surface, V2StatusPill } from '@/components/dashboard/v2/primitives';
import { GoogleMapsEmbed } from '@/components/maps/GoogleMapsEmbed';
import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';
import {
  useIntelligenceAggregate,
  useIntelligenceAvm,
  useIntelligenceDataSources,
  useIntelligenceExtended,
  useIntelligenceFields,
  useIntelligenceNeighborhood,
  useIntelligencePermits,
  useIntelligencePredictions,
  useIntelligenceSearch,
} from '@/hooks/usePropertyIntelligence';
import { intelligenceRuntime } from '@/lib/api/intelligence';

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value?: number | null, suffix = '') => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return `${new Intl.NumberFormat('en-CA').format(value)}${suffix}`;
};

export function TwinPropertyIntelligencePanel({ propertyId }: { propertyId: string }) {
  const property = useOwnerPropertiesStore((state) => state.getPropertyById(propertyId));
  const address = property
    ? `${property.address.street}, ${property.address.city}, ${property.address.province}`
    : '';

  const searchQuery = useIntelligenceSearch({
    query: address,
    address,
    city: property?.address.city ?? null,
    province: property?.address.province ?? null,
    mockContext: {
      propertyId,
      propertyType: property?.occupancy ?? null,
      yearBuilt: 2012,
      beds: property?.unitsPerFloor ?? null,
      baths: property?.unitsPerFloor ?? null,
      squareFeet: property ? property.unitsPerFloor * 620 : null,
    },
  });

  const intelligenceProperty = searchQuery.data?.[0];
  const externalId = intelligenceProperty?.id ?? null;

  const extendedQuery = useIntelligenceExtended(externalId, { address });
  const avmQuery = useIntelligenceAvm(externalId);
  const predictionQuery = useIntelligencePredictions(externalId);
  const neighborhoodQuery = useIntelligenceNeighborhood(externalId);
  const permitsQuery = useIntelligencePermits(externalId);
  const sourcesQuery = useIntelligenceDataSources();
  const fieldsQuery = useIntelligenceFields();
  const aggregateQuery = useIntelligenceAggregate({
    city: intelligenceProperty?.city ?? property?.address.city ?? null,
    province: intelligenceProperty?.province ?? property?.address.province ?? null,
  });

  return (
    <V2Surface
      title="Property Intelligence"
      subtitle="Connexion aux donnees d evaluation, zonage, marche et historique."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={intelligenceRuntime.forceMock ? 'warning' : 'success'}>
            {intelligenceRuntime.forceMock ? 'Mock' : 'Live'}
          </Badge>
          {externalId ? <Badge variant="outline">{externalId}</Badge> : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Identite</p>
            <p className="mt-2 text-base font-semibold text-[var(--semantic-text)]">
              {intelligenceProperty?.address ?? address}
            </p>
            <p className="text-xs text-[var(--semantic-text-subtle)]">
              {intelligenceProperty?.city ?? property?.address.city ?? 'N/A'} -{' '}
              {intelligenceProperty?.province ?? property?.address.province ?? 'N/A'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <V2StatusPill label={`Type ${intelligenceProperty?.type ?? 'Mixte'}`} variant="info" />
              <V2StatusPill label={`Annee ${intelligenceProperty?.yearBuilt ?? 'N/A'}`} variant="neutral" />
              <V2StatusPill label={`Surface ${formatNumber(intelligenceProperty?.squareFeet)} pi2`} variant="neutral" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Carte</p>
            <GoogleMapsEmbed
              center={{
                lat: intelligenceProperty?.latitude ?? 45.5017,
                lng: intelligenceProperty?.longitude ?? -73.5673,
              }}
              zoom={15}
              markers={[
                {
                  id: 'property',
                  lat: intelligenceProperty?.latitude ?? 45.5017,
                  lng: intelligenceProperty?.longitude ?? -73.5673,
                  title: intelligenceProperty?.address ?? address,
                  type: 'property',
                  info: `${intelligenceProperty?.type ?? 'Property'} - ${formatNumber(intelligenceProperty?.squareFeet)} pi2`,
                },
              ]}
              className="mt-3 h-44"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">AVM</p>
              <p className="mt-2 text-lg font-semibold text-[var(--semantic-text)]">
                {formatCurrency(avmQuery.data?.salePrice ?? avmQuery.data?.listPrice ?? null)}
              </p>
              <p className="text-xs text-[var(--semantic-text-subtle)]">
                Confiance {avmQuery.data?.confidenceScore ?? 'N/A'} / 100
              </p>
              <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">
                Loyer cible {formatCurrency(avmQuery.data?.rentalPrice ?? null)}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Predictions</p>
              <div className="mt-2 space-y-2">
                {predictionQuery.data?.length ? (
                  predictionQuery.data.slice(0, 3).map((prediction) => (
                    <div key={prediction.months} className="flex items-center justify-between text-xs">
                      <span>{prediction.months} mois</span>
                      <span className="font-semibold text-[var(--semantic-text)]">
                        {formatCurrency(prediction.predictedValue)}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-[var(--semantic-text-subtle)]">Aucune prediction disponible.</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Quartier</p>
            <p className="mt-2 font-semibold text-[var(--semantic-text)]">{neighborhoodQuery.data?.name ?? 'N/A'}</p>
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
              <span>Walk {formatNumber(neighborhoodQuery.data?.walkScore)}</span>
              <span>Transit {formatNumber(neighborhoodQuery.data?.transitScore)}</span>
              <span>Bike {formatNumber(neighborhoodQuery.data?.bikeScore)}</span>
              <span>Crime {formatNumber(neighborhoodQuery.data?.crimeIndex)}</span>
              <span>Income {formatNumber(neighborhoodQuery.data?.demographics?.medianIncome, ' CAD')}</span>
              <span>Owners {formatNumber(neighborhoodQuery.data?.demographics?.ownerOccupied, '%')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Extended</p>
            <div className="mt-2 space-y-2 text-xs text-[var(--semantic-text)]">
              <p>Classification: {extendedQuery.data?.classification ?? 'N/A'}</p>
              <p>Zonage: {extendedQuery.data?.zoning ?? 'N/A'}</p>
              <p>Occupation: {extendedQuery.data?.occupancy ?? 'N/A'}</p>
              <p>Compliance: {formatNumber(extendedQuery.data?.complianceScore, '%')}</p>
            </div>
            {extendedQuery.data?.dataSignals ? (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--semantic-text-subtle)]">
                {Object.entries(extendedQuery.data.dataSignals).slice(0, 6).map(([key, value]) => (
                  <span key={key} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Permis</p>
            <p className="mt-2 text-lg font-semibold text-[var(--semantic-text)]">
              {permitsQuery.data?.length ?? 0} actifs
            </p>
            <div className="mt-2 space-y-2 text-xs text-[var(--semantic-text)]">
              {(permitsQuery.data ?? []).slice(0, 2).map((permit) => (
                <div key={permit.id} className="flex items-center justify-between gap-2">
                  <span>{permit.type}</span>
                  <span className="text-[var(--semantic-text-subtle)]">{permit.status ?? 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Marche</p>
            <div className="mt-2 space-y-2 text-xs">
              {(aggregateQuery.data ?? []).slice(0, 4).map((stat) => {
                const numericValue = typeof stat.value === 'number' ? stat.value : Number(stat.value);
                const displayValue = Number.isFinite(numericValue)
                  ? formatNumber(numericValue, stat.unit ? ` ${stat.unit}` : '')
                  : `${stat.value}${stat.unit ? ` ${stat.unit}` : ''}`;
                return (
                  <div key={stat.metric} className="flex items-center justify-between">
                    <span>{stat.metric}</span>
                    <span className="font-semibold text-[var(--semantic-text)]">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Sources</p>
              <p className="mt-2 text-lg font-semibold text-[var(--semantic-text)]">{sourcesQuery.data?.length ?? 0}</p>
              <div className="mt-2 space-y-1 text-xs text-[var(--semantic-text-subtle)]">
                {(sourcesQuery.data ?? []).slice(0, 3).map((source) => (
                  <div key={source.id} className="flex items-center justify-between gap-2">
                    <span>{source.name}</span>
                    <span>{source.status ?? 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Champs</p>
              <p className="mt-2 text-lg font-semibold text-[var(--semantic-text)]">{fieldsQuery.data?.length ?? 0}</p>
              <div className="mt-2 space-y-1 text-xs text-[var(--semantic-text-subtle)]">
                {(fieldsQuery.data ?? []).slice(0, 3).map((field) => (
                  <div key={field.id} className="flex items-center justify-between gap-2">
                    <span>{field.label}</span>
                    <span>{formatNumber(field.completeness ? Math.round(field.completeness * 100) : null, '%')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </V2Surface>
  );
}
