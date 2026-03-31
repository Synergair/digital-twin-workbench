import { X, Video, Camera, Scan, CheckCircle2 } from 'lucide-react';

interface GuidedCaptureWizardProps {
  propertyId: string;
  unitId: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

export function GuidedCaptureWizard({
  propertyId,
  unitId,
  onComplete,
  onCancel,
}: GuidedCaptureWizardProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Guided Capture</h2>
          <p className="text-sm text-white/60">
            {unitId ? `Unit capture for ${unitId}` : `Property capture for ${propertyId}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20">
            <Camera className="h-10 w-10 text-teal-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Capture Ready</h3>
          <p className="mt-3 text-white/60">
            Walk through the space and capture photos or video. The system will process your captures
            and build a 3D model automatically.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 hover:border-teal-500/50 hover:bg-teal-500/10"
            >
              <Video className="h-6 w-6" />
              <span className="text-xs">Video</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 hover:border-teal-500/50 hover:bg-teal-500/10"
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs">Photos</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 hover:border-teal-500/50 hover:bg-teal-500/10"
            >
              <Scan className="h-6 w-6" />
              <span className="text-xs">LiDAR</span>
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
