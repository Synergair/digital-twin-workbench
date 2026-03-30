import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as twinApi from '@/lib/api/digitalTwin';
import type { CreateTwinPinInput } from '@/features/digital-twin/types';

export const useTwinManifest = (propertyId: string | null) =>
  useQuery({
    queryKey: ['twin', 'manifest', propertyId],
    queryFn: () => twinApi.fetchTwinManifest(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 5 * 60_000,
  });

export const useTwinUnits = (propertyId: string | null, unitId?: string | null) =>
  useQuery({
    queryKey: ['twin', 'units', propertyId, unitId ?? null],
    queryFn: () => twinApi.fetchTwinUnits(propertyId!, unitId),
    enabled: Boolean(propertyId),
    staleTime: 2 * 60_000,
    refetchInterval: 30_000,
  });

export const useTwinPins = (propertyId: string | null, unitId?: string | null) =>
  useQuery({
    queryKey: ['twin', 'pins', propertyId, unitId ?? null],
    queryFn: () => twinApi.fetchTwinPins(propertyId!, { unitId }),
    enabled: Boolean(propertyId),
  });

export const useTwinPassportLayers = (propertyId: string | null) =>
  useQuery({
    queryKey: ['twin', 'passport', propertyId],
    queryFn: () => twinApi.fetchTwinPassportLayers(propertyId!),
    enabled: Boolean(propertyId),
    staleTime: 5 * 60_000,
  });

export const useTwinCaptures = (propertyId: string | null) =>
  useQuery({
    queryKey: ['twin', 'captures', propertyId],
    queryFn: () => twinApi.fetchTwinCaptures(propertyId!),
    enabled: Boolean(propertyId),
  });

export const useCreateTwinPin = (propertyId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTwinPinInput) => twinApi.createTwinPin(propertyId!, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['twin', 'pins', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['twin', 'units', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['twin', 'manifest', propertyId] }),
      ]);
    },
  });
};
