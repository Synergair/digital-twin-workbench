/**
 * Google Maps API Service
 * Provides geocoding, places search, and distance calculations
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
  distance?: number; // meters from search origin
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
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  mode: TravelMode;
}

export interface DirectionsResult {
  routes: {
    summary: string;
    legs: {
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      startAddress: string;
      endAddress: string;
      steps: {
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        instructions: string;
        travelMode: string;
      }[];
    }[];
    overview_polyline: string;
  }[];
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

// API request helper
async function fetchGoogleMapsApi<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`https://maps.googleapis.com/maps/api/${endpoint}/json`);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Maps API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return data;
}

// Geocoding: Address to Coordinates
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  interface GeocodingResponse {
    status: string;
    results: {
      formatted_address: string;
      geometry: {
        location: { lat: number; lng: number };
      };
      place_id: string;
      types: string[];
      address_components: {
        long_name: string;
        short_name: string;
        types: string[];
      }[];
    }[];
  }

  const data = await fetchGoogleMapsApi<GeocodingResponse>('geocode', { address });

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  return {
    address,
    formattedAddress: result.formatted_address,
    location: result.geometry.location,
    placeId: result.place_id,
    types: result.types,
    addressComponents: result.address_components,
  };
}

// Reverse Geocoding: Coordinates to Address
export async function reverseGeocode(location: LatLng): Promise<GeocodingResult | null> {
  interface GeocodingResponse {
    status: string;
    results: {
      formatted_address: string;
      geometry: {
        location: { lat: number; lng: number };
      };
      place_id: string;
      types: string[];
      address_components: {
        long_name: string;
        short_name: string;
        types: string[];
      }[];
    }[];
  }

  const data = await fetchGoogleMapsApi<GeocodingResponse>('geocode', {
    latlng: `${location.lat},${location.lng}`,
  });

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  return {
    address: result.formatted_address,
    formattedAddress: result.formatted_address,
    location: result.geometry.location,
    placeId: result.place_id,
    types: result.types,
    addressComponents: result.address_components,
  };
}

// Nearby Places Search
export async function searchNearbyPlaces(
  location: LatLng,
  options: {
    radius?: number; // meters, default 1000
    type?: PlaceType;
    keyword?: string;
    minPrice?: number;
    maxPrice?: number;
    openNow?: boolean;
  } = {}
): Promise<PlaceResult[]> {
  interface PlacesResponse {
    status: string;
    results: {
      place_id: string;
      name: string;
      vicinity: string;
      geometry: { location: { lat: number; lng: number } };
      types: string[];
      rating?: number;
      user_ratings_total?: number;
      price_level?: number;
      opening_hours?: { open_now: boolean };
      photos?: { photo_reference: string }[];
      icon?: string;
    }[];
  }

  const params: Record<string, string | number | undefined> = {
    location: `${location.lat},${location.lng}`,
    radius: options.radius || 1000,
    type: options.type,
    keyword: options.keyword,
    minprice: options.minPrice,
    maxprice: options.maxPrice,
    opennow: options.openNow ? 'true' : undefined,
  };

  const data = await fetchGoogleMapsApi<PlacesResponse>('place/nearbysearch', params);

  return (data.results || []).map((place) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.vicinity,
    location: place.geometry.location,
    types: place.types,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    priceLevel: place.price_level,
    openNow: place.opening_hours?.open_now,
    photos: place.photos?.map(
      (p) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
    ),
    icon: place.icon,
    distance: calculateDistance(location, place.geometry.location),
  }));
}

// Text Search for Places
export async function searchPlacesByText(
  query: string,
  options: {
    location?: LatLng;
    radius?: number;
    type?: PlaceType;
    minPrice?: number;
    maxPrice?: number;
    openNow?: boolean;
  } = {}
): Promise<PlaceResult[]> {
  interface PlacesResponse {
    status: string;
    results: {
      place_id: string;
      name: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      types: string[];
      rating?: number;
      user_ratings_total?: number;
      price_level?: number;
      opening_hours?: { open_now: boolean };
      photos?: { photo_reference: string }[];
      icon?: string;
    }[];
  }

  const params: Record<string, string | number | undefined> = {
    query,
    location: options.location ? `${options.location.lat},${options.location.lng}` : undefined,
    radius: options.radius,
    type: options.type,
    minprice: options.minPrice,
    maxprice: options.maxPrice,
    opennow: options.openNow ? 'true' : undefined,
  };

  const data = await fetchGoogleMapsApi<PlacesResponse>('place/textsearch', params);

  return (data.results || []).map((place) => ({
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    location: place.geometry.location,
    types: place.types,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    priceLevel: place.price_level,
    openNow: place.opening_hours?.open_now,
    photos: place.photos?.map(
      (p) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
    ),
    icon: place.icon,
    distance: options.location ? calculateDistance(options.location, place.geometry.location) : undefined,
  }));
}

// Place Details
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  interface PlaceDetailsResponse {
    status: string;
    result?: {
      place_id: string;
      name: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      types: string[];
      rating?: number;
      user_ratings_total?: number;
      price_level?: number;
      opening_hours?: {
        weekday_text: string[];
        open_now: boolean;
      };
      formatted_phone_number?: string;
      website?: string;
      url?: string;
      reviews?: {
        author_name: string;
        rating: number;
        text: string;
        time: number;
      }[];
      photos?: { photo_reference: string }[];
      icon?: string;
    };
  }

  const data = await fetchGoogleMapsApi<PlaceDetailsResponse>('place/details', {
    place_id: placeId,
    fields:
      'place_id,name,formatted_address,geometry,types,rating,user_ratings_total,price_level,opening_hours,formatted_phone_number,website,url,reviews,photos,icon',
  });

  if (!data.result) {
    return null;
  }

  const place = data.result;
  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address,
    location: place.geometry.location,
    types: place.types,
    rating: place.rating,
    userRatingsTotal: place.user_ratings_total,
    priceLevel: place.price_level,
    openNow: place.opening_hours?.open_now,
    photos: place.photos?.map(
      (p) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
    ),
    icon: place.icon,
    phoneNumber: place.formatted_phone_number,
    website: place.website,
    url: place.url,
    reviews: place.reviews?.map((r) => ({
      authorName: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.time,
    })),
    openingHours: place.opening_hours
      ? {
          weekdayText: place.opening_hours.weekday_text,
          isOpen: place.opening_hours.open_now,
        }
      : undefined,
  };
}

// Distance Matrix
export async function getDistanceMatrix(
  origins: LatLng[],
  destinations: LatLng[],
  mode: TravelMode = 'driving'
): Promise<DistanceResult[][]> {
  interface DistanceMatrixResponse {
    status: string;
    rows: {
      elements: {
        status: string;
        distance?: { text: string; value: number };
        duration?: { text: string; value: number };
      }[];
    }[];
  }

  const data = await fetchGoogleMapsApi<DistanceMatrixResponse>('distancematrix', {
    origins: origins.map((o) => `${o.lat},${o.lng}`).join('|'),
    destinations: destinations.map((d) => `${d.lat},${d.lng}`).join('|'),
    mode,
  });

  return data.rows.map((row, i) =>
    row.elements.map((element, j) => ({
      origin: origins[i],
      destination: destinations[j],
      distance: element.distance || { text: 'N/A', value: 0 },
      duration: element.duration || { text: 'N/A', value: 0 },
      mode,
    }))
  );
}

// Simple Distance Calculation (Haversine formula)
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
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
