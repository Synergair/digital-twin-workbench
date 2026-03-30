import { create } from 'zustand';

type Company = {
  id: string;
  name: string;
};

interface OwnerAccessState {
  companies: Company[];
  getCompanyById: (id: string) => Company | undefined;
}

const seedCompanies: Company[] = [
  { id: 'company-okey', name: 'OKey Management' },
];

export const useOwnerAccessStore = create<OwnerAccessState>(() => ({
  companies: seedCompanies,
  getCompanyById: (id) => seedCompanies.find((company) => company.id === id),
}));
