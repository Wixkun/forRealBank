'use client';

import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type NewsStatus =
  | 'SECURITY'
  | 'TRANSACTION'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'SYSTEM'
  | 'INFORMATION';

export interface NewsItem {
  id: string;
  authorId: string | null;
  userId: string | null;
  title: string;
  subtitle?: string | null;
  content: string;
  status: NewsStatus;
  createdAt: string;
  archivedAt: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Métadonnées structurées posées par le backend sur les news de virement
export interface TransferMetadata {
  kind: 'TRANSFER';
  direction?: 'IN' | 'OUT';
  status?: string;
  amount?: number;
  currency?: string;
  fees?: number;
  transactionId?: string | null;
  executedAt?: string | null;
  sourceAccountName?: string | null;
  sourceIban?: string | null;
  destinationAccountName?: string | null;
  destinationIban?: string | null;
  beneficiaryName?: string | null;
  description?: string | null;
}

function getTransferMetadata(item: NewsItem): TransferMetadata | null {
  const meta = item.metadata;
  if (meta && typeof meta === 'object' && (meta as { kind?: unknown }).kind === 'TRANSFER') {
    return meta as unknown as TransferMetadata;
  }
  return null;
}

export type NewsStatusConfig = { label: string; bg: string; color: string; icon: JSX.Element };

// Le contenu stocke les images inline sous la forme `![image](url)`
const NEWS_IMAGE_REGEX = /!\[[^\]]*\]\(([^)\s]+)\)/g;

type ContentSegment = { type: 'text' | 'image'; value: string };

export function splitNewsContent(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(NEWS_IMAGE_REGEX)) {
    const text = content.slice(lastIndex, match.index).trim();
    if (text) segments.push({ type: 'text', value: text });
    segments.push({ type: 'image', value: match[1] });
    lastIndex = (match.index ?? 0) + match[0].length;
  }
  const tail = content.slice(lastIndex).trim();
  if (tail) segments.push({ type: 'text', value: tail });
  return segments;
}

export function stripNewsImages(content: string): string {
  return content.replace(NEWS_IMAGE_REGEX, '').replace(/\n{2,}/g, '\n').trim();
}

export function newsHasImage(item: Pick<NewsItem, 'content' | 'imageUrl'>): boolean {
  NEWS_IMAGE_REGEX.lastIndex = 0;
  return Boolean(item.imageUrl) || NEWS_IMAGE_REGEX.test(item.content);
}

const maskIban = (iban: string) => {
  const clean = iban.replace(/\s+/g, '');
  if (clean.length <= 8) return iban;
  return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
};

function Tile({ icon, label, value, sub, valueClass, action }: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string | null;
  valueClass?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
        <p className={`text-xs font-medium break-all ${valueClass ?? 'text-white'}`}>{value}</p>
        {sub && <p className="text-gray-600 text-[10px] mt-0.5 break-all">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const tileIcon = (paths: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const ICONS = {
  calendar: tileIcon(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  clock: tileIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  card: tileIcon(<><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>),
  user: tileIcon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  iban: tileIcon(<><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 15V9M12 9v6M16 9h-1.5a1.5 1.5 0 0 0 0 3H16m0 0v3" /></>),
  file: tileIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>),
  id: tileIcon(<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>),
  receipt: tileIcon(<><path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /></>),
};

function TransferDetailBody({ item, meta, onCloseAction }: {
  item: NewsItem;
  meta: TransferMetadata;
  onCloseAction: () => void;
}) {
  const t = useTranslations('feed.detail.transfer');
  const tDetail = useTranslations('feed.detail');
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const isIncoming = meta.direction === 'IN';
  const amount = (meta.amount ?? 0).toLocaleString('fr-FR', {
    style: 'currency',
    currency: meta.currency ?? 'EUR',
  });
  const fees = (meta.fees ?? 0).toLocaleString('fr-FR', {
    style: 'currency',
    currency: meta.currency ?? 'EUR',
  });
  const executedAt = new Date(meta.executedAt ?? item.createdAt).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const copyIban = async () => {
    if (!meta.destinationIban) return;
    try {
      await navigator.clipboard.writeText(meta.destinationIban);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const downloadReceipt = () => {
    const rows: [string, string | null | undefined][] = [
      [t(isIncoming ? 'received' : 'sent'), amount],
      [t('dateTime'), executedAt],
      [t('status'), t('completed')],
      [t('sourceAccount'), meta.sourceAccountName],
      ['IBAN ' + t('sourceAccount').toLowerCase(), meta.sourceIban],
      [t('destinationAccount'), meta.destinationAccountName],
      [t('iban'), meta.destinationIban],
      [t('beneficiary'), meta.beneficiaryName],
      [t('reason'), meta.description],
      [t('transactionId'), meta.transactionId],
      [t('fees'), fees],
    ];
    const text = [
      '=== ForReal Bank — ' + t(isIncoming ? 'received' : 'sent') + ' ===',
      '',
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-virement-${meta.transactionId ?? item.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <p className="text-3xl font-bold text-teal-300 tracking-tight">
          {isIncoming ? '+' : '-'} {amount}
        </p>
        <p className="text-gray-400 text-xs mt-1.5">{t(isIncoming ? 'received' : 'sent')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Tile icon={ICONS.calendar} label={t('dateTime')} value={executedAt} />
        <Tile icon={ICONS.clock} label={t('status')} value={t('completed')} valueClass="text-teal-300" />
        {meta.sourceAccountName && (
          <Tile icon={ICONS.card} label={t('sourceAccount')} value={meta.sourceAccountName} sub={meta.sourceIban} />
        )}
        {(meta.destinationAccountName || meta.destinationIban) && (
          <Tile
            icon={ICONS.card}
            label={t('destinationAccount')}
            value={meta.destinationAccountName ?? maskIban(meta.destinationIban!)}
            sub={meta.destinationAccountName ? meta.destinationIban : null}
          />
        )}
        {meta.beneficiaryName && (
          <Tile icon={ICONS.user} label={t('beneficiary')} value={meta.beneficiaryName} />
        )}
        {meta.destinationIban && (
          <Tile
            icon={ICONS.iban}
            label={t('iban')}
            value={maskIban(meta.destinationIban)}
            action={
              <button
                onClick={copyIban}
                title={copied ? t('copied') : t('copyIban')}
                className="p-1.5 rounded text-gray-500 hover:text-teal-300 hover:bg-white/5 transition shrink-0"
              >
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </button>
            }
          />
        )}
        {meta.description && (
          <Tile icon={ICONS.file} label={t('reason')} value={meta.description} />
        )}
        {meta.transactionId && (
          <Tile icon={ICONS.id} label={t('transactionId')} value={meta.transactionId} />
        )}
        <Tile icon={ICONS.receipt} label={t('fees')} value={fees} />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={downloadReceipt}
          className="flex-1 min-w-40 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-gray-900 text-xs font-semibold hover:bg-teal-400 transition"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {t('downloadReceipt')}
        </button>
        <button
          onClick={() => router.push('/transfer')}
          className="flex-1 min-w-40 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-teal-500/40 text-teal-300 text-xs font-semibold hover:bg-teal-500/10 transition"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          {t('redoTransfer')}
        </button>
        <button
          onClick={onCloseAction}
          className="px-5 py-2.5 rounded-lg bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10 transition"
        >
          {tDetail('close')}
        </button>
      </div>
    </div>
  );
}

type NewsDetailModalProps = {
  item: NewsItem | null;
  cfg: NewsStatusConfig | null;
  loading?: boolean;
  error?: string | null;
  onCloseAction: () => void;
};

export function NewsDetailModal({ item, cfg, loading, error, onCloseAction }: NewsDetailModalProps) {
  const t = useTranslations('feed.detail');
  const transfer = item ? getTransferMetadata(item) : null;

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
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#14161c] rounded-2xl border border-white/8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4 bg-[#14161c]/95 backdrop-blur border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            {cfg && (
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                {cfg.icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-white text-sm font-semibold leading-snug truncate">
                {item?.title ?? (loading ? t('loading') : t('notFoundTitle'))}
              </h2>
              {item && (
                <p className="text-gray-500 text-[11px] mt-0.5">
                  {new Date(item.createdAt).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
          {transfer && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 text-[11px] font-semibold shrink-0 ml-auto">
              {t('transfer.completed')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" /></svg>
            </span>
          )}
          <button
            onClick={onCloseAction}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition shrink-0"
            aria-label={t('close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          {loading && <p className="text-gray-500 text-xs py-6 text-center">{t('loading')}</p>}

          {!loading && error && (
            <p className="text-red-300 text-xs py-6 text-center">{t('notFound')}</p>
          )}

          {!loading && !error && item && transfer && (
            <TransferDetailBody item={item} meta={transfer} onCloseAction={onCloseAction} />
          )}

          {!loading && !error && item && !transfer && (
            <>
              {item.archivedAt && (
                <p className="mb-3 text-[11px] px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  {t('archived')}
                </p>
              )}
              {item.subtitle && (
                <p className="text-gray-300 text-sm font-medium mb-3">{item.subtitle}</p>
              )}
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="mb-3 max-w-full h-auto max-h-[60vh] object-contain rounded-xl border border-white/5 mx-auto"
                />
              )}
              <div className="space-y-3">
                {splitNewsContent(item.content).map((segment, i) =>
                  segment.type === 'text' ? (
                    <p key={i} className="text-gray-400 text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {segment.value}
                    </p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={segment.value}
                      alt=""
                      className="max-w-full h-auto max-h-[60vh] object-contain rounded-xl border border-white/5 mx-auto"
                    />
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
