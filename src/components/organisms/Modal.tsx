import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  panelClassName,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  panelClassName?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          'relative w-full rounded-2xl border border-[var(--semantic-border)] bg-white p-6 shadow-xl',
          sizeClass,
          panelClassName
        )}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--semantic-text)]">{title}</h2>
          {description ? <p className="text-sm text-[var(--semantic-text-subtle)]">{description}</p> : null}
        </div>
        <div className="mt-5">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
