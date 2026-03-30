import { useOwnerPropertiesStore } from '@/store/ownerPropertiesStore';

export type TwinData = {
  twinId: string;
  geo: {
    address: string;
    parcelId: string;
    zoning: string;
    lat: number;
    lon: number;
  };
  ownership: {
    owner: string;
    claimStatus: 'unclaimed' | 'pending' | 'verified';
    verification: string;
    lastTransfer: string;
  };
  leasing: {
    occupancyRate: number;
    rentRollMonthly: number;
    vacancyUnits: number;
    leaseExpiries: string[];
  };
  financing: {
    valuation: number;
    noiAnnual: number;
    capRate: number;
    debtService: number;
  };
  insurance: {
    provider: string;
    premiumAnnual: number;
    coverage: number;
    riskScore: number;
  };
  carbon: {
    energyKwhAnnual: number;
    emissionsTons: number;
    offsetCredits: number;
    certification: string;
  };
  facilities: {
    nextInspections: Array<{ label: string; due: string }>;
    preventiveTasks: number;
    activeWorkOrders: number;
  };
  tenantBehavior: {
    serviceRequestsMonthly: number;
    avgResponseHours: number;
    commonAreaUsageIndex: number;
  };
  compliance: {
    permitsOpen: number;
    auditsDue: number;
    lastAudit: string;
  };
  maintenanceHistory: Array<{
    date: string;
    system: string;
    action: string;
    vendor: string;
    vendorLicense: string;
    materials: string[];
    issues: string[];
    status: 'completed' | 'in-progress' | 'scheduled';
    cost: number;
  }>;
  contractorRoster: Array<{
    name: string;
    trade: string;
    license: string;
    bonded: boolean;
    insuranceExpiry: string;
    rating: number;
  }>;
  crewRoster: Array<{
    name: string;
    role: string;
    employer: string;
    certifications: string[];
    phone: string;
    lastOnSite: string;
  }>;
  invoices: Array<{
    invoiceId: string;
    vendor: string;
    amount: number;
    status: 'paid' | 'open' | 'overdue';
    dueDate: string;
    issuedDate: string;
    attachment: string;
  }>;
  warrantyDocs: Array<{
    docId: string;
    system: string;
    coverage: string;
    expiry: string;
    provider: string;
    file: string;
  }>;
  inspectionPhotos: Array<{
    photoId: string;
    area: string;
    capturedAt: string;
    inspector: string;
    url: string;
  }>;
  vendorInsuranceCertificates: Array<{
    vendor: string;
    policyId: string;
    coverage: number;
    expiry: string;
    certificate: string;
  }>;
  changeOrders: Array<{
    changeId: string;
    date: string;
    scope: string;
    impact: string;
    approvedBy: string;
    status: 'approved' | 'pending' | 'rejected';
  }>;
  ifcModels: Array<{
    id: string;
    name: string;
    buildingType: string;
    file: string;
    sizeMb: number;
    previewModelUrl?: string;
    updatedAt: string;
  }>;
  floorPlans: Array<{
    id: string;
    label: string;
    level: string;
    file: string;
    updatedAt: string;
  }>;
  mepDocs: Array<{
    id: string;
    title: string;
    discipline: string;
    file: string;
    updatedAt: string;
  }>;
  inspectionChecklists: Array<{
    id: string;
    title: string;
    authority: string;
    file: string;
    updatedAt: string;
  }>;
  pointCloudScans: Array<{
    id: string;
    name: string;
    archive: string;
    preview: string;
    points: string;
    plyFiles?: string[];
    plyFile?: string;
    capturedAt: string;
  }>;
  assetRegistry: Array<{
    assetId: string;
    name: string;
    system: string;
    location: string;
    status: 'online' | 'degraded' | 'offline' | 'inspection';
    lastService: string;
    nextService: string;
    warrantyUntil: string;
  }>;
  materialsLedger: Array<{
    material: string;
    quantity: number;
    unit: string;
    supplier: string;
    lastUsed: string;
    status: 'in-stock' | 'low' | 'ordered';
  }>;
  incidentReports: Array<{
    date: string;
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'resolved' | 'monitoring';
  }>;
  dataSources: string[];
  timeline: Array<{ date: string; label: string; type: 'permit' | 'lease' | 'maintenance' | 'inspection' | 'ownership' }>;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const seededNumber = (seed: number, min: number, max: number) => {
  const value = (Math.sin(seed) + 1) / 2;
  return min + value * (max - min);
};

const daysAgo = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
};

export function getTwinData(propertyId: string): TwinData {
  const property = useOwnerPropertiesStore.getState().getPropertyById(propertyId);
  const units = useOwnerPropertiesStore.getState().getUnitsByProperty(propertyId);
  const seed = hashString(propertyId);
  const occupancy = units.length ? units.filter((unit) => unit.status === 'occupied').length / units.length : 0.6;
  const rentRoll = units.reduce((total, unit) => total + unit.rent, 0);

  const valuation = Math.round(seededNumber(seed, 4.2, 24.5) * 1_000_000);
  const noiAnnual = Math.round(rentRoll * 12 * seededNumber(seed + 3, 0.45, 0.68));
  const capRate = Number((noiAnnual / valuation * 100).toFixed(2));
  const energyKwh = Math.round(seededNumber(seed + 5, 320_000, 2_400_000));
  const emissions = Number((energyKwh / 1000 * seededNumber(seed + 7, 0.18, 0.42)).toFixed(1));

  return {
    twinId: `twin-${propertyId}`,
    geo: {
      address: property ? `${property.address.street}, ${property.address.city}` : 'Adresse inconnue',
      parcelId: `parcel-${seed.toString(36).slice(0, 6)}`,
      zoning: seededNumber(seed + 1, 0, 1) > 0.5 ? 'Résidentiel mixte' : 'Commercial léger',
      lat: Number((45.5 + seededNumber(seed + 2, -0.12, 0.12)).toFixed(5)),
      lon: Number((-73.57 + seededNumber(seed + 4, -0.12, 0.12)).toFixed(5)),
    },
    ownership: {
      owner: property?.name ? `${property.name} Holdings` : 'OKey Holdings',
      claimStatus: seededNumber(seed + 6, 0, 1) > 0.7 ? 'pending' : 'verified',
      verification: 'KYC + documents',
      lastTransfer: daysAgo(420),
    },
    leasing: {
      occupancyRate: Number((occupancy * 100).toFixed(1)),
      rentRollMonthly: Math.round(rentRoll),
      vacancyUnits: Math.max(0, units.length - Math.round(units.length * occupancy)),
      leaseExpiries: units.slice(0, 3).map((unit) => unit.leaseEnd ?? daysAgo(-90)),
    },
    financing: {
      valuation,
      noiAnnual,
      capRate,
      debtService: Math.round(noiAnnual * 0.32),
    },
    insurance: {
      provider: 'Assurance Atlas',
      premiumAnnual: Math.round(valuation * 0.0018),
      coverage: Math.round(valuation * 0.92),
      riskScore: Math.round(seededNumber(seed + 9, 42, 86)),
    },
    carbon: {
      energyKwhAnnual: energyKwh,
      emissionsTons: emissions,
      offsetCredits: Math.round(emissions * 0.4),
      certification: seededNumber(seed + 10, 0, 1) > 0.5 ? 'BOMA Best' : 'LEED Silver',
    },
    facilities: {
      nextInspections: [
        { label: 'Ascenseurs', due: daysAgo(-60) },
        { label: 'Toiture', due: daysAgo(-120) },
        { label: 'Sécurité incendie', due: daysAgo(-30) },
      ],
      preventiveTasks: Math.round(seededNumber(seed + 11, 6, 24)),
      activeWorkOrders: Math.round(seededNumber(seed + 12, 2, 12)),
    },
    tenantBehavior: {
      serviceRequestsMonthly: Math.round(seededNumber(seed + 13, 6, 40)),
      avgResponseHours: Number(seededNumber(seed + 14, 6, 48).toFixed(1)),
      commonAreaUsageIndex: Math.round(seededNumber(seed + 15, 40, 95)),
    },
    compliance: {
      permitsOpen: Math.round(seededNumber(seed + 16, 0, 4)),
      auditsDue: Math.round(seededNumber(seed + 17, 0, 3)),
      lastAudit: daysAgo(260),
    },
    maintenanceHistory: [
      {
        date: daysAgo(340),
        system: 'Toiture',
        action: 'Membrane etancheite + inspection thermique',
        vendor: 'CouvreToit Moderne',
        vendorLicense: 'RBQ 5723-9812-01',
        materials: ['Membrane TPO', 'Isolation R-30', 'Membrane pare-vapeur'],
        issues: ['Infiltration mineure corrigee', 'Rebords a renforcer'],
        status: 'completed',
        cost: 18200,
      },
      {
        date: daysAgo(210),
        system: 'HVAC',
        action: 'Calibration des VAV et nettoyage filtres',
        vendor: 'NordAir Services',
        vendorLicense: 'RBQ 3384-7711-47',
        materials: ['Filtres MERV 13', 'Courroies', 'Nettoyant serpentin'],
        issues: ['Debit d air non uniforme corrige', 'Sonde temperature remplacee'],
        status: 'completed',
        cost: 7400,
      },
      {
        date: daysAgo(90),
        system: 'Ascenseurs',
        action: 'Maintenance preventive + mise a jour logicielle',
        vendor: 'LiftGuard',
        vendorLicense: 'RBQ 8211-2240-16',
        materials: ['Kit lubrification', 'Module I/O', 'Firmware 3.2'],
        issues: ['Porte niveau 3 ajustee'],
        status: 'completed',
        cost: 9600,
      },
      {
        date: daysAgo(-30),
        system: 'Electricite',
        action: 'Audit de charge et equilibrage des panneaux',
        vendor: 'Voltatek',
        vendorLicense: 'RBQ 9091-1403-62',
        materials: ['Jeux de barres', 'Etiquetage circuit', 'Capteurs thermiques'],
        issues: ['Panneau 2 surcharge detectee'],
        status: 'scheduled',
        cost: 4200,
      },
    ],
    contractorRoster: [
      {
        name: 'CouvreToit Moderne',
        trade: 'Toiture',
        license: 'RBQ 5723-9812-01',
        bonded: true,
        insuranceExpiry: daysAgo(-180),
        rating: 4.6,
      },
      {
        name: 'NordAir Services',
        trade: 'HVAC',
        license: 'RBQ 3384-7711-47',
        bonded: true,
        insuranceExpiry: daysAgo(-240),
        rating: 4.4,
      },
      {
        name: 'LiftGuard',
        trade: 'Ascenseurs',
        license: 'RBQ 8211-2240-16',
        bonded: true,
        insuranceExpiry: daysAgo(-300),
        rating: 4.8,
      },
      {
        name: 'Voltatek',
        trade: 'Electricite',
        license: 'RBQ 9091-1403-62',
        bonded: false,
        insuranceExpiry: daysAgo(-120),
        rating: 4.1,
      },
    ],
    crewRoster: [
      {
        name: 'Amelie Roy',
        role: 'Chargee de projet',
        employer: 'NordAir Services',
        certifications: ['ASP Construction', 'CVC Niveau 2'],
        phone: '514-555-0189',
        lastOnSite: daysAgo(210),
      },
      {
        name: 'Karim El Haddad',
        role: 'Technicien ascenseurs',
        employer: 'LiftGuard',
        certifications: ['CPE Elevateurs', 'Secourisme'],
        phone: '514-555-0142',
        lastOnSite: daysAgo(90),
      },
      {
        name: 'Nadia Tremblay',
        role: 'Inspectrice toiture',
        employer: 'CouvreToit Moderne',
        certifications: ['Travail en hauteur', 'Inspection IR'],
        phone: '514-555-0103',
        lastOnSite: daysAgo(340),
      },
    ],
    invoices: [
      {
        invoiceId: `INV-${seed.toString(36).slice(0, 4)}-114`,
        vendor: 'NordAir Services',
        amount: 7400,
        status: 'paid',
        dueDate: daysAgo(180),
        issuedDate: daysAgo(210),
        attachment: 'invoice-nordair-114.pdf',
      },
      {
        invoiceId: `INV-${seed.toString(36).slice(0, 4)}-118`,
        vendor: 'LiftGuard',
        amount: 9600,
        status: 'open',
        dueDate: daysAgo(-20),
        issuedDate: daysAgo(90),
        attachment: 'invoice-liftguard-118.pdf',
      },
      {
        invoiceId: `INV-${seed.toString(36).slice(0, 4)}-122`,
        vendor: 'Voltatek',
        amount: 4200,
        status: 'overdue',
        dueDate: daysAgo(-5),
        issuedDate: daysAgo(-30),
        attachment: 'invoice-voltatek-122.pdf',
      },
    ],
    warrantyDocs: [
      {
        docId: 'WR-ROOF-2024',
        system: 'Toiture',
        coverage: 'Membrane + installation',
        expiry: '2034-05-30',
        provider: 'ToitPro Assurance',
        file: 'warranty-roof.pdf',
      },
      {
        docId: 'WR-ELEV-2023',
        system: 'Ascenseurs',
        coverage: 'Pieces critiques + logiciel',
        expiry: '2028-06-15',
        provider: 'LiftGuard Warranty',
        file: 'warranty-elevator.pdf',
      },
      {
        docId: 'WR-HVAC-2025',
        system: 'HVAC',
        coverage: 'Compresseurs + main d oeuvre',
        expiry: '2030-02-01',
        provider: 'NordAir Services',
        file: 'warranty-hvac.pdf',
      },
    ],
    inspectionPhotos: [
      {
        photoId: 'PHOTO-ROOF-001',
        area: 'Toiture segment B',
        capturedAt: daysAgo(340),
        inspector: 'Nadia Tremblay',
        url: '/documents/inspection-roof.svg',
      },
      {
        photoId: 'PHOTO-HVAC-014',
        area: 'Local mecanique',
        capturedAt: daysAgo(210),
        inspector: 'Amelie Roy',
        url: '/documents/inspection-hvac.svg',
      },
      {
        photoId: 'PHOTO-ELV-007',
        area: 'Noyau Est',
        capturedAt: daysAgo(90),
        inspector: 'Karim El Haddad',
        url: '/documents/inspection-elevator.svg',
      },
    ],
    vendorInsuranceCertificates: [
      {
        vendor: 'CouvreToit Moderne',
        policyId: 'INS-CT-2024',
        coverage: 2000000,
        expiry: daysAgo(-180),
        certificate: 'cert-assurance-couvretoit.pdf',
      },
      {
        vendor: 'NordAir Services',
        policyId: 'INS-NA-2024',
        coverage: 3000000,
        expiry: daysAgo(-240),
        certificate: 'cert-assurance-nordair.pdf',
      },
      {
        vendor: 'LiftGuard',
        policyId: 'INS-LG-2025',
        coverage: 5000000,
        expiry: daysAgo(-300),
        certificate: 'cert-assurance-liftguard.pdf',
      },
    ],
    changeOrders: [
      {
        changeId: 'CO-2024-017',
        date: daysAgo(140),
        scope: 'Ajout capteurs fuite eau',
        impact: 'Budget +12k, delai +2 semaines',
        approvedBy: 'Owner Committee',
        status: 'approved',
      },
      {
        changeId: 'CO-2024-022',
        date: daysAgo(40),
        scope: 'Remplacement luminaires stationnement',
        impact: 'Budget +6k, delai +1 semaine',
        approvedBy: 'Property Manager',
        status: 'pending',
      },
    ],
    ifcModels: [
      {
        id: 'ifc-commercial-office',
        name: 'Commercial Office',
        buildingType: 'Bureaux',
        file: 'Commercial_Office.ifc',
        sizeMb: 43,
        previewModelUrl: '/listing-3d-mockup/models/perfect-condo.glb',
        updatedAt: daysAgo(30),
      },
      {
        id: 'ifc-duplex',
        name: 'Duplex Residential',
        buildingType: 'Duplex',
        file: 'Duplex_Residential.ifc',
        sizeMb: 1.2,
        previewModelUrl: '/listing-3d-mockup/models/clean-condo-hero.glb',
        updatedAt: daysAgo(18),
      },
      {
        id: 'ifc-house',
        name: 'FZK House',
        buildingType: 'Maison unifamiliale',
        file: 'FZK_House.ifc',
        sizeMb: 0.3,
        previewModelUrl: '/listing-3d-mockup/models/clean-condo-hero.glb',
        updatedAt: daysAgo(12),
      },
      {
        id: 'ifc-institute',
        name: 'Institute Var2',
        buildingType: 'Institution',
        file: 'Institute_Var2.ifc',
        sizeMb: 0.3,
        previewModelUrl: '/listing-3d-mockup/models/clean-condo-hero.glb',
        updatedAt: daysAgo(9),
      },
    ],
    floorPlans: [
      {
        id: 'plan-res-main',
        label: 'Plan rez-de-chaussee',
        level: 'Niveau 0',
        file: 'residential_main_floor.jpg',
        updatedAt: daysAgo(20),
      },
      {
        id: 'plan-res-1',
        label: 'Plan etage type',
        level: 'Niveau 1',
        file: 'residential_floorplan_1.jpg',
        updatedAt: daysAgo(20),
      },
      {
        id: 'plan-sample-2d',
        label: 'Plan technique 2D',
        level: 'Niveau 2',
        file: 'sample_2d_plan.png',
        updatedAt: daysAgo(20),
      },
    ],
    mepDocs: [
      {
        id: 'mep-doe-basics',
        title: 'DOE Building Energy Basics',
        discipline: 'Energy',
        file: 'DOE_Building_Energy_Basics.pdf',
        updatedAt: daysAgo(45),
      },
      {
        id: 'mep-doe-guidebook',
        title: 'DOE Building Guidebook',
        discipline: 'Energy',
        file: 'DOE_Building_Guidebook.pdf',
        updatedAt: daysAgo(45),
      },
      {
        id: 'mep-nist-hvac',
        title: 'NIST HVAC Fact Sheet',
        discipline: 'HVAC',
        file: 'NIST_HVAC_Fact_Sheet.pdf',
        updatedAt: daysAgo(45),
      },
    ],
    inspectionChecklists: [
      {
        id: 'inspect-osha-electrical',
        title: 'OSHA Electrical Checklist',
        authority: 'OSHA',
        file: 'OSHA_Electrical_Checklist.pdf',
        updatedAt: daysAgo(55),
      },
      {
        id: 'inspect-osha-fire',
        title: 'OSHA Fire Safety Checklist',
        authority: 'OSHA',
        file: 'OSHA_Fire_Safety_Checklist.pdf',
        updatedAt: daysAgo(55),
      },
      {
        id: 'inspect-fema-safety',
        title: 'FEMA Building Safety Evaluation',
        authority: 'FEMA',
        file: 'FEMA_Building_Safety_Evaluation.pdf',
        updatedAt: daysAgo(55),
      },
      {
        id: 'inspect-niosh-assessment',
        title: 'NIOSH Building Assessment',
        authority: 'NIOSH',
        file: 'NIOSH_Building_Assessment.pdf',
        updatedAt: daysAgo(55),
      },
      {
        id: 'inspect-emergency-prep',
        title: 'Emergency Preparedness Checklist',
        authority: 'Municipal',
        file: 'Emergency_Preparedness_Checklist.pdf',
        updatedAt: daysAgo(55),
      },
    ],
    pointCloudScans: [
      {
        id: 'scan-stanford-bunny',
        name: 'Stanford Bunny Scan',
        archive: 'stanford_bunny_scan.tar.gz',
        preview: 'pointcloud_example.png',
        points: '11 PLY scans',
        plyFile: 'pointcloud_sample.ply',
        capturedAt: daysAgo(28),
      },
      {
        id: 'scan-stanford-bunny-alt',
        name: 'Stanford Bunny Alt',
        archive: 'stanford_bunny_scan.tar.gz',
        preview: 'pointcloud_sample_statue.png',
        points: 'Preview mix',
        plyFile: 'pointcloud_sample.ply',
        capturedAt: daysAgo(28),
      },
    ],
    assetRegistry: [
      {
        assetId: `asset-${seed.toString(36).slice(0, 4)}-boiler`,
        name: 'Chaudiere principale',
        system: 'HVAC',
        location: 'Sous-sol',
        status: 'online',
        lastService: daysAgo(130),
        nextService: daysAgo(-60),
        warrantyUntil: '2028-09-30',
      },
      {
        assetId: `asset-${seed.toString(36).slice(0, 4)}-elev-1`,
        name: 'Ascenseur A',
        system: 'Circulation',
        location: 'Noyau Est',
        status: 'degraded',
        lastService: daysAgo(90),
        nextService: daysAgo(-30),
        warrantyUntil: '2027-06-15',
      },
      {
        assetId: `asset-${seed.toString(36).slice(0, 4)}-pump`,
        name: 'Pompe incendie',
        system: 'Securite',
        location: 'Local technique',
        status: 'inspection',
        lastService: daysAgo(190),
        nextService: daysAgo(-10),
        warrantyUntil: '2029-01-01',
      },
      {
        assetId: `asset-${seed.toString(36).slice(0, 4)}-roof`,
        name: 'Toiture segment B',
        system: 'Enveloppe',
        location: 'Toit',
        status: 'online',
        lastService: daysAgo(340),
        nextService: daysAgo(-365),
        warrantyUntil: '2030-10-12',
      },
    ],
    materialsLedger: [
      {
        material: 'Filtres MERV 13',
        quantity: 48,
        unit: 'unites',
        supplier: 'HVAC Depot',
        lastUsed: daysAgo(210),
        status: 'in-stock',
      },
      {
        material: 'Membrane TPO',
        quantity: 1200,
        unit: 'm2',
        supplier: 'ToitPro',
        lastUsed: daysAgo(340),
        status: 'low',
      },
      {
        material: 'Detecteurs fumee',
        quantity: 24,
        unit: 'unites',
        supplier: 'SecuriTech',
        lastUsed: daysAgo(120),
        status: 'ordered',
      },
    ],
    incidentReports: [
      {
        date: daysAgo(75),
        category: 'Plomberie',
        description: 'Fuite mineure en colonne eau froide.',
        severity: 'medium',
        status: 'resolved',
      },
      {
        date: daysAgo(32),
        category: 'Securite incendie',
        description: 'Capteur fumee declenche au niveau 4.',
        severity: 'high',
        status: 'monitoring',
      },
      {
        date: daysAgo(12),
        category: 'Electricite',
        description: 'Pic de charge sur panneau 2.',
        severity: 'critical',
        status: 'open',
      },
    ],
    dataSources: ['Google Maps', 'Permits ville', 'IFC/BIM', 'Scans mobiles', 'Capteurs IoT'],
    timeline: [
      { date: daysAgo(900), label: 'Acquisition du site', type: 'ownership' },
      { date: daysAgo(640), label: 'Permis majeur approuvé', type: 'permit' },
      { date: daysAgo(480), label: 'Inspection structure', type: 'inspection' },
      { date: daysAgo(320), label: 'Bail principal signé', type: 'lease' },
      { date: daysAgo(120), label: 'Intervention HVAC', type: 'maintenance' },
    ],
  };
}
