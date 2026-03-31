import { useEffect, useRef, useMemo } from 'react';
import type { TwinUnit } from '../../types';

interface UnitLabel {
  unitId: string;
  unitNumber: string;
  worldPosition: [number, number, number];
  status: TwinUnit['status'];
  alertCount: number;
  isSelected: boolean;
  isHovered: boolean;
}

interface UnitLabels3DProps {
  units: TwinUnit[];
  unitPositions: Map<string, [number, number, number]>; // Unit ID -> 3D world position
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  showLabels: boolean;
  showAlertBadges: boolean;
  cameraState: {
    position: [number, number, number];
    target: [number, number, number];
  } | null;
  viewerCanvas: HTMLCanvasElement | null;
  onUnitClick: (unitId: string) => void;
  onUnitHover: (unitId: string | null) => void;
}

const statusColors: Record<TwinUnit['status'], { bg: string; text: string; border: string }> = {
  occupied: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  warn: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  alert: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  vacant: { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500/30' },
};

/**
 * UnitLabels3D - Renders floating labels in 3D space for each unit
 *
 * Uses CSS transforms to position HTML elements at 3D coordinates,
 * projecting world positions to screen space based on camera state.
 */
export function UnitLabels3D({
  units,
  unitPositions,
  selectedUnitId,
  hoveredUnitId,
  showLabels,
  showAlertBadges,
  cameraState,
  viewerCanvas,
  onUnitClick,
  onUnitHover,
}: UnitLabels3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Build label data with screen positions
  const labels = useMemo((): (UnitLabel & { screenX: number; screenY: number; distance: number; visible: boolean })[] => {
    if (!cameraState || !viewerCanvas) return [];

    const canvasRect = viewerCanvas.getBoundingClientRect();
    const result: (UnitLabel & { screenX: number; screenY: number; distance: number; visible: boolean })[] = [];

    for (const unit of units) {
      const worldPos = unitPositions.get(unit.id);
      if (!worldPos) continue;

      // Project 3D position to screen coordinates
      // This is a simplified projection - in production, use xeokit's math.projectWorldToCanvas
      const screenPos = projectToScreen(worldPos, cameraState, canvasRect);

      if (!screenPos) continue;

      const alertCount = unit.active_alerts.length;

      result.push({
        unitId: unit.id,
        unitNumber: unit.unit_number,
        worldPosition: worldPos,
        status: unit.status,
        alertCount,
        isSelected: selectedUnitId === unit.id,
        isHovered: hoveredUnitId === unit.id,
        screenX: screenPos.x,
        screenY: screenPos.y,
        distance: screenPos.distance,
        visible: screenPos.visible,
      });
    }

    // Sort by distance (furthest first for proper z-ordering)
    result.sort((a, b) => b.distance - a.distance);

    return result;
  }, [units, unitPositions, selectedUnitId, hoveredUnitId, cameraState, viewerCanvas]);

  if (!showLabels || !viewerCanvas) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 20 }}
    >
      {labels.map((label) => {
        if (!label.visible) return null;

        // Scale based on distance (closer = larger)
        const scale = Math.max(0.5, Math.min(1.2, 10 / label.distance));
        const opacity = label.isSelected ? 1 : label.isHovered ? 0.95 : 0.85;

        const colors = statusColors[label.status] || statusColors.occupied;

        return (
          <div
            key={label.unitId}
            className="pointer-events-auto absolute"
            style={{
              left: label.screenX,
              top: label.screenY,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: label.isSelected ? 100 : label.isHovered ? 50 : Math.floor(1000 - label.distance),
            }}
          >
            {/* Label container */}
            <button
              type="button"
              onClick={() => onUnitClick(label.unitId)}
              onMouseEnter={() => onUnitHover(label.unitId)}
              onMouseLeave={() => onUnitHover(null)}
              className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shadow-lg backdrop-blur-sm transition-all ${
                label.isSelected
                  ? 'border-teal-500 bg-teal-500/20 ring-2 ring-teal-500/50'
                  : label.isHovered
                  ? `${colors.border} bg-slate-800/95`
                  : `${colors.border} bg-slate-800/80 hover:bg-slate-800/95`
              }`}
            >
              {/* Status indicator dot */}
              <span className={`h-2 w-2 rounded-full ${colors.bg}`} />

              {/* Unit number */}
              <span className={`text-xs font-medium ${label.isSelected ? 'text-teal-400' : 'text-white'}`}>
                {label.unitNumber}
              </span>

              {/* Alert badge */}
              {showAlertBadges && label.alertCount > 0 && (
                <span
                  className={`-mr-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    label.status === 'alert'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {label.alertCount}
                </span>
              )}

              {/* Connector line */}
              <div
                className={`absolute left-1/2 top-full h-4 w-px -translate-x-1/2 ${
                  label.isSelected ? 'bg-teal-500' : colors.bg
                }`}
                style={{ opacity: 0.5 }}
              />

              {/* Bottom dot */}
              <div
                className={`absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 translate-y-4 rounded-full ${
                  label.isSelected ? 'bg-teal-500' : colors.bg
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simplified 3D to 2D projection
 * In production, use xeokit's built-in projection utilities
 */
function projectToScreen(
  worldPos: [number, number, number],
  camera: { position: [number, number, number]; target: [number, number, number] },
  canvasRect: DOMRect
): { x: number; y: number; distance: number; visible: boolean } | null {
  // Calculate view direction
  const viewDir = [
    camera.target[0] - camera.position[0],
    camera.target[1] - camera.position[1],
    camera.target[2] - camera.position[2],
  ];

  // Vector from camera to point
  const toPoint = [
    worldPos[0] - camera.position[0],
    worldPos[1] - camera.position[1],
    worldPos[2] - camera.position[2],
  ];

  // Distance from camera
  const distance = Math.sqrt(toPoint[0] ** 2 + toPoint[1] ** 2 + toPoint[2] ** 2);

  // Check if point is in front of camera (simplified)
  const dot = viewDir[0] * toPoint[0] + viewDir[1] * toPoint[1] + viewDir[2] * toPoint[2];
  if (dot < 0) {
    return { x: 0, y: 0, distance, visible: false };
  }

  // Simplified perspective projection
  // This is a placeholder - actual implementation should use proper projection matrix
  const fov = 45;
  const aspect = canvasRect.width / canvasRect.height;
  const near = 0.1;

  // Normalize to clip space (very simplified)
  const z = Math.max(near, distance);
  const projScale = (canvasRect.width / 2) / Math.tan((fov * Math.PI) / 360);

  // Calculate screen position relative to camera target
  const dx = worldPos[0] - camera.target[0];
  const dy = worldPos[1] - camera.target[1];

  const screenX = canvasRect.width / 2 + (dx * projScale) / z;
  const screenY = canvasRect.height / 2 - (dy * projScale) / z;

  // Check if on screen
  const visible =
    screenX >= -50 &&
    screenX <= canvasRect.width + 50 &&
    screenY >= -50 &&
    screenY <= canvasRect.height + 50;

  return { x: screenX, y: screenY, distance, visible };
}

export default UnitLabels3D;
