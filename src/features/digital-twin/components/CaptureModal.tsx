import { useState } from 'react';
import Modal from '@/components/organisms/Modal';
import Button from '@/components/ui/button';

export function CaptureModal({
  isOpen,
  loading,
  progress,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  loading: boolean;
  progress: number;
  onClose: () => void;
  onSubmit: (files: File[], captureType: string) => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [captureType, setCaptureType] = useState('photos');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Uploader une capture"
      description="Photos, vidéo ou IFC pour enrichir le passport bâtiment."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant="primary" onClick={() => void onSubmit(files, captureType)} loading={loading}>
            Lancer l'import
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--semantic-text)]">Type de capture</span>
          <select
            value={captureType}
            onChange={(event) => setCaptureType(event.target.value)}
            className="h-10 w-full rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 text-sm text-[var(--semantic-text)]"
          >
            <option value="photos">Photos</option>
            <option value="video">Vidéo</option>
            <option value="ifc">IFC</option>
            <option value="lidar">Lidar</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--semantic-text)]">Fichiers</span>
          <input
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="block w-full text-sm text-[var(--semantic-text-subtle)]"
          />
        </label>

        {loading ? (
          <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
            <p className="text-sm font-medium text-[var(--semantic-text)]">Upload en cours</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--semantic-primary)] to-[var(--accent-hover)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
