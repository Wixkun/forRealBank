'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StatementModal } from '@/features/statements/StatementModal';

export type StatementPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

// Préremplissage fourni par le dashboard : compte sélectionné, filtre de
// période actif et bornes des transactions chargées (pour le filtre « Tout »)
export interface StatementPrefill {
  accountId?: string | null;
  period?: StatementPeriod;
  txRange?: { first: string; last: string } | null;
}

interface StatementContextValue {
  openStatement: () => void;
  setStatementPrefill: (prefill: StatementPrefill) => void;
}

const StatementContext = createContext<StatementContextValue | null>(null);

export function StatementProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // Ref pour ne pas re-rendre tout l'arbre à chaque changement de filtre
  const prefillRef = useRef<StatementPrefill>({});

  const setStatementPrefill = useCallback((prefill: StatementPrefill) => {
    prefillRef.current = { ...prefillRef.current, ...prefill };
  }, []);

  const openStatement = useCallback(() => setIsOpen(true), []);

  const value = useMemo(
    () => ({ openStatement, setStatementPrefill }),
    [openStatement, setStatementPrefill],
  );

  return (
    <StatementContext.Provider value={value}>
      {children}
      {isOpen && (
        <StatementModal prefill={prefillRef.current} onCloseAction={() => setIsOpen(false)} />
      )}
    </StatementContext.Provider>
  );
}

// Nullable : les composants consommateurs restent utilisables hors provider
export function useStatement() {
  return useContext(StatementContext);
}
