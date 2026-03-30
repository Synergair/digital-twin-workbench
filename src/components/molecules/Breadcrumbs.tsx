import { Link } from 'react-router-dom';

export default function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--semantic-text-subtle)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? (
            <Link className="font-medium text-[var(--semantic-text)] hover:underline" to={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--semantic-text)]">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="text-[var(--semantic-text-subtle)]">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
