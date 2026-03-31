import { useState } from 'react';
import { Brain, Activity, Layers3, Map, Database } from '@/components/icons/basil-lucide';
import { TwinPropertyIntelligencePanel } from '../TwinPropertyIntelligencePanel';
import { TwinIoTDashboard } from '../TwinIoTDashboard';
import { BimPipelineCard } from '../BimPipelineCard';
import { TwinModelStudioPanel } from '../TwinModelStudioPanel';
import { TwinEstateExplorerPanel } from '../TwinEstateExplorerPanel';
import { TwinDataUniversePanel } from '../TwinDataUniversePanel';
import type { TwinUnit, TwinView } from '../../types';

type SecondaryTab = 'intelligence' | 'iot' | 'bim' | 'explorer' | 'data';

interface TwinSecondaryTabsProps {
  propertyId: string;
  propertyName: string;
  units: TwinUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
  onSetFloor: (floor: number | null) => void;
  onSetView: (view: TwinView) => void;
  defaultTab?: SecondaryTab;
}

const tabs: { id: SecondaryTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: <Brain className="h-4 w-4" />,
    description: 'Données de marché, évaluation et proximités',
  },
  {
    id: 'iot',
    label: 'IoT',
    icon: <Activity className="h-4 w-4" />,
    description: 'Capteurs, consommation et monitoring temps réel',
  },
  {
    id: 'bim',
    label: 'BIM Studio',
    icon: <Layers3 className="h-4 w-4" />,
    description: 'Modélisation, pipeline et import IFC',
  },
  {
    id: 'explorer',
    label: 'Explorer',
    icon: <Map className="h-4 w-4" />,
    description: 'Navigation unités et visualisation spatiale',
  },
  {
    id: 'data',
    label: 'Data Universe',
    icon: <Database className="h-4 w-4" />,
    description: 'Documents, historique et sources de données',
  },
];

export function TwinSecondaryTabs({
  propertyId,
  propertyName,
  units,
  selectedUnitId,
  onSelectUnit,
  onSetFloor,
  onSetView,
  defaultTab = 'intelligence',
}: TwinSecondaryTabsProps) {
  const [activeTab, setActiveTab] = useState<SecondaryTab>(defaultTab);
  const activeTabConfig = tabs.find((t) => t.id === activeTab);

  return (
    <div className="surface-card p-5">
      {/* Tab Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--semantic-text-muted)]">
            Modules secondaires
          </p>
          <p className="mt-1 text-sm text-[var(--semantic-text-subtle)]">
            {activeTabConfig?.description}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar mt-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`tab-item flex items-center gap-2 ${activeTab === tab.id ? 'tab-item-active' : ''}`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-5">
        {activeTab === 'intelligence' && (
          <TwinPropertyIntelligencePanel propertyId={propertyId} />
        )}

        {activeTab === 'iot' && (
          <TwinIoTDashboard propertyId={propertyId} />
        )}

        {activeTab === 'bim' && (
          <div className="space-y-5">
            <BimPipelineCard />
            <TwinModelStudioPanel propertyId={propertyId} />
          </div>
        )}

        {activeTab === 'explorer' && (
          <TwinEstateExplorerPanel
            propertyName={propertyName}
            units={units}
            selectedUnitId={selectedUnitId}
            onSelectUnit={onSelectUnit}
            onSetFloor={onSetFloor}
            onSetView={onSetView}
          />
        )}

        {activeTab === 'data' && (
          <TwinDataUniversePanel propertyId={propertyId} />
        )}
      </div>
    </div>
  );
}
