'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchAssetHistory,
  fetchInvestmentAccounts,
  fetchManagedTradingAssets,
  fetchTradingAssets,
  fetchTradingOrders,
  fetchTradingPositions,
  placeMarketOrder,
  updateManagedTradingAsset,
  type AssetHistory,
  type AssetType,
  type InvestmentAccount,
  type HistoryPeriod,
  type TradingAsset,
  type TradingOrder,
  type TradingPosition,
} from '@/features/trading/api';

const labels = {
  fr: {
    subtitle: 'Achetez et vendez des actions, ETF et cryptomonnaies.',
    simulated: 'Cours simulés',
    realQuotes: 'Cours réels · Twelve Data',
    fallbackQuotes: 'Fallback simulé',
    chart: 'Évolution du cours',
    directorTitle: 'Valeurs proposées aux clients',
    directorSubtitle:
      'Vous contrôlez ici l’intégralité du catalogue visible et négociable par les clients.',
    proposed: 'Proposée',
    hidden: 'Masquée',
    directorHelp: 'Seules les valeurs activées ci-dessous apparaissent dans le marché des clients.',
    portfolio: 'Portefeuille',
    cash: 'Espèces disponibles',
    performance: 'Plus-value latente',
    market: 'Marché',
    search: 'Rechercher un nom ou un symbole',
    all: 'Tous',
    stock: 'Actions',
    etf: 'ETF',
    crypto: 'Crypto',
    asset: 'Actif',
    price: 'Cours',
    day: '24 h',
    trade: 'Passer un ordre',
    buy: 'Acheter',
    sell: 'Vendre',
    quantity: 'Quantité',
    estimated: 'Montant estimé',
    available: 'Disponible',
    executeBuy: "Confirmer l'achat",
    executeSell: 'Confirmer la vente',
    processing: 'Exécution…',
    positions: 'Mes positions',
    avgPrice: 'Prix moyen',
    value: 'Valeur',
    gain: 'Plus-value',
    history: 'Ordres récents',
    date: 'Date',
    status: 'Statut',
    noPositions: "Vous n'avez pas encore de position.",
    noOrders: "Vous n'avez pas encore passé d'ordre.",
    noAccount: "Aucun compte d'investissement n'est disponible.",
    noAsset: 'Aucun actif ne correspond à votre recherche.',
    loading: 'Chargement du marché…',
    loadError: 'Impossible de charger les données de trading.',
    selectAsset: 'Sélectionnez un actif.',
    invalidQuantity: 'Saisissez une quantité valide.',
    success: 'Ordre exécuté avec succès.',
    max: 'Max',
  },
  en: {
    subtitle: 'Buy and sell stocks, ETFs and cryptocurrencies.',
    simulated: 'Simulated quotes',
    realQuotes: 'Live quotes · Twelve Data',
    fallbackQuotes: 'Simulated fallback',
    chart: 'Price history',
    directorTitle: 'Assets offered to clients',
    directorSubtitle: 'You control the complete catalogue visible and tradable by clients.',
    proposed: 'Offered',
    hidden: 'Hidden',
    directorHelp: 'Only assets enabled below appear in the client market.',
    portfolio: 'Portfolio',
    cash: 'Available cash',
    performance: 'Unrealized gain',
    market: 'Market',
    search: 'Search by name or symbol',
    all: 'All',
    stock: 'Stocks',
    etf: 'ETFs',
    crypto: 'Crypto',
    asset: 'Asset',
    price: 'Price',
    day: '24h',
    trade: 'Place an order',
    buy: 'Buy',
    sell: 'Sell',
    quantity: 'Quantity',
    estimated: 'Estimated amount',
    available: 'Available',
    executeBuy: 'Confirm purchase',
    executeSell: 'Confirm sale',
    processing: 'Executing…',
    positions: 'My positions',
    avgPrice: 'Average price',
    value: 'Value',
    gain: 'Gain',
    history: 'Recent orders',
    date: 'Date',
    status: 'Status',
    noPositions: 'You do not have a position yet.',
    noOrders: 'You have not placed an order yet.',
    noAccount: 'No investment account is available.',
    noAsset: 'No asset matches your search.',
    loading: 'Loading market…',
    loadError: 'Unable to load trading data.',
    selectAsset: 'Select an asset.',
    invalidQuantity: 'Enter a valid quantity.',
    success: 'Order executed successfully.',
    max: 'Max',
  },
} as const;

type Filter = 'all' | AssetType;

export default function DashboardTradingPage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const locale = params?.locale === 'fr' ? 'fr' : 'en';
  const t = labels[locale];
  const isDirector = user?.roles?.includes('DIRECTOR') ?? false;
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [assets, setAssets] = useState<TradingAsset[]>([]);
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [period, setPeriod] = useState<HistoryPeriod>('1m');
  const [history, setHistory] = useState<AssetHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refreshAccount = useCallback(async (id: string) => {
    const [nextAccounts, nextPositions, nextOrders] = await Promise.all([
      fetchInvestmentAccounts(),
      fetchTradingPositions(id),
      fetchTradingOrders(id),
    ]);
    setAccounts(nextAccounts);
    setPositions(nextPositions);
    setOrders(nextOrders);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const request = isDirector
      ? Promise.all([Promise.resolve([] as InvestmentAccount[]), fetchManagedTradingAssets()])
      : Promise.all([fetchInvestmentAccounts(), fetchTradingAssets()]);
    request
      .then(([nextAccounts, nextAssets]) => {
        if (!active) return;
        setAccounts(nextAccounts);
        setAssets(nextAssets);
        setSelectedSymbol(nextAssets[0]?.symbol ?? '');
        setAccountId(nextAccounts[0]?.id ?? '');
      })
      .catch(() => active && setError(t.loadError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [authLoading, isDirector, t.loadError]);

  useEffect(() => {
    if (!accountId) {
      setPositions([]);
      setOrders([]);
      return;
    }
    let active = true;
    Promise.all([fetchTradingPositions(accountId), fetchTradingOrders(accountId)])
      .then(([nextPositions, nextOrders]) => {
        if (!active) return;
        setPositions(nextPositions);
        setOrders(nextOrders);
      })
      .catch(() => active && setError(t.loadError));
    return () => {
      active = false;
    };
  }, [accountId, t.loadError]);

  useEffect(() => {
    if (!selectedSymbol || isDirector) {
      setHistory(null);
      return;
    }
    let active = true;
    const loadHistory = (showLoader: boolean) => {
      if (showLoader) setHistoryLoading(true);
      return fetchAssetHistory(selectedSymbol, period).then((nextHistory) => {
        if (!active) return;
        setHistory(nextHistory);
        setAssets((current) =>
          current.map((asset) =>
            asset.symbol === selectedSymbol ? { ...asset, ...nextHistory.quote } : asset,
          ),
        );
        setPositions((current) =>
          current.map((position) =>
            position.symbol === selectedSymbol
              ? {
                  ...position,
                  marketPrice: nextHistory.quote.price,
                  marketValue: position.quantity * nextHistory.quote.price,
                  gainLoss:
                    position.quantity * (nextHistory.quote.price - position.avgPurchasePrice),
                  gainLossPercent:
                    position.avgPurchasePrice > 0
                      ? ((nextHistory.quote.price - position.avgPurchasePrice) /
                          position.avgPurchasePrice) *
                        100
                      : 0,
                }
              : position,
          ),
        );
      });
    };
    void loadHistory(true)
      .catch(() => active && setError(t.loadError))
      .finally(() => active && setHistoryLoading(false));
    const refreshTimer = window.setInterval(
      () => void loadHistory(false).catch(() => undefined),
      period === '1d' ? 60_000 : 5 * 60_000,
    );
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [isDirector, period, selectedSymbol, t.loadError]);

  const currentAccount = accounts.find((account) => account.id === accountId);
  const portfolioValue =
    (currentAccount?.cashBalance ?? 0) +
    positions.reduce((total, position) => total + position.marketValue, 0);
  const unrealizedGain = positions.reduce((total, position) => total + position.gainLoss, 0);
  const selectedAsset = assets.find((asset) => asset.symbol === selectedSymbol);
  const selectedPosition = positions.find((position) => position.symbol === selectedSymbol);
  const numericQuantity = Number(quantity);
  const estimatedAmount = selectedAsset?.price
    ? selectedAsset.price * (Number.isFinite(numericQuantity) ? numericQuantity : 0)
    : 0;

  const filteredAssets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return assets.filter(
      (asset) =>
        (filter === 'all' || asset.assetType === filter) &&
        (!term ||
          asset.symbol.toLocaleLowerCase().includes(term) ||
          asset.name.toLocaleLowerCase().includes(term)),
    );
  }, [assets, filter, search]);

  const money = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: value < 10 ? 2 : 0,
    }).format(value);
  const number = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      maximumFractionDigits: 8,
    }).format(value);

  const selectAsset = (asset: TradingAsset, nextSide: 'buy' | 'sell' = side) => {
    setSelectedSymbol(asset.symbol);
    setSide(nextSide);
    setQuantity('');
    setError('');
    setSuccess('');
  };

  const useMaximumQuantity = () => {
    if (!selectedAsset || !currentAccount) return;
    const maximum =
      side === 'buy'
        ? Math.floor((currentAccount.cashBalance / selectedAsset.price) * 100000000) / 100000000
        : (selectedPosition?.quantity ?? 0);
    setQuantity(maximum > 0 ? String(maximum) : '');
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAsset || !accountId) return setError(t.selectAsset);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0)
      return setError(t.invalidQuantity);
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await placeMarketOrder({
        accountId,
        symbol: selectedAsset.symbol,
        side,
        quantity: numericQuantity,
      });
      await refreshAccount(accountId);
      setQuantity('');
      setSuccess(t.success);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.loadError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="py-20 text-center text-sm text-fg-muted">{t.loading}</div>;
  }

  if (isDirector) {
    return (
      <DirectorAssetManager
        assets={assets}
        setAssets={setAssets}
        t={t}
        locale={locale}
        error={error}
        setError={setError}
        success={success}
        setSuccess={setSuccess}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-fg">Trading</h1>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${selectedAsset?.source === 'twelve_data' ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}
            >
              {selectedAsset?.source === 'twelve_data' ? t.realQuotes : t.fallbackQuotes}
            </span>
          </div>
          <p className="mt-1 text-sm text-fg-muted">{t.subtitle}</p>
        </div>
        {accounts.length > 1 && (
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="rounded-xl border border-edge-strong bg-input px-3 py-2.5 text-sm text-fg outline-none focus:border-primary/60"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {success}
        </div>
      )}

      {!currentAccount ? (
        <div className="rounded-2xl border border-edge bg-surface-1 p-10 text-center text-sm text-fg-muted">
          {t.noAccount}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label={t.portfolio} value={money(portfolioValue)} />
            <SummaryCard label={t.cash} value={money(currentAccount.cashBalance)} />
            <SummaryCard
              label={t.performance}
              value={signedMoney(unrealizedGain, money)}
              tone={unrealizedGain >= 0 ? 'positive' : 'negative'}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <PriceChart
                asset={selectedAsset}
                history={history}
                loading={historyLoading}
                period={period}
                onPeriodChange={setPeriod}
                title={t.chart}
                money={money}
                locale={locale}
              />
              <section className="overflow-hidden rounded-2xl border border-edge bg-surface-1">
                <div className="border-b border-edge p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-semibold text-fg">{t.market}</h2>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t.search}
                      className="w-full rounded-xl border border-edge-strong bg-input px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary/60 sm:max-w-xs"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {(['all', 'stock', 'etf', 'crypto'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFilter(type)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          filter === type
                            ? 'bg-primary text-white'
                            : 'bg-surface-2 text-fg-muted hover:text-fg'
                        }`}
                      >
                        {t[type]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-edge px-4 py-2 text-xs text-fg-subtle sm:px-5">
                  <span>{t.asset}</span>
                  <span className="text-right">{t.price}</span>
                  <span className="w-16 text-right">{t.day}</span>
                </div>
                <div className="max-h-[430px] overflow-y-auto scrollbar-slim">
                  {filteredAssets.map((asset) => (
                    <button
                      type="button"
                      key={asset.id}
                      onClick={() => selectAsset(asset)}
                      className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-edge px-4 py-3 text-left transition-colors last:border-b-0 sm:px-5 ${
                        selectedSymbol === asset.symbol ? 'bg-primary/10' : 'hover:bg-hover'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <AssetBadge symbol={asset.symbol} type={asset.assetType} />
                        <span className="min-w-0">
                          <span className="block font-mono text-sm font-semibold text-fg">
                            {asset.symbol}
                          </span>
                          <span className="block truncate text-xs text-fg-muted">{asset.name}</span>
                        </span>
                      </span>
                      <span className="text-right text-sm font-medium text-fg">
                        {money(asset.price)}
                      </span>
                      <span
                        className={`w-16 text-right text-xs font-medium ${
                          asset.changePercent >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {asset.changePercent >= 0 ? '+' : ''}
                        {asset.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                  {!filteredAssets.length && (
                    <p className="p-8 text-center text-sm text-fg-muted">{t.noAsset}</p>
                  )}
                </div>
              </section>

              <PositionsTable
                positions={positions}
                t={t}
                money={money}
                number={number}
                onSell={(position) => {
                  const asset = assets.find((item) => item.symbol === position.symbol);
                  if (asset) selectAsset(asset, 'sell');
                }}
              />
              <OrdersTable orders={orders} t={t} money={money} locale={locale} />
            </div>

            <form
              onSubmit={submitOrder}
              className="h-fit rounded-2xl border border-edge bg-surface-1 p-5 lg:sticky lg:top-6"
            >
              <h2 className="mb-4 font-semibold text-fg">{t.trade}</h2>
              <div className="mb-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
                {(['buy', 'sell'] as const).map((orderSide) => (
                  <button
                    key={orderSide}
                    type="button"
                    onClick={() => {
                      setSide(orderSide);
                      setQuantity('');
                    }}
                    className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                      side === orderSide
                        ? orderSide === 'buy'
                          ? 'bg-primary text-white'
                          : 'bg-danger text-white'
                        : 'text-fg-muted hover:text-fg'
                    }`}
                  >
                    {t[orderSide]}
                  </button>
                ))}
              </div>

              {selectedAsset && (
                <div className="mb-5 flex items-center justify-between rounded-xl border border-edge bg-surface-2 p-3">
                  <span className="flex items-center gap-3">
                    <AssetBadge symbol={selectedAsset.symbol} type={selectedAsset.assetType} />
                    <span>
                      <span className="block font-mono text-sm font-semibold text-fg">
                        {selectedAsset.symbol}
                      </span>
                      <span className="block max-w-36 truncate text-xs text-fg-muted">
                        {selectedAsset.name}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-fg">
                    {money(selectedAsset.price)}
                  </span>
                </div>
              )}

              <label className="mb-2 block text-xs text-fg-muted" htmlFor="trade-quantity">
                {t.quantity}
              </label>
              <div className="relative">
                <input
                  id="trade-quantity"
                  type="number"
                  min="0.00000001"
                  step="any"
                  required
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-full rounded-xl border border-edge-strong bg-input px-3 py-3 pr-16 text-sm text-fg outline-none focus:border-primary/60"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={useMaximumQuantity}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/15 px-2 py-1 text-xs font-semibold text-primary-hover"
                >
                  {t.max}
                </button>
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                {t.available}:{' '}
                {side === 'buy'
                  ? money(currentAccount.cashBalance)
                  : number(selectedPosition?.quantity ?? 0)}
              </p>

              <div className="my-5 space-y-2 border-y border-edge py-4 text-sm">
                <div className="flex justify-between text-fg-muted">
                  <span>{t.price}</span>
                  <span className="text-fg">
                    {selectedAsset ? money(selectedAsset.price) : '—'}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-fg">
                  <span>{t.estimated}</span>
                  <span>{money(estimatedAmount)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedAsset || !quantity}
                className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  side === 'buy'
                    ? 'bg-primary hover:bg-primary-hover'
                    : 'bg-danger hover:opacity-90'
                }`}
              >
                {submitting ? t.processing : side === 'buy' ? t.executeBuy : t.executeSell}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function PriceChart({
  asset,
  history,
  loading,
  period,
  onPeriodChange,
  title,
  money,
  locale,
}: {
  asset?: TradingAsset;
  history: AssetHistory | null;
  loading: boolean;
  period: HistoryPeriod;
  onPeriodChange: (period: HistoryPeriod) => void;
  title: string;
  money: (value: number) => string;
  locale: 'fr' | 'en';
}) {
  const points = history?.points ?? [];
  const width = 720;
  const height = 220;
  const padding = 18;
  const prices = points.map((point) => point.price);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const spread = Math.max(max - min, max * 0.01, 1);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2),
    y: height - padding - ((point.price - min) / spread) * (height - padding * 2),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const area = coordinates.length
    ? `${padding},${height - padding} ${line} ${width - padding},${height - padding}`
    : '';
  const isPositive = points.length < 2 || points.at(-1)!.price >= points[0].price;
  const stroke = isPositive ? '#14b8a6' : '#ef4444';

  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface-1 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-fg-muted">{title}</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-lg font-semibold text-fg">{asset?.symbol ?? '—'}</span>
            <span className="text-lg font-semibold text-fg">
              {asset ? money(asset.price) : '—'}
            </span>
            {asset && (
              <span
                className={`text-xs font-medium ${asset.changePercent >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {asset.changePercent >= 0 ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex rounded-lg bg-surface-2 p-1">
          {(['1d', '1m', '1y'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodChange(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium uppercase transition-colors ${period === value ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg'}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-56">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-surface-2" />
        ) : coordinates.length ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label={`${title} ${asset?.symbol ?? ''}`}
          >
            <defs>
              <linearGradient id="trading-chart-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
                <stop offset="1" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={height * ratio}
                y2={height * ratio}
                stroke="currentColor"
                className="text-edge-strong"
                strokeWidth="1"
              />
            ))}
            <polygon points={area} fill="url(#trading-chart-area)" />
            <polyline
              points={line}
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-surface-2 text-sm text-fg-muted">
            —
          </div>
        )}
        {!!coordinates.length && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-1 text-[10px] text-fg-subtle">
            <span>
              {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
                dateStyle: 'short',
              }).format(new Date(points[0].date))}
            </span>
            <span>
              {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
                dateStyle: 'short',
              }).format(new Date(points.at(-1)!.date))}
            </span>
          </div>
        )}
      </div>
      {history && (
        <p className="mt-2 text-right text-[11px] text-fg-subtle">
          {history.quote.source === 'twelve_data'
            ? 'Twelve Data'
            : locale === 'fr'
              ? 'Données simulées'
              : 'Simulated data'}{' '}
          · {money(min)} — {money(max)}
        </p>
      )}
    </section>
  );
}

function DirectorAssetManager({
  assets,
  setAssets,
  t,
  locale,
  error,
  setError,
  success,
  setSuccess,
}: {
  assets: TradingAsset[];
  setAssets: React.Dispatch<React.SetStateAction<TradingAsset[]>>;
  t: (typeof labels)['fr'] | (typeof labels)['en'];
  locale: 'fr' | 'en';
  error: string;
  setError: (value: string) => void;
  success: string;
  setSuccess: (value: string) => void;
}) {
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const money = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: value < 10 ? 2 : 0,
    }).format(value);

  const toggleAsset = async (asset: TradingAsset) => {
    const nextValue = !asset.isTradable;
    setSavingIds((current) => new Set(current).add(asset.id));
    setError('');
    setSuccess('');
    try {
      await updateManagedTradingAsset(asset.id, nextValue);
      setAssets((current) =>
        current.map((item) => (item.id === asset.id ? { ...item, isTradable: nextValue } : item)),
      );
      setSuccess(
        locale === 'fr'
          ? `${asset.symbol} est maintenant ${nextValue ? 'proposée' : 'masquée'} aux clients.`
          : `${asset.symbol} is now ${nextValue ? 'offered to' : 'hidden from'} clients.`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t.loadError);
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(asset.id);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg">{t.directorTitle}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t.directorSubtitle}</p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
        >
          {success}
        </div>
      )}
      <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-fg-secondary">
        {t.directorHelp}
      </div>
      <section className="overflow-hidden rounded-2xl border border-edge bg-surface-1">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border-b border-edge px-5 py-3 text-xs text-fg-subtle">
          <span>{t.asset}</span>
          <span>{t.price}</span>
          <span>{t.status}</span>
        </div>
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-edge px-4 py-3 last:border-0 sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <AssetBadge symbol={asset.symbol} type={asset.assetType} />
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-fg">{asset.symbol}</p>
                <p className="truncate text-xs text-fg-muted">
                  {asset.name} · {t[asset.assetType]}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-fg">{money(asset.price)}</p>
              <p className={`text-xs ${asset.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {asset.changePercent >= 0 ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={asset.isTradable}
              disabled={savingIds.has(asset.id)}
              onClick={() => void toggleAsset(asset)}
              className={`min-w-24 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${asset.isTradable ? 'border-success/30 bg-success/10 text-success' : 'border-edge-strong bg-surface-2 text-fg-muted'}`}
            >
              {asset.isTradable ? t.proposed : t.hidden}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface-1 p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${tone === 'positive' ? 'text-success' : tone === 'negative' ? 'text-danger' : 'text-fg'}`}
      >
        {value}
      </p>
    </div>
  );
}

function AssetBadge({ symbol, type }: { symbol: string; type: AssetType }) {
  const color =
    type === 'crypto'
      ? 'bg-warning/15 text-warning'
      : type === 'etf'
        ? 'bg-secondary/15 text-secondary'
        : 'bg-primary/15 text-primary-hover';
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${color}`}
    >
      {symbol.slice(0, 4)}
    </span>
  );
}

function PositionsTable({
  positions,
  t,
  money,
  number,
  onSell,
}: {
  positions: TradingPosition[];
  t: (typeof labels)['fr'] | (typeof labels)['en'];
  money: (value: number) => string;
  number: (value: number) => string;
  onSell: (position: TradingPosition) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface-1">
      <h2 className="border-b border-edge p-4 font-semibold text-fg sm:p-5">{t.positions}</h2>
      {!positions.length ? (
        <p className="p-8 text-center text-sm text-fg-muted">{t.noPositions}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-xs text-fg-subtle">
              <tr className="border-b border-edge">
                <th className="px-5 py-3 font-normal">{t.asset}</th>
                <th className="px-3 py-3 font-normal">{t.quantity}</th>
                <th className="px-3 py-3 font-normal">{t.avgPrice}</th>
                <th className="px-3 py-3 font-normal">{t.value}</th>
                <th className="px-3 py-3 font-normal">{t.gain}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-edge last:border-0">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-fg">{position.symbol}</span>
                    <span className="ml-2 text-xs text-fg-muted">{position.name}</span>
                  </td>
                  <td className="px-3 py-3 text-fg-secondary">{number(position.quantity)}</td>
                  <td className="px-3 py-3 text-fg-secondary">
                    {money(position.avgPurchasePrice)}
                  </td>
                  <td className="px-3 py-3 font-medium text-fg">{money(position.marketValue)}</td>
                  <td
                    className={`px-3 py-3 ${position.gainLoss >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {signedMoney(position.gainLoss, money)}{' '}
                    <span className="text-xs">
                      ({position.gainLossPercent >= 0 ? '+' : ''}
                      {position.gainLossPercent.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSell(position)}
                      className="rounded-lg border border-edge-strong px-2.5 py-1.5 text-xs text-fg-secondary hover:bg-hover"
                    >
                      {t.sell}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OrdersTable({
  orders,
  t,
  money,
  locale,
}: {
  orders: TradingOrder[];
  t: (typeof labels)['fr'] | (typeof labels)['en'];
  money: (value: number) => string;
  locale: 'fr' | 'en';
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface-1">
      <h2 className="border-b border-edge p-4 font-semibold text-fg sm:p-5">{t.history}</h2>
      {!orders.length ? (
        <p className="p-8 text-center text-sm text-fg-muted">{t.noOrders}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-fg-subtle">
              <tr className="border-b border-edge">
                <th className="px-5 py-3 font-normal">{t.date}</th>
                <th className="px-3 py-3 font-normal">{t.asset}</th>
                <th className="px-3 py-3 font-normal">{t.quantity}</th>
                <th className="px-3 py-3 font-normal">{t.price}</th>
                <th className="px-5 py-3 font-normal">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="border-b border-edge last:border-0">
                  <td className="px-5 py-3 text-xs text-fg-muted">
                    {new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(order.createdAt))}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`mr-2 text-xs font-medium ${order.side === 'buy' ? 'text-success' : 'text-danger'}`}
                    >
                      {order.side === 'buy' ? t.buy : t.sell}
                    </span>
                    <span className="font-mono font-semibold text-fg">{order.symbol}</span>
                  </td>
                  <td className="px-3 py-3 text-fg-secondary">{order.quantity}</td>
                  <td className="px-3 py-3 text-fg-secondary">
                    {order.executedPrice ? money(order.executedPrice) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary-hover">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function signedMoney(value: number, formatter: (value: number) => string) {
  return `${value >= 0 ? '+' : '-'}${formatter(Math.abs(value))}`;
}
