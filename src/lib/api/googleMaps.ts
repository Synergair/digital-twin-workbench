/**
 * Google Maps API Service
 * Uses the JavaScript API for Places (to avoid CORS issues with REST API)
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  formattedAddress: string;
  location: LatLng;
  placeId: string;
  types: string[];
  addressComponents: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  photos?: string[];
  icon?: string;
  distance?: number;
}

export interface PlaceDetails extends PlaceResult {
  phoneNumber?: string;
  website?: string;
  url?: string;
  reviews?: {
    authorName: string;
    rating: number;
    text: string;
    time: number;
  }[];
  openingHours?: {
    weekdayText: string[];
    isOpen: boolean;
  };
}

export interface DistanceResult {
  origin: LatLng;
  destination: LatLng;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  mode: TravelMode;
}

export type TravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export type PlaceType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'grocery_or_supermarket'
  | 'convenience_store'
  | 'pharmacy'
  | 'hospital'
  | 'doctor'
  | 'dentist'
  | 'bank'
  | 'atm'
  | 'school'
  | 'university'
  | 'library'
  | 'gym'
  | 'park'
  | 'bus_station'
  | 'subway_station'
  | 'train_station'
  | 'gas_station'
  | 'parking'
  | 'shopping_mall'
  | 'lodging'
  | 'movie_theater'
  | 'museum'
  | 'church'
  | 'synagogue'
  | 'mosque';

// Wait for Google Maps to be loaded
function waitForGoogleMaps(): Promise<typeof google.maps> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.maps) {
        clearInterval(interval);
        resolve(window.google.maps);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Google Maps failed to load'));
      }
    }, 100);
  });
}

// Create a hidden map element for PlacesService (required by Google)
let placesServiceElement: HTMLDivElement | null = null;
let placesService: google.maps.places.PlacesService | null = null;

async function getPlacesService(): Promise<google.maps.places.PlacesService> {
  await waitForGoogleMaps();

  if (placesService) {
    return placesService;
  }

  if (!placesServiceElement) {
    placesServiceElement = document.createElement('div');
    placesServiceElement.style.display = 'none';
    document.body.appendChild(placesServiceElement);
  }

  const map = new window.google.maps.Map(placesServiceElement, {
    center: { lat: 0, lng: 0 },
    zoom: 1,
  });

  placesService = new window.google.maps.places.PlacesService(map);
  return placesService;
}

// Simple Distance Calculation (Haversine formula)
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3;
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format duration for display
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Nearby Places Search using JavaScript API
export async function searchNearbyPlaces(
  location: LatLng,
  options: {
    radius?: number;
    type?: PlaceType;
    keyword?: string;
  } = {}
): Promise<PlaceResult[]> {
  const service = await getPlacesService();
  const maps = await waitForGoogleMaps();

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location: new maps.LatLng(location.lat, location.lng),
      radius: options.radius || 1000,
      type: options.type,
      keyword: options.keyword,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceResult[] = results.map((place) => ({
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.vicinity || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          types: place.types || [],
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.isOpen?.(),
          icon: place.icon,
          distance: calculateDistance(location, {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          }),
        }));

        // Sort by distance
        places.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        resolve(places);
      } else if (status === maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
}

// Text Search for Places
export async function searchPlacesByText(
  query: string,
  options: {
    location?: LatLng;
    radius?: number;
  } = {}
): Promise<PlaceResult[]> {
  const service = await getPlacesService();
  const maps = await waitForGoogleMaps();

  return new Promise((resolve, reject) => {
    const request: google.maps.places.TextSearchRequest = {
      query,
      location: options.location ? new maps.LatLng(options.location.lat, options.location.lng) : undefined,
      radius: options.radius,
    };

    service.textSearch(request, (results, status) => {
      if (status === maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceResult[] = results.map((place) => ({
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          types: place.types || [],
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.isOpen?.(),
          icon: place.icon,
          distance: options.location
            ? calculateDistance(options.location, {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              })
            : undefined,
        }));

        if (options.location) {
          places.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        resolve(places);
      } else if (status === maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Text search failed: ${status}`));
      }
    });
  });
}

// Place Details
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const service = await getPlacesService();
  const maps = await waitForGoogleMaps();

  return new Promise((resolve, reject) => {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'types',
        'rating',
        'user_ratings_total',
        'price_level',
        'opening_hours',
        'formatted_phone_number',
        'website',
        'url',
        'reviews',
        'icon',
      ],
    };

    service.getDetails(request, (place, status) => {
      if (status === maps.places.PlacesServiceStatus.OK && place) {
        resolve({
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          types: place.types || [],
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.isOpen?.(),
          icon: place.icon,
          phoneNumber: place.formatted_phone_number,
          website: place.website,
          url: place.url,
          reviews: place.reviews?.map((r) => ({
            authorName: r.author_name || '',
            rating: r.rating || 0,
            text: r.text || '',
            time: r.time || 0,
          })),
          openingHours: place.opening_hours
            ? {
                weekdayText: place.opening_hours.weekday_text || [],
                isOpen: place.opening_hours.isOpen?.() || false,
              }
            : undefined,
        });
      } else {
        resolve(null);
      }
    });
  });
}

// Geocoding using Geocoder service
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const maps = await waitForGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === maps.GeocoderStatus.OK && results && results[0]) {
        const result = results[0];
        resolve({
          address,
          formattedAddress: result.formatted_address,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          },
          placeId: result.place_id,
          types: result.types,
          addressComponents: result.address_components.map((c) => ({
            long_name: c.long_name,
            short_name: c.short_name,
            types: c.types,
          })),
        });
      } else if (status === maps.GeocoderStatus.ZERO_RESULTS) {
        resolve(null);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// Reverse Geocoding
export async function reverseGeocode(location: LatLng): Promise<GeocodingResult | null> {
  const maps = await waitForGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location }, (results, status) => {
      if (status === maps.GeocoderStatus.OK && results && results[0]) {
        const result = results[0];
        resolve({
          address: result.formatted_address,
          formattedAddress: result.formatted_address,
          location,
          placeId: result.place_id,
          types: result.types,
          addressComponents: result.address_components.map((c) => ({
            long_name: c.long_name,
            short_name: c.short_name,
            types: c.types,
          })),
        });
      } else if (status === maps.GeocoderStatus.ZERO_RESULTS) {
        resolve(null);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}

// Distance Matrix
export async function getDistanceMatrix(
  origins: LatLng[],
  destinations: LatLng[],
  mode: TravelMode = 'driving'
): Promise<DistanceResult[][]> {
  const maps = await waitForGoogleMaps();
  const service = new maps.DistanceMatrixService();

  const travelModeMap: Record<TravelMode, google.maps.TravelMode> = {
    driving: maps.TravelMode.DRIVING,
    walking: maps.TravelMode.WALKING,
    bicycling: maps.TravelMode.BICYCLING,
    transit: maps.TravelMode.TRANSIT,
  };

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: origins.map((o) => new maps.LatLng(o.lat, o.lng)),
        destinations: destinations.map((d) => new maps.LatLng(d.lat, d.lng)),
        travelMode: travelModeMap[mode],
      },
      (response, status) => {
        if (status === maps.DistanceMatrixStatus.OK && response) {
          const results: DistanceResult[][] = response.rows.map((row, i) =>
            row.elements.map((element, j) => ({
              origin: origins[i],
              destination: destinations[j],
              distance: element.distance || { text: 'N/A', value: 0 },
              duration: element.duration || { text: 'N/A', value: 0 },
              mode,
            }))
          );
          resolve(results);
        } else {
          reject(new Error(`Distance matrix failed: ${status}`));
        }
      }
    );
  });
}

// Get static map URL
export function getStaticMapUrl(
  center: LatLng,
  options: {
    zoom?: number;
    width?: number;
    height?: number;
    mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
    markers?: { location: LatLng; color?: string; label?: string }[];
  } = {}
): string {
  const { zoom = 15, width = 600, height = 400, mapType = 'roadmap', markers = [] } = options;

  const url = new URL('https://maps.googleapis.com/maps/api/staticmap');
  url.searchParams.set('center', `${center.lat},${center.lng}`);
  url.searchParams.set('zoom', String(zoom));
  url.searchParams.set('size', `${width}x${height}`);
  url.searchParams.set('maptype', mapType);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  markers.forEach((marker) => {
    const markerParams = [];
    if (marker.color) markerParams.push(`color:${marker.color}`);
    if (marker.label) markerParams.push(`label:${marker.label}`);
    markerParams.push(`${marker.location.lat},${marker.location.lng}`);
    url.searchParams.append('markers', markerParams.join('|'));
  });

  return url.toString();
}

// Get Street View URL
export function getStreetViewUrl(
  location: LatLng,
  options: {
    width?: number;
    height?: number;
    heading?: number;
    pitch?: number;
    fov?: number;
  } = {}
): string {
  const { width = 600, height = 400, heading = 0, pitch = 0, fov = 90 } = options;

  const url = new URL('https://maps.googleapis.com/maps/api/streetview');
  url.searchParams.set('location', `${location.lat},${location.lng}`);
  url.searchParams.set('size', `${width}x${height}`);
  url.searchParams.set('heading', String(heading));
  url.searchParams.set('pitch', String(pitch));
  url.searchParams.set('fov', String(fov));
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  return url.toString();
}

// Category constants for UI
export const PLACE_CATEGORIES = {
  dining: {
    label: 'Restaurants & Cafes',
    types: ['restaurant', 'cafe', 'bar'] as PlaceType[],
    icon: '🍽️',
  },
  shopping: {
    label: 'Shopping',
    types: ['grocery_or_supermarket', 'convenience_store', 'shopping_mall'] as PlaceType[],
    icon: '🛒',
  },
  health: {
    label: 'Health & Medical',
    types: ['hospital', 'pharmacy', 'doctor', 'dentist'] as PlaceType[],
    icon: '🏥',
  },
  finance: {
    label: 'Banks & ATMs',
    types: ['bank', 'atm'] as PlaceType[],
    icon: '🏦',
  },
  education: {
    label: 'Education',
    types: ['school', 'university', 'library'] as PlaceType[],
    icon: '🎓',
  },
  fitness: {
    label: 'Fitness & Parks',
    types: ['gym', 'park'] as PlaceType[],
    icon: '🏋️',
  },
  transit: {
    label: 'Transit',
    types: ['bus_station', 'subway_station', 'train_station'] as PlaceType[],
    icon: '🚇',
  },
  parking: {
    label: 'Parking & Gas',
    types: ['parking', 'gas_station'] as PlaceType[],
    icon: '🅿️',
  },
} as const;

export type PlaceCategory = keyof typeof PLACE_CATEGORIES;
