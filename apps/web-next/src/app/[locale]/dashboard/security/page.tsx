'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type SetupResponse = { secret: string; qrCodeDataUrl: string; otpauthUrl: string };

export default function SecurityPage() {
  const locale = ((useParams()?.locale as string) || 'en').toLowerCase();
  const fr = locale === 'fr';
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/2fa/status', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setEnabled(Boolean(data.enabled)))
      .catch(() =>
        setError(fr ? 'Impossible de charger le statut du 2FA.' : 'Unable to load 2FA status.'),
      );
  }, [fr]);

  const request = async (path: string, body?: object) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/auth/2fa/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setSetup(await request('setup'));
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const confirmSetup = async () => {
    try {
      await request('enable', { code });
      setEnabled(true);
      setSetup(null);
      setCode('');
      setMessage(
        fr
          ? 'Le double facteur est maintenant activé.'
          : 'Two-factor authentication is now enabled.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const disable = async () => {
    try {
      await request('disable', { code });
      setEnabled(false);
      setCode('');
      setMessage(
        fr ? 'Le double facteur a été désactivé.' : 'Two-factor authentication was disabled.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{fr ? 'Sécurité du compte' : 'Account security'}</h1>
        <p className="text-fg-muted text-sm mt-1">
          {fr
            ? 'Protégez votre compte avec un code temporaire généré sur votre téléphone.'
            : 'Protect your account with a temporary code generated on your phone.'}
        </p>
      </div>

      <div className="bg-surface-1 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">
              {fr ? 'Double authentification (2FA)' : 'Two-factor authentication (2FA)'}
            </h2>
            <p className="text-sm text-fg-muted mt-1">
              {enabled === null
                ? fr
                  ? 'Chargement…'
                  : 'Loading…'
                : enabled
                  ? fr
                    ? 'Activée'
                    : 'Enabled'
                  : fr
                    ? 'Désactivée'
                    : 'Disabled'}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${enabled ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-fg-muted'}`}
          >
            {enabled ? '2FA ON' : '2FA OFF'}
          </span>
        </div>

        {message && (
          <p className="rounded-lg bg-green-500/15 border border-green-500/30 p-3 text-sm text-green-200">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {!enabled && !setup && (
          <button
            disabled={loading || enabled === null}
            onClick={startSetup}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 font-medium"
          >
            {fr ? 'Configurer le 2FA' : 'Set up 2FA'}
          </button>
        )}

        {setup && (
          <div className="space-y-4 border-t border-white/10 pt-5">
            <ol className="list-decimal pl-5 text-sm text-fg-secondary space-y-2">
              <li>
                {fr
                  ? "Scannez ce QR code avec votre application d'authentification."
                  : 'Scan this QR code with your authenticator app.'}
              </li>
              <li>
                {fr
                  ? 'Saisissez le code à 6 chiffres pour confirmer.'
                  : 'Enter the 6-digit code to confirm.'}
              </li>
            </ol>
            {/* A data URL keeps the TOTP provisioning URI away from third-party QR services. */}
            <Image
              src={setup.qrCodeDataUrl}
              alt="2FA QR code"
              width={240}
              height={240}
              unoptimized
              className="rounded-xl bg-white p-2"
            />
            <details className="text-sm text-fg-muted">
              <summary className="cursor-pointer">
                {fr ? 'Saisie manuelle' : 'Manual entry'}
              </summary>
              <code className="block mt-2 break-all select-all text-fg-secondary">
                {setup.secret}
              </code>
            </details>
            <CodeInput code={code} setCode={setCode} fr={fr} />
            <button
              disabled={loading || code.length !== 6}
              onClick={confirmSetup}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 font-medium"
            >
              {fr ? 'Activer' : 'Enable'}
            </button>
          </div>
        )}

        {enabled && (
          <div className="space-y-3 border-t border-white/10 pt-5">
            <p className="text-sm text-fg-muted">
              {fr
                ? 'Pour désactiver le 2FA, confirmez avec un code actuel.'
                : 'To disable 2FA, confirm with a current code.'}
            </p>
            <CodeInput code={code} setCode={setCode} fr={fr} />
            <button
              disabled={loading || code.length !== 6}
              onClick={disable}
              className="px-4 py-2 rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50 font-medium"
            >
              {fr ? 'Désactiver le 2FA' : 'Disable 2FA'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CodeInput({
  code,
  setCode,
  fr,
}: {
  code: string;
  setCode: (value: string) => void;
  fr: boolean;
}) {
  return (
    <input
      aria-label={fr ? 'Code de sécurité' : 'Security code'}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      placeholder="123456"
      value={code}
      onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
      className="w-full max-w-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10 tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}
