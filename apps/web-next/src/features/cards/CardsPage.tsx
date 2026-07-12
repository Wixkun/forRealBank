'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ModalShell } from '@/components/ui/ModalShell';
import { fetchMyCards, updateCardSettings, updateCardStatus } from './api';
import type { BankCard, CardSettings } from './types';

const copy = {
  fr: {
    title: 'Mes cartes',
    subtitle: 'Visualisez et pilotez votre carte bancaire en temps réel.',
    loading: 'Chargement de vos cartes…',
    empty: 'Aucune carte bancaire n’est rattachée à vos comptes.',
    retry: 'Réessayer',
    virtual: 'Carte virtuelle',
    physical: 'Carte physique',
    active: 'Active',
    frozen: 'Gelée',
    cancelled: 'En opposition',
    expires: 'Expire',
    account: 'Compte associé',
    settings: 'Réglages de la carte',
    settingsHint: 'Les changements sont appliqués immédiatement.',
    online: 'Paiements en ligne',
    onlineHint: 'Autoriser les achats sur internet',
    contactless: 'Paiement sans contact',
    contactlessHint: 'Autoriser les paiements NFC',
    international: 'Paiements à l’étranger',
    internationalHint: 'Autoriser les paiements hors de France',
    spendingLimit: 'Plafond de paiement mensuel',
    withdrawalLimit: 'Plafond de retrait hebdomadaire',
    save: 'Enregistrer les réglages',
    saved: 'Réglages enregistrés.',
    freeze: 'Geler temporairement',
    unfreeze: 'Réactiver la carte',
    oppose: 'Faire opposition',
    freezeHint: 'Bloquez immédiatement la carte en cas de doute. Vous pourrez la réactiver.',
    cancelledHint:
      'Cette carte est définitivement bloquée. Contactez votre conseiller pour son remplacement.',
    opposeTitle: 'Faire opposition à cette carte ?',
    opposeBody:
      'Cette action est immédiate et irréversible. La carte ne pourra plus être utilisée ni réactivée.',
    cancel: 'Annuler',
    confirmOpposition: 'Confirmer l’opposition',
    error: 'Une erreur est survenue.',
  },
  en: {
    title: 'My cards',
    subtitle: 'View and manage your bank card in real time.',
    loading: 'Loading your cards…',
    empty: 'No bank card is linked to your accounts.',
    retry: 'Try again',
    virtual: 'Virtual card',
    physical: 'Physical card',
    active: 'Active',
    frozen: 'Frozen',
    cancelled: 'Cancelled',
    expires: 'Expires',
    account: 'Linked account',
    settings: 'Card settings',
    settingsHint: 'Changes take effect immediately.',
    online: 'Online payments',
    onlineHint: 'Allow purchases on the internet',
    contactless: 'Contactless payments',
    contactlessHint: 'Allow NFC payments',
    international: 'International payments',
    internationalHint: 'Allow payments outside France',
    spendingLimit: 'Monthly spending limit',
    withdrawalLimit: 'Weekly withdrawal limit',
    save: 'Save settings',
    saved: 'Settings saved.',
    freeze: 'Temporarily freeze',
    unfreeze: 'Unfreeze card',
    oppose: 'Cancel card',
    freezeHint: 'Block the card immediately if in doubt. You can unfreeze it later.',
    cancelledHint: 'This card is permanently blocked. Contact your advisor for a replacement.',
    opposeTitle: 'Cancel this card?',
    opposeBody:
      'This action is immediate and irreversible. The card cannot be used or reactivated.',
    cancel: 'Back',
    confirmOpposition: 'Confirm cancellation',
    error: 'Something went wrong.',
  },
};

export function CardsPage() {
  const locale = ((useParams()?.locale as string) || 'en').toLowerCase();
  const t = locale === 'fr' ? copy.fr : copy.en;
  const [cards, setCards] = useState<BankCard[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [oppositionOpen, setOppositionOpen] = useState(false);
  const selected = useMemo(
    () => cards.find((card) => card.id === selectedId) ?? cards[0],
    [cards, selectedId],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchMyCards();
      setCards(result);
      setSelectedId((current) => current || result[0]?.id || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const replaceCard = (card: BankCard) =>
    setCards((current) => current.map((item) => (item.id === card.id ? card : item)));
  const runStatus = async (status: BankCard['status']) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      replaceCard(await updateCardStatus(selected.id, status));
      setOppositionOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setSaving(false);
    }
  };
  const changeSetting = <K extends keyof CardSettings>(key: K, value: CardSettings[K]) => {
    if (!selected) return;
    replaceCard({ ...selected, [key]: value });
  };
  const saveSettings = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    const settings: CardSettings = {
      onlinePaymentsEnabled: selected.onlinePaymentsEnabled,
      contactlessEnabled: selected.contactlessEnabled,
      internationalPaymentsEnabled: selected.internationalPaymentsEnabled,
      spendingLimit: Number(selected.spendingLimit),
      withdrawalLimit: Number(selected.withdrawalLimit),
    };
    try {
      replaceCard(await updateCardSettings(selected.id, settings));
      setMessage(t.saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-fg-muted">
        <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        {t.loading}
      </div>
    );
  if (!selected) return <EmptyState text={error || t.empty} retry={t.retry} onRetry={load} />;

  const disabled = selected.status === 'cancelled';
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-fg">{t.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t.subtitle}</p>
      </header>
      {cards.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelectedId(card.id)}
              className={`rounded-lg border px-4 py-2 text-sm ${card.id === selected.id ? 'border-primary bg-primary/15 text-tertiary' : 'border-edge bg-surface-1 text-fg-muted'}`}
            >
              •••• {card.lastFour}
            </button>
          ))}
        </div>
      )}
      {(error || message) && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-primary/30 bg-primary/10 text-tertiary'}`}
        >
          {error || message}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(380px,1.1fr)]">
        <section className="space-y-4">
          <BankCardVisual card={selected} labels={t} />
          <div className="rounded-2xl border border-edge bg-surface-1 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-fg-muted">{t.account}</p>
                <p className="mt-1 font-medium text-fg">{selected.accountName}</p>
              </div>
              <p className="font-mono text-xs text-fg-muted">
                •••• {selected.accountIban.replace(/\s/g, '').slice(-4)}
              </p>
            </div>
          </div>
          {disabled ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {t.cancelledHint}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={saving}
                onClick={() => void runStatus(selected.status === 'frozen' ? 'active' : 'frozen')}
                className="rounded-xl border border-edge-strong bg-surface-1 px-4 py-3 text-sm font-semibold text-fg hover:bg-hover disabled:opacity-50"
              >
                {selected.status === 'frozen' ? t.unfreeze : t.freeze}
              </button>
              <button
                disabled={saving}
                onClick={() => setOppositionOpen(true)}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                {t.oppose}
              </button>
            </div>
          )}
          {!disabled && <p className="text-xs leading-5 text-fg-muted">{t.freezeHint}</p>}
        </section>
        <section className="rounded-2xl border border-edge bg-surface-1 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-fg">{t.settings}</h2>
          <p className="mt-1 text-xs text-fg-muted">{t.settingsHint}</p>
          <div className="mt-6 divide-y divide-edge">
            <Toggle
              label={t.online}
              hint={t.onlineHint}
              checked={selected.onlinePaymentsEnabled}
              disabled={disabled}
              onChange={(value) => changeSetting('onlinePaymentsEnabled', value)}
            />
            <Toggle
              label={t.contactless}
              hint={t.contactlessHint}
              checked={selected.contactlessEnabled}
              disabled={disabled}
              onChange={(value) => changeSetting('contactlessEnabled', value)}
            />
            <Toggle
              label={t.international}
              hint={t.internationalHint}
              checked={selected.internationalPaymentsEnabled}
              disabled={disabled}
              onChange={(value) => changeSetting('internationalPaymentsEnabled', value)}
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <LimitInput
              label={t.spendingLimit}
              value={selected.spendingLimit}
              min={100}
              max={20000}
              disabled={disabled}
              onChange={(value) => changeSetting('spendingLimit', value)}
            />
            <LimitInput
              label={t.withdrawalLimit}
              value={selected.withdrawalLimit}
              min={20}
              max={5000}
              disabled={disabled}
              onChange={(value) => changeSetting('withdrawalLimit', value)}
            />
          </div>
          <button
            disabled={disabled || saving}
            onClick={() => void saveSettings()}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? '…' : t.save}
          </button>
        </section>
      </div>
      {oppositionOpen && (
        <ModalShell
          onCloseAction={() => !saving && setOppositionOpen(false)}
          maxWidthClass="max-w-md"
        >
          <div className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-xl text-red-400">
              !
            </div>
            <h2 className="text-lg font-semibold text-fg">{t.opposeTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{t.opposeBody}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={saving}
                onClick={() => setOppositionOpen(false)}
                className="rounded-lg border border-edge px-4 py-2 text-sm text-fg"
              >
                {t.cancel}
              </button>
              <button
                disabled={saving}
                onClick={() => void runStatus('cancelled')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {t.confirmOpposition}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function BankCardVisual({ card, labels }: { card: BankCard; labels: typeof copy.fr }) {
  const expiry = new Date(card.expiryDate);
  const status = labels[card.status];
  return (
    <div
      className={`relative aspect-[1.586/1] overflow-hidden rounded-3xl border p-6 shadow-2xl ${card.status === 'cancelled' ? 'border-red-500/30 bg-gradient-to-br from-slate-800 to-slate-950 grayscale' : card.status === 'frozen' ? 'border-sky-400/30 bg-gradient-to-br from-sky-950 via-slate-900 to-slate-950' : 'border-primary/30 bg-gradient-to-br from-emerald-700 via-teal-900 to-slate-950'}`}
    >
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex h-full flex-col justify-between text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold tracking-wide">ForRealBank</p>
            <p className="mt-1 text-xs text-white/60">
              {card.type === 'virtual' ? labels.virtual : labels.physical}
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
            {status}
          </span>
        </div>
        <div>
          <div className="mb-5 h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 shadow-inner" />
          <p className="font-mono text-xl tracking-[0.18em] sm:text-2xl">
            •••• •••• •••• {card.lastFour}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase text-white/50">{labels.expires}</p>
              <p className="font-mono text-sm">
                {String(expiry.getMonth() + 1).padStart(2, '0')}/
                {String(expiry.getFullYear()).slice(-2)}
              </p>
            </div>
            <p className="text-xl font-black italic tracking-tight">VISA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 py-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
    >
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="mt-0.5 block text-xs text-fg-muted">{hint}</span>
      </span>
      <input
        className="peer sr-only"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-hover-strong transition peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
function LimitInput({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs text-fg-muted">{label}</span>
      <span className="flex items-center rounded-xl border border-edge bg-surface-0 px-3 focus-within:border-primary">
        <input
          type="number"
          min={min}
          max={max}
          step="10"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-fg outline-none disabled:opacity-50"
        />
        <span className="text-sm text-fg-muted">$</span>
      </span>
    </label>
  );
}
function EmptyState({
  text,
  retry,
  onRetry,
}: {
  text: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-edge bg-surface-1 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl text-tertiary">
        ▣
      </div>
      <p className="text-sm text-fg-muted">{text}</p>
      <button
        onClick={() => void onRetry()}
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        {retry}
      </button>
    </div>
  );
}
