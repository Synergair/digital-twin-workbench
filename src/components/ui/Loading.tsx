export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-[var(--semantic-text-subtle)]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      Chargement en cours...
    </div>
  );
}
