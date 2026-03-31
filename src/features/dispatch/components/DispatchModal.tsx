import { useState, useCallback } from 'react';
import {
  X,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Sparkles,
  Shield,
  HelpCircle,
  Clock,
  MapPin,
  Camera,
  Send,
} from 'lucide-react';
import { useDispatchStore, type DispatchCategory, type DispatchPriority } from '../store/dispatchStore';
import type { TwinUnit } from '@/features/digital-twin/types';

interface DispatchModalProps {
  propertyId: string;
  unit?: TwinUnit | null;
  coordinates?: { x: number; y: number; z: number } | null;
  pinId?: string | null;
  onClose: () => void;
  onSuccess?: (dispatchId: string) => void;
}

const categoryOptions: { value: DispatchCategory; label: string; icon: React.ElementType }[] = [
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'repair', label: 'Repair', icon: AlertTriangle },
  { value: 'inspection', label: 'Inspection', icon: ClipboardCheck },
  { value: 'cleaning', label: 'Cleaning', icon: Sparkles },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'other', label: 'Other', icon: HelpCircle },
];

const priorityOptions: { value: DispatchPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

const durationOptions = [
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '4h', label: 'Half day' },
  { value: '8h', label: 'Full day' },
  { value: 'multi', label: 'Multiple days' },
];

export function DispatchModal({
  propertyId,
  unit,
  coordinates,
  pinId,
  onClose,
  onSuccess,
}: DispatchModalProps) {
  const { createDispatch } = useDispatchStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DispatchCategory>('maintenance');
  const [priority, setPriority] = useState<DispatchPriority>('medium');
  const [scheduledFor, setScheduledFor] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('1h');
  const [assignedTo, setAssignedTo] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const dispatchId = createDispatch({
        propertyId,
        unitId: unit?.id ?? null,
        pinId: pinId ?? null,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: assignedTo ? 'assigned' : 'open',
        assignedTo: assignedTo || null,
        assignedAt: assignedTo ? new Date().toISOString() : null,
        scheduledFor: scheduledFor || null,
        estimatedDuration,
        actualDuration: null,
        coordinates: coordinates ?? null,
        photoUrls,
        createdBy: 'Current User', // TODO: Get from auth context
        completedAt: null,
      });

      onSuccess?.(dispatchId);
      onClose();
    } catch (error) {
      console.error('Failed to create dispatch:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    description,
    category,
    priority,
    assignedTo,
    scheduledFor,
    estimatedDuration,
    photoUrls,
    propertyId,
    unit?.id,
    pinId,
    coordinates,
    createDispatch,
    onSuccess,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-800/95 p-4 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-white">Create Dispatch</h2>
            {unit && (
              <p className="mt-0.5 text-sm text-white/60">
                {unit.unit_number} • Floor {unit.floor}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-5 p-4">
          {/* Location Info */}
          {(unit || coordinates) && (
            <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 p-3">
              <MapPin className="h-4 w-4 text-teal-400" />
              <div className="text-sm">
                <span className="text-white">
                  {unit ? `Unit ${unit.unit_number}` : 'Building'}
                </span>
                {coordinates && (
                  <span className="ml-2 text-white/50">
                    ({coordinates.x.toFixed(1)}, {coordinates.y.toFixed(1)}, {coordinates.z.toFixed(1)})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue..."
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                    style={isSelected ? { backgroundColor: `${opt.color}30`, color: opt.color } : {}}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the issue, what needs to be done..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                <Clock className="mr-1.5 inline h-3.5 w-3.5" />
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Estimated Duration
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white focus:border-teal-500 focus:outline-none"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Assign To (optional)
            </label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Technician name or team..."
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white placeholder-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Photo Upload Placeholder */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Photos</label>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 py-4 text-sm text-white/50 transition-colors hover:border-teal-500/40 hover:text-teal-400"
            >
              <Camera className="h-5 w-5" />
              Add photos (optional)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/10 bg-slate-800/95 p-4 backdrop-blur-sm">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DispatchModal;
