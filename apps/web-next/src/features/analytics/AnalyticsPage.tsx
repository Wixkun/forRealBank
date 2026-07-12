'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { fetchAnalytics } from './api';
import type { AnalyticsOverview, ClientAnalytics, MonthlyFlow, StaffAnalytics } from './types';

const copy = {
  fr: {
    title: 'Analyses',
    clientSubtitle: 'Comprenez vos entrées, vos dépenses et vos habitudes financières.',
    advisorSubtitle: 'Pilotez l’activité et la santé financière de votre portefeuille clients.',
    directorSubtitle: 'Supervisez les encours, l’activité clients et la charge des conseillers.',
    months: 'mois',
    loading: 'Calcul de vos analyses…',
    retry: 'Réessayer',
    noData: 'Aucune donnée disponible pour cette période.',
    balance: 'Solde bancaire',
    investments: 'Investissements',
    income: 'Entrées',
    outgoing: 'Sorties',
    savingsRate: 'Taux d’épargne',
    payments: 'Paiements',
    transfers: 'Virements',
    cashFlow: 'Flux mensuels',
    cashFlowHint: 'Entrées et sorties sur la période sélectionnée',
    spending: 'Répartition des dépenses',
    largest: 'Principales dépenses',
    noExpenses: 'Aucune dépense sur cette période',
    clients: 'Clients suivis',
    bankAssets: 'Encours bancaires',
    investmentAssets: 'Encours investis',
    volume: 'Volume de transactions',
    attention: 'À surveiller',
    operations: 'opérations',
    portfolioActivity: 'Activité du portefeuille',
    portfolioHint: 'Flux agrégés de tous les clients dans votre périmètre',
    clientPortfolio: 'Portefeuille clients',
    client: 'Client',
    assets: 'Encours total',
    lastActivity: 'Dernière activité',
    status: 'Statut',
    healthy: 'Normal',
    alert: 'Attention',
    never: 'Jamais',
    workload: 'Charge par conseiller',
    workloadHint: 'Nombre de clients actuellement assignés',
    assignedClients: 'clients',
    entriesLegend: 'Entrées',
    exitsLegend: 'Sorties',
    categories: {
      housing: 'Logement',
      food: 'Alimentation',
      subscriptions: 'Abonnements',
      utilities: 'Factures',
      transport: 'Transport',
      transfers: 'Virements',
      other: 'Autres',
    },
  },
  en: {
    title: 'Analytics',
    clientSubtitle: 'Understand your income, spending and financial habits.',
    advisorSubtitle: 'Monitor activity and financial health across your client portfolio.',
    directorSubtitle: 'Oversee assets, client activity and advisor workload.',
    months: 'months',
    loading: 'Calculating analytics…',
    retry: 'Try again',
    noData: 'No data available for this period.',
    balance: 'Bank balance',
    investments: 'Investments',
    income: 'Income',
    outgoing: 'Outgoings',
    savingsRate: 'Savings rate',
    payments: 'Payments',
    transfers: 'Transfers',
    cashFlow: 'Monthly cash flow',
    cashFlowHint: 'Income and outgoings over the selected period',
    spending: 'Spending breakdown',
    largest: 'Largest expenses',
    noExpenses: 'No expenses in this period',
    clients: 'Managed clients',
    bankAssets: 'Banking assets',
    investmentAssets: 'Invested assets',
    volume: 'Transaction volume',
    attention: 'Needs attention',
    operations: 'operations',
    portfolioActivity: 'Portfolio activity',
    portfolioHint: 'Aggregated flows for every client in your scope',
    clientPortfolio: 'Client portfolio',
    client: 'Client',
    assets: 'Total assets',
    lastActivity: 'Last activity',
    status: 'Status',
    healthy: 'Normal',
    alert: 'Attention',
    never: 'Never',
    workload: 'Advisor workload',
    workloadHint: 'Number of currently assigned clients',
    assignedClients: 'clients',
    entriesLegend: 'Income',
    exitsLegend: 'Outgoings',
    categories: {
      housing: 'Housing',
      food: 'Food',
      subscriptions: 'Subscriptions',
      utilities: 'Utilities',
      transport: 'Transport',
      transfers: 'Transfers',
      other: 'Other',
    },
  },
};
type Labels = typeof copy.fr;

export function AnalyticsPage() {
  const locale = ((useParams()?.locale as string) || 'en').toLowerCase();
  const t = locale === 'fr' ? copy.fr : copy.en;
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchAnalytics(months));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.noData);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [months]); // eslint-disable-line react-hooks/exhaustive-deps
  const subtitle =
    data?.kind === 'staff'
      ? data.scope === 'director'
        ? t.directorSubtitle
        : t.advisorSubtitle
      : t.clientSubtitle;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{subtitle}</p>
        </div>
        <div className="flex rounded-xl border border-edge bg-surface-1 p-1">
          {[3, 6, 12].map((value) => (
            <button
              key={value}
              onClick={() => setMonths(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${months === value ? 'bg-primary text-white' : 'text-fg-muted hover:bg-hover'}`}
            >
              {value} {t.months}
            </button>
          ))}
        </div>
      </header>
      {loading ? (
        <Loading label={t.loading} />
      ) : error ? (
        <ErrorState message={error} retry={t.retry} onRetry={load} />
      ) : data?.kind === 'client' ? (
        <ClientView data={data} locale={locale} t={t} />
      ) : data?.kind === 'staff' ? (
        <StaffView data={data} locale={locale} t={t} />
      ) : (
        <ErrorState message={t.noData} retry={t.retry} onRetry={load} />
      )}
    </div>
  );
}

function ClientView({ data, locale, t }: { data: ClientAnalytics; locale: string; t: Labels }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label={t.balance} value={money(data.summary.bankBalance, locale)} />
        <Metric label={t.investments} value={money(data.summary.investmentValue, locale)} />
        <Metric label={t.income} value={money(data.summary.income, locale)} tone="positive" />
        <Metric label={t.outgoing} value={money(data.summary.outgoing, locale)} tone="negative" />
        <Metric
          label={t.savingsRate}
          value={`${data.summary.savingsRate.toFixed(1)} %`}
          tone={data.summary.savingsRate >= 0 ? 'positive' : 'negative'}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Panel title={t.cashFlow} hint={t.cashFlowHint}>
          <FlowChart values={data.monthly} locale={locale} t={t} />
        </Panel>
        <Panel title={t.spending}>
          <CategoryBreakdown values={data.categories} locale={locale} t={t} />
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-2 gap-3">
          <Metric label={t.payments} value={money(data.summary.payments, locale)} />
          <Metric label={t.transfers} value={money(data.summary.transfers, locale)} />
        </div>
        <Panel title={t.largest}>
          <div className="divide-y divide-edge">
            {data.largestExpenses.length ? (
              data.largestExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{expense.description}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {dateLabel(expense.date, locale)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-red-400">
                    − {money(expense.amount, locale)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-fg-muted">{t.noExpenses}</p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StaffView({ data, locale, t }: { data: StaffAnalytics; locale: string; t: Labels }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label={t.clients} value={String(data.summary.clientCount)} />
        <Metric label={t.bankAssets} value={money(data.summary.bankAssets, locale)} />
        <Metric label={t.investmentAssets} value={money(data.summary.investmentAssets, locale)} />
        <Metric
          label={t.volume}
          value={money(data.summary.transactionVolume, locale)}
          hint={`${data.summary.transactionCount} ${t.operations}`}
        />
        <Metric
          label={t.attention}
          value={String(data.summary.attentionCount)}
          tone={data.summary.attentionCount ? 'negative' : 'positive'}
        />
      </div>
      <div
        className={`grid gap-6 ${data.scope === 'director' ? 'xl:grid-cols-[1.45fr_0.75fr]' : ''}`}
      >
        <Panel title={t.portfolioActivity} hint={t.portfolioHint}>
          <FlowChart values={data.monthly} locale={locale} t={t} />
        </Panel>
        {data.scope === 'director' && (
          <Panel title={t.workload} hint={t.workloadHint}>
            <Workload values={data.advisorWorkload} t={t} />
          </Panel>
        )}
      </div>
      <Panel title={t.clientPortfolio}>
        <ClientTable data={data} locale={locale} t={t} />
      </Panel>
    </>
  );
}

function ClientTable({ data, locale, t }: { data: StaffAnalytics; locale: string; t: Labels }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-edge text-xs text-fg-muted">
            <th className="pb-3 font-medium">{t.client}</th>
            <th className="pb-3 font-medium">{t.assets}</th>
            <th className="pb-3 font-medium">{t.investments}</th>
            <th className="pb-3 font-medium">{t.lastActivity}</th>
            <th className="pb-3 text-right font-medium">{t.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {data.clients.map((client) => (
            <tr key={client.id}>
              <td className="py-3 pr-4">
                <p className="text-sm font-medium text-fg">{client.name}</p>
                <p className="text-xs text-fg-muted">{client.email}</p>
              </td>
              <td className="py-3 pr-4 text-sm text-fg">{money(client.totalAssets, locale)}</td>
              <td className="py-3 pr-4 text-sm text-fg-muted">
                {money(client.investmentValue, locale)}
              </td>
              <td className="py-3 pr-4 text-sm text-fg-muted">
                {client.lastTransactionAt ? dateLabel(client.lastTransactionAt, locale) : t.never}
              </td>
              <td className="py-3 text-right">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${client.needsAttention ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}
                >
                  {client.needsAttention ? t.alert : t.healthy}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data.clients.length && <p className="py-8 text-center text-sm text-fg-muted">{t.noData}</p>}
    </div>
  );
}

function Workload({ values, t }: { values: StaffAnalytics['advisorWorkload']; t: Labels }) {
  const max = Math.max(...values.map((item) => item.clientCount), 1);
  return (
    <div className="space-y-4">
      {values.map((advisor) => (
        <div key={advisor.id}>
          <div className="mb-1.5 flex justify-between gap-3 text-sm">
            <span className="truncate text-fg">{advisor.name}</span>
            <span className="text-fg-muted">
              {advisor.clientCount} {t.assignedClients}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-hover">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(advisor.clientCount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
function FlowChart({ values, locale, t }: { values: MonthlyFlow[]; locale: string; t: Labels }) {
  const max = Math.max(...values.flatMap((item) => [item.income, item.outgoing]), 1);
  return (
    <div>
      <div className="flex h-56 items-end gap-3 sm:gap-5">
        {values.map((item) => (
          <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="flex h-[185px] items-end justify-center gap-1">
              <div
                title={money(item.income, locale)}
                className="w-2/5 min-w-2 rounded-t-md bg-primary/80"
                style={{ height: `${Math.max((item.income / max) * 100, item.income ? 3 : 0)}%` }}
              />
              <div
                title={money(item.outgoing, locale)}
                className="w-2/5 min-w-2 rounded-t-md bg-secondary/80"
                style={{
                  height: `${Math.max((item.outgoing / max) * 100, item.outgoing ? 3 : 0)}%`,
                }}
              />
            </div>
            <p className="mt-2 truncate text-center text-[10px] text-fg-muted">
              {monthLabel(item.month, locale)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-5 text-xs text-fg-muted">
        <Legend color="bg-primary" label={t.entriesLegend} />
        <Legend color="bg-secondary" label={t.exitsLegend} />
      </div>
    </div>
  );
}
function CategoryBreakdown({
  values,
  locale,
  t,
}: {
  values: ClientAnalytics['categories'];
  locale: string;
  t: Labels;
}) {
  const total = values.reduce((sum, item) => sum + item.amount, 0);
  const colors = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#64748b'];
  let cursor = 0;
  const gradient = values.length
    ? `conic-gradient(${values
        .map((item, index) => {
          const start = cursor;
          cursor += (item.amount / total) * 100;
          return `${colors[index % colors.length]} ${start}% ${cursor}%`;
        })
        .join(',')})`
    : 'var(--color-hover)';
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
      <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-surface-1 text-center">
          <div>
            <p className="text-[10px] text-fg-muted">Total</p>
            <p className="text-sm font-semibold text-fg">{money(total, locale)}</p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {values.slice(0, 7).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-fg-muted">
              <i
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="truncate">
                {t.categories[item.name as keyof typeof t.categories] ?? item.name}
              </span>
            </span>
            <span className="font-medium text-fg">{money(item.amount, locale)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface-1 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface-1 p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p
        className={`mt-2 truncate text-xl font-semibold ${tone === 'positive' ? 'text-emerald-400' : tone === 'negative' ? 'text-red-400' : 'text-fg'}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-fg-muted">{hint}</p>}
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center text-sm text-fg-muted">
      <span className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      {label}
    </div>
  );
}
function ErrorState({
  message,
  retry,
  onRetry,
}: {
  message: string;
  retry: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <p className="text-sm text-red-300">{message}</p>
      <button
        onClick={() => void onRetry()}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        {retry}
      </button>
    </div>
  );
}
const money = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
const dateLabel = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
const monthLabel = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' }).format(
    new Date(`${value}-01T00:00:00Z`),
  );
