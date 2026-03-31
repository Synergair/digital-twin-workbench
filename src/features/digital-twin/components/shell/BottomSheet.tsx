import { useState, useMemo } from 'react';
import { Brain, History, Camera, Settings, ChevronDown, Video, Smartphone, FileImage, FileCode, AlertTriangle, Wrench, Shield, Clock, Package, Users, FileText } from 'lucide-react';
import { TwinPropertyIntelligencePanel } from '../TwinPropertyIntelligencePanel';
import { GuidedCaptureWizard } from '@/features/capture/components/GuidedCaptureWizard';
import { getTwinData, type TwinData } from '../../twinData';

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
  const twinData = useMemo(() => getTwinData(propertyId), [propertyId]);

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
      <div className="flex items-center justify-center py-2">
        <button type="button" onClick={onCollapse} className="h-1 w-12 rounded-full bg-white/20 transition-colors hover:bg-white/30" />
      </div>

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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={onCollapse} className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'intelligence' && (
          <div className="[&_.surface-card]:bg-white/5 [&_.surface-card]:border-white/10">
            <TwinPropertyIntelligencePanel propertyId={propertyId} />
          </div>
        )}
        {activeTab === 'history' && <HistoryTabContent twinData={twinData} />}
        {activeTab === 'capture' && <CaptureTabContent twinData={twinData} onStartCapture={onOpenCaptureWizard} />}
        {activeTab === 'settings' && <SettingsTabContent twinData={twinData} />}
      </div>
    </div>
  );
}

// ── History Tab ─────────────────────────────────────────
function HistoryTabContent({ twinData }: { twinData: TwinData }) {
  const [filter, setFilter] = useState<'all' | 'maintenance' | 'incidents' | 'timeline'>('all');

  const allEvents = useMemo(() => {
    const events: Array<{ id: string; date: string; title: string; subtitle: string; type: string; status: string; severity?: string }> = [];

    twinData.timeline.forEach((e, i) => {
      events.push({ id: `tl-${i}`, date: e.date, title: e.label, subtitle: e.type, type: e.type, status: 'completed' });
    });

    twinData.maintenanceHistory.forEach((m, i) => {
      events.push({
        id: `maint-${i}`, date: m.date, title: `${m.system} — ${m.action}`,
        subtitle: `${m.vendor} | ${m.cost.toLocaleString('fr-CA')} $`,
        type: 'maintenance', status: m.status,
      });
    });

    twinData.incidentReports.forEach((r, i) => {
      events.push({
        id: `inc-${i}`, date: r.date, title: `${r.category}: ${r.description}`,
        subtitle: `Severity: ${r.severity}`, type: 'incident', status: r.status, severity: r.severity,
      });
    });

    twinData.changeOrders.forEach((co, i) => {
      events.push({
        id: `co-${i}`, date: co.date, title: `Change Order: ${co.scope}`,
        subtitle: co.impact, type: 'change-order', status: co.status,
      });
    });

    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [twinData]);

  const filtered = filter === 'all' ? allEvents
    : filter === 'maintenance' ? allEvents.filter((e) => e.type === 'maintenance')
    : filter === 'incidents' ? allEvents.filter((e) => e.type === 'incident')
    : allEvents.filter((e) => !['maintenance', 'incident'].includes(e.type));

  const typeColors: Record<string, string> = {
    maintenance: 'bg-amber-500', incident: 'bg-red-500', permit: 'bg-purple-500',
    lease: 'bg-blue-500', inspection: 'bg-teal-500', ownership: 'bg-emerald-500',
    'change-order': 'bg-indigo-500',
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-500/20 text-emerald-400', 'in-progress': 'bg-amber-500/20 text-amber-400',
    scheduled: 'bg-blue-500/20 text-blue-400', open: 'bg-red-500/20 text-red-400',
    resolved: 'bg-emerald-500/20 text-emerald-400', monitoring: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400', pending: 'bg-amber-500/20 text-amber-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Building Timeline</h3>
        <span className="text-xs text-white/40">{filtered.length} events</span>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'maintenance', label: 'Maintenance' },
          { key: 'incidents', label: 'Incidents' },
          { key: 'timeline', label: 'Milestones' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key as typeof filter)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${filter === f.key ? 'bg-teal-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 20).map((event) => (
          <div key={event.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${typeColors[event.type] ?? 'bg-slate-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{event.title}</p>
              <p className="text-xs text-white/40 truncate">{event.subtitle}</p>
              <p className="mt-1 text-[10px] text-white/30">{event.date}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[event.status] ?? 'bg-white/10 text-white/50'}`}>
              {event.status}
            </span>
          </div>
        ))}
      </div>

      {/* Contractor Roster */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Contractor Roster</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {twinData.contractorRoster.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{c.name}</p>
                <p className="text-[10px] text-white/40">{c.trade} | {c.license}</p>
              </div>
              <span className="text-xs text-amber-400">{c.rating}★</span>
            </div>
          ))}
        </div>
      </div>

      {/* Crew Roster */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Crew Roster</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {twinData.crewRoster.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{c.name}</p>
                <p className="text-[10px] text-white/40">{c.role} — {c.employer}</p>
                <p className="text-[10px] text-white/30">{c.certifications.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Capture Tab ─────────────────────────────────────────
function CaptureTabContent({ twinData, onStartCapture }: { twinData: TwinData; onStartCapture: () => void }) {
  const captureOptions = [
    { id: 'video', label: 'Video Walkthrough', desc: 'Film each room with guided coverage tracking (5-10 min)', icon: Video, color: 'text-teal-400', recommended: true },
    { id: 'lidar', label: 'LiDAR Scan', desc: 'iPhone Pro/iPad Pro with depth sensor', icon: Smartphone, color: 'text-indigo-400' },
    { id: 'photos', label: 'Photo Sequence', desc: '8-12 photos per room, higher quality mesh', icon: Camera, color: 'text-amber-400' },
    { id: 'ifc', label: 'IFC/BIM Import', desc: 'Import existing building model file', icon: FileCode, color: 'text-sky-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Capture Your Space</h3>
          <p className="text-xs text-white/50">Create a digital twin of your property</p>
        </div>
        <button type="button" onClick={onStartCapture} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400">
          Start Capture
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {captureOptions.map((method) => {
          const Icon = method.icon;
          return (
            <button key={method.id} type="button" onClick={onStartCapture}
              className="group relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-teal-500/30 hover:bg-white/10">
              {'recommended' in method && method.recommended && (
                <span className="absolute -top-2 right-3 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-medium text-white">Recommended</span>
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

      {/* Existing IFC Models */}
      {twinData.ifcModels.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Available BIM Models</h4>
          <div className="space-y-2">
            {twinData.ifcModels.map((model) => (
              <div key={model.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <FileCode className="h-5 w-5 text-sky-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{model.name}</p>
                  <p className="text-[10px] text-white/40">{model.buildingType} | {model.sizeMb} MB | {model.file}</p>
                </div>
                <span className="text-[10px] text-white/30">{model.updatedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Point Cloud Scans */}
      {twinData.pointCloudScans.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Point Cloud Scans</h4>
          <div className="space-y-2">
            {twinData.pointCloudScans.map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                  <img src={`/documents/scans/${scan.preview}`} alt={scan.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{scan.name}</p>
                  <p className="text-[10px] text-white/40">{scan.points} | {scan.capturedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────
function SettingsTabContent({ twinData }: { twinData: TwinData }) {
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
          <div key={setting.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white">{setting.label}</span>
            <span className="text-sm text-white/50">{setting.value}</span>
          </div>
        ))}
      </div>

      {/* Asset Registry */}
      <h3 className="mt-6 text-sm font-semibold text-white">Asset Registry</h3>
      <div className="space-y-2">
        {twinData.assetRegistry.map((asset) => {
          const statusColors: Record<string, string> = {
            online: 'bg-emerald-500', degraded: 'bg-amber-500', offline: 'bg-red-500', inspection: 'bg-blue-500',
          };
          return (
            <div key={asset.assetId} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className={`h-2.5 w-2.5 rounded-full ${statusColors[asset.status] ?? 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white">{asset.name}</p>
                <p className="text-[10px] text-white/40">{asset.system} | {asset.location}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">Next: {asset.nextService}</p>
                <p className="text-[10px] text-white/30">Warranty: {asset.warrantyUntil}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Materials Ledger */}
      <h3 className="mt-6 text-sm font-semibold text-white">Materials Ledger</h3>
      <div className="space-y-2">
        {twinData.materialsLedger.map((m) => {
          const statusColors: Record<string, string> = {
            'in-stock': 'text-emerald-400', low: 'text-amber-400', ordered: 'text-blue-400',
          };
          return (
            <div key={m.material} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-white">{m.material}</p>
                <p className="text-[10px] text-white/40">{m.supplier} | Last used: {m.lastUsed}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white">{m.quantity} {m.unit}</p>
                <p className={`text-[10px] font-medium ${statusColors[m.status] ?? 'text-white/40'}`}>{m.status}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Documents */}
      <h3 className="mt-6 text-sm font-semibold text-white">Invoices & Warranties</h3>
      <div className="space-y-2">
        {twinData.invoices.map((inv) => {
          const statusColors: Record<string, string> = {
            paid: 'text-emerald-400', open: 'text-amber-400', overdue: 'text-red-400',
          };
          return (
            <div key={inv.invoiceId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-white">{inv.vendor}</p>
                <p className="text-[10px] text-white/40">{inv.invoiceId} | Due: {inv.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white">{inv.amount.toLocaleString('fr-CA')} $</p>
                <p className={`text-[10px] font-medium ${statusColors[inv.status] ?? 'text-white/40'}`}>{inv.status}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {twinData.warrantyDocs.map((w) => (
          <div key={w.docId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-white">{w.system} Warranty</p>
              <p className="text-[10px] text-white/40">{w.coverage} | {w.provider}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40">Expires: {w.expiry}</p>
              <a href={`/documents/${w.file}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-400 hover:text-teal-300">
                View PDF
              </a>
            </div>
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
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white">{item.label}</span>
            <button className="text-xs text-teal-400 hover:text-teal-300">{item.action}</button>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Data Sources</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {twinData.dataSources.map((src) => (
            <span key={src} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{src}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
