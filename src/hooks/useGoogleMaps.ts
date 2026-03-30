/**
 * Google Maps React Hooks
 * Provides easy-to-use hooks for geocoding, places, and distance calculations
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import * as googleMapsApi from '@/lib/api/googleMaps';
import type { LatLng, PlaceType, PlaceCategory, TravelMode } from '@/lib/api/googleMaps';

// Re-export types and utilities for convenience
export type { LatLng, PlaceType, PlaceCategory, TravelMode } from '@/lib/api/googleMaps';
export { PLACE_CATEGORIES, formatDistance, formatDuration, calculateDistance } from '@/lib/api/googleMaps';

/**
 * Hook to geocode an address to coordinates
 */
export const useGeocode = (address: string | null | undefined) =>
  useQuery({
    queryKey: ['google-maps', 'geocode', address],
    queryFn: () => googleMapsApi.geocodeAddress(address!),
    enabled: Boolean(address),
    staleTime: 24 * 60 * 60_000, // Cache for 24 hours
  });

/**
 * Hook to reverse geocode coordinates to address
 */
export const useReverseGeocode = (location: LatLng | null | undefined) =>
  useQuery({
    queryKey: ['google-maps', 'reverse-geocode', location?.lat, location?.lng],
    queryFn: () => googleMapsApi.reverseGeocode(location!),
    enabled: Boolean(location?.lat && location?.lng),
    staleTime: 24 * 60 * 60_000,
  });

/**
 * Hook to search for nearby places
 */
export const useNearbyPlaces = (
  location: LatLng | null | undefined,
  options: {
    radius?: number;
    type?: PlaceType;
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    openNow?: boolean;
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true, ...searchOptions } = options;
  return useQuery({
    queryKey: ['google-maps', 'nearby', location?.lat, location?.lng, searchOptions],
    queryFn: () => googleMapsApi.searchNearbyPlaces(location!, searchOptions),
    enabled: Boolean(location?.lat && location?.lng) && enabled,
    staleTime: 5 * 60_000, // 5 minutes
  });
};

/**
 * Hook to search for places by category (multiple types)
 */
export const useNearbyPlacesByCategory = (
  location: LatLng | null | undefined,
  category: PlaceCategory | null | undefined,
  options: {
    radius?: number;
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true, radius = 1000 } = options;
  const categoryConfig = category ? googleMapsApi.PLACE_CATEGORIES[category] : null;

  return useQuery({
    queryKey: ['google-maps', 'nearby-category', location?.lat, location?.lng, category, radius],
    queryFn: async () => {
      if (!location || !categoryConfig) return [];
      // Fetch all types in category and merge results
      const results = await Promise.all(
        categoryConfig.types.map((type) =>
          googleMapsApi.searchNearbyPlaces(location, { radius, type })
        )
      );
      // Flatten, dedupe by placeId, and sort by distance
      const seen = new Set<string>();
      return results
        .flat()
        .filter((place) => {
          if (seen.has(place.placeId)) return false;
          seen.add(place.placeId);
          return true;
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    },
    enabled: Boolean(location?.lat && location?.lng && category) && enabled,
    staleTime: 5 * 60_000,
  });
};

/**
 * Hook to search places by text query
 */
export const usePlacesSearch = (
  query: string | null | undefined,
  options: {
    location?: LatLng;
    radius?: number;
    type?: PlaceType;
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true, ...searchOptions } = options;
  return useQuery({
    queryKey: ['google-maps', 'search', query, searchOptions],
    queryFn: () => googleMapsApi.searchPlacesByText(query!, searchOptions),
    enabled: Boolean(query) && enabled,
    staleTime: 5 * 60_000,
  });
};

/**
 * Hook to get place details
 */
export const usePlaceDetails = (placeId: string | null | undefined) =>
  useQuery({
    queryKey: ['google-maps', 'place-details', placeId],
    queryFn: () => googleMapsApi.getPlaceDetails(placeId!),
    enabled: Boolean(placeId),
    staleTime: 30 * 60_000, // 30 minutes
  });

/**
 * Hook to get distance between points
 */
export const useDistanceMatrix = (
  origins: LatLng[] | null | undefined,
  destinations: LatLng[] | null | undefined,
  mode: TravelMode = 'driving'
) =>
  useQuery({
    queryKey: ['google-maps', 'distance-matrix', origins, destinations, mode],
    queryFn: () => googleMapsApi.getDistanceMatrix(origins!, destinations!, mode),
    enabled: Boolean(origins?.length && destinations?.length),
    staleTime: 10 * 60_000,
  });

/**
 * Hook to get distance from one point to one destination
 */
export const useDistance = (
  origin: LatLng | null | undefined,
  destination: LatLng | null | undefined,
  mode: TravelMode = 'driving'
) =>
  useQuery({
    queryKey: ['google-maps', 'distance', origin, destination, mode],
    queryFn: async () => {
      const result = await googleMapsApi.getDistanceMatrix([origin!], [destination!], mode);
      return result[0]?.[0] ?? null;
    },
    enabled: Boolean(origin?.lat && origin?.lng && destination?.lat && destination?.lng),
    staleTime: 10 * 60_000,
  });

/**
 * Mutation hook for on-demand geocoding
 */
export const useGeocodeAddress = () =>
  useMutation({
    mutationFn: (address: string) => googleMapsApi.geocodeAddress(address),
  });

/**
 * Mutation hook for on-demand place search
 */
export const useSearchPlaces = () =>
  useMutation({
    mutationFn: ({
      query,
      options,
    }: {
      query: string;
      options?: Parameters<typeof googleMapsApi.searchPlacesByText>[1];
    }) => googleMapsApi.searchPlacesByText(query, options),
  });

/**
 * Hook for getting static map URL (computed, not a query)
 */
export const useStaticMapUrl = (
  center: LatLng | null | undefined,
  options: Parameters<typeof googleMapsApi.getStaticMapUrl>[1] = {}
): string | null => {
  if (!center) return null;
  return googleMapsApi.getStaticMapUrl(center, options);
};

/**
 * Hook for getting Street View URL (computed, not a query)
 */
export const useStreetViewUrl = (
  location: LatLng | null | undefined,
  options: Parameters<typeof googleMapsApi.getStreetViewUrl>[1] = {}
): string | null => {
  if (!location) return null;
  return googleMapsApi.getStreetViewUrl(location, options);
};

/**
 * Combined hook for property location data
 * Returns geocoded location and nearby places for a property address
 */
export const usePropertyLocationData = (
  address: string | null | undefined,
  options: {
    includeNearby?: boolean;
    nearbyRadius?: number;
    nearbyCategories?: PlaceCategory[];
  } = {}
) => {
  const { includeNearby = true, nearbyRadius = 1000, nearbyCategories = ['transit', 'shopping', 'dining'] } = options;

  const geocodeQuery = useGeocode(address);
  const location = geocodeQuery.data?.location ?? null;

  // Fetch nearby places for each category
  const nearbyQueries = nearbyCategories.map((category) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useNearbyPlacesByCategory(location, category, {
      radius: nearbyRadius,
      enabled: includeNearby && Boolean(location),
    })
  );

  const nearbyPlacesByCategory = nearbyCategories.reduce(
    (acc, category, index) => {
      acc[category] = nearbyQueries[index].data ?? [];
      return acc;
    },
    {} as Record<PlaceCategory, googleMapsApi.PlaceResult[]>
  );

  return {
    geocode: geocodeQuery,
    location,
    nearbyPlacesByCategory,
    isLoadingNearby: nearbyQueries.some((q) => q.isLoading),
    nearbyError: nearbyQueries.find((q) => q.error)?.error ?? null,
  };
};
