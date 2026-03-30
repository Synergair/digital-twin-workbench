import Modal from '@/components/organisms/Modal';
import Button from '@/components/ui/button';
import type { TwinPin, TwinUnit } from '../types';
import { estimateDispatchDuration, recommendSkills } from '../algorithms';

export function DispatchModal({
  isOpen,
  unit,
  latestPin,
  onClose,
}: {
  isOpen: boolean;
  unit: TwinUnit | null;
  latestPin: TwinPin | null;
  onClose: () => void;
}) {
  const skills = recommendSkills(latestPin);
  const duration = estimateDispatchDuration(latestPin);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Briefing Digital Twin"
      description="Résumé prêt à transmettre à l'équipe maintenance ou à un fournisseur."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          <Button type="button" variant="primary" onClick={onClose}>
            Marquer comme prêt
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
          <p className="font-semibold text-[var(--semantic-text)]">
            {unit ? `Unité ${unit.unit_number}` : 'Aucune unité sélectionnée'}
          </p>
          <p className="mt-1 text-[var(--semantic-text-subtle)]">
            {latestPin?.description ?? 'Le prochain pin créé enrichira automatiquement ce briefing.'}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--semantic-border)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Contexte mur / MEP</p>
            <ul className="mt-2 space-y-2 text-[var(--semantic-text)]">
              <li>Mur type: {latestPin?.wall_type ?? 'mur_gypse_38'}</li>
              <li>Réseau proche: plomberie à 18-22 cm</li>
              <li>Outillage suggéré: {(latestPin?.tooling_rec ?? ['Inspection visuelle']).join(', ')}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--semantic-border)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Intervention</p>
            <ul className="mt-2 space-y-2 text-[var(--semantic-text)]">
              <li>Priorité: {latestPin?.severity ?? 'standard'}</li>
              <li>Durée estimée: {duration}</li>
              <li>Dernière capture: {unit?.last_capture_at ? new Date(unit.last_capture_at).toLocaleDateString('fr-CA') : 'Non disponible'}</li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">Compétences requises</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-[var(--semantic-text)]">
            {skills.map((skill) => (
              <li key={skill} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
