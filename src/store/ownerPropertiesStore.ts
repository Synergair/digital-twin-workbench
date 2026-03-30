import { create } from 'zustand';
import { buildingArchetypes, buildPropertySeeds, buildUnitsForArchetype } from '@/features/digital-twin/archetypes';

type PropertyAddress = {
  street: string;
  city: string;
  province: string;
  postalCode: string;
};

type Property = {
  id: string;
  name: string;
  address: PropertyAddress;
  companyId?: string | null;
  archetypeId: string;
  floors: number;
  unitsPerFloor: number;
  roofType: string;
  parkingType: string;
  occupancy: string;
  modelUrl: string;
};

type Unit = {
  id: string;
  propertyId: string;
  unitNumber: string;
  tenantId?: string | null;
  bedrooms: number;
  sqft: number;
  rent: number;
  status: 'occupied' | 'available';
  tenantName?: string | null;
  leaseEnd?: string | null;
};

interface OwnerPropertiesState {
  properties: Property[];
  units: Unit[];
  getPropertyById: (id: string) => Property | undefined;
  getUnitsByProperty: (propertyId: string) => Unit[];
}

const seedProperties: Property[] = buildPropertySeeds();

const seedUnits: Unit[] = seedProperties.flatMap((property) => {
  const archetype = buildingArchetypes.find((entry) => entry.id === property.archetypeId);
  if (!archetype) {
    return [];
  }
  return buildUnitsForArchetype(property, archetype);
});

export const useOwnerPropertiesStore = create<OwnerPropertiesState>(() => ({
  properties: seedProperties,
  units: seedUnits,
  getPropertyById: (id) => seedProperties.find((property) => property.id === id),
  getUnitsByProperty: (propertyId) => seedUnits.filter((unit) => unit.propertyId === propertyId),
}));
