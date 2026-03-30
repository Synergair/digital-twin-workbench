/**
 * NearbyPlaces Component
 * Displays nearby points of interest around a property location
 */

import { useState } from 'react';
import { V2StatusPill } from '@/components/dashboard/v2/primitives';
import {
  useNearbyPlacesByCategory,
  PLACE_CATEGORIES,
  formatDistance,
  type LatLng,
  type PlaceCategory,
} from '@/hooks/useGoogleMaps';
import type { PlaceResult } from '@/lib/api/googleMaps';

interface NearbyPlacesProps {
  location: LatLng | null;
  radius?: number;
  defaultCategory?: PlaceCategory;
  className?: string;
  onPlaceSelect?: (place: PlaceResult) => void;
}

const categoryOrder: PlaceCategory[] = ['transit', 'shopping', 'dining', 'health', 'education', 'fitness', 'finance', 'parking'];

export function NearbyPlaces({
  location,
  radius = 1000,
  defaultCategory = 'transit',
  className = '',
  onPlaceSelect,
}: NearbyPlacesProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(defaultCategory);

  const { data: places, isLoading, error } = useNearbyPlacesByCategory(location, selectedCategory, { radius });

  if (!location) {
    return (
      <div className={`rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 ${className}`}>
        <p className="text-xs text-[var(--semantic-text-subtle)]">Location required for nearby places</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Proximite</p>
        <span className="text-[10px] text-[var(--semantic-text-subtle)]">{formatDistance(radius)}</span>
      </div>

      {/* Category tabs */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {categoryOrder.map((category) => {
          const config = PLACE_CATEGORIES[category];
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-[var(--semantic-primary)] text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Places list */}
      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--semantic-primary)] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-2 text-center">
            <V2StatusPill label="Error loading places" variant="danger" />
          </div>
        ) : places && places.length > 0 ? (
          places.slice(0, 5).map((place) => (
            <PlaceItem key={place.placeId} place={place} onClick={onPlaceSelect} />
          ))
        ) : (
          <p className="py-2 text-center text-xs text-[var(--semantic-text-subtle)]">
            Aucun etablissement trouve dans un rayon de {formatDistance(radius)}
          </p>
        )}
      </div>

      {places && places.length > 5 && (
        <p className="mt-2 text-center text-[10px] text-[var(--semantic-text-subtle)]">
          +{places.length - 5} autres etablissements
        </p>
      )}
    </div>
  );
}

function PlaceItem({ place, onClick }: { place: PlaceResult; onClick?: (place: PlaceResult) => void }) {
  return (
    <button
      onClick={() => onClick?.(place)}
      className="flex w-full items-start gap-2.5 rounded-lg bg-white/60 p-2 text-left transition-all hover:bg-white hover:shadow-sm"
    >
      {place.icon && (
        <img src={place.icon} alt="" className="mt-0.5 h-4 w-4 opacity-70" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[var(--semantic-text)]">{place.name}</p>
        <p className="truncate text-[10px] text-[var(--semantic-text-subtle)]">{place.address}</p>
        <div className="mt-1 flex items-center gap-2">
          {place.distance !== undefined && (
            <span className="text-[10px] text-[var(--semantic-text-subtle)]">
              {formatDistance(place.distance)}
            </span>
          )}
          {place.rating && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {place.rating.toFixed(1)}
              {place.userRatingsTotal && (
                <span className="text-gray-400">({place.userRatingsTotal})</span>
              )}
            </span>
          )}
          {place.openNow !== undefined && (
            <V2StatusPill
              label={place.openNow ? 'Ouvert' : 'Ferme'}
              variant={place.openNow ? 'success' : 'warning'}
            />
          )}
        </div>
      </div>
    </button>
  );
}

// Compact version for inline display
export function NearbyPlacesCompact({
  location,
  radius = 500,
  categories = ['transit', 'shopping'],
  className = '',
}: {
  location: LatLng | null;
  radius?: number;
  categories?: PlaceCategory[];
  className?: string;
}) {
  const results = categories.map((category) => ({
    category,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useNearbyPlacesByCategory(location, category, { radius }),
  }));

  const isLoading = results.some((r) => r.query.isLoading);

  if (!location || isLoading) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {results.map(({ category, query }) => {
        const config = PLACE_CATEGORIES[category];
        const count = query.data?.length ?? 0;
        const nearest = query.data?.[0];
        return (
          <div
            key={category}
            className="flex items-center gap-1.5 rounded-full border border-[var(--semantic-border)] bg-white/80 px-2 py-1"
          >
            <span className="text-sm">{config.icon}</span>
            <span className="text-[10px] font-medium text-[var(--semantic-text)]">{count}</span>
            {nearest?.distance !== undefined && (
              <span className="text-[10px] text-[var(--semantic-text-subtle)]">
                · {formatDistance(nearest.distance)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
