import { Brain, History, Camera, Settings, ChevronDown, X, Video, Smartphone, FileImage, FileCode } from 'lucide-react';
import { TwinPropertyIntelligencePanel } from '../TwinPropertyIntelligencePanel';
import { GuidedCaptureWizard } from '@/features/capture/components/GuidedCaptureWizard';

interface BottomSheetProps {
  expanded: boolean;
  activeTab: 'intelligence' | 'history' | 'capture' | 'settings';
  propertyId: string;
  unitId: string | null;
  captureWizardOpen: boolean;
  onTabChange: (tab: 'intelligence' | 'history' | 'capture' | 'settings') => void;
  onCollapse: () => void;
  onOpenCaptureWizard: () => void;
  onCloseCaptureWizard: () => void;
}

const tabs = [
  { id: 'intelligence' as const, label: 'Intelligence', icon: Brain },
  { id: 'history' as const, label: 'History', icon: History },
  { id: 'capture' as const, label: 'Capture', icon: Camera },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function BottomSheet({
  expanded,
  activeTab,
  propertyId,
  unitId,
  captureWizardOpen,
  onTabChange,
  onCollapse,
  onOpenCaptureWizard,
  onCloseCaptureWizard,
}: BottomSheetProps) {
  // If capture wizard is open, show it full-screen over the sheet
  if (captureWizardOpen) {
    return (
      <div className="fixed inset-x-0 bottom-14 top-12 z-50 flex flex-col bg-slate-900">
        <GuidedCaptureWizard
          propertyId={propertyId}
          unitId={unitId}
          onComplete={onCloseCaptureWizard}
          onCancel={onCloseCaptureWizard}
        />
      </div>
    );
  }

  if (!expanded) return null;

  return (
    <div className="fixed inset-x-0 bottom-14 z-50 flex max-h-[60vh] flex-col rounded-t-2xl border-t border-white/10 bg-slate-900/98 backdrop-blur-sm">
      {/* Handle Bar */}
      <div className="flex items-center justify-center py-2">
        <button
          type="button"
          onClick={onCollapse}
          className="h-1 w-12 rounded-full bg-white/20 transition-colors hover:bg-white/30"
        />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 pb-2">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onCollapse}
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'intelligence' && (
          <div className="[&_.surface-card]:bg-white/5 [&_.surface-card]:border-white/10">
            <TwinPropertyIntelligencePanel propertyId={propertyId} />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryTabContent />
        )}

        {activeTab === 'capture' && (
          <CaptureTabContent onStartCapture={onOpenCaptureWizard} />
        )}

        {activeTab === 'settings' && (
          <SettingsTabContent />
        )}
      </div>
    </div>
  );
}

function HistoryTabContent() {
  const mockEvents = [
    { id: '1', type: 'inspection', date: '2024-03-15', title: 'Annual Inspection', status: 'completed' },
    { id: '2', type: 'repair', date: '2024-02-28', title: 'HVAC Maintenance', status: 'completed' },
    { id: '3', type: 'capture', date: '2024-02-10', title: 'Interior Scan - Unit 101', status: 'completed' },
    { id: '4', type: 'permit', date: '2024-01-20', title: 'Renovation Permit Filed', status: 'pending' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Building Timeline</h3>
        <button className="text-xs text-teal-400 hover:text-teal-300">Add Event</button>
      </div>

      <div className="space-y-2">
        {mockEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div
              className={`h-2 w-2 rounded-full ${
                event.type === 'inspection'
                  ? 'bg-blue-500'
                  : event.type === 'repair'
                  ? 'bg-amber-500'
                  : event.type === 'capture'
                  ? 'bg-emerald-500'
                  : 'bg-purple-500'
              }`}
            />
            <div className="flex-1">
              <p className="text-sm text-white">{event.title}</p>
              <p className="text-xs text-white/50">{event.date}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                event.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {event.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaptureTabContent({ onStartCapture }: { onStartCapture: () => void }) {
  const captureOptions = [
    {
      id: 'video',
      label: 'Video Walkthrough',
      desc: 'Film each room with guided coverage tracking (5-10 min)',
      icon: Video,
      color: 'text-teal-400',
      recommended: true,
    },
    {
      id: 'lidar',
      label: 'LiDAR Scan',
      desc: 'iPhone Pro/iPad Pro with depth sensor',
      icon: Smartphone,
      color: 'text-indigo-400',
    },
    {
      id: 'photos',
      label: 'Photo Sequence',
      desc: '8-12 photos per room, higher quality mesh',
      icon: Camera,
      color: 'text-amber-400',
    },
    {
      id: 'ifc',
      label: 'IFC/BIM Import',
      desc: 'Import existing building model file',
      icon: FileCode,
      color: 'text-sky-400',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Capture Your Space</h3>
          <p className="text-xs text-white/50">Create a digital twin of your property</p>
        </div>
        <button
          type="button"
          onClick={onStartCapture}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400"
        >
          Start Capture
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {captureOptions.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              onClick={onStartCapture}
              className="group relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-teal-500/30 hover:bg-white/10"
            >
              {method.recommended && (
                <span className="absolute -top-2 right-3 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  Recommended
                </span>
              )}
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 ${method.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white group-hover:text-teal-400">{method.label}</p>
                <p className="mt-0.5 text-xs text-white/50">{method.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div className="rounded-xl border border-dashed border-white/20 p-6 text-center transition-colors hover:border-teal-500/30">
        <FileImage className="mx-auto h-8 w-8 text-white/20" />
        <p className="mt-2 text-sm text-white/50">Drag & drop files here or click to upload</p>
        <p className="mt-1 text-xs text-white/30">Supports: IFC, PLY, OBJ, GLTF, Floor plans (PDF, JPG, PNG)</p>
      </div>

      {/* Recent captures */}
      <div className="rounded-xl bg-white/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">Recent Captures</p>
        <p className="mt-2 text-sm text-white/60">No captures yet. Start your first capture above.</p>
      </div>
    </div>
  );
}

function SettingsTabContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Viewer Settings</h3>

      <div className="space-y-3">
        {[
          { id: 'quality', label: 'Render Quality', value: 'High' },
          { id: 'shadows', label: 'Shadows', value: 'On' },
          { id: 'ambient', label: 'Ambient Occlusion', value: 'On' },
          { id: 'antialiasing', label: 'Antialiasing', value: 'MSAA 4x' },
        ].map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <span className="text-sm text-white">{setting.label}</span>
            <span className="text-sm text-white/50">{setting.value}</span>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-white">Data & Privacy</h3>
      <div className="space-y-3">
        {[
          { id: 'export', label: 'Export Building Data', action: 'Download' },
          { id: 'sharing', label: 'Sharing Settings', action: 'Configure' },
          { id: 'claims', label: 'Claim Management', action: 'View' },
        ].map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <span className="text-sm text-white">{item.label}</span>
            <button className="text-xs text-teal-400 hover:text-teal-300">
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
