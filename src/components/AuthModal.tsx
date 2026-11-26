import { useState } from 'react';
import {
  cygnusApi,
  isPlatformConfigured,
  saveAdminSession,
  saveUserSession,
  type PersistedAdminSession,
  type PersistedUserSession,
} from '../services/cygnusApi';
import { ModalPortal } from './ModalPortal';

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
  const [mode, setMode] = useState<'workspace' | 'admin' | 'invite'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!isOpen) return null;

  const backendReady = isPlatformConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'invite') {
      if (!inviteToken.trim() || password.length < 8) {
        setError('Enter your invite/reset token and a password (at least 8 characters).');
        return;
      }
      if (!backendReady) {
        setError('Configure VITE_PLATFORM_BASE in .env to accept invites.');
        return;
      }
      setBusy(true);
      try {
        await cygnusApi.acceptInviteSetPassword(inviteToken.trim(), password);
        setInfo('Password set cleanly. Switch to Member Workspace or Platform Admin to sign in.');
        setInviteToken('');
        setPassword('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to set password.');
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
      if (mode === 'workspace') {
        const res = await cygnusApi.loginUser(email.trim(), password);
        const session: PersistedUserSession = {
          ...res,
          expiresAt: Date.now() + res.expiresIn * 1000,
        };
        saveUserSession(session);
        onUserSignedIn(session);
        onClose();
      } else {
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
          onClose();
        } else if (res.kind === 'org' && res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          setError('Account does not have Platform Admin access.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Check credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
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
      setError(err instanceof Error ? err.message : 'Unable to request password reset.');
    } finally {
      setBusy(false);
    }
  };

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
        <div className="imdx-modal-panel imdx-modal-surface w-full max-w-[430px] rounded-[14px] p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="imdx-kicker">IMDX / CYGNUS AUTHENTICATION</p>
              <h2 id="cygnus-auth-title" className="mt-0.5 text-[19px] font-bold text-[#102529]">
                Sign in to Cygnus
              </h2>
              <p className="mt-0.5 text-[12.5px] text-[#59666d]">
                Authenticate with your IMDX Workspace or Governance Admin credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#64748b] hover:text-[#102529] text-[20px] leading-none px-1.5 cursor-pointer"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'invite' ? (
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
            ) : (
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

            <div>
              <label htmlFor="auth-password" className="block text-[12.5px] font-semibold text-[#102529] mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-[38px] rounded-[9px] border border-[#b4d7de] bg-white/95 px-3 text-[13.5px] text-[#102529] focus:outline-none focus:border-[#008fa7]"
              />
            </div>

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
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={busy}
                className="text-[12px] font-medium text-[#008fa7] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-[38px] px-5 rounded-full imdx-btn-primary text-[13px] font-semibold cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Sign In →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
