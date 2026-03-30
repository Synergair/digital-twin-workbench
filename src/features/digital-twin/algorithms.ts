import type { TwinPin, TwinUnit } from './types';

export function calculateComplexity(units: TwinUnit[], floors: number, layers: string[]) {
  const unitFactor = Math.min(units.length / 120, 1);
  const floorFactor = Math.min(floors / 20, 1);
  const layerFactor = Math.min(layers.length / 18, 1);
  return Math.round((unitFactor * 0.4 + floorFactor * 0.4 + layerFactor * 0.2) * 100);
}

export function calculateRiskScore(pins: TwinPin[]) {
  const severityWeight = pins.reduce((total, pin) => {
    if (pin.severity === 'urgent') return total + 4;
    if (pin.severity === 'planifie') return total + 2;
    return total + 3;
  }, 0);
  const openPins = pins.filter((pin) => pin.status === 'open' || pin.status === 'assigned').length;
  return Math.min(100, Math.round(openPins * 6 + severityWeight * 3));
}

export function recommendSkills(pin: TwinPin | null) {
  if (!pin) return ['Inspection générale', 'Diagnostic MEP'];
  const skills: string[] = [];
  const mepTypes = pin.mep_proximity.map((entry) => String(entry.type ?? ''));
  if (mepTypes.some((entry) => entry.includes('plomberie'))) skills.push('Plombier certifié');
  if (mepTypes.some((entry) => entry.includes('electricite'))) skills.push('Électricien compagnon');
  if (mepTypes.some((entry) => entry.includes('hvac'))) skills.push('Technicien HVAC');
  if (!skills.length) skills.push('Technicien bâtiment');
  if (pin.severity === 'urgent') skills.push('Intervention d’urgence');
  return skills;
}

export function estimateDispatchDuration(pin: TwinPin | null) {
  if (!pin) return '45-60 min';
  if (pin.severity === 'urgent') return '60-90 min';
  if (pin.severity === 'planifie') return '30-45 min';
  return pin.duration_est ?? '45-60 min';
}
