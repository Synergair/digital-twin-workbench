import { useQuery } from '@tanstack/react-query';
import * as intelligenceApi from '@/lib/api/intelligence';

export const useIntelligenceSearch = (input: {
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
}) =>
  useQuery({
    queryKey: ['intelligence', 'search', input.query, input.address, input.city, input.province],
    queryFn: () => intelligenceApi.searchProperties(input),
    enabled: Boolean(input.query || input.address),
    staleTime: 5 * 60_000,
  });

export const useIntelligenceExtended = (propertyId?: string | null, context?: { address?: string }) =>
  useQuery({
    queryKey: ['intelligence', 'extended', propertyId ?? null],
    queryFn: () => intelligenceApi.fetchPropertyExtended(propertyId!, context),
    enabled: Boolean(propertyId),
    staleTime: 10 * 60_000,
  });

export const useIntelligenceAvm = (propertyId?: string | null) =>
  useQuery({
    queryKey: ['intelligence', 'avm', propertyId ?? null],
    queryFn: () => intelligenceApi.fetchAvm(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 10 * 60_000,
  });

export const useIntelligencePredictions = (propertyId?: string | null) =>
  useQuery({
    queryKey: ['intelligence', 'predictions', propertyId ?? null],
    queryFn: () => intelligenceApi.fetchPredictions(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 10 * 60_000,
  });

export const useIntelligenceNeighborhood = (propertyId?: string | null) =>
  useQuery({
    queryKey: ['intelligence', 'neighborhood', propertyId ?? null],
    queryFn: () => intelligenceApi.fetchNeighborhood(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 30 * 60_000,
  });

export const useIntelligencePermits = (propertyId?: string | null) =>
  useQuery({
    queryKey: ['intelligence', 'permits', propertyId ?? null],
    queryFn: () => intelligenceApi.fetchPermits(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 10 * 60_000,
  });

export const useIntelligenceDataSources = () =>
  useQuery({
    queryKey: ['intelligence', 'data-sources'],
    queryFn: () => intelligenceApi.fetchDataSources(),
    staleTime: 60 * 60_000,
  });

export const useIntelligenceFields = () =>
  useQuery({
    queryKey: ['intelligence', 'fields'],
    queryFn: () => intelligenceApi.fetchFieldDefinitions(),
    staleTime: 60 * 60_000,
  });

export const useIntelligenceAggregate = (params: { city?: string | null; province?: string | null }) =>
  useQuery({
    queryKey: ['intelligence', 'aggregate', params.city ?? null, params.province ?? null],
    queryFn: () => intelligenceApi.fetchAggregateStats(params),
    enabled: Boolean(params.city || params.province),
    staleTime: 30 * 60_000,
  });
