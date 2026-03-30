import Modal from '@/components/organisms/Modal';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';

export type DocumentPreview = {
  id: string;
  type: string;
  title: string;
  meta: string;
  date: string;
  status?: string;
  url?: string;
  downloadUrl?: string;
  format: 'pdf' | 'image' | 'file';
};

export function DocumentPreviewModal({
  isOpen,
  document,
  onClose,
}: {
  isOpen: boolean;
  document: DocumentPreview | null;
  onClose: () => void;
}) {
  if (!document) {
    return null;
  }

  const downloadUrl = document.downloadUrl ?? document.url;
  const hasPreview = Boolean(document.url) && document.format !== 'file';
  const viewer = hasPreview ? (
    document.format === 'pdf' ? (
      <iframe title={document.title} src={document.url} className="h-[520px] w-full rounded-2xl border border-[var(--semantic-border)] bg-white" />
    ) : (
      <div className="flex items-center justify-center rounded-2xl border border-[var(--semantic-border)] bg-white p-2">
        <img src={document.url} alt={document.title} className="max-h-[520px] w-full rounded-xl object-contain" />
      </div>
    )
  ) : (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] text-sm text-[var(--semantic-text-subtle)]">
      Apercu non disponible. Telechargez le fichier pour l ouvrir.
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      description={document.meta}
      size="2xl"
      footer={
        <>
          {downloadUrl ? (
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              <Button type="button" variant="secondary">
                Ouvrir le fichier
              </Button>
            </a>
          ) : null}
          <Button type="button" variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
        <Badge variant="outline">{document.type}</Badge>
        {document.status ? <Badge variant="info">{document.status}</Badge> : null}
        <span>{document.date}</span>
      </div>
      <div className="mt-4">{viewer}</div>
    </Modal>
  );
}
