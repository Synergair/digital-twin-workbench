import { useState, useMemo } from 'react';
import {
  X,
  Clock,
  User,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Play,
  XCircle,
  MessageSquare,
  History,
  Send,
  Filter,
} from 'lucide-react';
import { useDispatchStore, type DispatchItem, type DispatchStatus, type DispatchPriority } from '../store/dispatchStore';

interface DispatchPanelProps {
  propertyId: string;
  unitId?: string | null;
  onClose?: () => void;
  onSelectDispatch?: (dispatch: DispatchItem) => void;
}

const statusConfig: Record<DispatchStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Open', color: '#3b82f6', icon: Clock },
  assigned: { label: 'Assigned', color: '#f59e0b', icon: User },
  in_progress: { label: 'In Progress', color: '#8b5cf6', icon: Play },
  completed: { label: 'Completed', color: '#22c55e', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#6b7280', icon: XCircle },
};

const priorityConfig: Record<DispatchPriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#22c55e' },
};

export function DispatchPanel({ propertyId, unitId, onClose, onSelectDispatch }: DispatchPanelProps) {
  const { dispatches, assignDispatch, startDispatch, completeDispatch, cancelDispatch, addNote } =
    useDispatchStore();

  const [selectedDispatch, setSelectedDispatch] = useState<DispatchItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<DispatchStatus | 'all'>('all');
  const [newNote, setNewNote] = useState('');

  // Filter dispatches for this property/unit
  const filteredDispatches = useMemo(() => {
    let result = dispatches.filter((d) => d.propertyId === propertyId);
    if (unitId) {
      result = result.filter((d) => d.unitId === unitId || d.unitId === null);
    }
    if (filterStatus !== 'all') {
      result = result.filter((d) => d.status === filterStatus);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [dispatches, propertyId, unitId, filterStatus]);

  const handleSelectDispatch = (dispatch: DispatchItem) => {
    setSelectedDispatch(dispatch);
    onSelectDispatch?.(dispatch);
  };

  const handleAddNote = () => {
    if (!selectedDispatch || !newNote.trim()) return;
    addNote(selectedDispatch.id, newNote.trim(), 'Current User');
    setNewNote('');
    // Refresh selected dispatch
    const updated = dispatches.find((d) => d.id === selectedDispatch.id);
    if (updated) setSelectedDispatch(updated);
  };

  const handleStatusAction = (action: 'assign' | 'start' | 'complete' | 'cancel') => {
    if (!selectedDispatch) return;
    switch (action) {
      case 'assign':
        assignDispatch(selectedDispatch.id, 'Technician');
        break;
      case 'start':
        startDispatch(selectedDispatch.id);
        break;
      case 'complete':
        completeDispatch(selectedDispatch.id);
        break;
      case 'cancel':
        cancelDispatch(selectedDispatch.id);
        break;
    }
    // Refresh selected dispatch
    setTimeout(() => {
      const updated = useDispatchStore.getState().dispatches.find((d) => d.id === selectedDispatch.id);
      if (updated) setSelectedDispatch(updated);
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">Dispatches</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
            {filteredDispatches.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DispatchStatus | 'all')}
            className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:border-teal-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dispatch List */}
        <div className={`flex-1 overflow-y-auto ${selectedDispatch ? 'hidden sm:block sm:w-1/2 sm:border-r sm:border-white/10' : ''}`}>
          {filteredDispatches.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <Clock className="mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/60">No dispatches found</p>
              <p className="mt-1 text-xs text-white/40">
                Create a dispatch by clicking on the model
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredDispatches.map((dispatch) => {
                const status = statusConfig[dispatch.status];
                const priority = priorityConfig[dispatch.priority];
                const StatusIcon = status.icon;

                return (
                  <button
                    key={dispatch.id}
                    type="button"
                    onClick={() => handleSelectDispatch(dispatch)}
                    className={`w-full p-3 text-left transition-colors hover:bg-white/5 ${
                      selectedDispatch?.id === dispatch.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-white">{dispatch.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span
                            className="flex items-center gap-1 rounded-full px-1.5 py-0.5"
                            style={{ backgroundColor: `${status.color}20`, color: status.color }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                          <span
                            className="rounded-full px-1.5 py-0.5"
                            style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/40">
                          {formatDate(dispatch.createdAt)}
                          {dispatch.unitId && ` • Unit ${dispatch.unitId.slice(-4)}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/30" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispatch Detail */}
        {selectedDispatch && (
          <div className="flex flex-1 flex-col overflow-hidden sm:w-1/2">
            {/* Detail Header */}
            <div className="border-b border-white/10 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: `${statusConfig[selectedDispatch.status].color}20`,
                        color: statusConfig[selectedDispatch.status].color,
                      }}
                    >
                      {statusConfig[selectedDispatch.status].label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: `${priorityConfig[selectedDispatch.priority].color}20`,
                        color: priorityConfig[selectedDispatch.priority].color,
                      }}
                    >
                      {priorityConfig[selectedDispatch.priority].label}
                    </span>
                  </div>
                  <h4 className="mt-2 font-semibold text-white">{selectedDispatch.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDispatch(null)}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedDispatch.description && (
                <p className="mt-2 text-sm text-white/60">{selectedDispatch.description}</p>
              )}

              {/* Meta info */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                {selectedDispatch.assignedTo && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedDispatch.assignedTo}
                  </span>
                )}
                {selectedDispatch.scheduledFor && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(selectedDispatch.scheduledFor)}
                  </span>
                )}
                {selectedDispatch.coordinates && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Pin attached
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedDispatch.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleStatusAction('assign')}
                    className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
                  >
                    Assign
                  </button>
                )}
                {selectedDispatch.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() => handleStatusAction('start')}
                    className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/30"
                  >
                    Start Work
                  </button>
                )}
                {selectedDispatch.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => handleStatusAction('complete')}
                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
                  >
                    Complete
                  </button>
                )}
                {(selectedDispatch.status === 'open' ||
                  selectedDispatch.status === 'assigned' ||
                  selectedDispatch.status === 'in_progress') && (
                  <button
                    type="button"
                    onClick={() => handleStatusAction('cancel')}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* History / Notes */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                <History className="h-3.5 w-3.5" />
                <span>Activity History</span>
              </div>

              <div className="space-y-3">
                {selectedDispatch.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg p-3 ${
                      note.type === 'system' || note.type === 'status_change'
                        ? 'bg-white/5'
                        : 'bg-teal-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          note.type === 'comment' ? 'text-teal-400' : 'text-white/60'
                        }`}
                      >
                        {note.author}
                      </span>
                      <span className="text-xs text-white/40">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/80">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Note */}
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="rounded-lg bg-teal-600 px-3 text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DispatchPanel;
