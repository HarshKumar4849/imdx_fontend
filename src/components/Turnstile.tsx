import { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '../services/cygnusApi';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ) => string;
  remove: (id: string) => void;
}

const getTurnstileApi = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

let loadingPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (getTurnstileApi()) return Promise.resolve();
  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loadingPromise = null;
        reject(new Error('Captcha script failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return loadingPromise;
}

/**
 * Cloudflare Turnstile widget matching Cygnus backend verification:
 * - In DEV/test without a site key, passes `'dev'` cleanly.
 * - In production without a configured site key, fails closed.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = TURNSTILE_SITE_KEY;
  const allowDevBypass = import.meta.env.DEV || import.meta.env.MODE === 'test';
  const hostRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onToken);

  useEffect(() => {
    cbRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (siteKey) return;
    if (allowDevBypass) {
      cbRef.current('dev');
    } else {
      cbRef.current(null);
    }
  }, [siteKey, allowDevBypass]);

  useEffect(() => {
    if (!siteKey) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        const api = getTurnstileApi();
        if (!api) return;
        widgetId = api.render(hostRef.current, {
          sitekey: siteKey,
          callback: (token) => cbRef.current(token),
          'expired-callback': () => cbRef.current(null),
          'error-callback': () => cbRef.current(null),
        });
      })
      .catch(() => cbRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId) getTurnstileApi()?.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) {
    if (allowDevBypass) return null;
    return (
      <p role="alert" className="text-[12px] text-[#dc2626] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] px-3 py-2">
        Captcha is not configured for this build.
      </p>
    );
  }

  return <div ref={hostRef} className="pt-1" />;
}
