import { V2Surface } from '@/components/dashboard/v2/primitives';
import { skillsCatalog } from '../skillsCatalog';

export function SkillsMatrixPanel() {
  return (
    <V2Surface title="Matrice de compétences" subtitle="Métiers mobilisables selon le type d'actif.">
      <div className="space-y-3 text-sm">
        {Object.entries(skillsCatalog).map(([group, skills]) => (
          <div key={group} className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--semantic-text-subtle)]">{group}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-[var(--semantic-border)] bg-white px-3 py-1 text-xs font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </V2Surface>
  );
}
