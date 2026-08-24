import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '794743160263-c3g975skqtjmj1jmppng3eca1o5vngqi.apps.googleusercontent.com';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        ux_mode: string;
        callback: (r: { credential?: string }) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

const gsi = (): GoogleIdApi | undefined => (window as unknown as { google?: GoogleIdApi }).google;

/** Nạp script GIS đúng một lần cho cả app. */
let gsiPromise: Promise<void> | null = null;
const loadGsi = (): Promise<void> => {
  if (gsi()?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('GSI load failed')));
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return gsiPromise;
};

interface Props {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

/** GIS tự render nút — điều khoản Google không cho vẽ lại. */
export const GoogleSignInButton = ({ onCredential, disabled }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    loadGsi()
      .then(() => {
        const api = gsi();
        if (cancelled || !containerRef.current || !api) return;

        api.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          callback: (resp) => {
            if (resp?.credential) onCredentialRef.current(resp.credential);
          },
        });

        const width = Math.round(containerRef.current.getBoundingClientRect().width || 320);
        api.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'vi',
          width: Math.min(Math.max(width, 200), 400),
        });
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'error') {
    return (
      <p className="rounded-xl border border-navy/10 bg-cream-light px-3 py-2.5 text-center text-sm text-navy/50">
        Không tải được đăng nhập Google
      </p>
    );
  }

  return (
    <div className="relative">
      {state === 'loading' && <div className="h-10 w-full animate-pulse rounded-xl bg-navy/10" />}
      {/* Không display:none — GIS cần chiều rộng thật. */}
      <div
        ref={containerRef}
        className={`flex justify-center ${state === 'ready' ? '' : 'pointer-events-none absolute inset-0 opacity-0'} ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
      />
    </div>
  );
};
