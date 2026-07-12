'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ModalShell } from '@/components/ui/ModalShell';
import { ApiError } from '@/lib/api-client';
import { createBeneficiary, type Beneficiary } from '@/features/transfer/api';
import { isValidIban, normalizeIban } from '@/features/transfer/iban';

const inputClass =
  'w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60';

/**
 * Modal d'ajout d'un bénéficiaire : validation client (libellé requis, IBAN
 * normalisé + format ISO 13616), erreurs backend affichées (409 doublon,
 * 400 IBAN), bouton de confirmation désactivé si invalide ou pendant l'envoi.
 */
export function AddBeneficiaryModal({
  onCloseAction,
  onCreatedAction,
}: {
  onCloseAction: () => void;
  onCreatedAction: (beneficiary: Beneficiary) => void;
}) {
  const t = useTranslations('account.beneficiaries.modal');

  const [label, setLabel] = useState('');
  const [iban, setIban] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLabel = label.trim();
  const normalizedIban = normalizeIban(iban);
  const canSubmit = trimmedLabel.length > 0 && isValidIban(normalizedIban) && !saving;
  // N'affiche l'erreur de format qu'une fois une saisie plausible terminée.
  const showIbanFormatError = normalizedIban.length >= 15 && !isValidIban(normalizedIban);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createBeneficiary({ label: trimmedLabel, iban: normalizedIban });
      onCreatedAction(created);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('errors.duplicate'));
      } else if (err instanceof ApiError && err.status === 400) {
        setError(t('errors.invalidIban'));
      } else {
        setError(t('errors.generic'));
      }
      setSaving(false);
    }
  };

  return (
    <ModalShell onCloseAction={onCloseAction} maxWidthClass="max-w-md">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <h2 className="text-fg text-sm font-semibold">{t('title')}</h2>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-fg-muted mb-2" htmlFor="beneficiary-label">
            {t('label')}
          </label>
          <input
            id="beneficiary-label"
            type="text"
            required
            maxLength={100}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('labelPlaceholder')}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-2" htmlFor="beneficiary-iban">
            {t('iban')}
          </label>
          <input
            id="beneficiary-iban"
            type="text"
            required
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
            className={inputClass}
          />
          {showIbanFormatError && (
            <p className="mt-1.5 text-xs text-danger">{t('errors.invalidIban')}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCloseAction}
            className="px-4 py-2 rounded-lg border border-edge-strong text-xs text-fg-secondary hover:bg-hover transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('saving') : t('confirm')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
