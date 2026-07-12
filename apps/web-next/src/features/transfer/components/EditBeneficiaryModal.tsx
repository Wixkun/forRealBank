'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ModalShell } from '@/components/ui/ModalShell';
import { deleteBeneficiary, updateBeneficiary, type Beneficiary } from '@/features/transfer/api';
import { maskIban } from '@/features/transfer/iban';

const inputClass =
  'w-full p-3 rounded-lg bg-input text-fg border border-edge-strong text-sm focus:outline-none focus:border-primary/60';

/**
 * Modal d'édition d'un bénéficiaire : seul le libellé est modifiable (l'IBAN,
 * affiché masqué, est immuable). La suppression demande une confirmation en
 * deux temps (le bouton devient « Confirmer la suppression »).
 */
export function EditBeneficiaryModal({
  beneficiary,
  onCloseAction,
  onUpdatedAction,
  onDeletedAction,
}: {
  beneficiary: Beneficiary;
  onCloseAction: () => void;
  onUpdatedAction: (beneficiary: Beneficiary) => void;
  onDeletedAction: (id: string) => void;
}) {
  const t = useTranslations('account.beneficiaries.editModal');
  const tModal = useTranslations('account.beneficiaries.modal');

  const [label, setLabel] = useState(beneficiary.label);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLabel = label.trim();
  const busy = saving || deleting;
  const canSave = trimmedLabel.length > 0 && trimmedLabel !== beneficiary.label && !busy;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateBeneficiary(beneficiary.id, { label: trimmedLabel });
      onUpdatedAction(updated);
    } catch {
      setError(t('errors.updateFailed'));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteBeneficiary(beneficiary.id);
      onDeletedAction(beneficiary.id);
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <ModalShell onCloseAction={onCloseAction} maxWidthClass="max-w-md">
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <h2 className="text-fg text-sm font-semibold">{t('title')}</h2>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-fg-muted mb-2" htmlFor="edit-beneficiary-label">
            {tModal('label')}
          </label>
          <input
            id="edit-beneficiary-label"
            type="text"
            required
            maxLength={100}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <span className="block text-xs text-fg-muted mb-2">{tModal('iban')}</span>
          <p className="rounded-lg border border-edge bg-hover px-3 py-2 text-sm text-fg-secondary">
            {maskIban(beneficiary.iban)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-red-500/50 text-xs font-semibold text-danger hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? t('deleting') : confirmingDelete ? t('confirmDelete') : t('delete')}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-4 py-2 rounded-lg border border-edge-strong text-xs text-fg-secondary hover:bg-hover transition-colors"
            >
              {tModal('cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? tModal('saving') : t('save')}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
