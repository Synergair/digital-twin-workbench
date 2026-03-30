import { ApiError, api } from './base';
import {
  createConversionJobMock,
  fetchConversionJobMock,
  fetchConversionLogsMock,
  listConversionJobsMock,
} from '@/features/digital-twin/mockConversion';

export type ConversionStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type ConversionJob = {
  id: string;
  propertyId: string;
  sourceFile: string;
  status: ConversionStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  output?: {
    xktUrl?: string;
    glbUrl?: string;
  };
};

export type ConversionLog = {
  timestamp: string;
  message: string;
};

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

export async function createModelConversion(input: {
  propertyId: string;
  sourceFile: string;
  previewModelUrl?: string;
}): Promise<ConversionJob> {
  return withFallback(
    async () => {
      const response = await api.post<ConversionJob>('/twin/conversions', input);
      return response.data;
    },
    () => createConversionJobMock(input)
  );
}

export async function fetchConversionJob(jobId: string): Promise<ConversionJob> {
  return withFallback(
    async () => {
      const response = await api.get<ConversionJob>(`/twin/conversions/${jobId}`);
      return response.data;
    },
    () => fetchConversionJobMock(jobId)
  );
}

export async function fetchConversionLogs(jobId: string): Promise<ConversionLog[]> {
  return withFallback(
    async () => {
      const response = await api.get<ConversionLog[]>(`/twin/conversions/${jobId}/logs`);
      return response.data;
    },
    () => fetchConversionLogsMock(jobId)
  );
}

export async function fetchConversionJobs(propertyId: string): Promise<ConversionJob[]> {
  return withFallback(
    async () => {
      const response = await api.get<ConversionJob[]>(`/twin/conversions`, { propertyId });
      return response.data;
    },
    () => listConversionJobsMock(propertyId)
  );
}

export async function cancelConversion(jobId: string): Promise<ConversionJob> {
  return withFallback(
    async () => {
      const response = await api.post<ConversionJob>(`/twin/conversions/${jobId}/cancel`);
      return response.data;
    },
    () => {
      throw new ApiError('Cancel not supported in mock mode.', 0);
    }
  );
}
