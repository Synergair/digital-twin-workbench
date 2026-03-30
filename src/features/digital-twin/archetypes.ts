export type BuildingArchetype = {
  id: string;
  label: string;
  kind: 'residential' | 'commercial' | 'industrial' | 'institutional' | 'mixed' | 'civic';
  floors: number;
  unitsPerFloor: number;
  roofType: string;
  parkingType: string;
  occupancy: string;
  description: string;
  modelUrl: string;
};

const modelPool = {
  house: '/listing-3d-mockup/models/clean-condo-hero.glb',
  sponza: '/listing-3d-mockup/models/perfect-condo.glb',
  box: '/models/box-textured.glb',
  tower: '/listing-3d-mockup/models/modern-apartment-building.glb',
  condo: '/listing-3d-mockup/models/clean-condo-hero.glb',
  signature: '/listing-3d-mockup/models/signature-condo.glb',
  perfect: '/listing-3d-mockup/models/perfect-condo.glb',
  extracted1: '/listing-3d-mockup/models/extracted-condo-031.glb',
  extracted2: '/listing-3d-mockup/models/extracted-condo-029.glb',
  extracted3: '/listing-3d-mockup/models/extracted-condo-015.glb',
};

export const buildingArchetypes: BuildingArchetype[] = [
  {
    id: 'single-family',
    label: 'Maison unifamiliale + garage',
    kind: 'residential',
    floors: 2,
    unitsPerFloor: 1,
    roofType: 'gable',
    parkingType: 'garage',
    occupancy: 'owner-occupied',
    description: 'Maison individuelle avec garage simple, cour et toiture en pente.',
    modelUrl: modelPool.house,
  },
  {
    id: 'townhouse',
    label: 'Maison de ville',
    kind: 'residential',
    floors: 3,
    unitsPerFloor: 1,
    roofType: 'flat',
    parkingType: 'surface',
    occupancy: 'multi-family',
    description: 'Rangée de maisons mitoyennes avec stationnement en surface.',
    modelUrl: modelPool.house,
  },
  {
    id: 'duplex',
    label: 'Duplex',
    kind: 'residential',
    floors: 2,
    unitsPerFloor: 1,
    roofType: 'hip',
    parkingType: 'street',
    occupancy: 'rental',
    description: 'Deux unités superposées avec accès indépendants.',
    modelUrl: modelPool.house,
  },
  {
    id: 'triplex',
    label: 'Triplex',
    kind: 'residential',
    floors: 3,
    unitsPerFloor: 1,
    roofType: 'mansard',
    parkingType: 'street',
    occupancy: 'rental',
    description: 'Trois unités superposées avec accès frontaux.',
    modelUrl: modelPool.tower,
  },
  {
    id: 'fourplex',
    label: 'Fourplex',
    kind: 'residential',
    floors: 2,
    unitsPerFloor: 2,
    roofType: 'flat',
    parkingType: 'surface',
    occupancy: 'rental',
    description: 'Petit immeuble de 4 unités avec stationnement commun.',
    modelUrl: modelPool.condo,
  },
  {
    id: 'lowrise-condo',
    label: 'Condo faible hauteur',
    kind: 'residential',
    floors: 4,
    unitsPerFloor: 6,
    roofType: 'flat',
    parkingType: 'underground',
    occupancy: 'condo',
    description: 'Immeuble résidentiel de 4 étages avec stationnement souterrain.',
    modelUrl: modelPool.signature,
  },
  {
    id: 'midrise-condo',
    label: 'Condo mi-hauteur',
    kind: 'residential',
    floors: 8,
    unitsPerFloor: 10,
    roofType: 'green',
    parkingType: 'underground',
    occupancy: 'condo',
    description: 'Immeuble résidentiel de 8 étages avec toiture verte.',
    modelUrl: modelPool.tower,
  },
  {
    id: 'highrise-condo',
    label: 'Condo grande hauteur',
    kind: 'residential',
    floors: 18,
    unitsPerFloor: 14,
    roofType: 'flat',
    parkingType: 'structured',
    occupancy: 'condo',
    description: 'Tour résidentielle avec parkings structurés et mécanique.',
    modelUrl: modelPool.perfect,
  },
  {
    id: 'mixed-use',
    label: 'Immeuble mixte',
    kind: 'mixed',
    floors: 10,
    unitsPerFloor: 8,
    roofType: 'solar',
    parkingType: 'underground',
    occupancy: 'retail + residential',
    description: 'Socle commercial avec logements aux étages supérieurs.',
    modelUrl: modelPool.extracted1,
  },
  {
    id: 'office',
    label: 'Immeuble de bureaux',
    kind: 'commercial',
    floors: 12,
    unitsPerFloor: 1,
    roofType: 'flat',
    parkingType: 'structured',
    occupancy: 'office',
    description: 'Bureaux multi-niveaux avec plateaux ouverts.',
    modelUrl: modelPool.sponza,
  },
  {
    id: 'retail',
    label: 'Commerce de détail',
    kind: 'commercial',
    floors: 1,
    unitsPerFloor: 1,
    roofType: 'shed',
    parkingType: 'surface',
    occupancy: 'retail',
    description: 'Bâtiment commercial de plain-pied avec aire de stationnement.',
    modelUrl: modelPool.box,
  },
  {
    id: 'warehouse',
    label: 'Entrepôt logistique',
    kind: 'industrial',
    floors: 2,
    unitsPerFloor: 1,
    roofType: 'flat',
    parkingType: 'surface',
    occupancy: 'logistics',
    description: 'Entrepôt avec quais de chargement et réseaux industriels.',
    modelUrl: modelPool.extracted2,
  },
  {
    id: 'industrial',
    label: 'Bâtiment industriel',
    kind: 'industrial',
    floors: 3,
    unitsPerFloor: 1,
    roofType: 'sawtooth',
    parkingType: 'surface',
    occupancy: 'manufacturing',
    description: 'Infrastructure industrielle avec équipements lourds.',
    modelUrl: modelPool.extracted3,
  },
  {
    id: 'hotel',
    label: 'Hôtel',
    kind: 'commercial',
    floors: 9,
    unitsPerFloor: 16,
    roofType: 'flat',
    parkingType: 'structured',
    occupancy: 'hospitality',
    description: 'Établissement hôtelier avec services et back-of-house.',
    modelUrl: modelPool.sponza,
  },
  {
    id: 'hospital',
    label: 'Centre hospitalier',
    kind: 'institutional',
    floors: 7,
    unitsPerFloor: 6,
    roofType: 'flat',
    parkingType: 'structured',
    occupancy: 'healthcare',
    description: 'Campus hospitalier avec zones critiques et MEP dense.',
    modelUrl: modelPool.tower,
  },
  {
    id: 'school',
    label: 'École',
    kind: 'institutional',
    floors: 3,
    unitsPerFloor: 4,
    roofType: 'flat',
    parkingType: 'surface',
    occupancy: 'education',
    description: 'Établissement scolaire avec gymnase et aires communes.',
    modelUrl: modelPool.signature,
  },
  {
    id: 'civic',
    label: 'Bâtiment civique',
    kind: 'civic',
    floors: 4,
    unitsPerFloor: 2,
    roofType: 'flat',
    parkingType: 'street',
    occupancy: 'civic',
    description: 'Maison de services publics avec espaces flexibles.',
    modelUrl: modelPool.perfect,
  },
  {
    id: 'parking-structure',
    label: 'Stationnement étagé',
    kind: 'commercial',
    floors: 6,
    unitsPerFloor: 1,
    roofType: 'flat',
    parkingType: 'structured',
    occupancy: 'parking',
    description: 'Structure de stationnement multi-niveaux.',
    modelUrl: modelPool.extracted1,
  },
  {
    id: 'data-center',
    label: 'Centre de données',
    kind: 'industrial',
    floors: 3,
    unitsPerFloor: 1,
    roofType: 'flat',
    parkingType: 'surface',
    occupancy: 'critical-infrastructure',
    description: 'Centre de données avec redondance électrique et refroidissement.',
    modelUrl: modelPool.extracted2,
  },
];

const cityPool = ['Montreal', 'Quebec', 'Laval', 'Gatineau', 'Sherbrooke', 'Longueuil'];

const streetPool = [
  'Rue Saint-Urbain',
  'Avenue Laurier',
  'Boulevard René-Lévesque',
  'Rue Saint-Denis',
  'Avenue du Parc',
  'Boulevard de Maisonneuve',
];

export type PropertySeed = {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  companyId?: string | null;
  archetypeId: string;
  floors: number;
  unitsPerFloor: number;
  roofType: string;
  parkingType: string;
  occupancy: string;
  modelUrl: string;
};

export type UnitSeed = {
  id: string;
  propertyId: string;
  unitNumber: string;
  bedrooms: number;
  sqft: number;
  rent: number;
  status: 'occupied' | 'available';
  tenantId?: string | null;
  tenantName?: string | null;
  leaseEnd?: string | null;
};

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

function createAddress(index: number) {
  const street = streetPool[index % streetPool.length];
  const city = cityPool[index % cityPool.length];
  const civic = 1200 + index * 7;
  return {
    street: `${civic} ${street}`,
    city,
    province: 'QC',
    postalCode: 'H2X 2N5',
  };
}

export function buildPropertySeeds(): PropertySeed[] {
  return buildingArchetypes.map((archetype, index) => ({
    id: `prop-${archetype.id}`,
    name: archetype.label,
    address: createAddress(index),
    companyId: 'company-okey',
    archetypeId: archetype.id,
    floors: archetype.floors,
    unitsPerFloor: archetype.unitsPerFloor,
    roofType: archetype.roofType,
    parkingType: archetype.parkingType,
    occupancy: archetype.occupancy,
    modelUrl: archetype.modelUrl,
  }));
}

function pickBedrooms(floor: number, unitIndex: number, unitsPerFloor: number, kind: BuildingArchetype['kind']) {
  if (kind !== 'residential' && kind !== 'mixed') {
    return 0;
  }
  if (unitsPerFloor <= 2 && floor === 0) {
    return 3;
  }
  if (unitIndex % 3 === 0) return 1;
  if (unitIndex % 3 === 1) return 2;
  return 3;
}

export function buildUnitsForArchetype(property: PropertySeed, archetype: BuildingArchetype): UnitSeed[] {
  const units: UnitSeed[] = [];
  for (let floor = 0; floor < archetype.floors; floor += 1) {
    for (let index = 0; index < archetype.unitsPerFloor; index += 1) {
      const numberBase = (floor + 1) * 100 + (index + 1);
      const unitNumber =
        archetype.unitsPerFloor === 1 && archetype.floors <= 2
          ? `${archetype.label.split(' ')[0][0]}-${pad(floor + 1, 1)}`
          : String(numberBase);
      const bedrooms = pickBedrooms(floor, index, archetype.unitsPerFloor, archetype.kind);
      const sqft = archetype.kind === 'industrial' ? 12000 : archetype.kind === 'commercial' ? 4000 : 620 + bedrooms * 220;
      const rentBase = archetype.kind === 'commercial' ? 4200 : archetype.kind === 'industrial' ? 8600 : 1600;
      const rent = rentBase + bedrooms * 420 + floor * 35;
      const occupied =
        archetype.kind === 'residential' && archetype.unitsPerFloor <= 2
          ? true
          : index % 4 !== 0;
      units.push({
        id: `${property.id}-unit-${floor}-${index}`,
        propertyId: property.id,
        unitNumber,
        bedrooms,
        sqft,
        rent,
        status: occupied ? 'occupied' : 'available',
        tenantId: occupied ? `tenant-${property.id}-${floor}-${index}` : null,
        tenantName: occupied ? `Locataire ${pad(floor + 1)}-${pad(index + 1)}` : null,
        leaseEnd: occupied ? `2026-${pad((index % 12) + 1)}-30` : null,
      });
    }
  }
  return units;
}
