import { ApiError } from './base';
import {
  buildMockAggregate,
  buildMockAvm,
  buildMockDataSources,
  buildMockExtendedProperty,
  buildMockFields,
  buildMockNeighborhood,
  buildMockPermits,
  buildMockPredictions,
  buildMockSearchResults,
} from '@/features/digital-twin/mockIntelligence';

export type IntelligenceProperty = {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: string | null;
  yearBuilt?: number | null;
  beds?: string | null;
  baths?: string | null;
  squareFeet?: number | null;
};

export type AvmResult = {
  listPrice?: number | null;
  salePrice?: number | null;
  rentalPrice?: number | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  confidenceScore?: number | null;
  comparablesCount?: number | null;
  lastUpdated?: string | null;
};

export type PredictionResult = {
  months: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
};

export type NeighborhoodResult = {
  name?: string | null;
  walkScore?: number | null;
  transitScore?: number | null;
  bikeScore?: number | null;
  schoolRating?: number | null;
  crimeIndex?: number | null;
  demographics?: {
    medianIncome?: number | null;
    medianAge?: number | null;
    populationDensity?: number | null;
    ownerOccupied?: number | null;
  } | null;
};

export type PermitRecord = {
  id: string;
  type: string;
  description?: string | null;
  status?: 'approved' | 'pending' | 'completed' | 'open';
  issueDate?: string | null;
  value?: number | null;
};

export type FieldDefinition = {
  id: string;
  label: string;
  category?: string | null;
  completeness?: number | null;
};

export type DataSource = {
  id: string;
  name: string;
  category?: string | null;
  status?: string | null;
  lastSync?: string | null;
};

export type AggregateStat = {
  metric: string;
  value: number | string;
  unit?: string | null;
};

export type PropertyExtended = {
  id: string;
  classification?: string | null;
  zoning?: string | null;
  occupancy?: string | null;
  complianceScore?: number | null;
  dataSignals?: Record<string, string | number>;
};

const rawBase = String(import.meta.env.VITE_INTELLIGENCE_API_BASE_URL ?? '').trim();
const baseUrl = rawBase || 'https://api.okeylist.com/api/v1/intelligence';
const mockMode = String(import.meta.env.VITE_MOCK_API_MODE ?? '').trim().toLowerCase();
const forceMock = mockMode === 'true' || mockMode === '1' || mockMode === 'mock' || mockMode === 'local';

export const intelligenceRuntime = {
  baseUrl,
  forceMock,
};

function buildUrl(path: string, params?: Record<string, string | number | null | undefined>) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const rawUrl = `${normalizedBase}${path}`;
  const url = normalizedBase.startsWith('http')
    ? new URL(rawUrl)
    : new URL(rawUrl, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function getJson<T>(path: string, params?: Record<string, string | number | null | undefined>): Promise<T> {
  const response = await fetch(buildUrl(path, params), { credentials: 'include' });
  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }
  const payload = (await response.json()) as any;
  return (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T;
}

async function withFallback<T>(remote: () => Promise<T>, local: () => T | Promise<T>): Promise<T> {
  if (forceMock) {
    return local();
  }
  try {
    return await remote();
  } catch {
    return local();
  }
}

const normalizeProperty = (raw: any): IntelligenceProperty => ({
  id: String(raw?.id ?? raw?.property_id ?? raw?.propertyId ?? raw?.identifier ?? ''),
  address: String(raw?.address ?? raw?.street ?? raw?.full_address ?? ''),
  city: String(raw?.city ?? raw?.municipality ?? ''),
  province: String(raw?.province ?? raw?.state ?? ''),
  postalCode: raw?.postalCode ?? raw?.postal_code ?? null,
  latitude: raw?.latitude ?? raw?.lat ?? null,
  longitude: raw?.longitude ?? raw?.lng ?? raw?.lon ?? null,
  type: raw?.type ?? raw?.property_type ?? null,
  yearBuilt: raw?.yearBuilt ?? raw?.year_built ?? null,
  beds: raw?.beds ?? raw?.bedrooms ?? null,
  baths: raw?.baths ?? raw?.bathrooms ?? null,
  squareFeet: raw?.squareFeet ?? raw?.square_feet ?? raw?.area ?? null,
});

const normalizeArray = <T>(raw: any): T[] => {
  if (Array.isArray(raw)) {
    return raw as T[];
  }
  if (raw?.items && Array.isArray(raw.items)) {
    return raw.items as T[];
  }
  if (raw?.results && Array.isArray(raw.results)) {
    return raw.results as T[];
  }
  if (raw?.properties && Array.isArray(raw.properties)) {
    return raw.properties as T[];
  }
  return [];
};

export async function searchProperties(input: {
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
}): Promise<IntelligenceProperty[]> {
  return withFallback(
    async () => {
      const data = await getJson<any>('/search', {
        query: input.query,
        q: input.query,
        address: input.address ?? undefined,
        city: input.city ?? undefined,
        province: input.province ?? undefined,
      });
      return normalizeArray<any>(data).map(normalizeProperty);
    },
    () => buildMockSearchResults(input)
  );
}

export async function fetchPropertyExtended(propertyId: string, context?: { address?: string }): Promise<PropertyExtended> {
  return withFallback(
    async () => {
      const data = await getJson<any>(`/properties/${propertyId}/extended`);
      return {
        id: String(data?.id ?? propertyId),
        classification: data?.classification ?? null,
        zoning: data?.zoning ?? null,
        occupancy: data?.occupancy ?? null,
        complianceScore: data?.compliance_score ?? data?.complianceScore ?? null,
        dataSignals: data?.data_signals ?? data?.dataSignals ?? undefined,
      };
    },
    () => buildMockExtendedProperty(propertyId, context)
  );
}

export async function fetchAvm(propertyId: string): Promise<AvmResult> {
  return withFallback(
    async () => getJson<AvmResult>('/avm', { propertyId }),
    () => buildMockAvm(propertyId)
  );
}

export async function fetchPredictions(propertyId: string): Promise<PredictionResult[]> {
  return withFallback(
    async () => normalizeArray<PredictionResult>(await getJson<any>('/predict', { propertyId })),
    () => buildMockPredictions(propertyId)
  );
}

export async function fetchNeighborhood(propertyId: string): Promise<NeighborhoodResult> {
  return withFallback(
    async () => getJson<NeighborhoodResult>('/neighborhood', { propertyId }),
    () => buildMockNeighborhood(propertyId)
  );
}

export async function fetchPermits(propertyId: string): Promise<PermitRecord[]> {
  return withFallback(
    async () => normalizeArray<PermitRecord>(await getJson<any>('/permits', { propertyId })),
    () => buildMockPermits(propertyId)
  );
}

export async function fetchDataSources(): Promise<DataSource[]> {
  return withFallback(
    async () => normalizeArray<DataSource>(await getJson<any>('/data-sources')),
    () => buildMockDataSources()
  );
}

export async function fetchFieldDefinitions(): Promise<FieldDefinition[]> {
  return withFallback(
    async () => normalizeArray<FieldDefinition>(await getJson<any>('/fields')),
    () => buildMockFields()
  );
}

export async function fetchAggregateStats(params: { city?: string | null; province?: string | null }): Promise<AggregateStat[]> {
  return withFallback(
    async () => normalizeArray<AggregateStat>(await getJson<any>('/aggregate', params)),
    () => buildMockAggregate(params)
  );
}
