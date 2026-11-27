import { useState } from 'react';
import {
  cygnusApi,
  isAgentHost,
  isPlatformConfigured,
  saveAdminSession,
  saveUserSession,
  type PersistedAdminSession,
  type PersistedUserSession,
} from '../services/cygnusApi';
import { InternalBackdrop } from './InternalBackdrop';
import { ModalPortal } from './ModalPortal';

export type AuthScreenView = 'login' | 'forgot-password' | 'set-password';

interface AuthCardProps {
  initialMode?: 'workspace' | 'admin';
  initialView?: AuthScreenView;
  inviteOrResetToken?: string;
  ssoError?: boolean;
  onClose?: () => void;
  onUserSignedIn: (session: PersistedUserSession) => void;
  onAdminSignedIn: (session: PersistedAdminSession) => void;
  onNavigateToApply?: () => void;
  onNavigateToTrack?: () => void;
  isStandalone?: boolean;
}

export function AuthCard({
  initialMode = 'workspace',
  initialView = 'login',
  inviteOrResetToken = '',
  ssoError = false,
  onClose,
  onUserSignedIn,
  onAdminSignedIn,
  onNavigateToApply,
  onNavigateToTrack,
  isStandalone = false,
}: AuthCardProps) {
  const [view, setView] = useState<AuthScreenView>(initialView);
  const [mode, setMode] = useState<'workspace' | 'admin' | 'invite'>(
    initialView === 'set-password' ? 'invite' : initialMode,
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteToken, setInviteToken] = useState(inviteOrResetToken);
  const [tokenExpired, setTokenExpired] = useState(
    initialView === 'set-password' && !inviteOrResetToken,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    ssoError ? 'Your sign-in link did not work. Please sign in again.' : '',
  );
  const [info, setInfo] = useState('');

  const backendReady = isPlatformConfigured();
  const agentOnlyHost = isAgentHost();

  const mapLoginError = (err: unknown): string => {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: number }).status)
        : 0;
    if (status === 401) return 'Invalid credentials.';
    if (status === 429) return 'Too many attempts. Wait a few minutes and try again.';
    if (status === 403) return 'This account is not active. Contact support.';
    if (status === 503) return 'Sign in is temporarily unavailable. Try again in a moment.';
    return err instanceof Error && err.message ? err.message : 'Sign-in failed. Check credentials.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (view === 'forgot-password') {
      if (!email.trim()) {
        setError('Enter your email address first to receive a password reset link.');
        return;
      }
      if (!backendReady) {
        setError('Configure VITE_PLATFORM_BASE in .env to send password reset requests.');
        return;
      }
      setBusy(true);
      try {
        await cygnusApi.forgotPassword(email.trim());
        setInfo('If an account exists for that email, we sent a password reset link.');
      } catch (err) {
        setError(mapLoginError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === 'invite' || view === 'set-password') {
      if (!inviteToken.trim() || password.length < 8) {
        setError('Enter your invite/reset token and a password (at least 8 characters).');
        return;
      }
      if (isStandalone && confirmPassword !== password) {
        setError('Passwords do not match.');
        return;
      }
      if (!backendReady) {
        setError('Configure VITE_PLATFORM_BASE in .env to accept invites.');
        return;
      }
      setBusy(true);
      try {
        await cygnusApi.acceptInviteSetPassword(inviteToken.trim(), password);
        setInfo('Your password is set. Sign in to continue.');
        setInviteToken('');
        setPassword('');
        setConfirmPassword('');
        setView('login');
        setMode(agentOnlyHost ? 'workspace' : 'admin');
      } catch (err) {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? Number((err as { status?: number }).status)
            : 0;
        if (status === 404 || status === 409) {
          setTokenExpired(true);
          setError('This link has expired or was already used. Request a new reset link below.');
        } else {
          setError(mapLoginError(err));
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }

    if (!backendReady) {
      setError('Configure VITE_PLATFORM_BASE in .env to authenticate against Cygnus Platform.');
      return;
    }

    setBusy(true);
    try {
      // Unified central sign-in on standalone /login routes both ADMN -> /admin and ORG -> tenant SSO redirectUrl.
      if (mode === 'admin' || isStandalone) {
        const res = await cygnusApi.loginUnified(email.trim(), password);
        if (res.kind === 'admin' && res.token && res.role === 'ADMN') {
          const adminSession: PersistedAdminSession = {
            token: res.token,
            expiresIn: res.expiresIn ?? 3600,
            issuedAt: Date.now(),
            role: 'ADMN',
            email: email.trim(),
          };
          saveAdminSession(adminSession);
          onAdminSignedIn(adminSession);
          onClose?.();
          return;
        }
        if (res.kind === 'org') {
          if (
            !res.noWorkspace &&
            typeof res.redirectUrl === 'string' &&
            (res.redirectUrl.startsWith('https://') || res.redirectUrl.startsWith('http://'))
          ) {
            window.location.assign(res.redirectUrl);
            return;
          }
          setError('Your workspace address is not set up yet. Contact support.');
          return;
        }
        setError('Account does not have Platform Admin access.');
        return;
      }

      // Workspace mode inside in-app modal:
      const res = await cygnusApi.loginUser(email.trim(), password);
      const session: PersistedUserSession = {
        ...res,
        expiresAt: Date.now() + res.expiresIn * 1000,
      };
      saveUserSession(session);
      onUserSignedIn(session);
      onClose?.();
    } catch (err) {
      setError(mapLoginError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (isStandalone) {
      setView('forgot-password');
      return;
    }
    if (!email.trim()) {
      setError('Enter your email address first to receive a password reset link.');
      return;
    }
    if (!backendReady) {
      setError('Configure VITE_PLATFORM_BASE in .env to send password reset requests.');
      return;
    }
    setBusy(true);
    try {
      await cygnusApi.forgotPassword(email.trim());
      setInfo('If the account exists, a reset link has been sent to your email.');
    } catch (err) {
      setError(mapLoginError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[440px] rounded-[14px] p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="imdx-kicker">IMDX / CYGNUS AUTHENTICATION</p>
          <h2 id="cygnus-auth-title" className="mt-0.5 text-[19px] font-bold text-[#102529]">
            {view === 'forgot-password'
              ? 'Forgot your password?'
              : mode === 'invite' || view === 'set-password'
                ? 'Set your password'
                : 'Sign in to Cygnus'}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#59666d]">
            {view === 'forgot-password'
              ? 'Enter your email and we will send a link to choose a new password.'
              : mode === 'invite' || view === 'set-password'
                ? 'Choose a password of at least 8 characters for your IMDX account.'
                : 'Authenticate with your IMDX Workspace or Governance Admin credentials.'}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1.5 cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>

      {view === 'login' && !isStandalone && (
        <div className="grid grid-cols-3 gap-1 rounded-[9px] border border-[#b4d7de] bg-white/75 p-1 text-[12px]">
          <button
            type="button"
            onClick={() => {
              setMode('workspace');
              setError('');
            }}
            className={`h-[32px] rounded-[7px] font-semibold cursor-pointer transition-all ${
              mode === 'workspace'
                ? 'bg-[#002456] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#102529]'
            }`}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError('');
            }}
            className={`h-[32px] rounded-[7px] font-semibold cursor-pointer transition-all ${
              mode === 'admin'
                ? 'bg-[#002456] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#102529]'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('invite');
              setError('');
            }}
            className={`h-[32px] rounded-[7px] font-semibold cursor-pointer transition-all ${
              mode === 'invite'
                ? 'bg-[#002456] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#102529]'
            }`}
          >
            Set Password
          </button>
        </div>
      )}

      {tokenExpired ? (
        <div className="space-y-3">
          <p className="rounded-[8px] border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-[12.5px] text-[#b91c1c]">
            This link has expired or was already used. Enter your email to request a new link.
          </p>
          <button
            type="button"
            onClick={() => {
              setTokenExpired(false);
              setView('forgot-password');
            }}
            className="w-full h-[38px] rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer"
          >
            Request New Link →
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {view !== 'forgot-password' && (mode === 'invite' || view === 'set-password') && !inviteOrResetToken && (
            <div>
              <label htmlFor="auth-invite-token" className="block text-[12.5px] font-semibold text-[#102529] mb-1">
                Invite / Reset Token
              </label>
              <input
                id="auth-invite-token"
                type="text"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Paste invite token from email"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white/95 px-3 text-[13.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
              />
            </div>
          )}

          {(view === 'forgot-password' || (mode !== 'invite' && view !== 'set-password')) && (
            <div>
              <label htmlFor="auth-email" className="block text-[12.5px] font-semibold text-[#102529] mb-1">
                Work Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.in"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white/95 px-3 text-[13.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
              />
            </div>
          )}

          {view !== 'forgot-password' && (
            <div>
              <label htmlFor="auth-password" className="block text-[12.5px] font-semibold text-[#102529] mb-1">
                {mode === 'invite' || view === 'set-password' ? 'New Password' : 'Password'}
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'invite' || view === 'set-password' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white/95 px-3 text-[13.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
              />
            </div>
          )}

          {isStandalone && (mode === 'invite' || view === 'set-password') && view !== 'forgot-password' && (
            <div>
              <label htmlFor="auth-confirm-password" className="block text-[12.5px] font-semibold text-[#102529] mb-1">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white/95 px-3 text-[13.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
              />
            </div>
          )}

          {error && (
            <p className="rounded-[8px] border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-[8px] border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2 text-[12px] text-[#065f46]">
              {info}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {view === 'forgot-password' ? (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                }}
                className="text-[12px] font-medium text-[#008fa7] hover:underline cursor-pointer"
              >
                ← Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={busy}
                className="text-[12px] font-medium text-[#008fa7] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-[38px] px-5 rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer disabled:opacity-60"
            >
              {busy
                ? 'Please wait…'
                : view === 'forgot-password'
                  ? 'Send Reset Link →'
                  : mode === 'invite' || view === 'set-password'
                    ? 'Set Password →'
                    : 'Sign In →'}
            </button>
          </div>
        </form>
      )}

      {(onNavigateToApply || onNavigateToTrack) && (
        <div className="border-t border-[#b4d7de]/45 pt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#59666d]">
          {onNavigateToApply && (
            <button
              type="button"
              onClick={onNavigateToApply}
              className="font-semibold text-[#002456] hover:text-[#008fa7] cursor-pointer"
            >
              New organization? Start application →
            </button>
          )}
          {onNavigateToTrack && (
            <button
              type="button"
              onClick={onNavigateToTrack}
              className="font-medium text-[#008fa7] hover:underline cursor-pointer"
            >
              Track application
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'workspace' | 'admin';
  onClose: () => void;
  onUserSignedIn: (session: PersistedUserSession) => void;
  onAdminSignedIn: (session: PersistedAdminSession) => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'workspace',
  onClose,
  onUserSignedIn,
  onAdminSignedIn,
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="imdx-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/55 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cygnus-auth-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <AuthCard
          initialMode={initialMode}
          onClose={onClose}
          onUserSignedIn={onUserSignedIn}
          onAdminSignedIn={onAdminSignedIn}
        />
      </div>
    </ModalPortal>
  );
}

interface AuthStandalonePageProps extends AuthCardProps {
  onGoHome?: () => void;
}

export function AuthStandalonePage({ onGoHome, ...cardProps }: AuthStandalonePageProps) {
  return (
    <div className="min-h-screen imdx-internal-canvas flex flex-col items-center justify-center px-4 py-8 relative">
      <InternalBackdrop />
      <div className="relative z-10 w-full max-w-[440px] space-y-3">
        <AuthCard {...cardProps} isStandalone />
        {onGoHome && (
          <div className="text-center">
            <button
              type="button"
              onClick={onGoHome}
              className="text-[12.5px] font-medium text-[#59666d] hover:text-[#102529] cursor-pointer"
            >
              ← Back to IMDX Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

