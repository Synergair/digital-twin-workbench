import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import type { TwinPin } from '../types';

export function PinContextPopup({
  pin,
  onClose,
  onDispatch,
}: {
  pin: TwinPin | null;
  onClose: () => void;
  onDispatch: () => void;
}) {
  if (!pin) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-20 max-w-sm rounded-2xl border border-[var(--semantic-border)] bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--semantic-text)]">Pin enregistré</p>
          <p className="text-xs text-[var(--semantic-text-subtle)]">{pin.description ?? 'Signalement prêt pour dispatch.'}</p>
        </div>
        <Badge variant={pin.severity === 'urgent' ? 'error' : pin.severity === 'planifie' ? 'warning' : 'info'}>
          {pin.severity}
        </Badge>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" variant="primary" onClick={onDispatch}>
          Créer le ticket
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
