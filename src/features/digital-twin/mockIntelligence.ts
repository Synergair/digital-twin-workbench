import type {
  AggregateStat,
  AvmResult,
  DataSource,
  FieldDefinition,
  IntelligenceProperty,
  NeighborhoodResult,
  PermitRecord,
  PredictionResult,
  PropertyExtended,
} from '@/lib/api/intelligence';

const nowIso = () => new Date().toISOString();

const daysAgo = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString();
};

const baseCoords = {
  Montreal: { lat: 45.5017, lng: -73.5673 },
  Toronto: { lat: 43.6532, lng: -79.3832 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
  Calgary: { lat: 51.0447, lng: -114.0719 },
};

const pickCoord = (city: string) => {
  const coords = baseCoords[city as keyof typeof baseCoords] ?? baseCoords.Montreal;
  return {
    lat: coords.lat + (Math.random() - 0.5) * 0.03,
    lng: coords.lng + (Math.random() - 0.5) * 0.03,
  };
};

const dataSources: DataSource[] = [
  { id: 'montreal_opendata', name: 'Montreal Open Data', category: 'Permits', status: 'active', lastSync: daysAgo(2) },
  { id: 'toronto_opendata', name: 'Toronto Open Data', category: 'Permits', status: 'active', lastSync: daysAgo(4) },
  { id: 'vancouver_opendata', name: 'Vancouver Open Data', category: 'Permits', status: 'active', lastSync: daysAgo(5) },
  { id: 'cmhc_schl', name: 'CMHC Housing Data', category: 'Market', status: 'active', lastSync: daysAgo(8) },
  { id: 'statcan_census', name: 'StatCan Census', category: 'Demographics', status: 'active', lastSync: daysAgo(14) },
  { id: 'quebec_evaluation', name: 'Quebec Assessment', category: 'Valuation', status: 'active', lastSync: daysAgo(6) },
];

const fieldDefinitions: FieldDefinition[] = [
  { id: 'year_built', label: 'Annee de construction', category: 'Core', completeness: 0.92 },
  { id: 'floors', label: 'Nombre d etages', category: 'Structure', completeness: 0.88 },
  { id: 'beds', label: 'Chambres', category: 'Residential', completeness: 0.78 },
  { id: 'baths', label: 'Salles de bain', category: 'Residential', completeness: 0.75 },
  { id: 'square_feet', label: 'Surface', category: 'Core', completeness: 0.83 },
  { id: 'energy_class', label: 'Efficacite energetique', category: 'Sustainability', completeness: 0.61 },
  { id: 'zoning', label: 'Zonage', category: 'Municipal', completeness: 0.71 },
  { id: 'permit_count', label: 'Historique de permis', category: 'Permits', completeness: 0.67 },
  { id: 'transaction_history', label: 'Transactions', category: 'Finance', completeness: 0.58 },
  { id: 'insurance', label: 'Assurances', category: 'Risk', completeness: 0.54 },
  { id: 'lease_roll', label: 'Leasing', category: 'Operations', completeness: 0.49 },
  { id: 'carbon_offsets', label: 'Carbone', category: 'ESG', completeness: 0.42 },
  { id: 'maintenance', label: 'Maintenance', category: 'Operations', completeness: 0.73 },
  { id: 'tenant_behavior', label: 'Comportements locataires', category: 'Analytics', completeness: 0.36 },
  { id: 'financing', label: 'Financement', category: 'Finance', completeness: 0.47 },
  { id: 'inspection_docs', label: 'Inspections', category: 'Compliance', completeness: 0.66 },
  { id: 'iot_sensors', label: 'Capteurs IoT', category: 'Operations', completeness: 0.51 },
];

export function buildMockSearchResults(input: {
  query: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  mockContext?: {
    propertyId: string;
    propertyType?: string | null;
    yearBuilt?: number | null;
    beds?: number | null;
    baths?: number | null;
    squareFeet?: number | null;
  };
}): IntelligenceProperty[] {
  const city = input.city ?? 'Montreal';
  const province = input.province ?? 'QC';
  const address = input.address ?? input.query ?? '1242 Rue Saint-Urbain';
  const coords = pickCoord(city);

  return [
    {
      id: input.mockContext?.propertyId ? `pi-${input.mockContext.propertyId}` : 'pi-demo-001',
      address,
      city,
      province,
      postalCode: 'H2X 2N5',
      latitude: coords.lat,
      longitude: coords.lng,
      type: input.mockContext?.propertyType ?? 'Condo',
      yearBuilt: input.mockContext?.yearBuilt ?? 2011,
      beds: input.mockContext?.beds ? String(input.mockContext.beds) : '2',
      baths: input.mockContext?.baths ? String(input.mockContext.baths) : '1',
      squareFeet: input.mockContext?.squareFeet ?? 980,
    },
  ];
}

export function buildMockAvm(propertyId: string): AvmResult {
  const seed = propertyId.length * 127;
  const baseValue = 520000 + seed * 3;
  return {
    listPrice: Math.round(baseValue * 1.06),
    salePrice: Math.round(baseValue),
    rentalPrice: Math.round(baseValue / 280),
    confidence: 'high',
    confidenceScore: 87,
    comparablesCount: 14,
    lastUpdated: daysAgo(6),
  };
}

export function buildMockPredictions(propertyId: string): PredictionResult[] {
  const base = buildMockAvm(propertyId).salePrice ?? 520000;
  return [
    { months: 3, predictedValue: Math.round(base * 1.01), confidence: 0.74, trend: 'up' },
    { months: 6, predictedValue: Math.round(base * 1.03), confidence: 0.7, trend: 'up' },
    { months: 12, predictedValue: Math.round(base * 1.06), confidence: 0.64, trend: 'up' },
  ];
}

export function buildMockNeighborhood(_propertyId?: string): NeighborhoodResult {
  return {
    name: 'Plateau-Mont-Royal',
    walkScore: 91,
    transitScore: 87,
    bikeScore: 93,
    schoolRating: 8,
    crimeIndex: 18,
    demographics: {
      medianIncome: 68200,
      medianAge: 36,
      populationDensity: 12500,
      ownerOccupied: 38,
    },
  };
}

export function buildMockPermits(_propertyId?: string): PermitRecord[] {
  return [
    {
      id: 'permit-2024-017',
      type: 'Renovation',
      description: 'Remplacement HVAC etage 6',
      status: 'approved',
      issueDate: daysAgo(120),
      value: 86000,
    },
    {
      id: 'permit-2025-006',
      type: 'Electrical',
      description: 'Modernisation panneaux electriques',
      status: 'pending',
      issueDate: daysAgo(35),
      value: 32000,
    },
  ];
}

export function buildMockDataSources(): DataSource[] {
  return dataSources;
}

export function buildMockFields(): FieldDefinition[] {
  return fieldDefinitions;
}

export function buildMockAggregate(params: { city?: string | null; province?: string | null }): AggregateStat[] {
  return [
    { metric: 'Vacance', value: 2.7, unit: '%' },
    { metric: 'Croissance 12m', value: 4.2, unit: '%' },
    { metric: 'Loyer moyen', value: 2250, unit: 'CAD' },
    { metric: 'Cap rate', value: 4.9, unit: '%' },
    { metric: 'Ville', value: params.city ?? 'Montreal', unit: null },
    { metric: 'Province', value: params.province ?? 'QC', unit: null },
  ];
}

export function buildMockExtendedProperty(propertyId: string, context?: { address?: string }): PropertyExtended {
  return {
    id: propertyId,
    classification: 'Multi-residentiel',
    zoning: 'R4 (mixte)',
    occupancy: '92% occupe',
    complianceScore: 86,
    dataSignals: {
      adresse: context?.address ?? '1242 Rue Saint-Urbain',
      lease_roll: '18 baux actifs',
      assurance: 'Couverture a jour',
      maintenance: 'Historique complet',
      energie: 'Classe B',
      certifications: 'LEED Silver',
    },
  };
}
