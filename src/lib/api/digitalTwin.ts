import { ApiError, api } from './base';
import {
  createTwinCaptureMock,
  createTwinPinMock,
  getTwinCapturesMock,
  getTwinManifestMock,
  getTwinPassportLayersMock,
  getTwinPinsMock,
  getTwinUnitsForUser,
} from '@/features/digital-twin/mockData';
import type {
  CreateTwinPinInput,
  TwinCapture,
  TwinManifest,
  TwinPassportLayer,
  TwinPin,
  TwinUnit,
} from '@/features/digital-twin/types';

const mockApiMode = String(import.meta.env.VITE_MOCK_API_MODE ?? '').trim().toLowerCase();
const shouldUseMockApi =
  mockApiMode === '' ||
  mockApiMode === 'true' ||
  mockApiMode === '1' ||
  mockApiMode === 'mock' ||
  mockApiMode === 'local' ||
  import.meta.env.DEV;

async function withFallback<T>(remote: () => Promise<T>, local: () => T | Promise<T>): Promise<T> {
  if (shouldUseMockApi) {
    return local();
  }

  try {
    return await remote();
  } catch {
    return local();
  }
}

export async function fetchTwinManifest(propertyId: string): Promise<TwinManifest> {
  return withFallback(
    async () => {
      const response = await api.get<TwinManifest>(`/twin/${propertyId}/manifest`);
      return response.data;
    },
    () => getTwinManifestMock(propertyId)
  );
}

export async function fetchTwinUnits(propertyId: string, unitId?: string | null): Promise<TwinUnit[]> {
  return withFallback(
    async () => {
      const response = await api.get<TwinUnit[]>(`/twin/${propertyId}/units`, unitId ? { unit_id: unitId } : undefined);
      return response.data;
    },
    () => getTwinUnitsForUser(propertyId, unitId)
  );
}

export async function fetchTwinPins(
  propertyId: string,
  params?: { unitId?: string | null; status?: string | null }
): Promise<TwinPin[]> {
  return withFallback(
    async () => {
      const response = await api.get<TwinPin[]>(`/twin/${propertyId}/pins`, {
        unit_id: params?.unitId ?? undefined,
        status: params?.status ?? undefined,
      });
      return response.data;
    },
    () =>
      getTwinPinsMock(propertyId).filter((pin) => {
        if (params?.unitId && pin.unit_id !== params.unitId) {
          return false;
        }
        if (params?.status && pin.status !== params.status) {
          return false;
        }
        return true;
      })
  );
}

export async function fetchTwinPassportLayers(propertyId: string): Promise<TwinPassportLayer[]> {
  return withFallback(
    async () => {
      const response = await api.get<TwinPassportLayer[]>(`/twin/${propertyId}/passport`);
      return response.data;
    },
    () => getTwinPassportLayersMock(propertyId)
  );
}

export async function fetchTwinCaptures(propertyId: string): Promise<TwinCapture[]> {
  return withFallback(
    async () => {
      const response = await api.get<TwinCapture[]>(`/twin/${propertyId}/captures`);
      return response.data;
    },
    () => getTwinCapturesMock(propertyId)
  );
}

export async function createTwinPin(propertyId: string, data: CreateTwinPinInput): Promise<TwinPin> {
  return withFallback(
    async () => {
      const response = await api.post<TwinPin>(`/twin/${propertyId}/pins`, data);
      return response.data;
    },
    () => createTwinPinMock(propertyId, data)
  );
}

export function uploadCaptureXHR(
  propertyId: string,
  files: File[],
  options: { unitId?: string; captureType: string },
  onProgress: (pct: number) => void
): Promise<TwinCapture> {
  if (shouldUseMockApi) {
    return createTwinCaptureMock(propertyId, files, options, onProgress);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    if (options.unitId) {
      form.append('unit_id', options.unitId);
    }
    form.append('capture_type', options.captureType);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { data?: TwinCapture };
          if (!parsed.data) {
            throw new ApiError('Invalid capture response', 500);
          }
          resolve(parsed.data);
          return;
        } catch (error) {
          reject(error);
          return;
        }
      }

      if (xhr.status === 404 || xhr.status === 501 || xhr.status === 0) {
        resolve(await createTwinCaptureMock(propertyId, files, options, onProgress));
        return;
      }

      reject(new ApiError(`Capture upload failed (${xhr.status})`, xhr.status));
    });

    xhr.addEventListener('error', async () => {
      resolve(await createTwinCaptureMock(propertyId, files, options, onProgress));
    });

    xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL ?? ''}/twin/${propertyId}/capture`);
    const token = api.getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(form);
  });
}
