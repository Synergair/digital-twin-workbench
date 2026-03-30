export function TwinFloorScrubber({
  floors,
  isolatedFloor,
  onChange,
}: {
  floors: number[];
  isolatedFloor: number | null;
  onChange: (floor: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#d5dfdf] bg-[#f8fbfb] px-3 py-2 shadow-[0_10px_22px_rgba(15,23,28,0.04)]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--semantic-text-subtle)]">
        Niveau
      </span>
      <select
        value={isolatedFloor === null ? 'all' : String(isolatedFloor)}
        onChange={(event) => onChange(event.target.value === 'all' ? null : Number(event.target.value))}
        className="min-w-[9.5rem] bg-transparent text-sm font-medium text-[var(--semantic-text)] outline-none"
      >
        <option value="all">Tous les étages</option>
        {floors.map((floor) => (
          <option key={floor} value={String(floor)}>
            {floor === 0 ? 'Rez-de-chaussée' : `Étage ${floor}`}
          </option>
        ))}
      </select>
    </div>
  );
}
