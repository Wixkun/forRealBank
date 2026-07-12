'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchBeneficiaries, type Beneficiary } from '@/features/transfer/api';
import { maskIban, normalizeIban } from '@/features/transfer/iban';
import { AddBeneficiaryModal } from '@/features/transfer/components/AddBeneficiaryModal';
import { EditBeneficiaryModal } from '@/features/transfer/components/EditBeneficiaryModal';

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function IconPencil() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

/**
 * « Mes bénéficiaires » : liste cliquable (pré-remplit le formulaire de
 * virement via onSelectAction), recherche par libellé ou IBAN, état vide,
 * ajout et édition (libellé / suppression) via modals. Le bénéficiaire dont
 * l'IBAN est actuellement dans le formulaire est mis en évidence.
 */
export function BeneficiariesPanel({
  selectedIban,
  onSelectAction,
}: {
  selectedIban: string;
  onSelectAction: (beneficiary: Beneficiary) => void;
}) {
  const t = useTranslations('account.beneficiaries');

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Recherche insensible à la casse sur le libellé et l'IBAN (avec ou sans
  // espaces) — même esprit que la recherche des conversations.
  const filteredBeneficiaries = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return beneficiaries;
    const termIban = normalizeIban(term);
    return beneficiaries.filter(
      (b) =>
        b.label.toLowerCase().includes(term) || (termIban.length > 0 && b.iban.includes(termIban)),
    );
  }, [beneficiaries, searchQuery]);

  const refresh = useCallback(async () => {
    try {
      setBeneficiaries(await fetchBeneficiaries());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Ajout réussi : fermer la modal, rafraîchir la liste sans reload, retour
  // visuel de succès et sélection immédiate du nouveau bénéficiaire.
  const handleCreated = (created: Beneficiary) => {
    setShowAddModal(false);
    setBeneficiaries((prev) => [...prev, created].sort((a, b) => a.label.localeCompare(b.label)));
    setJustAddedId(created.id);
    onSelectAction(created);
    void refresh();
  };

  const handleUpdated = (updated: Beneficiary) => {
    setEditing(null);
    setBeneficiaries((prev) =>
      prev
        .map((b) => (b.id === updated.id ? updated : b))
        .sort((a, b) => a.label.localeCompare(b.label)),
    );
  };

  const handleDeleted = (id: string) => {
    setEditing(null);
    setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="bg-surface-1 rounded-2xl border border-edge p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-fg text-sm font-semibold">{t('title')}</h2>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
        >
          {t('add')}
        </button>
      </div>

      {justAddedId && (
        <div className="px-3 py-2 rounded-lg mb-3 bg-green-500/20 border border-green-500/50 text-green-200 text-xs">
          {t('added')}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : loadError ? (
        <p className="py-6 text-center text-xs text-danger">{t('loadError')}</p>
      ) : beneficiaries.length === 0 ? (
        <p className="py-6 text-center text-xs text-fg-muted">{t('empty')}</p>
      ) : (
        <>
          <div className="mb-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="w-full px-3 py-2 rounded-lg bg-input text-fg border border-edge-strong text-sm placeholder:text-fg-subtle focus:outline-none focus:border-primary/60"
            />
          </div>

          {filteredBeneficiaries.length === 0 ? (
            <p className="py-6 text-center text-xs text-fg-muted">{t('searchNoResults')}</p>
          ) : (
            <ul className="space-y-1.5">
              {filteredBeneficiaries.map((b) => {
                const isSelected = selectedIban === b.iban;
                return (
                  <li
                    key={b.id}
                    className={`flex items-center rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-primary/40 bg-primary/15'
                        : 'border-edge bg-hover hover:bg-hover-strong'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectAction(b)}
                      aria-pressed={isSelected}
                      className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-white/10 ${
                          isSelected ? 'bg-primary text-white' : 'bg-surface-1 text-fg-secondary'
                        }`}
                      >
                        {initialsOf(b.label)}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-medium ${
                            isSelected ? 'text-tertiary' : 'text-fg'
                          }`}
                        >
                          {b.label}
                        </span>
                        <span className="block text-xs text-fg-muted">{maskIban(b.iban)}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(b)}
                      aria-label={t('editAria', { label: b.label })}
                      title={t('editAria', { label: b.label })}
                      className="shrink-0 mr-2 p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-hover-strong transition-colors"
                    >
                      <IconPencil />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {showAddModal && (
        <AddBeneficiaryModal
          onCloseAction={() => setShowAddModal(false)}
          onCreatedAction={handleCreated}
        />
      )}

      {editing && (
        <EditBeneficiaryModal
          beneficiary={editing}
          onCloseAction={() => setEditing(null)}
          onUpdatedAction={handleUpdated}
          onDeletedAction={handleDeleted}
        />
      )}
    </div>
  );
}
