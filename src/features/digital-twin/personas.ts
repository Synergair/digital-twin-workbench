import type { TwinLayer, TwinTab } from './types';

export type TwinPersona = {
  id: 'owner' | 'manager' | 'developer' | 'tenant' | 'vendor';
  label: string;
  description: string;
  readOnly: boolean;
  canViewOtherUnits: boolean;
  defaultTab: TwinTab;
  defaultLayers: TwinLayer[];
};

export const personaConfigs: TwinPersona[] = [
  {
    id: 'owner',
    label: 'Propriétaire',
    description: 'Vision globale, pilotage asset et performance.',
    readOnly: false,
    canViewOtherUnits: true,
    defaultTab: 'structure',
    defaultLayers: ['structure', 'envelope', 'plomberie', 'hvac', 'electricite', 'fire', 'parking', 'roof', 'zones', 'maintenance'],
  },
  {
    id: 'manager',
    label: 'Gestionnaire',
    description: 'Coordination maintenance + opérations.',
    readOnly: false,
    canViewOtherUnits: true,
    defaultTab: 'mep',
    defaultLayers: ['plomberie', 'hvac', 'electricite', 'fire', 'security', 'access', 'maintenance', 'cameras', 'sensors'],
  },
  {
    id: 'developer',
    label: 'Développeur',
    description: 'Analyse programme, enveloppe et faisabilité.',
    readOnly: true,
    canViewOtherUnits: true,
    defaultTab: 'structure',
    defaultLayers: ['structure', 'envelope', 'roof', 'solar', 'parking', 'it'],
  },
  {
    id: 'tenant',
    label: 'Locataire',
    description: 'Signalement dans son unité.',
    readOnly: false,
    canViewOtherUnits: false,
    defaultTab: 'unites',
    defaultLayers: ['zones', 'maintenance', 'plomberie', 'hvac', 'electricite'],
  },
  {
    id: 'vendor',
    label: 'Fournisseur',
    description: 'Briefing intervention + contexte MEP.',
    readOnly: true,
    canViewOtherUnits: true,
    defaultTab: 'mep',
    defaultLayers: ['plomberie', 'hvac', 'electricite', 'fire', 'access', 'maintenance'],
  },
];

export function getPersona(id?: string | null) {
  return personaConfigs.find((persona) => persona.id === id) ?? personaConfigs[0];
}
