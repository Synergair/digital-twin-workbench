import { create } from 'zustand';

type MaintenanceRequest = {
  id: string;
  propertyId: string;
  unitId: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  submittedAt: string;
};

interface MaintenanceState {
  requests: MaintenanceRequest[];
}

const seedRequests: MaintenanceRequest[] = [
  {
    id: 'maint-tenant-101',
    propertyId: 'prop-midrise-condo',
    unitId: 'prop-midrise-condo-unit-0-0',
    title: 'Humidité détectée sous l’évier',
    priority: 'high',
    status: 'open',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'maint-tenant-204',
    propertyId: 'prop-midrise-condo',
    unitId: 'prop-midrise-condo-unit-1-1',
    title: 'Thermostat mural non réactif',
    priority: 'medium',
    status: 'in_progress',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

export const useMaintenanceStore = create<MaintenanceState>(() => ({
  requests: seedRequests,
}));
