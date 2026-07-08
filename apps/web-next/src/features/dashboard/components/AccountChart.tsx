'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DisplayTransaction } from '@/features/dashboard/types';

type ChartPoint = DisplayTransaction & { balance: number };

// Graphique d'un compte : courbe de solde si l'info « solde après
// transaction » existe, sinon barres de montants.
export function AccountChart({
  transactions,
  currentBalance,
}: {
  transactions: DisplayTransaction[];
  currentBalance?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const t = useTranslations('dashboard.chart');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const fmtA = (v: number) =>
    new Intl.NumberFormat(dateLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(v);

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-28 text-fg-muted text-sm">
        {t('noData')}
      </div>
    );
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const hasBalance = sorted.some((t) => t.balance != null);

  const W = 560;
  const H = 110;
  const PL = 52;
  const PR = 16;
  const PT = 8;
  const PB = 24;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  if (hasBalance) {
    let points = sorted.filter((t) => t.balance != null) as ChartPoint[];
    const last = points[points.length - 1];
    if (currentBalance != null && last && Math.abs(currentBalance - last.balance) > 0.01) {
      points = [
        ...points,
        {
          id: '__now__',
          date: new Date().toISOString().split('T')[0],
          description: t('currentBalance'),
          amount: 0,
          type: 'credit' as const,
          balance: currentBalance,
        },
      ];
    }

    const minB = Math.min(...points.map((t) => t.balance));
    const maxB = Math.max(...points.map((t) => t.balance));
    const range = maxB - minB || 1;
    const px = (i: number) => PL + (i / Math.max(points.length - 1, 1)) * cW;
    const py = (b: number) => PT + cH - ((b - minB) / range) * cH;
    const linePath = points
      .map((t, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(t.balance).toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L ${px(points.length - 1).toFixed(1)} ${PT + cH} L ${PL} ${PT + cH} Z`;
    const hovPt = hovered != null ? points[hovered] : null;

    return (
      <div className="relative select-none">
        {hovPt && hovered != null && (
          <div
            className="absolute z-10 pointer-events-none bg-surface-2 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl text-xs whitespace-nowrap"
            style={{
              left: `${(px(hovered) / W) * 100}%`,
              top: '-8px',
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-fg-muted mb-0.5">
              {new Date(hovPt.date).toLocaleDateString(dateLocale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
            {hovPt.id !== '__now__' && (
              <>
                <p className="text-fg-secondary truncate max-w-40 mb-0.5">{hovPt.description}</p>
                <p
                  className={`font-mono font-semibold ${hovPt.type === 'credit' ? 'text-tertiary' : 'text-red-400'}`}
                >
                  {hovPt.type === 'credit' ? '+' : '−'}
                  {fmtA(hovPt.amount)}
                </p>
              </>
            )}
            <p className="text-white font-mono font-semibold mt-0.5">
              {t('balance', { value: fmtA(hovPt.balance) })}
            </p>
          </div>
        )}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((r) => {
            const gy = PT + cH - r * cH;
            return (
              <g key={r}>
                <line x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="#ffffff0d" strokeWidth="1" />
                <text x={PL - 5} y={gy + 4} textAnchor="end" fontSize="10" fill="#98a2b3">
                  {fmtA(minB + r * range)}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#cg)" />
          <path
            d={linePath}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {points.map((t, i) => (
            <g key={t.id}>
              <circle
                cx={px(i)}
                cy={py(t.balance)}
                r={hovered === i ? 4 : 2.5}
                fill={hovered === i ? '#fff' : '#2dd4bf'}
                stroke={hovered === i ? '#2dd4bf' : 'none'}
                strokeWidth="1.5"
              />
              <circle
                cx={px(i)}
                cy={py(t.balance)}
                r={14}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          ))}
          {[0, Math.floor(points.length / 2), points.length - 1]
            .filter((i, idx, arr) => arr.indexOf(i) === idx && points[i])
            .map((i) => (
              <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#98a2b3">
                {new Date(points[i].date).toLocaleDateString(dateLocale, {
                  day: '2-digit',
                  month: 'short',
                })}
              </text>
            ))}
        </svg>
      </div>
    );
  }

  const maxAmt = Math.max(...sorted.map((t) => t.amount), 1);
  const barW = Math.max(6, Math.floor(cW / sorted.length) - 3);
  const hovTx = hovered != null ? sorted[hovered] : null;

  return (
    <div className="relative select-none">
      {hovTx && hovered != null && (
        <div
          className="absolute z-10 pointer-events-none bg-surface-2 border border-white/10 rounded-lg px-2.5 py-1.5 shadow-xl text-xs whitespace-nowrap"
          style={{
            left: `${((PL + (hovered + 0.5) * (cW / sorted.length)) / W) * 100}%`,
            top: '-8px',
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-fg-muted mb-0.5">
            {new Date(hovTx.date).toLocaleDateString(dateLocale, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <p className="text-fg-secondary truncate max-w-40 mb-0.5">{hovTx.description}</p>
          <p
            className={`font-mono font-semibold ${hovTx.type === 'credit' ? 'text-tertiary' : 'text-red-400'}`}
          >
            {hovTx.type === 'credit' ? '+' : '−'}
            {fmtA(hovTx.amount)}
          </p>
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {[0.5, 1].map((r) => {
          const gy = PT + cH - r * cH;
          return (
            <line key={r} x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="#ffffff0d" strokeWidth="1" />
          );
        })}
        <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH} stroke="#ffffff15" strokeWidth="1" />
        {sorted.map((t, i) => {
          const bH = Math.max(2, (t.amount / maxAmt) * cH);
          const cx = PL + (i + 0.5) * (cW / sorted.length);
          return (
            <g key={t.id}>
              <rect
                x={cx - barW / 2}
                y={PT + cH - bH}
                width={barW}
                height={bH}
                fill={t.type === 'credit' ? '#2dd4bf' : '#f87171'}
                rx="2"
                opacity={hovered === i ? 1 : 0.65}
              />
              <rect
                x={cx - Math.max(barW, 18) / 2}
                y={PT}
                width={Math.max(barW, 18)}
                height={cH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}
        {[0, Math.floor(sorted.length / 2), sorted.length - 1]
          .filter((i, idx, arr) => arr.indexOf(i) === idx && sorted[i])
          .map((i) => (
            <text
              key={i}
              x={PL + (i + 0.5) * (cW / sorted.length)}
              y={H - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#98a2b3"
            >
              {new Date(sorted[i].date).toLocaleDateString(dateLocale, {
                day: '2-digit',
                month: 'short',
              })}
            </text>
          ))}
      </svg>
    </div>
  );
}
