import { useState, useCallback } from 'react';
import {
  Video,
  Camera,
  Smartphone,
  FileImage,
  FileCode,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useCaptureStore, type CaptureMethod, type CaptureStatus, type RoomType } from '../store/captureStore';

interface GuidedCaptureWizardProps {
  propertyId: string;
  unitId: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 'method' | 'rooms' | 'capture' | 'review' | 'upload' | 'processing';

const captureMethodOptions: { method: CaptureMethod; icon: React.ReactNode; label: string; description: string }[] = [
  {
    method: 'video',
    icon: <Video className="h-6 w-6" />,
    label: 'Vidéo walkthrough',
    description: 'Filmez en marchant dans chaque pièce (5-10 min)',
  },
  {
    method: 'photos',
    icon: <Camera className="h-6 w-6" />,
    label: 'Séquence photos',
    description: '8-12 photos par pièce, meilleure qualité',
  },
  {
    method: 'lidar',
    icon: <Smartphone className="h-6 w-6" />,
    label: 'Scan LiDAR',
    description: 'iPhone Pro/iPad Pro avec capteur LiDAR',
  },
  {
    method: 'floorplan',
    icon: <FileImage className="h-6 w-6" />,
    label: 'Plan d\'étage',
    description: 'Téléversez un PDF ou image du plan',
  },
  {
    method: 'ifc',
    icon: <FileCode className="h-6 w-6" />,
    label: 'Import IFC/BIM',
    description: 'Importez un fichier IFC existant',
  },
];

const roomTypeOptions: { type: RoomType; label: string; icon: string }[] = [
  { type: 'living', label: 'Salon', icon: '🛋️' },
  { type: 'bedroom', label: 'Chambre', icon: '🛏️' },
  { type: 'kitchen', label: 'Cuisine', icon: '🍳' },
  { type: 'bathroom', label: 'Salle de bain', icon: '🚿' },
  { type: 'hallway', label: 'Couloir', icon: '🚪' },
  { type: 'office', label: 'Bureau', icon: '💼' },
  { type: 'other', label: 'Autre', icon: '📦' },
];

export function GuidedCaptureWizard({
  propertyId,
  unitId,
  onComplete,
  onCancel,
}: GuidedCaptureWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<CaptureMethod | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>('living');

  const {
    session,
    startSession,
    addRoom,
    removeRoom,
    setStatus,
    cancelSession,
  } = useCaptureStore();

  const handleSelectMethod = useCallback((method: CaptureMethod) => {
    setSelectedMethod(method);
    startSession(propertyId, unitId, method);
    setCurrentStep('rooms');
  }, [propertyId, unitId, startSession]);

  const handleAddRoom = useCallback(() => {
    if (newRoomName.trim()) {
      addRoom(newRoomName.trim(), newRoomType);
      setNewRoomName('');
    }
  }, [newRoomName, newRoomType, addRoom]);

  const handleStartCapture = useCallback(() => {
    if (session && session.rooms.length > 0) {
      setStatus('capturing');
      setCurrentStep('capture');
    }
  }, [session, setStatus]);

  const handleCancel = useCallback(() => {
    cancelSession();
    onCancel();
  }, [cancelSession, onCancel]);

  const getStepNumber = (step: WizardStep): number => {
    const steps: WizardStep[] = ['method', 'rooms', 'capture', 'review', 'upload', 'processing'];
    return steps.indexOf(step) + 1;
  };

  const totalSteps = 6;

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Capture guidée</h2>
          <p className="text-sm text-white/60">
            Étape {getStepNumber(currentStep)} sur {totalSteps}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-teal-500 transition-all duration-300"
          style={{ width: `${(getStepNumber(currentStep) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentStep === 'method' && (
          <MethodSelection
            selectedMethod={selectedMethod}
            onSelectMethod={handleSelectMethod}
          />
        )}

        {currentStep === 'rooms' && session && (
          <RoomSetup
            rooms={session.rooms}
            newRoomName={newRoomName}
            newRoomType={newRoomType}
            onNameChange={setNewRoomName}
            onTypeChange={setNewRoomType}
            onAddRoom={handleAddRoom}
            onRemoveRoom={removeRoom}
          />
        )}

        {currentStep === 'capture' && session && (
          <CaptureInProgress
            session={session}
            onComplete={() => setCurrentStep('review')}
          />
        )}

        {currentStep === 'review' && session && (
          <ReviewCaptures
            session={session}
            onContinue={() => setCurrentStep('upload')}
            onRecapture={() => setCurrentStep('capture')}
          />
        )}

        {currentStep === 'upload' && session && (
          <UploadProgress
            progress={session.uploadProgress}
            onComplete={() => setCurrentStep('processing')}
          />
        )}

        {currentStep === 'processing' && session && (
          <ProcessingStatus
            stage={session.processingStage}
            onComplete={onComplete}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
        <button
          type="button"
          onClick={() => {
            const steps: WizardStep[] = ['method', 'rooms', 'capture', 'review', 'upload', 'processing'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1]);
            }
          }}
          disabled={currentStep === 'method' || currentStep === 'processing'}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>

        {currentStep === 'rooms' && (
          <button
            type="button"
            onClick={handleStartCapture}
            disabled={!session || session.rooms.length === 0}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Commencer la capture
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Sub-components

function MethodSelection({
  selectedMethod,
  onSelectMethod,
}: {
  selectedMethod: CaptureMethod | null;
  onSelectMethod: (method: CaptureMethod) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-white">Choisissez une méthode de capture</h3>
        <p className="mt-1 text-sm text-white/60">
          Sélectionnez comment vous souhaitez numériser votre espace
        </p>
      </div>

      <div className="grid gap-3">
        {captureMethodOptions.map((option) => (
          <button
            key={option.method}
            type="button"
            onClick={() => onSelectMethod(option.method)}
            className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
              selectedMethod === option.method
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              selectedMethod === option.method ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {option.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{option.label}</p>
              <p className="mt-0.5 text-sm text-white/60">{option.description}</p>
            </div>
            {selectedMethod === option.method && (
              <Check className="h-5 w-5 text-teal-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoomSetup({
  rooms,
  newRoomName,
  newRoomType,
  onNameChange,
  onTypeChange,
  onAddRoom,
  onRemoveRoom,
}: {
  rooms: { id: string; name: string; type: RoomType }[];
  newRoomName: string;
  newRoomType: RoomType;
  onNameChange: (name: string) => void;
  onTypeChange: (type: RoomType) => void;
  onAddRoom: () => void;
  onRemoveRoom: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-white">Définissez vos pièces</h3>
        <p className="mt-1 text-sm text-white/60">
          Ajoutez les pièces que vous allez capturer
        </p>
      </div>

      {/* Room list */}
      {rooms.length > 0 && (
        <div className="space-y-2">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-xs font-medium text-teal-400">
                  {index + 1}
                </span>
                <span className="text-sm text-white">
                  {roomTypeOptions.find(r => r.type === room.type)?.icon} {room.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveRoom(room.id)}
                className="text-white/40 transition-colors hover:text-rose-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add room form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm font-medium text-white">Ajouter une pièce</p>

        <div className="grid gap-3">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nom de la pièce (ex: Salon principal)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-teal-500"
          />

          <div className="flex flex-wrap gap-2">
            {roomTypeOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => onTypeChange(option.type)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                  newRoomType === option.type
                    ? 'bg-teal-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onAddRoom}
            disabled={!newRoomName.trim()}
            className="w-full rounded-lg bg-white/10 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Ajouter cette pièce
          </button>
        </div>
      </div>

      {rooms.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Ajoutez au moins une pièce pour continuer
        </div>
      )}
    </div>
  );
}

function CaptureInProgress({
  session,
  onComplete,
}: {
  session: { rooms: { id: string; name: string; status: string; coverage: number }[]; currentRoomIndex: number };
  onComplete: () => void;
}) {
  const currentRoom = session.rooms[session.currentRoomIndex];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-base font-medium text-white">
          Capture: {currentRoom?.name || 'Pièce'}
        </h3>
        <p className="mt-1 text-sm text-white/60">
          Pièce {session.currentRoomIndex + 1} sur {session.rooms.length}
        </p>
      </div>

      {/* Camera preview placeholder */}
      <div className="aspect-video rounded-xl bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-white/20" />
          <p className="mt-2 text-sm text-white/40">Aperçu caméra</p>
          <p className="text-xs text-white/20">CapturePreview component à intégrer</p>
        </div>
      </div>

      {/* Room progress */}
      <div className="flex gap-1">
        {session.rooms.map((room, index) => (
          <div
            key={room.id}
            className={`h-1 flex-1 rounded-full transition-all ${
              room.status === 'complete'
                ? 'bg-teal-500'
                : index === session.currentRoomIndex
                ? 'bg-teal-500/50'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
      >
        Terminer la capture
      </button>
    </div>
  );
}

function ReviewCaptures({
  session,
  onContinue,
  onRecapture,
}: {
  session: { photos: unknown[]; qualityScore: number; qualityIssues: { message: string }[] };
  onContinue: () => void;
  onRecapture: () => void;
}) {
  const hasIssues = session.qualityIssues.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-white">Révision des captures</h3>
        <p className="mt-1 text-sm text-white/60">
          {session.photos.length} captures • Score qualité: {session.qualityScore}%
        </p>
      </div>

      {hasIssues && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 font-medium text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Problèmes détectés
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-300/80">
            {session.qualityIssues.slice(0, 3).map((issue, i) => (
              <li key={i}>• {issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRecapture}
          className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Recapturer
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function UploadProgress({
  progress,
  onComplete,
}: {
  progress: number;
  onComplete: () => void;
}) {
  // Auto-advance when complete (mock)
  if (progress >= 100) {
    setTimeout(onComplete, 500);
  }

  return (
    <div className="space-y-6 text-center">
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-400" />
      <div>
        <h3 className="text-base font-medium text-white">Téléversement en cours...</h3>
        <p className="mt-1 text-sm text-white/60">{progress}% complété</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ProcessingStatus({
  stage,
  onComplete,
}: {
  stage: { stage: string; progress: number; message: string } | null;
  onComplete: () => void;
}) {
  const stageLabels: Record<string, string> = {
    queued: 'En attente...',
    validating: 'Validation des fichiers...',
    extracting_frames: 'Extraction des images...',
    reconstructing_3d: 'Reconstruction 3D...',
    detecting_rooms: 'Détection des pièces...',
    extracting_floorplan: 'Génération du plan...',
    merging_model: 'Fusion avec le modèle...',
    scoring_quality: 'Évaluation qualité...',
    complete: 'Terminé!',
    failed: 'Échec du traitement',
    manual_review: 'Révision manuelle requise',
  };

  const isComplete = stage?.stage === 'complete';

  return (
    <div className="space-y-6 text-center">
      {isComplete ? (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500">
          <Check className="h-8 w-8 text-white" />
        </div>
      ) : (
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-400" />
      )}

      <div>
        <h3 className="text-base font-medium text-white">
          {stage ? stageLabels[stage.stage] || stage.stage : 'Initialisation...'}
        </h3>
        {stage?.message && (
          <p className="mt-1 text-sm text-white/60">{stage.message}</p>
        )}
      </div>

      {stage && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${stage.progress}%` }}
          />
        </div>
      )}

      {isComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
        >
          Voir le résultat
        </button>
      )}
    </div>
  );
}

export default GuidedCaptureWizard;
