import type { TwinLayoutPoint, TwinUnit } from './types';

const FLOOR_HEIGHT = 2.7;
const COLUMN_SPACING = 2.2;
const ROW_SPACING = 2;

export function getTwinUnitLayout(unit: TwinUnit, units: TwinUnit[]): TwinLayoutPoint {
  const sameFloor = units
    .filter((entry) => entry.floor === unit.floor)
    .sort((a, b) => a.unit_number.localeCompare(b.unit_number, 'fr-CA', { numeric: true, sensitivity: 'base' }));
  const index = sameFloor.findIndex((entry) => entry.id === unit.id);
  const columns = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(sameFloor.length || 1))));
  const row = Math.floor(Math.max(index, 0) / columns);
  const column = Math.max(index, 0) % columns;
  const width = (columns - 1) * COLUMN_SPACING;
  const rows = Math.max(1, Math.ceil(sameFloor.length / columns));
  const depth = (rows - 1) * ROW_SPACING;

  return {
    x: column * COLUMN_SPACING - width / 2,
    y: Math.max(unit.floor, 0) * FLOOR_HEIGHT,
    z: row * ROW_SPACING - depth / 2,
  };
}

export function projectTwinPoint(point: TwinLayoutPoint) {
  return {
    x: point.x * 32 + 180,
    y: 220 - point.y * 22 + point.z * 8,
  };
}

export const twinSceneConstants = {
  floorHeight: FLOOR_HEIGHT,
};
