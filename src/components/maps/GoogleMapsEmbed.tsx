import { useEffect, useRef, useState, useCallback } from 'react';
import { V2StatusPill } from '@/components/dashboard/v2/primitives';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: 'property' | 'poi' | 'alert' | 'sensor';
  info?: string;
}

interface GoogleMapsEmbedProps {
  apiKey?: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  showControls?: boolean;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const markerIcons: Record<NonNullable<MapMarker['type']>, { color: string; scale: number }> = {
  property: { color: '#0d7377', scale: 1.2 },
  poi: { color: '#6366f1', scale: 0.9 },
  alert: { color: '#ef4444', scale: 1.1 },
  sensor: { color: '#22c55e', scale: 0.8 },
};

export function GoogleMapsEmbed({
  apiKey = GOOGLE_MAPS_API_KEY,
  center,
  zoom = 15,
  markers = [],
  showControls = true,
  mapType = 'roadmap',
  className = '',
  onMarkerClick,
  onMapClick,
}: GoogleMapsEmbedProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: mapType,
      disableDefaultUI: !showControls,
      zoomControl: showControls,
      mapTypeControl: showControls,
      streetViewControl: false,
      fullscreenControl: showControls,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9f5f5' }],
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }],
        },
      ],
    });

    mapInstanceRef.current = map;

    if (onMapClick) {
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    return () => {
      // Clear markers on cleanup
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded, center.lat, center.lng, zoom, mapType, showControls, onMapClick]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const iconConfig = markerIcons[markerData.type || 'property'];

      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: iconConfig.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10 * iconConfig.scale,
        },
      });

      if (markerData.info || onMarkerClick) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <strong style="font-size: 14px;">${markerData.title}</strong>
              ${markerData.info ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${markerData.info}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          onMarkerClick?.(markerData);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  // Update center and zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setCenter(center);
    mapInstanceRef.current.setZoom(zoom);
  }, [center.lat, center.lng, zoom]);

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-6 ${className}`}>
        <div className="text-center">
          <V2StatusPill label="Map Unavailable" variant="warning" />
          <p className="mt-2 text-sm text-[var(--semantic-text-subtle)]">{error}</p>
          <p className="mt-1 text-xs text-[var(--semantic-text-subtle)]">
            Add VITE_GOOGLE_MAPS_API_KEY to your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[var(--semantic-border)] ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--panel-soft)]">
          <div className="text-center">
            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[var(--semantic-primary)] border-t-transparent" />
            <p className="text-sm text-[var(--semantic-text-subtle)]">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Static Map component for cases where interactive map is not needed
export function GoogleStaticMap({
  center,
  zoom = 15,
  markers = [],
  size = { width: 400, height: 200 },
  mapType = 'roadmap',
  className = '',
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  size?: { width: number; height: number };
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  className?: string;
}) {
  const apiKey = GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-[var(--semantic-border)] bg-gradient-to-br from-[#0d6b6b]/10 to-white p-4 ${className}`}>
        <div className="text-center text-sm text-[var(--semantic-text-subtle)]">
          <p>Map preview unavailable</p>
          <p className="text-xs mt-1">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</p>
        </div>
      </div>
    );
  }

  const markerParams = markers
    .map((m) => `markers=color:${markerIcons[m.type || 'property'].color.replace('#', '0x')}|${m.lat},${m.lng}`)
    .join('&');

  const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=${size.width}x${size.height}&maptype=${mapType}&${markerParams}&key=${apiKey}`;

  return (
    <img
      src={url}
      alt="Property location map"
      className={`rounded-2xl border border-[var(--semantic-border)] object-cover ${className}`}
      style={{ width: size.width, height: size.height }}
    />
  );
}
