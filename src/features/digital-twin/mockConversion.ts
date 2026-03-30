import type { ConversionJob, ConversionLog, ConversionStatus } from '@/lib/api/conversion';

type ConversionInput = {
  propertyId: string;
  sourceFile: string;
  previewModelUrl?: string;
};

const STORAGE_KEY = 'digital-twin-conversions-v1';

const loadStore = () => {
  if (typeof window === 'undefined') {
    return { jobs: {}, logs: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { jobs: {}, logs: {} };
    }
    const parsed = JSON.parse(raw) as { jobs?: Record<string, ConversionJob>; logs?: Record<string, ConversionLog[]> };
    return { jobs: parsed.jobs ?? {}, logs: parsed.logs ?? {} };
  } catch {
    return { jobs: {}, logs: {} };
  }
};

const saveStore = (jobsMap: Map<string, ConversionJob>, logsMap: Map<string, ConversionLog[]>) => {
  if (typeof window === 'undefined') {
    return;
  }
  const jobsObj = Object.fromEntries(jobsMap.entries());
  const logsObj = Object.fromEntries(logsMap.entries());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs: jobsObj, logs: logsObj }));
};

const initialStore = loadStore();

const jobs = new Map<string, ConversionJob>(Object.entries(initialStore.jobs));
const logs = new Map<string, ConversionLog[]>(Object.entries(initialStore.logs));
const timers = new Map<string, number>();

const nowIso = () => new Date().toISOString();

const pushLog = (jobId: string, message: string) => {
  const entry: ConversionLog = { timestamp: nowIso(), message };
  const existing = logs.get(jobId) ?? [];
  existing.push(entry);
  logs.set(jobId, existing.slice(-30));
  saveStore(jobs, logs);
};

const updateJob = (jobId: string, updates: Partial<ConversionJob>) => {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }
  jobs.set(jobId, { ...job, ...updates, updatedAt: nowIso() });
  saveStore(jobs, logs);
};

const scheduleConversion = (jobId: string) => {
  if (timers.has(jobId)) {
    return;
  }

  const timer = window.setInterval(() => {
    const job = jobs.get(jobId);
    if (!job) {
      window.clearInterval(timer);
      timers.delete(jobId);
      return;
    }

    if (job.status === 'queued') {
      updateJob(jobId, { status: 'processing', progress: 5 });
      pushLog(jobId, 'Lecture IFC et preparation des geometries.');
      return;
    }

    if (job.status !== 'processing') {
      window.clearInterval(timer);
      timers.delete(jobId);
      return;
    }

    const nextProgress = Math.min(100, job.progress + Math.round(Math.random() * 14) + 6);
    updateJob(jobId, { progress: nextProgress });
    pushLog(jobId, nextProgress < 60 ? 'Conversion maillage + metadata IFC.' : 'Validation LOD + export XKT/GLB.');

    if (nextProgress >= 100) {
      updateJob(jobId, { status: 'ready', progress: 100 });
      pushLog(jobId, 'Conversion terminee, artefacts publies.');
      window.clearInterval(timer);
      timers.delete(jobId);
    }
  }, 900);

  timers.set(jobId, timer);
};

export function createConversionJobMock(input: ConversionInput): ConversionJob {
  const jobId = `conv-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;
  const job: ConversionJob = {
    id: jobId,
    propertyId: input.propertyId,
    sourceFile: input.sourceFile,
    status: 'queued',
    progress: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    output: {
      xktUrl: `/documents/models/${input.sourceFile.replace('.ifc', '.xkt')}`,
      glbUrl: input.previewModelUrl ?? '/listing-3d-mockup/models/modern-apartment-building.glb',
    },
  };

  jobs.set(jobId, job);
  logs.set(jobId, []);
  saveStore(jobs, logs);
  pushLog(jobId, 'Job de conversion en file d attente.');

  window.setTimeout(() => scheduleConversion(jobId), 600);

  return job;
}

export function fetchConversionJobMock(jobId: string): ConversionJob {
  const job = jobs.get(jobId);
  if (!job) {
    const placeholder: ConversionJob = {
      id: jobId,
      propertyId: 'unknown',
      sourceFile: 'unknown.ifc',
      status: 'failed',
      progress: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    jobs.set(jobId, placeholder);
    logs.set(jobId, [{ timestamp: nowIso(), message: 'Job introuvable dans la cache.' }]);
    saveStore(jobs, logs);
    return placeholder;
  }
  return job;
}

export function fetchConversionLogsMock(jobId: string): ConversionLog[] {
  return logs.get(jobId) ?? [];
}

export function listConversionJobsMock(propertyId: string): ConversionJob[] {
  return Array.from(jobs.values()).filter((job) => job.propertyId === propertyId);
}

export function getConversionStatus(jobId: string): ConversionStatus {
  return jobs.get(jobId)?.status ?? 'failed';
}
