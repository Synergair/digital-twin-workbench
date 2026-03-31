import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid3X3, List, Building2, MapPin, X, ChevronRight, AlertTriangle, Camera, CheckCircle } from 'lucide-react';
import { useMapNavigationStore, type BuildingFootprint, type ViewHierarchyLevel } from '@/features/map-navigation/store/mapNavigationStore';
import { PortfolioMapView } from '@/features/map-navigation/components/PortfolioMapView';
import { TransitionAnimator } from '@/features/map-navigation/components/TransitionAnimator';

// Mock portfolio data - would come from API
const mockPortfolio: BuildingFootprint[] = [
  {
    propertyId: 'prop-single-family',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.5673, 45.5017],
        [-73.5671, 45.5017],
        [-73.5671, 45.5015],
        [-73.5673, 45.5015],
        [-73.5673, 45.5017],
      ]],
    },
    centroid: { lat: 45.5016, lng: -73.5672 },
    status: 'has-twin',
    metadata: {
      address: '123 Rue Principale, Montreal',
      floors: 4,
      totalUnits: 12,
      alertCount: 3,
      urgentAlertCount: 1,
    },
  },
  {
    propertyId: 'prop-multi-family',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.5683, 45.5027],
        [-73.5681, 45.5027],
        [-73.5681, 45.5025],
        [-73.5683, 45.5025],
        [-73.5683, 45.5027],
      ]],
    },
    centroid: { lat: 45.5026, lng: -73.5682 },
    status: 'needs-capture',
    metadata: {
      address: '456 Ave du Parc, Montreal',
      floors: 6,
      totalUnits: 24,
      alertCount: 0,
      urgentAlertCount: 0,
    },
  },
  {
    propertyId: 'prop-commercial',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.5693, 45.5037],
        [-73.5691, 45.5037],
        [-73.5691, 45.5035],
        [-73.5693, 45.5035],
        [-73.5693, 45.5037],
      ]],
    },
    centroid: { lat: 45.5036, lng: -73.5692 },
    status: 'has-alerts',
    metadata: {
      address: '789 Blvd St-Laurent, Montreal',
      floors: 8,
      totalUnits: 32,
      alertCount: 7,
      urgentAlertCount: 3,
    },
  },
  {
    propertyId: 'prop-processing',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-73.5703, 45.5047],
        [-73.5701, 45.5047],
        [-73.5701, 45.5045],
        [-73.5703, 45.5045],
        [-73.5703, 45.5047],
      ]],
    },
    centroid: { lat: 45.5046, lng: -73.5702 },
    status: 'processing',
    metadata: {
      address: '101 Rue Ontario, Montreal',
      floors: 5,
      totalUnits: 20,
      alertCount: 0,
      urgentAlertCount: 0,
    },
  },
];

const statusStyles = {
  'has-twin': { color: '#10b981', icon: CheckCircle, label: 'Active Twin' },
  'needs-capture': { color: '#f59e0b', icon: Camera, label: 'Needs Capture' },
  'has-alerts': { color: '#ef4444', icon: AlertTriangle, label: 'Has Alerts' },
  'processing': { color: '#6366f1', icon: Building2, label: 'Processing' },
};

type ViewMode = 'map' | 'grid' | 'list';

export function MapExplorerPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<BuildingFootprint | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<{ lat: number; lng: number } | null>(null);

  const {
    viewHierarchy,
    setViewHierarchy,
    selectedPropertyId,
    setSelectedProperty: setSelectedPropertyInStore,
  } = useMapNavigationStore();

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return mockPortfolio;
    const query = searchQuery.toLowerCase();
    return mockPortfolio.filter(
      (prop) =>
        prop.metadata.address.toLowerCase().includes(query) ||
        prop.propertyId.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: mockPortfolio.length,
    hasTwin: mockPortfolio.filter((p) => p.status === 'has-twin').length,
    needsCapture: mockPortfolio.filter((p) => p.status === 'needs-capture').length,
    hasAlerts: mockPortfolio.filter((p) => p.status === 'has-alerts').length,
    totalUnits: mockPortfolio.reduce((sum, p) => sum + p.metadata.totalUnits, 0),
    totalAlerts: mockPortfolio.reduce((sum, p) => sum + p.metadata.alertCount, 0),
  }), []);

  const handlePropertySelect = useCallback((propertyId: string) => {
    const property = mockPortfolio.find((p) => p.propertyId === propertyId);
    if (property) {
      setSelectedProperty(property);
      setSelectedPropertyInStore(propertyId);
    }
  }, [setSelectedPropertyInStore]);

  const handlePropertyHover = useCallback((propertyId: string | null) => {
    // Handle hover state if needed
  }, []);

  const handleDiveIntoBuilding = useCallback((property: BuildingFootprint) => {
    setTransitionTarget(property.centroid);
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    if (selectedProperty) {
      navigate(`/owner/properties/${selectedProperty.propertyId}/digital-twin?shell=true`);
    }
  }, [navigate, selectedProperty]);

  const handleAddProperty = useCallback(() => {
    setShowAddModal(true);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Portfolio</h1>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>{stats.total} Properties</span>
            <span className="text-white/30">•</span>
            <span>{stats.totalUnits} Units</span>
            {stats.totalAlerts > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-rose-400">{stats.totalAlerts} Alerts</span>
              </>
            )}
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-white/5 p-0.5">
            {[
              { mode: 'map' as ViewMode, icon: MapPin, label: 'Map' },
              { mode: 'grid' as ViewMode, icon: Grid3X3, label: 'Grid' },
              { mode: 'list' as ViewMode, icon: List, label: 'List' },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-teal-600 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Add Property Button */}
          <button
            type="button"
            onClick={handleAddProperty}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            <Plus className="h-4 w-4" />
            Add Building
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map View */}
        {viewMode === 'map' && (
          <div className="relative flex-1">
            <PortfolioMapView
              properties={filteredProperties}
              onPropertySelect={handlePropertySelect}
              onPropertyHover={handlePropertyHover}
            />

            {/* Property Detail Card (slides in from right when selected) */}
            {selectedProperty && (
              <PropertyDetailCard
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
                onDiveIn={() => handleDiveIntoBuilding(selectedProperty)}
              />
            )}

            {/* Transition Animation Overlay */}
            {isTransitioning && transitionTarget && (
              <TransitionAnimator
                targetCoords={transitionTarget}
                onComplete={handleTransitionComplete}
              />
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.propertyId}
                  property={property}
                  isSelected={selectedPropertyId === property.propertyId}
                  onClick={() => handlePropertySelect(property.propertyId)}
                  onDiveIn={() => handleDiveIntoBuilding(property)}
                />
              ))}

              {/* Add New Property Card */}
              <button
                type="button"
                onClick={handleAddProperty}
                className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-white/40 transition-all hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-400"
              >
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add Building</span>
              </button>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-2">
              {filteredProperties.map((property) => (
                <PropertyListItem
                  key={property.propertyId}
                  property={property}
                  isSelected={selectedPropertyId === property.propertyId}
                  onClick={() => handlePropertySelect(property.propertyId)}
                  onDiveIn={() => handleDiveIntoBuilding(property)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {showAddModal && (
        <AddPropertyModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

// Property Detail Card Component
function PropertyDetailCard({
  property,
  onClose,
  onDiveIn,
}: {
  property: BuildingFootprint;
  onClose: () => void;
  onDiveIn: () => void;
}) {
  const style = statusStyles[property.status];
  const Icon = style.icon;

  return (
    <div className="absolute bottom-4 right-4 z-30 w-80 rounded-2xl border border-white/10 bg-slate-800/95 p-4 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${style.color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: style.color }} />
          </div>
          <div>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${style.color}20`, color: style.color }}
            >
              {style.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-3 font-semibold text-white">{property.metadata.address}</h3>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-xs text-white/50">Floors</p>
          <p className="text-lg font-semibold text-white">{property.metadata.floors}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5">
          <p className="text-xs text-white/50">Units</p>
          <p className="text-lg font-semibold text-white">{property.metadata.totalUnits}</p>
        </div>
      </div>

      {property.metadata.alertCount > 0 && (
        <div className="mt-3 rounded-lg bg-rose-500/10 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400">Active Alerts</span>
            <span className="text-lg font-semibold text-rose-400">{property.metadata.alertCount}</span>
          </div>
          {property.metadata.urgentAlertCount > 0 && (
            <p className="mt-1 text-xs text-rose-300">
              {property.metadata.urgentAlertCount} urgent
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onDiveIn}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500"
      >
        Enter Building
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Property Card Component (Grid View)
function PropertyCard({
  property,
  isSelected,
  onClick,
  onDiveIn,
}: {
  property: BuildingFootprint;
  isSelected: boolean;
  onClick: () => void;
  onDiveIn: () => void;
}) {
  const style = statusStyles[property.status];
  const Icon = style.icon;

  return (
    <div
      className={`group cursor-pointer rounded-xl border bg-slate-800/80 p-4 transition-all hover:border-teal-500/40 hover:bg-slate-800 ${
        isSelected ? 'border-teal-500' : 'border-white/10'
      }`}
      onClick={onClick}
    >
      {/* Thumbnail placeholder */}
      <div className="relative mb-3 h-32 overflow-hidden rounded-lg bg-slate-700/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="h-12 w-12 text-white/20" />
        </div>
        <div className="absolute right-2 top-2">
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${style.color}20`, color: style.color }}
          >
            <Icon className="h-3 w-3" />
            {style.label}
          </span>
        </div>
      </div>

      <h3 className="truncate font-medium text-white">{property.metadata.address}</h3>

      <div className="mt-2 flex items-center gap-4 text-xs text-white/60">
        <span>{property.metadata.floors} floors</span>
        <span>{property.metadata.totalUnits} units</span>
      </div>

      {property.metadata.alertCount > 0 && (
        <p className="mt-2 text-xs text-rose-400">
          {property.metadata.alertCount} active alerts
        </p>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDiveIn();
        }}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-teal-600/20 py-2 text-xs font-medium text-teal-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-teal-600 hover:text-white"
      >
        Enter Building
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// Property List Item Component (List View)
function PropertyListItem({
  property,
  isSelected,
  onClick,
  onDiveIn,
}: {
  property: BuildingFootprint;
  isSelected: boolean;
  onClick: () => void;
  onDiveIn: () => void;
}) {
  const style = statusStyles[property.status];
  const Icon = style.icon;

  return (
    <div
      className={`flex cursor-pointer items-center justify-between rounded-xl border bg-slate-800/80 p-4 transition-all hover:border-teal-500/40 hover:bg-slate-800 ${
        isSelected ? 'border-teal-500' : 'border-white/10'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${style.color}20` }}
        >
          <Icon className="h-6 w-6" style={{ color: style.color }} />
        </div>

        <div>
          <h3 className="font-medium text-white">{property.metadata.address}</h3>
          <div className="mt-1 flex items-center gap-4 text-xs text-white/60">
            <span>{property.metadata.floors} floors</span>
            <span>{property.metadata.totalUnits} units</span>
            <span
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${style.color}20`, color: style.color }}
            >
              {style.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {property.metadata.alertCount > 0 && (
          <div className="text-right">
            <p className="text-lg font-semibold text-rose-400">{property.metadata.alertCount}</p>
            <p className="text-xs text-white/50">alerts</p>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDiveIn();
          }}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500"
        >
          Enter
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Add Property Modal
function AddPropertyModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'search' | 'details' | 'capture'>('search');
  const [address, setAddress] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add New Building</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/60">Property Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Enter address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">
                  Search for a property by address. We'll find the building footprint and help you set up its digital twin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={!address.trim()}
                className="w-full rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Find Property
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-teal-500/10 p-4">
                <p className="font-medium text-teal-400">{address}</p>
                <p className="mt-1 text-sm text-white/60">Property found on map</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-white/60">Floors</label>
                  <input
                    type="number"
                    placeholder="4"
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/60">Units</label>
                  <input
                    type="number"
                    placeholder="12"
                    className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('capture')}
                  className="flex-1 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'capture' && (
            <div className="space-y-4">
              <p className="text-center text-white/60">
                Would you like to capture this building now or add it and capture later?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/10 bg-white/5 py-4 text-center transition-colors hover:bg-white/10"
                >
                  <Building2 className="mx-auto h-8 w-8 text-white/40" />
                  <p className="mt-2 font-medium text-white">Add Only</p>
                  <p className="mt-1 text-xs text-white/50">Capture later</p>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-teal-500/30 bg-teal-500/10 py-4 text-center transition-colors hover:bg-teal-500/20"
                >
                  <Camera className="mx-auto h-8 w-8 text-teal-400" />
                  <p className="mt-2 font-medium text-white">Add & Capture</p>
                  <p className="mt-1 text-xs text-teal-400">Start capture wizard</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapExplorerPage;
