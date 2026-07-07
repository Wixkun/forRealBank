'use client';

import { useEffect, type ReactNode } from 'react';

// Coquille commune des modales sombres (détail de news/virement, relevé de
// compte) : overlay flouté, fermeture par Échap et clic à l'extérieur,
// carte centrée qui stoppe la propagation des clics.
export function ModalShell({
  onCloseAction,
  children,
  maxWidthClass = 'max-w-2xl',
  cardClassName = '',
}: {
  onCloseAction: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  cardClassName?: string;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseAction();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCloseAction]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCloseAction}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full bg-[#14161c] rounded-2xl border border-white/8 shadow-2xl ${maxWidthClass} ${cardClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
