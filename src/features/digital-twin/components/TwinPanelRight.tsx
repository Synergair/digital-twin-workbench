import { useState } from 'react';
import Button from '@/components/ui/button';
import { TwinAlertList } from './TwinAlertList';
import { UnitInfoPanel } from './UnitInfoPanel';
import { InspectionPanel } from './InspectionPanel';
import { VendorBriefingPanel } from './VendorBriefingPanel';
import { DataOverlayPanel } from './DataOverlayPanel';
import { SkillsMatrixPanel } from './SkillsMatrixPanel';
import { TwinIoTMonitoringPanel } from './TwinIoTMonitoringPanel';
import { TwinInteriorStudioPanel } from './TwinInteriorStudioPanel';
import { TwinUnitInteriorViewer } from './TwinUnitInteriorViewer';
import type { TwinPin, TwinSeverity, TwinUnit } from '../types';

type InteriorViewMode = 'parametric' | '3d-gltf';

export function TwinPanelRight({
  units,
  selectedUnit,
  selectedPins,
  inspectionMode,
  readOnly,
  currentSeverity,
  pinDropMode,
  onChangeSeverity,
  onTogglePinDrop,
  onStartDispatch,
}: {
  units: TwinUnit[];
  selectedUnit: TwinUnit | null;
  selectedPins: TwinPin[];
  inspectionMode: boolean;
  readOnly: boolean;
  currentSeverity: TwinSeverity;
  pinDropMode: boolean;
  onChangeSeverity: (severity: TwinSeverity) => void;
  onTogglePinDrop: () => void;
  onStartDispatch: () => void;
}) {
  const [interiorViewMode, setInteriorViewMode] = useState<InteriorViewMode>('parametric');

  return (
    <div className="space-y-4">
      <UnitInfoPanel unit={selectedUnit} />

      {/* Interior View Toggle */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--semantic-border)] bg-white/80 p-2">
        <span className="text-xs font-semibold text-[var(--semantic-text-subtle)]">Interior View:</span>
        <Button
          type="button"
          size="sm"
          variant={interiorViewMode === 'parametric' ? 'primary' : 'secondary'}
          onClick={() => setInteriorViewMode('parametric')}
        >
          Parametric
        </Button>
        <Button
          type="button"
          size="sm"
          variant={interiorViewMode === '3d-gltf' ? 'primary' : 'secondary'}
          onClick={() => setInteriorViewMode('3d-gltf')}
        >
          3D GLTF
        </Button>
      </div>

      {interiorViewMode === 'parametric' ? (
        <TwinInteriorStudioPanel unit={selectedUnit} />
      ) : (
        <TwinUnitInteriorViewer unit={selectedUnit} />
      )}

      <InspectionPanel
        unit={selectedUnit}
        pins={selectedPins}
        severity={currentSeverity}
        pinDropMode={pinDropMode}
        readOnly={readOnly}
        onChangeSeverity={onChangeSeverity}
        onTogglePinDrop={onTogglePinDrop}
        onStartDispatch={onStartDispatch}
      />
      <VendorBriefingPanel unit={selectedUnit} pin={selectedPins[0] ?? null} />
      <TwinIoTMonitoringPanel />
      <DataOverlayPanel />
      <SkillsMatrixPanel />
      <TwinAlertList units={units} />
    </div>
  );
}
