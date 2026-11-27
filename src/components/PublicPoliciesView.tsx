import { useEffect, useState } from 'react';
import { cygnusApi, type CygnusPolicyDoc } from '../services/cygnusApi';

interface PublicPoliciesViewProps {
  slug?: string;
  onSelectSlug: (slug?: string) => void;
  onStartOnboarding: () => void;
}

export function PublicPoliciesView({
  slug,
  onSelectSlug,
  onStartOnboarding,
}: PublicPoliciesViewProps) {
  const requestKey = slug ?? '__all__';
  const [policies, setPolicies] = useState<CygnusPolicyDoc[]>([]);
  const [detail, setDetail] = useState<CygnusPolicyDoc | null>(null);
  const [completedKey, setCompletedKey] = useState('');
  const [error, setError] = useState('');
  const loading = completedKey !== requestKey;

  useEffect(() => {
    let active = true;
    const finish = (errMsg = '') => {
      if (!active) return;
      setError(errMsg);
      setCompletedKey(requestKey);
    };
    if (slug) {
      cygnusApi
        .getPublicPolicy(slug)
        .then((doc) => {
          if (active) setDetail(doc);
          finish('');
        })
        .catch(() => finish('Policy not found.'));
    } else {
      cygnusApi
        .listPublicPolicies()
        .then((list) => {
          if (active) setPolicies(list);
          finish('');
        })
        .catch(() => finish('Could not load published policies.'));
    }
    return () => {
      active = false;
    };
  }, [slug, requestKey]);

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8">
      <div className="imdx-card rounded-[14px] overflow-hidden">
        <div className="imdx-rule-animate h-[3px] w-full bg-gradient-to-r from-[#45c0b2] via-[#00a5c3] to-[#3987cf]" />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="imdx-kicker">IMDX / GOVERNANCE POLICIES</p>
              <h1 className="mt-1 text-[22px] text-[#102529]">
                {slug && detail ? detail.title : 'Published Network Policies'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {slug && (
                <button
                  type="button"
                  onClick={() => onSelectSlug(undefined)}
                  className="h-[34px] px-3.5 rounded-full border border-[#c1c1c1] bg-white text-[12.5px] font-semibold text-[#102529] cursor-pointer"
                >
                  All Policies
                </button>
              )}
              <button
                type="button"
                onClick={onStartOnboarding}
                className="h-[34px] px-4 rounded-full imdx-btn-primary text-[12.5px] font-semibold cursor-pointer"
              >
                Start Application →
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-[13.5px] text-[#59666d] py-6">Loading policies…</p>
          ) : error ? (
            <p className="text-[13.5px] text-[#dc2626] py-4">{error}</p>
          ) : slug && detail ? (
            <div className="space-y-3 text-[13.5px] text-[#334155] leading-relaxed">
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#64748b] font-mono">
                <span>Version {detail.version}</span>
                <span>•</span>
                <span>Hash {detail.sha256.slice(0, 12)}</span>
                {detail.status === 'DRAFT' && (
                  <span className="rounded-full bg-[#fef3c7] text-[#b45309] px-2.5 py-0.5 font-sans font-semibold">
                    DRAFT
                  </span>
                )}
              </div>
              {(detail.body ?? '').split(/\n{2,}/).map((para, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <p className="text-[13.5px] text-[#59666d]">No policies published yet.</p>
          ) : (
            <ul className="divide-y divide-[#e2e8f0]">
              {policies.map((pol) => (
                <li key={pol.slug} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectSlug(pol.slug)}
                    className="text-[14.5px] font-semibold text-[#002456] hover:underline cursor-pointer"
                  >
                    {pol.title}
                  </button>
                  <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                    <span>v{pol.version}</span>
                    {pol.status === 'DRAFT' && (
                      <span className="rounded-full bg-[#fef3c7] text-[#b45309] px-2 py-0.5 font-semibold">
                        DRAFT
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
