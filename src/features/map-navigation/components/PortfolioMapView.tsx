import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Building2, AlertTriangle, Camera, CheckCircle, Loader2 } from 'lucide-react';
import Supercluster from 'supercluster';
import { useMapNavigationStore, type BuildingFootprint, type LatLng } from '../store/mapNavigationStore';

interface PortfolioMapViewProps {
  properties: BuildingFootprint[];
  onPropertySelect: (propertyId: string) => void;
  onPropertyHover: (propertyId: string | null) => void;
  mapApiKey?: string;
}

type ClusterProperties = {
  cluster: boolean;
  cluster_id?: number;
  point_count?: number;
  point_count_abbreviated?: string;
  propertyId?: string;
  status?: BuildingFootprint['status'];
};

type GeoJSONFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>;

const statusStyles = {
  'has-twin': { color: '#10b981', icon: CheckCircle, label: 'Jumeau actif' },
  'needs-capture': { color: '#f59e0b', icon: Camera, label: 'À capturer' },
  'has-alerts': { color: '#ef4444', icon: AlertTriangle, label: 'Alertes' },
  'processing': { color: '#6366f1', icon: Loader2, label: 'Traitement' },
  'default': { color: '#64748b', icon: Building2, label: 'Propriété' },
};

/**
 * PortfolioMapView - Displays all properties on an interactive map
 *
 * Features:
 * - Property clustering at low zoom levels
 * - Building footprints at high zoom
 * - Status-based coloring
 * - Click to select, hover for preview
 */
export function PortfolioMapView({
  properties,
  onPropertySelect,
  onPropertyHover,
  mapApiKey,
}: PortfolioMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());

  const {
    portfolioCenter,
    portfolioZoom,
    selectedPropertyId,
    hoveredPropertyId,
    clusteringEnabled,
    footprintVisibility,
    setPortfolioCenter,
    setPortfolioZoom,
    setSelectedProperty,
    setHoveredProperty,
  } = useMapNavigationStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(portfolioZoom);

  // Initialize Supercluster for property clustering
  const cluster = useMemo(() => {
    const sc = new Supercluster<ClusterProperties>({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
    });

    // Convert properties to GeoJSON points
    const points: GeoJSONFeature[] = properties.map((prop) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [prop.centroid.lng, prop.centroid.lat],
      },
      properties: {
        cluster: false,
        propertyId: prop.propertyId,
        status: prop.status,
      },
    }));

    sc.load(points);
    return sc;
  }, [properties]);

  // Filter properties based on visibility settings
  const visibleProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (footprintVisibility.showAll) return true;
      if (footprintVisibility.showHasTwin && prop.status === 'has-twin') return true;
      if (footprintVisibility.showNeedsCapture && prop.status === 'needs-capture') return true;
      if (footprintVisibility.showAlerts && prop.status === 'has-alerts') return true;
      return false;
    });
  }, [properties, footprintVisibility]);

  // Get clusters for current viewport
  const getClusters = useCallback((bounds: google.maps.LatLngBounds, zoom: number) => {
    const bbox: [number, number, number, number] = [
      bounds.getSouthWest().lng(),
      bounds.getSouthWest().lat(),
      bounds.getNorthEast().lng(),
      bounds.getNorthEast().lat(),
    ];

    return cluster.getClusters(bbox, Math.floor(zoom));
  }, [cluster]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps not loaded');
      return;
    }

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: portfolioCenter.lat, lng: portfolioCenter.lng },
      zoom: portfolioZoom,
      mapTypeId: 'satellite',
      tilt: 0,
      styles: [
        { elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapRef.current = map;
    setMapLoaded(true);

    // Event listeners
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom() || portfolioZoom;
      setCurrentZoom(zoom);
      setPortfolioZoom(zoom);
    });

    map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        setPortfolioCenter({ lat: center.lat(), lng: center.lng() });
      }
    });

    map.addListener('idle', () => {
      updateMarkers();
    });
  }, [portfolioCenter, portfolioZoom]);

  // Update markers based on zoom level and clustering
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const bounds = map.getBounds();
    const zoom = map.getZoom() || portfolioZoom;

    if (!bounds) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    // Clear existing polygons
    polygonsRef.current.forEach((polygon) => polygon.setMap(null));
    polygonsRef.current.clear();

    // High zoom: show building footprints
    if (zoom >= 17) {
      visibleProperties.forEach((prop) => {
        const polygon = new google.maps.Polygon({
          paths: prop.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng })),
          strokeColor: statusStyles[prop.status]?.color || statusStyles.default.color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: statusStyles[prop.status]?.color || statusStyles.default.color,
          fillOpacity: selectedPropertyId === prop.propertyId ? 0.5 : 0.3,
          map,
        });

        polygon.addListener('click', () => {
          setSelectedProperty(prop.propertyId);
          onPropertySelect(prop.propertyId);
        });

        polygon.addListener('mouseover', () => {
          setHoveredProperty(prop.propertyId);
          onPropertyHover(prop.propertyId);
          polygon.setOptions({ fillOpacity: 0.5 });
        });

        polygon.addListener('mouseout', () => {
          setHoveredProperty(null);
          onPropertyHover(null);
          polygon.setOptions({ fillOpacity: selectedPropertyId === prop.propertyId ? 0.5 : 0.3 });
        });

        polygonsRef.current.set(prop.propertyId, polygon);
      });
    } else if (clusteringEnabled && zoom < 14) {
      // Low zoom: show clusters
      const clusters = getClusters(bounds, zoom);

      clusters.forEach((clusterFeature, index) => {
        const [lng, lat] = clusterFeature.geometry.coordinates;

        if (clusterFeature.properties.cluster) {
          // Cluster marker
          const count = clusterFeature.properties.point_count || 0;
          const size = Math.min(60, 30 + Math.log2(count) * 10);

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: size / 2,
              fillColor: '#0d9488',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            label: {
              text: String(clusterFeature.properties.point_count_abbreviated || count),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            },
          });

          marker.addListener('click', () => {
            const expansionZoom = cluster.getClusterExpansionZoom(clusterFeature.properties.cluster_id!);
            map.setZoom(expansionZoom);
            map.setCenter({ lat, lng });
          });

          markersRef.current.set(`cluster-${index}`, marker);
        } else {
          // Individual property marker
          const prop = properties.find((p) => p.propertyId === clusterFeature.properties.propertyId);
          if (!prop) return;

          const status = prop.status;
          const style = statusStyles[status] || statusStyles.default;

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: selectedPropertyId === prop.propertyId ? 12 : 8,
              fillColor: style.color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            setSelectedProperty(prop.propertyId);
            onPropertySelect(prop.propertyId);
          });

          marker.addListener('mouseover', () => {
            setHoveredProperty(prop.propertyId);
            onPropertyHover(prop.propertyId);
          });

          marker.addListener('mouseout', () => {
            setHoveredProperty(null);
            onPropertyHover(null);
          });

          markersRef.current.set(prop.propertyId, marker);
        }
      });
    } else {
      // Medium zoom: individual markers
      visibleProperties.forEach((prop) => {
        const style = statusStyles[prop.status] || statusStyles.default;

        const marker = new google.maps.Marker({
          position: { lat: prop.centroid.lat, lng: prop.centroid.lng },
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: selectedPropertyId === prop.propertyId ? 12 : 8,
            fillColor: style.color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        marker.addListener('click', () => {
          setSelectedProperty(prop.propertyId);
          onPropertySelect(prop.propertyId);
        });

        marker.addListener('mouseover', () => {
          setHoveredProperty(prop.propertyId);
          onPropertyHover(prop.propertyId);
        });

        marker.addListener('mouseout', () => {
          setHoveredProperty(null);
          onPropertyHover(null);
        });

        markersRef.current.set(prop.propertyId, marker);
      });
    }
  }, [mapLoaded, visibleProperties, clusteringEnabled, selectedPropertyId, getClusters, cluster, properties]);

  // Update markers when dependencies change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-slate-800/90 p-3 shadow-lg backdrop-blur-sm">
        <p className="mb-2 text-xs font-medium text-white/60">Légende</p>
        <div className="space-y-1.5">
          {Object.entries(statusStyles).map(([key, style]) => {
            if (key === 'default') return null;
            const Icon = style.icon;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <Icon className="h-3.5 w-3.5" style={{ color: style.color }} />
                <span className="text-white/80">{style.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 z-10 rounded-lg bg-slate-800/90 px-3 py-1.5 text-xs text-white/60 shadow-lg backdrop-blur-sm">
        Zoom: {currentZoom.toFixed(0)}
      </div>

      {/* Hovered property info */}
      {hoveredPropertyId && (
        <HoveredPropertyCard
          property={properties.find((p) => p.propertyId === hoveredPropertyId) || null}
        />
      )}
    </div>
  );
}

function HoveredPropertyCard({ property }: { property: BuildingFootprint | null }) {
  if (!property) return null;

  const style = statusStyles[property.status] || statusStyles.default;
  const Icon = style.icon;

  return (
    <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-xl bg-slate-800/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${style.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: style.color }} />
        </div>
        <div>
          <p className="font-medium text-white">{property.metadata.address}</p>
          <p className="mt-0.5 text-xs text-white/60">
            {property.metadata.floors} étages • {property.metadata.totalUnits} unités
          </p>
          {property.metadata.alertCount > 0 && (
            <p className="mt-1 text-xs text-rose-400">
              {property.metadata.urgentAlertCount > 0 && `${property.metadata.urgentAlertCount} urgentes, `}
              {property.metadata.alertCount} alertes totales
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PortfolioMapView;
