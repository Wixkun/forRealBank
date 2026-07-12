'use client';

import { useEffect, type ReactNode } from 'react';

// Coquille commune des modales (détail de news/virement, relevé de compte,
// fiches utilisateur) : overlay flouté, fermeture par Échap et clic à
// l'extérieur, carte centrée qui stoppe la propagation des clics. La carte
// suit le thème via le token surface-1.
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
        className={`w-full bg-surface-1 rounded-2xl border border-edge shadow-2xl ${maxWidthClass} ${cardClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
