import { TwinAlertList } from './TwinAlertList';
import { UnitInfoPanel } from './UnitInfoPanel';
import { InspectionPanel } from './InspectionPanel';
import { VendorBriefingPanel } from './VendorBriefingPanel';
import { DataOverlayPanel } from './DataOverlayPanel';
import { SkillsMatrixPanel } from './SkillsMatrixPanel';
import { TwinIoTMonitoringPanel } from './TwinIoTMonitoringPanel';
import { TwinInteriorStudioPanel } from './TwinInteriorStudioPanel';
import type { TwinPin, TwinSeverity, TwinUnit } from '../types';

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
  return (
    <div className="space-y-4">
      <UnitInfoPanel unit={selectedUnit} />
      <TwinInteriorStudioPanel unit={selectedUnit} />
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
